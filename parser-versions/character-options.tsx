// character-options.tsx
// Phase 19 — Character Options: Subclass, Species, Background creators
// Tab 8 — outputs Foundry VTT dnd5e v4+ items + import macros

import React, { useState } from 'react'
import { Copy, Plus, Trash2, Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
import { generateSubclassSpec, generateSpeciesSpec, generateBackgroundSpec, hasApiKey } from './claude-api'

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

// ── Species Creator ────────────────────────────────────────────────────────────
interface SpeciesTrait { id: string; name: string; description: string }
interface SpeciesSpec {
  name: string; size: string; speed: number
  flySpeed: number; swimSpeed: number; climbSpeed: number
  darkvision: number; resistances: string; conditionImmunities: string
  languages: string; asiNote: string; traits: SpeciesTrait[]
}

const SIZE_OPTIONS = [
  { label: 'Tiny',   value: 'tiny' },
  { label: 'Small',  value: 'sm'   },
  { label: 'Medium', value: 'med'  },
  { label: 'Large',  value: 'lg'   },
  { label: 'Huge',   value: 'huge' },
]

function buildSpeciesMacro(spec: SpeciesSpec, actorName: string): string {
  const sizeAdvId   = makeId(spec.name, 'size-adv')
  const grantAdvId  = makeId(spec.name, 'trait-grant')

  const traitData = spec.traits.map(t => ({
    name: t.name,
    type: 'feat',
    system: {
      description: { value: `<p>${t.description.replace(/\n/g, '</p><p>')}</p>` },
      type: { value: 'race', subtype: '' },
      requirements: spec.name,
      activation: { type: '', cost: null, condition: '' },
      uses: { value: null, max: '', per: null, recovery: [] },
    },
    flags: {}, effects: [],
  }))

  const raceBase = {
    name: spec.name,
    type: 'race',
    system: {
      description: { value: spec.asiNote ? `<p>${spec.asiNote}</p>` : '' },
      identifier: toSlug(spec.name),
      movement: {
        burrow: 0, climb: spec.climbSpeed, fly: spec.flySpeed,
        swim: spec.swimSpeed, walk: spec.speed, units: 'ft', hover: false,
      },
      senses: {
        darkvision: spec.darkvision, blindsight: 0, tremorsense: 0, truesight: 0,
        units: 'ft', special: '',
      },
      size: spec.size,
      traits: {
        languages: { value: [], custom: spec.languages },
        damageResistances: { bypasses: [], value: [], custom: spec.resistances },
        damageImmunities:  { bypasses: [], value: [], custom: '' },
        conditionImmunities: { value: [], custom: spec.conditionImmunities },
      },
      // advancement injected at runtime after trait UUIDs are known
    },
    flags: {}, effects: [],
  }

  return `// ${spec.name} — Species Import Macro
// Generated by DM VTT Toolkit — Character Options → Species
// Foundry dnd5e v4+ | Run from Macro Directory (M) → New Macro → Paste → Run

(async () => {
  // ── Step 1: Create folder structure ──────────────────────────────────────
  // Species/${spec.name}/ → race item
  // Species/${spec.name}/Traits/ → trait feat items
  const speciesRoot = game.folders.getName('Species') ??
    await Folder.create({ name: 'Species', type: 'Item', color: '#0f766e' });
  const mainFolder = game.folders.find(f => f.name === '${spec.name}' && f.folder?.id === speciesRoot.id) ??
    await Folder.create({ name: '${spec.name}', type: 'Item', color: '#134e4a', folder: speciesRoot.id });
  const traitFolder = game.folders.find(f => f.name === 'Traits' && f.folder?.id === mainFolder.id) ??
    await Folder.create({ name: 'Traits', type: 'Item', color: '#0d3330', folder: mainFolder.id });

  // ── Step 2: Create trait feat items ──────────────────────────────────────
  const traitDataArr = ${JSON.stringify(traitData, null, 2)};
  const createdTraits = [];
  for (const td of traitDataArr) {
    const existing = game.items.find(i => i.name === td.name && i.folder?.id === traitFolder.id);
    if (existing) {
      await existing.update({ system: td.system });
      createdTraits.push(existing);
    } else {
      const item = await Item.create({ ...td, folder: traitFolder.id });
      createdTraits.push(item);
    }
  }

  // ── Step 3: Build race item with real trait UUIDs ─────────────────────────
  const advancement = [
    {
      _id: '${sizeAdvId}',
      type: 'Size', level: 0, title: '', icon: null,
      configuration: { sizes: ['${spec.size}'] },
    },
    {
      _id: '${grantAdvId}',
      type: 'ItemGrant', level: 0, title: '', icon: null,
      configuration: {
        items: createdTraits.map(i => ({ uuid: i.uuid, optional: false })),
        optional: false, spell: null,
      },
    },
  ];

  const raceBase = ${JSON.stringify(raceBase, null, 2)};
  const raceData = { ...raceBase, system: { ...raceBase.system, advancement } };

  // ── Step 4: Create or update race item ───────────────────────────────────
  const existingRace = game.items.find(i => i.name === '${spec.name}' && i.type === 'race' && i.folder?.id === mainFolder.id);
  let raceItem;
  if (existingRace) {
    await existingRace.update({ system: raceData.system });
    raceItem = existingRace;
    ui.notifications.info('${spec.name} species updated.');
  } else {
    raceItem = await Item.create({ ...raceData, folder: mainFolder.id });
    ui.notifications.info('${spec.name} species created.');
  }

${actorName.trim() ? `
  // ── Step 5: Assign to actor ───────────────────────────────────────────────
  const actor = game.actors.getName('${actorName.trim()}');
  if (!actor) { ui.notifications.warn('Actor "${actorName.trim()}" not found — species created in Items sidebar only.'); return; }
  await actor.update({ 'system.details.race': { _id: raceItem.id, name: raceItem.name } });
  ui.notifications.info('${spec.name} assigned to ${actorName.trim()}.');
` : `  // No actor specified — species item available in Items sidebar → Species/${spec.name}/`}
})();`
}

function SpeciesCreator() {
  const [name, setName]           = useState('')
  const [size, setSize]           = useState('med')
  const [speed, setSpeed]         = useState(30)
  const [flySpeed, setFlySpeed]   = useState(0)
  const [swimSpeed, setSwimSpeed] = useState(0)
  const [climbSpeed, setClimbSpeed] = useState(0)
  const [darkvision, setDarkvision] = useState(0)
  const [resistances, setResistances] = useState('')
  const [conditionImmunities, setConditionImmunities] = useState('')
  const [languages, setLanguages] = useState('Common')
  const [asiNote, setAsiNote]     = useState('')
  const [traits, setTraits]       = useState<SpeciesTrait[]>([
    { id: 'sp1', name: '', description: '' },
  ])
  const [actorName, setActorName] = useState('')
  const [aiPrompt, setAiPrompt]   = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [macro, setMacro]         = useState('')
  const [copied, setCopied]       = useState(false)
  const [error, setError]         = useState('')

  function addTrait() {
    setTraits(t => [...t, { id: `sp${Date.now()}`, name: '', description: '' }])
  }
  function removeTrait(id: string) {
    setTraits(t => t.filter(x => x.id !== id))
  }
  function updateTrait(id: string, field: 'name' | 'description', value: string) {
    setTraits(t => t.map(x => x.id === id ? { ...x, [field]: value } : x))
  }

  function buildSpec(): SpeciesSpec {
    return {
      name: name.trim(), size, speed, flySpeed, swimSpeed, climbSpeed,
      darkvision, resistances: resistances.trim(),
      conditionImmunities: conditionImmunities.trim(),
      languages: languages.trim(), asiNote: asiNote.trim(),
      traits: traits.filter(t => t.name.trim()),
    }
  }

  function handleBuild() {
    setError('')
    if (!name.trim()) { setError('Species name is required.'); return }
    setMacro(buildSpeciesMacro(buildSpec(), actorName))
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) { setError('Enter a description first.'); return }
    setError(''); setAiLoading(true)
    try {
      const raw = await generateSpeciesSpec(aiPrompt.trim())
      const spec: SpeciesSpec = JSON.parse(raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim())
      setName(spec.name ?? '')
      setSize(spec.size ?? 'med')
      setSpeed(spec.speed ?? 30)
      setFlySpeed(spec.flySpeed ?? 0)
      setSwimSpeed(spec.swimSpeed ?? 0)
      setClimbSpeed(spec.climbSpeed ?? 0)
      setDarkvision(spec.darkvision ?? 0)
      setResistances(spec.resistances ?? '')
      setConditionImmunities(spec.conditionImmunities ?? '')
      setLanguages(spec.languages ?? 'Common')
      setAsiNote(spec.asiNote ?? '')
      setTraits((spec.traits ?? []).map((t, i) => ({ ...t, id: `sp${i}` })))
      setMacro(buildSpeciesMacro({ ...spec, traits: (spec.traits ?? []).map((t, i) => ({ ...t, id: `sp${i}` })) }, actorName))
    } catch (e: any) {
      setError(`AI error: ${e.message ?? e}`)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleCopy() {
    try { await navigator.clipboard.writeText(macro) } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const numInput = (val: number, set: (n: number) => void, label: string) => (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4, minWidth: 90 }}>
      <label style={{ ...S.label, marginBottom: 0 }}>{label}</label>
      <input type="number" min={0} step={5} value={val}
        onChange={e => set(Math.max(0, parseInt(e.target.value) || 0))}
        style={{ ...S.input, width: '100%' }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px 60px' }}>
      <h3 style={{ color: '#2dd4bf', margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Species Creator</h3>
      <p style={{ color: '#475569', fontSize: 13, margin: '0 0 20px' }}>
        Build a playable species — outputs a Foundry <code>race</code> item with trait feats and advancement links.
      </p>

      {/* AI Generate */}
      <div style={S.card}>
        <label style={S.label}>✨ AI Generate <span style={{ color: '#475569', fontWeight: 400 }}>(describe your species)</span></label>
        <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={3}
          placeholder="e.g. A race of shadow-touched elves who dwell underground. They have darkvision, resistance to necrotic damage, and can become invisible in dim light as a bonus action once per short rest."
          style={{ ...S.textarea, marginBottom: 8 }} />
        <button onClick={handleAiGenerate} disabled={aiLoading || !hasApiKey()} style={S.btn('#0f766e')}>
          <Sparkles size={13} />{aiLoading ? 'Generating…' : 'Generate Species'}
        </button>
        {!hasApiKey() && <span style={{ color: '#475569', fontSize: 11, marginLeft: 10 }}>API key required (⚙ Settings)</span>}
      </div>

      {/* Core stats */}
      <div style={S.card}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 12 }}>
          <div style={{ flex: 2, minWidth: 180 }}>
            <label style={S.label}>Species Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Shadowfell Elf" style={S.input} />
          </div>
          <div style={{ minWidth: 120 }}>
            <label style={S.label}>Size</label>
            <select value={size} onChange={e => setSize(e.target.value)} style={{ ...S.select, width: '100%' }}>
              {SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
          {numInput(speed,      setSpeed,      'Walk (ft)')}
          {numInput(flySpeed,   setFlySpeed,   'Fly (ft)')}
          {numInput(swimSpeed,  setSwimSpeed,  'Swim (ft)')}
          {numInput(climbSpeed, setClimbSpeed, 'Climb (ft)')}
          {numInput(darkvision, setDarkvision, 'Darkvision (ft)')}
        </div>
      </div>

      {/* Resistances & languages */}
      <div style={S.card}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={S.label}>Damage Resistances <span style={{ color: '#475569', fontWeight: 400 }}>(comma-separated)</span></label>
            <input value={resistances} onChange={e => setResistances(e.target.value)}
              placeholder="e.g. poison, necrotic" style={S.input} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={S.label}>Condition Immunities <span style={{ color: '#475569', fontWeight: 400 }}>(comma-separated)</span></label>
            <input value={conditionImmunities} onChange={e => setConditionImmunities(e.target.value)}
              placeholder="e.g. charmed, frightened" style={S.input} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Languages <span style={{ color: '#475569', fontWeight: 400 }}>(comma-separated)</span></label>
          <input value={languages} onChange={e => setLanguages(e.target.value)}
            placeholder="e.g. Common, Elvish" style={S.input} />
        </div>
        <div>
          <label style={S.label}>Ability Score Increases <span style={{ color: '#475569', fontWeight: 400 }}>(2024 format, shown in description)</span></label>
          <input value={asiNote} onChange={e => setAsiNote(e.target.value)}
            placeholder="e.g. Increase one score by 2 and another by 1, or increase three different scores by 1 each."
            style={S.input} />
        </div>
      </div>

      {/* Traits */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>Racial Traits</span>
          <button onClick={addTrait} style={{ ...S.btn('#0f766e'), padding: '4px 10px' }}>
            <Plus size={12} /> Add Trait
          </button>
        </div>
        {traits.map((t, idx) => (
          <div key={t.id} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, padding: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input value={t.name} onChange={e => updateTrait(t.id, 'name', e.target.value)}
                placeholder={`Trait ${idx + 1} name`} style={{ ...S.input, flex: 1 }} />
              {traits.length > 1 && (
                <button onClick={() => removeTrait(t.id)}
                  style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <textarea value={t.description} onChange={e => updateTrait(t.id, 'description', e.target.value)}
              rows={3} placeholder="Full mechanical description — include dice, ranges, durations, and conditions."
              style={S.textarea} />
          </div>
        ))}
      </div>

      {/* Actor + Build */}
      <div style={S.card}>
        <label style={S.label}>Assign to Actor <span style={{ color: '#475569', fontWeight: 400 }}>(optional — leave blank to create in Items sidebar)</span></label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={actorName} onChange={e => setActorName(e.target.value)}
            placeholder="Exact actor name in Foundry" style={{ ...S.input, flex: 1 }} />
          <button onClick={handleBuild} style={S.btn('#0f766e')}>Build Macro</button>
        </div>
      </div>

      {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>⚠ {error}</div>}

      {/* Output */}
      {macro && (
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>{name || 'Species'} Import Macro</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                Foundry: Macro Directory (M) → New Macro → Paste → Run
              </div>
            </div>
            <button onClick={handleCopy} style={{ ...S.btn(copied ? '#065f46' : '#0f766e'), padding: '6px 14px' }}>
              <Copy size={13} />{copied ? 'Copied!' : 'Copy Macro'}
            </button>
          </div>
          <pre style={S.code}>{macro}</pre>
          <div style={{ marginTop: 10, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
            <strong style={{ color: '#94a3b8' }}>What this macro creates:</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
              <li>Race item: <span style={{ color: '#2dd4bf', fontFamily: 'monospace' }}>{name}</span> → folder: <span style={{ fontFamily: 'monospace', color: '#2dd4bf' }}>Species/{name}/</span></li>
              {darkvision > 0 && <li>Darkvision: <span style={{ color: '#94a3b8' }}>{darkvision} ft (set on race item)</span></li>}
              {traits.filter(t => t.name.trim()).map(t => (
                <li key={t.id}>Trait feat: <span style={{ color: '#5eead4', fontFamily: 'monospace' }}>{t.name}</span></li>
              ))}
            </ul>
            <p style={{ margin: '8px 0 0', color: '#64748b' }}>
              ⚠ Ability score increases must be applied manually on the character sheet (2024 format varies).
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Background Creator ─────────────────────────────────────────────────────────
const SKILLS = [
  'Acrobatics','Animal Handling','Arcana','Athletics','Deception','History',
  'Insight','Intimidation','Investigation','Medicine','Nature','Perception',
  'Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival',
]
const SKILL_SLUG: Record<string, string> = {
  'Acrobatics':'acr','Animal Handling':'ani','Arcana':'arc','Athletics':'ath',
  'Deception':'dec','History':'his','Insight':'ins','Intimidation':'itm',
  'Investigation':'inv','Medicine':'med','Nature':'nat','Perception':'prc',
  'Performance':'prf','Persuasion':'per','Religion':'rel',
  'Sleight of Hand':'slt','Stealth':'ste','Survival':'sur',
}

interface BackgroundSpec {
  name: string; flavorText: string
  skill1: string; skill2: string
  toolProficiency: string; language: string
  originFeat: string; startingEquipment: string
  featureName: string; featureDescription: string
}

function buildBackgroundMacro(spec: BackgroundSpec, actorName: string): string {
  const skillAdvId  = makeId(spec.name, 'skills')
  const toolAdvId   = makeId(spec.name, 'tool')
  const langAdvId   = makeId(spec.name, 'lang')
  const featAdvId   = makeId(spec.name, 'feat-grant')
  const asiAdvId    = makeId(spec.name, 'asi')

  const skill1slug  = SKILL_SLUG[spec.skill1] ?? spec.skill1.toLowerCase().replace(/\s/g,'')
  const skill2slug  = SKILL_SLUG[spec.skill2] ?? spec.skill2.toLowerCase().replace(/\s/g,'')

  const descHtml = [
    spec.flavorText && `<p>${spec.flavorText}</p>`,
    spec.startingEquipment && `<p><strong>Starting Equipment:</strong> ${spec.startingEquipment}</p>`,
    '<p><strong>Ability Score Increases:</strong> Increase one ability score by 2 and another by 1, or increase three different ability scores by 1 each.</p>',
  ].filter(Boolean).join('\n')

  const featureHtml = spec.featureDescription
    ? `<p><strong>${spec.featureName}:</strong> ${spec.featureDescription.replace(/\n/g,'</p><p>')}</p>`
    : ''

  return `// ${spec.name} — Background Import Macro
// Generated by DM VTT Toolkit — Character Options → Background
// Foundry dnd5e v4+ (2024 rules) | Run from Macro Directory (M) → New Macro → Paste → Run

(async () => {
  // ── Step 1: Create folder ─────────────────────────────────────────────────
  const bgRoot = game.folders.getName('Backgrounds') ??
    await Folder.create({ name: 'Backgrounds', type: 'Item', color: '#92400e' });
  const mainFolder = game.folders.find(f => f.name === '${spec.name}' && f.folder?.id === bgRoot.id) ??
    await Folder.create({ name: '${spec.name}', type: 'Item', color: '#78350f', folder: bgRoot.id });

  // ── Step 2: Look up origin feat across all compendium packs ──────────────
  const featName = '${spec.originFeat}';
  const allPacks = [
    game.packs.get('dnd5e.feats'),
    game.packs.get('dnd5e.classfeatures'),
    ...game.packs.filter(p => p.documentName === 'Item' && !['dnd5e.feats','dnd5e.classfeatures'].includes(p.collection)),
  ].filter(Boolean);

  let featUuid = null;
  for (const pack of allPacks) {
    const idx = await pack.getIndex({ fields: ['name','type'] });
    const entry = idx.find(i => ['feat','feature'].includes(i.type) && i.name.toLowerCase() === featName.toLowerCase());
    if (entry) { featUuid = \`Compendium.\${pack.collection}.Item.\${entry._id}\`; break; }
  }

  // If not found, create a stub feat item
  let featGrantItems = [];
  if (featUuid) {
    featGrantItems = [{ uuid: featUuid, optional: false }];
    console.log(\`Origin feat "\${featName}" found in compendium.\`);
  } else {
    const stubFeat = await Item.create({
      name: featName, type: 'feat',
      system: {
        description: { value: '<p><em>Stub — origin feat not found in any installed compendium. Fill in details from the sourcebook.</em></p>' },
        type: { value: 'feat', subtype: 'origin' },
        prerequisites: { level: null },
      },
      folder: mainFolder.id, flags: {}, effects: [],
    });
    featGrantItems = [{ uuid: stubFeat.uuid, optional: false }];
    ui.notifications.warn(\`Origin feat "\${featName}" not found — stub created. Fill in manually.\`);
  }

${spec.featureName.trim() ? `
  // ── Step 3: Create background feature item ────────────────────────────────
  const featureData = {
    name: '${spec.featureName}', type: 'feat',
    system: {
      description: { value: \`${featureHtml.replace(/`/g, '\\`')}\` },
      type: { value: 'background', subtype: '' },
      requirements: '${spec.name}',
      activation: { type: '', cost: null, condition: '' },
      uses: { value: null, max: '', per: null, recovery: [] },
    },
    flags: {}, effects: [],
  };
  const existingFeat = game.items.find(i => i.name === '${spec.featureName}' && i.folder?.id === mainFolder.id);
  const featureItem = existingFeat
    ? (await existingFeat.update({ system: featureData.system }), existingFeat)
    : await Item.create({ ...featureData, folder: mainFolder.id });
  featGrantItems.push({ uuid: featureItem.uuid, optional: false });
` : ''}
  // ── Step 4: Build and create background item ──────────────────────────────
  const advancement = [
    {
      _id: '${skillAdvId}', type: 'Trait', level: 1,
      title: 'Skill Proficiencies', icon: null,
      configuration: {
        mode: 'default', allowReplacements: false,
        grants: ['skills:${skill1slug}', 'skills:${skill2slug}'],
        choices: [],
      },
    },
    {
      _id: '${toolAdvId}', type: 'Trait', level: 1,
      title: 'Tool Proficiency', icon: null,
      configuration: {
        mode: 'default', allowReplacements: false,
        grants: [],
        choices: [],
        hint: '${spec.toolProficiency}',
      },
    },
    {
      _id: '${langAdvId}', type: 'Trait', level: 1,
      title: 'Language', icon: null,
      configuration: {
        mode: 'default', allowReplacements: false,
        grants: [],
        choices: [],
        hint: '${spec.language}',
      },
    },
    {
      _id: '${featAdvId}', type: 'ItemGrant', level: 1,
      title: 'Origin Feat & Feature', icon: null,
      configuration: { items: featGrantItems, optional: false, spell: null },
    },
    {
      _id: '${asiAdvId}', type: 'AbilityScoreImprovement', level: 1,
      title: 'Ability Score Improvement', icon: null,
      configuration: { points: 3, fixed: {}, cap: 2 },
    },
  ];

  const bgData = {
    name: '${spec.name}', type: 'background',
    system: {
      description: { value: \`${descHtml.replace(/`/g, '\\`')}\` },
      identifier: '${toSlug(spec.name)}',
      startingEquipment: [], wealth: '',
      advancement,
    },
    flags: {}, effects: [],
  };

  const existingBg = game.items.find(i => i.name === '${spec.name}' && i.type === 'background' && i.folder?.id === mainFolder.id);
  let bgItem;
  if (existingBg) {
    await existingBg.update({ system: bgData.system });
    bgItem = existingBg;
    ui.notifications.info('${spec.name} background updated.');
  } else {
    bgItem = await Item.create({ ...bgData, folder: mainFolder.id });
    ui.notifications.info('${spec.name} background created.');
  }

${actorName.trim() ? `
  // ── Step 5: Assign to actor ───────────────────────────────────────────────
  const actor = game.actors.getName('${actorName.trim()}');
  if (!actor) { ui.notifications.warn('Actor "${actorName.trim()}" not found — background created in Items sidebar only.'); return; }
  await actor.update({ 'system.details.background': { _id: bgItem.id, name: bgItem.name } });
  ui.notifications.info('${spec.name} background assigned to ${actorName.trim()}.');
` : `  // No actor specified — background item available in Items sidebar → Backgrounds/${spec.name}/`}
})();`
}

function BackgroundCreator() {
  const [name, setName]           = useState('')
  const [flavorText, setFlavor]   = useState('')
  const [skill1, setSkill1]       = useState('History')
  const [skill2, setSkill2]       = useState('Insight')
  const [toolProf, setToolProf]   = useState('')
  const [language, setLanguage]   = useState('')
  const [originFeat, setOriginFeat] = useState('')
  const [equipment, setEquipment] = useState('')
  const [featName, setFeatName]   = useState('')
  const [featDesc, setFeatDesc]   = useState('')
  const [actorName, setActorName] = useState('')
  const [aiPrompt, setAiPrompt]   = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [macro, setMacro]         = useState('')
  const [copied, setCopied]       = useState(false)
  const [error, setError]         = useState('')

  function buildSpec(): BackgroundSpec {
    return {
      name: name.trim(), flavorText: flavorText.trim(),
      skill1, skill2,
      toolProficiency: toolProf.trim(), language: language.trim(),
      originFeat: originFeat.trim(), startingEquipment: equipment.trim(),
      featureName: featName.trim(), featureDescription: featDesc.trim(),
    }
  }

  function handleBuild() {
    setError('')
    if (!name.trim()) { setError('Background name is required.'); return }
    if (skill1 === skill2) { setError('Skill 1 and Skill 2 must be different.'); return }
    setMacro(buildBackgroundMacro(buildSpec(), actorName))
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) { setError('Enter a description first.'); return }
    setError(''); setAiLoading(true)
    try {
      const raw = await generateBackgroundSpec(aiPrompt.trim())
      const spec: BackgroundSpec = JSON.parse(raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim())
      setName(spec.name ?? '')
      setFlavor(spec.flavorText ?? '')
      setSkill1(SKILLS.includes(spec.skill1) ? spec.skill1 : 'History')
      setSkill2(SKILLS.includes(spec.skill2) ? spec.skill2 : 'Insight')
      setToolProf(spec.toolProficiency ?? '')
      setLanguage(spec.language ?? '')
      setOriginFeat(spec.originFeat ?? '')
      setEquipment(spec.startingEquipment ?? '')
      setFeatName(spec.featureName ?? '')
      setFeatDesc(spec.featureDescription ?? '')
      setMacro(buildBackgroundMacro(spec, actorName))
    } catch (e: any) {
      setError(`AI error: ${e.message ?? e}`)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleCopy() {
    try { await navigator.clipboard.writeText(macro) } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px 60px' }}>
      <h3 style={{ color: '#fb923c', margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Background Creator</h3>
      <p style={{ color: '#475569', fontSize: 13, margin: '0 0 20px' }}>
        Build a 2024-format background — outputs a Foundry <code>background</code> item with skill/tool/language advancements, origin feat lookup, and ASI.
      </p>

      {/* AI Generate */}
      <div style={S.card}>
        <label style={S.label}>✨ AI Generate <span style={{ color: '#475569', fontWeight: 400 }}>(describe your background)</span></label>
        <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={3}
          placeholder="e.g. A wandering monster hunter who has seen horrors beyond mortal comprehension. Skilled in survival and arcana, carries a monster-hunting kit, and can find shelter among common folk who fear the same creatures."
          style={{ ...S.textarea, marginBottom: 8 }} />
        <button onClick={handleAiGenerate} disabled={aiLoading || !hasApiKey()} style={S.btn('#92400e')}>
          <Sparkles size={13} />{aiLoading ? 'Generating…' : 'Generate Background'}
        </button>
        {!hasApiKey() && <span style={{ color: '#475569', fontSize: 11, marginLeft: 10 }}>API key required (⚙ Settings)</span>}
      </div>

      {/* Name + skills */}
      <div style={S.card}>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Background Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Haunted One" style={S.input} />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={S.label}>Skill Proficiency 1</label>
            <select value={skill1} onChange={e => setSkill1(e.target.value)} style={{ ...S.select, width: '100%' }}>
              {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={S.label}>Skill Proficiency 2</label>
            <select value={skill2} onChange={e => setSkill2(e.target.value)} style={{ ...S.select, width: '100%' }}>
              {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={S.label}>Tool Proficiency</label>
            <input value={toolProf} onChange={e => setToolProf(e.target.value)}
              placeholder="e.g. Thieves' Tools" style={S.input} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={S.label}>Language</label>
            <input value={language} onChange={e => setLanguage(e.target.value)}
              placeholder="e.g. Abyssal" style={S.input} />
          </div>
        </div>
      </div>

      {/* Feat + equipment */}
      <div style={S.card}>
        <div style={{ marginBottom: 12 }}>
          <label style={S.label}>Origin Feat <span style={{ color: '#475569', fontWeight: 400 }}>(macro searches all compendiums — stub created if not found)</span></label>
          <input value={originFeat} onChange={e => setOriginFeat(e.target.value)}
            placeholder="e.g. Magic Initiate, Alert, Lucky, Skilled" style={S.input} />
        </div>
        <div>
          <label style={S.label}>Starting Equipment <span style={{ color: '#475569', fontWeight: 400 }}>(shown in description)</span></label>
          <input value={equipment} onChange={e => setEquipment(e.target.value)}
            placeholder="e.g. A holy symbol, a prayer book, 5 candles, 2 days of rations" style={S.input} />
        </div>
      </div>

      {/* Background feature */}
      <div style={S.card}>
        <label style={S.label}>Background Feature <span style={{ color: '#475569', fontWeight: 400 }}>(optional — creates a feat item linked to the background)</span></label>
        <input value={featName} onChange={e => setFeatName(e.target.value)}
          placeholder="Feature name, e.g. Shelter of the Faithful" style={{ ...S.input, marginBottom: 8 }} />
        <textarea value={featDesc} onChange={e => setFeatDesc(e.target.value)} rows={3}
          placeholder="Full description of the feature's benefit."
          style={S.textarea} />
      </div>

      {/* Flavor */}
      <div style={S.card}>
        <label style={S.label}>Flavor Text <span style={{ color: '#475569', fontWeight: 400 }}>(shown in description)</span></label>
        <textarea value={flavorText} onChange={e => setFlavor(e.target.value)} rows={3}
          placeholder="2–3 sentences of lore and character flavor."
          style={S.textarea} />
      </div>

      {/* Actor + Build */}
      <div style={S.card}>
        <label style={S.label}>Assign to Actor <span style={{ color: '#475569', fontWeight: 400 }}>(optional)</span></label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={actorName} onChange={e => setActorName(e.target.value)}
            placeholder="Exact actor name in Foundry" style={{ ...S.input, flex: 1 }} />
          <button onClick={handleBuild} style={S.btn('#92400e')}>Build Macro</button>
        </div>
      </div>

      {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>⚠ {error}</div>}

      {macro && (
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>{name || 'Background'} Import Macro</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                Foundry: Macro Directory (M) → New Macro → Paste → Run
              </div>
            </div>
            <button onClick={handleCopy} style={{ ...S.btn(copied ? '#065f46' : '#92400e'), padding: '6px 14px' }}>
              <Copy size={13} />{copied ? 'Copied!' : 'Copy Macro'}
            </button>
          </div>
          <pre style={S.code}>{macro}</pre>
          <div style={{ marginTop: 10, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
            <strong style={{ color: '#94a3b8' }}>What this macro creates:</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
              <li>Background item: <span style={{ color: '#fb923c', fontFamily: 'monospace' }}>{name}</span> → <span style={{ fontFamily: 'monospace', color: '#fb923c' }}>Backgrounds/{name}/</span></li>
              <li>Skills: <span style={{ color: '#94a3b8' }}>{skill1}, {skill2}</span></li>
              {toolProf && <li>Tool: <span style={{ color: '#94a3b8' }}>{toolProf}</span></li>}
              {language && <li>Language: <span style={{ color: '#94a3b8' }}>{language}</span></li>}
              {originFeat && <li>Origin feat: <span style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{originFeat}</span> <span style={{ color: '#475569' }}>(compendium search + stub fallback)</span></li>}
              {featName && <li>Feature feat: <span style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{featName}</span></li>}
              <li>ASI advancement: +2/+1 or +1/+1/+1 (player chooses on level-up)</li>
            </ul>
            <p style={{ margin: '8px 0 0', color: '#64748b' }}>
              ⚠ Tool proficiency and language are stored as hints on the advancement — set them manually in Foundry if the exact slugs are needed.
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

      {mode === 'species' && <SpeciesCreator />}

      {mode === 'background' && <BackgroundCreator />}
    </div>
  )
}
