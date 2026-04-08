# Troubleshooting Guide

## Common Issues & Solutions

---

## Parsing Issues

### Issue: Parser shows low accuracy (below 80%)

**Symptoms:**
- Many fields showing "default" instead of "exact"
- Warnings about missing fields
- Yellow warning boxes

**Common Causes:**
1. Stat block not in standard D&D 5e format
2. Missing section labels (Skills, Senses, etc.)
3. Non-standard formatting

**Solutions:**
1. Check that stat block has standard labels:
   - "Armor Class" or "AC"
   - "Hit Points" or "HP"
   - "Skills", "Saving Throws", "Senses", "Languages"
2. Use field editor to manually correct any misparsed fields
3. Ensure there's spacing between sections
4. Add missing labels if copying from abbreviated sources

---

### Issue: Abilities not parsing correctly

**Symptoms:**
- Shows "Abilities not found, using 10s"
- All ability scores are 10

**Common Causes:**
1. Abilities not in "STR ## DEX ## CON ## INT ## WIS ## CHA ##" format
2. Extra text between ability names and values
3. Modifiers interfering with parsing

**Solutions:**
1. Verify abilities are on one line or closely grouped
2. Format should be: `STR 14 DEX 16 CON 12 INT 10 WIS 8 CHA 10`
3. Or with modifiers: `STR 14 (+2) DEX 16 (+3)...`
4. Use field editor to manually enter as: `14,16,12,10,8,10`

---

### Issue: Skills showing incorrect proficiency

**Symptoms:**
- Skills marked as proficient when they shouldn't be
- Bonus doesn't match stat block

**Common Causes:**
1. Custom bonuses in stat block
2. Magic items or features adding to skills
3. CR-based proficiency calculation mismatch

**Solutions:**
1. Check if the skill bonus = ability mod + proficiency bonus
2. For CR 1-4: prof bonus = +2
3. For CR 5-8: prof bonus = +3
4. If custom bonuses exist, parser marks as proficient (Foundry will recalculate)
5. Manually adjust proficiency in Foundry after import

---

### Issue: Saving throws not parsing

**Symptoms:**
- "Saving Throws not found" or shows "none"
- Empty saves section

**Common Causes:**
1. Label is "Saves:" instead of "Saving Throws:"
2. Saves on same line as skills without clear separator
3. Missing colon after label

**Solutions:**
1. Ensure label is exactly "Saving Throws:" or "Saving Throws "
2. Add clear spacing: `Saving Throws: Dex +5, Wis +3`
3. Use field editor to manually add saves

---

### Issue: Languages showing weird text

**Symptoms:**
- Languages include parenthetical notes
- Extra text in languages field

**Example:**
```
"Common, Elvish, Infernal, languages of Barovia (others at DM's discretion)"
```

**Solutions:**
1. v1.3 automatically removes parenthetical notes
2. If still showing, manually edit in field editor
3. Final format should be: `common, elvish, infernal`

---

## Foundry Import Issues

### Issue: JSON won't import into Foundry

**Symptoms:**
- Import dialog shows error
- Actor doesn't appear after import
- Foundry console shows errors

**Common Causes:**
1. Using old version (v1.2 or earlier) - not Foundry compatible
2. JSON syntax error (corrupted file)
3. Foundry version mismatch

**Solutions:**
1. **ALWAYS USE v1.3** - Previous versions are not compatible
2. Verify you're using Foundry VTT v3.3 or higher
3. Check JSON is valid:
   - Use field editor to verify all fields
   - Download fresh copy
   - Don't manually edit JSON in text editor
4. Try importing in fresh world to rule out module conflicts

---

### Issue: Actor imports but stats are wrong

**Symptoms:**
- HP/AC showing incorrect values
- Skills not calculated correctly
- Saves missing

**Common Causes:**
1. Field editor changes not saved
2. Manual JSON edits broke structure
3. Size code incorrect

**Solutions:**
1. Always click "Save" after editing fields
2. Don't manually edit the JSON output
3. Re-parse the stat block and re-download
4. Check size is correct:
   - Small → "sm"
   - Medium → "med"
   - Large → "lg"
   - Huge → "huge"

---

### Issue: Movement speeds missing in Foundry

**Symptoms:**
- Only walk speed shows
- Climb/fly/swim missing

**Common Causes:**
1. Stat block doesn't list special movement
2. Format not recognized: "Speed 30 ft., climb 30 ft."

**Solutions:**
1. Verify stat block includes movement types
2. Format must be: `Speed 30 ft., climb 20 ft., fly 40 ft.`
3. Manually add in Foundry after import if needed
4. Use field editor (not yet editable, coming in v1.4)

---

## Field Editor Issues

### Issue: Field editor changes not applying

**Symptoms:**
- Click save but value doesn't update
- JSON still shows old value

**Common Causes:**
1. Not clicking "Save" button
2. Invalid format for field type

**Solutions:**
1. After editing, click green "Save" button (not just close)
2. Check field format:
   - **Abilities:** `10,14,12,8,10,6` (comma-separated, 6 numbers)
   - **HP/AC/CR:** Single number
   - **Languages:** `common, goblin` (comma-separated)
3. Refresh/re-download JSON after saving

---

### Issue: Can't find field to edit

**Symptoms:**
- Field shows in JSON but not in editor
- Need to edit something not listed

**Solutions:**
1. Click "Show Field Editor" button
2. Check if field is in parsing stats list
3. If not editable in editor, manually re-parse with corrections
4. Some fields (movement, damage types) not editable yet (Phase 6)

---

## Export Issues

### Issue: Download button does nothing

**Symptoms:**
- Click download, no file appears
- Browser blocks download

**Common Causes:**
1. Browser security settings
2. Pop-up blocker
3. Download folder permission issues

**Solutions:**
1. Check browser's download bar for blocked downloads
2. Allow downloads from Claude.ai
3. Use "Copy JSON" button instead:
   - Click "Copy JSON"
   - Open text editor
   - Paste (Ctrl+V)
   - Save as `.json` file
4. Try different browser (Chrome recommended)

---

### Issue: Downloaded file is corrupt

**Symptoms:**
- File won't open
- Import shows JSON error
- File size is 0 bytes

**Common Causes:**
1. Download interrupted
2. Browser extension interfering

**Solutions:**
1. Use "Copy JSON" instead of download
2. Disable ad blockers temporarily
3. Try incognito/private browsing mode
4. Verify file has `.json` extension (not `.txt`)

---

## Browser Compatibility Issues

### Issue: Parser doesn't work at all

**Symptoms:**
- Page loads but nothing happens
- Buttons don't respond
- Console errors

**Common Causes:**
1. Browser too old
2. JavaScript disabled
3. Claude.ai artifact not loading

**Solutions:**
1. Update browser to latest version
2. Enable JavaScript
3. Clear browser cache
4. Try different browser:
   - Chrome 90+
   - Firefox 88+
   - Safari 14+
   - Edge 90+

---

## Input Format Issues

### Issue: Stat block too long/complex

**Symptoms:**
- Parser takes long time
- Browser freezes
- Some sections not parsing

**Common Causes:**
1. Stat block includes full action descriptions
2. Extremely high CR creature with many features
3. Custom formatting

**Solutions:**
1. Parse basic stats first (v1.3 doesn't parse actions yet)
2. Remove action descriptions temporarily
3. Keep only standard stat block sections
4. Phase 6 will add action parsing support

---

### Issue: Copy-pasted text has formatting issues

**Symptoms:**
- Text looks correct but doesn't parse
- Invisible characters
- Line breaks in wrong places

**Common Causes:**
1. PDF copy artifacts
2. Rich text formatting
3. Smart quotes or en-dashes

**Solutions:**
1. Paste into plain text editor first (Notepad, TextEdit)
2. Copy from plain text editor to parser
3. Replace smart quotes with straight quotes
4. Replace em-dashes (—) with regular dashes (-)
5. Ensure line breaks are consistent

---

## Specific Stat Block Issues

### Issue: Strahd or other complex creatures

**Known Issues:**
- Very high CR (20+) may have calculation edge cases
- Multiple forms (mist, bat) only parse one speed set
- Legendary creatures (Phase 6 will add support)

**Current Workarounds:**
1. Parse base form only
2. Manually add legendary actions in Foundry
3. Use field editor for any misparsed values
4. Wait for Phase 6 for full legendary support

---

### Issue: Homebrew creatures

**Known Issues:**
- Custom types default to "humanoid"
- Custom abilities or features not supported
- Non-standard stat blocks may parse poorly

**Solutions:**
1. Use field editor to set correct type
2. Add custom features in Foundry after import
3. Ensure stat block follows standard D&D 5e format
4. Use standard section labels

---

## Getting Help

### Information to Provide

When reporting issues, include:
1. **Version** - v1.3 (check badge in top right)
2. **Browser** - Name and version
3. **Stat Block** - Copy of what you're trying to parse
4. **Error Message** - Any warnings or errors shown
5. **Expected vs Actual** - What you expected vs what happened
6. **Screenshot** - If visual issue

### Where to Get Help

- Check this troubleshooting guide first
- Review VERSION_HISTORY.md for known issues
- Check PARSER_RULES.md for format requirements
- Use field editor as workaround for most issues

---

## Known Limitations (v1.3)

### Not Yet Supported
- ❌ Actions and attacks (Phase 6)
- ❌ Legendary actions (Phase 6)
- ❌ Lair actions (Phase 7)
- ❌ Reactions (Phase 6)
- ❌ Special features (Phase 6)
- ❌ Damage resistances/immunities (Phase 6)
- ❌ Condition immunities (Phase 6)
- ❌ Spell lists (Phase 7)
- ❌ Batch processing (Phase 8)

### Current Support
- ✅ Basic stats (name, size, type, alignment)
- ✅ Armor Class with type
- ✅ Hit Points with formula
- ✅ Ability Scores
- ✅ Challenge Rating
- ✅ Saving Throws
- ✅ Skills (with proficiency/expertise)
- ✅ Movement speeds
- ✅ Senses
- ✅ Languages
- ✅ Field editing
- ✅ Foundry VTT v3.3+ import

---

## Performance Tips

### For Best Results
1. Use Chrome browser for best compatibility
2. Parse one creature at a time
3. Close field editor when not in use
4. Clear parser between different creatures
5. Copy JSON immediately after parsing
6. Don't edit JSON directly in output box

### If Parser is Slow
1. Remove action descriptions from input
2. Shorten very long language lists
3. Close other browser tabs
4. Refresh page and try again