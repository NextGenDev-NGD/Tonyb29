// claude-api.ts — isolated Claude API module
// Uses the official Anthropic SDK with dangerouslyAllowBrowser for browser-side calls.
// Swap getClient() to point at a backend proxy when moving to SaaS.

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';
export const STORAGE_KEY = 'claude_api_key';

export function getApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key.trim());
}

export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

function getClient(): Anthropic {
  const key = getApiKey();
  if (!key) throw new Error('No API key configured — open Settings (⚙) to add your key.');
  return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
}

// Generate a stat block from a monster name using Claude's training knowledge
export async function generateStatBlockFromName(name: string, source: string, context?: string): Promise<string> {
  const client = getClient();
  const sourceHint = source !== 'any' ? ` from ${source}` : '';
  const contextHint = context?.trim() ? ` Additional context: ${context.trim()}.` : '';

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Generate the complete D&D 5e stat block for "${name}"${sourceHint}.${contextHint} Output ONLY the raw stat block text in standard format — name, size/type/alignment, Armor Class, Hit Points, Speed, ability scores, saving throws (if any), skills (if any), damage immunities/resistances/vulnerabilities (if any), senses, languages, Challenge rating, traits, actions, bonus actions (if any), reactions (if any), legendary actions (if any). Do not use markdown, bullet points, or any formatting beyond standard stat block plain text. Do not add any commentary before or after.`,
    }],
  });

  return (msg.content[0] as any).text?.trim() ?? '';
}

// Extract a plain-text stat block from an image (base64 data URL)
export async function extractStatBlockFromImage(dataUrl: string): Promise<string> {
  const client = getClient();
  const [header, base64] = dataUrl.split(',');
  const mediaType = (header.match(/data:([^;]+)/)?.[1] ?? 'image/png') as any;

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        },
        {
          type: 'text',
          text: `Extract the D&D 5e stat block from this image. Return ONLY the raw stat block text exactly as it appears, preserving all formatting, numbers, and section headers. Do not add commentary, markdown, or any text outside the stat block itself.`,
        },
      ],
    }],
  });

  return (msg.content[0] as any).text?.trim() ?? '';
}

// Generate a full CampaignPreset JSON object from a plain-language campaign description
export async function generateCampaignPreset(description: string): Promise<string> {
  const client = getClient();

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    messages: [{
      role: 'user',
      content: `You are a D&D 5e campaign designer. Generate a complete CampaignPreset JSON object for the campaign described below.

OUTPUT: A single valid JSON object. No markdown fences, no commentary, no explanation — only raw JSON.

SCHEMA (all fields required unless marked optional):
{
  "id": string,                    // lowercase slug, hyphens only
  "name": string,                  // display name
  "description": string,           // one-liner: genre · N continents · N NPCs
  "rootJournalFolderName": string, // top-level journal folder name
  "creatureFolderName": string,    // actor folder name for creatures

  "journalFolders": [{ "name": string, "type": "JournalEntry", "parentName": string (optional), "color": string }],
  "actorFolders":  [{ "name": string, "type": "Actor",         "parentName": string (optional), "color": string }],

  "continents": [{
    "name": string, "theme": string, "geography": string,
    "culture": string, "locations": string[]
  }],

  "npcs": [{
    "name": string, "title": string, "race": string, "cls": string,
    "alignment": string, "cr": number, "creatureType": "humanoid",
    "continent": string,      // must exactly match a continent name
    "bio": string,            // <p>2-3 sentences HTML</p>
    "appearance": string,     // 1 sentence plain text
    "relationships": string,  // 1 sentence plain text
    "img": string             // "worlds/[id]/assets/[name-slug].png"
  }],

  "creatures": [{
    "name": string, "cr": number, "creatureType": string,
    "alignment": string, "bio": string,
    "img": string             // "worlds/[id]/assets/[name-slug].png"
  }],

  "journals": [{
    "name": string,
    "folder": string,         // must match a journalFolder name
    "pages": [{ "name": string, "html": string }]
  }]
}

RULES:
- 2-4 continents/regions, each with 3-5 locations
- 2-3 NPC leaders per continent (rulers, faction heads, key figures)
- 4-8 unique creatures fitting the setting
- Journals: one "World Overview" + one per continent (each with 2-3 pages)
- NPC cr: 1-10 range typical; alignment in "lawful good" format
- actorFolders MUST include one entry per continent with name === that continent's name exactly (Step 3 macros look up folders by continent name)
- Use thematic hex colors for folders (e.g. "#4a1d96" for arcane, "#1e3a5f" for ocean)
- img paths: "worlds/[id]/assets/[name-slug].png"
- Keep bio/html concise — 2-4 sentences per field
- Journal html: use <p> and <h2> tags, 3-5 sentences per page

CAMPAIGN DESCRIPTION:
${description.trim()}`,
    }],
  });

  return (msg.content[0] as any).text?.trim() ?? '';
}

// Convert freeform class description into the Class Importer template format
export async function generateClassTemplate(description: string): Promise<string> {
  const client = getClient();

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `You are an expert D&D 5e homebrew designer. Convert the following class description into the exact Class Importer template format below. Output ONLY the template text — no commentary, no markdown fences, no explanation before or after.

FORMAT SPEC:

Section 1 — HEADER (all fields required):
Class: <name>
HitDie: <d6|d8|d10|d12>
Saves: <Str|Dex|Con|Int|Wis|Cha>, <...>
Armor: <None|Light|Medium|Heavy|Shields>  (comma-separated; write None if no armor)
Weapons: <Simple|Martial>  (comma-separated)
Skills: <N> from <Skill1>, <Skill2>, ...  (use full skill names, e.g. "2 from Arcana, History, Insight")
Spellcasting: <full|half|third|pact|none> / <Int|Wis|Cha>  (e.g. "full / Wis" or just "none")
SubclassLevel: <number>
Subclasses: <Name1>, <Name2>, <Name3>  (invent 2-3 thematic names if not specified)

Section 2 — SCALE VALUES (optional, one per line, only if the class has scaling quantities):
Scale: <Display Name> | <string|dice|number> | <1:val>, <5:val>, <10:val>, ...
  - "dice" for damage dice like 2d6, "number" for counts/uses, "string" for descriptive text
  - Only list levels where the value actually changes

Section 3 — LEVEL PROGRESSION (Level 1 through Level 20, every level):
Level N: <Feature Name>, <Feature Name>, ASI, Subclass
  - "ASI" at levels 4, 8, 12, 16, 19 (standard) unless the class specifies different levels
  - "Subclass" at the SubclassLevel and at each level subclasses gain new features
  - Feature names here must EXACTLY match the Feature: block names below

Section 4 — FEATURE DEFINITIONS (one block per class feature):
Feature: <Name>
Uses: <N / sr|lr>  (omit this line entirely if the feature is passive or always-on)
Description: <one paragraph describing the feature>

  For scale-based uses: Uses: @scale.<classslug>.<featureslug> / lr
  where classslug = class name lowercase, spaces → hyphens
  and featureslug = feature name lowercase, spaces → hyphens

Section 5 — SUBCLASS BLOCKS (after all class feature blocks):
Subclass: <Name>
Level <SubclassLevel>: <Feature>, <Feature>
Level N: <Feature>

Feature: <Subclass Feature Name>
Uses: <N / sr|lr>  (omit if passive)
Description: <description>

RULES:
- Every feature name in any Level N: line must have a matching Feature: block
- If the description is vague about specific features, invent logical ones that fit the theme
- If a feature has limited uses, include a Uses: line; if it's passive/always-on, omit Uses:
- Keep descriptions concise but complete (2-4 sentences each)
- Distribute ASIs at levels 4, 8, 12, 16, 19 unless told otherwise
- Subclass features typically appear at SubclassLevel, then every 3-4 levels after

CLASS DESCRIPTION:
${description.trim()}`,
    }],
  });

  return (msg.content[0] as any).text?.trim() ?? '';
}

// Generate a CUSTOM stat block for a creature at a specific CR — not canonical, fully invented.
// Great for reskinned variants: a CR 6 Goblin Warchief, a weakened CR 10 Ancient Dragon, etc.
export async function generateCustomStatBlock(name: string, cr: string, context?: string): Promise<string> {
  const client = getClient();
  const contextHint = context?.trim() ? ` Additional context: ${context.trim()}.` : '';

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Create a fully custom D&D 5e stat block for a creature called "${name}" built to exactly Challenge Rating ${cr}.${contextHint} Do NOT use any canonical stat block — design this creature from scratch so that its HP, AC, attack bonus, damage, and save DC all match what is appropriate for CR ${cr} according to the Dungeon Master\'s Guide monster creation guidelines. Output ONLY the raw stat block text in standard format — name, size/type/alignment, Armor Class, Hit Points, Speed, ability scores, saving throws (if any), skills (if any), damage immunities/resistances/vulnerabilities (if any), senses, languages, Challenge rating, traits, actions, bonus actions (if any), reactions (if any), legendary actions (if any). Do not use markdown, bullet points, or any formatting beyond standard stat block plain text. Do not add any commentary before or after.`,
    }],
  });

  return (msg.content[0] as any).text?.trim() ?? '';
}

// Generate a structured magic item spec JSON from a description or hints
export async function generateMagicItemSpec(
  description: string,
  hints?: {
    name?: string
    itemType?: string
    baseWeapon?: string
    baseArmor?: string
    consumableType?: string
    rarity?: string
    attunement?: string
    charges?: number | null
    recharge?: string | null
  }
): Promise<string> {
  const client = getClient()
  const hintLines = hints ? [
    hints.name        ? `- Name hint: "${hints.name}"` : '',
    hints.itemType    ? `- Item type: ${hints.itemType}` : '',
    hints.baseWeapon  ? `- Base weapon: ${hints.baseWeapon}` : '',
    hints.baseArmor   ? `- Base armor: ${hints.baseArmor}` : '',
    hints.consumableType ? `- Consumable type: ${hints.consumableType}` : '',
    hints.rarity      ? `- Rarity: ${hints.rarity}` : '',
    hints.attunement  ? `- Attunement: ${hints.attunement}` : '',
    hints.charges != null ? `- Charges: ${hints.charges}` : '',
    hints.recharge    ? `- Recharge: ${hints.recharge}` : '',
  ].filter(Boolean).join('\n') : ''

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a D&D 5e magic item designer. Generate a magic item specification as a single JSON object. No markdown fences, no commentary — raw JSON only.

SCHEMA (include all fields; use null for unused optional fields):
{
  "name": string,
  "itemType": "weapon" | "armor" | "wondrous" | "consumable",
  "rarity": "" | "common" | "uncommon" | "rare" | "veryRare" | "legendary" | "artifact",
  "attunement": "" | "optional" | "required",
  "description": string,

  "features": [{"name": string, "description": string, "recharge": string | null}] | null,

  "baseWeapon": string | null,
  "attackBonus": number | null,
  "extraDamageParts": [{"number": number, "denomination": number, "types": [string]}] | null,

  "baseArmor": string | null,
  "magicalBonus": number | null,

  "consumableType": string | null,
  "healingFormula": {"number": number, "denomination": number, "bonus": string} | null,

  "charges": number | null,
  "recharge": "dawn" | "dusk" | "lr" | "sr" | "formula" | null,
  "rechargeFormula": string | null,

  "extraProperties": string[]
}

RULES:
- rarity: use "veryRare" (camelCase) not "very rare"
- attunement: "required" for rare+ magic weapons/armor, "optional" for utility wondrous items, "" for common/simple
- Do NOT include "mgc" in extraProperties — it is added automatically
- attackBonus: 0 if no attack bonus, 1/2/3 for +1/+2/+3 weapons
- extraDamageParts: [] if no extra damage
- description: 1–2 sentences of flavor text only, as a plain HTML <p> tag. Do NOT put named features here.
- features: array of named item features/properties. Each entry has "name" (the feature title), "description" (full mechanical text), and "recharge" ("sr", "lr", "5-6", or null). Use this for every named feature like "Soul Reaper", "Harvest Essence", etc. Null if the item has no named features.
- charges/recharge: set on the top-level item if ANY feature recharges — use the most frequent recharge type. Individual feature recharge labels go in features[].recharge.
- baseWeapon must be one of: longsword, shortsword, greatsword, greataxe, handaxe, dagger, rapier, mace, quarterstaff, warhammer, battleaxe, spear, flail, glaive, halberd, maul, whip, longbow, shortbow, handcrossbow, heavycrossbow, lighthammer, trident
- baseArmor must be one of: leather, studdedleather, hide, chainshirt, scalemail, breastplate, halfplate, ringmail, chainmail, splint, plate, shield
- healingFormula: only for healing potions/items; null otherwise
- charges: null for passive unlimited-use items
- extraProperties: additional Foundry weapon property codes beyond what the base weapon already has. Use ONLY these codes: fin (finesse), lgt (light), hvy (heavy), rch (reach), thr (thrown), ver (versatile), two (two-handed), amm (ammunition), lod (loading), sil (silvered), ada (adamantine), ret (returning), spc (special). Do NOT repeat codes already on the base weapon.

${hintLines ? `USER HINTS (respect these unless they conflict with good design):\n${hintLines}\n` : ''}
ITEM DESCRIPTION:
${description.trim()}`,
    }],
  })

  return (msg.content[0] as any).text?.trim() ?? ''
}

// Generate a subclass specification as structured JSON
export async function generateSubclassSpec(description: string, classIdentifier?: string): Promise<string> {
  const client = getClient()
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are a D&D 5e subclass designer (2024 ruleset). Generate a subclass specification as a single JSON object. No markdown fences, no commentary — raw JSON only.

SCHEMA:
{
  "name": string,
  "classIdentifier": string,
  "description": string,
  "features": [
    {
      "level": number,
      "name": string,
      "description": string,
      "recharge": "" | "sr" | "lr" | "5-6" | "4-6" | "6"
    }
  ],
  "domainSpells": [
    { "level": number, "spells": string }
  ]
}

RULES:
- classIdentifier: lowercase slug of the parent class (e.g. "cleric", "fighter", "warlock")${classIdentifier ? `\n- Use classIdentifier: "${classIdentifier}"` : ''}
- description: 2-3 sentences of flavor text only (no mechanical rules)
- features: one entry per named subclass feature; level = cleric/class level when gained (e.g. 1, 2, 6, 10, 14 for a Cleric domain)
- recharge: "" for passive features, "lr" for long rest, "sr" for short rest, "5-6" for recharge 5-6
- description in each feature: full mechanical text, complete and precise — include all numbers, dice, and conditions
- domainSpells: only for Cleric/Druid/Paladin subclasses that grant always-prepared spells; empty array otherwise
  - level = cleric level when unlocked (1, 3, 5, 7, 9); spells = comma-separated spell names
- Include ALL features from the description, preserving exact mechanics

SUBCLASS DESCRIPTION:
${description.trim()}`,
    }],
  })
  return (msg.content[0] as any).text?.trim() ?? ''
}

// Generate a poetic sky description for the current night in any fantasy world
export async function generateSkyDescription(
  worldName: string,
  moonDescriptions: string[],   // e.g. ["Luna: Full Moon (100% lit)", "Selene: Waxing Crescent (40% lit)"]
  eventDescriptions: string[]   // e.g. ["Luna & Selene Conjunction", "Luna — Full Moon"]
): Promise<string> {
  const client = getClient()

  const moonList  = moonDescriptions.join('\n')
  const eventList = eventDescriptions.length ? eventDescriptions.join(', ') : 'none'

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `You are a fantasy world narrator. Write a vivid, atmospheric 2–3 sentence description of the night sky in the world of ${worldName}, as a DM might read aloud to their players.

Current sky:
${moonList}

Tonight's celestial events: ${eventList}

Rules:
- Evocative, immersive prose — describe what the characters actually SEE
- Weave in the moon phases, colors, and any events naturally
- Match tone to events: a full moon feels sacred or eerie; a conjunction feels portentous; an eclipse feels dramatic
- No game mechanics, no brackets, no meta-language
- Output only the sky description — no title, no preamble`,
    }],
  })

  return (msg.content[0] as any).text?.trim() ?? ''
}

// Generate a species/race spec from a plain-language description
export async function generateSpeciesSpec(description: string): Promise<string> {
  const client = getClient()
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are a D&D 5e species designer (2024 ruleset). Generate a species specification as a single JSON object. No markdown fences, no commentary — raw JSON only.

SCHEMA:
{
  "name": string,
  "size": "tiny" | "sm" | "med" | "lg" | "huge",
  "speed": number,
  "flySpeed": number,
  "swimSpeed": number,
  "climbSpeed": number,
  "darkvision": number,
  "resistances": string,
  "conditionImmunities": string,
  "languages": string,
  "asiNote": string,
  "traits": [
    { "name": string, "description": string }
  ]
}

RULES:
- size: lowercase slug — "tiny", "sm", "med", "lg", "huge"
- speed/flySpeed/swimSpeed/climbSpeed: integer feet, 0 if not applicable
- darkvision: integer feet, 0 if none
- resistances: comma-separated damage types (e.g. "poison, fire") or "" if none
- conditionImmunities: comma-separated condition names (e.g. "charmed, frightened") or "" if none
- languages: comma-separated (e.g. "Common, Elvish")
- asiNote: short sentence describing ability score increases in 2024 format (e.g. "Increase one ability score by 2 and another by 1, or increase three different scores by 1 each.")
- traits: one entry per named racial feature; description = full mechanical text including all numbers, dice, and conditions
- Do NOT include Darkvision as a trait if darkvision > 0 — it is handled automatically by the darkvision field
- Do NOT include ASI or speed as a trait — those are handled by dedicated fields

SPECIES DESCRIPTION:
${description.trim()}`,
    }],
  })
  return (msg.content[0] as any).text?.trim() ?? ''
}

// Extract a plain-text stat block from a URL (fetches page text, sends to Claude)
export async function extractStatBlockFromUrl(url: string): Promise<string> {
  const client = getClient();

  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const pageRes  = await fetch(proxyUrl);
  if (!pageRes.ok) throw new Error('Could not fetch the page — check the URL and try again.');
  const { contents } = await pageRes.json();
  const plainText = contents.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Extract the D&D 5e stat block from the following page content. Return ONLY the raw stat block text, preserving all numbers, ability scores, actions, and section headers. Do not add commentary or markdown.\n\n${plainText.slice(0, 12000)}`,
    }],
  });

  return (msg.content[0] as any).text?.trim() ?? '';
}
