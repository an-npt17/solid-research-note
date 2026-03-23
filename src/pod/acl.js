import {
  getFileWithAcl,
  getResourceAcl,
  saveAclFor,
} from '@inrupt/solid-client/acl/acl'
import { setPublicResourceAccess } from '@inrupt/solid-client/acl/class'
import { getDefaultSession } from '@inrupt/solid-client-authn-browser'

function getSessionFetch() {
  return getDefaultSession().fetch
}

/**
 * Grant public (unauthenticated) read access to a note via WAC ACL.
 * Returns the note URL so callers can build shareable links.
 */
export async function makeNotePublic(noteUrl) {
  const fetch = getSessionFetch()
  const fileWithAcl = await getFileWithAcl(noteUrl, { fetch })
  const resourceAcl = getResourceAcl(fileWithAcl)
  if (!resourceAcl) {
    throw new Error(`No resource ACL found for ${noteUrl}. Ensure the Pod supports WAC.`)
  }
  const updatedAcl = setPublicResourceAccess(resourceAcl, { read: true })
  await saveAclFor(fileWithAcl, updatedAcl, { fetch })
  return noteUrl
}

/**
 * Revoke public read access from a note.
 */
export async function revokeNotePublic(noteUrl) {
  const fetch = getSessionFetch()
  const fileWithAcl = await getFileWithAcl(noteUrl, { fetch })
  const resourceAcl = getResourceAcl(fileWithAcl)
  if (!resourceAcl) {
    throw new Error(`No resource ACL found for ${noteUrl}. Ensure the Pod supports WAC.`)
  }
  const updatedAcl = setPublicResourceAccess(resourceAcl, { read: false })
  await saveAclFor(fileWithAcl, updatedAcl, { fetch })
}

/**
 * Build a shareable viewer URL by embedding the note URL as a ?view= query param.
 */
export function getShareableUrl(noteUrl) {
  const appUrl = new URL(window.location.href)
  appUrl.search = ''
  appUrl.searchParams.set('view', noteUrl)
  return appUrl.toString()
}
