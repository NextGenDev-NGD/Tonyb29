import { useState } from 'react'
import { Settings } from 'lucide-react'
import StatBlockParser from '../parser-versions/dnd-parser-v20-stable'
import ClassImporter from '../parser-versions/class-importer'
import BatchProcessor from '../parser-versions/batch-processor'
import EncounterBuilder, { Encounter, EncounterCreature } from '../parser-versions/encounter-builder'
import CampaignBuilder from '../parser-versions/campaign-builder'
import SettingsModal from '../parser-versions/settings-modal'
import { hasApiKey } from '../parser-versions/claude-api'

type Tab = 'parser' | 'batch' | 'encounter' | 'class' | 'campaign'

function uid() { return Math.random().toString(36).slice(2, 10) }

export default function App() {
  const [tab, setTab]             = useState<Tab>('parser')
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeySet, setApiKeySet] = useState(hasApiKey())

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

  const btn = (t: Tab, label: string, active: string, inactive = '#1e293b') => (
    <button onClick={() => setTab(t)}
      style={{ padding: '6px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
        background: tab === t ? active : inactive, color: '#fff', fontWeight: 600, position: 'relative' as const }}>
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

  // Render all tabs — use CSS display to hide inactive ones so state is preserved
  const show = (t: Tab) => ({ display: tab === t ? '' : 'none' })

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 24px', background: '#0f172a', borderBottom: '1px solid #334155' }}>
        {btn('parser',    'Stat Block Parser', '#7c3aed')}
        {btn('batch',     'Batch Processor',   '#0369a1')}
        {btn('encounter', 'Encounter Builder', '#b45309')}
        {btn('class',     'Class Importer',    '#4338ca')}
        {btn('campaign',  'Campaign Builder',  '#065f46')}
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => setShowSettings(true)}
            title="Settings"
            style={{
              background: 'none', border: '1px solid #334155', borderRadius: 6,
              padding: '5px 8px', cursor: 'pointer', color: apiKeySet ? '#86efac' : '#94a3b8',
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 12
            }}
          >
            <Settings size={15} />
            {apiKeySet ? 'API ✓' : 'API'}
          </button>
        </div>
      </div>

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

      {showSettings && (
        <SettingsModal onClose={() => { setShowSettings(false); setApiKeySet(hasApiKey()) }} />
      )}
    </>
  )
}
