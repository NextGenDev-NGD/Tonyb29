# D&D 5e Stat Block to Foundry VTT Converter

## Project Overview

### Purpose
This application converts D&D 5th Edition stat blocks (text format) into Foundry VTT-compatible JSON files that can be directly imported as NPC actors.

### Version
**Current Version:** 1.3 - Foundry VTT Compatible

### Project Goals
1. **Accurate Parsing** - Extract all relevant data from D&D stat blocks with 95%+ accuracy
2. **Foundry Compatibility** - Generate JSON files that import seamlessly into Foundry VTT v3.3+
3. **User-Friendly** - Provide visual feedback, field editing, and error handling
4. **Flexible Input** - Handle various stat block formats (newline-separated, space-separated)

### Key Features

#### Core Functionality
- **Text-to-JSON Conversion** - Parse D&D stat blocks into Foundry VTT Actor JSON format
- **Field Detection** - Automatically extract:
  - Name, Size, Type, Alignment
  - Armor Class (with armor type)
  - Hit Points (with dice formula)
  - Ability Scores (STR, DEX, CON, INT, WIS, CHA)
  - Challenge Rating
  - Saving Throws (with proficiency detection)
  - Skills (with proficiency/expertise detection)
  - Movement speeds (walk, climb, fly, swim, burrow)
  - Senses (darkvision, blindsight, etc.)
  - Languages

#### User Interface
- **Parse Analytics** - Real-time accuracy percentage and field breakdown
- **Field Editor** - Edit any parsed field before export
- **Visual Indicators** - Color-coded badges showing exact vs. default values
- **Export Options** - Download JSON or copy to clipboard
- **Error/Warning System** - Clear feedback on parsing issues

#### Advanced Features
- **Proficiency Calculation** - Automatically calculates proficiency bonuses from CR
- **Skill Detection** - Identifies normal proficiency vs. expertise
- **Flexible Parsing** - Works with both formatted and continuous text stat blocks
- **Size Code Mapping** - Converts size names to Foundry's internal codes

### Technology Stack
- **Framework:** React (Functional Components with Hooks)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Export:** Browser download API and Clipboard API

### Development Timeline

#### Phase 1-3 (Early Development)
- Initial parser development
- Basic Foundry JSON structure
- Goblin.json compatibility testing

#### Phase 4 (Iteration)
- Refined parsing logic
- Added field tracking

#### Phase 5 v1.0-1.1 (Stability)
- Skills and abilities parsing
- Field editor implementation
- Parse analytics

#### Phase 5 v1.2 (Fixes)
- AC formula parsing
- HP dice formula extraction
- Improved regex patterns

#### Phase 5 v1.3 (Current - Foundry Compatible)
- Complete Foundry VTT structure overhaul
- Proper ability/save/skill format
- Movement speed parsing
- Size code mapping
- Language cleanup

### Target Users
- **Dungeon Masters** - Running Foundry VTT campaigns
- **Content Creators** - Converting homebrew monsters
- **Module Developers** - Batch importing NPCs

### Future Roadmap

#### Phase 6 (Planned)
- **Actions & Features** - Parse special abilities, attacks, legendary actions
- **Damage Types** - Extract resistances, immunities, vulnerabilities
- **Condition Immunities** - Parse condition immunity text
- **Multiattack** - Parse complex attack patterns

#### Phase 7 (Future)
- **Spell Parsing** - Extract innate spellcasting and spell lists
- **Lair Actions** - Parse lair action text
- **Regional Effects** - Extract regional effect descriptions
- **Item Integration** - Create weapon/armor items from attacks

#### Phase 8 (Advanced)
- **Batch Processing** - Parse multiple stat blocks at once
- **Template System** - Save common patterns for homebrew
- **AI Enhancement** - Use Claude API for complex parsing
- **Image Integration** - Token art suggestions

### Known Limitations
- Does not parse actions/attacks yet (Phase 6)
- Does not extract damage resistances/immunities (Phase 6)
- Cannot parse spell lists (Phase 7)
- Single stat block only (no batch processing)

### Success Criteria
✅ Accurate parsing of basic stats (95%+ accuracy)
✅ Foundry VTT v3.3+ compatible JSON structure
✅ User-editable fields for corrections
✅ Working import into Foundry VTT
🔲 Actions and features parsing (Phase 6)
🔲 Complete monster stat block support (Phase 7)

### Project Status
**Status:** Active Development - Phase 5 Complete, Phase 6 Ready to Begin

**Last Updated:** December 2024

**Stability:** Stable - Ready for production use with basic stat blocks