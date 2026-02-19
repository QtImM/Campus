/**
 * Library Automation Scripts (Robust & Self-Healing Version)
 */

export const LIBRARY_SCRIPTS = {
    /**
     * Scans for slots using multiple fallback strategies (Classes -> Text -> Attributes)
     */
    SCAN_SLOTS: `
        (function() {
            const slots = [];
            
            // Strategy 1: Targeted Class Selectors (Springshare LibCal defaults)
            let elements = Array.from(document.querySelectorAll('.s-lc-eq-avail, .s-lc-eq-pending, a[id^="eq_"]'));
            
            // Strategy 2: If nothing found, try fuzzy text search for common patterns
            if (elements.length === 0) {
                console.log('[Agent] Primary selectors failed, falling back to fuzzy text scan...');
                elements = Array.from(document.querySelectorAll('a, button, [role="button"]')).filter(el => {
                    const txt = (el.innerText || "").toLowerCase();
                    return txt.includes('available') || txt.includes('book') || txt.includes('reserve');
                });
            }

            elements.forEach(el => {
                const title = el.getAttribute('title') || el.innerText || "Unknown Slot";
                const isAvailable = el.classList.contains('s-lc-eq-avail') || 
                                    title.toLowerCase().includes('available') ||
                                    el.style.backgroundColor === 'rgb(0, 128, 0)'; // Green indicator

                slots.push({
                    id: el.id || 'slot_' + Math.random().toString(36).substr(2, 9),
                    title: title,
                    status: isAvailable ? 'available' : 'booked',
                    time: el.getAttribute('data-start') || title.match(/\\d{1,2}:\\d{2}/)?.[0] || ""
                });
            });

            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'LIBRARY_SCAN_RESULT',
                payload: { slots: slots.slice(0, 20) } // Cap for performance
            }));
        })();
    `,

    /**
     * Checks if the user is currently logged in via SSO
     */
    CHECK_AUTH: `
        (function() {
            const authKeywords = ['Sign Out', 'Logout', '登出', 'My Library', '退出'];
            const isLoggedIn = authKeywords.some(kw => document.body.innerText.includes(kw)) || 
                               !!document.querySelector('.s-lc-sso-logout, #s-lc-public-auth-btn');
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'AUTH_STATUS',
                payload: { isLoggedIn }
            }));
        })();
    `,

    /**
     * Simulates clicking a specific seat/time slot
     */
    BOOK_SLOT: (slotId: string) => `
        (function() {
            let el = document.getElementById('${slotId}');
            if (!el) {
                // Fallback: search for element containing the ID or text
                el = Array.from(document.querySelectorAll('a')).find(a => a.id.includes('${slotId}'));
            }

            if (el) {
                el.scrollIntoView();
                el.click();
                
                // Smart "Submit" detection
                setTimeout(() => {
                    const submitSelectors = [
                        '#s-lc-eq-bform-submit', 
                        '.btn-primary', 
                        'button[id^="s-lc-eq-submit"]',
                        'input[type="submit"]'
                    ];
                    let submitBtn = null;
                    for (let sel of submitSelectors) {
                        submitBtn = document.querySelector(sel);
                        if (submitBtn) break;
                    }
                    if (submitBtn) submitBtn.click();
                }, 800);
            }
        })();
    `,

    SYNC_COOKIES: `
        (function() {
            setInterval(() => {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'SYNC_COOKIES',
                    payload: { cookies: document.cookie }
                }));
            }, 5000);
        })();
    `
};
