/**
 * Agent Configuration
 * For production, these should be moved to .env (EXPO_PUBLIC_*)
 */
export const AGENT_CONFIG = {
    DEEPSEEK_API_KEY: process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || '',
    DEEPSEEK_BASE_URL: process.env.EXPO_PUBLIC_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    IS_PROD: false, // Set to true to use real backend proxy in future
};
