
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
    remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./modules/firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const loader = document.getElementById('profile-page-loader');
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

const fFullName = document.getElementById('profile-fullName');
const fEmail = document.getElementById('profile-email');
const fPhone = document.getElementById('profile-phone');
const fBloodGroup = document.getElementById('profile-bloodGroup');
const fLocation = document.getElementById('profile-location');
const fLastDonate = document.getElementById('profile-lastDonateDate');
const fNotes = document.getElementById('profile-notes');
const fRole = document.getElementById('profile-role');

const logoutHeaderBtn = document.getElementById('pf-logout-header');
const deleteBtn = document.getElementById('pf-delete');
const certBtn = document.getElementById('pf-certificate');
const deleteModal = document.getElementById('delete-confirm-modal');
const deleteCancelBtn = document.getElementById('delete-cancel');
const deleteConfirmBtn = document.getElementById('delete-confirm');

const toast = document.getElementById('profile-toast');
const toastIcon = document.getElementById('profile-toast-icon');
const toastMsg = document.getElementById('profile-toast-msg');

function hideLoader() {
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 400);
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
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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

    if (fFullName) fFullName.value = data.fullName || '';
    if (fEmail) fEmail.value = email || '';
    if (fPhone) fPhone.value = data.phone || '';
    if (fBloodGroup) fBloodGroup.value = data.bloodGroup || '';
    if (fLocation) fLocation.value = data.location || '';
    if (fLastDonate) fLastDonate.value = data.lastDonateDate || '';
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

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (!user) {
        hideLoader();
        notLoggedIn?.classList.remove('hidden');
        profileContent?.classList.add('hidden');
        return;
    }

    const userRef = ref(database, `donors/${user.uid}`);
    onValue(userRef, (snapshot) => {
        const data = snapshot.val() || {};
        populateProfile(data, user.email);
        hideLoader();
        notLoggedIn?.classList.add('hidden');
        profileContent?.classList.remove('hidden');
    }, { onlyOnce: true });
});

profileForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const fd = new FormData(profileForm);
    const updatedData = {
        fullName: fd.get('fullName')?.toString().trim() || '',
        phone: fd.get('phone')?.toString().trim() || '',
        bloodGroup: fd.get('bloodGroup')?.toString().trim() || '',
        location: fd.get('location')?.toString().trim() || '',
        lastDonateDate: fd.get('lastDonateDate')?.toString() || '',
        notes: fd.get('notes')?.toString() || '',
        email: currentUser.email,
        role: fd.get('role')?.toString().trim() || 'member'
    };
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

certBtn?.addEventListener('click', async () => {
    if (!currentUser) {
        showToast('You must be logged in.', 'error');
        return;
    }
    try {
        const { showCertificateModal } = await import('./modules/certificate.js');
        const donorData = {
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
