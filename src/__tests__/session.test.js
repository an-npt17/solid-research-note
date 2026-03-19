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
