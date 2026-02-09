/* ═══════════════════════════════════════════════════════════════
   Blood Donation Community – lightweight entry for static pages
   (about.html, donationGuide.html)
   Only loads: preloader, header, mobile menu, float-in, back-to-top
   ═══════════════════════════════════════════════════════════════ */

import { initPreloader } from "./modules/preloader.js";
import { initHeader, initMobileMenu } from "./modules/header.js";
import { initFloatObserver } from "./modules/float-observer.js";
import { initBackToTop } from "./modules/back-to-top.js";

window.onload = function () {
    initPreloader();
    initHeader();
    initMobileMenu();
    initFloatObserver();
    initBackToTop();
};
