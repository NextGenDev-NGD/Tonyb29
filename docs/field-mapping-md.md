# Field Mapping - D&D 5e to Foundry VTT

## Overview
This document maps D&D 5e stat block fields to their corresponding Foundry VTT Actor JSON structure.

---

## Basic Information

### Name
**D&D Format:** First line of stat block  
**Example:** `Goblin`

**Foundry Location:**
```json
{
  "name": "Goblin"
}
```

**Notes:**
- No transformation needed
- Stored as-is

---

### Size
**D&D Format:** Word in second line  
**Options:** Tiny, Small, Medium, Large, Huge, Gargantuan  
**Example:** `Small humanoid`

**Foundry Location:**
```json
{
  "system": {
    "traits": {
      "size": "sm"
    }
  }
}
```

**Mapping:**
| D&D | Foundry Code |
|-----|--------------|
| Tiny | `"tiny"` |
| Small | `"sm"` |
| Medium | `"med"` |
| Large | `"lg"` |
| Huge | `"huge"` |
| Gargantuan | `"grg"` |

---

### Type
**D&D Format:** Word after size  
**Options:** Beast, Humanoid, Dragon, Undead, Elemental, Monstrosity, Fey, Fiend, Giant, Ooze, Plant, Construct, Celestial, Aberration  
**Example:** `Small humanoid`

**Foundry Location:**
```json
{
  "system": {
    "details": {
      "type": {
        "value": "humanoid",
        "custom": "",
        "subtype": "",
        "swarm": ""
      }
    }
  }
}
```

**Notes:**
- Lowercase in Foundry
- Subtype (e.g., "goblinoid") not currently parsed
- Future: Extract subtypes from parentheses

---

### Alignment
**D&D Format:** After comma following size/type  
**Example:** `Small humanoid, neutral evil`

**Foundry Location:**
```json
{
  "system": {
    "details": {
      "alignment": "neutral evil"
    }
  }
}
```

**Common Values:**
- Lawful Good, Neutral Good, Chaotic Good
- Lawful Neutral, True Neutral, Chaotic Neutral
- Lawful Evil, Neutral Evil, Chaotic Evil
- Unaligned (default)

---

## Combat Statistics

### Armor Class (AC)
**D&D Format:** `Armor Class ## (armor type)`  
**Example:** `Armor Class 15 (leather armor, shield)`

**Foundry Location:**
```json
{
  "system": {
    "attributes": {
      "ac": {
        "flat": 15,
        "calc": "natural"
      }
    }
  }
}
```

**Notes:**
- Only numeric value stored in `flat`
- Armor type displayed in parse stats but not in JSON
- `calc: "natural"` is standard for NPCs

---

### Hit Points (HP)
**D&D Format:** `Hit Points ## (dice formula)`  
**Example:** `Hit Points 7 (2d6)`

**Foundry Location:**
```json
{
  "system": {
    "attributes": {
      "hp": {
        "value": 7,
        "max": 7,
        "temp": 0,
        "tempmax": 0,
        "formula": "2d6"
      }
    }
  }
}
```

**Notes:**
- `value` = current HP (starts at max)
- `max` = maximum HP
- `formula` = dice formula for regeneration
- `temp` and `tempmax` always 0 initially

---

### Speed
**D&D Format:** `Speed 30 ft., climb 20 ft., fly 40 ft.`  
**Example:** `Speed 30 ft.`

**Foundry Location:**
```json
{
  "system": {
    "attributes": {
      "movement": {
        "burrow": null,
        "climb": null,
        "fly": null,
        "swim": null,
        "walk": 30,
        "units": null,
        "hover": false,
        "ignoredDifficultTerrain": []
      }
    }
  }
}
```

**Movement Types:**
| D&D | Foundry Field |
|-----|---------------|
| Base speed | `walk` |
| Climb | `climb` |
| Fly | `fly` |
| Swim | `swim` |
| Burrow | `burrow` |

**Notes:**
- First number is always walk speed
- Additional speeds extracted if present
- `null` for missing speeds

---

## Ability Scores

### D&D Format
**Example:** `STR 14 (+2) DEX 16 (+3) CON 12 (+1) INT 10 (+0) WIS 8 (-1) CHA 10 (+0)`

**Foundry Location:**
```json
{
  "system": {
    "abilities": {
      "str": {
        "value": 14,
        "proficient": 0,
        "max": null,
        "bonuses": { "check": "", "save": "" },
        "check": { "roll": { "min": null, "max": null, "mode": 0 } },
        "save": { "roll": { "min": null, "max": null, "mode": 0 } }
      }
      // ... dex, con, int, wis, cha (same structure)
    }
  }
}
```

**Ability Mapping:**
| D&D | Foundry |
|-----|---------|
| STR | `str` |
| DEX | `dex` |
| CON | `con` |
| INT | `int` |
| WIS | `wis` |
| CHA | `cha` |

**Modifier Calculation:**
```javascript
modifier = Math.floor((score - 10) / 2)
```

**Proficient Field:**
- `0` = Not proficient in saves
- `1` = Proficient in saves
- Set from Saving Throws line

---

## Challenge Rating

### D&D Format
**Example:** `Challenge 1/4 (50 XP)`

**Foundry Location:**
```json
{
  "system": {
    "details": {
      "cr": 0.25
    }
  }
}
```

**Fraction Conversion:**
| D&D | Foundry |
|-----|---------|
| 0 | `0` |
| 1/8 | `0.125` |
| 1/4 | `0.25` |
| 1/2 | `0.5` |
| 1 | `1` |
| 2 | `2` |
| ... | ... |
| 30 | `30` |

**Proficiency Bonus from CR:**
| CR Range | Prof Bonus |
|----------|------------|
| 0-4 | +2 |
| 5-8 | +3 |
| 9-12 | +4 |
| 13-16 | +5 |
| 17+ | +6 |

---

## Saving Throws

### D&D Format
**Example:** `Saving Throws: Dex +5, Wis +3`

**Foundry Location:**
Stored in abilities as `proficient` flag:
```json
{
  "system": {
    "abilities": {
      "dex": {
        "value": 14,
        "proficient": 1  // <-- Set to 1 if has save
      },
      "wis": {
        "value": 12,
        "proficient": 1  // <-- Set to 1 if has save
      },
      "str": {
        "value": 10,
        "proficient": 0  // <-- Set to 0 if no save
      }
    }
  }
}
```

**Proficiency Detection:**
```
If save bonus = ability modifier + proficiency bonus:
  → proficient = 1
Otherwise:
  → proficient = 0 (Foundry will show base mod)
```

**Example Calculation:**
```
Dex +5 save, DEX 14 (+2), CR 1/4 (prof +2)
Expected: +2 (mod) + 2 (prof) = +4
Actual: +5
Result: proficient = 1 (has bonus item or feature)
```

---

## Skills

### D&D Format
**Example:** `Skills: Stealth +6, Perception +2`

**Foundry Location:**
```json
{
  "system": {
    "skills": {
      "ste": {
        "ability": "dex",
        "roll": { "min": null, "max": null, "mode": 0 },
        "value": 1,
        "bonuses": { "check": "", "passive": "" }
      },
      "prc": {
        "ability": "wis",
        "roll": { "min": null, "max": null, "mode": 0 },
        "value": 0,
        "bonuses": { "check": "", "passive": "" }
      }
    }
  }
}
```

**Skill Abbreviation Map:**
| Full Name | Code |
|-----------|------|
| Acrobatics | `acr` |
| Animal Handling | `ani` |
| Arcana | `arc` |
| Athletics | `ath` |
| Deception | `dec` |
| History | `his` |
| Insight | `ins` |
| Intimidation | `itm` |
| Investigation | `inv` |
| Medicine | `med` |
| Nature | `nat` |
| Perception | `prc` |
| Performance | `prf` |
| Persuasion | `per` |
| Religion | `rel` |
| Sleight of Hand | `slt` |
| Stealth | `ste` |
| Survival | `sur` |

**Skill to Ability Map:**
| Skill | Ability |
|-------|---------|
| acr | dex |
| ani | wis |
| arc | int |
| ath | str |
| dec | cha |
| his | int |
| ins | wis |
| itm | cha |
| inv | int |
| med | wis |
| nat | int |
| prc | wis |
| prf | cha |
| per | cha |
| rel | int |
| slt | dex |
| ste | dex |
| sur | wis |

**Value Field:**
- `0` = Not proficient
- `1` = Proficient (×1 prof bonus)
- `2` = Expertise (×2 prof bonus)

**Proficiency Detection:**
```
Expected with proficiency = ability mod + prof bonus
Expected with expertise = ability mod + (prof bonus × 2)

If actual = expected proficiency: value = 1
If actual = expected expertise: value = 2
If actual > ability mod but doesn't match: value = 1 (custom bonus)
Otherwise: value = 0
```

---

## Senses

### D&D Format
**Example:** `Senses: darkvision 60 ft., passive Perception 9`

**Foundry Location:**
```json
{
  "system": {
    "attributes": {
      "senses": {
        "darkvision": null,
        "blindsight": null,
        "tremorsense": null,
        "truesight": null,
        "units": null,
        "special": "darkvision 60 ft., passive Perception 9"
      }
    }
  }
}
```

**Notes:**
- Currently stored in `special` field as text
- Individual senses (darkvision, etc.) not parsed yet
- Future: Extract numeric values for each sense type

---

## Languages

### D&D Format
**Example:** `Languages: Common, Goblin`

**Foundry Location:**
```json
{
  "system": {
    "traits": {
      "languages": {
        "value": ["common", "goblin"],
        "custom": "",
        "communication": {}
      }
    }
  }
}
```

**Processing:**
1. Remove parenthetical notes: `(others at DM's discretion)`
2. Split on commas
3. Trim whitespace
4. Convert to lowercase
5. Store in array

---

## Damage Types (Future - Phase 6)

### Resistances
**D&D Format:** `Damage Resistances: fire, cold`

**Foundry Location:**
```json
{
  "system": {
    "traits": {
      "dr": {
        "bypasses": [],
        "value": ["fire", "cold"],
        "custom": ""
      }
    }
  }
}
```

### Immunities
**D&D Format:** `Damage Immunities: poison, psychic`

**Foundry Location:**
```json
{
  "system": {
    "traits": {
      "di": {
        "bypasses": [],
        "value": ["poison", "psychic"],
        "custom": ""
      }
    }
  }
}
```

### Vulnerabilities
**D&D Format:** `Damage Vulnerabilities: fire`

**Foundry Location:**
```json
{
  "system": {
    "traits": {
      "dv": {
        "bypasses": [],
        "value": ["fire"],
        "custom": ""
      }
    }
  }
}
```

---

## Condition Immunities (Future - Phase 6)

**D&D Format:** `Condition Immunities: charmed, frightened`

**Foundry Location:**
```json
{
  "system": {
    "traits": {
      "ci": {
        "value": ["charmed", "frightened"],
        "custom": ""
      }
    }
  }
}
```

---

## Default Values

When fields are not found, these defaults are used:

| Field | Default |
|-------|---------|
| Name | "Unknown" |
| Size | "medium" → "med" |
| Type | "humanoid" |
| Alignment | "unaligned" |
| AC | 10 |
| HP | 5 |
| Walk Speed | 30 |
| All Abilities | 10 |
| CR | 1 |
| Saves | None (proficient = 0) |
| Skills | None (value = 0) |
| Senses | Empty string |
| Languages | Empty array |

---

## Field Priority

### Critical (Must Parse)
1. Name
2. Abilities
3. AC
4. HP
5. CR

### High Priority
6. Size
7. Type
8. Saves
9. Skills

### Medium Priority
10. Alignment
11. Speed
12. Senses
13. Languages

### Low Priority (Future)
14. Damage Resistances
15. Damage Immunities
16. Condition Immunities
17. Actions
18. Legendary Actions

---

## Foundry Calculates

These values are calculated by Foundry, not stored in JSON:

- **Ability Modifiers**: Calculated from scores
- **Save Bonuses**: Base mod + proficiency (if proficient = 1)
- **Skill Bonuses**: Base mod + proficiency (based on value 0/1/2)
- **Passive Perception**: 10 + Perception bonus
- **Initiative**: DEX modifier + bonuses
- **Proficiency Bonus**: From CR

**This means:**
- We only store ability scores and proficient flags
- Foundry handles all the math
- Bonuses auto-update if abilities change

---

## Special Cases

### Expertise
D&D doesn't explicitly mark expertise, but we detect it:
```
If skill bonus = ability mod + (prof bonus × 2):
  → skill.value = 2
```

### Custom Bonuses
If skill/save bonus doesn't match standard proficiency:
```
Assume item/feature bonus
Mark as proficient (value = 1 or proficient = 1)
Let Foundry handle the calculation
```

### Missing Sections
If section not found in stat block:
```
Use defaults
Add warning to UI
User can edit via field editor
```

---

## JSON Structure Summary

```json
{
  "name": "Creature Name",
  "type": "npc",
  "system": {
    "currency": {},        // Currency amounts
    "abilities": {},       // Ability scores + save proficiency
    "bonuses": {},         // Attack/ability bonuses
    "skills": {},          // Skill proficiencies
    "tools": {},           // Tool proficiencies
    "spells": {},          // Spell slots
    "attributes": {
      "init": {},          // Initiative
      "movement": {},      // Speeds
      "attunement": {},    // Attunement slots
      "senses": {},        // Vision/senses
      "ac": {},            // Armor class
      "hp": {},            // Hit points
      "death": {}          // Death saves
    },
    "details": {
      "biography": {},     // Description
      "alignment": "",     // Alignment
      "type": {},          // Creature type
      "cr": 0              // Challenge rating
    },
    "resources": {},       // Legendary/lair
    "traits": {
      "size": "",          // Size code
      "di": {},            // Damage immunities
      "dr": {},            // Damage resistances
      "dv": {},            // Damage vulnerabilities
      "ci": {},            // Condition immunities
      "languages": {}      // Languages
    },
    "source": {}           // Rules version
  },
  "items": [],             // Actions/features
  "effects": [],           // Active effects
  "flags": {},             // Module flags
  "_stats": {}             // Foundry metadata
}
```