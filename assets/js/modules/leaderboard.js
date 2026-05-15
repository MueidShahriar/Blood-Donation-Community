import { t } from './language-ui.js';
import {
    buildDonorLeaderboard,
    formatDateDisplay,
    getInitials,
    getTextValue,
    normalizeBloodGroup
} from './utils.js';

const tickerControllers = new Map();
let leaderboardFilterHandlersReady = false;
let cachedLeaderboardEntries = [];

const badgeTierMap = {
    gold: 'gold',
    silver: 'silver',
    bronze: 'bronze'
};

function getLeaderboardBadgeLabel(badge) {
    if (!badge || !badge.key) return '';
    return t(badge.key);
}

function renderLeaderboardCard(entry, rank) {
    const { donor, badge, score, donationCount, lastDonationDate } = entry;
    const donorName = getTextValue(donor.fullName || donor.name, 'Unknown');
    const initials = getInitials(donorName, '?');
    const location = getTextValue(donor.location, '—');
    const blood = normalizeBloodGroup(donor.bloodGroup || donor.blood || donor.blood_group) || '—';
    const lastDonation = lastDonationDate ? formatDateDisplay(lastDonationDate) : '—';
    const badgeLabel = getLeaderboardBadgeLabel(badge);
    const avatar = donor.profilePhoto
        ? `<img src="${donor.profilePhoto}" alt="${initials}" class="leaderboard-avatar__img" />`
        : `<span class="leaderboard-avatar__text">${initials}</span>`;
    const medalClass = rank === 1 ? 'leaderboard-medal--gold'
        : rank === 2 ? 'leaderboard-medal--silver'
        : rank === 3 ? 'leaderboard-medal--bronze'
        : 'leaderboard-medal--neutral';

    return `
        <article class="leaderboard-card">
            <div class="leaderboard-rank ${medalClass}">${rank}</div>
            <div class="leaderboard-avatar">${avatar}</div>
            <div class="leaderboard-body">
                <div class="leaderboard-top">
                    <h3 class="leaderboard-name">${donorName}</h3>
                    <span class="donor-badge ${badge?.className || ''}">${badge?.icon || ''} ${badgeLabel}</span>
                </div>
                <div class="leaderboard-meta">
                    <span><i class="fa-solid fa-droplet"></i> ${blood}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${location}</span>
                    <span><i class="fa-solid fa-calendar-check"></i> ${t('leaderboardLastDonation')} ${lastDonation}</span>
                </div>
                <div class="leaderboard-stats">
                    <span class="leaderboard-score"><i class="fa-solid fa-chart-line"></i> ${t('leaderboardScore')}: ${score}</span>
                    <span class="leaderboard-donations"><i class="fa-solid fa-hand-holding-droplet"></i> ${t('leaderboardDonations')}: ${donationCount}</span>
                </div>
            </div>
        </article>
    `;
}

function renderTickerCard(entry, rank) {
    const { donor, badge, score, donationCount, lastDonationDate } = entry;
    const donorName = getTextValue(donor.fullName || donor.name, 'Unknown');
    const initials = getInitials(donorName, '?');
    const location = getTextValue(donor.location, '—');
    const blood = normalizeBloodGroup(donor.bloodGroup || donor.blood || donor.blood_group) || '—';
    const lastDonation = lastDonationDate ? formatDateDisplay(lastDonationDate) : '—';
    const badgeLabel = getLeaderboardBadgeLabel(badge);
    const avatar = donor.profilePhoto
        ? `<img src="${donor.profilePhoto}" alt="${initials}" class="ticker-avatar__img" />`
        : `<span class="ticker-avatar__text">${initials}</span>`;
    const medalClass = rank === 1 ? 'ticker-rank--gold'
        : rank === 2 ? 'ticker-rank--silver'
        : rank === 3 ? 'ticker-rank--bronze'
        : 'ticker-rank--neutral';

    return `
        <article class="ticker-card">
            <span class="ticker-rank ${medalClass}">${rank}</span>
            <div class="ticker-card__header">
                <div class="ticker-avatar">${avatar}</div>
                <div>
                    <h3 class="ticker-name">${donorName}</h3>
                    <span class="donor-badge ticker-badge ${badge?.className || ''}">${badge?.icon || ''} ${badgeLabel}</span>
                </div>
            </div>
            <div class="ticker-meta">
                <span><i class="fa-solid fa-droplet"></i> ${blood}</span>
                <span><i class="fa-solid fa-location-dot"></i> ${location}</span>
                <span><i class="fa-solid fa-calendar-check"></i> ${t('leaderboardLastDonation')} ${lastDonation}</span>
            </div>
            <div class="ticker-stats">
                <span><i class="fa-solid fa-chart-line"></i> ${t('leaderboardScore')}: ${score}</span>
                <span><i class="fa-solid fa-hand-holding-droplet"></i> ${t('leaderboardDonations')}: ${donationCount}</span>
            </div>
        </article>
    `;
}

function normalizeTickerOffset(offset, width) {
    if (!width) return offset;
    let next = offset;
    while (next <= -width) next += width;
    while (next > 0) next -= width;
    return next;
}

function initDonorTickerScroll(track, options = {}) {
    if (!track) return;
    const trackId = track.id || 'donor-ticker-track';
    const existing = tickerControllers.get(trackId);
    if (existing) existing.destroy();

    const speed = Number(track.dataset.speed || options.speed || 0.04);
    const mask = track.closest('.donor-ticker__mask') || track.parentElement;

    const state = {
        offset: 0,
        isDragging: false,
        startX: 0,
        startOffset: 0,
        lastTs: 0,
        rafId: 0,
        width: 0
    };

    let resizeObserver;

    const syncWidth = () => {
        state.width = Math.max(0, Math.floor(track.scrollWidth / 2));
        state.offset = normalizeTickerOffset(state.offset, state.width);
        track.style.transform = `translate3d(${state.offset}px, 0, 0)`;
    };

    const scheduleSync = () => requestAnimationFrame(syncWidth);

    const step = (ts) => {
        if (!state.lastTs) state.lastTs = ts;
        const delta = Math.min(ts - state.lastTs, 32);
        state.lastTs = ts;
        if (!state.isDragging) {
            state.offset -= speed * delta;
        }
        state.offset = normalizeTickerOffset(state.offset, state.width);
        track.style.transform = `translate3d(${state.offset}px, 0, 0)`;
        state.rafId = requestAnimationFrame(step);
    };

    const onPointerDown = (event) => {
        state.isDragging = true;
        state.startX = event.clientX;
        state.startOffset = state.offset;
        state.lastTs = performance.now();
        track.classList.add('is-dragging');
        mask?.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event) => {
        if (!state.isDragging) return;
        const delta = event.clientX - state.startX;
        state.offset = normalizeTickerOffset(state.startOffset + delta, state.width);
        track.style.transform = `translate3d(${state.offset}px, 0, 0)`;
    };

    const onPointerUp = (event) => {
        if (!state.isDragging) return;
        state.isDragging = false;
        track.classList.remove('is-dragging');
        mask?.releasePointerCapture?.(event.pointerId);
    };

    syncWidth();
    state.rafId = requestAnimationFrame(step);

    if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(scheduleSync);
        resizeObserver.observe(track);
        if (mask) resizeObserver.observe(mask);
    }

    track.querySelectorAll('img').forEach((img) => {
        img.addEventListener('load', scheduleSync, { once: true });
    });

    mask?.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('resize', scheduleSync);

    tickerControllers.set(trackId, {
        destroy: () => {
            cancelAnimationFrame(state.rafId);
            mask?.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
            window.removeEventListener('resize', scheduleSync);
            resizeObserver?.disconnect();
        }
    });
}

function getLeaderboardEntries(donors, recentDonations) {
    const limit = Math.max(0, donors?.length || 0);
    if (!limit) return [];
    return buildDonorLeaderboard(donors, recentDonations, limit);
}

function applyLeaderboardFilters() {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;
    const emptyEl = document.getElementById('leaderboard-empty');
    const queryInput = document.getElementById('leaderboard-filter-input');
    const bloodSelect = document.getElementById('leaderboard-filter-blood');
    const badgeSelect = document.getElementById('leaderboard-filter-badge');
    const sortSelect = document.getElementById('leaderboard-filter-sort');
    const countEl = document.getElementById('leaderboard-filter-count');

    const query = (queryInput?.value || '').trim().toLowerCase();
    const blood = normalizeBloodGroup(bloodSelect?.value || '');
    const badge = badgeSelect?.value || '';
    const sort = sortSelect?.value || 'rank';

    let filtered = cachedLeaderboardEntries.filter((entry) => {
        const donor = entry.donor || {};
        const name = getTextValue(donor.fullName || donor.name, '').toLowerCase();
        const location = getTextValue(donor.location, '').toLowerCase();
        const donorBlood = normalizeBloodGroup(donor.bloodGroup || donor.blood || donor.blood_group);
        if (query && !name.includes(query) && !location.includes(query)) return false;
        if (blood && donorBlood !== blood) return false;
        if (badge && badgeTierMap[entry.badge?.tier || ''] !== badge) return false;
        return true;
    });

    if (sort === 'score') {
        filtered = [...filtered].sort((a, b) => b.score - a.score);
    } else if (sort === 'donations') {
        filtered = [...filtered].sort((a, b) => b.donationCount - a.donationCount);
    } else if (sort === 'recent') {
        filtered = [...filtered].sort((a, b) => {
            const aTime = a.lastDonationDate ? new Date(a.lastDonationDate).getTime() : 0;
            const bTime = b.lastDonationDate ? new Date(b.lastDonationDate).getTime() : 0;
            return bTime - aTime;
        });
    }

    if (!filtered.length) {
        container.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
    } else {
        if (emptyEl) emptyEl.classList.add('hidden');
        container.innerHTML = filtered.map((entry, index) => renderLeaderboardCard(entry, index + 1)).join('');
    }

    if (countEl) countEl.textContent = `${filtered.length} donors`;
}

export function renderDonorLeaderboard(donors = [], recentDonations = [], options = {}) {
    const {
        containerId = 'leaderboard-list',
        emptyId = 'leaderboard-empty',
        limit = 5
    } = options;

    const container = document.getElementById(containerId);
    if (!container) return;
    const emptyEl = document.getElementById(emptyId);

    if (!donors.length) {
        container.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }

    const ranked = buildDonorLeaderboard(donors, recentDonations, limit);
    if (!ranked.length) {
        container.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');
    container.innerHTML = ranked.map((entry, index) => renderLeaderboardCard(entry, index + 1)).join('');
}

export function renderDonorTicker(donors = [], recentDonations = [], options = {}) {
    const {
        containerId = 'donor-ticker-track',
        emptyId = 'donor-ticker-empty'
    } = options;

    const container = document.getElementById(containerId);
    if (!container) return;
    const section = container.closest('#donor-leaderboard');
    const emptyEl = document.getElementById(emptyId);

    section?.classList.remove('hidden');

    if (!donors.length) {
        container.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }

    const limit = Number(container.dataset.limit || 10);
    const ranked = buildDonorLeaderboard(donors, recentDonations, Number.isFinite(limit) ? limit : 10);
    if (!ranked.length) {
        container.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');
    const cards = ranked.map((entry, index) => renderTickerCard(entry, index + 1)).join('');
    container.innerHTML = cards + cards;
    initDonorTickerScroll(container);
}

export function initLeaderboardFilters(donors = [], recentDonations = []) {
    const filtersWrap = document.getElementById('leaderboard-filters');
    if (!filtersWrap) return;
    cachedLeaderboardEntries = getLeaderboardEntries(donors, recentDonations);

    if (!leaderboardFilterHandlersReady) {
        const queryInput = document.getElementById('leaderboard-filter-input');
        const bloodSelect = document.getElementById('leaderboard-filter-blood');
        const badgeSelect = document.getElementById('leaderboard-filter-badge');
        const sortSelect = document.getElementById('leaderboard-filter-sort');
        const resetBtn = document.getElementById('leaderboard-filter-reset');

        const handleInput = () => applyLeaderboardFilters();
        queryInput?.addEventListener('input', handleInput);
        bloodSelect?.addEventListener('change', handleInput);
        badgeSelect?.addEventListener('change', handleInput);
        sortSelect?.addEventListener('change', handleInput);
        resetBtn?.addEventListener('click', () => {
            if (queryInput) queryInput.value = '';
            if (bloodSelect) bloodSelect.value = '';
            if (badgeSelect) badgeSelect.value = '';
            if (sortSelect) sortSelect.value = 'rank';
            applyLeaderboardFilters();
        });

        leaderboardFilterHandlersReady = true;
    }

    applyLeaderboardFilters();
}
