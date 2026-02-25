# Version History

## Version 1.6 - Phase 5.0 Complete (Current - STABLE)
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
| Phase 6 | 🚧 Starting | v2.0 | Dec 18, 2025 → Q1 2026 |
| Phase 7 | 📋 Planned | v3.0 | Q2 2026 |
| Phase 8 | 📋 Planned | v4.0 | Q3 2026 |

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

### Phase 6.0 - Actions & Features (NEXT) 🚧
- **v2.0-alpha** - Basic action parsing
- **v2.0-beta** - Legendary actions
- **v2.0** - Complete actions support

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

### Phase 6 Development Roadmap

**Sprint 1 (Week 1-2):**
- Basic action parsing (name, description)
- Attack roll detection
- Damage formula parsing

**Sprint 2 (Week 3-4):**
- Multiattack parsing
- Legendary actions
- Action types (action/bonus/reaction)

**Sprint 3 (Week 5-6):**
- Special features and traits
- Damage resistances/immunities
- Condition immunities

**Sprint 4 (Week 7-8):**
- Testing and refinement
- Documentation
- v2.0 release

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

**Last Updated:** December 18, 2025  
**Current Stable:** v1.6 (Phase 5.0 Complete)  
**Next Release:** v2.0 (Phase 6.0)  
**Status:** ✅ Phase 5 Complete, 🚧 Phase 6 Starting