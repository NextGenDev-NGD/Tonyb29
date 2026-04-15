// character-options.tsx
// Phase 19 — Character Options: Subclass, Species, Background creators
// Tab 8 — outputs Foundry VTT dnd5e v4+ items + import macros

import React, { useState } from 'react'
import { Copy, Plus, Trash2, Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
import { generateSubclassSpec, hasApiKey } from './claude-api'

// ── Helpers ───────────────────────────────────────────────────────────────────
const _djb2 = (s: string) => {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0
  return h.toString(36).padStart(7, '0').slice(0, 7)
}
const makeId = (...parts: string[]) => {
  const k = parts.join('').toLowerCase().replace(/[\s']/g, '')
  return (_djb2(k) + _djb2(k + '~')).slice(0, 16).padEnd(16, '0')
}
const toSlug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ── Known Classes ─────────────────────────────────────────────────────────────
const STANDARD_CLASSES = [
  { label: 'Barbarian',  value: 'barbarian'  },
  { label: 'Bard',       value: 'bard'       },
  { label: 'Cleric',     value: 'cleric'     },
  { label: 'Druid',      value: 'druid'      },
  { label: 'Fighter',    value: 'fighter'    },
  { label: 'Monk',       value: 'monk'       },
  { label: 'Paladin',    value: 'paladin'    },
  { label: 'Ranger',     value: 'ranger'     },
  { label: 'Rogue',      value: 'rogue'      },
  { label: 'Sorcerer',   value: 'sorcerer'   },
  { label: 'Warlock',    value: 'warlock'    },
  { label: 'Wizard',     value: 'wizard'     },
  { label: '— Custom —', value: '__custom__' },
]

// ── Types ─────────────────────────────────────────────────────────────────────
interface SubclassFeature {
  id: string
  level: number
  name: string
  description: string
  recharge: string  // '' | 'sr' | 'lr' | '5-6' etc
}

interface DomainSpellTier {
  level: number   // cleric level when granted (1, 3, 5, 7, 9)
  spells: string  // comma-separated spell names
}

interface SubclassSpec {
  name: string
  classIdentifier: string
  description: string
  features: SubclassFeature[]
  domainSpells: DomainSpellTier[]
}

// ── Foundry JSON Builders ─────────────────────────────────────────────────────
function buildSubclassItem(spec: SubclassSpec): object {
  const id = makeId(spec.name, 'subclass')
  const identifier = toSlug(spec.name)

  // Build domain spells HTML table if present
  const domainSpellsHtml = spec.domainSpells.length > 0 ? `
<h3>Domain Spells</h3>
<table>
<thead><tr><th>Cleric Level</th><th>Spells</th></tr></thead>
<tbody>
${spec.domainSpells.filter(t => t.spells.trim()).map(t =>
  `<tr><td>${t.level}${t.level === 1 ? 'st' : t.level === 3 ? 'rd' : 'th'}</td><td>${t.spells}</td></tr>`
).join('\n')}
</tbody>
</table>` : ''

  const descHtml = (spec.description ? `<p>${spec.description}</p>` : '') + domainSpellsHtml

  return {
    _id: id,
    name: spec.name,
    type: 'subclass',
    system: {
      description: { value: descHtml },
      identifier,
      classIdentifier: spec.classIdentifier,
      spellcasting: { progression: 'none', ability: '' },
      advancement: [],
    },
    flags: {},
    effects: [],
  }
}

function buildFeatureItem(feature: SubclassFeature, subclassName: string, className: string): object {
  const id = makeId(subclassName, feature.name, 'feat')
  const rechargeLabel = feature.recharge
    ? ` (Recharge ${feature.recharge === 'sr' ? 'Short Rest' : feature.recharge === 'lr' ? 'Long Rest' : feature.recharge})`
    : ''

  // sr/lr → period-based recovery, formula must be empty string (not 'sr'/'lr')
  // recharge 5-6 → period:'recharge', formula is the minimum roll number only
  const uses = (() => {
    if (!feature.recharge) return { value: null, max: null, per: null, recovery: [] }
    if (feature.recharge === 'sr') return { value: 1, max: '1', per: null, recovery: [{ period: 'sr', type: 'recoverAll', formula: '' }] }
    if (feature.recharge === 'lr') return { value: 1, max: '1', per: null, recovery: [{ period: 'lr', type: 'recoverAll', formula: '' }] }
    // recharge 5-6, 4-6, 6 — formula is the minimum number (e.g. "5" for 5-6)
    const minRoll = feature.recharge.split('-')[0]
    return { value: 1, max: '1', per: null, recovery: [{ period: 'recharge', type: 'recoverAll', formula: minRoll }] }
  })()

  return {
    _id: id,
    name: feature.name,
    type: 'feat',
    system: {
      description: { value: `<p>${feature.description}</p>` },
      type: { value: 'class', subtype: '' },
      requirements: `${className} (${subclassName}) ${feature.level}${feature.level === 1 ? 'st' : feature.level === 2 ? 'nd' : feature.level === 3 ? 'rd' : 'th'} level`,
      activation: { type: feature.recharge ? 'action' : '', cost: feature.recharge ? 1 : null, condition: '' },
      uses,
    },
    flags: {},
    effects: [],
  }
}

function buildMacro(spec: SubclassSpec, actorName: string): string {
  const className = STANDARD_CLASSES.find(c => c.value === spec.classIdentifier)?.label ?? spec.classIdentifier
  const featureItems = spec.features.map(f => buildFeatureItem(f, spec.name, className))

  // Strip _ids — Foundry assigns real world IDs after creation
  const featureDataForMacro = featureItems.map(({ _id, ...rest }: any) => rest)
  const featureLevelsByName = spec.features.reduce((acc, f) => {
    acc[f.name] = f.level
    return acc
  }, {} as Record<string, number>)

  const subclassBase = buildSubclassItem(spec)
  const subclassBaseForMacro = (({ _id, ...rest }: any) => rest)(subclassBase)

  const featureItemsJson = JSON.stringify(featureDataForMacro, null, 2)
  const subclassBaseJson = JSON.stringify(subclassBaseForMacro, null, 2)
  const featureLevelsJson = JSON.stringify(featureLevelsByName)

  const domainSpellsBlock = spec.domainSpells.length > 0 ? `
  // ── Step 3: Look up domain spells across all installed compendium packs ───
  // Searches dnd5e.spells first, then all other Item packs (Tasha's, Xanathar's, etc.)
  // Falls back to creating a stub spell item if not found anywhere.
  const domainTiers = ${JSON.stringify(spec.domainSpells.filter(t => t.spells.trim()).map(t => ({
    level: t.level,
    spells: t.spells.split(',').map((s: string) => s.trim()).filter(Boolean),
  })))};

  // Build combined spell index: SRD first, then all other item packs
  const allSpellPacks = [
    game.packs.get('dnd5e.spells'),
    ...game.packs.filter(p => p.documentName === 'Item' && p.collection !== 'dnd5e.spells'),
  ].filter(Boolean);
  const packIndexes = [];
  for (const pack of allSpellPacks) {
    const idx = await pack.getIndex({ fields: ['name', 'type'] });
    packIndexes.push({ pack, idx });
  }

  const findSpellUuid = (name) => {
    const lower = name.toLowerCase();
    for (const { pack, idx } of packIndexes) {
      const entry = idx.find(i => i.type === 'spell' && i.name.toLowerCase() === lower);
      if (entry) return \`Compendium.\${pack.collection}.Item.\${entry._id}\`;
    }
    return null;
  };

  // Stub folder for any spells not found in any compendium
  let stubFolder = null;
  const domainAdvancement = [];

  for (const tier of domainTiers) {
    const spellLevel = Math.ceil(tier.level / 2); // cleric lvl 1→sl1, 3→sl2, 5→sl3, 7→sl4, 9→sl5
    const spellItems = [];
    for (const spellName of tier.spells) {
      const uuid = findSpellUuid(spellName);
      if (uuid) {
        spellItems.push({ uuid, optional: false });
        console.log(\`\${spellName}: found in compendium\`);
      } else {
        // Create stub spell item in world
        if (!stubFolder) {
          stubFolder = game.folders.getName('${spec.name} Stub Spells') ??
            await Folder.create({ name: '${spec.name} Stub Spells', type: 'Item', color: '#7c2d12', folder: mainFolder.id });
        }
        const stubData = {
          name: spellName,
          type: 'spell',
          system: {
            description: { value: '<p><em>Stub — spell not found in any installed compendium. Fill in details from the sourcebook.</em></p>' },
            level: spellLevel,
            school: 'trs',
            preparation: { mode: 'always', prepared: true },
            components: { vocal: false, somatic: false, material: false, ritual: false, concentration: false },
            materials: { value: '', consumed: false, cost: 0, supply: 0 },
            activation: { type: 'action', cost: 1, condition: '' },
            duration: { value: '', units: 'inst' },
            target: { value: null, width: null, units: '', type: '' },
            range: { value: null, long: null, units: '' },
            uses: { value: null, max: null, per: null, recovery: [] },
            damage: { parts: [], versatile: '' },
            save: { ability: '', dc: null, scaling: 'spell' },
            scaling: { mode: 'none', formula: '' },
          },
          flags: {}, effects: [],
        };
        const stubItem = await Item.create({ ...stubData, folder: stubFolder.id });
        spellItems.push({ uuid: stubItem.uuid, optional: false });
        console.warn(\`\${spellName}: not found in any compendium — stub created\`);
        ui.notifications.warn(\`\${spellName} not found in compendiums — stub created. Fill in details manually.\`);
      }
    }
    if (spellItems.length) {
      domainAdvancement.push({
        _id: foundry.utils.randomID(),
        type: 'ItemGrant',
        configuration: {
          items: spellItems,
          spell: { ability: [], preparation: 'always', uses: { max: '', per: null } },
          optional: false,
        },
        value: {},
        level: tier.level,
        title: 'Domain Spells',
      });
    }
  }` : '\n  const domainAdvancement = [];'

  const actorLine = actorName.trim()
    ? `
  // ── Step 5: Give subclass to actor ───────────────────────────────────────
  const actor = game.actors.getName(${JSON.stringify(actorName.trim())});
  if (!actor) { ui.notifications.error("Actor '${actorName.trim()}' not found."); return; }
  const existingOnActor = actor.items.getName(subclassWithAdv.name);
  if (existingOnActor) {
    await existingOnActor.update({ system: subclassWithAdv.system });
    ui.notifications.info('${spec.name} subclass updated on ' + actor.name);
  } else {
    await actor.createEmbeddedDocuments('Item', [subclassWithAdv]);
    ui.notifications.info('${spec.name} subclass added to ' + actor.name);
  }`
    : `
  // ── Step 5: Create subclass in Items sidebar ──────────────────────────────
  const existingSub = game.items.getName(subclassWithAdv.name);
  if (existingSub) {
    await existingSub.update({ system: subclassWithAdv.system });
    ui.notifications.info('${spec.name} subclass updated in Items sidebar.');
  } else {
    await Item.create({ ...subclassWithAdv, folder: mainFolder.id });
    ui.notifications.info('${spec.name} subclass created in Items sidebar.');
  }`

  return `// ${spec.name} — Subclass Import Macro
// Generated by DM VTT Toolkit — dm-vtt-toolkit.halfasliceofchez.workers.dev
// Parent class: ${className} (classIdentifier: "${spec.classIdentifier}")
// Features: ${spec.features.map(f => `${f.name} (lvl ${f.level})`).join(', ')}

(async () => {
  // ── Step 1: Create folder structure ──────────────────────────────────────
  // Structure: Subclasses/${spec.name}/ → subclass item
  //            Subclasses/${spec.name}/Features/ → all feature items
  const subclassesRoot = game.folders.getName('Subclasses') ??
    await Folder.create({ name: 'Subclasses', type: 'Item', color: '#4338ca' });
  const mainFolder = game.folders.find(f => f.name === '${spec.name}' && f.folder?.id === subclassesRoot.id) ??
    await Folder.create({ name: '${spec.name}', type: 'Item', color: '#1e3a5f', folder: subclassesRoot.id });
  const featFolder = game.folders.find(f => f.name === 'Features' && f.folder?.id === mainFolder.id) ??
    await Folder.create({ name: 'Features', type: 'Item', color: '#0f2940', folder: mainFolder.id });
  if (!featFolder) { ui.notifications.error('${spec.name}: folder creation failed.'); return; }

  // ── Step 2: Batch-create all feature items (Foundry assigns real UUIDs) ──
  const featureData = ${featureItemsJson};
  const featureLevels = ${featureLevelsJson};
  const createdFeatures = featureData.length
    ? await Item.create(featureData.map(i => ({ ...i, folder: featFolder.id })))
    : [];
  const byName = Object.fromEntries((createdFeatures ?? []).map(i => [i.name, i.uuid]));
  console.log('${spec.name}: created features', Object.keys(byName));
${domainSpellsBlock}

  // ── Step 4: Build advancement entries using real UUIDs ───────────────────
  const featureAdvancement = Object.entries(byName).map(([name, uuid]) => ({
    _id: foundry.utils.randomID(),
    type: 'ItemGrant',
    configuration: {
      items: [{ uuid, optional: false }],
      spell: null,
      optional: false,
    },
    value: {},
    level: featureLevels[name] ?? 1,
    title: '',
  }));

  // ── Wire advancement into subclass and create it ──────────────────────────
  const subclassBase = ${subclassBaseJson};
  const subclassWithAdv = {
    ...subclassBase,
    system: {
      ...subclassBase.system,
      advancement: [...featureAdvancement, ...domainAdvancement],
    },
  };
${actorLine}
})();`
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  card:  { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 16, marginBottom: 12 } as const,
  label: { display: 'block', fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 4 } as const,
  input: { width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' as const } as const,
  textarea: { width: '100%', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box' as const, resize: 'vertical' as const } as const,
  select: { background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, padding: '7px 10px', fontSize: 13 } as const,
  btn: (bg: string) => ({ background: bg, border: 'none', borderRadius: 6, color: '#fff', padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 } as const),
  code: { background: '#0d1117', border: '1px solid #1e293b', borderRadius: 6, padding: 12, fontFamily: 'monospace', fontSize: 11, color: '#94a3b8', whiteSpace: 'pre' as const, overflowX: 'auto' as const, maxHeight: 360, overflowY: 'auto' as const } as const,
}

const uid = () => Math.random().toString(36).slice(2, 10)

const DOMAIN_TIERS: DomainSpellTier[] = [
  { level: 1, spells: '' }, { level: 3, spells: '' },
  { level: 5, spells: '' }, { level: 7, spells: '' },
  { level: 9, spells: '' },
]

// ── Subclass Creator ──────────────────────────────────────────────────────────
function SubclassCreator() {
  // Form state
  const [name, setName]                   = useState('')
  const [classKey, setClassKey]           = useState('cleric')
  const [customClass, setCustomClass]     = useState('')
  const [description, setDescription]    = useState('')
  const [features, setFeatures]           = useState<SubclassFeature[]>([
    { id: uid(), level: 1, name: '', description: '', recharge: '' },
  ])
  const [showDomain, setShowDomain]       = useState(false)
  const [domainSpells, setDomainSpells]   = useState<DomainSpellTier[]>(DOMAIN_TIERS.map(t => ({ ...t })))
  const [actorName, setActorName]         = useState('')

  // AI state
  const [aiMode, setAiMode]             = useState(false)
  const [aiPrompt, setAiPrompt]         = useState('')
  const [aiLoading, setAiLoading]       = useState(false)

  // Output state
  const [macro, setMacro]             = useState('')
  const [copied, setCopied]           = useState(false)
  const [error, setError]             = useState('')

  const classIdentifier = classKey === '__custom__' ? toSlug(customClass) : classKey
  const className = STANDARD_CLASSES.find(c => c.value === classKey)?.label ?? customClass

  function addFeature() {
    setFeatures(f => [...f, { id: uid(), level: 1, name: '', description: '', recharge: '' }])
  }
  function removeFeature(id: string) {
    setFeatures(f => f.filter(x => x.id !== id))
  }
  function updateFeature(id: string, field: keyof SubclassFeature, value: any) {
    setFeatures(f => f.map(x => x.id === id ? { ...x, [field]: value } : x))
  }
  function updateDomainSpell(level: number, spells: string) {
    setDomainSpells(d => d.map(t => t.level === level ? { ...t, spells } : t))
  }

  function buildSpec(): SubclassSpec {
    return {
      name: name.trim(),
      classIdentifier,
      description: description.trim(),
      features: features.filter(f => f.name.trim()),
      domainSpells: showDomain ? domainSpells : [],
    }
  }

  function handleBuild() {
    if (!name.trim()) { setError('Subclass name is required.'); return }
    if (!classIdentifier) { setError('Parent class is required.'); return }
    setError('')
    const spec = buildSpec()
    setMacro(buildMacro(spec, actorName))
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return
    if (!hasApiKey()) { setError('No API key — open Settings (⚙) to add your key.'); return }
    setError(''); setAiLoading(true)
    try {
      const raw = await generateSubclassSpec(aiPrompt.trim(), classIdentifier || undefined)
      const spec: SubclassSpec = JSON.parse(raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim())
      // Populate form
      setName(spec.name ?? '')
      if (spec.classIdentifier) {
        const match = STANDARD_CLASSES.find(c => c.value === spec.classIdentifier)
        if (match && match.value !== '__custom__') {
          setClassKey(spec.classIdentifier)
        } else {
          setClassKey('__custom__')
          setCustomClass(spec.classIdentifier)
        }
      }
      setDescription(spec.description ?? '')
      setFeatures((spec.features ?? []).map(f => ({ ...f, id: uid(), recharge: f.recharge ?? '' })))
      if (spec.domainSpells?.length) {
        setShowDomain(true)
        setDomainSpells(DOMAIN_TIERS.map(t => {
          const match = spec.domainSpells.find(d => d.level === t.level)
          return match ? { ...t, spells: match.spells } : t
        }))
      }
      // Auto-build macro
      setMacro(buildMacro(spec, actorName))
    } catch (e: any) {
      setError(`AI generation failed: ${e.message}`)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleCopy() {
    try { await navigator.clipboard.writeText(macro) }
    catch { document.execCommand('copy') }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px' }}>

      {/* AI Generate toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setAiMode(false)} style={{
          ...S.btn(aiMode ? '#1e293b' : '#4338ca'),
          border: aiMode ? '1px solid #334155' : 'none',
        }}>Manual</button>
        <button onClick={() => setAiMode(true)} style={{
          ...S.btn(aiMode ? '#7c3aed' : '#1e293b'),
          border: aiMode ? 'none' : '1px solid #334155',
        }}><Sparkles size={13} /> ✨ AI Generate</button>
      </div>

      {/* AI Prompt */}
      {aiMode && (
        <div style={S.card}>
          <label style={S.label}>Describe the subclass</label>
          <textarea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            rows={4}
            placeholder={`e.g. "A Cleric subclass called Deathbound Domain — clerics who bind the dead using their own vitality. Features a Vital Essence Pool mechanic, channel divinity to animate corpses, and corpse explosion effects."`}
            style={S.textarea}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <select value={classKey} onChange={e => setClassKey(e.target.value)} style={S.select}>
              {STANDARD_CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {classKey === '__custom__' && (
              <input value={customClass} onChange={e => setCustomClass(e.target.value)}
                placeholder="Custom class identifier (e.g. blood-hunter)" style={{ ...S.input, width: 220 }} />
            )}
            <button onClick={handleAiGenerate} disabled={aiLoading || !aiPrompt.trim()} style={{
              ...S.btn('#7c3aed'), opacity: aiLoading || !aiPrompt.trim() ? 0.5 : 1, marginLeft: 'auto',
            }}>
              {aiLoading ? 'Generating…' : <><Sparkles size={13} /> Generate</>}
            </button>
          </div>
        </div>
      )}

      {/* Manual form */}
      <div style={S.card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={S.label}>Subclass Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Deathbound Domain" style={S.input} />
            {name && (
              <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>
                identifier: <span style={{ color: '#67e8f9', fontFamily: 'monospace' }}>{toSlug(name)}</span>
              </div>
            )}
          </div>
          <div>
            <label style={S.label}>Parent Class</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={classKey} onChange={e => setClassKey(e.target.value)} style={{ ...S.select, flex: 1 }}>
                {STANDARD_CLASSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            {classKey === '__custom__' && (
              <input value={customClass} onChange={e => setCustomClass(e.target.value)}
                placeholder="Class identifier as generated (e.g. blood-hunter)"
                style={{ ...S.input, marginTop: 6 }} />
            )}
            {classKey !== '__custom__' && (
              <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>
                classIdentifier: <span style={{ color: '#67e8f9', fontFamily: 'monospace' }}>{classKey}</span>
              </div>
            )}
            {classKey === '__custom__' && customClass && (
              <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 3 }}>
                ⚠ Must exactly match the identifier your custom class was created with
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={S.label}>Flavor Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            rows={3} placeholder="Describe the subclass flavor and theme…" style={S.textarea} />
        </div>
      </div>

      {/* Features */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>Subclass Features</span>
          <button onClick={addFeature} style={S.btn('#1e3a5f')}>
            <Plus size={13} /> Add Feature
          </button>
        </div>

        {features.map((f, i) => (
          <div key={f.id} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
              <div>
                <label style={S.label}>Level</label>
                <input type="number" min={1} max={20} value={f.level}
                  onChange={e => updateFeature(f.id, 'level', parseInt(e.target.value) || 1)}
                  style={{ ...S.input, textAlign: 'center' }} />
              </div>
              <div>
                <label style={S.label}>Feature Name</label>
                <input value={f.name} onChange={e => updateFeature(f.id, 'name', e.target.value)}
                  placeholder="e.g. Bound by Death" style={S.input} />
              </div>
              <div>
                <label style={S.label}>Recharge</label>
                <select value={f.recharge} onChange={e => updateFeature(f.id, 'recharge', e.target.value)}
                  style={{ ...S.select, width: '100%' }}>
                  <option value="">Passive</option>
                  <option value="sr">Short Rest</option>
                  <option value="lr">Long Rest</option>
                  <option value="5-6">Recharge 5–6</option>
                  <option value="4-6">Recharge 4–6</option>
                  <option value="6">Recharge 6</option>
                </select>
              </div>
              <button onClick={() => removeFeature(f.id)} disabled={features.length === 1}
                style={{ ...S.btn('#7f1d1d'), opacity: features.length === 1 ? 0.3 : 1, alignSelf: 'flex-end' }}>
                <Trash2 size={13} />
              </button>
            </div>
            <textarea value={f.description} onChange={e => updateFeature(f.id, 'description', e.target.value)}
              rows={2} placeholder="Full mechanical description of this feature…" style={S.textarea} />
          </div>
        ))}
      </div>

      {/* Domain Spells (collapsible) */}
      <div style={S.card}>
        <button onClick={() => setShowDomain(v => !v)} style={{
          background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: 0,
        }}>
          {showDomain ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          Domain / Oath Spells
          <span style={{ fontSize: 11, color: '#475569', fontWeight: 400 }}>(Cleric, Paladin, Druid subclasses)</span>
        </button>

        {showDomain && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px' }}>
              Spells always prepared, don't count against prepared spell limit. Enter comma-separated spell names per tier.
            </p>
            {domainSpells.map(t => (
              <div key={t.level} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <label style={{ ...S.label, margin: 0 }}>
                  Cleric lvl {t.level}{t.level === 1 ? 'st' : t.level === 3 ? 'rd' : 'th'}
                  <span style={{ color: '#475569', fontSize: 10, display: 'block' }}>
                    ({t.level}st–{t.level + 1}nd spell slots)
                  </span>
                </label>
                <input value={t.spells} onChange={e => updateDomainSpell(t.level, e.target.value)}
                  placeholder="Spell Name, Spell Name" style={S.input} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actor target + Build */}
      <div style={S.card}>
        <label style={S.label}>Give to Actor <span style={{ color: '#475569', fontWeight: 400 }}>(optional — leave blank to create in Items sidebar)</span></label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={actorName} onChange={e => setActorName(e.target.value)}
            placeholder="Exact actor name in Foundry" style={{ ...S.input, flex: 1 }} />
          <button onClick={handleBuild} style={S.btn('#4338ca')}>
            Build Macro
          </button>
        </div>
      </div>

      {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>⚠ {error}</div>}

      {/* Output */}
      {macro && (
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>{name || 'Subclass'} Import Macro</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                Foundry: Macro Directory (M) → New Macro → Paste → Run
              </div>
            </div>
            <button onClick={handleCopy} style={S.btn(copied ? '#065f46' : '#4338ca')}>
              <Copy size={13} /> {copied ? 'Copied!' : 'Copy Macro'}
            </button>
          </div>
          <div style={S.code}>{macro}</div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
            <strong style={{ color: '#94a3b8' }}>What this macro creates:</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
              <li>Subclass item: <span style={{ color: '#67e8f9', fontFamily: 'monospace' }}>{name}</span> → class: <span style={{ fontFamily: 'monospace', color: '#67e8f9' }}>{classIdentifier}</span></li>
              {features.filter(f => f.name.trim()).map(f => (
                <li key={f.id}>Feature: <span style={{ color: '#a5b4fc', fontFamily: 'monospace' }}>{f.name}</span> (level {f.level}{f.recharge ? `, ${f.recharge}` : ''})</li>
              ))}
            </ul>
            <p style={{ margin: '8px 0 0', color: '#64748b' }}>
              ⚠ Skill proficiencies and ability score changes must be applied manually on the character sheet.
              Passive features (no recharge) are description-only — apply their effects manually during play.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
type CharMode = 'subclass' | 'species' | 'background'

export default function CharacterOptions() {
  const [mode, setMode] = useState<CharMode>('subclass')

  const modeBtn = (m: CharMode, label: string, color: string) => (
    <button onClick={() => setMode(m)} style={{
      padding: '6px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
      background: mode === m ? color : '#1e293b',
      color: mode === m ? '#fff' : '#94a3b8',
      fontWeight: 600, fontSize: 13,
      boxShadow: mode === m ? `0 0 12px ${color}66, 0 2px 0 ${color}` : 'none',
      transition: 'all 0.15s',
    }}>{label}</button>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', gap: 8 }}>
        {modeBtn('subclass',   'Subclass',   '#4338ca')}
        {modeBtn('species',    'Species',    '#0f766e')}
        {modeBtn('background', 'Background', '#92400e')}
      </div>

      {mode === 'subclass' && <SubclassCreator />}

      {mode === 'species' && (
        <div style={{ maxWidth: 860, margin: '60px auto', textAlign: 'center', color: '#475569' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🧝</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>Species Creator</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Coming in Phase 19 — build after Subclass is validated.</div>
        </div>
      )}

      {mode === 'background' && (
        <div style={{ maxWidth: 860, margin: '60px auto', textAlign: 'center', color: '#475569' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📜</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>Background Creator</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Coming in Phase 19 — includes 2024 Origin Feat + ASI support.</div>
        </div>
      )}
    </div>
  )
}
