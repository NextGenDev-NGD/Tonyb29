import React, { useState } from 'react';
import { Download, Copy, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function StatBlockConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState(null);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [parseStats, setParseStats] = useState(null);
  const [copied, setCopied] = useState(false);

  // Calculate ability modifier from score
  const getModifier = (score) => Math.floor((score - 10) / 2);

  // Proficiency bonus based on CR
  const getProfBonus = (cr) => {
    const crNum = parseFloat(cr);
    if (crNum < 5) return 2;
    if (crNum < 9) return 3;
    if (crNum < 13) return 4;
    if (crNum < 17) return 5;
    return 6;
  };

  const skillAbilityMap = {
    acrobatics: 'dex',
    'animal handling': 'wis',
    arcana: 'int',
    athletics: 'str',
    deception: 'cha',
    history: 'int',
    insight: 'wis',
    intimidation: 'cha',
    investigation: 'int',
    medicine: 'wis',
    nature: 'int',
    perception: 'wis',
    performance: 'cha',
    persuasion: 'cha',
    'sleight of hand': 'dex',
    stealth: 'dex',
    survival: 'wis',
  };

  const skillShortMap = {
    acrobatics: 'acr',
    'animal handling': 'ani',
    arcana: 'arc',
    athletics: 'ath',
    deception: 'dec',
    history: 'his',
    insight: 'ins',
    intimidation: 'itm',
    investigation: 'inv',
    medicine: 'med',
    nature: 'nat',
    perception: 'prc',
    performance: 'prf',
    persuasion: 'per',
    'sleight of hand': 'slt',
    stealth: 'ste',
    survival: 'sur',
  };

  const parseStatBlock = (text) => {
    const errs = [];
    const warns = [];
    const stats = { parsedFields: 0, totalFields: 0 };

    try {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      
      if (lines.length === 0) {
        throw new Error('No content to parse');
      }

      // Extract name
      const name = lines[0] || 'Unknown';
      stats.totalFields++;
      stats.parsedFields++;

      // Helper to find value after a pattern
      const findValue = (pattern, defaultVal = '') => {
        const regex = new RegExp(pattern, 'i');
        for (let line of lines) {
          const match = line.match(regex);
          if (match) return match[1] || match[0];
        }
        return defaultVal;
      };

      // Helper to find full section
      const findSection = (startPattern, endPattern) => {
        const startRegex = new RegExp(startPattern, 'i');
        const endRegex = new RegExp(endPattern, 'i');
        let startIdx = -1;
        let endIdx = -1;
        
        for (let i = 0; i < lines.length; i++) {
          if (startIdx === -1 && startRegex.test(lines[i])) {
            startIdx = i + 1;
          }
          if (startIdx !== -1 && endRegex.test(lines[i])) {
            endIdx = i;
            break;
          }
        }
        
        if (startIdx === -1) return '';
        if (endIdx === -1) endIdx = lines.length;
        return lines.slice(startIdx, endIdx).join('\n').trim();
      };

      // Parse basic stats
      stats.totalFields++;
      const size = findValue(/^(Tiny|Small|Medium|Large|Huge|Gargantuan)/, 'Medium');
      if (size !== 'Medium') stats.parsedFields++;

      stats.totalFields++;
      const type = findValue(/\b(humanoid|beast|monstrosity|dragon|undead|elemental|fey|fiend|giant|ooze|plant|construct|celestial|aberration)\b/i, 'humanoid');
      if (type !== 'humanoid') stats.parsedFields++;

      stats.totalFields++;
      const alignment = findValue(/alignment[:\s]+(.+?)(?:\n|$)/i, 'unaligned');
      if (alignment !== 'unaligned') stats.parsedFields++;
      
      // AC and HP
      stats.totalFields += 2;
      const acMatch = text.match(/AC\s+(\d+)/i);
      const ac = acMatch ? parseInt(acMatch[1]) : 10;
      if (acMatch) stats.parsedFields++;
      else warns.push('AC not found, using default 10');

      const hpMatch = text.match(/HP\s+(\d+)/i);
      const hp = hpMatch ? parseInt(hpMatch[1]) : 5;
      if (hpMatch) stats.parsedFields++;
      else warns.push('HP not found, using default 5');

      // Ability scores
      stats.totalFields++;
      const abilityPattern = /STR\s+(\d+)\s+DEX\s+(\d+)\s+CON\s+(\d+)\s+INT\s+(\d+)\s+WIS\s+(\d+)\s+CHA\s+(\d+)/i;
      const abilityMatch = text.match(abilityPattern);
      
      if (!abilityMatch) {
        warns.push('Ability scores not found in standard format');
      } else {
        stats.parsedFields++;
      }

      const abilities = {
        str: abilityMatch ? parseInt(abilityMatch[1]) : 10,
        dex: abilityMatch ? parseInt(abilityMatch[2]) : 10,
        con: abilityMatch ? parseInt(abilityMatch[3]) : 10,
        int: abilityMatch ? parseInt(abilityMatch[4]) : 10,
        wis: abilityMatch ? parseInt(abilityMatch[5]) : 10,
        cha: abilityMatch ? parseInt(abilityMatch[6]) : 10,
      };

      // Skills
      stats.totalFields++;
      const skillsMatch = text.match(/Skills\s+(.+?)(?:\n|Senses|Condition|Languages|Challenge|Damage|Resistance|Immunity|Saving)/i);
      const skillsText = skillsMatch ? skillsMatch[1] : '';
      if (skillsMatch) stats.parsedFields++;

      const skillsObj = {};
      Object.keys(skillAbilityMap).forEach(skillName => {
        const shortName = skillShortMap[skillName];
        const ability = skillAbilityMap[skillName];
        const baseMod = getModifier(abilities[ability]);
        
        skillsObj[shortName] = {
          value: 0,
          ability: ability,
          bonus: baseMod,
          mod: baseMod,
          prof: { term: '', multiplier: 0 },
          half: false
        };
      });

      if (skillsText) {
        const skillEntries = skillsText.split(',').map(s => s.trim());
        skillEntries.forEach(entry => {
          const match = entry.match(/^([^+\-0-9]+)([\+\-]\d+)/);
          if (match) {
            const skillName = match[1].trim().toLowerCase();
            const modifier = parseInt(match[2]);
            
            if (skillShortMap[skillName]) {
              const shortName = skillShortMap[skillName];
              const ability = skillAbilityMap[skillName];
              const baseMod = getModifier(abilities[ability]);
              const profBonus = modifier - baseMod;
              
              skillsObj[shortName] = {
                value: 0,
                ability: ability,
                bonus: modifier,
                mod: baseMod,
                prof: { term: profBonus > 0 ? '1' : '0', multiplier: 1 },
                half: false
              };
            }
          }
        });
      }

      // Challenge
      stats.totalFields++;
      const crMatch = text.match(/Challenge\s+(\d+(?:\/\d+)?)/i);
      const cr = crMatch ? crMatch[1] : '1';
      if (crMatch) stats.parsedFields++;
      else warns.push('Challenge rating not found, using CR 1');

      const profBonus = getProfBonus(cr);

      // Saving Throws
      stats.totalFields++;
      const savingThrowsMatch = text.match(/Saving Throws\s+(.+?)(?:\n|Skills|Condition|Languages|Challenge|Damage|Resistance|Immunity)/i);
      const savingThrowsText = savingThrowsMatch ? savingThrowsMatch[1] : '';
      if (savingThrowsMatch) stats.parsedFields++;

      const savingThrows = {};
      ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ability => {
        savingThrows[ability] = {
          value: 0,
          ability: ability,
          bonus: getModifier(abilities[ability]),
          mod: getModifier(abilities[ability]),
          prof: { term: '0', multiplier: 1 },
          half: false
        };
      });

      if (savingThrowsText) {
        const stEntries = savingThrowsText.split(',').map(s => s.trim());
        stEntries.forEach(entry => {
          const match = entry.match(/^([a-z]{3})([\+\-]\d+)/i);
          if (match) {
            const ability = match[1].toLowerCase();
            const modifier = parseInt(match[2]);
            savingThrows[ability].bonus = modifier;
            savingThrows[ability].prof.term = '1';
          }
        });
      }

      // Immunities and Resistances
      stats.totalFields += 4;
      const immunityMatch = text.match(/Damage Immunities\s+(.+?)(?:\n|Condition|Languages|Challenge|Resistance|Weakness)/i);
      const damageImmunities = immunityMatch ? immunityMatch[1].split(',').map(s => s.trim()) : [];
      if (immunityMatch) stats.parsedFields++;

      const resistMatch = text.match(/Damage Resistances\s+(.+?)(?:\n|Condition|Languages|Challenge|Immunity|Weakness)/i);
      const damageResistances = resistMatch ? resistMatch[1].split(',').map(s => s.trim()) : [];
      if (resistMatch) stats.parsedFields++;

      const vulnerMatch = text.match(/Damage Vulnerabilities\s+(.+?)(?:\n|Condition|Languages|Challenge|Immunity|Resistance)/i);
      const damageVulnerabilities = vulnerMatch ? vulnerMatch[1].split(',').map(s => s.trim()) : [];
      if (vulnerMatch) stats.parsedFields++;

      const conditionMatch = text.match(/Condition Immunities\s+(.+?)(?:\n|Languages|Challenge|Damage|Senses)/i);
      const conditionImmunities = conditionMatch ? conditionMatch[1].split(',').map(s => s.trim().toLowerCase()) : [];
      if (conditionMatch) stats.parsedFields++;

      // Senses
      stats.totalFields++;
      const sensesMatch = text.match(/Senses\s+(.+?)(?:\n|Languages|Challenge|Condition)/i);
      const senses = sensesMatch ? sensesMatch[1] : '';
      if (sensesMatch) stats.parsedFields++;

      // Languages
      stats.totalFields++;
      const languagesMatch = text.match(/Languages\s+(.+?)(?:\n|Challenge|Condition|$)/i);
      const languages = languagesMatch ? languagesMatch[1] : '';
      if (languagesMatch) stats.parsedFields++;

      // Traits (Special Abilities)
      stats.totalFields++;
      const traitsSection = findSection(/^Traits$|^Special Traits$/, /^Actions$|^Reactions$|^Legendary Actions$|^Legendary Resistances$/);
      const traits = [];
      
      if (traitsSection) {
        stats.parsedFields++;
        const traitBlocks = traitsSection.split(/\n(?=[A-Z][a-z]*\.)/);
        traitBlocks.forEach(block => {
          const match = block.match(/^([^.]+)\.\s+(.+)$/s);
          if (match) {
            traits.push({
              name: match[1].trim(),
              description: match[2].trim()
            });
          }
        });
      }

      // Actions
      stats.totalFields++;
      const actionsSection = findSection(/^Actions$/, /^Reactions$|^Legendary Actions$|^Legendary Resistances$/);
      const actions = [];
      
      if (actionsSection) {
        stats.parsedFields++;
        const actionBlocks = actionsSection.split(/\n(?=[A-Z][a-z]*\.)/);
        actionBlocks.forEach(block => {
          const match = block.match(/^([^.]+)\.\s+(.+)$/s);
          if (match) {
            actions.push({
              name: match[1].trim(),
              description: match[2].trim()
            });
          }
        });
      }

      // Reactions
      stats.totalFields++;
      const reactionsSection = findSection(/^Reactions$/, /^Legendary Actions$|^Legendary Resistances$/);
      const reactions = [];
      
      if (reactionsSection) {
        stats.parsedFields++;
        const reactionBlocks = reactionsSection.split(/\n(?=[A-Z][a-z]*\.)/);
        reactionBlocks.forEach(block => {
          const match = block.match(/^([^.]+)\.\s+(.+)$/s);
          if (match) {
            reactions.push({
              name: match[1].trim(),
              description: match[2].trim()
            });
          }
        });
      }

      // Legendary Actions
      stats.totalFields++;
      const legendarySection = findSection(/^Legendary Actions$/, /^Legendary Resistances$/);
      const legendaryActions = [];
      
      if (legendarySection) {
        stats.parsedFields++;
        const legBlocks = legendarySection.split(/\n(?=[A-Z][a-z]*\.)/);
        legBlocks.forEach(block => {
          const match = block.match(/^([^.]+)\.\s+(.+)$/s);
          if (match) {
            legendaryActions.push({
              name: match[1].trim(),
              description: match[2].trim()
            });
          }
        });
      }

      // Validate AC and HP (but continue parsing regardless)
      if (ac < 5 || ac > 30) warns.push(`AC value ${ac} seems unusual (typical range: 5-30)`);
      if (hp < 1 || hp > 500) warns.push(`HP value ${hp} seems unusual (typical range: 1-500)`);

      // Build Universal Character Format (Phase 1)
      const universalFormat = {
        version: '1.0.0',
        parserVersion: 'Phase1-v0.1',
        timestamp: new Date().toISOString(),
        metadata: {
          name: name,
          size: size,
          type: type,
          alignment: alignment,
          source: 'stat_block_paste'
        },
        core: {
          ac: ac,
          hp: hp,
          proficiencyBonus: profBonus
        },
        abilities: abilities,
        abilityModifiers: {
          str: getModifier(abilities.str),
          dex: getModifier(abilities.dex),
          con: getModifier(abilities.con),
          int: getModifier(abilities.int),
          wis: getModifier(abilities.wis),
          cha: getModifier(abilities.cha)
        },
        skills: skillsObj,
        savingThrows: savingThrows,
        traits: {
          damageImmunities: damageImmunities,
          damageResistances: damageResistances,
          damageVulnerabilities: damageVulnerabilities,
          conditionImmunities: conditionImmunities
        },
        senses: senses,
        languages: languages,
        challengeRating: cr,
        abilities: {
          traits: traits,
          actions: actions,
          reactions: reactions,
          legendaryActions: legendaryActions
        }
      };

      // Build Foundry VTT Output
      const foundryActor = {
        name: name,
        type: 'npc',
        system: {
          attributes: {
            hp: {
              value: hp,
              max: hp,
              temp: 0,
              tempmax: 0
            },
            ac: {
              flat: ac,
              calc: 'default',
              formula: ''
            },
            speed: {
              burrow: 0,
              climb: 0,
              fly: 0,
              swim: 0,
              walk: 30
            },
            senses: senses
          },
          traits: {
            languages: {
              value: languages ? languages.split(',').map(l => l.trim().toLowerCase()) : []
            },
            di: { value: damageImmunities },
            dr: { value: damageResistances },
            dv: { value: damageVulnerabilities },
            ci: { value: conditionImmunities },
          },
          details: {
            alignment: alignment,
            biography: {
              value: (traits.length > 0 ? '**Traits**\n' + traits.map(t => `**${t.name}**: ${t.description}`).join('\n\n') + '\n\n' : '') +
                      (actions.length > 0 ? '**Actions**\n' + actions.map(a => `**${a.name}**: ${a.description}`).join('\n\n') + '\n\n' : '') +
                      (reactions.length > 0 ? '**Reactions**\n' + reactions.map(r => `**${r.name}**: ${r.description}`).join('\n\n') + '\n\n' : '') +
                      (legendaryActions.length > 0 ? '**Legendary Actions**\n' + legendaryActions.map(l => `**${l.name}**: ${l.description}`).join('\n\n') : ''),
              public: ''
            },
            race: type,
            type: {
              value: type,
              subtype: ''
            },
            cr: parseFloat(cr)
          },
          abilities: {
            str: { value: abilities.str },
            dex: { value: abilities.dex },
            con: { value: abilities.con },
            int: { value: abilities.int },
            wis: { value: abilities.wis },
            cha: { value: abilities.cha }
          },
          skills: skillsObj,
          saves: savingThrows,
          currency: {
            cp: 0,
            sp: 0,
            ep: 0,
            gp: 0,
            pp: 0
          }
        },
        items: [],
        effects: []
      };

      setErrors(errs);
      setWarnings(warns);
      setParseStats(stats);
      setOutput({
        universal: universalFormat,
        foundry: foundryActor
      });

    } catch (err) {
      setErrors([err.message]);
      setOutput(null);
      setParseStats(null);
    }
  };

  const handleParse = () => {
    if (!input.trim()) {
      setErrors(['Please paste a stat block']);
      return;
    }
    parseStatBlock(input);
  };

  const downloadJSON = (format) => {
    if (!output) return;
    const data = format === 'universal' ? output.universal : output.foundry;
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${output.universal.metadata.name.replace(/\s+/g, '_')}_${format}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (format) => {
    if (!output) return;
    const data = format === 'universal' ? output.universal : output.foundry;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">D&D Stat Block Converter</h1>
          <p className="text-purple-200 mb-2">Phase 1: Foundation & Universal Format</p>
          <p className="text-sm text-purple-300">Parse D&D 5e stat blocks into universal format and Foundry VTT JSON</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-800 rounded-lg p-6 border border-purple-500/30">
              <label className="block text-white font-semibold mb-3">Paste Stat Block</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your D&D 5e stat block here..."
                className="w-full h-64 bg-slate-700 text-white rounded p-3 font-mono text-sm border border-purple-400/30 focus:border-purple-400 focus:outline-none"
              />
              <button
                onClick={handleParse}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition"
              >
                Parse Stat Block
              </button>
            </div>

            {/* Warnings & Errors */}
            <div className="space-y-2">
              {errors.map((err, i) => (
                <div key={i} className="bg-red-900/30 border border-red-500 rounded p-3 flex gap-2 text-red-200 text-sm">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{err}</span>
                </div>
              ))}
              {warnings.map((warn, i) => (
                <div key={i} className="bg-yellow-900/30 border border-yellow-600 rounded p-3 flex gap-2 text-yellow-200 text-sm">
                  <Info size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{warn}</span>
                </div>
              ))}
            </div>

            {/* Parse Statistics */}
            {parseStats && (
              <div className="bg-slate-800 rounded-lg p-4 border border-green-500/30">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle size={18} />
                  <span className="font-semibold">Parse Statistics</span>
                </div>
                <div className="text-sm text-slate-300 space-y-1">
                  <p>Fields Parsed: <span className="text-green-400 font-bold">{parseStats.parsedFields}</span> / {parseStats.totalFields}</p>
                  <p>Accuracy: <span className="text-green-400 font-bold">{Math.round((parseStats.parsedFields / parseStats.totalFields) * 100)}%</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Output Panels */}
          <div className="lg:col-span-2 space-y-4">
            {output && (
              <>
                {/* Universal Format */}
                <div className="bg-slate-800 rounded-lg p-6 border border-blue-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-white font-semibold">Universal Character Format v1.0</label>
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Phase 1</span>
                  </div>
                  <pre className="w-full h-64 bg-slate-700 text-blue-400 rounded p-3 font-mono text-xs overflow-auto border border-blue-400/30">
                    {JSON.stringify(output.universal, null, 2)}
                  </pre>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => downloadJSON('universal')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2 text-sm"
                    >
                      <Download size={16} /> Download
                    </button>
                    <button
                      onClick={() => copyToClipboard('universal')}
                      className="flex-1 bg-blue-600/50 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2 text-sm"
                    >
                      <Copy size={16} /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">
                    Universal format for conversion to other platforms (Phase 2+)
                  </p>
                </div>

                {/* Foundry VTT Format */}
                <div className="bg-slate-800 rounded-lg p-6 border border-green-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-white font-semibold">Foundry VTT Actor JSON</label>
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Ready</span>
                  </div>
                  <pre className="w-full h-64 bg-slate-700 text-green-400 rounded p-3 font-mono text-xs overflow-auto border border-green-400/30">
                    {JSON.stringify(output.foundry, null, 2)}
                  </pre>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => downloadJSON('foundry')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2 text-sm"
                    >
                      <Download size={16} /> Download
                    </button>
                    <button
                      onClick={() => copyToClipboard('foundry')}
                      className="flex-1 bg-green-600/50 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2 text-sm"
                    >
                      <Copy size={16} /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">
                    Import directly into Foundry VTT: Right-click actor → Import Data
                  </p>
                </div>
              </>
            )}

            {!output && (
              <div className="bg-slate-800 rounded-lg p-6 border border-purple-500/30 col-span-2 h-full flex items-center justify-center text-slate-400">
                <p>Parse a stat block to see output</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-white">Phase 1 Features:</span> Core stat block parsing, ability modifier calculations, skill proficiencies, damage/condition immunities, traits/actions/reactions extraction, and dual output (Universal Format + Foundry VTT JSON)
          </p>
        </div>
      </div>
    </div>
  );
}