# Version History

---

## Version 4.2-alpha — Phase 11 Batch Processing
**Release Date:** March 25, 2026
**Status:** Alpha — Active Development
**Phase:** Phase 11 — Batch Processing
**Files:** `parser-versions/batch-processor.tsx` (new), `parser-versions/dnd-parser-v20-stable.tsx` (refactored), `src/App.tsx`

### Major Changes

#### Batch Processor Tab (Phase 11)
- New `batch-processor.tsx`: processes multiple stat blocks in a single session
- Separator: paste blocks divided by `---` on its own line
- Results panel: each creature shows status icon (green/yellow/red), accuracy %, per-field default warnings, parse errors
- Defaulted fields shown per creature: "Used defaults for: ac, speed, alignment"
- Summary bar: counts of ok / warn / failed across all blocks
- **Copy Macro** (purple): copies self-contained Foundry macro to clipboard — actors embedded, paste and run, no file upload needed
- **Download Macro** (indigo): saves same script as `.js` file
- **JSON** (green): raw actor array download
- **FGU XML** (amber): batch FGU module file using `<npclist><id-XXXXX>` format (all creatures in one importable XML)
- Per-creature copy buttons: JSON or FGU XML for individual actors
- Macro uses `Actor.create(actors)` with embedded array — identical workflow to Class Importer

#### Parser Refactor — `parseStatBlock` extracted
- `parseStatBlock(text)` lifted out of the component to module-level named export
- Now returns `{ errors, warnings, stats, actor }` instead of calling state setters
- Component calls `runParse(text)` wrapper that sets state from return value
- Batch processor imports `parseStatBlock` directly — no duplication of parsing logic
- No behaviour change to single-parse tab

---

## Version 4.1-alpha — Phase 10 Sprint 1 + Parser Fixes
**Release Date:** March 20, 2026
**Status:** Alpha — Active Development
**Phase:** Phase 10 — Multi-VTT Export (Fantasy Grounds Unity complete)
**Files:** `parser-versions/fantasy-grounds-exporter.ts` (new), `parser-versions/dnd-parser-v20-stable.tsx`

### Major Changes

#### Fantasy Grounds Unity Export (Phase 10 Sprint 1)
- New `fantasy-grounds-exporter.ts`: converts Foundry actor JSON → FGU-compatible XML
- Schema reverse-engineered from real FGU export (2024 format)
- `<npc>` element with correct `<root version="5.1">` attributes
- Abilities: each has `<bonus>`, `<savemodifier>` (profBonus if proficient, else 0), `<score>`
- Actions/traits: `<id-00001>` numbered format with `<name>` + `<desc>` children
- Separate `<bonusactions>`, `<reactions>`, `<legendaryactions>`, `<lairactions>` sections
- `<senses>` combined text string with Passive Perception appended (e.g. "Darkvision 60 ft.; Passive Perception 12")
- `<damageimmunities>` combines DI + CI with `;` separator (FGU convention)
- `<hd>` for HP formula, `<skills>` as display text, `<initiative><misc>` nested
- All boilerplate summon/spellslots/locked fields included
- `<version type="string">2024</version>` at NPC level
- Wired into parser UI: amber-themed panel below Foundry JSON, Download XML + Copy XML buttons
- **Tested: Umber Hulk imported successfully into Fantasy Grounds Unity**
- Scope note added: tool is intentionally D&D 5e only — other game systems are separate projects

#### Parser Accuracy Scoring Fixes
- Ability score regex updated to handle Unicode minus `−` (U+2212) — fixes vertical stat block format (e.g. SRD web layouts)
- Implicit traits fallback: stat blocks with no "Traits" header (2014 SRD style) now parsed correctly — entries between Challenge line and Actions section captured automatically
- Passive perception: always tracked as required field; parsed from senses text or calculated from WIS mod + perception proficiency
- `saves`, `skills`, `senses`, `languages` moved to optional scoring — absent on many creatures and should not penalize score
- Required score fields now exactly: name, size, type, alignment, AC, HP, speed, abilities, CR, traits, actions, passive perception
- `subtype` was already optional — confirmed no change needed

#### WSL2 / Vite Stability
- `vite.config.ts` updated: `host: '0.0.0.0'` — server now accessible from Windows browser via WSL2 network IP (172.26.x.x:3000)
- `open: false` set to prevent auto-open attempts in headless WSL
- Use `nohup npm run dev` to keep server alive across terminal sessions

---

## Version 4.0-alpha — Phase 9 Sprint 4 Complete
**Release Date:** March 19, 2026
**Status:** Alpha — Active Development
**Phase:** Phase 9 — Custom Class Importer (Sprint 4 Complete)
**File:** `parser-versions/class-importer.tsx`, `parser-versions/dnd-parser-v20-stable.tsx`

### Major Changes

#### Class Importer — Third Tab (Sprints 1–4 Complete)
- New `class-importer.tsx` component: parses structured class template → Foundry bundle
- Input: header block (Class/HitDie/Saves/Armor/Weapons/Skills/Spellcasting/SubclassLevel/Subclasses), Scale: lines, Level N: progression, Feature:/Uses:/Description: blocks
- Output: bundle JSON array + self-contained Foundry macro (Item.create with UUID resolution)
- Import workflow: Build Class → Copy Macro → run in Foundry → drag class to character sheet

#### Sprint 4 Additions
- Subclass feature blocks: `Subclass: Name` sections parsed with per-subclass ItemGrant advancements
- ScaleValue fix: removed `distance: { units: '' }` from advScaleValue config (was silently dropped by dnd5e 5.x)
- Folder structure: macro creates `ClassName/` (class + subclasses) + `ClassName/Features/` subfolder
- Scale References UI panel: ready-to-copy `@scale.class.identifier` strings for all scale values
- Macro restructured to 6 steps: folder → features → subclasses (wired) → class item
- Feature list color-coded: green=class, purple=subclass, yellow=stub
- `Uses: @scale.class.id / lr` → `max: "@scale..."` in JSON → Foundry resolves dynamically
- Tested: Sacrier class (dandwiki) — 3 subclasses, pain dice/die/threshold ScaleValues confirmed

#### Self-Contained Macro (Sprint 3)
- Macro creates features + subclasses + class item in a single Foundry macro run
- ItemGrant advancements wire actual Foundry-assigned UUIDs (looked up after `Item.create`) — no UUID mismatch
- Features auto-granted when class is dragged onto character sheet and advancement flow runs

#### dnd5e 5.x Schema Fixes (Sprint 2)
- `hd.denomination` = string "d8" (not number)
- `spellcasting.preparation = { formula: '' }` (required field)
- `ItemGrant.spell = null`
- Subclass type used (not ItemChoice) for subclass advancement

#### Advancements Built
- HitPoints, ItemGrant, AbilityScoreImprovement, Trait (armor/weapons/saves/skills), ScaleValue, Subclass
- Feature items use `system.type.value:'class'`

---

## Version 3.1 — Phase 8 Complete
**Release Date:** March 12–15, 2026
**Status:** Stable
**Phase:** Phase 8 — Sidekick NPC Final + ChatGPT Format Support
**File:** `parser-versions/dnd-parser-v20-stable.tsx`

### Major Changes

#### ChatGPT / Alternate Format Support
- `ACTION_NAME_RX` accepts `[.:]` — period OR colon as entry separator
- `FIELD_LABEL_RX` blacklists Skills/Saves/Cantrips/Prepared etc. from matching as entries
- `extractSpellLists`: "Prepared (typical):" → key 'prepared' (was '1' → 1/Day bug)
- Shorthand attack `"+2 to hit, 1d6 bludgeoning"` detected as fallback
- Spellcasting ability from `(WIS, spell DC 13)` condensed format
- `detectFormat`/`parseSidekickLevel` handle "Level: NPC 3" format

#### Sidekick NPC (Final — PC branch scrapped)
- Research confirmed: Foundry dnd5e sidekick classes go on NPC actors (not character)
- TCoE Foundry module provides the class items; users drag onto NPC sheet
- `SPELLCASTER_SIDEKICK_SLOTS` table added (Tasha's CoE levels 1–20, max 5th slot)
- Sidekick NPC tweaks: `cr:0`, character advancement XP, level-based proficiency
- `makeClassItem` removed; PC branch removed entirely

---

## Version 3.0-alpha — Phase 7 Complete
**Release Date:** March 11, 2026
**Status:** Alpha — Active Development
**Phase:** Phase 7 — Spellcasting, Schema Fixes, Sidekick Format
**File:** `dnd-parser-v20-stable.tsx`

### Major Changes

#### Spellcasting Parser (Session 1)
- `parseSpellcasting(traits, actions)` — handles all three formats:
  - 2014 slot-based: level lists (`Cantrips:`, `1st level (4 slots):`) → `system.spells` slot tracking
  - 2014 innate: `Innate Spellcasting.` trait with At Will / N/Day frequency lists
  - 2024 frequency: `Spellcasting.` action with At Will / N/Day tiers
- `makeSpellItem()` — `type:'spell'`, correct `method`/`prepared`/`consumption` fields
- `extractSpellLists()` — position-based slicer, works on single-line parseSection output
- Dual spellcasting supported — creatures with both Spellcasting and Innate Spellcasting traits
- Innate prefix `'n'` prevents ID collision with same-named prepared spells

#### Foundry dnd5e v4.0+ Schema Fixes (Session 1)
All 7 fixes verified working via Foundry import — spells and weapons auto-roll correctly.

| Fix | Change |
|---|---|
| 1 | `system.type.value:'monster'` on all feat items — required for NPC sheet rendering |
| 2 | Spells: `method`+`prepared` replaces deprecated `preparation.mode` |
| 3 | Innate/atwill: `consumption.spellSlot:false` + `itemUses` target |
| 4 | `spells.spellN.override:N` — forces slot count on NPC (null = 0 for classless actors) |
| 5 | `attributes.spell.level` — caster level for DC/attack calculation |
| 6 | Resources: `legact/legres → {max, spent}`, `lair → {value:bool, initiative, inside}` |
| 7 | Senses: flat values → `ranges:{}` sub-object, 0-values → null |

#### Saves Regex Fix (Session 1)
- Colon now optional — handles `Saving Throws Int +9` and `Saving Throws: Int +9`
- Line-start anchor prevents false match on "saving throw" inside ability descriptions

#### Action Name Guard — Obstacle #3 (Session 2)
- `ACTION_NAME_RX`: 1–4 word name cap, ≥15 char description minimum
- `SENTENCE_START_RX`: rejects A/An/The/On/Each/If/When/etc. as name starters
- Bullet-point lines (`*` / `•`) stripped before matching — both `parseActions` and `parseSection`
- Applied to all section parsers (traits, reactions, bonus/legendary/lair actions)

#### Spell Metadata Lookup (Session 2)
- `SPELL_META`: ~160 common SRD spells with level + school
- `spellMeta()`: normalizes key (lowercase, strips asterisks/spaces)
- School filled on all spell items (previously always blank)
- Level correction: `mode:'innate'` only — `mode:'atwill'` stays 0 (cantrip-equivalent)
- Unknown spells warn by name instead of blanket warning

#### Sidekick Format — Tasha's Cauldron of Everything (Session 2)
- `parseSidekickLevel()`: detects level from ordinal, `Level: N`, or PB back-calculation
- `LEVEL_XP` + `levelToXP()`: character advancement XP table (replaces CR_XP for sidekicks)
- `isSidekick` branch in CR block: `cr:0`, profBonus from PB or level, XP from character table
- Features section parsed via `parseSection(text, 'Features?')` → passive feat items (prefix `'f'`)
- `Equipment` + `Features` added to `SECSTOP` and `ALL_SEC_STOP` (prevents section bleed)
- SR/LR recharge: "Short or Long Rest" → `period:'sr'`, "Long Rest" → `period:'lr'`
- UI badges: `(Short Rest)`, `(Long Rest)`, `(N/Day)` distinct from `(Recharge X-6)`

### Known Limitations
- Spell descriptions empty — items created by name, link to compendium manually
- Sidekick leveling requires PC actor (`type:'character'`) — current output is NPC snapshot (Phase 8)
- SR/LR recovery on NPC sheets depends on Foundry configuration

---

## Version 2.0 Stable — Phase 6 Complete
**Release Date:** March 8, 2026
**Status:** Stable
**Phase:** Phase 6 — Sprints 1–3 Complete
**File:** `dnd-parser-v20-stable.tsx`

### What Was Stable
- Full actions parsing with Foundry Activities system (attack/save/utility)
- Traits, reactions, bonus actions, legendary actions, lair actions
- Damage resistances/immunities/vulnerabilities with conditional routing
- Legendary action count parsing (2014 and 2024 formats)
- In-lair bonus detection and warning
- djb2 hash ID generation (replaced slice-based approach that collided on long actor names)
- Optional field tracking (absent fields excluded from accuracy score)
- `system.target` extraction for AoE templates and target counts
- 2024 format: combined immunity lines, new legendary format, lair actions removed

---

## Version 2.0-alpha.1 — Phase 6 Block 3 Complete
**Release Date:** March 3, 2026
**Status:** Alpha — Active Development
**Phase:** Phase 6 — Sprint 1/2 (Actions & Features)
**File:** `dnd-parser-v20-alpha1-clean.tsx`

### Major Changes

#### Activities System Migration (Block 3)
- **Breaking schema change:** Items now use Foundry dnd5e v4.0+ `system.activities` map
- Old `system.attack`, `system.actionType`, `system.damage.parts` removed from item output
- New `parseDiceFormula()` helper: converts formula strings to Foundry DamageField objects (`{number, denomination, bonus, types, custom, scaling}`)
- New `parseSaveInfo()` helper: extracts DC and ability from both 2024 format ("Strength Saving Throw: DC 13") and 2014 format ("DC 13 Strength saving throw")
- New `SAVE_ABBR` map: full ability name → 3-letter code
- `parseActions()` now captures recharge qualifier in group 2 (`m[2]`); description shifts to group 3

#### Activity Classification Logic
- Weapon attacks (contain "Melee/Ranged Attack Roll:" or "Weapon Attack:") → `type: "weapon"` + `attack` activity
  - Attack ability (`str`/`dex`) inferred by comparing attack bonus vs `abilityMod + profBonus`
  - `attack.bonus` = delta only (0 extra = empty string)
  - `attack.type.value`: `mwak` (melee), `rwak` (ranged), `mwak` (melee-or-ranged default)
  - Additional damage wired to `activity.damage.parts[0]` (DamageField)
  - Base damage stored in `system.damage.base`
- Save abilities (DC X saving throw detected) → `type: "feat"` + `save` activity
  - `save.ability`: array (e.g. `["str"]`)
  - `save.dc.formula`: DC as string
  - `save.damage.onSave`: `"half"`
- All other actions → `type: "feat"` + `utility` activity

#### Recharge Support
- Qualifier "Recharge 4–6" → `system.uses = { value:4, max:'6', per:null, recovery:[{period:'recharge',formula:'4',type:'recoverAll'}] }`

#### Structural Additions (Block 1 — completed this session)
- `detectFormat()`: sidekick detection stub; emits UI warning
- `CR_XP` table + `crToXP()`: populates `system.details.xp.value` on every actor
- `system.resources` stub: `legact`/`legres`/`lair` zeroed on every actor
- `_id` on every item: deterministic 16-char string from actor+item name

#### Section Regex Safety (Block 2 — completed this session)
- `SECSTOP` constant: shared lookahead covering 14+ section headers
- All 9 field regexes (`saves`, `skills`, `senses`, `languages`, `dr`, `dv`, `diOld`, `ciOld`, `immNew`) converted to `new RegExp('...' + SECSTOP, 'is')`
- Comma-separated ability scores: added `,?` to first ability pattern (Obstacle #8 resolved)

#### Senses Fix
- Darkvision, blindsight, tremorsense, truesight now extracted as numeric values
- Passive perception stripped from `system.attributes.senses.special`

#### Action Regex Fix
- `(Recharge 4–6)` parentheticals no longer break action name parsing
- Recharge qualifier now captured separately from action name

### Bug Fixes
- Whirlwind (Recharge 4–6) was grouping with the next action — fixed
- Darkvision was landing in `senses.special` instead of `senses.darkvision` — fixed
- Skills regex was consuming Actions section on compact stat blocks — fixed (SECSTOP)

### UI Updates
- Actions panel now shows: activity type badge, attack type (MWAK/RWAK), ability, save DC, recharge tag, item type tag (`[weapon]`/`[feat]`)
- Version badge updated to `v2.0-alpha.1`

### Known Limitations (alpha)
- `system.target` not yet extracted
- Speed regex still positional for fly/climb/swim/burrow (Obstacle #7)
- Action name regex can false-positive on flavor sentences (Obstacle #3)
- Legendary actions, reactions, traits not yet parsed (Sprint 3)
- Conditional resistances not yet routed to `custom` (Obstacle #4)
- Sidekick format: detection only, no parsing (Sprint 4)

---

## Version 1.6 - Phase 5.0 Complete (Stable Baseline)
**Release Date:** December 18, 2025  
**Status:** Stable - Production Ready  
**Phase:** Phase 5.0 - Stats & Abilities Parser Complete

### Major Changes
- **D&D Beyond Compatibility** - Fully supports D&D Beyond stat block formats
- **Split Table Parsing** - Handles abilities in separate tables (STR/DEX/CON and INT/WIS/CHA)
- **Individual Ability Matching** - Parses each ability separately for maximum flexibility
- **Initiative Parsing** - Extracts and stores initiative bonus
- **Enhanced CR Parsing** - Handles CR with XP and PB annotations: `CR 4 (XP 1,100; PB +2)`

### New Features
- Parses D&D Beyond table format with tabs and multiple spaces
- Individual ability score extraction (works with any format)
- Initiative bonus field (`Initiative +3`)
- Handles en-dash (−) and regular minus (-) in modifiers
- Flexible speed parsing (any order: fly, climb, swim, burrow)
- Enhanced regex patterns for modern stat block formats

### What Works Now
✅ **Basic Stats** - Name, size, type, alignment (all formats)  
✅ **Combat Stats** - AC, HP with formulas  
✅ **Ability Scores** - All 6 abilities (standard, parenthetical, or D&D Beyond tables) ⭐ NEW  
✅ **Challenge Rating** - With or without XP/PB annotations ⭐ NEW  
✅ **Initiative** - Bonus parsing ⭐ NEW  
✅ **Saving Throws** - With proficiency detection  
✅ **Skills** - All 18 skills with proficiency/expertise (0/1/2)  
✅ **Movement** - Walk, climb, fly, swim, burrow (any order)  
✅ **Senses** - Including passive perception  
✅ **Languages** - Cleaned of parenthetical notes  
✅ **Field Editor** - Manual corrections for any field  

### Format Compatibility
✅ Standard Monster Manual format  
✅ D&D Beyond format (single or split tables) ⭐ NEW  
✅ Roll20 format  
✅ Homebrewery format  
✅ Most community stat block formats  

### Phase 5.0 Goals - COMPLETE
- ✅ Parse all basic statistics
- ✅ Parse all ability scores (any format)
- ✅ Parse saving throws with proficiency
- ✅ Parse skills with proficiency/expertise
- ✅ Parse movement speeds
- ✅ Support multiple stat block formats
- ✅ Field editor for corrections
- ✅ 90%+ accuracy on standard blocks

---

## Version 1.5 - Skills Fixed
**Release Date:** December 17, 2025  
**Status:** Deprecated (Use v1.6)  
**Phase:** Phase 5.0 - In Progress

### Major Changes
- Complete code rewrite
- Skills structure fixed
- Proficiency detection improved

### Upgrade Path
v1.5 → v1.6: Direct upgrade, no breaking changes

---

## Version 1.4 (Deprecated - Testing Version)
**Release Date:** December 17, 2025  
**Status:** Deprecated  

### Issues
- Skills structure incomplete
- Skip this version

---

## Version 1.3 - Foundry VTT Compatible
**Release Date:** December 10, 2025  
**Status:** Deprecated  
**Phase:** Phase 5.0 - In Progress

### Major Changes
- Complete JSON Structure Overhaul
- Foundry v3.3+ compatibility
- Movement parsing added

---

## Version 1.2 - AC & HP Formula Fixed
**Release Date:** December 10, 2025  
**Status:** Deprecated

---

## Version 1.1 - Field Editor Added
**Release Date:** December 9, 2025  
**Status:** Deprecated

---

## Version 1.0 - Stable Release
**Release Date:** December 8, 2025  
**Status:** Deprecated

---

## Development Phases

### Phase 5 (November 25 - December 18, 2025) - COMPLETE ✅
**Goal:** Parse all basic statistics and abilities accurately

**Versions:** v1.0 → v1.6

**Achievements:**
- ✅ Basic stat block parsing
- ✅ Ability scores (all formats)
- ✅ Skills with proficiency/expertise
- ✅ Saving throws with proficiency
- ✅ Movement speeds
- ✅ Field editor
- ✅ D&D Beyond compatibility
- ✅ 90%+ accuracy on standard blocks

**Final Version:** v1.6 - Phase 5.0 Complete

---

### Phase 6 (Starting December 18, 2025) - IN PROGRESS 🚧
**Goal:** Parse actions, features, and special abilities

**Target Version:** v2.0

**Planned Features:**
- Actions parsing (attacks, multiattack)
- Special features and traits
- Legendary actions
- Reactions and bonus actions
- Damage types (resistance/immunity/vulnerability)
- Condition immunities
- Action descriptions with attack rolls
- Damage formulas
- Spellcasting basics

**Expected Timeline:** Q1 2026 (1-2 months)

---

### Phase 7 (Future - Q2 2026) - PLANNED 📋
**Goal:** Advanced parsing and spell support

**Target Version:** v3.0

**Planned Features:**
- Full spell list parsing
- Innate spellcasting
- Lair actions
- Regional effects
- Advanced condition handling
- Spell slot management

---

### Phase 8 (Future - Q3 2026) - PLANNED 📋
**Goal:** Automation and batch processing

**Target Version:** v4.0

**Planned Features:**
- Batch processing (multiple stat blocks)
- AI-enhanced parsing (Claude API)
- Template system for homebrew
- Image/token integration
- Advanced validation
- Import from URLs

---

## Version Comparison

| Feature | v1.0 | v1.1 | v1.2 | v1.3 | v1.4 | v1.5 | v1.6 |
|---------|------|------|------|------|------|------|------|
| Basic Stats | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Field Editor | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AC/HP Formula | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Foundry Compatible | ❌ | ❌ | ❌ | ✅ | ⚠️ | ✅ | ✅ |
| Speed Parsing | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Skills Working | ❌ | ❌ | ❌ | ⚠️ | ❌ | ✅ | ✅ |
| Clean Code | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **D&D Beyond Format** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Initiative** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Split Tables** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Actions Parsing | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (v2.0) |

---

## Phase Status

| Phase | Status | Version | Dates |
|-------|--------|---------|-------|
| Phase 1 | ✅ Complete | Prototype | Nov 25-27, 2025 |
| Phase 2 | ✅ Complete | Basic Parser | Nov 28-30, 2025 |
| Phase 3 | ✅ Complete | Goblin.json | Dec 1-3, 2025 |
| Phase 4 | ✅ Complete | Iteration | Dec 3-5, 2025 |
| **Phase 5** | **✅ Complete** | **v1.0-1.6** | **Dec 5-18, 2025** |
| Phase 6 | ✅ Complete | v2.0-stable | Dec 18, 2025 → Mar 8, 2026 |
| Phase 7 | ✅ Complete | v3.0-alpha | Mar 8-11, 2026 |
| Phase 8 | ✅ Complete | v3.1 | Mar 12-15, 2026 |
| **Phase 9** | **🚧 Sprint 3 Complete** | **v4.0-alpha** | **Mar 15-17, 2026 →** |
| Phase 10 | 📋 Planned | — | Multi-VTT Export |
| Phase 11 | 📋 Planned | — | Batch Processing |
| Phase 12 | 📋 Planned | — | OCR |
| Phase 13 | 📋 Planned | — | AI + URL Import |

---

## Critical Milestones

### Phase 5.0 - Stats & Abilities (COMPLETE) ✅
- **v1.0** - Initial stable release
- **v1.1** - Field editor
- **v1.2** - Formula parsing
- **v1.3** - Foundry compatibility
- **v1.4** - Testing (deprecated)
- **v1.5** - Skills fixed, clean rewrite
- **v1.6** - D&D Beyond support, Phase 5.0 complete

### Phase 6.0 - Actions & Features ✅ COMPLETE
- **v2.0-alpha** - Basic action parsing, Activities system
- **v2.0-stable** - Full actions, traits, legendary/lair, resistances, djb2 IDs

### Phase 7.0 - Spellcasting + Schema Fixes ✅ COMPLETE
- **v3.0-alpha** - Full spellcasting parser, dnd5e v4 schema, sidekick format

### Phase 8.0 - Sidekick Final + ChatGPT Format ✅ COMPLETE
- **v3.1** - NPC sidekick final, ChatGPT colon format support, PC branch removed

### Phase 9.0 - Class Importer 🚧 SPRINT 3 COMPLETE
- **v4.0-alpha** - Sprint 1-3: Class Importer tab, full macro, UUID resolution

---

## Changelog Format

Each version includes:
- **Release Date** - When version was completed
- **Status** - Current status (Stable, Deprecated, Development)
- **Phase** - Which development phase
- **Changes** - What was modified
- **New Features** - What was added
- **Bug Fixes** - What was fixed

---

## Deprecation Policy

- Previous versions marked as deprecated when new version releases
- Critical bugs backported for 1 version
- Documentation maintained for 2 versions back
- **Current stable version: v1.6 (Phase 5.0 Complete)**

---

## Migration Paths

### From v1.5 to v1.6
- No breaking changes
- Direct upgrade
- Enhanced parsing, same structure
- Re-parse for D&D Beyond format support

### From v1.4 or earlier to v1.6
- Breaking changes in skills structure
- Must re-parse all stat blocks
- See MIGRATION_GUIDE.md

---

## What's Next?

### Phase 9 Sprint 4 — Class Importer Polish

- Subclass feature blocks (full feature parsing for subclass abilities)
- Tool proficiency support
- ScaleValue advancement schema verification
- Further edge case handling

### Planned Phases

| Phase | Goal |
|-------|------|
| Phase 10 | Multi-VTT Export (Roll20, Fantasy Grounds, PF2e) |
| Phase 11 | Batch Processing (multiple stat blocks) |
| Phase 12 | OCR (screenshot/image → parsed output) |
| Phase 13 | AI-enhanced parsing (Claude API fallback) + URL import |

---

## Known Limitations

### Phase 5.0 (v1.6) - Current
**Not Supported:**
- ❌ Actions and attacks
- ❌ Legendary actions
- ❌ Special features/traits
- ❌ Damage types
- ❌ Spell lists

**Supported:**
- ✅ All basic statistics
- ✅ All ability scores (any format)
- ✅ Skills and saves
- ✅ Movement and senses
- ✅ D&D Beyond format

### Phase 6.0 (v2.0) - Coming Soon
**Will Add:**
- ✅ Actions and attacks
- ✅ Legendary actions
- ✅ Special features
- ✅ Damage types

---

## Support & Feedback

### Reporting Issues
Include:
- Version (v1.6)
- Phase (5.0)
- Stat block format
- Expected vs actual results

### Feature Requests
- Phase 6 features can be requested now
- Phase 7+ features will be considered after Phase 6

---

**Last Updated:** March 17, 2026
**Current Stable:** v3.1 (Phase 8 Complete)
**Active Development:** v4.0-alpha (Phase 9 Sprint 3 Complete)
**Status:** ✅ Phases 5–8 Complete, 🚧 Phase 9 Sprint 4 Up Next