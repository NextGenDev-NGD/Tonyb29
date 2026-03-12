# Session Handoff — Phase 8 Complete

**Date:** 2026-03-12
**Version:** v3.0-alpha
**Status:** Phase 8 Complete ✅ → Phase 9 Planned 📋

---

## What Was Accomplished in Phase 8

### Sidekick NPC Support
- Research confirmed: Foundry dnd5e v4 sidekick classes go on **NPC actors** (not character)
- TCoE Foundry module provides the class items; users drag onto NPC sheet after import
- Removed `makeClassItem` and the entire PC branch from the parser
- Added `SPELLCASTER_SIDEKICK_SLOTS` table (Tasha's CoE levels 1–20, max 5th slot)
- Sidekick NPC actor tweaks:
  - `cr: 0`
  - Character advancement XP (not CR-based)
  - Level-based proficiency bonus
  - Type: "humanoid"
- `detectFormat` + `parseSidekickLevel` handle "Level: NPC 3" header style

### Colon Format Compatibility
- `ACTION_NAME_RX` now accepts `[.:]` — period OR colon as entry separator
- `FIELD_LABEL_RX` blacklists Skills/Saves/Cantrips/Prepared etc. from matching as action names
- `parseSection`, `parseActions`, `parseLegendaryCount` all handle optional colon after section headers
- `extractSpellLists`: "Prepared (typical):" → key `'prepared'` (fixed 1/Day bug from colon collision)
- Shorthand attack `"+2 to hit, 1d6 bludgeoning"` detected as fallback attack description
- Spellcasting ability from `(WIS, spell DC 13)` condensed format
- Saves regex: `(?:^|\n)\s*(?:Saving Throws?|Save):?\s+` — colon optional, line-anchored

---

## Current State

### Active File
`parser-versions/dnd-parser-v20-stable.tsx`

### Working Features (v3.0-alpha)
- ✅ All basic stats (Phase 5)
- ✅ Actions, traits, legendary, reactions, damage types (Phase 6)
- ✅ Spellcasting — prepared/innate/at-will, spell slots, lair actions (Phase 7)
- ✅ Sidekick NPC output (Phase 8)
- ✅ Colon format (ChatGPT stat blocks) (Phase 8)
- ✅ JSON Validator tab

### Known Limitations
- No batch processing (single stat block per parse)
- Some exotic multiattack conditionals may need manual Foundry review

---

## Foundry dnd5e v4.0+ Key Format Rules

These were validated through Phase 7–8 work:

- **Feat items**: `system.type: { value:'monster', subtype:'' }` — required for correct sheet tab
- **Spell items**: `method:'spell'/'innate'/'atwill'` + `prepared:1/2`
- **Innate/at-will**: `consumption.spellSlot: false` + `targets:[{type:'itemUses'...}]`
- **Spell slots**: `system.spells.spellN: { value:N, override:N }` — override MUST equal max for NPCs
- **Caster level**: `system.attributes.spell.level`
- **Resources**: `legact/legres: { max, spent }` (old `{ value, max, sr, lr, label }` is deprecated)
- **Lair**: `{ value:bool, initiative:null, inside:false }`
- **Senses**: `{ ranges:{darkvision,...}, units:null, special }` — 0 → null
- **XP**: `details.xp: { value: crToXP(cr) }` — required
- **Activity key** in object MUST equal `activity._id` — mismatch = silent failure
- No `_stats` field on actor (Foundry generates this post-import)

---

## Next Phase

### Phase 9 — Custom Class Importer
See `docs/project-overview-phase9.md` for full planning.

**Summary:** Parse class definition text (like a Technomancer homebrew) into a Foundry class item + all feature items as an importable JSON bundle. Same infrastructure as the stat block parser but reads class progression tables instead of stat blocks. Third tab in the existing app.

---

## Dev Workflow Reminders

- Dev server: `npm run dev` — always kill+restart after changes (WSL2 HMR unreliable on `/mnt/c/`)
- Commit: `./save.sh` — run from `/mnt/c/Users/halfa/Tonyb29`
- If `./save.sh` says "nothing to commit" run `git push` directly (wrong-dir bug)
- Test cases: `test-cases/**/*.json` — gitignored, local only
- JSON Validator: LEFT = Reference, RIGHT = Test. Don't compare against a Foundry export.

---

## Quick Resume Prompt

```
I'm resuming work on the D&D Stat Block Parser.
Current version: v3.0-alpha. Phase 8 is complete.
Active file: parser-versions/dnd-parser-v20-stable.tsx
Phase 9 planning doc: docs/project-overview-phase9.md

[Paste your task here]
```
