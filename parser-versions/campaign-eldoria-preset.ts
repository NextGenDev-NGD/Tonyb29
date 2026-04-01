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
