import React, { useEffect, useState } from 'react'
import { useAuth } from './auth/AuthContext.jsx'
import LoginPage from './components/LoginPage.jsx'
import Layout from './components/Layout.jsx'
import NoteList from './components/NoteList.jsx'
import ReactMarkdown from 'react-markdown'

function PublicNoteViewer({ noteUrl }) {
  const [content, setContent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch the note directly — no auth needed because it's public
    fetch(noteUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} — note may not be public`)
        return r.text()
      })
      .then(setContent)
      .catch((e) => setError(e.message))
  }, [noteUrl])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            Could not load note: {error}
          </div>
        )}
        {content && (
          <div className="bg-white rounded-2xl shadow p-8 prose prose-slate max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
        {!content && !error && (
          <p className="text-slate-400 text-sm">Loading…</p>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const { loading, loggedIn } = useAuth()

  // Check for ?view= query param (public note viewer)
  const params = new URLSearchParams(window.location.search)
  const viewUrl = params.get('view')

  if (viewUrl) {
    return <PublicNoteViewer noteUrl={viewUrl} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
        Loading session…
      </div>
    )
  }

  if (!loggedIn) {
    return <LoginPage />
  }

  return (
    <Layout>
      <NoteList />
    </Layout>
  )
}
