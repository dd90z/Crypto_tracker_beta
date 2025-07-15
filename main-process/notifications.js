// main-process/notifications.js
const { Notification } = require('electron');

function showTriggeredAlarmNotification(alarm) {
    const currencySymbol = alarm.currency.toUpperCase();
    const notification = new Notification({
        title: 'Crypto Price Alert!',
        body: `${alarm.coinName} has reached your target of ${currencySymbol} ${alarm.targetPrice.toFixed(2)}. Current price: ${currencySymbol} ${alarm.triggeredPrice.toFixed(2)} at ${new Date().toLocaleTimeString()}`,
        requireInteraction: true,
        urgency: 'critical'
    });
    notification.show();
}

function sendTestNotification() {
    const notification = new Notification({
        title: 'Crypto Tracker - Test Notification',
        body: 'This is a test desktop notification from Crypto Tracker.'
    });
    notification.show();
}

module.exports = {
    showTriggeredAlarmNotification,
    sendTestNotification
};
