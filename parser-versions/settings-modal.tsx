import { useState, useEffect } from 'react'
import { X, Key, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react'
import { getApiKey, setApiKey, clearApiKey } from './claude-api'

type Props = { onClose: () => void }

export default function SettingsModal({ onClose }: Props) {
  const [keyInput, setKeyInput]   = useState('')
  const [saved, setSaved]         = useState(false)
  const [hasKey, setHasKey]       = useState(false)

  useEffect(() => {
    setHasKey(!!getApiKey())
  }, [])

  const save = () => {
    if (!keyInput.trim()) return
    setApiKey(keyInput.trim())
    setKeyInput('')
    setHasKey(true)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const remove = () => {
    clearApiKey()
    setHasKey(false)
    setKeyInput('')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Key size={18} className="text-purple-400" /> Settings
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* API Key section */}
        <div className="space-y-3">
          <label className="block text-slate-300 text-sm font-semibold">
            Claude API Key
          </label>

          {/* Current key status */}
          <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded ${
            hasKey
              ? 'bg-green-900/30 border border-green-600/40 text-green-300'
              : 'bg-slate-700/50 border border-slate-600 text-slate-400'
          }`}>
            {hasKey
              ? <><CheckCircle size={14} /> API key is saved</>
              : <><AlertTriangle size={14} /> No API key configured</>
            }
          </div>

          {/* Input */}
          <input
            type="password"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="sk-ant-api03-..."
            className="w-full bg-slate-700 text-white text-sm rounded px-3 py-2 border border-slate-500 focus:border-purple-400 focus:outline-none font-mono"
          />

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={!keyInput.trim()}
              className="flex-1 flex items-center justify-center gap-1 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-sm font-semibold py-2 rounded transition"
            >
              {saved ? <><CheckCircle size={14} /> Saved!</> : <><Key size={14} /> Save Key</>}
            </button>
            {hasKey && (
              <button
                onClick={remove}
                className="flex items-center gap-1 bg-red-900/50 hover:bg-red-800 text-red-300 text-sm font-semibold px-3 py-2 rounded transition"
                title="Remove saved key"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <p className="text-slate-500 text-xs leading-relaxed">
            Your key is stored only in this browser's local storage and sent directly to Anthropic. It is never shared or logged.
            Get a key at <span className="text-slate-400">console.anthropic.com</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
