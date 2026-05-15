import state from './state.js';
import { openModal, closeModal, showModalMessage } from './modals.js';
import { t } from './language-ui.js';
import { getInitials, getTextValue } from './utils.js';

function getAuthRedirectOverlay() {
    let overlay = document.getElementById('auth-redirect-overlay');
    if (!overlay) {
        const assetPrefix = window.location.pathname.includes('/pages/') ? '../' : '';
        overlay = document.createElement('div');
        overlay.id = 'auth-redirect-overlay';
        overlay.className = 'auth-redirect-overlay';
        overlay.innerHTML =
            '<div class="logo-wrapper">' +
                '<div class="logo-base">' +
                    '<img src="' + assetPrefix + 'image/blood-drop.png" alt="" />' +
                '</div>' +
                '<div class="logo-fill">' +
                    '<img src="' + assetPrefix + 'image/blood-drop.png" alt="Loading" />' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);
    }
    return overlay;
}

function showAuthRedirectOverlay() {
    if (state.isAuthRedirecting) return;
    state.isAuthRedirecting = true;
    const overlay = getAuthRedirectOverlay();
    overlay.classList.add('is-visible');
    document.body.classList.add('auth-redirecting');
}

function hideAuthRedirectOverlay() {
    if (!state.isAuthRedirecting) return;
    state.isAuthRedirecting = false;
    const overlay = document.getElementById('auth-redirect-overlay');
    if (overlay) overlay.classList.remove('is-visible');
    document.body.classList.remove('auth-redirecting');
}

function getProfileHref() {
    const path = window.location.pathname || '';
    return path.includes('/pages/') ? 'profile.html' : 'pages/profile.html';
}

function getAdminHref() {
    const path = window.location.pathname || '';
    return path.includes('/pages/') ? 'admin.html' : 'pages/admin.html';
}

export function updateLoginButtonState(database, ref, onValue, renderAdminMembersList, renderAdminEventsList, deleteMemberFn, deleteEventFn, afterRoleResolvedFn, promoteMemberFn, demoteMemberFn) {
    if (state.isAuthRedirecting) return;
    const assetPrefix = window.location.pathname.includes('/pages/') ? '../' : '';
    const isAdminPage = /\/(pages\/)?admin\.html$/i.test(window.location.pathname || '');
    const loginBtn = document.getElementById('login-btn');
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const profileUserId = document.getElementById('profile-userId');
    const adminPanel = document.getElementById('admin-panel');
    const adminBadge = document.getElementById('admin-badge');
    const adminMobileLink = document.getElementById('admin-mobile-link');
    const adminDesktopLink = document.getElementById('nav-dashboard-link');
    const leaderboardSection = document.getElementById('donor-leaderboard');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    const mobileProfileBtn = document.getElementById('mobile-profile-btn');
    // All regular nav link IDs (desktop + mobile) to hide for admin
    const navLinkIds = ['nav-home-link','nav-about-link','nav-how-link','nav-events-link','nav-join-link','nav-search-link','nav-contact-link'];
    const mobileNavIds = ['mobile-home-link','mobile-about-link','mobile-how-link','mobile-events-link','mobile-join-link','mobile-search-link','mobile-contact-link'];
    if (!loginBtn && !mobileLoginBtn) return;
    if (state.currentUser) {
        if (mobileLogoutBtn) { mobileLogoutBtn.classList.remove('hidden'); mobileLogoutBtn.classList.add('block'); }
        if (profileUserId) profileUserId.textContent = `User ID: ${state.currentUser.uid}`;
        const userRef = ref(database, `donors/${state.currentUser.uid}`);
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val() || {};
            state.currentUserRole = userData.role || 'member';
            const photoUrl = userData.profilePhoto || '';
            const displayName = getTextValue(userData.fullName || userData.name, 'User');
            const initials = getInitials(displayName, 'U');
            if (loginBtn) {
                if (photoUrl) {
                    loginBtn.innerHTML = '<img src="' + photoUrl + '" alt="' + t('btnProfile') + '" class="nav-avatar"><span class="sr-only">' + t('btnProfile') + '</span>';
                    loginBtn.classList.add('nav-avatar-btn');
                } else {
                    loginBtn.innerHTML = '<img src="' + assetPrefix + 'image/login.png" alt="Profile" class="inline-icon"><span class="sr-only">' + t('btnProfile') + '</span>';
                    loginBtn.classList.remove('nav-avatar-btn');
                }
                loginBtn.setAttribute('aria-label', t('btnProfile'));
                loginBtn.setAttribute('title', t('btnProfile'));
                loginBtn.dataset.state = 'loggedin';
                loginBtn.removeAttribute('data-i18n');
            }
            if (mobileProfileBtn) {
                if (photoUrl) {
                    mobileProfileBtn.innerHTML = '<img src="' + photoUrl + '" alt="' + t('btnProfile') + '">';
                } else {
                    mobileProfileBtn.innerHTML = '<span class="mobile-profile-btn__initials">' + initials + '</span>';
                }
                mobileProfileBtn.classList.remove('hidden');
                mobileProfileBtn.setAttribute('aria-label', t('btnProfile'));
                mobileProfileBtn.setAttribute('title', t('btnProfile'));
            }
            if (mobileLoginBtn) {
                mobileLoginBtn.classList.add('hidden');
            }
            if (state.currentUserRole === 'admin') {
                adminPanel?.classList.remove('hidden');
                document.body.classList.add('admin-mode');
                if (adminPanel && leaderboardSection) leaderboardSection.classList.add('hidden');
                // Admin badge hidden in navbar (only shown in profile page)
                if (adminBadge) { adminBadge.classList.add('hidden'); adminBadge.classList.remove('inline-flex'); }
                // Admin sees only Profile (login-btn) + Dashboard — hide all other nav links
                navLinkIds.forEach(id => document.getElementById(id)?.classList.add('hidden'));
                mobileNavIds.forEach(id => document.getElementById(id)?.classList.add('hidden'));
                // Show Dashboard in mobile menu for admin
                adminMobileLink?.classList.remove('hidden');
                if (adminDesktopLink) { adminDesktopLink.classList.remove('hidden'); }
                renderAdminMembersList(deleteMemberFn, promoteMemberFn, demoteMemberFn);
                renderAdminEventsList(deleteEventFn);
            } else {
                adminPanel?.classList.add('hidden');
                document.body.classList.remove('admin-mode');
                leaderboardSection?.classList.remove('hidden');
                if (adminBadge) { adminBadge.classList.add('hidden'); adminBadge.classList.remove('inline-flex'); }
                adminMobileLink?.classList.add('hidden');
                if (adminDesktopLink) { adminDesktopLink.classList.add('hidden'); }
                navLinkIds.forEach(id => document.getElementById(id)?.classList.remove('hidden'));
                mobileNavIds.forEach(id => document.getElementById(id)?.classList.remove('hidden'));
            }
            hideAuthRedirectOverlay();
            if (typeof afterRoleResolvedFn === 'function') afterRoleResolvedFn(state.currentUserRole);
            if (isAdminPage && state.currentUserRole !== 'admin') {
                window.location.assign(getProfileHref());
            }
        }, { onlyOnce: true });
    } else {
        if (loginBtn) {
            loginBtn.innerHTML = '<img src="' + assetPrefix + 'image/login.png" alt="Login" class="inline-icon"> ' + t('btnLogin');
            loginBtn.dataset.state = 'loggedout';
            loginBtn.setAttribute('data-i18n', 'btnLogin');
            loginBtn.classList.remove('nav-avatar-btn');
        }
        if (mobileProfileBtn) {
            mobileProfileBtn.classList.add('hidden');
            mobileProfileBtn.innerHTML = '<span class="mobile-profile-btn__initials">U</span>';
        }
        if (mobileLoginBtn) {
            mobileLoginBtn.classList.remove('hidden');
            mobileLoginBtn.innerHTML = '<img src="' + assetPrefix + 'image/login.png" alt="Login" class="inline-icon"> ' + t('btnLogin');
            mobileLoginBtn.setAttribute('data-i18n', 'btnLogin');
        }
        if (mobileLogoutBtn) { mobileLogoutBtn.classList.add('hidden'); mobileLogoutBtn.classList.remove('block'); }
        if (profileUserId) profileUserId.textContent = '';
        adminPanel?.classList.add('hidden');
        document.body.classList.remove('admin-mode');
        leaderboardSection?.classList.remove('hidden');
        adminBadge?.classList.add('hidden');
        adminMobileLink?.classList.add('hidden');
        if (adminDesktopLink) { adminDesktopLink.classList.add('hidden'); }
        // Restore ALL regular nav links for public/logged-out view
        navLinkIds.forEach(id => document.getElementById(id)?.classList.remove('hidden'));
        mobileNavIds.forEach(id => document.getElementById(id)?.classList.remove('hidden'));
        hideAuthRedirectOverlay();
        if (isAdminPage) {
            window.location.assign(assetPrefix ? '../index.html' : 'index.html');
        }
    }
}

export function initAuth({
    auth, database, ref, onValue, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged,
    renderAdminMembersFn, renderAdminEventsFn, deleteMemberFn, deleteEventFn, updateLoginFn
}) {
    const loginModal = document.getElementById('login-modal');
    const loginBtn = document.getElementById('login-btn');
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const mobileProfileBtn = document.getElementById('mobile-profile-btn');
    const loginForm = document.getElementById('login-form');
    const mobileMenu = document.getElementById('mobile-menu');

    function handleLoginClick() {
        if (state.currentUser) {
            window.location.href = getProfileHref();
        } else {
            openModal(loginModal);
        }
    }
    loginBtn?.addEventListener('click', handleLoginClick);
    mobileLoginBtn?.addEventListener('click', () => {
        if (mobileMenu) closeModal(mobileMenu);
        handleLoginClick();
    });
    mobileProfileBtn?.addEventListener('click', handleLoginClick);

    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

    const doLogout = () => {
        signOut(auth).then(() => {
            showModalMessage('success-modal', 'You have been logged out successfully.', 'Logout Successful');
        }).catch((error) => {
            console.error('Logout failed:', error);
            showModalMessage('success-modal', 'An error occurred during logout.', 'Logout Failed');
        });
    };

    mobileLogoutBtn?.addEventListener('click', () => {
        if (mobileMenu) closeModal(mobileMenu);
        doLogout();
    });

    loginForm?.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const email = document.getElementById('login-email')?.value?.trim();
        const password = document.getElementById('login-password')?.value;
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                state.currentUser = userCredential.user;
                showAuthRedirectOverlay();
                if (typeof updateLoginFn === 'function') updateLoginFn();
                closeModal(loginModal);
                const roleRef = ref(database, `donors/${state.currentUser.uid}/role`);
                onValue(roleRef, (snapshot) => {
                    const role = snapshot.val() || 'member';
                    const target = role === 'admin' ? getAdminHref() : getProfileHref();
                    window.location.assign(target);
                }, { onlyOnce: true });
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
