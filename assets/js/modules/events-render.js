import state from './state.js';
import { getDateParts, getEventDateValue, sortEventsByDate } from './utils.js';

const EVENT_CARD_ACCENTS = [
    { card: 'accent-rose tint-rose', month: 'text-red-700', btn: 'bg-red-600 hover:bg-red-700' },
    { card: 'accent-amber tint-amber', month: 'text-amber-600', btn: 'bg-amber-500 hover:bg-amber-600' },
    { card: 'accent-emerald tint-emerald', month: 'text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700' },
    { card: 'accent-indigo tint-indigo', month: 'text-indigo-600', btn: 'bg-indigo-600 hover:bg-indigo-700' },
    { card: 'accent-sky tint-sky', month: 'text-sky-600', btn: 'bg-sky-600 hover:bg-sky-700' }
];

export function getFilteredPublicEvents() {
    const search = state.eventSearchTerm.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filtered = state.eventsList.filter((event) => {
        const haystack = `${event.title || ''} ${event.location || ''} ${event.description || ''}`.toLowerCase();
        const matchesSearch = !search || haystack.includes(search);
        if (!matchesSearch) return false;
        const eventDate = getEventDateValue(event);
        if (state.eventFilterMode === 'upcoming') {
            if (!eventDate) return true;
            return eventDate.getTime() >= today.getTime();
        }
        if (state.eventFilterMode === 'past') {
            if (!eventDate) return false;
            return eventDate.getTime() < today.getTime();
        }
        return true;
    });
    if (state.eventFilterMode === 'past') return sortEventsByDate(filtered, 'desc');
    return sortEventsByDate(filtered, 'asc');
}

export function renderPublicEvents() {
    if (!state.publicEventsListEl) state.publicEventsListEl = document.getElementById('public-events-list');
    if (!state.eventsEmptyStateEl) state.eventsEmptyStateEl = document.getElementById('events-empty');
    if (!state.publicEventsListEl) return;
    const filteredEvents = getFilteredPublicEvents();
    if (state.eventsEmptyStateEl) {
        state.eventsEmptyStateEl.classList.toggle('hidden', filteredEvents.length > 0);
    }
    if (!filteredEvents.length) {
        state.publicEventsListEl.innerHTML = '';
        return;
    }
    state.publicEventsListEl.innerHTML = filteredEvents.map((event, idx) => {
        const parts = getDateParts(event.date || '');
        const accent = EVENT_CARD_ACCENTS[idx % EVENT_CARD_ACCENTS.length];
        const timeSlot = [event.location || '', event.time || ''].filter(Boolean).join(' • ');
        return `
                <article class="how-card ${accent.card} bg-white rounded-xl shadow-lg p-4 transform transition hover:scale-105 float-in flex gap-4 items-center flex-col sm:flex-row text-center sm:text-left">
                    <div class="flex-shrink-0 w-full sm:w-20">
                        <div class="text-sm font-bold ${accent.month}">${parts.m || ''}</div>
                        <div class="text-2xl font-extrabold">${parts.d || ''}</div>
                        <div class="text-xs text-gray-500">${parts.y || ''}</div>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-bold">${event.title || ''}</h3>
                        <p class="text-sm text-gray-600">${timeSlot}</p>
                        <p class="mt-2 text-gray-700">${event.description || ''}</p>
                        <div class="mt-3 flex gap-2 justify-center sm:justify-start">
                            <a href="#contact" class="px-4 py-2 ${accent.btn} text-white rounded-md inline-flex items-center gap-2">
                                <i class="fa-solid fa-calendar-check"></i>
                                <span>Register</span>
                            </a>
                        </div>
                    </div>
                </article>
                `;
    }).join('');
    if (window.registerFloatEls) window.registerFloatEls(state.publicEventsListEl);
}

export function initEventControls() {
    const eventSearchInput = document.getElementById('event-search');
    const eventFilterSelect = document.getElementById('event-filter');
    if (eventSearchInput) state.eventSearchTerm = eventSearchInput.value || '';
    if (eventFilterSelect) state.eventFilterMode = eventFilterSelect.value || 'upcoming';
    eventSearchInput?.addEventListener('input', (ev) => {
        state.eventSearchTerm = ev.target.value || '';
        renderPublicEvents();
    });
    eventFilterSelect?.addEventListener('change', (ev) => {
        state.eventFilterMode = ev.target.value || 'upcoming';
        renderPublicEvents();
    });
    renderPublicEvents();
}
