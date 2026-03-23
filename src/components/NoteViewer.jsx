import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { makeNotePublic, revokeNotePublic, getShareableUrl } from '../pod/acl.js'
import ShareModal from './ShareModal.jsx'

export default function NoteViewer({ noteUrl, title, content, onClose, onEdit }) {
  const [shareUrl, setShareUrl] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [aclError, setAclError] = useState(null)

  async function handleMakePublic() {
    setSharing(true)
    setAclError(null)
    try {
      await makeNotePublic(noteUrl)
      setShareUrl(getShareableUrl(noteUrl))
    } catch (err) {
      setAclError(err.message)
    } finally {
      setSharing(false)
    }
  }

  async function handleRevoke() {
    setRevoking(true)
    setAclError(null)
    try {
      await revokeNotePublic(noteUrl)
      setShareUrl(null)
    } catch (err) {
      setAclError(err.message)
    } finally {
      setRevoking(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <h2 className="font-semibold text-slate-800 truncate pr-4">{title}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-xl leading-none flex-shrink-0"
            >
              ×
            </button>
          </div>

          {/* Markdown body */}
          <div className="px-6 py-4 overflow-y-auto flex-1 prose prose-slate max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
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
            {!shareUrl ? (
              <button
                onClick={handleMakePublic}
                disabled={sharing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
              >
                {sharing ? 'Making public…' : 'Make Public & Share'}
              </button>
            ) : (
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
              >
                {revoking ? 'Revoking…' : 'Revoke Public Access'}
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
