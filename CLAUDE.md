# CLAUDE.md — D&D Stat Block Parser

This file provides guidance for AI assistants working on this codebase.

---

## Project Overview

**Name:** dnd-statblock-parser
**Version:** 2.0.0-alpha.1 (Phase 6 — Actions & Features)
**Purpose:** A client-side React/TypeScript web application that converts D&D 5e stat blocks (pasted as text) into Foundry VTT-compatible JSON files.

All parsing is done entirely in the browser — no server, no API calls.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (TSX) |
| Framework | React 18.3.1 (functional components + Hooks) |
| Build Tool | Vite 5.2.0 |
| Package Manager | npm |
| Styling | Tailwind CSS 3.4.3 via PostCSS |
| Icons | Lucide React 0.344.0 |
| Target Runtimes | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ |

---

## Repository Structure

```
/
├── src/                              # Application entry points
│   ├── App.tsx                       # Root component (imports parser)
│   ├── main.tsx                      # React DOM mount with StrictMode
│   └── index.css                     # Tailwind CSS directives only
│
├── parser-versions/                  # All parser implementations
│   ├── dnd-parser-v20-alpha1-clean.tsx   # CURRENT PRODUCTION PARSER
│   ├── dnd-parser-v20-alpha1.tsx         # Extended variant
│   ├── dnd-parser-v20-alpha2.tsx         # Experimental v2
│   ├── dnd-stat-parser-v15.tsx           # Previous stable (v1.5)
│   ├── dnd-stat-parser-v12.tsx           # Older version
│   ├── dnd-parser-v16-beyond.tsx         # D&D Beyond format variant
│   ├── phase1_stat_block_converter.tsx   # Phase 1 implementation
│   ├── phase5_stable_rebuild.tsx         # Phase 5 stable rebuild
│   ├── phase5_stats_abilities_stable.tsx # Phase 5 variant
│   └── metadata-generator.tsx            # Metadata extraction utility
│
├── validaton-scripts/                # Testing and validation
│   ├── test-harness.tsx              # Test runner framework
│   └── json-validator.tsx            # JSON output validation
│
├── test-cases/verfied-working/       # Verified test data
│   ├── simple/                       # e.g., Goblin
│   ├── complex/                      # e.g., Aboleth, Adult Green Dragon
│   └── legendary/                    # e.g., Strahd
│
├── docs/                             # Comprehensive developer documentation
│   ├── complete-source-md.md         # Annotated source code
│   ├── field-mapping-md.md           # D&D → Foundry field mappings
│   ├── json-schema-md.md             # Full Foundry JSON schema
│   ├── parser-rules-md.md            # All regex patterns and parsing rules
│   ├── technical-specs-md.md         # Architecture details
│   ├── user-guide-md.md              # End-user documentation
│   ├── troubleshooting-md.md         # Common issues and solutions
│   ├── version-history-v16.md        # Version history from v1.6+
│   ├── code-preservation-guide.md    # Code preservation strategy
│   └── phase6-gap-analysis.md        # Phase 6 gap analysis
│
├── archived/                         # Previous phase documents
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── save.sh                           # Git commit/push helper
├── readme-md.md                      # Extended feature documentation
└── README.md
```

---

## Development Commands

```bash
# Start development server (opens browser at http://localhost:3000)
npm run dev

# Production build (outputs to dist/)
npm run build

# Preview production build locally
npm run preview
```

There is no linter, formatter, or test runner configured in npm scripts. TypeScript strict mode is **disabled** (`strict: false`, `noImplicitAny: false` in tsconfig.json).

---

## Git Workflow

A helper script exists for quick saves:

```bash
./save.sh "your commit message"   # git add -A && git commit -m "..." && git push
```

Remote: `http://local_proxy@127.0.0.1:58774/git/NextGenDev-NGD/Tonyb29`

---

## Core Architecture: How the Parser Works

### Data Flow

```
User pastes stat block text
        ↓
parseStatBlock() called on "Parse" click
        ↓
Sequential regex extraction of each field
        ↓
Build FoundryActor JSON object
        ↓
Display: JSON output + Accuracy stats + Field Editor
        ↓
User downloads or copies JSON
```

### Parsing Strategy

The parser uses a **fallback chain** pattern: for each field, multiple regex patterns are tried in sequence until one matches. If nothing matches, a safe default is used.

Fields are parsed in this order:
1. Name → Size → Type → Alignment
2. AC → HP (with formula)
3. Speed (walk, fly, climb, swim, burrow)
4. Ability Scores (6 abilities with modifiers)
5. CR → Proficiency Bonus (calculated from CR)
6. Saving Throws (with proficiency detection)
7. Skills (18 skills with proficiency/expertise detection)
8. Damage Immunities / Resistances / Vulnerabilities
9. Condition Immunities
10. Senses → Languages → Initiative
11. Actions (attack, reach, range, damage parsing)

### Key Helper Functions

```typescript
mod(score: number): number          // Ability modifier: Math.floor((score - 10) / 2)
crToFloat(cr: string): number       // Convert "1/2", "1/4", "1/8" → 0.5, 0.25, 0.125
profBonusFromCR(cr: string): number // Calculate proficiency bonus from CR
extractDamageTypes(text: string)    // Extract damage type keywords
extractConditionTypes(text: string) // Extract condition immunity keywords
parseActions(text: string)          // Parse Actions section with attack/damage details
```

### TypeScript Interfaces

```typescript
interface ParseStats {
  parsed: number;    // Successfully parsed fields
  total: number;     // Total fields attempted
  exact: number;     // Fields matched exactly (vs. defaulted)
  accuracy: number;  // Percentage (0–100)
  fields: Array<{
    name: string;
    value: string;
    method: 'exact' | 'default';
  }>;
}

interface FoundryActor {
  name: string;
  type: 'npc';
  system: {
    abilities: Record<string, { value: number; proficient: number }>;
    attributes: { ac; hp; init; movement; senses };
    details: { alignment; type; cr; biography };
    traits: { size; languages; di; dr; dv; ci };
    skills: Record<string, { ability; value; bonuses }>;
  };
  items: Array<...>;   // Weapon items extracted from Actions section
  effects: [];
  flags: {};
}
```

---

## Conventions

### React Style

- **Functional components only** — no class components
- **Hooks only** — `useState`, `useCallback`, etc.
- **No global state library** — all state lives in the single root parser component
- **No external UI component library** — custom Tailwind-based UI

### Parsing Style

- All parsing done with **native JavaScript regex** — no parsing libraries
- **Case-insensitive patterns** — use `i` flag consistently
- **Non-breaking fallbacks** — every field has a safe default value
- **Track every field** — accuracy metrics must be updated when adding new fields
- **Dual-format support** — patterns should handle both D&D 2014 and 2024 stat block formats

### Parse Accuracy Targets

| Score | Quality |
|---|---|
| 95%+ | Excellent |
| 80–94% | Good |
| 60–79% | Needs improvement |
| < 60% | Poor — investigate |

### Error Handling

- Empty input → blocking error shown to user
- Missing sections (e.g., no Actions block) → non-blocking warning
- Main `parseStatBlock()` is wrapped in try/catch
- Parse metrics always displayed so user can see confidence level

---

## Current Development Status (as of v2.0-alpha.1)

**Phase 6 — Actions & Features (In Progress)**

- Sprint 1: Basic actions parsing — ~70% complete
- Sprint 2: Damage & multiattack — planned
- Sprint 3: Special features (Legendary Actions, Lair Actions, Reactions) — planned

**Known Bug:** Save proficiency flag not being set correctly.

**Previous stable version:** v1.5 — complete skill parsing, abilities, saving throws, all immunities/resistances.

---

## Key Reference Documents

When implementing new parsing features, consult these docs in `docs/`:

- **`parser-rules-md.md`** — All existing regex patterns; update when adding new ones
- **`field-mapping-md.md`** — How D&D fields map to Foundry VTT JSON fields
- **`json-schema-md.md`** — Complete Foundry VTT JSON schema reference
- **`technical-specs-md.md`** — Architecture decisions and implementation details
- **`phase6-gap-analysis.md`** — What features still need to be built

---

## Testing

Test cases live in `test-cases/verfied-working/` with paired `.txt` (input) and `.json` (expected output) files.

The test harness in `validaton-scripts/test-harness.tsx` loads test cases, runs the parser, compares outputs, and reports pass/fail with metrics. There is no automated test runner hooked up to npm — tests are run manually.

When making parser changes:
1. Verify existing test cases still pass (simple → complex → legendary)
2. Add a new test case if fixing a specific creature format
3. Target 95%+ parse accuracy on the test cases

---

## Foundry VTT Compatibility

- **Foundry VTT:** v11+ (System: D&D 5e v3.3+)
- Output is a JSON file that can be imported directly as an NPC actor
- The `items` array contains weapon/attack items extracted from the Actions section

---

## What NOT to Do

- Do not add a server or backend — this is intentionally a fully client-side app
- Do not enable TypeScript strict mode — it is intentionally disabled to allow pragmatic development
- Do not refactor the parser-versions directory — old versions are preserved for reference
- Do not modify archived documents — they are historical records
- Do not break the dual-format 2014/2024 stat block support introduced in commit `6a3932e`
