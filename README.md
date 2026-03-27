# Solid Research Notes

A collaborative research notes app can lets you create .md notes and link them together as Obsidian style "backlinks".

Built with Vite + React, @inrupt/solid-client-authn-browser, @inrupt/solid-client, and Tailwind CSS.

## Quick Start

### 1. Get a free Solid Pod

Go to [solidcommunity.net/register](https://solidcommunity.net/register) and create an account. This gives you a Pod at `https://your-username.solidcommunity.net/`.

### 2. Run the app locally

```bash
bun install
bun run dev
```

Open `http://localhost:5173`.

### 3. Log in

Enter `https://solidcommunity.net` in the provider field and click "Log in with Solid". You'll be redirected to solidcommunity.net to authenticate, then returned to the app.

### 4. Create notes

Click "+ New Note". Notes are saved as `.md` files in `/research-notes/` on your Pod.

### 5. Share a note

Open a note and click "Make Public & Share". Copy the link and send it to anyone — they can read it without logging in.

## License

MIT
