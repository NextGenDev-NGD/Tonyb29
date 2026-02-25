# User Guide - D&D Stat Block Parser

## Quick Start

### Step 1: Get a Stat Block
Find a D&D 5e stat block from any source (Monster Manual, online resources, homebrew).

**Example:**
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

### Step 2: Paste the Stat Block
1. Copy your stat block
2. Click in the "Paste Stat Block" text area
3. Paste (Ctrl+V or Cmd+V)

### Step 3: Parse
Click the **"Parse Stat Block"** button

### Step 4: Review Results
Check the **Parse Analytics** panel:
- **Green (95%+)**: Excellent parsing
- **Yellow (80-94%)**: Good, check warnings
- **Red (<80%)**: Review and use field editor

### Step 5: Export
Click **"Download JSON"** or **"Copy JSON"**

### Step 6: Import to Foundry
1. Open Foundry VTT
2. Go to Actors tab
3. Click "Import Data"
4. Paste JSON or select downloaded file
5. Click Import

---

## Interface Overview

### Left Panel - Input Section

#### Paste Stat Block Area
- Large text box for stat block input
- Accepts any text format
- Multi-line supported
- No character limit

#### Parse Stat Block Button
- Purple button with lightning icon
- Click to start parsing
- Takes 50-300ms depending on complexity

#### Parse Analytics (appears after parsing)
- **Accuracy Percentage**: How much was successfully parsed
- **Progress Bar**: Visual indicator (green/yellow/red)
- **Parsed Count**: X/Y fields successfully extracted
- **Exact Count**: Fields with exact matches vs defaults

#### Warnings & Errors
- **Red boxes**: Critical errors (parsing failed)
- **Yellow boxes**: Warnings (using default values)
- Scrollable if many warnings

### Right Panel - Output Section

#### Show/Hide Field Editor Button
- Orange button with edit icon
- Toggles field editor visibility
- Hidden by default

#### Field Editor (when shown)
- Lists all parsed fields
- Shows current value
- Shows method (exact/default badge)
- Edit icon for each field
- **Green badge**: Exact match from stat block
- **Gray badge**: Default value used

#### Foundry VTT Actor JSON
- Green box with JSON output
- Formatted for readability
- Scrollable
- Ready for export

#### Export Buttons
- **Download JSON**: Saves as .json file
- **Copy JSON**: Copies to clipboard
- File named: `CreatureName_foundry.json`

#### Info Box
- Lists what's included
- Current version
- Compatibility notes

---

## Using the Field Editor

### Opening the Editor
Click **"Show Field Editor"** orange button at top of output section

### Editing a Field

1. **Click the edit icon** (pencil) next to any field
2. **Input box appears** with current value
3. **Modify the value** as needed
4. **Click "Save"** (green button) to apply
5. **Or click "X"** (red button) to cancel

### Field Formats

#### Simple Fields
- **Name**: Any text
- **AC**: Number (e.g., `15`)
- **HP**: Number (e.g., `45`)
- **CR**: Number or fraction (e.g., `3` or `1/4`)

#### Complex Fields
- **Abilities**: Six comma-separated numbers
  - Format: `STR,DEX,CON,INT,WIS,CHA`
  - Example: `10,14,12,8,10,6`
- **Languages**: Comma-separated text
  - Example: `common, goblin, dwarvish`
- **Size**: Full word
  - Options: tiny, small, medium, large, huge, gargantuan
- **Type**: Creature type
  - Options: beast, humanoid, dragon, undead, etc.

### Understanding Badges

**Green "exact" Badge:**
- Field was successfully parsed from stat block
- High confidence in accuracy
- Usually no editing needed

**Gray "default" Badge:**
- Field not found in stat block
- Default value used
- Should review and potentially edit
- Common for optional fields

### When to Edit

**Always Check:**
- Fields with gray "default" badges
- AC if no armor type mentioned
- HP if no dice formula found
- Languages if complex text

**Usually Correct:**
- Fields with green "exact" badges
- Ability scores
- Challenge rating
- Size and type

---

## Understanding Parse Results

### Accuracy Levels

#### 95-100% (Excellent - Green)
- Almost everything parsed correctly
- Minimal or no editing needed
- Safe to export directly

#### 80-94% (Good - Yellow)
- Most fields parsed correctly
- Check warnings for defaults used
- Quick review recommended

#### Below 80% (Poor - Red)
- Many fields using defaults
- Significant editing needed
- Consider reformatting input

### Common Warnings

**"AC not found, using 10"**
- Stat block missing AC line
- Check for "Armor Class" or "AC" label

**"HP not found, using 5"**
- Stat block missing HP line
- Check for "Hit Points" or "HP" label

**"Abilities not found, using 10s"**
- Couldn't find STR DEX CON INT WIS CHA
- Check formatting of ability line

**"CR not found, using 1"**
- Missing Challenge rating
- Check for "Challenge" or "CR" label

### Interpreting Results

**Parsed X/Y Fields:**
- X = Successfully extracted
- Y = Total expected fields
- Higher is better

**Exact Matches:**
- Number of fields with exact text matches
- Higher indicates better parsing accuracy

---

## Export Options

### Download JSON

**When to Use:**
- Saving for later import
- Archiving creatures
- Sharing with others

**How it Works:**
1. Click "Download JSON"
2. File saves to Downloads folder
3. Filename: `CreatureName_foundry.json`
4. Import directly into Foundry

**If Download Blocked:**
- Browser may block automatic downloads
- Check browser's download bar
- Allow downloads from Claude.ai
- Or use "Copy JSON" instead

### Copy JSON

**When to Use:**
- Quick import to Foundry
- Browser blocks downloads
- Want to modify JSON

**How it Works:**
1. Click "Copy JSON"
2. Button shows "Copied!" feedback
3. JSON is in clipboard
4. Paste anywhere (Ctrl+V)

**For Foundry Import:**
1. Copy JSON
2. Open Foundry → Actors
3. Click "Import Data"
4. Paste in text box
5. Click Import

---

## Best Practices

### Input Preparation

**Do:**
- Use complete stat blocks
- Include all standard labels (AC, HP, Skills, etc.)
- Keep formatting consistent
- Copy from reliable sources

**Don't:**
- Remove labels to save space
- Mix multiple stat blocks
- Include action descriptions yet (Phase 6)
- Use special characters that don't copy well

### Quality Checking

**Before Export:**
1. Check accuracy percentage
2. Review any warnings
3. Verify critical fields (AC, HP, CR)
4. Use field editor for corrections
5. Ensure abilities look correct

**After Import:**
1. Open actor in Foundry
2. Verify HP and AC
3. Check skill proficiencies
4. Confirm saves are correct
5. Review any calculated values

### Workflow Tips

**For Single Creature:**
1. Paste → Parse → Review → Export → Import

**For Multiple Creatures:**
1. Parse first creature
2. Export immediately
3. Clear input (or refresh page)
4. Parse next creature
5. Repeat

**For Complex Creatures:**
1. Parse basic stats first
2. Review Parse Analytics
3. Use field editor extensively
4. Export base stats
5. Add actions manually in Foundry (until Phase 6)

---

## Common Use Cases

### Importing Published Monsters

**Scenario:** Converting Monster Manual entries

1. Copy stat block from digital source
2. Paste into parser
3. Parse (usually 95%+ accuracy)
4. Quick review
5. Export and import

**Expected Accuracy:** 95-100%

### Converting Homebrew

**Scenario:** Your custom creature designs

1. Ensure stat block follows D&D format
2. Include all standard labels
3. Parse and review carefully
4. Use field editor for custom values
5. Add special abilities in Foundry after import

**Expected Accuracy:** 80-95%

### Quick NPC Creation

**Scenario:** Need a simple NPC fast

1. Create minimal stat block:
   ```
   Guard
   Medium humanoid, lawful neutral
   AC 16 (chain shirt, shield)
   HP 11 (2d8 + 2)
   STR 13 DEX 12 CON 12 INT 10 WIS 11 CHA 10
   Skills Perception +2
   Challenge 1/8 (25 XP)
   ```
2. Parse
3. Export
4. Add equipment in Foundry

**Expected Time:** 1-2 minutes

### Batch Converting for Module

**Scenario:** Converting 20+ creatures for custom module

1. Parse first creature completely
2. Note any recurring parsing issues
3. Adjust stat block format if needed
4. Process all creatures
5. Spot-check random samples
6. Import all into Foundry

**Expected Time:** 5-10 minutes per creature

---

## Keyboard Shortcuts

**In Text Input:**
- `Ctrl+A` / `Cmd+A`: Select all
- `Ctrl+V` / `Cmd+V`: Paste
- `Ctrl+Z` / `Cmd+Z`: Undo

**After Copying JSON:**
- `Ctrl+V` / `Cmd+V`: Paste in Foundry import dialog

---

## Tips & Tricks

### Parsing Multiple Variations

If you have a creature with variants:
1. Parse base creature
2. Export with descriptive name
3. Clear input
4. Parse variant with changes
5. Export with different name

### Handling Missing Data

If stat block is incomplete:
1. Parse what exists
2. Use field editor to add missing data
3. Or add in Foundry after import

### Speed vs Accuracy

**Fast Method:**
- Parse → Export → Import
- Fix in Foundry if needed

**Careful Method:**
- Parse → Review Analytics → Field Editor → Export → Verify → Import

Choose based on:
- How critical accuracy is
- Time available
- Complexity of creature

### Creating Templates

For consistent homebrew:
1. Create template stat block with your style
2. Parse once
3. Save formatting notes
4. Use same format for all creatures
5. Consistent 95%+ accuracy

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Low accuracy | Use field editor to correct |
| Won't import to Foundry | Must use v1.3, check Foundry v3.3+ |
| Download doesn't work | Use "Copy JSON" instead |
| Abilities all 10 | Edit using format: `14,16,12,10,8,10` |
| Skills wrong | Verify CR is correct (affects prof bonus) |
| Languages have extra text | v1.3 auto-removes parentheses |
| Size wrong in Foundry | Edit to full word: tiny, small, medium, large, huge, gargantuan |

See TROUBLESHOOTING.md for detailed solutions.

---

## Version Notes

**Current Version:** v1.3 - Foundry VTT Compatible

**What's Included:**
- ✅ Basic stats parsing
- ✅ Skills and saves with proficiency
- ✅ Movement speeds
- ✅ Field editor
- ✅ Foundry v3.3+ compatibility

**Coming in Phase 6:**
- 🔜 Actions and attacks
- 🔜 Special features
- 🔜 Legendary actions
- 🔜 Damage resistances/immunities

**Use this guide for v1.3** - Previous versions work differently.