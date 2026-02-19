export type ToolParameter = {
    type: 'string' | 'number' | 'boolean' | 'object';
    description: string;
    required?: boolean;
};

export type ToolDefinition = {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, ToolParameter>;
        required: string[];
    };
};

export type AgentStep = {
    thought?: string;
    reply?: string;
    action?: {
        tool: string;
        input: any;
    };
    observation?: string;
    quickReplies?: string[];
};

export type AgentResponse = {
    steps: AgentStep[];
    finalAnswer?: string;
    quickReplies?: string[];
};

export interface AgentContext {
    userId: string;
    sessionId: string;
    history: { role: 'user' | 'assistant' | 'tool'; content: string }[];
}
