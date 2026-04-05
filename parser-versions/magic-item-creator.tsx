// magic-item-creator.tsx
// Phase 18 — Magic Item Creator, Tab 6
// Three modes: Text (paste description), AI (generate from hints), Builder (structured form)
// Outputs Foundry VTT dnd5e v4+ item JSON + import macro

import React, { useState } from 'react'
import { Wand2, Copy, Download, Sparkles, Plus, Trash2 } from 'lucide-react'
import { generateMagicItemSpec, hasApiKey } from './claude-api'

// ── Types ──────────────────────────────────────────────────────────────────
type InputMode = 'text' | 'ai' | 'builder'
type FoundryItemType = 'weapon' | 'armor' | 'wondrous' | 'consumable'
type Rarity = '' | 'common' | 'uncommon' | 'rare' | 'veryRare' | 'legendary' | 'artifact'
type Attunement = '' | 'optional' | 'required'
interface ExtraDmgPart { number: number; denomination: number; damageType: string }

interface MagicItemSpec {
  name: string
  itemType: FoundryItemType
  rarity: Rarity
  attunement: Attunement
  description: string
  baseWeapon?: string | null
  attackBonus?: number | null
  extraDamageParts?: Array<{ number: number; denomination: number; types: string[] }> | null
  baseArmor?: string | null
  magicalBonus?: number | null
  consumableType?: string | null
  healingFormula?: { number: number; denomination: number; bonus: string } | null
  charges?: number | null
  recharge?: string | null
  rechargeFormula?: string | null
  extraProperties?: string[]
}

// ── Data Tables ───────────────────────────────────────────────────────────
interface WeaponDef {
  value: string; label: string; typeValue: string
  dmgNum: number; dmgDie: number; dmgType: string
  props: string[]
  ranged?: boolean
  versatileDie?: number
}

const WEAPONS: WeaponDef[] = [
  { value: 'longsword',    label: 'Longsword',      typeValue: 'martialM', dmgNum:1, dmgDie:8,  dmgType:'slashing',    props:['mgc'],                       versatileDie:10 },
  { value: 'shortsword',   label: 'Shortsword',     typeValue: 'martialM', dmgNum:1, dmgDie:6,  dmgType:'piercing',    props:['mgc','fin','lgt'] },
  { value: 'greatsword',   label: 'Greatsword',     typeValue: 'martialM', dmgNum:2, dmgDie:6,  dmgType:'slashing',    props:['mgc','two','hvy'] },
  { value: 'greataxe',     label: 'Greataxe',       typeValue: 'martialM', dmgNum:1, dmgDie:12, dmgType:'slashing',    props:['mgc','two','hvy'] },
  { value: 'handaxe',      label: 'Handaxe',        typeValue: 'simpleM',  dmgNum:1, dmgDie:6,  dmgType:'slashing',    props:['mgc','lgt','thr'] },
  { value: 'dagger',       label: 'Dagger',         typeValue: 'simpleM',  dmgNum:1, dmgDie:4,  dmgType:'piercing',    props:['mgc','fin','lgt','thr'] },
  { value: 'rapier',       label: 'Rapier',         typeValue: 'martialM', dmgNum:1, dmgDie:8,  dmgType:'piercing',    props:['mgc','fin'] },
  { value: 'mace',         label: 'Mace',           typeValue: 'simpleM',  dmgNum:1, dmgDie:6,  dmgType:'bludgeoning', props:['mgc'] },
  { value: 'quarterstaff', label: 'Quarterstaff',   typeValue: 'simpleM',  dmgNum:1, dmgDie:6,  dmgType:'bludgeoning', props:['mgc'],                       versatileDie:8 },
  { value: 'warhammer',    label: 'Warhammer',      typeValue: 'martialM', dmgNum:1, dmgDie:8,  dmgType:'bludgeoning', props:['mgc'],                       versatileDie:10 },
  { value: 'battleaxe',    label: 'Battleaxe',      typeValue: 'martialM', dmgNum:1, dmgDie:8,  dmgType:'slashing',    props:['mgc'],                       versatileDie:10 },
  { value: 'spear',        label: 'Spear',          typeValue: 'simpleM',  dmgNum:1, dmgDie:6,  dmgType:'piercing',    props:['mgc','thr'],                 versatileDie:8 },
  { value: 'flail',        label: 'Flail',          typeValue: 'martialM', dmgNum:1, dmgDie:8,  dmgType:'bludgeoning', props:['mgc'] },
  { value: 'glaive',       label: 'Glaive',         typeValue: 'martialM', dmgNum:1, dmgDie:10, dmgType:'slashing',    props:['mgc','two','hvy','rch'] },
  { value: 'halberd',      label: 'Halberd',        typeValue: 'martialM', dmgNum:1, dmgDie:10, dmgType:'slashing',    props:['mgc','two','hvy','rch'] },
  { value: 'maul',         label: 'Maul',           typeValue: 'martialM', dmgNum:2, dmgDie:6,  dmgType:'bludgeoning', props:['mgc','two','hvy'] },
  { value: 'whip',         label: 'Whip',           typeValue: 'martialM', dmgNum:1, dmgDie:4,  dmgType:'slashing',    props:['mgc','fin','rch'] },
  { value: 'longbow',      label: 'Longbow',        typeValue: 'martialR', dmgNum:1, dmgDie:8,  dmgType:'piercing',    props:['mgc','amm','two','hvy'],     ranged:true },
  { value: 'shortbow',     label: 'Shortbow',       typeValue: 'simpleR',  dmgNum:1, dmgDie:6,  dmgType:'piercing',    props:['mgc','amm','two'],           ranged:true },
  { value: 'handcrossbow', label: 'Hand Crossbow',  typeValue: 'martialR', dmgNum:1, dmgDie:6,  dmgType:'piercing',    props:['mgc','amm','lgt','lod'],     ranged:true },
  { value: 'heavycrossbow',label: 'Heavy Crossbow', typeValue: 'martialR', dmgNum:1, dmgDie:10, dmgType:'piercing',    props:['mgc','amm','hvy','lod','two'],ranged:true },
  { value: 'lighthammer',  label: 'Light Hammer',   typeValue: 'simpleM',  dmgNum:1, dmgDie:4,  dmgType:'bludgeoning', props:['mgc','lgt','thr'] },
  { value: 'trident',      label: 'Trident',        typeValue: 'martialM', dmgNum:1, dmgDie:6,  dmgType:'piercing',    props:['mgc','thr'],                 versatileDie:8 },
]

interface ArmorDef { value: string; label: string; typeValue: string; baseAC: number; dex: number | null; str?: number; stealthDisadv?: boolean }

const ARMORS: ArmorDef[] = [
  { value: 'padded',        label: 'Padded',         typeValue: 'light',  baseAC:11, dex:null, stealthDisadv:true },
  { value: 'leather',       label: 'Leather',        typeValue: 'light',  baseAC:11, dex:null },
  { value: 'studdedleather',label: 'Studded Leather',typeValue: 'light',  baseAC:12, dex:null },
  { value: 'hide',          label: 'Hide',           typeValue: 'medium', baseAC:12, dex:2 },
  { value: 'chainshirt',    label: 'Chain Shirt',    typeValue: 'medium', baseAC:13, dex:2 },
  { value: 'scalemail',     label: 'Scale Mail',     typeValue: 'medium', baseAC:14, dex:2, stealthDisadv:true },
  { value: 'breastplate',   label: 'Breastplate',    typeValue: 'medium', baseAC:14, dex:2 },
  { value: 'halfplate',     label: 'Half Plate',     typeValue: 'medium', baseAC:15, dex:2, stealthDisadv:true },
  { value: 'ringmail',      label: 'Ring Mail',      typeValue: 'heavy',  baseAC:14, dex:0, stealthDisadv:true },
  { value: 'chainmail',     label: 'Chain Mail',     typeValue: 'heavy',  baseAC:16, dex:0, str:13, stealthDisadv:true },
  { value: 'splint',        label: 'Splint',         typeValue: 'heavy',  baseAC:17, dex:0, str:15, stealthDisadv:true },
  { value: 'plate',         label: 'Plate',          typeValue: 'heavy',  baseAC:18, dex:0, str:15, stealthDisadv:true },
  { value: 'shield',        label: 'Shield',         typeValue: 'shield', baseAC:2,  dex:null },
]

const CONSUMABLE_SUBTYPES = ['potion', 'scroll', 'wand', 'rod', 'ammunition', 'poison', 'food']
const RARITIES: Rarity[] = ['', 'common', 'uncommon', 'rare', 'veryRare', 'legendary', 'artifact']
const RARITY_LABEL: Record<string, string> = { '':'None', common:'Common', uncommon:'Uncommon', rare:'Rare', veryRare:'Very Rare', legendary:'Legendary', artifact:'Artifact' }
const RARITY_COLOR: Record<string, string> = { '':'#64748b', common:'#94a3b8', uncommon:'#4ade80', rare:'#60a5fa', veryRare:'#c084fc', legendary:'#fb923c', artifact:'#f87171' }
const RECHARGE_OPTIONS = ['dawn', 'dusk', 'lr', 'sr', 'formula']
const RECHARGE_LABEL: Record<string, string> = { dawn:'Dawn', dusk:'Dusk', lr:'Long Rest', sr:'Short Rest', formula:'Custom Formula' }
const DAMAGE_TYPES = ['acid','bludgeoning','cold','fire','force','lightning','necrotic','piercing','poison','psychic','radiant','slashing','thunder']
const DMG_DICE = [4, 6, 8, 10, 12]

// ── ID generation ──────────────────────────────────────────────────────────
const _djb2 = (s: string) => {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0
  return h.toString(36).padStart(7, '0').slice(0, 7)
}
const makeId = (...parts: string[]) => {
  const k = parts.join('').toLowerCase().replace(/[\s']/g, '')
  return (_djb2(k) + _djb2(k + '~')).slice(0, 16).padEnd(16, '0')
}

// ── Recovery builder ───────────────────────────────────────────────────────
function buildRecovery(recharge?: string | null, formula?: string | null) {
  if (!recharge) return []
  if (recharge === 'formula') return [{ period: 'dawn', type: 'formula', formula: formula ?? '1d6' }]
  return [{ period: recharge, type: 'recoverAll' }]
}

// ── Foundry Item JSON builder ──────────────────────────────────────────────
function buildFoundryItem(spec: MagicItemSpec): object {
  const itemId = makeId(spec.name, spec.itemType)
  const actId  = makeId(spec.name, spec.itemType, 'activity')

  const uses = spec.charges
    ? { value: spec.charges, max: String(spec.charges), per: 'charges', recovery: buildRecovery(spec.recharge, spec.rechargeFormula) }
    : { value: null, max: null, per: null, recovery: [] }

  const desc = spec.description.startsWith('<') ? spec.description : `<p>${spec.description}</p>`

  // ── Weapon ──────────────────────────────────────────────────────────────
  if (spec.itemType === 'weapon') {
    const wdef = WEAPONS.find(w => w.value === (spec.baseWeapon ?? 'longsword')) ?? WEAPONS[0]
    const bonus = spec.attackBonus ?? 0
    const bonusStr = bonus > 0 ? String(bonus) : ''
    const props = [...wdef.props, ...(spec.extraProperties ?? [])].filter((v, i, a) => a.indexOf(v) === i)
    const isRanged = wdef.ranged ?? false
    const extraParts = (spec.extraDamageParts ?? []).map(p => ({
      number: p.number, denomination: p.denomination, bonus: '',
      types: p.types, custom: { enabled: false, formula: '' },
    }))

    return {
      _id: itemId,
      name: spec.name,
      type: 'weapon',
      system: {
        description: { value: desc },
        quantity: 1,
        weight: { value: 0, units: 'lb' },
        price: { value: 0, denomination: 'gp' },
        attunement: spec.attunement,
        equipped: false,
        rarity: spec.rarity,
        identified: true,
        type: { value: wdef.typeValue, baseItem: wdef.value },
        properties: props,
        damage: {
          base: {
            number: wdef.dmgNum, denomination: wdef.dmgDie,
            bonus: bonusStr,
            types: [wdef.dmgType],
            custom: { enabled: false, formula: '' },
          },
          ...(wdef.versatileDie ? {
            versatile: { number: 1, denomination: wdef.versatileDie, bonus: bonusStr, types: [wdef.dmgType] }
          } : {}),
        },
        range: isRanged
          ? { value: 80, long: 320, units: 'ft' }
          : { value: 5, long: null, units: 'ft' },
        uses,
        activation: { type: 'action', cost: 1, condition: '' },
        activities: {
          [actId]: {
            _id: actId,
            type: 'attack',
            name: '',
            activation: { type: 'action', cost: 1, condition: '' },
            attack: {
              ability: '',
              bonus: bonusStr,
              flat: false,
              type: { value: isRanged ? 'rwak' : 'mwak', classification: 'weapon' },
            },
            damage: { includeBase: true, parts: extraParts },
            range: isRanged
              ? { value: 80, long: 320, units: 'ft' }
              : { value: 5, long: null, units: 'ft' },
            target: { affects: { type: 'creature', count: '1' }, template: { type: '' } },
            uses: { spent: 0, recovery: [] },
          },
        },
      },
    }
  }

  // ── Armor ────────────────────────────────────────────────────────────────
  if (spec.itemType === 'armor') {
    const adef = ARMORS.find(a => a.value === (spec.baseArmor ?? 'plate')) ?? ARMORS.find(a => a.value === 'plate')!
    const magBonus = spec.magicalBonus ?? 0
    const props = ['mgc', ...(spec.extraProperties ?? [])].filter((v, i, a) => a.indexOf(v) === i)
    if (adef.stealthDisadv && !props.includes('stl')) props.push('stl')

    return {
      _id: itemId,
      name: spec.name,
      type: 'equipment',
      system: {
        description: { value: desc },
        quantity: 1,
        weight: { value: 0, units: 'lb' },
        price: { value: 0, denomination: 'gp' },
        attunement: spec.attunement,
        equipped: false,
        rarity: spec.rarity,
        identified: true,
        type: { value: adef.typeValue, baseItem: adef.value },
        properties: props,
        armor: {
          value: adef.baseAC,
          dex: adef.dex,
          magicalBonus: magBonus > 0 ? magBonus : null,
        },
        strength: adef.str ?? 0,
        stealth: adef.stealthDisadv ?? false,
        uses,
        activation: { type: '', cost: null, condition: '' },
        activities: {},
      },
    }
  }

  // ── Consumable ───────────────────────────────────────────────────────────
  if (spec.itemType === 'consumable') {
    const props = ['mgc', ...(spec.extraProperties ?? [])].filter((v, i, a) => a.indexOf(v) === i)
    const consumeUses = spec.charges
      ? { ...uses, autoDestroy: false, prompt: false }
      : { value: 1, max: '1', per: 'charges', recovery: [], autoDestroy: true, prompt: false }

    const activities: Record<string, any> = {}
    if (spec.healingFormula) {
      activities[actId] = {
        _id: actId,
        type: 'heal',
        name: '',
        activation: { type: 'action', cost: 1, condition: '' },
        healing: {
          number: spec.healingFormula.number,
          denomination: spec.healingFormula.denomination,
          bonus: spec.healingFormula.bonus,
          types: [],
          custom: { enabled: false, formula: '' },
        },
        consumption: { targets: [{ type: 'itemUses', target: '', value: '1' }] },
        uses: { spent: 0, recovery: [] },
      }
    }

    return {
      _id: itemId,
      name: spec.name,
      type: 'consumable',
      system: {
        description: { value: desc },
        quantity: 1,
        weight: { value: 0, units: 'lb' },
        price: { value: 0, denomination: 'gp' },
        attunement: spec.attunement,
        rarity: spec.rarity,
        identified: true,
        type: { value: spec.consumableType ?? 'potion', subtype: '' },
        properties: props,
        uses: consumeUses,
        activation: { type: 'action', cost: 1, condition: '' },
        activities,
      },
    }
  }

  // ── Wondrous ─────────────────────────────────────────────────────────────
  const props = ['mgc', ...(spec.extraProperties ?? [])].filter((v, i, a) => a.indexOf(v) === i)
  return {
    _id: itemId,
    name: spec.name,
    type: 'equipment',
    system: {
      description: { value: desc },
      quantity: 1,
      weight: { value: 0, units: 'lb' },
      price: { value: 0, denomination: 'gp' },
      attunement: spec.attunement,
      equipped: false,
      rarity: spec.rarity,
      identified: true,
      type: { value: 'trinket', baseItem: '' },
      properties: props,
      armor: { value: 0, dex: null, magicalBonus: null },
      uses,
      activation: spec.charges ? { type: 'action', cost: 1, condition: '' } : { type: '', cost: null, condition: '' },
      activities: {},
    },
  }
}

// ── Foundry macro builder ──────────────────────────────────────────────────
function buildMacro(item: any, actorName?: string): string {
  const json = JSON.stringify(item, null, 2)
  const n = item.name

  if (actorName?.trim()) {
    const a = actorName.trim().replace(/"/g, '\\"')
    return `// Magic Item: ${n}
// Add to actor: ${a}
// Generated by D&D 5e Parser — Phase 18

const itemData = ${json};

const actor = game.actors.getName("${a}");
if (!actor) {
  ui.notifications.error("Actor not found: ${a}");
} else {
  const existing = actor.items.getName(itemData.name);
  if (existing) {
    await existing.update({ system: itemData.system });
    ui.notifications.info(\`Updated \${itemData.name} on \${actor.name}\`);
  } else {
    await actor.createEmbeddedDocuments("Item", [itemData]);
    ui.notifications.info(\`Added \${itemData.name} to \${actor.name}\`);
  }
}`
  }

  return `// Magic Item: ${n}
// Creates item in Items sidebar under "Magic Items" folder
// Generated by D&D 5e Parser — Phase 18

const itemData = ${json};

const folder = game.folders.getName("Magic Items")
  ?? await Folder.create({ name: "Magic Items", type: "Item" });

const existing = game.items.getName(itemData.name);
if (existing) {
  await existing.update({ system: itemData.system });
  ui.notifications.info(\`Updated: \${itemData.name}\`);
} else {
  await Item.create({ ...itemData, folder: folder.id });
  ui.notifications.info(\`Created: \${itemData.name}\`);
}`
}

// ── Example content ───────────────────────────────────────────────────────
const TEXT_EXAMPLE = `Flame Tongue
Weapon (longsword), rare (requires attunement)

You can use a bonus action to speak this magic sword's command word, causing flames to erupt from the blade. These flames shed bright light in a 40-foot radius and dim light for an additional 40 feet. While the sword is ablaze, it deals an extra 2d6 fire damage to any target it hits. The flames last until you use a bonus action to speak the command word again or until you drop or sheathe the sword.`

// ── Utility ───────────────────────────────────────────────────────────────
function copyText(text: string) {
  try {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(el);
      el.focus(); el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  } catch { /* clipboard unavailable — notification still shows */ }
}
function downloadText(text: string, filename: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  a.download = filename
  a.click()
}

// ── Styles ────────────────────────────────────────────────────────────────
const S = {
  page: { background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', padding: '24px' } as React.CSSProperties,
  card: { background: '#1e293b', borderRadius: 8, border: '1px solid #334155', padding: 20, marginBottom: 16 } as React.CSSProperties,
  label: { fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '.05em', display: 'block', marginBottom: 4 },
  input: { width: '100%', background: '#0f172a', border: '1px solid #475569', borderRadius: 6, padding: '8px 10px', color: '#e2e8f0', fontSize: 14, boxSizing: 'border-box' as const },
  select: { width: '100%', background: '#0f172a', border: '1px solid #475569', borderRadius: 6, padding: '8px 10px', color: '#e2e8f0', fontSize: 14 },
  textarea: { width: '100%', background: '#0f172a', border: '1px solid #475569', borderRadius: 6, padding: '8px 10px', color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', resize: 'vertical' as const, boxSizing: 'border-box' as const },
  btn: (color: string) => ({
    background: color, color: '#fff', border: 'none', borderRadius: 6,
    padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
    display: 'flex', alignItems: 'center', gap: 6,
  } as React.CSSProperties),
  modeBtn: (active: boolean) => ({
    padding: '7px 18px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
    background: active ? '#be185d' : '#1e293b', color: active ? '#fff' : '#94a3b8',
    border: active ? 'none' : '1px solid #334155',
  } as React.CSSProperties),
  typeBtn: (active: boolean) => ({
    flex: 1, padding: '8px 0', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
    background: active ? '#7e22ce' : '#0f172a', color: active ? '#fff' : '#94a3b8',
    border: active ? 'none' : '1px solid #334155',
  } as React.CSSProperties),
  row: { display: 'flex', gap: 12, alignItems: 'flex-end' } as React.CSSProperties,
  col: { flex: 1, minWidth: 0 } as React.CSSProperties,
  error: { background: '#7f1d1d', border: '1px solid #ef4444', borderRadius: 6, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 12 } as React.CSSProperties,
  code: { background: '#020817', border: '1px solid #1e293b', borderRadius: 6, padding: 14, fontFamily: 'monospace', fontSize: 12, color: '#a5f3fc', overflowX: 'auto' as const, maxHeight: 360, overflowY: 'auto' as const, whiteSpace: 'pre' as const },
}

// ── Sub-components ────────────────────────────────────────────────────────
function BonusSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <select value={value} onChange={e => onChange(+e.target.value)} style={S.select}>
      <option value={0}>No bonus</option>
      <option value={1}>+1</option>
      <option value={2}>+2</option>
      <option value={3}>+3</option>
    </select>
  )
}

function ExtraDmgEditor({ parts, onChange }: {
  parts: ExtraDmgPart[]
  onChange: (p: ExtraDmgPart[]) => void
}) {
  const add = () => onChange([...parts, { number: 1, denomination: 6, damageType: 'fire' }])
  const remove = (i: number) => onChange(parts.filter((_, j) => j !== i))
  const update = (i: number, f: Partial<ExtraDmgPart>) => onChange(parts.map((p, j) => j === i ? { ...p, ...f } : p))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={S.label}>Extra Damage</span>
        <button onClick={add} style={{ ...S.btn('#0369a1'), padding: '4px 10px', fontSize: 12 }}>
          <Plus size={12} /> Add
        </button>
      </div>
      {parts.map((p, i) => (
        <div key={i} style={{ ...S.row, marginBottom: 6 }}>
          <input type="number" min={1} max={10} value={p.number}
            onChange={e => update(i, { number: +e.target.value })}
            style={{ ...S.input, width: 56 }} />
          <span style={{ color: '#64748b', alignSelf: 'center' }}>d</span>
          <select value={p.denomination} onChange={e => update(i, { denomination: +e.target.value })} style={{ ...S.select, width: 72 }}>
            {DMG_DICE.map(d => <option key={d} value={d}>d{d}</option>)}
          </select>
          <select value={p.damageType} onChange={e => update(i, { damageType: e.target.value })} style={{ ...S.select, flex: 1 }}>
            {DAMAGE_TYPES.map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
          </select>
          <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      {parts.length === 0 && <div style={{ fontSize: 12, color: '#475569' }}>No extra damage — click Add to add a type.</div>}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────
export default function MagicItemCreator() {
  const [mode, setMode]       = useState<InputMode>('ai')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [copied, setCopied]   = useState<'json' | 'macro' | ''>('')

  // Output state
  const [itemJson, setItemJson]   = useState('')
  const [macroText, setMacroText] = useState('')
  const [itemName, setItemName]   = useState('')
  const [itemRarity, setItemRarity] = useState<Rarity>('')

  // Shared macro option
  const [actorName, setActorName] = useState('')

  // ── Text mode state ────────────────────────────────────────────────────
  const [textInput, setTextInput] = useState('')

  // ── AI mode state ──────────────────────────────────────────────────────
  const [aiName,         setAiName]         = useState('')
  const [aiType,         setAiType]         = useState<FoundryItemType>('weapon')
  const [aiBaseWeapon,   setAiBaseWeapon]   = useState('longsword')
  const [aiBaseArmor,    setAiBaseArmor]    = useState('plate')
  const [aiConsumable,   setAiConsumable]   = useState('potion')
  const [aiRarity,       setAiRarity]       = useState<Rarity>('uncommon')
  const [aiAttunement,   setAiAttunement]   = useState<Attunement>('required')
  const [aiCharges,      setAiCharges]      = useState<number | null>(null)
  const [aiRecharge,     setAiRecharge]     = useState<string>('dawn')
  const [aiDescription,  setAiDescription]  = useState('')

  // ── Builder mode state ────────────────────────────────────────────────
  const [bName,        setBName]        = useState('')
  const [bType,        setBType]        = useState<FoundryItemType>('weapon')
  const [bBaseWeapon,  setBBaseWeapon]  = useState('longsword')
  const [bBaseArmor,   setBBaseArmor]   = useState('plate')
  const [bConsumable,  setBConsumable]  = useState('potion')
  const [bRarity,      setBRarity]      = useState<Rarity>('uncommon')
  const [bAttunement,  setBAttunement]  = useState<Attunement>('required')
  const [bAtkBonus,    setBAtktBonus]   = useState(1)
  const [bMagBonus,    setBMagBonus]    = useState(1)
  const [bCharges,     setBCharges]     = useState<number | null>(null)
  const [bRecharge,    setBRecharge]    = useState('dawn')
  const [bDescription, setBDescription] = useState('')
  const [bExtraDmg,    setBExtraDmg]    = useState<ExtraDmgPart[]>([])
  const [bHealNum,     setBHealNum]     = useState(2)
  const [bHealDie,     setBHealDie]     = useState(4)
  const [bHealBonus,   setBHealBonus]   = useState('2')
  const [bIncludeHeal, setBIncludeHeal] = useState(true)

  // ── Helpers ───────────────────────────────────────────────────────────
  function finishItem(spec: MagicItemSpec) {
    const item = buildFoundryItem(spec)
    const json = JSON.stringify(item, null, 2)
    const macro = buildMacro(item, actorName)
    setItemJson(json)
    setMacroText(macro)
    setItemName(spec.name)
    setItemRarity(spec.rarity)
  }

  function updateMacro(json: string, name: string) {
    try {
      const item = JSON.parse(json)
      setMacroText(buildMacro(item, actorName))
    } catch { /* ignore */ }
  }

  // ── Text mode handler ──────────────────────────────────────────────────
  async function handleParseText() {
    if (!textInput.trim()) return
    if (!hasApiKey()) { setError('No API key — open Settings (⚙) to add your key.'); return }
    setError(''); setLoading(true)
    try {
      const raw = await generateMagicItemSpec(textInput.trim())
      const spec: MagicItemSpec = JSON.parse(raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim())
      finishItem(spec)
    } catch (e: any) {
      setError(`Parse failed: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ── AI mode handler ────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!aiDescription.trim() && !aiName.trim()) return
    if (!hasApiKey()) { setError('No API key — open Settings (⚙) to add your key.'); return }
    setError(''); setLoading(true)
    try {
      const raw = await generateMagicItemSpec(
        aiDescription.trim() || `Create a magic ${aiType} named "${aiName}"`,
        {
          name:            aiName.trim() || undefined,
          itemType:        aiType,
          baseWeapon:      aiType === 'weapon'     ? aiBaseWeapon : undefined,
          baseArmor:       aiType === 'armor'      ? aiBaseArmor  : undefined,
          consumableType:  aiType === 'consumable' ? aiConsumable : undefined,
          rarity:          aiRarity,
          attunement:      aiAttunement,
          charges:         aiCharges,
          recharge:        aiCharges ? aiRecharge : undefined,
        }
      )
      const spec: MagicItemSpec = JSON.parse(raw.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim())
      finishItem(spec)
    } catch (e: any) {
      setError(`Generation failed: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ── Builder mode handler ───────────────────────────────────────────────
  function handleBuild() {
    if (!bName.trim()) { setError('Name is required.'); return }
    setError('')
    const spec: MagicItemSpec = {
      name:        bName.trim(),
      itemType:    bType,
      rarity:      bRarity,
      attunement:  bAttunement,
      description: bDescription.trim() || `<p>${bName} is a magical item.</p>`,
      charges:     bCharges,
      recharge:    bCharges ? bRecharge : null,
      extraProperties: [],
    }
    if (bType === 'weapon') {
      spec.baseWeapon = bBaseWeapon
      spec.attackBonus = bAtkBonus
      spec.extraDamageParts = bExtraDmg.map(p => ({ number: p.number, denomination: p.denomination, types: [p.damageType] }))
    }
    if (bType === 'armor') {
      spec.baseArmor = bBaseArmor
      spec.magicalBonus = bMagBonus
    }
    if (bType === 'consumable') {
      spec.consumableType = bConsumable
      spec.healingFormula = bIncludeHeal ? { number: bHealNum, denomination: bHealDie, bonus: bHealBonus } : null
    }
    finishItem(spec)
  }

  // ── Copy helpers ──────────────────────────────────────────────────────
  function handleCopy(type: 'json' | 'macro') {
    copyText(type === 'json' ? itemJson : macroText)
    setCopied(type)
    setTimeout(() => setCopied(''), 2000)
  }

  // ── Form helpers ──────────────────────────────────────────────────────
  function TypeButtons({ value, onChange }: { value: FoundryItemType; onChange: (v: FoundryItemType) => void }) {
    const types: [FoundryItemType, string][] = [['weapon','Weapon'], ['armor','Armor'], ['wondrous','Wondrous'], ['consumable','Consumable']]
    return (
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {types.map(([t, l]) => (
          <button key={t} onClick={() => onChange(t)} style={S.typeBtn(value === t)}>{l}</button>
        ))}
      </div>
    )
  }

  function RaritySelect({ value, onChange }: { value: Rarity; onChange: (v: Rarity) => void }) {
    return (
      <select value={value} onChange={e => onChange(e.target.value as Rarity)} style={S.select}>
        {RARITIES.map(r => <option key={r} value={r}>{RARITY_LABEL[r]}</option>)}
      </select>
    )
  }

  function AttunementSelect({ value, onChange }: { value: Attunement; onChange: (v: Attunement) => void }) {
    return (
      <select value={value} onChange={e => onChange(e.target.value as Attunement)} style={S.select}>
        <option value="">No attunement</option>
        <option value="optional">Optional</option>
        <option value="required">Required</option>
      </select>
    )
  }

  function ChargesRow({ charges, recharge, onCharges, onRecharge }: {
    charges: number | null; recharge: string
    onCharges: (v: number | null) => void; onRecharge: (v: string) => void
  }) {
    return (
      <div style={S.row}>
        <div style={S.col}>
          <label style={S.label}>Charges</label>
          <input type="number" min={1} max={99}
            placeholder="None"
            value={charges ?? ''}
            onChange={e => onCharges(e.target.value ? +e.target.value : null)}
            style={S.input} />
        </div>
        {charges && (
          <div style={S.col}>
            <label style={S.label}>Recharge</label>
            <select value={recharge} onChange={e => onRecharge(e.target.value)} style={S.select}>
              {RECHARGE_OPTIONS.map(r => <option key={r} value={r}>{RECHARGE_LABEL[r]}</option>)}
            </select>
          </div>
        )}
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Wand2 size={22} color="#be185d" />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Magic Item Creator</h1>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#475569' }}>Phase 18 · dnd5e v4+</span>
        </div>

        {/* Mode selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button style={S.modeBtn(mode === 'text')}    onClick={() => setMode('text')}>Text</button>
          <button style={S.modeBtn(mode === 'ai')}      onClick={() => setMode('ai')}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={13} /> AI Generate
            </span>
          </button>
          <button style={S.modeBtn(mode === 'builder')} onClick={() => setMode('builder')}>Builder</button>
        </div>

        {error && <div style={S.error}>{error}</div>}

        {/* ── TEXT MODE ─────────────────────────────────────────────────── */}
        {mode === 'text' && (
          <div style={S.card}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Paste Item Description</h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#94a3b8' }}>
              Paste any magic item description — sourcebook text, homebrew, or freeform notes. Claude will extract the item properties and build the Foundry JSON.
            </p>
            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder={"Flame Tongue\nWeapon (longsword), rare (requires attunement)\n\nYou can use a bonus action to speak this magic sword's command word, causing flames to erupt from the blade. These flames shed bright light..."}
              style={{ ...S.textarea, minHeight: 160 }}
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                onClick={handleParseText}
                disabled={loading || !textInput.trim()}
                style={{ ...S.btn('#be185d'), opacity: loading || !textInput.trim() ? 0.5 : 1 }}
              >
                {loading ? 'Parsing…' : <><Sparkles size={14} /> Parse with Claude</>}
              </button>
              <button
                onClick={() => setTextInput(TEXT_EXAMPLE)}
                style={{ ...S.btn('#334155') }}
              >
                Load Example
              </button>
            </div>
          </div>
        )}

        {/* ── AI MODE ───────────────────────────────────────────────────── */}
        {mode === 'ai' && (
          <div style={S.card}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>AI Item Generator</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Item Name <span style={{ color: '#475569', fontWeight: 400 }}>(optional — leave blank to generate)</span></label>
              <input value={aiName} onChange={e => setAiName(e.target.value)} placeholder="Flamebrand, Ring of the Void, Potion of Giant Strength…" style={S.input} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Item Type</label>
              <TypeButtons value={aiType} onChange={setAiType} />
            </div>

            {aiType === 'weapon' && (
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Base Weapon</label>
                <select value={aiBaseWeapon} onChange={e => setAiBaseWeapon(e.target.value)} style={S.select}>
                  {WEAPONS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                </select>
              </div>
            )}
            {aiType === 'armor' && (
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Base Armor</label>
                <select value={aiBaseArmor} onChange={e => setAiBaseArmor(e.target.value)} style={S.select}>
                  {ARMORS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            )}
            {aiType === 'consumable' && (
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Consumable Type</label>
                <select value={aiConsumable} onChange={e => setAiConsumable(e.target.value)} style={S.select}>
                  {CONSUMABLE_SUBTYPES.map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            )}

            <div style={{ ...S.row, marginBottom: 14 }}>
              <div style={S.col}>
                <label style={S.label}>Rarity</label>
                <RaritySelect value={aiRarity} onChange={setAiRarity} />
              </div>
              <div style={S.col}>
                <label style={S.label}>Attunement</label>
                <AttunementSelect value={aiAttunement} onChange={setAiAttunement} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <ChargesRow charges={aiCharges} recharge={aiRecharge} onCharges={setAiCharges} onRecharge={setAiRecharge} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>What makes this item special? <span style={{ color: '#475569', fontWeight: 400 }}>Describe abilities, lore, effects, look</span></label>
              <textarea
                value={aiDescription}
                onChange={e => setAiDescription(e.target.value)}
                placeholder="A longsword forged from a dragon's tooth. On command, the blade ignites in green dragonfire dealing extra poison damage. Created by a half-dragon artificer who was slain by adventurers..."
                style={{ ...S.textarea, minHeight: 100 }}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || (!aiDescription.trim() && !aiName.trim())}
              style={{ ...S.btn('#be185d'), opacity: loading || (!aiDescription.trim() && !aiName.trim()) ? 0.5 : 1 }}
            >
              {loading ? 'Generating…' : <><Sparkles size={14} /> Generate Item</>}
            </button>
          </div>
        )}

        {/* ── BUILDER MODE ──────────────────────────────────────────────── */}
        {mode === 'builder' && (
          <div style={S.card}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Item Builder</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Item Name</label>
              <input value={bName} onChange={e => setBName(e.target.value)} placeholder="Enter item name" style={S.input} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Item Type</label>
              <TypeButtons value={bType} onChange={setBType} />
            </div>

            {bType === 'weapon' && (
              <>
                <div style={{ ...S.row, marginBottom: 14 }}>
                  <div style={S.col}>
                    <label style={S.label}>Base Weapon</label>
                    <select value={bBaseWeapon} onChange={e => setBBaseWeapon(e.target.value)} style={S.select}>
                      {WEAPONS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: '0 0 140px' }}>
                    <label style={S.label}>Attack Bonus</label>
                    <BonusSelect value={bAtkBonus} onChange={setBAtktBonus} />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <ExtraDmgEditor parts={bExtraDmg} onChange={setBExtraDmg} />
                </div>
              </>
            )}

            {bType === 'armor' && (
              <div style={{ ...S.row, marginBottom: 14 }}>
                <div style={S.col}>
                  <label style={S.label}>Base Armor</label>
                  <select value={bBaseArmor} onChange={e => setBBaseArmor(e.target.value)} style={S.select}>
                    {ARMORS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: '0 0 140px' }}>
                  <label style={S.label}>Magical Bonus</label>
                  <BonusSelect value={bMagBonus} onChange={setBMagBonus} />
                </div>
              </div>
            )}

            {bType === 'consumable' && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={S.label}>Consumable Type</label>
                  <select value={bConsumable} onChange={e => setBConsumable(e.target.value)} style={S.select}>
                    {CONSUMABLE_SUBTYPES.map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <input type="checkbox" id="includeHeal" checked={bIncludeHeal} onChange={e => setBIncludeHeal(e.target.checked)} />
                    <label htmlFor="includeHeal" style={{ fontSize: 13, color: '#cbd5e1', cursor: 'pointer' }}>Include healing activity</label>
                  </div>
                  {bIncludeHeal && (
                    <div style={S.row}>
                      <div style={{ flex: '0 0 56px' }}>
                        <label style={S.label}>Dice</label>
                        <input type="number" min={1} max={10} value={bHealNum}
                          onChange={e => setBHealNum(+e.target.value)}
                          style={{ ...S.input, width: '100%' }} />
                      </div>
                      <div style={{ flex: '0 0 80px' }}>
                        <label style={S.label}>Die</label>
                        <select value={bHealDie} onChange={e => setBHealDie(+e.target.value)} style={S.select}>
                          {DMG_DICE.map(d => <option key={d} value={d}>d{d}</option>)}
                        </select>
                      </div>
                      <div style={S.col}>
                        <label style={S.label}>Bonus</label>
                        <input value={bHealBonus} onChange={e => setBHealBonus(e.target.value)}
                          placeholder="2" style={S.input} />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div style={{ ...S.row, marginBottom: 14 }}>
              <div style={S.col}>
                <label style={S.label}>Rarity</label>
                <RaritySelect value={bRarity} onChange={setBRarity} />
              </div>
              <div style={S.col}>
                <label style={S.label}>Attunement</label>
                <AttunementSelect value={bAttunement} onChange={setBAttunement} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <ChargesRow charges={bCharges} recharge={bRecharge} onCharges={setBCharges} onRecharge={setBRecharge} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Description <span style={{ color: '#475569', fontWeight: 400 }}>(plain text or HTML)</span></label>
              <textarea
                value={bDescription}
                onChange={e => setBDescription(e.target.value)}
                placeholder="<p>This blade was forged in the heart of a volcano...</p>"
                style={{ ...S.textarea, minHeight: 80 }}
              />
            </div>

            <button onClick={handleBuild} style={S.btn('#7e22ce')}>
              <Wand2 size={14} /> Build Item JSON
            </button>
          </div>
        )}

        {/* ── OUTPUT PANEL ──────────────────────────────────────────────── */}
        {itemJson && (
          <>
            {/* Item preview header */}
            <div style={{ ...S.card, background: '#0f172a', border: '1px solid #7e22ce', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Wand2 size={18} color="#be185d" />
                <span style={{ fontWeight: 700, fontSize: 16 }}>{itemName}</span>
                {itemRarity && (
                  <span style={{
                    background: RARITY_COLOR[itemRarity] + '22',
                    border: `1px solid ${RARITY_COLOR[itemRarity]}`,
                    color: RARITY_COLOR[itemRarity],
                    borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                  }}>{RARITY_LABEL[itemRarity]}</span>
                )}
              </div>
            </div>

            {/* JSON */}
            <div style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 14 }}>Foundry Item JSON</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleCopy('json')} style={S.btn('#0369a1')}>
                    <Copy size={13} /> {copied === 'json' ? 'Copied!' : 'Copy JSON'}
                  </button>
                  <button onClick={() => downloadText(itemJson, `${itemName.toLowerCase().replace(/\s+/g, '-')}.json`)} style={S.btn('#334155')}>
                    <Download size={13} /> Download
                  </button>
                </div>
              </div>
              <div style={S.code}>{itemJson}</div>
            </div>

            {/* Macro */}
            <div style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <h3 style={{ margin: '0 0 2px', fontSize: 14 }}>Foundry Import Macro</h3>
                  <p style={{ margin: 0, fontSize: 11, color: '#475569' }}>
                    In Foundry: open the Macro Directory (bottom hotbar or press M) → New Macro → paste → Run
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleCopy('macro')} style={S.btn('#065f46')}>
                    <Copy size={13} /> {copied === 'macro' ? 'Copied!' : 'Copy Macro'}
                  </button>
                  <button onClick={() => downloadText(macroText, `${itemName.toLowerCase().replace(/\s+/g, '-')}-macro.js`)} style={S.btn('#334155')}>
                    <Download size={13} /> Download
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={S.label}>Give directly to actor <span style={{ color: '#475569', fontWeight: 400 }}>(optional — leave blank to create in Items sidebar)</span></label>
                <input
                  value={actorName}
                  onChange={e => { setActorName(e.target.value); updateMacro(itemJson, itemName) }}
                  onBlur={() => updateMacro(itemJson, itemName)}
                  placeholder="Actor name, e.g. Aric Shadowmeld"
                  style={S.input}
                />
              </div>
              <div style={S.code}>{macroText}</div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
