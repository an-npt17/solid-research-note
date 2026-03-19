# Deployment Guide

## Build for Production

```bash
npm run build
```

This creates a `dist/` folder with static HTML, CSS, and JS. You can host this on any static file server.

---

## Option 1: Netlify (easiest, free)

1. Go to [netlify.com](https://netlify.com) and sign up.
2. Drag and drop the `dist/` folder onto the Netlify dashboard.
3. Done — you get a URL like `https://random-name.netlify.app`.

To redeploy after changes:
```bash
npm run build
# then drag-drop again, or use Netlify CLI:
npx netlify-cli deploy --prod --dir dist
```

The `public/_redirects` file (already in this repo) ensures direct visits to `/?view=<url>` work correctly on Netlify instead of returning a 404.

---

## Option 2: Vercel (also free)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Vercel auto-detects Vite and handles routing automatically.

---

## Option 3: GitHub Pages

1. In `vite.config.js`, add `base: '/your-repo-name/'` inside `defineConfig`.
2. Install gh-pages: `npm install -D gh-pages`
3. Add to `package.json` scripts:
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```
4. Run `npm run deploy`.

**Note:** GitHub Pages doesn't natively support the `?view=` query param redirect without extra configuration, so Netlify or Vercel are easier for this app.

---

## After Deployment

The app automatically uses whatever URL it's hosted at for the OIDC redirect — no config change needed. When `loginWithProvider()` is called, it passes `window.location.href` as the `redirectUrl`, so it works on localhost, Netlify, Vercel, or anywhere else.

---

## Environment: None Needed

This app has zero secrets and no backend. It's a pure static site. You do NOT need environment variables, API keys, or a server.
