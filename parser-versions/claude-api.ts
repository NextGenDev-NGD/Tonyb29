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
export async function generateStatBlockFromName(name: string, source: string): Promise<string> {
  const client = getClient();
  const sourceHint = source !== 'any' ? ` from ${source}` : '';

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Generate the complete D&D 5e stat block for "${name}"${sourceHint}. Output ONLY the raw stat block text in standard format — name, size/type/alignment, Armor Class, Hit Points, Speed, ability scores, saving throws (if any), skills (if any), damage immunities/resistances/vulnerabilities (if any), senses, languages, Challenge rating, traits, actions, bonus actions (if any), reactions (if any), legendary actions (if any). Do not use markdown, bullet points, or any formatting beyond standard stat block plain text. Do not add any commentary before or after.`,
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
