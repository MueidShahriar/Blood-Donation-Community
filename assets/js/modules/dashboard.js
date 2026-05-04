import state from './state.js';
import { chartLabels, chartColors, getPieChartOptions } from './chart-config.js';
import { inferAgeValue, toggleEmptyState } from './utils.js';
import { flushPendingCounts } from './stats-counter.js';

const CHART_RETRY_DELAY_MS = 350;

function scheduleDashboardChartRetry() {
    if (state.dashboardChartRetryTimer) return;
    const hasChartCanvas = document.getElementById('ageGroupChart')
        || document.getElementById('bloodGroupChart')
        || document.getElementById('monthlyDonationsChart');
    if (!hasChartCanvas) return;
    state.dashboardChartRetryTimer = window.setTimeout(() => {
        state.dashboardChartRetryTimer = null;
        refreshDashboardCharts();
    }, CHART_RETRY_DELAY_MS);
}

export function ensureDashboardCharts() {
    if (typeof Chart === 'undefined') {
        scheduleDashboardChartRetry();
        return false;
    }
    if (state.dashboardChartRetryTimer) {
        window.clearTimeout(state.dashboardChartRetryTimer);
        state.dashboardChartRetryTimer = null;
    }
    if (!state.ageGroupChart) {
        const ctx = document.getElementById('ageGroupChart');
        if (ctx) {
            state.ageGroupChart = new Chart(ctx, {
                type: 'doughnut',
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
    if (!state.bloodGroupChart) {
        const ctx = document.getElementById('bloodGroupChart');
        if (ctx) {
            state.bloodGroupChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartLabels.blood,
                    datasets: [{
                        data: chartLabels.blood.map(() => 0),
                        backgroundColor: chartColors.blood,
                        borderWidth: 0,
                        borderRadius: 6,
                        barPercentage: 0.7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    aspectRatio: 1.2,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label(context) {
                                    return `${context.label || 'Value'}: ${context.parsed.y}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { precision: 0, font: { size: 11 } },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        x: {
                            ticks: { font: { size: 11 } },
                            grid: { display: false }
                        }
                    },
                    animation: { duration: 800, easing: 'easeOutQuart' },
                    layout: { padding: { top: 10, bottom: 10 } }
                }
            });
        }
    }
    if (!state.monthlyDonationsChart) {
        const ctx = document.getElementById('monthlyDonationsChart');
        if (ctx) {
            state.monthlyDonationsChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: chartLabels.months,
                    datasets: [{
                        data: chartLabels.months.map(() => 0),
                        backgroundColor: chartColors.months,
                        borderWidth: 0,
                        hoverOffset: 6
                    }]
                },
                options: getPieChartOptions()
            });
        }
    }
    return Boolean(state.ageGroupChart || state.bloodGroupChart || state.monthlyDonationsChart);
}

export function computeAgeGroupCounts() {
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
            if (normalized.includes('18') && normalized.includes('25')) { buckets.set('18-25', buckets.get('18-25') + 1); return; }
            if (normalized.includes('26') && normalized.includes('35')) { buckets.set('26-35', buckets.get('26-35') + 1); return; }
            if (normalized.includes('36') && normalized.includes('45')) { buckets.set('36-45', buckets.get('36-45') + 1); return; }
            if (normalized.includes('46') || normalized.includes('50') || normalized.includes('+')) { buckets.set('46+', buckets.get('46+') + 1); return; }
        }
        const inferred = inferAgeValue(entry);
        if (inferred != null) assign(inferred);
    };
    state.donorsList.forEach(addFromEntry);
    state.recentDonationsList.forEach(addFromEntry);
    return chartLabels.age.map(label => buckets.get(label) || 0);
}

export function computeBloodGroupCounts() {
    const counts = chartLabels.blood.map(() => 0);
    const increment = (group) => {
        if (!group) return;
        const normalized = group.toString().trim().toUpperCase().replace(/\s+/g, '');
        const idx = chartLabels.blood.indexOf(normalized);
        if (idx >= 0) counts[idx] += 1;
    };
    state.donorsList.forEach(d => increment(d?.bloodGroup || d?.blood_group || d?.blood));
    state.recentDonationsList.forEach(d => increment(d?.bloodGroup));
    return counts;
}

export function computeMonthlyDonationsCounts() {
    const counts = chartLabels.months.map(() => 0);
    const years = [];
    state.recentDonationsList.forEach(entry => {
        const rawDate = entry?.date || entry?.donationDate;
        const dateObj = rawDate ? new Date(rawDate) : null;
        if (!dateObj || Number.isNaN(dateObj.getTime())) return;
        years.push(dateObj.getFullYear());
    });
    const fallbackYear = new Date().getFullYear();
    const targetYear = years.length ? Math.max(...years) : fallbackYear;
    state.recentDonationsList.forEach(entry => {
        const rawDate = entry?.date || entry?.donationDate;
        const dateObj = rawDate ? new Date(rawDate) : null;
        if (!dateObj || Number.isNaN(dateObj.getTime())) return;
        if (dateObj.getFullYear() !== targetYear) return;
        const monthIndex = dateObj.getMonth();
        if (monthIndex >= 0 && monthIndex < counts.length) counts[monthIndex] += 1;
    });
    const total = counts.reduce((sum, value) => sum + value, 0);
    return { counts, year: targetYear, total };
}

export function updateAgeGroupChart() {
    const counts = computeAgeGroupCounts();
    ensureDashboardCharts();
    if (!state.ageGroupChart) {
        toggleEmptyState('ageGroupChartEmpty', counts.reduce((sum, value) => sum + value, 0) > 0);
        return;
    }
    state.ageGroupChart.data.labels = chartLabels.age;
    state.ageGroupChart.data.datasets[0].data = counts;
    state.ageGroupChart.data.datasets[0].backgroundColor = chartColors.age;
    state.ageGroupChart.update();
    const total = counts.reduce((sum, value) => sum + value, 0);
    toggleEmptyState('ageGroupChartEmpty', total > 0);
}

export function updateBloodGroupChart() {
    const counts = computeBloodGroupCounts();
    ensureDashboardCharts();
    if (!state.bloodGroupChart) {
        toggleEmptyState('bloodGroupChartEmpty', counts.reduce((sum, value) => sum + value, 0) > 0);
        return;
    }
    state.bloodGroupChart.data.labels = chartLabels.blood;
    state.bloodGroupChart.data.datasets[0].data = counts;
    state.bloodGroupChart.data.datasets[0].backgroundColor = chartColors.blood;
    state.bloodGroupChart.update();
    const total = counts.reduce((sum, value) => sum + value, 0);
    toggleEmptyState('bloodGroupChartEmpty', total > 0);
}

export function updateMonthlyDonationsChart() {
    const { counts, year, total } = computeMonthlyDonationsCounts();
    const yearEl = document.getElementById('monthly-donations-year');
    if (yearEl) yearEl.textContent = total > 0 ? String(year) : '';
    ensureDashboardCharts();
    if (!state.monthlyDonationsChart) {
        toggleEmptyState('monthlyDonationsChartEmpty', total > 0);
        return;
    }
    state.monthlyDonationsChart.data.labels = chartLabels.months;
    state.monthlyDonationsChart.data.datasets[0].data = counts;
    state.monthlyDonationsChart.data.datasets[0].backgroundColor = chartColors.months;
    state.monthlyDonationsChart.update();
    toggleEmptyState('monthlyDonationsChartEmpty', total > 0);
}

export function refreshDashboardCharts() {
    updateAgeGroupChart();
    updateMonthlyDonationsChart();
    updateBloodGroupChart();
}

export function setupStatsVisibilityObserver() {
    if (state.isStatsObserverInitialized) return;
    state.isStatsObserverInitialized = true;
    const section = document.getElementById('dashboard-insights');
    if (!section || !('IntersectionObserver' in window)) {
        window.__statsVisible__ = true;
        flushPendingCounts();
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        const entry = entries.find(Boolean);
        if (!entry) return;
        window.__statsVisible__ = entry.isIntersecting;
        if (entry.isIntersecting) {
            flushPendingCounts();
            refreshDashboardCharts();
        }
    }, { threshold: 0.25 });
    observer.observe(section);
}

export function initDashboardRefreshTimer() {
    if (!state.dashboardRefreshTimer) {
        state.dashboardRefreshTimer = window.setInterval(() => {
            if (document.visibilityState === 'hidden') return;
            refreshDashboardCharts();
        }, 60000);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                refreshDashboardCharts();
            }
        });
    }
}
