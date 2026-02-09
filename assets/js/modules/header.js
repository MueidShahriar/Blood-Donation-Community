export function initHeader() {
    function setHeaderOffset() {
        const header = document.querySelector('header');
        const h = header ? header.offsetHeight : 0;
        document.documentElement.style.setProperty('--header-height', h + 'px');
    }
    setHeaderOffset();
    window.addEventListener('resize', setHeaderOffset);
    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(() => setHeaderOffset());
        ro.observe(document.body);
    }
    let lastScrollY = 0;
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (!header) return;
        const currentScrollY = window.scrollY;
        if (currentScrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        lastScrollY = currentScrollY;
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
