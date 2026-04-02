import { useState } from 'react'
import { Settings } from 'lucide-react'
import StatBlockParser from '../parser-versions/dnd-parser-v20-stable'
import ClassImporter from '../parser-versions/class-importer'
import BatchProcessor from '../parser-versions/batch-processor'
import EncounterBuilder, { Encounter } from '../parser-versions/encounter-builder'
import CampaignBuilder from '../parser-versions/campaign-builder'
import SettingsModal from '../parser-versions/settings-modal'
import { hasApiKey } from '../parser-versions/claude-api'

type Tab = 'parser' | 'encounter' | 'batch' | 'class' | 'campaign'

function uid() { return Math.random().toString(36).slice(2, 10) }

export default function App() {
  const [tab, setTab]             = useState<Tab>('parser')
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeySet, setApiKeySet] = useState(hasApiKey())

  // Encounter state — lifted here so parser can push into it
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [sentToast, setSentToast]   = useState('')  // e.g. "Goblin added to Encounter 1"

  const sendBatchToEncounter = (actors: any[]) => {
    if (!actors.length) return
    actors.forEach(actor => sendToEncounter(actor))
  }

  const sendToEncounter = (actor: any) => {
    let target: Encounter
    let next: Encounter[]

    if (encounters.length === 0) {
      // Create the first encounter automatically
      target = { id: uid(), name: 'Encounter 1', creatures: [] }
      next = [target]
    } else {
      target = encounters[encounters.length - 1]  // add to most recent
      next = [...encounters]
    }

    // Check if creature already exists in this encounter — increment qty instead
    const existing = target.creatures.find(c => c.actor?.name === actor?.name)
    if (existing) {
      next = next.map(e => e.id === target.id ? {
        ...e,
        creatures: e.creatures.map(c => c.id === existing.id ? { ...c, quantity: c.quantity + 1 } : c),
      } : e)
    } else {
      next = next.map(e => e.id === target.id ? {
        ...e,
        creatures: [...e.creatures, { id: uid(), actor, quantity: 1 }],
      } : e)
    }

    setEncounters(next)
    setSentToast(`${actor?.name ?? 'Creature'} added to "${target.name}"`)
    setTimeout(() => setSentToast(''), 3000)
  }

  const btn = (t: Tab, label: string, active: string, inactive = '#1e293b') => (
    <button onClick={() => setTab(t)}
      style={{ padding: '6px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
        background: tab === t ? active : inactive, color: '#fff', fontWeight: 600, position: 'relative' as const }}>
      {label}
      {/* Badge showing creature count on Encounter tab */}
      {t === 'encounter' && encounters.reduce((s, e) => s + e.creatures.reduce((ss, c) => ss + c.quantity, 0), 0) > 0 && (
        <span style={{
          position: 'absolute', top: -6, right: -6,
          background: '#ef4444', color: '#fff', borderRadius: 99,
          fontSize: 10, fontWeight: 700, padding: '1px 5px', lineHeight: 1.4,
        }}>
          {encounters.reduce((s, e) => s + e.creatures.reduce((ss, c) => ss + c.quantity, 0), 0)}
        </span>
      )}
    </button>
  )

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

      {tab === 'parser'    && <StatBlockParser onSendToEncounter={sendToEncounter} />}
      {tab === 'encounter' && <EncounterBuilder encounters={encounters} onUpdate={setEncounters} />}
      {tab === 'batch'     && <BatchProcessor onSendToEncounter={sendBatchToEncounter} />}
      {tab === 'class'     && <ClassImporter />}
      {tab === 'campaign'  && <CampaignBuilder />}

      {showSettings && (
        <SettingsModal onClose={() => { setShowSettings(false); setApiKeySet(hasApiKey()) }} />
      )}
    </>
  )
}
