# How Solid Works — A Plain-English Guide

## The Core Idea

Solid (Social Linked Data) is a set of open standards created by Tim Berners-Lee (the inventor of the Web). Its goal: let users own their data, stored in a personal server called a **Pod**, and choose which apps can access it.

Instead of "Facebook stores your posts on Facebook's servers", Solid says: "your posts live on YOUR Pod; apps just read and write there with your permission."

## Key Terms

| Term | What it means |
|------|--------------|
| **Pod** | Your personal data storage on the web. Like a personal Dropbox, but open-standard. |
| **WebID** | Your identity URL, e.g. `https://alice.solidcommunity.net/profile/card#me`. Acts like a username that also points to a profile document. |
| **Pod Provider** | A server that hosts Pods. `solidcommunity.net` is a free public one. You can also self-host. |
| **OIDC** | The login standard Solid uses (same as "Log in with Google"). You authenticate with your Pod provider, which gives our app a token. |
| **Container** | A folder in your Pod. Identified by a URL ending in `/`. |
| **Resource** | Any file in your Pod (a note, an image, a JSON-LD document). |
| **ACL** | Access Control List — a file that says who can read/write a resource. |
| **Linked Data** | A way to structure data so that every "thing" has a URL and relationships between things are expressed as (subject, predicate, object) triples. |

## How This App Uses Solid

1. **Login**: we redirect you to solidcommunity.net's login page. After you authenticate, the provider sends a token back to our app (in the URL). We capture it with `handleIncomingRedirect()`.

2. **Notes as files**: each note is a `.md` file stored at `https://yourname.solidcommunity.net/research-notes/your-note-title.md`. We use `overwriteFile()` to write and `getFile()` to read.

3. **Listing notes**: the `/research-notes/` URL is a Container. We call `getSolidDataset()` to fetch the container as a Linked Data dataset, then `getContainedResourceUrlAll()` to extract the list of resource URLs inside it.

4. **Public sharing**: by default your notes are private (only you can read them). When you click "Make Public", we call `universalAccess.setPublicAccess(noteUrl, { read: true }, ...)`. This writes an `.acl` file next to your note granting read access to everyone (including unauthenticated users).

5. **Shareable URL**: the link we generate just appends `?view=<noteUrl>` to our app's URL. When someone opens that link, our app's `PublicNoteViewer` component fetches the note directly via `fetch()` — no Solid SDK needed, because it's a public HTTP resource.

## The Authentication Flow (Step by Step)

```
User clicks "Log in"
  → loginWithProvider("https://solidcommunity.net")
  → Browser redirects to solidcommunity.net login page
  → User enters username + password
  → Provider redirects back to our app with tokens in the URL
  → Our app calls handleIncomingRedirect() and captures the session
  → Session is stored in the browser; survives page refresh
```

## Why No Backend?

Solid is designed for this. The Pod server IS the backend. Every Pod speaks standard HTTP with WebID-OIDC authentication. Our app just makes authenticated HTTP requests to Pod URLs — no middleman needed.
