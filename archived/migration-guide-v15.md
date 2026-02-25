# Migration Guide: v1.4 → v1.5

## Why Upgrade?

**Critical Fix:** v1.4 and earlier versions have broken skill parsing that prevents proper Foundry VTT import.

### What Was Broken in v1.4

```json
{
  "skills": {
    "ste": {
      "ability": "dex",
      "value": 1
      // ❌ Missing bonuses field
      // ❌ Import fails in Foundry
    }
  }
}
```

### What's Fixed in v1.5

```json
{
  "skills": {
    "ste": {
      "ability": "dex",
      "value": 1,
      "bonuses": {
        "check": "",
        "passive": ""
      }
      // ✅ Complete structure
      // ✅ Imports perfectly
    }
  }
}
```

---

## Who Needs to Upgrade?

✅ **You MUST upgrade if:**
- You used v1.4 or earlier
- Your Foundry imports are failing
- Skills show errors when importing
- You're getting JSON validation errors

✅ **You should upgrade for:**
- Cleaner, more stable code
- Better error messages
- Faster parsing
- Future compatibility

---

## How to Upgrade

### Step 1: Get v1.5

**If using Claude.ai:**
1. Request "D&D Stat Block Parser v1.5"
2. Verify badge shows "v1.5 - SKILLS FIXED"

**If using standalone:**
1. Replace your component with v1.5 code
2. No npm packages need updating

### Step 2: Re-Parse Your Stat Blocks

**Important:** You must re-parse stat blocks from v1.4 or earlier.

1. Open your old stat block text
2. Paste into v1.5 parser
3. Click "Parse Stat Block"
4. Verify accuracy is 90%+
5. Download/copy new JSON

### Step 3: Test in Foundry

1. Delete old actor (from v1.4) if imported
2. Import new JSON (from v1.5)
3. Verify skills appear correctly
4. Check proficiencies are accurate

---

## What Changed?

### Skills Structure

**Before (v1.4):**
- Incomplete object structure
- Missing `bonuses` field
- Foundry import failed

**After (v1.5):**
- Complete object structure
- All required fields present
- Foundry import works perfectly

### Code Quality

**Before (v1.4):**
- Legacy code from earlier versions
- Debug warnings cluttering output
- Inconsistent error handling

**After (v1.5):**
- Clean rewrite from scratch
- Only relevant warnings
- Consistent error handling

### Proficiency Detection

**Before (v1.4):**
- Sometimes missed expertise
- Edge cases failed
- Custom bonuses confused parser

**After (v1.5):**
- Reliable expertise detection
- Edge cases handled
- Custom bonuses work correctly

---

## Breaking Changes

### JSON Structure

The skills section structure changed. Old v1.4 JSON will not import correctly.

**Action Required:** Re-parse all stat blocks with v1.5.

### Field Names

No field names changed - structure only.

**Action Required:** None for field editor usage.

### Export Format

Export format is the same (JSON).

**Action Required:** None - just use new JSON.

---

## Compatibility

### What Still Works

✅ All basic stats (name, AC, HP, etc.)  
✅ Abilities and modifiers  
✅ Saving throws  
✅ Movement speeds  
✅ Senses and languages  
✅ Field editor  
✅ Download/copy functions  

### What's Fixed

✅ **Skills structure** - Now properly formatted  
✅ **Proficiency detection** - More accurate  
✅ **Foundry import** - Works reliably  
✅ **Error messages** - More helpful  

---

## Step-by-Step Migration Example

### Example: Goblin Stat Block

**1. Old Process (v1.4 - Failed)**

```
Input: Goblin stat block
↓
Parse with v1.4
↓
Export JSON
↓
Import to Foundry
↓
❌ Error: Skills missing fields
```

**2. New Process (v1.5 - Works)**

```
Input: Goblin stat block
↓
Parse with v1.5
↓
Export JSON
↓
Import to Foundry
↓
✅ Success: Actor imports perfectly
```

---

## Testing Your Migration

### Quick Test Checklist

After migrating to v1.5:

1. **Parse a simple creature** (like Goblin)
   - [ ] Accuracy shows 100%
   - [ ] No errors shown
   - [ ] Skills show "exact" badges

2. **Check the JSON**
   - [ ] Skills section has `bonuses` field
   - [ ] All 18 skills present
   - [ ] Values are 0, 1, or 2

3. **Import to Foundry**
   - [ ] Import completes without errors
   - [ ] Skills appear in character sheet
   - [ ] Proficiencies show correctly

4. **Verify proficiency bonuses**
   - [ ] Proficient skills = ability mod + prof bonus
   - [ ] Expertise skills = ability mod + (prof bonus × 2)

---

## Troubleshooting Migration

### Issue: "Still getting import errors"

**Cause:** Using old JSON from v1.4

**Solution:**
1. Verify artifact shows "v1.5 - SKILLS FIXED" badge
2. Re-parse stat block completely
3. Use fresh JSON export

### Issue: "Skills showing wrong values"

**Cause:** CR not parsed correctly

**Solution:**
1. Check CR field in parse stats
2. Use field editor to correct CR
3. Re-export JSON

### Issue: "Can't find v1.5"

**Cause:** Using old chat or bookmark

**Solution:**
1. Start new conversation in Claude.ai
2. Request latest version
3. Verify badge shows v1.5

---

## Data Migration

### Do I Need to Migrate Old Actors?

**Short Answer:** Yes, if they have skills.

**Long Answer:**
- Old actors (v1.4) may have broken skills
- They'll work for basic stats
- Skills won't calculate correctly
- Better to re-import with v1.5

### Migration Script

No script needed - just re-parse and re-import:

```
For each creature:
1. Copy original stat block text
2. Parse with v1.5
3. Delete old actor in Foundry
4. Import new JSON
```

---

## FAQ

**Q: Will my v1.4 JSON files work?**  
A: No. Skills are structured incorrectly. Re-parse with v1.5.

**Q: Do I need to update anything in Foundry?**  
A: No. Just delete old actors and import new ones.

**Q: What if I don't have the original stat blocks?**  
A: You can manually edit skills in Foundry or use field editor to fix exported JSON.

**Q: Can I mix v1.4 and v1.5 actors?**  
A: Yes, but v1.4 actors will have broken skills.

**Q: How long does migration take?**  
A: ~1 minute per creature (parse + import).

---

## Benefits of Upgrading

### Immediate Benefits

✅ Skills work correctly in Foundry  
✅ Proficiency bonuses calculate properly  
✅ No more import errors  
✅ Cleaner parse output  

### Future Benefits

✅ Ready for Phase 6 (actions parsing)  
✅ Better maintained codebase  
✅ More reliable updates  
✅ Community support focused on v1.5+  

---

## Support

### Need Help?

1. Check this migration guide
2. Review TROUBLESHOOTING.md
3. Verify you're using v1.5 (check badge)
4. Test with simple creature first

### Still Having Issues?

Report with:
- "Migrating from v1.4 to v1.5"
- Stat block that fails
- Error message
- Screenshot of parse results

---

## Timeline

**When to Migrate:** Immediately

**Why Urgent:** v1.4 produces broken JSON that won't import correctly

**How Long:** 1-2 hours for typical campaign (10-20 creatures)

---

## Summary

| Aspect | v1.4 | v1.5 |
|--------|------|------|
| Skills Structure | ❌ Broken | ✅ Fixed |
| Foundry Import | ❌ Fails | ✅ Works |
| Code Quality | ⚠️ Legacy | ✅ Clean |
| Proficiency Detection | ⚠️ Buggy | ✅ Reliable |
| Error Messages | ⚠️ Debug clutter | ✅ Clean |
| **Recommended** | ❌ No | ✅ Yes |

---

**Bottom Line:** Upgrade to v1.5 immediately. Re-parse all stat blocks. Skills will finally work correctly.

**Last Updated:** December 17, 2024