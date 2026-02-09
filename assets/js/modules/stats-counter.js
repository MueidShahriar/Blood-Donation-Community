const __pendingCounts__ = new Map();
window.__statsVisible__ = false;
window.__animateCountTo__ = undefined;

export function setCountTarget(id, value) {
    const v = Number(value || 0);
    const el = document.getElementById(id);
    if (!el) {
        __pendingCounts__.set(id, v);
        return;
    }
    el.dataset.countTo = String(v);
    if (window.__statsVisible__ && typeof window.__animateCountTo__ === 'function') {
        window.__animateCountTo__(el, v);
    }
}

export function flushPendingCounts() {
    if (!__pendingCounts__.size) return;
    const pendingEntries = Array.from(__pendingCounts__.entries());
    __pendingCounts__.clear();
    pendingEntries.forEach(([id, value]) => {
        setCountTarget(id, value);
    });
}

export function getPendingCounts() {
    return __pendingCounts__;
}

export function initStatsCounter() {
    const statNums = document.querySelectorAll('.stat-card .num');
    const fmt = (n) => n.toLocaleString();

    const animateCountTo = (el, target, duration = 1200, startOverride = undefined) => {
        const startVal = (startOverride != null)
            ? Number(startOverride)
            : Number(el.textContent.replace(/,/g, '') || '0');
        const start = performance.now();
        const ease = (t) => 1 - Math.pow(1 - t, 3);
        const step = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const val = Math.round(startVal + (target - startVal) * ease(p));
            el.textContent = fmt(val);
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };
    window.__animateCountTo__ = animateCountTo;

    let statsWasVisible = false;
    const statsCard = document.querySelector('#donor-count')?.closest('.how-card') || document.querySelector('.stats-grid');

    if ('IntersectionObserver' in window && statsCard) {
        const statsIO = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const nowVisible = entry.isIntersecting && entry.intersectionRatio > 0.30;
                const becameVisible = nowVisible && !statsWasVisible;
                window.__statsVisible__ = nowVisible;
                if (becameVisible) {
                    statNums.forEach(el => {
                        const target = Number(el.dataset.countTo || el.textContent || '0');
                        animateCountTo(el, target, 1500, 0);
                    });
                }
                statsWasVisible = nowVisible;
            });
        }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
        statsIO.observe(statsCard);
    } else if (statsCard) {
        statNums.forEach(el => {
            const target = Number(el.dataset.countTo || el.textContent || '0');
            animateCountTo(el, target);
        });
    }

    if (__pendingCounts__.size) {
        for (const [id, v] of __pendingCounts__) {
            const el = document.getElementById(id);
            if (el) el.dataset.countTo = String(v);
        }
        __pendingCounts__.clear();
    }
}
