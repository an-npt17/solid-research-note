import React, { useState } from 'react'
import { loginWithProvider } from '../auth/session.js'

const PROVIDERS = [
  { label: 'solidcommunity.net (free, public)', url: 'https://solidcommunity.net' },
  { label: 'Local demo server (docker compose)', url: 'http://localhost:3000' },
  { label: 'inrupt.net', url: 'https://inrupt.net' },
]

/**
 * OIDC issuer must be the server root, not a Pod URL.
 * e.g. "http://localhost:3000/alice/" → "http://localhost:3000"
 */
function toIssuerRoot(raw) {
  try {
    const u = new URL(raw.trim())
    return `${u.protocol}//${u.host}`
  } catch {
    return raw.trim()
  }
}

export default function LoginPage() {
  const [provider, setProvider] = useState(PROVIDERS[0].url)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const issuer = toIssuerRoot(provider)
    try {
      await loginWithProvider(issuer)
      // Browser will redirect — no need to setLoading(false)
    } catch (err) {
      setError(`Could not reach provider: ${err.message}`)
      setLoading(false)
    }
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
              Identity Provider{' '}
              <span className="font-normal text-slate-400">(server root, not your Pod URL)</span>
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
            {provider && toIssuerRoot(provider) !== provider.trim() && (
              <p className="mt-1 text-xs text-amber-600">
                Will use server root: <strong>{toIssuerRoot(provider)}</strong>
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

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
