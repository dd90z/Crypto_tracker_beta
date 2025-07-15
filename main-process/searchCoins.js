// main-process/coin-search.js
const axios = require('axios');

async function searchCoins(store, query) {
    console.log(`[Main Process] searchCoins called with query: ${query}`);
    const vs_currency = store.get('baseCurrency', 'usd');
    const apiKey = store.get('coingeckoApiKey', '').trim();
    if (!query) return [];
    try {
        const searchParams = { query };
        const headers = {};
        if (apiKey) {
            headers['x-cg-demo-api-key'] = apiKey;
        }
        const searchResponse = await axios.get(`https://api.coingecko.com/api/v3/search`, { params: searchParams, headers });
        const coinIds = searchResponse.data.coins.map(c => c.id).slice(0, 50).join(',');

        if (!coinIds) return [];

        const marketParams = {
            vs_currency,
            ids: coinIds
        };
        
        const marketResponse = await axios.get('https://api.coingecko.com/api/v3/coins/markets', { params: marketParams, headers });
        return marketResponse.data;
    } catch (error) {
        console.error('Error searching coins:', error);
        return [];
    }
}

module.exports = { searchCoins };
