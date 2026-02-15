# Venice.ai Balance Tracker

A sleek, dark-themed React SPA to monitor your Venice AI API balances (USD, DIEM) across multiple API keys with built-in usage analytics.

![Venice Balance Tracker](https://img.shields.io/badge/React-19-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4) ![Vite](https://img.shields.io/badge/Vite-7-646CFF)

## Features

- **Multi-Key Support** - Track balances for multiple Venice API keys simultaneously
- **Usage Dashboard** - Comprehensive analytics showing model usage, costs, and token consumption
- **Dual Currency Display** - View costs in both DIEM and USD
- **Period Selection** - Filter usage by Today, Last 7 days, Last 30 days, or Last 90 days
- **Auto-Refresh** - Balances update automatically every 60 seconds
- **Local Storage** - Keys are stored securely in your browser (never sent to any server except Venice API)
- **Dark Theme** - Easy on the eyes with a modern zinc/emerald color scheme
- **Responsive Design** - Works on desktop, tablet, and mobile
- **PWA Ready** - Install on your phone for native app experience

## What is Venice.ai?

[Venice.ai](https://venice.ai) is an AI platform that provides access to various language models. Users have balances in:

- **USD** - US Dollar balance
- **DIEM** - Venice's token currency (formerly VCU)

This tracker fetches your balances and usage from the Venice API.

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or bun

### Installation

```bash
# Clone the repository
git clone git@github.com:znake/venice.ai-diemtracker.git
cd venice.ai-diemtracker

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

The built files will be in the `dist/` folder.

## Screenshots

### Desktop View

![Desktop View](./public/desktop%20week.png)

### Mobile View

![Mobile View](./public/mobile%20today.png)

## Deployment

This app is a static SPA that can be deployed anywhere. Choose your preferred method:

### Docker (VPS / Self-Hosted)

Deploy on any VPS (Hetzner, DigitalOcean, etc.) using Docker:

```bash
# Build the image
docker build -t venice-tracker .

# Run the container
docker run -d -p 80:80 venice-tracker
```

Or use Docker Compose:

```yaml
# docker-compose.yml
services:
  venice-tracker:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
```

```bash
docker compose up -d
```

### Vercel

1. Fork this repository
2. Go to [vercel.com](https://vercel.com) and import your fork
3. Vercel auto-detects Vite — just click Deploy

Or via CLI:

```bash
npm i -g vercel
vercel
```

### Netlify

1. Connect your repo at [netlify.com](https://netlify.com)
2. Build command: `npm run build`
3. Publish directory: `dist`

### Cloudflare Pages

1. Connect your repo in Cloudflare Dashboard
2. Build command: `npm run build`
3. Build output directory: `dist`

## PWA Support

The app works as a **Progressive Web App** — install it on your smartphone for quick access to your balances:

### iOS (Safari)
1. Open the deployed app in Safari
2. Tap the Share button
3. Select **"Add to Home Screen"**

### Android (Chrome)
1. Open the deployed app in Chrome
2. Tap the menu (⋮)
3. Select **"Add to Home Screen"** or **"Install App"**

Once installed, the app opens in standalone mode (no browser UI) and feels like a native app. Your API keys stay synced in local storage.

## Usage

### 1. Add an API Key

- Click the "+ Add Key" button
- Enter a label (e.g., "Production", "Personal")
- Paste your Venice API key
- Click "Add Key"

### 2. View Balances

- Your USD and DIEM balances are displayed on each card
- Balances refresh automatically every 60 seconds
- Click "Refresh" on a card to update immediately
- Click "Refresh All" to update all keys at once

### 3. Manage Keys

- **Edit**: Click the pencil icon to modify label or API key
- **Delete**: Click the trash icon to remove a key

### 4. Usage Dashboard

The Usage Dashboard provides detailed analytics for your API usage:

- **Period Selection** - Choose between Today, Last 7 days, Last 30 days, or Last 90 days
- **Model Breakdown** - See exactly which models you're using and how much each costs
- **Cost Display** - View costs in both DIEM and USD side by side
- **Token Tracking** - Monitor prompt and completion tokens per model
- **Request Count** - Track total number of API requests
- **Last Updated** - See when data was last refreshed

The dashboard shows aggregated usage across all your API keys, making it easy to understand your overall consumption patterns.

## How It Works

The app makes a GET request to `https://api.venice.ai/api/v1/api_keys/rate_limits` with your API key in the Authorization header. Venice returns your balance information in the JSON response:

```json
{
  "data": {
    "balances": {
      "USD": 50.23,
      "DIEM": 100.02
    }
  }
}
```

## Security

- **Client-Side Only** - This is a static SPA with no backend server
- **Local Storage** - API keys are stored only in your browser's localStorage
- **Direct API Calls** - Requests go directly from your browser to Venice API
- **No Tracking** - No analytics, no cookies, no data collection

> **Note**: Your API keys are stored in plain text in localStorage. Only use this app on trusted devices.

## Tech Stack

- [React 19](https://react.dev/) - UI framework
- [Vite 7](https://vite.dev/) - Build tool
- [Tailwind CSS 4](https://tailwindcss.com/) - Styling

## Getting a Venice API Key

1. Go to [venice.ai](https://venice.ai)
2. Create an account or log in
3. Navigate to Settings > API Keys
4. Generate a new API key
5. Copy and paste it into this tracker

> **Important**: Balance information is available with any valid API key. If you see "No balance data in response", the API key may not have the required permissions.

## License

MIT

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
