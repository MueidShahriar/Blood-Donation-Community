(function () {
    const vp = document.querySelector('meta[name="viewport"]');
    if (!vp) return;
    const desired = 'width=device-width, initial-scale=1';
    if (vp.getAttribute('content') !== desired) {
        vp.setAttribute('content', desired);
    }
})();
