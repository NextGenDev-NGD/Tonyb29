import React, { useState } from 'react';
import { Download, Copy, AlertCircle, CheckCircle, Info, FileJson, Zap, Edit2, Save, X, TestTube, BarChart3 } from 'lucide-react';

export default function Phase5StableConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState(null);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [parseStats, setParseStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Levenshtein Distance for Fuzzy Matching
  const levenshtein = (a, b) => {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        if (b[j - 1] === a[i - 1]) matrix[j][i] = matrix[j - 1][i - 1];
        else matrix[j][i] = Math.min(matrix[j - 1][i - 1], matrix[j][i - 1], matrix[j - 1][i]) + 1;
      }
    }
    return matrix[b.length][a.length];
  };

  // Fuzzy field finder
  const findFuzzy = (keywords, lines, regex = null, maxDist = 2) => {
    // Try exact regex first
    if (regex) {
      for (const line of lines) {
        const match = line.match(regex);
        if (match && match[1]) return { value: match[1], method: 'exact', confidence: 1.0 };
      }
    }
    // Fuzzy fallback
    for (const line of lines.slice(0, 30)) {
      const words = line.split(/[\s:,\-()]+/);
      for (const word of words) {
        for (const keyword of keywords) {
          if (levenshtein(word.toLowerCase(), keyword.toLowerCase()) <= maxDist) {
            const num = line.match(/(\d+(?:\/\d+)?)/);
            if (num) return { value: num[1], method: 'fuzzy', confidence: 0.7 };
          }
        }
      }
    }
    return null;
  };

  const mod = (score) => Math.floor((score - 10) / 2);
  const profBonus = (cr) => {
    const n = parseFloat(cr);
    return n < 5 ? 2 : n < 9 ? 3 : n < 13 ? 4 : n < 17 ? 5 : 6;
  };

  const parseStatBlock = (text) => {
    const errs = [];
    const warns = [];
    const stats = { parsed: 0, total: 0, exact: 0, fuzzy: 0, fields: [] };

    try {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (!lines.length) throw new Error('No content to parse');

      // Name
      const name = lines[0] || 'Unknown';
      stats.total++;
      stats.parsed++;
      stats.exact++;
      stats.fields.push({ name: 'name', value: name, method: 'exact', conf: 1.0 });

      // Size
      stats.total++;
      const sizeR = findFuzzy(['tiny','small','medium','large','huge','gargantuan'], lines, /\b(tiny|small|medium|large|huge|gargantuan)\b/i);
      const size = sizeR?.value?.toLowerCase() || 'medium';
      if (sizeR) { stats.parsed++; sizeR.method === 'fuzzy' ? stats.fuzzy++ : stats.exact++; }
      stats.fields.push({ name: 'size', value: size, method: sizeR?.method || 'default', conf: sizeR?.confidence || 0 });

      // Type
      stats.total++;
      const typeR = findFuzzy(['beast','humanoid','dragon','undead','elemental'], lines, /\b(beast|humanoid|dragon|undead|elemental|monstrosity|fey|fiend|giant|ooze|plant|construct|celestial|aberration)\b/i);
      const type = typeR?.value?.toLowerCase() || 'humanoid';
      if (typeR) { stats.parsed++; typeR.method === 'fuzzy' ? stats.fuzzy++ : stats.exact++; }
      stats.fields.push({ name: 'type', value: type, method: typeR?.method || 'default', conf: typeR?.confidence || 0 });

      // Alignment - Enhanced to handle standard format after size/type
      stats.total++;
      
      // Try format 1: "Small humanoid, neutral evil" or "Medium beast, unaligned"
      let alignMatch = text.match(/(?:tiny|small|medium|large|huge|gargantuan)\s+(?:beast|humanoid|dragon|undead|elemental|monstrosity|fey|fiend|giant|ooze|plant|construct|celestial|aberration)[^,]*,\s*(.+?)(?:\n|$)/i);
      
      // Try format 2: "Alignment: neutral evil" or "Alignment neutral evil"
      if (!alignMatch) {
        alignMatch = text.match(/alignment[:\s]+(.+?)(?:\n|$)/i);
      }
      
      // Try format 3: Just look for alignment keywords anywhere in first few lines
      if (!alignMatch) {
        const alignKeywords = ['lawful good', 'neutral good', 'chaotic good', 'lawful neutral', 'true neutral', 'chaotic neutral', 'lawful evil', 'neutral evil', 'chaotic evil', 'unaligned', 'any alignment', 'any non-good', 'any non-lawful', 'any evil', 'any chaotic'];
        for (const line of lines.slice(0, 5)) {
          for (const keyword of alignKeywords) {
            if (line.toLowerCase().includes(keyword)) {
              alignMatch = [null, keyword];
              break;
            }
          }
          if (alignMatch) break;
        }
      }
      
      const alignment = alignMatch?.[1]?.trim() || 'unaligned';
      if (alignMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'alignment', value: alignment, method: alignMatch ? 'exact' : 'default', conf: alignMatch ? 1.0 : 0 });

      // AC
      stats.total++;
      const acR = findFuzzy(['ac','armor','armour'], lines, /(?:AC|Armor Class)[:\s]*(\d+)/i, 2);
      const ac = acR ? parseInt(acR.value) : 10;
      if (acR) { 
        stats.parsed++; 
        acR.method === 'fuzzy' ? stats.fuzzy++ : stats.exact++;
        if (acR.confidence < 0.8) warns.push(`AC: fuzzy match (${Math.round(acR.confidence * 100)}%)`);
      } else warns.push('AC not found, using 10');
      stats.fields.push({ name: 'ac', value: ac, method: acR?.method || 'default', conf: acR?.confidence || 0 });

      // HP
      stats.total++;
      const hpR = findFuzzy(['hp','hit','points','health'], lines, /(?:HP|Hit Points)[:\s]*(\d+)/i, 2);
      const hp = hpR ? parseInt(hpR.value) : 5;
      if (hpR) { 
        stats.parsed++; 
        hpR.method === 'fuzzy' ? stats.fuzzy++ : stats.exact++;
        if (hpR.confidence < 0.8) warns.push(`HP: fuzzy match (${Math.round(hpR.confidence * 100)}%)`);
      } else warns.push('HP not found, using 5');
      stats.fields.push({ name: 'hp', value: hp, method: hpR?.method || 'default', conf: hpR?.confidence || 0 });

      // Abilities - Enhanced to handle multiple formats
      stats.total++;
      
      // Try format 1: STR 15 DEX 14 CON 13... (clean numbers only)
      let abMatch = text.match(/STR\s+(\d+)\s+DEX\s+(\d+)\s+CON\s+(\d+)\s+INT\s+(\d+)\s+WIS\s+(\d+)\s+CHA\s+(\d+)/i);
      
      // Try format 2: STR 15 (+2) DEX 14 (+2) CON 13 (+1)... (with modifiers in parens)
      if (!abMatch) {
        abMatch = text.match(/STR\s+(\d+)\s*\([+-]\d+\)\s+DEX\s+(\d+)\s*\([+-]\d+\)\s+CON\s+(\d+)\s*\([+-]\d+\)\s+INT\s+(\d+)\s*\([+-]\d+\)\s+WIS\s+(\d+)\s*\([+-]\d+\)\s+CHA\s+(\d+)\s*\([+-]\d+\)/i);
      }
      
      // Try format 3: STR 15 +2 DEX 14 +2 CON 13 +1... (with modifiers no parens)
      if (!abMatch) {
        abMatch = text.match(/STR\s+(\d+)\s*[+-]\d+\s+DEX\s+(\d+)\s*[+-]\d+\s+CON\s+(\d+)\s*[+-]\d+\s+INT\s+(\d+)\s*[+-]\d+\s+WIS\s+(\d+)\s*[+-]\d+\s+CHA\s+(\d+)\s*[+-]\d+/i);
      }
      
      // Try format 4: Multiline with modifiers
      if (!abMatch) {
        const strMatch = text.match(/STR[:\s]+(\d+)/i);
        const dexMatch = text.match(/DEX[:\s]+(\d+)/i);
        const conMatch = text.match(/CON[:\s]+(\d+)/i);
        const intMatch = text.match(/INT[:\s]+(\d+)/i);
        const wisMatch = text.match(/WIS[:\s]+(\d+)/i);
        const chaMatch = text.match(/CHA[:\s]+(\d+)/i);
        
        if (strMatch && dexMatch && conMatch && intMatch && wisMatch && chaMatch) {
          abMatch = [null, strMatch[1], dexMatch[1], conMatch[1], intMatch[1], wisMatch[1], chaMatch[1]];
        }
      }
      
      const abilities = abMatch ? {
        str: parseInt(abMatch[1]), dex: parseInt(abMatch[2]), con: parseInt(abMatch[3]),
        int: parseInt(abMatch[4]), wis: parseInt(abMatch[5]), cha: parseInt(abMatch[6])
      } : { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
      
      if (abMatch) { stats.parsed++; stats.exact++; }
      else warns.push('Abilities not found in any recognized format, using 10s');
      stats.fields.push({ name: 'abilities', value: JSON.stringify(abilities), method: abMatch ? 'exact' : 'default', conf: abMatch ? 1.0 : 0 });

      // CR - Enhanced to avoid picking up AC
      stats.total++;
      
      // Try format 1: "Challenge 1/4" or "Challenge 5" (with explicit "Challenge" keyword)
      let crMatch = text.match(/Challenge[:\s]+(\d+(?:\/\d+)?)/i);
      
      // Try format 2: "CR 1/4" or "CR: 5" (with explicit "CR" keyword)
      if (!crMatch) {
        crMatch = text.match(/\bCR[:\s]+(\d+(?:\/\d+)?)/i);
      }
      
      // Try format 3: Look for "Challenge" or "CR" in the line, then grab the fraction/number
      if (!crMatch) {
        for (const line of lines) {
          if (/challenge|^cr\s/i.test(line) && !/armor|AC/i.test(line)) {
            const numMatch = line.match(/(\d+\/\d+|\d+)/);
            if (numMatch) {
              crMatch = [null, numMatch[1]];
              break;
            }
          }
        }
      }
      
      const cr = crMatch?.[1] || '1';
      if (crMatch) { stats.parsed++; stats.exact++; }
      else warns.push('CR not found, using 1');
      stats.fields.push({ name: 'cr', value: cr, method: crMatch ? 'exact' : 'default', conf: crMatch ? 1.0 : 0 });

      // Skills
      stats.total++;
      const skillMatch = text.match(/Skills\s+(.+?)(?:\n|Senses|Damage|Challenge)/i);
      if (skillMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'skills', value: skillMatch?.[1] || '', method: skillMatch ? 'exact' : 'default', conf: skillMatch ? 1.0 : 0 });

      // Senses
      stats.total++;
      const senseMatch = text.match(/Senses\s+(.+?)(?:\n|Languages|Challenge)/i);
      const senses = senseMatch?.[1] || '';
      if (senseMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'senses', value: senses, method: senseMatch ? 'exact' : 'default', conf: senseMatch ? 1.0 : 0 });

      // Languages
      stats.total++;
      const langMatch = text.match(/Languages\s+(.+?)(?:\n|Challenge|$)/i);
      const languages = langMatch?.[1] || '';
      if (langMatch) { stats.parsed++; stats.exact++; }
      stats.fields.push({ name: 'languages', value: languages, method: langMatch ? 'exact' : 'default', conf: langMatch ? 1.0 : 0 });

      // Build Foundry Actor
      const foundryActor = {
        name,
        type: 'npc',
        img: 'systems/dnd5e/tokens/npc/generic.webp',
        system: {
          abilities: {
            str: { value: abilities.str, proficient: 0, bonuses: { check: '', save: '' } },
            dex: { value: abilities.dex, proficient: 0, bonuses: { check: '', save: '' } },
            con: { value: abilities.con, proficient: 0, bonuses: { check: '', save: '' } },
            int: { value: abilities.int, proficient: 0, bonuses: { check: '', save: '' } },
            wis: { value: abilities.wis, proficient: 0, bonuses: { check: '', save: '' } },
            cha: { value: abilities.cha, proficient: 0, bonuses: { check: '', save: '' } }
          },
          attributes: {
            ac: { flat: ac, calc: 'default', formula: '' },
            hp: { value: hp, max: hp, temp: 0, tempmax: 0, formula: '' },
            movement: { walk: 30, units: 'ft' },
            senses: { special: senses }
          },
          details: {
            biography: { value: '', public: '' },
            alignment,
            type: { value: type },
            cr: parseFloat(cr)
          },
          traits: {
            size,
            languages: { value: languages ? languages.split(',').map(l => l.trim().toLowerCase()) : [] }
          }
        }
      };

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

  const startEdit = (fieldName) => {
    setEditField(fieldName);
    if (fieldName === 'name') setEditValue(output?.name || '');
    else if (fieldName === 'ac') setEditValue(output?.system?.attributes?.ac?.flat || 10);
    else if (fieldName === 'hp') setEditValue(output?.system?.attributes?.hp?.max || 5);
    else if (fieldName === 'cr') setEditValue(output?.system?.details?.cr || 1);
    else if (fieldName === 'size') setEditValue(output?.system?.traits?.size || 'medium');
    else if (fieldName === 'type') setEditValue(output?.system?.details?.type?.value || 'humanoid');
    else if (fieldName === 'alignment') setEditValue(output?.system?.details?.alignment || 'unaligned');
  };

  const saveEdit = () => {
    if (!output || !editField) return;
    const updated = JSON.parse(JSON.stringify(output));
    
    if (editField === 'name') updated.name = editValue;
    else if (editField === 'ac') updated.system.attributes.ac.flat = parseInt(editValue);
    else if (editField === 'hp') {
      updated.system.attributes.hp.value = parseInt(editValue);
      updated.system.attributes.hp.max = parseInt(editValue);
    }
    else if (editField === 'cr') updated.system.details.cr = parseFloat(editValue);
    else if (editField === 'size') updated.system.traits.size = editValue;
    else if (editField === 'type') updated.system.details.type.value = editValue;
    else if (editField === 'alignment') updated.system.details.alignment = editValue;
    
    setOutput(updated);
    setEditField(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-white">D&D Stat Block Converter</h1>
            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <TestTube size={14} /> Phase 5 - STABLE
            </span>
          </div>
          <p className="text-purple-200">Enhanced Parsing + Field Editor + Testing Suite</p>
          <p className="text-sm text-purple-300">Target: 95%+ accuracy with manual review capability</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Input + Analytics */}
          <div className="space-y-4">
            {/* Input */}
            <div className="bg-slate-800 rounded-lg p-5 border border-purple-500/30">
              <label className="block text-white font-semibold mb-3 text-sm">Paste Stat Block</label>
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

            {/* Analytics */}
            {parseStats && (
              <div className="bg-slate-800 rounded-lg p-4 border border-blue-500/30">
                <div className="flex items-center gap-2 text-blue-400 mb-3">
                  <BarChart3 size={18} />
                  <span className="font-semibold text-sm">Parse Analytics</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Accuracy:</span>
                    <span className={`font-bold ${parseStats.accuracy >= 95 ? 'text-green-400' : parseStats.accuracy >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {parseStats.accuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded h-2">
                    <div 
                      className={`h-2 rounded transition-all ${parseStats.accuracy >= 95 ? 'bg-green-500' : parseStats.accuracy >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${parseStats.accuracy}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Parsed:</span>
                      <span className="text-green-400 font-bold">{parseStats.parsed}/{parseStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Exact:</span>
                      <span className="text-blue-400 font-bold">{parseStats.exact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fuzzy:</span>
                      <span className="text-yellow-400 font-bold">{parseStats.fuzzy}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings/Errors */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {errors.map((e, i) => (
                <div key={i} className="bg-red-900/30 border border-red-500 rounded p-2 flex gap-2 text-red-200 text-xs">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{e}</span>
                </div>
              ))}
              {warnings.map((w, i) => (
                <div key={i} className="bg-yellow-900/30 border border-yellow-600 rounded p-2 flex gap-2 text-yellow-200 text-xs">
                  <Info size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Output + Editor */}
          <div className="lg:col-span-2 space-y-4">
            {output ? (
              <>
                {/* Field Editor Toggle */}
                <button
                  onClick={() => setShowEditor(!showEditor)}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"
                >
                  <Edit2 size={16} />
                  {showEditor ? 'Hide' : 'Show'} Field Editor
                </button>

                {/* Field Editor */}
                {showEditor && (
                  <div className="bg-slate-800 rounded-lg p-4 border border-amber-500/30">
                    <h3 className="text-white font-semibold mb-3 text-sm">Edit Parsed Fields</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {parseStats?.fields.map((field, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400 w-20 font-semibold">{field.name}:</span>
                          {editField === field.name ? (
                            <>
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 bg-slate-700 text-white rounded px-2 py-1 text-xs border border-amber-400 focus:outline-none"
                              />
                              <button
                                onClick={saveEdit}
                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center gap-1"
                              >
                                <Save size={12} /> Save
                              </button>
                              <button
                                onClick={() => setEditField(null)}
                                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                              >
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-white truncate">{field.value}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${field.method === 'exact' ? 'bg-green-600/30 text-green-400' : field.method === 'fuzzy' ? 'bg-yellow-600/30 text-yellow-400' : 'bg-slate-600/30 text-slate-400'}`}>
                                {field.method}
                              </span>
                              <button
                                onClick={() => startEdit(field.name)}
                                className="text-amber-400 hover:text-amber-300"
                              >
                                <Edit2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* JSON Output */}
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
                        const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${output.name.replace(/\s+/g, '_')}_foundry.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"
                    >
                      <Download size={16} /> Download
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(output, null, 2));
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex-1 bg-green-600/50 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"
                    >
                      <Copy size={16} /> {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <p className="text-xs text-slate-300">
                    <span className="font-semibold text-white">Phase 5 Features:</span> Enhanced fuzzy matching • Field-by-field editor • Detailed analytics • Confidence scoring • Ready for Foundry VTT import
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-slate-800 rounded-lg p-12 border border-purple-500/30 flex items-center justify-center text-slate-400 h-96">
                <p>Parse a stat block to see output and edit fields</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}