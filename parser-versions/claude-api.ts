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
