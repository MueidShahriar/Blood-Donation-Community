export function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

export function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

export function showModalMessage(modal, message, title) {
    let modalEl = null;
    if (typeof modal === 'string') modalEl = document.getElementById(modal);
    else modalEl = modal || document.getElementById('success-modal');
    if (!modalEl) return;
    const titleEl = modalEl.querySelector('h3');
    const messageEl = modalEl.querySelector('p');
    if (titleEl && title) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message || '';
    openModal(modalEl);
}

export function attachConfirmHandler(callback, opts = {}) {
    const modal = document.getElementById('delete-confirm-modal');
    if (!modal) return;
    const titleEl = modal.querySelector('h3');
    const messageEl = modal.querySelector('p');
    if (opts.title && titleEl) titleEl.textContent = opts.title;
    if (opts.message && messageEl) messageEl.textContent = opts.message;
    const confirmBtn = document.getElementById('delete-confirm');
    if (!confirmBtn) {
        openModal(modal);
        return;
    }
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.addEventListener('click', () => {
        try {
            callback();
        } catch (err) {
            console.error('Error in confirm handler:', err);
        }
    }, { once: true });
    openModal(modal);
}
