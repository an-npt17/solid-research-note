import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { listNotes, getNote, saveNote, deleteNote } from '../pod/notes.js'
import NoteEditor from './NoteEditor.jsx'
import NoteViewer from './NoteViewer.jsx'

export default function NoteList() {
  const { webId } = useAuth()
  const [notes, setNotes] = useState([])        // [{ url, name }]
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // null | 'create' | { url, name, content } (for view/edit)
  const [active, setActive] = useState(null)
  const [editContent, setEditContent] = useState(null)

  const loadNotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setNotes(await listNotes(webId))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [webId])

  useEffect(() => { loadNotes() }, [loadNotes])

  async function handleOpenNote(note) {
    const content = await getNote(note.url)
    setActive({ ...note, content })
    setEditContent(null)
  }

  async function handleSave(title, content) {
    await saveNote(webId, title, content)
    setActive(null)
    setEditContent(null)
    await loadNotes()
  }

  async function handleDelete(noteUrl) {
    if (!confirm('Delete this note?')) return
    await deleteNote(noteUrl)
    setActive(null)
    await loadNotes()
  }

  function handleEditFromViewer() {
    setEditContent({ title: active.name, content: active.content })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">My Notes</h2>
        <button
          onClick={() => setActive('create')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
        >
          + New Note
        </button>
      </div>

      {loading && (
        <p className="text-slate-400 text-sm">Loading notes from your Pod…</p>
      )}
      {error && <p className="text-red-500 text-sm">Error: {error}</p>}

      {!loading && !error && notes.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">📝</p>
          <p>No notes yet. Create your first one!</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <div
            key={note.url}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition cursor-pointer group"
          >
            <div
              className="font-medium text-slate-800 mb-3 truncate"
              onClick={() => handleOpenNote(note)}
            >
              {note.name}
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => handleOpenNote(note)}
                className="text-xs px-3 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              >
                Open
              </button>
              <button
                onClick={() => handleDelete(note.url)}
                className="text-xs px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New note editor */}
      {active === 'create' && (
        <NoteEditor
          initial={null}
          onSave={handleSave}
          onCancel={() => setActive(null)}
        />
      )}

      {/* Edit existing note */}
      {editContent && active && active !== 'create' && (
        <NoteEditor
          initial={editContent}
          onSave={handleSave}
          onCancel={() => setEditContent(null)}
        />
      )}

      {/* View note */}
      {active && active !== 'create' && !editContent && (
        <NoteViewer
          noteUrl={active.url}
          title={active.name}
          content={active.content}
          onClose={() => setActive(null)}
          onEdit={handleEditFromViewer}
        />
      )}
    </>
  )
}
