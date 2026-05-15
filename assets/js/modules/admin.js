import state from './state.js';
import { t } from './language-ui.js';
import {
    sortEventsByDate,
    normalizeDonorId,
    getInitials,
    getTextValue,
    getDonorIdNumber,
    computeDonorReputation
} from './utils.js';
import { openModal, closeModal, showModalMessage, attachConfirmHandler } from './modals.js';

function renderRecentDonationCardAdmin(d) {
    const donationDate = d.date ? (() => { const _d = new Date(d.date + 'T00:00:00'); const _p = n => String(n).padStart(2,'0'); return `${_p(_d.getDate())}/${_p(_d.getMonth()+1)}/${_d.getFullYear()}`; })() : '—';
    const donorName = getTextValue(d.name || d.donorName || d.fullName, 'Unknown');
    const initials = getInitials(donorName, '?');
    const donorId = normalizeDonorId(d.donorId) || d.donorId || '';
    const phone = getTextValue(d.phone, '');
    const contactRow = phone
        ? `<div class="admin-event-card__meta"><span><i class="fa-solid fa-phone"></i> Contact: ${phone}</span></div>`
        : '';
    return `
        <div class="admin-event-card">
            <div class="admin-event-card__date-badge" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
                <span class="admin-event-card__month" style="font-size:0.6rem">${getTextValue(d.bloodGroup, '—')}</span>
                <span class="admin-event-card__day" style="font-size:0.85rem">${initials}</span>
            </div>
            <div class="admin-event-card__body">
                <div class="admin-event-card__title">${donorName}</div>
                <div class="admin-event-card__meta">
                    <span><i class="fa-regular fa-calendar"></i> ${donationDate}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${getTextValue(d.location, '—')}</span>
                </div>
                ${donorId ? `<div class="admin-event-card__meta"><span><i class="fa-solid fa-id-badge"></i> ID: ${donorId}</span></div>` : ''}
                ${contactRow}
                <div class="admin-event-card__meta">
                    <span><i class="fa-solid fa-building-columns"></i> Dept: ${getTextValue(d.department, '—')}</span>
                    <span><i class="fa-solid fa-layer-group"></i> Batch: ${getTextValue(d.batch, '—')}</span>
                    <span><i class="fa-solid fa-user"></i> Age: ${getTextValue(d.age, '—')}</span>
                    <span><i class="fa-solid fa-weight-scale"></i> ${getTextValue(d.weight, '') ? `${getTextValue(d.weight)} kg` : '—'}</span>
                </div>
            </div>
            <div class="admin-event-card__actions">
                <button data-recent-id="${d.id}" class="edit-recent-btn admin-action-btn admin-action-btn--edit" title="Edit"><i class="fa-solid fa-pen-to-square" data-recent-id="${d.id}"></i></button>
                <button data-recent-id="${d.id}" class="delete-recent-btn admin-action-btn admin-action-btn--delete" title="Delete"><i class="fa-solid fa-trash-can" data-recent-id="${d.id}"></i></button>
            </div>
        </div>`;
}

export function renderAdminRecentDonationsList(deleteRecentFn) {
    const listDiv = document.getElementById('admin-recent-donations-list');
    if (!listDiv) return;
    if (!state.recentDonationsList || !state.recentDonationsList.length) {
        listDiv.innerHTML = `<div class="rounded-lg border border-dashed border-red-200 bg-red-50/40 p-6 text-center text-sm text-red-600">No recent donations recorded yet.</div>`;
        return;
    }
    listDiv.innerHTML = state.recentDonationsList.map(renderRecentDonationCardAdmin).join('');
    listDiv.querySelectorAll('.edit-recent-btn').forEach(button => {
        button.addEventListener('click', (ev) => {
            const recentId = ev.target.closest('[data-recent-id]')?.dataset.recentId || ev.target.dataset.recentId;
            const data = state.recentDonationsList.find(d => d.id === recentId);
            if (data) {
                const idField = document.getElementById('admin-recent-donor-id');
                if (idField) idField.value = data.id;
                const donorIdField = document.getElementById('donor-id');
                if (donorIdField) donorIdField.value = normalizeDonorId(data.donorId) || data.donorId || '';
                const nameF = document.getElementById('donor-name'); if (nameF) nameF.value = data.name || '';
                const bgF = document.getElementById('donor-blood-group'); if (bgF) bgF.value = data.bloodGroup || '';
                const locF = document.getElementById('donor-location'); if (locF) locF.value = data.location || '';
                const deptF = document.getElementById('donor-department'); if (deptF) deptF.value = data.department || '';
                const batchF = document.getElementById('donor-batch'); if (batchF) batchF.value = data.batch || '';
                const ageF = document.getElementById('donor-age'); if (ageF) ageF.value = data.age || '';
                const numberF = document.getElementById('donor-number'); if (numberF) numberF.value = data.phone || '';
                const weightF = document.getElementById('donor-weight'); if (weightF) weightF.value = data.weight || '';
                const dateF = document.getElementById('donation-date'); if (dateF) dateF.value = data.date || '';
                document.getElementById('admin-recent-donor-form')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    listDiv.querySelectorAll('.delete-recent-btn').forEach(button => {
        button.addEventListener('click', (ev) => {
            const recentId = ev.target.closest('[data-recent-id]')?.dataset.recentId || ev.target.dataset.recentId;
            if (recentId && deleteRecentFn) deleteRecentFn(recentId);
        });
    });
}

function renderDonorCardAdmin(d) {
    const lastDate = d.lastDonateDate ? (() => { const _d = new Date(d.lastDonateDate + 'T00:00:00'); const _p = n => String(n).padStart(2,'0'); return `${_p(_d.getDate())}/${_p(_d.getMonth()+1)}/${_d.getFullYear()}`; })() : 'Not recorded';
    const donorName = getTextValue(d.fullName || d.name, 'Unknown');
    const phone = getTextValue(d.phone, '—');
    const note = getTextValue(d.notes, '');
    const noteRow = note ? `<span style="color:#dc2626"><i class="fa-solid fa-note-sticky"></i> Additional Notes: ${note}</span>` : '';
    const ageValue = getTextValue(d.age ?? d.lastDonationInfo?.age, '');
    const ageRow = ageValue ? `<span><i class="fa-solid fa-user"></i> Age: ${ageValue}</span>` : '';
    const initials = getInitials(donorName, '?');
    const reputation = computeDonorReputation(d, state.recentDonationsList || []);
    const repBadgeLabel = reputation.badge ? t(reputation.badge.key) : '—';
    const repBadge = reputation.badge
        ? `<span class="donor-badge ${reputation.badge.className}">${reputation.badge.icon} ${repBadgeLabel}</span>`
        : '';
    const isEligible = d.lastDonateDate
        ? (Math.floor((new Date() - new Date(d.lastDonateDate + 'T00:00:00')) / (1000*60*60*24)) >= 90)
        : null;
    const eligibleBadge = isEligible === null ? ''
        : isEligible ? '<span class="admin-member-badge admin-member-badge--eligible"><i class="fa-solid fa-circle-check"></i> Eligible</span>'
        : '<span class="admin-member-badge admin-member-badge--waiting"><i class="fa-solid fa-hourglass-half"></i> Waiting</span>';
    const avatarContent = d.profilePhoto
        ? `<img src="${d.profilePhoto}" alt="${initials}" style="width:100%;height:100%;object-fit:cover;border-radius:14px">`
        : initials;
    const donorId = normalizeDonorId(d.donorId) || d.donorId || '—';
    const isAdminMember = (d.role || 'member') === 'admin';
    const roleBadge = isAdminMember
        ? '<span class="admin-member-badge admin-member-badge--admin"><i class="fa-solid fa-shield-halved"></i> Admin</span>'
        : '<span class="admin-member-badge admin-member-badge--member"><i class="fa-solid fa-user"></i> Member</span>';
    const roleActionButton = isAdminMember
        ? `
                <button data-member-id="${d.id}" class="demote-member-btn admin-action-btn admin-action-btn--demote" title="Make Member">
                    <i class="fa-solid fa-user-minus" data-member-id="${d.id}"></i>
                </button>
        `
        : `
                <button data-member-id="${d.id}" class="promote-member-btn admin-action-btn admin-action-btn--promote" title="Make Admin">
                    <i class="fa-solid fa-user-shield" data-member-id="${d.id}"></i>
                </button>
        `;
    return `
        <div class="admin-member-card">
            <div class="admin-member-card__avatar">${avatarContent}</div>
            <div class="admin-member-card__body">
                <div class="admin-member-card__top">
                    <h4 class="admin-member-card__name">${donorName}</h4>
                    <span class="admin-member-card__blood"><i class="fa-solid fa-droplet"></i> ${getTextValue(d.bloodGroup, '—')}</span>
                    ${eligibleBadge}
                    ${roleBadge}
                    ${repBadge}
                </div>
                <div class="admin-member-card__info">
                    <span><i class="fa-solid fa-envelope"></i> ${getTextValue(d.email, '—')}</span>
                    <span><i class="fa-solid fa-phone"></i> ${phone}</span>
                    <span><i class="fa-solid fa-location-dot"></i> Current Location: ${getTextValue(d.location, '—')}</span>
                    <span><i class="fa-solid fa-building-columns"></i> Department: ${getTextValue(d.department, '—')}</span>
                    <span><i class="fa-solid fa-layer-group"></i> Batch: ${getTextValue(d.batch, '—')}</span>
                    <span><i class="fa-solid fa-calendar-check"></i> Last: ${lastDate}</span>
                    <span><i class="fa-solid fa-medal"></i> ${t('leaderboardReputation')}: ${repBadgeLabel}</span>
                    <span><i class="fa-solid fa-chart-line"></i> ${t('leaderboardScore')}: ${reputation.score}</span>
                    <span><i class="fa-solid fa-hand-holding-droplet"></i> ${t('leaderboardDonations')}: ${reputation.donationCount}</span>
                    ${ageRow}
                    ${noteRow}
                </div>
                <div class="admin-member-card__id">ID: ${donorId}</div>
            </div>
            <div class="admin-member-card__actions">
                ${roleActionButton}
                <button data-member-id="${d.id}" class="edit-member-btn admin-action-btn admin-action-btn--edit" title="Edit">
                    <i class="fa-solid fa-pen-to-square" data-member-id="${d.id}"></i>
                </button>
                <button data-member-id="${d.id}" class="delete-member-btn admin-action-btn admin-action-btn--delete" title="Delete">
                    <i class="fa-solid fa-trash-can" data-member-id="${d.id}"></i>
                </button>
            </div>
        </div>
    `;
}

function formatFeedbackDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    const pad = n => String(n).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function renderFeedbackCardAdmin(entry) {
    const name = getTextValue(entry.name, 'Anonymous');
    const initials = getInitials(name, '?');
    const email = getTextValue(entry.email, '');
    const message = getTextValue(entry.message, '—');
    const submittedAt = formatFeedbackDate(entry.submittedAt);
    const emailRow = email ? `<span><i class="fa-solid fa-envelope"></i> ${email}</span>` : '';
    const userRow = entry.userId ? `<span><i class="fa-solid fa-user"></i> ${entry.userId}</span>` : '';
    const deleteAction = entry.id
        ? `<div class="admin-event-card__actions"><button data-feedback-id="${entry.id}" class="delete-feedback-btn admin-action-btn admin-action-btn--delete" title="Delete"><i class="fa-solid fa-trash-can" data-feedback-id="${entry.id}"></i></button></div>`
        : '';
    return `
        <div class="admin-event-card">
            <div class="admin-event-card__date-badge" style="background:linear-gradient(135deg,#0ea5e9,#38bdf8)">
                <span class="admin-event-card__month" style="font-size:0.6rem">FB</span>
                <span class="admin-event-card__day" style="font-size:0.85rem">${initials}</span>
            </div>
            <div class="admin-event-card__body">
                <div class="admin-event-card__title">${name}</div>
                <div class="admin-event-card__meta">
                    <span><i class="fa-regular fa-calendar"></i> ${submittedAt}</span>
                    ${emailRow}
                    ${userRow}
                </div>
                <p class="admin-event-card__desc">${message}</p>
            </div>
            ${deleteAction}
        </div>`;
}

export function renderAdminFeedbackList(deleteFeedbackFn) {
    const listDiv = document.getElementById('admin-feedback-list');
    if (!listDiv) return;
    if (!state.feedbackList || !state.feedbackList.length) {
        listDiv.innerHTML = `<div class="rounded-lg border border-dashed border-red-200 bg-red-50/40 p-6 text-center text-sm text-red-600">No feedback submitted yet.</div>`;
        return;
    }
    listDiv.innerHTML = state.feedbackList.map(renderFeedbackCardAdmin).join('');
    if (!deleteFeedbackFn) return;
    listDiv.querySelectorAll('.delete-feedback-btn').forEach(button => {
        button.addEventListener('click', (ev) => {
            const feedbackId = ev.target.closest('[data-feedback-id]')?.dataset.feedbackId || ev.target.dataset.feedbackId;
            if (feedbackId) deleteFeedbackFn(feedbackId);
        });
    });
}

function normalizeSearchText(value) {
    return (value || '')
        .toString()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getSearchTokens(value) {
    const normalized = normalizeSearchText(value);
    return normalized ? normalized.split(' ') : [];
}

function getMaxEditDistance(token) {
    if (token.length <= 4) return 1;
    if (token.length <= 7) return 2;
    return 3;
}

function getEditDistance(a, b, maxDistance) {
    if (a === b) return 0;
    const aLen = a.length;
    const bLen = b.length;
    if (Math.abs(aLen - bLen) > maxDistance) return maxDistance + 1;
    let prev = new Array(bLen + 1);
    let curr = new Array(bLen + 1);
    for (let j = 0; j <= bLen; j += 1) prev[j] = j;
    for (let i = 1; i <= aLen; i += 1) {
        curr[0] = i;
        let rowMin = curr[0];
        const aChar = a[i - 1];
        for (let j = 1; j <= bLen; j += 1) {
            const cost = aChar === b[j - 1] ? 0 : 1;
            const val = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
            curr[j] = val;
            if (val < rowMin) rowMin = val;
        }
        if (rowMin > maxDistance) return maxDistance + 1;
        [prev, curr] = [curr, prev];
    }
    return prev[bLen];
}

function isFuzzyTokenMatch(token, word) {
    if (!token || !word) return false;
    if (word.includes(token)) return true;
    if (token.length <= 2) return false;
    const maxDistance = getMaxEditDistance(token);
    return getEditDistance(token, word, maxDistance) <= maxDistance;
}

function isFuzzyNameMatch(query, target) {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return true;
    const normalizedTarget = normalizeSearchText(target);
    if (!normalizedTarget) return false;
    if (normalizedTarget.includes(normalizedQuery)) return true;
    const queryTokens = normalizedQuery.split(' ');
    const targetTokens = normalizedTarget.split(' ');
    return queryTokens.some(token => targetTokens.some(word => isFuzzyTokenMatch(token, word)));
}

function getFilteredAdminMembers() {
    const nameFilter = state.memberSearchName.trim();
    const bloodFilter = state.memberSearchBlood.trim().toUpperCase();
    const roleFilter = state.memberSearchRole || '';
    const filtered = state.donorsList.filter(member => {
        const memberName = getTextValue(member.fullName || member.name, '');
        const memberBloodGroup = getTextValue(member.bloodGroup, '').toUpperCase();
        const memberRole = member.role || 'member';
        const matchesName = !nameFilter || isFuzzyNameMatch(nameFilter, memberName);
        const matchesBlood = !bloodFilter || memberBloodGroup === bloodFilter;
        const matchesRole = !roleFilter || memberRole === roleFilter;
        return matchesName && matchesBlood && matchesRole;
    });
    return [...filtered].sort((a, b) => {
        const aId = getDonorIdNumber(a.donorId ?? a.rawDonorId) || 0;
        const bId = getDonorIdNumber(b.donorId ?? b.rawDonorId) || 0;
        if (aId !== bId) return bId - aId;
        const aName = getTextValue(a.fullName || a.name, '');
        const bName = getTextValue(b.fullName || b.name, '');
        return aName.localeCompare(bName);
    });
}

function hasActiveMemberSearchFilters() {
    return Boolean(state.memberSearchName.trim() || state.memberSearchBlood.trim() || state.memberSearchRole);
}

function updateAdminMemberSearchStatus() {
    const statusEl = document.getElementById('admin-member-search-status');
    if (!statusEl) return;
    const nameFilter = state.memberSearchName.trim();
    const bloodFilter = state.memberSearchBlood.trim();
    const roleFilter = state.memberSearchRole;
    const parts = [];
    if (roleFilter) parts.push(`Role: ${roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}`);
    if (nameFilter) parts.push(`Name matches "${nameFilter}"`);
    if (bloodFilter) parts.push(`Blood group: ${bloodFilter}`);
    const label = parts.length ? parts.join(' • ') : 'Showing all members';
    statusEl.textContent = label;
    statusEl.classList.toggle('is-filtered', parts.length > 0);
}

export function renderAdminMembersList(deleteMemberFn, promoteMemberFn, demoteMemberFn) {
    const membersListDiv = document.getElementById('admin-members-list');
    if (!membersListDiv) return;
    updateAdminMemberSearchStatus();
    if (!state.donorsList.length) {
        membersListDiv.innerHTML = `<div class="rounded-lg border border-dashed border-red-200 bg-red-50/40 p-6 text-center text-sm text-red-600">No member records found yet. Once donors register, they'll appear here automatically.</div>`;
        return;
    }
    const filteredMembers = getFilteredAdminMembers();
    if (!filteredMembers.length) {
        const emptyMessage = hasActiveMemberSearchFilters()
            ? 'No members match your search. Adjust the name or blood group filters or reset the search to view all members.'
            : 'No member records found yet. Once donors register, they\'ll appear here automatically.';
        membersListDiv.innerHTML = `<div class="rounded-lg border border-dashed border-red-200 bg-red-50/40 p-6 text-center text-sm text-red-600">${emptyMessage}</div>`;
        return;
    }
    membersListDiv.innerHTML = filteredMembers.map(renderDonorCardAdmin).join('');
    membersListDiv.querySelectorAll('.edit-member-btn').forEach(button => {
        button.addEventListener('click', (ev) => {
            const memberId = ev.target.closest('[data-member-id]')?.dataset.memberId || ev.target.dataset.memberId;
            const memberData = state.donorsList.find(d => d.id === memberId);
            if (memberData) {
                document.getElementById('admin-member-id').value = memberData.id;
                document.getElementById('admin-member-fullname').value = memberData.fullName || '';
                document.getElementById('admin-member-email').value = memberData.email || '';
                document.getElementById('admin-member-phone').value = memberData.phone || '';
                document.getElementById('admin-member-bloodGroup').value = memberData.bloodGroup || '';
                document.getElementById('admin-member-location').value = memberData.location || '';
                document.getElementById('admin-member-department').value = memberData.department || '';
                document.getElementById('admin-member-batch').value = memberData.batch || '';
                document.getElementById('admin-member-lastDonateDate').value = memberData.lastDonateDate || '';
                const hidePhoneField = document.getElementById('admin-member-hide-phone');
                if (hidePhoneField) hidePhoneField.checked = memberData.isPhoneHidden || false;
                const commentField = document.getElementById('admin-member-comment');
                if (commentField) commentField.value = memberData.publicComment || '';
                document.getElementById('admin-member-form').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    membersListDiv.querySelectorAll('.delete-member-btn').forEach(button => {
        button.addEventListener('click', (ev) => {
            const memberId = ev.target.closest('[data-member-id]')?.dataset.memberId || ev.target.dataset.memberId;
            const memberData = state.donorsList.find(d => d.id === memberId);
            if (memberId && memberData && deleteMemberFn) deleteMemberFn(memberId);
        });
    });
    membersListDiv.querySelectorAll('.promote-member-btn').forEach(button => {
        button.addEventListener('click', (ev) => {
            const memberId = ev.target.closest('[data-member-id]')?.dataset.memberId || ev.target.dataset.memberId;
            const memberData = state.donorsList.find(d => d.id === memberId);
            if (memberId && memberData && promoteMemberFn) promoteMemberFn(memberId, memberData);
        });
    });
    membersListDiv.querySelectorAll('.demote-member-btn').forEach(button => {
        button.addEventListener('click', (ev) => {
            const memberId = ev.target.closest('[data-member-id]')?.dataset.memberId || ev.target.dataset.memberId;
            const memberData = state.donorsList.find(d => d.id === memberId);
            if (memberId && memberData && demoteMemberFn) demoteMemberFn(memberId, memberData);
        });
    });
}

export function applyAdminMemberSearchFilters(deleteMemberFn, promoteMemberFn, demoteMemberFn) {
    const nameInput = document.getElementById('admin-member-search-name');
    const bloodSelect = document.getElementById('admin-member-search-blood');
    state.memberSearchName = (nameInput?.value || '').trim();
    state.memberSearchBlood = (bloodSelect?.value || '').trim();
    renderAdminMembersList(deleteMemberFn, promoteMemberFn, demoteMemberFn);
}

export function resetAdminMemberSearchFilters(deleteMemberFn, promoteMemberFn, demoteMemberFn) {
    state.memberSearchName = '';
    state.memberSearchBlood = '';
    state.memberSearchRole = '';
    const nameInput = document.getElementById('admin-member-search-name');
    const bloodSelect = document.getElementById('admin-member-search-blood');
    if (nameInput) nameInput.value = '';
    if (bloodSelect) bloodSelect.value = '';
    renderAdminMembersList(deleteMemberFn, promoteMemberFn, demoteMemberFn);
}

export function renderAdminEventsList(deleteEventFn) {
    const eventsListDiv = document.getElementById('admin-events-list');
    if (!eventsListDiv) return;
    if (!state.eventsList.length) {
        eventsListDiv.innerHTML = `<div class="rounded-lg border border-dashed border-red-200 bg-red-50/40 p-6 text-center text-sm text-red-600">No events scheduled yet. Add an event to get started.</div>`;
        return;
    }
    const sortedEvents = sortEventsByDate(state.eventsList, 'asc');
    eventsListDiv.innerHTML = sortedEvents.map(e => {
        const eventDate = e.date ? new Date(e.date + 'T00:00:00') : null;
        const monthStr = eventDate ? eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '—';
        const dayStr = eventDate ? eventDate.getDate() : '—';
        const _p = n => String(n).padStart(2,'0');
        const fullDate = eventDate ? `${_p(eventDate.getDate())}/${_p(eventDate.getMonth()+1)}/${eventDate.getFullYear()}` : e.date;
        const isPast = eventDate && eventDate < new Date(new Date().toDateString());
        return `
        <div class="admin-event-card ${isPast ? 'admin-event-card--past' : ''}">
            <div class="admin-event-card__date-badge">
                <span class="admin-event-card__month">${monthStr}</span>
                <span class="admin-event-card__day">${dayStr}</span>
            </div>
            <div class="admin-event-card__body">
                <div class="admin-event-card__title">${e.title}</div>
                <div class="admin-event-card__meta">
                    <span><i class="fa-regular fa-calendar"></i> ${fullDate}</span>
                    <span><i class="fa-regular fa-clock"></i> ${e.time || '—'}</span>
                </div>
                <div class="admin-event-card__meta"><span><i class="fa-solid fa-location-dot"></i> Donation Center: ${e.location || '—'}</span></div>
                ${e.description ? `<p class="admin-event-card__desc">${e.description}</p>` : ''}
            </div>
            <div class="admin-event-card__actions">
                <button data-event-id="${e.id}" class="edit-event-btn admin-action-btn admin-action-btn--edit" title="Edit"><i class="fa-solid fa-pen-to-square" data-event-id="${e.id}"></i></button>
                <button data-event-id="${e.id}" class="delete-event-btn admin-action-btn admin-action-btn--delete" title="Delete"><i class="fa-solid fa-trash-can" data-event-id="${e.id}"></i></button>
            </div>
        </div>`;
    }).join('');
    eventsListDiv.querySelectorAll('.edit-event-btn').forEach(button => {
        button.addEventListener('click', (ev) => {
            const eventId = ev.target.closest('[data-event-id]')?.dataset.eventId || ev.target.dataset.eventId;
            const eventData = state.eventsList.find(e => e.id === eventId);
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
            const eventId = ev.target.closest('[data-event-id]')?.dataset.eventId || ev.target.dataset.eventId;
            if (eventId && deleteEventFn) deleteEventFn(eventId);
        });
    });
}

export function clearAdminEventForm() {
    const form = document.getElementById('admin-event-form');
    if (form) { form.reset(); document.getElementById('admin-event-id').value = ''; }
}

export function clearAdminRecentDonorForm() {
    const form = document.getElementById('admin-recent-donor-form');
    if (form) form.reset();
    const idField = document.getElementById('admin-recent-donor-id');
    if (idField) idField.value = '';
}

export function clearAdminMemberForm() {
    const form = document.getElementById('admin-member-form');
    if (form) { form.reset(); document.getElementById('admin-member-id').value = ''; }
    const emailField = document.getElementById('admin-member-email');
    if (emailField) emailField.value = '';
}

export function initAdminTabs() {
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) return;
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
