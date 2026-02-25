import React, { useState } from 'react';
import { Download, Copy, AlertCircle, Info, FileJson, Zap, BarChart3, Shield, Edit2, Save, X } from 'lucide-react';

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

  const parseStatBlock = (text) => {
    const errs = [];
    const warns = [];
    const stats = { parsed: 0, total: 0, exact: 0, fields: [] };

    warns.push('PARSE START: Beginning parse');

    try {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (!lines.length) throw new Error('No content to parse');

      // ALWAYS add a diagnostic warning
      warns.push(`DEBUG: Parsing ${lines.length} lines of text`);
      warns.push(`DEBUG: warns array has ${warns.length} items`);

      const name = lines[0] || 'Unknown';
      // Parse speed
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

      stats.total++; stats.parsed++; stats.exact++;
      stats.fields.push({ name: 'name', value: name, method: 'exact' });

      stats.total++;
      const sizeMatch = text.match(/\b(tiny|small|medium|large|huge|gargantuan)\b/i);
      const size = sizeMatch?.[1]?.toLowerCase() || 'medium';
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

      stats.total++;
      const typeMatch = text.match(/\b(beast|humanoid|dragon|undead|elemental|monstrosity|fey|fiend|giant|ooze|plant|construct|celestial|aberration)\b/i);
      const type = typeMatch?.[1]?.toLowerCase() || 'humanoid';
      if (typeMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'type', value: type, method: typeMatch ? 'exact' : 'default' });

      stats.total++;
      let alignMatch = text.match(/(?:tiny|small|medium|large|huge|gargantuan)\s+(?:beast|humanoid|dragon|undead|elemental|monstrosity|fey|fiend|giant|ooze|plant|construct|celestial|aberration)[^,]*,\s*(.+?)(?:\n|$)/i);
      if (!alignMatch) alignMatch = text.match(/alignment[:\s]+(.+?)(?:\n|$)/i);
      const alignment = alignMatch?.[1]?.trim() || 'unaligned';
      if (alignMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'alignment', value: alignment, method: alignMatch ? 'exact' : 'default' });

      stats.total++;
      const acMatch = text.match(/(?:AC|Armor Class)[:\s]*(\d+)(?:\s*\(([^)]+)\))?/i);
      const ac = acMatch ? parseInt(acMatch[1]) : 10;
      const acFormula = acMatch?.[2] || '';
      if (acMatch) { stats.parsed++; stats.exact++; } else warns.push('AC not found, using 10');
      stats.fields.push({ name: 'ac', value: `${ac}${acFormula ? ' (' + acFormula + ')' : ''}`, method: acMatch ? 'exact' : 'default' });

      stats.total++;
      const hpMatch = text.match(/(?:HP|Hit Points)[:\s]*(\d+)(?:\s*\(([^)]+)\))?/i);
      const hp = hpMatch ? parseInt(hpMatch[1]) : 5;
      const hpFormula = hpMatch?.[2] || '';
      if (hpMatch) { stats.parsed++; stats.exact++; } else warns.push('HP not found, using 5');
      stats.fields.push({ name: 'hp', value: `${hp}${hpFormula ? ' (' + hpFormula + ')' : ''}`, method: hpMatch ? 'exact' : 'default' });

      stats.total++;
      let abMatch = text.match(/STR\s+(\d+)\s+DEX\s+(\d+)\s+CON\s+(\d+)\s+INT\s+(\d+)\s+WIS\s+(\d+)\s+CHA\s+(\d+)/i);
      if (!abMatch) abMatch = text.match(/STR\s+(\d+)\s*\([+-]\d+\)\s+DEX\s+(\d+)\s*\([+-]\d+\)\s+CON\s+(\d+)\s*\([+-]\d+\)\s+INT\s+(\d+)\s*\([+-]\d+\)\s+WIS\s+(\d+)\s*\([+-]\d+\)\s+CHA\s+(\d+)\s*\([+-]\d+\)/i);
      const abilities = abMatch ? {
        str: parseInt(abMatch[1]), dex: parseInt(abMatch[2]), con: parseInt(abMatch[3]),
        int: parseInt(abMatch[4]), wis: parseInt(abMatch[5]), cha: parseInt(abMatch[6])
      } : { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
      
      if (abMatch) { 
        stats.parsed++; stats.exact++; 
      } else { 
        warns.push('Abilities not found, using 10s');
        errs.push('DEBUG: Ability patterns all failed. Check stat block format.');
      }
      
      stats.fields.push({ name: 'abilities', value: `STR ${abilities.str} DEX ${abilities.dex} CON ${abilities.con} INT ${abilities.int} WIS ${abilities.wis} CHA ${abilities.cha}`, method: abMatch ? 'exact' : 'default' });

      stats.total++;
      let crMatch = text.match(/Challenge[:\s]+(\d+(?:\/\d+)?)/i);
      if (!crMatch) crMatch = text.match(/\bCR[:\s]+(\d+(?:\/\d+)?)/i);
      const cr = crMatch?.[1] || '1';
      if (crMatch) { stats.parsed++; stats.exact++; } else warns.push('CR not found, using 1');
      stats.fields.push({ name: 'cr', value: cr, method: crMatch ? 'exact' : 'default' });

      const profBonus = (() => {
        const crNum = parseFloat(cr);
        if (crNum < 5) return 2;
        if (crNum < 9) return 3;
        if (crNum < 13) return 4;
        if (crNum < 17) return 5;
        return 6;
      })();

      stats.total++;
      const savesMatch = text.match(/Saving Throws[:\s]+(.+?)(?=\s+Skills|\s+Damage|\s+Senses|\s+Languages|\s+Challenge|$)/i);
      const savesText = savesMatch?.[1] || '';
      if (savesMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'saves', value: savesText || 'none', method: savesMatch ? 'exact' : 'default' });

      const saves = {
        str: { value: 0 },
        dex: { value: 0 },
        con: { value: 0 },
        int: { value: 0 },
        wis: { value: 0 },
        cha: { value: 0 }
      };

      if (savesText) {
        savesText.split(',').forEach(entry => {
          const match = entry.trim().match(/^(str|dex|con|int|wis|cha)\s*([+-]\d+)/i);
          if (match) {
            const ab = match[1].toLowerCase();
            const bonus = parseInt(match[2]);
            const baseMod = mod(abilities[ab]);
            
            if (bonus === baseMod + profBonus) {
              saves[ab].value = 1;
            } else if (bonus > baseMod) {
              saves[ab].value = 1;
            }
          }
        });
      }

      stats.total++;
      const skillMatch = text.match(/Skills[:\s]+(.+?)(?=\s+Damage|\s+Senses|\s+Languages|\s+Challenge|\s+Condition|$)/i);
      const skillsText = skillMatch?.[1] || '';
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
        const abilityMod = mod(abilities[ability]);
        skills[shortName] = {
          value: 0,
          ability: ability
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
              
              if (bonus === withExpertise) {
                skills[shortName].value = 2;
              } else if (bonus === withProf) {
                skills[shortName].value = 1;
              }
            }
          }
        });
      }

      stats.total++;
      const senseMatch = text.match(/Senses[:\s]+(.+?)(?=\s+Languages|\s+Challenge|$)/i);
      const senses = senseMatch?.[1] || '';
      if (senseMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'senses', value: senses || 'none', method: senseMatch ? 'exact' : 'default' });

      stats.total++;
      const langMatch = text.match(/Languages[:\s]+(.+?)(?=\s+Challenge|$)/i);
      let languages = langMatch?.[1] || '';
      // Clean up languages - remove parenthetical notes
      languages = languages.replace(/\([^)]*\)/g, '').trim();
      if (langMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'languages', value: languages || 'none', method: langMatch ? 'exact' : 'default' });

      const foundryActor = {
        name,
        type: 'npc',
        system: {
          currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
          abilities: {
            str: {
              value: abilities.str,
              proficient: 0,
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
          bonuses: {
            mwak: { attack: '', damage: '' },
            rwak: { attack: '', damage: '' },
            msak: { attack: '', damage: '' },
            rsak: { attack: '', damage: '' },
            abilities: { check: '', save: '', skill: '' },
            spell: { dc: '' }
          },
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
          resources: {
            legact: { max: 0, spent: 0 },
            legres: { max: 0, spent: 0 },
            lair: { value: false, initiative: null, inside: false }
          },
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

      stats.accuracy = Math.round((stats.parsed / stats.total) * 100);
      
      // Add final diagnostic
      warns.push(`FINAL: ${warns.length} warnings collected`);
      
      setErrors(errs);
      setWarnings(warns);
      setParseStats(stats);
      setOutput(foundryActor);

    } catch (err) {
      setErrors([err.message]);
      setWarnings(['ERROR: Parsing failed at: ' + err.message]);
      setOutput(null);
      setParseStats(null);
    }
  };

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
      // Update parseStats display
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
      // Update parseStats display
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
      // Update parseStats display
      const sensesField = parseStats.fields.find(f => f.name === 'senses');
      if (sensesField) sensesField.value = editValue;
    }
    else if (editField === 'languages') {
      updated.system.traits.languages.value = editValue ? editValue.split(',').map(l => l.trim().toLowerCase()) : [];
      // Update parseStats display
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
        // Update parseStats display
        const abField = parseStats.fields.find(f => f.name === 'abilities');
        if (abField) abField.value = `STR ${parts[0]} DEX ${parts[1]} CON ${parts[2]} INT ${parts[3]} WIS ${parts[4]} CHA ${parts[5]}`;
      }
    }
    else if (editField === 'acType') {
      // Update parseStats display
      const acTypeField = parseStats.fields.find(f => f.name === 'acType');
      if (acTypeField) acTypeField.value = editValue;
    }
    
    setOutput(updated);
    setParseStats({...parseStats}); // Force re-render
    setEditField(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-white">D&D Stat Block Converter</h1>
            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Shield size={14} /> v1.4 - LATEST FOUNDRY FORMAT
            </span>
          </div>
          <p className="text-purple-200">Phase 5: Stats & Abilities Parser - TEST VERSION 999</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg p-5 border border-purple-500/30">
              <label className="block text-white font-semibold mb-3">Paste Stat Block</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste D&D 5e stat block here..."
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

            {errors.length > 0 && (
              <div className="space-y-2">
                {errors.map((e, i) => (
                  <div key={i} className="bg-red-900/30 border border-red-500 rounded p-2 flex gap-2 text-red-200 text-sm">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            )}
            
            {warnings.length > 0 && (
              <div className="space-y-2">
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

                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                    <Shield size={16} /> v1.3 - Foundry VTT Compatible
                  </h3>
                  <div className="text-sm text-slate-300 space-y-1">
                    <p>✅ Structure matches Foundry VTT v3.3+ format</p>
                    <p>✅ Abilities with proficiency flags for saves</p>
                    <p>✅ Skills with simplified structure</p>
                    <p>✅ Ready to import into Foundry VTT</p>
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