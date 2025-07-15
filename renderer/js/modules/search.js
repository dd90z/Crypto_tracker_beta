// renderer/js/modules/search.js

import { displayCoins } from './displayCoins.js';

async function searchCoins(query) {
    document.getElementById('coin-list').innerHTML = `<div class="text-center p-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
    const coins = await window.api.searchCoins(query);
    displayCoins(coins);
}

export function initSearch() {
    document.getElementById('search-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const query = document.getElementById('search-input').value;
        searchCoins(query);
    });
}
