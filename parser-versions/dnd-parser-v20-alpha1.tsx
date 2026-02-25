import React, { useState } from 'react';
import { Download, Copy, AlertCircle, Info, FileJson, Zap, BarChart3, Shield, Edit2, Save, X, Sword } from 'lucide-react';

export default function StatBlockParser() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState(null);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [parseStats, setParseStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');

  const mod = (score) => Math.floor((score - 10) / 2);

  const parseActions = (text) => {
    const actions = [];
    
    // Find Actions section
    const actionsMatch = text.match(/Actions\s+([\s\S]+?)(?=Reactions|Legendary Actions|Bonus Actions|$)/i);
    if (!actionsMatch) return actions;
    
    const actionsText = actionsMatch[1];
    
    // Split by lines that start with a capital letter word followed by period
    // More flexible approach - split on newlines, then group
    const lines = actionsText.split('\n').map(l => l.trim()).filter(l => l);
    
    let currentAction = null;
    
    for (const line of lines) {
      // Check if this line starts a new action (capital letter word(s) followed by period)
      const actionStartMatch = line.match(/^([A-Z][A-Za-z\s]+?)\.\s+(.*)$/);
      
      if (actionStartMatch) {
        // Save previous action if exists
        if (currentAction) {
          actions.push(currentAction);
        }
        
        // Start new action
        const actionName = actionStartMatch[1].trim();
        const restOfLine = actionStartMatch[2].trim();
        
        currentAction = {
          name: actionName,
          description: restOfLine,
          type: 'action',
          attack: null,
          damage: null
        };
      } else if (currentAction && line) {
        // Continue current action description
        currentAction.description += ' ' + line;
      }
    }
    
    // Don't forget the last action
    if (currentAction) {
      actions.push(currentAction);
    }
    
    // Now parse attack/damage details for each action
    actions.forEach(action => {
      const desc = action.description;
      
      const attackMatch = desc.match(/(?:Melee|Ranged|Melee or Ranged)\s+(?:Weapon\s+)?Attack(?:\s+Roll)?:\s*([+-]\d+)/i);
      const reachMatch = desc.match(/reach\s+(\d+)\s*ft/i);
      const rangeMatch = desc.match(/range\s+(\d+)(?:\/(\d+))?\s*ft/i);
      const hitMatch = desc.match(/Hit:\s*(\d+)\s*\(([^)]+)\)\s+(\w+)\s+damage/i);
      const additionalDamageMatch = desc.match(/plus\s+(\d+)\s*\(([^)]+)\)\s+(\w+)\s+damage/i);
      
      if (attackMatch) {
        action.attack = {
          bonus: parseInt(attackMatch[1]),
          reach: reachMatch ? parseInt(reachMatch[1]) : null,
          range: rangeMatch ? {
            normal: parseInt(rangeMatch[1]),
            long: rangeMatch[2] ? parseInt(rangeMatch[2]) : null
          } : null
        };
      }
      
      if (hitMatch) {
        action.damage = {
          average: parseInt(hitMatch[1]),
          formula: hitMatch[2],
          type: hitMatch[3].toLowerCase()
        };
        
        if (additionalDamageMatch) {
          action.damage.additional = {
            average: parseInt(additionalDamageMatch[1]),
            formula: additionalDamageMatch[2],
            type: additionalDamageMatch[3].toLowerCase()
          };
        }
      }
    });
    
    return actions;
  };

  const parseStatBlock = (text) => {
    const errs = [];
    const warns = [];
    const stats = { parsed: 0, total: 0, exact: 0, fields: [] };

    try {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (!lines.length) throw new Error('No content to parse');

      // NAME
      const name = lines[0] || 'Unknown';
      stats.total++; stats.parsed++; stats.exact++;
      stats.fields.push({ name: 'name', value: name, method: 'exact' });

      // SIZE
      stats.total++;
      const sizeMatch = text.match(/\b(tiny|small|medium|large|huge|gargantuan)\b/i);
      const size = sizeMatch?.[1]?.toLowerCase() || 'medium';
      const sizeCode = {
        'tiny': 'tiny', 'small': 'sm', 'medium': 'med',
        'large': 'lg', 'huge': 'huge', 'gargantuan': 'grg'
      }[size] || 'med';
      if (sizeMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'size', value: size, method: sizeMatch ? 'exact' : 'default' });

      // TYPE
      stats.total++;
      const typeMatch = text.match(/\b(beast|humanoid|dragon|undead|elemental|monstrosity|fey|fiend|giant|ooze|plant|construct|celestial|aberration)\b/i);
      const type = typeMatch?.[1]?.toLowerCase() || 'humanoid';
      if (typeMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'type', value: type, method: typeMatch ? 'exact' : 'default' });

      // ALIGNMENT
      stats.total++;
      let alignMatch = text.match(/(?:tiny|small|medium|large|huge|gargantuan)\s+(?:beast|humanoid|dragon|undead|elemental|monstrosity|fey|fiend|giant|ooze|plant|construct|celestial|aberration)[^,]*,\s*(.+?)(?:\n|$)/i);
      if (!alignMatch) alignMatch = text.match(/alignment[:\s]+(.+?)(?:\n|$)/i);
      const alignment = alignMatch?.[1]?.trim() || 'unaligned';
      if (alignMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'alignment', value: alignment, method: alignMatch ? 'exact' : 'default' });

      // AC
      stats.total++;
      const acMatch = text.match(/(?:AC|Armor Class)[:\s]*(\d+)(?:\s*\(([^)]+)\))?/i);
      const ac = acMatch ? parseInt(acMatch[1]) : 10;
      if (acMatch) { stats.parsed++; stats.exact++; } else warns.push('AC not found, using 10');
      stats.fields.push({ name: 'ac', value: `${ac}`, method: acMatch ? 'exact' : 'default' });

      // HP
      stats.total++;
      const hpMatch = text.match(/(?:HP|Hit Points)[:\s]*(\d+)(?:\s*\(([^)]+)\))?/i);
      const hp = hpMatch ? parseInt(hpMatch[1]) : 5;
      const hpFormula = hpMatch?.[2] || '';
      if (hpMatch) { stats.parsed++; stats.exact++; } else warns.push('HP not found, using 5');
      stats.fields.push({ name: 'hp', value: `${hp}`, method: hpMatch ? 'exact' : 'default' });

      // SPEED
      stats.total++;
      const speedMatch = text.match(/Speed\s+(\d+)\s*ft\.(?:,\s*(?:Fly|fly)\s+(\d+)\s*ft\.)?(?:,\s*(?:Climb|climb)\s+(\d+)\s*ft\.)?(?:,\s*(?:Swim|swim)\s+(\d+)\s*ft\.)?(?:,\s*(?:Burrow|burrow)\s+(\d+)\s*ft\.)?/i);
      const speeds = {
        walk: speedMatch ? parseInt(speedMatch[1]) : 30,
        fly: speedMatch?.[2] ? parseInt(speedMatch[2]) : 0,
        climb: speedMatch?.[3] ? parseInt(speedMatch[3]) : 0,
        swim: speedMatch?.[4] ? parseInt(speedMatch[4]) : 0,
        burrow: speedMatch?.[5] ? parseInt(speedMatch[5]) : 0
      };
      if (speedMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'speed', value: `${speeds.walk} ft.`, method: speedMatch ? 'exact' : 'default' });

      // ABILITIES
      stats.total++;
      let abilities = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
      
      let abMatch = text.match(/STR\s+(\d+)\s+DEX\s+(\d+)\s+CON\s+(\d+)\s+INT\s+(\d+)\s+WIS\s+(\d+)\s+CHA\s+(\d+)/i);
      if (!abMatch) abMatch = text.match(/STR\s+(\d+)\s*\([+-]\d+\)\s+DEX\s+(\d+)\s*\([+-]\d+\)\s+CON\s+(\d+)\s*\([+-]\d+\)\s+INT\s+(\d+)\s*\([+-]\d+\)\s+WIS\s+(\d+)\s*\([+-]\d+\)\s+CHA\s+(\d+)\s*\([+-]\d+\)/i);
      
      if (!abMatch) {
        const strMatch = text.match(/Str\s+(\d+)\s+[+-−]?\d+\s+[+-−]?\d+/i);
        const dexMatch = text.match(/Dex\s+(\d+)\s+[+-−]?\d+\s+[+-−]?\d+/i);
        const conMatch = text.match(/Con\s+(\d+)\s+[+-−]?\d+\s+[+-−]?\d+/i);
        const intMatch = text.match(/Int\s+(\d+)\s+[+-−]?\d+\s+[+-−]?\d+/i);
        const wisMatch = text.match(/Wis\s+(\d+)\s+[+-−]?\d+\s+[+-−]?\d+/i);
        const chaMatch = text.match(/Cha\s+(\d+)\s+[+-−]?\d+\s+[+-−]?\d+/i);
        
        if (strMatch && dexMatch && conMatch && intMatch && wisMatch && chaMatch) {
          abilities = {
            str: parseInt(strMatch[1]), dex: parseInt(dexMatch[1]), con: parseInt(conMatch[1]),
            int: parseInt(intMatch[1]), wis: parseInt(wisMatch[1]), cha: parseInt(chaMatch[1])
          };
          abMatch = true;
        }
      }
      
      if (abMatch && typeof abMatch !== 'boolean') {
        abilities = {
          str: parseInt(abMatch[1]), dex: parseInt(abMatch[2]), con: parseInt(abMatch[3]),
          int: parseInt(abMatch[4]), wis: parseInt(abMatch[5]), cha: parseInt(abMatch[6])
        };
      }
      
      if (abMatch) { stats.parsed++; stats.exact++; } 
      else warns.push('Abilities not found, using 10s');
      
      stats.fields.push({ name: 'abilities', value: `STR ${abilities.str} DEX ${abilities.dex} CON ${abilities.con}`, method: abMatch ? 'exact' : 'default' });

      // CR
      stats.total++;
      let crMatch = text.match(/CR\s+(\d+(?:\/\d+)?)\s*\([^)]*\)/i);
      if (!crMatch) crMatch = text.match(/Challenge[:\s]+(\d+(?:\/\d+)?)/i);
      if (!crMatch) crMatch = text.match(/\bCR[:\s]+(\d+(?:\/\d+)?)/i);
      
      const cr = crMatch?.[1] || '1';
      if (crMatch) { stats.parsed++; stats.exact++; } else warns.push('CR not found, using 1');
      stats.fields.push({ name: 'cr', value: cr, method: crMatch ? 'exact' : 'default' });

      const profBonus = (() => {
        const crNum = parseFloat(cr.includes('/') ? eval(cr) : cr);
        if (crNum < 5) return 2;
        if (crNum < 9) return 3;
        if (crNum < 13) return 4;
        if (crNum < 17) return 5;
        if (crNum < 21) return 6;
        if (crNum < 25) return 7;
        if (crNum < 29) return 8;
        return 9;
      })();

      // SAVING THROWS - Enhanced for D&D Beyond table format
      stats.total++;
      // Try standard format first
      let savesMatch = text.match(/(?:Saving Throws|Save)[:\s]+(.+?)(?=\n\s*Skills|\n\s*Damage|\n\s*Senses|\n\s*Languages|\n\s*Challenge|\n\s*CR|$)/is);
      
      // If not found, try D&D Beyond table format where saves are in the ability table
      // Look for individual saves with ability names
      let savesText = savesMatch?.[1]?.trim() || '';
      
      if (!savesText) {
        // Extract from ability table format: "Dex 16 +3 +5" where +5 is the save
        const dexSaveMatch = text.match(/Dex\s+(\d+)\s+[+-]?(\d+)\s+([+-]\d+)/i);
        const strSaveMatch = text.match(/Str\s+(\d+)\s+[+-]?(\d+)\s+([+-]\d+)/i);
        const conSaveMatch = text.match(/Con\s+(\d+)\s+[+-]?(\d+)\s+([+-]\d+)/i);
        const intSaveMatch = text.match(/Int\s+(\d+)\s+[+-]?(\d+)\s+([+-]\d+)/i);
        const wisSaveMatch = text.match(/Wis\s+(\d+)\s+[+-]?(\d+)\s+([+-]\d+)/i);
        const chaSaveMatch = text.match(/Cha\s+(\d+)\s+[+-]?(\d+)\s+([+-]\d+)/i);
        
        const foundSaves = [];
        if (strSaveMatch && parseInt(strSaveMatch[3]) !== parseInt(strSaveMatch[2])) foundSaves.push(`Str ${strSaveMatch[3]}`);
        if (dexSaveMatch && parseInt(dexSaveMatch[3]) !== parseInt(dexSaveMatch[2])) foundSaves.push(`Dex ${dexSaveMatch[3]}`);
        if (conSaveMatch && parseInt(conSaveMatch[3]) !== parseInt(conSaveMatch[2])) foundSaves.push(`Con ${conSaveMatch[3]}`);
        if (intSaveMatch && parseInt(intSaveMatch[3]) !== parseInt(intSaveMatch[2])) foundSaves.push(`Int ${intSaveMatch[3]}`);
        if (wisSaveMatch && parseInt(wisSaveMatch[3]) !== parseInt(wisSaveMatch[2])) foundSaves.push(`Wis ${wisSaveMatch[3]}`);
        if (chaSaveMatch && parseInt(chaSaveMatch[3]) !== parseInt(chaSaveMatch[2])) foundSaves.push(`Cha ${chaSaveMatch[3]}`);
        
        if (foundSaves.length > 0) {
          savesText = foundSaves.join(', ');
          savesMatch = true;
        }
      }
      
      if (savesMatch || savesText) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'saves', value: savesText || 'none', method: (savesMatch || savesText) ? 'exact' : 'default' });

      const saves = {
        str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0
      };

      if (savesText) {
        savesText.split(',').forEach(entry => {
          const match = entry.trim().match(/^(str|dex|con|int|wis|cha)\s*([+-]\d+)/i);
          if (match) {
            const ab = match[1].toLowerCase();
            const saveBonus = parseInt(match[2]);
            const baseMod = mod(abilities[ab]);
            
            // If save bonus is higher than base modifier, they have proficiency
            if (saveBonus > baseMod) {
              saves[ab] = 1;
            }
          }
        });
      }
      
      // Debug log to verify saves are detected
      console.log('Detected saves:', saves);

      // SKILLS
      stats.total++;
      const skillMatch = text.match(/Skills[:\s]+(.+?)(?=\n\s*Damage|\n\s*Senses|\n\s*Languages|\n\s*Challenge|\n\s*CR|\n\s*Condition|$)/is);
      const skillsText = skillMatch?.[1]?.trim() || '';
      if (skillMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'skills', value: skillsText || 'none', method: skillMatch ? 'exact' : 'default' });

      const skillMap = {
        'acrobatics': 'acr', 'animal handling': 'ani', 'arcana': 'arc', 'athletics': 'ath',
        'deception': 'dec', 'history': 'his', 'insight': 'ins', 'intimidation': 'itm',
        'investigation': 'inv', 'medicine': 'med', 'nature': 'nat', 'perception': 'prc',
        'performance': 'prf', 'persuasion': 'per', 'religion': 'rel', 'sleight of hand': 'slt',
        'stealth': 'ste', 'survival': 'sur'
      };

      const skillAbilityMap = {
        'acr': 'dex', 'ani': 'wis', 'arc': 'int', 'ath': 'str', 'dec': 'cha', 'his': 'int',
        'ins': 'wis', 'itm': 'cha', 'inv': 'int', 'med': 'wis', 'nat': 'int', 'prc': 'wis',
        'prf': 'cha', 'per': 'cha', 'rel': 'int', 'slt': 'dex', 'ste': 'dex', 'sur': 'wis'
      };

      const skills = {};
      Object.entries(skillMap).forEach(([longName, shortName]) => {
        const ability = skillAbilityMap[shortName];
        skills[shortName] = {
          ability: ability,
          value: 0,
          bonuses: { check: '', passive: '' }
        };
      });

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
              
              if (bonus === withExpertise) skills[shortName].value = 2;
              else if (bonus === withProf) skills[shortName].value = 1;
              else if (bonus > abilityMod) skills[shortName].value = 1;
            }
          }
        });
      }

      // SENSES
      stats.total++;
      const senseMatch = text.match(/Senses[:\s]+(.+?)(?=\n\s*Languages|\n\s*Challenge|\n\s*CR|$)/is);
      const senses = senseMatch?.[1]?.trim() || '';
      if (senseMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'senses', value: senses || 'none', method: senseMatch ? 'exact' : 'default' });

      // LANGUAGES
      stats.total++;
      const langMatch = text.match(/Languages[:\s]+(.+?)(?=\n\s*Challenge|\n\s*CR|$)/is);
      let languages = langMatch?.[1]?.trim() || '';
      languages = languages.replace(/\([^)]*\)/g, '').trim();
      if (langMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'languages', value: languages || 'none', method: langMatch ? 'exact' : 'default' });

      // INITIATIVE (D&D Beyond specific)
      stats.total++;
      const initMatch = text.match(/Initiative\s+([+-]\d+)/i);
      const initBonus = initMatch ? initMatch[1] : '';
      if (initMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'initiative', value: initBonus || 'auto', method: initMatch ? 'exact' : 'default' });

      // ACTIONS - NEW!
      stats.total++;
      const actions = parseActions(text);
      if (actions.length > 0) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'actions', value: `${actions.length} action(s) parsed`, method: actions.length > 0 ? 'exact' : 'default' });

      // Build Foundry Actor
      const foundryActor = {
        name,
        type: 'npc',
        system: {
          abilities: {
            str: { value: abilities.str, proficient: saves.str },
            dex: { value: abilities.dex, proficient: saves.dex },
            con: { value: abilities.con, proficient: saves.con },
            int: { value: abilities.int, proficient: saves.int },
            wis: { value: abilities.wis, proficient: saves.wis },
            cha: { value: abilities.cha, proficient: saves.cha }
          },
          attributes: {
            ac: { flat: ac, calc: 'natural', formula: '' },
            hp: { value: hp, max: hp, temp: 0, tempmax: 0, formula: hpFormula },
            init: {
              ability: 'dex',
              bonus: initBonus
            },
            movement: {
              burrow: speeds.burrow,
              climb: speeds.climb,
              fly: speeds.fly,
              swim: speeds.swim,
              walk: speeds.walk,
              units: 'ft',
              hover: false
            },
            senses: {
              darkvision: 0,
              blindsight: 0,
              tremorsense: 0,
              truesight: 0,
              units: 'ft',
              special: senses
            }
          },
          details: {
            alignment: alignment,
            type: { value: type, subtype: '', custom: '' },
            cr: parseFloat(cr.includes('/') ? eval(cr) : cr),
            biography: { value: '', public: '' }
          },
          traits: {
            size: sizeCode,
            languages: {
              value: languages ? languages.split(',').map(l => l.trim().toLowerCase().replace(/\s+/g, '')) : [],
              custom: ''
            },
            di: { value: [], custom: '' },
            dr: { value: [], custom: '' },
            dv: { value: [], custom: '' },
            ci: { value: [], custom: '' }
          },
          skills: skills
        },
        items: actions.map(action => ({
          name: action.name,
          type: 'weapon',
          system: {
            description: { value: action.description },
            activation: { type: 'action', cost: 1 },
            attack: action.attack ? {
              bonus: action.attack.bonus.toString(),
              flat: false
            } : null,
            damage: action.damage ? {
              parts: [[action.damage.formula, action.damage.type]]
            } : null,
            range: action.attack?.range ? {
              value: action.attack.range.normal,
              long: action.attack.range.long,
              units: 'ft'
            } : action.attack?.reach ? {
              value: action.attack.reach,
              long: null,
              units: 'ft'
            } : null
          }
        })),
        effects: [],
        flags: {}
      };

      stats.accuracy = Math.round((stats.parsed / stats.total) * 100);
      
      setErrors(errs);
      setWarnings(warns);
      setParseStats(stats);
      setOutput(foundryActor);

    } catch (err) {
      setErrors([err.message]);
      setWarnings([]);
      setOutput(null);
      setParseStats(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-white">D&D Stat Block Converter</h1>
            <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Sword size={14} /> v2.0-alpha.1 - ACTION PARSING
            </span>
          </div>
          <p className="text-purple-200">Phase 6: Now parsing actions with attack rolls and damage!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg p-5 border border-purple-500/30">
              <label className="block text-white font-semibold mb-3">Paste Stat Block</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste D&D 5e stat block with actions..."
                className="w-full h-56 bg-slate-700 text-white rounded p-3 text-sm font-mono border border-purple-400/30 focus:border-purple-400 focus:outline-none resize-none"
              />
              <button
                onClick={() => parseStatBlock(input)}
                className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"
              >
                <Zap size={16} /> Parse Stat Block
              </button>
            </div>

            {parseStats && (
              <div className="bg-slate-800 rounded-lg p-4 border border-blue-500/30">
                <div className="flex items-center gap-2 text-blue-400 mb-3">
                  <BarChart3 size={18} />
                  <span className="font-semibold">Parse Analytics</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Accuracy:</span>
                    <span className={`font-bold ${parseStats.accuracy >= 95 ? 'text-green-400' : parseStats.accuracy >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {parseStats.accuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded h-2">
                    <div 
                      className={`h-2 rounded ${parseStats.accuracy >= 95 ? 'bg-green-500' : parseStats.accuracy >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${parseStats.accuracy}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Parsed:</span>
                      <span className="text-green-400 font-bold">{parseStats.parsed}/{parseStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Exact:</span>
                      <span className="text-blue-400 font-bold">{parseStats.exact}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {warnings.map((w, i) => (
                  <div key={i} className="bg-yellow-900/30 border border-yellow-600 rounded p-2 flex gap-2 text-yellow-200 text-sm">
                    <Info size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {output ? (
              <>
                <button
                  onClick={() => setShowEditor(!showEditor)}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"
                >
                  <Edit2 size={16} />
                  {showEditor ? 'Hide' : 'Show'} Field Editor
                </button>

                {showEditor && (
                  <div className="bg-slate-800 rounded-lg p-4 border border-amber-500/30">
                    <h3 className="text-white font-semibold mb-3">Edit Parsed Fields</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {parseStats?.fields.map((field, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <span className="text-slate-400 w-24 font-semibold">{field.name}:</span>
                          {editField === field.name ? (
                            <>
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 bg-slate-700 text-white rounded px-2 py-1 text-sm border border-amber-400 focus:outline-none"
                              />
                              <button onClick={saveEdit} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center gap-1">
                                <Save size={14} /> Save
                              </button>
                              <button onClick={() => setEditField(null)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-white truncate">{field.value}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${field.method === 'exact' ? 'bg-green-600/30 text-green-400' : 'bg-slate-600/30 text-slate-400'}`}>
                                {field.method}
                              </span>
                              <button onClick={() => startEdit(field.name)} className="text-amber-400 hover:text-amber-300">
                                <Edit2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {output.items && output.items.length > 0 && (
                  <div className="bg-slate-800 rounded-lg p-4 border border-orange-500/30">
                    <div className="flex items-center gap-2 text-orange-400 mb-3">
                      <Sword size={18} />
                      <span className="font-semibold">Parsed Actions ({output.items.length})</span>
                    </div>
                    <div className="space-y-3">
                      {output.items.map((item, idx) => (
                        <div key={idx} className="bg-slate-700 rounded p-3">
                          <div className="font-semibold text-white mb-1">{item.name}</div>
                          {item.system.attack && (
                            <div className="text-sm text-green-400">
                              Attack: +{item.system.attack.bonus}
                              {item.system.range && ` • Range: ${item.system.range.value} ft`}
                            </div>
                          )}
                          {item.system.damage && item.system.damage.parts && (
                            <div className="text-sm text-red-400">
                              Damage: {item.system.damage.parts[0][0]} {item.system.damage.parts[0][1]}
                            </div>
                          )}
                          <div className="text-xs text-slate-400 mt-2 line-clamp-2">{item.system.description.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-800 rounded-lg p-5 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <FileJson size={20} className="text-green-400" />
                    <label className="text-white font-semibold">Foundry VTT Actor JSON</label>
                  </div>
                  <pre className="w-full h-80 bg-slate-700 text-green-400 rounded p-3 text-xs font-mono overflow-auto border border-green-400/30">
                    {JSON.stringify(output, null, 2)}
                  </pre>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        const jsonStr = JSON.stringify(output, null, 2);
                        const blob = new Blob([jsonStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${output.name.replace(/\s+/g, '_')}_foundry.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"
                    >
                      <Download size={16} /> Download JSON
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(output, null, 2));
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex-1 bg-green-600/50 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"
                    >
                      <Copy size={16} /> {copied ? 'Copied!' : 'Copy JSON'}
                    </button>
                  </div>
                </div>

                <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                  <h3 className="text-orange-400 font-semibold mb-2 flex items-center gap-2">
                    <Sword size={16} /> v2.0-alpha.1 - Action Parsing (Phase 6 Sprint 1)
                  </h3>
                  <div className="text-sm text-slate-300 space-y-1">
                    <p>🆕 Parses Actions section</p>
                    <p>🆕 Extracts action names and descriptions</p>
                    <p>🆕 Detects attack bonuses (+X to hit)</p>
                    <p>🆕 Parses damage formulas (XdY + Z type)</p>
                    <p>🆕 Handles reach and range</p>
                    <p>🆕 Additional damage (plus X damage)</p>
                    <p>✅ All Phase 5 features included</p>
                    <p className="text-yellow-300 mt-2">⚠️ Alpha: Basic parsing only, edge cases may fail</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-800 rounded-lg p-12 border border-purple-500/30 flex items-center justify-center text-slate-400 h-96">
                <p>Parse a stat block to see output</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}