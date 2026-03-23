import {
  getDefaultSession,
  handleIncomingRedirect,
  login,
  logout,
} from '@inrupt/solid-client-authn-browser'

/**
 * Must be called once at app startup.
 * Silently completes the OIDC redirect if the user is returning from login.
 * restorePreviousSession: true means login survives page refresh.
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
    redirectUrl: window.location.origin + window.location.pathname,
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
  session.events.on('login', callback)
  session.events.on('logout', callback)
}
