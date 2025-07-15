// main-process/nodemailer.js
const nodemailer = require('nodemailer');

let transporter = null;

function initializeTransporter(store) {
    const mailSettings = store.get('mailSettings');

    if (mailSettings && mailSettings.user && mailSettings.pass) {
        let transportOptions = {
            auth: {
                user: mailSettings.user,
                pass: mailSettings.pass
            }
        };

        if (mailSettings.service && ['gmail', 'yahoo', 'outlook', 'icloud'].includes(mailSettings.service)) {
            transportOptions.service = mailSettings.service;
        } else if (mailSettings.host && mailSettings.port) {
            transportOptions.host = mailSettings.host;
            transportOptions.port = mailSettings.port;
            if (mailSettings.port === 465) {
                transportOptions.secure = true;
            } else if (mailSettings.port === 587 || mailSettings.port === 25) {
                transportOptions.secure = false;
                transportOptions.requireTLS = true;
            } else {
                transportOptions.secure = mailSettings.secure;
            }
        } else {
            transporter = null;
            return;
        }

        transporter = nodemailer.createTransport(transportOptions);
        console.log('Nodemailer transporter initialized successfully with settings:', mailSettings);
    } else {
        transporter = null;
        console.log('Nodemailer transporter not initialized: Invalid or missing mail settings.', mailSettings);
    }
}

function sendEmailNotification(alarm, store) {
    const mailSettings = store.get('mailSettings');
    if (!transporter || !mailSettings || !mailSettings.recipient) {
        console.log('Email notification skipped: Mail settings not configured or recipient missing.');
        return;
    }

    const currencySymbol = alarm.currency.toUpperCase();
    const mailOptions = {
        from: mailSettings.user,
        to: mailSettings.recipient,
        subject: `Crypto Price Alert: ${alarm.coinName}`,
        html: `
            <h1>Price Alert Triggered!</h1>
            <p><b>${alarm.coinName}</b> has reached your price target.</p>
            <ul>
                <li>Target Price: <b>${currencySymbol} ${alarm.targetPrice.toFixed(2)}</b></li>
                <li>Direction: <b>${alarm.type.toUpperCase()}</b></li>
                <li>Triggered Price: <b>${currencySymbol} ${alarm.triggeredPrice.toFixed(2)}</b></li>
            </ul>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            if (error.response) {
                console.error('Nodemailer response:', error.response);
            }
            if (error.responseCode) {
                console.error('Nodemailer response code:', error.responseCode);
            }
            return;
        }
        console.log('Email sent: ' + info.response);
    });
}

async function sendTestEmail(store) {
    const mailSettings = store.get('mailSettings');
    if (!transporter || !mailSettings || !mailSettings.recipient) {
        return { success: false, message: 'Mail settings not configured or recipient missing.' };
    }

    const mailOptions = {
        from: mailSettings.user,
        to: mailSettings.recipient,
        subject: 'Crypto Tracker - Test Email',
        html: `
            <h1>This is a test email from Crypto Tracker!</h1>
            <p>If you received this, your email settings are working correctly.</p>
            <p>Sent at: ${new Date().toLocaleString()}</p>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Test email sent: ' + info.response);
        return { success: true, message: 'Test email sent successfully!' };
    } catch (error) {
        console.error('Error sending test email:', error);
        let errorMessage = 'Failed to send test email.';
        if (error.response) {
            errorMessage += ` Server response: ${error.response}`;
        }
        if (error.responseCode) {
            errorMessage += ` Response code: ${error.responseCode}`;
        }
        return { success: false, message: errorMessage };
    }
}

module.exports = {
    initializeTransporter,
    sendEmailNotification,
    sendTestEmail
};
