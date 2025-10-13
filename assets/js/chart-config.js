export const chartLabels = {
    age: ['18-25', '26-35', '36-45', '46+'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    blood: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
};

export const chartColors = {
    age: ['#34d399', '#f97316', '#facc15', '#f87171'],
    months: ['#ef4444', '#f97316', '#facc15', '#a3e635', '#34d399', '#22d3ee', '#38bdf8', '#6366f1', '#a855f7', '#ec4899', '#f87171', '#fb7185'],
    blood: ['#ef4444', '#f97316', '#22d3ee', '#14b8a6', '#a855f7', '#fb7185', '#facc15', '#6366f1']
};

export function getPieChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    boxWidth: 10
                }
            },
            tooltip: {
                callbacks: {
                    label(context) {
                        const value = Number(context.parsed ?? 0);
                        const dataset = context.dataset?.data || [];
                        const total = dataset.reduce((sum, item) => sum + Number(item || 0), 0);
                        const percentage = total ? Math.round((value / total) * 100) : 0;
                        return `${context.label || 'Value'}: ${value}${total ? ` (${percentage}%)` : ''}`;
                    }
                }
            }
        },
        animation: {
            duration: 600,
            easing: 'easeOutQuart'
        }
    };
}
