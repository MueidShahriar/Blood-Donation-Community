export function initFloatObserver() {
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let __floatIO__ = null;
    function registerFloatEls(root = document) {
        const els = root.querySelectorAll('.float-in:not([data-float-registered])');
        if (!els.length) return;
        if (reduceMotion) {
            els.forEach(el => {
                el.classList.add('is-visible');
                el.setAttribute('data-float-registered', '1');
            });
            return;
        }
        if ('IntersectionObserver' in window) {
            if (!__floatIO__) {
                __floatIO__ = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !entry.target.classList.contains('float-done')) {
                            entry.target.classList.add('is-visible', 'float-done');
                            __floatIO__.unobserve(entry.target);
                        }
                    });
                }, {
                    threshold: 0.15,
                    rootMargin: '0px 0px -5% 0px'
                });
            }
            els.forEach((el, i) => {
                el.style.setProperty('--delay', `${i * 100}ms`);
                el.setAttribute('data-float-registered', '1');
                __floatIO__.observe(el);
            });
        } else {
            els.forEach(el => {
                el.classList.add('is-visible');
                el.setAttribute('data-float-registered', '1');
            });
        }
    }
    window.registerFloatEls = registerFloatEls;
    registerFloatEls(document);
}
