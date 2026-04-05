// dnd-parser-v20-stable.tsx
// D&D 5e Stat Block → Foundry VTT JSON Converter
// Parsing order: name → size → type → alignment → AC → HP → speed →
//   abilities → CR → saving throws → skills → damage immunities/resistances/vulnerabilities →
//   condition immunities → senses → languages → initiative → actions → build Foundry actor JSON
// DO NOT restructure the parseStatBlock sections without regression testing.

import React, { useState, useRef } from 'react';
import { Download, Copy, Info, FileJson, Zap, BarChart3, Edit2, Save, X, Sword, Image, Link, FileText, Loader, Sparkles } from 'lucide-react';
import { toFantasyGroundsXML } from './fantasy-grounds-exporter';
import { extractStatBlockFromImage, extractStatBlockFromUrl, generateStatBlockFromName, generateCustomStatBlock, hasApiKey } from './claude-api';

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

const SPELL_LEVEL_WORD = {'1st':1,'2nd':2,'3rd':3,'4th':4,'5th':5,'6th':6,'7th':7,'8th':8,'9th':9};
const SPELL_AB_MAP = {intelligence:'int',wisdom:'wis',charisma:'cha',int:'int',wis:'wis',cha:'cha'};

// ─── Spell Metadata Lookup ─────────────────────────────────────────────────────
// Static map of common SRD/NPC spells → { level, school }.
// Used to:
//   1. Fill system.school on all spell items (never available from the stat block).
//   2. Correct system.level for innate/2024-format spells, which default to 0
//      because the stat block lists them by frequency (At Will / N/Day), not level.
//      mode:'spell' + level:0 = intentional cantrip — lookup confirms, not overrides.
//      mode:'innate'/'atwill' + level:0 = placeholder — lookup corrects to real level.
// School codes: abj con div enc evo ill nec trs
const SPELL_META: Record<string,{level:number,school:string}> = {
  // ── Cantrips (0) ──────────────────────────────────────────────────────────
  'acid splash':{level:0,school:'con'}, 'blade ward':{level:0,school:'abj'},
  'chill touch':{level:0,school:'nec'}, 'dancing lights':{level:0,school:'evo'},
  'druidcraft':{level:0,school:'trs'}, 'eldritch blast':{level:0,school:'evo'},
  'fire bolt':{level:0,school:'evo'}, 'friends':{level:0,school:'enc'},
  'guidance':{level:0,school:'div'}, 'light':{level:0,school:'evo'},
  'mage hand':{level:0,school:'con'}, 'mending':{level:0,school:'trs'},
  'message':{level:0,school:'trs'}, 'minor illusion':{level:0,school:'ill'},
  'poison spray':{level:0,school:'con'}, 'prestidigitation':{level:0,school:'trs'},
  'produce flame':{level:0,school:'con'}, 'ray of frost':{level:0,school:'evo'},
  'resistance':{level:0,school:'abj'}, 'sacred flame':{level:0,school:'evo'},
  'shillelagh':{level:0,school:'trs'}, 'shocking grasp':{level:0,school:'evo'},
  'spare the dying':{level:0,school:'nec'}, 'thaumaturgy':{level:0,school:'trs'},
  'toll the dead':{level:0,school:'nec'}, 'true strike':{level:0,school:'div'},
  'vicious mockery':{level:0,school:'enc'}, 'word of radiance':{level:0,school:'evo'},
  // ── 1st Level ─────────────────────────────────────────────────────────────
  'alarm':{level:1,school:'abj'}, 'bane':{level:1,school:'enc'},
  'bless':{level:1,school:'enc'}, 'burning hands':{level:1,school:'evo'},
  'charm person':{level:1,school:'enc'}, 'color spray':{level:1,school:'ill'},
  'command':{level:1,school:'enc'}, 'comprehend languages':{level:1,school:'div'},
  'cure wounds':{level:1,school:'evo'}, 'detect evil and good':{level:1,school:'div'},
  'detect magic':{level:1,school:'div'}, 'detect poison and disease':{level:1,school:'div'},
  'disguise self':{level:1,school:'ill'}, 'dissonant whispers':{level:1,school:'enc'},
  'divine favor':{level:1,school:'evo'}, 'false life':{level:1,school:'nec'},
  'feather fall':{level:1,school:'trs'}, 'fog cloud':{level:1,school:'con'},
  'grease':{level:1,school:'con'}, 'guiding bolt':{level:1,school:'evo'},
  'healing word':{level:1,school:'evo'}, 'hellish rebuke':{level:1,school:'evo'},
  'heroism':{level:1,school:'enc'}, 'hex':{level:1,school:'enc'},
  'hideous laughter':{level:1,school:'enc'}, 'hunter\'s mark':{level:1,school:'div'},
  'identify':{level:1,school:'div'}, 'inflict wounds':{level:1,school:'nec'},
  'jump':{level:1,school:'trs'}, 'longstrider':{level:1,school:'trs'},
  'mage armor':{level:1,school:'abj'}, 'magic missile':{level:1,school:'evo'},
  'protection from evil and good':{level:1,school:'abj'},
  'ray of sickness':{level:1,school:'nec'}, 'sanctuary':{level:1,school:'abj'},
  'shield':{level:1,school:'abj'}, 'shield of faith':{level:1,school:'abj'},
  'silent image':{level:1,school:'ill'}, 'sleep':{level:1,school:'enc'},
  'speak with animals':{level:1,school:'div'}, 'thunderwave':{level:1,school:'evo'},
  'unseen servant':{level:1,school:'con'}, 'witch bolt':{level:1,school:'evo'},
  // ── 2nd Level ─────────────────────────────────────────────────────────────
  'alter self':{level:2,school:'trs'}, 'arcane lock':{level:2,school:'abj'},
  'augury':{level:2,school:'div'}, 'barkskin':{level:2,school:'trs'},
  'blindness/deafness':{level:2,school:'nec'}, 'blur':{level:2,school:'ill'},
  'calm emotions':{level:2,school:'enc'}, 'cloud of daggers':{level:2,school:'con'},
  'crown of madness':{level:2,school:'enc'}, 'darkness':{level:2,school:'evo'},
  'darkvision':{level:2,school:'trs'}, 'detect thoughts':{level:2,school:'div'},
  'enlarge/reduce':{level:2,school:'trs'}, 'enthrall':{level:2,school:'enc'},
  'flaming sphere':{level:2,school:'con'}, 'gust of wind':{level:2,school:'evo'},
  'heat metal':{level:2,school:'trs'}, 'hold person':{level:2,school:'enc'},
  'invisibility':{level:2,school:'ill'}, 'knock':{level:2,school:'trs'},
  'levitate':{level:2,school:'trs'}, 'locate object':{level:2,school:'div'},
  'magic mouth':{level:2,school:'ill'}, 'magic weapon':{level:2,school:'trs'},
  'mirror image':{level:2,school:'ill'}, 'misty step':{level:2,school:'con'},
  'moonbeam':{level:2,school:'evo'}, 'phantasmal force':{level:2,school:'ill'},
  'ray of enfeeblement':{level:2,school:'nec'}, 'scorching ray':{level:2,school:'evo'},
  'see invisibility':{level:2,school:'div'}, 'shatter':{level:2,school:'evo'},
  'silence':{level:2,school:'ill'}, 'spider climb':{level:2,school:'trs'},
  'suggestion':{level:2,school:'enc'}, 'web':{level:2,school:'con'},
  // ── 3rd Level ─────────────────────────────────────────────────────────────
  'animate dead':{level:3,school:'nec'}, 'bestow curse':{level:3,school:'nec'},
  'blink':{level:3,school:'trs'}, 'call lightning':{level:3,school:'con'},
  'clairvoyance':{level:3,school:'div'}, 'counterspell':{level:3,school:'abj'},
  'daylight':{level:3,school:'evo'}, 'dispel magic':{level:3,school:'abj'},
  'fear':{level:3,school:'ill'}, 'fireball':{level:3,school:'evo'},
  'fly':{level:3,school:'trs'}, 'gaseous form':{level:3,school:'trs'},
  'glyph of warding':{level:3,school:'abj'}, 'haste':{level:3,school:'trs'},
  'hypnotic pattern':{level:3,school:'ill'}, 'lightning bolt':{level:3,school:'evo'},
  'magic circle':{level:3,school:'abj'}, 'major image':{level:3,school:'ill'},
  'mass healing word':{level:3,school:'evo'}, 'nondetection':{level:3,school:'abj'},
  'phantom steed':{level:3,school:'ill'}, 'protection from energy':{level:3,school:'abj'},
  'remove curse':{level:3,school:'abj'}, 'sending':{level:3,school:'evo'},
  'sleet storm':{level:3,school:'con'}, 'slow':{level:3,school:'trs'},
  'speak with dead':{level:3,school:'nec'}, 'spirit guardians':{level:3,school:'con'},
  'stinking cloud':{level:3,school:'con'}, 'tongues':{level:3,school:'div'},
  'vampiric touch':{level:3,school:'nec'}, 'water breathing':{level:3,school:'trs'},
  'wind wall':{level:3,school:'evo'},
  // ── 4th Level ─────────────────────────────────────────────────────────────
  'arcane eye':{level:4,school:'div'}, 'banishment':{level:4,school:'abj'},
  'blight':{level:4,school:'nec'}, 'compulsion':{level:4,school:'enc'},
  'confusion':{level:4,school:'enc'}, 'control water':{level:4,school:'trs'},
  'death ward':{level:4,school:'abj'}, 'dimension door':{level:4,school:'con'},
  'divination':{level:4,school:'div'}, 'dominate beast':{level:4,school:'enc'},
  'fire shield':{level:4,school:'evo'}, 'freedom of movement':{level:4,school:'abj'},
  'greater invisibility':{level:4,school:'ill'}, 'hallucinatory terrain':{level:4,school:'ill'},
  'ice storm':{level:4,school:'evo'}, 'locate creature':{level:4,school:'div'},
  'phantasmal killer':{level:4,school:'ill'}, 'polymorph':{level:4,school:'trs'},
  'stoneskin':{level:4,school:'abj'}, 'wall of fire':{level:4,school:'evo'},
  // ── 5th Level ─────────────────────────────────────────────────────────────
  'cloudkill':{level:5,school:'con'}, 'commune':{level:5,school:'div'},
  'cone of cold':{level:5,school:'evo'}, 'conjure elemental':{level:5,school:'con'},
  'contagion':{level:5,school:'nec'}, 'creation':{level:5,school:'ill'},
  'dispel evil and good':{level:5,school:'abj'}, 'dominate person':{level:5,school:'enc'},
  'dream':{level:5,school:'ill'}, 'flame strike':{level:5,school:'evo'},
  'geas':{level:5,school:'enc'}, 'greater restoration':{level:5,school:'abj'},
  'hold monster':{level:5,school:'enc'}, 'legend lore':{level:5,school:'div'},
  'mass cure wounds':{level:5,school:'evo'}, 'mislead':{level:5,school:'ill'},
  'modify memory':{level:5,school:'enc'}, 'passwall':{level:5,school:'trs'},
  'planar binding':{level:5,school:'abj'}, 'raise dead':{level:5,school:'nec'},
  'scrying':{level:5,school:'div'}, 'seeming':{level:5,school:'ill'},
  'telekinesis':{level:5,school:'trs'}, 'teleportation circle':{level:5,school:'con'},
  'wall of force':{level:5,school:'evo'}, 'wall of stone':{level:5,school:'evo'},
  // ── 6th Level ─────────────────────────────────────────────────────────────
  'arcane gate':{level:6,school:'con'}, 'chain lightning':{level:6,school:'evo'},
  'circle of death':{level:6,school:'nec'}, 'create undead':{level:6,school:'nec'},
  'disintegrate':{level:6,school:'trs'}, 'eyebite':{level:6,school:'nec'},
  'flesh to stone':{level:6,school:'trs'}, 'globe of invulnerability':{level:6,school:'abj'},
  'harm':{level:6,school:'nec'}, 'heal':{level:6,school:'evo'},
  'heroes\' feast':{level:6,school:'con'}, 'mass suggestion':{level:6,school:'enc'},
  'move earth':{level:6,school:'trs'}, 'programmed illusion':{level:6,school:'ill'},
  'sunbeam':{level:6,school:'evo'}, 'true seeing':{level:6,school:'div'},
  'wall of ice':{level:6,school:'evo'}, 'wall of thorns':{level:6,school:'con'},
  // ── 7th Level ─────────────────────────────────────────────────────────────
  'conjure celestial':{level:7,school:'con'}, 'delayed blast fireball':{level:7,school:'evo'},
  'divine word':{level:7,school:'evo'}, 'etherealness':{level:7,school:'trs'},
  'finger of death':{level:7,school:'nec'}, 'fire storm':{level:7,school:'evo'},
  'forcecage':{level:7,school:'evo'}, 'mirage arcane':{level:7,school:'ill'},
  'plane shift':{level:7,school:'con'}, 'prismatic spray':{level:7,school:'evo'},
  'project image':{level:7,school:'ill'}, 'regenerate':{level:7,school:'trs'},
  'resurrection':{level:7,school:'nec'}, 'reverse gravity':{level:7,school:'trs'},
  'simulacrum':{level:7,school:'ill'}, 'symbol':{level:7,school:'abj'},
  'teleport':{level:7,school:'con'},
  // ── 8th Level ─────────────────────────────────────────────────────────────
  'antimagic field':{level:8,school:'abj'}, 'antipathy/sympathy':{level:8,school:'enc'},
  'clone':{level:8,school:'nec'}, 'control weather':{level:8,school:'trs'},
  'demiplane':{level:8,school:'con'}, 'dominate monster':{level:8,school:'enc'},
  'earthquake':{level:8,school:'evo'}, 'feeblemind':{level:8,school:'enc'},
  'holy aura':{level:8,school:'abj'}, 'incendiary cloud':{level:8,school:'con'},
  'maze':{level:8,school:'con'}, 'mind blank':{level:8,school:'abj'},
  'power word stun':{level:8,school:'enc'}, 'sunburst':{level:8,school:'evo'},
  // ── 9th Level ─────────────────────────────────────────────────────────────
  'astral projection':{level:9,school:'nec'}, 'foresight':{level:9,school:'div'},
  'gate':{level:9,school:'con'}, 'imprisonment':{level:9,school:'abj'},
  'mass heal':{level:9,school:'evo'}, 'meteor swarm':{level:9,school:'evo'},
  'power word heal':{level:9,school:'evo'}, 'power word kill':{level:9,school:'enc'},
  'prismatic wall':{level:9,school:'abj'}, 'shapechange':{level:9,school:'trs'},
  'time stop':{level:9,school:'trs'}, 'true polymorph':{level:9,school:'trs'},
  'true resurrection':{level:9,school:'nec'}, 'weird':{level:9,school:'ill'},
  'wish':{level:9,school:'con'},
};
// Normalize lookup key — lowercase, collapse spaces, strip trailing asterisks/notes
const spellMeta = (name: string) =>
  SPELL_META[name.toLowerCase().replace(/\s+/g,' ').replace(/[*†]/g,'').trim()] ?? null;

// ─── Damage Field Parser (Obstacle #4) ────────────────────────────────────────
// Splits resistance/immunity/vulnerability text on ';' and checks each chunk
// for conditional phrases. Conditional chunks route to `custom` (Foundry silently
// drops them if pushed into `value`). Simple chunks extract damage type keywords.
// Examples:
//   "Fire, Cold"                                      → value:['fire','cold'], custom:''
//   "Fire; Bludgeoning from Nonmagical Attacks"       → value:['fire'], custom:'Bludgeoning from Nonmagical Attacks'
//   "Bludgeoning, Piercing, Slashing from Nonmagical" → value:[], custom:'Bludgeoning, Piercing, Slashing from Nonmagical'
const CONDITIONAL_RX = /\b(nonmagical|silvered|adamantine|that\s+aren|that\s+are\s+not|not\s+made|while\s+in|from\s+non)/i;
const parseDamageField = (text) => {
  if (!text) return { value: [], custom: '' };
  const chunks  = text.split(/\s*;\s*/);
  const value   = [], customs = [];
  for (const chunk of chunks) {
    if (!chunk.trim()) continue;
    if (CONDITIONAL_RX.test(chunk)) {
      customs.push(chunk.trim());
    } else {
      DAMAGE_TYPES.filter(d => new RegExp(`\\b${d}\\b`, 'i').test(chunk))
        .forEach(d => { if (!value.includes(d)) value.push(d); });
    }
  }
  return { value, custom: customs.join('; ') };
};

// ─── Deterministic Item ID Generator ─────────────────────────────────────────
// djb2 hash → base36 string. Replaces the old slice(0,16) approach which broke
// whenever the actor name was ≥ 15 chars (e.g. "adultblackdragon" = 16 chars),
// causing every item on that actor to get the same truncated ID.
// Two hash passes give 14 chars; padEnd to 16. Collision probability is negligible.
const _djb2 = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36).padStart(7, '0').slice(0, 7);
};
const makeItemId = (prefix, actorName, itemName) => {
  const k = `${prefix}${actorName}${itemName}`.toLowerCase().replace(/[\s']/g, '');
  return (_djb2(k) + _djb2(k + '~')).slice(0, 16).padEnd(16, '0');
};
const makeActId = (prefix, actorName, itemName) => {
  const k = `${prefix}${actorName}${itemName}~act`.toLowerCase().replace(/[\s']/g, '');
  return (_djb2(k) + _djb2(k + '~')).slice(0, 16).padEnd(16, '0');
};

// ─── Format Detection ──────────────────────────────────────────────────────────
// Returns 'standard' | 'sidekick'.
// Sidekick blocks (Tasha's CoE) use Level instead of CR, may have PB:, and use
// class keywords (Warrior/Expert/Spellcaster) in the header line.
const detectFormat = (text) => {
  // "Level: NPC 3", "Level: 5", "3rd-level Warrior", "Warrior"/"Expert"/"Spellcaster"
  if (/\b(\d+(?:st|nd|rd|th)[- ]level\s+(?:warrior|expert|spellcaster|sidekick|npc)|Level[:\s]+(?:\w+\s+)?\d|Warrior|Expert|Spellcaster)\b/i.test(text)
    && !/Challenge|\bCR\b/i.test(text)) return 'sidekick';
  return 'standard';
};

// ─── Sidekick Level Helpers ────────────────────────────────────────────────────
// Character advancement XP table (PHB) — used instead of CR_XP for sidekicks.
const LEVEL_XP = [0,300,900,2700,6500,14000,23000,34000,48000,64000,
                  85000,100000,120000,140000,165000,195000,225000,265000,305000,355000];
const levelToXP = (lvl) => LEVEL_XP[Math.max(0, Math.min(lvl - 1, 19))] ?? 0;

// Extract sidekick level from text. Checks (in order):
//   "5th-level Expert"  →  5
//   "Level: 5"          →  5
//   Explicit "PB: +3"   →  derives approximate level from PB value
const parseSidekickLevel = (text) => {
  // Explicit "Level: NPC 3" or "Level: 5" — check first to avoid ordinal in
  // spell descriptions ("2nd-level spells") returning the wrong number.
  const lblM = text.match(/\bLevel[:\s]+(?:[A-Za-z]+\s+)?(\d+)/i);
  if (lblM) return +lblM[1];
  // Ordinal format — only match when followed by a class/role keyword so that
  // "2nd-level spells" or "3rd-level spellcaster" in a description doesn't win.
  const ordM = text.match(/\b(\d+)(?:st|nd|rd|th)[- ]level\s+(?:Warrior|Expert|Spellcaster|NPC|sidekick|character)\b/i);
  if (ordM) return +ordM[1];
  // PB back-calculation
  const pbM  = text.match(/\bPB[:\s]+\+(\d+)/i)
            || text.match(/\bProficiency\s+Bonus[:\s]+\+(\d+)/i);
  if (pbM) {
    const pb = +pbM[1];
    return pb <= 2 ? 1 : pb === 3 ? 5 : pb === 4 ? 9 : pb === 5 ? 13 : 17;
  }
  return 1;
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
// Equipment and Features added for sidekick format (Tasha's CoE) — prevents
// those section headers from bleeding into traits/actions/skills parsing.
const SECSTOP = '(?=\\n\\s*(?:Saving\\s+Throws?|Skills|(?:Damage\\s+)?Vulnerabilit|(?:Damage\\s+)?Resistanc|(?:Damage\\s+)?Immunit|Condition\\s+Immunit|Senses|Languages|Initiative|Challenge|\\bCR\\b|Traits?|Actions?|Reactions?|Legendary\\s+Actions?|Bonus\\s+Actions?|Lair\\s+Actions?|Equipment|Features?)|$)';

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

// ─── Target Parser ────────────────────────────────────────────────────────────
// Returns a Foundry activity `target` object from action description text.
// Handles AoE templates (cone/line/sphere/cube/cylinder) and single-target counts.
const parseTarget = (desc) => {
  const tpl = { count:'', contiguous:false, type:'', size:'', width:'', height:'', angle:'', range:'' };
  const aff = { count:'1', type:'creature', choice:false, special:'' };
  const n   = (rx) => desc.match(rx)?.[1];
  // AoE templates — check in specificity order
  const cone   = n(/(\d+)[- ]foot\s+cone/i);
  const line   = n(/(\d+)[- ]foot\s+line/i);
  const sphere = n(/(\d+)[- ]foot[- ]radius\s+sphere/i) || n(/radius\s+of\s+(\d+)\s*feet/i);
  const cube   = n(/(\d+)[- ]foot\s+cube/i);
  const cyl    = n(/(\d+)[- ]foot[- ]radius\s+cylinder/i);
  if      (cone)   { tpl.type = 'cone';     tpl.size = cone; }
  else if (line)   { tpl.type = 'line';     tpl.size = line;   tpl.width = '5'; }
  else if (sphere) { tpl.type = 'sphere';   tpl.size = sphere; }
  else if (cube)   { tpl.type = 'cube';     tpl.size = cube; }
  else if (cyl)    { tpl.type = 'cylinder'; tpl.size = cyl; }
  // Target count for non-AoE
  if (!tpl.type) {
    const cntM = desc.match(/\b(one|two|three|four|five|\d)\b\s+(?:creature|target|enemy|willing creature)/i);
    const nums  = { one:'1', two:'2', three:'3', four:'4', five:'5' };
    if (cntM) aff.count = nums[cntM[1].toLowerCase()] ?? cntM[1];
  }
  return { template: tpl, affects: aff, prompt: true };
};

// ─── Action Name Guard (Obstacle #3) ─────────────────────────────────────────
// Prevents flavor-text sentences from being misread as new action entries.
// Used by both parseActions() and parseSection().
//
// Guards applied:
//   1. Name capped at 1–4 words — real action names are rarely longer.
//      Word chars only (no digits) so "30-foot cone" can't be part of a name.
//   2. Description must be ≥ 15 chars — short trailing fragments aren't actions.
//   3. Name must not start with a common sentence-opener (A/An/The/Each/On/If/When
//      etc.). Real action names are proper nouns, never articles or conjunctions.
//
// Why not just use char-count on the name?  "Each creature in a" is 4 words and
// 18 chars — it would slip past a char-only cap.  The sentence-starter filter
// catches the remaining cases the word-cap misses.
// [.:] — accept period (standard MM) or colon (ChatGPT/abbreviated format) as separator.
const ACTION_NAME_RX    = /^([A-Z][A-Za-z\-']*(?:\s+[A-Za-z\-']+){0,3})(?:\s*\(([^)]*)\))?[.:]\s+(.{15,})$/;
const SENTENCE_START_RX = /^(?:A|An|The|On|Each|If|When|In|At|Once|As|While|After|Before|During|With|By|For|Any|This|That|It|Its|They|Their|He|She)\b/i;
// Prevents field labels like "Skills:", "Saves:", "Languages:" from being
// matched as trait/action names when colon separator is allowed.
// Cantrips? and Prepared added so spell list sub-headers inside a Spellcasting
// trait are appended to the trait description rather than parsed as new entries.
const FIELD_LABEL_RX    = /^(?:Skills?|Saves?|Saving\s+Throws?|Senses?|Languages?|Challenge|Initiative|CR|Damage|Condition|Immunities?|Resistances?|Vulnerabilities?|Speed|AC|HP|Armor\s+Class|Hit\s+Points|Proficiency\s+Bonus|PB|Cantrips?|Prepared)\b/i;

// ─── Action Parser ─────────────────────────────────────────────────────────────
const parseActions = (text) => {
  const section = text.match(/Actions:?\s+([\s\S]+?)(?=Reactions:?|Legendary\s+Actions:?|Bonus\s+Actions:?|$)/i)?.[1];
  if (!section) return [];
  const actions = [];
  let cur = null;
  for (const raw of section.split('\n').map(l => l.trim()).filter(Boolean)) {
    // Strip sidekick bullet markers (* / •) before matching
    const line = raw.replace(/^[*•]\s*/, '');
    const m = line.match(ACTION_NAME_RX);
    if (m && !SENTENCE_START_RX.test(m[1]) && !FIELD_LABEL_RX.test(m[1])) {
      if (cur) actions.push(cur);
      cur = { name: m[1].trim(), qualifier: m[2]?.trim()||'', description: m[3].trim(), attack: null, damage: null };
    } else if (cur) cur.description += ' ' + line;
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
    // Shorthand fallback: "+2 to hit, 1d6 bludgeoning" (ChatGPT/abbreviated format)
    // Only fires when the standard pattern above didn't find an attack line.
    if (!atk) {
      const shAtk = d.match(/^([+-]\d+)\s+to\s+hit[,.]?\s+(\d+d\d+(?:[+-]\d+)?)\s+(\w+)/i);
      if (shAtk) {
        a.attack = { bonus: +shAtk[1], reach: 5, range: null };
        a.damage = { formula: shAtk[2], type: shAtk[3].toLowerCase() };
      }
    }
  });
  return actions;
};

// ─── Generic Section Parser ───────────────────────────────────────────────────
// Extracts { name, qualifier, description } entries from any named section.
// Used for Traits (passive), Reactions, and Bonus Actions.
const ALL_SEC_STOP = 'Traits?|Actions?|Bonus\\s+Actions?|Reactions?|Legendary\\s+Actions?|Lair\\s+Actions?|Equipment|Features?';
const parseSection = (text, headerRx) => {
  const sec = text.match(
    new RegExp(`(?:^|\\n)[ \\t]*${headerRx}[ \\t]*:?[ \\t]*(?:\\n|$)([\\s\\S]+?)(?=\\n[ \\t]*(?:${ALL_SEC_STOP})[ \\t]*:?[ \\t]*(?:\\n|$)|$)`, 'i')
  )?.[1];
  if (!sec) return [];
  const out = []; let cur = null;
  for (const raw of sec.split('\n').map(l => l.trim()).filter(Boolean)) {
    const line = raw.replace(/^[*•]\s*/, '');
    const m = line.match(ACTION_NAME_RX);
    if (m && !SENTENCE_START_RX.test(m[1]) && !FIELD_LABEL_RX.test(m[1])) {
      if (cur) out.push(cur);
      cur = { name:m[1].trim(), qualifier:m[2]?.trim()||'', description:m[3].trim() };
    } else if (cur) cur.description += ' ' + line;
  }
  if (cur) out.push(cur);
  return out;
};

// ─── Legendary Action Count Extractor ────────────────────────────────────────
// Returns { base, lair } where lair = base+1 if present, else equals base.
// Handles:
//   2014: "The creature can take 3 legendary actions..."
//   2024: "Legendary Action Uses: 3 (4 in Lair)."
const parseLegendaryCount = (text) => {
  const sec = text.match(/(?:^|\n)[ \t]*Legendary\s+Actions?[ \t]*:?[ \t]*(?:\n|$)([\s\S]+?)(?=\n[ \t]*(?:Lair\s+Actions?|Mythic\s+Actions?)[ \t]*:?[ \t]*(?:\n|$)|$)/i)?.[1] || '';
  // 2024 format: "Legendary Action Uses: 3 (4 in Lair)."
  const m24 = sec.match(/Legendary\s+Action\s+Uses?:\s*(\d+)(?:\s*\((\d+)\s+in\s+Lair\))?/i);
  if (m24) return { base: +m24[1], lair: m24[2] ? +m24[2] : +m24[1] };
  // 2014 format: "The creature can take 3 legendary actions"
  const m14 = sec.match(/can\s+take\s+(\d+)\s+legendary\s+action/i);
  if (m14) return { base: +m14[1], lair: +m14[1] };
  return null;
};

// ─── Simple Feat Item Builder ─────────────────────────────────────────────────
// Produces a Foundry feat item with a utility activity.
// actType: '' = passive trait, 'reaction' = reaction, 'bonus' = bonus action.
// prefix: single char to namespace IDs by section ('t'=trait,'b'=bonus,'r'=reaction,'l'=legendary,'i'=lair)
// isCharacter: true for PC sheet output — uses type:'feat' instead of type:'monster'
//   NPC sheets need type.value:'monster' to render in the stat block section.
//   PC sheets use type.value:'class'|'feat'|'race' etc. — 'monster' would misplace items.
const makeSimpleItem = (a, actorName, actType, itemCost = 1, prefix = 't', isCharacter = false) => {
  const itemId = makeItemId(prefix, actorName, a.name);
  const actId  = makeActId(prefix, actorName, a.name);
  const cost   = actType ? itemCost : 0;
  return { _id:itemId, name:a.name, type:'feat',
    system:{ description:{value:a.description},
      type:{ value:'monster', subtype:'' },
      activation:{type:actType||'', cost, condition:''},
      uses:{value:null,max:null,per:null,recovery:[]},
      activities:{[actId]:{ _id:actId, type:'utility', name:'',
        activation:{type:actType||'', cost, condition:''}, uses:{spent:0,recovery:[]} }} } };
};

// ─── Spellcaster Sidekick Spell Slot Table (Tasha's CoE) ─────────────────────
// Indexed by level 1–20: [1st, 2nd, 3rd, 4th, 5th] slots.
// Spellcaster sidekicks cap at 5th-level spells; progression is roughly half-caster.
const SPELLCASTER_SIDEKICK_SLOTS = [
  [0,0,0,0,0],  // placeholder for index 0
  [2,0,0,0,0],[2,0,0,0,0],[3,0,0,0,0],[3,0,0,0,0],  // levels 1-4
  [4,2,0,0,0],[4,2,0,0,0],[4,3,0,0,0],[4,3,0,0,0],  // levels 5-8
  [4,3,2,0,0],[4,3,2,0,0],[4,3,3,0,0],[4,3,3,0,0],  // levels 9-12
  [4,3,3,1,0],[4,3,3,1,0],[4,3,3,2,0],[4,3,3,2,0],  // levels 13-16
  [4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2],  // levels 17-20
];

// ─── Spell Item Builder ───────────────────────────────────────────────────────
// mode: 'spell' (slot-based), 'atwill' (at will), 'innate' (N/Day)
// uses: { value, max, per } for N/Day — null for slot/atwill
// prefix: 's' = slot spell, 'n' = innate spell (prevents cross-list ID collisions)
//
// Fix #2: `preparation` (old field) replaced by top-level `method` + `prepared` (dnd5e 5.1+).
//   method:  'spell'|'innate'|'atwill'|'pact'  — how the spell is prepared/cast
//   prepared: 0=unprepared, 1=prepared, 2=always prepared
//
// Fix #3: `consumption.spellSlot` must be false for innate/atwill spells.
//   Without this Foundry tries to consume a slot on the NPC and silently errors.
//   Innate/atwill uses are tracked on the item itself via system.uses.
const makeSpellItem = (spellName, level, mode, uses, actorName, prefix = 's') => {
  const meta    = spellMeta(spellName);
  // Level resolution rules:
  //   mode:'atwill' + level:0 → 2024 "At Will" = cantrip-equivalent — always stay 0
  //   All other modes + level:0 + meta.level > 0 → correct to real level
  //     This covers: mode:'innate' (N/Day), mode:'spell' (Prepared list without level headers)
  //     A genuine cantrip has meta.level === 0 so no correction fires.
  const resolvedLevel = (level === 0 && mode !== 'atwill' && meta != null && meta.level > 0) ? meta.level : level;
  // prepared value: 2 = always prepared (PC reference uses 2 for all prepared/innate spells)
  //                 1 = prepared (NPC slot-based)
  //                 0 = unprepared
  const resolvedPrepared = (mode === 'atwill') ? 2 : (mode === 'innate') ? 2 : (mode === 'spell') ? 2 : 1;
  const resolvedSchool = meta?.school ?? '';
  const itemId = makeItemId(prefix, actorName, spellName + resolvedLevel);
  const actId  = makeActId(prefix, actorName, spellName + resolvedLevel);
  const display = spellName.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(' ');

  // Slot-based spells consume a spell slot; innate/atwill consume their own uses.
  const isSlotSpell  = mode === 'spell';
  const isAtwill     = mode === 'atwill';

  // Build the spell activity — a basic cast/attack shell.
  // consumption.spellSlot controls whether a slot is consumed on use.
  const spellActivity = {
    _id: actId,
    type: 'utility',
    sort: 0,
    name: '',
    img: null,
    activation: { type: 'action', value: null, override: false },
    consumption: {
      spellSlot: isSlotSpell,
      targets: (!isSlotSpell && !isAtwill && uses)
        // N/Day: consume 1 use from this item's use pool
        ? [{ type: 'itemUses', target: '', value: '1', scaling: {} }]
        : [],
      scaling: { allowed: false, max: '' }
    },
    duration:  { units: 'inst', concentration: false, override: false },
    range:     { override: false },
    target:    { template: { contiguous: false, units: 'ft' }, affects: { choice: false }, override: false, prompt: true },
    uses:      { spent: 0, recovery: [], max: '' },
    flags:     {}
  };

  // Item-level uses (for innate N/Day spells)
  const itemUses = uses
    ? { spent: 0, max: String(uses.max), recovery: [{ period: uses.per, type: 'recoverAll' }] }
    : { spent: 0, max: '', recovery: [] };

  return {
    _id: itemId,
    name: display,
    type: 'spell',
    system: {
      description: { value: '' },
      level: resolvedLevel,
      school: resolvedSchool,
      // Fix #2: method + prepared replaces deprecated preparation.mode + preparation.prepared
      method:   mode,
      prepared: resolvedPrepared,
      uses: itemUses,
      activities: { [actId]: spellActivity }
    }
  };
};

// ─── Spell List Extractor ─────────────────────────────────────────────────────
// Works on the single-line concatenated string produced by parseSection().
// Two modes:
//   Level-based  (2014): "Cantrips (at will): ..."  "1st level (4 slots): ..."
//   Frequency-based (2024/innate): "At Will: ..."  "3/Day Each: ..."
// Uses position-based slicing so spell names between two headers are captured
// correctly without relying on newlines (which parseSection collapses to spaces).
const LEVEL_HDR_RX = /(?:Cantrips?(?:\s*\([^)]+\))?|(?:1st|2nd|3rd|[4-9]th)\s+level(?:\s*\([^)]+\))?)\s*:/gi;
// "Prepared (typical):" added for ChatGPT/condensed formats — treated as
// prepared spell list; levels resolved via SPELL_META lookup in makeSpellItem.
const FREQ_HDR_RX  = /(?:At\s+Will|\d+\/Day(?:\s+Each)?|Prepared(?:\s*\([^)]*\))?)\s*:/gi;

const extractSpellLists = (desc) => {
  const cleanNames = (raw) => raw.split(',')
    .map(s => s.replace(/\([^)]*\)/g, '').replace(/[*†]/g, '').trim())
    .filter(Boolean);

  // ── Level-based (2014) ──────────────────────────────────────────────────
  const lvlHeaders = [];
  let m;
  LEVEL_HDR_RX.lastIndex = 0;
  while ((m = LEVEL_HDR_RX.exec(desc)) !== null)
    lvlHeaders.push({ text: m[0], pos: m.index, end: m.index + m[0].length });

  if (lvlHeaders.length) {
    const spells = {}, slots = {};
    for (let i = 0; i < lvlHeaders.length; i++) {
      const h   = lvlHeaders[i];
      const stop = i + 1 < lvlHeaders.length ? lvlHeaders[i + 1].pos : desc.length;
      const names = cleanNames(desc.slice(h.end, stop));
      const lower = h.text.toLowerCase();
      const lvl   = /cantrip/i.test(lower) ? 0 : SPELL_LEVEL_WORD[lower.match(/^\w+/)?.[0]] || 0;
      const slotM = h.text.match(/\((\d+)\s+slots?\)/i);
      if (slotM && lvl > 0) slots[lvl] = +slotM[1];
      if (names.length) spells[lvl] = names;
    }
    return { spells, slots, freqSpells: {}, isSlotBased: true };
  }

  // ── Frequency-based (2024 / innate) ─────────────────────────────────────
  const freqHeaders = [];
  FREQ_HDR_RX.lastIndex = 0;
  while ((m = FREQ_HDR_RX.exec(desc)) !== null)
    freqHeaders.push({ text: m[0], pos: m.index, end: m.index + m[0].length });

  const freqSpells = {};
  for (let i = 0; i < freqHeaders.length; i++) {
    const h    = freqHeaders[i];
    const stop = i + 1 < freqHeaders.length ? freqHeaders[i + 1].pos : desc.length;
    const names = cleanNames(desc.slice(h.end, stop));
    // 'prepared' key for "Prepared (typical/typical):" headers — no digits in text
    // so the digit fallback would wrongly give '1' (treated as 1/Day innate).
    const key  = /at\s+will/i.test(h.text) ? 'atwill'
               : /prepared/i.test(h.text)  ? 'prepared'
               : h.text.match(/(\d+)/)?.[1] || '1';
    if (names.length) freqSpells[key] = names;
  }
  return { spells: {}, slots: {}, freqSpells, isSlotBased: false };
};

// ─── Spellcasting Parser ──────────────────────────────────────────────────────
// Checks three sources in the parsed section arrays:
//   1. traits "Spellcasting"        — 2014 slot-based (level lists)
//   2. actions "Spellcasting"       — 2024 frequency-based (no slot levels)
//   3. traits "Innate Spellcasting" — 2014/2024 innate (frequency, no slots)
//
// Returns:
//   { ability, dc, atk, casterLevel, slots, spells, freqSpells, innate, isSlotBased }
// or null if no spellcasting found anywhere.
//
// `innate` is a sub-object { ability, dc, atk, freqSpells } when the creature has
// a separate "Innate Spellcasting" trait — most common on demons, genies, dragons.
// Innate spells don't consume spell slots; they use N/Day uses instead.
const parseSpellcasting = (traits, actions) => {
  const spellTrait  = traits.find(t => /^Spellcasting$/i.test(t.name));
  const spellAction = actions.find(a => /^Spellcasting$/i.test(a.name));
  const innateTrait = traits.find(t => /^Innate\s+Spellcasting$/i.test(t.name));

  let result = null;

  if (spellTrait || spellAction) {
    const desc      = (spellTrait || spellAction).description;
    // Ability — three formats:
    //   Standard:  "spellcasting ability is Intelligence"
    //   2024:      "using Intelligence as the spellcasting ability"
    //   Condensed: "(WIS, spell DC 13)" — ChatGPT/abbreviated format
    const abilityM  = desc.match(/spellcasting ability is (\w+)/i)
                   || desc.match(/using (\w+) as the spellcasting ability/i)
                   || desc.match(/\((\w{3}),\s*spell(?:\s+save)?\s+DC/i);
    const ability   = SPELL_AB_MAP[abilityM?.[1]?.toLowerCase()] || 'int';
    // DC — "spell save DC 13" (standard) or "spell DC 13" (condensed)
    const dc        = +(desc.match(/spell\s+(?:save\s+)?DC\s*(\d+)/i)?.[1]              || 0);
    const atk       = +(desc.match(/\+(\d+)\s+to\s+hit\s+with\s+spell\s+attacks?/i)?.[1] || 0);
    const lvlM      = desc.match(/(\d+)(?:st|nd|rd|th)[- ]level\s+spellcaster/i);
    const { spells, slots, freqSpells, isSlotBased } = extractSpellLists(desc);
    result = { ability, dc, atk, casterLevel: lvlM ? +lvlM[1] : 0, slots, spells, freqSpells, isSlotBased };
  }

  if (innateTrait) {
    const desc      = innateTrait.description;
    const abilityM  = desc.match(/innate spellcasting ability is (\w+)/i)
                   || desc.match(/spellcasting ability is (\w+)/i);
    const ability   = SPELL_AB_MAP[abilityM?.[1]?.toLowerCase()] || 'int';
    const dc        = +(desc.match(/spell\s+(?:save\s+)?DC\s*(\d+)/i)?.[1]              || 0);
    const atk       = +(desc.match(/\+(\d+)\s+to\s+hit\s+with\s+spell\s+attacks?/i)?.[1] || 0);
    const { freqSpells } = extractSpellLists(desc);
    const innate = { ability, dc, atk, freqSpells };
    if (result) { result.innate = innate; }
    else {
      // Innate-only creature (e.g. succubus, genie) — no slot spellcasting
      result = { ability, dc, atk, casterLevel: 0, slots: {}, spells: {}, freqSpells: {}, isSlotBased: false, innate };
    }
  }

  return result;
};

// ─── Field Editor → Output Applier ───────────────────────────────────────────
// Maps field editor names back to the Foundry actor structure.
// Returns a deep-cloned, updated copy of the actor.
const applyFieldEdit = (fieldName, newValue, actor) => {
  const o = JSON.parse(JSON.stringify(actor));
  const v = newValue.trim();
  const SIZE_CODE = { tiny:'tiny', small:'sm', medium:'med', large:'lg', huge:'huge', gargantuan:'grg' };
  switch (fieldName) {
    case 'name':
      o.name = v;
      break;
    case 'size': {
      const code = SIZE_CODE[v.toLowerCase()];
      if (code) o.system.traits.size = code;
      break;
    }
    case 'type':
      o.system.details.type.value = v.toLowerCase();
      break;
    case 'subtype':
      o.system.details.type.subtype = v === 'none' ? '' : v;
      break;
    case 'alignment':
      o.system.details.alignment = v;
      break;
    case 'ac':
      if (!isNaN(+v)) o.system.attributes.ac.flat = +v;
      break;
    case 'hp':
      if (!isNaN(+v)) { o.system.attributes.hp.value = +v; o.system.attributes.hp.max = +v; }
      break;
    case 'cr': {
      const f = v.includes('/') ? v.split('/').reduce((a,b) => a/b) : parseFloat(v);
      if (!isNaN(f)) { o.system.details.cr = f; o.system.details.xp.value = crToXP(v); }
      break;
    }
    case 'abilities': {
      const parts = v.split(',').map(n => parseInt(n.trim()));
      const keys  = ['str','dex','con','int','wis','cha'];
      if (parts.length === 6 && parts.every(n => !isNaN(n)))
        keys.forEach((k, i) => { o.system.abilities[k].value = parts[i]; });
      break;
    }
    case 'speed': {
      const wM = v.match(/^(\d+)/);
      if (wM) o.system.attributes.movement.walk = +wM[1];
      o.system.attributes.movement.hover = /\(hover\)/i.test(v);
      break;
    }
    case 'languages':
      o.system.traits.languages.value = v === 'none' ? [] : v.split(',').map(l => l.trim().toLowerCase().replace(/\s+/g,''));
      break;
    case 'initiative':
      o.system.attributes.init.bonus = v === 'auto' ? '' : v;
      break;
    case 'senses': {
      const sn = (rx) => +(v.match(rx)?.[1] || 0);
      o.system.attributes.senses.ranges = {
        darkvision:  sn(/darkvision\s+(\d+)/i)  || null,
        blindsight:  sn(/blindsight\s+(\d+)/i)  || null,
        tremorsense: sn(/tremorsense\s+(\d+)/i) || null,
        truesight:   sn(/truesight\s+(\d+)/i)   || null,
      };
      break;
    }
    default: break;
  }
  return o;
};

// ─── Core Parse Function (exported for batch use) ─────────────────────────────
export function parseStatBlock(text) {
    const errs = [], warns = [];
    const stats = { parsed: 0, total: 0, exact: 0, fields: [] };
    // optional=true: if not found, record as 'n/a' and exclude from accuracy score entirely.
    // This prevents legitimate absences (no reactions, no legendary actions, etc.) from
    // dragging the score down and making the parser look worse than it is.
    const track = (name, value, ok, optional = false) => {
      if (optional && !ok) { stats.fields.push({ name, value: 'n/a', method: 'n/a' }); return; }
      stats.total++;
      if (ok) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name, value: String(value), method: ok ? 'exact' : 'default' });
    };
    try {
      if (!text.trim()) throw new Error('No content to parse');

      // Format detection
      const format = detectFormat(text);
      const isSidekick = format === 'sidekick';
      // Sidekick level — extracted here so CR/XP/profBonus can use it below
      const sidekickLevel = isSidekick ? parseSidekickLevel(text) : 0;
      if (isSidekick) warns.push(`Sidekick format detected (level ${sidekickLevel}) — using character advancement XP and level-based proficiency bonus.`);

      // Name
      const name = text.split('\n').map(l => l.trim()).find(Boolean) || 'Unknown';
      track('name', name, true);

      // Size
      const sizeM = text.match(/\b(tiny|small|medium|large|huge|gargantuan)\b/i);
      const size  = sizeM?.[1]?.toLowerCase() || 'medium';
      const sizeCode = { tiny:'tiny', small:'sm', medium:'med', large:'lg', huge:'huge', gargantuan:'grg' }[size] || 'med';
      track('size', size, !!sizeM);

      // Type — capture optional subtype in parens: "humanoid (goblinoid)"
      const typeM    = text.match(/\b(beast|humanoid|dragon|undead|elemental|monstrosity|fey|fiend|giant|ooze|plant|construct|celestial|aberration)(?:\s*\(([^)]+)\))?/i);
      const type     = typeM?.[1]?.toLowerCase() || 'humanoid';
      const subtype  = typeM?.[2]?.trim() || '';
      track('type', type, !!typeM);
      track('subtype', subtype || 'none', !!subtype, true);

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

      // Speed — per-type matches so order in the stat block doesn't matter (Obstacle #7)
      const spdLineM = text.match(/Speed[:\s]+(.+?)(?:\n|$)/i);
      const spdLine  = spdLineM?.[1]?.trim() || '';
      const spdGet   = (rx) => { const m = spdLine.match(rx); return m ? +m[1] : 0; };
      const hover    = /\bfly\s+\d+\s*ft\.?\s*\(hover\)/i.test(spdLine);
      const speeds = {
        walk:   spdGet(/^(\d+)/),                   // first number on line = walk
        fly:    spdGet(/\bfly\s+(\d+)/i),
        climb:  spdGet(/\bclimb\s+(\d+)/i),
        swim:   spdGet(/\bswim\s+(\d+)/i),
        burrow: spdGet(/\bburrow\s+(\d+)/i),
      };
      if (!speeds.walk && !spdLine) { speeds.walk = 30; warns.push('Speed not found, using 30 ft.'); }
      track('speed', `${speeds.walk} ft.${hover ? ' (hover)' : ''}`, !!spdLineM);

      // Abilities
      let abilities = { str:10, dex:10, con:10, int:10, wis:10, cha:10 };
      let abM = text.match(/STR\s+(\d+),?\s+DEX\s+(\d+),?\s+CON\s+(\d+),?\s+INT\s+(\d+),?\s+WIS\s+(\d+),?\s+CHA\s+(\d+)/i)
             || text.match(/STR\s+(\d+)\s*\([+\-\u2212]\d+\)\s+DEX\s+(\d+)\s*\([+\-\u2212]\d+\)\s+CON\s+(\d+)\s*\([+\-\u2212]\d+\)\s+INT\s+(\d+)\s*\([+\-\u2212]\d+\)\s+WIS\s+(\d+)\s*\([+\-\u2212]\d+\)\s+CHA\s+(\d+)/i);
      if (abM) { abilities = { str:+abM[1], dex:+abM[2], con:+abM[3], int:+abM[4], wis:+abM[5], cha:+abM[6] }; }
      else {
        const ms = ['Str','Dex','Con','Int','Wis','Cha'].map(ab => text.match(new RegExp(`${ab}\\s+(\\d+)\\s+[+-−]?\\d+\\s+[+-−]?\\d+`, 'i')));
        if (ms.every(Boolean)) { [abilities.str, abilities.dex, abilities.con, abilities.int, abilities.wis, abilities.cha] = ms.map(m => +m[1]); abM = true; }
        else warns.push('Abilities not found, using 10s');
      }
      track('abilities', `STR ${abilities.str} DEX ${abilities.dex} CON ${abilities.con}`, !!abM);

      // CR — sidekicks have no CR; use level-derived values instead
      let cr = '0', profBonus = 2;
      if (isSidekick) {
        // PB may be explicit ("PB: +2") — use it directly if present, else derive from level
        const pbM = text.match(/\bPB[:\s]+\+(\d+)/i) || text.match(/\bProficiency\s+Bonus[:\s]+\+(\d+)/i);
        profBonus = pbM ? +pbM[1] : profBonusFromCR(String(sidekickLevel));
        track('cr', `level ${sidekickLevel}`, true);
      } else {
        const crM = text.match(/CR\s+(\d+(?:\/\d+)?)\s*\([^)]*\)/i) || text.match(/Challenge[:\s]+(\d+(?:\/\d+)?)/i) || text.match(/\bCR[:\s]+(\d+(?:\/\d+)?)/i);
        cr = crM?.[1] || '1';
        if (!crM) warns.push('CR not found, using 1');
        track('cr', cr, !!crM);
        profBonus = profBonusFromCR(cr);
      }

      // Saving Throws
      // Colon is optional — "Saving Throws Int +9" and "Saving Throws: Int +9" both appear.
      // Line-start anchor (?:^|\n)\s* prevents false matches on "saving throw" inside
      // ability descriptions (e.g. "...must succeed on a DC 13 Constitution saving throw...").
      let savesText = text.match(new RegExp('(?:^|\\n)\\s*(?:Saving Throws?|Saves?):?\\s+(.+?)' + SECSTOP, 'is'))?.[1]?.trim() || '';
      if (!savesText) {
        const fs = ['Str','Dex','Con','Int','Wis','Cha'].map(ab => {
          const m1 = text.match(new RegExp(`${ab}\\s+\\d+\\s+[+-]?\\d+\\s+([+-]\\d+)`, 'i'));
          const m2 = text.match(new RegExp(`${ab}\\s+\\d+\\s+([+-]?\\d+)`, 'i'));
          return (m1 && m2 && m1[1] !== m2[1]) ? `${ab} ${m1[1]}` : null;
        }).filter(Boolean);
        if (fs.length) savesText = fs.join(', ');
      }
      track('saves', savesText || 'none', !!savesText, true);
      const saves = { str:0, dex:0, con:0, int:0, wis:0, cha:0 };
      savesText.split(',').forEach(e => { const m = e.trim().match(/^(str|dex|con|int|wis|cha)\s*([+-]\d+)/i); if (m && +m[2] > mod(abilities[m[1].toLowerCase()])) saves[m[1].toLowerCase()] = 1; });

      // Skills
      const skillM  = text.match(new RegExp('Skills[:\\s]+(.+?)' + SECSTOP, 'is'));
      const skillTxt = skillM?.[1]?.trim() || '';
      track('skills', skillTxt || 'none', !!skillM, true);
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
      track('senses', sensesRaw || 'none', !!senseM, true);
      const darkvision  = +(sensesRaw.match(/darkvision\s+(\d+)\s*ft/i)?.[1]  || 0);
      const blindsight  = +(sensesRaw.match(/blindsight\s+(\d+)\s*ft/i)?.[1]  || 0);
      const tremorsense = +(sensesRaw.match(/tremorsense\s+(\d+)\s*ft/i)?.[1] || 0);
      const truesight   = +(sensesRaw.match(/truesight\s+(\d+)\s*ft/i)?.[1]   || 0);
      const passivePercM = sensesRaw.match(/passive\s+perception\s+(\d+)/i);
      const passivePerc  = passivePercM
        ? +passivePercM[1]
        : 10 + mod(abilities.wis) + (skills.prc?.value > 0 ? skills.prc.value * profBonus : 0);
      track('passive perception', String(passivePerc), true);

      const sensesSpecial = sensesRaw
        .replace(/darkvision\s+\d+\s*ft\.?,?\s*/i,  '')
        .replace(/blindsight\s+\d+\s*ft\.?,?\s*/i,  '')
        .replace(/tremorsense\s+\d+\s*ft\.?,?\s*/i, '')
        .replace(/truesight\s+\d+\s*ft\.?,?\s*/i,   '')
        .replace(/,?\s*passive\s+perception\s+\d+/i, '')
        .replace(/^[,;\s]+|[,;\s]+$/g, '').trim();

      const langM    = text.match(new RegExp('Languages[:\\s]+(.+?)' + SECSTOP, 'is'));
      const languages = langM?.[1]?.trim().replace(/\([^)]*\)/g, '').trim() || '';
      track('languages', languages || 'none', !!langM, true);

      const initM    = text.match(/Initiative\s+([+-]\d+)/i);
      const initBonus = initM?.[1] || '';
      track('initiative', initBonus || 'auto', !!initM, true);

      // Damage Resistances — handles "Damage Resistances" (2014) and "Resistances" (2024)
      const drM    = text.match(new RegExp('(?:Damage\\s+)?Resistances?[:\\s]+(.+?)' + SECSTOP, 'is'));
      const drText = drM?.[1]?.trim() || '';
      track('damage resistances', drText || 'none', !!drM, true);

      // Damage Vulnerabilities — handles "Damage Vulnerabilities" (2014) and "Vulnerabilities" (2024)
      const dvM    = text.match(new RegExp('(?:Damage\\s+)?Vulnerabilities?[:\\s]+(.+?)' + SECSTOP, 'is'));
      const dvText = dvM?.[1]?.trim() || '';
      track('damage vulnerabilities', dvText || 'none', !!dvM, true);

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
      track('damage immunities',    diText || 'none', !!(diOldM || diText), true);
      track('condition immunities', ciText || 'none', !!(ciOldM || ciText), true);
      // Warn if any conditional resistance/immunity was routed to custom
      const conditionalFields = [
        parseDamageField(drText).custom && 'resistances',
        parseDamageField(diText).custom && 'immunities',
        parseDamageField(dvText).custom && 'vulnerabilities',
      ].filter(Boolean);
      if (conditionalFields.length)
        warns.push(`Conditional damage ${conditionalFields.join('/')} detected (e.g. "nonmagical attacks") — routed to custom field. Verify in Foundry actor traits.`);

      // Sections — Traits / Actions / Bonus Actions / Reactions
      const traits       = parseSection(text, 'Traits?');
      // Fallback: 2014 SRD style — no "Traits" header; entries appear directly
      // after the Challenge line and before the "Actions" section header.
      if (traits.length === 0) {
        const implicitSec = text.match(
          /\bChallenge\b[^\n]*\n([\s\S]+?)(?=\n[ \t]*(?:Actions?)[ \t]*:?[ \t]*(?:\n|$)|$)/i
        )?.[1] ?? '';
        let cur = null;
        for (const raw of implicitSec.split('\n').map(l => l.trim()).filter(Boolean)) {
          const line = raw.replace(/^[*•]\s*/, '');
          const m = line.match(ACTION_NAME_RX);
          if (m && !SENTENCE_START_RX.test(m[1]) && !FIELD_LABEL_RX.test(m[1])) {
            if (cur) traits.push(cur);
            cur = { name: m[1].trim(), qualifier: m[2]?.trim() || '', description: m[3].trim() };
          } else if (cur) cur.description += ' ' + line;
        }
        if (cur) traits.push(cur);
      }
      const actions      = parseActions(text);
      const bonusActions = parseSection(text, 'Bonus\\s+Actions?');
      const reactions    = parseSection(text, 'Reactions?');
      // Legendary Actions (Block 5)
      const legendaryActions = parseSection(text, 'Legendary\\s+Actions?');
      const legCounts = parseLegendaryCount(text);
      const legBase = legCounts?.base ?? (legendaryActions.length > 0 ? 3 : 0);
      const legLair = legCounts?.lair ?? legBase;

      // Lair Actions (Block 6) — 2014 only; 2024 format dropped this section
      const lairActions = parseSection(text, 'Lair\\s+Actions?');

      // Features section — sidekick format (Tasha's CoE). Passive class features
      // listed separately from Traits. Parsed as passive feat items identical to traits.
      // Note: Foundry NPC sheets don't support PC-style leveling — this is a snapshot
      // at the detected level. Features unlocked at higher levels must be added manually.
      const features = isSidekick ? parseSection(text, 'Features?') : [];

      // ── Spellcasting (Phase 7) ─────────────────────────────────────────────
      // parseSpellcasting checks traits[] for "Spellcasting"/"Innate Spellcasting"
      // and actions[] for 2024-format "Spellcasting" action.
      const spellInfo = parseSpellcasting(traits, actions);

      // Build prepared spell items (2014 slot-based or 2024 frequency)
      const spellItems = [];
      if (spellInfo) {
        if (spellInfo.isSlotBased) {
          // 2014: slot-based — we know the spell level from the header
          for (const [lvl, names] of Object.entries(spellInfo.spells))
            for (const n of names)
              spellItems.push(makeSpellItem(n, +lvl, 'spell', null, name, 's'));
        } else if (Object.keys(spellInfo.freqSpells).length) {
          // 2024: frequency only — spell level unknown, default to 0 with warning
          for (const [key, names] of Object.entries(spellInfo.freqSpells)) {
            const isPrepared = key === 'prepared';
            const isAtwill   = key === 'atwill';
            // 'prepared' key from "Prepared (typical):" → mode:'spell', no uses, level from lookup
            const mode = isPrepared ? 'spell' : isAtwill ? 'atwill' : 'innate';
            const uses = (isPrepared || isAtwill) ? null : { value: +key, max: +key, per: 'day' };
            for (const n of names)
              spellItems.push(makeSpellItem(n, 0, mode, uses, name, 's'));
          }
          const unknownFreq = spellItems.filter(s => s.system.level === 0 && s.system.method !== 'spell');
          if (unknownFreq.length)
            warns.push(`2024-format spellcasting: ${unknownFreq.map(s=>s.name).join(', ')} — level unknown, set manually in Foundry spell tab.`);
        }
      }

      // Build innate spell items — separate prefix 'n' to avoid ID collision with
      // any same-named prepared spell. Innate spells don't consume spell slots;
      // N/Day uses are tracked on the item itself.
      const innateItems = [];
      if (spellInfo?.innate) {
        for (const [key, names] of Object.entries(spellInfo.innate.freqSpells)) {
          const isAtwill = key === 'atwill';
          const uses = isAtwill ? null : { value: +key, max: +key, per: 'day' };
          for (const n of names)
            innateItems.push(makeSpellItem(n, 0, isAtwill ? 'atwill' : 'innate', uses, name, 'n'));
        }
        const unknownInnate = innateItems.filter(s => s.system.level === 0 && s.system.method !== 'spell');
        if (unknownInnate.length)
          warns.push(`Innate spellcasting: ${unknownInnate.map(s=>s.name).join(', ')} — level unknown, set manually in Foundry spell tab.`);
      }

      // Track spellcasting presence (optional — absent on non-casters)
      if (spellInfo) {
        const totalSpells = spellItems.length + innateItems.length;
        const slotSummary = spellInfo.isSlotBased
          ? `slots: ${Object.entries(spellInfo.slots).map(([l,n]) => `${l}×${n}`).join(' ')}`
          : 'freq-based';
        track('spellcasting', `${spellInfo.ability.toUpperCase()} · DC ${spellInfo.dc} · +${spellInfo.atk} atk · ${totalSpells} spell(s) (${slotSummary})`, true, true);
        if (spellInfo.dc)
          warns.push(`Spellcasting ability: ${spellInfo.ability.toUpperCase()} · DC ${spellInfo.dc} · +${spellInfo.atk} to hit. Foundry recalculates DC/attack from ability+proficiency — verify on sheet if different.`);
      } else {
        track('spellcasting', 'none', false, true);
      }

      // Legendary Resistance — "Legendary Resistance (3/Day, or 4/Day in Lair)"
      // Handles both "3/Day" (2014) and "3/Day, or 4/Day in Lair" (2024)
      const legResTrait = traits.find(t => /Legendary\s+Resistance/i.test(t.name));
      const legResNums  = legResTrait?.qualifier?.match(/(\d+)/g)?.map(Number) || [];
      const legResBase  = legResNums[0] || 0;
      const legResLair  = legResNums[1] || legResBase;

      track('features',           `${features.length} feature(s)`,               features.length > 0, true);
      track('traits',             `${traits.length} trait(s)`,                    traits.length > 0);
      track('actions',            `${actions.length} action(s)`,                  actions.length > 0);
      track('bonus actions',      `${bonusActions.length} bonus action(s)`,       bonusActions.length > 0, true);
      track('reactions',          `${reactions.length} reaction(s)`,              reactions.length > 0,    true);
      track('legendary actions',  `${legendaryActions.length} (max ${legBase})`, legendaryActions.length > 0, true);
      track('lair actions',       `${lairActions.length} lair action(s)`,        lairActions.length > 0,  true);
      if (legLair !== legBase || legResLair !== legResBase)
        warns.push(`Lair bonus detected — imported with base values (${legBase} legendary action(s), ${legResBase} resistance(s)). Manually set to ${legLair}/${legResLair} if using this creature in its lair.`);

      // ── Build action items ────────────────────────────────────────────────────
      const ABS = ['str','dex','con','int','wis','cha'];
      const buildActionItems = () => actions.map(a => {
        const itemId = makeItemId('a', name, a.name);
        const actId  = makeActId('a', name, a.name);
        const rchM = a.qualifier?.match(/Recharge\s+(\d+)(?:[–\-]\d+)?/i);
        const srM  = !rchM && /short\s+(?:or\s+)?long\s+rest/i.test(a.qualifier||'');
        const lrM  = !rchM && !srM && /long\s+rest/i.test(a.qualifier||'');
        const itemUses = rchM ? { value:+rchM[1], max:'6',  per:null, recovery:[{period:'recharge', formula:rchM[1], type:'recoverAll'}] }
                       : srM  ? { value:1,         max:'1',  per:null, recovery:[{period:'sr',       type:'recoverAll'}] }
                       : lrM  ? { value:1,         max:'1',  per:null, recovery:[{period:'lr',       type:'recoverAll'}] }
                       :        { value:null,       max:null, per:null, recovery:[] };
        const isMeleeOrRanged = /Melee\s+or\s+Ranged/i.test(a.description);
        const isMelee  = /Melee\s+(?:Weapon\s+)?Attack(?:\s+Roll)?:/i.test(a.description);
        const isRanged = /Ranged\s+(?:Weapon\s+)?Attack(?:\s+Roll)?:/i.test(a.description);
        const isAttack = !!a.attack;
        const saveInfo = parseSaveInfo(a.description);
        const atkValue = isMeleeOrRanged||isMelee ? 'mwak' : isRanged ? 'rwak' : 'mwak';
        let atkAbility='', atkBonus='';
        if (isAttack && a.attack?.bonus!=null) {
          const strTot=mod(abilities.str)+profBonus, dexTot=mod(abilities.dex)+profBonus, b=a.attack.bonus;
          if (Math.abs(b-strTot)<=Math.abs(b-dexTot)) { atkAbility='str'; const d=b-strTot; atkBonus=d?String(d):''; }
          else { atkAbility='dex'; const d=b-dexTot; atkBonus=d?String(d):''; }
        }
        const baseDmg = a.damage ? {...parseDiceFormula(a.damage.formula), types:[a.damage.type]} : null;
        const addDmg  = a.damage?.additional ? {...parseDiceFormula(a.damage.additional.formula), types:[a.damage.additional.type]} : null;
        let activity;
        if (isAttack) {
          activity = { _id:actId, type:'attack', name:'', activation:{type:'action',cost:1,condition:''},
            attack:{ ability:atkAbility, bonus:atkBonus, flat:false, type:{value:atkValue,classification:'weapon'} },
            damage:{ includeBase:true, parts:addDmg?[addDmg]:[] },
            range: a.attack?.range ? {value:a.attack.range.normal,long:a.attack.range.long??null,units:'ft'}
                 : a.attack?.reach ? {value:a.attack.reach,long:null,units:'ft'} : {value:null,long:null,units:'ft'},
            target: parseTarget(a.description), uses:{spent:0,recovery:[]} };
        } else if (saveInfo) {
          activity = { _id:actId, type:'save', name:'', activation:{type:'action',cost:1,condition:''},
            save:{ ability:[saveInfo.ability], dc:{calculation:'',formula:saveInfo.dc} },
            damage:{ onSave:'half', parts:baseDmg?[baseDmg]:[] },
            target: parseTarget(a.description), uses:{spent:0,recovery:[]} };
        } else {
          activity = { _id:actId, type:'utility', name:'', activation:{type:'action',cost:1,condition:''},
            uses:{spent:0,recovery:[]} };
        }
        return { _id:itemId, name:a.name, type:isAttack?'weapon':'feat',
          system:{ description:{value:a.description},
            type:{ value:'monster', subtype:'' },
            activation:{type:'action',cost:1,condition:''},
            uses:itemUses, ...(baseDmg&&isAttack?{damage:{base:baseDmg}}:{}),
            activities:{[actId]:activity} } };
      });

      // ── Detect sidekick class keyword ──────────────────────────────────────
      // Explicit keyword wins; otherwise infer from content:
      //   Spellcasting trait/action → Spellcaster
      //   Expertise/Sneak Attack    → Expert
      //   Default                   → Warrior
      const sidekickClassKw = isSidekick ? (() => {
        const explicit = text.match(/\b(Warrior|Expert|Spellcaster)\b/i)?.[1];
        if (explicit) return explicit;
        if (/\b(?:Spellcasting|Innate\s+Spellcasting|Cleric|Wizard|Sorcerer|Druid|Bard|Warlock|Paladin|Ranger)\s+spells?\b/i.test(text)
          || traits.some(t => /^(?:Innate\s+)?Spellcasting$/i.test(t.name))
          || actions.some(a => /^Spellcasting$/i.test(a.name))) return 'Spellcaster';
        if (/\b(?:Expertise|Sneak\s+Attack)\b/i.test(text)) return 'Expert';
        return 'Warrior';
      })() : null;

      // ── Build Foundry Actor (NPC for all formats including sidekicks) ──────────
      // Foundry dnd5e sidekick classes go on NPC actors, not character sheets.
      // Users with the TCoE Foundry module can drag the sidekick class item onto
      // the NPC sheet for full leveling support (features, progression, etc.).
      // Sidekick tweaks: cr:0, character advancement XP, Spellcaster slot table.
      const langArr = languages ? languages.split(',').map(l => l.trim().toLowerCase().replace(/\s+/g,'')) : [];
      const allItems = [
        ...features.map(a => makeSimpleItem(a, name, '', 1, 'f')),
        ...traits.map(a   => makeSimpleItem(a, name, '', 1, 't')),
        ...buildActionItems(),
        ...bonusActions.map(a => makeSimpleItem(a, name, 'bonus',    1, 'b')),
        ...reactions.map(a    => makeSimpleItem(a, name, 'reaction', 1, 'r')),
        ...legendaryActions.map(a => {
          const costM = a.qualifier?.match(/Costs?\s+(\d+)\s+Actions?/i);
          return makeSimpleItem(a, name, 'legendary', costM ? +costM[1] : 1, 'l');
        }),
        ...lairActions.map(a  => makeSimpleItem(a, name, 'lair', 1, 'i')),
        ...spellItems, ...innateItems,
      ];

      // Spell slot source — priority: sidekick table → parsed headers → none
      const isSpellcasterSidekick = isSidekick && sidekickClassKw?.toLowerCase() === 'spellcaster';
      const spellSlots = isSpellcasterSidekick
        ? (() => {
            const s = SPELLCASTER_SIDEKICK_SLOTS[Math.min(sidekickLevel, 20)] || [0,0,0,0,0];
            return Object.fromEntries([
              ...s.map((n,i) => [`spell${i+1}`, { value:n, override:n||null }]),
              ...Array.from({length:4},(_,i) => [`spell${i+6}`, { value:0, override:null }]),
              ['pact', { value:0, override:null }]
            ]);
          })()
        : spellInfo?.isSlotBased
          ? Object.fromEntries(Array.from({length:9},(_,i)=>i+1).map(i => {
              const max = spellInfo.slots[i] ?? 0;
              return [`spell${i}`, { value:max, override:max||null }];
            }))
          : null;

      const foundryActor = {
        name, type: 'npc',
        system: {
          abilities: Object.fromEntries(ABS.map(ab => [ab, { value: abilities[ab], proficient: saves[ab] }])),
          attributes: {
            ac:           { flat: ac, calc: 'natural', formula: '' },
            hp:           { value: hp, max: hp, temp: 0, tempmax: 0, formula: hpFormula },
            init:         { ability: 'dex', bonus: initBonus },
            movement:     { ...speeds, units: 'ft', hover },
            senses: {
              ranges:  { darkvision:  darkvision  || null, blindsight: blindsight || null,
                         tremorsense: tremorsense || null, truesight:  truesight  || null },
              units:   null, special: sensesSpecial
            },
            spellcasting: spellInfo?.ability || '',
            spell:        { level: spellInfo?.casterLevel ?? 0 }
          },
          details: {
            alignment, type: { value: type, subtype, custom: '' },
            cr:  isSidekick ? 0 : crToFloat(cr),
            xp:  { value: isSidekick ? levelToXP(sidekickLevel) : crToXP(cr) },
            biography: { value: '', public: '' }
          },
          traits: {
            size: sizeCode,
            languages: { value: langArr, custom: '' },
            di: { ...parseDamageField(diText), bypasses: [] },
            dr: { ...parseDamageField(drText), bypasses: [] },
            dv: { ...parseDamageField(dvText), bypasses: [] },
            ci: { value: extractConditionTypes(ciText), custom: '' }
          },
          skills,
          resources: {
            legact: { max: legBase,    spent: 0 },
            legres: { max: legResBase, spent: 0 },
            lair:   { value: lairActions.length > 0, initiative: null, inside: false }
          },
          ...(spellSlots ? { spells: spellSlots } : {})
        },
        items: allItems,
        effects: [], flags: {}
      };

      stats.accuracy = Math.round((stats.parsed / stats.total) * 100);
      return { errors: errs, warnings: warns, stats, actor: foundryActor };
    } catch (err) {
      return { errors: [err.message], warnings: [], stats: null, actor: null };
    }
}

// ─── Main Component ────────────────────────────────────────────────────────────
const GOBLIN_EXAMPLE = `Goblin
Small humanoid (goblinoid), neutral evil

Armor Class 15 (leather armor, shield)
Hit Points 7 (2d6)
Speed 30 ft.

STR  DEX  CON  INT  WIS  CHA
8    14   10   10   8    8
(-1) (+2) (+0) (+0) (-1) (-1)

Skills Stealth +6
Senses darkvision 60 ft., passive Perception 9
Languages Common, Goblin
Challenge 1/4 (50 XP)

Nimble Escape. The goblin can take the Disengage or Hide action as a bonus action on each of its turns.

Actions
Scimitar. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.
Shortbow. Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage.`;

export default function StatBlockParser({ onSendToEncounter }: { onSendToEncounter?: (actor: any) => void } = {}) {
  const [input, setInput]           = useState('');
  const [output, setOutput]         = useState(null);
  const [errors, setErrors]         = useState([]);
  const [warnings, setWarnings]     = useState([]);
  const [parseStats, setParseStats] = useState(null);
  const [copied, setCopied]         = useState(false);
  const [copiedFGU, setCopiedFGU]   = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editField, setEditField]   = useState(null);
  const [editValue, setEditValue]   = useState('');
  const [inputMode, setInputMode]   = useState<'text' | 'image' | 'url' | 'name' | 'custom'>('text');
  const [urlInput, setUrlInput]     = useState('');
  const [nameInput, setNameInput]   = useState('');
  const [nameSource, setNameSource] = useState('any');
  const [customName, setCustomName] = useState('');
  const [customCR, setCustomCR]     = useState('1');
  const [customCtx, setCustomCtx]   = useState('');
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiError, setAiError]       = useState('');
  const fileInputRef                = useRef<HTMLInputElement>(null);

  const handleImageFile = async (file: File) => {
    setAiError('');
    setAiLoading(true);
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload  = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const text = await extractStatBlockFromImage(dataUrl);
      setInput(text);
      runParse(text);
    } catch (e: any) {
      setAiError(e.message ?? 'Image extraction failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleUrlExtract = async () => {
    if (!urlInput.trim()) return;
    setAiError('');
    setAiLoading(true);
    try {
      const text = await extractStatBlockFromUrl(urlInput.trim());
      setInput(text);
      runParse(text);
    } catch (e: any) {
      setAiError(e.message ?? 'URL extraction failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleNameGenerate = async () => {
    if (!nameInput.trim()) return;
    setAiError('');
    setAiLoading(true);
    try {
      const text = await generateStatBlockFromName(nameInput.trim(), nameSource);
      setInput(text);
      runParse(text);
    } catch (e: any) {
      setAiError(e.message ?? 'Name generation failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCustomGenerate = async () => {
    if (!customName.trim() || !customCR.trim()) return;
    setAiError('');
    setAiLoading(true);
    try {
      const text = await generateCustomStatBlock(customName.trim(), customCR.trim(), customCtx);
      setInput(text);
      runParse(text);
    } catch (e: any) {
      setAiError(e.message ?? 'Custom generation failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const startEdit = (name) => { setEditField(name); setEditValue(parseStats?.fields.find(f => f.name === name)?.value ?? ''); };
  const saveEdit  = () => {
    if (!editField) return;
    setParseStats(p => ({ ...p, fields: p.fields.map(f => f.name === editField ? { ...f, value: editValue } : f) }));
    setOutput(o => o ? applyFieldEdit(editField, editValue, o) : o);
    setEditField(null);
  };

  const runParse = (text) => {
    const { errors: errs, warnings: warns, stats, actor } = parseStatBlock(text);
    setErrors(errs); setWarnings(warns); setParseStats(stats); setOutput(actor);
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
          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Sword size={14} /> v4.3-alpha</span>
          {(input || output) && (
            <button
              onClick={() => { setInput(''); setOutput(null); setErrors([]); setWarnings([]); setParseStats(null); setShowEditor(false); setAiError(''); setUrlInput(''); setNameInput(''); setCustomName(''); setCustomCR('1'); setCustomCtx(''); }}
              className="ml-auto flex items-center gap-1 bg-slate-700 hover:bg-red-900 text-slate-400 hover:text-red-300 text-xs font-semibold px-3 py-1.5 rounded transition"
              title="Clear input and results"
            >
              <X size={13} /> Reset
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg p-5 border border-purple-500/30">
              {/* Mode tabs */}
              <div className="flex gap-1 mb-4">
                {([['text','Text', FileText], ['image','Image', Image], ['url','URL', Link], ['name','Name', Zap]] as const).map(([mode, label, Icon]) => (
                  <button key={mode} onClick={() => { setInputMode(mode); setAiError(''); }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold transition ${
                      inputMode === mode ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
                    }`}>
                    <Icon size={12} />{label}
                  </button>
                ))}
                <button onClick={() => { setInputMode('custom'); setAiError(''); }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold transition ${
                    inputMode === 'custom' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-violet-400 hover:text-white'
                  }`}>
                  <Sparkles size={12} /> AI
                </button>
              </div>

              {/* Text mode */}
              {inputMode === 'text' && (
                <>
                  <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Paste D&D 5e stat block here..."
                    className="w-full h-56 bg-slate-700 text-white rounded p-3 text-sm font-mono border border-purple-400/30 focus:border-purple-400 focus:outline-none resize-none" />
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => runParse(input)} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2">
                      <Zap size={16} /> Parse Stat Block
                    </button>
                    <button onClick={() => setInput(GOBLIN_EXAMPLE)} title="Load a sample Goblin stat block" className="bg-slate-600 hover:bg-slate-500 text-slate-300 text-xs font-semibold px-3 py-2 rounded transition whitespace-nowrap">
                      Load Example
                    </button>
                  </div>
                </>
              )}

              {/* Image mode */}
              {inputMode === 'image' && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])} />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); e.dataTransfer.files?.[0] && handleImageFile(e.dataTransfer.files[0]); }}
                    className="w-full h-56 border-2 border-dashed border-purple-400/40 hover:border-purple-400 rounded flex flex-col items-center justify-center gap-3 cursor-pointer transition text-slate-400 hover:text-white"
                  >
                    {aiLoading
                      ? <><Loader size={28} className="animate-spin text-purple-400" /><span className="text-sm">Extracting with Claude...</span></>
                      : <><Image size={28} /><span className="text-sm">Click or drag an image here</span><span className="text-xs text-slate-500">PNG, JPG, WEBP — screenshot of any stat block</span></>
                    }
                  </div>
                  {!hasApiKey() && <p className="text-yellow-400 text-xs mt-2">⚠ No API key — open Settings (⚙) to add one.</p>}
                </>
              )}

              {/* URL mode */}
              {inputMode === 'url' && (
                <>
                  <div className="space-y-3">
                    <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUrlExtract()}
                      placeholder="https://dnd5e.wikidot.com/monster:goblin"
                      className="w-full bg-slate-700 text-white rounded p-3 text-sm border border-purple-400/30 focus:border-purple-400 focus:outline-none" />
                    <button onClick={handleUrlExtract} disabled={aiLoading || !urlInput.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2">
                      {aiLoading ? <><Loader size={16} className="animate-spin" /> Fetching...</> : <><Link size={16} /> Extract from URL</>}
                    </button>

                    {/* Known working sites */}
                    <div className="bg-slate-700/50 rounded p-3 space-y-1.5">
                      <p className="text-slate-300 text-xs font-semibold mb-2">Known working sites (static HTML):</p>
                      {[
                        ['dnd5e.wikidot.com', 'Large SRD + community monster index'],
                        ['dandwiki.com', 'Community homebrew & SRD monsters'],
                        ['open5e.com', 'Open SRD monsters with clean formatting'],
                      ].map(([site, desc]) => (
                        <div key={site} className="flex items-start gap-2">
                          <span className="text-green-400 text-xs mt-0.5">✓</span>
                          <div>
                            <span className="text-green-300 text-xs font-mono">{site}</span>
                            <span className="text-slate-500 text-xs"> — {desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Non-working sites */}
                    <div className="bg-slate-700/50 rounded p-3 space-y-1.5">
                      <p className="text-slate-300 text-xs font-semibold mb-2">Use Image, Text, or Name mode instead:</p>
                      {[
                        ['D&D Beyond', 'JavaScript app + bot blocking'],
                        ['GM Binder / Homebrewery', 'JavaScript rendered — use Image mode'],
                        ['5e.tools', 'Data loaded dynamically — use Name mode'],
                        ['Roll20', 'Requires login — use Image mode'],
                      ].map(([site, reason]) => (
                        <div key={site} className="flex items-start gap-2">
                          <span className="text-yellow-400 text-xs mt-0.5">⚠</span>
                          <div>
                            <span className="text-yellow-300 text-xs font-semibold">{site}</span>
                            <span className="text-slate-500 text-xs"> — {reason}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Disclaimer */}
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
                      <p className="text-blue-300 text-xs leading-relaxed">
                        <span className="font-semibold">Please support the creators.</span> This tool is a bridge to help you use content you already own on your VTT of choice. While much of D&D 5e is open source under the SRD, please only import content from platforms and sourcebooks you have purchased. Support Wizards of the Coast, GM Binder creators, and independent publishers who make this hobby great.
                      </p>
                    </div>
                  </div>
                  {!hasApiKey() && <p className="text-yellow-400 text-xs mt-2">⚠ No API key — open Settings (⚙) to add one.</p>}
                </>
              )}

              {/* Name mode */}
              {inputMode === 'name' && (
                <>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleNameGenerate()}
                      placeholder="e.g. Vampire Familiar, Adult Red Dragon..."
                      className="w-full bg-slate-700 text-white rounded p-3 text-sm border border-purple-400/30 focus:border-purple-400 focus:outline-none"
                    />
                    <select
                      value={nameSource}
                      onChange={e => setNameSource(e.target.value)}
                      className="w-full bg-slate-700 text-white rounded p-2 text-sm border border-slate-600 focus:border-purple-400 focus:outline-none"
                    >
                      <option value="any">Any sourcebook</option>
                      <option value="the 2024 Monster Manual">2024 Monster Manual</option>
                      <option value="the 2014 Monster Manual">2014 Monster Manual</option>
                      <option value="Mordenkainen's Tome of Foes">Mordenkainen's Tome of Foes</option>
                      <option value="Volo's Guide to Monsters">Volo's Guide to Monsters</option>
                      <option value="Fizban's Treasury of Dragons">Fizban's Treasury of Dragons</option>
                      <option value="Monsters of the Multiverse">Monsters of the Multiverse</option>
                    </select>
                    <button
                      onClick={handleNameGenerate}
                      disabled={aiLoading || !nameInput.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"
                    >
                      {aiLoading
                        ? <><Loader size={16} className="animate-spin" /> Generating...</>
                        : <><Zap size={16} /> Generate Stat Block</>}
                    </button>
                    <p className="text-slate-500 text-xs">Uses Claude's knowledge of published sourcebooks. Works best for official monsters.</p>
                  </div>
                  {!hasApiKey() && <p className="text-yellow-400 text-xs mt-2">⚠ No API key — open Settings (⚙) to add one.</p>}
                </>
              )}

              {/* AI Custom mode */}
              {inputMode === 'custom' && (
                <>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCustomGenerate()}
                        placeholder="Creature name — e.g. Goblin, Ancient Red Dragon..."
                        className="flex-1 bg-slate-700 text-white rounded p-3 text-sm border border-violet-400/30 focus:border-violet-400 focus:outline-none"
                      />
                      <div className="flex items-center gap-2 bg-slate-700 border border-violet-400/30 rounded px-3">
                        <span className="text-slate-400 text-xs whitespace-nowrap">CR</span>
                        <input
                          type="text"
                          value={customCR}
                          onChange={e => setCustomCR(e.target.value)}
                          placeholder="1"
                          className="w-16 bg-transparent text-white text-sm focus:outline-none text-center"
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      value={customCtx}
                      onChange={e => setCustomCtx(e.target.value)}
                      placeholder="Optional: theme, traits, environment — e.g. undead, frost giant chieftain, fire breath"
                      className="w-full bg-slate-700 text-white rounded p-3 text-sm border border-violet-400/30 focus:border-violet-400 focus:outline-none"
                    />
                    <button
                      onClick={handleCustomGenerate}
                      disabled={aiLoading || !customName.trim() || !customCR.trim()}
                      className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"
                    >
                      {aiLoading
                        ? <><Loader size={16} className="animate-spin" /> Generating...</>
                        : <><Sparkles size={16} /> Generate Custom Stat Block</>}
                    </button>
                    <p className="text-slate-500 text-xs">Builds a stat block from scratch tuned to the exact CR — not pulled from any sourcebook. Try "Beefy Goblin CR 5" or "Weakened Dragon CR 8".</p>
                  </div>
                  {!hasApiKey() && <p className="text-yellow-400 text-xs mt-2">⚠ No API key — open Settings (⚙) to add one.</p>}
                </>
              )}

              {/* AI error */}
              {aiError && <div className="mt-3 text-red-300 text-xs bg-red-900/20 rounded px-3 py-2">{aiError}</div>}

              {/* Extracted text preview (image/url/name modes) */}
              {inputMode !== 'text' && input && (
                <div className="mt-3">
                  <div className="text-slate-400 text-xs mb-1">Extracted text — edit if needed then re-parse:</div>
                  <textarea value={input} onChange={e => setInput(e.target.value)}
                    className="w-full h-32 bg-slate-700 text-white rounded p-2 text-xs font-mono border border-slate-600 focus:outline-none resize-none" />
                  <button onClick={() => runParse(input)} className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2">
                    <Zap size={16} /> Re-parse
                  </button>
                </div>
              )}
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
                {parseStats.fields.filter(f => f.method === 'n/a').length > 0 && (
                  <div className="text-xs text-slate-500 mt-1">{parseStats.fields.filter(f => f.method === 'n/a').length} optional field(s) not present — excluded from score</div>
                )}
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
                              <span className={`text-xs px-2 py-0.5 rounded ${field.method === 'exact' ? 'bg-green-600/30 text-green-400' : field.method === 'n/a' ? 'bg-slate-800/60 text-slate-600' : 'bg-slate-600/30 text-slate-400'}`}>{field.method}</span>
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
                            {item.system.uses?.recovery?.[0]?.period === 'recharge' && <span className="ml-2 text-xs text-yellow-400">(Recharge {item.system.uses.value}–6)</span>}
                            {item.system.uses?.recovery?.[0]?.period === 'day'      && <span className="ml-2 text-xs text-sky-300">({item.system.uses.max}/Day)</span>}
                            {item.system.uses?.recovery?.[0]?.period === 'sr'       && <span className="ml-2 text-xs text-emerald-300">(Short Rest)</span>}
                            {item.system.uses?.recovery?.[0]?.period === 'lr'       && <span className="ml-2 text-xs text-violet-300">(Long Rest)</span>}
                            {item.system.activation?.type === 'reaction'  && <span className="ml-2 text-xs text-blue-400">[reaction]</span>}
                            {item.system.activation?.type === 'bonus'     && <span className="ml-2 text-xs text-emerald-400">[bonus]</span>}
                            {item.system.activation?.type === 'legendary' && <span className="ml-2 text-xs text-yellow-400">[legendary ×{item.system.activation.cost}]</span>}
                            {item.system.activation?.type === 'lair'      && <span className="ml-2 text-xs text-cyan-400">[lair]</span>}
                            {!item.system.activation?.type && item.type === 'feat' && <span className="ml-2 text-xs text-purple-400">[trait]</span>}
                            {item.type === 'weapon' && <span className="ml-2 text-xs text-slate-500">[weapon]</span>}
                            {item.type === 'spell' && item.system.method === 'spell'   && <span className="ml-2 text-xs text-sky-400">[spell lv{item.system.level}]</span>}
                            {item.type === 'spell' && item.system.method === 'atwill'  && <span className="ml-2 text-xs text-sky-300">[at will]</span>}
                            {item.type === 'spell' && item.system.method === 'innate'  && <span className="ml-2 text-xs text-violet-400">[innate {item.system.uses?.max}/day]</span>}
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
                  {onSendToEncounter && (
                    <button onClick={() => onSendToEncounter(output)}
                      className="w-full mt-2 bg-amber-700/60 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2">
                      <Sword size={15} /> Add to Encounter Builder
                    </button>
                  )}
                </div>

                <div className="bg-slate-800 rounded-lg p-5 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-3"><FileJson size={20} className="text-amber-400" /><label className="text-white font-semibold">Fantasy Grounds Unity XML</label></div>
                  <pre className="w-full h-64 bg-slate-700 text-amber-300 rounded p-3 text-xs font-mono overflow-auto border border-amber-400/30">{toFantasyGroundsXML(output)}</pre>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => { const xml = toFantasyGroundsXML(output); const b = new Blob([xml], { type: 'application/xml' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `${output.name.replace(/\s+/g,'_')}_fg.xml`; a.click(); URL.revokeObjectURL(u); }}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"><Download size={16} /> Download XML</button>
                    <button onClick={() => { navigator.clipboard.writeText(toFantasyGroundsXML(output)); setCopiedFGU(true); setTimeout(() => setCopiedFGU(false), 2000); }}
                      className="flex-1 bg-amber-600/50 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"><Copy size={16} /> {copiedFGU ? 'Copied!' : 'Copy XML'}</button>
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
