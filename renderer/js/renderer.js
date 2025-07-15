// renderer.js
import { initMailSettings } from './modules/mail-settings.js';
import { initAlarms } from './modules/alarms.js';
import { initSearch } from './modules/search.js';
import { initCoinFetcher, fetchTopCoins } from './modules/fetchTopCoins.js';
import { initApiKeySettings } from './modules/apiKey-settings.js';
import { initNotificationButton } from './modules/notifications.js';

/**
 * @type {bootstrap.Modal}
 * @description To hold the Bootstrap Modal instance
 */
let alarmModal; // To hold the Bootstrap Modal instance

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Modal
    alarmModal = new bootstrap.Modal(document.getElementById('alarmModal'));

    // Initial Load
    loadBaseCurrency();
    
    // Initialize Modules
    initMailSettings();
    initNotificationButton();
    initAlarms(alarmModal);
    initSearch();
    initCoinFetcher();
    initApiKeySettings();

    // Currency selection
    document.querySelectorAll('.currency-select-item').forEach(item => {
        item.addEventListener('click', async (event) => {
            event.preventDefault();
            const currency = event.target.dataset.currency;
            await window.api.setBaseCurrency(currency);
            document.getElementById('selected-currency').innerText = currency.toUpperCase();
            // Re-fetch coins with the new base currency
            fetchTopCoins(10);
        });
    });
});

async function loadBaseCurrency() {
    const currency = await window.api.getBaseCurrency();
    document.getElementById('selected-currency').innerText = currency.toUpperCase();
}
