export function initHeader() {
    const header = document.querySelector('header');
    function setHeaderOffset() {
        const h = header ? header.offsetHeight : 0;
        document.documentElement.style.setProperty('--header-height', h + 'px');
    }
    setHeaderOffset();

    /* Debounced resize offset recalc */
    let resizeTimer;
    const debouncedOffset = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(setHeaderOffset, 100); };
    window.addEventListener('resize', debouncedOffset);
    if ('ResizeObserver' in window) {
        new ResizeObserver(debouncedOffset).observe(document.body);
    }

    /* rAF-throttled scroll for header shadow */
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            if (header) {
                header.classList.toggle('scrolled', window.scrollY > 50);
            }
            ticking = false;
        });
    }, { passive: true });
}

export function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    function setMenuOpen(open) {
        if (!mobileMenu || !menuToggle) return;
        mobileMenu.classList.toggle('hidden', !open);
        menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    menuToggle?.addEventListener('click', (ev) => {
        if (!mobileMenu) return;
        const open = mobileMenu.classList.contains('hidden');
        setMenuOpen(open);
        ev.stopPropagation();
    });
    mobileMenu?.querySelectorAll('a, button').forEach(a => {
        a.addEventListener('click', () => setMenuOpen(false));
    });
    document.addEventListener('click', (e) => {
        if (!mobileMenu || !menuToggle) return;
        const isOpen = !mobileMenu.classList.contains('hidden');
        const clickedInside = mobileMenu.contains(e.target) || menuToggle.contains(e.target);
        if (isOpen && !clickedInside) setMenuOpen(false);
    });
}
