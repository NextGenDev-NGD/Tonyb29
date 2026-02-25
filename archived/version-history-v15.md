# Version History

## Version 1.5 - Skills Fixed (Current - STABLE)
**Release Date:** December 17, 2024  
**Status:** Stable - Production Ready

### Major Changes
- **Complete Code Rewrite** - Clean implementation removing all legacy code from v1.2-1.4
- **Skills Structure Fixed** - Proper Foundry VTT skill object structure with all required fields
- **Proficiency Detection Improved** - More accurate detection of proficiency vs expertise
- **Simplified JSON Output** - Streamlined structure focusing on core fields that work

### New Features
- All 18 skills properly initialized with correct ability mappings
- Skills include proper `ability`, `value`, and `bonuses` structure
- Proficiency values: 0 (not proficient), 1 (proficient), 2 (expertise)
- Cleaner error handling and warning system
- Removed debug warnings that cluttered output

### Bug Fixes
- **CRITICAL:** Fixed skills not having proper structure for Foundry import
- Fixed skill ability mappings not being consistent
- Fixed proficiency calculation edge cases
- Removed unnecessary fields that caused import issues

### What Works Now
✅ Basic stats (name, size, type, alignment)  
✅ AC and HP with formulas  
✅ All ability scores  
✅ Challenge Rating with proficiency calculation  
✅ Saving throws with proficiency flags  
✅ **Skills with proper structure and proficiency** ⭐ NEW  
✅ Movement speeds (walk, climb, fly, swim, burrow)  
✅ Senses and languages  
✅ Field editor for manual corrections  

---

## Version 1.4 (Deprecated - Testing Version)
**Release Date:** December 17, 2024  
**Status:** Deprecated - Had skill parsing issues

### Issues
- Skills structure incomplete
- Import errors in Foundry VTT
- Excessive debug warnings
- Legacy code causing conflicts

**Note:** Skip this version, use v1.5 instead

---

## Version 1.3 - Foundry VTT Compatible
**Release Date:** December 10, 2024  
**Status:** Deprecated (Use v1.5)

### Major Changes
- Complete JSON Structure Overhaul
- Abilities Restructure with proficiency flags
- Movement Parsing added
- Size Code Mapping

### Bug Fixes
- Fixed size field using wrong format
- Fixed abilities missing proficiency data
- Fixed saves not integrating with abilities

---

## Version 1.2 - AC & HP Formula Fixed
**Release Date:** December 10, 2024  
**Status:** Deprecated (Use v1.5)

### Changes
- AC Formula Parsing
- HP Formula Parsing
- Field Editor Fixes

---

## Version 1.1 - Field Editor Added
**Release Date:** December 9, 2024  
**Status:** Deprecated

### Changes
- Field Editor Implementation
- Visual Indicators (exact/default badges)
- Real-time field editing

---

## Version 1.0 - Stable Release
**Release Date:** December 8, 2024  
**Status:** Deprecated

### Features
- Basic stat block parsing
- Goblin.json structure compatibility
- Download/Copy JSON functions

---

## Phase 5 (Development Versions)
**Date Range:** December 5-8, 2024

### Focus Areas
- Stats and abilities parsing
- Skills with proficiency detection
- Saving throws with proficiency
- Challenge rating extraction

---

## Phase 4 (Iteration)
**Date Range:** December 3-5, 2024

### Focus Areas
- Regex pattern refinement
- Error handling improvements

---

## Phase 3 (Goblin.json Compatibility)
**Date Range:** December 1-3, 2024

### Key Achievement
- First successful Foundry import

---

## Phase 2 (Basic Parser)
**Date Range:** November 28-30, 2024

### Focus Areas
- Initial parsing logic
- Basic regex patterns

---

## Phase 1 (Prototype)
**Date Range:** November 25-27, 2024

### Focus Areas
- Proof of concept
- UI design

---

## Upcoming Versions

### Version 1.6 (Planned - Phase 6)
**Target:** Q1 2025

#### Planned Features
- Actions parsing (attacks, special abilities)
- Features parsing (traits, reactions)
- Legendary actions parsing
- Bonus actions parsing
- Damage type extraction (resistances/immunities/vulnerabilities)
- Condition immunities

---

### Version 2.0 (Future - Phase 7)
**Target:** Q2 2025

#### Planned Features
- Spell list parsing
- Innate spellcasting
- Lair actions
- Regional effects
- Advanced action parsing with attack rolls and damage

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

| Feature | v1.0 | v1.1 | v1.2 | v1.3 | v1.4 | v1.5 |
|---------|------|------|------|------|------|------|
| Basic Stats | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Field Editor | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AC Formula | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| HP Formula | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Foundry v3.3+ Compatible | ❌ | ❌ | ❌ | ✅ | ⚠️ | ✅ |
| Speed Parsing | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Proper Size Codes | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Skills Working** | ❌ | ❌ | ❌ | ⚠️ | ❌ | ✅ |
| Clean Codebase | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Actions Parsing | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (v1.6) |

---

## Critical Bug Fixes by Version

### v1.5
- ✅ **Skills structure completely fixed** - Now has proper ability, value, bonuses fields
- ✅ All 18 skills initialized correctly
- ✅ Proficiency detection working (0/1/2 values)
- ✅ Removed debug warnings cluttering output
- ✅ Clean rewrite eliminated legacy code issues

### v1.3
- ✅ Size codes mapping to Foundry format
- ✅ Abilities with proficiency flags
- ✅ Movement speeds parsed

### v1.2
- ✅ AC and HP formulas captured
- ✅ Field editor updates JSON

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
- **Current stable version always recommended: v1.5**

---

## Migration Guide

### From v1.4 or earlier to v1.5

**Why migrate:**
- v1.4 and earlier have broken skills that won't import correctly
- v1.5 is a complete rewrite with proper structure

**How to migrate:**
1. Download/update to v1.5 artifact
2. Re-parse any stat blocks from v1.4 or earlier
3. Test import in Foundry VTT
4. Skills should now appear correctly with proficiencies

**What changed:**
- Skills now have proper `ability`, `value`, `bonuses` structure
- All 18 skills properly initialized
- Cleaner JSON output
- Better error messages

---

## Known Issues

### Current (v1.5)
- None reported - stable for basic stat blocks

### Future Enhancements Needed
- Actions/attacks parsing (Phase 6)
- Legendary actions (Phase 6)
- Spell lists (Phase 7)
- Batch processing (Phase 8)

---

## Support & Feedback

If you encounter issues with v1.5:
1. Verify you're using the latest artifact version (check badge in top-right)
2. Check that your stat block follows standard D&D 5e format
3. Use field editor to correct any misparsed fields
4. Report persistent issues with example stat block

---

**Last Updated:** December 17, 2024  
**Current Stable Version:** 1.5  
**Next Planned Version:** 1.6 (Phase 6 - Actions)