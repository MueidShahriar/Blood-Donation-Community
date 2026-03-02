/**
 * Visitor Tracking Module
 * - Total page views (incremented only on home page, once per session)
 * - Real-time online user presence using Firebase Realtime Database
 *
 * Database structure:
 *   visitorTracking/
 *     totalViews: <number>
 *     presence/
 *       <sessionId>: true
 */

import {
    ref, onValue, set, runTransaction,
    onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

/* ---------- Session ID (unique per browser tab session) ---------- */
function getSessionId() {
    let sid = sessionStorage.getItem('bdc_session_id');
    if (!sid) {
        sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
        sessionStorage.setItem('bdc_session_id', sid);
    }
    return sid;
}

/* ---------- Public API ---------- */

/**
 * Initialize visitor tracking.
 * @param {import("firebase/database").Database} database  – Firebase Realtime Database instance
 * @param {boolean} isHomePage – Pass `true` only on index.html
 */
export function initVisitorTracker(database, isHomePage = false) {
    const sessionId = getSessionId();

    /* ── Cache DOM elements once ── */
    const onlineEls = document.querySelectorAll('.online-users-count');
    const onlineSingle = document.getElementById('online-users-count');
    const viewEls = isHomePage ? document.querySelectorAll('.total-views-count') : null;
    const viewSingle = isHomePage ? document.getElementById('total-views-count') : null;

    /* ── Presence System ── */
    const myPresenceRef = ref(database, `visitorTracking/presence/${sessionId}`);
    const connectedRef = ref(database, '.info/connected');

    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            set(myPresenceRef, true).catch(() => {});
            onDisconnect(myPresenceRef).remove();
        }
    });

    const allPresenceRef = ref(database, 'visitorTracking/presence');
    onValue(allPresenceRef, (snap) => {
        const data = snap.val();
        const count = data ? Object.keys(data).length : 0;
        onlineEls.forEach(el => { el.textContent = count; });
        if (onlineSingle) onlineSingle.textContent = count;
    });

    /* ── Total Views (Home page only) ── */
    if (isHomePage) {
        const VIEW_FLAG = 'bdc_home_view_counted';
        const viewsRef = ref(database, 'visitorTracking/totalViews');

        if (!sessionStorage.getItem(VIEW_FLAG)) {
            runTransaction(viewsRef, (current) => {
                return (current || 0) + 1;
            }).then(() => {
                sessionStorage.setItem(VIEW_FLAG, '1');
            }).catch(err => console.error('View count transaction error:', err));
        }

        onValue(viewsRef, (snap) => {
            const views = snap.val() || 0;
            const text = views.toLocaleString();
            if (viewEls) viewEls.forEach(el => { el.textContent = text; });
            if (viewSingle) viewSingle.textContent = text;
        });
    }
}
