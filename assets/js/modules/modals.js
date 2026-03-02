/** Focusable selectors inside a modal */
const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    /* Accessibility */
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    document.body.style.overflow = 'hidden';

    /* Focus first interactive element */
    requestAnimationFrame(() => {
        const first = modal.querySelector(FOCUSABLE);
        if (first) first.focus();
    });

    /* Trap focus inside the modal */
    modal._trapFocus = (e) => {
        if (e.key !== 'Tab') return;
        const focusables = [...modal.querySelectorAll(FOCUSABLE)];
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    modal.addEventListener('keydown', modal._trapFocus);
}

export function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.removeAttribute('aria-modal');
    document.body.style.overflow = '';

    /* Cleanup focus trap */
    if (modal._trapFocus) {
        modal.removeEventListener('keydown', modal._trapFocus);
        delete modal._trapFocus;
    }
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
