import { getSolidDataset } from '@inrupt/solid-client/resource/solidDataset'
import { overwriteFile, deleteFile } from '@inrupt/solid-client/resource/file'
import { getThing } from '@inrupt/solid-client/thing/thing'
import { getStringNoLocale, getUrlAll } from '@inrupt/solid-client/thing/get'
import { getDefaultSession } from '@inrupt/solid-client-authn-browser'

const DC_TITLE    = 'http://purl.org/dc/terms/title'
const DC_CREATED  = 'http://purl.org/dc/terms/created'
const DC_MODIFIED = 'http://purl.org/dc/terms/modified'
const SCHEMA_MENTIONS = 'https://schema.org/mentions'

/** notes/my-note.md → notes/my-note.ttl */
export function getTtlUrl(noteUrl) {
  return noteUrl.replace(/\.md$/, '.ttl')
}

/** Extract [[Title]] wiki-link titles from Markdown content (deduped). */
export function parseMentions(content) {
  const matches = [...content.matchAll(/\[\[([^\]]+)\]\]/g)]
  return [...new Set(matches.map((m) => m[1].trim()))]
}

/** Escape a string value for inline Turtle (handles quotes and backslashes). */
function turtleString(str) {
  return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"'
}

/**
 * Write (or overwrite) the .ttl sidecar for a note.
 * @param {string} noteUrl  - absolute URL of the .md file
 * @param {{ title: string, mentionUrls: string[], created?: string }} opts
 */
export async function writeTurtleSidecar(noteUrl, { title, mentionUrls = [], created }) {
  const { fetch } = getDefaultSession()
  const ttlUrl = getTtlUrl(noteUrl)
  const now = new Date().toISOString()
  const createdVal = created ?? now

  const mentionTriples = mentionUrls.map(
    (url, i) => `  schema:mentions <${url}>${i < mentionUrls.length - 1 ? ' ;' : ' .'}`
  )
  const hasMore = mentionTriples.length > 0

  const turtle = [
    '@prefix dc: <http://purl.org/dc/terms/> .',
    '@prefix schema: <https://schema.org/> .',
    '',
    `<${noteUrl}>`,
    `  dc:title ${turtleString(title)} ;`,
    `  dc:created ${turtleString(createdVal)} ;`,
    `  dc:modified ${turtleString(now)}${hasMore ? ' ;' : ' .'}`,
    ...mentionTriples,
  ].join('\n')

  await overwriteFile(ttlUrl, new Blob([turtle], { type: 'text/turtle' }), {
    contentType: 'text/turtle',
    fetch,
  })
}

/**
 * Read sidecar metadata for a note.
 * Returns null if the sidecar doesn't exist yet.
 */
export async function readTurtleSidecar(noteUrl) {
  const { fetch } = getDefaultSession()
  const ttlUrl = getTtlUrl(noteUrl)
  try {
    const dataset = await getSolidDataset(ttlUrl, { fetch })
    const thing = getThing(dataset, noteUrl)
    if (!thing) return null
    return {
      title:       getStringNoLocale(thing, DC_TITLE),
      created:     getStringNoLocale(thing, DC_CREATED),
      modified:    getStringNoLocale(thing, DC_MODIFIED),
      mentionUrls: getUrlAll(thing, SCHEMA_MENTIONS),
    }
  } catch {
    return null
  }
}

/** Delete the .ttl sidecar (silently ignores 404). */
export async function deleteTtlSidecar(noteUrl) {
  const { fetch } = getDefaultSession()
  try {
    await deleteFile(getTtlUrl(noteUrl), { fetch })
  } catch {
    // sidecar may not exist — ignore
  }
}

/**
 * Find all notes from noteList whose sidecar mentions noteUrl.
 * Makes one request per note in parallel.
 * @param {{ url: string, name: string }[]} noteList
 * @param {string} noteUrl
 * @returns {Promise<{ url: string, name: string }[]>}
 */
export async function findBacklinks(noteList, noteUrl) {
  const { fetch } = getDefaultSession()
  const results = await Promise.all(
    noteList.map(async (note) => {
      if (note.url === noteUrl) return null
      try {
        const dataset = await getSolidDataset(getTtlUrl(note.url), { fetch })
        const thing = getThing(dataset, note.url)
        if (!thing) return null
        const mentions = getUrlAll(thing, SCHEMA_MENTIONS)
        return mentions.includes(noteUrl) ? note : null
      } catch {
        return null
      }
    })
  )
  return results.filter(Boolean)
}
