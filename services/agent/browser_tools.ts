/**
 * Browser Tools — Generic browser actions via WebView JS injection.
 *
 * These are the "hands" of the agent. The LLM decides WHICH action to take;
 * these functions just execute it via the WebView bridge.
 */

import { agentBridge } from './bridge';

/** Callbacks injected from the UI layer */
export interface BrowserCallbacks {
    onNavigate: (url: string) => void;
    onShowWebView: () => void;
    onHideWebView: () => void;
}

let _callbacks: BrowserCallbacks | null = null;

export function setBrowserCallbacks(cb: BrowserCallbacks) {
    _callbacks = cb;
}

/* ─────────────────────── navigate ─────────────────────── */

/**
 * Navigate the WebView to a URL.
 * Returns after a delay to let the page load.
 */
export async function navigate(url: string): Promise<string> {
    if (!_callbacks) return "Error: Browser not connected.";
    _callbacks.onNavigate(url);
    await delay(3000); // Give page time to load
    return `Navigated to ${url}. Page is loading.`;
}

/* ─────────────────────── read_page ────────────────────── */

/**
 * Read the visible text content of the current page.
 * Returns a truncated version (first 3000 chars) to fit LLM context.
 */
export async function readPage(): Promise<string> {
    const script = `
        (function() {
            // Get visible text, skip hidden elements
            var text = document.body.innerText || document.body.textContent || '';
            // Also capture the page title and URL for context
            var info = 'Page Title: ' + document.title + '\\n';
            info += 'Page URL: ' + window.location.href + '\\n';
            info += '---\\n';
            info += text.substring(0, 3000);
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAGE_TEXT',
                payload: { text: info }
            }));
        })();
    `;
    try {
        const result = await agentBridge.injectAndObserve(script, 'PAGE_TEXT', 8000);
        return result.text || "(empty page)";
    } catch (e) {
        return "Error reading page: " + (e as any).message;
    }
}

/* ─────────────────── get_elements ─────────────────────── */

/**
 * Get all interactive elements (links, buttons, inputs) on the current page.
 * Returns a structured summary for the LLM to reason about.
 */
export async function getInteractiveElements(): Promise<string> {
    const script = `
        (function() {
            var results = [];
            
            // Buttons
            document.querySelectorAll('button, input[type="submit"], input[type="button"], [role="button"]').forEach(function(el, i) {
                if (el.offsetParent !== null) { // visible only
                    results.push({
                        type: 'button',
                        text: (el.innerText || el.value || '').trim().substring(0, 80),
                        id: el.id || '',
                        index: i
                    });
                }
            });
            
            // Links
            document.querySelectorAll('a[href]').forEach(function(el, i) {
                if (el.offsetParent !== null && el.innerText.trim()) {
                    results.push({
                        type: 'link',
                        text: el.innerText.trim().substring(0, 80),
                        href: el.href || '',
                        id: el.id || '',
                        index: i
                    });
                }
            });
            
            // Input fields
            document.querySelectorAll('input, select, textarea').forEach(function(el, i) {
                if (el.offsetParent !== null) {
                    var label = '';
                    if (el.id) {
                        var labelEl = document.querySelector('label[for="' + el.id + '"]');
                        if (labelEl) label = labelEl.innerText.trim();
                    }
                    results.push({
                        type: el.tagName.toLowerCase() === 'select' ? 'dropdown' : 'input',
                        label: label || el.placeholder || el.name || '',
                        inputType: el.type || '',
                        id: el.id || '',
                        name: el.name || '',
                        value: el.value || '',
                        index: i
                    });
                }
            });
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAGE_ELEMENTS',
                payload: { elements: results.slice(0, 50) }
            }));
        })();
    `;
    try {
        const result = await agentBridge.injectAndObserve(script, 'PAGE_ELEMENTS', 8000);
        const elements = result.elements || [];
        if (elements.length === 0) return "No interactive elements found on this page.";

        // Format for LLM readability
        return elements.map((el: any) => {
            if (el.type === 'button') return `[BUTTON] "${el.text}" (id: ${el.id || 'none'})`;
            if (el.type === 'link') return `[LINK] "${el.text}" → ${el.href} (id: ${el.id || 'none'})`;
            if (el.type === 'dropdown') return `[DROPDOWN] label="${el.label}" name="${el.name}" current="${el.value}" (id: ${el.id || 'none'})`;
            return `[INPUT] label="${el.label}" type="${el.inputType}" name="${el.name}" value="${el.value}" (id: ${el.id || 'none'})`;
        }).join('\n');
    } catch (e) {
        return "Error getting elements: " + (e as any).message;
    }
}

/* ─────────────────── click ────────────────────────────── */

/**
 * Click an element on the page by its visible text content or ID.
 */
export async function clickElement(target: string): Promise<string> {
    const escapedTarget = target.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const script = `
        (function() {
            var target = "${escapedTarget}";
            var clicked = false;
            var msg = '';
            
            // Strategy 1: Try by ID
            var el = document.getElementById(target);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.click();
                clicked = true;
                msg = 'Clicked element with id="' + target + '"';
            }
            
            // Strategy 2: Try by visible text (buttons, links)
            if (!clicked) {
                var all = Array.from(document.querySelectorAll('a, button, input[type="submit"], [role="button"], td, span, div'));
                var found = all.find(function(e) {
                    return e.offsetParent !== null && (e.innerText || e.value || '').trim().includes(target);
                });
                if (found) {
                    found.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    found.click();
                    clicked = true;
                    msg = 'Clicked element containing text "' + target + '"';
                }
            }
            
            // Strategy 3: Try querySelector directly
            if (!clicked) {
                try {
                    el = document.querySelector(target);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.click();
                        clicked = true;
                        msg = 'Clicked element matching selector "' + target + '"';
                    }
                } catch(e) {}
            }
            
            if (!clicked) msg = 'Could not find element: "' + target + '"';
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'CLICK_RESULT',
                payload: { success: clicked, message: msg }
            }));
        })();
    `;
    try {
        const result = await agentBridge.injectAndObserve(script, 'CLICK_RESULT', 8000);
        await delay(1500); // Wait for page response after click
        return result.message || (result.success ? "Clicked successfully." : "Click failed.");
    } catch (e) {
        return "Error clicking: " + (e as any).message;
    }
}

/* ─────────────────── type ─────────────────────────────── */

/**
 * Type text into an input field, found by label, placeholder, name, or ID.
 */
export async function typeIntoField(fieldIdentifier: string, value: string): Promise<string> {
    const escapedField = fieldIdentifier.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const escapedValue = value.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const script = `
        (function() {
            var field = "${escapedField}";
            var value = "${escapedValue}";
            var typed = false;
            var msg = '';
            var el = null;
            
            // Try by ID
            el = document.getElementById(field);
            
            // Try by name
            if (!el) el = document.querySelector('input[name="' + field + '"], textarea[name="' + field + '"]');
            
            // Try by placeholder
            if (!el) el = document.querySelector('input[placeholder*="' + field + '"], textarea[placeholder*="' + field + '"]');
            
            // Try by label text
            if (!el) {
                var labels = Array.from(document.querySelectorAll('label'));
                var label = labels.find(function(l) { return l.innerText.includes(field); });
                if (label && label.htmlFor) el = document.getElementById(label.htmlFor);
            }
            
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.focus();
                el.value = value;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                typed = true;
                msg = 'Typed "' + value + '" into field "' + field + '"';
            } else {
                msg = 'Could not find field: "' + field + '"';
            }
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'TYPE_RESULT',
                payload: { success: typed, message: msg }
            }));
        })();
    `;
    try {
        const result = await agentBridge.injectAndObserve(script, 'TYPE_RESULT', 8000);
        return result.message || (result.success ? "Typed successfully." : "Type failed.");
    } catch (e) {
        return "Error typing: " + (e as any).message;
    }
}

/* ─────────────────── select_option ────────────────────── */

/**
 * Select an option from a dropdown/select element.
 */
export async function selectOption(fieldIdentifier: string, optionText: string): Promise<string> {
    const escapedField = fieldIdentifier.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const escapedOption = optionText.replace(/'/g, "\\'").replace(/"/g, '\\"');
    const script = `
        (function() {
            var field = "${escapedField}";
            var optionText = "${escapedOption}";
            var selected = false;
            var msg = '';
            
            var el = document.getElementById(field) ||
                     document.querySelector('select[name="' + field + '"]');
            
            if (!el) {
                // Try finding by label
                var labels = Array.from(document.querySelectorAll('label'));
                var label = labels.find(function(l) { return l.innerText.includes(field); });
                if (label && label.htmlFor) el = document.getElementById(label.htmlFor);
            }
            
            if (el && el.tagName === 'SELECT') {
                var options = Array.from(el.options);
                var match = options.find(function(o) {
                    return o.text.includes(optionText) || o.value.includes(optionText);
                });
                if (match) {
                    el.value = match.value;
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    selected = true;
                    msg = 'Selected "' + optionText + '" in dropdown "' + field + '"';
                } else {
                    msg = 'Option "' + optionText + '" not found in dropdown. Available: ' +
                          options.map(function(o) { return o.text; }).join(', ');
                }
            } else {
                msg = 'Dropdown "' + field + '" not found on page.';
            }
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'SELECT_RESULT',
                payload: { success: selected, message: msg }
            }));
        })();
    `;
    try {
        const result = await agentBridge.injectAndObserve(script, 'SELECT_RESULT', 8000);
        await delay(1000);
        return result.message || "Select operation completed.";
    } catch (e) {
        return "Error selecting: " + (e as any).message;
    }
}

/* ─────────────────── tap_at ─────────────────────── */

/**
 * Click at specific pixel coordinates (x, y) on the screen.
 * Useful for Vision-based fallback when elements aren't easily selectable by text/ID.
 */
export async function tapAt(x: number, y: number): Promise<string> {
    const script = `
        (function() {
            var el = document.elementFromPoint(${x}, ${y});
            var msg = 'No element found at (' + ${x} + ',' + ${y} + ')';
            var success = false;
            
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Simulate full touch/click sequence
                const events = ['mousedown', 'mouseup', 'click'];
                events.forEach(name => {
                    const event = new MouseEvent(name, {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: ${x},
                        clientY: ${y}
                    });
                    el.dispatchEvent(event);
                });
                success = true;
                msg = 'Successfully tapped ' + el.tagName + ' at (' + ${x} + ',' + ${y} + ')';
            }
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'TAP_RESULT',
                payload: { success: success, message: msg }
            }));
        })();
    `;
    try {
        const result = await agentBridge.injectAndObserve(script, 'TAP_RESULT', 8000);
        await delay(1500);
        return result.message || "Tap operation completed.";
    } catch (e) {
        return "Error tapping: " + (e as any).message;
    }
}

/* ─────────────────── capture ────────────────────── */

/**
 * Capture a screenshot of the current WebView.
 * Returns a Base64 encoded string (image/png).
 * Note: In a real app, this might trigger a Native-side screenshot. 
 * For this prototype, we return a structural "Visual Dump" as a proxy if full screenshot is restricted.
 */
export async function captureScreenshot(): Promise<string> {
    const script = `
        (function() {
            // Simplified "Visual Snapshot": capture critical layout info
            var snapshot = {
                title: document.title,
                url: window.location.href,
                width: window.innerWidth,
                height: window.innerHeight,
                elements: []
            };
            
            // Get top 20 visible interactive elements with coordinates
            var interactive = document.querySelectorAll('button, a, input, [role="button"]');
            interactive.forEach(function(el, i) {
                var rect = el.getBoundingClientRect();
                if (rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth) {
                    snapshot.elements.push({
                        tag: el.tagName,
                        text: (el.innerText || el.value || '').substring(0, 30),
                        x: Math.round(rect.left + rect.width / 2),
                        y: Math.round(rect.top + rect.height / 2)
                    });
                }
            });

            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'SCREENSHOT_RESULT',
                payload: { data: JSON.stringify(snapshot) }
            }));
        })();
    `;
    try {
        const result = await agentBridge.injectAndObserve(script, 'SCREENSHOT_RESULT', 10000);
        return result.data || "Error: Failed to capture visual state.";
    } catch (e) {
        return "Error capturing screenshot: " + (e as any).message;
    }
}

/* ─────────────────── Utility ──────────────────────────── */

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
