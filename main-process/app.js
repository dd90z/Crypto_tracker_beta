// app.js
const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const axios = require('axios');
const { default: Store } = require('electron-store');
const { initializeTransporter, sendEmailNotification, sendTestEmail } = require('./nodemailer');
const { showTriggeredAlarmNotification, sendTestNotification } = require('./notifications');
const { checkAlarms } = require('./checkAlarms');
const { searchCoins } = require('./searchCoins');
const { fetchCoins } = require('./fetchCoins');

let mainWindow;

const store = new Store({
    name: 'Crypto-tracker-used-data',
    defaults: {
        baseCurrency: 'usd',
        alarms: {
            active: [],
            history: []
        },
        mailSettings: {},
        coingeckoApiKey: '' // User-provided key
    }
});

// Force a write operation to ensure the config file is created if it's missing.
store.set('__init', true);

console.log('Store file path:', store.path);

// Initialize transporter on app start
app.whenReady().then(() => initializeTransporter(store));

/**
 * @description Creates the main browser window of the application.
 * @returns {void}
 */
function createMainWindow() {
    const isDev = !app.isPackaged;
    mainWindow = new BrowserWindow({
        width: 800,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, '../renderer/js/preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            devTools: isDev
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
}



app.whenReady().then(() => {
    createMainWindow();

    // Check for alarms every 60 seconds
    setInterval(() => checkAlarms(store, mainWindow, handleTriggeredAlarm), 60000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
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
    ipcMain.handle('get-base-currency', (event) => store.get('baseCurrency', 'usd'));

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


    ipcMain.handle('fetch-coins', async (event, count = 10) => {
        return await fetchCoins(store, count);
    });

    /**
     * @description Searches for a coin by name or symbol.
     * @param {IpcMainEvent} event - The IPC event.
     * @param {string} query - The search query.
     * @returns {Promise<Array>} A promise that resolves to an array of coin objects.
     */
    // Search for a coin
    ipcMain.handle('search-coins', async (event, query) => {
        return await searchCoins(store, query);
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
        initializeTransporter(store); // Re-initialize transporter with new settings
        return settings;
    });

    /**
     * @description Clears the mail settings from the store.
     * @returns {object} An empty object.
     */
    ipcMain.handle('clear-mail-settings', () => {
        store.delete('mailSettings');
        initializeTransporter(store); // Clear transporter
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

    /**
     * @description Handles a triggered alarm by showing a desktop notification and sending an email.
     * @param {object} alarm - The triggered alarm object.
     * @returns {void}
     */
    function handleTriggeredAlarm(alarm) {
        showTriggeredAlarmNotification(alarm);
        // Optional Email Notification
        sendEmailNotification(alarm, store);
    }

    /**
     * @description Sends a test email using the configured mail settings.
     * @returns {Promise<object>} A promise that resolves with success/error status.
     */
    ipcMain.handle('send-test-email', async () => {
        return await sendTestEmail(store);
    });

    /**
     * @description Sends a test desktop notification.
     * @returns {void}
     */
    ipcMain.handle('send-test-notification', () => {
        sendTestNotification();
    });

});

    

