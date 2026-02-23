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

    /* ── Presence System ── */
    const myPresenceRef = ref(database, `visitorTracking/presence/${sessionId}`);
    const connectedRef = ref(database, '.info/connected');

    onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
            // Mark ourselves present
            set(myPresenceRef, true);
            // Remove presence when we disconnect
            onDisconnect(myPresenceRef).remove();
        }
    });

    // Listen for online user count changes
    const allPresenceRef = ref(database, 'visitorTracking/presence');
    onValue(allPresenceRef, (snap) => {
        const data = snap.val();
        const count = data ? Object.keys(data).length : 0;
        // Update every element with this class/id on the page
        document.querySelectorAll('.online-users-count').forEach(el => {
            el.textContent = count;
        });
        const singleEl = document.getElementById('online-users-count');
        if (singleEl) singleEl.textContent = count;
    });

    /* ── Total Views (Home page only) ── */
    if (isHomePage) {
        const VIEW_FLAG = 'bdc_home_view_counted';
        const viewsRef = ref(database, 'visitorTracking/totalViews');

        // Increment only once per session
        if (!sessionStorage.getItem(VIEW_FLAG)) {
            runTransaction(viewsRef, (current) => {
                return (current || 0) + 1;
            }).then(() => {
                sessionStorage.setItem(VIEW_FLAG, '1');
            }).catch(err => console.error('View count transaction error:', err));
        }

        // Real-time listener for total views
        onValue(viewsRef, (snap) => {
            const views = snap.val() || 0;
            document.querySelectorAll('.total-views-count').forEach(el => {
                el.textContent = views.toLocaleString();
            });
            const singleEl = document.getElementById('total-views-count');
            if (singleEl) singleEl.textContent = views.toLocaleString();
        });
    }
}
