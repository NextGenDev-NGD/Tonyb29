import { useState } from 'react'
import StatBlockParser from '../parser-versions/dnd-parser-v20-stable'
import JSONValidator from '../validaton-scripts/json-validator'
import ClassImporter from '../parser-versions/class-importer'
import BatchProcessor from '../parser-versions/batch-processor'

type Tab = 'parser' | 'class' | 'batch' | 'validator'

export default function App() {
  const [tab, setTab] = useState<Tab>('parser')
  const btn = (t: Tab, label: string, active: string, inactive = '#1e293b') => (
    <button onClick={() => setTab(t)}
      style={{ padding: '6px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
        background: tab === t ? active : inactive, color: '#fff', fontWeight: 600 }}>
      {label}
    </button>
  )
  return (
    <>
      <div style={{ display: 'flex', gap: 8, padding: '8px 24px', background: '#0f172a', borderBottom: '1px solid #334155' }}>
        {btn('parser',    'Stat Block Parser', '#7c3aed')}
        {btn('class',     'Class Importer',    '#4338ca')}
        {btn('batch',     'Batch Processor',   '#0369a1')}
        {btn('validator', 'JSON Validator',    '#4f46e5')}
      </div>
      {tab === 'parser'    && <StatBlockParser />}
      {tab === 'class'     && <ClassImporter />}
      {tab === 'batch'     && <BatchProcessor />}
      {tab === 'validator' && <JSONValidator />}
    </>
  )
}
