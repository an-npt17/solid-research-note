import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { makeNotePublic, revokeNotePublic, getShareableUrl, getNotePublicStatus } from '../pod/acl.js'
import { findBacklinks } from '../pod/rdf.js'
import ShareModal from './ShareModal.jsx'

/** Replace [[Title]] with a markdown link that we intercept via a custom <a> component */
function processWikiLinks(text) {
  return text.replace(/\[\[([^\]]+)\]\]/g, (_, t) => `[${t}](#wiki:${encodeURIComponent(t)})`)
}

export default function NoteViewer({ noteUrl, title, content, onClose, onEdit, notes = [], onOpenNoteByName }) {
  // null = checking, true = public, false = private
  const [isPublic, setIsPublic] = useState(null)
  const [shareUrl, setShareUrl] = useState(null)
  const [busy, setBusy] = useState(false)
  const [aclError, setAclError] = useState(null)

  const [backlinks, setBacklinks] = useState(null) // null = loading
  const [copiedLink, setCopiedLink] = useState(false)

  // Check actual ACL status every time a note is opened
  useEffect(() => {
    setIsPublic(null)
    setShareUrl(null)
    setAclError(null)
    setBacklinks(null)
    setCopiedLink(false)
    getNotePublicStatus(noteUrl).then(setIsPublic)
    findBacklinks(notes, noteUrl).then(setBacklinks)
  }, [noteUrl])

  async function handleMakePublic() {
    setBusy(true)
    setAclError(null)
    try {
      await makeNotePublic(noteUrl)
      setIsPublic(true)
      setShareUrl(getShareableUrl(noteUrl))
    } catch (err) {
      setAclError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleRevoke() {
    setBusy(true)
    setAclError(null)
    try {
      await revokeNotePublic(noteUrl)
      setIsPublic(false)
      setShareUrl(null)
    } catch (err) {
      setAclError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="font-semibold text-slate-800 truncate">{title}</h2>
              {isPublic === true && (
                <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  Public
                </span>
              )}
              {isPublic === false && (
                <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-full">
                  Private
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-xl leading-none flex-shrink-0 ml-4"
            >
              ×
            </button>
          </div>

          {/* Markdown body */}
          <div className="px-6 py-4 overflow-y-auto flex-1 prose prose-slate max-w-none">
            <ReactMarkdown
              components={{
                a({ href, children }) {
                  if (href?.startsWith('#wiki:')) {
                    const linkTitle = decodeURIComponent(href.slice(6))
                    const exists = notes.some(
                      (n) => n.name.toLowerCase() === linkTitle.toLowerCase()
                    )
                    return (
                      <button
                        onClick={() => onOpenNoteByName?.(linkTitle)}
                        className={`inline font-medium underline decoration-dotted ${
                          exists
                            ? 'text-indigo-600 hover:text-indigo-800'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title={exists ? `Open: ${linkTitle}` : `Note not found: ${linkTitle}`}
                      >
                        {children}
                      </button>
                    )
                  }
                  return <a href={href} target="_blank" rel="noreferrer">{children}</a>
                },
              }}
            >
              {processWikiLinks(content)}
            </ReactMarkdown>

            {/* Backlinks panel */}
            <div className="mt-8 pt-4 border-t border-slate-100 not-prose">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Linked from
              </p>
              {backlinks === null && (
                <p className="text-xs text-slate-400">Loading backlinks…</p>
              )}
              {backlinks !== null && backlinks.length === 0 && (
                <p className="text-xs text-slate-400">No notes link here yet.</p>
              )}
              {backlinks !== null && backlinks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {backlinks.map((note) => (
                    <button
                      key={note.url}
                      onClick={() => onOpenNoteByName?.(note.name)}
                      className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md"
                    >
                      {note.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ACL error */}
          {aclError && (
            <div className="px-6 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
              Share failed: {aclError}
            </div>
          )}

          {/* Actions */}
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
            <button
              onClick={onEdit}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Edit
            </button>

            {isPublic === null ? (
              <span className="px-4 py-2 text-sm text-slate-400">Checking access…</span>
            ) : isPublic ? (
              <>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getShareableUrl(noteUrl))
                    setCopiedLink(true)
                    setTimeout(() => setCopiedLink(false), 2000)
                  }}
                  className="px-4 py-2 text-sm text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-50"
                >
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={busy}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
                >
                  {busy ? 'Revoking…' : 'Make Private'}
                </button>
              </>
            ) : (
              <button
                onClick={handleMakePublic}
                disabled={busy}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
              >
                {busy ? 'Making public…' : 'Make Public & Share'}
              </button>
            )}
          </div>
        </div>
      </div>

      {shareUrl && (
        <ShareModal shareUrl={shareUrl} onClose={() => setShareUrl(null)} />
      )}
    </>
  )
}
