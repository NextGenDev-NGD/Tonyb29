import { useState } from 'react'
import { Settings, HelpCircle, X } from 'lucide-react'
import StatBlockParser from '../parser-versions/dnd-parser-v20-stable'
import ClassImporter from '../parser-versions/class-importer'
import BatchProcessor from '../parser-versions/batch-processor'
import EncounterBuilder, { Encounter, EncounterCreature } from '../parser-versions/encounter-builder'
import CampaignBuilder from '../parser-versions/campaign-builder'
import MagicItemCreator from '../parser-versions/magic-item-creator'
import CelestialCalculator from '../parser-versions/celestial-calculator'
import CharacterOptions from '../parser-versions/character-options'
import SettingsModal from '../parser-versions/settings-modal'
import { hasApiKey } from '../parser-versions/claude-api'

type Tab = 'parser' | 'batch' | 'encounter' | 'class' | 'campaign' | 'items' | 'celestial' | 'charoptions'

const TAB_META: Record<Tab, { desc: string; color: string }> = {
  parser:    { color: '#7c3aed', desc: 'Paste any D&D 5e stat block — get a Foundry-ready actor in seconds' },
  batch:     { color: '#0369a1', desc: 'Parse an entire bestiary at once, or generate monsters by name with AI' },
  encounter: { color: '#b45309', desc: 'Build balanced encounters with live XP thresholds and difficulty ratings' },
  class:     { color: '#4338ca', desc: 'Turn a class description into a complete Foundry class with all advancements' },
  campaign:  { color: '#065f46', desc: 'Import a full world — continents, NPCs, and creatures — in five steps' },
  items:     { color: '#be185d', desc: 'Create magic weapons, armor, wondrous items, and consumables with Foundry JSON' },
  celestial:    { color: '#0e7490', desc: 'Track moon phases, conjunctions, and celestial events for any fantasy world' },
  charoptions:  { color: '#4338ca', desc: 'Create subclasses, species, and backgrounds with Foundry-ready import macros' },
}

function uid() { return Math.random().toString(36).slice(2, 10) }

export default function App() {
  const [tab, setTab]             = useState<Tab>('parser')
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeySet, setApiKeySet] = useState(hasApiKey())
  const [bannerOpen, setBannerOpen] = useState(
    () => localStorage.getItem('dnd_welcome_dismissed') !== '1'
  )
  const dismissBanner = () => {
    localStorage.setItem('dnd_welcome_dismissed', '1')
    setBannerOpen(false)
  }

  // Ko-fi nudge — show once per session after first tab switch
  const [kofiVisible, setKofiVisible] = useState(false)
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

  // Encounter state — lifted here so parser + batch can push into it
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [sentToast, setSentToast]   = useState('')

  // Single-actor send — uses functional updater to avoid stale closure
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

  // Batch send — builds all creatures into state in a single updater call
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

  const btn = (t: Tab, label: string) => {
    const { color } = TAB_META[t]
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

  // Render all tabs — use CSS display to hide inactive ones so state is preserved
  const show = (t: Tab) => ({ display: tab === t ? '' : 'none' })

  const { color: tabColor, desc: tabDesc } = TAB_META[tab]

  return (
    <>
      {/* ── Nav bar ─────────────────────────────────────────────── */}
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px' }}>
          {btn('parser',    'Stat Block Parser')}
          {btn('batch',     'Batch Processor')}
          {btn('encounter', 'Encounter Builder')}
          {btn('class',     'Class Importer')}
          {btn('campaign',  'Campaign Builder')}
          {btn('items',     '✦ Magic Items')}
          {btn('celestial', '✦ Celestial')}
          {btn('charoptions', '✦ Character Options')}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setBannerOpen(v => !v)}
              title={bannerOpen ? 'Hide intro' : 'About this tool'}
              style={{
                background: 'none', border: '1px solid #334155', borderRadius: 6,
                padding: '5px 8px', cursor: 'pointer', color: bannerOpen ? '#c4b5fd' : '#475569',
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
              }}
            >
              <HelpCircle size={14} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              title="API key settings"
              style={{
                background: 'none', border: '1px solid #334155', borderRadius: 6,
                padding: '5px 8px', cursor: 'pointer', color: apiKeySet ? '#86efac' : '#94a3b8',
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
              }}
            >
              <Settings size={15} />
              {apiKeySet ? 'API ✓' : 'API'}
            </button>
          </div>
        </div>

        {/* ── Tab context bar ───────────────────────────────────── */}
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

      {/* ── Welcome banner ────────────────────────────────────────── */}
      {bannerOpen && (
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #1e293b 60%, #0f172a 100%)',
          borderBottom: '1px solid #7c3aed44',
          padding: '16px 24px',
        }}>
          <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>⚔</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: '#e2e8f0' }}>
                  Stop building in Foundry by hand.
                </span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                This tool converts D&D 5e stat blocks, custom classes, encounters, campaign worlds, and magic items
                into <strong style={{ color: '#c4b5fd' }}>ready-to-import Foundry macros</strong> — in seconds, with no JSON editing required.
                New to Foundry? Start with <strong style={{ color: '#a78bfa' }}>Stat Block Parser</strong> and paste any monster description.
                Already know what you&apos;re doing? Pick a tab.
              </p>
              <p style={{ margin: '0 0 10px', fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                AI features (stat block generation, campaign builder, magic items) require a Claude API key — click <strong style={{ color: '#94a3b8' }}>API ⚙</strong> in the top right for a 2-minute setup guide. All other features work without a key.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
                {([
                  ['#7c3aed', 'Stat Block Parser', 'Paste a monster → Foundry actor'],
                  ['#b45309', 'Encounter Builder', 'Balance fights by CR & party level'],
                  ['#065f46', 'Campaign Builder', 'Import worlds in 5 steps'],
                  ['#be185d', 'Magic Items', 'Generate any item with AI'],
                ] as [string, string, string][]).map(([c, name, desc]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      <strong style={{ color: '#cbd5e1' }}>{name}</strong> — {desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignItems: 'flex-end' }}>
              <a
                href="https://ko-fi.com/tonyb29"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: '1px solid #334155', borderRadius: 6,
                  padding: '5px 10px', color: '#94a3b8', fontSize: 11,
                  textDecoration: 'none', whiteSpace: 'nowrap' as const,
                }}
                title="If this saved you prep time, a coffee is appreciated!"
              >
                ☕ Buy me a coffee
              </a>
              <a
                href="https://github.com/Tonyb29/DM-VTT-Toolkit/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: '1px solid #334155', borderRadius: 6,
                  padding: '5px 10px', color: '#64748b', fontSize: 11,
                  textDecoration: 'none', whiteSpace: 'nowrap' as const,
                }}
              >
                🐛 Report a bug
              </a>
              <button onClick={dismissBanner} title="Don't show again" style={{
                background: 'none', border: '1px solid #334155', borderRadius: 6,
                padding: '5px 8px', cursor: 'pointer', color: '#475569',
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
              }}>
                <X size={12} /> Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ko-fi nudge bar */}
      {kofiVisible && (
        <div style={{
          background: '#1e1b4b', borderBottom: '1px solid #7c3aed44',
          padding: '8px 24px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 13, color: '#c4b5fd' }}>
            ☕ If this saved you 30 minutes of prep time, consider buying me a coffee!
          </span>
          <a
            href="https://ko-fi.com/tonyb29"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#7c3aed', color: '#fff', borderRadius: 6,
              padding: '4px 12px', fontSize: 12, fontWeight: 700,
              textDecoration: 'none', whiteSpace: 'nowrap' as const,
            }}
          >
            Ko-fi ☕
          </a>
          <a
            href="https://github.com/Tonyb29/DM-VTT-Toolkit/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#64748b', fontSize: 11, textDecoration: 'none',
              whiteSpace: 'nowrap' as const, borderLeft: '1px solid #334155',
              paddingLeft: 12,
            }}
          >
            🐛 Bug / Suggestion
          </a>
          <button onClick={dismissKofi} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#475569', padding: '2px 4px', marginLeft: 4,
          }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toast notification */}
      {sentToast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          background: '#1e293b', border: '1px solid #7c3aed', borderRadius: 8,
          padding: '10px 16px', color: '#c4b5fd', fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 20px #0008',
        }}>
          ⚔ {sentToast}
        </div>
      )}

      {/* All tabs stay mounted — hidden via CSS so state is preserved on tab switch */}
      <div style={show('parser')}>
        <StatBlockParser onSendToEncounter={sendToEncounter} />
      </div>
      <div style={show('batch')}>
        <BatchProcessor onSendToEncounter={sendBatchToEncounter} />
      </div>
      <div style={show('encounter')}>
        <EncounterBuilder encounters={encounters} onUpdate={setEncounters} />
      </div>
      <div style={show('class')}>
        <ClassImporter />
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
      <div style={show('charoptions')}>
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
        <a href="/privacy.html" target="_blank" rel="noopener noreferrer"
          style={{ color: '#475569', textDecoration: 'none' }}>Privacy Policy</a>
        <a href="https://github.com/Tonyb29/DM-VTT-Toolkit" target="_blank" rel="noopener noreferrer"
          style={{ color: '#475569', textDecoration: 'none' }}>GitHub</a>
        <a href="https://ko-fi.com/tonyb29" target="_blank" rel="noopener noreferrer"
          style={{ color: '#475569', textDecoration: 'none' }}>☕ Ko-fi</a>
      </div>
    </>
  )
}
