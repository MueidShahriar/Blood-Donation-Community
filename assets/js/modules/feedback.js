import state from './state.js';
import { openModal, closeModal, showModalMessage } from './modals.js';

export function initFeedback(feedbackRef, push) {
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackBtn = document.getElementById('feedback-btn');
    const feedbackClose = document.getElementById('feedback-close');
    const feedbackCancel = document.getElementById('feedback-cancel');
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackMessageInput = document.getElementById('feedback-message');
    const feedbackEmailInput = document.getElementById('feedback-email');
    const feedbackOverlay = feedbackModal?.querySelector('.absolute.inset-0');

    const focusFeedbackMessage = () => {
        if (!feedbackMessageInput) return;
        setTimeout(() => feedbackMessageInput.focus({ preventScroll: false }), 70);
    };

    feedbackBtn?.addEventListener('click', () => {
        if (!feedbackModal) return;
        feedbackForm?.reset();
        openModal(feedbackModal);
        focusFeedbackMessage();
    });
    feedbackClose?.addEventListener('click', () => { feedbackForm?.reset(); closeModal(feedbackModal); });
    feedbackCancel?.addEventListener('click', () => { feedbackForm?.reset(); closeModal(feedbackModal); });
    feedbackOverlay?.addEventListener('click', () => { feedbackForm?.reset(); closeModal(feedbackModal); });

    feedbackForm?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const fd = new FormData(feedbackForm);
        const name = fd.get('name')?.toString().trim() || '';
        const email = fd.get('email')?.toString().trim() || '';
        const message = fd.get('message')?.toString().trim() || '';
        if (message.length < 10) {
            showModalMessage('success-modal', 'Please share at least 10 characters so we can act on your feedback.', 'Feedback Too Short');
            focusFeedbackMessage();
            return;
        }
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            showModalMessage('success-modal', 'Please provide a valid email address or leave it blank.', 'Invalid Email');
            if (feedbackEmailInput) feedbackEmailInput.focus();
            return;
        }
        const submitBtn = feedbackForm.querySelector('button[type="submit"]');
        submitBtn?.setAttribute('disabled', 'disabled');
        const payload = {
            name: name || 'Anonymous',
            email,
            message,
            submittedAt: new Date().toISOString(),
            userId: state.currentUser?.uid || null
        };
        push(feedbackRef, payload)
            .then(() => {
                showModalMessage('success-modal', 'Thank you for your feedback! We appreciate your time.', 'Feedback Received');
                feedbackForm.reset();
                closeModal(feedbackModal);
            })
            .catch((error) => {
                console.error('Failed to submit feedback:', error);
                showModalMessage('success-modal', `Could not submit feedback: ${error.message}`, 'Error');
            })
            .finally(() => {
                submitBtn?.removeAttribute('disabled');
            });
    });
}
