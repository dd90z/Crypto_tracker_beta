// main-process/alarm-checker.js
const axios = require('axios');

async function checkAlarms(store, mainWindow, handleTriggeredAlarm) {
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
    const headers = {};
    if (apiKey) {
        headers['x-cg-demo-api-key'] = apiKey;
    }
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, { params, headers });
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

            // Notify renderer immediately with the updated data
            mainWindow.webContents.send('alarms-updated', updatedAlarms);

            // Then, handle the notification side-effects with a delay
            triggeredAlarms.forEach((alarm, index) => {
                setTimeout(() => {
                    handleTriggeredAlarm(alarm);
                }, index * 500); // 500ms delay between each notification
            });
        }

    } catch (error) {
        console.error("Error checking alarm prices:", error.message);
    }
}

module.exports = { checkAlarms };
