const __pendingCounts__ = new Map();
window.__statsVisible__ = false;
window.__animateCountTo__ = undefined;

function setCountTarget(id, value) {
    const v = Number(value || 0);
    const el = document.getElementById(id);
    if (!el) {
        __pendingCounts__.set(id, v);
        return;
    }
    el.dataset.countTo = String(v);
    if (window.__statsVisible__ && typeof window.__animateCountTo__ === 'function') {
        window.__animateCountTo__(el, v);
    }
}

function setHeaderOffset() {
    const header = document.querySelector('header');
    const h = header ? header.offsetHeight : 0;
    document.documentElement.style.setProperty('--header-height', h + 'px');
}
window.addEventListener('load', setHeaderOffset, {
    once: true
});
window.addEventListener('resize', setHeaderOffset);
if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => setHeaderOffset());
    ro.observe(document.body);
}
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAnalytics,
    isSupported as analyticsIsSupported
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getDatabase,
    ref,
    push,
    set,
    onValue,
    remove,
    update,
    query,
    limitToLast
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";
import { chartLabels, chartColors, getPieChartOptions } from "./chart-config.js";

const app = initializeApp(firebaseConfig);
let analytics;
try {
    analyticsIsSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
        }
    });
} catch (e) {
    console.warn('Analytics not supported in this environment.');
}
const auth = getAuth(app);
const database = getDatabase(app);

let donorsList = [];
let eventsList = [];
let recentDonationsList = [];
let currentUser = null;
let currentUserRole = 'member';
let searchLoaderEl = null;
let searchRunTimeout = null;
let recentLoaderEl = null;
let recentLoaderState = true;

let ageGroupChart;
let monthlyDonorChart;
let bloodGroupChart;

function ensureDashboardCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js is not available; dashboard charts are disabled.');
        return;
    }
    if (!ageGroupChart) {
        const ctx = document.getElementById('ageGroupChart');
        if (ctx) {
            ageGroupChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: chartLabels.age,
                    datasets: [{
                        data: chartLabels.age.map(() => 0),
                        backgroundColor: chartColors.age,
                        borderWidth: 0,
                        hoverOffset: 8
                    }]
                },
                options: getPieChartOptions()
            });
        }
    }
    if (!monthlyDonorChart) {
        const ctx = document.getElementById('monthlyDonorChart');
        if (ctx) {
            monthlyDonorChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: chartLabels.months,
                    datasets: [{
                        data: chartLabels.months.map(() => 0),
                        backgroundColor: chartColors.months,
                        borderWidth: 0,
                        hoverOffset: 8
                    }]
                },
                options: getPieChartOptions()
            });
        }
    }
    if (!bloodGroupChart) {
        const ctx = document.getElementById('bloodGroupChart');
        if (ctx) {
            bloodGroupChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: chartLabels.blood,
                    datasets: [{
                        data: chartLabels.blood.map(() => 0),
                        backgroundColor: chartColors.blood,
                        borderWidth: 0,
                        hoverOffset: 8
                    }]
                },
                options: getPieChartOptions()
            });
        }
    }
}

function toggleEmptyState(elementId, hasData) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.classList.toggle('hidden', hasData);
}

function inferAgeValue(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const ageFields = ['age', 'Age', 'donorAge'];
    for (const field of ageFields) {
        const raw = entry[field];
        if (raw == null || raw === '') continue;
        const num = Number(raw);
        if (Number.isFinite(num) && num > 0) return num;
    }
    const ageGroupField = entry.ageGroup || entry.AgeGroup;
    if (typeof ageGroupField === 'string' && ageGroupField.trim()) {
        const normalized = ageGroupField.replace(/\s+/g, '').toLowerCase();
        if (normalized.includes('18') && normalized.includes('25')) return 22;
        if (normalized.includes('26') && normalized.includes('35')) return 30;
        if (normalized.includes('36') && normalized.includes('45')) return 40;
        if (normalized.includes('46')) return 50;
    }
    const dob = entry.dateOfBirth || entry.dob || entry.birthDate;
    if (dob) {
        const birthDate = new Date(dob);
        if (!Number.isNaN(birthDate.getTime())) {
            const ageMs = Date.now() - birthDate.getTime();
            const age = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 365.25));
            if (Number.isFinite(age) && age > 0) return age;
        }
    }
    const birthYear = entry.birthYear || entry.birth_year;
    if (birthYear) {
        const yearNum = Number(birthYear);
        if (Number.isFinite(yearNum) && yearNum > 1900) {
            const age = new Date().getFullYear() - yearNum;
            if (age > 0) return age;
        }
    }
    return null;
}

function computeAgeGroupCounts() {
    const buckets = new Map(chartLabels.age.map(label => [label, 0]));
    const assign = (age) => {
        if (!Number.isFinite(age) || age < 18) return;
        if (age <= 25) buckets.set('18-25', buckets.get('18-25') + 1);
        else if (age <= 35) buckets.set('26-35', buckets.get('26-35') + 1);
        else if (age <= 45) buckets.set('36-45', buckets.get('36-45') + 1);
        else buckets.set('46+', buckets.get('46+') + 1);
    };
    const addFromEntry = (entry) => {
        if (!entry) return;
        const directGroup = entry.ageGroup || entry.AgeGroup;
        if (typeof directGroup === 'string' && directGroup.trim()) {
            const normalized = directGroup.replace(/\s+/g, '').toLowerCase();
            if (normalized.includes('18') && normalized.includes('25')) {
                buckets.set('18-25', buckets.get('18-25') + 1);
                return;
            }
            if (normalized.includes('26') && normalized.includes('35')) {
                buckets.set('26-35', buckets.get('26-35') + 1);
                return;
            }
            if (normalized.includes('36') && normalized.includes('45')) {
                buckets.set('36-45', buckets.get('36-45') + 1);
                return;
            }
            if (normalized.includes('46') || normalized.includes('50') || normalized.includes('+')) {
                buckets.set('46+', buckets.get('46+') + 1);
                return;
            }
        }
        const inferred = inferAgeValue(entry);
        if (inferred != null) assign(inferred);
    };
    donorsList.forEach(addFromEntry);
    recentDonationsList.forEach(addFromEntry);
    return chartLabels.age.map(label => buckets.get(label) || 0);
}

function computeBloodGroupCounts() {
    const counts = chartLabels.blood.map(() => 0);
    const increment = (group) => {
        if (!group) return;
        const normalized = group.toString().trim().toUpperCase().replace(/\s+/g, '');
        const idx = chartLabels.blood.indexOf(normalized);
        if (idx >= 0) counts[idx] += 1;
    };
    donorsList.forEach(d => {
        increment(d?.bloodGroup || d?.blood_group || d?.blood);
    });
    recentDonationsList.forEach(d => increment(d?.bloodGroup));
    return counts;
}

function computeMonthlyCounts() {
    const counts = chartLabels.months.map(() => 0);
    const addDate = (dateValue) => {
        if (!dateValue) return;
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return;
        const month = date.getMonth();
        if (month >= 0 && month < counts.length) counts[month] += 1;
    };
    recentDonationsList.forEach(item => {
        addDate(item?.date || item?.donationDate);
    });
    return counts;
}

function updateAgeGroupChart() {
    ensureDashboardCharts();
    if (!ageGroupChart) return;
    const counts = computeAgeGroupCounts();
    ageGroupChart.data.labels = chartLabels.age;
    ageGroupChart.data.datasets[0].data = counts;
    ageGroupChart.data.datasets[0].backgroundColor = chartColors.age;
    ageGroupChart.update();
    const total = counts.reduce((sum, value) => sum + value, 0);
    toggleEmptyState('ageGroupChartEmpty', total > 0);
}

function updateMonthlyDonorChart() {
    ensureDashboardCharts();
    if (!monthlyDonorChart) return;
    const counts = computeMonthlyCounts();
    monthlyDonorChart.data.labels = chartLabels.months;
    monthlyDonorChart.data.datasets[0].data = counts;
    monthlyDonorChart.data.datasets[0].backgroundColor = chartColors.months;
    monthlyDonorChart.update();
    const total = counts.reduce((sum, value) => sum + value, 0);
    toggleEmptyState('monthlyDonorChartEmpty', total > 0);
}

function updateBloodGroupChart() {
    ensureDashboardCharts();
    if (!bloodGroupChart) return;
    const counts = computeBloodGroupCounts();
    bloodGroupChart.data.labels = chartLabels.blood;
    bloodGroupChart.data.datasets[0].data = counts;
    bloodGroupChart.data.datasets[0].backgroundColor = chartColors.blood;
    bloodGroupChart.update();
    const total = counts.reduce((sum, value) => sum + value, 0);
    toggleEmptyState('bloodGroupChartEmpty', total > 0);
}

function refreshDashboardCharts() {
    updateAgeGroupChart();
    updateMonthlyDonorChart();
    updateBloodGroupChart();
}

function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function showModalMessage(modal, message, title) {
    let modalEl = null;
    if (typeof modal === 'string') modalEl = document.getElementById(modal);
    else modalEl = modal || document.getElementById('success-modal');
    if (!modalEl) return console.warn('Modal element not found for showModalMessage');
    const titleEl = modalEl.querySelector('h3');
    const messageEl = modalEl.querySelector('p');
    if (titleEl && title) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message || '';
    openModal(modalEl);
}

function attachConfirmHandler(callback, opts = {}) {
    const modal = document.getElementById('delete-confirm-modal');
    if (!modal) return console.warn('Delete confirm modal not found');
    const titleEl = modal.querySelector('h3');
    const messageEl = modal.querySelector('p');
    if (opts.title && titleEl) titleEl.textContent = opts.title;
    if (opts.message && messageEl) messageEl.textContent = opts.message;

    const confirmBtn = document.getElementById('delete-confirm');
    if (!confirmBtn) {
        openModal(modal);
        return;
    }

    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    newBtn.addEventListener('click', () => {
        try {
            callback();
        } catch (err) {
            console.error('Error in confirm handler:', err);
        }
    }, {
        once: true
    });

    openModal(modal);
}

function getDateParts(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return {
        y: '',
        m: '',
        d: ''
    };
    const parts = dateStr.split('-');
    return {
        y: parts[0] || '',
        m: parts[1] || '',
        d: parts[2] || ''
    };
}

function renderDonorCardPublic(d) {
    const lastDate = d.lastDonateDate ? new Date(d.lastDonateDate).toLocaleDateString() : '-';
const contactDesktop = d.isPhoneHidden
? `<a href="#contact" class="flex items-center gap-1 text-red-700 hover:text-red-800 transition-colors">
    <i class="fa-solid fa-circle-info text-red-500"></i>
    <span class="text-xs font-semibold no-underline">${d.publicComment || 'Contact Admin'}</span>
   </a>`
        : `<div class="flex items-center gap-1">
                <i class="fa-solid fa-phone text-red-500"></i>
                <span class="font-bold">Contact:</span>
                <a class="text-xs text-gray-600 underline" href="tel:${d.phone}">${d.phone}</a>
           </div>`;

    const contactMobileRow = d.isPhoneHidden
        ? `<div class="info-row sm:hidden">
                <i class="icon fa-solid fa-circle-info text-red-500"></i>
                <div class="info-text">
                    <a href="#contact" class="value text-red-700 font-semibold hover:text-red-800 transition-colors">${d.publicComment || 'Contact Admin'}</a>
                </div>
           </div>`
        : `<div class="info-row sm:hidden">
                <i class="icon fa-solid fa-phone text-red-500"></i>
                <div class="info-text">
                    <a class="value font-semibold tracking-wide text-gray-700" href="tel:${d.phone}">${d.phone}</a>
                </div>
           </div>`;

    return `
        <div class="donor-card float-in bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between">
            <div class="flex-1 min-w-0 mb-2 sm:mb-0">
                <div class="font-bold text-red-700 truncate">${d.fullName}</div>
                <div class="info-stack sm:hidden">
                    <div class="info-row">
                        <i class="icon fa-solid fa-droplet text-red-500"></i>
                        <div class="info-text">
                            <span class="label">Blood Group:</span>
                            <span class="value">${d.bloodGroup}</span>
                        </div>
                    </div>
                    <div class="info-row sm:hidden">
                        <i class="icon fa-solid fa-calendar-day text-red-500"></i>
                        <div class="info-text">
                            <span class="label">Last Donated:</span>
                            <span class="value">${lastDate}</span>
                        </div>
                    </div>
                    <div class="info-row">
                        <i class="icon fa-solid fa-location-dot text-red-500"></i>
                        <div class="info-text">
                            <span class="label">Current Location:</span>
                            <span class="value">${d.location || '—'}</span>
                        </div>
                    </div>
                    ${contactMobileRow}
                </div>
                <div class="hidden sm:flex sm:flex-col text-xs text-gray-600 gap-1 mt-1">
                    <div class="flex items-center gap-1">
                        <i class="fa-solid fa-droplet text-red-500"></i>
                        <span class="font-bold">Blood Group:</span>
                        <span>${d.bloodGroup}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <i class="fa-solid fa-location-dot text-red-500"></i>
                        <span class="font-bold">Current Location:</span>
                        <span>${d.location || '—'}</span>
                    </div>
                </div>
            </div>
            <div class="flex-shrink-0 hidden sm:flex flex-col items-start md:items-end justify-end text-xs text-gray-500 mt-2 sm:mt-0 whitespace-nowrap">
                <div class="flex items-center gap-1">
                    <i class="fa-solid fa-calendar-day text-red-500"></i>
                    <span class="font-bold">Last Donated:</span>
                    <span>${lastDate}</span>
                </div>
                ${contactDesktop}
            </div>
        </div>
    `;
}

function renderDonorCardAdmin(d) {
    const lastDate = d.lastDonateDate ? new Date(d.lastDonateDate).toLocaleDateString() : '-';
    const phone = d.phone || '-';
    return `
        <div class="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between border-l-4 border-red-600">
            <div class="flex-1 min-w-0 mb-2 sm:mb-0">
                <div class="font-bold text-red-700 truncate">${d.fullName}</div>
                <div class="text-xs text-gray-600 mt-1"><span class="font-bold">ID:</span> <span>${d.id}</span></div>
                <div class="text-xs text-gray-600"><span class="font-bold">Email:</span> <span>${d.email}</span></div>
                <div class="text-xs text-gray-600"><span class="font-bold">Blood Group:</span> <span>${d.bloodGroup}</span></div>
                <div class="text-xs text-gray-600"><span class="font-bold">Location:</span> <span>${d.location || '-'}</span></div>
                <div class="text-xs text-gray-600"><span class="font-bold">Phone:</span> <span>${phone}</span></div>
                <div class="text-xs text-gray-600"><span class="font-bold">Last Donated:</span> <span>${lastDate}</span></div>
            </div>
            <div class="flex-shrink-0 mt-4 sm:mt-0 flex gap-2">
                <button data-member-id="${d.id}" class="edit-member-btn px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">Edit</button>
                <button data-member-id="${d.id}" class="delete-member-btn px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
        </div>
    `;
}

function setSearchLoading(isLoading) {
    if (!searchLoaderEl) return;
    if (isLoading) {
        searchLoaderEl.classList.remove('hidden');
        searchLoaderEl.setAttribute('aria-hidden', 'false');
    } else {
        searchLoaderEl.classList.add('hidden');
        searchLoaderEl.setAttribute('aria-hidden', 'true');
    }
}

function setRecentLoading(isLoading) {
    recentLoaderState = !!isLoading;
    if (!recentLoaderEl) return;
    if (isLoading) {
        recentLoaderEl.classList.remove('hidden');
        recentLoaderEl.setAttribute('aria-hidden', 'false');
    } else {
        recentLoaderEl.classList.add('hidden');
        recentLoaderEl.setAttribute('aria-hidden', 'true');
    }
}

if (!recentLoaderEl) {
    recentLoaderEl = document.getElementById('recent-loading');
    if (recentLoaderEl) {
        setRecentLoading(recentLoaderState);
    }
}

function renderSearchResults(filteredDonors) {
    const searchResults = document.getElementById('search-results');
    if (!searchResults) return;
    if (filteredDonors.length === 0) {
        searchResults.innerHTML = '<div class="text-gray-500 italic">No donors found.</div>';
    } else {
        const header = `<div class="text-sm text-gray-600 mb-2">Found <span class="font-bold text-red-700">${filteredDonors.length}</span> donor(s)</div>`;
        searchResults.innerHTML = header + filteredDonors.map(renderDonorCardPublic).join('');
        if (window.registerFloatEls) window.registerFloatEls(searchResults);
    }
    setSearchLoading(false);
}

function renderAdminMembersList() {
    const membersListDiv = document.getElementById('admin-members-list');
    if (!membersListDiv) return;
    if (!donorsList.length) {
        membersListDiv.innerHTML = `
            <div class="rounded-lg border border-dashed border-red-200 bg-red-50/40 p-6 text-center text-sm text-red-600">
                No member records found yet. Once donors register, they'll appear here automatically.
            </div>
        `;
        return;
    }

    membersListDiv.innerHTML = donorsList.map(renderDonorCardAdmin).join('');

    membersListDiv.querySelectorAll('.edit-member-btn').forEach(button => {
        button.addEventListener('click', (ev) => {
            const memberId = ev.target.dataset.memberId;
            const memberData = donorsList.find(d => d.id === memberId);
            if (memberData) {
                document.getElementById('admin-member-id').value = memberData.id;
                document.getElementById('admin-member-fullname').value = memberData.fullName || '';
                document.getElementById('admin-member-phone').value = memberData.phone || '';
                document.getElementById('admin-member-bloodGroup').value = memberData.bloodGroup || '';
                document.getElementById('admin-member-location').value = memberData.location || '';
                document.getElementById('admin-member-lastDonateDate').value = memberData.lastDonateDate || '';
                document.getElementById('admin-member-hide-phone').checked = memberData.isPhoneHidden || false;
                document.getElementById('admin-member-comment').value = memberData.publicComment || '';
                document.getElementById('admin-member-form').scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    membersListDiv.querySelectorAll('.delete-member-btn').forEach(button => {
        button.addEventListener('click', (ev) => {
            const memberId = ev.target.dataset.memberId;
            const memberData = donorsList.find(d => d.id === memberId);
            if (memberId && memberData) {
                deleteMember(memberId);
            }
        });
    });
}

function renderAdminEventsList() {
    const eventsListDiv = document.getElementById('admin-events-list');
    if (!eventsListDiv) return;
    eventsListDiv.innerHTML = eventsList.map(e => `
        <div class="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
            <div class="flex-1 min-w-0">
                <div class="font-bold text-red-700 truncate">${e.title}</div>
                <div class="text-sm text-gray-600">${e.date} at ${e.time}</div>
            </div>
            <div class="flex-shrink-0 flex gap-2">
                <button data-event-id="${e.id}" class="edit-event-btn px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">Edit</button>
                <button data-event-id="${e.id}" class="delete-event-btn px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
        </div>
    `).join('');

    eventsListDiv.querySelectorAll('.edit-event-btn').forEach(button => {
        button.addEventListener('click', (ev) => {
            const eventId = ev.target.dataset.eventId;
            const eventData = eventsList.find(e => e.id === eventId);
            if (eventData) {
                document.getElementById('admin-event-id').value = eventData.id;
                document.getElementById('event-title').value = eventData.title;
                document.getElementById('event-date').value = eventData.date;
                document.getElementById('event-time').value = eventData.time;
                document.getElementById('event-location').value = eventData.location;
                document.getElementById('event-description').value = eventData.description;
            }
        });
    });
    eventsListDiv.querySelectorAll('.delete-event-btn').forEach(button => {
        button.addEventListener('click', (ev) => {
            const eventId = ev.target.dataset.eventId;
            if (eventId) {
                deleteEvent(eventId);
            }
        });
    });
}

function clearAdminEventForm() {
    document.getElementById('admin-event-form').reset();
    document.getElementById('admin-event-id').value = '';
}

function clearAdminRecentDonorForm() {
    const form = document.getElementById('admin-recent-donor-form');
    if (!form) return;
    form.reset();
}

function clearAdminMemberForm() {
    document.getElementById('admin-member-form').reset();
    document.getElementById('admin-member-id').value = '';
}

function renderRecentDonorsCarousel(donors) {
    const carouselInner = document.querySelector('#recentDonorCarousel .carousel-inner');
    const carouselIndicators = document.querySelector('#recentDonorCarousel .carousel-indicators');
    if (!carouselInner || !carouselIndicators) return;
    carouselInner.innerHTML = '';
    carouselIndicators.innerHTML = '';
    if (donors.length === 0) {
        carouselInner.innerHTML = '<div class="text-center p-5">No recent donations to show.</div>';
        return;
    }
    donors.forEach((d, index) => {
        const donationDate = d.date ? new Date(d.date).toLocaleDateString() : '—';
        const donorName = d.name || 'Anonymous Donor';
        const locationLabel = d.location || '—';
        const department = d.department || '—';
        const batch = d.batch || '—';
        const age = d.age ? d.age : '—';
        const weight = d.weight ? `${d.weight} kg` : '—';
        const bloodGroup = d.bloodGroup || '—';
        const initials = donorName
            .split(/\s+/)
            .filter(Boolean)
            .map(part => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'BD';
        const locationMessage = d.location ? ` in <span class="recent-card__message-spot">${locationLabel}</span>` : '';
        const itemClass = index === 0 ? 'carousel-item active' : 'carousel-item';
        const carouselItemHTML = `
            <div class="${itemClass}">
                <article class="recent-card mx-auto max-w-2xl w-full float-in">
                    <span class="recent-card__halo" aria-hidden="true"></span>
                    <div class="recent-card__chip">
                        <i class="fa-solid fa-hand-holding-droplet" aria-hidden="true"></i>
                        Recent Donation
                    </div>
                    <div class="recent-card__summary">
                        <div class="recent-card__avatar" aria-hidden="true">${initials}</div>
                        <div class="recent-card__summary-copy">
                            <p class="recent-card__headline">A huge thank you to <span>${donorName}</span>.</p>
                            <p class="recent-card__date">Donated on <span>${donationDate}</span></p>
                        </div>
                    </div>
                    <p class="recent-card__message">Your generosity is already helping patients${locationMessage} receive life-saving support faster.</p>
                    <div class="recent-card__divider" aria-hidden="true"></div>
                    <div class="recent-card__stats">
                        <div class="recent-card__stat recent-card__stat--accent">
                            <span class="recent-card__stat-label"><i class="fa-solid fa-droplet" aria-hidden="true"></i>Blood Group</span>
                            <span class="recent-card__stat-value">${bloodGroup}</span>
                        </div>
                        <div class="recent-card__stat recent-card__stat--wide">
                            <span class="recent-card__stat-label"><i class="fa-solid fa-location-dot" aria-hidden="true"></i>Location</span>
                            <span class="recent-card__stat-value">${locationLabel}</span>
                        </div>
                        <div class="recent-card__stat">
                            <span class="recent-card__stat-label"><i class="fa-solid fa-building-columns" aria-hidden="true"></i>Department</span>
                            <span class="recent-card__stat-value">${department}</span>
                        </div>
                        <div class="recent-card__stat">
                            <span class="recent-card__stat-label"><i class="fa-solid fa-layer-group" aria-hidden="true"></i>Batch</span>
                            <span class="recent-card__stat-value">${batch}</span>
                        </div>
                        <div class="recent-card__stat">
                            <span class="recent-card__stat-label"><i class="fa-solid fa-user" aria-hidden="true"></i>Age</span>
                            <span class="recent-card__stat-value">${age}</span>
                        </div>
                        <div class="recent-card__stat">
                            <span class="recent-card__stat-label"><i class="fa-solid fa-weight-scale" aria-hidden="true"></i>Weight</span>
                            <span class="recent-card__stat-value">${weight}</span>
                        </div>
                    </div>
                </article>
            </div>
        `;
        carouselInner.innerHTML += carouselItemHTML;
        const indicatorClass = index === 0 ? 'active' : '';
        const indicatorHTML = `<li data-target="#recentDonorCarousel" data-slide-to="${index}" class="${indicatorClass}"></li>`;
        carouselIndicators.innerHTML += indicatorHTML;
    });
}

const donorsRef = ref(database, 'donors');
onValue(donorsRef, (snapshot) => {
    const data = snapshot.val();
    donorsList = [];
    if (data && typeof data === 'object') {
        for (let key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                donorsList.push({
                    id: key,
                    ...data[key]
                });
            }
        }
    }
    console.debug('Loaded donors from Firebase:', donorsList.length);
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        const blood = document.getElementById('search-blood')?.value;
        const eligibleOnly = document.getElementById('eligible-only')?.checked;
        const resultsEl = document.getElementById('search-results');
        if (blood === 'select') {
            if (resultsEl) resultsEl.innerHTML = '';
            setSearchLoading(false);
        } else {
            let filtered = donorsList;
            if (blood && blood !== 'all' && blood !== 'select') {
                filtered = filtered.filter(d => d.bloodGroup === blood);
            }
            if (eligibleOnly) {
                const isEligible = (lastDonationDate) => {
                    if (!lastDonationDate) return true;
                    const today = new Date();
                    const lastDonation = new Date(lastDonationDate);
                    const threeMonthsAgo = new Date(new Date().setMonth(today.getMonth() - 3));
                    return lastDonation <= threeMonthsAgo;
                };
                filtered = filtered.filter(d => isEligible(d.lastDonateDate));
            }
            renderSearchResults(filtered);
        }
    }
    renderAdminMembersList();
    refreshDashboardCharts();
    setCountTarget('donor-count', donorsList.length);
}, (error) => {
    console.error("Failed to load donors: ", error);
});

const eventsRef = ref(database, 'events');
onValue(eventsRef, (snapshot) => {
    const data = snapshot.val();
    eventsList = [];
    if (data && typeof data === 'object') {
        for (let key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                eventsList.push({
                    id: key,
                    ...data[key]
                });
            }
        }
    }
    const publicEventsList = document.getElementById('public-events-list');
    if (publicEventsList) {
        publicEventsList.innerHTML = eventsList.map((e, idx) => {
            const parts = getDateParts(e.date);
            const accents = [
                {
                    card: 'accent-rose tint-rose',
                    month: 'text-red-700',
                    btn: 'bg-red-600 hover:bg-red-700'
                },
                {
                    card: 'accent-amber tint-amber',
                    month: 'text-amber-600',
                    btn: 'bg-amber-500 hover:bg-amber-600'
                },
                {
                    card: 'accent-emerald tint-emerald',
                    month: 'text-emerald-600',
                    btn: 'bg-emerald-600 hover:bg-emerald-700'
                },
                {
                    card: 'accent-indigo tint-indigo',
                    month: 'text-indigo-600',
                    btn: 'bg-indigo-600 hover:bg-indigo-700'
                },
                {
                    card: 'accent-sky tint-sky',
                    month: 'text-sky-600',
                    btn: 'bg-sky-600 hover:bg-sky-700'
                },
            ];
            const a = accents[idx % accents.length];
            return `
                <article class="how-card ${a.card} bg-white rounded-xl shadow-lg p-4 transform transition hover:scale-105 float-in flex gap-4 items-center flex-col sm:flex-row text-center sm:text-left">
                    <div class="flex-shrink-0 w-full sm:w-20">
                        <div class="text-sm font-bold ${a.month}">${parts.m}</div>
                        <div class="text-2xl font-extrabold">${parts.d}</div>
                        <div class="text-xs text-gray-500">${parts.y}</div>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-bold">${e.title || ''}</h3>
                        <p class="text-sm text-gray-600">${e.location || ''} • ${e.time || ''}</p>
                        <p class="mt-2 text-gray-700">${e.description || ''}</p>
                        <div class="mt-3 flex gap-2 justify-center sm:justify-start">
                            <a href="#" class="px-4 py-2 ${a.btn} text-white rounded-md inline-flex items-center gap-2">
                                <i class="fa-solid fa-calendar-check"></i>
                                <span>Register</span>
                            </a>
                        </div>
                    </div>
                </article>
                `;
        }).join('');
        if (window.registerFloatEls) window.registerFloatEls(publicEventsList);
    }
    if (currentUserRole === 'admin') {
        renderAdminEventsList();
    }
    setCountTarget('event-count', eventsList.length);
}, (error) => {
    console.error("Failed to load events: ", error);
});

const statsRef = ref(database, 'stats');
onValue(statsRef, (snapshot) => {
    const statsData = snapshot.val();
    if (statsData && statsData.livesHelped != null) {
        setCountTarget('lives-helped-count', statsData.livesHelped);
    }
}, (error) => {
    console.error("Failed to load stats: ", error);
});

const recentDonationsRef = ref(database, 'recentDonations');
onValue(recentDonationsRef, (snapshot) => {
    const data = snapshot.val();
    const recentDonors = [];
    if (data) {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                recentDonors.push({ id: key, ...data[key] });
            }
        }
    }
    // Sort by date (latest first) when available
    recentDonors.sort((a, b) => {
        const ad = a.date ? new Date(a.date).getTime() : 0;
        const bd = b.date ? new Date(b.date).getTime() : 0;
        return bd - ad;
    });
    recentDonationsList = recentDonors;
    renderRecentDonorsCarousel(recentDonors);
    refreshDashboardCharts();
    setRecentLoading(false);
}, (error) => {
    console.error("Failed to load recent donations: ", error);
    setRecentLoading(false);
});

function updateLoginButtonState() {
    const loginBtn = document.getElementById('login-btn');
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const profileUserId = document.getElementById('profile-userId');
    const adminPanel = document.getElementById('admin-panel');
    const adminBadge = document.getElementById('admin-badge');
    const adminNavLink = document.getElementById('admin-nav-link');
    const adminMobileLink = document.getElementById('admin-mobile-link');
    const joinLink = document.getElementById('nav-join-link');
    const joinMobileLink = document.getElementById('mobile-join-link');
    const howLink = document.getElementById('nav-how-link');
    const howMobileLink = document.getElementById('mobile-how-link');
    const contactLink = document.getElementById('nav-contact-link');
    const contactMobileLink = document.getElementById('mobile-contact-link');
    if (!loginBtn || !mobileLoginBtn || !adminPanel) return;
    if (currentUser) {
        loginBtn.innerHTML = '<i class="fa-solid fa-user" aria-hidden="true"></i><span class="sr-only">Profile</span>';
        loginBtn.setAttribute('aria-label', 'Profile');
        loginBtn.setAttribute('title', 'Profile');
        loginBtn.dataset.state = 'loggedin';
        mobileLoginBtn.innerHTML = '<i class="fa-solid fa-user" aria-hidden="true"></i><span class="sr-only">Profile</span>';
        mobileLoginBtn.setAttribute('aria-label', 'Profile');
        mobileLoginBtn.setAttribute('title', 'Profile');
        if (profileUserId) profileUserId.textContent = `User ID: ${currentUser.uid}`;
        const userRef = ref(database, `donors/${currentUser.uid}/role`);
        onValue(userRef, (snapshot) => {
            currentUserRole = snapshot.val() || 'member';
            if (currentUserRole === 'admin') {
                adminPanel.classList.remove('hidden');
                document.body.classList.add('admin-mode');
                if (adminBadge) {
                    adminBadge.classList.remove('hidden');
                    adminBadge.classList.add('inline-flex');
                }
                adminNavLink && adminNavLink.classList.remove('hidden');
                adminMobileLink && adminMobileLink.classList.remove('hidden');
                joinLink && joinLink.classList.add('hidden');
                joinMobileLink && joinMobileLink.classList.add('hidden');
                howLink && howLink.classList.add('hidden');
                howMobileLink && howMobileLink.classList.add('hidden');
                contactLink && contactLink.classList.add('hidden');
                contactMobileLink && contactMobileLink.classList.add('hidden');
                renderAdminMembersList();
                renderAdminEventsList();
            } else {
                adminPanel.classList.add('hidden');
                document.body.classList.remove('admin-mode');
                if (adminBadge) {
                    adminBadge.classList.add('hidden');
                    adminBadge.classList.remove('inline-flex');
                }
                adminNavLink && adminNavLink.classList.add('hidden');
                adminMobileLink && adminMobileLink.classList.add('hidden');
                joinLink && joinLink.classList.remove('hidden');
                joinMobileLink && joinMobileLink.classList.remove('hidden');
                howLink && howLink.classList.remove('hidden');
                howMobileLink && howMobileLink.classList.remove('hidden');
                contactLink && contactLink.classList.remove('hidden');
                contactMobileLink && contactMobileLink.classList.remove('hidden');
            }
        }, {
            onlyOnce: true
        });
    } else {
        loginBtn.textContent = 'Login';
        loginBtn.dataset.state = 'loggedout';
        mobileLoginBtn.textContent = 'Login';
        if (profileUserId) profileUserId.textContent = '';
        adminPanel.classList.add('hidden');
        document.body.classList.remove('admin-mode');
        adminBadge && adminBadge.classList.add('hidden');
        adminNavLink && adminNavLink.classList.add('hidden');
        adminMobileLink && adminMobileLink.classList.add('hidden');
        joinLink && joinLink.classList.remove('hidden');
        joinMobileLink && joinMobileLink.classList.remove('hidden');
        howLink && howLink.classList.remove('hidden');
        howMobileLink && howMobileLink.classList.remove('hidden');
        contactLink && contactLink.classList.remove('hidden');
        contactMobileLink && contactMobileLink.classList.remove('hidden');
    }
}

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateLoginButtonState();
});

function saveEvent(eventData) {
    if (!currentUser || currentUserRole !== 'admin') {
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
        const newEventRef = push(eventsRef);
        set(newEventRef, eventData)
            .then(() => showModalMessage('success-modal', 'New event created successfully!', 'Success'))
            .catch(error => showModalMessage('success-modal', `Failed to create event: ${error.message}`, 'Error'));
    }
    clearAdminEventForm();
}

function deleteEvent(eventId) {
    if (!currentUser || currentUserRole !== 'admin') {
        showModalMessage('success-modal', 'You do not have permission to perform this action.', 'Permission Denied');
        return;
    }
    const modal = document.getElementById('delete-confirm-modal');
    const titleEl = modal.querySelector('h3');
    const messageEl = modal.querySelector('p');
    attachConfirmHandler(() => {
        remove(ref(database, 'events/' + eventId))
            .then(() => {
                closeModal(modal);
                showModalMessage('success-modal', 'Event deleted successfully!', 'Success');
            })
            .catch(error => {
                closeModal(modal);
                showModalMessage('success-modal', `Failed to delete event: ${error.message}`, 'Error');
            });
    }, {
        title: 'Delete Event',
        message: 'Deleting this event is permanent and cannot be undone.'
    });
}

function deleteMember(memberId) {
    if (!currentUser || currentUserRole !== 'admin') {
        showModalMessage('success-modal', 'You do not have permission to perform this action.', 'Permission Denied');
        return;
    }
    const modal = document.getElementById('delete-confirm-modal');
    const titleEl = modal.querySelector('h3');
    const messageEl = modal.querySelector('p');
    attachConfirmHandler(() => {
        remove(ref(database, 'donors/' + memberId))
            .then(() => {
                closeModal(modal);
                showModalMessage('success-modal', 'Member profile deleted successfully!', 'Success');
            })
            .catch(error => {
                closeModal(modal);
                showModalMessage('success-modal', `Failed to delete member data: ${error.message}`, 'Error');
            });
    }, {
        title: 'Delete Member',
        message: 'Deleting this member profile is permanent and cannot be undone.'
    });
}

window.onload = function () {
    const successModal = document.getElementById('success-modal');
    const successClose = document.getElementById('success-close');
    successClose?.addEventListener('click', () => closeModal(successModal));
    successModal?.querySelector('.absolute.inset-0')?.addEventListener('click', () => closeModal(successModal));

    const loginModal = document.getElementById('login-modal');
    const loginCancel = document.getElementById('login-cancel');
    loginCancel?.addEventListener('click', () => closeModal(loginModal));
    loginModal?.querySelector('.absolute.inset-0')?.addEventListener('click', () => closeModal(loginModal));

    const profileModal = document.getElementById('profile-modal');
    const pfClose = document.getElementById('pf-close');
    const pfLogout = document.getElementById('pf-logout');
    const pfDelete = document.getElementById('pf-delete');
    const profileForm = document.getElementById('profile-form');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const deleteCancelBtn = document.getElementById('delete-cancel');
    const deleteConfirmBtn = document.getElementById('delete-confirm');

    deleteCancelBtn?.addEventListener('click', () => closeModal(deleteConfirmModal));
    deleteConfirmModal?.querySelector('.absolute.inset-0')?.addEventListener('click', () => closeModal(deleteConfirmModal));

    pfClose?.addEventListener('click', () => closeModal(profileModal));
    profileModal?.querySelector('.absolute.inset-0')?.addEventListener('click', () => closeModal(profileModal));

    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    function setMenuOpen(open) {
        if (!mobileMenu || !menuToggle) return;
        mobileMenu.classList.toggle('hidden', !open);
        menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    menuToggle?.addEventListener('click', (ev) => {
        if (!mobileMenu) return;
        const open = mobileMenu.classList.contains('hidden');
        setMenuOpen(open);
        ev.stopPropagation();
    });

    mobileMenu?.querySelectorAll('a, button').forEach(a => {
        a.addEventListener('click', () => setMenuOpen(false));
    });

    document.addEventListener('click', (e) => {
        if (!mobileMenu || !menuToggle) return;
        const isOpen = !mobileMenu.classList.contains('hidden');
        const clickedInside = mobileMenu.contains(e.target) || menuToggle.contains(e.target);
        if (isOpen && !clickedInside) setMenuOpen(false);
    });

    const joinForm = document.getElementById('join-form');
    const joinClear = document.getElementById('join-clear');

    joinForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(joinForm);
        const email = fd.get('email')?.toString().trim();
        const password = fd.get('password')?.toString();
        const confirm = fd.get('confirmPassword')?.toString();
        const gender = fd.get('gender')?.toString();
        const isPhoneHidden = gender === 'Female';
        const donorData = {
            fullName: fd.get('fullName')?.toString().trim(),
            phone: fd.get('phone')?.toString().trim(),
            bloodGroup: fd.get('bloodGroup')?.toString().trim(),
            location: fd.get('location')?.toString().trim(),
            lastDonateDate: fd.get('lastDonateDate')?.toString() || '',
            role: email === ADMIN_EMAIL ? 'admin' : 'member',
            gender: gender || 'Other',
            isPhoneHidden: isPhoneHidden
        };

        if (!donorData.fullName || !email || !donorData.phone || !donorData.bloodGroup || !donorData.location || !password || !confirm) {
            showModalMessage(successModal, 'Please fill all required fields.', 'Error');
            return;
        }
        if (password.length < 6) {
            showModalMessage(successModal, 'Password must be at least 6 characters.', 'Error');
            return;
        }
        if (password !== confirm) {
            showModalMessage(successModal, 'Passwords do not match.', 'Error');
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                const donorRef = ref(database, 'donors/' + user.uid);
                set(donorRef, {
                    ...donorData,
                    email: email,
                    createdAt: new Date().toISOString()
                }).then(() => {
                    showModalMessage('success-modal', `Welcome, ${donorData.fullName}! Your donor profile was created successfully.`, 'Success');
                    joinForm.reset();
                }).catch((error) => {
                    console.error("Error saving donor data:", error);
                    showModalMessage('success-modal', 'An error occurred while saving your profile data.', 'Error');
                });
            })
            .catch((error) => {
                const errorMessage = error.message;
                showModalMessage('success-modal', `Signup failed: ${errorMessage}`, 'Error');
            });
    });

    joinClear?.addEventListener('click', () => {
        joinForm.reset();
    });

    const searchForm = document.getElementById('search-form');
    const searchBlood = document.getElementById('search-blood');
    const eligibleOnlyCheckbox = document.getElementById('eligible-only');
    const searchResults = document.getElementById('search-results');
    searchLoaderEl = document.getElementById('search-loading');
    if (searchLoaderEl) {
        setSearchLoading(false);
    }
    recentLoaderEl = document.getElementById('recent-loading');
    if (recentLoaderEl) {
        setRecentLoading(recentLoaderState);
    }

    function isDonorEligible(lastDonationDate) {
        if (!lastDonationDate) return true;
        const today = new Date();
        const lastDonation = new Date(lastDonationDate);
        const threeMonthsAgo = new Date(new Date().setMonth(today.getMonth() - 3));
        return lastDonation <= threeMonthsAgo;
    }

    function runSearch() {
        if (!searchResults) return;
        const blood = searchBlood?.value;
        const showEligibleOnly = eligibleOnlyCheckbox?.checked;
        if (searchRunTimeout) {
            clearTimeout(searchRunTimeout);
            searchRunTimeout = null;
        }
        if (blood === 'select') {
            searchResults.innerHTML = '<div class="text-gray-500 italic">No results yet. Perform a search to display donor entries here.</div>';
            setSearchLoading(false);
            return;
        }
        setSearchLoading(true);
        searchResults.innerHTML = '';
        searchRunTimeout = setTimeout(() => {
            let filtered = donorsList;
            if (blood && blood !== 'all' && blood !== 'select') {
                filtered = filtered.filter(d => d.bloodGroup === blood);
            }
            if (showEligibleOnly) {
                filtered = filtered.filter(d => isDonorEligible(d.lastDonateDate));
            }
            renderSearchResults(filtered);
            searchRunTimeout = null;
        }, 220);
    }

    // Submit filters locally; no extra DB read
   searchForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        runSearch();
    });

    // Auto-refresh when filters change
    eligibleOnlyCheckbox?.addEventListener('change', runSearch);
    searchBlood?.addEventListener('change', runSearch);

    const loginBtn = document.getElementById('login-btn');
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const loginForm = document.getElementById('login-form');

    function handleLoginClick() {
        if (currentUser) {
            const userRef = ref(database, `donors/${currentUser.uid}`);
            onValue(userRef, (snapshot) => {
                const userData = snapshot.val() || {};
                if (profileModal) {
                    document.getElementById('profile-fullName').value = userData.fullName || '';
                    document.getElementById('profile-email').value = userData.email || currentUser.email || '';
                    document.getElementById('profile-phone').value = userData.phone || '';
                    document.getElementById('profile-bloodGroup').value = userData.bloodGroup || '';
                    document.getElementById('profile-location').value = userData.location || '';
                    document.getElementById('profile-lastDonateDate').value = userData.lastDonateDate || '';
                    document.getElementById('profile-notes').value = userData.notes || '';
                    document.getElementById('profile-role').value = userData.role || 'member';
                    openModal(profileModal);
                }
            }, {
                onlyOnce: true
            });
        } else {
            openModal(loginModal);
        }
    }

    loginBtn?.addEventListener('click', handleLoginClick);
    mobileLoginBtn?.addEventListener('click', () => {
        closeModal(mobileMenu);
        handleLoginClick();
    });

    loginForm?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const email = document.getElementById('login-email')?.value?.trim();
        const password = document.getElementById('login-password')?.value;
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                currentUser = userCredential.user;
                updateLoginButtonState();
                closeModal(loginModal);
                handleLoginClick();
            })
            .catch((error) => {
                const errorMessage = error.message;
                showModalMessage('success-modal', `Login failed: ${errorMessage}`, 'Login Failed');
            });
    });

    const forgotPasswordLink = document.getElementById('forgot-password-link');
    forgotPasswordLink?.addEventListener('click', (ev) => {
        ev.preventDefault();
        const emailInput = document.getElementById('login-email');
        const email = emailInput?.value?.trim();
        if (!email) {
            showModalMessage('success-modal', 'Please enter your email to reset the password.', 'Email Required');
            return;
        }
        sendPasswordResetEmail(auth, email)
            .then(() => {
                showModalMessage('success-modal', `A password reset link has been sent to ${email}. Please check your inbox.`, 'Password Reset Sent');
                closeModal(loginModal);
            })
            .catch((error) => {
                const errorMessage = error.message;
                showModalMessage('success-modal', `Failed to send reset email: ${errorMessage}`, 'Password Reset Error');
            });
    });

    // Show/hide password toggle in login modal
    const pwToggle = document.getElementById('toggle-password');
    const pwInput = document.getElementById('login-password');
    pwToggle?.addEventListener('click', () => {
        if (!pwInput) return;
        const isHidden = pwInput.getAttribute('type') === 'password';
        pwInput.setAttribute('type', isHidden ? 'text' : 'password');
        pwToggle.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
        pwToggle.setAttribute('title', isHidden ? 'Hide password' : 'Show password');
        const icon = pwToggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        }
    });

    const adminEventForm = document.getElementById('admin-event-form');
    if (adminEventForm) {
        adminEventForm.addEventListener('submit', (ev) => {
            ev.preventDefault();
            const fd = new FormData(adminEventForm);
            const eventData = {
                title: fd.get('title'),
                date: fd.get('date'),
                time: fd.get('time'),
                location: fd.get('location'),
                description: fd.get('description'),
                id: fd.get('id')
            };
            saveEvent(eventData);
        });
    }

    const clearEventBtn = document.getElementById('clear-event-btn');
    if (clearEventBtn) {
        clearEventBtn.addEventListener('click', clearAdminEventForm);
    }

    const adminRecentDonorForm = document.getElementById('admin-recent-donor-form');
    if (adminRecentDonorForm) {
        adminRecentDonorForm.addEventListener('submit', (ev) => {
            ev.preventDefault();
            const fd = new FormData(adminRecentDonorForm);
            const donorData = {
                name: fd.get('donor-name'),
                bloodGroup: fd.get('donor-blood-group'),
                location: fd.get('donor-location'),
                department: fd.get('donor-department'),
                batch: fd.get('donor-batch'),
                age: fd.get('donor-age'),
                weight: fd.get('donor-weight'),
                date: fd.get('donation-date')
            };
            if (!donorData.name || !donorData.bloodGroup || !donorData.location || !donorData.date) {
                showModalMessage('success-modal', 'Please fill all required fields: Donor Name, Blood Group, Location, and Donation Date.', 'Error');
                return;
            }
            onValue(statsRef, (snapshot) => {
                const statsData = snapshot.val();
                const currentLivesHelped = (statsData && statsData.livesHelped) ? Number(statsData.livesHelped) : 0;
                const newLivesHelped = currentLivesHelped + 1;
                const newDonationRef = push(recentDonationsRef);
                const updates = {};
                updates[`/recentDonations/${newDonationRef.key}`] = donorData;
                updates['/stats/livesHelped'] = newLivesHelped;
                update(ref(database), updates)
                    .then(() => {
                        showModalMessage('success-modal', 'Recent donor added and lives helped count incremented!', 'Success');
                        clearAdminRecentDonorForm();
                    })
                    .catch(error => showModalMessage('success-modal', `Failed to update data: ${error.message}`, 'Error'));
            }, {
                onlyOnce: true
            });
        });
    }

    const clearRecentDonorBtn = document.getElementById('clear-recent-donor-btn');
    if (clearRecentDonorBtn) {
        clearRecentDonorBtn.addEventListener('click', clearAdminRecentDonorForm);
    }

    const adminMemberForm = document.getElementById('admin-member-form');
    if (adminMemberForm) {
        adminMemberForm.addEventListener('submit', (ev) => {
            ev.preventDefault();
            const fd = new FormData(adminMemberForm);
            const memberId = fd.get('id');
            const updatedData = {
                fullName: fd.get('fullName'),
                phone: fd.get('phone'),
                bloodGroup: fd.get('bloodGroup'),
                location: fd.get('location'),
                lastDonateDate: fd.get('lastDonateDate'),
                isPhoneHidden: fd.get('isPhoneHidden') === 'on',
                publicComment: fd.get('publicComment')
            };
            if (memberId) {
                update(ref(database, 'donors/' + memberId), updatedData)
                    .then(() => {
                        showModalMessage('success-modal', 'Member profile updated successfully!', 'Success');
                        clearAdminMemberForm();
                    })
                    .catch(error => showModalMessage('success-modal', `Failed to update member: ${error.message}`, 'Error'));
            }
        });
    }

    const clearMemberBtn = document.getElementById('clear-member-btn');
    if (clearMemberBtn) {
        clearMemberBtn.addEventListener('click', clearAdminMemberForm);
    }

    profileForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentUser) return;
        const fd = new FormData(profileForm);
        const updatedData = {
            fullName: fd.get('fullName')?.toString().trim(),
            phone: fd.get('phone')?.toString().trim(),
            bloodGroup: fd.get('bloodGroup')?.toString().trim(),
            location: fd.get('location')?.toString().trim(),
            lastDonateDate: fd.get('lastDonateDate')?.toString() || '',
            notes: fd.get('notes')?.toString() || '',
            email: currentUser.email,
            role: fd.get('role')?.toString().trim()
        };
        const userRef = ref(database, 'donors/' + currentUser.uid);
        set(userRef, updatedData)
            .then(() => {
                showModalMessage('success-modal', 'Your profile has been updated successfully!', 'Success');
                closeModal(profileModal);
            })
            .catch((error) => {
                console.error("Error updating profile:", error);
                showModalMessage('success-modal', `Failed to update profile: ${error.message}`, 'Error');
            });
    });

    pfLogout?.addEventListener('click', () => {
        signOut(auth).then(() => {
            closeModal(profileModal);
            showModalMessage('success-modal', 'You have been logged out successfully.', 'Logout Successful');
        }).catch((error) => {
            console.error("Logout failed:", error);
            showModalMessage('success-modal', 'An error occurred during logout.', 'Logout Failed');
        });
    });

    pfDelete?.addEventListener('click', () => {
        if (!currentUser) {
            showModalMessage('success-modal', 'You must be logged in to delete your profile.', 'Error');
            return;
        }

        attachConfirmHandler(() => {
            const user = auth.currentUser;
            if (!user) {
                showModalMessage('success-modal', 'You must be logged in to delete your profile.', 'Error');
                return;
            }
            const donorRef = ref(database, 'donors/' + user.uid);
            remove(donorRef)
                .then(() => deleteUser(user))
                .then(() => {
                    closeModal(document.getElementById('delete-confirm-modal'));
                    closeModal(profileModal);
                    showModalMessage('success-modal', 'Your profile has been deleted successfully.', 'Profile Deleted');
                })
                .catch((error) => {
                    if (error && error.code === 'auth/requires-recent-login') {
                        showModalMessage('success-modal', 'Please log in again to delete your profile.', 'Re-login Required');
                        signOut(auth);
                    } else {
                        console.error("Error deleting profile:", error);
                        showModalMessage('success-modal', `Failed to delete profile: ${error && error.message}`, 'Error');
                    }
                });
        }, {
            title: 'Confirm Delete',
            message: 'Deleting your profile is permanent and cannot be undone.'
        });
    });

    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') {
            [successModal, profileModal, loginModal, deleteConfirmModal].forEach(m => closeModal(m));
        }
    });

    // Back-to-top button functionality with footer awareness
    const backToTopBtn = document.getElementById('back-to-top');
    const footerEl = document.querySelector('footer');

    function updateBackToTopVisibility() {
        if (!backToTopBtn) return;
        const beyond = window.scrollY > 300;
        let footerVisible = false;
        if ('IntersectionObserver' in window && footerEl) {
        }
        else {
            const rect = footerEl?.getBoundingClientRect();
            footerVisible = !!rect && rect.top < window.innerHeight;
        }
        if (beyond && !footerVisible) backToTopBtn.classList.add('show');
        else backToTopBtn?.classList.remove('show');
    }

    window.addEventListener('scroll', updateBackToTopVisibility);
    window.addEventListener('resize', updateBackToTopVisibility);
    updateBackToTopVisibility();

    // Use IntersectionObserver to hide FAB when footer is visible
    if ('IntersectionObserver' in window && footerEl && backToTopBtn) {
        const fabFooterIO = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const footerVisible = entry.isIntersecting && entry.intersectionRatio > 0.01;
                if (footerVisible) backToTopBtn.classList.remove('show');
                else updateBackToTopVisibility();
            });
        }, {
            threshold: [0, 0.01, 0.1]
        });
        fabFooterIO.observe(footerEl);
    }

    backToTopBtn?.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Admin dashboard tabs
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        const tabs = adminPanel.querySelectorAll('.admin-tab');
        const panels = adminPanel.querySelectorAll('[data-panel]');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-tab');
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                panels.forEach(p => {
                    p.classList.toggle('hidden', p.getAttribute('data-panel') !== target);
                });
            });
        });
    }

    // Make Contact navigation fast-smooth (short duration ~250ms)
    const fastScrollTo = (el, duration = 250) => {
        const root = document.documentElement;
        const headerH = parseFloat(getComputedStyle(root).getPropertyValue('--header-height')) || 0;
        const targetY = el.getBoundingClientRect().top + window.pageYOffset - headerH;
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        const start = performance.now();
        const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic
        const step = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const y = startY + distance * ease(p);
            window.scrollTo(0, y);
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    document.querySelectorAll('a[href="#contact"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = document.getElementById('contact');
            if (!target) return;
            e.preventDefault();
            // Close mobile menu quickly if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
            const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReduce) {
                const root = document.documentElement;
                const headerH = parseFloat(getComputedStyle(root).getPropertyValue('--header-height')) || 0;
                const targetY = target.getBoundingClientRect().top + window.pageYOffset - headerH;
                window.scrollTo(0, targetY);
            } else {
                fastScrollTo(target, 160);
            }
            // Update the URL hash without jumping again
            if (history.pushState) {
                history.pushState(null, '', '#contact');
            } else {
                location.hash = '#contact';
            }
        });
    });

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let __floatIO__ = null;
    let __floatIO_lastY = window.scrollY;

    function registerFloatEls(root = document) {
        const els = root.querySelectorAll('.float-in:not([data-float-registered])');
        if (!els.length) return;
        if (reduceMotion) {
            els.forEach(el => {
                el.classList.add('is-visible');
                el.setAttribute('data-float-registered', '1');
            });
            return;
        }
        if ('IntersectionObserver' in window) {
            if (!__floatIO__) {
                __floatIO__ = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        const scrollingDown = window.scrollY >= __floatIO_lastY;
                        if (entry.isIntersecting) {
                            entry.target.classList.remove('is-out-up', 'is-out-down');
                            if (scrollingDown) {
                                entry.target.classList.remove('instant-visible');
                                entry.target.classList.add('is-visible');
                            } else {
                                entry.target.classList.remove('is-visible');
                                entry.target.classList.add('instant-visible');
                            }
                        } else {
                            entry.target.classList.remove('is-visible', 'instant-visible', 'is-out-up', 'is-out-down');
                        }
                    });
                    __floatIO_lastY = window.scrollY;
                }, {
                    threshold: 0.15,
                    rootMargin: '0px 0px -5% 0px'
                });
            }
            els.forEach((el, i) => {
                el.style.setProperty('--delay', `${i * 120}ms`);
                el.setAttribute('data-float-registered', '1');
                __floatIO__.observe(el);
            });
        } else {
            els.forEach(el => {
                el.classList.add('is-visible');
                el.setAttribute('data-float-registered', '1');
            });
        }
    }
    window.registerFloatEls = registerFloatEls;
    registerFloatEls(document);

    const statNums = document.querySelectorAll('.stat-card .num');
    const fmt = (n) => n.toLocaleString();
    const animateCountTo = (el, target, duration = 1200, startOverride = undefined) => {
        const startVal = (startOverride != null) ?
            Number(startOverride) :
            Number(el.textContent.replace(/,/g, '') || '0');
        const start = performance.now();
        const ease = (t) => 1 - Math.pow(1 - t, 3);
        const step = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const val = Math.round(startVal + (target - startVal) * ease(p));
            el.textContent = fmt(val);
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };
    window.__animateCountTo__ = animateCountTo;

    let statsVisible = false;
    let statsWasVisible = false;
    const animateAllStats = () => {
        statNums.forEach(el => {
            const target = Number(el.dataset.countTo || el.textContent || '0');
            animateCountTo(el, target);
        });
    };
    const statsCard = document.querySelector('#donor-count')?.closest('.how-card') || document.querySelector('.stats-grid');
    if ('IntersectionObserver' in window && statsCard) {
        const statsIO = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const nowVisible = entry.isIntersecting && entry.intersectionRatio > 0.30;
                const becameVisible = nowVisible && !statsWasVisible;
                statsVisible = nowVisible;
                window.__statsVisible__ = statsVisible;
                if (becameVisible) {
                    statNums.forEach(el => {
                        const target = Number(el.dataset.countTo || el.textContent || '0');
                        animateCountTo(el, target, 1500, 0);
                    });
                }
                statsWasVisible = nowVisible;
            });
        }, {
            threshold: [0, 0.25, 0.5, 0.75, 1]
        });
        statsIO.observe(statsCard);
    } else if (statsCard) {
        animateAllStats();
    }

    // Flush any pending counter targets that were set before DOM was ready
    if (__pendingCounts__.size) {
        for (const [id, v] of __pendingCounts__) {
            const el = document.getElementById(id);
            if (el) el.dataset.countTo = String(v);
        }
        __pendingCounts__.clear();
    }

    if (searchResults) {
        runSearch();
    }
};
