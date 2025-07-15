// app.js
const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const axios = require('axios');
const { default: Store } = require('electron-store');
const nodemailer = require('nodemailer');

const store = new Store();

// --- Nodemailer Setup (Optional Email Notifications) ---
/**
 * @description Initializes the Nodemailer transporter with settings from the store.
 * If settings are invalid or not present, the transporter is set to null.
 * @returns {void}
 */
// IMPORTANT: Use environment variables or a secure config for production.
// For this example, we use hardcoded values.
// You'll need an "App Password" if you use Gmail with 2FA.
let transporter = null;

function initializeTransporter() {
    const mailSettings = store.get('mailSettings');
    if (mailSettings && mailSettings.service && mailSettings.user && mailSettings.pass) {
        transporter = nodemailer.createTransport({
            service: mailSettings.service,
            auth: {
                user: mailSettings.user,
                pass: mailSettings.pass
            }
        });
    } else {
        transporter = null;
    }
}

// Initialize transporter on app start
app.whenReady().then(initializeTransporter);

/**
 * @description Creates the main browser window of the application.
 * @returns {void}
 */
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'renderer/js/preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile('renderer/index.html');
}

app.whenReady().then(() => {
    createMainWindow();

    // Check for alarms every 60 seconds
    setInterval(checkAlarms, 60000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// --- IPC Handlers ---

/**
 * @description All fiat currency price data is sourced directly from the CoinGecko API.
 * The application does not perform any currency conversions itself. When a base currency
 * is selected (e.g., EUR), that preference is sent to the CoinGecko API, which
 * provides the cryptocurrency's price already converted into that fiat currency.
 */

/**
 * @description Gets the base currency from the store.
 * @returns {string} The base currency code (e.g., 'usd').
 */
// Fetch top coins from CoinGecko
ipcMain.handle('get-base-currency', () => store.get('baseCurrency', 'usd'));

/**
 * @description Sets the base currency in the store.
 * @param {IpcMainEvent} event - The IPC event.
 * @param {string} currency - The new base currency code.
 * @returns {string} The new base currency code.
 */
ipcMain.handle('set-base-currency', (event, currency) => {
    store.set('baseCurrency', currency);
    return currency;
});

/**
 * @description Fetches the top coins from the CoinGecko API.
 * @param {IpcMainEvent} event - The IPC event.
 * @param {number} [count=10] - The number of coins to fetch.
 * @returns {Promise<Array>} A promise that resolves to an array of coin objects.
 */
// Fetch top coins from CoinGecko
ipcMain.handle('fetch-coins', async (event, count = 10) => {
    const vs_currency = store.get('baseCurrency', 'usd');
    const apiKey = store.get('coingeckoApiKey', '').trim();
    console.log('Using CoinGecko API Key for fetch-coins:', apiKey ? '********' : 'None');
    const params = {
        vs_currency,
        order: 'market_cap_desc',
        per_page: count,
        page: 1,
        sparkline: false
    };
    if (apiKey) {
        params.x_cg_demo_api_key = apiKey;
    }
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching coins:', error);
        return [];
    }
});

/**
 * @description Searches for a coin by name or symbol.
 * @param {IpcMainEvent} event - The IPC event.
 * @param {string} query - The search query.
 * @returns {Promise<Array>} A promise that resolves to an array of coin objects.
 */
// Search for a coin
ipcMain.handle('search-coins', async (event, query) => {
    const vs_currency = store.get('baseCurrency', 'usd');
    const apiKey = store.get('coingeckoApiKey', '').trim();
    console.log('Using CoinGecko API Key for search-coins:', apiKey ? '********' : 'None');
    if (!query) return [];
    try {
        const searchParams = { query };
        const searchHeaders = {};
        if (apiKey) {
            searchHeaders['x-cg-demo-api-key'] = apiKey;
        }
        console.log('Search API URL:', `https://api.coingecko.com/api/v3/search?${new URLSearchParams(searchParams).toString()}`);
        console.log('Search API Headers:', searchHeaders);
        const searchResponse = await axios.get(`https://api.coingecko.com/api/v3/search`, { params: searchParams, headers: searchHeaders });
        const coinIds = searchResponse.data.coins.map(c => c.id).slice(0, 10).join(',');

        if (!coinIds) return [];

        const marketParams = {
            vs_currency,
            ids: coinIds
        };
        if (apiKey) {
            marketParams.x_cg_demo_api_key = apiKey;
        }
        const marketResponse = await axios.get('https://api.coingecko.com/api/v3/coins/markets', { params: marketParams });
        return marketResponse.data;
    } catch (error) {
        console.error('Error searching coins:', error);
        return [];
    }
});

/**
 * @description Gets all alarms (active and history) from the store.
 * @returns {{active: Array, history: Array}} The alarms object.
 */
// Alarms management
ipcMain.handle('get-alarms', () => store.get('alarms', { active: [], history: [] }));

/**
 * @description Sets a new alarm.
 * @param {IpcMainEvent} event - The IPC event.
 * @param {object} alarm - The alarm object to set.
 * @returns {{active: Array, history: Array}} The updated alarms object.
 */
ipcMain.handle('set-alarm', (event, alarm) => {
    const alarms = store.get('alarms', { active: [], history: [] });
    alarms.active.push(alarm);
    store.set('alarms', alarms);
    return alarms;
});

/**
 * @description Dismisses an active alarm.
 * @param {IpcMainEvent} event - The IPC event.
 * @param {string} alarmId - The ID of the alarm to dismiss.
 * @returns {{active: Array, history: Array}} The updated alarms object.
 */
ipcMain.handle('dismiss-alarm', (event, alarmId) => {
    let alarms = store.get('alarms', { active: [], history: [] });
    alarms.active = alarms.active.filter(a => a.id !== alarmId);
    store.set('alarms', alarms);
    return alarms;
});

/**
 * @description Clears the alarm history.
 * @returns {{active: Array, history: Array}} The updated alarms object.
 */
ipcMain.handle('clear-history', () => {
    let alarms = store.get('alarms', { active: [], history: [] });
    alarms.history = [];
    store.set('alarms', alarms);
    return alarms;
});

/**
 * @description Gets the mail settings from the store.
 * @returns {object} The mail settings object.
 */
ipcMain.handle('get-mail-settings', () => store.get('mailSettings', {}));

/**
 * @description Sets the mail settings in the store.
 * @param {IpcMainEvent} event - The IPC event.
 * @param {object} settings - The mail settings object.
 * @returns {object} The new mail settings object.
 */
ipcMain.handle('set-mail-settings', (event, settings) => {
    store.set('mailSettings', settings);
    initializeTransporter(); // Re-initialize transporter with new settings
    return settings;
});

/**
 * @description Clears the mail settings from the store.
 * @returns {object} An empty object.
 */
ipcMain.handle('clear-mail-settings', () => {
    store.delete('mailSettings');
    initializeTransporter(); // Clear transporter
    return {};
});

/**
 * @description Gets the CoinGecko API key from the store.
 * @returns {string} The API key.
 */
ipcMain.handle('get-coingecko-api-key', () => store.get('coingeckoApiKey', ''));

/**
 * @description Sets the CoinGecko API key in the store.
 * @param {IpcMainEvent} event - The IPC event.
 * @param {string} key - The API key.
 * @returns {string} The new API key.
 */
ipcMain.handle('set-coingecko-api-key', (event, key) => {
    store.set('coingeckoApiKey', key);
    return key;
});

/**
 * @description Clears the CoinGecko API key from the store.
 * @returns {string} An empty string.
 */
ipcMain.handle('clear-coingecko-api-key', () => {
    store.delete('coingeckoApiKey');
    return '';
});


// --- Alarm Checking Logic ---
/**
 * @description Checks all active alarms against the current coin prices.
 * If an alarm is triggered, it handles the notification and updates the store.
 * @returns {Promise<void>}
 */
async function checkAlarms() {
    const alarms = store.get('alarms', { active: [], history: [] });
    if (alarms.active.length === 0) return;

    const coinIds = [...new Set(alarms.active.map(a => a.coinId))].join(',');
    const vs_currencies = [...new Set(alarms.active.map(a => a.currency))].join(',');

    const apiKey = store.get('coingeckoApiKey', '').trim();
    console.log('Using CoinGecko API Key for checkAlarms:', apiKey ? '********' : 'None');
    const params = {
        ids: coinIds,
        vs_currencies,
    };
    if (apiKey) {
        params.x_cg_demo_api_key = apiKey;
    }
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, { params });
        const prices = response.data;

        const triggeredAlarms = [];
        const remainingAlarms = [];

        for (const alarm of alarms.active) {
            const currentPrice = prices[alarm.coinId]?.[alarm.currency];
            if (!currentPrice) {
                remainingAlarms.push(alarm);
                continue;
            };

            let triggered = false;
            if (alarm.type === 'up' && currentPrice >= alarm.targetPrice) {
                triggered = true;
            } else if (alarm.type === 'down' && currentPrice <= alarm.targetPrice) {
                triggered = true;
            }

            if (triggered) {
                alarm.triggeredAt = new Date().toISOString();
                alarm.triggeredPrice = currentPrice;
                triggeredAlarms.push(alarm);
                handleTriggeredAlarm(alarm);
            } else {
                remainingAlarms.push(alarm);
            }
        }

        if (triggeredAlarms.length > 0) {
            const updatedAlarms = {
                active: remainingAlarms,
                history: [...alarms.history, ...triggeredAlarms]
            };
            store.set('alarms', updatedAlarms);
            // Notify renderer to update the UI
            mainWindow.webContents.send('alarms-updated', updatedAlarms);
        }

    } catch (error) {
        console.error("Error checking alarm prices:", error.message);
    }
}

/**
 * @description Handles a triggered alarm by showing a desktop notification and sending an email.
 * @param {object} alarm - The triggered alarm object.
 * @returns {void}
 */
function handleTriggeredAlarm(alarm) {
    const currencySymbol = alarm.currency.toUpperCase();
    const notification = new Notification({
        title: 'Crypto Price Alert!',
        body: `${alarm.coinName} has reached your target of ${currencySymbol}${alarm.targetPrice.toFixed(2)}. Current price: ${currencySymbol}${alarm.triggeredPrice.toFixed(2)}`
    });
    notification.show();

    // Optional Email Notification
    sendEmailNotification(alarm);
}

/**
 * @description Sends an email notification for a triggered alarm.
 * @param {object} alarm - The triggered alarm object.
 * @returns {void}
 */
function sendEmailNotification(alarm) {
    const mailSettings = store.get('mailSettings');
    if (!transporter || !mailSettings || !mailSettings.recipient) {
        console.log('Email notification skipped: Mail settings not configured or recipient missing.');
        return;
    }

    const currencySymbol = alarm.currency.toUpperCase();
    const mailOptions = {
        from: mailSettings.user,
        to: mailSettings.recipient,
        subject: `Crypto Price Alert: ${alarm.coinName}`,
        html: `
            <h1>Price Alert Triggered!</h1>
            <p><b>${alarm.coinName}</b> has reached your price target.</p>
            <ul>
                <li>Target Price: <b>${currencySymbol}${alarm.targetPrice.toFixed(2)}</b></li>
                <li>Direction: <b>${alarm.type.toUpperCase()}</b></li>
                <li>Triggered Price: <b>${currencySymbol}${alarm.triggeredPrice.toFixed(2)}</b></li>
            </ul>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error('Error sending email:', error);
        }
        console.log('Email sent: ' + info.response);
    });
}