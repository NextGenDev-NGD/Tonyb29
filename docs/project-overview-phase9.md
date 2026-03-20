# Phase 9 — Custom Class Importer

**Status:** Sprint 4 Complete ✅ — Phase 9 Done
**Created:** 2026-03-12
**Last Updated:** 2026-03-17
**Follows:** Phase 8 Complete (v3.0-alpha)

---

## Overview

### The Problem
Creating a custom homebrew class in Foundry VTT requires manually building:
- A class item with level progression, hit dice, saves, proficiencies
- A subclass item
- Every class feature as a separate feat item (spells, abilities, passive traits, resource management)
- Linking everything together

For a class like Technomancer (a multi-level homebrew with many unique abilities), this can mean dozens of items entered by hand.

### The Solution
Parse a class definition text document — the kind of thing you'd write in a design doc or find on a wiki — and output a Foundry-importable JSON bundle containing:
- The class item with full progression table
- All feature items (feats, spells, resources)
- Correct subclass scaffolding
- Ready to drag into Foundry

---

## Input Format

The input document will be a structured text file, similar in spirit to how stat blocks work. Likely formats to support:

### Class Header Block
```
Technomancer
Hit Die: d6
Primary Ability: Intelligence
Saves: Intelligence, Wisdom
Armor Proficiencies: None
Weapon Proficiencies: Simple weapons
Tool Proficiencies: Tinker's tools, one type of artisan's tools
Skill Proficiencies: Choose 2 from Arcana, History, Investigation, Medicine, Nature, Perception, Sleight of Hand
```

### Progression Table
```
Level  Proficiency  Features                        Spells  1st  2nd  3rd
1      +2           Technomancy, Spellcasting        2       2    —    —
2      +2           Arcane Augment                   3       3    —    —
3      +2           Subclass Feature                 4       4    2    —
...
```

### Feature Definitions
```
Technomancy (Level 1)
You can cast spells using technological foci. When you cast a spell that requires a material component worth 10gp or less, you can use your tinker's tools instead.

Arcane Augment (Level 2)
You can augment a piece of equipment during a short or long rest. Choose one of the following augments: [list]
Recharge: Short rest.
```

### Subclass Block
```
Subclass: Nanoweave (Level 3)
Nanoweave Feature (Level 3)
...
```

---

## Output Structure

### Foundry JSON Bundle
```json
{
  "items": [
    { "type": "class", "name": "Technomancer", "system": { ... } },
    { "type": "subclass", "name": "Nanoweave", "system": { ... } },
    { "type": "feat", "name": "Technomancy", "system": { ... } },
    { "type": "feat", "name": "Arcane Augment", "system": { ... } },
    ...
  ]
}
```

### Class Item Structure (Foundry dnd5e v4)
Key fields:
- `system.levels` — max level
- `system.hitDice` — "d6", "d8", etc.
- `system.saves` — array of save ability keys
- `system.skills.choices` — array of allowed skills
- `system.skills.number` — how many to pick
- `system.advancement` — array of advancement objects (features granted by level)
- `system.spellcasting` — ability, progression ("full"/"half"/"third")

### Feature Item Structure
Same as existing `makeSimpleItem` output for feats, but with:
- `system.requirements` — "Technomancer 1" etc.
- `system.type.value: 'class'` (not 'monster')
- Recharge field if applicable
- Linked resource if applicable

---

## Architecture Plan

### Approach A — Third Tab in Existing App (Preferred)
- Add a "Class Importer" tab to `App.tsx` alongside Parser and Validator
- New component: `ClassImporter.tsx` (or section in the main file)
- Shared utilities with the parser: `makeItemId`, `makeActId`, `parseDiceFormula`
- Same export UI: Download JSON / Copy JSON

**Pros:** Single dev server, shared code, consistent UI
**Cons:** Main file gets larger (already large)

### Approach B — Separate Project
- New React app in a subfolder or sibling repo
- Can share utility functions via import
- Cleaner separation

**Recommendation:** Start with Approach A (third tab), extract to separate project if it grows large.

---

## Parser Design

### Input Sections to Detect
1. **Class header** — name, hit die, saves, proficiencies, skills
2. **Progression table** — level, features, spells known, slot table
3. **Feature definitions** — name, level trigger, description, mechanical properties
4. **Subclass block** — name, features by level

### Key Parsing Challenges

| Challenge | Approach |
|-----------|----------|
| Progression table has variable columns | Detect column headers, map by position |
| Feature names in table vs. definition blocks | Cross-reference by exact name match |
| Spell slot columns vary by class | Match against known progression patterns (full/half/third/warlock) |
| Recharge / resource parsing | Look for "Recharge:", uses/day patterns |
| Subclass gating | Track "Subclass Feature" placeholder vs. real subclass names |
| Optional vs. chosen features | Note in description; no auto-selection |

### Progression Table Detection
```
Level  Prof  Features  [spell cols]
```
- First column always "Level" or a number
- Second column may be proficiency bonus or omitted
- "Features" column contains comma-separated feature names (may wrap)
- Remaining columns are spell slot counts by level

### Feature Block Detection
```
Feature Name (Level N)
Description text...
[Mechanical properties: Recharge, Uses, Damage, etc.]
```
Similar to action parsing — "Name (Level N)" as header, body until next header or section.

---

## Foundry Advancement Objects

Each level-locked feature becomes an advancement in the class item:

```json
{
  "type": "ItemGrant",
  "level": 1,
  "configuration": {
    "items": [
      { "uuid": "Compendium.world.items.<id>" }
    ]
  }
}
```

For choices (skill proficiencies, subclass):
```json
{
  "type": "ItemChoice",
  "level": 1,
  "configuration": {
    "pool": [...],
    "choices": { "1": 2 }
  }
}
```

**Note:** Sprint 3 resolved UUID linking — the macro looks up actual Foundry-assigned UUIDs after `Item.create()`, so advancement links are fully wired without any manual steps. The user runs the macro, then drags the class onto a character sheet to trigger advancements.

---

## Phase 9 Sprint Plan

### Sprint 1 — Class Header + Progression Table ✅ COMPLETE
- [x] Parse class header block (name, hit die, saves, proficiencies, skills)
- [x] Parse progression table (level, features column)
- [x] Detect spellcasting progression type (full/half/third) from slot columns
- [x] Output class item with correct `system` structure
- [x] Third tab in App.tsx — Class Importer live at localhost:3000
- [x] Async build with 'Building...' button state; no JSON.stringify in render path

### Sprint 2 — Feature Items + dnd5e 5.x Schema Fixes ✅ COMPLETE
- [x] Parse feature definition blocks
- [x] Build feat items with `system.requirements` (`system.type.value:'class'`)
- [x] Handle recharge/uses properties
- [x] Cross-reference feature names from table to definitions
- [x] Fix ClassImporter for dnd5e 5.x: `hd.denomination` as string "d8", `spellcasting.preparation = {formula:''}`, `ItemGrant.spell = null`
- [x] Use `Subclass` type (not `ItemChoice`) for subclass advancement
- [x] Load Example button fills full Technomancer template

### Sprint 3 — Self-Contained Macro + UUID Resolution ✅ COMPLETE
- [x] Macro is fully self-contained: creates features + subclasses + class item in one run
- [x] ItemGrant advancements use actual Foundry-assigned UUIDs (looked up after `Item.create`)
- [x] Features auto-granted when class is dragged onto character sheet
- [x] Input normalization: strips `\r\n`, non-breaking spaces, leading whitespace per line
- [x] Class Item JSON button retained as backup only
- [x] Bundle JSON array output kept alongside macro

### Sprint 4 — Polish + Additional Features ✅ COMPLETE
- [x] Subclass feature blocks — `Subclass: Name` sections with own `Level N:` lines, full ItemGrant advancements wired per-subclass in macro
- [x] ScaleValue fix — removed `distance: { units: '' }` field that caused silent rejection in dnd5e 5.x
- [x] Folder structure — macro creates `ClassName/` main folder (class + subclasses) + `ClassName/Features/` subfolder (all feature items)
- [x] Scale References panel — summary card shows ready-to-copy `@scale.class.identifier` strings for all scale values
- [x] Macro restructured to 6 steps: folder → features → subclasses (with wired advancements) → class item
- [x] Feature list color-coded: green=class features, purple=subclass features, yellow=stubs
- [x] `Uses: @scale.class.id / lr` → resolves dynamically in Foundry (scalable uses without hardcoding)
- [x] Tested: Sacrier class (dandwiki) — 3 subclasses, pain dice/die/threshold ScaleValues confirmed working
- [ ] Tool proficiency support
- [ ] Activity support for damage rolls (deferred — users add manually via Foundry Activities tab; @scale refs provided in UI)

---

## Test Case: Technomancer

The primary test will be the user's Technomancer homebrew class (torar.fandom.com — note: blocked 403, user will supply text directly). Requirements:
- Parse all levels 1–20
- Capture every feature
- Correct spellcasting progression
- Nanoweave subclass

---

## Success Criteria

### Must Have
- [ ] Parse class name, hit die, saves, proficiencies, skill choices
- [ ] Parse progression table — which features at which levels
- [ ] Parse feature descriptions into feat items
- [ ] Output valid Foundry class item JSON
- [ ] Output all feature items in one bundle

### Should Have
- [ ] Subclass item
- [ ] Spell slot progression detected and mapped
- [ ] Recharge/uses on features that have them
- [ ] Third tab in app UI

### Nice to Have
- [ ] Advancement link stubs in class item
- [ ] Spellcasting block auto-detected from header proficiencies
- [ ] Subclass choice advancement at correct level

---

## Decisions (2026-03-12, updated 2026-03-17)

1. **Input format:** Structured template required — not freeform. Template defined and documented in UI. Load Example button provides full Technomancer template.
2. **Advancement linking:** ~~Skip UUID linking for v1~~ — **Resolved in Sprint 3**: macro looks up actual Foundry UUIDs after item creation, wires ItemGrant advancements automatically. No manual linking needed.
3. **Tab placement:** Third tab in existing app (`class-importer.tsx`). JSON Validator kept as dev tooling tab.
4. **Multi-subclass:** Single subclass for v1 (Technomancer → Nanoweave). Multi-subclass deferred.
5. **Spell lists:** Deferred — class importer does not bundle spells known in Phase 9.

## Open Questions

1. **ScaleValue advancements:** Still potentially being silently dropped by Foundry. Needs verification in Sprint 4.
2. **Spell lists:** Class importer does not bundle cantrips/spells known — deferred to Sprint 4 or later.

---

## Downstream Phases

This phase feeds into:
- **Phase 10 (Multi-VTT):** UUID/ID research will determine whether class items need a different ID scheme per VTT. The djb2 16-char approach is Foundry-specific — Roll20, Fantasy Grounds etc. will likely have different requirements.
- **Phase 11 (Batch):** Batch class import could follow once single-class pipeline is stable.

---

## Related Memory

- Foundry item format rules: `memory/MEMORY.md` (Key Architecture section)
- Existing parser utilities: `parser-versions/dnd-parser-v20-stable.tsx`
- Full roadmap: `readme-md.md` (Phases 9–13)
