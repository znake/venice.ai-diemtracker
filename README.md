# Venice.ai Balance Tracker

A sleek, dark-themed React SPA to monitor your Venice AI API balances (USD, DIEM, VCU) across multiple API keys.

![Venice Balance Tracker](https://img.shields.io/badge/React-19-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4) ![Vite](https://img.shields.io/badge/Vite-7-646CFF)

## Features

- **Multi-Key Support** - Track balances for multiple Venice API keys simultaneously
- **Auto-Refresh** - Balances update automatically every 60 seconds
- **Local Storage** - Keys are stored securely in your browser (never sent to any server except Venice API)
- **Dark Theme** - Easy on the eyes with a modern zinc/emerald color scheme
- **Responsive Design** - Works on desktop, tablet, and mobile

## What is Venice.ai?

[Venice.ai](https://venice.ai) is an AI platform that provides access to various language models. Users have balances in:
- **USD** - US Dollar balance
- **DIEM** - Venice's token currency
- **VCU** - Venice Compute Units

This tracker fetches your balances from the Venice API response headers.

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

## Usage

1. **Add an API Key**
   - Click the "+ Add Key" button
   - Enter a label (e.g., "Production", "Personal")
   - Paste your Venice API key
   - Click "Add Key"

2. **View Balances**
   - Your USD, DIEM, and VCU balances are displayed on each card
   - Balances refresh automatically every 60 seconds
   - Click "Refresh" on a card to update immediately
   - Click "Refresh All" to update all keys at once

3. **Manage Keys**
   - **Edit**: Click the pencil icon to modify label or API key
   - **Delete**: Click the trash icon to remove a key

## How It Works

The app makes a GET request to `https://api.venice.ai/api/v1/models` with your API key in the Authorization header. Venice returns your balance information in response headers:

- `x-venice-balance-usd` - USD balance
- `x-venice-balance-diem` - DIEM balance  
- `x-venice-balance-vcu` - VCU balance

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

> **Important**: Balance information is only available with **admin/account API keys**. Regular inference-only keys can make API calls but won't return balance headers. If you see "No balance data - requires admin API key", you need to use a key with higher permissions.

## License

MIT

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
