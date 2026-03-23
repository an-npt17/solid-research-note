import { describe, it, expect, vi } from 'vitest'
import { getContainerUrl, slugify } from '../pod/notes.js'

// Mock subpath imports used by notes.js
vi.mock('@inrupt/solid-client/resource/solidDataset', () => ({
  getSolidDataset: vi.fn(async () => ({})),
  getContainedResourceUrlAll: vi.fn(() => []),
  createContainerAt: vi.fn(async () => {}),
}))
vi.mock('@inrupt/solid-client/resource/file', () => ({
  getFile: vi.fn(async () => new Blob([''])),
  overwriteFile: vi.fn(async () => {}),
  deleteFile: vi.fn(async () => {}),
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
    const { getContainedResourceUrlAll } = await import('@inrupt/solid-client/resource/solidDataset')
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
