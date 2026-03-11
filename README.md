# D&D Stat Block Parser

A browser-based tool that converts D&D 5e stat block text into structured JSON for import into Virtual Tabletop (VTT) platforms.

**Current version:** v3.0-alpha (Phase 7)
**Primary target:** Foundry VTT + dnd5e system v4.0+
**Status:** Active development

---

## What It Does

Paste any D&D 5e stat block (2014 or 2024 Monster Manual format) and the parser produces a ready-to-import JSON actor file. Actions, spells, traits, legendary actions, resistances, senses, and more are all extracted and mapped to the correct Foundry schema automatically.

---

## Current Feature Set (v3.0-alpha)

### Core Parsing
- Name, size, type, alignment, AC, HP (with formula), speed (all movement types)
- Ability scores — standard column layout, modifier-column layout, comma-separated
- Saving throws — colon optional, line-anchored (won't false-match mid-sentence)
- Skills, senses (darkvision/blindsight/tremorsense/truesight), languages, initiative
- Challenge rating + XP (CR table), proficiency bonus (derived from CR or explicit PB field)

### Damage & Condition Fields
- Damage resistances, immunities, vulnerabilities — 2014 and 2024 formats
- Condition immunities — 2014 separate line and 2024 combined `Immunities:` line
- Conditional resistances (nonmagical/silvered/adamantine) routed to `custom` field

### Items & Actions (Foundry dnd5e v4.0+ Activities system)
- Melee/ranged weapon attacks → `type:'weapon'` + `attack` activity (ability inferred)
- Saving throw abilities → `type:'feat'` + `save` activity
- Utility/multiattack → `type:'feat'` + `utility` activity
- Traits, reactions, bonus actions, legendary actions, lair actions
- Combat recharge (`Recharge 5-6`), short rest, long rest, N/Day recovery
- Action name guard — prevents flavor-text sentences from creating phantom actions (4-word cap, ≥15 char description, sentence-starter filter)

### Spellcasting
- 2014 slot-based: level lists with slot counts, full `system.spells` slot tracking
- 2014 innate: At Will / N/Day frequency lists, `consumption.spellSlot:false`
- 2024 frequency-based: Spellcasting as an action, At Will / N/Day tiers
- Dual spellcasting — creatures with both Spellcasting and Innate Spellcasting traits
- ~160 common SRD spells auto-resolved for school and level via `SPELL_META` lookup

### Format Support
- **2014 Monster Manual** — full support
- **2024 Monster Manual** — full support (combined immunity lines, frequency spellcasting, initiative field, new legendary format)
- **Sidekick format** (Tasha's Cauldron of Everything) — NPC actor snapshot at detected level; character advancement XP; bullet-point actions; Features section; SR/LR recovery

### UI
- Parse analytics with accuracy score (optional absent fields excluded)
- Field editor — manually correct any parsed field before export
- Item preview panel — action type, attack details, save DC, damage, recovery badges
- Download JSON / Copy JSON buttons

---

## Roadmap

### Phase 8 — Sidekick PC Sheet
Sidekicks leveling with the party need `type:'character'` (PC actor), not `type:'npc'`. NPC sheets lack level progression, ASI choices, class feature unlocks, and the full SR/LR rest workflow.

- PC actor JSON schema from Foundry character sheet export
- `type:'character'` output branch for sidekick format
- `system.classes`, `system.details.level`, XP threshold tracking

### Phase 9 — System-Agnostic Multi-VTT Export
The parser core is already VTT-agnostic internally. Phase 9 adds a translation layer and surfaces it as 4 export buttons:

| Button | Target |
|---|---|
| Foundry VTT | dnd5e system v4.0+ (current output) |
| Roll20 | 5e Shaped / OGL character sheet JSON |
| Fantasy Grounds | FGU XML actor format |
| Generic JSON | System-agnostic structured output |

One parse, four outputs. The UI shows 4 download buttons at the bottom.

### Phase 10 — Batch Processing
- Multi-creature input — paste a full bestiary page, get one JSON per creature
- Auto-split on creature name headers
- Bulk download as ZIP

### Phase 11 — PDF Import & OCR
- PDF upload → text extraction (pdf.js or server-side)
- OCR fallback for scanned PDFs (Tesseract.js)
- Column-layout detection for two-column Monster Manual pages
- Pre-processing pipeline: deskew → OCR → boundary detection → parse

---

## Project Structure

```
/
├── src/
│   └── App.tsx                      # Tab host (parser + validator tabs)
├── parser-versions/
│   └── dnd-parser-v20-stable.tsx    # Active parser (v3.0-alpha)
├── validaton-scripts/
│   └── json-validator.tsx           # Side-by-side JSON diff validator
├── test-cases/
│   └── reference/                   # Foundry export reference files
│       └── pc-sheet-reference.json  # PC actor export — Phase 8 reference
├── docs/
│   ├── phase6-gap-analysis.md       # Phase 6 planning & obstacle log
│   ├── phase7-gap-analysis.md       # Phase 7 planning & obstacle log
│   └── version-history-v16.md      # Full version history
└── README.md
```

---

## Development

```bash
npm install
npm run dev     # Vite dev server on port 3000
```

> **WSL2 note:** HMR is unreliable on `/mnt/c/` paths. Kill and restart Vite after every change.

Commit: `./save.sh`

---

## Known Limitations (v3.0-alpha)

- Spell descriptions are empty — items created by name only; link to compendium manually in Foundry
- Spells not in `SPELL_META` will have blank school and level 0 with a named warning
- Sidekick leveling requires a PC actor — current output is NPC snapshot at detected level (Phase 8)
- SR/LR recovery stored correctly in JSON; NPC sheet rest button visibility depends on Foundry config
- PDF / batch / OCR import planned for Phases 10–11
