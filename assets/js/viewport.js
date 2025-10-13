(function () {
    const vp = document.querySelector('meta[name="viewport"]');
    if (!vp) return;
    const apply = () => {
        const isMobile = (navigator.userAgentData && navigator.userAgentData.mobile) || /Mobi|Android/i.test(navigator.userAgent);
        const narrow = Math.min(window.innerWidth, window.innerHeight) <= 420;
        const scale = (isMobile && narrow) ? 0.75 : 1;
        const current = vp.getAttribute('content') || '';
        const next = `width=device-width, initial-scale=${scale}`;
        if (current !== next) vp.setAttribute('content', next);
    };
    window.addEventListener('load', apply, {
        once: true
    });
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
})();
