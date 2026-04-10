import { useState, useEffect } from 'react'
import { X, Key, CheckCircle, AlertTriangle, Trash2, ChevronDown, ChevronRight, Shield, ExternalLink } from 'lucide-react'
import { getApiKey, setApiKey, clearApiKey } from './claude-api'

type Props = { onClose: () => void }

export default function SettingsModal({ onClose }: Props) {
  const [keyInput, setKeyInput]         = useState('')
  const [saved, setSaved]               = useState(false)
  const [hasKey, setHasKey]             = useState(false)
  const [showWalkthrough, setShowWalkthrough] = useState(false)

  useEffect(() => {
    const key = getApiKey()
    setHasKey(!!key)
    // Auto-open walkthrough if no key is set yet
    if (!key) setShowWalkthrough(true)
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
      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl"
        style={{ width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '24px 24px 20px' }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <Key size={18} className="text-purple-400" /> Settings
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          {/* Security badge — prominent, above input */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: '#0f2a1a', border: '1px solid #166534',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          }}>
            <Shield size={15} style={{ color: '#4ade80', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: '#86efac', lineHeight: 1.6 }}>
              <strong>Your key stays in your browser.</strong> It is stored only in this
              device's local storage, sent directly to Anthropic's servers when you use
              an AI feature, and <strong>never transmitted to or logged by this app.</strong>
            </div>
          </div>

          {/* API Key section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600 }}>
              Claude API Key
            </label>

            {/* Current key status */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
              padding: '8px 12px', borderRadius: 6,
              background: hasKey ? '#052e16' : '#1e293b',
              border: `1px solid ${hasKey ? '#166534' : '#334155'}`,
              color: hasKey ? '#4ade80' : '#64748b',
            }}>
              {hasKey
                ? <><CheckCircle size={14} /> API key is saved — AI features are enabled</>
                : <><AlertTriangle size={14} /> No API key — AI features are disabled</>
              }
            </div>

            {/* Input */}
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="sk-ant-api03-..."
              style={{
                background: '#0f172a', color: '#e2e8f0', fontSize: 13,
                borderRadius: 6, padding: '8px 12px',
                border: '1px solid #334155', outline: 'none',
                fontFamily: 'monospace', width: '100%', boxSizing: 'border-box' as const,
              }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={save}
                disabled={!keyInput.trim()}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: saved ? '#065f46' : '#7c3aed',
                  border: 'none', borderRadius: 6, color: '#fff',
                  fontSize: 13, fontWeight: 600, padding: '8px 0', cursor: 'pointer',
                  opacity: !keyInput.trim() ? 0.4 : 1, transition: 'background 0.15s',
                }}
              >
                {saved ? <><CheckCircle size={14} /> Saved!</> : <><Key size={14} /> Save Key</>}
              </button>
              {hasKey && (
                <button
                  onClick={remove}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(127,29,29,0.4)', border: '1px solid #7f1d1d',
                    borderRadius: 6, color: '#fca5a5', fontSize: 13,
                    fontWeight: 600, padding: '8px 12px', cursor: 'pointer',
                  }}
                  title="Remove saved key"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Walkthrough — collapsible */}
          <div style={{ marginTop: 16, border: '1px solid #1e293b', borderRadius: 8, overflow: 'hidden' }}>
            <button
              onClick={() => setShowWalkthrough(v => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: '#0f172a', border: 'none', cursor: 'pointer',
                color: '#94a3b8', fontSize: 13, fontWeight: 600,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {showWalkthrough ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                How to get a free API key
              </span>
              <span style={{ fontSize: 11, color: '#475569', fontWeight: 400 }}>~2 minutes</span>
            </button>

            {showWalkthrough && (
              <div style={{ padding: '4px 14px 14px', background: '#060912' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>

                  {([
                    ['1', '#7c3aed', 'Go to console.anthropic.com', 'Click "Sign up" — it\'s free to create an account.'],
                    ['2', '#0369a1', 'Open the API Keys page', 'In the left sidebar, click "API Keys".'],
                    ['3', '#065f46', 'Create a new key', 'Click "Create Key", give it any name (e.g. "DM Toolkit"), then click "Create".'],
                    ['4', '#b45309', 'Copy the key', 'It starts with sk-ant-api03-… Copy it now — it\'s only shown once.'],
                    ['5', '#be185d', 'Add a small credit', 'Go to "Billing" and add $5. This covers hundreds of stat block generations.'],
                    ['6', '#166534', 'Paste it above', 'Paste the key into the field above and click Save Key.'],
                  ] as [string, string, string, string][]).map(([num, color, title, desc]) => (
                    <div key={num} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%', background: color,
                        color: '#fff', fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>{num}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 2 }}>{title}</div>
                        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{desc}</div>
                      </div>
                    </div>
                  ))}

                  <a
                    href="https://console.anthropic.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
                      color: '#94a3b8', fontSize: 12, fontWeight: 600, padding: '7px 0',
                      textDecoration: 'none', marginTop: 4,
                    }}
                  >
                    <ExternalLink size={12} /> Open console.anthropic.com
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
