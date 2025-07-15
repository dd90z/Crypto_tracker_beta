// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Renderer to Main (and get a response)
    fetchCoins: (count) => ipcRenderer.invoke('fetch-coins', count),
    searchCoins: (query) => ipcRenderer.invoke('search-coins', query),
    getAlarms: () => ipcRenderer.invoke('get-alarms'),
    setAlarm: (alarm) => ipcRenderer.invoke('set-alarm', alarm),
    dismissAlarm: (alarmId) => ipcRenderer.invoke('dismiss-alarm', alarmId),
    clearHistory: () => ipcRenderer.invoke('clear-history'),
    getBaseCurrency: () => ipcRenderer.invoke('get-base-currency'),
    setBaseCurrency: (currency) => ipcRenderer.invoke('set-base-currency', currency),
    getMailSettings: () => ipcRenderer.invoke('get-mail-settings'),
    setMailSettings: (settings) => ipcRenderer.invoke('set-mail-settings', settings),
    clearMailSettings: () => ipcRenderer.invoke('clear-mail-settings'),
    getCoingeckoApiKey: () => ipcRenderer.invoke('get-coingecko-api-key'),
    setCoingeckoApiKey: (key) => ipcRenderer.invoke('set-coingecko-api-key', key),
    clearCoingeckoApiKey: () => ipcRenderer.invoke('clear-coingecko-api-key'),

    // Main to Renderer (listen for events)
    onAlarmsUpdated: (callback) => ipcRenderer.on('alarms-updated', (event, ...args) => callback(...args))
});