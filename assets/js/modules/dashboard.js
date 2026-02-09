import state from './state.js';
import { chartLabels, chartColors, getPieChartOptions } from './chart-config.js';
import { inferAgeValue, toggleEmptyState } from './utils.js';
import { flushPendingCounts } from './stats-counter.js';

export function ensureDashboardCharts() {
    if (typeof Chart === 'undefined') return;
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

export function updateAgeGroupChart() {
    ensureDashboardCharts();
    if (!state.ageGroupChart) return;
    const counts = computeAgeGroupCounts();
    state.ageGroupChart.data.labels = chartLabels.age;
    state.ageGroupChart.data.datasets[0].data = counts;
    state.ageGroupChart.data.datasets[0].backgroundColor = chartColors.age;
    state.ageGroupChart.update();
    const total = counts.reduce((sum, value) => sum + value, 0);
    toggleEmptyState('ageGroupChartEmpty', total > 0);
}

export function updateBloodGroupChart() {
    ensureDashboardCharts();
    if (!state.bloodGroupChart) return;
    const counts = computeBloodGroupCounts();
    state.bloodGroupChart.data.labels = chartLabels.blood;
    state.bloodGroupChart.data.datasets[0].data = counts;
    state.bloodGroupChart.data.datasets[0].backgroundColor = chartColors.blood;
    state.bloodGroupChart.update();
    const total = counts.reduce((sum, value) => sum + value, 0);
    toggleEmptyState('bloodGroupChartEmpty', total > 0);
}

export function refreshDashboardCharts() {
    updateAgeGroupChart();
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
