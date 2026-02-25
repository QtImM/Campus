import { WebView } from 'react-native-webview';
import { saveWebViewCookies } from './session';

/**
 * WebViewBridge manages the communication between the Native Agent and the WebView.
 */
export class WebViewBridge {
    private webViewRef: React.RefObject<WebView> | null = null;
    private messageListeners: ((type: string, payload: any) => void)[] = [];

    setWebView(ref: React.RefObject<WebView> | null) {
        this.webViewRef = ref;
    }

    /**
     * Inject a script and wait for a specific response type (Observation)
     * Now supports optional initial delay to handle partial page transitions.
     */
    async injectAndObserve(script: string, expectedResponseType: string, timeout = 10000): Promise<any> {
        if (!this.webViewRef?.current) {
            throw new Error('WebView not initialized');
        }

        console.log(`[WebViewBridge] Injecting script and waiting for ${expectedResponseType}...`);

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.removeListener(listener);
                reject(new Error(`Timeout: No ${expectedResponseType} received within ${timeout}ms`));
            }, timeout);

            const listener = (type: string, payload: any) => {
                if (type === expectedResponseType) {
                    clearTimeout(timer);
                    this.removeListener(listener);
                    resolve(payload);
                }
            };

            this.addListener(listener);

            // Allow some breadcrumbs/logging for the user during long waits
            this.webViewRef?.current?.injectJavaScript(script);
        });
    }

    /**
     * Utility to wait for the WebView to reach a stable state before scanning
     */
    async waitForStabilization(ms = 1000) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    addListener(callback: (type: string, payload: any) => void) {
        this.messageListeners.push(callback);
    }

    removeListener(callback: (type: string, payload: any) => void) {
        this.messageListeners = this.messageListeners.filter(l => l !== callback);
    }

    handleMessage(event: any) {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('[WebViewBridge] Received:', data.type, data.payload);

            if (data.type === 'SYNC_COOKIES') {
                saveWebViewCookies(data.payload.cookies);
                return;
            }

            this.messageListeners.forEach(l => l(data.type, data.payload));
        } catch (e) {
            console.error('[WebViewBridge] Failed to parse message:', event.nativeEvent.data);
        }
    }
}

// Singleton instance for the agent session
export const agentBridge = new WebViewBridge();
