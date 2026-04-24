(function () {
    const vp = document.querySelector('meta[name="viewport"]');
    if (vp) {
        const desired = 'width=device-width, initial-scale=1';
        if (vp.getAttribute('content') !== desired) {
            vp.setAttribute('content', desired);
        }
    }

    window.setTimeout(() => {
        const loader = document.getElementById('page-loader');
        if (!loader || !document.body.classList.contains('loading')) return;
        loader.classList.add('fade-out');
        document.body.classList.remove('loading');
        window.setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }, 5000);
})();
