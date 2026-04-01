// class-importer.tsx
// Custom Class Definition → Foundry VTT dnd5e v4 JSON + Import Macro
// Phase 9

import React, { useState } from 'react';
import { Download, Copy, Info, Zap, Package, BookOpen, FileJson, Sparkles, ChevronDown, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { generateClassTemplate, hasApiKey } from './claude-api';

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
interface SubclassDef { name: string; levelGrants: Map<number, string[]>; }

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
    const feats = m[2].split(',').map(f => {
      let name = f.trim().replace(/\s*\([^)]*\)/g, '').trim();
      if (/^Ability Score Improvements?$/i.test(name)) return 'ASI';
      if (/\b(subclass|vision)\s+feature\b/i.test(name)) return 'Subclass';
      if (/\bimprovement\b/i.test(name) && !/^Ability Score/i.test(name)) return `__upgrade:${name}`;
      return name;
    }).filter(Boolean);
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

// Parses Subclass: Name blocks (not Subclasses: header) for per-subclass level progression
const parseSubclassBlocks = (text: string): SubclassDef[] => {
  const sections = text.split(/^(?=Subclass:(?!es)\s)/im);
  return sections
    .filter(s => /^Subclass:(?!es)\s/i.test(s))
    .map(section => {
      const nameMatch = section.match(/^Subclass:\s+(.+)$/im);
      const name = nameMatch?.[1]?.trim() || '';
      if (!name) return null;
      const levelGrants = parseProgression(section);
      return { name, levelGrants } as SubclassDef;
    })
    .filter(Boolean) as SubclassDef[];
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
    identifier: toSlug(subclassName),
    classIdentifier: toSlug(className),
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
  configuration: {
    items: ids.map(id => ({ uuid:`Item.${id}`, optional:false })),
    optional: false,
    spell: null,
  },
  value: {}, level:lvl, title:'',
});

const advSubclass = (cn: string, lvl: number) => ({
  _id: makeId('adv',cn,'subclass',String(lvl)),
  type: 'Subclass',
  configuration: {},
  value: {},
  level: lvl,
  title: '',
});

const advScaleValue = (cn: string, sv: ScaleValue) => ({
  _id: makeId('adv',cn,'scale',sv.identifier),
  type: 'ScaleValue',
  configuration: { identifier:sv.identifier, type:sv.type, scale:sv.scale },
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
  advancement.push(advSubclass(hdr.name, hdr.subclassLevel));

  const levelGrantNames = new Map<number, string[]>();

  for (const [lvl, feats] of Array.from(progression.entries()).sort((a,b) => a[0]-b[0])) {
    const grantIds: string[] = [];
    const grantNames: string[] = [];
    for (const feat of feats) {
      if (feat === 'ASI') {
        advancement.push(advASI(hdr.name, lvl));
      } else if (feat.toLowerCase() === 'subclass') {
        // subclass choice already added above
      } else if (feat.startsWith('__upgrade:')) {
        warns.push(`Level ${lvl}: "${feat.replace('__upgrade:','')}" is a feature upgrade — already covered by the existing item. Skipped.`);
      } else {
        const id = featureIdMap.get(feat);
        grantNames.push(feat);
        if (id) {
          grantIds.push(id);
        } else {
          warns.push(`Level ${lvl}: "${feat}" — no Feature: block found, stub item generated.`);
          grantIds.push(makeId('feat', hdr.name, feat));
        }
      }
    }
    if (grantIds.length) {
      advancement.push(advItemGrant(hdr.name, lvl, 0, grantIds));
      levelGrantNames.set(lvl, grantNames);
    }
  }

  const item = {
    _id: makeId('cls', hdr.name),
    name: hdr.name,
    type: 'class',
    img: 'systems/dnd5e/icons/svg/items/class.svg',
    system: {
      description: { value:'', chat:'' },
      source: { custom:'', rules:'2014', revision:1 },
      startingEquipment: [],
      identifier: toSlug(hdr.name),
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
  return { item, levelGrantNames };
};

// ─── Stub Feature Builder ─────────────────────────────────────────────────────
const buildStubFeature = (name: string, className: string) =>
  buildFeatureItem({ name, uses: '', description: `(Description not yet filled in for ${name}.)` }, className);

// ─── Macro Builder ────────────────────────────────────────────────────────────
const buildMacro = (
  className: string,
  featureItems: any[],
  subclassItems: any[],
  subclassLevelGrants: Record<string, Record<string, string[]>>,
  classBase: any,
  levelGrantNames: Map<number, string[]>,
) => {
  // Strip _ids — Foundry assigns real world IDs, which we capture after creation
  const featureDataForMacro = featureItems.map(({ _id, ...rest }: any) => rest);
  const subclassDataForMacro = subclassItems.map(({ _id, ...rest }: any) => rest);
  const levelGrantsObj = Object.fromEntries(
    Array.from(levelGrantNames.entries()).map(([lvl, names]) => [String(lvl), names])
  );

  return `// ${className} — Class Import Macro
// ─────────────────────────────────────────────────────────────────────
// Run this macro in Foundry VTT (Macros → New → Paste → Execute).
// Creates a folder structure, all feature/subclass items, and the class
// item, with all advancement links automatically wired to the correct items.
//
// Structure: ${className}/ → class + subclasses
//            ${className}/Features/ → all feature items
// Items: ${featureDataForMacro.length} feature(s) · ${subclassDataForMacro.length} subclass(es) · 1 class item
// ─────────────────────────────────────────────────────────────────────
(async () => {
  // Step 1 — Create main folder and Features subfolder
  const mainFolder = await Folder.create({ name: "${className}", type: "Item", color: "#4b3f8a" });
  if (!mainFolder) { ui.notifications.error("${className}: folder creation failed."); return; }
  const featFolder = await Folder.create({ name: "Features", type: "Item", color: "#2d4a6b", folder: mainFolder.id });
  if (!featFolder) { ui.notifications.error("${className}: Features subfolder creation failed."); return; }

  // Step 2 — Create all feature items inside the Features subfolder (Foundry assigns real IDs)
  const featureData = ${JSON.stringify(featureDataForMacro, null, 2)};
  const createdFeatures = await Item.create(featureData.map(i => ({ ...i, folder: featFolder.id })));
  if (!createdFeatures?.length) { ui.notifications.error("${className}: feature creation failed."); return; }

  // Step 3 — Map feature names to their actual world UUIDs
  const byName = Object.fromEntries(createdFeatures.map(i => [i.name, i.uuid]));

  // Step 4 — Create subclass items in the main folder with their feature advancements wired in
  const subclassData = ${JSON.stringify(subclassDataForMacro, null, 2)};
  const subclassGrants = ${JSON.stringify(subclassLevelGrants)};
  const subclassesWithAdv = subclassData.map(sc => {
    const grants = subclassGrants[sc.name] || {};
    const advancements = Object.entries(grants).map(([lvl, names]) => ({
      _id: foundry.utils.randomID(),
      type: "ItemGrant",
      configuration: {
        items: names.map(n => ({ uuid: byName[n] ?? ("Item.MISSING_" + n.replace(/\\s+/g, "_")), optional: false })),
        optional: false,
        spell: null,
      },
      value: {},
      level: Number(lvl),
      title: "",
    }));
    return { ...sc, folder: mainFolder.id, system: { ...sc.system, advancement: [...(sc.system.advancement || []), ...advancements] } };
  });
  if (subclassesWithAdv.length) await Item.create(subclassesWithAdv);

  // Step 5 — Build class ItemGrant advancements using real feature UUIDs
  const classLevelGrants = ${JSON.stringify(levelGrantsObj)};
  const classItemGrants = Object.entries(classLevelGrants).map(([lvl, names]) => ({
    _id: foundry.utils.randomID(),
    type: "ItemGrant",
    configuration: {
      items: names.map(n => ({ uuid: byName[n] ?? ("Item.MISSING_" + n.replace(/\\s+/g, "_")), optional: false })),
      optional: false,
      spell: null,
    },
    value: {},
    level: Number(lvl),
    title: "",
  }));

  // Step 6 — Create class item in the main folder with wired advancements
  const classData = ${JSON.stringify(classBase, null, 2)};
  classData.folder = mainFolder.id;
  classData.system.advancement.push(...classItemGrants);
  await Item.create([classData]);

  ui.notifications.info(\`${className}: created — \${createdFeatures.length} feature(s) in Features subfolder, \${subclassesWithAdv.length} subclass(es) + class item in main folder. Drag the class onto your character sheet to begin!\`);
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
Uses: @scale.technomancer.power-charges / lr
Description: Beginning at 1st level you have 3 power charges. As an action you can expend one charge and throw it at a target within 30 feet. The number of charges increases as shown on the Technomancer table.

Feature: Inventor
Description: Starting at 1st level you have crafted your first invention. Choose one item from the Basic Inventions table.

Feature: Journeyman
Description: At 2nd level your understanding of magitek deepens. You gain proficiency with tinker's tools if you don't already have it.

Feature: Knowledge Sponge
Description: Also at 2nd level, you can add half your proficiency bonus to any Intelligence check you make that doesn't already include your proficiency bonus.

Feature: Technomantic Vision
Description: Starting at 3rd level, you can use a bonus action to activate a magitek lens, giving you advantage on Perception checks that rely on sight until the end of your next turn.

Feature: Power Refill
Description: At 3rd level, when you finish a short rest you regain a number of expended power charges equal to your Intelligence modifier.

Feature: Power Surge
Uses: 1 / lr
Description: At 5th level, once per long rest you can expend all remaining power charges to unleash a devastating burst of energy dealing Charge Potency damage to all creatures in a 15-foot cone.

Feature: Quick Thinking
Description: At 5th level you can add your Intelligence modifier to your Initiative rolls.

Feature: Magiteknical Power
Description: At 7th level your magitek inventions grow more powerful. All inventions from the Basic and Advanced Inventions tables are available to you.

Feature: Fail Safe
Description: At 9th level you have rigged a failsafe into your gear. When you are reduced to 0 hit points but not killed outright, you can use your reaction to expend 2 power charges and drop to 1 hit point instead.

Feature: Weathered Toughness
Description: At 10th level your hit point maximum increases by 10 and increases by 1 again whenever you gain a level in this class.

Feature: Energy Absorption
Uses: 1 / lr
Description: At 15th level, when you take energy damage you can use your reaction to absorb some of it, regaining a number of power charges equal to half the damage taken (rounded down, minimum 1).

Feature: Tricks of the Trade
Description: At 18th level you have mastered every secret of magitek engineering. You gain the benefits of all inventions from all Invention tables.

Feature: Perfection
Description: At 20th level your mastery is complete. Your Intelligence score increases by 4, to a maximum of 24. Additionally, your power charges maximum increases by 4.

Subclass: Futurist
Level 3: Future Sight, Temporal Shift
Level 6: Accelerated Reflexes
Level 10: Time Ripple
Level 14: Paradox

Feature: Future Sight
Description: Starting at 3rd level, once per short or long rest you can see a few seconds into the future. Until the end of your next turn you have advantage on attack rolls and saving throws.

Feature: Temporal Shift
Description: Also at 3rd level, when you take damage you can use your reaction to shift slightly through time, reducing that damage by 1d10 + your Intelligence modifier.

Feature: Accelerated Reflexes
Description: At 6th level your temporal awareness sharpens. You cannot be surprised and you add your Intelligence modifier to your initiative rolls.

Feature: Time Ripple
Uses: 1 / lr
Description: At 10th level you can tear a ripple in time. As an action, choose a point within 60 feet. All creatures within 10 feet must succeed on a Wisdom saving throw or be stunned until the end of their next turn.

Feature: Paradox
Uses: 1 / lr
Description: At 14th level you can fold time itself. As an action, you return to the exact position and state you were in at the start of your last turn. Your hit points, conditions, and position all revert.`;

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ClassImporter() {
  const [input, setInput]           = useState('');
  const [bundle, setBundle]         = useState<any[] | null>(null);
  const [macroItems, setMacroItems] = useState<{
    features: any[];
    subclasses: any[];
    subclassLevelGrants: Record<string, Record<string, string[]>>;
    classBase: any;
    levelGrantNames: Map<number, string[]>;
  } | null>(null);
  const [summary, setSummary]       = useState<any>(null);
  const [warnings, setWarnings]     = useState<string[]>([]);
  const [errors, setErrors]         = useState<string[]>([]);
  const [copiedB, setCopiedB]       = useState(false);
  const [copiedM, setCopiedM]       = useState(false);
  const [building, setBuilding]     = useState(false);

  // AI Class Assistant panel
  const [aiOpen, setAiOpen]           = useState(false);
  const [aiDesc, setAiDesc]           = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError]         = useState<string | null>(null);
  const [aiSuccess, setAiSuccess]     = useState(false);

  const generateFromDesc = async () => {
    if (!aiDesc.trim()) return;
    setAiGenerating(true);
    setAiError(null);
    setAiSuccess(false);
    try {
      const result = await generateClassTemplate(aiDesc);
      setInput(result);
      setAiSuccess(true);
      setTimeout(() => setAiSuccess(false), 4000);
    } catch (err: any) {
      setAiError(err.message ?? 'Generation failed — check your API key and try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const buildClass = () => {
    setBuilding(true);
    setErrors([]); setWarnings([]); setBundle(null); setMacroItems(null); setSummary(null);
    setTimeout(() => {
    const warns: string[] = [];
    try {
      if (!input.trim()) throw new Error('Nothing to parse — paste your class definition above.');

      const text = input
        .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        .replace(/\u00A0/g, ' ')
        .replace(/^[ \t]+/gm, '');

      const header      = parseClassHeader(text, warns);
      const scales      = parseScaleValues(text);
      const progression = parseProgression(text);
      const featureDefs = parseFeatureDefs(text);

      if (!progression.size) warns.push('No Level N: lines found. Add at least "Level 1: Feature Name".');

      // ── Build class feature items ──────────────────────────────────────────
      const featureIdMap = new Map<string, string>();
      const featureItems: any[] = [];
      for (const f of featureDefs) {
        const item = buildFeatureItem(f, header.name);
        featureIdMap.set(f.name, item._id);
        featureItems.push(item);
      }

      // Stubs for class progression features with no Feature: block
      const allClassFeats = new Set(
        Array.from(progression.values()).flat()
          .filter(f => f !== 'ASI' && f.toLowerCase() !== 'subclass' && !f.startsWith('__upgrade:'))
      );
      for (const feat of allClassFeats) {
        if (!featureIdMap.has(feat)) {
          const stub = buildStubFeature(feat, header.name);
          featureIdMap.set(feat, stub._id);
          featureItems.push(stub);
          warns.push(`"${feat}" — no Feature: block found. Stub created; add description in Foundry.`);
        }
      }

      // ── Build subclass items + parse their level progression ───────────────
      const subclassIdMap = new Map<string, string>();
      const subclassItems: any[] = [];
      for (const scName of header.subclassNames) {
        const item = buildSubclassItem(scName, header.name);
        subclassIdMap.set(scName, item._id);
        subclassItems.push(item);
      }

      // Parse Subclass: Name blocks for per-subclass feature grants
      const subclassBlockDefs = parseSubclassBlocks(text);
      const subclassLevelGrantsObj: Record<string, Record<string, string[]>> = {};

      for (const scDef of subclassBlockDefs) {
        const grants: Record<string, string[]> = {};
        for (const [lvl, feats] of Array.from(scDef.levelGrants.entries()).sort((a,b) => a[0]-b[0])) {
          const grantNames: string[] = [];
          for (const feat of feats) {
            if (feat === 'ASI' || feat.toLowerCase() === 'subclass' || feat.startsWith('__upgrade:')) continue;
            // Create feature item if not already in the map (subclass-specific features)
            if (!featureIdMap.has(feat)) {
              const def = featureDefs.find(f => f.name === feat);
              const item = def
                ? buildFeatureItem(def, scDef.name)
                : buildStubFeature(feat, scDef.name);
              featureIdMap.set(feat, item._id);
              featureItems.push(item);
              if (!def) warns.push(`Subclass "${scDef.name}" Level ${lvl}: "${feat}" — no Feature: block found. Stub created.`);
            }
            grantNames.push(feat);
          }
          if (grantNames.length) grants[String(lvl)] = grantNames;
        }
        subclassLevelGrantsObj[scDef.name] = grants;
      }

      const { item: classItem, levelGrantNames } = buildClassItem(header, progression, featureIdMap, subclassIdMap, scales, warns);
      const classBase = { ...classItem, system: { ...classItem.system,
        advancement: classItem.system.advancement.filter((a: any) => a.type !== 'ItemGrant') } };
      const bundleArr = [...featureItems, ...subclassItems, classItem];

      const subclassFeatureCount = subclassBlockDefs.reduce(
        (acc, sc) => acc + Array.from(sc.levelGrants.values()).flat()
          .filter(f => f !== 'ASI' && f.toLowerCase() !== 'subclass' && !f.startsWith('__upgrade:')).length,
        0
      );

      setSummary({
        name: header.name, hitDie: header.hitDie,
        levels: progression.size,
        features: featureItems.filter(f => !subclassBlockDefs.some(sc =>
          Array.from(sc.levelGrants.values()).flat().includes(f.name)
        )).length,
        subclassFeatures: subclassFeatureCount,
        stubs: featureItems.filter(f => f.system.description.value.includes('not yet filled')).length,
        subclasses: subclassItems.length,
        subclassesWithFeatures: subclassBlockDefs.length,
        scales: scales.length,
        spellcasting: header.spellProgression !== 'none'
          ? `${header.spellProgression} / ${header.spellAbility.toUpperCase()}` : 'None',
        scaleFormula: scales.length ? `@scale.${toSlug(header.name)}.${scales[0].identifier}` : '',
        scaleRefs: scales.map(sv => ({
          name: sv.name,
          id: sv.identifier,
          ref: `@scale.${toSlug(header.name)}.${sv.identifier}`,
        })),
        itemNames: featureItems.map(f => ({
          name: f.name,
          stub: f.system.description.value.includes('not yet filled'),
          isSubclass: subclassBlockDefs.some(sc =>
            Array.from(sc.levelGrants.values()).flat().includes(f.name)
          ),
        })),
        subclassNames: subclassItems.map(s => s.name),
        subclassGrantSummary: subclassBlockDefs.map(sc => ({
          name: sc.name,
          levels: Array.from(sc.levelGrants.keys()).sort((a,b) => a-b),
        })),
      });
      setBundle(bundleArr);
      setMacroItems({ features: featureItems, subclasses: subclassItems, subclassLevelGrants: subclassLevelGrantsObj, classBase, levelGrantNames });
      setWarnings(warns);
      setErrors([]);
    } catch (e: any) {
      console.error('ClassImporter error:', e);
      setErrors([String(e?.message || e)]);
      setBundle(null); setMacroItems(null); setSummary(null);
    } finally {
      setBuilding(false);
    }
    }, 50);
  };

  const getClassItem = () => bundle?.find((i: any) => i.type === 'class') ?? null;

  const downloadJSON = () => {
    const classItem = getClassItem();
    if (!classItem) return;
    const blob = new Blob([JSON.stringify(classItem, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${summary?.name?.replace(/\s+/g,'_') || 'class'}_class_item.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const getMacroStr = () => macroItems && summary
    ? buildMacro(summary.name, macroItems.features, macroItems.subclasses, macroItems.subclassLevelGrants, macroItems.classBase, macroItems.levelGrantNames)
    : '';

  const downloadMacro = () => {
    const str = getMacroStr();
    if (!str) return;
    const blob = new Blob([str], { type: 'text/javascript' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${summary!.name.replace(/\s+/g,'_')}_import_macro.js`;
    a.click(); URL.revokeObjectURL(url);
  };

  const copyJSON = () => {
    const classItem = getClassItem();
    if (!classItem) return;
    navigator.clipboard.writeText(JSON.stringify(classItem, null, 2));
    setCopiedB(true); setTimeout(() => setCopiedB(false), 2000);
  };

  const copyMacro = () => {
    const str = getMacroStr();
    if (!str) return;
    navigator.clipboard.writeText(str);
    setCopiedM(true); setTimeout(() => setCopiedM(false), 2000);
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

            {/* AI Class Assistant — collapsible */}
            <div className="bg-slate-800 rounded-lg border border-violet-500/40 overflow-hidden">
              {/* Header toggle */}
              <button
                onClick={() => setAiOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/50 transition"
              >
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Sparkles size={15} className="text-violet-400" />
                  <span className="text-violet-300 font-semibold text-sm whitespace-nowrap">AI Class Assistant</span>
                  <span className="bg-violet-900 text-violet-300 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">Phase 16</span>
                </div>
                {aiOpen ? <ChevronDown size={14} className="text-slate-400 flex-shrink-0" /> : <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />}
              </button>

              {/* Expanded body */}
              {aiOpen && (
                <div className="px-4 pb-4 border-t border-violet-500/20 space-y-3 pt-3">
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Paste any class description — a wiki page, homebrew notes, ChatGPT output, or a PDF text dump.
                    Claude will convert it into the Class Importer format automatically.
                    Review and edit the result before building.
                  </p>

                  {/* What works well callout */}
                  <div className="bg-slate-700/50 rounded p-3 text-xs text-slate-400 space-y-1">
                    <div className="text-slate-300 font-semibold mb-1">What to include for best results:</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      <div><span className="text-violet-400">Class name & flavour</span> — theme, fantasy archetype</div>
                      <div><span className="text-violet-400">Hit die & saves</span> — d8, Constitution + Wisdom etc.</div>
                      <div><span className="text-violet-400">Proficiencies</span> — armor, weapons, skills</div>
                      <div><span className="text-violet-400">Spellcasting</span> — ability, progression (or none)</div>
                      <div><span className="text-violet-400">Resource name & scale</span> — e.g. "Power Charges, 3 at 1st"</div>
                      <div><span className="text-violet-400">Feature list</span> — names and brief descriptions by level</div>
                      <div><span className="text-violet-400">Subclass concept</span> — names or themes (Claude invents if absent)</div>
                      <div><span className="text-violet-400">ASI levels</span> — defaults to 4/8/12/16/19 if not stated</div>
                    </div>
                    <div className="text-slate-500 pt-1">
                      The more detail you provide, the closer the output will be to your vision. Vague descriptions still work — Claude fills gaps logically.
                    </div>
                  </div>

                  <textarea
                    value={aiDesc}
                    onChange={e => setAiDesc(e.target.value)}
                    placeholder={"Paste your class description here…\n\nExample: The Warden is a d10 martial class that bonds with a spirit animal. Wisdom saves. Medium armor and shields. Martial weapons. 3 from Athletics, Nature, Perception, Survival, Animal Handling. No spellcasting. Resource: Spirit Tokens (3 at 1, scaling to 8 at 20). Subclasses at level 3: Bear Totem (tankier, resistances), Wolf Totem (pack tactics, flanking bonuses), Eagle Totem (mobility, flying). Features include Spirit Strike, Primal Sense, Totem Shift..."}
                    className="w-full h-40 bg-slate-700 text-white rounded p-3 text-xs font-mono border border-violet-400/20 focus:border-violet-400 focus:outline-none resize-none"
                  />

                  {!hasApiKey() && (
                    <div className="flex items-center gap-2 text-yellow-300 text-xs bg-yellow-900/30 border border-yellow-600/30 rounded px-3 py-2">
                      <AlertTriangle size={13} />
                      No API key configured — open Settings (⚙) in the parser tool to add your Claude key.
                    </div>
                  )}

                  {aiError && (
                    <div className="flex items-start gap-2 text-red-300 text-xs bg-red-900/20 border border-red-600/30 rounded px-3 py-2">
                      <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                      {aiError}
                    </div>
                  )}

                  {aiSuccess && (
                    <div className="flex items-center gap-2 text-green-300 text-xs bg-green-900/20 border border-green-600/30 rounded px-3 py-2">
                      <CheckCircle size={13} />
                      Template generated — review and edit in the Class Definition box below, then click Build Class.
                    </div>
                  )}

                  <button
                    onClick={generateFromDesc}
                    disabled={aiGenerating || !aiDesc.trim() || !hasApiKey()}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition text-sm"
                  >
                    <Sparkles size={14} className={aiGenerating ? 'animate-pulse' : ''} />
                    {aiGenerating ? 'Generating template…' : 'Generate Template'}
                  </button>
                </div>
              )}
            </div>

            {/* Class Definition textarea */}
            <div className="bg-slate-800 rounded-lg p-5 border border-indigo-500/30">
              <label className="block text-white font-semibold mb-1">Class Definition</label>
              <p className="text-slate-400 text-xs mb-3">
                Fill in the template below. Add <span className="text-purple-400 font-mono">Subclass: Name</span> blocks with their own <span className="text-green-400 font-mono">Level N:</span> lines for subclass features.
              </p>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={TEMPLATE}
                className="w-full h-96 bg-slate-700 text-white rounded p-3 text-xs font-mono border border-indigo-400/30 focus:border-indigo-400 focus:outline-none resize-none"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={buildClass}
                  disabled={building}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2">
                  <Zap size={16} /> {building ? 'Building…' : 'Build Class'}
                </button>
                <button
                  onClick={() => setInput(TEMPLATE)}
                  className="bg-slate-600 hover:bg-slate-500 text-slate-200 font-semibold py-2 px-3 rounded transition text-xs whitespace-nowrap">
                  Load Example
                </button>
              </div>
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
              <div className="mt-2"><span className="text-purple-400">Subclass:</span> Name</div>
              <div><span className="text-green-400">Level 3:</span> Subclass Feature Name</div>
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
                    <div className="flex justify-between"><span className="text-slate-400">Class features:</span><span className="text-green-400">{summary.features}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Subclass features:</span><span className="text-purple-400">{summary.subclassFeatures}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Stubs:</span><span className={summary.stubs > 0 ? 'text-yellow-400' : 'text-green-400'}>{summary.stubs}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Subclasses:</span><span className="text-indigo-400">{summary.subclasses} ({summary.subclassesWithFeatures} with features)</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Scale values:</span><span className="text-amber-400">{summary.scales}</span></div>
                    <div className="flex justify-between col-span-2"><span className="text-slate-400">Spellcasting:</span><span className="text-sky-400">{summary.spellcasting}</span></div>
                  </div>
                  {summary.scaleRefs?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <div className="text-amber-400 text-xs font-semibold mb-1">Scale References — use these in Uses: fields</div>
                      <div className="space-y-1">
                        {summary.scaleRefs.map((r: any) => (
                          <div key={r.id} className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-slate-400">{r.name}</span>
                            <span className="text-amber-300 font-mono select-all">{r.ref}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">Append <span className="font-mono">/ lr</span> or <span className="font-mono">/ sr</span> for recovery period.</div>
                    </div>
                  )}
                  {summary.subclassGrantSummary?.length > 0 && (
                    <div className="mt-3 text-xs space-y-1">
                      {summary.subclassGrantSummary.map((sc: any) => (
                        <div key={sc.name} className="text-slate-400">
                          <span className="text-purple-400">{sc.name}</span> — features at levels: <span className="text-slate-300">{sc.levels.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* How to import */}
                <div className="bg-slate-800 rounded-lg p-4 border border-green-500/20 text-sm text-slate-300 space-y-1">
                  <div className="text-green-400 font-semibold mb-2">Import Instructions</div>
                  <div><span className="text-white font-bold">1.</span> Copy the <span className="text-amber-400">macro</span> and run it in Foundry (Macros → New → Execute).</div>
                  <div><span className="text-white font-bold">2.</span> The macro creates a folder, all features, subclasses (with their own feature grants), and the class item.</div>
                  <div><span className="text-white font-bold">3.</span> Drag the class from the folder in the Items tab onto your character sheet to begin leveling.</div>
                  <div className="text-slate-500 text-xs mt-1">The Class Item JSON below is a backup — only needed if you want to re-import the class item separately.</div>
                </div>

                {/* Feature item list */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-600/30">
                  <div className="text-slate-300 font-semibold text-sm mb-2">
                    Features ({summary.itemNames.length}) · Subclasses ({summary.subclassNames.length})
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs max-h-48 overflow-y-auto">
                    {summary.itemNames.map((f: any, i: number) => (
                      <div key={i} className={`px-2 py-0.5 rounded ${f.stub ? 'text-yellow-400' : f.isSubclass ? 'text-purple-400' : 'text-green-400'}`}>
                        {f.stub ? '⚠ ' : f.isSubclass ? '◈ ' : '✓ '}{f.name}
                      </div>
                    ))}
                    {summary.subclassNames.map((n: string, i: number) => (
                      <div key={`sc${i}`} className="px-2 py-0.5 rounded text-indigo-400">◆ {n}</div>
                    ))}
                  </div>
                </div>

                {/* Macro — Step 1 */}
                <div className="bg-slate-800 rounded-lg p-5 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-1"><Package size={20} className="text-amber-400" /><span className="text-white font-semibold">Step 1 — Complete Import Macro</span></div>
                  <p className="text-xs text-slate-400 mb-3">Creates folder + {summary.features + summary.subclassFeatures} feature(s) + {summary.subclasses} subclass(es) + class item, all wired together (Macros → New → Execute)</p>
                  <div className="flex gap-3">
                    <button onClick={copyMacro}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2">
                      <Copy size={16} />{copiedM ? 'Copied!' : 'Copy Macro'}
                    </button>
                    <button onClick={downloadMacro}
                      className="flex-1 bg-amber-600/50 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2">
                      <Download size={16} /> Download .js
                    </button>
                  </div>
                </div>

                {/* Bundle JSON — Step 2 */}
                <div className="bg-slate-800 rounded-lg p-5 border border-indigo-500/30">
                  <div className="flex items-center gap-2 mb-1"><FileJson size={20} className="text-indigo-400" /><span className="text-white font-semibold">Step 2 — Class Item JSON</span></div>
                  <p className="text-xs text-slate-400 mb-3">Single class item — paste directly into the Import Data dialog</p>
                  <div className="flex gap-3">
                    <button onClick={copyJSON}
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
