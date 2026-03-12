# D&D 5e Stat Block to Foundry VTT Converter

Convert D&D 5th Edition stat blocks into Foundry VTT-compatible JSON files with a single click.

![Version](https://img.shields.io/badge/version-3.0--alpha-blue)
![Foundry](https://img.shields.io/badge/Foundry-v13%2B-orange)
![D&D5e](https://img.shields.io/badge/dnd5e-v4.0%2B-blue)
![Status](https://img.shields.io/badge/status-alpha-yellow)

---

## What's New in v3.0-alpha (Phase 8)

**Sidekick NPC Support + Colon Format Compatibility**
- ✅ Tasha's Companion sidekick parsing — outputs as Foundry NPC actor
- ✅ Level-based proficiency, `cr:0`, character advancement XP for sidekicks
- ✅ `SPELLCASTER_SIDEKICK_SLOTS` table (TCoE levels 1–20, up to 5th slot)
- ✅ Colon format support — handles ChatGPT-generated stat blocks (`Action Name: desc`)
- ✅ `detectFormat` / `parseSidekickLevel` for "Level: NPC 3" format
- ✅ Spell list parsing handles "Prepared (typical):" key correctly
- ✅ Spellcasting ability from condensed `(WIS, spell DC 13)` format
- ✅ Shorthand attack fallback: `"+2 to hit, 1d6 bludgeoning"` detection

---

## Quick Start

1. **Paste** your D&D stat block
2. **Click** "Parse Stat Block"
3. **Download** or **Copy** the JSON
4. **Import** into Foundry VTT

---

## Features

### ✅ Complete Feature Set (v3.0-alpha)

#### Basic Statistics (Phase 5)
- Name, Size, Type, Alignment, Initiative
- Armor Class (with armor type)
- Hit Points (with dice formula)
- Movement speeds — walk, climb, fly, swim, burrow
- All 6 ability scores (standard, parenthetical, D&D Beyond table format)
- Saving throws with proficiency detection
- All 18 skills with proficiency/expertise detection
- Senses (darkvision, blindsight, tremorsense, truesight — parsed into structured ranges)
- Languages

#### Actions & Features (Phase 6)
- Actions section — attacks with full roll/damage/reach/range
- Multiattack parsing
- Special Traits (passive features)
- Reactions
- Bonus actions
- Legendary actions with action cost
- Legendary resistance
- Lair actions
- Damage resistances, immunities, vulnerabilities
- Condition immunities

#### Spellcasting (Phase 7)
- Full spellcasting block — prepared slots by level
- Innate spellcasting — X/day entries with uses
- At-will spells
- Spell items with correct Foundry `method` / `prepared` flags
- `consumption.spellSlot: false` for innate/at-will activities
- Spell slot overrides for NPC actors
- Caster level on actor

#### Sidekick Support (Phase 8)
- Sidekick NPC output (not PC actor — correct for Foundry dnd5e v4)
- Level-based proficiency bonus
- `SPELLCASTER_SIDEKICK_SLOTS` table for spellcaster sidekick slot counts
- CR 0, character advancement XP, type "humanoid"
- Colon format detection (ChatGPT output, period OR colon as entry separator)

#### Infrastructure
- `makeItemId` / `makeActId` — djb2 hash, always 16 chars (stable IDs)
- `SECSTOP` shared lookahead boundary
- `parseSection` generic section concatenation
- `extractSpellLists` position-based header slicer
- `parseDiceFormula` → Foundry DamageField structure
- JSON Validator tab for structural testing

---

## Input Format Support

| Format | Support |
|--------|---------|
| Standard MM/sourcebook | ✅ Full |
| D&D Beyond copy-paste | ✅ Full |
| Period-separator (`Name. Desc.`) | ✅ Full |
| Colon-separator (`Name: Desc.`) | ✅ Full (Phase 8) |
| "Level: NPC 3" sidekick header | ✅ Full (Phase 8) |
| Condensed spellcasting `(WIS, DC 13)` | ✅ Full (Phase 8) |

---

## Export Format

Outputs Foundry VTT dnd5e v4.0+ NPC actor JSON:
- Actor `type: "npc"` with full `system` block
- Items array — weapon/feat/spell items with activities
- Spell slots as `system.spells.spellN: { value, override }`
- Resources: `legact`, `legres`, `lair` in current v4 shape
- Senses as `{ ranges: { darkvision, ... }, units: null, special }`
- XP via `crToXP` lookup

---

## Tabs

| Tab | Purpose | Status |
|-----|---------|--------|
| Parser | Main stat block → Foundry JSON converter | ✅ Active |
| JSON Validator | Compare parser output against reference JSON | ✅ Active |
| Custom Class Importer | Class definition text → Foundry class + feature bundle | 📋 Phase 9 |

---

## Installation

```bash
git clone <repo>
npm install
npm run dev
```

Open `http://localhost:3000`

> WSL2 note: Kill and restart dev server after changes — HMR unreliable on `/mnt/c/`.

---

## Technical Details

- **Main file:** `parser-versions/dnd-parser-v20-stable.tsx`
- **Framework:** React (functional components)
- **Styling:** Tailwind CSS
- **Processing:** Client-side only
- **Foundry compatibility:** dnd5e v4.0+ (v13+ Foundry)

---

## Roadmap

### ✅ Phase 5 — Basic Stats (Complete)
- All core stat block fields, skills, saves, senses

### ✅ Phase 6 — Actions & Features (Complete)
- Actions, attacks, traits, legendary, reactions, damage types

### ✅ Phase 7 — Spellcasting (Complete)
- Prepared/innate/at-will spells, spell slots, lair actions

### ✅ Phase 8 — Sidekick + Format Compatibility (Complete)
- Sidekick NPC output, colon format, condensed spellcasting

### 📋 Phase 9 — Custom Class Importer
- Parse structured class definition text → Foundry class item + subclass + all feature items bundle
- 3rd tab in app (replaces JSON Validator tab in final push)
- Some input structure required; primary test case: Technomancer homebrew

### 📋 Phase 10 — Multi-VTT Export
- Roll20, Fantasy Grounds, PF2e alongside Foundry dnd5e
- UUID/ID system is VTT-specific — requires per-target research (djb2 16-char is Foundry-only)
- Designed before batch/OCR to avoid rebuilding exports twice

### 📋 Phase 11 — Batch Processing
- Parse multiple stat blocks in a single session
- Bulk download as zip or individual files
- Depends on stable single-parse + multi-VTT output pipeline

### 📋 Phase 12 — OCR
- Screenshot or image of a stat block → parsed output
- Depends on stable single-parse pipeline

### 📋 Phase 13 — AI-Enhanced Parsing + URL Import
- Claude API fallback for complex/ambiguous stat blocks regex can't handle
- URL import: paste a D&D Beyond or Roll20 URL, fetch and parse directly
- Capstone features — depend on everything else being solid

---

## Known Limitations

- Single stat block per parse (no batch — Phase 11)
- Foundry dnd5e only (multi-VTT — Phase 10)
- PC actor output removed (sidekicks use NPC actor per Foundry dnd5e v4 design)
- Some exotic multiattack conditionals may need manual review in Foundry

---

## Version History

| Version | Phase | Key Feature |
|---------|-------|-------------|
| v1.0–1.6 | 5 | Basic stats, skills, saves |
| v2.0 | 6 | Actions, attacks, traits, legendary |
| v3.0 | 7 | Spellcasting, spell slots, innate |
| v3.0-alpha | 8 | Sidekick NPC, colon format |

See `archived/version-history-md.md` for complete changelog.

---

## License & Attribution

- **React** — MIT License
- **Tailwind CSS** — MIT License
- **Lucide React** — ISC License
- D&D 5th Edition © Wizards of the Coast — for personal, non-commercial use
- Foundry VTT dnd5e system — referenced for JSON structure

---

**Project Status:** Active Development | **Phase 8 Complete** | **Phase 9 Planned**
**Last Updated:** 2026-03-12
