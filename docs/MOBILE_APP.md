# AnkaLife — Mobile App Guide

You now have a real mobile app in two forms. Start with #1 (free, live today); do #2 when you want to be in the actual app stores.

---

## 1. PWA — installable today, free, iOS + Android ✅ (DONE)

The website is now a **Progressive Web App**: anyone can install it to their phone's home screen with an icon and a full-screen, app-like experience — no app store needed.

**How you (and your agents) install it:**

- **Android (Chrome):** open **https://ankalifeleads.com** → tap the **"Install app"** button (bottom-right) or Chrome menu **⋮ → Install app / Add to Home screen**.
- **iPhone (Safari):** open **https://ankalifeleads.com** → tap **Share** (the box-with-arrow) → **Add to Home Screen**. (A banner reminds users of this on iOS.)

It launches full-screen with the gold "A" icon, works offline for the parts already loaded, and updates automatically whenever we push changes.

**What's included:** `manifest.webmanifest`, `sw.js` (service worker), `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, plus the install button + iOS hint in the app.

> A PWA is the same approach used by Twitter Lite, Starbucks, and Uber's lite app. For a lead platform it's usually all you need — and it sidesteps app-store fees and review delays.

---

## 2. Native app in the App Store + Google Play (when you're ready)

To appear in the **Apple App Store** and **Google Play Store**, wrap the existing site with **Capacitor** (it loads your web app inside a native shell — no rewrite). This requires accounts and build tools that are tied to *you*, so it's a guided do-it-together step.

### What you'll need first
- **Apple Developer account** — $99/year (developer.apple.com) — *required for iOS, and a **Mac with Xcode** is required to build/submit iOS apps.*
- **Google Play Developer account** — $25 one-time (play.google.com/console).
- **Node.js** (already installed) and **Android Studio** (free) for the Android build.

### Steps (I can scaffold all of this for you)
```bash
# in the project folder
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init AnkaLife com.ankalife.app --web-dir .
npx cap add android
npx cap add ios          # Mac only
npx cap copy
npx cap open android     # builds/runs in Android Studio
npx cap open ios         # builds/runs in Xcode (Mac only)
```
- For a site that's hosted (yours is), Capacitor can either bundle the files or point at `https://ankalifeleads.com` directly (set `server.url` in `capacitor.config`) so the app always shows the latest version.
- Add app icons/splash (we already have the icon art), set the bundle ID `com.ankalife.app`, then **Archive → submit** in Xcode (iOS) and **build an AAB → upload** in Play Console (Android).

### Review/timeline reality
- **Google Play:** usually live within a few hours–2 days.
- **Apple App Store:** ~1–3 days review; Apple sometimes rejects "just a website wrapper" apps — having the real, interactive features (portals, wallet, AI console) we've built helps it pass as a genuine app.

### When to do it
Do the PWA now (it's done). Move to native stores once you have paying agents and want the credibility/discoverability of a store listing. When you're ready, say the word and I'll scaffold the Capacitor project and walk you through each store submission.
