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
