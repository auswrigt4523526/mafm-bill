# Quick Bill Generator

A mobile-friendly application for creating, saving, and sharing bills quickly. Generate a professional-looking bill and share it as an image.

## Features

- Create bills with items, quantities, and rates
- Automatic calculation of totals and balances
- Save bills locally or to a database
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

3. For database support, set up Vercel Postgres:
   - Create a Vercel Postgres database
   - Copy [.env.example](.env.example) to [.env.local](.env.local) and fill in your database credentials
   - Run the setup script:
     ```bash
     npm run setup-db
     ```

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

## Deployment

This app can be deployed to Vercel with zero configuration. For database support, make sure to add your Vercel Postgres credentials as environment variables in your Vercel project settings.# mafm-bill
