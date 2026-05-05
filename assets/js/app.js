
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics, isSupported as analyticsIsSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, onAuthStateChanged, sendPasswordResetEmail, deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getDatabase, ref, push, set, onValue, remove, update, query, limitToLast, runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { firebaseConfig, ADMIN_EMAIL } from "./modules/firebase-config.js";
import { chartLabels, chartColors, getPieChartOptions } from "./modules/chart-config.js";
import { initLanguageSystem, t } from "./modules/language-ui.js";
import { createMonthlyReportDownloader } from "./modules/pdf-report.js";

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
    getDonationDetailData, groupRecentDonationsByMonth, isDonorEligible,
    normalizeDonorId, getDonorIdNumber, getMaxDonorIdNumber, DONOR_ID_COUNTER_SEED
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
    applyAdminMemberSearchFilters, resetAdminMemberSearchFilters, initAdminTabs,
    renderAdminRecentDonationsList, renderAdminFeedbackList
} from "./modules/admin.js";
import { updateLoginButtonState, initAuth } from "./modules/auth.js";
import { initJoinForm } from "./modules/join-form.js";
import { initFeedback } from "./modules/feedback.js";
import { initVisitorTracker } from "./modules/visitor-tracker.js";
import { initChatbot } from "./modules/chatbot.js";

const app = initializeApp(firebaseConfig);
try { analyticsIsSupported().then(ok => { if (ok) getAnalytics(app); }); } catch (_) {}
const auth = getAuth(app);
const database = getDatabase(app);

const donorsRef        = ref(database, 'donors');
const eventsRef        = ref(database, 'events');
const statsRef         = ref(database, 'stats');
const recentDonationsRef = ref(database, 'recentDonations');
const feedbackRef      = ref(database, 'feedback');

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

function updateAdminOverviewCounts({ donors, donations, events, admins } = {}) {
    const donorsEl = document.getElementById('admin-overview-donors');
    const adminsEl = document.getElementById('admin-overview-admins');
    const donationsEl = document.getElementById('admin-overview-donations');
    const eventsEl = document.getElementById('admin-overview-events');
    if (!donorsEl && !donationsEl && !eventsEl && !adminsEl) return;
    if (donorsEl && donors != null) donorsEl.textContent = String(donors);
    if (adminsEl && admins != null) adminsEl.textContent = String(admins);
    if (donationsEl && donations != null) donationsEl.textContent = String(donations);
    if (eventsEl && events != null) eventsEl.textContent = String(events);
}

function switchAdminTab(tabName) {
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) return;
    const tabBtn = adminPanel.querySelector(`.admin-tab[data-tab="${tabName}"]`);
    tabBtn?.click();
}

function resetAdminMemberSearchInputs() {
    const nameInput = document.getElementById('admin-member-search-name');
    const bloodSelect = document.getElementById('admin-member-search-blood');
    if (nameInput) nameInput.value = '';
    if (bloodSelect) bloodSelect.value = '';
}

function applyAdminMemberRoleFilter(role) {
    state.memberSearchRole = role || '';
    state.memberSearchName = '';
    state.memberSearchBlood = '';
    resetAdminMemberSearchInputs();
    renderAdminMembersList(deleteMember, promoteMemberToAdmin, demoteAdminToMember);
}

function initAdminOverviewActions() {
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) return;
    const cards = adminPanel.querySelectorAll('.admin-overview-card[data-admin-action]');
    if (!cards.length) return;
    const handleAction = (card) => {
        const action = card.dataset.adminAction;
        const role = card.dataset.adminRole || '';
        if (action === 'members') {
            switchAdminTab('members');
            applyAdminMemberRoleFilter(role === 'admin' ? 'admin' : '');
            document.getElementById('admin-members-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        if (action === 'recent') {
            switchAdminTab('recent');
            document.getElementById('admin-recent-donations-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        if (action === 'events') {
            switchAdminTab('events');
            document.getElementById('admin-events-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };
    cards.forEach(card => {
        const handler = () => handleAction(card);
        card.addEventListener('click', handler);
        card.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                handler();
            }
        });
    });
}

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

function promoteMemberToAdmin(memberId, memberData) {
    if (!state.currentUser || state.currentUserRole !== 'admin') {
        showModalMessage('success-modal', 'You do not have permission to perform this action.', 'Permission Denied');
        return;
    }
    if (!memberId) return;
    if ((memberData?.role || 'member') === 'admin') {
        showModalMessage('success-modal', 'This member is already an admin.', 'No Changes Needed');
        return;
    }
    const memberName = memberData?.fullName || memberData?.name || 'this member';
    attachConfirmHandler(() => {
        const modal = document.getElementById('delete-confirm-modal');
        update(ref(database, 'donors/' + memberId), { role: 'admin' })
            .then(() => {
                closeModal(modal);
                showModalMessage('success-modal', `${memberName} is now an admin.`, 'Success');
                clearAdminMemberForm();
            })
            .catch(error => {
                closeModal(modal);
                showModalMessage('success-modal', `Failed to update role: ${error.message}`, 'Error');
            });
    }, {
        title: 'Promote Member to Admin',
        message: `Are you sure you want to make ${memberName} an admin?`
    });
}

function demoteAdminToMember(memberId, memberData) {
    if (!state.currentUser || state.currentUserRole !== 'admin') {
        showModalMessage('success-modal', 'You do not have permission to perform this action.', 'Permission Denied');
        return;
    }
    if (!memberId) return;
    if ((memberData?.role || 'member') !== 'admin') {
        showModalMessage('success-modal', 'This member is already a member.', 'No Changes Needed');
        return;
    }
    const memberName = memberData?.fullName || memberData?.name || 'this member';
    attachConfirmHandler(() => {
        const modal = document.getElementById('delete-confirm-modal');
        update(ref(database, 'donors/' + memberId), { role: 'member' })
            .then(() => {
                closeModal(modal);
                showModalMessage('success-modal', `${memberName} is now a member.`, 'Success');
                clearAdminMemberForm();
            })
            .catch(error => {
                closeModal(modal);
                showModalMessage('success-modal', `Failed to update role: ${error.message}`, 'Error');
            });
    }, {
        title: 'Make Admin a Member',
        message: `Are you sure you want to make ${memberName} a member?`
    });
}

function deleteRecentDonation(donationId) {
    if (!state.currentUser || state.currentUserRole !== 'admin') {
        showModalMessage('success-modal', 'You do not have permission to perform this action.', 'Permission Denied');
        return;
    }
    attachConfirmHandler(() => {
        const modal = document.getElementById('delete-confirm-modal');
        remove(ref(database, 'recentDonations/' + donationId))
            .then(() => {
                // Decrement lives helped
                onValue(statsRef, snapshot => {
                    const sd = snapshot.val();
                    const cur = (sd && sd.livesHelped) ? Number(sd.livesHelped) : 0;
                    if (cur > 0) {
                        update(ref(database), { '/stats/livesHelped': cur - 1 });
                    }
                }, { onlyOnce: true });
                closeModal(modal);
                showModalMessage('success-modal', 'Recent donation deleted successfully!', 'Success');
            })
            .catch(error => { closeModal(modal); showModalMessage('success-modal', `Failed to delete donation: ${error.message}`, 'Error'); });
    }, { title: 'Delete Recent Donation', message: 'Deleting this donation record is permanent and cannot be undone.' });
}

function deleteFeedback(feedbackId) {
    if (!state.currentUser || state.currentUserRole !== 'admin') {
        showModalMessage('success-modal', 'You do not have permission to perform this action.', 'Permission Denied');
        return;
    }
    attachConfirmHandler(() => {
        const modal = document.getElementById('delete-confirm-modal');
        remove(ref(database, 'feedback/' + feedbackId))
            .then(() => { closeModal(modal); showModalMessage('success-modal', 'Feedback deleted successfully!', 'Success'); })
            .catch(error => { closeModal(modal); showModalMessage('success-modal', `Failed to delete feedback: ${error.message}`, 'Error'); });
    }, { title: 'Delete Feedback', message: 'Deleting this feedback entry is permanent and cannot be undone.' });
}

function callUpdateLogin() {
    updateLoginButtonState(database, ref, onValue,
    renderAdminMembersList, renderAdminEventsList, deleteMember, deleteEvent, () => ensureUniqueDonorIds(), promoteMemberToAdmin, demoteAdminToMember);
}

function setSearchErrorState(message) {
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
        searchResults.innerHTML = `<div class="text-gray-500 italic">${message}</div>`;
    }
    setSearchLoading(false);
}

function runInitStep(label, callback) {
    try {
        callback();
    } catch (error) {
        console.error(`Failed to initialize ${label}:`, error);
    }
}

function getDonorIdRepairPlan() {
    const donors = [...state.donorsList]
        .filter(donor => donor?.id)
        .sort((a, b) => {
            const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (aDate !== bDate) return aDate - bDate;
            return String(a.id).localeCompare(String(b.id));
        });
    const used = new Set();
    const formatUpdates = [];
    const needsNewId = [];
    let maxUsed = getMaxDonorIdNumber(donors);

    donors.forEach((donor) => {
        const rawDonorId = donor.rawDonorId ?? donor.donorId;
        const normalized = normalizeDonorId(rawDonorId);
        const numericId = getDonorIdNumber(normalized);
        if (normalized && numericId && !used.has(numericId)) {
            used.add(numericId);
            maxUsed = Math.max(maxUsed, numericId);
            if (String(rawDonorId || '').trim() !== normalized) {
                formatUpdates.push({ donor, donorId: normalized });
            }
            return;
        }
        needsNewId.push(donor);
    });

    const signature = [
        ...formatUpdates.map(item => `format:${item.donor.id}:${item.donorId}`),
        ...needsNewId.map(donor => `new:${donor.id}`)
    ].join('|');
    return { formatUpdates, needsNewId, maxUsed, signature };
}

async function ensureUniqueDonorIds() {
    if (state.currentUserRole !== 'admin' || state.donorIdRepairInFlight || !state.donorsList.length) return;
    const plan = getDonorIdRepairPlan();
    if (!plan.signature || plan.signature === state.donorIdRepairSignature) return;

    state.donorIdRepairInFlight = true;
    try {
        const updates = {};
        plan.formatUpdates.forEach(({ donor, donorId }) => {
            updates[`/donors/${donor.id}/donorId`] = donorId;
        });

        if (plan.needsNewId.length) {
            const result = await runTransaction(ref(database, 'stats/donorIdCounter'), (current) => {
                const currentNum = getDonorIdNumber(current);
                const safeCurrent = Math.max(
                    Number.isFinite(currentNum) ? currentNum : DONOR_ID_COUNTER_SEED,
                    plan.maxUsed,
                    DONOR_ID_COUNTER_SEED
                );
                return safeCurrent + plan.needsNewId.length;
            });
            if (!result.committed) throw new Error('Donor ID repair transaction was not committed.');
            const finalCounter = getDonorIdNumber(result.snapshot.val());
            if (!finalCounter) throw new Error('Donor ID repair did not return a valid counter.');
            const firstNewId = finalCounter - plan.needsNewId.length + 1;
            plan.needsNewId.forEach((donor, index) => {
                updates[`/donors/${donor.id}/donorId`] = normalizeDonorId(firstNewId + index);
            });
        }

        if (Object.keys(updates).length) {
            await update(ref(database), updates);
        }
        state.donorIdRepairSignature = plan.signature;
    } catch (error) {
        console.error('Failed to repair donor IDs:', error);
    } finally {
        state.donorIdRepairInFlight = false;
    }
}

onValue(donorsRef, (snapshot) => {
    try {
        const data = snapshot.val();
        state.donorsList = [];
        if (data && typeof data === 'object') {
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    state.donorsList.push({ id: key, ...data[key] });
                }
            }
        }
        state.donorsList.forEach((donor) => {
            donor.rawDonorId = donor.donorId;
            donor.donorId = normalizeDonorId(donor.rawDonorId);
        });
        buildDonorIndex(state.donorsList, state);
        const adminCount = state.donorsList.filter(d => (d.role || 'member') === 'admin').length;
        const memberCount = Math.max(0, state.donorsList.length - adminCount);

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
        renderAdminMembersList(deleteMember, promoteMemberToAdmin, demoteAdminToMember);
        refreshDashboardCharts();
        setCountTarget('donor-count', state.donorsList.length);
        updateAdminOverviewCounts({ donors: memberCount, admins: adminCount });
        ensureUniqueDonorIds();
    } catch (error) {
        console.error('Failed to process donors:', error);
        setSearchErrorState('Donor data could not be shown right now. Please refresh and try again.');
    }
}, err => {
    console.error("Failed to load donors:", err);
    setSearchErrorState('Donor data could not be loaded right now.');
});

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
    updateAdminOverviewCounts({ events: state.eventsList.length });
}, err => console.error("Failed to load events:", err));

onValue(statsRef, (snapshot) => {
    const d = snapshot.val();
    if (d && d.livesHelped != null) {
        state.livesHelped = Number(d.livesHelped) || 0;
        setCountTarget('lives-helped-count', state.livesHelped);
        updateAdminOverviewCounts({ donations: state.livesHelped });
    }
}, err => console.error("Failed to load stats:", err));

onValue(recentDonationsRef, (snapshot) => {
    try {
        const data = snapshot.val();
        const list = [];
        if (data) {
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    const donation = { id: key, ...data[key] };
                    const normalizedDonationId = normalizeDonorId(donation.donorId);
                    if (normalizedDonationId) {
                        donation.donorId = normalizedDonationId;
                    }
                    list.push(donation);
                }
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
        renderAdminRecentDonationsList(deleteRecentDonation);
        if (state.livesHelped == null) {
            updateAdminOverviewCounts({ donations: list.length });
        }
        setRecentLoading(false);
    } catch (error) {
        console.error('Failed to process recent donations:', error);
        state.recentDonationsList = [];
        renderRecentDonorsCarousel([]);
        setRecentLoading(false);
    }
}, err => {
    console.error("Failed to load recent donations:", err);
    state.recentDonationsList = [];
    renderRecentDonorsCarousel([]);
    setRecentLoading(false);
});

onValue(feedbackRef, (snapshot) => {
    try {
        const data = snapshot.val();
        const list = [];
        if (data && typeof data === 'object') {
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    list.push({ id: key, ...data[key] });
                }
            }
        }
        list.sort((a, b) => {
            const ad = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
            const bd = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
            return bd - ad;
        });
        state.feedbackList = list;
        renderAdminFeedbackList(deleteFeedback);
    } catch (error) {
        console.error('Failed to process feedback entries:', error);
        state.feedbackList = [];
        renderAdminFeedbackList(deleteFeedback);
    }
}, err => {
    console.error('Failed to load feedback entries:', err);
    state.feedbackList = [];
    renderAdminFeedbackList(deleteFeedback);
});

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

window.onload = function () {
    runInitStep('preloader', () => initPreloader());
    runInitStep('header', () => initHeader());
    runInitStep('language system', () => initLanguageSystem());
    window.addEventListener('languageChanged', () => callUpdateLogin());

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

    runInitStep('mobile menu', () => initMobileMenu());
    runInitStep('dashboard observer', () => setupStatsVisibilityObserver());
    runInitStep('dashboard refresh timer', () => initDashboardRefreshTimer());
    runInitStep('recent donations carousel', () => initCarousel());
    runInitStep('public events controls', () => initEventControls());
    runInitStep('home search', () => initSearch());
    runInitStep('back to top', () => initBackToTop());
    runInitStep('admin tabs', () => initAdminTabs());
    runInitStep('admin overview actions', () => initAdminOverviewActions());
    runInitStep('contact scroll', () => initContactScroll());
    runInitStep('float observer', () => initFloatObserver());
    runInitStep('stats counter', () => initStatsCounter());
    runInitStep('chatbot', () => initChatbot());

    runInitStep('feedback', () => initFeedback(feedbackRef, push));
    const isHomePage = /\/(index\.html)?(\?.*)?(\#.*)?$/i.test(window.location.pathname);
    runInitStep('visitor tracker', () => initVisitorTracker(database, isHomePage)); // track total views only on home page
    runInitStep('join form', () => initJoinForm({ auth, database, ref, set, runTransaction, createUserWithEmailAndPassword }));
    runInitStep('auth', () => initAuth({
        auth, database, ref, onValue,
        signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged,
        renderAdminMembersFn: renderAdminMembersList,
        renderAdminEventsFn: renderAdminEventsList,
        deleteMemberFn: deleteMember,
        deleteEventFn: deleteEvent,
        updateLoginFn: callUpdateLogin
    }));

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
        const editId = fd.get('recent-donor-id')?.toString().trim();
        const donorIdRaw = fd.get('donor-id')?.toString().trim() || '';
        const donorIdInput = normalizeDonorId(donorIdRaw);
        const matchedDonor = donorIdInput
            ? state.donorsList.find(d => normalizeDonorId(d.donorId) === donorIdInput)
            : (donorIdRaw ? state.donorsList.find(d => d.id === donorIdRaw) : null);
        const donorData = {
            name: fd.get('donor-name'), bloodGroup: fd.get('donor-blood-group'),
            location: fd.get('donor-location'), department: fd.get('donor-department'),
            batch: fd.get('donor-batch'), age: fd.get('donor-age'),
            weight: fd.get('donor-weight'),
            phone: fd.get('donor-number'), date: fd.get('donation-date'),
            donorId: donorIdInput || normalizeDonorId(matchedDonor?.donorId)
        };
        if (matchedDonor) {
            const lastInfo = matchedDonor.lastDonationInfo || {};
            if (!donorData.name) donorData.name = matchedDonor.fullName || matchedDonor.name || '';
            if (!donorData.bloodGroup) donorData.bloodGroup = matchedDonor.bloodGroup || '';
            if (!donorData.location) donorData.location = matchedDonor.location || '';
            if (!donorData.department) donorData.department = matchedDonor.department || lastInfo.department || '';
            if (!donorData.batch) donorData.batch = matchedDonor.batch || lastInfo.batch || '';
            if (!donorData.phone) donorData.phone = matchedDonor.phone || '';
            if (!donorData.weight) donorData.weight = matchedDonor.weight || lastInfo.weight || '';
        }
        if (!donorData.name || !donorData.bloodGroup || !donorData.location || !donorData.date) {
            showModalMessage('success-modal', 'Please fill all required fields: Donor Name, Blood Group, Location, and Donation Date.', 'Error');
            return;
        }
        const donorProfileUpdates = matchedDonor ? {
            lastDonateDate: donorData.date || matchedDonor.lastDonateDate || '',
            department: donorData.department || matchedDonor.department || '',
            batch: donorData.batch || matchedDonor.batch || '',
            weight: donorData.weight || matchedDonor.weight || '',
            age: donorData.age || matchedDonor.age || '',
            lastDonationInfo: {
                date: donorData.date || '',
                location: donorData.location || '',
                bloodGroup: donorData.bloodGroup || '',
                department: donorData.department || '',
                batch: donorData.batch || '',
                age: donorData.age || '',
                weight: donorData.weight || '',
                donorId: donorData.donorId || normalizeDonorId(matchedDonor.donorId)
            }
        } : null;
        if (editId) {
            // Update existing recent donation
            update(ref(database, 'recentDonations/' + editId), donorData)
                .then(() => {
                    if (matchedDonor && donorProfileUpdates) {
                        update(ref(database, 'donors/' + matchedDonor.id), donorProfileUpdates)
                            .catch(err => console.error('Failed to sync donor profile:', err));
                    }
                    showModalMessage('success-modal', 'Recent donation updated successfully!', 'Success');
                    clearAdminRecentDonorForm();
                })
                .catch(error => showModalMessage('success-modal', `Failed to update donation: ${error.message}`, 'Error'));
        } else {
            // Add new recent donation
            onValue(statsRef, snapshot => {
                const sd = snapshot.val();
                const cur = (sd && sd.livesHelped) ? Number(sd.livesHelped) : 0;
                const updates = {};
                updates[`/recentDonations/${push(recentDonationsRef).key}`] = donorData;
                updates['/stats/livesHelped'] = cur + 1;
                update(ref(database), updates)
                    .then(() => {
                        if (matchedDonor && donorProfileUpdates) {
                            const totalDonations = Number(matchedDonor.totalDonations) || 0;
                            update(ref(database, 'donors/' + matchedDonor.id), {
                                ...donorProfileUpdates,
                                totalDonations: totalDonations + 1
                            }).catch(err => console.error('Failed to sync donor profile:', err));
                        }
                        showModalMessage('success-modal', 'Recent donor added and lives helped count incremented!', 'Success');
                        clearAdminRecentDonorForm();
                    })
                    .catch(error => showModalMessage('success-modal', `Failed to update data: ${error.message}`, 'Error'));
            }, { onlyOnce: true });
        }
    });
    const recentDonorIdField = document.getElementById('donor-id');
    const fillRecentDonorFromId = () => {
        const rawId = recentDonorIdField?.value.trim() || '';
        if (!rawId) return;
        const normalizedId = normalizeDonorId(rawId);
        if (recentDonorIdField && normalizedId && recentDonorIdField.value.trim() !== normalizedId) {
            recentDonorIdField.value = normalizedId;
        }
        const match = normalizedId
            ? state.donorsList.find(d => normalizeDonorId(d.donorId) === normalizedId)
            : state.donorsList.find(d => d.id === rawId);
        if (!match) return;
        const lastInfo = match.lastDonationInfo || {};
        const nameF = document.getElementById('donor-name');
        const bgF = document.getElementById('donor-blood-group');
        const locF = document.getElementById('donor-location');
        const deptF = document.getElementById('donor-department');
        const batchF = document.getElementById('donor-batch');
        const numberF = document.getElementById('donor-number');
        const weightF = document.getElementById('donor-weight');
        if (nameF && !nameF.value) nameF.value = match.fullName || '';
        if (bgF && !bgF.value) bgF.value = match.bloodGroup || '';
        if (locF && !locF.value) locF.value = match.location || '';
        if (deptF && !deptF.value) deptF.value = match.department || lastInfo.department || '';
        if (batchF && !batchF.value) batchF.value = match.batch || lastInfo.batch || '';
        if (numberF && !numberF.value) numberF.value = match.phone || '';
        if (weightF && !weightF.value) weightF.value = match.weight || lastInfo.weight || '';
    };
    recentDonorIdField?.addEventListener('input', fillRecentDonorFromId);
    recentDonorIdField?.addEventListener('change', fillRecentDonorFromId);
    document.getElementById('clear-recent-donor-btn')?.addEventListener('click', clearAdminRecentDonorForm);

    const adminMemberForm = document.getElementById('admin-member-form');
    adminMemberForm?.addEventListener('submit', ev => {
        ev.preventDefault();
        const fd = new FormData(adminMemberForm);
        const memberId = fd.get('id');
        const updatedData = {
            fullName: fd.get('fullName'), email: fd.get('email') || '', phone: fd.get('phone'), bloodGroup: fd.get('bloodGroup'),
            location: fd.get('location'), department: fd.get('department'), batch: fd.get('batch'), lastDonateDate: fd.get('lastDonateDate'),
            isPhoneHidden: fd.get('isPhoneHidden') === 'on', publicComment: fd.get('publicComment')
        };
        if (memberId) {
            update(ref(database, 'donors/' + memberId), updatedData)
                .then(() => { showModalMessage('success-modal', 'Member profile updated successfully!', 'Success'); clearAdminMemberForm(); })
                .catch(error => showModalMessage('success-modal', `Failed to update member: ${error.message}`, 'Error'));
        }
    });
    document.getElementById('clear-member-btn')?.addEventListener('click', clearAdminMemberForm);

    document.getElementById('admin-member-search-btn')?.addEventListener('click', () => applyAdminMemberSearchFilters(deleteMember, promoteMemberToAdmin, demoteAdminToMember));
    document.getElementById('admin-member-search-reset')?.addEventListener('click', () => resetAdminMemberSearchFilters(deleteMember, promoteMemberToAdmin, demoteAdminToMember));
    document.getElementById('admin-member-search-blood')?.addEventListener('change', () => applyAdminMemberSearchFilters(deleteMember, promoteMemberToAdmin, demoteAdminToMember));
    document.getElementById('admin-member-search-name')?.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') { ev.preventDefault(); applyAdminMemberSearchFilters(deleteMember, promoteMemberToAdmin, demoteAdminToMember); }
    });

    document.getElementById('admin-monthly-report-btn')?.addEventListener('click', () =>
        downloadMonthlyReportPdf(document.getElementById('admin-monthly-report-btn'))
    );
};
