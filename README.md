### This is the App I am making for my Wifi Wien End Project but this is the version with user addable Demo API Key from CoinGecko but it works also whitout but limited

# 📈 Crypto Price Tracker – Electron Desktop App

A modular, extensible **desktop app** built with **Electron** + **Node.js** that allows users to track cryptocurrency prices from the [CoinGecko API](https://www.coingecko.com/en/api). The app provides real-time alerts via **desktop notifications** and fully configurable **email alerts**, using a customizable watchlist and supporting **multiple base currencies**.

---

## 🚀 Project Goals

This project aims to create a powerful, modern crypto price monitoring desktop app with the following milestones:

### ✅ **Phase 1 – Setup & API Integration**
- Set up a desktop app environment using Electron.
- Fetch cryptocurrency price data from the public CoinGecko API.
- Organize the codebase to support modular growth, including a modern folder structure (`renderer/css`, `renderer/js`).

### ✅ **Phase 2 – Core Functionality**
- **Main Window**: Display a list of top cryptocurrencies by market cap (by user-defined count).
- **Add set Price target alaram**: Each coin entry includes a button to add it to a personal alarm.
- **Price Triggers**: Set conditions per coin to track price rise/fall in %.
- **Notification bell with current count of alrams**: Show the current price alarms.
  - Initially empty, populates based on user choice.
  - Displays price trend (up/down indicators).
- **Storage**: Use `electron-store` to persist user settings, watchlist, and alert rules.
- **Multi-currency Support**: Added functionality to select and display prices in various major currencies.

### ✅ **Phase 3 – Notifications & Alerts**
- **Desktop Notifications**: Trigger when a coin meets price alert conditions.
- **Configurable Email Alerts**: Send email notifications via a user-configurable mail service (e.g., Gmail with App Password).
- **Watchlist Management**:
  - Remove triggered coins if needed with a button clear history.
  - Store notification history.

### ✅ **Phase 4 – Search & Expansion**
- Implemented a **search bar** to find specific coins by name or symbol.
- Applied the same “Add to Watchlist” + trigger configuration UI for search results.
- Prepared for further expansion (e.g., charts).

---

## 🧱 Technologies Used

| Tech | Purpose |
|------|---------|
| **Electron** | Desktop app shell |
| **Node.js** | Backend logic & API calls |
| **CoinGecko API** | Real-time cryptocurrency market data |
| **electron-store** | Local storage for watchlists and settings |
| **nodemailer** | Send email alerts via user-configured mail service |
| **Bootstrap 5** | Frontend UI styling & layout (local files) |
| **Bootstrap Icons** | Icon library (local files) |

---
## 🔑 Why Use a CoinGecko API Key?

The CoinGecko API has a public, key-less option that is perfect for light use, but it comes with a strict rate limit (typically 10-30 calls per minute). Since this app polls for price updates every 60 seconds, you may encounter rate limiting errors, especially if you have multiple alarms set or perform frequent searches.

To avoid these interruptions, you can obtain a **free Demo API Key** from the [CoinGecko API Dashboard](https://www.coingecko.com/account/api). Adding this key in the app's settings (`API Key` button) provides a higher rate limit, ensuring more reliable and consistent price tracking.

---

## 💡 Example Use Case

1. User launches the app.
2. On the left, top 10 coins are shown (can be changed by user).
3. User selects their preferred base currency (e.g., EUR).
4. User clicks "Add to Watchlist" on **Ethereum**.
5. User sets a price drop trigger (e.g., “alert if drops by 5%”).
6. User configures their email settings in the "Mail Settings" modal.
7. The app monitors price changes via background polling.
8. If trigger hits:
   - ✅ Show a desktop notification.
   - 📧 Send an email (if enabled and configured).
   - ⏱ Coin is removed from watchlist after 5 minutes or on dismiss.

---

