import React, { useState } from 'react'
import { loginWithProvider } from '../auth/session.js'

const PROVIDERS = [
  { label: 'solidcommunity.net (free, public)', url: 'https://solidcommunity.net' },
  { label: 'Local demo server (docker compose)', url: 'http://localhost:3000' },
  { label: 'inrupt.net', url: 'https://inrupt.net' },
]

export default function LoginPage() {
  const [provider, setProvider] = useState(PROVIDERS[0].url)
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
          . New to Solid?{' '}
          <a
            href="https://solidcommunity.net/register"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 underline"
          >
            Register at solidcommunity.net
          </a>{' '}
          or run the local demo server below.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pod Provider
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => setProvider(p.url)}
                  className={`text-xs px-2 py-1 rounded-full border transition ${
                    provider === p.url
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'text-slate-600 border-slate-300 hover:border-indigo-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
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
