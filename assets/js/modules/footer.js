/**
 * footer.js — Reusable footer component
 * Single source of truth for the footer HTML across all pages.
 * Import and call initFooter() to inject the footer into any page
 * that has a <footer id="app-footer"></footer> placeholder.
 */

const FOOTER_HTML = (isHomePage) => {
    const contactHref = isHomePage ? '#contact' : 'index.html#contact';
    const homeHref    = isHomePage ? '#' : 'index.html';
    const year        = new Date().getFullYear();

    return `
    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500/60 to-transparent"></div>
    <div class="footer-glow"></div>
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div class="footer-grid">
            <div class="footer-brand">
                <div class="footer-brand-title">
                    <img src="image/blood-drop.png" alt="Blood Donation Community" loading="lazy" />
                    <span data-i18n="siteTitle">Blood Donation Community</span>
                </div>
                <p data-i18n="footerBrandDesc">A passionate, volunteer-driven organization dedicated to saving lives through the power of blood
                    donation. We connect donors with patients in urgent need.</p>
                <div class="footer-socials mt-3">
                    <a href="https://www.facebook.com/share/1CLTZN8DmU/?mibextid=wwXIfr" class="social-facebook" aria-label="Facebook"
                        target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-facebook-f"></i>
                    </a>
                    <a href="https://www.linkedin.com/company/bauet-blood-donation-club/" class="social-linkedin" aria-label="LinkedIn"
                        target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-linkedin-in"></i>
                    </a>
                    <a href="https://wa.me/8801712460423" class="social-whatsapp" aria-label="WhatsApp"
                        target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-whatsapp"></i>
                    </a>
                </div>
            </div>
            <div>
                <h4 class="footer-col-title" data-i18n="footerQuickLinks">QUICK LINKS</h4>
                <ul class="footer-links">
                    <li><a href="about.html"><i class="fa-solid fa-chevron-right"></i> <span
                                data-i18n="navAbout">About</span></a></li>
                    <li><a href="donationGuide.html"><i class="fa-solid fa-chevron-right"></i> <span
                                data-i18n="navHow">Donation Guide</span></a></li>
                    <li><a href="events.html"><i class="fa-solid fa-chevron-right"></i> <span
                                data-i18n="navEvents">Events</span></a></li>
                    <li><a href="join.html"><i class="fa-solid fa-chevron-right"></i> <span
                                data-i18n="navJoin">Join</span></a></li>
                    <li><a href="search.html"><i class="fa-solid fa-chevron-right"></i> <span
                                data-i18n="navSearch">Search</span></a></li>
                </ul>
            </div>
            <div>
                <h4 class="footer-col-title" data-i18n="footerContactInfo">Contact Info</h4>
                <ul class="footer-links">
                    <li><a href="mailto:bauet.bdc@gmail.com"><i class="fa-solid fa-envelope"></i>
                            <span>bauet.bdc@gmail.com</span></a></li>
                    <li><a href="tel:+8801712460423"><i class="fa-solid fa-phone"></i>
                            <span>+8801712460423</span></a></li>
                    <li><a href="${contactHref}"><i class="fa-solid fa-message"></i> <span
                                data-i18n="navContact">Contact</span></a></li>
                </ul>
            </div>
        </div>
        <div class="footer-feedback-wrap">
            <button id="feedback-btn" type="button"
                class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold shadow-lg backdrop-blur border border-white/10 transition-all duration-300 hover:scale-[1.03]">
                <i class="fa-solid fa-comment-dots" aria-hidden="true"></i>
                <span data-i18n="footerFeedback">Share Feedback</span>
            </button>
        </div>
        <hr class="footer-divider" />
        <div class="footer-bottom">
            <p class="footer-copy">
                &copy; ${year} <a href="${homeHref}">Blood Donation Community</a> &mdash; All rights reserved.
            </p>
            <p class="footer-copy">
                <span data-i18n="footerDeveloper">Developed by Md. Mueid Shahriar, </span> CSE-16th, BAUET
            </p>
        </div>
    </div>`;
};

/**
 * Injects the footer HTML into the <footer id="app-footer"> placeholder.
 * Automatically detects if the current page is the home page.
 */
export function initFooter() {
    const footerEl = document.getElementById('app-footer');
    if (!footerEl) return;

    const path = window.location.pathname;
    const isHomePage = /\/(index\.html)?(\?.*)?(\#.*)?$/i.test(path) || path === '/' || path.endsWith('/');

    footerEl.innerHTML = FOOTER_HTML(isHomePage);

    // Smooth reveal animation when footer enters viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                footerEl.classList.add('footer-visible');
                observer.unobserve(footerEl);
            }
        });
    }, { threshold: 0.05 });
    observer.observe(footerEl);
}
