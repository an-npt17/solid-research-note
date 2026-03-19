# Solid Research Notes

A collaborative research notes app where each researcher owns their notes in their personal **Solid Pod**. No shared server. No central database. Your data, your rules.

Built with Vite + React, @inrupt/solid-client-authn-browser, @inrupt/solid-client, and Tailwind CSS.

## Quick Start

### 1. Get a free Solid Pod

Go to [solidcommunity.net/register](https://solidcommunity.net/register) and create an account. This gives you a Pod at `https://your-username.solidcommunity.net/`.

### 2. Run the app locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

### 3. Log in

Enter `https://solidcommunity.net` in the provider field and click "Log in with Solid". You'll be redirected to solidcommunity.net to authenticate, then returned to the app.

### 4. Create notes

Click "+ New Note". Notes are saved as `.md` files in `/research-notes/` on your Pod.

### 5. Share a note

Open a note and click "Make Public & Share". Copy the link and send it to anyone — they can read it without logging in.

## Documentation

- [How Solid Works](docs/explanation.md) — plain-English guide to Solid, Pods, WebIDs, and how this app uses them
- [Deployment Guide](docs/deploy.md) — how to deploy to Netlify, Vercel, or GitHub Pages

## Project Structure

```
src/
  auth/
    session.js        — login, logout, session helpers
    AuthContext.jsx   — React context for session state
  pod/
    notes.js          — read, write, list, delete notes on the Pod
    acl.js            — make notes public / revoke access
  components/
    LoginPage.jsx     — Pod provider login form
    Layout.jsx        — header with user info and logout
    NoteList.jsx      — main screen: grid of notes with actions
    NoteEditor.jsx    — create / edit note modal
    NoteViewer.jsx    — Markdown renderer with share button
    ShareModal.jsx    — shows the public URL after sharing
  App.jsx             — routing: public viewer / auth gate / note list
docs/
  explanation.md      — Solid protocol explained for newcomers
  deploy.md           — deployment instructions
```

## Running Tests

```bash
npm test
```

## License

MIT
