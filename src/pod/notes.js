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
