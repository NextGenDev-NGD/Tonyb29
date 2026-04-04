# D&D 5e Parser & Campaign Tools

A browser-based toolkit that converts D&D 5e stat blocks into Foundry VTT / Fantasy Grounds actor JSON, builds homebrew classes, manages encounter collections, and imports full campaign worlds — all from a single-page app with no server required.

**Current version:** v4.5-alpha (Phase 17 Sprint 2 complete)
**Primary target:** Foundry VTT + dnd5e system v4.0+ / v5.x
**Secondary target:** Fantasy Grounds Unity (2024 schema)
**Scope:** D&D 5e only — intentionally single-system
**Status:** Active development — approaching production-ready

---

## Tabs

### Tab 1 — Stat Block Parser
Paste any D&D 5e stat block and get a Foundry-ready Actor JSON + Fantasy Grounds XML.

**Input modes:**
- **Text** — paste raw stat block text
- **Image** — upload a screenshot; Claude extracts the text via vision
- **URL** — paste a page URL; fetches and extracts stat block (static HTML only)
- **Name** — enter a monster name; Claude generates the canonical stat block from training data
- **✨ AI** — enter any name + target CR; Claude builds a fully custom stat block at exactly that CR (not canonical — great for beefy goblins, weakened dragons, reskins)

**What gets parsed:**
- Name, size, type, alignment, AC, HP (with formula), speed (all movement types)
- Ability scores — all layout formats (standard column, modifier-column, comma-separated)
- Saving throws, skills, senses, languages, initiative, CR + XP, proficiency bonus
- Damage resistances/immunities/vulnerabilities (2014 and 2024 combined-line format)
- Condition immunities, conditional resistances (nonmagical/silvered/adamantine → `custom`)
- Melee/ranged attacks → weapon items with attack activities
- Saving throw actions → feat items with save activities
- Traits, reactions, bonus actions, legendary actions, lair actions
- Recharge, N/Day, short rest, long rest recovery
- Slot-based spellcasting (2014), innate spellcasting (At Will/N/Day), 2024 frequency format, dual casters
- ~160 SRD spells auto-resolved for school + level via `SPELL_META`
- Sidekick format (Tasha's) — NPC snapshot at detected level

**Export:** Download JSON / Copy JSON / Download FGU XML / Copy FGU XML
**Add to Encounter:** Sends the parsed actor directly to the Encounter Builder

---

### Tab 2 — Batch Processor
Paste multiple stat blocks separated by `---` lines, or enter a list of names for sequential AI generation.

- **Text mode:** parse an entire bestiary page in one pass
- **Names mode:** sequential Claude generation with cancel; per-card reroll; structured context field (CR, race/type, role, theme, setting)
- Result cards show accuracy score, stat summary (CR · HP · AC · Speed · Caster Lvl · size/type), and per-card error details
- **Export:** Foundry macro (creates all actors), bulk JSON download, FGU XML, Send to Encounter (all parsed creatures at once)
- **Clear All** resets results and both input fields

---

### Tab 3 — Encounter Builder
Collect parsed creatures into named encounter groups and export a Foundry combat macro.

- Create multiple named encounters; rename/delete via sidebar
- Add creatures from the Parser ("Add to Encounter Builder") or Batch Processor ("Send to Encounter")
- Re-adding the same creature increments quantity rather than duplicating
- Per-creature quantity controls (+/−), remove button
- **Party difficulty panel:** set party size and average level; live XP budget bar showing Easy / Medium / Hard / Deadly thresholds with a colored difficulty badge
- **Copy Foundry Macro:** creates actors in a named folder and loads all combatants into the active combat tracker
- Tab badge shows total combatant count

---

### Tab 4 — Class Importer
Paste a structured class template and get a self-contained Foundry macro that creates the full class with advancements.

**Template sections:** header block (HitDie, Saves, Armor, Weapons, Skills, Spellcasting, SubclassLevel), Scale Values, Level 1–20 progression, Feature definitions, Subclass blocks

**What gets built:** class item, all feature items with Uses tracking, subclass items, HitPoints/ItemGrant/ASI/Trait/ScaleValue/Subclass advancements, folder structure in Foundry Items panel, Scale References panel for `@scale` strings

**✨ AI Class Assistant:** paste a freeform description; Claude generates a complete, ready-to-use template

---

### Tab 5 — Campaign Builder
Generate Foundry macros to import a full campaign world in 5 steps.

1. **Folders** — journal and actor folder structure
2. **Journals** — world lore entries with HTML content
3. **NPC Actors** — leader actors per continent (bio, race, class, CR, image)
4. **Creature Actors** — with full embedded stat blocks parsed client-side
5. **AI NPC Stat Blocks** — Claude generates and patches all NPC actors in-place

All macros are **update-in-place safe** — re-running updates existing actors, never duplicates. Never rename actors or folders in Foundry — rename in Campaign Builder and re-run the macro.

**Preset Management:**
- **✨ AI Generate** — describe your campaign in plain language; Claude generates a full preset
- **Import JSON** — load a previously exported `.json` preset file
- **Export JSON** — download current campaign as a `.json` backup
- **Reset** — discard edits and reload the original preset

**Campaign Editor (Phase 17):**
- Add, edit, and delete NPCs per continent via sidebar hover icons
- Add, edit, and delete creatures via sidebar hover icons
- All changes auto-save to localStorage — survive page refresh and browser close
- Export JSON regularly as a manual backup

**Architecture:** generic `CampaignPreset` interface; default preset is Eldoria: Echoes of the Aether (7 continents, 28 NPC leaders, 19 creatures).

---

## Development

```bash
npm install
nohup npx vite --port 3000 > /tmp/vite-fresh.log 2>&1 &
```

**Access from Windows (WSL2):**
- `http://localhost:3000` (if WSL2 port mirroring active)
- `http://172.26.183.195:3000` (WSL2 VM IP — may change on reboot)

**WSL2 port forwarding (PowerShell as Admin):**
```powershell
$wslIp = (wsl hostname -I).Trim().Split()[0]
netsh interface portproxy reset
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=3000 connectaddress=$wslIp connectport=3000
```

> **WSL2 note:** HMR unreliable on `/mnt/c/`. Kill and restart Vite after changes. Check: `strings /tmp/vite-fresh.log | grep -E "Local:|error"`

---

## Project Structure

```
/
├── src/
│   └── App.tsx                          # Tab host — all 5 tabs, encounter state, callbacks
├── parser-versions/
│   ├── dnd-parser-v20-stable.tsx        # Core parser + StatBlockParser component
│   ├── class-importer.tsx               # Class Importer + AI Class Assistant
│   ├── batch-processor.tsx              # Batch Processor + AI Name Mode
│   ├── encounter-builder.tsx            # Encounter Builder
│   ├── campaign-builder.tsx             # Campaign Builder UI
│   ├── campaign-builder-data.ts         # CampaignPreset interface + Eldoria data + macro builders
│   ├── campaign-eldoria-preset.ts       # ELDORIA_PRESET thin wrapper
│   ├── claude-api.ts                    # Anthropic SDK — all AI calls isolated here
│   ├── fantasy-grounds-exporter.ts      # FGU 2024 XML formatter
│   └── settings-modal.tsx              # API key management
├── campaign/
│   └── Echoes of the Aether/           # Raw campaign source files
├── docs/
│   └── version-history.md              # Full version history
├── vite.config.ts
└── README.md
```

---

## Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| 9 | Custom Class Importer | ✅ Complete |
| 10 | Fantasy Grounds Unity export | ✅ Complete |
| 11 | Batch Processor | ✅ Complete |
| 12/13 | OCR + AI-enhanced parsing (image/URL/name) | ✅ Complete |
| 14 | Batch AI Name Mode + reroll | ✅ Complete |
| 14b/c | Campaign Builder AI NPCs + creature stat blocks | ✅ Complete |
| 15 | Generic CampaignPreset architecture | ✅ Complete |
| 15b | Encounter Builder + AI Custom CR mode + difficulty | ✅ Complete |
| 15c | AI Campaign Generator + Import/Export JSON | ✅ Complete |
| 16 | AI Class Assistant | ✅ Complete |
| 17 Sprint 1 | Campaign editor — localStorage, add/edit/delete NPCs & creatures | ✅ Complete |
| 17 Sprint 2 | Campaign editor — add/edit/delete continents & journals | ✅ Complete |
| 18 | Magic Item Creator — Tab 6 | 🔜 Next |
| — | UI/UX design pass + color scheme | 🔜 Planned |
| — | Hosting + account/monetization system | 🔜 Planned |
| — | Roll20 export | Deferred |

---

## Known Limitations

- Spell descriptions are empty — items created by name; link to compendium in Foundry manually
- Spells not in `SPELL_META` have blank school and level 0 with a named warning
- URL import works on static HTML only (D&D Beyond / GMBinder are JS-rendered — not supported)
- FGU export targets 2024 schema only
- Campaign Builder editor covers NPCs and creatures — continent and journal editing coming in Phase 17 Sprint 2
- API key stored in `localStorage` — will move to backend proxy for hosted version
