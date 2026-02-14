import state from './state.js';

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
        carouselInner.innerHTML = '<div class="text-center p-5">No recent donations to show.</div>';
        if (carousel) carousel.classList.remove('show-controls');
        return;
    }
    donors.forEach((d, index) => {
        const donationDate = d.date ? new Date(d.date).toLocaleDateString() : '—';
        const donorName = d.name || 'Anonymous Donor';
        const locationLabel = d.location || '—';
        const department = d.department || '—';
        const batch = d.batch || '—';
        const age = d.age ? d.age : '—';
        const weight = d.weight ? `${d.weight} kg` : '—';
        const bloodGroup = d.bloodGroup || '—';
        const initials = donorName.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'BD';
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
}
