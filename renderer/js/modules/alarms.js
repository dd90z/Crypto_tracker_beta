// renderer/js/modules/alarms.js

let alarmModal;

function openAlarmModal(coin) {
    const selectedCurrencySymbol = document.getElementById('selected-currency').innerText;
    document.getElementById('modal-coin-name').innerText = coin.name;
    document.getElementById('modal-current-price').innerText = `${selectedCurrencySymbol} ${coin.current_price.toLocaleString()}`;
    document.getElementById('modal-coin-id').value = coin.id;
    document.getElementById('modal-coin-current-price-val').value = coin.current_price;
    updateTargetPrice(); // Calculate initial target price
    alarmModal.show();
}

function updateTargetPrice() {
    const currentPrice = parseFloat(document.getElementById('modal-coin-current-price-val').value);
    const percentage = parseFloat(document.getElementById('alarm-percentage').value);
    const type = document.getElementById('alarm-type').value;
    const selectedCurrencySymbol = document.getElementById('selected-currency').innerText;

    if (isNaN(currentPrice) || isNaN(percentage)) return;

    let targetPrice;
    if (type === 'up') {
        targetPrice = currentPrice * (1 + percentage / 100);
    } else {
        targetPrice = currentPrice * (1 - percentage / 100);
    }
    document.getElementById('modal-target-price').innerText = `${selectedCurrencySymbol} ${targetPrice.toLocaleString()}`;
}

async function saveAlarm() {
    const coinId = document.getElementById('modal-coin-id').value;
    const coinName = document.getElementById('modal-coin-name').innerText;
    const currentPrice = parseFloat(document.getElementById('modal-coin-current-price-val').value);
    const percentage = parseFloat(document.getElementById('alarm-percentage').value);
    const type = document.getElementById('alarm-type').value;
    const currency = document.getElementById('selected-currency').innerText.toLowerCase();

    let targetPrice;
    if (type === 'up') {
        targetPrice = currentPrice * (1 + percentage / 100);
    } else {
        targetPrice = currentPrice * (1 - percentage / 100);
    }

    const alarm = {
        id: `alarm_${Date.now()}`,
        coinId,
        coinName,
        type,
        targetPrice,
        currency,
        createdAt: new Date().toISOString()
    };
    
    const alarms = await window.api.setAlarm(alarm);
    updateAlarmDropdown(alarms);
    alarmModal.hide();
}

async function loadAlarms() {
    const alarms = await window.api.getAlarms();
    updateAlarmDropdown(alarms);
}

function updateAlarmDropdown(alarms) {
    const dropdown = document.getElementById('alarm-dropdown');
    const badge = document.getElementById('alarm-badge');
    dropdown.innerHTML = '';

    if (alarms.active && alarms.active.length > 0) {
        badge.innerText = alarms.active.length;
        badge.classList.remove('d-none');
    } else {
        badge.classList.add('d-none');
    }

    if (alarms.active.length === 0 && alarms.history.length === 0) {
        dropdown.innerHTML = '<li><span class="dropdown-item-text">No active alarms.</span></li>';
        return;
    }

    if (alarms.active.length > 0) {
        dropdown.innerHTML += '<li><h6 class="dropdown-header">Active Alarms</h6></li>';
        alarms.active.forEach(a => {
            const iconClass = a.type === 'up' ? 'bi-arrow-up price-up' : 'bi-arrow-down price-down';
            const currencySymbol = (a.currency || 'usd').toUpperCase();
            dropdown.innerHTML += `
                <li>
                    <div class="dropdown-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${a.coinName}</strong>
                            <i class="bi ${iconClass} mx-1"></i>
                            ${currencySymbol} ${a.targetPrice.toFixed(2)}
                        </div>
                        <button class="btn btn-sm btn-outline-danger dismiss-alarm-btn" data-alarm-id="${a.id}"><i class="bi bi-x-lg"></i></button>
                    </div>
                </li>
            `;
        });
    }

    if (alarms.history.length > 0) {
        dropdown.innerHTML += '<li><hr class="dropdown-divider"></li>';
        dropdown.innerHTML += '<li><h6 class="dropdown-header">Alarm History</h6></li>';

        alarms.history.slice().reverse().forEach(a => {
            const iconClass = a.type === 'up' ? 'bi-arrow-up price-up' : 'bi-arrow-down price-down';
            const currencySymbol = (a.currency || 'usd').toUpperCase();
            dropdown.innerHTML += `
                <li>
                    <span class="dropdown-item-text alarm-history-item">
                        <strong>${a.coinName}</strong> hit
                        <i class="bi ${iconClass} mx-1"></i>
                        ${currencySymbol} ${a.targetPrice.toFixed(2)} at ${currencySymbol} ${a.triggeredPrice.toFixed(2)}
                    </span>
                </li>
            `;
        });

        dropdown.innerHTML += '<li><hr class="dropdown-divider"></li>';
        dropdown.innerHTML += '<li><button class="dropdown-item text-center clear-history-btn">Clear History</button></li>';
    }
}

export function initAlarms(modalInstance) {
    alarmModal = modalInstance;
    loadAlarms();

    document.getElementById('coin-list').addEventListener('click', (event) => {
        const button = event.target.closest('.add-alarm-btn');
        if (button) {
            const coinData = JSON.parse(button.dataset.coin);
            openAlarmModal(coinData);
        }
    });

    document.getElementById('save-alarm-btn').addEventListener('click', saveAlarm);
    document.getElementById('alarm-percentage').addEventListener('input', updateTargetPrice);
    document.getElementById('alarm-type').addEventListener('change', updateTargetPrice);

    document.getElementById('alarm-dropdown').addEventListener('click', (event) => {
        const dismissBtn = event.target.closest('.dismiss-alarm-btn');
        const clearBtn = event.target.closest('.clear-history-btn');
        if (dismissBtn) {
            const alarmId = dismissBtn.dataset.alarmId;
            window.api.dismissAlarm(alarmId).then(updateAlarmDropdown);
        }
        if (clearBtn) {
            window.api.clearHistory().then(updateAlarmDropdown);
        }
    });

    window.api.onAlarmsUpdated(updateAlarmDropdown);
}
