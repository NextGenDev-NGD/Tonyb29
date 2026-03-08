import { useState } from 'react'
import StatBlockParser from '../parser-versions/dnd-parser-v20-stable'
import JSONValidator from '../validaton-scripts/json-validator'

export default function App() {
  const [tab, setTab] = useState<'parser' | 'validator'>('parser')
  return (
    <>
      <div style={{ display: 'flex', gap: 8, padding: '8px 24px', background: '#0f172a', borderBottom: '1px solid #334155' }}>
        <button onClick={() => setTab('parser')}
          style={{ padding: '6px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === 'parser' ? '#7c3aed' : '#1e293b', color: '#fff', fontWeight: 600 }}>
          Parser
        </button>
        <button onClick={() => setTab('validator')}
          style={{ padding: '6px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: tab === 'validator' ? '#4f46e5' : '#1e293b', color: '#fff', fontWeight: 600 }}>
          JSON Validator
        </button>
      </div>
      {tab === 'parser' ? <StatBlockParser /> : <JSONValidator />}
    </>
  )
}
