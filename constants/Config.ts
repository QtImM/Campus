/**
 * Global App Configuration
 * This file manages the environment-specific behaviors.
 */

// Expo detects __DEV__ automatically when running via 'npx expo start'
const IS_DEV_ENV = __DEV__;

export const APP_CONFIG = {
    /**
     * Set this to 'prod' to simulate the production experience for students.
     * Set this to 'dev' for interviews, debugging, and iterative development.
     * Use 'auto' to switch based on if the current user is the Demo account.
     */
    mode: 'auto' as 'dev' | 'prod' | 'auto',

    /**
     * Hardcoded Demo Credentials for your interview.
     */
    demoCredentials: {
        email: 'demo@life.hkbu.edu.hk',
        password: 'demodemo',
        uid: '3b3acb79-5086-47c2-a16d-9e4943c65a89',
    },

    // --- Feature Toggles ---

    /**
     * Dynamically determines if we should show debug UI.
     * @param currentUid The UID of the logged-in user.
     */
    shouldShowDebug(currentUid?: string) {
        if (this.mode === 'dev') return true;
        if (this.mode === 'prod') return false;
        // In 'auto' mode, only show for the special demo UID
        return currentUid === this.demoCredentials.uid;
    },

    /**
     * Whether to allow hardcoded 'Demo User' login without real Supabase Auth.
     */
    get useDemoAuth() {
        return this.mode !== 'prod';
    },

    /**
     * Whether to show LLM internal thoughts, Pilot buttons, and debug WebView controls.
     * This getter is now just a shortcut for the 'auto' logic.
     */
    get showAgentDebug() {
        // We'll mostly use shouldShowDebug(uid) in components, 
        // but this stays for backward compatibility.
        return this.mode === 'dev';
    },

    /**
     * Whether to show technical performance metrics (Latency, Token count).
     */
    get showPerformanceMetrics() {
        return this.mode === 'dev';
    },

    // --- Visual Branding ---
    appName: 'CampusCopy',
    version: '1.2.0-beta',
};

/**
 * Helper to check if we should show debug elements
 */
export const isDebugMode = () => APP_CONFIG.showAgentDebug;
