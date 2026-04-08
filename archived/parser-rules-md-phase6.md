# Parser Rules & Regex Patterns

## Overview
This document details all parsing rules, regex patterns, and logic used to extract data from D&D 5e stat blocks.

---

## Field Parsing Rules

### 1. Name
**Priority:** Critical  
**Default:** "Unknown"

**Pattern:**
```javascript
const name = lines[0] || 'Unknown';
```

**Logic:**
- Takes first line of input as name
- No validation required
- Always considered "exact" match

---

### 2. Size
**Priority:** High  
**Default:** "medium"

**Pattern:**
```javascript
/\b(tiny|small|medium|large|huge|gargantuan)\b/i
```

**Logic:**
- Case-insensitive word boundary match
- Searches entire text
- Maps to Foundry size codes:
  - tiny → "tiny"
  - small → "sm"
  - medium → "med"
  - large → "lg"
  - huge → "huge"
  - gargantuan → "grg"

**Edge Cases:**
- Multiple size mentions: uses first match
- Typos: no match, uses default

---

### 3. Type
**Priority:** High  
**Default:** "humanoid"

**Pattern:**
```javascript
/\b(beast|humanoid|dragon|undead|elemental|monstrosity|fey|fiend|giant|ooze|plant|construct|celestial|aberration)\b/i
```

**Logic:**
- Case-insensitive word boundary match
- Searches entire text
- Only recognizes official D&D creature types

**Edge Cases:**
- Custom types: uses default "humanoid"
- Subtypes (e.g., "humanoid (goblinoid)"): captures main type only

---

### 4. Alignment
**Priority:** Medium  
**Default:** "unaligned"

**Pattern 1 (Preferred):**
```javascript
/(?:tiny|small|medium|large|huge|gargantuan)\s+(?:beast|humanoid|dragon|undead|elemental|monstrosity|fey|fiend|giant|ooze|plant|construct|celestial|aberration)[^,]*,\s*(.+?)(?:\n|$)/i
```

**Pattern 2 (Fallback):**
```javascript
/alignment[:\s]+(.+?)(?:\n|$)/i
```

**Logic:**
- First tries to extract from "Size Type, Alignment" format
- Falls back to explicit "Alignment:" label
- Captures everything until newline or end

**Edge Cases:**
- No alignment: uses "unaligned"
- Complex alignments: captures full text

---

### 5. Armor Class (AC)
**Priority:** Critical  
**Default:** 10

**Pattern:**
```javascript
/(?:AC|Armor Class)[:\s]*(\d+)(?:\s*\(([^)]+)\))?/i
```

**Capture Groups:**
1. AC value (required)
2. Armor type (optional, in parentheses)

**Logic:**
- Extracts numeric AC value
- Captures armor type if present (e.g., "natural armor", "plate mail")
- Stores in `ac.flat` and armor type in display only

**Edge Cases:**
- Missing AC: warning, uses 10
- Multiple AC values: uses first
- No armor type: empty string

---

### 6. Hit Points (HP)
**Priority:** Critical  
**Default:** 5

**Pattern:**
```javascript
/(?:HP|Hit Points)[:\s]*(\d+)(?:\s*\(([^)]+)\))?/i
```

**Capture Groups:**
1. HP value (required)
2. Dice formula (optional, in parentheses)

**Logic:**
- Extracts numeric HP value
- Captures dice formula if present (e.g., "2d6 + 2")
- Stores both value and formula in output

**Edge Cases:**
- Missing HP: warning, uses 5
- Invalid formula: stores as-is, no validation

---

### 7. Speed
**Priority:** High  
**Default:** 30 ft. walk

**Pattern:**
```javascript
/Speed\s+(\d+)\s*ft\.(?:,\s*climb\s+(\d+)\s*ft\.)?(?:,\s*fly\s+(\d+)\s*ft\.)?(?:,\s*swim\s+(\d+)\s*ft\.)?(?:,\s*burrow\s+(\d+)\s*ft\.)?/i
```

**Capture Groups:**
1. Walk speed (required)
2. Climb speed (optional)
3. Fly speed (optional)
4. Swim speed (optional)
5. Burrow speed (optional)

**Logic:**
- First number is always walk speed
- Additional speeds are optional
- Stores null for missing speeds

**Edge Cases:**
- Only walk speed: others set to null
- Special movement (hover, etc.): ignored currently

---

### 8. Ability Scores
**Priority:** Critical  
**Default:** All 10s

**Pattern 1:**
```javascript
/STR\s+(\d+)\s+DEX\s+(\d+)\s+CON\s+(\d+)\s+INT\s+(\d+)\s+WIS\s+(\d+)\s+CHA\s+(\d+)/i
```

**Pattern 2 (with modifiers in parentheses):**
```javascript
/STR\s+(\d+)\s*\([+-]\d+\)\s+DEX\s+(\d+)\s*\([+-]\d+\)\s+CON\s+(\d+)\s*\([+-]\d+\)\s+INT\s+(\d+)\s*\([+-]\d+\)\s+WIS\s+(\d+)\s*\([+-]\d+\)\s+CHA\s+(\d+)\s*\([+-]\d+\)/i
```

**Logic:**
- Tries pattern without modifiers first
- Falls back to pattern with modifiers
- Extracts just the ability scores, ignores modifiers
- Modifiers calculated via: `Math.floor((score - 10) / 2)`

**Edge Cases:**
- Missing abilities: warning, uses 10 for all
- Non-standard format: no match, defaults

---

### 9. Challenge Rating (CR)
**Priority:** Critical  
**Default:** 1

**Pattern 1:**
```javascript
/Challenge[:\s]+(\d+(?:\/\d+)?)/i
```

**Pattern 2 (Fallback):**
```javascript
/\bCR[:\s]+(\d+(?:\/\d+)?)/i
```

**Logic:**
- Accepts whole numbers or fractions (e.g., "1/4", "1/2")
- Used to calculate proficiency bonus
- Converted to float for storage

**Proficiency Bonus Calculation:**
```javascript
if (crNum < 5) return 2;      // CR 0-4
if (crNum < 9) return 3;      // CR 5-8
if (crNum < 13) return 4;     // CR 9-12
if (crNum < 17) return 5;     // CR 13-16
return 6;                      // CR 17+
```

---

### 10. Saving Throws
**Priority:** High  
**Default:** None (all 0)

**Pattern:**
```javascript
/Saving Throws[:\s]+(.+?)(?=\s+Skills|\s+Damage|\s+Senses|\s+Languages|\s+Challenge|$)/i
```

**Logic:**
- Captures everything until next section
- Splits on commas
- Parses each entry as "ability +bonus"
- Detects proficiency if bonus = ability mod + prof bonus
- Sets proficient flag in abilities object

**Example Parsing:**
```
"Saving Throws: Dex +11, Wis +9, Cha +12"
→ Split into: ["Dex +11", "Wis +9", "Cha +12"]
→ Parse each: ability="dex", bonus=11
→ Calculate: base mod = +5 (DEX 20), prof = +6 (CR 23)
→ If 11 = 5 + 6: mark as proficient
```

**Edge Cases:**
- No saves: all abilities proficient=0
- Custom bonuses: marked as proficient if > base

---

### 11. Skills
**Priority:** High  
**Default:** None (all value=0)

**Pattern:**
```javascript
/Skills[:\s]+(.+?)(?=\s+Damage|\s+Senses|\s+Languages|\s+Challenge|\s+Condition|$)/i
```

**Logic:**
- Captures everything until next section
- Splits on commas
- Parses each entry as "skill name +bonus"
- Detects proficiency: bonus = ability mod + prof bonus
- Detects expertise: bonus = ability mod + (prof bonus × 2)

**Skill Value Mapping:**
```
value = 0: Not proficient
value = 1: Proficient (×1 prof bonus)
value = 2: Expertise (×2 prof bonus)
```

**Example Parsing:**
```
"Skills: Stealth +11"
→ Skill: stealth, Bonus: +11
→ Ability: DEX, Mod: +2 (DEX 14), Prof: +2 (CR 1)
→ With Prof: +2 + 2 = +4
→ With Expertise: +2 + 4 = +6
→ Actual: +11 → must be custom (mark as proficient)
```

---

### 12. Senses
**Priority:** Medium  
**Default:** Empty string

**Pattern:**
```javascript
/Senses[:\s]+(.+?)(?=\s+Languages|\s+Challenge|$)/i
```

**Logic:**
- Captures everything until Languages or Challenge
- Stored as-is in special field
- No parsing of individual sense types yet

**Future Enhancement:**
- Parse darkvision, blindsight, etc. into separate fields

---

### 13. Languages
**Priority:** Medium  
**Default:** Empty array

**Pattern:**
```javascript
/Languages[:\s]+(.+?)(?=\s+Challenge|$)/i
```

**Logic:**
- Captures everything until Challenge or end
- Removes parenthetical notes: `replace(/\([^)]*\)/g, '')`
- Splits on commas
- Converts to lowercase
- Stores in array

**Example:**
```
"Languages: Common, Elvish, Infernal, languages of Barovia (others at DM's discretion)"
→ Remove parentheticals: "Common, Elvish, Infernal, languages of Barovia"
→ Split: ["common", "elvish", "infernal", "languages of barovia"]
```

---

## Pattern Improvements (v1.3)

### Lookahead Assertions
All section patterns now use lookahead assertions instead of consuming newlines:

**Old Pattern (consumed newlines):**
```javascript
/Skills\s+(.+?)(?:\n|Senses)/i
```

**New Pattern (lookahead):**
```javascript
/Skills[:\s]+(.+?)(?=\s+Senses|$)/i
```

**Benefits:**
- Works with continuous text (no newlines)
- Works with formatted text (with newlines)
- More flexible and robust

---

## Parsing Order

1. **Name** - First line
2. **Size** - Search entire text
3. **Type** - Search entire text
4. **Alignment** - After size/type
5. **AC** - Search for label
6. **HP** - Search for label
7. **Speed** - Search for label
8. **Abilities** - Search for STR...CHA pattern
9. **CR** - Search for label (needed for prof bonus)
10. **Proficiency Bonus** - Calculate from CR
11. **Saving Throws** - Parse with prof bonus
12. **Skills** - Parse with prof bonus
13. **Senses** - Search for label
14. **Languages** - Search for label

**Why This Order:**
- CR must be parsed before saves/skills (for prof bonus)
- Abilities must be parsed before saves/skills (for base mods)
- Size/Type before alignment (for composite pattern)

---

## Validation Rules

### Required Fields
- Name (always first line)
- Abilities (or defaults to 10s)
- CR (or defaults to 1)

### Optional Fields
- Size (defaults to medium)
- Type (defaults to humanoid)
- Alignment (defaults to unaligned)
- AC (defaults to 10)
- HP (defaults to 5)
- Speed (defaults to 30 ft.)
- Saves (defaults to none)
- Skills (defaults to none)
- Senses (defaults to empty)
- Languages (defaults to empty)

### Numeric Validation
- AC: Must be integer, typically 5-30
- HP: Must be integer, typically 1-500+
- CR: Must be number or fraction, typically 0-30
- Ability Scores: Must be integers, typically 1-30

---

## Error Handling Strategy

### Fatal Errors (throw exception)
- Empty input
- Completely unparseable text

### Warnings (use defaults)
- Missing AC
- Missing HP
- Missing abilities
- Missing CR

### Silent Defaults (no warning)
- Missing optional fields (senses, languages)
- Missing movement types (climb, fly, etc.)

---

## Future Parsing Patterns

### Phase 6 (Actions)
```javascript
/Actions\s+(.+?)(?=\s+Reactions|\s+Legendary|$)/is
```

### Phase 6 (Multiattack)
```javascript
/Multiattack[.:\s]+(.+?)(?=\n\n|\n[A-Z])/is
```

### Phase 7 (Spellcasting)
```javascript
/Spellcasting[.:\s]+(.+?)(?=\n\n|\n[A-Z])/is
```

### Phase 7 (Damage Resistances)
```javascript
/Damage Resistances[:\s]+(.+?)(?=\s+Damage|\s+Condition|$)/i
```