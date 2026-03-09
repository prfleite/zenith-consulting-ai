

# PWA Setup for ApexConsult

## What will be done

Install `vite-plugin-pwa` and configure the app as an installable Progressive Web App with offline support, proper manifest, icons, and mobile meta tags.

## Changes

### 1. Install dependency
- `vite-plugin-pwa`

### 2. `vite.config.ts`
- Add `VitePWA` plugin with manifest (name: "ApexConsult", theme_color gold, icons)
- Add `navigateFallbackDenylist: [/^\/~oauth/]` to workbox config

### 3. `index.html`
- Update `<title>` to "ApexConsult"
- Add mobile meta tags: `theme-color`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`
- Add `<link rel="apple-touch-icon">`

### 4. PWA Icons
- Create `public/pwa-192x192.png` and `public/pwa-512x512.png` (gold sparkle logo on dark background)

### 5. Install prompt page
- Create `src/pages/Install.tsx` with install instructions and a button to trigger the browser install prompt
- Add `/install` route in `App.tsx`

