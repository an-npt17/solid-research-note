import {
  getFileWithAcl,
  getResourceAcl,
  hasResourceAcl,
  hasFallbackAcl,
  createAclFromFallbackAcl,
  saveAclFor,
} from '@inrupt/solid-client/acl/acl'
import { setPublicResourceAccess } from '@inrupt/solid-client/acl/class'
import { getDefaultSession } from '@inrupt/solid-client-authn-browser'

function getSessionFetch() {
  return getDefaultSession().fetch
}

/**
 * Resolve the ACL to modify for a resource.
 * New files have no resource ACL yet — they only inherit from the container.
 * In that case, createAclFromFallbackAcl clones the inherited ACL into a
 * resource-specific one that we can then save.
 */
function resolveAcl(fileWithAcl) {
  if (hasResourceAcl(fileWithAcl)) {
    return getResourceAcl(fileWithAcl)
  }
  if (hasFallbackAcl(fileWithAcl)) {
    return createAclFromFallbackAcl(fileWithAcl)
  }
  throw new Error(
    'No ACL found for this resource. Make sure your Pod supports WAC ' +
    '(Web Access Control) and that you have Control access.'
  )
}

/**
 * Grant public (unauthenticated) read access to a note via WAC ACL.
 * Returns the note URL so callers can build shareable links.
 */
export async function makeNotePublic(noteUrl) {
  const fetch = getSessionFetch()
  const fileWithAcl = await getFileWithAcl(noteUrl, { fetch })
  const updatedAcl = setPublicResourceAccess(resolveAcl(fileWithAcl), { read: true })
  await saveAclFor(fileWithAcl, updatedAcl, { fetch })
  return noteUrl
}

/**
 * Revoke public read access from a note.
 */
export async function revokeNotePublic(noteUrl) {
  const fetch = getSessionFetch()
  const fileWithAcl = await getFileWithAcl(noteUrl, { fetch })
  const updatedAcl = setPublicResourceAccess(resolveAcl(fileWithAcl), { read: false })
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
