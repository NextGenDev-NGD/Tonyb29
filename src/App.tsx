import { useState } from 'react'
import { Settings, HelpCircle, X } from 'lucide-react'
import StatBlockParser from '../parser-versions/dnd-parser-v20-stable'
import BatchProcessor from '../parser-versions/batch-processor'
import EncounterBuilder, { Encounter, EncounterCreature } from '../parser-versions/encounter-builder'
import CampaignBuilder from '../parser-versions/campaign-builder'
import MagicItemCreator from '../parser-versions/magic-item-creator'
import CelestialCalculator from '../parser-versions/celestial-calculator'
import CharacterOptions from '../parser-versions/character-options'
import SettingsModal from '../parser-versions/settings-modal'
import { hasApiKey } from '../parser-versions/claude-api'

// ── Themes ───────────────────────────────────────────────────────────────────
const THEMES = {
  A: {
    label: 'A — Purple',
    bg: '#0f172a',
    accent: '#7c3aed',
    accentDim: '#1e1b4b',
    accentText: '#c4b5fd',
    accentMid: '#a78bfa',
    parserColor: '#7c3aed',
  },
  B: {
    label: 'B — Teal',
    bg: '#080f1a',
    accent: '#0d9488',
    accentDim: '#042f2e',
    accentText: '#5eead4',
    accentMid: '#2dd4bf',
    parserColor: '#0d9488',
  },
  C: {
    label: 'C — Green',
    bg: '#0a0f0a',
    accent: '#16a34a',
    accentDim: '#052e16',
    accentText: '#86efac',
    accentMid: '#4ade80',
    parserColor: '#16a34a',
  },
  D: {
    label: 'D — Crimson',
    bg: '#0c0a0a',
    accent: '#dc2626',
    accentDim: '#2d0a0a',
    accentText: '#fca5a5',
    accentMid: '#f87171',
    parserColor: '#dc2626',
  },
} as const
type ThemeKey = keyof typeof THEMES

type Tab = 'parser' | 'batch' | 'encounter' | 'campaign' | 'items' | 'celestial' | 'playertools'

const TAB_META: Record<Tab, { desc: string; color: string }> = {
  parser:      { color: '#7c3aed', desc: 'Paste any D&D 5e stat block — get a Foundry-ready actor in seconds' },
  batch:       { color: '#0369a1', desc: 'Parse an entire bestiary at once, or generate monsters by name with AI' },
  encounter:   { color: '#b45309', desc: 'Build balanced encounters with live XP thresholds and difficulty ratings' },
  campaign:    { color: '#065f46', desc: 'Import a full world — continents, NPCs, and creatures — in five steps' },
  items:       { color: '#be185d', desc: 'Create magic weapons, armor, wondrous items, and consumables with Foundry JSON' },
  celestial:   { color: '#0e7490', desc: 'Track moon phases, conjunctions, and celestial events for any fantasy world' },
  playertools: { color: '#4338ca', desc: 'Create classes, subclasses, species, and backgrounds with Foundry-ready import macros' },
}

function uid() { return Math.random().toString(36).slice(2, 10) }

export default function App() {
  const [tab, setTab]         = useState<Tab>('parser')
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeySet, setApiKeySet]       = useState(hasApiKey())
  const [helpOpen, setHelpOpen]         = useState(false)

  // Theme — persisted in localStorage, default A
  const [themeKey, setThemeKey] = useState<ThemeKey>(
    () => (localStorage.getItem('dmvtt_theme') as ThemeKey) ?? 'A'
  )
  const theme = THEMES[themeKey]
  const selectTheme = (k: ThemeKey) => {
    localStorage.setItem('dmvtt_theme', k)
    setThemeKey(k)
  }

  // Ko-fi nudge — once per session after first tab switch
  const [kofiVisible, setKofiVisible]   = useState(false)
  const [hasNavigated, setHasNavigated] = useState(false)
  const [kofiDismissed, setKofiDismissed] = useState(
    () => sessionStorage.getItem('kofi_dismissed') === '1'
  )
  const switchTab = (t: Tab) => {
    setTab(t)
    if (!hasNavigated && !kofiDismissed) {
      setHasNavigated(true)
      setTimeout(() => setKofiVisible(true), 500)
    }
  }
  const dismissKofi = () => {
    sessionStorage.setItem('kofi_dismissed', '1')
    setKofiVisible(false)
    setKofiDismissed(true)
  }

  // Encounter state
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [sentToast, setSentToast]   = useState('')

  const sendToEncounter = (actor: any) => {
    setEncounters(prev => {
      let updated = [...prev]
      let target: Encounter
      if (updated.length === 0) {
        target = { id: uid(), name: 'Encounter 1', creatures: [] }
        updated = [target]
      } else {
        target = updated[updated.length - 1]
      }
      const idx = updated.findIndex(e => e.id === target.id)
      const existing = updated[idx].creatures.find(c => c.actor?.name === actor?.name)
      const creatures: EncounterCreature[] = existing
        ? updated[idx].creatures.map(c => c.id === existing.id ? { ...c, quantity: c.quantity + 1 } : c)
        : [...updated[idx].creatures, { id: uid(), actor, quantity: 1 }]
      updated = updated.map((e, i) => i === idx ? { ...e, creatures } : e)
      return updated
    })
    setSentToast(`${actor?.name ?? 'Creature'} added to encounter`)
    setTimeout(() => setSentToast(''), 3000)
  }

  const sendBatchToEncounter = (actors: any[]) => {
    if (!actors.length) return
    setEncounters(prev => {
      let updated = [...prev]
      let target: Encounter
      if (updated.length === 0) {
        target = { id: uid(), name: 'Encounter 1', creatures: [] }
        updated = [target]
      } else {
        target = updated[updated.length - 1]
      }
      const idx = updated.findIndex(e => e.id === target.id)
      let creatures: EncounterCreature[] = [...updated[idx].creatures]
      for (const actor of actors) {
        const existing = creatures.find(c => c.actor?.name === actor?.name)
        if (existing) {
          creatures = creatures.map(c => c.id === existing.id ? { ...c, quantity: c.quantity + 1 } : c)
        } else {
          creatures = [...creatures, { id: uid(), actor, quantity: 1 }]
        }
      }
      updated = updated.map((e, i) => i === idx ? { ...e, creatures } : e)
      return updated
    })
    setSentToast(`${actors.length} creature${actors.length !== 1 ? 's' : ''} added to encounter`)
    setTimeout(() => setSentToast(''), 3000)
  }

  const totalCombatants = encounters.reduce((s, e) => s + e.creatures.reduce((ss, c) => ss + c.quantity, 0), 0)

  // Tab button — parser tab uses theme accent, others use their own color
  const btn = (t: Tab, label: string) => {
    const color = t === 'parser' ? theme.parserColor : TAB_META[t].color
    const active = tab === t
    return (
      <button onClick={() => switchTab(t)} style={{
        padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
        background: active ? color : '#1e293b',
        color: active ? '#fff' : '#94a3b8',
        fontWeight: 600, fontSize: 13, position: 'relative' as const,
        boxShadow: active ? `0 0 12px ${color}66, 0 2px 0 ${color}` : 'none',
        transition: 'all 0.15s',
      }}>
        {label}
        {t === 'encounter' && totalCombatants > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6,
            background: '#ef4444', color: '#fff', borderRadius: 99,
            fontSize: 10, fontWeight: 700, padding: '1px 5px', lineHeight: 1.4,
          }}>{totalCombatants}</span>
        )}
      </button>
    )
  }

  const show = (t: Tab) => ({ display: tab === t ? '' : 'none' })
  const tabColor = tab === 'parser' ? theme.parserColor : TAB_META[tab].color
  const tabDesc  = TAB_META[tab].desc

  return (
    <div data-theme={themeKey} style={{ background: theme.bg, minHeight: '100vh' }}>

      {/* ── Site header ─────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(180deg, ${theme.accentDim}cc 0%, ${theme.bg} 100%)`,
        borderBottom: `1px solid ${theme.accent}55`,
        boxShadow: `0 2px 20px ${theme.accent}22, inset 0 1px 0 ${theme.accent}33`,
        padding: '12px 24px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {/* Branding */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 700,
            fontSize: 26,
            color: theme.accentText,
            letterSpacing: '1px',
            textShadow: `0 1px 0 ${theme.accent}88, 0 2px 6px rgba(0,0,0,0.7)`,
          }}>
            ⚔ DM VTT Toolkit
          </span>
          <span style={{ color: '#475569', fontSize: 12 }}>
            Prep less. Run more.
          </span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Help */}
          <button
            onClick={() => setHelpOpen(v => !v)}
            title="About this tool"
            style={{
              background: 'none', border: `1px solid ${theme.accent}44`, borderRadius: 6,
              padding: '5px 8px', cursor: 'pointer',
              color: helpOpen ? theme.accentText : '#475569',
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
            }}
          >
            <HelpCircle size={14} />
          </button>
          {/* About */}
          <a href="/about.html" target="_blank" rel="noopener noreferrer"
            style={{
              background: 'none', border: `1px solid ${theme.accent}44`, borderRadius: 6,
              padding: '5px 10px', color: '#64748b', fontSize: 11,
              textDecoration: 'none', whiteSpace: 'nowrap' as const,
            }}
          >About</a>
          {/* Ko-fi */}
          <a href="https://ko-fi.com/tonyb29" target="_blank" rel="noopener noreferrer"
            style={{
              background: 'none', border: `1px solid ${theme.accent}44`, borderRadius: 6,
              padding: '5px 10px', color: '#64748b', fontSize: 11,
              textDecoration: 'none', whiteSpace: 'nowrap' as const,
            }}
          >☕ Ko-fi</a>
          {/* API key */}
          <button
            onClick={() => setShowSettings(true)}
            title="API key settings"
            style={{
              background: 'none', border: `1px solid ${theme.accent}44`, borderRadius: 6,
              padding: '5px 8px', cursor: 'pointer', color: apiKeySet ? '#86efac' : '#94a3b8',
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
            }}
          >
            <Settings size={15} />
            {apiKeySet ? 'API ✓' : 'API'}
          </button>
        </div>
      </div>

{/* ── Help panel (on demand, not a banner) ────────────────── */}
      {helpOpen && (
        <div style={{
          background: `linear-gradient(135deg, ${theme.accentDim} 0%, #1e293b 60%, ${theme.bg} 100%)`,
          borderBottom: `1px solid ${theme.accent}33`,
          padding: '14px 24px',
        }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              Convert D&D 5e stat blocks, classes, encounters, campaign worlds, and magic items into{' '}
              <strong style={{ color: theme.accentText }}>ready-to-import Foundry macros</strong> — in seconds, no JSON editing required.
              New? Start with <strong style={{ color: theme.accentMid }}>Stat Block Parser</strong> and paste any monster.
            </p>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
              AI features require a Claude API key — click <strong style={{ color: '#94a3b8' }}>API ⚙</strong> top-right for a 2-minute setup. All parsing works without a key.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const, marginBottom: 10 }}>
              {([
                [theme.parserColor, 'Stat Block Parser', 'Paste a monster → Foundry actor'],
                ['#b45309', 'Encounter Builder', 'Balance fights by CR & party level'],
                ['#065f46', 'Campaign Builder', 'Import worlds in 5 steps'],
                ['#be185d', 'Magic Items', 'Generate any item with AI'],
                ['#4338ca', 'Player Tools', 'Classes, subclasses, species, backgrounds'],
              ] as [string, string, string][]).map(([c, name, desc]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    <strong style={{ color: '#cbd5e1' }}>{name}</strong> — {desc}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href="https://github.com/Tonyb29/DM-VTT-Toolkit/issues/new" target="_blank" rel="noopener noreferrer"
                style={{ color: '#475569', fontSize: 11, textDecoration: 'none' }}>🐛 Report a bug</a>
              <button onClick={() => setHelpOpen(false)}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 11, padding: 0, marginLeft: 8 }}>
                Close ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Nav + tab context bar ────────────────────────────────── */}
      <div style={{ background: theme.bg, borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', flexWrap: 'wrap' as const }}>
          {btn('parser',      'Stat Block Parser')}
          {btn('batch',       'Batch Processor')}
          {btn('encounter',   'Encounter Builder')}
          {btn('campaign',    'Campaign Builder')}
          {btn('items',       '✦ Magic Items')}
          {btn('celestial',   '✦ Celestial')}
          {btn('playertools', '✦ Player Tools')}
        </div>
        <div style={{
          padding: '5px 20px', borderTop: `1px solid ${tabColor}33`,
          background: `${tabColor}0d`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: tabColor, flexShrink: 0,
            boxShadow: `0 0 6px ${tabColor}`,
          }} />
          <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>{tabDesc}</span>
        </div>
      </div>

      {/* Ko-fi nudge bar */}
      {kofiVisible && (
        <div style={{
          background: theme.accentDim, borderBottom: `1px solid ${theme.accent}33`,
          padding: '8px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 13, color: theme.accentText }}>
            ☕ If this saved you 30 minutes of prep time, consider buying me a coffee!
          </span>
          <a href="https://ko-fi.com/tonyb29" target="_blank" rel="noopener noreferrer"
            style={{
              background: theme.accent, color: '#fff', borderRadius: 6,
              padding: '4px 12px', fontSize: 12, fontWeight: 700,
              textDecoration: 'none', whiteSpace: 'nowrap' as const,
            }}
          >Ko-fi ☕</a>
          <a href="https://github.com/Tonyb29/DM-VTT-Toolkit/issues/new" target="_blank" rel="noopener noreferrer"
            style={{ color: '#64748b', fontSize: 11, textDecoration: 'none', whiteSpace: 'nowrap' as const, borderLeft: '1px solid #334155', paddingLeft: 12 }}
          >🐛 Bug / Suggestion</a>
          <button onClick={dismissKofi} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '2px 4px', marginLeft: 4 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toast */}
      {sentToast && (
        <div style={{
          position: 'fixed', bottom: 80, right: 24, zIndex: 1000,
          background: '#1e293b', border: `1px solid ${theme.accent}`, borderRadius: 8,
          padding: '10px 16px', color: theme.accentText, fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 20px #0008',
        }}>
          ⚔ {sentToast}
        </div>
      )}

      {/* Tab content */}
      <div style={show('parser')}>
        <StatBlockParser onSendToEncounter={sendToEncounter} />
      </div>
      <div style={show('batch')}>
        <BatchProcessor onSendToEncounter={sendBatchToEncounter} />
      </div>
      <div style={show('encounter')}>
        <EncounterBuilder encounters={encounters} onUpdate={setEncounters} />
      </div>
      <div style={show('campaign')}>
        <CampaignBuilder />
      </div>
      <div style={show('items')}>
        <MagicItemCreator />
      </div>
      <div style={show('celestial')}>
        <CelestialCalculator />
      </div>
      <div style={show('playertools')}>
        <CharacterOptions />
      </div>

      {showSettings && (
        <SettingsModal onClose={() => { setShowSettings(false); setApiKeySet(hasApiKey()) }} />
      )}

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #1e293b', padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        fontSize: 11, color: '#334155', marginTop: 32,
      }}>
        <span>© 2026 Tony B — MIT License</span>
        <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>Privacy Policy</a>
        <a href="https://github.com/Tonyb29/DM-VTT-Toolkit" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>GitHub</a>
        <a href="https://ko-fi.com/tonyb29" target="_blank" rel="noopener noreferrer" style={{ color: '#475569', textDecoration: 'none' }}>☕ Ko-fi</a>
      </div>

      {/* ── Theme picker widget ──────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 16, right: 16, zIndex: 900,
        background: '#0f172a', border: '1px solid #334155', borderRadius: 10,
        padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 4px 24px #000a',
      }}>
        <span style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Theme
        </span>
        {(Object.keys(THEMES) as ThemeKey[]).map(k => (
          <button key={k} onClick={() => selectTheme(k)} title={THEMES[k].label} style={{
            background: themeKey === k ? THEMES[k].accent : '#1e293b',
            border: themeKey === k ? `2px solid ${THEMES[k].accentText}` : '2px solid transparent',
            borderRadius: 6, color: themeKey === k ? '#fff' : '#64748b',
            padding: '3px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700,
            transition: 'all 0.15s',
          }}>{k}</button>
        ))}
        <span style={{ fontSize: 10, color: '#334155' }}>{THEMES[themeKey].label.split('—')[1]?.trim()}</span>
      </div>
    </div>
  )
}
