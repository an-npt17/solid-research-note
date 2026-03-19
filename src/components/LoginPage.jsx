import React, { useState } from 'react'
import { loginWithProvider } from '../auth/session.js'

const DEFAULT_PROVIDER = 'https://solidcommunity.net'

export default function LoginPage() {
  const [provider, setProvider] = useState(DEFAULT_PROVIDER)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    await loginWithProvider(provider)
    // Browser will redirect — no need to setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Solid Research Notes
        </h1>
        <p className="text-slate-500 mb-6 text-sm">
          Log in with your{' '}
          <a
            href="https://solidproject.org/users/get-a-pod"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 underline"
          >
            Solid Pod
          </a>
          . New? Create a free account at{' '}
          <a
            href="https://solidcommunity.net/register"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 underline"
          >
            solidcommunity.net
          </a>
          .
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pod Provider URL
            </label>
            <input
              type="url"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://solidcommunity.net"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
          >
            {loading ? 'Redirecting…' : 'Log in with Solid'}
          </button>
        </form>
      </div>
    </div>
  )
}
