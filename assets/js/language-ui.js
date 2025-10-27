/**
 * Language UI Module
 * Handles UI updates when language changes
 */

import { t as translate, getCurrentLanguage, setLanguage } from './language-config.js';

// Re-export t function for convenience
export const t = translate;

// Update all translatable elements
export function updatePageLanguage() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            // Check if element has placeholder attribute
            if (el.hasAttribute('placeholder')) {
                el.placeholder = translate(key);
            }
            // Check if element has title attribute
            else if (el.hasAttribute('title')) {
                el.title = translate(key);
            }
            // Check if element has aria-label attribute
            else if (el.hasAttribute('aria-label')) {
                el.setAttribute('aria-label', translate(key));
            }
            // Otherwise update text content
            else {
                el.textContent = translate(key);
            }
        }
    });

    // Handle elements with data-i18n-placeholder
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) {
            el.placeholder = translate(key);
        }
    });

    // Update any elements with data-i18n-html for HTML content
    const htmlElements = document.querySelectorAll('[data-i18n-html]');
    htmlElements.forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (key) {
            el.innerHTML = translate(key);
        }
    });
}

// Create and inject language switcher button
export function createLanguageSwitcher() {
    const currentLang = getCurrentLanguage();
    
    // Create language toggle button
    const langBtn = document.createElement('button');
    langBtn.id = 'language-toggle';
    langBtn.className = 'fixed top-20 right-6 z-30 bg-white border-2 border-red-600 text-red-700 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-red-50 transition-all duration-300 flex items-center gap-2';
    langBtn.setAttribute('aria-label', 'Switch Language');
    langBtn.setAttribute('title', currentLang === 'en' ? 'বাংলায় পরিবর্তন করুন' : 'Switch to English');
    
    // Add icon and text
    langBtn.innerHTML = `
        <i class="fa-solid fa-language"></i>
        <span class="font-semibold">${currentLang === 'en' ? 'বাংলা' : 'English'}</span>
    `;
    
    // Add click event
    langBtn.addEventListener('click', toggleLanguage);
    
    // Insert after header
    const header = document.querySelector('header');
    if (header && header.nextSibling) {
        header.parentNode.insertBefore(langBtn, header.nextSibling);
    } else {
        document.body.appendChild(langBtn);
    }
    
    return langBtn;
}

// Toggle between languages
export function toggleLanguage() {
    const currentLang = getCurrentLanguage();
    const newLang = currentLang === 'en' ? 'bn' : 'en';
    
    // Set new language
    setLanguage(newLang);
    
    // Update UI
    updatePageLanguage();
    
    // Update button text
    const langBtn = document.getElementById('language-toggle');
    if (langBtn) {
        const span = langBtn.querySelector('span');
        if (span) {
            span.textContent = newLang === 'en' ? 'বাংলা' : 'English';
        }
        langBtn.setAttribute('title', newLang === 'en' ? 'বাংলায় পরিবর্তন করুন' : 'Switch to English');
    }
    
    // Trigger custom event for other modules to listen
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: newLang } }));
}

// Initialize language system
export function initLanguageSystem() {
    // Set initial language
    const savedLang = getCurrentLanguage();
    setLanguage(savedLang);
    
    // Create language switcher
    createLanguageSwitcher();
    
    // Update page language
    updatePageLanguage();
}

// Helper function to translate and update specific element
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

// Export for global use
window.updatePageLanguage = updatePageLanguage;
window.toggleLanguage = toggleLanguage;
window.t = translate;
