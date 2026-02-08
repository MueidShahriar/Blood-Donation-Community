
import { t as translate, getCurrentLanguage, setLanguage } from './language-config.js';

export const t = translate;

export function updatePageLanguage() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.hasAttribute('placeholder')) {
                el.placeholder = translate(key);
            }
            else if (el.hasAttribute('title')) {
                el.title = translate(key);
            }
            else if (el.hasAttribute('aria-label')) {
                el.setAttribute('aria-label', translate(key));
            }
            else {
                el.textContent = translate(key);
            }
        }
    });

    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) {
            el.placeholder = translate(key);
        }
    });

    const htmlElements = document.querySelectorAll('[data-i18n-html]');
    htmlElements.forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (key) {
            el.innerHTML = translate(key);
        }
    });
}

export function createLanguageSwitcher() {
    const currentLang = getCurrentLanguage();
    
    const langBtn = document.createElement('button');
    langBtn.id = 'language-toggle';
    langBtn.className = 'fixed top-20 right-6 z-30 bg-white border-2 border-red-600 text-red-700 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-red-50 transition-all duration-300 flex items-center gap-2';
    langBtn.setAttribute('aria-label', 'Switch Language');
    langBtn.setAttribute('title', currentLang === 'en' ? 'বাংলায় পরিবর্তন করুন' : 'Switch to English');
    
    langBtn.innerHTML = `
        <i class="fa-solid fa-language"></i>
        <span class="font-semibold">${currentLang === 'en' ? 'বাংলা' : 'English'}</span>
    `;
    
    langBtn.addEventListener('click', toggleLanguage);
    
    const header = document.querySelector('header');
    if (header && header.nextSibling) {
        header.parentNode.insertBefore(langBtn, header.nextSibling);
    } else {
        document.body.appendChild(langBtn);
    }
    
    return langBtn;
}

export function toggleLanguage() {
    const currentLang = getCurrentLanguage();
    const newLang = currentLang === 'en' ? 'bn' : 'en';
    
    setLanguage(newLang);
    
    updatePageLanguage();
    
    const langBtn = document.getElementById('language-toggle');
    if (langBtn) {
        const span = langBtn.querySelector('span');
        if (span) {
            span.textContent = newLang === 'en' ? 'বাংলা' : 'English';
        }
        langBtn.setAttribute('title', newLang === 'en' ? 'বাংলায় পরিবর্তন করুন' : 'Switch to English');
    }
    
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: newLang } }));
}

export function initLanguageSystem() {
    const savedLang = getCurrentLanguage();
    setLanguage(savedLang);
    
    createLanguageSwitcher();
    
    updatePageLanguage();
}

export function translateElement(element, key, updateType = 'text') {
    if (!element || !key) return;
    
    const text = translate(key);
    
    switch (updateType) {
        case 'placeholder':
            element.placeholder = text;
            break;
        case 'title':
            element.title = text;
            break;
        case 'aria-label':
            element.setAttribute('aria-label', text);
            break;
        case 'html':
            element.innerHTML = text;
            break;
        default:
            element.textContent = text;
    }
}

window.updatePageLanguage = updatePageLanguage;
window.toggleLanguage = toggleLanguage;
window.t = translate;
