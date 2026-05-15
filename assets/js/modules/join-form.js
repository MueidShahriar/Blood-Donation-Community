import state from './state.js';
import { showModalMessage } from './modals.js';
import { normalizeDonorId, getDonorIdNumber, getMaxDonorIdNumber, DONOR_ID_COUNTER_SEED } from './utils.js';

export function initJoinForm({ auth, database, ref, set, runTransaction, createUserWithEmailAndPassword }) {
    state.joinFeedbackEl = document.getElementById('join-feedback');

    function clearJoinFeedback() {
        if (!state.joinFeedbackEl) return;
        state.joinFeedbackEl.textContent = '';
        state.joinFeedbackEl.classList.add('hidden');
        state.joinFeedbackEl.classList.remove('join-feedback--success', 'join-feedback--error');
    }

    function setJoinFeedback(message, type = 'success') {
        if (!state.joinFeedbackEl || !message) return;
        state.joinFeedbackEl.textContent = message;
        state.joinFeedbackEl.classList.remove('hidden', 'join-feedback--success', 'join-feedback--error');
        state.joinFeedbackEl.classList.add(type === 'error' ? 'join-feedback--error' : 'join-feedback--success');
    }

    const joinForm = document.getElementById('join-form');
    const joinClear = document.getElementById('join-clear');

    joinForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearJoinFeedback();
        const fd = new FormData(joinForm);
        const email = fd.get('email')?.toString().trim();
        const password = fd.get('password')?.toString();
        const confirm = fd.get('confirmPassword')?.toString();
        const gender = fd.get('gender')?.toString();
        const isPhoneHidden = gender === 'Female';
        const donorData = {
            fullName: fd.get('fullName')?.toString().trim(),
            phone: fd.get('phone')?.toString().trim(),
            bloodGroup: fd.get('bloodGroup')?.toString().trim(),
            location: fd.get('location')?.toString().trim(),
            lastDonateDate: fd.get('lastDonateDate')?.toString() || '',
            role: 'member',
            gender: gender || 'Other',
            isPhoneHidden: isPhoneHidden
        };
        if (!donorData.fullName || donorData.fullName.length < 3) { setJoinFeedback('Please enter your full name (minimum 3 characters).', 'error'); return; }
        if (!email) { setJoinFeedback('Please provide a valid email address.', 'error'); return; }
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
        if (!gmailRegex.test(email)) { setJoinFeedback('Only @gmail.com email addresses are accepted. Please use a Gmail account.', 'error'); return; }
        if (!donorData.bloodGroup) { setJoinFeedback('Please select your blood group to help matches find you.', 'error'); return; }
        if (!donorData.phone) { setJoinFeedback('Phone number is required.', 'error'); return; }
        const numericPhone = donorData.phone.replace(/[^\d+]/g, '');
        if (numericPhone.length < 10) { setJoinFeedback('Please enter a phone number with at least 10 digits.', 'error'); return; }
        const digitsOnly = donorData.phone.replace(/\D/g, '');
        donorData.phone = donorData.phone.trim().startsWith('+') ? `+${digitsOnly}` : digitsOnly;
        if (!donorData.location || donorData.location.length < 3) { setJoinFeedback('Share your current location (minimum 3 characters).', 'error'); return; }
        if (donorData.lastDonateDate) {
            const lastDonation = new Date(donorData.lastDonateDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (Number.isNaN(lastDonation.getTime()) || lastDonation > today) { setJoinFeedback('Last donation date cannot be in the future.', 'error'); return; }
        }
        if (!password || !confirm) { setJoinFeedback('Please set and confirm your password.', 'error'); return; }
        if (password !== confirm) { setJoinFeedback('Passwords do not match. Please re-enter them.', 'error'); return; }
        if (password.length < 6) { setJoinFeedback('Password must be at least 6 characters.', 'error'); return; }

        let accountCreated = false;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            accountCreated = true;
            const user = userCredential.user;
            const donorRef = ref(database, 'donors/' + user.uid);
            const counterRef = ref(database, 'stats/donorIdCounter');
            const result = await runTransaction(counterRef, (current) => {
                const currentNum = getDonorIdNumber(current);
                const counterCurrent = Number.isFinite(currentNum) ? currentNum : DONOR_ID_COUNTER_SEED;
                const existingMax = getMaxDonorIdNumber(state.donorsList);
                return Math.max(counterCurrent, existingMax, DONOR_ID_COUNTER_SEED) + 1;
            });
            if (!result.committed) throw new Error('Failed to allocate donor ID');
            const donorId = normalizeDonorId(result.snapshot.val());
            await set(donorRef, {
                ...donorData,
                donorId,
                totalDonations: 0,
                email,
                createdAt: new Date().toISOString()
            });
            setJoinFeedback(`Welcome, ${donorData.fullName}! Your donor profile was created successfully.`, 'success');
            showModalMessage('success-modal', `Welcome, ${donorData.fullName}! Your donor profile was created successfully.`, 'Success');
            joinForm.reset();
            setTimeout(() => clearJoinFeedback(), 7000);
        } catch (error) {
            console.error('Join form submission failed:', error);
            if (accountCreated) {
                setJoinFeedback('An error occurred while saving your profile data. Please try again.', 'error');
                showModalMessage('success-modal', 'An error occurred while saving your profile data.', 'Error');
            } else {
                setJoinFeedback(`Signup failed: ${error.message}`, 'error');
                showModalMessage('success-modal', `Signup failed: ${error.message}`, 'Error');
            }
        }
    });

    joinClear?.addEventListener('click', () => {
        joinForm?.reset();
        clearJoinFeedback();
    });
}
