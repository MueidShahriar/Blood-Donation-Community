/**
 * join.js — Lightweight entry point for join.html
 * Only loads modules needed for the Join/Registration page.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
    onAuthStateChanged, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getDatabase, ref, set, onValue, push
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { firebaseConfig } from "../modules/firebase-config.js";
import state from "../modules/state.js";
import { initPreloader } from "../modules/preloader.js";
import { initHeader, initMobileMenu } from "../modules/header.js";
import { initFloatObserver } from "../modules/float-observer.js";
import { initBackToTop } from "../modules/back-to-top.js";
import { openModal, closeModal, showModalMessage } from "../modules/modals.js";
import { updateLoginButtonState, initAuth } from "../modules/auth.js";
import { initLanguageSystem } from "../modules/language-ui.js";
import { initVisitorTracker } from "../modules/visitor-tracker.js";
import { initJoinForm } from "../modules/join-form.js";
import { initFeedback } from "../modules/feedback.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const feedbackRef = ref(database, 'feedback');

function callUpdateLogin() {
    updateLoginButtonState(database, ref, onValue,
        () => {}, () => {}, () => {}, () => {});
}

window.onload = function () {
    initPreloader();
    initHeader();
    initMobileMenu();
    initFloatObserver();
    initBackToTop();
    initLanguageSystem();
    initVisitorTracker(database, false);

    window.addEventListener('languageChanged', () => callUpdateLogin());

    // Modals
    const successModal = document.getElementById('success-modal');
    const loginModal = document.getElementById('login-modal');
    document.getElementById('success-close')?.addEventListener('click', () => closeModal(successModal));
    successModal?.querySelector('.absolute.inset-0')?.addEventListener('click', () => closeModal(successModal));
    document.getElementById('login-cancel')?.addEventListener('click', () => closeModal(loginModal));
    loginModal?.querySelector('.absolute.inset-0')?.addEventListener('click', () => closeModal(loginModal));
    document.addEventListener('keydown', ev => {
        if (ev.key === 'Escape') [successModal, loginModal].forEach(m => closeModal(m));
    });

    // Feedback
    initFeedback(feedbackRef, push);

    // Join form
    initJoinForm({ auth, database, ref, set, createUserWithEmailAndPassword });

    // Auth
    initAuth({
        auth, database, ref, onValue,
        signInWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged,
        renderAdminMembersFn: () => {},
        renderAdminEventsFn: () => {},
        deleteMemberFn: () => {},
        deleteEventFn: () => {},
        updateLoginFn: callUpdateLogin
    });
};
