import {
  getFileWithAcl,
  getResourceAcl,
  hasResourceAcl,
  createAcl,
  saveAclFor,
} from '@inrupt/solid-client/acl/acl'
import { setPublicResourceAccess, getPublicResourceAccess } from '@inrupt/solid-client/acl/class'
import { setAgentResourceAccess } from '@inrupt/solid-client/acl/agent'
import { getDefaultSession } from '@inrupt/solid-client-authn-browser'

function getSessionFetch() {
  return getDefaultSession().fetch
}

/**
 * Resolve the ACL to modify for a resource.
 * If a resource ACL already exists, return it directly.
 * Otherwise, create a fresh ACL with the owner having full access.
 * We avoid createAclFromFallbackAcl because it copies acl:default from the
 * container ACL — servers reject that predicate on file resource ACLs (403).
 */
function resolveAcl(fileWithAcl) {
  if (hasResourceAcl(fileWithAcl)) {
    return getResourceAcl(fileWithAcl)
  }
  const webId = getDefaultSession().info.webId
  const blank = createAcl(fileWithAcl)
  return setAgentResourceAccess(blank, webId, {
    read: true, write: true, append: true, control: true,
  })
}

/**
 * Check whether a note currently has public (unauthenticated) read access.
 * Returns false if no ACL is found or an error occurs.
 */
export async function getNotePublicStatus(noteUrl) {
  const fetch = getSessionFetch()
  try {
    const fileWithAcl = await getFileWithAcl(noteUrl, { fetch })
    if (!hasResourceAcl(fileWithAcl) && !hasFallbackAcl(fileWithAcl)) return false
    const acl = resolveAcl(fileWithAcl)
    const publicAccess = getPublicResourceAccess(acl)
    return publicAccess?.read === true
  } catch {
    return false
  }
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
 * Build a shareable viewer URL by embedding the note URL as a viewer?url= query param.
 */
export function getShareableUrl(noteUrl) {
  const appUrl = new URL(window.location.href)
  appUrl.search = ''
  appUrl.pathname = appUrl.pathname.replace(/\/?$/, '/') + 'viewer'
  return appUrl.toString() + '?url=' + noteUrl
}
