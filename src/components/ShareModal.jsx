import React, { useState } from 'react'

export default function ShareModal({ shareUrl, onClose }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h2 className="font-semibold text-slate-800 mb-2">Note is now public</h2>
        <p className="text-sm text-slate-500 mb-4">
          Anyone with this link can read the note without logging in.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="mt-4 text-right">
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
