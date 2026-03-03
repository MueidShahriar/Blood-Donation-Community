
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    deleteUser,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
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
import { initVisitorTracker } from "./modules/visitor-tracker.js";
import { initChatbot } from "./modules/chatbot.js";

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
const profilePhotoInput = document.getElementById('profile-photo-input');
const profileAvatarImg = document.getElementById('profile-avatar-img');

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
initVisitorTracker(database, false); // Profile page — online users only
initFeedback(feedbackRef, push);
initChatbot();

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
    // Show profile photo if available
    if (profileAvatarImg && data.profilePhoto) {
        profileAvatarImg.src = data.profilePhoto;
        profileAvatarImg.style.display = 'block';
        if (avatarText) avatarText.style.display = 'none';
    } else if (profileAvatarImg) {
        profileAvatarImg.style.display = 'none';
        if (avatarText) avatarText.style.display = '';
    }
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
        } else if (auth.currentUser && auth.currentUser.metadata && auth.currentUser.metadata.creationTime) {
            const _d = new Date(auth.currentUser.metadata.creationTime);
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
            // Admin badge hidden from navbar (admin text removed)
            if (adminBadge) { adminBadge.classList.add('hidden'); adminBadge.classList.remove('inline-flex'); }
            // Show Dashboard in mobile menu for admin
            adminMobileLink?.classList.remove('hidden');
            if (adminDesktopLink) { adminDesktopLink.classList.remove('hidden'); }
            // Admin sees only Profile + Dashboard — hide all other nav links
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

// Gmail-only regex (same as join form)
const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

// ── Email Change Modal elements ──
const emailChangeModal = document.getElementById('email-change-modal');
const emailChangeForm = document.getElementById('email-change-form');
const ecNewEmailDisplay = document.getElementById('ec-new-email');
const ecPassword = document.getElementById('ec-password');
const ecError = document.getElementById('ec-error');
const ecCancel = document.getElementById('ec-cancel');

// Pending profile data when email change is in progress
let pendingProfileUpdate = null;

ecCancel?.addEventListener('click', () => closeModal(emailChangeModal));
emailChangeModal?.querySelector('.absolute.inset-0')?.addEventListener('click', () => closeModal(emailChangeModal));

// Email update is handled directly in the profile form submit handler below.
// No re-authentication modal needed — email is saved to the database only.

profileForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const fd = new FormData(profileForm);

    const newEmail = fd.get('email')?.toString().trim() || '';
    const emailChanged = newEmail && newEmail !== currentUser.email;

    // Validate Gmail if email changed
    if (emailChanged && !gmailRegex.test(newEmail)) {
        showToast('Only @gmail.com email addresses are accepted.', 'error');
        return;
    }

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
        email: emailChanged ? newEmail : currentUser.email,
        role: fd.get('role')?.toString().trim() || 'member'
    };
    // Preserve profile photo if it exists
    if (currentDonorData.profilePhoto) {
        updatedData.profilePhoto = currentDonorData.profilePhoto;
    }
    delete updatedData.uid;

    // Save directly (email stored in DB only, Firebase Auth login email unchanged)
    const userRef = ref(database, 'donors/' + currentUser.uid);
    set(userRef, updatedData)
        .then(() => {
            showToast('Profile updated successfully!', 'success');
            populateProfile(updatedData, updatedData.email || currentUser.email);
        })
        .catch((err) => {
            console.error('Update failed:', err);
            showToast('Failed to update profile.', 'error');
        });
});

// ── Photo upload handler ──
profilePhotoInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    // Validate file type
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
        showToast('Only PNG or JPEG images are allowed.', 'error');
        profilePhotoInput.value = '';
        return;
    }
    // Validate file size (max 500KB)
    if (file.size > 500 * 1024) {
        showToast('Image must be under 500KB.', 'error');
        profilePhotoInput.value = '';
        return;
    }

    try {
        const base64 = await resizeAndCompressPhoto(file, 300, 300);
        const userRef = ref(database, 'donors/' + currentUser.uid + '/profilePhoto');
        await set(userRef, base64);
        if (profileAvatarImg) {
            profileAvatarImg.src = base64;
            profileAvatarImg.style.display = 'block';
        }
        if (avatarText) avatarText.style.display = 'none';
        currentDonorData.profilePhoto = base64;
        showToast('Profile photo updated!', 'success');
    } catch (err) {
        console.error('Photo upload failed:', err);
        showToast('Failed to upload photo.', 'error');
    }
    profilePhotoInput.value = '';
});

function resizeAndCompressPhoto(file, maxW, maxH) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = maxW;
                canvas.height = maxH;
                const ctx = canvas.getContext('2d');
                // Center-crop to square
                const side = Math.min(img.width, img.height);
                const sx = (img.width - side) / 2;
                const sy = (img.height - side) / 2;
                ctx.drawImage(img, sx, sy, side, side, 0, 0, maxW, maxH);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve(dataUrl);
            };
            img.onerror = reject;
            img.src = ev.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

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
        // Ensure memberSince fallback from Firebase Auth metadata
        if (!donorData.createdAt && currentUser.metadata?.creationTime) {
            donorData.memberSince = currentUser.metadata.creationTime;
        }
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
        closeModal(changePasswordModal);
        closeModal(emailChangeModal);
    }
});

/* ── Change Password ── */
const changePasswordModal = document.getElementById('change-password-modal');
const changePasswordForm = document.getElementById('change-password-form');
const changePasswordBtn = document.getElementById('pf-change-password');
const cpCancel = document.getElementById('cp-cancel');
const cpError = document.getElementById('cp-error');

changePasswordBtn?.addEventListener('click', () => {
    if (!currentUser) {
        showToast('You must be logged in.', 'error');
        return;
    }
    // Reset form
    changePasswordForm?.reset();
    if (cpError) { cpError.textContent = ''; cpError.classList.add('hidden'); }
    openModal(changePasswordModal);
});

cpCancel?.addEventListener('click', () => closeModal(changePasswordModal));
changePasswordModal?.querySelector('.absolute.inset-0')?.addEventListener('click', () => closeModal(changePasswordModal));

changePasswordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const currentPwd = document.getElementById('cp-current')?.value;
    const newPwd = document.getElementById('cp-new')?.value;
    const confirmPwd = document.getElementById('cp-confirm')?.value;

    // Reset error
    if (cpError) { cpError.textContent = ''; cpError.classList.add('hidden'); }

    if (!currentPwd || !newPwd || !confirmPwd) {
        if (cpError) { cpError.textContent = 'All fields are required.'; cpError.classList.remove('hidden'); }
        return;
    }

    if (newPwd.length < 6) {
        if (cpError) { cpError.textContent = 'New password must be at least 6 characters.'; cpError.classList.remove('hidden'); }
        return;
    }

    if (newPwd !== confirmPwd) {
        if (cpError) { cpError.textContent = 'New passwords do not match.'; cpError.classList.remove('hidden'); }
        return;
    }

    if (currentPwd === newPwd) {
        if (cpError) { cpError.textContent = 'New password must be different from current password.'; cpError.classList.remove('hidden'); }
        return;
    }

    const submitBtn = document.getElementById('cp-submit');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Updating...'; }

    try {
        // Re-authenticate first
        const credential = EmailAuthProvider.credential(currentUser.email, currentPwd);
        await reauthenticateWithCredential(currentUser, credential);

        // Update password
        await updatePassword(currentUser, newPwd);

        closeModal(changePasswordModal);
        showToast('Password updated successfully!', 'success');
        changePasswordForm.reset();
    } catch (err) {
        console.error('Password change error:', err);
        let msg = 'Failed to change password.';
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            msg = 'Current password is incorrect.';
        } else if (err.code === 'auth/weak-password') {
            msg = 'New password is too weak. Use at least 6 characters.';
        } else if (err.code === 'auth/too-many-requests') {
            msg = 'Too many attempts. Please try again later.';
        } else if (err.code === 'auth/requires-recent-login') {
            msg = 'Session expired. Please log out and log in again.';
        }
        if (cpError) { cpError.textContent = msg; cpError.classList.remove('hidden'); }
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Update Password'; }
    }
});
