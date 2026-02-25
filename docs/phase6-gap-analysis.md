# Phase 6 — Gap Analysis, Structural Additions & Obstacle Planning

**Document Version:** 1.1  
**Date:** February 19, 2026  
**Applies To:** `dnd-parser-v20-alpha1-clean.tsx` → v2.0 release  
**Reference:** `project-overview-phase6.md`

### Changelog
| Version | Date | Changes |
|---|---|---|
| 1.0 | Feb 18, 2026 | Initial gap analysis and obstacle planning |
| 1.1 | Feb 19, 2026 | Added Obstacles #8 and #9 from Don-Jon Raskin stat block testing. Added Sidekick Format Decision section. Updated Sprint 4 scope. Added format detection to structural additions. |

---

## Current Code State vs. Phase 6 Roadmap

### Sprint 1 (Weeks 1–2) — Basic Actions ✅ ~70% Complete

The current `parseActions()` function already covers the majority of Sprint 1:

| Task | Status |
|---|---|
| Action section detection | ✅ Done |
| Action name extraction | ✅ Done |
| Action description parsing | ✅ Done |
| Attack roll detection (`+7 to hit`) | ✅ Done |
| Reach/range extraction (`reach 5 ft.`) | ✅ Done |
| Hit effect parsing | ✅ Done |
| Target extraction (`one target`) | ❌ Missing |

**What's missing from Sprint 1:**  
Target extraction ("one target", "each creature in a 15-foot cone", etc.) is not parsed. This maps to `system.target` on a Foundry item and needs its own regex. It is not blocking but should be completed before Sprint 1 is marked done.

The `system.actionType` field is also absent from all generated items. Foundry uses this to determine which roll button to show. See **Obstacle #1** below — this should be resolved during Sprint 1 before any more items are built on top of it.

---

### Sprint 2 (Weeks 3–4) — Damage & Multiattack 🔲 Not Started

**What needs to be built:**

**Multiattack** is a `feat` type item in Foundry, not a `weapon`. The current code types every action as `weapon`. Non-attack actions (Multiattack, Frightful Presence, Breath Weapon recharge, etc.) must be classified differently. The item type decision needs to be made before the damage parts are written.

Correct Foundry structure for a Multiattack item:
```json
{
  "name": "Multiattack",
  "type": "feat",
  "system": {
    "description": { "value": "The dragon makes three claw attacks." },
    "activation": { "type": "action", "cost": 1 },
    "actionType": "other"
  }
}
```

**Additional damage** (`plus 3d6 fire`) is currently parsed into `action.damage.additional` internally but is never written to `damage.parts[1]` in the Foundry output. Foundry supports multiple parts as an array:
```json
"damage": {
  "parts": [
    ["2d6+4", "piercing"],
    ["3d6",   "fire"]
  ]
}
```
This needs to be wired up in the `items.map()` block when building the actor.

**Conditional attacks** ("or uses Spellcasting") should be preserved in the item description as plain text with a warning flag in parse analytics, rather than attempting to parse them structurally. Attempting to model conditional logic will produce more errors than it prevents at this stage.

---

### Sprint 3 (Weeks 5–6) — Special Features 🔲 Not Started

**What needs to be built:**

#### Damage Resistances, Immunities, Vulnerabilities & Condition Immunities

The Actor `system.traits` block already has `di`, `dr`, `dv`, and `ci` array stubs in the current output, but nothing populates them. The parser needs to detect and extract these lines:

```
Damage Vulnerabilities fire
Damage Resistances bludgeoning, piercing, and slashing from nonmagical attacks
Damage Immunities cold, poison, necrotic
Condition Immunities charmed, exhaustion, frightened, paralyzed
```

Foundry expects lowercase single-word damage type strings in the `value` array (e.g. `["fire", "cold", "poison"]`). Conditional resistances like "bludgeoning, piercing, and slashing from nonmagical attacks" **cannot** go in `value` — they must go in the `custom` string field. See **Obstacle #4** below for why this is a silent failure risk.

#### Reactions

Reactions are `feat` type items with `system.activation.type` set to `"reaction"`. The section needs its own dedicated parser (similar to `parseActions`) that detects the **Reactions** header and extracts entries using the same name + description pattern. The only structural difference from actions is the activation type.

#### Legendary Actions

Legendary Actions require the most structural work of Sprint 3. They are `feat` type items, but they also consume from a **shared legendary action resource** that must exist on the actor itself. This resource block is currently absent from the output entirely.

The following needs to be added to `system` on the actor (stubbed with zeros for creatures that have no legendary actions, populated when the section is detected):

```json
"resources": {
  "legact": { "value": 3, "max": 3, "sr": false, "lr": true, "label": "Legendary Actions" },
  "legres": { "value": 0, "max": 0, "sr": false, "lr": true, "label": "Legendary Resistances" },
  "lair":   { "value": 0, "max": 0, "sr": false, "lr": true, "label": "Lair Actions" }
}
```

Each legendary action item needs a `system.consume` block pointing back to this resource:
```json
"consume": { "type": "attribute", "target": "resources.legact.value", "amount": 1 }
```
The cost amount (1, 2, or 3) must be parsed from the action text — see **Obstacle #5**.

#### Special Traits (Passive Features)

Traits like Magic Resistance, Pack Tactics, and Legendary Resistance appear in the **Traits** section before the Actions block. They are `feat` type items with `system.activation.type` set to `""` (empty string — meaning passive, no activation required). A dedicated `parseTraits()` function will be needed, using the same name + description line pattern.

---

### Sprint 4 (Weeks 7–8) — Refinement + Sidekick Format 🔲 Not Started

**Scope update:** Sprint 4 has been expanded beyond testing and documentation to include initial sidekick format support. See the **Sidekick Format Decision** section below for full rationale. Standard CR-based stat blocks must be at 90%+ accuracy before sidekick work begins — this is a hard gate.

**Testing (all sprints):**
- Complex creatures: Strahd, Ancient Dragon, Beholder, Lich
- Edge cases identified during Sprints 1–3
- Validation against live Foundry VTT imports

**Sidekick Format Support (Tasha's Cauldron of Everything):**
- Format detection at parse entry point (see Structural Additions)
- Level → CR equivalent mapping for proficiency bonus calculation
- Level → XP mapping using character XP table
- Comma-separated ability score parsing (`STR 13, DEX 12...`)
- Bullet-point action format (`* Pickaxe. +4 to hit...`)
- Class-defined proficiency handling (Warrior, Expert, Spellcaster)
- Explicit proficiency bonus field detection (`PB: +2`)

**Documentation and release:**
- VERSION_HISTORY.md — v2.0 entries
- README.md — updated feature list
- FIELD_MAPPING.md, JSON_SCHEMA.md, PARSER_RULES.md updates
- ACTION_PARSING.md, ITEM_STRUCTURE.md, TESTING_GUIDE.md created
- SIDEKICK_FORMAT.md — new document covering Tasha's format specifics
- v2.0 stable release

---

## Sidekick Format Decision

**Decided:** February 19, 2026  
**Decision:** Standard CR-based stat blocks will be the sole target format through Sprints 1–3. Sidekick format support (Tasha's Cauldron of Everything, NPC class levels) will be scoped into Sprint 4 as a defined workstream rather than handled ad hoc.

**Rationale:** Sidekick stat blocks (as seen in the Don-Jon Raskin test case) diverge from standard Monster Manual format in at least six structural ways. Attempting to handle both formats simultaneously before the core parser reaches 90%+ accuracy would introduce branching logic throughout every field parser, making regression testing unreliable and bugs harder to isolate. Completing the standard format first establishes a stable baseline and a clear regression suite before the second format is layered in.

**Hard gate:** Sprint 4 sidekick work does not begin until standard CR-based stat blocks are consistently parsing at 90%+ accuracy across a test suite that includes at minimum: a basic humanoid, a beast, an undead, a dragon, a creature with legendary actions, and a creature with damage resistances.

**What defines a sidekick stat block** (for format detection purposes):
- Presence of `Level:`, `Nth-level`, or a class keyword (`Warrior`, `Expert`, `Spellcaster`) in the header line
- Absence of a `Challenge` or `CR` line
- Presence of `PB:` or `Proficiency Bonus` as an explicit field

**Known sidekick-specific differences that Sprint 4 must handle:**
- `Level` replaces `CR` — proficiency bonus must use the character progression table (identical values to CR table but different semantic source)
- XP must use the character advancement XP table, not the CR XP table
- Ability scores may be comma-separated (`STR 13, DEX 12, CON 14...`)
- Actions may use bullet-point format (`* Action Name. description`)
- Saving throw proficiencies are class-defined, not listed explicitly in some formats
- `Equipment:` and `Features:` sections may appear and must not confuse section boundary detection

---

## Structural Additions Needed Now (Before Sprint 2)

These additions do not require new parsing logic. They should be added to the current output schema immediately so the JSON structure is stable and consistent across all future sprints.

### 1. `system.resources` Block

Stub this on every actor output with zero values. When Legendary Actions are parsed in Sprint 3, the values will be populated rather than the field being added mid-version, which would be a breaking schema change.

```json
"resources": {
  "legact": { "value": 0, "max": 0, "sr": false, "lr": true, "label": "Legendary Actions" },
  "legres": { "value": 0, "max": 0, "sr": false, "lr": true, "label": "Legendary Resistances" },
  "lair":   { "value": 0, "max": 0, "sr": false, "lr": true, "label": "Lair Actions" }
}
```

### 2. `system.details.xp.value`

Foundry expects this field on every NPC actor. Without it, some Foundry modules and macros that reference XP will throw errors. It should be computed from CR using the standard XP table:

| CR | XP | CR | XP |
|---|---|---|---|
| 0 | 10 | 9 | 5000 |
| 1/8 | 25 | 10 | 5900 |
| 1/4 | 50 | 11 | 7200 |
| 1/2 | 100 | 12 | 8400 |
| 1 | 200 | 13 | 10000 |
| 2 | 450 | 14 | 11500 |
| 3 | 700 | 15 | 13000 |
| 4 | 1100 | 16 | 15000 |
| 5 | 1800 | 17 | 18000 |
| 6 | 2300 | 18 | 20000 |
| 7 | 2900 | 19 | 22000 |
| 8 | 3900 | 20 | 25000 |

### 3. Item `_id` Field

Every object in the `items` array needs a `_id` field for Foundry's drag-drop import to work reliably. Without it, re-importing the same actor creates duplicate items with no way to reconcile them. A simple deterministic string (actor name + item name, lowercased, spaces stripped) is sufficient for this stage and avoids a UUID dependency.

### 4. Format Detection Function

A `detectFormat(text)` function should be added at the top of `parseStatBlock()` before any field parsing begins. It returns a format token that downstream parsers can reference. For now only two tokens are needed:

```js
// Returns: 'standard' | 'sidekick'
const detectFormat = (text) => {
  if (/\b(Nth-level|\d+(?:st|nd|rd|th)-level|Level:\s*NPC|Warrior|Expert|Spellcaster)\b/i.test(text)
    && !/Challenge|[\bCR\b]/i.test(text)) return 'sidekick';
  return 'standard';
};
```

This stub does nothing in Sprints 1–3 except identify sidekick blocks early so they can generate a clear warning in the UI ("Sidekick format detected — full support coming in v2.0") rather than silently producing wrong output. In Sprint 4, the format token is used to switch ability score parsing, action parsing, and proficiency bonus calculation to their sidekick-specific variants.

---

## Foreseen Obstacles

### Obstacle #1 — `actionType` Is Missing and Will Break Rolls (Sprint 1)
**Risk: High | Silent failure**

Foundry uses `system.actionType` on every item to determine how it rolls. Valid values are:

| Value | Meaning |
|---|---|
| `mwak` | Melee Weapon Attack |
| `rwak` | Ranged Weapon Attack |
| `msak` | Melee Spell Attack |
| `rsak` | Ranged Spell Attack |
| `save` | Saving Throw |
| `heal` | Healing |
| `other` | No roll / utility |

The current code sets no `actionType` on any item. Foundry will silently default, and roll buttons either won't appear or will roll the wrong thing. This needs to be inferred from the attack description text before Sprint 2 adds more items on top of it:
- Contains "Melee Weapon Attack" → `mwak`
- Contains "Ranged Weapon Attack" → `rwak`  
- Contains "Melee or Ranged Weapon Attack" → requires special handling (see Obstacle #2)
- No attack line detected → `other`

---

### Obstacle #2 — "Melee or Ranged Weapon Attack" Needs Two Range Fields (Sprint 1/2)
**Risk: Medium | Data loss**

Thrown weapons (javelin, handaxe, etc.) list both reach and range. The current parser captures whichever match comes first in the description. The Foundry item needs both `range.value` (reach, for melee) and `range.long` (for thrown range), and the `actionType` is ambiguous. The safest approach is to store both and allow the field editor to correct — this should be documented as a known edge case in the UI warning system.

---

### Obstacle #3 — Action Name Regex Will False-Positive on Flavor Text (Sprint 1/2)
**Risk: Medium | Phantom actions created**

The current pattern `^([A-Z][A-Za-z\s]+?)\.\s+(.*)$` will match any sentence starting with a capitalized word followed by a period. Some stat blocks have descriptive paragraphs within the Actions section (Beholder eye rays, Dragon breath recharge text) that will be incorrectly parsed as new action names.

Recommended guards:
- Cap the name match at 4 words or 35 characters
- Require the name not to end in a verb form (`-s`, `-ing`, `-ed`)
- Require the remainder of the line to be at least 20 characters (a real action description, not a sentence fragment)

---

### Obstacle #4 — Conditional Damage Resistances Must Route to `custom`, Not `value` (Sprint 3)
**Risk: High | Silent data loss on import**

Foundry's `di.value`, `dr.value`, and `dv.value` arrays only accept exact lowercase single-word damage type strings. If "bludgeoning, piercing, and slashing from nonmagical attacks" is pushed into `value`, Foundry silently drops it on import with no error shown to the user.

The parser must detect the phrase "nonmagical" (or "from nonmagical", "that aren't magical", "while in true form") and route the entire resistance string to the `custom` field instead:

```json
"dr": {
  "value": ["fire", "cold"],
  "custom": "Bludgeoning, Piercing, and Slashing from Nonmagical Attacks"
}
```

This is one of the most commonly broken fields in community-built Foundry converters.

---

### Obstacle #5 — Legendary Action Cost Parsing Is Ambiguous (Sprint 3)
**Risk: Medium | Wrong consume amounts**

Legendary action costs appear in several formats across published stat blocks:
- `"Claw Attack (Costs 2 Actions). The dragon..."` — parenthetical after name
- `"Claw Attack. Costs 2 actions. The dragon..."` — inline in description
- `"Claw Attack. The dragon..."` — no cost stated, default is 1

The current action name regex `^([A-Z][A-Za-z\s]+?)\.\s+(.*)$` will include "(Costs 2 Actions)" as part of the name string if it's not stripped first. The name should be cleaned and the cost value captured before the name is stored. A preprocessing step before the main line loop is the cleanest place to handle this.

---

### Obstacle #6 — Section Regex Bleed When Headers Are Missing (Sprint 2/3)
**Risk: High | Catastrophic misparsing, hard to detect**

Several field regexes use a lookahead to stop at the next known section header. If a creature stat block is missing one of those headers (a creature with no Languages line, or a block that omits the Challenge line), the lookahead never fires and the match consumes the rest of the document — silently eating the Actions section and everything below it.

The Skills regex for example:
```js
/Skills[:\s]+(.+?)(?=\n\s*Damage|\n\s*Senses|...)/is
```
If none of those stop conditions exist in the text, `.+?` with the `s` flag matches to end of string.

Every section regex should have a maximum character capture limit as a fallback stop condition (e.g. `[\s\S]{0,500}` instead of `[\s\S]+?`), or the set of stop conditions should be expanded to include all known section headers as a shared constant that every regex references.

---

### Obstacle #7 — Speed Regex Is Order-Dependent (Existing Bug, Surfaces in Phase 6 Testing)
**Risk: Medium | Wrong speed values assigned**

The speed regex captures fly as group 2, climb as group 3, swim as group 4, burrow as group 5 positionally. Stat blocks that list speeds in a different order (e.g. "Speed 30 ft., burrow 20 ft., fly 60 ft.") will assign burrow's value to `fly` and fly's value to `climb`. Each movement type needs its own independent named match rather than relying on capture group position. This is an existing bug that will surface frequently during Phase 6 testing on complex creatures like dragons and burrowing monsters.

### Obstacle #8 — Comma-Separated Ability Scores Fail Both Ability Parsers (Discovered in Testing)
**Risk: High | Silent wrong values**  
**Found via:** Don-Jon Raskin (sidekick) stat block test  
**Affects:** Standard compact/homebrew blocks and all sidekick blocks

Both ability score regexes expect scores separated by whitespace only:
```js
/STR\s+(\d+)\s+DEX\s+(\d+)\s+CON.../
```
The format `STR 13, DEX 12, CON 14, INT 10, WIS 11, CHA 10` (comma-separated) breaks both patterns. Neither fires, all abilities default to 10, and because 10 is a plausible score for INT/WIS/CHA, the bug can go unnoticed in output review.

A third ability pattern needs to be added that explicitly allows an optional comma-and-space between each score:
```js
/STR\s+(\d+),?\s+DEX\s+(\d+),?\s+CON\s+(\d+),?\s+INT\s+(\d+),?\s+WIS\s+(\d+),?\s+CHA\s+(\d+)/i
```
This single pattern would handle both the space-only and comma-separated formats, replacing the need for two separate regexes.

---

### Obstacle #9 — Inline Section Headers Cause Skills Regex Bleed (Discovered in Testing)
**Risk: High | Skills text bloated, Actions section consumed**  
**Found via:** Don-Jon Raskin stat block test  
**Affects:** Any compact stat block where sections are not on separate lines

The skills regex lookahead uses `\n\s*` before each stop keyword, assuming every section header starts on a new line. When `Actions:` immediately follows skills text on the same line (`Skills: Survival +3, Athletics +4 Actions:`), the lookahead never fires. The regex then captures everything to end of string — consuming the entire Actions section as part of `skillsText`.

This is a specific instance of Obstacle #6 with a concrete reproduction case. Two fixes are needed together:

1. Add `Actions` (and `Reactions`, `Traits`, `Legendary`) to the skills stop list
2. Change all section stop lookaheads from `\n\s*SectionHeader` to `(?:\n|(?=\s*SectionHeader))` so they fire on either a newline or a same-line match

The shared section header constant recommended in Obstacle #6 should be implemented at the same time to avoid having to update eight separate regexes individually.

---

## Summary Checklist

### Add Before Sprint 2 (No Parsing Required)
- [ ] Add `system.resources` stub to actor output
- [ ] Add `system.details.xp.value` computed from CR table
- [ ] Add `_id` field to all items in the `items` array
- [ ] Add `detectFormat()` stub with sidekick warning in UI

### Fix During Sprint 1 Completion
- [ ] Add `system.actionType` inference (`mwak` / `rwak` / `other`)
- [ ] Add `system.target` extraction
- [ ] Fix "Melee or Ranged" dual-type handling
- [ ] Fix ability score parser to handle comma-separated format (Obstacle #8)
- [ ] Fix skills regex bleed from inline section headers (Obstacle #9)
- [ ] Implement shared section header stop constant across all field regexes (Obstacle #6)

### Address Before Sprint 2 Ends
- [ ] Wire `damage.additional` → `damage.parts[1]`
- [ ] Distinguish `weapon` vs. `feat` item type by action classification
- [ ] Add Multiattack as `feat` type with `actionType: "other"`
- [ ] Harden action name regex against flavor text false-positives (Obstacle #3)
- [ ] Fix speed regex to use independent per-type matches (Obstacle #7)

### Address Before Sprint 3 Ends
- [ ] Build `parseTraits()` for passive features
- [ ] Build `parseReactions()` with `activation.type: "reaction"`
- [ ] Build `parseLegendaryActions()` with cost parsing (Obstacle #5)
- [ ] Build damage resistance/immunity/vulnerability parser
- [ ] Route conditional resistances to `custom`, not `value` (Obstacle #4)
- [ ] Populate `system.resources.legact` when legendary section is found

### Address During Sprint 4
- [ ] Confirm standard CR stat blocks at 90%+ accuracy before proceeding (hard gate)
- [ ] Implement sidekick format detection fully in `detectFormat()`
- [ ] Add Level → proficiency bonus mapping (character table)
- [ ] Add Level → XP mapping (character advancement table)
- [ ] Add comma-separated ability score parsing to sidekick branch
- [ ] Add bullet-point action parsing to sidekick branch
- [ ] Handle `Equipment:` and `Features:` sections as non-action sections
- [ ] Create SIDEKICK_FORMAT.md documentation
- [ ] Full test suite pass and v2.0 release

---

*This document should be updated at the end of each sprint with resolved items checked off and any newly discovered obstacles appended at the end of the Foreseen Obstacles section.*
