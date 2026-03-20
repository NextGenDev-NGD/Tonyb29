// fantasy-grounds-exporter.ts
// Phase 10 — Fantasy Grounds Unity XML formatter (2024 format)
// Schema reverse-engineered from a real FGU export (Balor, 2024 format).
// Takes a Foundry VTT actor object (output state) and returns FGU-compatible XML.

// ─── Maps ─────────────────────────────────────────────────────────────────────
const SIZE_MAP: Record<string, string> = {
  tiny: 'Tiny', sm: 'Small', med: 'Medium',
  lg: 'Large', huge: 'Huge', grg: 'Gargantuan',
};

const ABILITY_KEYS = ['strength','dexterity','constitution','intelligence','wisdom','charisma'];
const ABILITY_SHORT: Record<string, string> = {
  strength:'str', dexterity:'dex', constitution:'con',
  intelligence:'int', wisdom:'wis', charisma:'cha',
};

const SKILL_DISPLAY: Record<string, string> = {
  acr: 'Acrobatics',    ani: 'Animal Handling', arc: 'Arcana',
  ath: 'Athletics',     dec: 'Deception',        his: 'History',
  ins: 'Insight',       itm: 'Intimidation',     inv: 'Investigation',
  med: 'Medicine',      nat: 'Nature',            prc: 'Perception',
  prf: 'Performance',   per: 'Persuasion',        rel: 'Religion',
  slt: 'Sleight of Hand', ste: 'Stealth',         sur: 'Survival',
};

const SKILL_ABILITY: Record<string, string> = {
  acr: 'dex', ani: 'wis', arc: 'int', ath: 'str',
  dec: 'cha', his: 'int', ins: 'wis', itm: 'cha',
  inv: 'int', med: 'wis', nat: 'int', prc: 'wis',
  prf: 'cha', per: 'cha', rel: 'int', slt: 'dex',
  ste: 'dex', sur: 'wis',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const crToString = (cr: number): string => {
  if (cr === 0.125) return '1/8';
  if (cr === 0.25)  return '1/4';
  if (cr === 0.5)   return '1/2';
  return String(Math.round(cr));
};

const profBonus = (cr: number): number => {
  if (cr < 5)  return 2;
  if (cr < 9)  return 3;
  if (cr < 13) return 4;
  if (cr < 17) return 5;
  return 6;
};

const abilityMod = (score: number): number => Math.floor((score - 10) / 2);
const signed = (n: number): string => n >= 0 ? `+${n}` : String(n);

const titleCase = (s: string): string =>
  s.replace(/\b\w/g, c => c.toUpperCase());

const stripHtml = (html: string): string =>
  html
    .replace(/<\/p>/gi, ' ').replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();

const esc = (s: string): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Build a numbered id-section: <id-00001><name>...</name><desc>...</desc></id-00001>
const buildIdSection = (items: any[], indent = '\t\t\t'): string =>
  items.map((i, idx) => {
    const n   = String(idx + 1).padStart(5, '0');
    const desc = stripHtml(i.system?.description?.value ?? '');
    return `${indent}<id-${n}>\n${indent}\t<name type="string">${esc(i.name)}</name>\n${indent}\t<desc type="string">${esc(desc)}</desc>\n${indent}</id-${n}>`;
  }).join('\n');

const emptyOrSection = (tag: string, items: any[], indent = '\t\t'): string => {
  if (items.length === 0) return `${indent}<${tag} />`;
  return `${indent}<${tag}>\n${buildIdSection(items)}\n${indent}</${tag}>`;
};

// ─── Main Exporter ────────────────────────────────────────────────────────────
export const toFantasyGroundsXML = (actor: any): string => {
  const sys   = actor.system;
  const ab    = sys.abilities ?? {};
  const cr    = sys.details?.cr ?? 0;
  const pb    = profBonus(cr);
  const items: any[] = actor.items ?? [];

  // ── Type string ────────────────────────────────────────────────────────────
  const typeVal  = sys.details?.type?.value ?? 'humanoid';
  const subtype  = sys.details?.type?.subtype ?? '';
  const typeStr  = titleCase(typeVal) + (subtype ? ` (${titleCase(subtype)})` : '');

  // ── Alignment ──────────────────────────────────────────────────────────────
  const alignment = titleCase(sys.details?.alignment ?? 'Unaligned');

  // ── Speed ──────────────────────────────────────────────────────────────────
  const mv = sys.attributes?.movement ?? {};
  const speedParts: string[] = [];
  if (mv.walk)   speedParts.push(`${mv.walk} ft.`);
  if (mv.fly)    speedParts.push(`Fly ${mv.fly} ft.${mv.hover ? ' (Hover)' : ''}`);
  if (mv.swim)   speedParts.push(`Swim ${mv.swim} ft.`);
  if (mv.burrow) speedParts.push(`Burrow ${mv.burrow} ft.`);
  if (mv.climb)  speedParts.push(`Climb ${mv.climb} ft.`);
  const speedText = speedParts.join(', ') || '30 ft.';

  // ── Abilities block ─────────────────────────────────────────────────────────
  // Each ability: <bonus> = mod, <savemodifier> = pb if proficient else 0, <score>
  const abilitiesXml = ABILITY_KEYS.map(full => {
    const k     = ABILITY_SHORT[full];
    const score = ab[k]?.value ?? 10;
    const bonus = abilityMod(score);
    const saveMod = ab[k]?.proficient ? pb : 0;
    return `\t\t\t<${full}>\n\t\t\t\t<bonus type="number">${bonus}</bonus>\n\t\t\t\t<savemodifier type="number">${saveMod}</savemodifier>\n\t\t\t\t<score type="number">${score}</score>\n\t\t\t</${full}>`;
  }).join('\n');

  // ── Skills text ────────────────────────────────────────────────────────────
  const skillsObj = sys.skills ?? {};
  const skillParts: string[] = [];
  for (const [key, label] of Object.entries(SKILL_DISPLAY)) {
    const sk = skillsObj[key];
    if (sk && sk.value > 0) {
      const abilKey = SKILL_ABILITY[key];
      const bonus   = abilityMod(ab[abilKey]?.value ?? 10) + pb * sk.value;
      skillParts.push(`${label} ${signed(bonus)}`);
    }
  }
  const skillsText = skillParts.join(', ');

  // ── Senses text (includes passive perception) ──────────────────────────────
  const ranges = sys.attributes?.senses?.ranges ?? {};
  const senseParts: string[] = [];
  if (ranges.darkvision)  senseParts.push(`Darkvision ${ranges.darkvision} ft.`);
  if (ranges.blindsight)  senseParts.push(`Blindsight ${ranges.blindsight} ft.`);
  if (ranges.tremorsense) senseParts.push(`Tremorsense ${ranges.tremorsense} ft.`);
  if (ranges.truesight)   senseParts.push(`Truesight ${ranges.truesight} ft.`);
  const senseSpecial = sys.attributes?.senses?.special;
  if (senseSpecial) senseParts.push(senseSpecial);
  const prcVal    = skillsObj.prc?.value ?? 0;
  const passivePerc = 10 + abilityMod(ab.wis?.value ?? 10) + (prcVal > 0 ? pb * prcVal : 0);
  const sensesText = [...senseParts, `Passive Perception ${passivePerc}`].join('; ');

  // ── Languages ──────────────────────────────────────────────────────────────
  const langVals   = sys.traits?.languages?.value ?? [];
  const langCustom = sys.traits?.languages?.custom ?? '';
  const langs = [...langVals.map(titleCase), ...(langCustom ? [langCustom] : [])].join(', ');

  // ── Damage / Condition traits ───────────────────────────────────────────────
  const drVals   = sys.traits?.dr?.value ?? [];
  const drCustom = sys.traits?.dr?.custom ?? '';
  const dr = [...drVals.map(titleCase), ...(drCustom ? [drCustom] : [])].join(', ');

  const dvVals   = sys.traits?.dv?.value ?? [];
  const dvCustom = sys.traits?.dv?.custom ?? '';
  const dv = [...dvVals.map(titleCase), ...(dvCustom ? [dvCustom] : [])].join(', ');

  const diVals   = sys.traits?.di?.value ?? [];
  const diCustom = sys.traits?.di?.custom ?? '';
  const di = [...diVals.map(titleCase), ...(diCustom ? [diCustom] : [])].join(', ');

  const ciVals   = sys.traits?.ci?.value ?? [];
  const ciCustom = sys.traits?.ci?.custom ?? '';
  const ci = [...ciVals.map(titleCase), ...(ciCustom ? [ciCustom] : [])].join(', ');

  // FGU combines damage immunities + condition immunities in one field with ';'
  const immunityText = [di, ci].filter(Boolean).join('; ');

  // ── Initiative misc = DEX mod (or explicit bonus if set) ───────────────────
  const initBonus = sys.attributes?.init?.bonus || abilityMod(ab.dex?.value ?? 10);

  // ── Item categorisation ────────────────────────────────────────────────────
  const isSpell     = (i: any) => i.type === 'spell';
  const activType   = (i: any) => i.system?.activation?.type ?? '';
  const traitItems    = items.filter(i => !isSpell(i) && activType(i) === '');
  const actionItems   = items.filter(i => !isSpell(i) && activType(i) === 'action');
  const bonusItems    = items.filter(i => !isSpell(i) && activType(i) === 'bonus');
  const reactionItems = items.filter(i => !isSpell(i) && activType(i) === 'reaction');
  const legendaryItems = items.filter(i => !isSpell(i) && activType(i) === 'legendary');
  const lairItems     = items.filter(i => !isSpell(i) && (activType(i) === 'lair' || activType(i) === 'special'));
  const spellItems    = items.filter(isSpell);

  // ── Spellcasting trait (appended to traits if spells present) ─────────────
  const spellTraitItems: any[] = [];
  if (spellItems.length > 0) {
    const spellAbil = sys.attributes?.spellcasting || 'int';
    const spellMod  = abilityMod(ab[spellAbil]?.value ?? 10);
    const spellDC   = 8 + pb + spellMod;
    const spellAtk  = signed(pb + spellMod);
    const atwill    = spellItems.filter((s: any) => s.system?.method === 'atwill');
    const innate    = spellItems.filter((s: any) => s.system?.method === 'innate');
    const prepared  = spellItems.filter((s: any) => s.system?.method === 'spell');
    const parts: string[] = [`Spell attack ${spellAtk}, save DC ${spellDC}.`];
    if (atwill.length)   parts.push(`At will: ${atwill.map((s: any) => s.name).join(', ')}.`);
    if (innate.length)   parts.push(`Innate: ${innate.map((s: any) => s.name).join(', ')}.`);
    if (prepared.length) parts.push(`Spells: ${prepared.map((s: any) => s.name).join(', ')}.`);
    spellTraitItems.push({ name: 'Spellcasting', system: { description: { value: parts.join(' ') } } });
  }

  const allTraitItems = [...traitItems, ...spellTraitItems];

  // ── Boilerplate spellslots ─────────────────────────────────────────────────
  const spellSlotsXml = Array.from({ length: 9 }, (_, i) =>
    `\t\t\t<level${i + 1} type="number">0</level${i + 1}>`
  ).join('\n');

  // ── Assemble ───────────────────────────────────────────────────────────────
  const t = '\t\t'; // base indent inside <npc>
  const lines: string[] = [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<root version="5.1" dataversion="20260124" release="9|CoreRPG:7">`,
    `\t<npc>`,
    `${t}<name type="string">${esc(actor.name ?? 'Unknown')}</name>`,
    `${t}<size type="string">${SIZE_MAP[sys.traits?.size] ?? 'Medium'}</size>`,
    `${t}<type type="string">${esc(typeStr)}</type>`,
    `${t}<alignment type="string">${esc(alignment)}</alignment>`,
    `${t}<ac type="number">${sys.attributes?.ac?.flat ?? 10}</ac>`,
    `${t}<hp type="number">${sys.attributes?.hp?.value ?? 0}</hp>`,
    `${t}<hd type="string">${esc(sys.attributes?.hp?.formula ?? '')}</hd>`,
    `${t}<speed type="string">${esc(speedText)}</speed>`,
    `${t}<abilities>\n${abilitiesXml}\n${t}</abilities>`,
    skillsText ? `${t}<skills type="string">${esc(skillsText)}</skills>` : '',
    `${t}<senses type="string">${esc(sensesText)}</senses>`,
    langs      ? `${t}<languages type="string">${esc(langs)}</languages>` : '',
    `${t}<cr type="string">${crToString(cr)}</cr>`,
    `${t}<xp type="number">${sys.details?.xp?.value ?? 0}</xp>`,
    `${t}<initiative>\n${t}\t<misc type="number">${initBonus}</misc>\n${t}</initiative>`,
    `${t}<damagethreshold type="number">0</damagethreshold>`,
    immunityText ? `${t}<damageimmunities type="string">${esc(immunityText)}</damageimmunities>` : '',
    dr           ? `${t}<damageresistances type="string">${esc(dr)}</damageresistances>` : '',
    dv           ? `${t}<damagevulnerabilities type="string">${esc(dv)}</damagevulnerabilities>` : '',
    emptyOrSection('traits',          allTraitItems),
    emptyOrSection('actions',         actionItems),
    emptyOrSection('bonusactions',    bonusItems),
    emptyOrSection('reactions',       reactionItems),
    emptyOrSection('legendaryactions',legendaryItems),
    emptyOrSection('lairactions',     lairItems),
    `${t}<innatespells />`,
    `${t}<spells />`,
    `${t}<spellslots>\n${spellSlotsXml}\n${t}</spellslots>`,
    `${t}<locked type="number">0</locked>`,
    `${t}<version type="string">2024</version>`,
    `${t}<summon type="number">0</summon>`,
    `${t}<summon_ac_base type="number">0</summon_ac_base>`,
    `${t}<summon_ac_mod type="number">0</summon_ac_mod>`,
    `${t}<summon_attack type="number">0</summon_attack>`,
    `${t}<summon_dc type="number">0</summon_dc>`,
    `${t}<summon_hp_base type="number">0</summon_hp_base>`,
    `${t}<summon_hp_mod type="number">0</summon_hp_mod>`,
    `${t}<summon_hp_mod_threshold type="number">0</summon_hp_mod_threshold>`,
    `${t}<summon_level type="number">0</summon_level>`,
    `${t}<summon_mod type="number">0</summon_mod>`,
    `${t}<summon_pb type="number">0</summon_pb>`,
    `${t}<text type="formattedtext" />`,
    `\t</npc>`,
    `</root>`,
  ];

  return lines.filter(l => l !== '').join('\n');
};
