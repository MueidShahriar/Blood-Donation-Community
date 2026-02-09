
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth, signInWithEmailAndPassword, signOut,
    onAuthStateChanged, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getDatabase, ref, onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import { firebaseConfig } from "./modules/firebase-config.js";

import { initPreloader } from "./modules/preloader.js";
import { initHeader, initMobileMenu } from "./modules/header.js";
import { initFloatObserver } from "./modules/float-observer.js";
import { initBackToTop } from "./modules/back-to-top.js";
import { openModal, closeModal, showModalMessage } from "./modules/modals.js";
import { updateLoginButtonState, initAuth } from "./modules/auth.js";
import { initLanguageSystem } from "./modules/language-ui.js";
import state from "./modules/state.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

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

    window.addEventListener('languageChanged', () => callUpdateLogin());

    const successModal = document.getElementById('success-modal');
    const loginModal = document.getElementById('login-modal');
    document.getElementById('success-close')?.addEventListener('click', () => closeModal(successModal));
    successModal?.querySelector('.absolute.inset-0')?.addEventListener('click', () => closeModal(successModal));
    document.getElementById('login-cancel')?.addEventListener('click', () => closeModal(loginModal));
    loginModal?.querySelector('.absolute.inset-0')?.addEventListener('click', () => closeModal(loginModal));
    document.addEventListener('keydown', ev => {
        if (ev.key === 'Escape') [successModal, loginModal].forEach(m => closeModal(m));
    });

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
