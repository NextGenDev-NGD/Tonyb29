# Foundry VTT Actor JSON Schema

## Overview
This document provides the complete JSON schema for Foundry VTT v3.3+ NPC Actor format, as used by the D&D 5e system.

---

## Root Structure

```typescript
interface FoundryActor {
  name: string;                    // Actor name
  type: "npc";                     // Actor type (always "npc" for monsters)
  system: SystemData;              // Main actor data
  items: Item[];                   // Actions, features, equipment
  effects: Effect[];               // Active effects
  flags: Record<string, any>;      // Module-specific flags
  _stats: Stats;                   // Foundry metadata
  folder?: string;                 // Optional folder ID
  img?: string;                    // Optional token image URL
  prototypeToken?: TokenData;      // Optional token configuration
}
```

---

## System Data Structure

```typescript
interface SystemData {
  currency: Currency;
  abilities: Abilities;
  bonuses: Bonuses;
  skills: Skills;
  tools: Record<string, any>;
  spells: Spells;
  attributes: Attributes;
  details: Details;
  resources: Resources;
  traits: Traits;
  source: Source;
}
```

---

## Currency

```typescript
interface Currency {
  pp: number;  // Platinum pieces
  gp: number;  // Gold pieces
  ep: number;  // Electrum pieces
  sp: number;  // Silver pieces
  cp: number;  // Copper pieces
}
```

**Default Values:**
```json
{
  "pp": 0,
  "gp": 0,
  "ep": 0,
  "sp": 0,
  "cp": 0
}
```

---

## Abilities

```typescript
interface Abilities {
  str: Ability;
  dex: Ability;
  con: Ability;
  int: Ability;
  wis: Ability;
  cha: Ability;
}

interface Ability {
  value: number;                  // Ability score (1-30)
  proficient: 0 | 1;              // 0 = not proficient in save, 1 = proficient
  max: number | null;             // Maximum value (usually null for NPCs)
  bonuses: AbilityBonuses;
  check: RollConfig;
  save: RollConfig;
}

interface AbilityBonuses {
  check: string;  // Bonus formula for ability checks
  save: string;   // Bonus formula for saving throws
}

interface RollConfig {
  roll: {
    min: number | null;
    max: number | null;
    mode: number;  // 0 = normal, 1 = advantage, -1 = disadvantage
  };
}
```

**Example (STR):**
```json
{
  "str": {
    "value": 14,
    "proficient": 0,
    "max": null,
    "bonuses": {
      "check": "",
      "save": ""
    },
    "check": {
      "roll": {
        "min": null,
        "max": null,
        "mode": 0
      }
    },
    "save": {
      "roll": {
        "min": null,
        "max": null,
        "mode": 0
      }
    }
  }
}
```

**Notes:**
- `proficient: 1` means the creature is proficient in that ability's saving throw
- Foundry calculates the actual save bonus from: base modifier + (proficiency bonus if proficient)
- Modifiers are calculated automatically: `floor((value - 10) / 2)`

---

## Bonuses

```typescript
interface Bonuses {
  mwak: AttackBonus;    // Melee weapon attack
  rwak: AttackBonus;    // Ranged weapon attack
  msak: AttackBonus;    // Melee spell attack
  rsak: AttackBonus;    // Ranged spell attack
  abilities: AbilityBonus;
  spell: SpellBonus;
}

interface AttackBonus {
  attack: string;  // Bonus to attack rolls (formula)
  damage: string;  // Bonus to damage rolls (formula)
}

interface AbilityBonus {
  check: string;  // Bonus to all ability checks
  save: string;   // Bonus to all saves
  skill: string;  // Bonus to all skill checks
}

interface SpellBonus {
  dc: string;  // Bonus to spell DC
}
```

**Default Values:**
```json
{
  "mwak": { "attack": "", "damage": "" },
  "rwak": { "attack": "", "damage": "" },
  "msak": { "attack": "", "damage": "" },
  "rsak": { "attack": "", "damage": "" },
  "abilities": { "check": "", "save": "", "skill": "" },
  "spell": { "dc": "" }
}
```

---

## Skills

```typescript
interface Skills {
  acr: Skill;  // Acrobatics (DEX)
  ani: Skill;  // Animal Handling (WIS)
  arc: Skill;  // Arcana (INT)
  ath: Skill;  // Athletics (STR)
  dec: Skill;  // Deception (CHA)
  his: Skill;  // History (INT)
  ins: Skill;  // Insight (WIS)
  itm: Skill;  // Intimidation (CHA)
  inv: Skill;  // Investigation (INT)
  med: Skill;  // Medicine (WIS)
  nat: Skill;  // Nature (INT)
  prc: Skill;  // Perception (WIS)
  prf: Skill;  // Performance (CHA)
  per: Skill;  // Persuasion (CHA)
  rel: Skill;  // Religion (INT)
  slt: Skill;  // Sleight of Hand (DEX)
  ste: Skill;  // Stealth (DEX)
  sur: Skill;  // Survival (WIS)
}

interface Skill {
  ability: string;      // Which ability modifier to use
  roll: RollConfig;     // Roll configuration
  value: 0 | 1 | 2;     // 0 = not proficient, 1 = proficient, 2 = expertise
  bonuses: SkillBonuses;
}

interface SkillBonuses {
  check: string;    // Bonus formula for skill checks
  passive: string;  // Bonus formula for passive checks
}
```

**Example (Stealth):**
```json
{
  "ste": {
    "ability": "dex",
    "roll": {
      "min": null,
      "max": null,
      "mode": 0
    },
    "value": 1,
    "bonuses": {
      "check": "",
      "passive": ""
    }
  }
}
```

**Proficiency Values:**
- `0` = Not proficient (uses only ability modifier)
- `1` = Proficient (ability modifier + proficiency bonus)
- `2` = Expertise (ability modifier + proficiency bonus × 2)

---

## Spells

```typescript
interface Spells {
  spell1: SpellSlot;
  spell2: SpellSlot;
  spell3: SpellSlot;
  spell4: SpellSlot;
  spell5: SpellSlot;
  spell6: SpellSlot;
  spell7: SpellSlot;
  spell8: SpellSlot;
  spell9: SpellSlot;
  pact: SpellSlot;
}

interface SpellSlot {
  value: number;        // Current spell slots
  override: number | null;  // Override max slots
}
```

**Default Values:**
```json
{
  "spell1": { "value": 0, "override": null },
  "spell2": { "value": 0, "override": null },
  // ... etc for all levels
  "pact": { "value": 0, "override": null }
}
```

---

## Attributes

```typescript
interface Attributes {
  init: Initiative;
  movement: Movement;
  attunement: Attunement;
  senses: Senses;
  spellcasting: string;
  exhaustion: number;
  concentration: Concentration;
  ac: ArmorClass;
  hd: HitDice;
  hp: HitPoints;
  death: DeathSaves;
  spell: SpellLevel;
  loyalty: Record<string, any>;
}
```

### Initiative
```typescript
interface Initiative {
  ability: string;
  roll: RollConfig;
  bonus: string;  // Formula for initiative bonus
}
```

### Movement
```typescript
interface Movement {
  burrow: number | null;
  climb: number | null;
  fly: number | null;
  swim: number | null;
  walk: number;
  units: string | null;
  hover: boolean;
  ignoredDifficultTerrain: string[];
}
```

**Example:**
```json
{
  "burrow": null,
  "climb": 20,
  "fly": 40,
  "swim": null,
  "walk": 30,
  "units": null,
  "hover": false,
  "ignoredDifficultTerrain": []
}
```

### Attunement
```typescript
interface Attunement {
  max: number;  // Maximum attuned items (usually 3)
}
```

### Senses
```typescript
interface Senses {
  darkvision: number | null;
  blindsight: number | null;
  tremorsense: number | null;
  truesight: number | null;
  units: string | null;
  special: string;  // Other senses as text
}
```

**Example:**
```json
{
  "darkvision": 60,
  "blindsight": null,
  "tremorsense": null,
  "truesight": null,
  "units": null,
  "special": "darkvision 60 ft., passive Perception 9"
}
```

### Concentration
```typescript
interface Concentration {
  ability: string;
  roll: RollConfig;
  bonuses: {
    save: string;
  };
  limit: number;  // Max concurrent concentrations
}
```

### Armor Class
```typescript
interface ArmorClass {
  flat: number;           // AC value
  calc: string;           // Calculation method ("natural", "default", "custom", etc.)
  formula?: string;       // Optional formula or armor description
}
```

**Common calc values:**
- `"natural"` - Natural armor (standard for NPCs)
- `"default"` - 10 + DEX modifier
- `"custom"` - Custom formula
- `"flat"` - Use flat value only

### Hit Dice
```typescript
interface HitDice {
  spent: number;  // Spent hit dice
}
```

### Hit Points
```typescript
interface HitPoints {
  value: number;      // Current HP
  max: number;        // Maximum HP
  temp: number;       // Temporary HP
  tempmax: number;    // Temporary max HP
  formula: string;    // Dice formula (e.g., "2d6 + 2")
}
```

### Death Saves
```typescript
interface DeathSaves {
  roll: RollConfig;
  success: number;  // 0-3
  failure: number;  // 0-3
  bonuses: {
    save: string;
  };
}
```

### Spell Level
```typescript
interface SpellLevel {
  level: number;  // Caster level for NPCs
}
```

---

## Details

```typescript
interface Details {
  biography: Biography;
  alignment: string;
  ideal: string;
  bond: string;
  flaw: string;
  race: string | null;
  type: CreatureType;
  cr: number;
  habitat: Habitat;
  treasure: Treasure;
}

interface Biography {
  value: string;   // HTML description
  public: string;  // Public description
}

interface CreatureType {
  value: string;   // "humanoid", "dragon", etc.
  custom: string;  // Custom type text
  subtype: string; // e.g., "goblinoid"
  swarm: string;   // Swarm size if applicable
}

interface Habitat {
  custom: string;
  value: string[];  // Array of habitat types
}

interface Treasure {
  value: string[];  // Array of treasure types
}
```

**Example:**
```json
{
  "biography": {
    "value": "<p>A goblin description</p>",
    "public": ""
  },
  "alignment": "neutral evil",
  "ideal": "",
  "bond": "",
  "flaw": "",
  "race": null,
  "type": {
    "value": "humanoid",
    "custom": "",
    "subtype": "goblinoid",
    "swarm": ""
  },
  "cr": 0.25,
  "habitat": {
    "custom": "",
    "value": []
  },
  "treasure": {
    "value": []
  }
}
```

---

## Resources

```typescript
interface Resources {
  legact: LegendaryActions;
  legres: LegendaryResistances;
  lair: Lair;
}

interface LegendaryActions {
  max: number;    // Max legendary actions per round
  spent: number;  // Spent legendary actions
}

interface LegendaryResistances {
  max: number;    // Max legendary resistances
  spent: number;  // Spent legendary resistances
}

interface Lair {
  value: boolean;        // Has lair actions
  initiative: number | null;  // Lair initiative count
  inside: boolean;       // Currently inside lair
}
```

**Default Values:**
```json
{
  "legact": { "max": 0, "spent": 0 },
  "legres": { "max": 0, "spent": 0 },
  "lair": { "value": false, "initiative": null, "inside": false }
}
```

---

## Traits

```typescript
interface Traits {
  size: string;  // "tiny", "sm", "med", "lg", "huge", "grg"
  di: DamageType;  // Damage immunities
  dr: DamageType;  // Damage resistances
  dv: DamageType;  // Damage vulnerabilities
  dm: DamageModification;
  ci: ConditionImmunity;
  languages: Languages;
  important: boolean;
}

interface DamageType {
  bypasses: string[];  // Bypass conditions (e.g., ["magical"])
  value: string[];     // Damage types
  custom: string;      // Custom damage types
}

interface DamageModification {
  amount: Record<string, any>;
  bypasses: string[];
}

interface ConditionImmunity {
  value: string[];  // Condition types
  custom: string;   // Custom conditions
}

interface Languages {
  value: string[];              // Known languages
  custom: string;               // Custom languages
  communication: Record<string, any>;
}
```

**Size Codes:**
- `"tiny"` = Tiny
- `"sm"` = Small
- `"med"` = Medium
- `"lg"` = Large
- `"huge"` = Huge
- `"grg"` = Gargantuan

**Example:**
```json
{
  "size": "sm",
  "di": {
    "bypasses": [],
    "value": ["poison", "psychic"],
    "custom": ""
  },
  "dr": {
    "bypasses": [],
    "value": ["fire", "cold"],
    "custom": ""
  },
  "dv": {
    "bypasses": [],
    "value": ["radiant"],
    "custom": ""
  },
  "dm": {
    "amount": {},
    "bypasses": []
  },
  "ci": {
    "value": ["charmed", "frightened"],
    "custom": ""
  },
  "languages": {
    "value": ["common", "goblin"],
    "custom": "",
    "communication": {}
  },
  "important": false
}
```

---

## Source

```typescript
interface Source {
  revision: number;  // Source revision number
  rules: string;     // Rules edition ("2014" or "2024")
}
```

**Default:**
```json
{
  "revision": 1,
  "rules": "2014"
}
```

---

## Items Array

```typescript
interface Item {
  name: string;
  type: string;  // "feat", "weapon", "spell", etc.
  _id: string;   // Unique ID
  img: string;   // Icon path
  system: any;   // Item-specific data
  effects: Effect[];
  folder: string | null;
  sort: number;
  flags: Record<string, any>;
  _stats: Stats;
  ownership: Record<string, number>;
}
```

**Common Item Types:**
- `"feat"` - Features, traits, actions
- `"weapon"` - Weapons
- `"spell"` - Spells
- `"equipment"` - Armor, items
- `"consumable"` - Potions, scrolls

---

## Effects Array

```typescript
interface Effect {
  // Active effects structure
  // (Currently empty array for basic NPCs)
}
```

---

## Stats

```typescript
interface Stats {
  coreVersion: string;    // Foundry core version
  systemId: string;       // "dnd5e"
  systemVersion: string;  // D&D5e system version
  createdTime?: number;
  modifiedTime?: number;
  lastModifiedBy?: string;
}
```

**Example:**
```json
{
  "coreVersion": "13.348",
  "systemId": "dnd5e",
  "systemVersion": "5.1.8"
}
```

---

## Complete Minimal Example

```json
{
  "name": "Goblin",
  "type": "npc",
  "system": {
    "currency": { "pp": 0, "gp": 0, "ep": 0, "sp": 0, "cp": 0 },
    "abilities": {
      "str": {
        "value": 8,
        "proficient": 0,
        "max": null,
        "bonuses": { "check": "", "save": "" },
        "check": { "roll": { "min": null, "max": null, "mode": 0 } },
        "save": { "roll": { "min": null, "max": null, "mode": 0 } }
      }
      // ... other abilities
    },
    "bonuses": {
      "mwak": { "attack": "", "damage": "" },
      "rwak": { "attack": "", "damage": "" },
      "msak": { "attack": "", "damage": "" },
      "rsak": { "attack": "", "damage": "" },
      "abilities": { "check": "", "save": "", "skill": "" },
      "spell": { "dc": "" }
    },
    "skills": {
      // All 18 skills with structure shown above
    },
    "tools": {},
    "spells": {
      // All spell levels as shown above
    },
    "attributes": {
      "init": { "ability": "", "roll": { "min": null, "max": null, "mode": 0 }, "bonus": "" },
      "movement": { "burrow": null, "climb": null, "fly": null, "swim": null, "walk": 30, "units": null, "hover": false, "ignoredDifficultTerrain": [] },
      "attunement": { "max": 3 },
      "senses": { "darkvision": null, "blindsight": null, "tremorsense": null, "truesight": null, "units": null, "special": "" },
      "spellcasting": "int",
      "exhaustion": 0,
      "concentration": { "ability": "", "roll": { "min": null, "max": null, "mode": 0 }, "bonuses": { "save": "" }, "limit": 1 },
      "ac": { "flat": 15, "calc": "natural" },
      "hd": { "spent": 0 },
      "hp": { "value": 7, "max": 7, "temp": 0, "tempmax": 0, "formula": "2d6" },
      "death": { "roll": { "min": null, "max": null, "mode": 0 }, "success": 0, "failure": 0, "bonuses": { "save": "" } },
      "spell": { "level": 0 },
      "loyalty": {}
    },
    "details": {
      "biography": { "value": "", "public": "" },
      "alignment": "neutral evil",
      "ideal": "",
      "bond": "",
      "flaw": "",
      "race": null,
      "type": { "value": "humanoid", "custom": "", "subtype": "", "swarm": "" },
      "cr": 0.25,
      "habitat": { "custom": "", "value": [] },
      "treasure": { "value": [] }
    },
    "resources": {
      "legact": { "max": 0, "spent": 0 },
      "legres": { "max": 0, "spent": 0 },
      "lair": { "value": false, "initiative": null, "inside": false }
    },
    "traits": {
      "size": "sm",
      "di": { "bypasses": [], "value": [], "custom": "" },
      "dr": { "bypasses": [], "value": [], "custom": "" },
      "dv": { "bypasses": [], "value": [], "custom": "" },
      "dm": { "amount": {}, "bypasses": [] },
      "ci": { "value": [], "custom": "" },
      "languages": { "value": ["common", "goblin"], "custom": "", "communication": {} },
      "important": false
    },
    "source": { "revision": 1, "rules": "2014" }
  },
  "items": [],
  "effects": [],
  "flags": {},
  "_stats": {
    "coreVersion": "13.348",
    "systemId": "dnd5e",
    "systemVersion": "5.1.8"
  }
}
```

---

## Validation Rules

### Required Fields
- `name` (string)
- `type` ("npc")
- `system` (complete SystemData object)
- `items` (array, can be empty)
- `effects` (array, can be empty)

### Calculated by Foundry
- Ability modifiers
- Save bonuses (from proficient flag + base mod)
- Skill bonuses (from value + base mod)
- Proficiency bonus (from CR)
- Passive perception

### Never Change
- `_stats.systemId` = "dnd5e"
- `type` = "npc"
- Most null values in roll configs

---

## Version Compatibility

This schema is for:
- **Foundry VTT:** v11+ (tested on v13.348)
- **D&D5e System:** v3.3+ (tested on v5.1.8)
- **Rules Edition:** 2014 (5th Edition)

**Note:** Schema may change in future Foundry/system versions.

---

## Related Documentation

- See `FIELD_MAPPING.md` for how D&D fields map to this schema
- See `COMPLETE_SOURCE.md` for code that generates this structure
- See `TECHNICAL_SPECS.md` for implementation details