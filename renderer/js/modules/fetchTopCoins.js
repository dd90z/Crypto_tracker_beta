// renderer/js/modules/fetchTopCoins.js
import { displayCoins } from './displayCoins.js';

export async function fetchTopCoins(count) {
    document.getElementById('coin-list').innerHTML = `<div class="text-center p-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
    const coins = await window.api.fetchCoins(count);
    displayCoins(coins);
}

export function initCoinFetcher() {
    fetchTopCoins(10);

    document.querySelectorAll('.top-coins-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const count = event.target.getAttribute('data-count');
            fetchTopCoins(count);
        });
    });
}
