
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getDatabase,
    ref,
    onValue,
    set,
    remove,
    push
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./modules/firebase-config.js";
import { initLanguageSystem, updatePageLanguage } from "./modules/language-ui.js";
import { initBackToTop } from "./modules/back-to-top.js";
import { initFeedback } from "./modules/feedback.js";
import { initHeader, initMobileMenu } from "./modules/header.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const loader = document.getElementById('page-loader');
const notLoggedIn = document.getElementById('not-logged-in');
const profileContent = document.getElementById('profile-content');
const profileForm = document.getElementById('profile-form');

const avatarText = document.getElementById('profile-avatar-text');
const displayName = document.getElementById('profile-display-name');
const displayBlood = document.getElementById('profile-display-blood');
const displayLocation = document.getElementById('profile-display-location');
const displayEmail = document.getElementById('profile-display-email');
const statLast = document.getElementById('profile-stat-last');
const statEligible = document.getElementById('profile-stat-eligible');
const statRole = document.getElementById('profile-stat-role');
const statMemberSince = document.getElementById('profile-stat-member-since');

const fFullName = document.getElementById('profile-fullName');
const fEmail = document.getElementById('profile-email');
const fPhone = document.getElementById('profile-phone');
const fBloodGroup = document.getElementById('profile-bloodGroup');
const fLocation = document.getElementById('profile-location');
const fLastDonate = document.getElementById('profile-lastDonateDate');
const fDateOfBirth = document.getElementById('profile-dateOfBirth');
const fGender = document.getElementById('profile-gender');

const fNotes = document.getElementById('profile-notes');
const fRole = document.getElementById('profile-role');

const logoutHeaderBtn = document.getElementById('pf-logout-header');
const deleteBtn = document.getElementById('pf-delete');
const certBtn = document.getElementById('pf-certificate');
const donorCardBtn = document.getElementById('pf-donor-card');
const deleteModal = document.getElementById('delete-confirm-modal');
const deleteCancelBtn = document.getElementById('delete-cancel');
const deleteConfirmBtn = document.getElementById('delete-confirm');

const toast = document.getElementById('profile-toast');
const toastIcon = document.getElementById('profile-toast-icon');
const toastMsg = document.getElementById('profile-toast-msg');

initLanguageSystem();
window.addEventListener('languageChanged', () => updatePageLanguage());

const feedbackRef = ref(database, 'feedback');
initHeader();
initMobileMenu();
initBackToTop();
initFeedback(feedbackRef, push);

function hideLoader() {
    if (loader) {
        loader.classList.add('fade-out');
        document.body.classList.remove('loading');
        setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
}

function showToast(message, type = 'success') {
    if (!toast) return;
    toast.className = 'profile-toast';
    toast.classList.add(`profile-toast--${type}`);
    toast.classList.remove('hidden');
    if (toastIcon) {
        toastIcon.className = type === 'success'
            ? 'fa-solid fa-check-circle'
            : 'fa-solid fa-circle-xmark';
    }
    if (toastMsg) toastMsg.textContent = message;

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 350);
    }, 3000);
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0]?.toUpperCase() || '?';
}

function formatDate(dateStr) {
    if (!dateStr) return 'Not recorded';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        const pad = n => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
        return dateStr;
    }
}

function isDonorEligible(lastDonateDate) {
    if (!lastDonateDate) return 'Unknown';
    const last = new Date(lastDonateDate + 'T00:00:00');
    const now = new Date();
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    if (diffDays >= 90) return 'Eligible';
    return `${90 - diffDays} days left`;
}

function populateProfile(data, email) {
    const name = data.fullName || 'Donor';
    const blood = data.bloodGroup || '—';
    const loc = data.location || '—';
    const role = data.role || 'member';

    if (avatarText) avatarText.textContent = getInitials(name);
    if (displayName) displayName.textContent = name;
    if (displayBlood) displayBlood.querySelector('span:last-child').textContent = blood;
    if (displayLocation) displayLocation.querySelector('span:last-child').textContent = loc;
    if (displayEmail) displayEmail.textContent = email || '';
    if (statLast) statLast.textContent = formatDate(data.lastDonateDate);
    if (statEligible) {
        const elig = isDonorEligible(data.lastDonateDate);
        statEligible.textContent = elig;
        statEligible.style.color = elig === 'Eligible' ? '#059669' : elig === 'Unknown' ? '#6b7280' : '#d97706';
    }
    if (statRole) statRole.textContent = role.charAt(0).toUpperCase() + role.slice(1);

    if (statMemberSince) {
        if (data.createdAt) {
            const _d = new Date(data.createdAt);
            const _pad = n => String(n).padStart(2, '0');
            statMemberSince.textContent = `${_pad(_d.getDate())}/${_pad(_d.getMonth() + 1)}/${_d.getFullYear()}`;
        } else {
            statMemberSince.textContent = '—';
        }
    }

    if (fFullName) fFullName.value = data.fullName || '';
    if (fEmail) fEmail.value = email || '';
    if (fPhone) fPhone.value = data.phone || '';
    if (fBloodGroup) fBloodGroup.value = data.bloodGroup || '';
    if (fLocation) fLocation.value = data.location || '';
    if (fLastDonate) fLastDonate.value = data.lastDonateDate || '';
    if (fDateOfBirth) fDateOfBirth.value = data.dateOfBirth || '';
    if (fGender) fGender.value = data.gender || '';

    if (fNotes) fNotes.value = data.notes || '';
    if (fRole) fRole.value = role;
}

function openModal(m) {
    if (!m) return;
    m.classList.remove('hidden');
    m.classList.add('flex');
}
function closeModal(m) {
    if (!m) return;
    m.classList.add('hidden');
    m.classList.remove('flex');
}

let currentUser = null;
let currentDonorData = {};

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    if (!user) {
        hideLoader();
        notLoggedIn?.classList.remove('hidden');
        profileContent?.classList.add('hidden');
        if (logoutHeaderBtn) logoutHeaderBtn.style.display = 'none';
        if (mobileLogoutBtn) mobileLogoutBtn.classList.add('hidden');
        return;
    }
    if (logoutHeaderBtn) logoutHeaderBtn.style.display = '';
    if (mobileLogoutBtn) mobileLogoutBtn.classList.remove('hidden');

    const userRef = ref(database, `donors/${user.uid}`);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val() || {};
        currentDonorData = { ...data, uid: user.uid };
        populateProfile(data, user.email);
        hideLoader();
        notLoggedIn?.classList.add('hidden');
        profileContent?.classList.remove('hidden');

        // Admin vs Member navbar differentiation
        const role = data.role || 'member';
        const adminBadge = document.getElementById('admin-badge');
        const adminMobileLink = document.getElementById('admin-mobile-link');
        const adminDesktopLink = document.getElementById('nav-dashboard-link');
        // All regular nav links (desktop + mobile)
        const navLinkIds = ['nav-home-link','nav-about-link','nav-how-link','nav-events-link','nav-join-link','nav-search-link','nav-contact-link'];
        const mobileNavIds = ['mobile-home-link','mobile-about-link','mobile-how-link','mobile-events-link','mobile-join-link','mobile-search-link','mobile-contact-link'];

        if (role === 'admin') {
            document.body.classList.add('admin-mode');
            if (adminBadge) { adminBadge.classList.remove('hidden'); adminBadge.classList.add('inline-flex'); }
            adminMobileLink?.classList.remove('hidden');
            if (adminDesktopLink) { adminDesktopLink.classList.remove('hidden'); }
            // Hide ALL regular nav links for admin
            navLinkIds.forEach(id => document.getElementById(id)?.classList.add('hidden'));
            mobileNavIds.forEach(id => document.getElementById(id)?.classList.add('hidden'));
        } else {
            document.body.classList.remove('admin-mode');
            if (adminBadge) { adminBadge.classList.add('hidden'); adminBadge.classList.remove('inline-flex'); }
            adminMobileLink?.classList.add('hidden');
            if (adminDesktopLink) { adminDesktopLink.classList.add('hidden'); }
            navLinkIds.forEach(id => document.getElementById(id)?.classList.remove('hidden'));
            mobileNavIds.forEach(id => document.getElementById(id)?.classList.remove('hidden'));
        }
    }, { onlyOnce: true });
});

profileForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const fd = new FormData(profileForm);
    const updatedData = {
        ...currentDonorData,
        fullName: fd.get('fullName')?.toString().trim() || '',
        phone: fd.get('phone')?.toString().trim() || '',
        bloodGroup: fd.get('bloodGroup')?.toString().trim() || '',
        location: fd.get('location')?.toString().trim() || '',
        lastDonateDate: fd.get('lastDonateDate')?.toString() || '',
        notes: fd.get('notes')?.toString() || '',
        dateOfBirth: fd.get('dateOfBirth')?.toString() || currentDonorData.dateOfBirth || '',

        gender: fd.get('gender')?.toString() || currentDonorData.gender || '',
        email: currentUser.email,
        role: fd.get('role')?.toString().trim() || 'member'
    };
    delete updatedData.uid;
    const userRef = ref(database, 'donors/' + currentUser.uid);
    set(userRef, updatedData)
        .then(() => {
            showToast('Profile updated successfully!', 'success');
            populateProfile(updatedData, currentUser.email);
        })
        .catch((err) => {
            console.error('Update failed:', err);
            showToast('Failed to update profile.', 'error');
        });
});

function handleLogout() {
    signOut(auth).then(() => {
        showToast('Logged out', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 600);
    }).catch((err) => {
        console.error('Logout failed:', err);
        showToast('Logout failed', 'error');
    });
}
logoutHeaderBtn?.addEventListener('click', handleLogout);
document.getElementById('mobile-logout-btn')?.addEventListener('click', handleLogout);

certBtn?.addEventListener('click', async () => {
    if (!currentUser) {
        showToast('You must be logged in.', 'error');
        return;
    }
    try {
        const { showCertificateModal } = await import('./modules/certificate.js');
        const donorData = {
            ...currentDonorData,
            fullName: fFullName?.value || '',
            email: fEmail?.value || '',
            bloodGroup: fBloodGroup?.value || '',
            location: fLocation?.value || '',
            lastDonateDate: fLastDonate?.value || '',
            phone: fPhone?.value || ''
        };
        showCertificateModal(donorData);
    } catch (err) {
        console.error('Certificate error:', err);
        showToast('Failed to generate certificate.', 'error');
    }
});

donorCardBtn?.addEventListener('click', async () => {
    if (!currentUser) {
        showToast('You must be logged in.', 'error');
        return;
    }
    try {
        const { showDonorCardModal } = await import('./modules/certificate.js');
        const donorData = {
            ...currentDonorData,
            fullName: fFullName?.value || '',
            email: fEmail?.value || '',
            bloodGroup: fBloodGroup?.value || '',
            location: fLocation?.value || '',
            lastDonateDate: fLastDonate?.value || '',
            phone: fPhone?.value || '',
            uid: currentUser?.uid || ''
        };
        showDonorCardModal(donorData);
    } catch (err) {
        console.error('Donor card error:', err);
        showToast('Failed to load donor card.', 'error');
    }
});

deleteBtn?.addEventListener('click', () => {
    openModal(deleteModal);
});

deleteCancelBtn?.addEventListener('click', () => closeModal(deleteModal));
deleteModal?.querySelector('.absolute.inset-0')?.addEventListener('click', () => closeModal(deleteModal));

deleteConfirmBtn?.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) {
        showToast('Not logged in.', 'error');
        return;
    }
    const donorRef = ref(database, 'donors/' + user.uid);
    remove(donorRef)
        .then(() => deleteUser(user))
        .then(() => {
            closeModal(deleteModal);
            showToast('Account deleted.', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 800);
        })
        .catch((err) => {
            if (err && err.code === 'auth/requires-recent-login') {
                showToast('Please log in again to delete your account.', 'error');
                signOut(auth).then(() => {
                    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
                });
            } else {
                console.error('Delete failed:', err);
                showToast('Failed to delete account.', 'error');
            }
        });
});

document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
        closeModal(deleteModal);
    }
});
