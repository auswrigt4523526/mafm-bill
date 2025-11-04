# Quick Bill Generator

A mobile-friendly application for creating, saving, and sharing bills quickly. Generate a professional-looking bill and share it as an image.

## Features

- Create bills with items, quantities, and rates
- Automatic calculation of totals and balances
- Save bills to cloud storage
- Export bills as images for sharing
- Mobile-responsive design for on-the-go billing
- Progressive Web App (PWA) support for mobile installation

## Prerequisites

- Node.js

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. For data storage, you can use:
   - Firebase Realtime Database (recommended)
   - Vercel KV (requires payment method for free tier)
   - Vercel Postgres (requires payment method even for free tier)
   - localStorage (built-in fallback)

4. Add mobile app icons:
   - Place your `appstore.png` and `playstore.png` files in the `public` directory
   - These will be used as app icons when installing the app on mobile devices

5. Run the app:
   ```bash
   npm run dev
   ```

## Mobile App Installation

This app supports installation as a Progressive Web App (PWA) on both iOS and Android devices:

1. Open the app in your mobile browser
2. Look for the "Add to Home Screen" option in your browser menu
3. On iOS, this is typically in the share menu (box with arrow)
4. On Android, this may appear automatically as an install prompt

The app will function offline and provide a native app-like experience.

## Storage Options

### Firebase (Recommended)
Firebase provides a generous free tier perfect for this application:
- 1 GB Realtime Database storage
- 10 GB bandwidth/month
- No payment method required
- Cross-device sync
- Hosting included

### Vercel KV
KV provides a simple key-value store:
- 100,000 requests per day (free tier)
- 100MB storage (free tier)
- Requires payment method even for free usage

### Vercel Postgres
Full PostgreSQL database:
- 256MB storage (free tier)
- 1000 connections per day
- Requires payment method even for free usage

### localStorage (Fallback)
Built-in browser storage:
- Limited to user's browser
- No cross-device sync
- No configuration required
- Works immediately

## Deployment

### Firebase Hosting (Recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### Vercel Deployment
This app can be deployed to Vercel with zero configuration. For database support, make sure to add your database credentials as environment variables in your Vercel project settings.

# mafm-bill