# D&D Stat Block Parser

A browser-based tool that converts D&D 5e stat block text into structured JSON for import into Foundry VTT, plus a custom homebrew Class Importer.

**Current version:** v4.1-alpha (Phase 10 — FGU Export Complete)
**Primary target:** Foundry VTT + dnd5e system v4.0+ / v5.x
**Scope:** D&D 5e only — intentionally single-system
**Status:** Active development

---

## What It Does

### Tab 1 — Stat Block Parser
Paste any D&D 5e stat block (2014 or 2024 Monster Manual format, ChatGPT/alternate formats) and the parser produces a ready-to-import Foundry Actor JSON — plus a Fantasy Grounds Unity XML export. Actions, spells, traits, legendary actions, resistances, senses, and more are all extracted and mapped to the correct schema automatically.

### Tab 2 — Class Importer
Fill in a structured class template (header block + level progression + feature definitions) and the tool builds a self-contained Foundry macro. Run the macro, then drag the class onto your character sheet — features are auto-granted at the correct levels via ItemGrant advancements with real Foundry UUIDs.

### Tab 3 — JSON Validator
Side-by-side JSON diff tool for comparing parser output against a reference export. Dev tooling.

---

## Current Feature Set

### Core Stat Block Parsing
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
- Action name guard — prevents flavor-text sentences from creating phantom actions

### Spellcasting
- 2014 slot-based: level lists with slot counts, full `system.spells` slot tracking
- 2014 innate: At Will / N/Day frequency lists, `consumption.spellSlot:false`
- 2024 frequency-based: Spellcasting as an action, At Will / N/Day tiers
- Dual spellcasting — creatures with both Spellcasting and Innate Spellcasting traits
- ~160 common SRD spells auto-resolved for school and level via `SPELL_META` lookup

### Format Support
- **2014 Monster Manual** — full support
- **2024 Monster Manual** — full support (combined immunity lines, frequency spellcasting, initiative field, new legendary format)
- **ChatGPT / alternate formats** — colon separator, condensed `(WIS, spell DC 13)` spellcasting, shorthand attacks
- **Sidekick format** (Tasha's Cauldron of Everything) — NPC actor snapshot at detected level; character advancement XP; SR/LR recovery; bullet-point actions

### Class Importer (Phase 9)
- Structured template input: class header, level progression table, Feature/Uses/Description blocks, Subclass blocks
- Builds: class item, all feature items, subclass items with per-subclass ItemGrant advancements
- Generates a self-contained Foundry macro with UUID resolution — no manual linking
- Advancements: HitPoints, ItemGrant, AbilityScoreImprovement, Trait (saves/skills/armor/weapons), ScaleValue, Subclass
- Folder structure: macro creates `ClassName/` + `ClassName/Features/` in Foundry Items panel
- Scale References panel: ready-to-copy `@scale.class.identifier` strings for all scale values
- dnd5e 5.x schema: `hd.denomination` as string, correct `spellcasting.preparation`, `ItemGrant.spell = null`

### Fantasy Grounds Unity Export (Phase 10)
- Amber-colored XML panel below the Foundry JSON section
- Schema matches real FGU 2024 format — `<npc>`, `<id-00001>` numbered entries, correct ability structure
- Download XML / Copy XML buttons
- **Tested and confirmed importing into Fantasy Grounds Unity**

### UI
- Parse analytics with accuracy score — required fields: name, size, type, alignment, AC, HP, speed, abilities, CR, traits, actions, passive perception
- Optional fields (saves, skills, senses, languages, spellcasting, etc.) shown as n/a when absent, excluded from score
- Field editor — manually correct any parsed field before export
- Item preview panel — action type, attack details, save DC, damage, recovery badges
- Download JSON / Copy JSON / Download XML / Copy XML buttons
- Load Example button (Class Importer) — fills full Technomancer homebrew template

---

## Roadmap

### Phase 9 — Custom Class Importer ✅ Complete
All sprints complete. Remaining stretch item: tool proficiency support (low priority).

### Phase 10 — Multi-VTT Export 🚧 In Progress
One parse, multiple outputs:

| Target | Status |
|---|---|
| Foundry VTT | ✅ Complete (current output) |
| Fantasy Grounds Unity 2024 | ✅ Complete — tested import |
| Fantasy Grounds Legacy / MotM | Pending — need export samples for schema comparison |
| Roll20 | Pending — requires Pro subscription (ImportStats API) |

### Phase 11 — Batch Processing
- Multi-creature input — paste a full bestiary page, get one JSON per creature
- Auto-split on creature name headers
- Bulk download as ZIP

### Phase 12 — PDF Import & OCR
- PDF upload → text extraction (pdf.js or server-side)
- OCR fallback for scanned PDFs (Tesseract.js)
- Column-layout detection for two-column Monster Manual pages

### Phase 13 — AI-Enhanced Parsing + URL Import
- Claude API fallback for ambiguous or non-standard stat blocks
- URL import from D&D Beyond, Roll20

---

## Project Structure

```
/
├── src/
│   └── App.tsx                      # Tab host (parser + class importer + validator)
├── parser-versions/
│   ├── dnd-parser-v20-stable.tsx    # Stat block parser (v4.1+)
│   ├── class-importer.tsx           # Class Importer (Phase 9)
│   └── fantasy-grounds-exporter.ts  # FGU XML formatter (Phase 10)
├── validaton-scripts/
│   └── json-validator.tsx           # Side-by-side JSON diff validator
├── test-cases/
│   └── reference/                   # Foundry export reference files (gitignored)
├── docs/
│   ├── project-overview-phase9.md   # Phase 9 planning & sprint log
│   ├── phase6-gap-analysis.md       # Phase 6 obstacle log
│   ├── phase7-gap-analysis.md       # Phase 7 obstacle log
│   └── version-history-v16.md      # Full version history
└── README.md
```

---

## Development

```bash
npm install
nohup npm run dev > /tmp/vite-fresh.log 2>&1 &   # Keeps server alive
```

Access from Windows browser: `http://172.26.183.195:3000` (WSL2 network IP)

> **WSL2 note:** HMR is unreliable on `/mnt/c/` paths. Kill and restart Vite after every change. `vite.config.ts` sets `host: '0.0.0.0'` so the server is reachable from Windows.

Commit: `./save.sh`

---

## Known Limitations

- Spell descriptions are empty — items created by name only; link to compendium manually in Foundry
- Spells not in `SPELL_META` will have blank school and level 0 with a named warning
- Sidekick output is an NPC snapshot at detected level (full PC leveling sheet not supported)
- SR/LR recovery stored correctly in JSON; NPC sheet rest button visibility depends on Foundry config
- FGU export targets 2024 format only — Legacy and Monsters of the Multiverse format support pending
- Activity support for damage rolls in Class Importer is manual (add via Foundry Activities tab; @scale refs provided in UI)
- Batch, OCR, and AI parsing planned for Phases 11–13
