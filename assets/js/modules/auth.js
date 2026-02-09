import state from './state.js';
import { openModal, closeModal, showModalMessage } from './modals.js';
import { t } from './language-ui.js';

export function updateLoginButtonState(database, ref, onValue, renderAdminMembersList, renderAdminEventsList, deleteMemberFn, deleteEventFn) {
    const loginBtn = document.getElementById('login-btn');
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const profileUserId = document.getElementById('profile-userId');
    const adminPanel = document.getElementById('admin-panel');
    const adminBadge = document.getElementById('admin-badge');
    const adminNavLink = document.getElementById('admin-nav-link');
    const adminMobileLink = document.getElementById('admin-mobile-link');
    const joinLink = document.getElementById('nav-join-link');
    const joinMobileLink = document.getElementById('mobile-join-link');
    const howLink = document.getElementById('nav-how-link');
    const howMobileLink = document.getElementById('mobile-how-link');
    const contactLink = document.getElementById('nav-contact-link');
    const contactMobileLink = document.getElementById('mobile-contact-link');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    if (!loginBtn && !mobileLoginBtn) return;
    if (state.currentUser) {
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fa-solid fa-user" aria-hidden="true"></i><span class="sr-only">' + t('btnProfile') + '</span>';
            loginBtn.setAttribute('aria-label', t('btnProfile'));
            loginBtn.setAttribute('title', t('btnProfile'));
            loginBtn.dataset.state = 'loggedin';
            loginBtn.removeAttribute('data-i18n');
        }
        if (mobileLoginBtn) {
            mobileLoginBtn.textContent = t('btnProfile');
            mobileLoginBtn.setAttribute('aria-label', t('btnProfile'));
            mobileLoginBtn.setAttribute('title', t('btnProfile'));
            mobileLoginBtn.removeAttribute('data-i18n');
        }
        if (mobileLogoutBtn) { mobileLogoutBtn.classList.remove('hidden'); mobileLogoutBtn.classList.add('block'); }
        if (profileUserId) profileUserId.textContent = `User ID: ${state.currentUser.uid}`;
        const userRef = ref(database, `donors/${state.currentUser.uid}/role`);
        onValue(userRef, (snapshot) => {
            state.currentUserRole = snapshot.val() || 'member';
            if (state.currentUserRole === 'admin') {
                adminPanel?.classList.remove('hidden');
                document.body.classList.add('admin-mode');
                if (adminBadge) { adminBadge.classList.remove('hidden'); adminBadge.classList.add('inline-flex'); }
                adminNavLink?.classList.remove('hidden');
                adminMobileLink?.classList.remove('hidden');
                joinLink?.classList.add('hidden');
                joinMobileLink?.classList.add('hidden');
                howLink?.classList.add('hidden');
                howMobileLink?.classList.add('hidden');
                contactLink?.classList.add('hidden');
                contactMobileLink?.classList.add('hidden');
                renderAdminMembersList(deleteMemberFn);
                renderAdminEventsList(deleteEventFn);
            } else {
                adminPanel?.classList.add('hidden');
                document.body.classList.remove('admin-mode');
                if (adminBadge) { adminBadge.classList.add('hidden'); adminBadge.classList.remove('inline-flex'); }
                adminNavLink?.classList.add('hidden');
                adminMobileLink?.classList.add('hidden');
                joinLink?.classList.remove('hidden');
                joinMobileLink?.classList.remove('hidden');
                howLink?.classList.remove('hidden');
                howMobileLink?.classList.remove('hidden');
                contactLink?.classList.remove('hidden');
                contactMobileLink?.classList.remove('hidden');
            }
        }, { onlyOnce: true });
    } else {
        if (loginBtn) {
            loginBtn.textContent = t('btnLogin');
            loginBtn.dataset.state = 'loggedout';
            loginBtn.setAttribute('data-i18n', 'btnLogin');
        }
        if (mobileLoginBtn) {
            mobileLoginBtn.textContent = t('btnLogin');
            mobileLoginBtn.setAttribute('data-i18n', 'btnLogin');
        }
        if (mobileLogoutBtn) { mobileLogoutBtn.classList.add('hidden'); mobileLogoutBtn.classList.remove('block'); }
        if (profileUserId) profileUserId.textContent = '';
        adminPanel?.classList.add('hidden');
        document.body.classList.remove('admin-mode');
        adminBadge?.classList.add('hidden');
        adminNavLink?.classList.add('hidden');
        adminMobileLink?.classList.add('hidden');
        joinLink?.classList.remove('hidden');
        joinMobileLink?.classList.remove('hidden');
        howLink?.classList.remove('hidden');
        howMobileLink?.classList.remove('hidden');
        contactLink?.classList.remove('hidden');
        contactMobileLink?.classList.remove('hidden');
    }
}

export function initAuth({
    auth, database, ref, onValue, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged,
    renderAdminMembersFn, renderAdminEventsFn, deleteMemberFn, deleteEventFn, updateLoginFn
}) {
    const loginModal = document.getElementById('login-modal');
    const loginBtn = document.getElementById('login-btn');
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const loginForm = document.getElementById('login-form');
    const mobileMenu = document.getElementById('mobile-menu');

    function handleLoginClick() {
        if (state.currentUser) {
            window.location.href = 'profile.html';
        } else {
            openModal(loginModal);
        }
    }
    loginBtn?.addEventListener('click', handleLoginClick);
    mobileLoginBtn?.addEventListener('click', () => {
        if (mobileMenu) closeModal(mobileMenu);
        handleLoginClick();
    });

    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    mobileLogoutBtn?.addEventListener('click', () => {
        if (mobileMenu) closeModal(mobileMenu);
        signOut(auth).then(() => {
            showModalMessage('success-modal', 'You have been logged out successfully.', 'Logout Successful');
        }).catch((error) => {
            console.error('Logout failed:', error);
            showModalMessage('success-modal', 'An error occurred during logout.', 'Logout Failed');
        });
    });

    loginForm?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const email = document.getElementById('login-email')?.value?.trim();
        const password = document.getElementById('login-password')?.value;
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                state.currentUser = userCredential.user;
                updateLoginFn();
                closeModal(loginModal);
                window.location.href = 'profile.html';
            })
            .catch((error) => {
                showModalMessage('success-modal', `Login failed: ${error.message}`, 'Login Failed');
            });
    });

    const forgotPasswordLink = document.getElementById('forgot-password-link');
    forgotPasswordLink?.addEventListener('click', (ev) => {
        ev.preventDefault();
        const email = document.getElementById('login-email')?.value?.trim();
        if (!email) {
            showModalMessage('success-modal', 'Please enter your email to reset the password.', 'Email Required');
            return;
        }
        sendPasswordResetEmail(auth, email)
            .then(() => {
                showModalMessage('success-modal', `A password reset link has been sent to ${email}. Please check your inbox.`, 'Password Reset Sent');
                closeModal(loginModal);
            })
            .catch((error) => {
                showModalMessage('success-modal', `Failed to send reset email: ${error.message}`, 'Password Reset Error');
            });
    });

    const pwToggle = document.getElementById('toggle-password');
    const pwInput = document.getElementById('login-password');
    pwToggle?.addEventListener('click', () => {
        if (!pwInput) return;
        const isHidden = pwInput.getAttribute('type') === 'password';
        pwInput.setAttribute('type', isHidden ? 'text' : 'password');
        pwToggle.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
        pwToggle.setAttribute('title', isHidden ? 'Hide password' : 'Show password');
        const icon = pwToggle.querySelector('i');
        if (icon) { icon.classList.toggle('fa-eye'); icon.classList.toggle('fa-eye-slash'); }
    });

    onAuthStateChanged(auth, (user) => {
        state.currentUser = user;
        updateLoginFn();
    });
}
