import { LIBRARY_SCRIPTS } from './automation/library';
import { agentBridge } from './bridge';
import { callDeepSeek } from './llm';
import { getAllUserFacts, saveMemoryFact } from './memory';
import { TOOLS } from './tools';
import { AgentContext, AgentResponse, AgentStep } from './types';

/**
 * The AgentExecutor handles the ReAct (Reasoning + Acting) loop.
 * It coordinates between the LLM and the local Tools.
 */
export class AgentExecutor {
    private context: AgentContext;

    constructor(userId: string) {
        this.context = {
            userId,
            sessionId: `session_${Date.now()}`,
            history: []
        };
    }

    /**
     * Main entry point for user prompts
     */
    async process(prompt: string): Promise<AgentResponse> {
        this.context.history.push({ role: 'user', content: prompt });

        let currentStep = 0;
        const maxSteps = 5;
        const steps: AgentStep[] = [];

        while (currentStep < maxSteps) {
            // 1. Ask real LLM for next step
            const decision = await this.realDeepSeekCall(prompt, steps);
            steps.push(decision);

            if (!decision.action) {
                // No more actions, the LLM has provided the final answer
                break;
            }

            // 2. Execute the Tool
            const observation = await this.executeTool(decision.action.tool, decision.action.input);
            decision.observation = observation;

            currentStep++;
        }

        return {
            steps,
            finalAnswer: steps[steps.length - 1].thought
        };
    }

    private async executeTool(toolName: string, input: any): Promise<string> {
        console.log(`[Agent] Executing tool: ${toolName}`, input);

        // Real and Mock tool implementations
        switch (toolName) {
            case 'get_user_profile':
                const facts = await getAllUserFacts(this.context.userId);
                if (Object.keys(facts).length === 0) {
                    return JSON.stringify({ major: 'Computer Science', hall: 'Hall 1', status: 'First Time User' });
                }
                return JSON.stringify(facts);
            case 'save_user_preference':
                await saveMemoryFact(this.context.userId, input.key, input.value);
                return `Successfully remembered that your ${input.key} is ${input.value}.`;
            case 'search_canteen_menu':
                return "Nearby Harmony Cafeteria has 'Spicy Chicken' on special today. It's only 5 mins from Hall 1.";
            case 'check_library_availability':
                try {
                    const result = await agentBridge.injectAndObserve(LIBRARY_SCRIPTS.SCAN_SLOTS, 'LIBRARY_SCAN_RESULT');
                    const availCount = (result.slots as any[]).filter(s => s.status === 'available').length;
                    return `I scanned the library page and found ${availCount} available slots.`;
                } catch (e) {
                    console.warn('[Agent] Real-time scan failed, using mock data.', e);
                    return "Floor 3 has 15 individual carrels available at the moment.";
                }
            case 'book_library_seat':
                return "Seat reservation initiated. Please confirm the time on the screen.";
            default:
                return `Error: Tool ${toolName} not found.`;
        }
    }

    private async realDeepSeekCall(prompt: string, previousSteps: AgentStep[]): Promise<AgentStep> {
        const systemPrompt = `You are the HKBU Campus Life Agent. Help students with tasks like canteen recommendations and library bookings.
Available Tools:
${JSON.stringify(TOOLS, null, 2)}

ReAct Protocol:
Translate user intent into a Thought and an Action.
If you have enough information, provide a Final Thought with no Action.
If you need more info (like user preferences or real-time data), use a tool.

Response Format (JSON only):
{
  "thought": "your reasoning here",
  "action": { "tool": "tool_name", "input": { "param": "value" } } // optional
}

Current context:
- User Prompt: ${prompt}
- Progress so far: ${JSON.stringify(previousSteps)}`;

        try {
            const llmOutput = await callDeepSeek([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ]);

            // Clean up potentially backticked JSON
            const jsonStr = llmOutput.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(jsonStr);

            return {
                thought: result.thought,
                action: result.action
            };
        } catch (e) {
            console.error('[Agent] Real LLM call failed, falling back to basic mock.', e);
            return { thought: "抱歉，由于网络或 API 问题，我暂时无法进行深度推理。请稍后再试。" };
        }
    }
}
