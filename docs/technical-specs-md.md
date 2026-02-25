# Technical Specifications

## System Architecture

### Component Structure
```
StatBlockParser (Root Component)
├── State Management (useState hooks)
├── Parsing Logic (parseStatBlock function)
├── Edit Logic (startEdit, saveEdit functions)
└── UI Rendering
    ├── Input Section (textarea + parse button)
    ├── Analytics Section (accuracy display)
    ├── Field Editor Section (editable fields)
    └── Output Section (JSON display + export)
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