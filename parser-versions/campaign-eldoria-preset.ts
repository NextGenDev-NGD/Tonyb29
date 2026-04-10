// campaign-eldoria-preset.ts
// Thin wrapper — exports the Eldoria campaign as a CampaignPreset.
// All data lives in campaign-builder-data.ts; this file just packages it.
// Phase 15b: actual data can be moved here once the architecture is validated.

import {
  CampaignPreset,
  JOURNAL_FOLDERS,
  ACTOR_FOLDERS,
  NPCS,
  CREATURES,
  CONTINENTS,
  ALL_JOURNALS,
} from './campaign-builder-data'

// Minimal valid preset — used as the starting point for AI-generated or user-imported campaigns
export const BLANK_PRESET: CampaignPreset = {
  id: 'custom',
  name: 'My Campaign',
  description: 'Custom campaign — generated or imported',
  rootJournalFolderName: 'World Lore',
  creatureFolderName: 'Campaign Creatures',
  journalFolders: [
    { name: 'My Campaign',    type: 'JournalEntry', color: '#4a1d96' },
    { name: 'World Lore',     type: 'JournalEntry', parentName: 'My Campaign', color: '#1e3a5f' },
    { name: 'Factions',       type: 'JournalEntry', parentName: 'My Campaign', color: '#713f12' },
  ],
  actorFolders: [
    { name: 'Campaign NPCs',      type: 'Actor', color: '#4a1d96' },
    { name: 'Campaign Creatures', type: 'Actor', color: '#7f1d1d' },
  ],
  npcs: [],
  creatures: [],
  continents: [],
  journals: [],
}

export const ELDORIA_PRESET: CampaignPreset = {
  id: 'eldoria',
  name: 'Eldoria: Echoes of the Aether',
  description: 'D&D 5e homebrew · 7 Continents · 28 NPC Leaders',
  rootJournalFolderName: 'World Lore',
  creatureFolderName: 'Eldoria — Creatures',
  journalFolders: JOURNAL_FOLDERS,
  actorFolders: ACTOR_FOLDERS,
  npcs: NPCS,
  creatures: CREATURES,
  continents: CONTINENTS,
  journals: ALL_JOURNALS,
}
