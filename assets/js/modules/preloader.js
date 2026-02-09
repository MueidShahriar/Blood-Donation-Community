export function initPreloader() {
    const pageLoader = document.getElementById('page-loader');
    if (pageLoader) {
        setTimeout(() => {
            pageLoader.classList.add('fade-out');
            document.body.classList.remove('loading');
            setTimeout(() => {
                pageLoader.style.display = 'none';
            }, 500);
        }, 2200);
    }
}
