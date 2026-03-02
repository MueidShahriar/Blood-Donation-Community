export function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;

    const footerEl = document.querySelector('footer');
    let footerIsVisible = false;

    /* Use IntersectionObserver for footer detection (no layout thrashing) */
    if ('IntersectionObserver' in window && footerEl) {
        const fabFooterIO = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                footerIsVisible = entry.isIntersecting && entry.intersectionRatio > 0.01;
                updateBtn();
            });
        }, { threshold: [0, 0.01, 0.1] });
        fabFooterIO.observe(footerEl);
    }

    function updateBtn() {
        const beyond = window.scrollY > 300;
        backToTopBtn.classList.toggle('show', beyond && !footerIsVisible);
    }

    /* rAF-throttled scroll listener */
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            updateBtn();
            ticking = false;
        });
    }, { passive: true });

    updateBtn();

    backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
