// class-importer.tsx
// Custom Class Definition → Foundry VTT dnd5e v4 JSON + Import Macro
// Phase 9

import React, { useState } from 'react';
import { Download, Copy, Info, Zap, Package, BookOpen } from 'lucide-react';

// ─── Pure Helpers ─────────────────────────────────────────────────────────────
const _djb2 = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36).padStart(7, '0').slice(0, 7);
};
const makeId = (...parts: string[]) => {
  const k = parts.join('').toLowerCase().replace(/[\s']/g, '');
  return (_djb2(k) + _djb2(k + '~')).slice(0, 16).padEnd(16, '0');
};
const toSlug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ─── Lookup Maps ──────────────────────────────────────────────────────────────
const ARMOR_MAP: Record<string, string> = {
  'light':'armor:lgt', 'medium':'armor:med', 'heavy':'armor:hvy',
  'shield':'armor:shl', 'shields':'armor:shl',
};
const WEAPON_MAP: Record<string, string> = {
  'simple':'weapon:sim', 'martial':'weapon:mar',
};
const SAVE_MAP: Record<string, string> = {
  str:'saves:str', dex:'saves:dex', con:'saves:con',
  int:'saves:int', wis:'saves:wis', cha:'saves:cha',
  strength:'saves:str', dexterity:'saves:dex', constitution:'saves:con',
  intelligence:'saves:int', wisdom:'saves:wis', charisma:'saves:cha',
};
const SKILL_MAP: Record<string, string> = {
  'acrobatics':'skills:acr', 'animal handling':'skills:ani', 'arcana':'skills:arc',
  'athletics':'skills:ath', 'deception':'skills:dec', 'history':'skills:his',
  'insight':'skills:ins', 'intimidation':'skills:itm', 'investigation':'skills:inv',
  'medicine':'skills:med', 'nature':'skills:nat', 'perception':'skills:prc',
  'performance':'skills:prf', 'persuasion':'skills:per', 'religion':'skills:rel',
  'sleight of hand':'skills:slt', 'stealth':'skills:ste', 'survival':'skills:sur',
};
const SPELL_PROG: Record<string, string> = {
  full:'full', half:'half', third:'third',
  artificer:'artificer', pact:'pact', warlock:'pact', none:'none',
};
const SPELL_AB: Record<string, string> = {
  int:'int', intelligence:'int', wis:'wis', wisdom:'wis', cha:'cha', charisma:'cha',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface ClassHeader {
  name: string; hitDie: string; saves: string[]; armor: string[]; weapons: string[];
  skillCount: number; skillPool: string[]; spellProgression: string; spellAbility: string;
  subclassLevel: number; subclassNames: string[];
}
interface ScaleValue {
  name: string; identifier: string; type: 'string' | 'dice' | 'number';
  scale: Record<string, any>;
}
interface FeatureDef { name: string; uses: string; description: string; }

// ─── Parsers ──────────────────────────────────────────────────────────────────
const parseClassHeader = (text: string, warns: string[]): ClassHeader => {
  const get = (key: string) =>
    text.match(new RegExp(`^${key}:\\s*(.+)`, 'im'))?.[1]?.trim() || '';

  const name      = get('Class') || 'Unnamed Class';
  const hitDie    = get('HitDie') || 'd8';
  const saves     = get('Saves').split(',').map(s => SAVE_MAP[s.trim().toLowerCase()]).filter(Boolean);
  const armor     = get('Armor').split(',').map(a => ARMOR_MAP[a.trim().toLowerCase()]).filter(Boolean);
  const weapons   = get('Weapons').split(',').map(w => WEAPON_MAP[w.trim().toLowerCase()]).filter(Boolean);
  const skillsRaw = get('Skills');
  const skillCount = parseInt(skillsRaw.match(/^(\d+)/)?.[1] || '2');
  const skillFrom  = skillsRaw.replace(/^\d+\s+from\s+/i, '');
  const skillPool  = skillFrom.split(',').map(s => SKILL_MAP[s.trim().toLowerCase()]).filter(Boolean);
  const spellRaw   = get('Spellcasting');
  const [progPart, abPart] = spellRaw.split('/').map(s => s.trim().toLowerCase());
  const spellProgression = SPELL_PROG[progPart] || 'none';
  const spellAbility     = SPELL_AB[abPart] || '';
  const subclassLevel    = parseInt(get('SubclassLevel') || '3');
  const subclassNames    = get('Subclasses').split(',').map(s => s.trim()).filter(Boolean);

  if (!saves.length)    warns.push('No saves parsed from Saves: line — check abbreviations (CON, INT, etc.).');
  if (!skillPool.length && skillsRaw) warns.push('No skills parsed — check skill names match standard D&D skill list.');
  return { name, hitDie, saves, armor, weapons, skillCount, skillPool,
           spellProgression, spellAbility, subclassLevel, subclassNames };
};

const parseScaleValues = (text: string): ScaleValue[] => {
  const scales: ScaleValue[] = [];
  const rx = /^Scale:\s*(.+?)\s*\|\s*(string|dice|number)\s*\|\s*(.+)$/gim;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text)) !== null) {
    const name = m[1].trim();
    const type = m[2].trim() as 'string' | 'dice' | 'number';
    const scale: Record<string, any> = {};
    for (const entry of m[3].trim().split(',')) {
      const [lvl, val] = entry.trim().split(':');
      if (!lvl || val === undefined) continue;
      if      (type === 'string') scale[lvl.trim()] = { value: val.trim() };
      else if (type === 'number') scale[lvl.trim()] = { value: +val.trim() };
      else {
        const dm = val.trim().match(/^(\d+)d(\d+)$/);
        scale[lvl.trim()] = dm
          ? { number: +dm[1], faces: +dm[2], modifiers: [] }
          : { value: val.trim() };
      }
    }
    scales.push({ name, identifier: toSlug(name), type, scale });
  }
  return scales;
};

const parseProgression = (text: string): Map<number, string[]> => {
  const map = new Map<number, string[]>();
  const rx = /^Level\s+(\d+):\s*(.+)$/gim;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text)) !== null) {
    const lvl = parseInt(m[1]);
    const feats = m[2].split(',').map(f => f.trim()).filter(Boolean);
    map.set(lvl, feats);
  }
  return map;
};

const parseFeatureDefs = (text: string): FeatureDef[] => {
  const defs: FeatureDef[] = [];
  for (const block of text.split(/^Feature:\s*/im).filter(Boolean)) {
    const lines = block.split('\n');
    const name = lines[0].trim();
    if (!name) continue;
    let uses = '', descLines: string[] = [], inDesc = false;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!inDesc && /^Uses:\s*/i.test(line)) {
        uses = line.replace(/^Uses:\s*/i, '').trim();
      } else if (/^Description:\s*/i.test(line)) {
        inDesc = true;
        const first = line.replace(/^Description:\s*/i, '').trim();
        if (first) descLines.push(first);
      } else if (inDesc) {
        descLines.push(line);
      }
    }
    defs.push({ name, uses, description: descLines.join('\n').trim() });
  }
  return defs;
};

// ─── Uses Struct Builder ──────────────────────────────────────────────────────
const buildUses = (usesStr: string) => {
  if (!usesStr) return { max: '', spent: 0, recovery: [] };
  const [maxPart, perPart] = usesStr.split('/').map(s => s.trim());
  const per = ({ lr:'lr', sr:'sr', day:'day' } as Record<string, string>)[perPart?.toLowerCase()] || null;
  return { max: maxPart || '', spent: 0, recovery: per ? [{ period: per, type: 'recoverAll' }] : [] };
};

// ─── Item Builders ────────────────────────────────────────────────────────────
const buildFeatureItem = (f: FeatureDef, className: string) => ({
  _id: makeId('feat', className, f.name),
  name: f.name,
  type: 'feat',
  img: 'systems/dnd5e/icons/svg/items/feature.svg',
  system: {
    description: { value: f.description ? `<p>${f.description.replace(/\n/g, '</p><p>')}</p>` : '', chat: '' },
    source: { custom: '', rules: '2014', revision: 1 },
    cover: null, crewed: false,
    uses: buildUses(f.uses),
    type: { value: 'class', subtype: '' },
    prerequisites: { level: null, items: [], repeatable: false },
    properties: [], requirements: '',
    identifier: toSlug(f.name),
    activities: {}, advancement: [], enchant: {},
  },
  effects: [], flags: {},
});

const buildSubclassItem = (subclassName: string, className: string) => ({
  _id: makeId('sub', className, subclassName),
  name: subclassName,
  type: 'subclass',
  img: 'systems/dnd5e/icons/svg/items/subclass.svg',
  system: {
    description: { value: '', chat: '' },
    source: { custom: '', rules: '2014', revision: 1 },
    identifier: subclassName.trim(),
    classIdentifier: className.trim(),
    advancement: [],
    spellcasting: { progression: 'none', ability: '', preparation: {} },
  },
  effects: [], flags: {},
});

// ─── Advancement Builders ─────────────────────────────────────────────────────
const advHP = (cn: string) =>
  ({ _id: makeId('adv',cn,'hp'), type:'HitPoints', configuration:{}, value:{} });

const advASI = (cn: string, lvl: number) => ({
  _id: makeId('adv',cn,'asi',String(lvl)),
  type: 'AbilityScoreImprovement',
  configuration: { points:2, fixed:{str:0,dex:0,con:0,int:0,wis:0,cha:0}, cap:2, locked:[], recommendation:null },
  value: { type:'asi' }, level:lvl, title:'', hint:'',
});

const advTrait = (cn: string, tag: string, grants: string[], choices: any[], lvl: number, cr = '') => ({
  _id: makeId('adv',cn,'trait',tag,String(lvl)),
  type: 'Trait',
  configuration: { mode:'default', allowReplacements:false, grants, choices },
  value: { chosen:[] }, level:lvl, title:'', hint:'',
  ...(cr ? { classRestriction: cr } : {}),
});

const advItemGrant = (cn: string, lvl: number, idx: number, ids: string[]) => ({
  _id: makeId('adv',cn,'grant',String(lvl),String(idx)),
  type: 'ItemGrant',
  configuration: { items: ids.map(id => ({ uuid:`Item.${id}`, optional:false })), optional:false, spell:null },
  value: {}, level:lvl, title:'', hint:'',
});

const advSubclassChoice = (cn: string, lvl: number, subclassIds: string[]) => ({
  _id: makeId('adv',cn,'subclass',String(lvl)),
  type: 'ItemChoice',
  configuration: {
    choices: { [String(lvl)]: { count:null, replacement:true } },
    allowDrops: false, type:'feat',
    pool: subclassIds.map(id => ({ uuid:`Item.${id}` })),
    spell: null, restriction: { type:'class', subtype:'', list:[] },
  },
  value: { added:{}, replaced:{} }, title:'', hint:'',
});

const advScaleValue = (cn: string, sv: ScaleValue) => ({
  _id: makeId('adv',cn,'scale',sv.identifier),
  type: 'ScaleValue',
  configuration: { identifier:sv.identifier, type:sv.type, distance:{ units:'' }, scale:sv.scale },
  value: {}, title:sv.name, hint:'',
});

// ─── Class Builder ────────────────────────────────────────────────────────────
const buildClassItem = (
  hdr: ClassHeader,
  progression: Map<number, string[]>,
  featureIdMap: Map<string, string>,
  subclassIdMap: Map<string, string>,
  scales: ScaleValue[],
  warns: string[],
) => {
  const advancement: any[] = [];
  advancement.push(advHP(hdr.name));
  if (hdr.armor.length)    advancement.push(advTrait(hdr.name,'armor',   hdr.armor,   [], 1, 'primary'));
  if (hdr.weapons.length)  advancement.push(advTrait(hdr.name,'weapons', hdr.weapons, [], 1));
  if (hdr.saves.length)    advancement.push(advTrait(hdr.name,'saves',   hdr.saves,   [], 1, 'primary'));
  if (hdr.skillPool.length) advancement.push(advTrait(hdr.name,'skills', [],
    [{ count: hdr.skillCount, pool: hdr.skillPool }], 1, 'primary'));
  for (const sv of scales) advancement.push(advScaleValue(hdr.name, sv));
  advancement.push(advSubclassChoice(hdr.name, hdr.subclassLevel,
    Array.from(subclassIdMap.values())));

  for (const [lvl, feats] of Array.from(progression.entries()).sort((a,b) => a[0]-b[0])) {
    const grantIds: string[] = [];
    for (const feat of feats) {
      if (feat === 'ASI') {
        advancement.push(advASI(hdr.name, lvl));
      } else if (feat.toLowerCase() === 'subclass') {
        // subclass choice already added above
      } else {
        const id = featureIdMap.get(feat);
        if (id) {
          grantIds.push(id);
        } else {
          warns.push(`Level ${lvl}: "${feat}" — no Feature: block found, stub item generated.`);
          grantIds.push(makeId('feat', hdr.name, feat));
        }
      }
    }
    if (grantIds.length) advancement.push(advItemGrant(hdr.name, lvl, 0, grantIds));
  }

  return {
    _id: makeId('cls', hdr.name),
    name: hdr.name,
    type: 'class',
    img: 'systems/dnd5e/icons/svg/items/class.svg',
    system: {
      description: { value:'', chat:'' },
      source: { custom:'', rules:'2014', revision:1 },
      startingEquipment: [],
      identifier: hdr.name.trim(),
      levels: 1,
      advancement,
      spellcasting: hdr.spellProgression !== 'none'
        ? { progression:hdr.spellProgression, ability:hdr.spellAbility, preparation:{ formula:'' } }
        : { progression:'none', ability:'', preparation:{ formula:'' } },
      wealth: '',
      hd: { denomination: hdr.hitDie, spent:0, additional:'' },
      primaryAbility: { value:[], all:true },
      properties: [],
    },
    effects: [], flags: {},
  };
};

// ─── Stub Feature Builder (for undefined progression entries) ─────────────────
const buildStubFeature = (name: string, className: string) =>
  buildFeatureItem({ name, uses: '', description: `(Description not yet filled in for ${name}.)` }, className);

// ─── Macro Builder ────────────────────────────────────────────────────────────
const buildMacro = (className: string, featureItems: any[], subclassItems: any[]) => {
  const allItems = [...featureItems, ...subclassItems];
  return `// ${className} — Class Import Macro
// ─────────────────────────────────────────────────────────────────────
// Step 1: Run this macro in Foundry VTT (Macros → New → Paste → Execute).
//         This creates all feature and subclass items with stable IDs
//         so the class item's advancement links will resolve correctly.
//
// Step 2: After the macro runs, create a new blank Class item in Foundry,
//         open it, click the ⚙ Import button, and paste the class item JSON.
//
// Items created: ${allItems.length} (${featureItems.length} feature(s), ${subclassItems.length} subclass(es))
// ─────────────────────────────────────────────────────────────────────
(async () => {
  const items = ${JSON.stringify(allItems, null, 2)};
  const created = await Item.create(items);
  ui.notifications.info(\`${className}: \${created.length} item(s) created successfully.\`);
})();`;
};

// ─── Input Template ───────────────────────────────────────────────────────────
const TEMPLATE = `Class: Technomancer
HitDie: d8
Saves: CON, INT
Armor: Light, Shields
Weapons: Simple
Skills: 2 from Arcana, History, Insight, Investigation, Persuasion, Sleight of Hand
Spellcasting: artificer / INT
SubclassLevel: 3
Subclasses: Futurist, Enhancer, War Tinker

Scale: Power Charges | string | 1:3, 2:4, 3:5, 5:6, 8:7, 11:8, 14:9, 17:10, 20:12
Scale: Charge Potency | dice | 1:2d6, 3:3d6, 6:4d6, 11:5d6, 16:6d6, 20:7d6

Level 1: Magiteknical Energy, Power Charges, Inventor
Level 2: Journeyman, Knowledge Sponge
Level 3: Subclass, Technomantic Vision, Power Refill
Level 4: ASI
Level 5: Power Surge, Quick Thinking
Level 6: Technomantic Vision
Level 7: Magiteknical Power
Level 8: ASI
Level 9: Fail Safe
Level 10: Inventor, Weathered Toughness
Level 11: Technomantic Vision
Level 12: ASI
Level 13: Fail Safe
Level 14: Power Surge
Level 15: Energy Absorption
Level 16: ASI
Level 17: Technomantic Vision
Level 18: Tricks of the Trade, Fail Safe
Level 19: ASI
Level 20: Perfection

Feature: Magiteknical Energy
Description: You have learned to harness energy into power charges and channel them into powerful attacks.

Feature: Power Charges
Uses: @scale.Technomancer.power-charges / lr
Description: Beginning at 1st level you have 3 power charges. As an action you can expend one charge and throw it at a target within 30 feet. The number of charges increases as shown on the Technomancer table.

Feature: Inventor
Description: Starting at 1st level you have crafted your first invention. Choose one item from the Basic Inventions table.`;

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ClassImporter() {
  const [input, setInput]       = useState('');
  const [bundle, setBundle]     = useState<any[] | null>(null);
  const [macro, setMacro]       = useState<string | null>(null);
  const [summary, setSummary]   = useState<any>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors]     = useState<string[]>([]);
  const [copiedB, setCopiedB]   = useState(false);
  const [copiedM, setCopiedM]   = useState(false);

  const buildClass = () => {
    const warns: string[] = [], errs: string[] = [];
    try {
      if (!input.trim()) throw new Error('Nothing to parse — paste your class definition above.');

      // Parse all sections
      const header      = parseClassHeader(input, warns);
      const scales      = parseScaleValues(input);
      const progression = parseProgression(input);
      const featureDefs = parseFeatureDefs(input);

      if (!progression.size) warns.push('No Level N: lines found. Add at least "Level 1: Feature Name".');

      // Build feature items
      const featureIdMap = new Map<string, string>();
      const featureItems: any[] = [];
      for (const f of featureDefs) {
        const item = buildFeatureItem(f, header.name);
        featureIdMap.set(f.name, item._id);
        featureItems.push(item);
      }

      // Stub items for progression entries with no Feature: block
      const allProgressionFeats = new Set(
        Array.from(progression.values()).flat()
          .filter(f => f !== 'ASI' && f.toLowerCase() !== 'subclass')
      );
      for (const feat of allProgressionFeats) {
        if (!featureIdMap.has(feat)) {
          const stub = buildStubFeature(feat, header.name);
          featureIdMap.set(feat, stub._id);
          featureItems.push(stub);
          warns.push(`"${feat}" — no Feature: block found. Stub created; add description in Foundry.`);
        }
      }

      // Build subclass items
      const subclassIdMap = new Map<string, string>();
      const subclassItems: any[] = [];
      for (const scName of header.subclassNames) {
        const item = buildSubclassItem(scName, header.name);
        subclassIdMap.set(scName, item._id);
        subclassItems.push(item);
      }

      // Build class item
      const classItem = buildClassItem(header, progression, featureIdMap, subclassIdMap, scales, warns);

      // Bundle: features first (macro creates them), then subclasses, class last
      const bundleArr = [...featureItems, ...subclassItems, classItem];
      const macroStr  = buildMacro(header.name, featureItems, subclassItems);

      setSummary({
        name: header.name, hitDie: header.hitDie,
        levels: progression.size,
        features: featureItems.length, stubs: featureItems.filter(f => f.system.description.value.includes('not yet filled')).length,
        subclasses: subclassItems.length, scales: scales.length,
        spellcasting: header.spellProgression !== 'none' ? `${header.spellProgression} / ${header.spellAbility.toUpperCase()}` : 'None',
        scaleFormula: scales.length ? `@scale.${header.name}.${scales[0].identifier}` : '',
      });
      setBundle(bundleArr);
      setMacro(macroStr);
      setWarnings(warns);
      setErrors([]);
    } catch (e: any) {
      setErrors([e.message]);
      setBundle(null); setMacro(null); setSummary(null);
    }
  };

  const downloadJSON = () => {
    if (!bundle) return;
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${summary?.name?.replace(/\s+/g,'_') || 'class'}_foundry_bundle.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadMacro = () => {
    if (!macro) return;
    const blob = new Blob([macro], { type: 'text/javascript' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${summary?.name?.replace(/\s+/g,'_') || 'class'}_import_macro.js`;
    a.click(); URL.revokeObjectURL(url);
  };

  const copy = (text: string, which: 'b' | 'm') => {
    navigator.clipboard.writeText(text);
    if (which === 'b') { setCopiedB(true); setTimeout(() => setCopiedB(false), 2000); }
    else               { setCopiedM(true); setTimeout(() => setCopiedM(false), 2000); }
  };

  const Alert = ({ msg, color }: { msg: string; color: string }) => (
    <div className={`${color} rounded p-2 flex gap-2 text-sm`}>
      <Info size={16} className="flex-shrink-0 mt-0.5" /><span>{msg}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <h1 className="text-4xl font-bold text-white">Custom Class Importer</h1>
          <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">Phase 9</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Input ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg p-5 border border-indigo-500/30">
              <label className="block text-white font-semibold mb-1">Class Definition</label>
              <p className="text-slate-400 text-xs mb-3">
                Fill in the template below. Every field on a line by itself. Scale, Level, and Feature blocks can appear in any order.
              </p>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={TEMPLATE}
                className="w-full h-96 bg-slate-700 text-white rounded p-3 text-xs font-mono border border-indigo-400/30 focus:border-indigo-400 focus:outline-none resize-none"
              />
              <button
                onClick={buildClass}
                className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2">
                <Zap size={16} /> Build Class
              </button>
            </div>

            {/* Format reference */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-600/30 text-xs text-slate-400 space-y-1">
              <div className="text-slate-300 font-semibold mb-2">Format Reference</div>
              <div><span className="text-indigo-400">Class:</span> Name</div>
              <div><span className="text-indigo-400">HitDie:</span> d6 / d8 / d10 / d12</div>
              <div><span className="text-indigo-400">Saves:</span> CON, INT</div>
              <div><span className="text-indigo-400">Armor:</span> Light, Shields</div>
              <div><span className="text-indigo-400">Weapons:</span> Simple, Martial</div>
              <div><span className="text-indigo-400">Skills:</span> 2 from Arcana, History...</div>
              <div><span className="text-indigo-400">Spellcasting:</span> artificer / INT</div>
              <div><span className="text-indigo-400">SubclassLevel:</span> 3</div>
              <div><span className="text-indigo-400">Subclasses:</span> Name1, Name2</div>
              <div className="mt-2"><span className="text-amber-400">Scale:</span> Name | string|dice|number | 1:val, 5:val</div>
              <div><span className="text-green-400">Level 1:</span> Feature, Feature, ASI, Subclass</div>
              <div className="mt-2"><span className="text-purple-400">Feature:</span> Name</div>
              <div><span className="text-purple-400">Uses:</span> @scale.Class.id / lr</div>
              <div><span className="text-purple-400">Description:</span> text...</div>
              <div className="mt-2 text-slate-500">Spellcasting progressions: full half third artificer pact none</div>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="space-y-2">
                {errors.map((e, i) => <Alert key={i} msg={e} color="bg-red-900/30 border border-red-600 text-red-200" />)}
              </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {warnings.map((w, i) => <Alert key={i} msg={w} color="bg-yellow-900/30 border border-yellow-600 text-yellow-200" />)}
              </div>
            )}
          </div>

          {/* ── Right: Output ────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {summary ? (
              <>
                {/* Summary card */}
                <div className="bg-slate-800 rounded-lg p-4 border border-indigo-500/30">
                  <div className="flex items-center gap-2 text-indigo-400 mb-3">
                    <BookOpen size={18} /><span className="font-semibold">Class Summary</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Name:</span><span className="text-white font-bold">{summary.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Hit Die:</span><span className="text-white">{summary.hitDie}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Levels defined:</span><span className="text-green-400">{summary.levels}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Features:</span><span className="text-green-400">{summary.features}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Stubs:</span><span className={summary.stubs > 0 ? 'text-yellow-400' : 'text-green-400'}>{summary.stubs}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Subclasses:</span><span className="text-indigo-400">{summary.subclasses}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Scale values:</span><span className="text-amber-400">{summary.scales}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Spellcasting:</span><span className="text-sky-400">{summary.spellcasting}</span></div>
                  </div>
                  {summary.scaleFormula && (
                    <div className="mt-3 text-xs text-slate-400">
                      Scale formula prefix: <span className="text-amber-300 font-mono">{summary.scaleFormula}</span>
                    </div>
                  )}
                </div>

                {/* How to import */}
                <div className="bg-slate-800 rounded-lg p-4 border border-green-500/20 text-sm text-slate-300 space-y-1">
                  <div className="text-green-400 font-semibold mb-2">Import Instructions</div>
                  <div><span className="text-white font-bold">1.</span> Copy the <span className="text-amber-400">macro</span> and run it in Foundry (Macros → New → Execute).</div>
                  <div><span className="text-white font-bold">2.</span> Create a blank Class item in the Items tab, open it, click <span className="text-slate-300 font-mono">⚙ Import Data</span>.</div>
                  <div><span className="text-white font-bold">3.</span> Paste the <span className="text-indigo-400">bundle JSON</span>, find the class item (last in the array), and import it.</div>
                  <div className="text-slate-500 text-xs mt-1">The macro creates features with stable IDs — the class advancement links resolve automatically.</div>
                </div>

                {/* Macro output */}
                <div className="bg-slate-800 rounded-lg p-5 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-3"><Package size={20} className="text-amber-400" /><span className="text-white font-semibold">Step 1 — Foundry Import Macro</span></div>
                  <pre className="w-full h-48 bg-slate-700 text-amber-300 rounded p-3 text-xs font-mono overflow-auto border border-amber-400/20">{macro}</pre>
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => copy(macro!, 'm')}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2">
                      <Copy size={16} />{copiedM ? 'Copied!' : 'Copy Macro'}
                    </button>
                    <button onClick={downloadMacro}
                      className="flex-1 bg-amber-600/50 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2">
                      <Download size={16} /> Download .js
                    </button>
                  </div>
                </div>

                {/* Bundle JSON output */}
                <div className="bg-slate-800 rounded-lg p-5 border border-indigo-500/30">
                  <div className="flex items-center gap-2 mb-3"><FileJson size={20} className="text-indigo-400" /><span className="text-white font-semibold">Step 2 — Class Bundle JSON ({bundle?.length} items)</span></div>
                  <pre className="w-full h-64 bg-slate-700 text-indigo-300 rounded p-3 text-xs font-mono overflow-auto border border-indigo-400/20">{JSON.stringify(bundle, null, 2)}</pre>
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => copy(JSON.stringify(bundle, null, 2), 'b')}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2">
                      <Copy size={16} />{copiedB ? 'Copied!' : 'Copy JSON'}
                    </button>
                    <button onClick={downloadJSON}
                      className="flex-1 bg-indigo-600/50 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2">
                      <Download size={16} /> Download JSON
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-800 rounded-lg p-12 border border-indigo-500/30 flex flex-col items-center justify-center text-slate-400 h-96 gap-3">
                <BookOpen size={40} className="text-indigo-600" />
                <p>Paste your class definition and click Build Class</p>
                <p className="text-xs text-slate-600">See the format reference panel on the left</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
