# Complete Source Code - v1.3

## Overview
This document contains the complete, annotated source code for the D&D Stat Block Parser v1.3.

---

## Full React Component

```javascript
import React, { useState } from 'react';
import { Download, Copy, AlertCircle, Info, FileJson, Zap, BarChart3, Shield, Edit2, Save, X } from 'lucide-react';

export default function StatBlockParser() {
  // ==================== STATE MANAGEMENT ====================
  
  // Input and output state
  const [input, setInput] = useState('');           // Raw stat block text
  const [output, setOutput] = useState(null);       // Generated Foundry JSON
  
  // Feedback state
  const [errors, setErrors] = useState([]);         // Critical errors
  const [warnings, setWarnings] = useState([]);     // Non-critical warnings
  const [parseStats, setParseStats] = useState(null); // Analytics data
  const [copied, setCopied] = useState(false);      // Copy button feedback
  
  // Editor state
  const [showEditor, setShowEditor] = useState(false); // Editor visibility
  const [editField, setEditField] = useState(null);  // Currently editing field
  const [editValue, setEditValue] = useState('');    // Edit input value

  // ==================== HELPER FUNCTIONS ====================
  
  /**
   * Calculate ability modifier from ability score
   * D&D 5e formula: (score - 10) / 2, rounded down
   */
  const mod = (score) => Math.floor((score - 10) / 2);

  // ==================== PARSING FUNCTION ====================
  
  /**
   * Main parsing function - extracts data from stat block text
   * and generates Foundry VTT compatible JSON
   */
  const parseStatBlock = (text) => {
    const errs = [];      // Collect errors
    const warns = [];     // Collect warnings
    const stats = {       // Track parsing statistics
      parsed: 0,          // Successfully parsed fields
      total: 0,           // Total attempted fields
      exact: 0,           // Exact matches (not defaults)
      fields: []          // Individual field results
    };

    try {
      // Split and clean input lines
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (!lines.length) throw new Error('No content to parse');

      // ============ 1. NAME ============
      const name = lines[0] || 'Unknown';
      stats.total++; stats.parsed++; stats.exact++;
      stats.fields.push({ name: 'name', value: name, method: 'exact' });

      // ============ 2. SIZE ============
      stats.total++;
      const sizeMatch = text.match(/\b(tiny|small|medium|large|huge|gargantuan)\b/i);
      const size = sizeMatch?.[1]?.toLowerCase() || 'medium';
      // Map to Foundry size codes
      const sizeCode = {
        'tiny': 'tiny',
        'small': 'sm',
        'medium': 'med',
        'large': 'lg',
        'huge': 'huge',
        'gargantuan': 'grg'
      }[size] || 'med';
      if (sizeMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'size', value: size, method: sizeMatch ? 'exact' : 'default' });

      // ============ 3. TYPE ============
      stats.total++;
      const typeMatch = text.match(/\b(beast|humanoid|dragon|undead|elemental|monstrosity|fey|fiend|giant|ooze|plant|construct|celestial|aberration)\b/i);
      const type = typeMatch?.[1]?.toLowerCase() || 'humanoid';
      if (typeMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'type', value: type, method: typeMatch ? 'exact' : 'default' });

      // ============ 4. ALIGNMENT ============
      stats.total++;
      // Try composite pattern first: "Small humanoid, neutral evil"
      let alignMatch = text.match(/(?:tiny|small|medium|large|huge|gargantuan)\s+(?:beast|humanoid|dragon|undead|elemental|monstrosity|fey|fiend|giant|ooze|plant|construct|celestial|aberration)[^,]*,\s*(.+?)(?:\n|$)/i);
      // Fallback to explicit label
      if (!alignMatch) alignMatch = text.match(/alignment[:\s]+(.+?)(?:\n|$)/i);
      const alignment = alignMatch?.[1]?.trim() || 'unaligned';
      if (alignMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'alignment', value: alignment, method: alignMatch ? 'exact' : 'default' });

      // ============ 5. ARMOR CLASS ============
      stats.total++;
      const acMatch = text.match(/(?:AC|Armor Class)[:\s]*(\d+)(?:\s*\(([^)]+)\))?/i);
      const ac = acMatch ? parseInt(acMatch[1]) : 10;
      const acFormula = acMatch?.[2] || '';  // Armor type (e.g., "natural armor")
      if (acMatch) { stats.parsed++; stats.exact++; } else warns.push('AC not found, using 10');
      stats.fields.push({ name: 'ac', value: `${ac}${acFormula ? ' (' + acFormula + ')' : ''}`, method: acMatch ? 'exact' : 'default' });
      if (acFormula) stats.fields.push({ name: 'acType', value: acFormula, method: 'exact' });

      // ============ 6. HIT POINTS ============
      stats.total++;
      const hpMatch = text.match(/(?:HP|Hit Points)[:\s]*(\d+)(?:\s*\(([^)]+)\))?/i);
      const hp = hpMatch ? parseInt(hpMatch[1]) : 5;
      const hpFormula = hpMatch?.[2] || '';  // Dice formula (e.g., "2d6 + 2")
      if (hpMatch) { stats.parsed++; stats.exact++; } else warns.push('HP not found, using 5');
      stats.fields.push({ name: 'hp', value: `${hp}${hpFormula ? ' (' + hpFormula + ')' : ''}`, method: hpMatch ? 'exact' : 'default' });
      if (hpFormula) stats.fields.push({ name: 'hpFormula', value: hpFormula, method: 'exact' });

      // ============ 7. SPEED ============
      stats.total++;
      const speedMatch = text.match(/Speed\s+(\d+)\s*ft\.(?:,\s*climb\s+(\d+)\s*ft\.)?(?:,\s*fly\s+(\d+)\s*ft\.)?(?:,\s*swim\s+(\d+)\s*ft\.)?(?:,\s*burrow\s+(\d+)\s*ft\.)?/i);
      const speeds = {
        walk: speedMatch ? parseInt(speedMatch[1]) : 30,
        climb: speedMatch && speedMatch[2] ? parseInt(speedMatch[2]) : null,
        fly: speedMatch && speedMatch[3] ? parseInt(speedMatch[3]) : null,
        swim: speedMatch && speedMatch[4] ? parseInt(speedMatch[4]) : null,
        burrow: speedMatch && speedMatch[5] ? parseInt(speedMatch[5]) : null
      };
      if (speedMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'speed', value: `${speeds.walk} ft.${speeds.climb ? `, climb ${speeds.climb} ft.` : ''}${speeds.fly ? `, fly ${speeds.fly} ft.` : ''}`, method: speedMatch ? 'exact' : 'default' });

      // ============ 8. ABILITY SCORES ============
      stats.total++;
      // Try pattern without modifiers first
      let abMatch = text.match(/STR\s+(\d+)\s+DEX\s+(\d+)\s+CON\s+(\d+)\s+INT\s+(\d+)\s+WIS\s+(\d+)\s+CHA\s+(\d+)/i);
      // Try pattern with modifiers in parentheses
      if (!abMatch) abMatch = text.match(/STR\s+(\d+)\s*\([+-]\d+\)\s+DEX\s+(\d+)\s*\([+-]\d+\)\s+CON\s+(\d+)\s*\([+-]\d+\)\s+INT\s+(\d+)\s*\([+-]\d+\)\s+WIS\s+(\d+)\s*\([+-]\d+\)\s+CHA\s+(\d+)\s*\([+-]\d+\)/i);
      
      const abilities = abMatch ? {
        str: parseInt(abMatch[1]), dex: parseInt(abMatch[2]), con: parseInt(abMatch[3]),
        int: parseInt(abMatch[4]), wis: parseInt(abMatch[5]), cha: parseInt(abMatch[6])
      } : { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
      if (abMatch) { stats.parsed++; stats.exact++; } else warns.push('Abilities not found, using 10s');
      stats.fields.push({ name: 'abilities', value: `STR ${abilities.str} DEX ${abilities.dex} CON ${abilities.con} INT ${abilities.int} WIS ${abilities.wis} CHA ${abilities.cha}`, method: abMatch ? 'exact' : 'default' });

      // ============ 9. CHALLENGE RATING ============
      stats.total++;
      let crMatch = text.match(/Challenge[:\s]+(\d+(?:\/\d+)?)/i);
      if (!crMatch) crMatch = text.match(/\bCR[:\s]+(\d+(?:\/\d+)?)/i);
      const cr = crMatch?.[1] || '1';
      if (crMatch) { stats.parsed++; stats.exact++; } else warns.push('CR not found, using 1');
      stats.fields.push({ name: 'cr', value: cr, method: crMatch ? 'exact' : 'default' });

      // Calculate proficiency bonus from CR
      const profBonus = (() => {
        const crNum = parseFloat(cr);
        if (crNum < 5) return 2;
        if (crNum < 9) return 3;
        if (crNum < 13) return 4;
        if (crNum < 17) return 5;
        return 6;
      })();

      // ============ 10. SAVING THROWS ============
      stats.total++;
      const savesMatch = text.match(/Saving Throws[:\s]+(.+?)(?=\s+Skills|\s+Damage|\s+Senses|\s+Languages|\s+Challenge|$)/i);
      const savesText = savesMatch?.[1] || '';
      if (savesMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'saves', value: savesText || 'none', method: savesMatch ? 'exact' : 'default' });

      // Initialize saves structure (proficiency stored in abilities)
      const saves = {
        str: { value: 0 },
        dex: { value: 0 },
        con: { value: 0 },
        int: { value: 0 },
        wis: { value: 0 },
        cha: { value: 0 }
      };

      // Parse individual saves and detect proficiency
      if (savesText) {
        savesText.split(',').forEach(entry => {
          const match = entry.trim().match(/^(str|dex|con|int|wis|cha)\s*([+-]\d+)/i);
          if (match) {
            const ab = match[1].toLowerCase();
            const bonus = parseInt(match[2]);
            const baseMod = mod(abilities[ab]);
            
            // If bonus = base + prof, mark as proficient
            if (bonus === baseMod + profBonus) {
              saves[ab].value = 1;
            } else if (bonus > baseMod) {
              // Has some proficiency/bonus
              saves[ab].value = 1;
            }
          }
        });
      }

      // ============ 11. SKILLS ============
      stats.total++;
      const skillMatch = text.match(/Skills[:\s]+(.+?)(?=\s+Damage|\s+Senses|\s+Languages|\s+Challenge|\s+Condition|$)/i);
      const skillsText = skillMatch?.[1] || '';
      if (skillMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'skills', value: skillsText || 'none', method: skillMatch ? 'exact' : 'default' });

      // Skill name to code mapping
      const skillMap = {
        'acrobatics': 'acr', 'animal handling': 'ani', 'arcana': 'arc', 'athletics': 'ath',
        'deception': 'dec', 'history': 'his', 'insight': 'ins', 'intimidation': 'itm',
        'investigation': 'inv', 'medicine': 'med', 'nature': 'nat', 'perception': 'prc',
        'performance': 'prf', 'persuasion': 'per', 'religion': 'rel', 'sleight of hand': 'slt',
        'stealth': 'ste', 'survival': 'sur'
      };

      // Skill to ability mapping
      const skillAbilityMap = {
        'acr': 'dex', 'ani': 'wis', 'arc': 'int', 'ath': 'str', 'dec': 'cha', 'his': 'int',
        'ins': 'wis', 'itm': 'cha', 'inv': 'int', 'med': 'wis', 'nat': 'int', 'prc': 'wis',
        'prf': 'cha', 'per': 'cha', 'rel': 'int', 'slt': 'dex', 'ste': 'dex', 'sur': 'wis'
      };

      // Initialize all skills
      const skills = {};
      Object.entries(skillMap).forEach(([longName, shortName]) => {
        const ability = skillAbilityMap[shortName];
        skills[shortName] = {
          value: 0,    // 0 = not proficient, 1 = proficient, 2 = expertise
          ability: ability
        };
      });

      // Parse individual skills and detect proficiency/expertise
      if (skillsText) {
        skillsText.split(',').forEach(entry => {
          const match = entry.trim().match(/^([a-zA-Z\s]+?)\s*([+-]\d+)/);
          if (match) {
            const skillName = match[1].trim().toLowerCase();
            const bonus = parseInt(match[2]);
            const shortName = skillMap[skillName];
            
            if (shortName) {
              const ability = skillAbilityMap[shortName];
              const abilityMod = mod(abilities[ability]);
              const withProf = abilityMod + profBonus;
              const withExpertise = abilityMod + (profBonus * 2);
              
              // Detect expertise (2x proficiency)
              if (bonus === withExpertise) {
                skills[shortName].value = 2;
              } 
              // Detect proficiency (1x proficiency)
              else if (bonus === withProf) {
                skills[shortName].value = 1;
              }
            }
          }
        });
      }

      // ============ 12. SENSES ============
      stats.total++;
      const senseMatch = text.match(/Senses[:\s]+(.+?)(?=\s+Languages|\s+Challenge|$)/i);
      const senses = senseMatch?.[1] || '';
      if (senseMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'senses', value: senses || 'none', method: senseMatch ? 'exact' : 'default' });

      // ============ 13. LANGUAGES ============
      stats.total++;
      const langMatch = text.match(/Languages[:\s]+(.+?)(?=\s+Challenge|$)/i);
      let languages = langMatch?.[1] || '';
      // Clean up languages - remove parenthetical notes
      languages = languages.replace(/\([^)]*\)/g, '').trim();
      if (langMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'languages', value: languages || 'none', method: langMatch ? 'exact' : 'default' });

      // ==================== BUILD FOUNDRY JSON ====================
      
      const foundryActor = {
        name,
        type: 'npc',
        system: {
          currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
          
          // Abilities with full structure
          abilities: {
            str: {
              value: abilities.str,
              proficient: saves.str.value,
              max: null,
              bonuses: { check: '', save: '' },
              check: { roll: { min: null, max: null, mode: 0 } },
              save: { roll: { min: null, max: null, mode: 0 } }
            },
            dex: {
              value: abilities.dex,
              proficient: saves.dex.value,
              max: null,
              bonuses: { check: '', save: '' },
              check: { roll: { min: null, max: null, mode: 0 } },
              save: { roll: { min: null, max: null, mode: 0 } }
            },
            con: {
              value: abilities.con,
              proficient: saves.con.value,
              max: null,
              bonuses: { check: '', save: '' },
              check: { roll: { min: null, max: null, mode: 0 } },
              save: { roll: { min: null, max: null, mode: 0 } }
            },
            int: {
              value: abilities.int,
              proficient: saves.int.value,
              max: null,
              bonuses: { check: '', save: '' },
              check: { roll: { min: null, max: null, mode: 0 } },
              save: { roll: { min: null, max: null, mode: 0 } }
            },
            wis: {
              value: abilities.wis,
              proficient: saves.wis.value,
              max: null,
              bonuses: { check: '', save: '' },
              check: { roll: { min: null, max: null, mode: 0 } },
              save: { roll: { min: null, max: null, mode: 0 } }
            },
            cha: {
              value: abilities.cha,
              proficient: saves.cha.value,
              max: null,
              bonuses: { check: '', save: '' },
              check: { roll: { min: null, max: null, mode: 0 } },
              save: { roll: { min: null, max: null, mode: 0 } }
            }
          },
          
          // Bonuses structure
          bonuses: {
            mwak: { attack: '', damage: '' },
            rwak: { attack: '', damage: '' },
            msak: { attack: '', damage: '' },
            rsak: { attack: '', damage: '' },
            abilities: { check: '', save: '', skill: '' },
            spell: { dc: '' }
          },
          
          // Skills with simplified structure
          skills: Object.fromEntries(
            Object.entries(skills).map(([key, skill]) => [
              key,
              {
                ability: skill.ability,
                roll: { min: null, max: null, mode: 0 },
                value: skill.value,
                bonuses: { check: '', passive: '' }
              }
            ])
          ),
          
          tools: {},
          
          // Spell slots
          spells: {
            spell1: { value: 0, override: null },
            spell2: { value: 0, override: null },
            spell3: { value: 0, override: null },
            spell4: { value: 0, override: null },
            spell5: { value: 0, override: null },
            spell6: { value: 0, override: null },
            spell7: { value: 0, override: null },
            spell8: { value: 0, override: null },
            spell9: { value: 0, override: null },
            pact: { value: 0, override: null }
          },
          
          // Attributes
          attributes: {
            init: {
              ability: '',
              roll: { min: null, max: null, mode: 0 },
              bonus: ''
            },
            movement: {
              burrow: speeds.burrow,
              climb: speeds.climb,
              fly: speeds.fly,
              swim: speeds.swim,
              walk: speeds.walk,
              units: null,
              hover: false,
              ignoredDifficultTerrain: []
            },
            attunement: { max: 3 },
            senses: {
              darkvision: null,
              blindsight: null,
              tremorsense: null,
              truesight: null,
              units: null,
              special: senses
            },
            spellcasting: 'int',
            exhaustion: 0,
            concentration: {
              ability: '',
              roll: { min: null, max: null, mode: 0 },
              bonuses: { save: '' },
              limit: 1
            },
            ac: { flat: ac, calc: 'natural' },
            hd: { spent: 0 },
            hp: { value: hp, max: hp, temp: 0, tempmax: 0, formula: hpFormula },
            death: {
              roll: { min: null, max: null, mode: 0 },
              success: 0,
              failure: 0,
              bonuses: { save: '' }
            },
            spell: { level: 0 },
            loyalty: {}
          },
          
          // Details
          details: {
            biography: { value: '', public: '' },
            alignment: alignment,
            ideal: '',
            bond: '',
            flaw: '',
            race: null,
            type: { value: type, custom: '', subtype: '', swarm: '' },
            cr: parseFloat(cr),
            habitat: { custom: '', value: [] },
            treasure: { value: [] }
          },
          
          // Resources (legendary actions, lair)
          resources: {
            legact: { max: 0, spent: 0 },
            legres: { max: 0, spent: 0 },
            lair: { value: false, initiative: null, inside: false }
          },
          
          // Traits
          traits: {
            size: sizeCode,
            di: { bypasses: [], value: [], custom: '' },
            dr: { bypasses: [], value: [], custom: '' },
            dv: { bypasses: [], value: [], custom: '' },
            dm: { amount: {}, bypasses: [] },
            ci: { value: [], custom: '' },
            languages: { 
              value: languages ? languages.split(',').map(l => l.trim().toLowerCase()) : [],
              custom: '',
              communication: {}
            },
            important: false
          },
          
          source: { revision: 1, rules: '2014' }
        },
        items: [],
        effects: [],
        flags: {},
        _stats: {
          coreVersion: '13.348',
          systemId: 'dnd5e',
          systemVersion: '5.1.8'
        }
      };

      // Calculate accuracy and set state
      stats.accuracy = Math.round((stats.parsed / stats.total) * 100);
      setErrors(errs);
      setWarnings(warns);
      setParseStats(stats);
      setOutput(foundryActor);

    } catch (err) {
      setErrors([err.message]);
      setOutput(null);
      setParseStats(null);
    }
  };

  // ==================== EDITOR FUNCTIONS ====================
  
  /**
   * Start editing a field - loads current value into edit input
   */
  const startEdit = (fieldName) => {
    setEditField(fieldName);
    if (fieldName === 'name') setEditValue(output?.name || '');
    else if (fieldName === 'ac') setEditValue(output?.system?.attributes?.ac?.flat || 10);
    else if (fieldName === 'hp') setEditValue(output?.system?.attributes?.hp?.max || 5);
    else if (fieldName === 'hpFormula') setEditValue(output?.system?.attributes?.hp?.formula || '');
    else if (fieldName === 'cr') setEditValue(output?.system?.details?.cr || 1);
    else if (fieldName === 'size') setEditValue(parseStats?.fields.find(f => f.name === 'size')?.value || 'medium');
    else if (fieldName === 'type') setEditValue(output?.system?.details?.type?.value || 'humanoid');
    else if (fieldName === 'alignment') setEditValue(output?.system?.details?.alignment || 'unaligned');
    else if (fieldName === 'senses') setEditValue(output?.system?.attributes?.senses?.special || '');
    else if (fieldName === 'languages') {
      const langs = output?.system?.traits?.languages?.value || [];
      setEditValue(langs.join(', '));
    }
    else if (fieldName === 'abilities') {
      const abs = output?.system?.abilities;
      setEditValue(`${abs?.str?.value || 10},${abs?.dex?.value || 10},${abs?.con?.value || 10},${abs?.int?.value || 10},${abs?.wis?.value || 10},${abs?.cha?.value || 10}`);
    }
    else if (fieldName === 'skills') setEditValue(parseStats?.fields.find(f => f.name === 'skills')?.value || '');
    else if (fieldName === 'saves') setEditValue(parseStats?.fields.find(f => f.name === 'saves')?.value || '');
    else if (fieldName === 'acType') setEditValue(parseStats?.fields.find(f => f.name === 'acType')?.value || '');
  };

  /**
   * Save edited field - updates both output JSON and display
   */
  const saveEdit = () => {
    if (!output || !editField) return;
    const updated = JSON.parse(JSON.stringify(output));
    
    if (editField === 'name') {
      updated.name = editValue;
    }
    else if (editField === 'ac') {
      updated.system.attributes.ac.flat = parseInt(editValue) || 10;
    }
    else if (editField === 'hp') {
      const val = parseInt(editValue) || 5;
      updated.system.attributes.hp.value = val;
      updated.system.attributes.hp.max = val;
    }
    else if (editField === 'hpFormula') {
      updated.system.attributes.hp.formula = editValue;
      const hpFormulaField = parseStats.fields.find(f => f.name === 'hpFormula');
      if (hpFormulaField) hpFormulaField.value = editValue;
    }
    else if (editField === 'cr') {
      updated.system.details.cr = parseFloat(editValue) || 0;
    }
    else if (editField === 'size') {
      const sizeValue = editValue.toLowerCase();
      const sizeCode = {
        'tiny': 'tiny',
        'small': 'sm',
        'medium': 'med',
        'large': 'lg',
        'huge': 'huge',
        'gargantuan': 'grg'
      }[sizeValue] || 'med';
      updated.system.traits.size = sizeCode;
      const sizeField = parseStats.fields.find(f => f.name === 'size');
      if (sizeField) sizeField.value = sizeValue;
    }
    else if (editField === 'type') {
      updated.system.details.type.value = editValue.toLowerCase();
    }
    else if (editField === 'alignment') {
      updated.system.details.alignment = editValue;
    }
    else if (editField === 'senses') {
      updated.system.attributes.senses.special = editValue;
      const sensesField = parseStats.fields.find(f => f.name === 'senses');
      if (sensesField) sensesField.value = editValue;
    }
    else if (editField === 'languages') {
      updated.system.traits.languages.value = editValue ? editValue.split(',').map(l => l.trim().toLowerCase()) : [];
      const langField = parseStats.fields.find(f => f.name === 'languages');
      if (langField) langField.value = editValue;
    }
    else if (editField === 'abilities') {
      const parts = editValue.split(',').map(v => parseInt(v.trim()) || 10);
      if (parts.length === 6) {
        updated.system.abilities.str.value = parts[0];
        updated.system.abilities.dex.value = parts[1];
        updated.system.abilities.con.value = parts[2];
        updated.system.abilities.int.value = parts[3];
        updated.system.abilities.wis.value = parts[4];
        updated.system.abilities.cha.value = parts[5];
        const abField = parseStats.fields.find(f => f.name === 'abilities');
        if (abField) abField.value = `STR ${parts[0]} DEX ${parts[1]} CON ${parts[2]} INT ${parts[3]} WIS ${parts[4]} CHA ${parts[5]}`;
      }
    }
    else if (editField === 'acType') {
      const acTypeField = parseStats.fields.find(f => f.name === 'acType');
      if (acTypeField) acTypeField.value = editValue;
    }
    
    setOutput(updated);
    setParseStats({...parseStats}); // Force re-render
    setEditField(null);
  };

  // ==================== RENDER ====================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-white">