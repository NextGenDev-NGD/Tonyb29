# Phase 7 — Gap Analysis & Obstacle Planning (v3.0)

**Document Version:** 1.0
**Date:** March 9, 2026
**Applies To:** `dnd-parser-v20-stable.tsx` → v3.0 release
**Reference:** `docs/phase6-gap-analysis.md`

### Changelog
| Version | Date | Changes |
|---|---|---|
| 1.0 | Mar 9, 2026 | Initial Phase 7 doc. Spellcasting parsing complete and Foundry-verified. Schema fixes 1–7 applied. Saves regex fixed. Remaining scope documented. |

---

## Session Summary (Mar 9, 2026)

### What Was Built

#### Spellcasting Parser
Three spellcasting formats now handled by `parseSpellcasting(traits, actions)`:

| Format | Source | Output |
|---|---|---|
| 2014 slot-based | `"Spellcasting."` trait with level lists | `type:'spell'`, `method:'spell'`, slot counts on actor `system.spells` |
| 2014 innate | `"Innate Spellcasting."` trait with freq lists | `type:'spell'`, `method:'innate'/'atwill'`, N/Day uses on item |
| 2024 frequency | `"Spellcasting."` action with freq lists | Same as innate — spell levels unknown, warning emitted |

Key helpers added:
- `SPELL_LEVEL_WORD`, `SPELL_AB_MAP` — constants for level/ability mapping
- `makeSpellItem(name, level, mode, uses, actorName, prefix)` — builds `type:'spell'` items
- `extractSpellLists(desc)` — position-based header slicer, works on single-line strings
- `parseSpellcasting(traits, actions)` — finds and parses all three formats

**Verified working in Foundry:** All three test blocks imported successfully. Weapons and spells auto-rolled with correct attack/damage activity buttons.

#### Foundry dnd5e v4.0+ Schema Fixes (Research via Plutonium/ddb-importer)

| Fix | Change |
|---|---|
| 1 | `system.type: { value:'monster', subtype:'' }` on all `feat` items — required for NPC sheet rendering |
| 2 | Spells: `method` + `prepared` (int) replaces deprecated `preparation: { mode, prepared }` |
| 3 | Innate/atwill spell activities: `consumption.spellSlot: false` + `itemUses` target |
| 4 | `system.spells.spellN.override: N` (not null) so slot counts display on NPC sheet |
| 5 | `attributes.spell: { level: casterLevel }` for proficiency-based DC/attack |
| 6 | Resources: `legact/legres → { max, spent }`, `lair → { value:bool, initiative, inside }` |
| 7 | Senses: flat values → `ranges: {}` sub-object, 0-values → null |

#### Saves Regex Fix
- **Before:** Required colon — `(?:Saving Throws|Save):\s*` — missed `Saving Throws Int +9`
- **After:** Colon optional, line-anchored — `(?:^|\n)\s*(?:Saving Throws?|Save):?\s+`
- Line anchor prevents false match on "saving throw" inside ability descriptions

---

## Remaining Phase 7 Scope

### Obstacle #3 — Action Name Regex False-Positives
**Risk: Medium | Phantom actions created**
**Status: Deferred from Phase 6**

Current pattern: `^([A-Z][A-Za-z\s\-']+?)(?:\s*\(([^)]*)\))?\.\s+(.*)$`

Matches any sentence beginning with a capitalized word followed by a period. On complex creatures (Beholder eye rays, Dragon breath recharge text), this creates phantom action items from flavor sentences within the Actions section.

Recommended guards (from Phase 6 doc):
- Cap name match at 4 words or 35 characters
- Require description remainder to be ≥ 20 characters
- Optionally: reject names ending in verb forms (`-ing`, `-ed`, `-s`)

---

### Spell School Detection
**Risk: Low | Missing metadata**

All spells emit `school: ''`. Foundry uses this for filtering and display. A static lookup table for common SRD spells would fill this in silently for most creatures:

```js
const SPELL_SCHOOLS = {
  'fireball': 'evo', 'magic missile': 'evo', 'cone of cold': 'evo',
  'charm person': 'enc', 'dominate monster': 'enc', 'fear': 'enc',
  'mirror image': 'ill', 'invisibility': 'ill', 'mislead': 'ill',
  'misty step': 'con', 'teleport': 'con', 'dimension door': 'con',
  'counterspell': 'abj', 'dispel magic': 'abj', 'globe of invulnerability': 'abj',
  'detect magic': 'div', 'scrying': 'div', 'true seeing': 'div',
  'animate dead': 'nec', 'finger of death': 'nec', 'blight': 'nec',
  'fireball': 'evo', 'lightning bolt': 'evo', 'fly': 'trs',
  // ... expand as needed
};
```

---

### Spell Level Lookup for Innate / 2024-Format Spells
**Risk: Low | Wrong slot section in Foundry spell tab**

All innate and 2024-format spells are emitted at `level: 0` (cantrip slot) with a warning. A lookup table covering common SRD spells would set the correct level silently.

Could share the same lookup map as school detection:
```js
const SPELL_META = {
  'fireball':       { level: 3, school: 'evo' },
  'magic missile':  { level: 1, school: 'evo' },
  'charm person':   { level: 1, school: 'enc' },
  // ...
};
```

This is a quality-of-life improvement. Without it, imports still work — user just needs to set levels manually.

---

### Sidekick Format (Sprint 4, deferred to Phase 7)
**Risk: Low for standard creatures | Scope: Large**
**Hard gate: Standard CR blocks at 90%+ accuracy — MET**

Full scope from Phase 6 doc:
- Format detection already stubs a warning — no silent wrong output
- Level → proficiency bonus mapping (character progression table, same values as CR table)
- Level → XP mapping (character advancement XP table)
- Comma-separated ability score parsing already handled (Obstacle #8 fix from Phase 6)
- Bullet-point action format (`* Action Name. description`)
- Handle `Equipment:` and `Features:` sections without confusing section boundary detection
- Create `SIDEKICK_FORMAT.md` spec document

Decision: Implement after Obstacle #3 and spell lookup tables are done.

---

### Documentation Pass
- [ ] `VERSION_HISTORY.md` — v3.0-alpha entries
- [ ] Update `README.md` feature list with spellcasting support
- [ ] `SIDEKICK_FORMAT.md` — create when sidekick work begins
- [ ] Update this document at end of each session

---

## Summary Checklist

### Phase 7 — Session 1 (Mar 9, 2026) ✅
- [x] `parseSpellcasting()` — 2014 slot-based, 2014 innate, 2024 frequency
- [x] `makeSpellItem()` — `type:'spell'`, correct `method`/`prepared`/`uses`/`consumption`
- [x] `extractSpellLists()` — position-based, works on single-line concatenated strings
- [x] Schema Fix #1 — `system.type.value:'monster'` on feat items
- [x] Schema Fix #2 — `method`+`prepared` replaces deprecated `preparation`
- [x] Schema Fix #3 — `consumption.spellSlot:false` on innate/atwill activities
- [x] Schema Fix #4 — `spells.spellN.override: N`
- [x] Schema Fix #5 — `attributes.spell.level`
- [x] Schema Fix #6 — resources schema updated
- [x] Schema Fix #7 — senses moved to `ranges:{}` sub-object
- [x] Saves regex — colon optional, line-anchored
- [x] Verified import in Foundry — spells, weapons, auto-roll confirmed working

### Phase 7 — Session 2 (Mar 11, 2026) ✅
- [x] Obstacle #3 — `ACTION_NAME_RX` + `SENTENCE_START_RX` guard; 4-word cap, ≥15 char desc, sentence-starter filter
- [x] `SPELL_META` lookup table — ~160 common SRD spells with level + school
- [x] `spellMeta()` — normalizes lookup key; fills school on all spells; corrects level for innate (not atwill)
- [x] At Will 2024 spells stay at level 0 (cantrip-equivalent) — only `mode:'innate'` gets level correction
- [x] UI: N/Day badge replaces "Recharge" label for day-based recovery
- [x] Sidekick format full support:
  - `parseSidekickLevel()` — detects level from ordinal, "Level: N", or PB back-calculation
  - `LEVEL_XP` character advancement table — used instead of CR_XP for sidekicks
  - `levelToXP()` — maps sidekick level to character XP
  - `isSidekick` branch in CR block — profBonus from PB field or level, cr:0 on actor
  - `Equipment` + `Features` added to `SECSTOP` and `ALL_SEC_STOP`
  - Features section parsed via `parseSection(text, 'Features?')` → passive feat items
  - Bullet-point actions (`* Name. desc` / `• Name. desc`) stripped before `ACTION_NAME_RX`
  - SR/LR recharge detection — "Recharges after a Short or Long Rest" → `period:'sr'`
  - UI badges: `(Short Rest)` in green, `(Long Rest)` in violet
- [x] Saves regex — colon optional, `Saving Throws?` plural form added

### Phase 8 — Sidekick PC Sheet (Future)
**Decision:** Sidekicks that level with the party should use `type:'character'` (PC actor),
not `type:'npc'`. NPC sheets lack level progression, ASI choices, class feature unlocks,
and the full SR/LR rest workflow. This requires a separate output branch and is scoped to Phase 8.

**What Phase 8 needs:**
- PC actor JSON schema research (export reference from user)
- `type:'character'` actor output when sidekick format detected
- Class + level fields (`system.classes`, `system.details.level`)
- XP threshold tracking (`system.details.xp` with both value and max)
- SR/LR rest button works natively on PC sheets — no workaround needed
- Create `SIDEKICK_FORMAT.md` spec document

**Reference:** User can export a Foundry PC sheet for schema comparison when Phase 8 begins.

### Remaining Phase 7
- [ ] Documentation pass — VERSION_HISTORY.md, README.md updates

---

*Update this document at the end of each Phase 7 session.*
