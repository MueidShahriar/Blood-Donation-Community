export function getDateParts(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return { y: '', m: '', d: '' };
    const parts = dateStr.split('-');
    return { y: parts[0] || '', m: parts[1] || '', d: parts[2] || '' };
}

export function formatDateDisplay(value) {
    if (!value) return '—';
    const pad = n => String(n).padStart(2, '0');
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}`;
    }
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
        return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
    }
    return typeof value === 'string' ? value : '—';
}

export function formatWeightValue(value) {
    if (value == null || value === '') return '—';
    const str = String(value).trim();
    if (!str) return '—';
    return /kg$/i.test(str) ? str : `${str} kg`;
}

export function getDonationDetailData(donation, dateObj) {
    if (!donation) return null;
    const displayDate = dateObj ? formatDateDisplay(dateObj) : formatDateDisplay(donation.date || donation.donationDate);
    const donorName = donation.name || donation.donorName || donation.fullName || 'Anonymous Donor';
    const blood = donation.bloodGroup || donation.blood_group || donation.blood || '—';
    const location = (donation.location ?? '').toString().trim() || '—';
    const department = (donation.department ?? donation.dept ?? '').toString().trim() || '—';
    const batch = (donation.batch ?? donation.batchNo ?? '').toString().trim() || '—';
    const ageValue = donation.age ?? donation.donorAge;
    const age = (ageValue == null || ageValue === '') ? '—' : String(ageValue);
    const weight = formatWeightValue(donation.weight);
    const notes = (donation.notes ?? '').toString().trim();
    const comment = (donation.publicComment ?? '').toString().trim();
    return { displayDate, donorName, bloodGroup: blood, location, department, batch, age, weight, notes, comment };
}

export function normalizeBloodGroup(value) {
    return (value || '').toString().trim().toUpperCase();
}

export const DONOR_ID_START = 301;
export const DONOR_ID_COUNTER_SEED = DONOR_ID_START - 1;

export function getTextValue(value, fallback = '') {
    if (value == null) return fallback;
    if (!['string', 'number', 'boolean'].includes(typeof value)) return fallback;
    const text = String(value).trim();
    return text || fallback;
}

export function getInitials(value, fallback = '?') {
    const text = getTextValue(value, '');
    if (!text) return fallback;
    const initials = text.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
    return initials || fallback;
}

export function getDonorIdNumber(value) {
    if (value == null) return null;
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.trunc(value);
    }
    const raw = String(value).trim().toUpperCase();
    if (!raw) return null;
    const prefixedMatch = raw.match(/^BDC[\s-]*(\d+)$/);
    const plainMatch = raw.match(/^(\d+)$/);
    const matchedNumber = prefixedMatch?.[1] || plainMatch?.[1];
    if (!matchedNumber) return null;
    const num = Number(matchedNumber);
    if (!Number.isFinite(num)) return null;
    return Math.trunc(num);
}

export function normalizeDonorId(value) {
    const num = getDonorIdNumber(value);
    return num == null || num < DONOR_ID_START ? '' : `BDC-${num}`;
}

export function getMaxDonorIdNumber(entries = []) {
    return entries.reduce((max, entry) => {
        const num = getDonorIdNumber(entry?.donorId ?? entry?.rawDonorId);
        return num != null && num >= DONOR_ID_START ? Math.max(max, num) : max;
    }, DONOR_ID_COUNTER_SEED);
}

export function inferAgeValue(entry) {
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

export function toggleEmptyState(elementId, hasData) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.classList.toggle('hidden', hasData);
}

export function buildDonorIndex(list, state) {
    state.donorsByGroup = new Map();
    list.forEach((d) => {
        const g = normalizeBloodGroup(d?.bloodGroup || d?.blood || d?.blood_group);
        if (!g) return;
        if (!state.donorsByGroup.has(g)) state.donorsByGroup.set(g, []);
        state.donorsByGroup.get(g).push(d);
    });
}

export function groupRecentDonationsByMonth(donations, chartLabels) {
    const monthGroups = chartLabels.months.map(() => []);
    const undated = [];
    donations.forEach(entry => {
        if (!entry) return;
        const rawDate = entry.date || entry.donationDate;
        const dateObj = rawDate ? new Date(rawDate) : null;
        if (!dateObj || Number.isNaN(dateObj.getTime())) {
            undated.push({ donation: entry, dateObj: null });
            return;
        }
        monthGroups[dateObj.getMonth()]?.push({ donation: entry, dateObj });
    });
    monthGroups.forEach(group => {
        group.sort((a, b) => {
            const aTime = a.dateObj ? a.dateObj.getTime() : 0;
            const bTime = b.dateObj ? b.dateObj.getTime() : 0;
            return bTime - aTime;
        });
    });
    undated.sort((a, b) => {
        const aName = (a.donation?.name || a.donation?.donorName || '').toString().toLowerCase();
        const bName = (b.donation?.name || b.donation?.donorName || '').toString().toLowerCase();
        return aName.localeCompare(bName);
    });
    return { monthGroups, undated };
}

export function getEventDateValue(event) {
    if (!event || !event.date) return null;
    const parsed = new Date(event.date);
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
}

export function sortEventsByDate(list, order = 'asc') {
    const cloned = [...list];
    cloned.sort((a, b) => {
        const aDate = getEventDateValue(a);
        const bDate = getEventDateValue(b);
        if (!aDate && !bDate) return 0;
        if (!aDate) return order === 'asc' ? 1 : -1;
        if (!bDate) return order === 'asc' ? -1 : 1;
        return order === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
    });
    return cloned;
}

export function isDonorEligible(lastDonationDate) {
    if (!lastDonationDate) return true;
    const today = new Date();
    const lastDonation = new Date(lastDonationDate);
    const fourMonthsAgo = new Date(new Date().setMonth(today.getMonth() - 4));
    return lastDonation <= fourMonthsAgo;
}

function getNumeric(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

export function getDonorLastDonationDate(donor, recentDonations = []) {
    if (!donor) return '';
    if (donor.lastDonateDate) return donor.lastDonateDate;
    const donorId = normalizeDonorId(donor.donorId || donor.rawDonorId);
    let latest = '';
    recentDonations.forEach(entry => {
        const entryId = normalizeDonorId(entry?.donorId);
        if (donorId && entryId && donorId !== entryId) return;
        const date = entry?.date || entry?.donationDate || '';
        if (date && (!latest || new Date(date) > new Date(latest))) {
            latest = date;
        }
    });
    return latest;
}

export function getDonationCountForDonor(donor, recentDonations = []) {
    if (!donor) return 0;
    const donorId = normalizeDonorId(donor.donorId || donor.rawDonorId);
    let count = 0;
    recentDonations.forEach(entry => {
        if (!entry) return;
        const entryId = normalizeDonorId(entry.donorId);
        if (donorId && entryId && donorId === entryId) count += 1;
    });
    if (count > 0) return count;
    const explicitTotal = getNumeric(donor.totalDonations);
    return explicitTotal != null && explicitTotal > 0 ? explicitTotal : 0;
}

function getRecencyScore(lastDonationDate) {
    if (!lastDonationDate) return 0;
    const dateObj = new Date(lastDonationDate);
    if (Number.isNaN(dateObj.getTime())) return 0;
    const days = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 30) return 24;
    if (days <= 90) return 16;
    if (days <= 180) return 8;
    return 0;
}

function getActivityScore(donor) {
    if (!donor) return 0;
    const activityDate = donor.lastActiveAt || donor.lastLoginAt || donor.updatedAt || donor.createdAt;
    if (!activityDate) return 0;
    const dateObj = new Date(activityDate);
    if (Number.isNaN(dateObj.getTime())) return 0;
    const days = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 7) return 18;
    if (days <= 30) return 10;
    if (days <= 90) return 4;
    return 0;
}

function getResponseSpeedScore(donor) {
    if (!donor) return 0;
    const responseRate = getNumeric(donor.responseRate || donor.response_rate);
    if (responseRate != null) {
        const normalized = responseRate > 1 ? Math.min(responseRate, 100) / 100 : Math.max(responseRate, 0);
        return Math.round(normalized * 30);
    }
    const minutes = getNumeric(donor.responseTimeMinutes || donor.avgResponseMinutes || donor.responseSpeedMinutes);
    if (minutes != null) {
        if (minutes <= 15) return 26;
        if (minutes <= 60) return 16;
        if (minutes <= 180) return 8;
        return 0;
    }
    const hours = getNumeric(donor.responseTimeHours || donor.avgResponseHours);
    if (hours != null) {
        if (hours <= 1) return 20;
        if (hours <= 4) return 12;
        if (hours <= 12) return 6;
    }
    return 0;
}

export function getReputationBadge(score, donationCount) {
    if (donationCount < 1) return null;
    if (donationCount >= 8) {
        return { key: 'badgeGold', icon: '🥇', className: 'donor-badge--gold', tier: 'gold' };
    }
    if (donationCount >= 4) {
        return { key: 'badgeSilver', icon: '🥈', className: 'donor-badge--silver', tier: 'silver' };
    }
    return { key: 'badgeBronze', icon: '🥉', className: 'donor-badge--bronze', tier: 'bronze' };
}

export function computeDonorReputation(donor, recentDonations = []) {
    const donationCount = getDonationCountForDonor(donor, recentDonations);
    const lastDonationDate = getDonorLastDonationDate(donor, recentDonations);
    const recencyScore = getRecencyScore(lastDonationDate);
    const activityScore = getActivityScore(donor);
    const responseScore = getResponseSpeedScore(donor);
    const score = Math.min(200, donationCount * 12 + recencyScore + activityScore + responseScore);
    const badge = getReputationBadge(score, donationCount);
    return {
        score,
        donationCount,
        lastDonationDate,
        recencyScore,
        activityScore,
        responseScore,
        badge
    };
}

export function buildDonorLeaderboard(donors = [], recentDonations = [], limit = 6) {
    const ranked = donors.map(donor => {
        const reputation = computeDonorReputation(donor, recentDonations);
        return { donor, ...reputation };
    }).filter(entry => entry.donationCount >= 1);
    ranked.sort((a, b) => {
        if (b.donationCount !== a.donationCount) return b.donationCount - a.donationCount;
        if (b.score !== a.score) return b.score - a.score;
        const aTime = a.lastDonationDate ? new Date(a.lastDonationDate).getTime() : 0;
        const bTime = b.lastDonationDate ? new Date(b.lastDonationDate).getTime() : 0;
        return bTime - aTime;
    });
    return ranked.slice(0, limit);
}
