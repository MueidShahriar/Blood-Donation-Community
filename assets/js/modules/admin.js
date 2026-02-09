import state from './state.js';
import { sortEventsByDate } from './utils.js';
import { openModal, closeModal, showModalMessage, attachConfirmHandler } from './modals.js';

function renderDonorCardAdmin(d) {
    const lastDate = d.lastDonateDate ? new Date(d.lastDonateDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not recorded';
    const phone = d.phone || '—';
    const initials = (d.fullName || 'U').split(/\s+/).filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?';
    const isEligible = d.lastDonateDate
        ? (Math.floor((new Date() - new Date(d.lastDonateDate + 'T00:00:00')) / (1000*60*60*24)) >= 90)
        : null;
    const eligibleBadge = isEligible === null ? ''
        : isEligible ? '<span class="admin-member-badge admin-member-badge--eligible"><i class="fa-solid fa-circle-check"></i> Eligible</span>'
        : '<span class="admin-member-badge admin-member-badge--waiting"><i class="fa-solid fa-hourglass-half"></i> Waiting</span>';
    return `
        <div class="admin-member-card">
            <div class="admin-member-card__avatar">${initials}</div>
            <div class="admin-member-card__body">
                <div class="admin-member-card__top">
                    <h4 class="admin-member-card__name">${d.fullName || 'Unknown'}</h4>
                    <span class="admin-member-card__blood"><i class="fa-solid fa-droplet"></i> ${d.bloodGroup || '—'}</span>
                    ${eligibleBadge}
                </div>
                <div class="admin-member-card__info">
                    <span><i class="fa-solid fa-envelope"></i> ${d.email || '—'}</span>
                    <span><i class="fa-solid fa-phone"></i> ${phone}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${d.location || '—'}</span>
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
        const fullDate = eventDate ? eventDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : e.date;
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
                <div class="admin-event-card__meta"><span><i class="fa-solid fa-location-dot"></i> ${e.location || '—'}</span></div>
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
}

export function clearAdminMemberForm() {
    const form = document.getElementById('admin-member-form');
    if (form) { form.reset(); document.getElementById('admin-member-id').value = ''; }
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
