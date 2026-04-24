import state from './state.js';
import { getInitials, getTextValue } from './utils.js';

export function setRecentLoading(isLoading) {
    state.recentLoaderState = !!isLoading;
    if (!state.recentLoaderEl) return;
    if (isLoading) {
        state.recentLoaderEl.classList.remove('hidden');
        state.recentLoaderEl.setAttribute('aria-hidden', 'false');
    } else {
        state.recentLoaderEl.classList.add('hidden');
        state.recentLoaderEl.setAttribute('aria-hidden', 'true');
    }
    const carousel = document.getElementById('recentDonorCarousel');
    if (carousel) {
        if (isLoading) {
            carousel.classList.remove('show-controls');
        } else {
            setTimeout(() => { carousel.classList.add('show-controls'); }, 100);
        }
    }
}

export function renderRecentDonorsCarousel(donors) {
    const carouselInner = document.querySelector('#recentDonorCarousel .carousel-inner');
    const carouselIndicators = document.querySelector('#recentDonorCarousel .carousel-indicators');
    const carousel = document.getElementById('recentDonorCarousel');
    if (!carouselInner || !carouselIndicators) return;
    carouselInner.innerHTML = '';
    carouselIndicators.innerHTML = '';
    if (donors.length === 0) {
        carouselInner.innerHTML = `
            <div class="carousel-item active">
                <article class="recent-card mx-auto max-w-2xl w-full">
                    <div class="recent-card__chip">
                        <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
                        Recent Donation Feed
                    </div>
                    <div class="recent-card__summary">
                        <div class="recent-card__avatar" aria-hidden="true">BD</div>
                        <div class="recent-card__summary-copy">
                            <p class="recent-card__headline">No recent donations have been published yet.</p>
                            <p class="recent-card__date">Once admins add a donation entry, it will appear here automatically.</p>
                        </div>
                    </div>
                </article>
            </div>
        `;
        if (carousel) carousel.classList.remove('show-controls');
        return;
    }
    donors.forEach((d, index) => {
        const donationDate = d.date ? (() => { const _d = new Date(d.date); const _p = n => String(n).padStart(2,'0'); return `${_p(_d.getDate())}/${_p(_d.getMonth()+1)}/${_d.getFullYear()}`; })() : '—';
        const donorName = getTextValue(d.name || d.donorName || d.fullName, 'Anonymous Donor');
        const locationLabel = getTextValue(d.location, '—');
        const department = getTextValue(d.department, '—');
        const batch = getTextValue(d.batch, '—');
        const age = getTextValue(d.age, '—');
        const weightValue = getTextValue(d.weight, '');
        const weight = weightValue ? `${weightValue} kg` : '—';
        const bloodGroup = getTextValue(d.bloodGroup, '—');
        const initials = getInitials(donorName, 'BD');
        const itemClass = index === 0 ? 'carousel-item active' : 'carousel-item';
        const carouselItemHTML = `
            <div class="${itemClass}">
                <article class="recent-card mx-auto max-w-2xl w-full float-in">
                    <span class="recent-card__halo" aria-hidden="true"></span>
                    <div class="recent-card__chip"><i class="fa-solid fa-hand-holding-droplet" aria-hidden="true"></i> Recent Donation</div>
                    <div class="recent-card__summary">
                        <div class="recent-card__avatar" aria-hidden="true">${initials}</div>
                        <div class="recent-card__summary-copy">
                            <p class="recent-card__headline">A huge thank you to <span>${donorName}</span>.</p>
                            <p class="recent-card__date">Donated on <span>${donationDate}</span></p>
                        </div>
                    </div>
                    <div class="recent-card__divider" aria-hidden="true"></div>
                    <div class="recent-card__stats">
                        <div class="recent-card__stat recent-card__stat--wide recent-card__stat--donation-center">
                            <span class="recent-card__stat-label"><i class="fa-solid fa-location-dot" aria-hidden="true"></i>Donation Center</span>
                            <span class="recent-card__stat-value">${locationLabel}</span>
                        </div>
                        <div class="recent-card__stat recent-card__stat--accent recent-card__stat--blood">
                            <span class="recent-card__stat-label"><i class="fa-solid fa-droplet" aria-hidden="true"></i>Blood Group</span>
                            <span class="recent-card__stat-value">${bloodGroup}</span>
                        </div>
                        <div class="recent-card__stat recent-card__stat--batch">
                            <span class="recent-card__stat-label"><i class="fa-solid fa-layer-group" aria-hidden="true"></i>Batch</span>
                            <span class="recent-card__stat-value">${batch}</span>
                        </div>
                        <div class="recent-card__stat recent-card__stat--age">
                            <span class="recent-card__stat-label"><i class="fa-solid fa-user" aria-hidden="true"></i>Age</span>
                            <span class="recent-card__stat-value">${age}</span>
                        </div>
                        <div class="recent-card__stat recent-card__stat--department">
                            <span class="recent-card__stat-label"><i class="fa-solid fa-building-columns" aria-hidden="true"></i>Department</span>
                            <span class="recent-card__stat-value">${department}</span>
                        </div>
                        <div class="recent-card__stat recent-card__stat--weight">
                            <span class="recent-card__stat-label"><i class="fa-solid fa-weight-scale" aria-hidden="true"></i>Weight</span>
                            <span class="recent-card__stat-value">${weight}</span>
                        </div>
                    </div>
                </article>
            </div>
        `;
        carouselInner.innerHTML += carouselItemHTML;
        const indicatorClass = index === 0 ? 'active' : '';
        carouselIndicators.innerHTML += `<li data-target="#recentDonorCarousel" data-slide-to="${index}" class="${indicatorClass}"></li>`;
    });
    if (window.registerFloatEls) window.registerFloatEls(carouselInner);
    if (carousel && donors.length > 0) {
        setTimeout(() => { carousel.classList.add('show-controls'); }, 150);
    }
}

export function initCarousel() {
    if (!state.recentLoaderEl) {
        state.recentLoaderEl = document.getElementById('recent-loading');
        if (state.recentLoaderEl) setRecentLoading(state.recentLoaderState);
    }
    const initialCarousel = document.getElementById('recentDonorCarousel');
    if (initialCarousel) initialCarousel.classList.remove('show-controls');
    window.setTimeout(() => {
        if (!state.recentLoaderState) return;
        renderRecentDonorsCarousel([]);
        setRecentLoading(false);
    }, 6500);
}
