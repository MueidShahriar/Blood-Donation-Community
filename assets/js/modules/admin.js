import state from './state.js';
import { sortEventsByDate } from './utils.js';
import { openModal, closeModal, showModalMessage, attachConfirmHandler } from './modals.js';

function renderRecentDonationCardAdmin(d) {
    const donationDate = d.date ? (() => { const _d = new Date(d.date + 'T00:00:00'); const _p = n => String(n).padStart(2,'0'); return `${_p(_d.getDate())}/${_p(_d.getMonth()+1)}/${_d.getFullYear()}`; })() : '—';
    const initials = (d.name || 'D').split(/\s+/).filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?';
    return `
        <div class="admin-event-card">
            <div class="admin-event-card__date-badge" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
                <span class="admin-event-card__month" style="font-size:0.6rem">${d.bloodGroup || '—'}</span>
                <span class="admin-event-card__day" style="font-size:0.85rem">${initials}</span>
            </div>
            <div class="admin-event-card__body">
                <div class="admin-event-card__title">${d.name || 'Unknown'}</div>
                <div class="admin-event-card__meta">
                    <span><i class="fa-regular fa-calendar"></i> ${donationDate}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${d.location || '—'}</span>
                </div>
                <div class="admin-event-card__meta">
                    <span><i class="fa-solid fa-building-columns"></i> Dept: ${d.department || '—'}</span>
                    <span><i class="fa-solid fa-layer-group"></i> Batch: ${d.batch || '—'}</span>
                    <span><i class="fa-solid fa-user"></i> Age: ${d.age || '—'}</span>
                    <span><i class="fa-solid fa-weight-scale"></i> ${d.weight ? d.weight + ' kg' : '—'}</span>
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
                const nameF = document.getElementById('donor-name'); if (nameF) nameF.value = data.name || '';
                const bgF = document.getElementById('donor-blood-group'); if (bgF) bgF.value = data.bloodGroup || '';
                const locF = document.getElementById('donor-location'); if (locF) locF.value = data.location || '';
                const deptF = document.getElementById('donor-department'); if (deptF) deptF.value = data.department || '';
                const batchF = document.getElementById('donor-batch'); if (batchF) batchF.value = data.batch || '';
                const ageF = document.getElementById('donor-age'); if (ageF) ageF.value = data.age || '';
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
    const phone = d.phone || '—';
    const initials = (d.fullName || 'U').split(/\s+/).filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?';
    const isEligible = d.lastDonateDate
        ? (Math.floor((new Date() - new Date(d.lastDonateDate + 'T00:00:00')) / (1000*60*60*24)) >= 90)
        : null;
    const eligibleBadge = isEligible === null ? ''
        : isEligible ? '<span class="admin-member-badge admin-member-badge--eligible"><i class="fa-solid fa-circle-check"></i> Eligible</span>'
        : '<span class="admin-member-badge admin-member-badge--waiting"><i class="fa-solid fa-hourglass-half"></i> Waiting</span>';
    const avatarContent = d.profilePhoto
        ? `<img src="${d.profilePhoto}" alt="${initials}" style="width:100%;height:100%;object-fit:cover;border-radius:14px">`
        : initials;
    return `
        <div class="admin-member-card">
            <div class="admin-member-card__avatar">${avatarContent}</div>
            <div class="admin-member-card__body">
                <div class="admin-member-card__top">
                    <h4 class="admin-member-card__name">${d.fullName || 'Unknown'}</h4>
                    <span class="admin-member-card__blood"><i class="fa-solid fa-droplet"></i> ${d.bloodGroup || '—'}</span>
                    ${eligibleBadge}
                </div>
                <div class="admin-member-card__info">
                    <span><i class="fa-solid fa-envelope"></i> ${d.email || '—'}</span>
                    <span><i class="fa-solid fa-phone"></i> ${phone}</span>
                    <span><i class="fa-solid fa-location-dot"></i> Donation Center: ${d.location || '—'}</span>
                    <span><i class="fa-solid fa-calendar-check"></i> Last: ${lastDate}</span>
                </div>
                <div class="admin-member-card__id">ID: ${d.id}</div>
            </div>
            <div class="admin-member-card__actions">
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

function getFilteredAdminMembers() {
    const nameFilter = state.memberSearchName.trim().toLowerCase();
    const bloodFilter = state.memberSearchBlood.trim().toUpperCase();
    return state.donorsList.filter(member => {
        const matchesName = !nameFilter || (member.fullName || '').toLowerCase().includes(nameFilter);
        const matchesBlood = !bloodFilter || (member.bloodGroup || '').toUpperCase() === bloodFilter;
        return matchesName && matchesBlood;
    });
}

function hasActiveMemberSearchFilters() {
    return Boolean(state.memberSearchName.trim() || state.memberSearchBlood.trim());
}

function updateAdminMemberSearchStatus() {
    const statusEl = document.getElementById('admin-member-search-status');
    if (!statusEl) return;
    const nameFilter = state.memberSearchName.trim();
    const bloodFilter = state.memberSearchBlood.trim();
    let label = 'Showing all members';
    if (nameFilter && bloodFilter) label = `Filtered by "${nameFilter}" • ${bloodFilter}`;
    else if (nameFilter) label = `Name contains "${nameFilter}"`;
    else if (bloodFilter) label = `Blood group: ${bloodFilter}`;
    statusEl.textContent = label;
    statusEl.classList.toggle('is-filtered', Boolean(nameFilter || bloodFilter));
}

export function renderAdminMembersList(deleteMemberFn) {
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
                document.getElementById('admin-member-lastDonateDate').value = memberData.lastDonateDate || '';
                document.getElementById('admin-member-hide-phone').checked = memberData.isPhoneHidden || false;
                document.getElementById('admin-member-comment').value = memberData.publicComment || '';
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
}

export function applyAdminMemberSearchFilters(deleteMemberFn) {
    const nameInput = document.getElementById('admin-member-search-name');
    const bloodSelect = document.getElementById('admin-member-search-blood');
    state.memberSearchName = (nameInput?.value || '').trim();
    state.memberSearchBlood = (bloodSelect?.value || '').trim();
    renderAdminMembersList(deleteMemberFn);
}

export function resetAdminMemberSearchFilters(deleteMemberFn) {
    state.memberSearchName = '';
    state.memberSearchBlood = '';
    const nameInput = document.getElementById('admin-member-search-name');
    const bloodSelect = document.getElementById('admin-member-search-blood');
    if (nameInput) nameInput.value = '';
    if (bloodSelect) bloodSelect.value = '';
    renderAdminMembersList(deleteMemberFn);
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
