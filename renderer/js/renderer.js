// renderer.js
/**
 * @type {bootstrap.Modal}
 * @description To hold the Bootstrap Modal instance
 */
let alarmModal; // To hold the Bootstrap Modal instance

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Modal
    alarmModal = new bootstrap.Modal(document.getElementById('alarmModal'));

    // Initial Load
    loadBaseCurrency().then(() => fetchTopCoins(10));
    loadAlarms();

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

    // Event Listeners
    document.querySelectorAll('.top-coins-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const count = event.target.getAttribute('data-count');
            fetchTopCoins(count);
        });
    });

    document.getElementById('search-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const query = document.getElementById('search-input').value;
        searchCoins(query);
    });

    document.getElementById('coin-list').addEventListener('click', (event) => {
        const button = event.target.closest('.add-alarm-btn');
        if (button) {
            const coinData = JSON.parse(button.dataset.coin);
            openAlarmModal(coinData);
        }
    });

    document.getElementById('save-alarm-btn').addEventListener('click', saveAlarm);
    document.getElementById('alarm-percentage').addEventListener('input', updateTargetPrice);
    document.getElementById('alarm-type').addEventListener('change', updateTargetPrice);

    document.getElementById('alarm-dropdown').addEventListener('click', (event) => {
        const dismissBtn = event.target.closest('.dismiss-alarm-btn');
        const clearBtn = event.target.closest('.clear-history-btn');
        if (dismissBtn) {
            const alarmId = dismissBtn.dataset.alarmId;
            window.api.dismissAlarm(alarmId).then(updateAlarmDropdown);
        }
        if (clearBtn) {
            window.api.clearHistory().then(updateAlarmDropdown);
        }
    });

    // Listen for updates from the main process
    window.api.onAlarmsUpdated(updateAlarmDropdown);

    // Mail Settings
    const mailSettingsModal = new bootstrap.Modal(document.getElementById('mailSettingsModal'));
    document.getElementById('mailSettingsBtn').addEventListener('click', async () => {
        const settings = await window.api.getMailSettings();
        document.getElementById('mailService').value = settings.service || '';
        document.getElementById('mailUser').value = settings.user || '';
        document.getElementById('mailPass').value = settings.pass || '';
        document.getElementById('mailRecipient').value = settings.recipient || '';
        mailSettingsModal.show();
    });

    document.getElementById('saveMailSettingsBtn').addEventListener('click', async () => {
        const settings = {
            service: document.getElementById('mailService').value,
            user: document.getElementById('mailUser').value,
            pass: document.getElementById('mailPass').value,
            recipient: document.getElementById('mailRecipient').value
        };
        await window.api.setMailSettings(settings);
        mailSettingsModal.hide();
    });

    document.getElementById('clearMailSettingsBtn').addEventListener('click', async () => {
        await window.api.clearMailSettings();
        document.getElementById('mailService').value = '';
        document.getElementById('mailUser').value = '';
        document.getElementById('mailPass').value = '';
        document.getElementById('mailRecipient').value = '';
        mailSettingsModal.hide();
    });

    // CoinGecko API Key Settings
    const coingeckoApiKeyModal = new bootstrap.Modal(document.getElementById('coingeckoApiKeyModal'));
    document.getElementById('coingeckoApiKeyBtn').addEventListener('click', async () => {
        const apiKey = await window.api.getCoingeckoApiKey();
        document.getElementById('coingeckoApiKeyInput').value = apiKey || '';
        coingeckoApiKeyModal.show();
    });

    document.getElementById('saveCoingeckoApiKeyBtn').addEventListener('click', async () => {
        const apiKey = document.getElementById('coingeckoApiKeyInput').value;
        await window.api.setCoingeckoApiKey(apiKey);
        coingeckoApiKeyModal.hide();
        fetchTopCoins(10); // Refresh coins with new API key
    });

    document.getElementById('clearCoingeckoApiKeyBtn').addEventListener('click', async () => {
        await window.api.clearCoingeckoApiKey();
        document.getElementById('coingeckoApiKeyInput').value = '';
        coingeckoApiKeyModal.hide();
        fetchTopCoins(10); // Refresh coins after clearing API key
    });
});

/**
 * @description Fetches the top coins from the main process and displays them.
 * @param {number} count - The number of coins to fetch.
 * @returns {Promise<void>}
 */
async function fetchTopCoins(count) {
    document.getElementById('coin-list').innerHTML = `<div class="text-center p-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
    const coins = await window.api.fetchCoins(count);
    displayCoins(coins);
}

/**
 * @description Searches for coins from the main process and displays them.
 * @param {string} query - The search query.
 * @returns {Promise<void>}
 */
async function searchCoins(query) {
    document.getElementById('coin-list').innerHTML = `<div class="text-center p-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
    const coins = await window.api.searchCoins(query);
    displayCoins(coins);
}

/**
 * @description Loads the base currency from the main process and updates the UI.
 * @returns {Promise<void>}
 */
async function loadBaseCurrency() {
    const currency = await window.api.getBaseCurrency();
    document.getElementById('selected-currency').innerText = currency.toUpperCase();
}

/**
 * @description Displays a list of coins in the UI.
 * @param {Array<object>} coins - An array of coin objects from the CoinGecko API.
 * @returns {void}
 */
function displayCoins(coins) {
    const list = document.getElementById('coin-list');
    list.innerHTML = '';
    if (!coins || coins.length === 0) {
        list.innerHTML = `<div class="list-group-item">No coins found.</div>`;
        return;
    }

    const selectedCurrencySymbol = document.getElementById('selected-currency').innerText;

    coins.forEach(coin => {
        const priceChange = coin.price_change_percentage_24h;
        const priceClass = priceChange >= 0 ? 'price-up' : 'price-down';
        const icon = priceChange >= 0 ? 'bi-arrow-up' : 'bi-arrow-down';

        const item = document.createElement('div');
        item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        item.innerHTML = `
            <div class="d-flex align-items-center">
                <img src="${coin.image}" alt="${coin.name}" class="coin-logo">
                <div>
                    <h5 class="mb-1">${coin.name} <span class="text-muted text-uppercase">${coin.symbol}</span></h5>
                    <p class="mb-1">${selectedCurrencySymbol} ${coin.current_price.toLocaleString()}</p>
                </div>
            </div>
            <div class="text-end">
                <span class="${priceClass}">
                    <i class="bi ${icon}"></i> ${priceChange.toFixed(2)}%
                </span>
                <p class="text-muted mb-0">MCap: ${selectedCurrencySymbol} ${coin.market_cap.toLocaleString()}</p>
                 <button class="btn btn-sm btn-outline-primary mt-2 add-alarm-btn" data-coin='${JSON.stringify(coin)}'>
                    <i class="bi bi-bell"></i> Set Alarm
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

/**
 * @description Opens the alarm modal and populates it with the coin's data.
 * @param {object} coin - The coin object.
 * @returns {void}
 */
function openAlarmModal(coin) {
    const selectedCurrencySymbol = document.getElementById('selected-currency').innerText;
    document.getElementById('modal-coin-name').innerText = coin.name;
    document.getElementById('modal-current-price').innerText = `${selectedCurrencySymbol} ${coin.current_price.toLocaleString()}`;
    document.getElementById('modal-coin-id').value = coin.id;
    document.getElementById('modal-coin-current-price-val').value = coin.current_price;
    updateTargetPrice(); // Calculate initial target price
    alarmModal.show();
}

/**
 * @description Updates the target price in the alarm modal based on the user's input.
 * @returns {void}
 */
function updateTargetPrice() {
    const currentPrice = parseFloat(document.getElementById('modal-coin-current-price-val').value);
    const percentage = parseFloat(document.getElementById('alarm-percentage').value);
    const type = document.getElementById('alarm-type').value;
    const selectedCurrencySymbol = document.getElementById('selected-currency').innerText;

    if (isNaN(currentPrice) || isNaN(percentage)) return;

    let targetPrice;
    if (type === 'up') {
        targetPrice = currentPrice * (1 + percentage / 100);
    } else {
        targetPrice = currentPrice * (1 - percentage / 100);
    }
    document.getElementById('modal-target-price').innerText = `${selectedCurrencySymbol} ${targetPrice.toLocaleString()}`;
}

/**
 * @description Saves a new alarm to the main process.
 * @returns {Promise<void>}
 */
async function saveAlarm() {
    const coinId = document.getElementById('modal-coin-id').value;
    const coinName = document.getElementById('modal-coin-name').innerText;
    const currentPrice = parseFloat(document.getElementById('modal-coin-current-price-val').value);
    const percentage = parseFloat(document.getElementById('alarm-percentage').value);
    const type = document.getElementById('alarm-type').value;
    const currency = document.getElementById('selected-currency').innerText.toLowerCase();

    let targetPrice;
    if (type === 'up') {
        targetPrice = currentPrice * (1 + percentage / 100);
    } else {
        targetPrice = currentPrice * (1 - percentage / 100);
    }

    const alarm = {
        id: `alarm_${Date.now()}`,
        coinId,
        coinName,
        type,
        targetPrice,
        currency,
        createdAt: new Date().toISOString()
    };
    
    const alarms = await window.api.setAlarm(alarm);
    updateAlarmDropdown(alarms);
    alarmModal.hide();
}

/**
 * @description Loads all alarms from the main process and updates the UI.
 * @returns {Promise<void>}
 */
async function loadAlarms() {
    const alarms = await window.api.getAlarms();
    updateAlarmDropdown(alarms);
}

/**
 * @description Updates the alarm dropdown with the current alarms.
 * @param {{active: Array, history: Array}} alarms - The alarms object.
 * @returns {void}
 */
function updateAlarmDropdown(alarms) {
    const dropdown = document.getElementById('alarm-dropdown');
    const badge = document.getElementById('alarm-badge');
    dropdown.innerHTML = '';

    // Update badge
    if (alarms.active && alarms.active.length > 0) {
        badge.innerText = alarms.active.length;
        badge.classList.remove('d-none');
    } else {
        badge.classList.add('d-none');
    }

    if (alarms.active.length === 0 && alarms.history.length === 0) {
        dropdown.innerHTML = '<li><span class="dropdown-item-text">No active alarms.</span></li>';
        return;
    }

    // Active Alarms
    if (alarms.active.length > 0) {
        dropdown.innerHTML += '<li><h6 class="dropdown-header">Active Alarms</h6></li>';
        alarms.active.forEach(a => {
            const iconClass = a.type === 'up' ? 'bi-arrow-up price-up' : 'bi-arrow-down price-down';
            const currencySymbol = (a.currency || 'usd').toUpperCase();
            dropdown.innerHTML += `
                <li>
                    <div class="dropdown-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${a.coinName}</strong>
                            <i class="bi ${iconClass} mx-1"></i>
                            ${currencySymbol}${a.targetPrice.toFixed(2)}
                        </div>
                        <button class="btn btn-sm btn-outline-danger dismiss-alarm-btn" data-alarm-id="${a.id}"><i class="bi bi-x-lg"></i></button>
                    </div>
                </li>
            `;
        });
    }

    // History
    if (alarms.history.length > 0) {
        dropdown.innerHTML += '<li><hr class="dropdown-divider"></li>';
        dropdown.innerHTML += '<li><h6 class="dropdown-header">Alarm History</h6></li>';
        alarms.history.slice(-5).reverse().forEach(a => { // Show last 5
            const iconClass = a.type === 'up' ? 'bi-arrow-up price-up' : 'bi-arrow-down price-down';
            const currencySymbol = (a.currency || 'usd').toUpperCase();
            dropdown.innerHTML += `
                <li>
                    <span class="dropdown-item-text alarm-history-item">
                        <strong>${a.coinName}</strong> hit
                        <i class="bi ${iconClass} mx-1"></i>
                        ${currencySymbol}${a.targetPrice.toFixed(2)} at ${currencySymbol}${a.triggeredPrice.toFixed(2)}
                    </span>
                </li>
            `;
        });
        dropdown.innerHTML += '<li><hr class="dropdown-divider"></li>';
        dropdown.innerHTML += '<li><button class="dropdown-item text-center clear-history-btn">Clear History</button></li>';
    }
}