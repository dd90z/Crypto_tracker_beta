// main-process/coin-fetcher.js
const axios = require('axios');

async function fetchCoins(store, count = 10) {
    console.log(`[Main Process] fetchCoins called with count: ${count}`);
    const vs_currency = store.get('baseCurrency', 'usd');
    const apiKey = store.get('coingeckoApiKey', '').trim();
    const params = {
        vs_currency,
        order: 'market_cap_desc',
        per_page: count,
        page: 1,
        sparkline: false
    };
    const headers = {};
    if (apiKey) {
        headers['x-cg-demo-api-key'] = apiKey;
    }
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', { params, headers });
        return response.data;
    } catch (error) {
        console.error('Error fetching coins:', error);
        return [];
    }
}

module.exports = { fetchCoins };
