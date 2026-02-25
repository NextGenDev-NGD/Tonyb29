# Code Preservation Guide - Preventing Feature Regression

## The Problem

When adding new features to the D&D Parser, critical working code gets lost. For example:
- **v2.0-alpha.1** ✅ Saves proficiency working
- **v2.0-alpha.2** ❌ Saves proficiency broken (lost when adding damage types)

## Root Cause

When manually copying code sections to add new features, critical logic gets accidentally omitted. This happens because:
1. Code sections aren't clearly marked as "CRITICAL - DO NOT REMOVE"
2. No checklist exists to verify all features still work after changes
3. No automated tests to catch regressions

---

## Solution 1: Mark Critical Code Sections

### Tag Critical Code with Comments

```javascript
// ==================== SAVING THROWS - CRITICAL CODE ====================
// This section MUST be preserved in all future versions
// DO NOT REMOVE OR MODIFY without testing save proficiency
stats.total++;
const savesMatch = text.match(/(?:Saving Throws|Save)[:\s]+(.+?)(?=\n\s*Skills|\n\s*Damage|\n\s*Senses|\n\s*Languages|\n\s*Challenge|\n\s*CR|$)/is);
let savesText = savesMatch?.[1]?.trim() || '';

// D&D Beyond table format fallback - CRITICAL for table-format stat blocks
if (!savesText) {
  const foundSaves = [];
  ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'].forEach(ab => {
    const saveMatch = text.match(new RegExp(`${ab}\\s+\\d+\\s+[+-−]?\\d+\\s+([+-−]\\d+)`, 'i'));
    if (saveMatch) {
      const saveBonus = parseInt(saveMatch[1].replace('−', '-'));
      const abilityMod = mod(abilities[ab.toLowerCase()]);
      if (saveBonus !== abilityMod) {
        foundSaves.push(`${ab} ${saveMatch[1].replace('−', '-')}`);
      }
    }
  });
  if (foundSaves.length > 0) savesText = foundSaves.join(', ');
}

if (savesText) { stats.parsed++; stats.exact++; }
stats.fields.push({ name: 'saves', value: savesText || 'none', method: savesText ? 'exact' : 'default' });

// Initialize saves object - CRITICAL: must store proficiency flags
const saves = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };

// Parse saves and set proficiency - CRITICAL LOGIC
if (savesText) {
  savesText.split(',').forEach(entry => {
    const match = entry.trim().match(/^(str|dex|con|int|wis|cha)\s*([+-]\d+)/i);
    if (match) {
      const ab = match[1].toLowerCase();
      const saveBonus = parseInt(match[2]);
      const baseMod = mod(abilities[ab]);
      // CRITICAL: Proficient if save bonus > base modifier
      if (saveBonus > baseMod) {
        saves[ab] = 1;
      }
    }
  });
}
// ==================== END SAVING THROWS CRITICAL CODE ====================
```

### Critical Section Markers

Use clear start/end markers:
```javascript
// ==================== [FEATURE NAME] - CRITICAL CODE ====================
// ... code ...
// ==================== END [FEATURE NAME] CRITICAL CODE ====================
```

---

## Solution 2: Feature Verification Checklist

### Before ANY New Version Release

Copy this checklist and verify each feature:

```markdown
## v2.0-alpha.X Feature Verification

### Phase 5 Features (Must Always Work)
- [ ] Name parsing
- [ ] Size parsing (with code mapping)
- [ ] Type parsing
- [ ] Alignment parsing
- [ ] AC parsing
- [ ] HP parsing (with formula)
- [ ] Speed parsing (all types)
- [ ] Ability scores (all 3 formats)
- [ ] CR parsing (with fractions)
- [ ] **SAVES PROFICIENCY** ← OFTEN BREAKS
- [ ] Skills proficiency/expertise
- [ ] Senses parsing
- [ ] Languages parsing
- [ ] Initiative parsing

### Phase 6 Features (New)
- [ ] Actions parsing
- [ ] Attack rolls
- [ ] Damage formulas
- [ ] Damage resistances
- [ ] Damage immunities
- [ ] Damage vulnerabilities
- [ ] Condition immunities

### Critical Integrations
- [ ] Saves are stored in `saves` object
- [ ] Saves are applied to `abilities.*.proficient` in JSON
- [ ] Skills use correct ability mapping
- [ ] Proficiency bonus calculated from CR

### Test Cases
- [ ] Goblin (simple)
- [ ] Aarakocra Aeromancer (D&D Beyond format with saves)
- [ ] Complex creature with all damage types
```

---

## Solution 3: Quick Regression Test

### Aarakocra Aeromancer Test (Saves Proficiency)

**Input:**
```
Aarakocra Aeromancer
Medium Elemental, Neutral
AC 16
HP 66 (12d8 + 12)
Speed 20 ft., Fly 50 ft.
Ability Score Mod Save
Str 10 +0 +0
Dex 16 +3 +5
Con 12 +1 +1
Ability Score Mod Save
Int 13 +1 +1
Wis 17 +3 +5
Cha 12 +1 +1
Skills Arcana +3
Senses Passive Perception 17
Languages Aarakocra
CR 4 (XP 1,100; PB +2)
```

**Expected Output (JSON):**
```json
{
  "system": {
    "abilities": {
      "dex": { "value": 16, "proficient": 1 },  // ← Must be 1
      "wis": { "value": 17, "proficient": 1 }   // ← Must be 1
    }
  }
}
```

**Quick Check:**
1. Parse the Aarakocra
2. Check JSON output
3. Verify `abilities.dex.proficient === 1`
4. Verify `abilities.wis.proficient === 1`

If either is `0`, saves proficiency is broken!

---

## Solution 4: Version Control Best Practices

### When Creating a New Version

1. **Copy entire working version**
   ```
   v2.0-alpha.1.tsx → v2.0-alpha.2.tsx (full copy)
   ```

2. **Make incremental changes**
   - Add ONE feature at a time
   - Test after each addition
   - Don't add multiple features in one version

3. **Test before moving on**
   - Run Aarakocra test
   - Check all critical sections still present
   - Verify JSON structure

4. **Document what changed**
   ```markdown
   ## v2.0-alpha.2 Changes
   - Added: Damage resistances parsing
   - Added: Damage immunities parsing
   - Added: Damage vulnerabilities parsing
   - Added: Condition immunities parsing
   - Verified: Saves proficiency still working ✓
   ```

---

## Solution 5: Code Structure Template

### Standard Parsing Order

**Always parse in this order:**
```javascript
1. Name
2. Size
3. Type
4. Alignment
5. AC
6. HP
7. Speed
8. Abilities
9. CR (needed for prof bonus)
10. **SAVES** ← CRITICAL, comes before skills
11. Skills
12. Damage Types (new)
13. Senses
14. Languages
15. Actions (new)
```

**Why this order matters:**
- CR must come before saves (needed for prof bonus calculation)
- Abilities must come before saves (needed for base mod comparison)
- Saves must come before building JSON (applied to abilities)

---

## Solution 6: Pre-Release Checklist

### Before Sharing Any New Version

```markdown
## Pre-Release Checklist

### Code Review
- [ ] All critical sections still present
- [ ] No code between `// ==================== CRITICAL ====================` markers removed
- [ ] Saves proficiency logic intact
- [ ] Skills proficiency logic intact

### Testing
- [ ] Goblin stat block parses correctly
- [ ] Aarakocra saves show proficient: 1 for Dex/Wis
- [ ] New features work as expected
- [ ] No warnings about missing critical fields

### Documentation
- [ ] Version notes updated
- [ ] New features documented
- [ ] Known issues listed

### JSON Verification
- [ ] abilities.*.proficient set correctly
- [ ] skills.*.value set correctly (0/1/2)
- [ ] All new fields present
- [ ] No undefined values
```

---

## Common Regression Patterns

### Pattern 1: Saves Object Not Applied to JSON

**Symptom:**
```javascript
// Saves parsed correctly
const saves = { str: 0, dex: 1, con: 0, int: 0, wis: 1, cha: 0 };

// But NOT applied to JSON
abilities: {
  dex: { value: 16, proficient: 0 }  // ← WRONG, should be 1
}
```

**Fix:**
```javascript
abilities: {
  str: { value: abilities.str, proficient: saves.str },
  dex: { value: abilities.dex, proficient: saves.dex },  // ← Must use saves object
  // ...
}
```

### Pattern 2: Saves Logic Simplified/Removed

**Symptom:**
Code changed from:
```javascript
if (saveBonus > baseMod) {
  saves[ab] = 1;
}
```

To:
```javascript
saves[ab] = 0;  // ← Always 0, proficiency never set
```

**Fix:**
Keep the comparison logic intact!

### Pattern 3: D&D Beyond Fallback Removed

**Symptom:**
The table format parsing code is missing:
```javascript
// This section got deleted when adding new features
if (!savesText) {
  const foundSaves = [];
  ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'].forEach(ab => {
    // ... extraction logic
  });
}
```

**Fix:**
Keep both standard format AND D&D Beyond fallback!

---

## Emergency Recovery Process

### If You Lost Critical Code

1. **Identify the last working version**
   - v2.0-alpha.1 has working saves

2. **Find the missing code**
   - Search for `// ==================== SAVING THROWS`
   - Copy entire section from last working version

3. **Restore to current version**
   - Paste critical section in correct location (after CR, before skills)
   - Verify saves object is applied to JSON

4. **Test immediately**
   - Run Aarakocra test
   - Check `proficient: 1` appears in JSON

---

## Long-Term Solution: Automated Tests

### Future: Add Unit Tests

```javascript
describe('Save Proficiency Parsing', () => {
  test('Aarakocra saves should be proficient', () => {
    const result = parseStatBlock(aarakocraStatBlock);
    expect(result.system.abilities.dex.proficient).toBe(1);
    expect(result.system.abilities.wis.proficient).toBe(1);
  });
  
  test('Goblin saves should not be proficient', () => {
    const result = parseStatBlock(goblinStatBlock);
    expect(result.system.abilities.dex.proficient).toBe(0);
  });
});
```

---

## Summary

### Golden Rules

1. **Mark critical code** with clear `// ==================== CRITICAL ====================` comments
2. **Test after every change** using Aarakocra stat block
3. **One feature at a time** - don't add multiple features in one version
4. **Use the checklist** before releasing any new version
5. **Keep working versions** - never overwrite a working version without testing

### Quick Verification Command

Before sharing a new version, ask yourself:
> "Did I test the Aarakocra stat block and verify saves proficiency is still 1 for Dex and Wis?"

If the answer is no, **test it now** before releasing!

---

## Appendix: Critical Code Sections

### Section 1: Saves Parsing (Lines ~185-220)
**What it does:** Extracts saves from text, handles both standard and D&D Beyond formats  
**Why critical:** Without this, proficiency is never set  
**Test:** Aarakocra should show "Dex +5, Wis +5" in saves field

### Section 2: Saves Proficiency Logic (Lines ~221-235)
**What it does:** Compares save bonus to base mod, sets proficient flag  
**Why critical:** This is where proficient = 1 gets set  
**Test:** `saves.dex` should be 1, not 0

### Section 3: JSON Integration (Lines ~400-410)
**What it does:** Applies saves object to abilities in JSON  
**Why critical:** Without this, proficiency never reaches final JSON  
**Test:** `abilities.dex.proficient` in JSON should be 1

All three sections must be present for saves proficiency to work!