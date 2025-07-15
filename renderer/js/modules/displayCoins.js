// renderer/js/modules/displayCoins.js

export function displayCoins(coins) {
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
