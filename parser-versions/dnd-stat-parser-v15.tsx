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
      const acFormula = acMatch?.[2] || '';
      if (acMatch) { stats.parsed++; stats.exact++; } else warns.push('AC not found, using 10');
      stats.fields.push({ name: 'ac', value: `${ac}${acFormula ? ' (' + acFormula + ')' : ''}`, method: acMatch ? 'exact' : 'default' });

      // HP
      stats.total++;
      const hpMatch = text.match(/(?:HP|Hit Points)[:\s]*(\d+)(?:\s*\(([^)]+)\))?/i);
      const hp = hpMatch ? parseInt(hpMatch[1]) : 5;
      const hpFormula = hpMatch?.[2] || '';
      if (hpMatch) { stats.parsed++; stats.exact++; } else warns.push('HP not found, using 5');
      stats.fields.push({ name: 'hp', value: `${hp}${hpFormula ? ' (' + hpFormula + ')' : ''}`, method: hpMatch ? 'exact' : 'default' });

      // SPEED
      stats.total++;
      const speedMatch = text.match(/Speed\s+(\d+)\s*ft\.(?:,\s*climb\s+(\d+)\s*ft\.)?(?:,\s*fly\s+(\d+)\s*ft\.)?(?:,\s*swim\s+(\d+)\s*ft\.)?(?:,\s*burrow\s+(\d+)\s*ft\.)?/i);
      const speeds = {
        walk: speedMatch ? parseInt(speedMatch[1]) : 30,
        climb: speedMatch?.[2] ? parseInt(speedMatch[2]) : 0,
        fly: speedMatch?.[3] ? parseInt(speedMatch[3]) : 0,
        swim: speedMatch?.[4] ? parseInt(speedMatch[4]) : 0,
        burrow: speedMatch?.[5] ? parseInt(speedMatch[5]) : 0
      };
      if (speedMatch) { stats.parsed++; stats.exact++; }
      const speedDisplay = `${speeds.walk} ft.${speeds.climb ? `, climb ${speeds.climb} ft.` : ''}${speeds.fly ? `, fly ${speeds.fly} ft.` : ''}${speeds.swim ? `, swim ${speeds.swim} ft.` : ''}${speeds.burrow ? `, burrow ${speeds.burrow} ft.` : ''}`;
      stats.fields.push({ name: 'speed', value: speedDisplay, method: speedMatch ? 'exact' : 'default' });

      // ABILITIES
      stats.total++;
      let abMatch = text.match(/STR\s+(\d+)\s+DEX\s+(\d+)\s+CON\s+(\d+)\s+INT\s+(\d+)\s+WIS\s+(\d+)\s+CHA\s+(\d+)/i);
      if (!abMatch) abMatch = text.match(/STR\s+(\d+)\s*\([+-]\d+\)\s+DEX\s+(\d+)\s*\([+-]\d+\)\s+CON\s+(\d+)\s*\([+-]\d+\)\s+INT\s+(\d+)\s*\([+-]\d+\)\s+WIS\s+(\d+)\s*\([+-]\d+\)\s+CHA\s+(\d+)\s*\([+-]\d+\)/i);
      const abilities = abMatch ? {
        str: parseInt(abMatch[1]), dex: parseInt(abMatch[2]), con: parseInt(abMatch[3]),
        int: parseInt(abMatch[4]), wis: parseInt(abMatch[5]), cha: parseInt(abMatch[6])
      } : { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
      
      if (abMatch) { stats.parsed++; stats.exact++; } 
      else warns.push('Abilities not found, using 10s');
      
      stats.fields.push({ name: 'abilities', value: `STR ${abilities.str} DEX ${abilities.dex} CON ${abilities.con} INT ${abilities.int} WIS ${abilities.wis} CHA ${abilities.cha}`, method: abMatch ? 'exact' : 'default' });

      // CR & Proficiency Bonus
      stats.total++;
      let crMatch = text.match(/Challenge[:\s]+(\d+(?:\/\d+)?)/i);
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

      // SAVING THROWS
      stats.total++;
      const savesMatch = text.match(/Saving Throws[:\s]+(.+?)(?=\n\s*Skills|\n\s*Damage|\n\s*Senses|\n\s*Languages|\n\s*Challenge|$)/is);
      const savesText = savesMatch?.[1]?.trim() || '';
      if (savesMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'saves', value: savesText || 'none', method: savesMatch ? 'exact' : 'default' });

      const saves = {
        str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0
      };

      if (savesText) {
        savesText.split(',').forEach(entry => {
          const match = entry.trim().match(/^(str|dex|con|int|wis|cha)\s*([+-]\d+)/i);
          if (match) {
            const ab = match[1].toLowerCase();
            const bonus = parseInt(match[2]);
            const baseMod = mod(abilities[ab]);
            
            if (bonus === baseMod + profBonus || bonus > baseMod) {
              saves[ab] = 1;
            }
          }
        });
      }

      // SKILLS
      stats.total++;
      const skillMatch = text.match(/Skills[:\s]+(.+?)(?=\n\s*Damage|\n\s*Senses|\n\s*Languages|\n\s*Challenge|\n\s*Condition|$)/is);
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

      // Initialize all skills with proper Foundry structure
      const skills = {};
      Object.entries(skillMap).forEach(([longName, shortName]) => {
        const ability = skillAbilityMap[shortName];
        skills[shortName] = {
          ability: ability,
          value: 0,
          bonuses: {
            check: '',
            passive: ''
          }
        };
      });

      // Parse skill bonuses from stat block
      if (skillsText) {
        const skillEntries = skillsText.split(',');
        
        skillEntries.forEach(entry => {
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
              } else if (bonus > abilityMod) {
                skills[shortName].value = 1;
              }
            }
          }
        });
      }

      // SENSES
      stats.total++;
      const senseMatch = text.match(/Senses[:\s]+(.+?)(?=\n\s*Languages|\n\s*Challenge|$)/is);
      const senses = senseMatch?.[1]?.trim() || '';
      if (senseMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'senses', value: senses || 'none', method: senseMatch ? 'exact' : 'default' });

      // LANGUAGES
      stats.total++;
      const langMatch = text.match(/Languages[:\s]+(.+?)(?=\n\s*Challenge|$)/is);
      let languages = langMatch?.[1]?.trim() || '';
      languages = languages.replace(/\([^)]*\)/g, '').trim();
      if (langMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'languages', value: languages || 'none', method: langMatch ? 'exact' : 'default' });

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
        items: [],
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

  const startEdit = (fieldName) => {
    setEditField(fieldName);
    if (fieldName === 'name') setEditValue(output?.name || '');
    else if (fieldName === 'ac') setEditValue(output?.system?.attributes?.ac?.flat || 10);
    else if (fieldName === 'hp') setEditValue(output?.system?.attributes?.hp?.max || 5);
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
  };

  const saveEdit = () => {
    if (!output || !editField) return;
    const updated = JSON.parse(JSON.stringify(output));
    
    if (editField === 'name') updated.name = editValue;
    else if (editField === 'ac') updated.system.attributes.ac.flat = parseInt(editValue) || 10;
    else if (editField === 'hp') {
      const val = parseInt(editValue) || 5;
      updated.system.attributes.hp.value = val;
      updated.system.attributes.hp.max = val;
    }
    else if (editField === 'cr') updated.system.details.cr = parseFloat(editValue) || 0;
    else if (editField === 'size') {
      const sizeValue = editValue.toLowerCase();
      const sizeCode = {
        'tiny': 'tiny', 'small': 'sm', 'medium': 'med',
        'large': 'lg', 'huge': 'huge', 'gargantuan': 'grg'
      }[sizeValue] || 'med';
      updated.system.traits.size = sizeCode;
    }
    else if (editField === 'type') updated.system.details.type.value = editValue.toLowerCase();
    else if (editField === 'alignment') updated.system.details.alignment = editValue;
    else if (editField === 'senses') updated.system.attributes.senses.special = editValue;
    else if (editField === 'languages') {
      updated.system.traits.languages.value = editValue ? editValue.split(',').map(l => l.trim().toLowerCase().replace(/\s+/g, '')) : [];
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
      }
    }
    
    setOutput(updated);
    setEditField(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-white">D&D Stat Block Converter</h1>
            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Shield size={14} /> v1.5 - SKILLS FIXED
            </span>
          </div>
          <p className="text-purple-200">Clean rewrite with proper skill parsing</p>
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
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {errors.map((e, i) => (
                  <div key={i} className="bg-red-900/30 border border-red-500 rounded p-2 flex gap-2 text-red-200 text-sm">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{e}</span>
                  </div>
                ))}
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
                    <Shield size={16} /> v1.5 - Skills Fixed
                  </h3>
                  <div className="text-sm text-slate-300 space-y-1">
                    <p>✅ Clean rewrite - removed legacy code</p>
                    <p>✅ Skills properly structured with ability + value + bonuses</p>
                    <p>✅ Proficiency detection (0=none, 1=proficient, 2=expertise)</p>
                    <p>✅ All 18 skills initialized with correct abilities</p>
                    <p>✅ Ready for Foundry VTT import</p>
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