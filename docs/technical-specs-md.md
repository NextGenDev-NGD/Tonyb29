# Technical Specifications

## System Architecture

### Component Structure
```
App (tab router)
├── StatBlockParser          — single stat block parse + FGU export
├── ClassImporter            — homebrew class → Foundry macro
├── BatchProcessor           — multi-block parse + bulk export
└── JSONValidator            — reference vs. output comparison

parseStatBlock(text)         — module-level named export (dnd-parser-v20-stable.tsx)
  └── imported by both StatBlockParser and BatchProcessor
      returns { errors, warnings, stats, actor }

toFantasyGroundsXML(actor)   — module-level named export (fantasy-grounds-exporter.ts)
  └── imported by both StatBlockParser and BatchProcessor
```

### StatBlockParser Component
```
StatBlockParser (Root Component)
├── State Management (useState hooks)
├── runParse(text) — calls parseStatBlock, sets state from return value
├── Edit Logic (startEdit, saveEdit, applyFieldEdit)
└── UI Rendering
    ├── Input Section (textarea + parse button)
    ├── Analytics Section (accuracy display)
    ├── Field Editor Section (editable fields)
    └── Output Section (JSON display + FGU export)
```

### BatchProcessor Component
```
BatchProcessor
├── splitBlocks(text) — splits on /^---+$/m delimiter
├── runAll() — maps blocks through parseStatBlock, collects BlockResult[]
├── buildMacroScript() — embeds actor array in Foundry Actor.create() script
├── downloadAll() / downloadFGU() / downloadMacro() / copyMacro()
└── UI Rendering
    ├── Input Section (multi-block textarea)
    ├── Summary Bar (ok/warn/failed counts + bulk export buttons)
    └── Results Panel (per-creature cards with status, accuracy, defaulted fields)
```

### BlockResult Type
```typescript
type BlockResult = {
  index: number
  name: string
  accuracy: number | null
  defaultedFields: string[]   // field names that fell back to defaults
  errors: string[]
  warnings: string[]
  actor: any                  // null if parse failed
}
```

### State Variables
```javascript
const [input, setInput] = useState('');           // Raw stat block text
const [output, setOutput] = useState(null);       // Foundry JSON object
const [errors, setErrors] = useState([]);         // Parse errors array
const [warnings, setWarnings] = useState([]);     // Parse warnings array
const [parseStats, setParseStats] = useState(null); // Analytics object
const [copied, setCopied] = useState(false);      // Copy feedback state
const [showEditor, setShowEditor] = useState(false); // Editor visibility
const [editField, setEditField] = useState(null); // Currently editing field
const [editValue, setEditValue] = useState('');   // Edit input value
```

## Foundry VTT JSON Structure

### Complete Actor Schema (v3.3+)
```json
{
  "name": "string",
  "type": "npc",
  "system": {
    "currency": { "pp": 0, "gp": 0, "ep": 0, "sp": 0, "cp": 0 },
    "abilities": {
      "str": {
        "value": 10,
        "proficient": 0,
        "max": null,
        "bonuses": { "check": "", "save": "" },
        "check": { "roll": { "min": null, "max": null, "mode": 0 } },
        "save": { "roll": { "min": null, "max": null, "mode": 0 } }
      }
      // ... dex, con, int, wis, cha (same structure)
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
      "acr": {
        "ability": "dex",
        "roll": { "min": null, "max": null, "mode": 0 },
        "value": 0,
        "bonuses": { "check": "", "passive": "" }
      }
      // ... other skills
    },
    "tools": {},
    "spells": {
      "spell1": { "value": 0, "override": null }
      // ... spell2-9, pact
    },
    "attributes": {
      "init": {
        "ability": "",
        "roll": { "min": null, "max": null, "mode": 0 },
        "bonus": ""
      },
      "movement": {
        "burrow": null,
        "climb": null,
        "fly": null,
        "swim": null,
        "walk": 30,
        "units": null,
        "hover": false,
        "ignoredDifficultTerrain": []
      },
      "attunement": { "max": 3 },
      "senses": {
        "darkvision": null,
        "blindsight": null,
        "tremorsense": null,
        "truesight": null,
        "units": null,
        "special": ""
      },
      "spellcasting": "int",
      "exhaustion": 0,
      "concentration": {
        "ability": "",
        "roll": { "min": null, "max": null, "mode": 0 },
        "bonuses": { "save": "" },
        "limit": 1
      },
      "ac": { "flat": 10, "calc": "natural" },
      "hd": { "spent": 0 },
      "hp": { "value": 10, "max": 10, "temp": 0, "tempmax": 0, "formula": "" },
      "death": {
        "roll": { "min": null, "max": null, "mode": 0 },
        "success": 0,
        "failure": 0,
        "bonuses": { "save": "" }
      },
      "spell": { "level": 0 },
      "loyalty": {}
    },
    "details": {
      "biography": { "value": "", "public": "" },
      "alignment": "",
      "ideal": "",
      "bond": "",
      "flaw": "",
      "race": null,
      "type": { "value": "humanoid", "custom": "", "subtype": "", "swarm": "" },
      "cr": 1,
      "habitat": { "custom": "", "value": [] },
      "treasure": { "value": [] }
    },
    "resources": {
      "legact": { "max": 0, "spent": 0 },
      "legres": { "max": 0, "spent": 0 },
      "lair": { "value": false, "initiative": null, "inside": false }
    },
    "traits": {
      "size": "med",
      "di": { "bypasses": [], "value": [], "custom": "" },
      "dr": { "bypasses": [], "value": [], "custom": "" },
      "dv": { "bypasses": [], "value": [], "custom": "" },
      "dm": { "amount": {}, "bypasses": [] },
      "ci": { "value": [], "custom": "" },
      "languages": { "value": [], "custom": "", "communication": {} },
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

## Parsing Logic

### Modifier Calculation
```javascript
const mod = (score) => Math.floor((score - 10) / 2);
```

### Proficiency Bonus Calculation
```javascript
const profBonus = (() => {
  const crNum = parseFloat(cr);
  if (crNum < 5) return 2;
  if (crNum < 9) return 3;
  if (crNum < 13) return 4;
  if (crNum < 17) return 5;
  return 6;
})();
```

### Size Code Mapping
```javascript
const sizeCode = {
  'tiny': 'tiny',
  'small': 'sm',
  'medium': 'med',
  'large': 'lg',
  'huge': 'huge',
  'gargantuan': 'grg'
}[size] || 'med';
```

### Skill Abbreviations
```javascript
const skillMap = {
  'acrobatics': 'acr',
  'animal handling': 'ani',
  'arcana': 'arc',
  'athletics': 'ath',
  'deception': 'dec',
  'history': 'his',
  'insight': 'ins',
  'intimidation': 'itm',
  'investigation': 'inv',
  'medicine': 'med',
  'nature': 'nat',
  'perception': 'prc',
  'performance': 'prf',
  'persuasion': 'per',
  'religion': 'rel',
  'sleight of hand': 'slt',
  'stealth': 'ste',
  'survival': 'sur'
};
```

### Skill to Ability Mapping
```javascript
const skillAbilityMap = {
  'acr': 'dex', 'ani': 'wis', 'arc': 'int', 'ath': 'str',
  'dec': 'cha', 'his': 'int', 'ins': 'wis', 'itm': 'cha',
  'inv': 'int', 'med': 'wis', 'nat': 'int', 'prc': 'wis',
  'prf': 'cha', 'per': 'cha', 'rel': 'int', 'slt': 'dex',
  'ste': 'dex', 'sur': 'wis'
};
```

## Performance Considerations

### Parse Time
- Average: 50-150ms for standard stat block
- Large stat blocks (Strahd): 200-300ms

### Memory Usage
- Base component: ~2MB
- Per parsed actor: ~50KB

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### API Dependencies
- No external API calls
- All processing client-side
- No network requirements after load

## Data Flow

### Parse Flow
```
User Input (textarea)
    ↓
parseStatBlock() function
    ↓
Regex Pattern Matching
    ↓
Data Extraction & Validation
    ↓
Proficiency Calculations
    ↓
Foundry JSON Construction
    ↓
setState() updates
    ↓
UI Re-render with Results
```

### Edit Flow
```
User clicks Edit icon
    ↓
startEdit() - loads current value
    ↓
User modifies value
    ↓
User clicks Save
    ↓
saveEdit() - updates both output & parseStats
    ↓
setState() updates
    ↓
UI Re-render with updated values
```

### Export Flow
```
User clicks Download/Copy
    ↓
JSON.stringify(output, null, 2)
    ↓
Download: Create Blob → URL → trigger download
Copy: navigator.clipboard.writeText()
    ↓
User feedback (copied message/file download)
```

## Activities System (dnd5e v4.0+)

### Background

Foundry dnd5e v4.0 (current: v5.2.5) replaced `system.actionType / attack / damage.parts` on items with a new `system.activities` map. The parser was updated in v2.0-alpha.1 (Block 3) to emit this structure for all actions.

### Helper Functions

#### `parseDiceFormula(s: string): DamageField | null`
Converts a dice formula string to a Foundry DamageField object.

```
"2d8+5" → { number:2, denomination:8, bonus:"+5", types:[], custom:{enabled:false, formula:""}, scaling:{...} }
"3d6"   → { number:3, denomination:6, bonus:"",   types:[], ... }
"5"     → { number:0, denomination:0, bonus:"",   types:[], custom:{enabled:true, formula:"5"}, ... }
```

`types[]` is populated by the caller (set to `[a.damage.type]` from action parsing).

#### `parseSaveInfo(desc: string): { ability: string, dc: string } | null`
Extracts saving throw info from action description text. Handles both D&D editions:

- 2024 format: `"Strength Saving Throw: DC 13"` → `{ ability: "str", dc: "13" }`
- 2014 format: `"DC 13 Strength saving throw"` → `{ ability: "str", dc: "13" }`

Returns `null` if no saving throw detected.

#### `SAVE_ABBR` map
Maps full ability names and 3-letter codes to canonical 3-letter codes:
```
{ strength: 'str', dexterity: 'dex', constitution: 'con',
  intelligence: 'int', wisdom: 'wis', charisma: 'cha',
  str: 'str', dex: 'dex', ... }
```

### Action Classification Logic

```
parseActions() produces: { name, qualifier, description, attack, damage }
                                    ↓
items.map() classifies each action:

isAttack  = !!a.attack                              → type:"weapon", activity:"attack"
saveInfo  = parseSaveInfo(a.description) !== null   → type:"feat",   activity:"save"
otherwise                                           → type:"feat",   activity:"utility"
```

### Attack Ability Inference

For weapon attacks, the parser infers whether STR or DEX was used:

```
strTotal = mod(abilities.str) + profBonus
dexTotal = mod(abilities.dex) + profBonus
b        = a.attack.bonus (listed attack bonus)

if |b - strTotal| ≤ |b - dexTotal| → ability = "str", bonus = b - strTotal
else                                → ability = "dex", bonus = b - dexTotal

bonus stored as "" if 0, else e.g. "+2"
```

### Recharge Parsing

Qualifier text (e.g. `"Recharge 4–6"`) captured in `parseActions()` group 2:

```
a.qualifier = "Recharge 4–6"
rchM = a.qualifier.match(/Recharge\s+(\d+)(?:[–\-]\d+)?/i)
→ itemUses = { value:4, max:"6", per:null, recovery:[{period:"recharge", formula:"4", type:"recoverAll"}] }
```

### Deprecated Item Fields (dnd5e v4.0+)

These fields are **no longer emitted** and should not be used:

| Old field | Replacement |
|---|---|
| `system.actionType` | Activity `type` field (`"attack"`, `"save"`, `"utility"`) |
| `system.attack.bonus` | `activity.attack.bonus` |
| `system.damage.parts[]` | `system.damage.base` (DamageField) + `activity.damage.parts[]` |
| `system.range` | `activity.range` |

---

## Error Handling

### Try-Catch Blocks
- Main parsing wrapped in try-catch
- Individual field parsing continues on error
- Errors collected in errors array

### Validation
- Empty input check
- Numeric field validation (AC, HP, CR)
- Array field validation (skills, saves)

### User Feedback
- Red error boxes for critical failures
- Yellow warning boxes for defaults used
- Green success indicators for exact matches