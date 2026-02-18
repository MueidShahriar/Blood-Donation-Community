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
    const threeMonthsAgo = new Date(new Date().setMonth(today.getMonth() - 3));
    return lastDonation <= threeMonthsAgo;
}
