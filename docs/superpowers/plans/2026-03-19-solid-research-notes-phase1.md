# Solid Research Notes — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static React app where researchers log in with their Solid Pod, then create/edit/delete Markdown notes stored in their Pod, and optionally make notes publicly shareable via a URL.

**Architecture:** Vite + React SPA with no backend — all data lives in the user's Solid Pod (solidcommunity.net). Auth uses OIDC via @inrupt/solid-client-authn-browser; Pod reads/writes use @inrupt/solid-client. Routing is handled by a simple state machine in App.jsx (no react-router needed for Phase 1).

**Tech Stack:** Vite 5, React 18, @inrupt/solid-client-authn-browser ^2, @inrupt/solid-client ^2, react-markdown, Tailwind CSS 3, Vitest (unit tests)

---

## File Map

```
solid-research-note/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── _redirects              ← Netlify SPA redirect rule
├── docs/
│   ├── explanation.md          ← What Solid/WebID/Pods are, for newcomers
│   └── deploy.md               ← How to deploy to Netlify/Vercel/GitHub Pages
└── src/
    ├── main.jsx                ← React root, mounts App
    ├── App.jsx                 ← Top-level view router (login / notes / viewer)
    ├── auth/
    │   ├── session.js          ← login(), logout(), handleRedirectAfterLogin(), getWebId()
    │   └── AuthContext.jsx     ← React context + provider exposing session state
    ├── pod/
    │   ├── notes.js            ← listNotes(), getNote(), saveNote(), deleteNote()
    │   └── acl.js              ← makeNotePublic(), revokeNotePublic(), getPublicUrl()
    ├── components/
    │   ├── Layout.jsx          ← Page shell: header with WebID + logout button
    │   ├── LoginPage.jsx       ← Pod provider URL input + "Log in" button
    │   ├── NoteList.jsx        ← Fetched notes grid; New / Edit / Delete / Share actions
    │   ├── NoteEditor.jsx      ← Textarea modal for create & edit
    │   ├── NoteViewer.jsx      ← react-markdown renderer + "Make Public" button
    │   └── ShareModal.jsx      ← Displays the public URL, copy-to-clipboard
    └── __tests__/
        ├── setup.js            ← @testing-library/jest-dom import
        ├── session.test.js
        └── notes.test.js
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.jsx`

- [ ] **Step 1: Initialise the Vite + React project**

```bash
cd /home/annpt/master2025-2026/semantic-web/solid-research-note
npm create vite@latest . -- --template react
```

Expected: Vite scaffolds `src/`, `index.html`, `package.json`.

- [ ] **Step 2: Install all dependencies in one shot**

```bash
npm install \
  @inrupt/solid-client-authn-browser \
  @inrupt/solid-client \
  react-markdown
npm install -D \
  tailwindcss postcss autoprefixer \
  vitest @vitest/coverage-v8 \
  @testing-library/react @testing-library/jest-dom \
  jsdom
```

- [ ] **Step 3: Initialise Tailwind**

```bash
npx tailwindcss init -p
```

Then replace `tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 4: Add Tailwind directives to a new `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Update `vite.config.js` to include Vitest config**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    globals: true,
  },
})
```

- [ ] **Step 6: Create test setup file `src/__tests__/setup.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Strip Vite boilerplate from `src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 8: Create `public/_redirects` for Netlify SPA routing**

```bash
mkdir -p public
echo "/* /index.html 200" > public/_redirects
```

This ensures that direct visits to `/?view=<url>` work on Netlify instead of returning a 404.

- [ ] **Step 9: Add `"test"` script to `package.json`**

In the `"scripts"` object add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 10: Verify scaffold compiles**

```bash
npm run dev
```

Expected: "VITE ready" message in terminal, blank React page at `http://localhost:5173`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + Tailwind + Inrupt deps"
```

---

## Task 2: Auth Module

**Files:**
- Create: `src/auth/session.js`
- Create: `src/__tests__/session.test.js`

The Solid OIDC flow works like this:
1. User clicks "Log in" → we call `login()` with their Pod provider URL → browser redirects to the provider
2. Provider redirects back to our app with auth tokens in the URL
3. We call `handleIncomingRedirect()` on every page load to silently pick up that redirect
4. After that the session is active and every Pod HTTP call is automatically authenticated

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/session.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Inrupt library so tests don't need a real Pod
vi.mock('@inrupt/solid-client-authn-browser', () => ({
  getDefaultSession: vi.fn(() => ({
    info: { isLoggedIn: false, webId: undefined },
    on: vi.fn(),
  })),
  handleIncomingRedirect: vi.fn(async () => {}),
  login: vi.fn(async () => {}),
  logout: vi.fn(async () => {}),
}))

import { getWebId, isLoggedIn } from '../auth/session.js'
import { getDefaultSession } from '@inrupt/solid-client-authn-browser'

describe('session helpers', () => {
  it('getWebId returns undefined when not logged in', () => {
    expect(getWebId()).toBeUndefined()
  })

  it('isLoggedIn returns false when not logged in', () => {
    expect(isLoggedIn()).toBe(false)
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../auth/session.js'`

- [ ] **Step 3: Implement `src/auth/session.js`**

```js
import {
  getDefaultSession,
  handleIncomingRedirect,
  login,
  logout,
} from '@inrupt/solid-client-authn-browser'

/**
 * Must be called once at app startup.
 * Silently completes the OIDC redirect if the user is returning from login.
 * Pass restorePreviousSession: true so login survives page refresh.
 */
export async function initSession() {
  await handleIncomingRedirect({ restorePreviousSession: true })
}

/**
 * Redirect the user to their Pod provider's login page.
 * @param {string} oidcIssuer - e.g. "https://solidcommunity.net"
 */
export async function loginWithProvider(oidcIssuer) {
  await login({
    oidcIssuer,
    redirectUrl: window.location.href,
    clientName: 'Solid Research Notes',
  })
}

export async function logoutSession() {
  await logout()
}

/** Returns the logged-in user's WebID string, or undefined. */
export function getWebId() {
  return getDefaultSession().info.webId
}

/** Returns true if a session is active. */
export function isLoggedIn() {
  return getDefaultSession().info.isLoggedIn
}

/**
 * Register a callback that fires whenever login state changes.
 * Inrupt fires 'login' and 'logout' events on the session object.
 */
export function onSessionChange(callback) {
  const session = getDefaultSession()
  session.on('login', callback)
  session.on('logout', callback)
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npm test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/auth/session.js src/__tests__/session.test.js
git commit -m "feat(auth): add session init/login/logout helpers"
```

---

## Task 3: AuthContext

**Files:**
- Create: `src/auth/AuthContext.jsx`

This React context makes the session state (webId, isLoggedIn) available to any component without prop drilling.

- [ ] **Step 1: Create `src/auth/AuthContext.jsx`**

```jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { initSession, getWebId, isLoggedIn, onSessionChange } from './session.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sessionState, setSessionState] = useState({
    webId: undefined,
    loggedIn: false,
    loading: true,
  })

  useEffect(() => {
    // Handle the OIDC redirect on first load, then read session state
    initSession().then(() => {
      setSessionState({
        webId: getWebId(),
        loggedIn: isLoggedIn(),
        loading: false,
      })
    })

    // Keep React state in sync whenever Inrupt fires login/logout events
    onSessionChange(() => {
      setSessionState({
        webId: getWebId(),
        loggedIn: isLoggedIn(),
        loading: false,
      })
    })
  }, [])

  return (
    <AuthContext.Provider value={sessionState}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 2: Wrap app in provider — update `src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
```

- [ ] **Step 3: Commit**

```bash
git add src/auth/AuthContext.jsx src/main.jsx
git commit -m "feat(auth): add AuthContext provider and useAuth hook"
```

---

## Task 4: Pod Notes Module

**Files:**
- Create: `src/pod/notes.js`
- Create: `src/__tests__/notes.test.js`

Notes are stored as `.md` files inside the container `<podRoot>/research-notes/`. For example:
- Container URL: `https://alice.solidcommunity.net/research-notes/`
- Note URL: `https://alice.solidcommunity.net/research-notes/my-note.md`

The user's Pod root is derived from their WebID: `https://alice.solidcommunity.net/profile/card#me` → root is `https://alice.solidcommunity.net/`.

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/notes.test.js`:

```js
import { describe, it, expect, vi } from 'vitest'
import { getContainerUrl, slugify } from '../pod/notes.js'

// Mock @inrupt/solid-client so tests don't need a real Pod
vi.mock('@inrupt/solid-client', () => ({
  getSolidDataset: vi.fn(async () => ({})),
  getContainedResourceUrlAll: vi.fn(() => []),
  getFile: vi.fn(async () => new Blob([''])),
  overwriteFile: vi.fn(async () => {}),
  deleteFile: vi.fn(async () => {}),
  createContainerAt: vi.fn(async () => {}),
}))

vi.mock('@inrupt/solid-client-authn-browser', () => ({
  getDefaultSession: vi.fn(() => ({ fetch: globalThis.fetch, info: {} })),
}))

describe('notes helpers', () => {
  it('derives container URL from WebID', () => {
    const webId = 'https://alice.solidcommunity.net/profile/card#me'
    expect(getContainerUrl(webId)).toBe(
      'https://alice.solidcommunity.net/research-notes/'
    )
  })

  it('slugifies a note title', () => {
    expect(slugify('My Research Note!')).toBe('my-research-note')
  })

  it('listNotes filters only .md URLs from the container', async () => {
    const { getSolidDataset, getContainedResourceUrlAll } = await import('@inrupt/solid-client')
    const { listNotes } = await import('../pod/notes.js')

    getContainedResourceUrlAll.mockReturnValueOnce([
      'https://alice.solidcommunity.net/research-notes/note-one.md',
      'https://alice.solidcommunity.net/research-notes/workspace.jsonld',
      'https://alice.solidcommunity.net/research-notes/note-two.md',
    ])

    const notes = await listNotes('https://alice.solidcommunity.net/profile/card#me')
    expect(notes).toHaveLength(2)
    expect(notes[0].name).toBe('note-one')
    expect(notes[1].name).toBe('note-two')
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../pod/notes.js'`

- [ ] **Step 3: Implement `src/pod/notes.js`**

```js
import {
  getSolidDataset,
  getContainedResourceUrlAll,
  getFile,
  overwriteFile,
  deleteFile,
  createContainerAt,
} from '@inrupt/solid-client'
import { getDefaultSession } from '@inrupt/solid-client-authn-browser'

/**
 * Given a WebID like "https://alice.solidcommunity.net/profile/card#me",
 * returns "https://alice.solidcommunity.net/research-notes/"
 */
export function getContainerUrl(webId) {
  const url = new URL(webId)
  return `${url.protocol}//${url.host}/research-notes/`
}

/**
 * Converts a human title to a URL-safe slug.
 * e.g. "My Note!" → "my-note"
 */
export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function getSession() {
  return getDefaultSession()
}

/**
 * List all .md note URLs in the user's /research-notes/ container.
 * Returns an array of { url, name } objects.
 * Creates the container if it doesn't exist yet.
 *
 * Uses getSolidDataset() to fetch the container as a Linked Data dataset,
 * then getContainedResourceUrlAll() to extract the list of resource URLs.
 */
export async function listNotes(webId) {
  const containerUrl = getContainerUrl(webId)
  const { fetch } = getSession()

  // Ensure the container exists (throws if already exists — that's fine)
  try {
    await createContainerAt(containerUrl, { fetch })
  } catch {
    // Container already exists — ignore the error
  }

  const dataset = await getSolidDataset(containerUrl, { fetch })
  const allUrls = getContainedResourceUrlAll(dataset)
  const noteUrls = allUrls.filter((url) => url.endsWith('.md'))

  return noteUrls.map((url) => ({
    url,
    name: decodeURIComponent(url.split('/').pop().replace('.md', '')),
  }))
}

/**
 * Fetch the Markdown text of a note by its URL.
 */
export async function getNote(noteUrl) {
  const { fetch } = getSession()
  const blob = await getFile(noteUrl, { fetch })
  return blob.text()
}

/**
 * Save (create or overwrite) a note.
 * @param {string} webId - the logged-in user's WebID
 * @param {string} title - human-readable title (becomes filename)
 * @param {string} content - Markdown text
 * @returns {string} the note's URL
 */
export async function saveNote(webId, title, content) {
  const { fetch } = getSession()
  const containerUrl = getContainerUrl(webId)
  const noteUrl = `${containerUrl}${slugify(title)}.md`

  await overwriteFile(noteUrl, new Blob([content], { type: 'text/markdown' }), {
    contentType: 'text/markdown',
    fetch,
  })

  return noteUrl
}

/**
 * Delete a note by URL.
 */
export async function deleteNote(noteUrl) {
  const { fetch } = getSession()
  await deleteFile(noteUrl, { fetch })
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/pod/notes.js src/__tests__/notes.test.js
git commit -m "feat(pod): add note list/get/save/delete with container helpers"
```

---

## Task 5: ACL Module (Public Sharing)

**Files:**
- Create: `src/pod/acl.js`

Making a note public writes an ACL resource (`.acl` file) next to the note, granting `foaf:Agent` (= everyone) read access. The `@inrupt/solid-client` `universalAccess` API handles this.

- [ ] **Step 1: Create `src/pod/acl.js`**

```js
import { universalAccess } from '@inrupt/solid-client'
import { getDefaultSession } from '@inrupt/solid-client-authn-browser'

/** Returns the authenticated fetch function from the active session. */
function getSessionFetch() {
  return getDefaultSession().fetch
}

/**
 * Grant public (unauthenticated) read access to a note.
 * Returns the note URL so callers can build shareable links.
 */
export async function makeNotePublic(noteUrl) {
  await universalAccess.setPublicAccess(
    noteUrl,
    { read: true },
    { fetch: getSessionFetch() }
  )
  return noteUrl
}

/**
 * Revoke public read access from a note.
 */
export async function revokeNotePublic(noteUrl) {
  await universalAccess.setPublicAccess(
    noteUrl,
    { read: false },
    { fetch: getSessionFetch() }
  )
}

/**
 * Build a shareable viewer URL by embedding the note URL as a ?view= query param.
 * Clears any existing query params first so we don't stack ?view= on top of ?view=.
 *
 * e.g. https://your-app.netlify.app/?view=https://alice.solidcommunity.net/research-notes/note.md
 */
export function getShareableUrl(noteUrl) {
  const appUrl = new URL(window.location.href)
  appUrl.search = ''
  appUrl.searchParams.set('view', noteUrl)
  return appUrl.toString()
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pod/acl.js
git commit -m "feat(pod): add ACL helpers for public read grant/revoke"
```

---

## Task 6: LoginPage Component

**Files:**
- Create: `src/components/LoginPage.jsx`

- [ ] **Step 1: Create `src/components/LoginPage.jsx`**

```jsx
import React, { useState } from 'react'
import { loginWithProvider } from '../auth/session.js'

const DEFAULT_PROVIDER = 'https://solidcommunity.net'

export default function LoginPage() {
  const [provider, setProvider] = useState(DEFAULT_PROVIDER)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    await loginWithProvider(provider)
    // Browser will redirect — no need to setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Solid Research Notes
        </h1>
        <p className="text-slate-500 mb-6 text-sm">
          Log in with your{' '}
          <a
            href="https://solidproject.org/users/get-a-pod"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 underline"
          >
            Solid Pod
          </a>
          . New? Create a free account at{' '}
          <a
            href="https://solidcommunity.net/register"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 underline"
          >
            solidcommunity.net
          </a>
          .
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pod Provider URL
            </label>
            <input
              type="url"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://solidcommunity.net"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
          >
            {loading ? 'Redirecting…' : 'Log in with Solid'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LoginPage.jsx
git commit -m "feat(ui): add LoginPage with Pod provider input"
```

---

## Task 7: Layout Component

**Files:**
- Create: `src/components/Layout.jsx`

- [ ] **Step 1: Create `src/components/Layout.jsx`**

```jsx
import React from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { logoutSession } from '../auth/session.js'

export default function Layout({ children }) {
  const { webId } = useAuth()

  // Show a short display name derived from the WebID
  // e.g. "https://alice.solidcommunity.net/profile/card#me" → "alice"
  const displayName = webId
    ? new URL(webId).hostname.split('.')[0]
    : ''

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-indigo-700 text-lg">
          Solid Research Notes
        </span>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span title={webId}>{displayName}</span>
          <button
            onClick={logoutSession}
            className="text-red-500 hover:text-red-700 font-medium"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Layout.jsx
git commit -m "feat(ui): add Layout header with WebID display and logout"
```

---

## Task 8: NoteEditor Component

**Files:**
- Create: `src/components/NoteEditor.jsx`

This is a modal dialog for both creating new notes and editing existing ones.

- [ ] **Step 1: Create `src/components/NoteEditor.jsx`**

```jsx
import React, { useState, useEffect } from 'react'

export default function NoteEditor({ initial, onSave, onCancel }) {
  // initial: { title, content } for edits, or null for new notes
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [saving, setSaving] = useState(false)
  const isEdit = !!initial

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(title, content)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">
            {isEdit ? 'Edit Note' : 'New Note'}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isEdit}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              placeholder="My Research Note"
              required
            />
            {isEdit && (
              <p className="text-xs text-slate-400 mt-1">
                Title cannot be changed (it is the filename on your Pod).
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Content (Markdown)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="# Introduction&#10;&#10;Write your notes here..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NoteEditor.jsx
git commit -m "feat(ui): add NoteEditor modal for create and edit"
```

---

## Task 9: NoteViewer + ShareModal Components

**Files:**
- Create: `src/components/NoteViewer.jsx`
- Create: `src/components/ShareModal.jsx`

NoteViewer renders Markdown and hosts the "Make Public" / "Revoke" actions. ShareModal shows the generated URL.

- [ ] **Step 1: Create `src/components/ShareModal.jsx`**

```jsx
import React, { useState } from 'react'

export default function ShareModal({ shareUrl, onClose }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h2 className="font-semibold text-slate-800 mb-2">Note is now public</h2>
        <p className="text-sm text-slate-500 mb-4">
          Anyone with this link can read the note without logging in.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="mt-4 text-right">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/NoteViewer.jsx`**

```jsx
import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { makeNotePublic, revokeNotePublic, getShareableUrl } from '../pod/acl.js'
import ShareModal from './ShareModal.jsx'

export default function NoteViewer({ noteUrl, title, content, onClose, onEdit }) {
  const [shareUrl, setShareUrl] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [revoking, setRevoking] = useState(false)

  async function handleMakePublic() {
    setSharing(true)
    try {
      await makeNotePublic(noteUrl)
      setShareUrl(getShareableUrl(noteUrl))
    } finally {
      setSharing(false)
    }
  }

  async function handleRevoke() {
    setRevoking(true)
    try {
      await revokeNotePublic(noteUrl)
      setShareUrl(null)
    } finally {
      setRevoking(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <h2 className="font-semibold text-slate-800 truncate pr-4">{title}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none flex-shrink-0">×</button>
          </div>

          {/* Markdown body */}
          <div className="px-6 py-4 overflow-y-auto flex-1 prose prose-slate max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
            <button
              onClick={onEdit}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Edit
            </button>
            {!shareUrl ? (
              <button
                onClick={handleMakePublic}
                disabled={sharing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
              >
                {sharing ? 'Making public…' : 'Make Public & Share'}
              </button>
            ) : (
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
              >
                {revoking ? 'Revoking…' : 'Revoke Public Access'}
              </button>
            )}
          </div>
        </div>
      </div>

      {shareUrl && (
        <ShareModal shareUrl={shareUrl} onClose={() => setShareUrl(null)} />
      )}
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/NoteViewer.jsx src/components/ShareModal.jsx
git commit -m "feat(ui): add NoteViewer with markdown rendering and ShareModal"
```

---

## Task 10: NoteList Component

**Files:**
- Create: `src/components/NoteList.jsx`

This is the main screen after login — fetches note metadata, lets users open/edit/delete notes, and triggers the editor for new notes.

- [ ] **Step 1: Create `src/components/NoteList.jsx`**

```jsx
import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { listNotes, getNote, saveNote, deleteNote } from '../pod/notes.js'
import NoteEditor from './NoteEditor.jsx'
import NoteViewer from './NoteViewer.jsx'

export default function NoteList() {
  const { webId } = useAuth()
  const [notes, setNotes] = useState([])        // [{ url, name }]
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // null | 'create' | { url, name, content } (for view/edit)
  const [active, setActive] = useState(null)
  const [editContent, setEditContent] = useState(null)

  const loadNotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setNotes(await listNotes(webId))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [webId])

  useEffect(() => { loadNotes() }, [loadNotes])

  async function handleOpenNote(note) {
    const content = await getNote(note.url)
    setActive({ ...note, content })
    setEditContent(null)
  }

  async function handleSave(title, content) {
    await saveNote(webId, title, content)
    setActive(null)
    setEditContent(null)
    await loadNotes()
  }

  async function handleDelete(noteUrl) {
    if (!confirm('Delete this note?')) return
    await deleteNote(noteUrl)
    setActive(null)
    await loadNotes()
  }

  function handleEditFromViewer() {
    setEditContent({ title: active.name, content: active.content })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">My Notes</h2>
        <button
          onClick={() => setActive('create')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
        >
          + New Note
        </button>
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading notes from your Pod…</p>}
      {error && <p className="text-red-500 text-sm">Error: {error}</p>}

      {!loading && !error && notes.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">📝</p>
          <p>No notes yet. Create your first one!</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <div
            key={note.url}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition cursor-pointer group"
          >
            <div
              className="font-medium text-slate-800 mb-3 truncate"
              onClick={() => handleOpenNote(note)}
            >
              {note.name}
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => handleOpenNote(note)}
                className="text-xs px-3 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              >
                Open
              </button>
              <button
                onClick={() => handleDelete(note.url)}
                className="text-xs px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New note editor */}
      {active === 'create' && (
        <NoteEditor
          initial={null}
          onSave={handleSave}
          onCancel={() => setActive(null)}
        />
      )}

      {/* Edit existing note */}
      {editContent && active && active !== 'create' && (
        <NoteEditor
          initial={editContent}
          onSave={handleSave}
          onCancel={() => setEditContent(null)}
        />
      )}

      {/* View note */}
      {active && active !== 'create' && !editContent && (
        <NoteViewer
          noteUrl={active.url}
          title={active.name}
          content={active.content}
          onClose={() => setActive(null)}
          onEdit={handleEditFromViewer}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NoteList.jsx
git commit -m "feat(ui): add NoteList with open/edit/delete and new note flow"
```

---

## Task 11: App Router + Public Note Viewer (Unauthenticated)

**Files:**
- Replace: `src/App.jsx` (Vite generates a boilerplate stub during scaffold — overwrite it entirely)

When someone opens the app with `?view=<noteUrl>` in the URL, show the note publicly without requiring login. This is the shareable-link feature.

- [ ] **Step 1: Overwrite the Vite-generated `src/App.jsx` entirely with the following content**

This is the routing hub. It checks for `?view=` first, then checks auth state.

```jsx
import React, { useEffect, useState } from 'react'
import { useAuth } from './auth/AuthContext.jsx'
import LoginPage from './components/LoginPage.jsx'
import Layout from './components/Layout.jsx'
import NoteList from './components/NoteList.jsx'
import ReactMarkdown from 'react-markdown'

function PublicNoteViewer({ noteUrl }) {
  const [content, setContent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch the note directly — no auth needed because it's public
    fetch(noteUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} — note may not be public`)
        return r.text()
      })
      .then(setContent)
      .catch((e) => setError(e.message))
  }, [noteUrl])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            Could not load note: {error}
          </div>
        )}
        {content && (
          <div className="bg-white rounded-2xl shadow p-8 prose prose-slate max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
        {!content && !error && (
          <p className="text-slate-400 text-sm">Loading…</p>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const { loading, loggedIn } = useAuth()

  // Check for ?view= query param (public note viewer)
  const params = new URLSearchParams(window.location.search)
  const viewUrl = params.get('view')

  if (viewUrl) {
    return <PublicNoteViewer noteUrl={viewUrl} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
        Loading session…
      </div>
    )
  }

  if (!loggedIn) {
    return <LoginPage />
  }

  return (
    <Layout>
      <NoteList />
    </Layout>
  )
}
```

- [ ] **Step 2: Remove Vite boilerplate CSS and default App.css**

```bash
rm -f src/App.css src/assets/react.svg
```

Update `src/index.css` — it should only have the Tailwind directives (from Task 1). Delete everything else in it.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx src/index.css
git commit -m "feat: add App router with public note viewer and auth gate"
```

---

## Task 12: Smoke Test the Full Flow

- [ ] **Step 1: Run unit tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

Open `http://localhost:5173`. You should see the LoginPage.

- [ ] **Step 3: Test login flow**

- Enter `https://solidcommunity.net`
- Click "Log in with Solid"
- Authenticate on solidcommunity.net
- You should return to the app, see the NoteList page with your WebID in the header

- [ ] **Step 4: Test note CRUD**

- Click "+ New Note", enter a title and some Markdown, click Save
- Note card appears in the grid
- Open the note, verify Markdown renders
- Click Edit, change the content, Save
- Click Delete on a note

- [ ] **Step 5: Test public sharing**

- Open a note → "Make Public & Share"
- Copy the URL → open it in a private/incognito window
- The note should render without any login prompt

- [ ] **Step 6: Commit smoke test results**

```bash
git add -A
git commit -m "chore: verify Phase 1 smoke test passes"
```

---

## Task 13: Documentation

**Files:**
- Create: `docs/explanation.md`
- Create: `docs/deploy.md`
- Create: `README.md`

- [ ] **Step 1: Create `docs/explanation.md`** — write this content exactly:

```markdown
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
```

- [ ] **Step 2: Create `docs/deploy.md`** — write this content exactly:

```markdown
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

**Important:** If users navigate directly to a URL like `https://your-app.netlify.app/?view=...`, Netlify needs to serve `index.html` for all routes. Add a `public/_redirects` file:
```
/* /index.html 200
```

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

**Note:** GitHub Pages doesn't support the `?view=` query param redirect without extra configuration, so Netlify or Vercel are easier.

---

## After Deployment

Update the OIDC redirect URL: when our app calls `login()`, it passes `window.location.href` as the `redirectUrl`. This means it automatically uses wherever the app is hosted — no config change needed.

The only thing to be aware of: solidcommunity.net and other Pod providers may need the app's origin to be registered. For public providers like solidcommunity.net this is not required.

---

## Environment: None Needed

This app has zero secrets and no backend. It's a pure static site. You do NOT need environment variables, API keys, or a server.
```

- [ ] **Step 3: Create `README.md`** — write this content:

```markdown
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
  auth/        — login, session, WebID helpers
  pod/         — read, write, list, delete, ACL helpers
  components/  — UI components
  App.jsx      — routing and layout
docs/
  explanation.md  — Solid protocol explained for newcomers
  deploy.md       — deployment instructions
```

## License

MIT
```

- [ ] **Step 4: Commit docs**

```bash
git add README.md docs/explanation.md docs/deploy.md
git commit -m "docs: add README, Solid explanation guide, and deployment guide"
```

---

## Task 14: Final Cleanup & Tag

- [ ] **Step 1: Run all tests one final time**

```bash
npm test
```

Expected: all pass.

- [ ] **Step 2: Build and verify no build errors**

```bash
npm run build
```

Expected: `dist/` created with no errors.

- [ ] **Step 3: Tag the Phase 1 release**

```bash
git tag v0.1.0-phase1
```

- [ ] **Step 4: Final commit if any loose files**

```bash
git status
# commit anything unstaged
```

---

## Known Gotchas

1. **CORS on Pod servers**: solidcommunity.net sends correct CORS headers. If you use a different Pod provider that doesn't, Pod reads will fail in the browser.

2. **`createContainerAt` errors**: If the `/research-notes/` container already exists, `createContainerAt` throws. The code catches and ignores this — don't remove that catch block.

3. **Note title = filename**: The note title is converted to a slug and used as the filename. Changing a note's title would require deleting and re-creating the file. That's why the editor disables the title field on edit.

4. **ACL support varies**: Not all Pod providers support WAC (Web Access Control) ACLs. solidcommunity.net does. If `universalAccess.setPublicAccess` throws, it may mean the provider uses ACP instead. Phase 1 targets solidcommunity.net only.

5. **Session persistence**: `restorePreviousSession: true` in `handleIncomingRedirect` means users don't have to log in again on every page refresh. If it stops working, check that cookies/localStorage aren't being blocked.
