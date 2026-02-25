import { AGENT_CONFIG } from './config';

const DEEPSEEK_API_KEY = AGENT_CONFIG.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = AGENT_CONFIG.DEEPSEEK_BASE_URL;

export type LLMResponse = {
    content: string;
    stop_reason: string;
};

/**
 * DeepSeek LLM Service
 */
export async function callDeepSeek(messages: { role: string, content: string }[]): Promise<string> {
    try {
        const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`DeepSeek API error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) {
        console.error('[LLM] DeepSeek call failed:', e);
        throw e;
    }
}
