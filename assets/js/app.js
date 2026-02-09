/* ═══════════════════════════════════════════════════════════════
   Blood Donation Community – main entry point (ES module)
   All heavy logic lives in ./modules/*; this file wires them up.
   ═══════════════════════════════════════════════════════════════ */

// ── Firebase SDK ──────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics, isSupported as analyticsIsSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, onAuthStateChanged, sendPasswordResetEmail, deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getDatabase, ref, push, set, onValue, remove, update, query, limitToLast
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ── Project configs ───────────────────────────────────────────
import { firebaseConfig, ADMIN_EMAIL } from "./modules/firebase-config.js";
import { chartLabels, chartColors, getPieChartOptions } from "./modules/chart-config.js";
import { initLanguageSystem, t } from "./modules/language-ui.js";
import { createMonthlyReportDownloader } from "./modules/pdf-report.js";

// ── Modules ───────────────────────────────────────────────────
import state from "./modules/state.js";
import { initPreloader } from "./modules/preloader.js";
import { initHeader, initMobileMenu } from "./modules/header.js";
import { initFloatObserver } from "./modules/float-observer.js";
import { initBackToTop } from "./modules/back-to-top.js";
import {
    openModal, closeModal, showModalMessage, attachConfirmHandler
} from "./modules/modals.js";
import {
    normalizeBloodGroup, buildDonorIndex, formatDateDisplay,
    getDonationDetailData, groupRecentDonationsByMonth, isDonorEligible
} from "./modules/utils.js";
import { setCountTarget, initStatsCounter } from "./modules/stats-counter.js";
import {
    ensureDashboardCharts, refreshDashboardCharts,
    setupStatsVisibilityObserver, initDashboardRefreshTimer
} from "./modules/dashboard.js";
import { renderPublicEvents, initEventControls } from "./modules/events-render.js";
import {
    renderRecentDonorsCarousel, setRecentLoading, initCarousel
} from "./modules/carousel.js";
import {
    renderSearchResults, setSearchLoading, runSearch, initSearch
} from "./modules/search.js";
import {
    renderAdminMembersList, renderAdminEventsList,
    clearAdminEventForm, clearAdminRecentDonorForm, clearAdminMemberForm,
    applyAdminMemberSearchFilters, resetAdminMemberSearchFilters, initAdminTabs
} from "./modules/admin.js";
import { updateLoginButtonState, initAuth } from "./modules/auth.js";
import { initJoinForm } from "./modules/join-form.js";
import { initFeedback } from "./modules/feedback.js";

// ── Firebase bootstrap ────────────────────────────────────────
const app = initializeApp(firebaseConfig);
try { analyticsIsSupported().then(ok => { if (ok) getAnalytics(app); }); } catch (_) {}
const auth = getAuth(app);
const database = getDatabase(app);

const donorsRef        = ref(database, 'donors');
const eventsRef        = ref(database, 'events');
const statsRef         = ref(database, 'stats');
const recentDonationsRef = ref(database, 'recentDonations');
const feedbackRef      = ref(database, 'feedback');

// ── PDF report helper (needs several module fns) ─────────────
const downloadMonthlyReportPdf = createMonthlyReportDownloader({
    getRecentDonations: () => Array.isArray(state.recentDonationsList) ? [...state.recentDonationsList] : [],
    groupRecentDonationsByMonth: (donations) => groupRecentDonationsByMonth(donations, chartLabels),
    chartLabels,
    refreshDashboardCharts,
    ensureDashboardCharts,
    getDonationDetailData,
    formatDateDisplay,
    showModalMessage
});

// ── CRUD helpers (need Firebase refs) ─────────────────────────
function saveEvent(eventData) {
    if (!state.currentUser || state.currentUserRole !== 'admin') {
        showModalMessage('success-modal', 'You do not have permission to perform this action.', 'Permission Denied');
        return;
    }
    const eventId = eventData.id;
    delete eventData.id;
    if (eventId) {
        update(ref(database, 'events/' + eventId), eventData)
            .then(() => showModalMessage('success-modal', 'Event updated successfully!', 'Success'))
            .catch(error => showModalMessage('success-modal', `Failed to update event: ${error.message}`, 'Error'));
    } else {
        set(push(eventsRef), eventData)
            .then(() => showModalMessage('success-modal', 'New event created successfully!', 'Success'))
            .catch(error => showModalMessage('success-modal', `Failed to create event: ${error.message}`, 'Error'));
    }
    clearAdminEventForm();
}

function deleteEvent(eventId) {
    if (!state.currentUser || state.currentUserRole !== 'admin') {
        showModalMessage('success-modal', 'You do not have permission to perform this action.', 'Permission Denied');
        return;
    }
    attachConfirmHandler(() => {
        const modal = document.getElementById('delete-confirm-modal');
        remove(ref(database, 'events/' + eventId))
            .then(() => { closeModal(modal); showModalMessage('success-modal', 'Event deleted successfully!', 'Success'); })
            .catch(error => { closeModal(modal); showModalMessage('success-modal', `Failed to delete event: ${error.message}`, 'Error'); });
    }, { title: 'Delete Event', message: 'Deleting this event is permanent and cannot be undone.' });
}

function deleteMember(memberId) {
    if (!state.currentUser || state.currentUserRole !== 'admin') {
        showModalMessage('success-modal', 'You do not have permission to perform this action.', 'Permission Denied');
        return;
    }
    attachConfirmHandler(() => {
        const modal = document.getElementById('delete-confirm-modal');
        remove(ref(database, 'donors/' + memberId))
            .then(() => { closeModal(modal); showModalMessage('success-modal', 'Member profile deleted successfully!', 'Success'); })
            .catch(error => { closeModal(modal); showModalMessage('success-modal', `Failed to delete member data: ${error.message}`, 'Error'); });
    }, { title: 'Delete Member', message: 'Deleting this member profile is permanent and cannot be undone.' });
}

// ── Convenience wrapper ───────────────────────────────────────
function callUpdateLogin() {
    updateLoginButtonState(database, ref, onValue,
        renderAdminMembersList, renderAdminEventsList, deleteMember, deleteEvent);
}

// ── Firebase realtime listeners ───────────────────────────────
onValue(donorsRef, (snapshot) => {
    const data = snapshot.val();
    state.donorsList = [];
    if (data && typeof data === 'object') {
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                state.donorsList.push({ id: key, ...data[key] });
            }
        }
    }
    buildDonorIndex(state.donorsList, state);

    const blood = document.getElementById('search-blood')?.value;
    const eligibleOnly = document.getElementById('eligible-only')?.checked;
    const resultsEl = document.getElementById('search-results');
    if (blood === 'select') {
        if (resultsEl) resultsEl.innerHTML = '';
        setSearchLoading(false);
    } else if (resultsEl) {
        const normalized = normalizeBloodGroup(blood);
        let filtered = (blood && blood !== 'all' && blood !== 'select')
            ? (state.donorsByGroup.get(normalized) || []) : state.donorsList;
        if (eligibleOnly) filtered = filtered.filter(d => isDonorEligible(d.lastDonateDate));
        renderSearchResults(filtered);
    }
    renderAdminMembersList(deleteMember);
    refreshDashboardCharts();
    setCountTarget('donor-count', state.donorsList.length);
}, err => console.error("Failed to load donors:", err));

onValue(eventsRef, (snapshot) => {
    const data = snapshot.val();
    state.eventsList = [];
    if (data && typeof data === 'object') {
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                state.eventsList.push({ id: key, ...data[key] });
            }
        }
    }
    renderPublicEvents();
    if (state.currentUserRole === 'admin') renderAdminEventsList(deleteEvent);
    setCountTarget('event-count', state.eventsList.length);
}, err => console.error("Failed to load events:", err));

onValue(statsRef, (snapshot) => {
    const d = snapshot.val();
    if (d && d.livesHelped != null) setCountTarget('lives-helped-count', d.livesHelped);
}, err => console.error("Failed to load stats:", err));

onValue(recentDonationsRef, (snapshot) => {
    const data = snapshot.val();
    const list = [];
    if (data) {
        for (const key in data) {
            if (data.hasOwnProperty(key)) list.push({ id: key, ...data[key] });
        }
    }
    list.sort((a, b) => {
        const ad = a.date ? new Date(a.date).getTime() : 0;
        const bd = b.date ? new Date(b.date).getTime() : 0;
        return bd - ad;
    });
    state.recentDonationsList = list;
    renderRecentDonorsCarousel(list);
    refreshDashboardCharts();
    setRecentLoading(false);
}, err => { console.error("Failed to load recent donations:", err); setRecentLoading(false); });

// ── Contact-section smooth scroll ─────────────────────────────
function initContactScroll() {
    const fastScrollTo = (el, duration = 250) => {
        const root = document.documentElement;
        const headerH = parseFloat(getComputedStyle(root).getPropertyValue('--header-height')) || 0;
        const targetY = el.getBoundingClientRect().top + window.pageYOffset - headerH;
        const startY = window.pageYOffset;
        const dist = targetY - startY;
        const t0 = performance.now();
        const ease = t => 1 - Math.pow(1 - t, 3);
        const step = now => {
            const p = Math.min(1, (now - t0) / duration);
            window.scrollTo(0, startY + dist * ease(p));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };
    document.querySelectorAll('a[href="#contact"]').forEach(link => {
        link.addEventListener('click', e => {
            const target = document.getElementById('contact');
            if (!target) return;
            e.preventDefault();
            const mm = document.getElementById('mobile-menu');
            if (mm && !mm.classList.contains('hidden')) mm.classList.add('hidden');
            const prefersReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
            if (prefersReduce) {
                const hH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0;
                window.scrollTo(0, target.getBoundingClientRect().top + window.pageYOffset - hH);
            } else {
                fastScrollTo(target, 160);
            }
            history.pushState ? history.pushState(null, '', '#contact') : (location.hash = '#contact');
        });
    });
}

// ══════════════════════════════════════════════════════════════
//  window.onload – wire everything together
// ══════════════════════════════════════════════════════════════
window.onload = function () {
    // Core UI
    initPreloader();
    initHeader();
    initLanguageSystem();
    window.addEventListener('languageChanged', () => callUpdateLogin());

    // Modals
    const successModal      = document.getElementById('success-modal');
    const loginModal         = document.getElementById('login-modal');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    document.getElementById('success-close')?.addEventListener('click', () => closeModal(successModal));
    successModal?.querySelector('.absolute.inset-0')?.addEventListener('click', () => closeModal(successModal));
    document.getElementById('login-cancel')?.addEventListener('click', () => closeModal(loginModal));
    loginModal?.querySelector('.absolute.inset-0')?.addEventListener('click', () => closeModal(loginModal));
    document.getElementById('delete-cancel')?.addEventListener('click', () => closeModal(deleteConfirmModal));
    deleteConfirmModal?.querySelector('.absolute.inset-0')?.addEventListener('click', () => closeModal(deleteConfirmModal));
    document.addEventListener('keydown', ev => {
        if (ev.key === 'Escape') [successModal, loginModal, deleteConfirmModal].forEach(m => closeModal(m));
    });

    // Feature modules
    initMobileMenu();
    setupStatsVisibilityObserver();
    initDashboardRefreshTimer();
    initCarousel();
    initEventControls();
    initSearch();
    initBackToTop();
    initAdminTabs();
    initContactScroll();
    initFloatObserver();
    initStatsCounter();

    // Modules that need Firebase deps injected
    initFeedback(feedbackRef, push);
    initJoinForm({ auth, database, ref, set, createUserWithEmailAndPassword });
    initAuth({
        auth, database, ref, onValue,
        signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged,
        renderAdminMembersFn: renderAdminMembersList,
        renderAdminEventsFn: renderAdminEventsList,
        deleteMemberFn: deleteMember,
        deleteEventFn: deleteEvent,
        updateLoginFn: callUpdateLogin
    });

    // ── Admin forms (stay here – they need Firebase refs) ─────
    const adminEventForm = document.getElementById('admin-event-form');
    adminEventForm?.addEventListener('submit', ev => {
        ev.preventDefault();
        const fd = new FormData(adminEventForm);
        saveEvent({
            title: fd.get('title'), date: fd.get('date'), time: fd.get('time'),
            location: fd.get('location'), description: fd.get('description'), id: fd.get('id')
        });
    });
    document.getElementById('clear-event-btn')?.addEventListener('click', clearAdminEventForm);

    const adminRecentDonorForm = document.getElementById('admin-recent-donor-form');
    adminRecentDonorForm?.addEventListener('submit', ev => {
        ev.preventDefault();
        const fd = new FormData(adminRecentDonorForm);
        const donorData = {
            name: fd.get('donor-name'), bloodGroup: fd.get('donor-blood-group'),
            location: fd.get('donor-location'), department: fd.get('donor-department'),
            batch: fd.get('donor-batch'), age: fd.get('donor-age'),
            weight: fd.get('donor-weight'), date: fd.get('donation-date')
        };
        if (!donorData.name || !donorData.bloodGroup || !donorData.location || !donorData.date) {
            showModalMessage('success-modal', 'Please fill all required fields: Donor Name, Blood Group, Location, and Donation Date.', 'Error');
            return;
        }
        onValue(statsRef, snapshot => {
            const sd = snapshot.val();
            const cur = (sd && sd.livesHelped) ? Number(sd.livesHelped) : 0;
            const updates = {};
            updates[`/recentDonations/${push(recentDonationsRef).key}`] = donorData;
            updates['/stats/livesHelped'] = cur + 1;
            update(ref(database), updates)
                .then(() => { showModalMessage('success-modal', 'Recent donor added and lives helped count incremented!', 'Success'); clearAdminRecentDonorForm(); })
                .catch(error => showModalMessage('success-modal', `Failed to update data: ${error.message}`, 'Error'));
        }, { onlyOnce: true });
    });
    document.getElementById('clear-recent-donor-btn')?.addEventListener('click', clearAdminRecentDonorForm);

    const adminMemberForm = document.getElementById('admin-member-form');
    adminMemberForm?.addEventListener('submit', ev => {
        ev.preventDefault();
        const fd = new FormData(adminMemberForm);
        const memberId = fd.get('id');
        const updatedData = {
            fullName: fd.get('fullName'), phone: fd.get('phone'), bloodGroup: fd.get('bloodGroup'),
            location: fd.get('location'), lastDonateDate: fd.get('lastDonateDate'),
            isPhoneHidden: fd.get('isPhoneHidden') === 'on', publicComment: fd.get('publicComment')
        };
        if (memberId) {
            update(ref(database, 'donors/' + memberId), updatedData)
                .then(() => { showModalMessage('success-modal', 'Member profile updated successfully!', 'Success'); clearAdminMemberForm(); })
                .catch(error => showModalMessage('success-modal', `Failed to update member: ${error.message}`, 'Error'));
        }
    });
    document.getElementById('clear-member-btn')?.addEventListener('click', clearAdminMemberForm);

    document.getElementById('admin-member-search-btn')?.addEventListener('click', () => applyAdminMemberSearchFilters(deleteMember));
    document.getElementById('admin-member-search-reset')?.addEventListener('click', () => resetAdminMemberSearchFilters(deleteMember));
    document.getElementById('admin-member-search-blood')?.addEventListener('change', () => applyAdminMemberSearchFilters(deleteMember));
    document.getElementById('admin-member-search-name')?.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') { ev.preventDefault(); applyAdminMemberSearchFilters(deleteMember); }
    });

    document.getElementById('admin-monthly-report-btn')?.addEventListener('click', () =>
        downloadMonthlyReportPdf(document.getElementById('admin-monthly-report-btn'))
    );
};
