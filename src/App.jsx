import React, { useEffect, useState, Component } from 'react'
import { useAuth } from './auth/AuthContext.jsx'
import LoginPage from './components/LoginPage.jsx'
import Layout from './components/Layout.jsx'
import NoteList from './components/NoteList.jsx'
import ReactMarkdown from 'react-markdown'

// Catches any React render error and shows it instead of a blank page
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
          <h2 style={{ color: 'red' }}>App crashed</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#333' }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

function PublicNoteViewer({ noteUrl }) {
  const [content, setContent] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
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
          <p className="text-slate-500 text-sm">Loading…</p>
        )}
      </div>
    </div>
  )
}

function AppInner() {
  const auth = useAuth()

  // useAuth() returns null if called outside AuthProvider — catch it early
  if (!auth) {
    return (
      <div style={{ padding: '2rem', color: 'red', fontFamily: 'monospace' }}>
        Error: AuthContext not found. Check that AuthProvider wraps the app in main.jsx.
      </div>
    )
  }

  const { loading, loggedIn } = auth

  // Check for ?view= query param (public note viewer, no auth needed)
  const params = new URLSearchParams(window.location.search)
  const viewUrl = params.get('view')

  if (viewUrl) {
    return <PublicNoteViewer noteUrl={viewUrl} />
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          color: '#475569',
          fontSize: '1rem',
          fontFamily: 'sans-serif',
        }}
      >
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

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  )
}
