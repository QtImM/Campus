import { AgentExecutor } from '../../../services/agent/executor';
import { callDeepSeek } from '../../../services/agent/llm';

// Mock the LLM call directly since we want to test Executor routing without actual cost
jest.mock('../../../services/agent/llm', () => ({
    callDeepSeek: jest.fn()
}));

// Partially mock executor's inner environment calls to avoid DB/DOM execution
jest.mock('../../../services/agent/memory', () => ({
    getAllUserFacts: jest.fn().mockResolvedValue({}),
    saveMemoryFact: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../../services/agent/bridge', () => ({
    agentBridge: {
        injectAndObserve: jest.fn().mockResolvedValue({ slots: [{ status: 'available' }] })
    }
}));

describe('AgentExecutor Routing', () => {
    let executor: AgentExecutor;

    beforeEach(() => {
        jest.clearAllMocks();
        executor = new AgentExecutor('test-user-id');
    });

    it('should correctly execute a tool based on LLM decision, then finish', async () => {
        // First LLM call returns a tool action
        (callDeepSeek as jest.Mock).mockResolvedValueOnce(JSON.stringify({
            thought: "I need to check the library slots for the user.",
            action: { tool: "check_library_availability", input: {} }
        }));

        // Second LLM call returns final answer (no action)
        (callDeepSeek as jest.Mock).mockResolvedValueOnce(JSON.stringify({
            thought: "The library has 1 available slot based on the tool result."
        }));

        const response = await executor.process("Are there any seats in the library?");

        expect(callDeepSeek).toHaveBeenCalledTimes(2);
        expect(response.steps.length).toBe(2);

        // Assert the mock tool returned expected observation string
        expect(response.steps[0].observation).toContain('1 available slots');
        // Assert the final answer
        expect(response.finalAnswer).toBe('The library has 1 available slot based on the tool result.');
    });

    it('should handle LLM API failures gracefully', async () => {
        (callDeepSeek as jest.Mock).mockRejectedValue(new Error('API Timeout'));

        const response = await executor.process("Hi");

        expect(response.steps.length).toBe(1);
        expect(response.finalAnswer).toContain('无法进行深度推理');
    });

    it('should fall back to safe error for unknown tools', async () => {
        // LLM invents a non-existent tool
        (callDeepSeek as jest.Mock).mockResolvedValueOnce(JSON.stringify({
            thought: "I will use magic to find this.",
            action: { tool: "magic_tool", input: {} }
        }));
        (callDeepSeek as jest.Mock).mockResolvedValueOnce(JSON.stringify({
            thought: "The magic tool failed."
        }));

        const response = await executor.process("Find it using magic");

        expect(response.steps[0].observation).toBe('Error: Tool magic_tool not found.');
        expect(response.finalAnswer).toBe('The magic tool failed.');
    });
});
