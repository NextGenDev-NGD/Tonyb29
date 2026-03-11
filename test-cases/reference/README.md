# Reference Files

Foundry VTT export files used as schema reference during development.

| File | Purpose | Phase |
|---|---|---|
| `pc-sheet-reference.json` | PC actor (`type:'character'`) export — schema reference for sidekick PC output | Phase 8 |

## How to Export from Foundry
1. Open the actor sheet
2. Click the actor header menu (top-left gear/title area)
3. Export Data → saves as JSON
4. Place the file in this folder and commit

Do NOT use these files as import targets — Foundry adds many fields post-import
that don't belong in our parser output. Use them only to identify required fields
and correct schema structure.
