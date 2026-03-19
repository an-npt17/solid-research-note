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
