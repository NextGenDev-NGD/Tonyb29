// campaign-builder.tsx — Generic Campaign Builder tab (Phase 15)
// Loads a CampaignPreset — currently defaults to ELDORIA_PRESET.
// Future: preset picker, blank campaign mode, AI-assisted campaign input.
import React, { useState, useRef, useEffect } from 'react'
import { Copy, Check, ChevronDown, ChevronRight, BookOpen, Users, Swords, Map as MapIcon, Sparkles, RefreshCw, X, CheckCircle, XCircle, AlertTriangle, Download, Upload, FileJson, Pencil, Trash2, Plus } from 'lucide-react'
import {
  CampaignPreset, NpcDef, CreatureDef, ContinentDef, JournalDef, JournalPageDef,
  buildStep1Macro, buildStep2Macro, buildStep3Macro, buildStep4Macro,
} from './campaign-builder-data'
import { ELDORIA_PRESET, BLANK_PRESET } from './campaign-eldoria-preset'
import { generateStatBlockFromName, generateCampaignPreset, hasApiKey } from './claude-api'
import { parseStatBlock } from './dnd-parser-v20-stable'

// ─── TYPES ───────────────────────────────────────────────────

type NpcResult = {
  name: string
  status: 'pending' | 'generating' | 'done' | 'error'
  accuracy: number | null
  errors: string[]
  actor: any
}

type EditTarget =
  | { type: 'npc';       item: NpcDef | null;       continent?: string }
  | { type: 'creature';  item: CreatureDef | null }
  | { type: 'continent'; item: ContinentDef | null }
  | { type: 'journal';   item: JournalDef | null }
  | null

const LS_KEY = 'dnd_campaign_preset'

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

// ─── EDITABLE TREE ITEM ──────────────────────────────────────

function ActionTreeItem({ label, dim, onEdit, onDelete }: {
  label: string; dim?: string
  onEdit?: () => void; onDelete?: () => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <div
      style={{ padding: '2px 4px 2px 0', fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span style={{ color: '#94a3b8' }}>· {label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, opacity: hover ? 1 : 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
        {dim && <span style={{ color: '#475569', fontSize: 10 }}>{dim}</span>}
        {onEdit && (
          <button onClick={onEdit} title="Edit" style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '1px 3px', display: 'flex', alignItems: 'center' }}>
            <Pencil size={9} />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} title="Delete" style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', padding: '1px 3px', display: 'flex', alignItems: 'center' }}>
            <Trash2 size={9} />
          </button>
        )}
      </div>
    </div>
  )
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

function Sidebar({ preset, onEditNpc, onDeleteNpc, onAddNpc, onEditCreature, onDeleteCreature, onAddCreature, onEditContinent, onDeleteContinent, onAddContinent, onEditJournal, onDeleteJournal, onAddJournal }: {
  preset: CampaignPreset
  onEditNpc?: (npc: NpcDef) => void
  onDeleteNpc?: (name: string) => void
  onAddNpc?: (continent: string) => void
  onEditCreature?: (c: CreatureDef) => void
  onDeleteCreature?: (name: string) => void
  onAddCreature?: () => void
  onEditContinent?: (c: ContinentDef) => void
  onDeleteContinent?: (name: string) => void
  onAddContinent?: () => void
  onEditJournal?: (j: JournalDef) => void
  onDeleteJournal?: (name: string) => void
  onAddJournal?: () => void
}) {
  return (
    <div style={S.sidebar}>
      <div style={{ padding: '8px 16px 12px', borderBottom: '1px solid #334155', marginBottom: 8 }}>
        <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 14 }}>{preset.name}</div>
        <div style={{ color: '#64748b', fontSize: 11 }}>{preset.description}</div>
      </div>

      <TreeSection label="Journal Folders" icon={<BookOpen size={12} />}>
        {preset.journalFolders.map(f => (
          <TreeItem key={f.name} label={f.name} dim={f.parentName ? '↳' : undefined} />
        ))}
      </TreeSection>

      <TreeSection label="Actor Folders" icon={<Users size={12} />}>
        {preset.actorFolders.map(f => (
          <TreeItem key={f.name} label={f.name} dim={f.parentName ? '↳' : undefined} />
        ))}
      </TreeSection>

      <TreeSection label="Continents" icon={<MapIcon size={12} />}>
        {preset.continents.map(c => (
          <ActionTreeItem
            key={c.name}
            label={c.name}
            dim={c.theme.split(' ')[0]}
            onEdit={onEditContinent ? () => onEditContinent(c) : undefined}
            onDelete={onDeleteContinent ? () => onDeleteContinent(c.name) : undefined}
          />
        ))}
        {onAddContinent && (
          <button onClick={onAddContinent} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 10, padding: '3px 0 3px 4px', width: '100%' }}>
            <Plus size={9} /> Add Continent
          </button>
        )}
      </TreeSection>

      <TreeSection label="NPCs" icon={<Users size={12} />}>
        {preset.continents.map(c => (
          <TreeSection key={c.name} label={c.name} icon={null}>
            {preset.npcs.filter(n => n.continent === c.name).map(n => (
              <ActionTreeItem
                key={n.name}
                label={n.name.split(' ').slice(-1)[0]}
                dim={`CR${n.cr}`}
                onEdit={onEditNpc ? () => onEditNpc(n) : undefined}
                onDelete={onDeleteNpc ? () => onDeleteNpc(n.name) : undefined}
              />
            ))}
            {onAddNpc && (
              <button
                onClick={() => onAddNpc(c.name)}
                style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 10, padding: '3px 0 3px 4px', width: '100%' }}
              >
                <Plus size={9} /> Add NPC
              </button>
            )}
          </TreeSection>
        ))}
      </TreeSection>

      <TreeSection label="Creatures" icon={<Swords size={12} />}>
        {preset.creatures.map(c => (
          <ActionTreeItem
            key={c.name}
            label={c.name}
            dim={`CR${c.cr}`}
            onEdit={onEditCreature ? () => onEditCreature(c) : undefined}
            onDelete={onDeleteCreature ? () => onDeleteCreature(c.name) : undefined}
          />
        ))}
        {onAddCreature && (
          <button
            onClick={onAddCreature}
            style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 10, padding: '3px 0 3px 4px', width: '100%' }}
          >
            <Plus size={9} /> Add Creature
          </button>
        )}
      </TreeSection>

      <TreeSection label="Journals" icon={<BookOpen size={12} />}>
        {preset.journals.map(j => (
          <ActionTreeItem
            key={j.name}
            label={j.name}
            dim={`${j.pages.length}p`}
            onEdit={onEditJournal ? () => onEditJournal(j) : undefined}
            onDelete={onDeleteJournal ? () => onDeleteJournal(j.name) : undefined}
          />
        ))}
        {onAddJournal && (
          <button onClick={onAddJournal} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 10, padding: '3px 0 3px 4px', width: '100%' }}>
            <Plus size={9} /> Add Journal
          </button>
        )}
      </TreeSection>

      <div style={{ padding: '12px 16px 0', borderTop: '1px solid #334155', marginTop: 8 }}>
        <div style={{ color: '#64748b', fontSize: 11 }}>
          {preset.npcs.length} NPCs · {preset.creatures.length} creatures<br />
          {preset.continents.length} continents · {preset.journals.length} journals
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

// ─── HELPERS ─────────────────────────────────────────────────

// Build Step 4 macro with pre-parsed stat blocks embedded.
// Creatures with statText get full actor JSON; others get bio stubs.
function buildStep4StatsMacro(preset: CampaignPreset): string {
  const actorLines: string[] = []
  const coverageCount = preset.creatures.filter(c => c.statText).length

  for (const c of preset.creatures) {
    if (c.statText) {
      const { actor, errors } = parseStatBlock(c.statText)
      if (!errors.length && actor) {
        // Embed full actor data — override name from CREATURES (may differ slightly from parsed)
        const data = {
          ...actor,
          name: c.name,
          img: c.img,
          system: {
            ...actor.system,
            details: {
              ...actor.system.details,
              biography: { value: c.bio },
            },
          },
        }
        actorLines.push(`    ${JSON.stringify(data)}`)
        continue
      }
    }
    // Fallback: stub
    actorLines.push(`    {
      name: ${JSON.stringify(c.name)}, type: 'npc', folder: folder.id,
      img: ${JSON.stringify(c.img)},
      system: { details: {
        biography: { value: ${JSON.stringify(c.bio)} },
        alignment: ${JSON.stringify(c.alignment)},
        type: { value: ${JSON.stringify(c.creatureType)}, subtype: '' },
        cr: ${c.cr}
      }}
    }`)
  }

  const folderName = preset.creatureFolderName
  const campaignName = preset.name
  return `// Step 4 — Creature Actors (${coverageCount}/${preset.creatures.length} with full stat blocks) — update-in-place safe
(async () => {
  const af = name => game.folders.find(f => f.name === name && f.type === 'Actor');
  const folder = af(${JSON.stringify(folderName)});
  if (!folder) { ui.notifications.error(${JSON.stringify(`${folderName} folder not found — run Step 1 first.`)}); return; }
  const allActors = [
${actorLines.join(',\n')}
  ];
  let updated = 0, created = 0;
  for (const raw of allActors) {
    const { items = [], ...actorData } = raw;
    const existing = game.actors.getName(actorData.name);
    if (existing) {
      await existing.update({ system: actorData.system, img: actorData.img });
      const oldIds = existing.items.map(i => i.id);
      if (oldIds.length) await existing.deleteEmbeddedDocuments("Item", oldIds);
      if (items.length) await existing.createEmbeddedDocuments("Item", items);
      updated++;
    } else {
      await Actor.create({ ...actorData, items, folder: folder.id });
      created++;
    }
  }
  ui.notifications.info(\`✅ ${campaignName} creatures: \${updated} updated, \${created} created.\`);
})();`
}

function buildNpcContext(npc: NpcDef): string {
  const bioText = npc.bio
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
  return `Eldoria homebrew D&D 5e 2024 campaign. ${npc.race}, ${npc.cls}, CR ${npc.cr}, ${npc.alignment}. Title: ${npc.title}. Appearance: ${npc.appearance}. Background: ${bioText}`
}

function buildStep5Macro(results: NpcResult[]): string {
  const actors = results.filter(r => r.actor && !r.errors.length).map(r => r.actor)
  if (!actors.length) return ''
  return [
    `// Step 5 — Update NPC Actors with Full Stat Blocks`,
    `// Generated by Eldoria Campaign Builder — ${actors.length} NPC${actors.length !== 1 ? 's' : ''}`,
    `// Run AFTER Steps 1-4. Finds each actor by name and patches in the generated stat block.`,
    `// If an actor isn't found by name, it will be created instead.`,
    ``,
    `const statBlocks = ${JSON.stringify(actors, null, 2)};`,
    ``,
    `let updated = 0, created = 0;`,
    `for (const data of statBlocks) {`,
    `  const { items = [], ...actorData } = data;`,
    `  const existing = game.actors.getName(actorData.name);`,
    `  if (existing) {`,
    `    await existing.update({ system: actorData.system });`,
    `    const oldIds = existing.items.map(i => i.id);`,
    `    if (oldIds.length) await existing.deleteEmbeddedDocuments("Item", oldIds);`,
    `    if (items.length) await existing.createEmbeddedDocuments("Item", items);`,
    `    updated++;`,
    `  } else {`,
    `    await Actor.create(data);`,
    `    created++;`,
    `  }`,
    `}`,
    `ui.notifications.info(\`Step 5 complete — \${updated} updated, \${created} created as new.\`);`,
  ].join('\n')
}

// ─── MAIN COMPONENT ──────────────────────────────────────────

// ─── EDIT MODAL ──────────────────────────────────────────────

function EditModal({ target, preset, onSave, onClose }: {
  target: NonNullable<EditTarget>
  preset: CampaignPreset
  onSave: (type: 'npc' | 'creature' | 'continent' | 'journal', item: NpcDef | CreatureDef | ContinentDef | JournalDef, originalName?: string) => void
  onClose: () => void
}) {
  const isNpc       = target.type === 'npc'
  const isCreature  = target.type === 'creature'
  const isContinent = target.type === 'continent'
  const isJournal   = target.type === 'journal'
  const existingNpc       = isNpc       ? target.item as NpcDef | null       : null
  const existingCreature  = isCreature  ? target.item as CreatureDef | null  : null
  const existingContinent = isContinent ? target.item as ContinentDef | null : null
  const existingJournal   = isJournal   ? target.item as JournalDef | null   : null

  const [name, setName]             = useState(existingNpc?.name ?? '')
  const [title, setTitle]           = useState(existingNpc?.title ?? '')
  const [race, setRace]             = useState(existingNpc?.race ?? '')
  const [cls, setCls]               = useState(existingNpc?.cls ?? '')
  const [alignment, setAlignment]   = useState(existingNpc?.alignment ?? 'neutral good')
  const [cr, setCr]                 = useState(String(existingNpc?.cr ?? 1))
  const [continent, setContinent]   = useState(
    existingNpc?.continent ?? (isNpc && (target as any).continent) ?? preset.continents[0]?.name ?? ''
  )
  const [bio, setBio]               = useState(existingNpc?.bio ?? '')
  const [appearance, setAppearance] = useState(existingNpc?.appearance ?? '')
  const [relationships, setRelationships] = useState(existingNpc?.relationships ?? '')
  const [img, setImg]               = useState(existingNpc?.img ?? '')

  const [cName, setCName]           = useState(existingCreature?.name ?? '')
  const [cCr, setCCr]               = useState(String(existingCreature?.cr ?? 1))
  const [cType, setCType]           = useState(existingCreature?.creatureType ?? 'beast')
  const [cAlign, setCAlign]         = useState(existingCreature?.alignment ?? 'unaligned')
  const [cBio, setCBio]             = useState(existingCreature?.bio ?? '')
  const [cImg, setCImg]             = useState(existingCreature?.img ?? '')
  const [cStat, setCStat]           = useState(existingCreature?.statText ?? '')

  // Continent state
  const [ctName, setCtName]         = useState(existingContinent?.name ?? '')
  const [ctTheme, setCtTheme]       = useState(existingContinent?.theme ?? '')
  const [ctGeo, setCtGeo]           = useState(existingContinent?.geography ?? '')
  const [ctCulture, setCtCulture]   = useState(existingContinent?.culture ?? '')
  // locations stored as newline-separated text for easy editing
  const [ctLocs, setCtLocs]         = useState((existingContinent?.locations ?? []).join('\n'))

  // Journal state
  const [jName, setJName]           = useState(existingJournal?.name ?? '')
  const [jFolder, setJFolder]       = useState(existingJournal?.folder ?? preset.journalFolders[0]?.name ?? '')
  const [jPages, setJPages]         = useState<JournalPageDef[]>(existingJournal?.pages ?? [{ name: 'Overview', html: '' }])

  const originalName = target.item?.name
  const ALIGNMENTS   = ['lawful good','neutral good','chaotic good','lawful neutral','true neutral','chaotic neutral','lawful evil','neutral evil','chaotic evil','unaligned']

  const F = {
    field:  { width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box' as const },
    label:  { color: '#94a3b8', fontSize: 12, display: 'block' as const, marginBottom: 4 },
    group:  { marginBottom: 12 },
    grid2:  { display: 'grid' as const, gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 },
    grid3:  { display: 'grid' as const, gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 },
  }

  const autoImg = (n: string) => `worlds/${preset.id}/assets/${n.toLowerCase().replace(/\s+/g, '-')}.png`

  const handleSave = () => {
    if (isNpc) {
      if (!name.trim()) return
      const npc: NpcDef = {
        name: name.trim(), title: title.trim(), race: race.trim(), cls: cls.trim(),
        alignment, cr: parseFloat(cr) || 1, creatureType: 'humanoid', continent,
        bio: bio.trim(), appearance: appearance.trim(), relationships: relationships.trim(),
        img: img.trim() || autoImg(name.trim()),
      }
      onSave('npc', npc, originalName)
    } else if (isCreature) {
      if (!cName.trim()) return
      const creature: CreatureDef = {
        name: cName.trim(), cr: parseFloat(cCr) || 1, creatureType: cType.trim(),
        alignment: cAlign, bio: cBio.trim(),
        img: cImg.trim() || autoImg(cName.trim()),
        ...(cStat.trim() ? { statText: cStat.trim() } : {}),
      }
      onSave('creature', creature, originalName)
    } else if (isContinent) {
      if (!ctName.trim()) return
      const cont: ContinentDef = {
        name: ctName.trim(), theme: ctTheme.trim(), geography: ctGeo.trim(),
        culture: ctCulture.trim(),
        locations: ctLocs.split('\n').map(l => l.trim()).filter(Boolean),
      }
      onSave('continent', cont, originalName)
    } else {
      if (!jName.trim()) return
      const journal: JournalDef = {
        name: jName.trim(),
        folder: jFolder,
        pages: jPages.filter(p => p.name.trim()),
      }
      onSave('journal', journal, originalName)
    }
  }

  const modalTitle = isNpc ? (target.item ? 'Edit NPC' : 'Add NPC')
    : isCreature  ? (target.item ? 'Edit Creature'  : 'Add Creature')
    : isContinent ? (target.item ? 'Edit Continent' : 'Add Continent')
    : (target.item ? 'Edit Journal' : 'Add Journal')

  const canSave = isNpc ? !!name.trim()
    : isCreature  ? !!cName.trim()
    : isContinent ? !!ctName.trim()
    : !!jName.trim()

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000099', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 16 }}>{modalTitle}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
        </div>

        {isNpc ? (
          <>
            <div style={F.grid2}>
              <div style={F.group}><span style={F.label}>Name *</span><input style={F.field} value={name} onChange={e => setName(e.target.value)} placeholder="Full name" /></div>
              <div style={F.group}><span style={F.label}>Title</span><input style={F.field} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. High Priest" /></div>
            </div>
            <div style={F.grid3}>
              <div style={F.group}><span style={F.label}>Race</span><input style={F.field} value={race} onChange={e => setRace(e.target.value)} placeholder="Human" /></div>
              <div style={F.group}><span style={F.label}>Class</span><input style={F.field} value={cls} onChange={e => setCls(e.target.value)} placeholder="Wizard" /></div>
              <div style={F.group}><span style={F.label}>CR</span><input style={F.field} type="number" min="0" max="30" step="0.125" value={cr} onChange={e => setCr(e.target.value)} /></div>
            </div>
            <div style={F.grid2}>
              <div style={F.group}>
                <span style={F.label}>Alignment</span>
                <select style={F.field} value={alignment} onChange={e => setAlignment(e.target.value)}>
                  {ALIGNMENTS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div style={F.group}>
                <span style={F.label}>Continent</span>
                <select style={F.field} value={continent} onChange={e => setContinent(e.target.value)}>
                  {preset.continents.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={F.group}><span style={F.label}>Bio (HTML, e.g. &lt;p&gt;...&lt;/p&gt;)</span><textarea style={{ ...F.field, resize: 'vertical' as const }} rows={3} value={bio} onChange={e => setBio(e.target.value)} /></div>
            <div style={F.group}><span style={F.label}>Appearance (1 sentence)</span><input style={F.field} value={appearance} onChange={e => setAppearance(e.target.value)} /></div>
            <div style={F.group}><span style={F.label}>Relationships (1 sentence)</span><input style={F.field} value={relationships} onChange={e => setRelationships(e.target.value)} /></div>
            <div style={{ ...F.group, marginBottom: 20 }}><span style={F.label}>Image path (blank = auto)</span><input style={F.field} value={img} onChange={e => setImg(e.target.value)} placeholder={autoImg(name || 'name')} /></div>
          </>
        ) : isCreature ? (
          <>
            <div style={{ display: 'grid' as const, gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 12 }}>
              <div style={F.group}><span style={F.label}>Name *</span><input style={F.field} value={cName} onChange={e => setCName(e.target.value)} /></div>
              <div style={F.group}><span style={F.label}>CR</span><input style={F.field} type="number" min="0" max="30" step="0.125" value={cCr} onChange={e => setCCr(e.target.value)} /></div>
            </div>
            <div style={F.grid2}>
              <div style={F.group}><span style={F.label}>Creature Type</span><input style={F.field} value={cType} onChange={e => setCType(e.target.value)} placeholder="beast" /></div>
              <div style={F.group}>
                <span style={F.label}>Alignment</span>
                <select style={F.field} value={cAlign} onChange={e => setCAlign(e.target.value)}>
                  {ALIGNMENTS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div style={F.group}><span style={F.label}>Bio</span><textarea style={{ ...F.field, resize: 'vertical' as const }} rows={3} value={cBio} onChange={e => setCBio(e.target.value)} /></div>
            <div style={F.group}><span style={F.label}>Image path (blank = auto)</span><input style={F.field} value={cImg} onChange={e => setCImg(e.target.value)} placeholder={autoImg(cName || 'name')} /></div>
            <div style={{ ...F.group, marginBottom: 20 }}>
              <span style={F.label}>Stat Block text (optional — enables full actor in Step 4)</span>
              <textarea style={{ ...F.field, resize: 'vertical' as const }} rows={6} value={cStat} onChange={e => setCStat(e.target.value)} placeholder="Paste raw D&D 5e stat block text here..." />
            </div>
          </>
        ) : isContinent ? (
          <>
            <div style={F.group}><span style={F.label}>Name *</span><input style={F.field} value={ctName} onChange={e => setCtName(e.target.value)} placeholder="e.g. Thornwall" /></div>
            <div style={F.group}><span style={F.label}>Theme</span><input style={F.field} value={ctTheme} onChange={e => setCtTheme(e.target.value)} placeholder="e.g. Dark industrial empire" /></div>
            <div style={F.group}><span style={F.label}>Geography</span><input style={F.field} value={ctGeo} onChange={e => setCtGeo(e.target.value)} placeholder="e.g. Dense forests, volcanic peaks" /></div>
            <div style={F.group}><span style={F.label}>Culture</span><input style={F.field} value={ctCulture} onChange={e => setCtCulture(e.target.value)} placeholder="e.g. Militaristic, honor-bound clans" /></div>
            <div style={{ ...F.group, marginBottom: 20 }}>
              <span style={F.label}>Locations (one per line)</span>
              <textarea style={{ ...F.field, resize: 'vertical' as const }} rows={5} value={ctLocs} onChange={e => setCtLocs(e.target.value)} placeholder={"Capital City\nAncient Ruins\nForbidden Forest"} />
            </div>
          </>
        ) : (
          <>
            <div style={F.grid2}>
              <div style={F.group}><span style={F.label}>Name *</span><input style={F.field} value={jName} onChange={e => setJName(e.target.value)} placeholder="e.g. World Overview" /></div>
              <div style={F.group}>
                <span style={F.label}>Folder</span>
                <select style={F.field} value={jFolder} onChange={e => setJFolder(e.target.value)}>
                  {preset.journalFolders.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={F.label}>Pages</span>
                <button
                  onClick={() => setJPages(p => [...p, { name: '', html: '' }])}
                  style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 11 }}
                >
                  <Plus size={10} /> Add Page
                </button>
              </div>
              {jPages.map((page, i) => (
                <div key={i} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <input
                      style={{ ...F.field, flex: 1 }}
                      value={page.name}
                      onChange={e => setJPages(p => p.map((pg, j) => j === i ? { ...pg, name: e.target.value } : pg))}
                      placeholder={`Page ${i + 1} name`}
                    />
                    <button
                      onClick={() => setJPages(p => p.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', padding: 2, display: 'flex', flexShrink: 0 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <textarea
                    style={{ ...F.field, resize: 'vertical' as const }}
                    rows={3}
                    value={page.html}
                    onChange={e => setJPages(p => p.map((pg, j) => j === i ? { ...pg, html: e.target.value } : pg))}
                    placeholder="<p>Page content HTML...</p>"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 20px', cursor: canSave ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 600, opacity: canSave ? 1 : 0.5 }}
          >
            {target.item ? 'Save Changes' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PRESET VALIDATION ───────────────────────────────────────

function validatePreset(obj: any): string | null {
  const req = ['id','name','description','rootJournalFolderName','creatureFolderName',
               'journalFolders','actorFolders','npcs','creatures','continents','journals']
  for (const k of req) if (!(k in obj)) return `Missing required field: "${k}"`
  if (!Array.isArray(obj.npcs))      return '"npcs" must be an array'
  if (!Array.isArray(obj.creatures)) return '"creatures" must be an array'
  if (!Array.isArray(obj.continents))return '"continents" must be an array'
  if (!Array.isArray(obj.journals))  return '"journals" must be an array'
  return null
}

// ─── MAIN COMPONENT ──────────────────────────────────────────

export default function CampaignBuilder() {
  const [preset, setPreset] = useState<CampaignPreset>(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const obj = JSON.parse(saved)
        if (validatePreset(obj) === null) return obj as CampaignPreset
      }
    } catch {}
    return ELDORIA_PRESET
  })
  const [copied, setCopied] = useState<string | null>(null)

  // Auto-save to localStorage whenever preset changes
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(preset)) } catch {}
  }, [preset])

  // Edit modal
  const [editTarget, setEditTarget] = useState<EditTarget>(null)

  const handleSaveNpc = (npc: NpcDef, originalName?: string) => {
    setPreset(p => ({
      ...p,
      npcs: originalName
        ? p.npcs.map(n => n.name === originalName ? npc : n)
        : [...p.npcs, npc],
    }))
    setEditTarget(null)
  }

  const handleDeleteNpc = (name: string) => {
    if (!confirm(`Delete NPC "${name}"? This cannot be undone.`)) return
    setPreset(p => ({ ...p, npcs: p.npcs.filter(n => n.name !== name) }))
    setNpcResults(prev => prev.filter(r => r.name !== name))
  }

  const handleSaveCreature = (creature: CreatureDef, originalName?: string) => {
    setPreset(p => ({
      ...p,
      creatures: originalName
        ? p.creatures.map(c => c.name === originalName ? creature : c)
        : [...p.creatures, creature],
    }))
    setEditTarget(null)
  }

  const handleDeleteCreature = (name: string) => {
    if (!confirm(`Delete creature "${name}"? This cannot be undone.`)) return
    setPreset(p => ({ ...p, creatures: p.creatures.filter(c => c.name !== name) }))
  }

  const handleSaveContinent = (cont: ContinentDef, originalName?: string) => {
    setPreset(p => ({
      ...p,
      continents: originalName
        ? p.continents.map(c => c.name === originalName ? cont : c)
        : [...p.continents, cont],
      // If renamed, update NPC continent references
      npcs: originalName && originalName !== cont.name
        ? p.npcs.map(n => n.continent === originalName ? { ...n, continent: cont.name } : n)
        : p.npcs,
    }))
    setEditTarget(null)
  }

  const handleDeleteContinent = (name: string) => {
    const npcCount = preset.npcs.filter(n => n.continent === name).length
    const msg = npcCount > 0
      ? `Delete continent "${name}" and its ${npcCount} NPC(s)? This cannot be undone.`
      : `Delete continent "${name}"? This cannot be undone.`
    if (!confirm(msg)) return
    setPreset(p => ({
      ...p,
      continents: p.continents.filter(c => c.name !== name),
      npcs: p.npcs.filter(n => n.continent !== name),
    }))
  }

  const handleSaveJournal = (journal: JournalDef, originalName?: string) => {
    setPreset(p => ({
      ...p,
      journals: originalName
        ? p.journals.map(j => j.name === originalName ? journal : j)
        : [...p.journals, journal],
    }))
    setEditTarget(null)
  }

  const handleDeleteJournal = (name: string) => {
    if (!confirm(`Delete journal "${name}"? This cannot be undone.`)) return
    setPreset(p => ({ ...p, journals: p.journals.filter(j => j.name !== name) }))
  }

  const handleModalSave = (type: 'npc' | 'creature' | 'continent' | 'journal', item: NpcDef | CreatureDef | ContinentDef | JournalDef, originalName?: string) => {
    if      (type === 'npc')       handleSaveNpc(item as NpcDef, originalName)
    else if (type === 'creature')  handleSaveCreature(item as CreatureDef, originalName)
    else if (type === 'continent') handleSaveContinent(item as ContinentDef, originalName)
    else                           handleSaveJournal(item as JournalDef, originalName)
  }

  // Preset management
  const [aiOpen, setAiOpen]           = useState(false)
  const [aiDesc, setAiDesc]           = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError]         = useState('')
  const [importError, setImportError] = useState('')
  const fileInputRef                  = useRef<HTMLInputElement>(null)

  const loadPreset = (p: CampaignPreset) => {
    setPreset(p)
    setNpcResults([])
    setCopied(null)
    setAiOpen(false)
    setAiError('')
    setImportError('')
  }

  const handleAiGenerate = async () => {
    if (!aiDesc.trim()) return
    setAiGenerating(true)
    setAiError('')
    try {
      const json = await generateCampaignPreset(aiDesc)
      // Strip markdown fences if Claude wrapped it anyway
      const clean = json.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      const obj = JSON.parse(clean)
      const err = validatePreset(obj)
      if (err) { setAiError(`Generated JSON is invalid: ${err}`); return }
      loadPreset(obj as CampaignPreset)
    } catch (e: any) {
      setAiError(e.message?.includes('JSON') ? 'Claude returned malformed JSON — try rephrasing your description.' : (e.message ?? 'Generation failed.'))
    } finally {
      setAiGenerating(false)
    }
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${preset.id}-campaign-preset.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result as string)
        const err = validatePreset(obj)
        if (err) { setImportError(err); return }
        loadPreset(obj as CampaignPreset)
      } catch {
        setImportError('Could not parse file — must be valid JSON.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Step 5 — NPC stat block generation
  const [npcResults, setNpcResults]     = useState<NpcResult[]>([])
  const [generating, setGenerating]     = useState(false)
  const [genCurrent, setGenCurrent]     = useState(0)
  const [genCurrentName, setGenCurrentName] = useState('')
  const [rerolling, setRerolling]       = useState<string | null>(null)
  const [copiedStep5, setCopiedStep5]   = useState(false)
  const cancelledRef = useRef(false)

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

  // ── Step 5: generate all NPCs ─────────────────────────────

  const generateAllNpcs = async () => {
    cancelledRef.current = false
    setGenerating(true)
    setNpcResults(preset.npcs.map(n => ({ name: n.name, status: 'pending', accuracy: null, errors: [], actor: null })))

    for (let i = 0; i < preset.npcs.length; i++) {
      if (cancelledRef.current) break
      const npc = preset.npcs[i]
      setGenCurrent(i + 1)
      setGenCurrentName(npc.name)
      setNpcResults(prev => prev.map(r => r.name === npc.name ? { ...r, status: 'generating' } : r))

      try {
        const text = await generateStatBlockFromName(npc.name, 'a homebrew campaign setting', buildNpcContext(npc))
        const { errors, warnings, stats, actor } = parseStatBlock(text)
        const defaultedFields = (stats?.fields ?? []).filter((f: any) => f.method === 'default').map((f: any) => f.name)
        const allErrors = [...errors, ...(defaultedFields.length ? [`Used defaults for: ${defaultedFields.join(', ')}`] : [])]
        setNpcResults(prev => prev.map(r =>
          r.name === npc.name
            ? { ...r, status: errors.length ? 'error' : 'done', accuracy: (stats as any)?.accuracy ?? null, errors: allErrors, actor: actor ?? null }
            : r
        ))
      } catch (err: any) {
        setNpcResults(prev => prev.map(r =>
          r.name === npc.name ? { ...r, status: 'error', errors: [`Generation failed: ${err.message}`] } : r
        ))
      }
    }

    setGenerating(false)
    setGenCurrent(0)
    setGenCurrentName('')
  }

  const rerollNpc = async (npcName: string) => {
    const npc = preset.npcs.find(n => n.name === npcName)
    if (!npc) return
    setRerolling(npcName)
    setNpcResults(prev => prev.map(r => r.name === npcName ? { ...r, status: 'generating', errors: [] } : r))

    try {
      const text = await generateStatBlockFromName(npc.name, 'a homebrew campaign setting', buildNpcContext(npc))
      const { errors, warnings, stats, actor } = parseStatBlock(text)
      const defaultedFields = (stats?.fields ?? []).filter((f: any) => f.method === 'default').map((f: any) => f.name)
      const allErrors = [...errors, ...(defaultedFields.length ? [`Used defaults for: ${defaultedFields.join(', ')}`] : [])]
      setNpcResults(prev => prev.map(r =>
        r.name === npcName
          ? { ...r, status: errors.length ? 'error' : 'done', accuracy: (stats as any)?.accuracy ?? null, errors: allErrors, actor: actor ?? null }
          : r
      ))
    } catch (err: any) {
      setNpcResults(prev => prev.map(r =>
        r.name === npcName ? { ...r, status: 'error', errors: [`Generation failed: ${err.message}`] } : r
      ))
    }
    setRerolling(null)
  }

  const copyStep5Macro = () => {
    const script = buildStep5Macro(npcResults)
    if (!script) return
    if (navigator.clipboard) {
      navigator.clipboard.writeText(script).catch(() => fallbackCopy(script))
    } else {
      fallbackCopy(script)
    }
    setCopiedStep5(true)
    setTimeout(() => setCopiedStep5(false), 2000)
  }

  const doneCount  = npcResults.filter(r => r.status === 'done').length
  const errorCount = npcResults.filter(r => r.status === 'error').length
  const step5Ready = doneCount > 0

  return (
    <div style={S.page}>
      <Sidebar
        preset={preset}
        onEditNpc={npc => setEditTarget({ type: 'npc', item: npc })}
        onDeleteNpc={handleDeleteNpc}
        onAddNpc={continent => setEditTarget({ type: 'npc', item: null, continent })}
        onEditCreature={c => setEditTarget({ type: 'creature', item: c })}
        onDeleteCreature={handleDeleteCreature}
        onAddCreature={() => setEditTarget({ type: 'creature', item: null })}
        onEditContinent={c => setEditTarget({ type: 'continent', item: c })}
        onDeleteContinent={handleDeleteContinent}
        onAddContinent={() => setEditTarget({ type: 'continent', item: null })}
        onEditJournal={j => setEditTarget({ type: 'journal', item: j })}
        onDeleteJournal={handleDeleteJournal}
        onAddJournal={() => setEditTarget({ type: 'journal', item: null })}
      />

      {editTarget && (
        <EditModal target={editTarget} preset={preset} onSave={handleModalSave} onClose={() => setEditTarget(null)} />
      )}

      <div style={S.main}>
        {/* Campaign header banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
          <div>
            <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 20, lineHeight: 1.2 }}>{preset.name}</div>
            <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{preset.description}</div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#475569', flexShrink: 0 }}>
            <span><span style={{ color: '#94a3b8', fontWeight: 600 }}>{preset.npcs.length}</span> NPCs</span>
            <span><span style={{ color: '#94a3b8', fontWeight: 600 }}>{preset.creatures.length}</span> Creatures</span>
            <span><span style={{ color: '#94a3b8', fontWeight: 600 }}>{preset.continents.length}</span> Continents</span>
            <span><span style={{ color: '#94a3b8', fontWeight: 600 }}>{preset.journals.length}</span> Journals</span>
          </div>
        </div>

        {/* Preset Management Panel */}
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={S.h2}>Campaign Preset</span>
              <span style={S.tag('#a78bfa')}>{preset.id}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {preset.id !== 'eldoria' && (
                <button
                  onClick={() => loadPreset(ELDORIA_PRESET)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#1e3a5f', color: '#7dd3fc', border: '1px solid #1d4ed8', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}
                >
                  Load Demo (Eldoria)
                </button>
              )}
              <button
                onClick={() => { if (confirm('Reset campaign to defaults? All unsaved edits will be lost.')) loadPreset(preset.id === 'eldoria' ? ELDORIA_PRESET : BLANK_PRESET) }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#0f172a', color: '#64748b', border: '1px solid #1e293b', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}
                title="Discard all edits and reload the original preset"
              >
                Reset
              </button>
              <button
                onClick={() => { setAiOpen(o => !o); setAiError('') }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: aiOpen ? '#4c1d95' : '#2e1065', color: '#c4b5fd', border: '1px solid #6d28d9', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}
              >
                <Sparkles size={12} />
                {aiOpen ? 'Close AI Generator' : 'AI Generate'}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#0f172a', color: '#94a3b8', border: '1px solid #334155', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}
              >
                <Upload size={12} />
                Import JSON
              </button>
              <button
                onClick={handleExport}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#0f172a', color: '#94a3b8', border: '1px solid #334155', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}
              >
                <Download size={12} />
                Export JSON
              </button>
              <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
            </div>
          </div>

          {importError && (
            <div style={{ color: '#f87171', background: '#7f1d1d20', border: '1px solid #7f1d1d', borderRadius: 6, padding: '7px 12px', fontSize: 12, marginTop: 10 }}>
              ✗ {importError}
            </div>
          )}

          {aiOpen && (
            <div style={{ borderTop: '1px solid #334155', paddingTop: 16, marginTop: 14 }}>
              <div style={{ ...S.muted, marginBottom: 10 }}>
                Describe your campaign setting — genre, tone, geography, factions, key themes. Claude generates a complete preset with continents, NPCs, creatures, and journals.
              </div>
              <textarea
                value={aiDesc}
                onChange={e => setAiDesc(e.target.value)}
                placeholder="e.g. A grimdark steampunk world with three warring city-states, clockwork constructs as enemies, and noble houses vying for magical fuel sources..."
                rows={5}
                style={{ width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '8px 12px', fontSize: 13, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' as const }}
              />
              {aiError && (
                <div style={{ color: '#f87171', background: '#7f1d1d20', border: '1px solid #7f1d1d', borderRadius: 6, padding: '7px 12px', fontSize: 12, marginTop: 8 }}>
                  ✗ {aiError}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <button
                  onClick={handleAiGenerate}
                  disabled={aiGenerating || !aiDesc.trim() || !hasApiKey()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: aiGenerating ? '#4c1d95' : '#7c3aed',
                    color: '#fff', border: 'none', borderRadius: 6,
                    padding: '7px 18px', cursor: aiGenerating ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: 600, opacity: (!aiDesc.trim() || !hasApiKey()) ? 0.5 : 1,
                  }}
                >
                  <Sparkles size={14} />
                  {aiGenerating ? 'Generating…' : 'Generate Campaign'}
                </button>
                {!hasApiKey() && (
                  <span style={{ color: '#fcd34d', fontSize: 12 }}>⚠ API key required — open Settings (⚙)</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{ ...S.cardAccent('#065f46'), background: '#052e1620', marginBottom: 24 }}>
          <div style={{ ...S.h2, color: '#86efac', marginBottom: 8 }}>How to Import into Foundry VTT</div>
          <ol style={{ color: '#94a3b8', fontSize: 13, margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Upload creature/NPC portrait images to Foundry's file manager under <code style={{ color: '#a78bfa' }}>worlds/{preset.id}/assets/</code></li>
            <li>Open a Foundry macro (Ctrl+M), paste <strong>Step 1</strong>, and run it to create all folders</li>
            <li>Paste and run <strong>Step 2</strong> to create all journal entries with world lore</li>
            <li>Paste and run each <strong>Step 3</strong> continent macro to create NPC leader actors</li>
            <li>Paste and run <strong>Step 4</strong> to create all creature actors — uses "Copy Macro" button for full stat blocks, "Stubs only" for bio-only actors</li>
            <li>Use <strong>Step 5</strong> below to generate full NPC stat blocks via AI, then run the macro to update each leader actor</li>
          </ol>
          <div style={{ color: '#4ade80', fontSize: 12, marginTop: 10 }}>✓ All macros are <strong>update-in-place safe</strong> — re-running any step will update existing actors/folders rather than creating duplicates.</div>
          <div style={{ color: '#fcd34d', fontSize: 12, marginTop: 6 }}>⚠ Do not rename actors or folders in Foundry after importing — macros find them by name. Rename here in the Campaign Builder instead, then re-run the relevant step.</div>
          <div style={{ ...S.muted, marginTop: 6 }}>Run steps in order — Steps 2–5 look up folders and actors by name created in prior steps.</div>
        </div>

        {/* Step 1 */}
        <StepCard
          step="Step 1" accent="#22c55e"
          title="Create Folder Structure"
          description={`Creates ${preset.journalFolders.length} journal folders and ${preset.actorFolders.length} actor folders in Foundry.`}
          macro={buildStep1Macro(preset)} id="step1" copied={copied} onCopy={copy}
        />

        {/* Step 2 */}
        <StepCard
          step="Step 2" accent="#38bdf8"
          title="Create Journal Entries"
          description="Creates World Overview (5 pages), 7 continent journals (3 pages each), faction journals (Ragorans, Shadow Cult, LUKAS), and plot journals."
          macro={buildStep2Macro(preset)} id="step2" copied={copied} onCopy={copy}
        />

        {/* Step 3 — per continent */}
        <div style={S.cardAccent('#f59e0b')}>
          <div style={{ ...S.h2, color: '#fcd34d', marginBottom: 4 }}>Step 3 — Create NPC Leaders</div>
          <div style={{ ...S.muted, marginBottom: 16 }}>
            One macro per continent — each creates that continent's leader actors with full bios, race, class, CR, and image paths.
            Run the macro for each continent separately.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
            {preset.continents.map(c => {
              const npcs = preset.npcs.filter(n => n.continent === c.name)
              const id = `step3-${c.name}`
              return (
                <div key={c.name} style={{ background: '#0f172a', borderRadius: 6, padding: 14, border: '1px solid #334155' }}>
                  <div style={{ ...S.h3, marginBottom: 4 }}>{c.name}</div>
                  <div style={{ ...S.muted, marginBottom: 10 }}>
                    {npcs.map(n => n.name.split(' ').slice(-1)[0]).join(' · ')} ({npcs.length} actors)
                  </div>
                  <CopyButton text={buildStep3Macro(c.name, preset)} id={id} copied={copied} onCopy={copy} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Step 4 */}
        {(() => {
          const statCount = preset.creatures.filter(c => c.statText).length
          const fullMacro = buildStep4StatsMacro(preset)
          return (
            <div style={S.cardAccent('#f87171')}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={S.tag('#f87171')}>Step 4</span>
                    <span style={{ ...S.h2, marginBottom: 0 }}>Create Creature Actors</span>
                    <span style={{ ...S.tag('#b91c1c'), fontSize: 10 }}>Phase 14c</span>
                  </div>
                  <div style={S.muted}>
                    Creates all {preset.creatures.length} creature actors in the {preset.creatureFolderName} folder.
                    <span style={{ color: '#fca5a5', marginLeft: 6 }}>
                      {statCount}/{preset.creatures.length} have full stat blocks embedded.
                    </span>
                  </div>
                </div>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <CopyButton text={fullMacro} id="step4-stats" copied={copied} onCopy={copy} />
                  <button
                    onClick={() => copy(buildStep4Macro(preset), 'step4-stubs')}
                    style={{ ...S.copyBtn(copied === 'step4-stubs'), fontSize: 11 }}
                  >
                    {copied === 'step4-stubs' ? <Check size={12} /> : <Copy size={12} />}
                    {copied === 'step4-stubs' ? 'Copied!' : 'Stubs only'}
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Step 5 — AI Stat Block Generation */}
        <div style={S.cardAccent('#8b5cf6')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={S.tag('#8b5cf6')}>Step 5</span>
            <span style={{ ...S.h2, marginBottom: 0 }}>Generate NPC Stat Blocks</span>
            <span style={{ ...S.tag('#6d28d9'), fontSize: 10 }}>AI · Phase 14</span>
          </div>
          <div style={{ ...S.muted, marginBottom: 16 }}>
            Uses Claude AI to generate a full D&D 5e stat block for each of the {preset.npcs.length} NPC leaders using their race, class, CR, and biography as context.
            Run the resulting macro to patch existing actor stubs from Steps 3 with full stat blocks.
          </div>

          {!hasApiKey() && (
            <div style={{ color: '#fcd34d', background: '#451a0330', border: '1px solid #92400e', borderRadius: 6, padding: '8px 12px', fontSize: 12, marginBottom: 12 }}>
              ⚠ No API key configured — open Settings (⚙) in the parser tool to add your Claude key before generating.
            </div>
          )}

          {/* Progress bar */}
          {generating && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ ...S.muted, color: '#a78bfa' }}>
                  Generating {genCurrent} of {preset.npcs.length} — <strong style={{ color: '#c4b5fd' }}>{genCurrentName}</strong>
                </span>
                <button
                  onClick={() => { cancelledRef.current = true }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 11 }}
                >
                  <X size={12} /> Cancel
                </button>
              </div>
              <div style={{ background: '#1e293b', borderRadius: 4, height: 6 }}>
                <div style={{ background: '#7c3aed', height: 6, borderRadius: 4, width: `${(genCurrent / preset.npcs.length) * 100}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, marginBottom: npcResults.length ? 16 : 0, flexWrap: 'wrap' }}>
            <button
              onClick={generateAllNpcs}
              disabled={generating || !hasApiKey()}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: generating ? '#4c1d95' : '#7c3aed',
                color: '#fff', border: 'none', borderRadius: 6,
                padding: '7px 16px', cursor: generating ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 600, opacity: !hasApiKey() ? 0.4 : 1,
              }}
            >
              <Sparkles size={14} />
              {generating ? `Generating ${genCurrent}/${preset.npcs.length}…` : `Generate All ${preset.npcs.length} NPCs`}
            </button>

            {step5Ready && (
              <button
                onClick={copyStep5Macro}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: copiedStep5 ? '#065f46' : '#1e3a5f',
                  color: '#fff', border: `1px solid ${copiedStep5 ? '#059669' : '#2563eb'}`,
                  borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}
              >
                {copiedStep5 ? <Check size={14} /> : <Copy size={14} />}
                {copiedStep5 ? 'Copied!' : `Copy Step 5 Macro (${doneCount} NPCs)`}
              </button>
            )}
          </div>

          {/* Summary */}
          {npcResults.length > 0 && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12 }}>
              <span style={{ color: '#4ade80' }}>✓ {doneCount} ready</span>
              <span style={{ color: '#f87171' }}>✗ {errorCount} failed</span>
              <span style={{ color: '#94a3b8' }}>
                {npcResults.filter(r => r.status === 'pending').length} pending ·{' '}
                {npcResults.filter(r => r.status === 'generating').length > 0 ? '1 generating' : ''}
              </span>
            </div>
          )}

          {/* NPC result grid — grouped by continent */}
          {npcResults.length > 0 && preset.continents.map(c => {
            const continentNpcs = npcResults.filter(r => {
              const npc = preset.npcs.find(n => n.name === r.name)
              return npc?.continent === c.name
            })
            if (!continentNpcs.length) return null
            return (
              <div key={c.name} style={{ marginBottom: 12 }}>
                <div style={{ ...S.muted, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>{c.name}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {continentNpcs.map(r => (
                    <div
                      key={r.name}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: '#0f172a', borderRadius: 4, padding: '6px 10px',
                        border: `1px solid ${r.status === 'done' ? '#166534' : r.status === 'error' ? '#7f1d1d' : '#334155'}`,
                      }}
                    >
                      {/* Status icon */}
                      {r.status === 'done'      && <CheckCircle size={13} color="#4ade80" />}
                      {r.status === 'error'     && <XCircle size={13} color="#f87171" />}
                      {r.status === 'generating' && <RefreshCw size={13} color="#a78bfa" style={{ animation: 'spin 1s linear infinite' }} />}
                      {r.status === 'pending'   && <span style={{ width: 13, height: 13, borderRadius: '50%', background: '#334155', display: 'inline-block' }} />}

                      {/* Name */}
                      <span style={{ color: '#e2e8f0', fontSize: 12, flex: 1 }}>{r.name}</span>

                      {/* Accuracy badge */}
                      {r.accuracy !== null && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                          background: r.accuracy >= 80 ? '#166534' : r.accuracy >= 60 ? '#713f12' : '#7f1d1d',
                          color: r.accuracy >= 80 ? '#4ade80' : r.accuracy >= 60 ? '#fcd34d' : '#f87171',
                        }}>{r.accuracy}%</span>
                      )}

                      {/* Errors */}
                      {r.errors.length > 0 && r.status === 'error' && (
                        <span style={{ color: '#f87171', fontSize: 10 }} title={r.errors.join('; ')}>
                          <AlertTriangle size={11} />
                        </span>
                      )}

                      {/* Reroll button */}
                      {(r.status === 'done' || r.status === 'error') && (
                        <button
                          onClick={() => rerollNpc(r.name)}
                          disabled={!!rerolling || generating}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            background: 'none', border: '1px solid #4c1d95',
                            color: '#a78bfa', borderRadius: 4, padding: '2px 7px',
                            cursor: 'pointer', fontSize: 10, opacity: rerolling ? 0.4 : 1,
                          }}
                          title="Regenerate this stat block"
                        >
                          <RefreshCw size={10} className={rerolling === r.name ? 'animate-spin' : ''} />
                          {rerolling === r.name ? '…' : 'Reroll'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <div style={{ ...S.card, background: '#0f172a' }}>
          <div style={S.h3}>After Import</div>
          <ul style={{ color: '#64748b', fontSize: 12, margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
            <li>All macros are update-in-place safe — re-running creates only new entries, updates existing ones</li>
            <li>To add a new NPC: add them here → Export JSON → re-run the Step 3 macro for their continent</li>
            <li>Never rename actors or folders in Foundry — rename them here and re-run the macro instead</li>
            <li>Images show as broken until uploaded to <code style={{ color: '#a78bfa' }}>worlds/{preset.id}/assets/</code></li>
            <li>Use Reroll on any NPC whose stat block doesn't match expectations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
