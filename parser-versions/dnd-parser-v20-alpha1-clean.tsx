// dnd-parser-v20-alpha1-clean.tsx
// D&D 5e Stat Block → Foundry VTT JSON Converter
// Parsing order: name → size → type → alignment → AC → HP → speed →
//   abilities → CR → saving throws → skills → damage immunities/resistances/vulnerabilities →
//   condition immunities → senses → languages → initiative → actions → build Foundry actor JSON
// DO NOT restructure the parseStatBlock sections without regression testing.

import React, { useState } from 'react';
import { Download, Copy, Info, FileJson, Zap, BarChart3, Edit2, Save, X, Sword } from 'lucide-react';

// ─── Pure Helpers ──────────────────────────────────────────────────────────────
const mod = (s) => Math.floor((s - 10) / 2);
const crToFloat = (cr) => cr?.includes('/') ? cr.split('/').reduce((a, b) => a / b) : parseFloat(cr || '1');
const profBonusFromCR = (cr) => {
  const n = crToFloat(cr);
  return n < 5 ? 2 : n < 9 ? 3 : n < 13 ? 4 : n < 17 ? 5 : n < 21 ? 6 : n < 25 ? 7 : n < 29 ? 8 : 9;
};

const DAMAGE_TYPES    = ['acid','bludgeoning','cold','fire','force','lightning','necrotic','piercing','poison','psychic','radiant','slashing','thunder'];
const CONDITION_TYPES = ['blinded','charmed','deafened','exhaustion','frightened','grappled','incapacitated','invisible','paralyzed','petrified','poisoned','prone','restrained','stunned','unconscious'];
const extractDamageTypes    = (t) => DAMAGE_TYPES.filter(d    => new RegExp(`\\b${d}\\b`,    'i').test(t));
const extractConditionTypes = (t) => CONDITION_TYPES.filter(c => new RegExp(`\\b${c}\\b`, 'i').test(t));

// ─── Format Detection ──────────────────────────────────────────────────────────
// Returns 'standard' | 'sidekick'. Sidekick support is Sprint 4 — this stub
// catches them early so the UI can warn rather than silently produce wrong output.
const detectFormat = (text) => {
  if (/\b(\d+(?:st|nd|rd|th)-level|Level:\s*NPC|Warrior|Expert|Spellcaster)\b/i.test(text)
    && !/Challenge|\bCR\b/i.test(text)) return 'sidekick';
  return 'standard';
};

// ─── CR → XP Table ───────────────────────────────────────────────────────────
const CR_XP = {
  '0':0,'1/8':25,'1/4':50,'1/2':100,
  '1':200,'2':450,'3':700,'4':1100,'5':1800,'6':2300,'7':2900,'8':3900,
  '9':5000,'10':5900,'11':7200,'12':8400,'13':10000,'14':11500,'15':13000,
  '16':15000,'17':18000,'18':20000,'19':22000,'20':25000,
  '21':33000,'22':41000,'23':50000,'24':62000,'25':75000,
  '26':90000,'27':105000,'28':120000,'29':135000,'30':155000
};
const crToXP = (cr) => CR_XP[cr] ?? CR_XP[String(Math.round(crToFloat(cr)))] ?? 0;

// ─── Shared Section Stop ───────────────────────────────────────────────────────
// Every field regex uses this lookahead to prevent bleed when a section header
// is absent (Obstacle #6) or appears on the same line (Obstacle #9).
const SECSTOP = '(?=\\n\\s*(?:Saving\\s+Throws?|Skills|(?:Damage\\s+)?Vulnerabilit|(?:Damage\\s+)?Resistanc|(?:Damage\\s+)?Immunit|Condition\\s+Immunit|Senses|Languages|Initiative|Challenge|\\bCR\\b|Traits?|Actions?|Reactions?|Legendary\\s+Actions?|Bonus\\s+Actions?|Lair\\s+Actions?)|$)';

// ─── Dice Formula → DamageField (Foundry dnd5e v4.0+ Activities) ───────────────
// "2d8+5" → { number, denomination, bonus, types[], custom, scaling }
const parseDiceFormula = (s) => {
  if (!s) return null;
  const m = String(s).trim().match(/^(\d+)\s*d\s*(\d+)\s*([+-]\s*\d+)?$/i);
  if (m) return { number:+m[1], denomination:+m[2], bonus:m[3]?m[3].replace(/\s/g,''):'', types:[], custom:{enabled:false,formula:''}, scaling:{mode:'',number:null,formula:''} };
  return { number:0, denomination:0, bonus:'', types:[], custom:{enabled:true,formula:String(s).trim()}, scaling:{mode:'',number:null,formula:''} };
};

// ─── Save DC / Ability Extractor ────────────────────────────────────────────────
const SAVE_ABBR = {strength:'str',dexterity:'dex',constitution:'con',intelligence:'int',wisdom:'wis',charisma:'cha',str:'str',dex:'dex',con:'con',int:'int',wis:'wis',cha:'cha'};
const parseSaveInfo = (desc) => {
  let m = desc.match(/(\w+)\s+Saving\s+Throw:\s*DC\s*(\d+)/i);           // 2024: "Strength Saving Throw: DC 13"
  if (m) return { ability: SAVE_ABBR[m[1].toLowerCase()]||'str', dc: m[2] };
  m = desc.match(/DC\s+(\d+)[^.]{0,60}?(\w+)\s+saving\s+throw/i);        // 2014: "DC 13 Strength saving throw"
  if (m) return { ability: SAVE_ABBR[m[2].toLowerCase()]||'str', dc: m[1] };
  return null;
};

// ─── Action Parser ─────────────────────────────────────────────────────────────
const parseActions = (text) => {
  const section = text.match(/Actions\s+([\s\S]+?)(?=Reactions|Legendary Actions|Bonus Actions|$)/i)?.[1];
  if (!section) return [];
  const actions = [];
  let cur = null;
  for (const line of section.split('\n').map(l => l.trim()).filter(Boolean)) {
    const m = line.match(/^([A-Z][A-Za-z\s\-']+?)(?:\s*\(([^)]*)\))?\.\s+(.*)$/);
    if (m) { if (cur) actions.push(cur); cur = { name: m[1].trim(), qualifier: m[2]?.trim()||'', description: m[3].trim(), attack: null, damage: null }; }
    else if (cur) cur.description += ' ' + line;
  }
  if (cur) actions.push(cur);
  actions.forEach(a => {
    const d = a.description;
    const atk = d.match(/(?:Melee|Ranged|Melee or Ranged)\s+(?:Weapon\s+)?Attack(?:\s+Roll)?:\s*([+-]\d+)/i);
    const rch = d.match(/reach\s+(\d+)\s*ft/i);
    const rng = d.match(/range\s+(\d+)(?:\/(\d+))?\s*ft/i);
    const hit = d.match(/Hit:\s*(\d+)\s*\(([^)]+)\)\s+(\w+)\s+damage/i);
    const add = d.match(/plus\s+(\d+)\s*\(([^)]+)\)\s+(\w+)\s+damage/i);
    if (atk) a.attack = { bonus: +atk[1], reach: rch ? +rch[1] : null, range: rng ? { normal: +rng[1], long: rng[2] ? +rng[2] : null } : null };
    if (hit) { a.damage = { formula: hit[2], type: hit[3].toLowerCase() }; if (add) a.damage.additional = { formula: add[2], type: add[3].toLowerCase() }; }
  });
  return actions;
};

// ─── Generic Section Parser ───────────────────────────────────────────────────
// Extracts { name, qualifier, description } entries from any named section.
// Used for Traits (passive), Reactions, and Bonus Actions.
const ALL_SEC_STOP = 'Traits?|Actions?|Bonus\\s+Actions?|Reactions?|Legendary\\s+Actions?|Lair\\s+Actions?';
const parseSection = (text, headerRx) => {
  const sec = text.match(
    new RegExp(`(?:^|\\n)[ \\t]*${headerRx}[ \\t]*(?:\\n|$)([\\s\\S]+?)(?=\\n[ \\t]*(?:${ALL_SEC_STOP})[ \\t]*(?:\\n|$)|$)`, 'i')
  )?.[1];
  if (!sec) return [];
  const out = []; let cur = null;
  for (const line of sec.split('\n').map(l => l.trim()).filter(Boolean)) {
    const m = line.match(/^([A-Z][A-Za-z\s\-']+?)(?:\s*\(([^)]*)\))?\.\s+(.*)$/);
    if (m) { if (cur) out.push(cur); cur = { name:m[1].trim(), qualifier:m[2]?.trim()||'', description:m[3].trim() }; }
    else if (cur) cur.description += ' ' + line;
  }
  if (cur) out.push(cur);
  return out;
};

// ─── Simple Feat Item Builder ─────────────────────────────────────────────────
// Produces a Foundry feat item with a utility activity.
// actType: '' = passive trait, 'reaction' = reaction, 'bonus' = bonus action.
const makeSimpleItem = (a, actorName, actType) => {
  const itemId = `${actorName}${a.name}`.toLowerCase().replace(/[\s']/g,'').slice(0,16).padEnd(16,'0');
  const actId  = `${actorName}${a.name}act`.toLowerCase().replace(/[\s']/g,'').slice(0,16).padEnd(16,'0');
  const cost   = actType ? 1 : 0;
  return { _id:itemId, name:a.name, type:'feat',
    system:{ description:{value:a.description},
      activation:{type:actType||'', cost, condition:''},
      uses:{value:null,max:null,per:null,recovery:[]},
      activities:{[actId]:{ _id:actId, type:'utility', name:'',
        activation:{type:actType||'', cost, condition:''}, uses:{spent:0,recovery:[]} }} } };
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function StatBlockParser() {
  const [input, setInput]           = useState('');
  const [output, setOutput]         = useState(null);
  const [errors, setErrors]         = useState([]);
  const [warnings, setWarnings]     = useState([]);
  const [parseStats, setParseStats] = useState(null);
  const [copied, setCopied]         = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editField, setEditField]   = useState(null);
  const [editValue, setEditValue]   = useState('');

  const startEdit = (name) => { setEditField(name); setEditValue(parseStats?.fields.find(f => f.name === name)?.value ?? ''); };
  const saveEdit  = () => { if (!editField) return; setParseStats(p => ({ ...p, fields: p.fields.map(f => f.name === editField ? { ...f, value: editValue } : f) })); setEditField(null); };

  const parseStatBlock = (text) => {
    const errs = [], warns = [];
    const stats = { parsed: 0, total: 0, exact: 0, fields: [] };
    const track = (name, value, ok) => { stats.total++; if (ok) { stats.parsed++; stats.exact++; } stats.fields.push({ name, value: String(value), method: ok ? 'exact' : 'default' }); };
    try {
      if (!text.trim()) throw new Error('No content to parse');

      // Format detection
      const format = detectFormat(text);
      if (format === 'sidekick') warns.push('Sidekick format detected — full support coming in v2.0');

      // Name
      const name = text.split('\n').map(l => l.trim()).find(Boolean) || 'Unknown';
      track('name', name, true);

      // Size
      const sizeM = text.match(/\b(tiny|small|medium|large|huge|gargantuan)\b/i);
      const size  = sizeM?.[1]?.toLowerCase() || 'medium';
      const sizeCode = { tiny:'tiny', small:'sm', medium:'med', large:'lg', huge:'huge', gargantuan:'grg' }[size] || 'med';
      track('size', size, !!sizeM);

      // Type
      const typeM = text.match(/\b(beast|humanoid|dragon|undead|elemental|monstrosity|fey|fiend|giant|ooze|plant|construct|celestial|aberration)\b/i);
      const type  = typeM?.[1]?.toLowerCase() || 'humanoid';
      track('type', type, !!typeM);

      // Alignment
      const alignM  = text.match(/(?:tiny|small|medium|large|huge|gargantuan)\s+(?:\w+)[^,]*,\s*(.+?)(?:\n|$)/i) || text.match(/alignment[:\s]+(.+?)(?:\n|$)/i);
      const alignment = alignM?.[1]?.trim() || 'unaligned';
      track('alignment', alignment, !!alignM);

      // AC / HP
      const acM = text.match(/(?:AC|Armor Class)[:\s]*(\d+)/i);
      const ac  = acM ? +acM[1] : 10;
      if (!acM) warns.push('AC not found, using 10');
      track('ac', ac, !!acM);

      const hpM      = text.match(/(?:HP|Hit Points)[:\s]*(\d+)(?:\s*\(([^)]+)\))?/i);
      const hp       = hpM ? +hpM[1] : 5;
      const hpFormula = hpM?.[2] || '';
      if (!hpM) warns.push('HP not found, using 5');
      track('hp', hp, !!hpM);

      // Speed
      const spdM  = text.match(/Speed\s+(\d+)\s*ft\.(?:,\s*(?:Fly|fly)\s+(\d+)\s*ft\.)?(?:,\s*(?:Climb|climb)\s+(\d+)\s*ft\.)?(?:,\s*(?:Swim|swim)\s+(\d+)\s*ft\.)?(?:,\s*(?:Burrow|burrow)\s+(\d+)\s*ft\.)?/i);
      const speeds = { walk: spdM ? +spdM[1] : 30, fly: spdM?.[2] ? +spdM[2] : 0, climb: spdM?.[3] ? +spdM[3] : 0, swim: spdM?.[4] ? +spdM[4] : 0, burrow: spdM?.[5] ? +spdM[5] : 0 };
      track('speed', `${speeds.walk} ft.`, !!spdM);

      // Abilities
      let abilities = { str:10, dex:10, con:10, int:10, wis:10, cha:10 };
      let abM = text.match(/STR\s+(\d+),?\s+DEX\s+(\d+),?\s+CON\s+(\d+),?\s+INT\s+(\d+),?\s+WIS\s+(\d+),?\s+CHA\s+(\d+)/i)
             || text.match(/STR\s+(\d+)\s*\([+-]\d+\)\s+DEX\s+(\d+)\s*\([+-]\d+\)\s+CON\s+(\d+)\s*\([+-]\d+\)\s+INT\s+(\d+)\s*\([+-]\d+\)\s+WIS\s+(\d+)\s*\([+-]\d+\)\s+CHA\s+(\d+)/i);
      if (abM) { abilities = { str:+abM[1], dex:+abM[2], con:+abM[3], int:+abM[4], wis:+abM[5], cha:+abM[6] }; }
      else {
        const ms = ['Str','Dex','Con','Int','Wis','Cha'].map(ab => text.match(new RegExp(`${ab}\\s+(\\d+)\\s+[+-−]?\\d+\\s+[+-−]?\\d+`, 'i')));
        if (ms.every(Boolean)) { [abilities.str, abilities.dex, abilities.con, abilities.int, abilities.wis, abilities.cha] = ms.map(m => +m[1]); abM = true; }
        else warns.push('Abilities not found, using 10s');
      }
      track('abilities', `STR ${abilities.str} DEX ${abilities.dex} CON ${abilities.con}`, !!abM);

      // CR
      const crM = text.match(/CR\s+(\d+(?:\/\d+)?)\s*\([^)]*\)/i) || text.match(/Challenge[:\s]+(\d+(?:\/\d+)?)/i) || text.match(/\bCR[:\s]+(\d+(?:\/\d+)?)/i);
      const cr  = crM?.[1] || '1';
      if (!crM) warns.push('CR not found, using 1');
      track('cr', cr, !!crM);
      const profBonus = profBonusFromCR(cr);

      // Saving Throws
      let savesText = text.match(new RegExp('(?:Saving Throws|Save):\\s*(.+?)' + SECSTOP, 'is'))?.[1]?.trim() || '';
      if (!savesText) {
        const fs = ['Str','Dex','Con','Int','Wis','Cha'].map(ab => {
          const m1 = text.match(new RegExp(`${ab}\\s+\\d+\\s+[+-]?\\d+\\s+([+-]\\d+)`, 'i'));
          const m2 = text.match(new RegExp(`${ab}\\s+\\d+\\s+([+-]?\\d+)`, 'i'));
          return (m1 && m2 && m1[1] !== m2[1]) ? `${ab} ${m1[1]}` : null;
        }).filter(Boolean);
        if (fs.length) savesText = fs.join(', ');
      }
      track('saves', savesText || 'none', !!savesText);
      const saves = { str:0, dex:0, con:0, int:0, wis:0, cha:0 };
      savesText.split(',').forEach(e => { const m = e.trim().match(/^(str|dex|con|int|wis|cha)\s*([+-]\d+)/i); if (m && +m[2] > mod(abilities[m[1].toLowerCase()])) saves[m[1].toLowerCase()] = 1; });

      // Skills
      const skillM  = text.match(new RegExp('Skills[:\\s]+(.+?)' + SECSTOP, 'is'));
      const skillTxt = skillM?.[1]?.trim() || '';
      track('skills', skillTxt || 'none', !!skillM);
      const SKILL_MAP = { 'acrobatics':'acr','animal handling':'ani','arcana':'arc','athletics':'ath','deception':'dec','history':'his','insight':'ins','intimidation':'itm','investigation':'inv','medicine':'med','nature':'nat','perception':'prc','performance':'prf','persuasion':'per','religion':'rel','sleight of hand':'slt','stealth':'ste','survival':'sur' };
      const SKILL_AB  = { acr:'dex',ani:'wis',arc:'int',ath:'str',dec:'cha',his:'int',ins:'wis',itm:'cha',inv:'int',med:'wis',nat:'int',prc:'wis',prf:'cha',per:'cha',rel:'int',slt:'dex',ste:'dex',sur:'wis' };
      const skills = Object.fromEntries(Object.values(SKILL_MAP).map(s => [s, { ability: SKILL_AB[s], value: 0, bonuses: { check:'', passive:'' } }]));
      skillTxt.split(',').forEach(e => {
        const m = e.trim().match(/^([a-zA-Z\s]+?)\s*([+-]\d+)/);
        if (m) { const s = SKILL_MAP[m[1].trim().toLowerCase()]; if (s) skills[s].value = +m[2] >= mod(abilities[SKILL_AB[s]]) + profBonus * 2 ? 2 : +m[2] > mod(abilities[SKILL_AB[s]]) ? 1 : 0; }
      });

      // Senses / Languages / Initiative
      const senseM = text.match(new RegExp('Senses[:\\s]+(.+?)' + SECSTOP, 'is'));
      const sensesRaw = senseM?.[1]?.trim() || '';
      track('senses', sensesRaw || 'none', !!senseM);
      const darkvision  = +(sensesRaw.match(/darkvision\s+(\d+)\s*ft/i)?.[1]  || 0);
      const blindsight  = +(sensesRaw.match(/blindsight\s+(\d+)\s*ft/i)?.[1]  || 0);
      const tremorsense = +(sensesRaw.match(/tremorsense\s+(\d+)\s*ft/i)?.[1] || 0);
      const truesight   = +(sensesRaw.match(/truesight\s+(\d+)\s*ft/i)?.[1]   || 0);
      const sensesSpecial = sensesRaw
        .replace(/darkvision\s+\d+\s*ft\.?,?\s*/i,  '')
        .replace(/blindsight\s+\d+\s*ft\.?,?\s*/i,  '')
        .replace(/tremorsense\s+\d+\s*ft\.?,?\s*/i, '')
        .replace(/truesight\s+\d+\s*ft\.?,?\s*/i,   '')
        .replace(/,?\s*passive\s+perception\s+\d+/i, '')
        .replace(/^[,;\s]+|[,;\s]+$/g, '').trim();

      const langM    = text.match(new RegExp('Languages[:\\s]+(.+?)' + SECSTOP, 'is'));
      const languages = langM?.[1]?.trim().replace(/\([^)]*\)/g, '').trim() || '';
      track('languages', languages || 'none', !!langM);

      const initM    = text.match(/Initiative\s+([+-]\d+)/i);
      const initBonus = initM?.[1] || '';
      track('initiative', initBonus || 'auto', !!initM);

      // Damage Resistances — handles "Damage Resistances" (2014) and "Resistances" (2024)
      const drM    = text.match(new RegExp('(?:Damage\\s+)?Resistances?[:\\s]+(.+?)' + SECSTOP, 'is'));
      const drText = drM?.[1]?.trim() || '';
      track('damage resistances', drText || 'none', !!drM);

      // Damage Vulnerabilities — handles "Damage Vulnerabilities" (2014) and "Vulnerabilities" (2024)
      const dvM    = text.match(new RegExp('(?:Damage\\s+)?Vulnerabilities?[:\\s]+(.+?)' + SECSTOP, 'is'));
      const dvText = dvM?.[1]?.trim() || '';
      track('damage vulnerabilities', dvText || 'none', !!dvM);

      // Immunities — handles:
      //   2014: separate "Damage Immunities" and "Condition Immunities" lines
      //   2024: combined "Immunities <damage>; <conditions>" on one line
      const diOldM = text.match(new RegExp('Damage\\s+Immunities?[:\\s]+(.+?)' + SECSTOP, 'is'));
      const ciOldM = text.match(new RegExp('Condition\\s+Immunities?[:\\s]+(.+?)' + SECSTOP, 'is'));
      let diText = diOldM?.[1]?.trim() || '';
      let ciText = ciOldM?.[1]?.trim() || '';
      if (!diOldM && !ciOldM) {
        const immNewM = text.match(new RegExp('\\bImmunities?[:\\s]+(.+?)' + SECSTOP, 'is'));
        if (immNewM) {
          const parts = immNewM[1].split(';');
          diText = parts[0]?.trim() || '';
          ciText = parts[1]?.trim() || '';
        }
      }
      track('damage immunities',    diText || 'none', !!(diOldM || diText));
      track('condition immunities', ciText || 'none', !!(ciOldM || ciText));

      // Sections — Traits / Actions / Bonus Actions / Reactions
      const traits       = parseSection(text, 'Traits?');
      const actions      = parseActions(text);
      const bonusActions = parseSection(text, 'Bonus\\s+Actions?');
      const reactions    = parseSection(text, 'Reactions?');
      track('traits',        `${traits.length} trait(s)`,            traits.length > 0);
      track('actions',       `${actions.length} action(s)`,          actions.length > 0);
      track('bonus actions', `${bonusActions.length} bonus action(s)`, bonusActions.length > 0);
      track('reactions',     `${reactions.length} reaction(s)`,      reactions.length > 0);

      // ── Build Foundry Actor ──
      const ABS = ['str','dex','con','int','wis','cha'];
      const foundryActor = {
        name, type: 'npc',
        system: {
          abilities: Object.fromEntries(ABS.map(ab => [ab, { value: abilities[ab], proficient: saves[ab] }])),
          attributes: {
            ac:       { flat: ac, calc: 'natural', formula: '' },
            hp:       { value: hp, max: hp, temp: 0, tempmax: 0, formula: hpFormula },
            init:     { ability: 'dex', bonus: initBonus },
            movement: { ...speeds, units: 'ft', hover: false },
            senses:   { darkvision, blindsight, tremorsense, truesight, units: 'ft', special: sensesSpecial }
          },
          details: {
            alignment, type: { value: type, subtype: '', custom: '' },
            cr: crToFloat(cr), xp: { value: crToXP(cr) }, biography: { value: '', public: '' }
          },
          traits: {
            size: sizeCode,
            languages: { value: languages ? languages.split(',').map(l => l.trim().toLowerCase().replace(/\s+/g, '')) : [], custom: '' },
            di: { value: extractDamageTypes(diText),    bypasses: [], custom: '' },
            dr: { value: extractDamageTypes(drText),    bypasses: [], custom: '' },
            dv: { value: extractDamageTypes(dvText),    bypasses: [], custom: '' },
            ci: { value: extractConditionTypes(ciText), custom: '' }
          },
          skills,
          resources: {
            legact: { value: 0, max: 0, sr: false, lr: true, label: 'Legendary Actions' },
            legres: { value: 0, max: 0, sr: false, lr: true, label: 'Legendary Resistances' },
            lair:   { value: 0, max: 0, sr: false, lr: true, label: 'Lair Actions' }
          }
        },
        items: [
          ...traits.map(a => makeSimpleItem(a, name, '')),
          ...actions.map(a => {
          const itemId = `${name}${a.name}`.toLowerCase().replace(/[\s']/g,'').slice(0,16).padEnd(16,'0');
          const actId  = `${name}${a.name}act`.toLowerCase().replace(/[\s']/g,'').slice(0,16).padEnd(16,'0');
          // Recharge (e.g. qualifier = "Recharge 4–6")
          const rchM = a.qualifier?.match(/Recharge\s+(\d+)(?:[–\-]\d+)?/i);
          const itemUses = rchM
            ? { value:+rchM[1], max:'6', per:null, recovery:[{period:'recharge',formula:rchM[1],type:'recoverAll'}] }
            : { value:null, max:null, per:null, recovery:[] };
          // Classify
          const isMeleeOrRanged = /Melee\s+or\s+Ranged/i.test(a.description);
          const isMelee  = /Melee\s+(?:Weapon\s+)?Attack(?:\s+Roll)?:/i.test(a.description);
          const isRanged = /Ranged\s+(?:Weapon\s+)?Attack(?:\s+Roll)?:/i.test(a.description);
          const isAttack = !!a.attack;
          const saveInfo = parseSaveInfo(a.description);
          const atkValue = isMeleeOrRanged||isMelee ? 'mwak' : isRanged ? 'rwak' : 'mwak';
          // Infer attack ability from stat bonus vs listed attack bonus
          let atkAbility='', atkBonus='';
          if (isAttack && a.attack?.bonus!=null) {
            const strTot=mod(abilities.str)+profBonus, dexTot=mod(abilities.dex)+profBonus, b=a.attack.bonus;
            if (Math.abs(b-strTot)<=Math.abs(b-dexTot)) { atkAbility='str'; const d=b-strTot; atkBonus=d?String(d):''; }
            else { atkAbility='dex'; const d=b-dexTot; atkBonus=d?String(d):''; }
          }
          // Damage fields (DamageField format)
          const baseDmg = a.damage ? {...parseDiceFormula(a.damage.formula), types:[a.damage.type]} : null;
          const addDmg  = a.damage?.additional ? {...parseDiceFormula(a.damage.additional.formula), types:[a.damage.additional.type]} : null;
          // Build activity entry
          let activity;
          if (isAttack) {
            activity = { _id:actId, type:'attack', name:'', activation:{type:'action',cost:1,condition:''},
              attack:{ ability:atkAbility, bonus:atkBonus, flat:false, type:{value:atkValue,classification:'weapon'} },
              damage:{ includeBase:true, parts:addDmg?[addDmg]:[] },
              range: a.attack?.range ? {value:a.attack.range.normal,long:a.attack.range.long??null,units:'ft'}
                   : a.attack?.reach ? {value:a.attack.reach,long:null,units:'ft'} : {value:null,long:null,units:'ft'},
              target:{ template:{count:'',contiguous:false,type:'',size:'',width:'',height:'',angle:'',range:''},
                       affects:{count:'1',type:'creature',choice:false,special:''}, prompt:true },
              uses:{spent:0,recovery:[]} };
          } else if (saveInfo) {
            activity = { _id:actId, type:'save', name:'', activation:{type:'action',cost:1,condition:''},
              save:{ ability:[saveInfo.ability], dc:{calculation:'',formula:saveInfo.dc} },
              damage:{ onSave:'half', parts:baseDmg?[baseDmg]:[] },
              uses:{spent:0,recovery:[]} };
          } else {
            activity = { _id:actId, type:'utility', name:'', activation:{type:'action',cost:1,condition:''},
              uses:{spent:0,recovery:[]} };
          }
          return { _id:itemId, name:a.name, type:isAttack?'weapon':'feat',
            system:{ description:{value:a.description}, activation:{type:'action',cost:1,condition:''},
              uses:itemUses, ...(baseDmg&&isAttack?{damage:{base:baseDmg}}:{}),
              activities:{[actId]:activity} } };
          }),
          ...bonusActions.map(a => makeSimpleItem(a, name, 'bonus')),
          ...reactions.map(a => makeSimpleItem(a, name, 'reaction')),
        ],
        effects: [], flags: {}
      };

      stats.accuracy = Math.round((stats.parsed / stats.total) * 100);
      setErrors(errs); setWarnings(warns); setParseStats(stats); setOutput(foundryActor);
    } catch (err) { setErrors([err.message]); setWarnings([]); setOutput(null); setParseStats(null); }
  };

  // ─── Small UI helpers ──────────────────────────────────────────────────────
  const Alert = ({ msg, color }) => (
    <div className={`${color} rounded p-2 flex gap-2 text-sm`}><Info size={16} className="flex-shrink-0 mt-0.5" /><span>{msg}</span></div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <h1 className="text-4xl font-bold text-white">D&D Stat Block Converter</h1>
          <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Sword size={14} /> v2.0-alpha.1</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg p-5 border border-purple-500/30">
              <label className="block text-white font-semibold mb-3">Paste Stat Block</label>
              <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Paste D&D 5e stat block here..."
                className="w-full h-56 bg-slate-700 text-white rounded p-3 text-sm font-mono border border-purple-400/30 focus:border-purple-400 focus:outline-none resize-none" />
              <button onClick={() => parseStatBlock(input)} className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2">
                <Zap size={16} /> Parse Stat Block
              </button>
            </div>

            {errors.length > 0 && <div className="space-y-2">{errors.map((e, i) => <Alert key={i} msg={e} color="bg-red-900/30 border border-red-600 text-red-200" />)}</div>}

            {parseStats && (
              <div className="bg-slate-800 rounded-lg p-4 border border-blue-500/30">
                <div className="flex items-center gap-2 text-blue-400 mb-3"><BarChart3 size={18} /><span className="font-semibold">Parse Analytics</span></div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Accuracy:</span>
                  <span className={`font-bold ${parseStats.accuracy >= 95 ? 'text-green-400' : parseStats.accuracy >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>{parseStats.accuracy}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded h-2 mb-2">
                  <div className={`h-2 rounded ${parseStats.accuracy >= 95 ? 'bg-green-500' : parseStats.accuracy >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${parseStats.accuracy}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Parsed:</span><span className="text-green-400 font-bold">{parseStats.parsed}/{parseStats.total}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Exact:</span><span className="text-blue-400 font-bold">{parseStats.exact}</span></div>
                </div>
              </div>
            )}

            {warnings.length > 0 && <div className="space-y-2 max-h-40 overflow-y-auto">{warnings.map((w, i) => <Alert key={i} msg={w} color="bg-yellow-900/30 border border-yellow-600 text-yellow-200" />)}</div>}
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-2 space-y-4">
            {output ? (
              <>
                <button onClick={() => setShowEditor(!showEditor)} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2">
                  <Edit2 size={16} />{showEditor ? 'Hide' : 'Show'} Field Editor
                </button>

                {showEditor && (
                  <div className="bg-slate-800 rounded-lg p-4 border border-amber-500/30">
                    <h3 className="text-white font-semibold mb-3">Edit Parsed Fields</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {parseStats?.fields.map((field, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="text-slate-400 w-24 font-semibold">{field.name}:</span>
                          {editField === field.name ? (
                            <>
                              <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} className="flex-1 bg-slate-700 text-white rounded px-2 py-1 text-sm border border-amber-400 focus:outline-none" />
                              <button onClick={saveEdit} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center gap-1"><Save size={14} /> Save</button>
                              <button onClick={() => setEditField(null)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"><X size={14} /></button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-white truncate">{field.value}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${field.method === 'exact' ? 'bg-green-600/30 text-green-400' : 'bg-slate-600/30 text-slate-400'}`}>{field.method}</span>
                              <button onClick={() => startEdit(field.name)} className="text-amber-400 hover:text-amber-300"><Edit2 size={14} /></button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {output.items?.length > 0 && (
                  <div className="bg-slate-800 rounded-lg p-4 border border-orange-500/30">
                    <div className="flex items-center gap-2 text-orange-400 mb-3"><Sword size={18} /><span className="font-semibold">Parsed Actions ({output.items.length})</span></div>
                    <div className="space-y-3">
                      {output.items.map((item, idx) => {
                        const act = Object.values(item.system.activities||{})[0];
                        return (
                        <div key={idx} className="bg-slate-700 rounded p-3">
                          <div className="font-semibold text-white mb-1">
                            {item.name}
                            {item.system.uses?.recovery?.length > 0 && <span className="ml-2 text-xs text-yellow-400">(Recharge {item.system.uses.value}–6)</span>}
                            {item.system.activation?.type === 'reaction' && <span className="ml-2 text-xs text-blue-400">[reaction]</span>}
                            {item.system.activation?.type === 'bonus'    && <span className="ml-2 text-xs text-emerald-400">[bonus]</span>}
                            {!item.system.activation?.type && item.type === 'feat' && <span className="ml-2 text-xs text-purple-400">[trait]</span>}
                            {item.type === 'weapon' && <span className="ml-2 text-xs text-slate-500">[weapon]</span>}
                          </div>
                          {act?.type==='attack' && <div className="text-sm text-green-400">Attack [{act.attack?.type?.value?.toUpperCase()}] · {act.attack?.ability?.toUpperCase()}{act.attack?.bonus ? ` +${act.attack.bonus} extra` : ''}</div>}
                          {act?.type==='save' && <div className="text-sm text-blue-400">Save: DC {act.save?.dc?.formula} {act.save?.ability?.[0]?.toUpperCase()}</div>}
                          {act?.type==='utility' && !!item.system.activation?.type && <div className="text-sm text-slate-400">No roll</div>}
                          {item.system.damage?.base && <div className="text-sm text-red-400">Damage: {item.system.damage.base.number}d{item.system.damage.base.denomination}{item.system.damage.base.bonus} {item.system.damage.base.types?.[0]}</div>}
                          <div className="text-xs text-slate-400 mt-2 line-clamp-2">{item.system.description.value}</div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-slate-800 rounded-lg p-5 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-3"><FileJson size={20} className="text-green-400" /><label className="text-white font-semibold">Foundry VTT Actor JSON</label></div>
                  <pre className="w-full h-80 bg-slate-700 text-green-400 rounded p-3 text-xs font-mono overflow-auto border border-green-400/30">{JSON.stringify(output, null, 2)}</pre>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => { const b = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `${output.name.replace(/\s+/g,'_')}_foundry.json`; a.click(); URL.revokeObjectURL(u); }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"><Download size={16} /> Download JSON</button>
                    <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(output, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="flex-1 bg-green-600/50 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"><Copy size={16} /> {copied ? 'Copied!' : 'Copy JSON'}</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-800 rounded-lg p-12 border border-purple-500/30 flex items-center justify-center text-slate-400 h-96">
                <p>Parse a stat block to see output</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
