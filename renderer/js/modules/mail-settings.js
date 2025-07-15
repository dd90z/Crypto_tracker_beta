// renderer/js/modules/mail-settings.js

export function initMailSettings() {
    const mailSettingsModalEl = document.getElementById('mailSettingsModal');
    const mailSettingsModal = new bootstrap.Modal(mailSettingsModalEl);
    const mailSettingsBtn = document.getElementById('mailSettingsBtn');
    const mailProviderSelect = document.getElementById('mailProvider');
    const customSmtpFields = document.getElementById('customSmtpFields');

    const providerSettings = {
        gmail: { host: 'smtp.gmail.com', port: 465, secure: true, service: 'gmail' },
        outlook: { host: 'smtp-mail.outlook.com', port: 587, secure: false, service: 'outlook' }, // STARTTLS
        yahoo: { host: 'smtp.mail.yahoo.com', port: 465, secure: true, service: 'yahoo' },
        icloud: { host: 'smtp.mail.me.com', port: 587, secure: false, service: 'icloud' } // STARTTLS
    };

    mailProviderSelect.addEventListener('change', () => {
        const provider = mailProviderSelect.value;
        if (provider === 'custom') {
            customSmtpFields.style.display = 'block';
        } else {
            customSmtpFields.style.display = 'none';
            const settings = providerSettings[provider];
            document.getElementById('mailHost').value = settings.host;
            document.getElementById('mailPort').value = settings.port;
            document.getElementById('mailSecure').checked = settings.secure;
        }
    });

    mailSettingsBtn.addEventListener('click', async () => {
        const settings = await window.api.getMailSettings();
        
        const provider = settings.service || 'custom';
        mailProviderSelect.value = provider;
        mailProviderSelect.dispatchEvent(new Event('change'));

        document.getElementById('mailHost').value = settings.host || '';
        document.getElementById('mailPort').value = settings.port || '';
        document.getElementById('mailSecure').checked = settings.secure === true;
        document.getElementById('mailUser').value = settings.user || '';
        document.getElementById('mailPass').value = settings.pass || '';
        document.getElementById('mailRecipient').value = settings.recipient || '';
        
        mailSettingsModal.show();
    });

    document.getElementById('saveMailSettingsBtn').addEventListener('click', async () => {
        const provider = mailProviderSelect.value;
        const host = document.getElementById('mailHost').value.trim();
        const port = parseInt(document.getElementById('mailPort').value, 10);

        if (provider === 'custom' && (!host || isNaN(port) || port <= 0)) {
            alert('For Custom SMTP, a valid Host and Port are required.');
            return; // Stop the function
        }

        const isCustom = provider === 'custom';
        const settings = {
            service: isCustom ? '' : provider,
            host: host,
            port: port,
            secure: !!document.getElementById('mailSecure').checked,
            user: document.getElementById('mailUser').value,
            pass: document.getElementById('mailPass').value,
            recipient: document.getElementById('mailRecipient').value
        };
        
        await window.api.setMailSettings(settings);
        mailSettingsModal.hide();
    });

    document.getElementById('clearMailSettingsBtn').addEventListener('click', async () => {
        await window.api.clearMailSettings();
        
        mailProviderSelect.value = 'custom';
        mailProviderSelect.dispatchEvent(new Event('change'));

        document.getElementById('mailHost').value = '';
        document.getElementById('mailPort').value = '';
        document.getElementById('mailSecure').checked = false;
        document.getElementById('mailUser').value = '';
        document.getElementById('mailPass').value = '';
        document.getElementById('mailRecipient').value = '';
        
        mailSettingsModal.hide();
    });

    document.getElementById('sendTestEmailBtn').addEventListener('click', async () => {
        const result = await window.api.sendTestEmail();
        if (result.success) {
            alert('Test email sent successfully!');
        } else {
            alert(`Failed to send test email: ${result.message}`);
        }
    });

    mailSettingsModalEl.addEventListener('hidden.bs.modal', () => {
        mailSettingsBtn.focus();
    });
}
