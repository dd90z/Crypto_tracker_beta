// renderer/js/modules/notifications.js

export function initNotificationButton() {
    document.getElementById('sendTestNotificationBtn').addEventListener('click', () => {
        window.api.sendTestNotification();
    });
}
