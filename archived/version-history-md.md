# Version History

## Version 1.3 - Foundry VTT Compatible (Current)
**Release Date:** December 10, 2024  
**Status:** Stable - Production Ready

### Major Changes
- **Complete JSON Structure Overhaul** - Rebuilt entire Foundry Actor format to match v3.3+ specification
- **Abilities Restructure** - Added proficient flags, bonuses, check/save roll objects
- **Skills Simplification** - Removed redundant fields, Foundry calculates bonuses
- **Movement Parsing** - Added speed extraction for walk, climb, fly, swim, burrow
- **Size Code Mapping** - Proper conversion to Foundry's internal size codes

### New Features
- Speed parsing from stat block
- Language text cleanup (removes parenthetical notes)
- Proper size code conversion (tiny, sm, med, lg, huge, grg)
- All required Foundry v3.3+ fields included

### Bug Fixes
- Fixed size field using wrong format
- Fixed abilities missing proficiency data
- Fixed skills missing proper structure
- Fixed saves not integrating with abilities

### Breaking Changes
- JSON output structure completely changed
- Old v1.2 exports will not import correctly
- Must use v1.3 for Foundry VTT compatibility

---

## Version 1.2 - AC & HP Formula Fixed
**Release Date:** December 10, 2024  
**Status:** Deprecated (Use v1.3)

### Changes
- **AC Formula Parsing** - Now captures armor type (e.g., "natural armor")
- **HP Formula Parsing** - Extracts dice formula (e.g., "2d6 + 2")
- **Field Editor Fixes** - Editor now properly updates JSON output

### Bug Fixes
- AC not exporting with armor type
- HP formula not being captured
- Field editor not saving changes to JSON

---

## Version 1.1 - Field Editor Added
**Release Date:** December 9, 2024  
**Status:** Deprecated

### Changes
- **Field Editor Implementation** - Click edit icon to modify any parsed field
- **Visual Indicators** - Green "exact" vs gray "default" badges
- **Save/Cancel** - Inline editing with save/cancel buttons
- **All Fields Editable** - Name, AC, HP, CR, Size, Type, Alignment, Senses, Languages

### New Features
- Show/Hide Field Editor toggle button
- Color-coded method badges (exact/default)
- Real-time field editing
- Parsing stats preservation during edits

---

## Version 1.0 - Stable Release
**Release Date:** December 8, 2024  
**Status:** Deprecated

### Changes
- **Parse Analytics** - Accuracy percentage display
- **Progress Bar** - Visual accuracy indicator
- **Field Tracking** - Shows which fields parsed correctly
- **Parse Statistics** - Parsed/total fields, exact matches count

### Features
- Basic stat block parsing
- Goblin.json structure compatibility
- Download/Copy JSON functions
- Error and warning display

---

## Phase 5 (Development Versions)
**Date Range:** December 5-8, 2024

### Focus Areas
- Stats and abilities parsing
- Skills with proficiency detection
- Saving throws with proficiency
- Challenge rating extraction
- Foundry JSON structure

### Key Milestones
- Ability score modifiers calculation
- Proficiency bonus from CR
- Skill proficiency vs expertise detection
- Save proficiency detection

---

## Phase 4 (Iteration)
**Date Range:** December 3-5, 2024

### Focus Areas
- Regex pattern refinement
- Error handling improvements
- Default value system

---

## Phase 3 (Goblin.json Compatibility)
**Date Range:** December 1-3, 2024

### Focus Areas
- Matching Goblin.json structure
- Testing with known-good JSON
- Structure validation

### Key Achievement
- First successful Foundry import

---

## Phase 2 (Basic Parser)
**Date Range:** November 28-30, 2024

### Focus Areas
- Initial parsing logic
- Basic regex patterns
- JSON structure research

---

## Phase 1 (Prototype)
**Date Range:** November 25-27, 2024

### Focus Areas
- Proof of concept
- UI design
- React component setup

---

## Upcoming Versions

### Version 1.4 (Planned - Phase 6)
**Target:** Q1 2025

#### Planned Features
- Actions parsing (attacks, special abilities)
- Features parsing (traits, reactions)
- Legendary actions parsing
- Bonus actions parsing
- Damage type extraction

---

### Version 2.0 (Future - Phase 7)
**Target:** Q2 2025

#### Planned Features
- Spell list parsing
- Innate spellcasting
- Lair actions
- Regional effects
- Condition immunities
- Damage resistances/immunities/vulnerabilities

---

### Version 3.0 (Future - Phase 8)
**Target:** Q3 2025

#### Planned Features
- Batch processing (multiple stat blocks)
- AI-enhanced parsing (Claude API integration)
- Template system for homebrew
- Image/token integration
- Advanced validation

---

## Version Comparison

| Feature | v1.0 | v1.1 | v1.2 | v1.3 |
|---------|------|------|------|------|
| Basic Stats | ✅ | ✅ | ✅ | ✅ |
| Field Editor | ❌ | ✅ | ✅ | ✅ |
| AC Formula | ❌ | ❌ | ✅ | ✅ |
| HP Formula | ❌ | ❌ | ✅ | ✅ |
| Foundry v3.3+ Compatible | ❌ | ❌ | ❌ | ✅ |
| Speed Parsing | ❌ | ❌ | ❌ | ✅ |
| Proper Size Codes | ❌ | ❌ | ❌ | ✅ |
| Actions Parsing | ❌ | ❌ | ❌ | ❌ (v1.4) |

---

## Changelog Format

Each version includes:
- **Release Date** - When version was completed
- **Status** - Current status (Stable, Deprecated, Development)
- **Changes** - What was modified
- **New Features** - What was added
- **Bug Fixes** - What was fixed
- **Breaking Changes** - What might break existing usage

---

## Deprecation Policy

- Previous versions marked as deprecated when new major version releases
- Critical bugs backported for 1 version
- Documentation maintained for 2 versions back
- Current stable version always recommended