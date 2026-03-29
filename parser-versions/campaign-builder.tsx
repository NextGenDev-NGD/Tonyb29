// campaign-builder.tsx — Eldoria Campaign Builder tab
import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronRight, BookOpen, Users, Swords, Map as MapIcon } from 'lucide-react'
import {
  CONTINENTS, NPCS, CREATURES, JOURNAL_FOLDERS, ACTOR_FOLDERS,
  buildStep1Macro, buildStep2Macro, buildStep3Macro, buildStep4Macro,
} from './campaign-builder-data'

// ─── STYLES ──────────────────────────────────────────────────

const S = {
  page:    { minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'monospace', display: 'flex', gap: 0 } as const,
  sidebar: { width: 260, minWidth: 260, background: '#1e293b', borderRight: '1px solid #334155', overflowY: 'auto' as const, padding: '16px 0' },
  main:    { flex: 1, overflowY: 'auto' as const, padding: 24 },
  card:    { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 20, marginBottom: 16 },
  cardAccent: (color: string) => ({ ...{ background: '#1e293b', borderRadius: 8, padding: 20, marginBottom: 16 }, border: `1px solid ${color}` }),
  h2:      { color: '#f1f5f9', fontWeight: 700, fontSize: 16, marginBottom: 4 },
  h3:      { color: '#cbd5e1', fontWeight: 600, fontSize: 14, marginBottom: 8 },
  muted:   { color: '#64748b', fontSize: 12 },
  label:   { color: '#94a3b8', fontSize: 12, marginBottom: 6, display: 'block' as const },
  copyBtn: (copied: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    background: copied ? '#065f46' : '#7c3aed',
    color: '#fff', border: 'none', borderRadius: 6,
    padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    transition: 'background 0.2s',
  }),
  tag: (color: string) => ({
    display: 'inline-block', background: color + '22', color, border: `1px solid ${color}55`,
    borderRadius: 4, padding: '1px 6px', fontSize: 11, marginRight: 4,
  }),
}

// ─── SIDEBAR ─────────────────────────────────────────────────

function TreeSection({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ marginBottom: 4 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        {icon}
        {label}
      </button>
      {open && <div style={{ paddingLeft: 28 }}>{children}</div>}
    </div>
  )
}

function TreeItem({ label, dim }: { label: string; dim?: string }) {
  return (
    <div style={{ padding: '2px 12px 2px 0', fontSize: 11, color: '#64748b', display: 'flex', justifyContent: 'space-between', gap: 4 }}>
      <span style={{ color: '#94a3b8' }}>· {label}</span>
      {dim && <span style={{ color: '#475569', flexShrink: 0 }}>{dim}</span>}
    </div>
  )
}

function Sidebar() {
  return (
    <div style={S.sidebar}>
      <div style={{ padding: '8px 16px 12px', borderBottom: '1px solid #334155', marginBottom: 8 }}>
        <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 14 }}>Eldoria Campaign</div>
        <div style={{ color: '#64748b', fontSize: 11 }}>Gathering Darkness</div>
      </div>

      <TreeSection label="Journal Folders" icon={<BookOpen size={12} />}>
        {JOURNAL_FOLDERS.map(f => (
          <TreeItem key={f.name} label={f.name} dim={f.parentName ? '↳' : undefined} />
        ))}
      </TreeSection>

      <TreeSection label="Actor Folders" icon={<Users size={12} />}>
        {ACTOR_FOLDERS.map(f => (
          <TreeItem key={f.name} label={f.name} dim={f.parentName ? '↳' : undefined} />
        ))}
      </TreeSection>

      <TreeSection label="NPCs" icon={<Users size={12} />}>
        {CONTINENTS.map(c => (
          <TreeSection key={c.name} label={c.name} icon={null}>
            {NPCS.filter(n => n.continent === c.name).map(n => (
              <TreeItem key={n.name} label={n.name.split(' ').slice(-1)[0]} dim={`CR${n.cr}`} />
            ))}
          </TreeSection>
        ))}
      </TreeSection>

      <TreeSection label="Creatures" icon={<Swords size={12} />}>
        {CREATURES.map(c => (
          <TreeItem key={c.name} label={c.name} dim={`CR${c.cr}`} />
        ))}
      </TreeSection>

      <TreeSection label="Journals" icon={<MapIcon size={12} />}>
        <TreeItem label="World Overview" />
        {CONTINENTS.map(c => <TreeItem key={c.name} label={c.name} />)}
        <TreeItem label="The Ragorans" />
        <TreeItem label="Shadow Cult" />
        <TreeItem label="LUKAS (GM Only)" />
        <TreeItem label="Campaign Overview" />
        <TreeItem label="Node Investigation" />
      </TreeSection>

      <div style={{ padding: '12px 16px 0', borderTop: '1px solid #334155', marginTop: 8 }}>
        <div style={{ color: '#64748b', fontSize: 11 }}>
          {NPCS.length} NPCs · {CREATURES.length} creatures<br />
          {CONTINENTS.length} continents · 5 factions
        </div>
      </div>
    </div>
  )
}

// ─── COPY BUTTON ─────────────────────────────────────────────

function CopyButton({ text, id, copied, onCopy }: { text: string; id: string; copied: string | null; onCopy: (text: string, id: string) => void }) {
  const isCopied = copied === id
  return (
    <button style={S.copyBtn(isCopied)} onClick={() => onCopy(text, id)}>
      {isCopied ? <Check size={14} /> : <Copy size={14} />}
      {isCopied ? 'Copied!' : 'Copy Macro'}
    </button>
  )
}

// ─── STEP CARDS ──────────────────────────────────────────────

function StepCard({ step, title, description, macro, id, accent, copied, onCopy }: {
  step: string; title: string; description: string; macro: string;
  id: string; accent: string; copied: string | null; onCopy: (text: string, id: string) => void
}) {
  const lines = macro.split('\n').length
  return (
    <div style={S.cardAccent(accent)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={S.tag(accent)}>{step}</span>
            <span style={{ ...S.h2, marginBottom: 0 }}>{title}</span>
          </div>
          <div style={S.muted}>{description}</div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <CopyButton text={macro} id={id} copied={copied} onCopy={onCopy} />
          <div style={{ ...S.muted, marginTop: 4 }}>{lines} lines</div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────

export default function CampaignBuilder() {
  const [copied, setCopied] = useState<string | null>(null)

  const copy = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
    } else {
      fallbackCopy(text)
    }
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const fallbackCopy = (text: string) => {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }

  return (
    <div style={S.page}>
      <Sidebar />

      <div style={S.main}>
        {/* Instructions */}
        <div style={{ ...S.cardAccent('#065f46'), background: '#052e1620', marginBottom: 24 }}>
          <div style={{ ...S.h2, color: '#86efac', marginBottom: 8 }}>How to Import into Foundry VTT</div>
          <ol style={{ color: '#94a3b8', fontSize: 13, margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Upload creature/NPC portrait images to Foundry's file manager under <code style={{ color: '#a78bfa' }}>worlds/eldoria/assets/</code></li>
            <li>Open a Foundry macro (Ctrl+M), paste <strong>Step 1</strong>, and run it to create all folders</li>
            <li>Paste and run <strong>Step 2</strong> to create all journal entries with world lore</li>
            <li>Paste and run each <strong>Step 3</strong> continent macro to create NPC leader actors</li>
            <li>Paste and run <strong>Step 4</strong> to create all creature actors</li>
          </ol>
          <div style={{ ...S.muted, marginTop: 8 }}>⚠ Run steps in order — Steps 2–4 look up folders by name from Step 1.</div>
        </div>

        {/* Step 1 */}
        <StepCard
          step="Step 1" accent="#22c55e"
          title="Create Folder Structure"
          description={`Creates ${JOURNAL_FOLDERS.length} journal folders and ${ACTOR_FOLDERS.length} actor folders in Foundry.`}
          macro={buildStep1Macro()} id="step1" copied={copied} onCopy={copy}
        />

        {/* Step 2 */}
        <StepCard
          step="Step 2" accent="#38bdf8"
          title="Create Journal Entries"
          description="Creates World Overview (5 pages), 7 continent journals (3 pages each), faction journals (Ragorans, Shadow Cult, LUKAS), and plot journals."
          macro={buildStep2Macro()} id="step2" copied={copied} onCopy={copy}
        />

        {/* Step 3 — per continent */}
        <div style={S.cardAccent('#f59e0b')}>
          <div style={{ ...S.h2, color: '#fcd34d', marginBottom: 4 }}>Step 3 — Create NPC Leaders</div>
          <div style={{ ...S.muted, marginBottom: 16 }}>
            One macro per continent — each creates that continent's leader actors with full bios, race, class, CR, and image paths.
            Run the macro for each continent separately.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
            {CONTINENTS.map(c => {
              const npcs = NPCS.filter(n => n.continent === c.name)
              const id = `step3-${c.name}`
              return (
                <div key={c.name} style={{ background: '#0f172a', borderRadius: 6, padding: 14, border: '1px solid #334155' }}>
                  <div style={{ ...S.h3, marginBottom: 4 }}>{c.name}</div>
                  <div style={{ ...S.muted, marginBottom: 10 }}>
                    {npcs.map(n => n.name.split(' ').slice(-1)[0]).join(' · ')} ({npcs.length} actors)
                  </div>
                  <CopyButton text={buildStep3Macro(c.name)} id={id} copied={copied} onCopy={copy} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Step 4 */}
        <StepCard
          step="Step 4" accent="#f87171"
          title="Create Creature Actors"
          description={`Creates all ${CREATURES.length} creature actors (Shadow Cult enemies, Ragorans, Drazahl) in the Eldoria — Creatures folder.`}
          macro={buildStep4Macro()} id="step4" copied={copied} onCopy={copy}
        />

        {/* Footer note */}
        <div style={{ ...S.card, background: '#0f172a' }}>
          <div style={S.h3}>After Import</div>
          <ul style={{ color: '#64748b', fontSize: 12, margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
            <li>NPC actors are <strong>stubs</strong> — use the Stat Block Parser tab to generate full stat blocks and update them in Foundry</li>
            <li>Images show as broken until uploaded to <code style={{ color: '#a78bfa' }}>worlds/eldoria/assets/</code></li>
            <li>Creature stat blocks from the Eldoria_Creatures.pdf can be pasted into the parser for Foundry-ready JSON</li>
            <li>LUKAS journal is in Factions &amp; Organizations — keep it hidden from players</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
