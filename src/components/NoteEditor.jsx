import React, { useState } from 'react'

export default function NoteEditor({ initial, onSave, onCancel }) {
  // initial: { title, content } for edits, or null for new notes
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [isPublic, setIsPublic] = useState(true)
  const [saving, setSaving] = useState(false)
  const isEdit = !!initial

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(title, content, isPublic)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">
            {isEdit ? 'Edit Note' : 'New Note'}
          </h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isEdit}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              placeholder="My Research Note"
              required
            />
            {isEdit && (
              <p className="text-xs text-slate-400 mt-1">
                Title cannot be changed (it is the filename on your Pod).
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Content (Markdown)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={'# Introduction\n\nWrite your notes here...\n\nLink to another note with [[Note Title]]'}
            />
            <p className="text-xs text-slate-400 mt-1">
              Use <code className="bg-slate-100 px-1 rounded">[[Note Title]]</code> to link between notes.
            </p>
          </div>
          {!isEdit && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Visibility</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="accent-emerald-600"
                />
                <span className="text-sm text-slate-600">Public</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="accent-slate-500"
                />
                <span className="text-sm text-slate-600">Private</span>
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
