// renderer/js/modules/apiKey-settings.js

export function initApiKeySettings() {
    const apiKeyModalEl = document.getElementById('coingeckoApiKeyModal');
    const coingeckoApiKeyModal = new bootstrap.Modal(apiKeyModalEl);
    const apiKeyButton = document.getElementById('coingeckoApiKeyBtn');
    
    apiKeyButton.addEventListener('click', async () => {
        const apiKey = await window.api.getCoingeckoApiKey();
        document.getElementById('coingeckoApiKeyInput').value = apiKey || '';
        coingeckoApiKeyModal.show();
    });

    document.getElementById('saveCoingeckoApiKeyBtn').addEventListener('click', async () => {
        const apiKey = document.getElementById('coingeckoApiKeyInput').value;
        await window.api.setCoingeckoApiKey(apiKey);
        coingeckoApiKeyModal.hide();
    });

    document.getElementById('clearCoingeckoApiKeyBtn').addEventListener('click', async () => {
        await window.api.clearCoingeckoApiKey();
        document.getElementById('coingeckoApiKeyInput').value = '';
        coingeckoApiKeyModal.hide();
    });

    // When the modal is fully hidden, return focus to the button that opened it
    apiKeyModalEl.addEventListener('hidden.bs.modal', () => {
        apiKeyButton.focus();
        location.reload(); // Reload to apply key changes
    });
}
