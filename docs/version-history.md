# Version History

---

## v4.3-alpha — Phase 15b (2026-04-02)

### Encounter Builder (Phase 15b)
- New Tab 3 — Encounter Builder: named encounter groups, creature quantity controls, sidebar list with rename/delete
- Party difficulty panel: set party size + level, live XP threshold bar (Easy/Medium/Hard/Deadly), colored difficulty badge
- "Add to Encounter Builder" button on parser result — sends parsed actor to active encounter
- "Send to Encounter" button on Batch Processor summary bar — sends all parsed creatures at once
- Encounter tab shows combatant count badge
- Export: Foundry macro creates actors in a named folder and loads combatants into combat tracker

### AI Custom CR Mode
- 5th input mode on Stat Block Parser: enter name + target CR + optional context
- Claude builds a stat block from scratch tuned to that exact CR (not canonical)
- Use case: beefy goblin CR 5, weakened dragon CR 8, any reskin at any power level
- Powered by `generateCustomStatBlock()` in claude-api.ts

### Architecture & UX
- All tabs stay mounted (CSS `display:none` for hidden tabs) — state preserved when switching tabs
- Batch → Encounter send uses single functional state updater — all creatures land atomically, no stale closure bug
- Clear All on Batch Processor, Reset on Stat Block Parser and Class Importer header
- Tab order: Parser → Batch → Encounter → Class → Campaign

---

## v4.3-alpha — Phase 15 / Phase 16 (2026-03-31 → 2026-04-01)

### Phase 15 — Generic Campaign Builder
- `CampaignPreset` interface added to campaign-builder-data.ts
- All four macro builders (Steps 1–4) now accept a `CampaignPreset` parameter — no more hardcoded Eldoria strings
- `campaign-eldoria-preset.ts` thin wrapper packages existing Eldoria data as `ELDORIA_PRESET`
- Campaign header banner in UI showing preset name, description, and live counts
- Sidebar driven by preset data — journal folders, actor folders, NPC tree, creatures, journals
- Campaign Builder folded into main app as Tab 5 (was a separate campaign.html page)

### Phase 16 — AI Class Assistant
- Collapsible panel above Class Definition textarea in Class Importer
- Paste any freeform class description; Claude generates a complete, ready-to-use Class Importer template
- Full format spec embedded in Claude prompt (header, scale values, level progression, feature blocks, subclass blocks)
- Collapsed state shows subtitle hint; expanded state is self-explanatory
- Powered by `generateClassTemplate()` in claude-api.ts (max_tokens: 4096)

---

## v4.3-alpha — Phase 14 / 14b / 14c (2026-03-31)

### Phase 14 — Batch AI Name Mode
- Batch Processor gains a Names mode: paste one name per line, Claude generates each sequentially
- Structured context field with help text (CR, race/type, class/role, theme, setting)
- Cancel mid-run, per-card Reroll button
- Result cards show stat summary row: CR · HP · AC · Speed · Caster Lvl · size/type

### Phase 14b — Campaign Builder Step 5
- AI generates full stat blocks for all 28 Eldoria NPC leaders
- `buildNpcContext()` strips HTML, combines race/class/CR/alignment/bio for Claude prompt
- Per-continent grouped result rows with status icon, accuracy badge, reroll button
- Step 5 macro patches existing actors in-place (update-in-place safe)

### Phase 14c — Creature Stat Blocks
- All 19 Eldoria creatures have `statText` (raw stat block)
- `buildStep4StatsMacro()` calls `parseStatBlock()` client-side and embeds full Foundry actor JSON
- Step 4 also update-in-place safe

---

## v4.2-alpha — Phase 12/13 (2026-03-xx)

### AI-Enhanced Parsing
- Image mode: upload screenshot → Claude vision → extract stat block text → parse
- URL mode: fetch page via allorigins proxy → Claude → extract → parse (static HTML only)
- Name mode: enter monster name → Claude generates canonical stat block → parse
- All three modes feed into the existing `parseStatBlock()` pipeline
- Settings modal (⚙) for API key management — stored in localStorage
- `claude-api.ts` module isolates all Anthropic SDK calls; `getClient()` swappable for backend proxy

---

## v4.1-alpha — Phase 10/11 (2026-03-xx)

### Phase 11 — Batch Processor
- Text mode: paste multiple stat blocks separated by `---`, parse all in one pass
- Summary bar: accuracy breakdown, Foundry macro export, bulk JSON download, FGU XML export

### Phase 10 — Fantasy Grounds Unity Export
- `fantasy-grounds-exporter.ts` converts parsed actor to FGU 2024 XML
- Schema: `<npc>` root, `<id-00001>` numbered entries, `<name>` + `<desc>` for actions
- Amber-colored XML panel in parser with Download/Copy buttons
- Tested: Umber Hulk successfully imported into Fantasy Grounds Unity

---

## v4.0-alpha — Phase 9 (2026-03-xx)

### Custom Class Importer
- Structured template: header block, scale values, level 1–20 progression, feature definitions, subclass blocks
- Builds: class item, feature items with Uses, subclass items, full advancement tree
- Advancements: HitPoints, ItemGrant, AbilityScoreImprovement, Trait, ScaleValue, Subclass
- Self-contained Foundry macro with UUID resolution
- Scale References panel with ready-to-copy `@scale.class.identifier` strings
- Load Example button (Technomancer homebrew)
- dnd5e 5.x schema: `hd.denomination` as string, correct spellcasting preparation schema

---

## v3.x — Phases 5–8 (core parser)

### Parsing milestones
- **v3.0** — Actions, attacks, saving throw actions, weapon/feat items, activity system (Foundry dnd5e v4.0+)
- **v3.1** — Spellcasting: slot-based (2014), innate (At Will/N/Day), dual casters, SPELL_META lookup
- **v3.2** — 2024 Monster Manual format support (combined immunity lines, frequency spellcasting, initiative field, new legendary format)
- **v3.3** — Sidekick format (Tasha's), NPC snapshot at detected level
- **v3.4** — Field editor, parse analytics with accuracy score, item preview panel
- **v3.5** — `SECSTOP` shared lookahead, `makeItemId` djb2 hash, `makeSimpleItem`/`makeSpellItem` builders

---

## Pre-v3 — Phases 1–4

- Phase 1–2: Basic stat parsing (ability scores, saves, skills, senses, CR)
- Phase 3: HP formula, speed variants, condition/damage types
- Phase 4: Foundry actor JSON output, first import tests

---

**Last updated:** 2026-04-02
**Current stable build:** v4.3-alpha (Phase 15b)
