# Version History

---

## v3.0-alpha — Phase 8: Sidekick + Format Compatibility
**Date:** 2026-03-11
**Status:** Current (Alpha)

### New Features
- **Sidekick NPC output** — Tasha's Companion sidekicks parse as Foundry NPC actors (not PC)
  - Level-based proficiency bonus
  - `cr: 0`, character advancement XP, type "humanoid"
  - `SPELLCASTER_SIDEKICK_SLOTS` table (TCoE levels 1–20, up to 5th slot)
- **Colon format support** — ChatGPT-generated stat blocks with `Name: desc` entries
  - `ACTION_NAME_RX` accepts `[.:]` — period OR colon as entry separator
  - `FIELD_LABEL_RX` blacklists Skills/Saves/Cantrips/Prepared etc. from matching as action names
  - `parseSection`/`parseActions`/`parseLegendaryCount` handle optional colon after section headers
- **Condensed spellcasting** — `(WIS, spell DC 13)` format extraction
- **Shorthand attack fallback** — `"+2 to hit, 1d6 bludgeoning"` detected as attack description
- **Spell list key fix** — "Prepared (typical):" → key `'prepared'` (was producing 1/Day bug)
- **Format detection** — `detectFormat`/`parseSidekickLevel` handle "Level: NPC 3" header

### Removed
- `makeClassItem` function removed
- PC actor branch removed entirely (sidekicks go on NPC actors per Foundry dnd5e v4 design)

---

## v3.0 — Phase 7: Spellcasting
**Date:** 2026-02 (approx)
**Status:** Superseded by v3.0-alpha

### New Features
- Full spellcasting block parsing — prepared spells by slot level
- Innate spellcasting — X/day entries with uses tracking
- At-will spell support
- Spell items with Foundry `method: 'spell'/'innate'/'atwill'` + `prepared: 1/2`
- `consumption.spellSlot: false` + `targets:[{type:'itemUses'...}]` for innate/at-will activities
- Spell slot overrides: `system.spells.spellN: { value: N, override: N }` (override = max for NPCs)
- Caster level: `system.attributes.spell.level`
- Lair actions section parsed
- `extractSpellLists` position-based header slicer for single-line spell strings
- `parseSpellcasting` finds block in traits or actions section
- PC sheet reference work (later scrapped — sidekicks confirmed NPC-only)

### Infrastructure
- `makeSpellItem(name, level, mode, uses, actorName, prefix)` — spell item builder
- `parseSaveInfo(desc)` — save DC/ability extraction from action descriptions
- Activity key must equal `activity._id` (mismatch causes silent Foundry failures)

---

## v2.0 — Phase 6: Actions & Features
**Date:** 2026-01 (approx)
**Status:** Superseded

### New Features
- Actions section parsing — name + full description
- Attack rolls: `+X to hit`, reach, range, target count
- Damage formulas: `XdY + Z`, damage type, additional damage (`plus 2d10 lightning`)
- Multiattack detection
- Special Traits section (passive features)
- Reactions section
- Bonus actions
- Legendary Actions with cost (1–3 actions)
- Legendary Resistance
- Lair actions
- Damage resistances, immunities, vulnerabilities
- Condition immunities
- Actions output as Foundry feat/weapon items
- `makeSimpleItem(a, actorName, actType, cost, prefix)` — feat item builder
- `parseDiceFormula(s)` → Foundry DamageField

### Infrastructure
- `SECSTOP` — shared lookahead boundary for all field regexes
- `parseSection(text, headerRx)` — generic section parser
- `makeItemId(prefix, actorName, itemName)` / `makeActId()` — djb2 hash, always 16 chars
- Resources: `legact/legres: { max, spent }` (replaced deprecated `{ value, max, sr, lr, label }`)
- Lair resource: `{ value: bool, initiative: null, inside: false }`

---

## v1.6 — Phase 5 Stable
**Date:** December 18, 2025
**Status:** Superseded

### Features (Phase 5 Complete)
- All basic statistics: name, size, type, alignment
- Armor Class with armor type
- Hit Points with dice formula
- Movement speeds: walk, climb, fly, swim, burrow
- All 6 ability scores (standard, parenthetical, D&D Beyond split table)
- Challenge Rating (any format including `CR 4 (XP 1,100; PB +2)`)
- Initiative bonus
- Saving throws with proficiency detection
- All 18 skills with proficiency/expertise detection
- Senses and languages
- Field editor for manual corrections
- D&D Beyond format compatibility
- Foundry VTT v3.3+ JSON export

---

## v1.5 — Skills Fixed
**Date:** December 17, 2024
**Status:** Superseded

- Complete code rewrite — clean, stable
- Skills properly structured with `bonuses: { check: '', passive: '' }`
- All 18 skills initialized with correct ability mappings
- Proficiency/expertise detection working

---

## v1.3 — Foundry VTT Compatible
**Date:** December 10, 2024
**Status:** Superseded

- Complete JSON structure overhaul for Foundry dnd5e v3.3+
- Speed parsing, language cleanup, size code mapping

---

## v1.0–1.2 — Foundation
**Date:** December 2024
**Status:** Deprecated

- v1.0: Parse analytics, basic stat block parsing
- v1.1: Field editor, exact/default badges
- v1.2: AC/HP formula parsing

---

## Phase 1–4 (Prototype)
**Date:** November–December 2024
**Status:** Historical

- Initial React component setup
- Proof of concept parsing
- Goblin.json compatibility testing
- First successful Foundry import
