export function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    const footerEl = document.querySelector('footer');
    function updateBackToTopVisibility() {
        if (!backToTopBtn) return;
        const beyond = window.scrollY > 300;
        let footerVisible = false;
        if (footerEl) {
            const rect = footerEl.getBoundingClientRect();
            footerVisible = rect && rect.top < window.innerHeight;
        }
        if (beyond && !footerVisible) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    }
    window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
    window.addEventListener('resize', updateBackToTopVisibility);
    updateBackToTopVisibility();
    if ('IntersectionObserver' in window && footerEl && backToTopBtn) {
        const fabFooterIO = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const footerVisible = entry.isIntersecting && entry.intersectionRatio > 0.01;
                if (footerVisible) {
                    backToTopBtn.classList.remove('show');
                } else {
                    updateBackToTopVisibility();
                }
            });
        }, {
            threshold: [0, 0.01, 0.1]
        });
        fabFooterIO.observe(footerEl);
    }
    backToTopBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
