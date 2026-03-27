import { useState } from 'react'
import { Settings } from 'lucide-react'
import StatBlockParser from '../parser-versions/dnd-parser-v20-stable'
import JSONValidator from '../validaton-scripts/json-validator'
import ClassImporter from '../parser-versions/class-importer'
import BatchProcessor from '../parser-versions/batch-processor'
import SettingsModal from '../parser-versions/settings-modal'
import { hasApiKey } from '../parser-versions/claude-api'

type Tab = 'parser' | 'class' | 'batch' | 'validator'

export default function App() {
  const [tab, setTab]             = useState<Tab>('parser')
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeySet, setApiKeySet] = useState(hasApiKey())

  const btn = (t: Tab, label: string, active: string, inactive = '#1e293b') => (
    <button onClick={() => setTab(t)}
      style={{ padding: '6px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
        background: tab === t ? active : inactive, color: '#fff', fontWeight: 600 }}>
      {label}
    </button>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 24px', background: '#0f172a', borderBottom: '1px solid #334155' }}>
        {btn('parser',    'Stat Block Parser', '#7c3aed')}
        {btn('class',     'Class Importer',    '#4338ca')}
        {btn('batch',     'Batch Processor',   '#0369a1')}
        {btn('validator', 'JSON Validator',    '#4f46e5')}
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

      {tab === 'parser'    && <StatBlockParser />}
      {tab === 'class'     && <ClassImporter />}
      {tab === 'batch'     && <BatchProcessor />}
      {tab === 'validator' && <JSONValidator />}

      {showSettings && (
        <SettingsModal onClose={() => { setShowSettings(false); setApiKeySet(hasApiKey()) }} />
      )}
    </>
  )
}
