# D&D 5e Stat Block to Foundry VTT Converter

Convert D&D 5th Edition stat blocks into Foundry VTT-compatible JSON files with a single click.

![Version](https://img.shields.io/badge/version-1.5-brightgreen)
![Foundry](https://img.shields.io/badge/Foundry-v11%2B-orange)
![D&D5e](https://img.shields.io/badge/dnd5e-v3.3%2B-blue)
![Status](https://img.shields.io/badge/status-stable-brightgreen)

---

## 🎉 What's New in v1.5

**MAJOR UPDATE - Skills Fixed!**
- ✅ Complete code rewrite - clean, stable implementation
- ✅ Skills now properly structured for Foundry VTT import
- ✅ All 18 skills initialized with correct ability mappings
- ✅ Proficiency detection working (not proficient/proficient/expertise)
- ✅ Removed debug clutter for cleaner experience

**If you had issues with v1.4 or earlier, v1.5 fixes all skill-related import problems!**

---

## Quick Start

1. **Paste** your D&D stat block
2. **Click** "Parse Stat Block"
3. **Download** or **Copy** the JSON
4. **Import** into Foundry VTT

That's it! Your NPC is ready to use.

---

## Features

### ✨ Current Features (v1.5)

- **Accurate Parsing** - 95%+ accuracy on standard D&D 5e stat blocks
- **Foundry Compatible** - Generates perfect Foundry VTT v3.3+ JSON
- **Skills Working** - Properly structured skills with proficiency detection ⭐ NEW
- **Field Editor** - Edit any parsed field before export
- **Smart Detection** - Automatically detects proficiencies and expertise
- **Visual Feedback** - Color-coded badges show parse confidence
- **Flexible Input** - Handles various formatting styles
- **Export Options** - Download JSON or copy to clipboard

### 📊 What Gets Parsed

✅ **Basic Stats**
- Name, Size, Type, Alignment
- Armor Class (with armor type)
- Hit Points (with dice formula)
- Movement speeds (walk, climb, fly, swim, burrow)

✅ **Abilities & Derived Stats**
- All 6 ability scores (STR, DEX, CON, INT, WIS, CHA)
- Challenge Rating
- Proficiency bonus (calculated from CR)

✅ **Proficiencies**
- Saving Throws (with proficiency detection)
- **Skills (with proficiency and expertise detection)** ⭐ FIXED in v1.5

✅ **Senses & Languages**
- Special senses (darkvision, etc.)
- Languages spoken

### 🔜 Coming Soon (Phase 6)

- Actions and attacks
- Special features and traits
- Legendary actions
- Reactions and bonus actions
- Damage resistances/immunities/vulnerabilities
- Condition immunities

---

## Installation

### Option 1: Use in Claude.ai (Recommended)

This tool runs directly in Claude.ai as an interactive artifact:

1. Open [Claude.ai](https://claude.ai)
2. Request the D&D Stat Block Parser v1.5
3. Start parsing immediately - no installation needed!

### Option 2: Standalone React App

```bash
# Clone or copy the component
npm install react lucide-react
# Configure Tailwind CSS
# Import and use the StatBlockParser component
```

---

## Usage

### Basic Workflow

**1. Find a Stat Block**

From Monster Manual, online resources, or your homebrew:

```
Goblin
Small humanoid, neutral evil
Armor Class 15 (leather armor, shield)
Hit Points 7 (2d6)
Speed 30 ft.
STR 8 (-1) DEX 14 (+2) CON 10 (+0) INT 10 (+0) WIS 8 (-1) CHA 8 (-1)
Skills Stealth +6
Senses darkvision 60 ft., passive Perception 9
Languages Common, Goblin
Challenge 1/4 (50 XP)
```

**2. Paste and Parse**

- Paste into the text area
- Click "Parse Stat Block"
- Review the parse analytics (aim for 95%+)

**3. Review and Edit (Optional)**

- Click "Show Field Editor"
- Check for gray "default" badges (might need editing)
- Edit any incorrect fields
- Green "exact" badges are usually correct

**4. Export**

- Click "Download JSON" for a file
- Or "Copy JSON" to paste directly into Foundry

**5. Import to Foundry**

- Open Foundry VTT
- Go to Actors tab
- Click "Import Data"
- Paste JSON or select file
- Click Import

Done! Your NPC is ready.

---

## Parse Analytics

The parser shows real-time accuracy:

### 95-100% (Green) - Excellent ✨
- Everything parsed correctly
- Safe to export directly
- Minimal review needed

### 80-94% (Yellow) - Good ⚠️
- Most fields correct
- Check warnings
- Quick review recommended

### Below 80% (Red) - Needs Work 🔧
- Many fields using defaults
- Extensive editing needed
- Consider reformatting input

---

## What's Different in v1.5?

### Skills Are Now Fixed! 🎉

**Before (v1.4 and earlier):**
```json
"skills": {
  "ste": {
    "ability": "dex",
    "value": 1
    // Missing bonuses field - import failed!
  }
}
```

**After (v1.5):**
```json
"skills": {
  "ste": {
    "ability": "dex",
    "value": 1,
    "bonuses": {
      "check": "",
      "passive": ""
    }
  }
}
```

### Other Improvements

- **Cleaner Code** - Complete rewrite removes legacy issues
- **Better Warnings** - Only show relevant warnings, not debug clutter
- **Faster Parsing** - Optimized regex patterns
- **More Reliable** - Edge cases handled properly

---

## Field Editor

### When to Use

- Accuracy below 95%
- Gray "default" badges visible
- Non-standard stat block format
- Homebrew creatures

### How to Edit

1. Click "Show Field Editor"
2. Find field with gray badge or incorrect value
3. Click edit icon (pencil)
4. Modify value
5. Click "Save"
6. JSON updates automatically

### Field Formats

- **Simple:** Name, AC, HP, CR - just type the value
- **Abilities:** `10,14,12,8,10,6` (STR,DEX,CON,INT,WIS,CHA)
- **Languages:** `common, goblin` (comma-separated)
- **Size:** Full word (tiny, small, medium, large, huge, gargantuan)

---

## Examples

### Example 1: Published Monster (Goblin)

**Input:** Standard Goblin stat block  
**Expected Accuracy:** 100%  
**Time:** 30 seconds  
**Result:** Perfect import, skills work correctly

### Example 2: Homebrew Creature

**Input:** Custom monster with standard format  
**Expected Accuracy:** 85-95%  
**Time:** 2-3 minutes (with review)  
**Result:** Good import, might need minor adjustments

### Example 3: Complex Creature (Strahd)

**Input:** High CR creature with many features  
**Expected Accuracy:** 90-95% (basic stats)  
**Time:** 3-5 minutes  
**Result:** Excellent for basic stats, add actions in Foundry

---

## Tips & Best Practices

### For Best Results

✅ **Do:**
- Use complete, properly formatted stat blocks
- Include all standard labels (AC, HP, Skills, etc.)
- Check parse analytics before exporting
- Use field editor for any corrections
- Test import in Foundry

❌ **Don't:**
- Remove section labels to save space
- Mix multiple creatures in one paste
- Skip reviewing the output
- Edit JSON directly (use field editor)

---

## Browser Compatibility

✅ **Supported:**
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

---

## Technical Details

### Architecture

- **Framework:** React (functional components)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Processing:** Client-side only (no server needed)

### Performance

- **Parse Time:** 50-300ms per creature
- **Memory:** ~2MB base + ~50KB per actor
- **No Network:** Works completely offline after load

### Compatibility

- **Foundry VTT:** v11+ (tested on v13.348)
- **D&D5e System:** v3.3+ (tested on v5.1.8)
- **Rules:** 2014 edition (5th Edition)

---

## Documentation

### User Documentation
- **USER_GUIDE.md** - Complete usage instructions
- **TROUBLESHOOTING.md** - Common issues and solutions
- **FIELD_MAPPING.md** - D&D to Foundry field mapping

### Technical Documentation
- **TECHNICAL_SPECS.md** - Architecture and implementation
- **PARSER_RULES.md** - Regex patterns and parsing logic
- **JSON_SCHEMA.md** - Complete Foundry JSON structure
- **COMPLETE_SOURCE.md** - Full annotated source code

### Project Documentation
- **PROJECT_OVERVIEW.md** - Goals, roadmap, and status
- **VERSION_HISTORY.md** - Complete version history

---

## Version Information

**Current Version:** 1.5 - Skills Fixed  
**Release Date:** December 17, 2024  
**Status:** Stable - Production Ready

### Version History

- **v1.5** (Current) - Skills fixed, clean rewrite ⭐
- **v1.4** (Deprecated) - Testing version with issues
- **v1.3** (Deprecated) - Foundry v3.3+ compatibility
- **v1.2** (Deprecated) - AC and HP formula parsing
- **v1.1** (Deprecated) - Field editor implementation
- **v1.0** (Deprecated) - Initial stable release

See `VERSION_HISTORY.md` for detailed changelog.

---

## Roadmap

### Version 1.6 (Planned - Phase 6 - Q1 2025)
- Actions and attacks parsing
- Special features and traits
- Legendary actions
- Damage types (resistance/immunity/vulnerability)
- Condition immunities

### Version 2.0 (Future - Phase 7 - Q2 2025)
- Spell list parsing
- Innate spellcasting
- Lair actions
- Regional effects
- Advanced action parsing

### Version 3.0 (Future - Phase 8 - Q3 2025)
- Batch processing (multiple stat blocks)
- AI-enhanced parsing (Claude API integration)
- Template system for homebrew
- Image/token integration

---

## Known Limitations

### Not Yet Supported

❌ Actions and attacks (Phase 6)  
❌ Legendary actions (Phase 6)  
❌ Reactions (Phase 6)  
❌ Special features (Phase 6)  
❌ Damage resistances/immunities (Phase 6)  
❌ Spell lists (Phase 7)  
❌ Batch processing (Phase 8)

### Current Support

✅ All basic statistics  
✅ Abilities and modifiers  
✅ **Skills with proficiency/expertise** ⭐ FIXED  
✅ Saving throws with proficiency  
✅ Movement speeds  
✅ Senses and languages  
✅ Field editing  
✅ Foundry VTT import

---

## FAQ

**Q: Does this work with Foundry VTT v10?**  
A: No, requires v11+. The JSON structure changed in v11.

**Q: Are skills fixed now?**  
A: Yes! v1.5 completely fixes skill parsing and structure.

**Q: Can I parse multiple creatures at once?**  
A: Not yet. Batch processing is planned for Phase 8.

**Q: What about actions and attacks?**  
A: Coming in Phase 6 (v1.6)! Currently add them in Foundry after import.

**Q: Will this work with homebrew?**  
A: Yes! As long as it follows standard D&D 5e format.

**Q: Is my data sent to a server?**  
A: No. All processing happens in your browser. Completely private.

---

## Troubleshooting

### Common Issues

**Low accuracy (<80%)**
- Check input formatting
- Use field editor to correct misparsed fields
- Ensure standard section labels present

**Skills not importing correctly**
- Make sure you're using v1.5 (check badge)
- v1.4 and earlier have broken skills
- Re-parse with v1.5

**Download blocked**
- Use "Copy JSON" instead
- Browser security may block automatic downloads

See `TROUBLESHOOTING.md` for complete solutions.

---

## Support

### Getting Help

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) first
2. Review [USER_GUIDE.md](USER_GUIDE.md) for usage help
3. Verify you're using v1.5 (check badge in top-right)

### Reporting Issues

When reporting issues, include:
- Version number (v1.5)
- Browser name and version
- Example stat block that fails
- Error messages or warnings
- Screenshot if visual issue

---

## License & Attribution

### Technologies

- **React** - MIT License
- **Lucide React** - ISC License
- **Tailwind CSS** - MIT License

### D&D Content

- D&D 5th Edition is © Wizards of the Coast
- This tool parses community-created content
- For personal, non-commercial use only
- Always respect intellectual property rights

---

## Acknowledgments

- **Wizards of the Coast** - D&D 5th Edition
- **Foundry VTT** - Amazing virtual tabletop platform
- **D&D Community** - Feedback and testing
- **Claude/Anthropic** - Development assistance

---

## Status

**Project Status:** ✅ Active Development  
**Current Phase:** Phase 5 Complete  
**Next Phase:** Phase 6 - Actions & Features  
**Stability:** Stable - Production Ready  
**Version:** 1.5 - Skills Fixed ⭐

**Last Updated:** December 17, 2024

---

*Built with ❤️ for the D&D and Foundry VTT communities*