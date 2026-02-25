import React, { useState } from 'react';
import { Play, AlertCircle, CheckCircle, XCircle, FileJson, Download, BarChart3 } from 'lucide-react';

export default function TestHarness() {
  const [testCases, setTestCases] = useState([]);
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);

  // Sample test case structure - user will add their own
  const addTestCase = (name, statBlock, referenceJSON) => {
    setTestCases(prev => [...prev, {
      id: Date.now(),
      name,
      statBlock,
      referenceJSON,
      status: 'pending'
    }]);
  };

  const parseStatBlock = (text) => {
    // Simplified parser logic - matches main parser
    const mod = (score) => Math.floor((score - 10) / 2);
    
    try {
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (!lines.length) throw new Error('No content');

      const name = lines[0] || 'Unknown';
      
      const sizeMatch = text.match(/\b(tiny|small|medium|large|huge|gargantuan)\b/i);
      const size = sizeMatch?.[1]?.toLowerCase() || 'medium';
      const sizeCode = { 'tiny': 'tiny', 'small': 'sm', 'medium': 'med', 'large': 'lg', 'huge': 'huge', 'gargantuan': 'grg' }[size] || 'med';
      
      const typeMatch = text.match(/\b(beast|humanoid|dragon|undead|elemental|monstrosity|fey|fiend|giant|ooze|plant|construct|celestial|aberration)\b/i);
      const type = typeMatch?.[1]?.toLowerCase() || 'humanoid';
      
      let alignMatch = text.match(/(?:tiny|small|medium|large|huge|gargantuan)\s+(?:beast|humanoid|dragon|undead|elemental|monstrosity|fey|fiend|giant|ooze|plant|construct|celestial|aberration)[^,]*,\s*(.+?)(?:\n|$)/i);
      if (!alignMatch) alignMatch = text.match(/alignment[:\s]+(.+?)(?:\n|$)/i);
      const alignment = alignMatch?.[1]?.trim() || 'unaligned';
      
      const acMatch = text.match(/(?:AC|Armor Class)[:\s]*(\d+)/i);
      const ac = acMatch ? parseInt(acMatch[1]) : 10;
      
      const hpMatch = text.match(/(?:HP|Hit Points)[:\s]*(\d+)(?:\s*\(([^)]+)\))?/i);
      const hp = hpMatch ? parseInt(hpMatch[1]) : 5;
      const hpFormula = hpMatch?.[2] || '';
      
      const speedMatch = text.match(/Speed\s+(\d+)\s*ft\.(?:,\s*(?:climb|Climb)\s+(\d+)\s*ft\.)?(?:,\s*(?:fly|Fly)\s+(\d+)\s*ft\.)?/i);
      const speeds = {
        walk: speedMatch ? parseInt(speedMatch[1]) : 30,
        climb: speedMatch && speedMatch[2] ? parseInt(speedMatch[2]) : 0,
        fly: speedMatch && speedMatch[3] ? parseInt(speedMatch[3]) : 0,
        swim: 0,
        burrow: 0
      };
      
      let abilities = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
      let abMatch = text.match(/STR\s+(\d+)\s+DEX\s+(\d+)\s+CON\s+(\d+)\s+INT\s+(\d+)\s+WIS\s+(\d+)\s+CHA\s+(\d+)/i);
      
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
      
      if (abMatch && abMatch !== true) {
        abilities = {
          str: parseInt(abMatch[1]), dex: parseInt(abMatch[2]), con: parseInt(abMatch[3]),
          int: parseInt(abMatch[4]), wis: parseInt(abMatch[5]), cha: parseInt(abMatch[6])
        };
      }
      
      let crMatch = text.match(/CR[:\s]+(\d+)/i);
      const cr = crMatch?.[1] || '1';
      
      const profBonus = (() => {
        const crNum = parseFloat(cr);
        if (crNum < 5) return 2;
        if (crNum < 9) return 3;
        if (crNum < 13) return 4;
        if (crNum < 17) return 5;
        return 6;
      })();

      let savesText = '';
      const savesMatch = text.match(/Saving Throws[:\s]+(.+?)(?=\s+Skills|$)/i);
      if (savesMatch) {
        savesText = savesMatch[1];
      } else {
        const saveExtract = [];
        ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'].forEach(ab => {
          const saveMatch = text.match(new RegExp(`${ab}\\s+\\d+\\s+[+-−]?\\d+\\s+([+-−]\\d+)`, 'i'));
          if (saveMatch) {
            saveExtract.push(`${ab} ${saveMatch[1].replace('−', '-')}`);
          }
        });
        if (saveExtract.length > 0) savesText = saveExtract.join(', ');
      }
      
      const saves = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
      if (savesText) {
        savesText.split(',').forEach(entry => {
          const match = entry.trim().match(/^(str|dex|con|int|wis|cha)\s*([+-]\d+)/i);
          if (match) {
            const ab = match[1].toLowerCase();
            const saveBonus = parseInt(match[2]);
            const baseMod = mod(abilities[ab]);
            if (saveBonus > baseMod) saves[ab] = 1;
          }
        });
      }

      const skillMatch = text.match(/Skills[:\s]+(.+?)(?=\s+Senses|$)/i);
      const skillsText = skillMatch?.[1] || '';
      
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
        skills[shortName] = { value: 0, ability: skillAbilityMap[shortName] };
      });

      if (skillsText) {
        skillsText.split(',').forEach(entry => {
          const match = entry.trim().match(/^([a-zA-Z\s]+?)\s*([+-]\d+)/);
          if (match) {
            const skillName = match[1].trim().toLowerCase();
            const bonus = parseInt(match[2]);
            const shortName = skillMap[skillName];
            
            if (shortName) {
              const abilityMod = mod(abilities[skillAbilityMap[shortName]]);
              const withProf = abilityMod + profBonus;
              const withExpertise = abilityMod + (profBonus * 2);
              
              if (bonus === withExpertise) skills[shortName].value = 2;
              else if (bonus === withProf) skills[shortName].value = 1;
              else if (bonus > abilityMod) skills[shortName].value = 1;
            }
          }
        });
      }

      const senseMatch = text.match(/Senses[:\s]+(.+?)(?=\s+Languages|$)/i);
      const senses = senseMatch?.[1] || '';
      
      const langMatch = text.match(/Languages[:\s]+(.+?)(?=\s+CR|$)/i);
      let languages = langMatch?.[1] || '';
      languages = languages.replace(/\([^)]*\)/g, '').trim();

      return {
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
            movement: { burrow: speeds.burrow, climb: speeds.climb, fly: speeds.fly, swim: speeds.swim, walk: speeds.walk, units: 'ft', hover: false },
            senses: { darkvision: 0, blindsight: 0, tremorsense: 0, truesight: 0, units: 'ft', special: senses }
          },
          details: {
            alignment: alignment,
            type: { value: type, subtype: '', custom: '' },
            cr: parseFloat(cr),
            biography: { value: '', public: '' }
          },
          traits: {
            size: sizeCode,
            languages: { value: languages ? languages.split(',').map(l => l.trim().toLowerCase()) : [], custom: '' },
            di: { value: [], custom: '' },
            dr: { value: [], custom: '' },
            dv: { value: [], custom: '' },
            ci: { value: [], custom: '' }
          },
          skills: Object.fromEntries(
            Object.entries(skills).map(([key, skill]) => [key, { ability: skill.ability, value: skill.value, bonuses: { check: '', passive: '' } }])
          )
        },
        items: [],
        effects: [],
        flags: {}
      };
    } catch (err) {
      throw new Error(`Parse failed: ${err.message}`);
    }
  };

  const compareStructures = (ref, test, path = '') => {
    const differences = [];
    const refType = Array.isArray(ref) ? 'array' : typeof ref;
    const testType = Array.isArray(test) ? 'array' : typeof test;

    if (refType !== testType) {
      differences.push({
        path: path || 'root',
        issue: 'type_mismatch',
        expected: refType,
        actual: testType,
        severity: 'error'
      });
      return differences;
    }

    if (refType === 'object' && ref !== null) {
      const refKeys = Object.keys(ref);
      const testKeys = Object.keys(test || {});

      refKeys.forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        
        if (!(key in (test || {}))) {
          differences.push({
            path: newPath,
            issue: 'missing_key',
            expected: `key "${key}"`,
            actual: 'missing',
            severity: 'error'
          });
        } else {
          const nested = compareStructures(ref[key], test[key], newPath);
          differences.push(...nested);
        }
      });

      testKeys.forEach(key => {
        if (!(key in ref)) {
          const newPath = path ? `${path}.${key}` : key;
          differences.push({
            path: newPath,
            issue: 'extra_key',
            expected: 'not present',
            actual: `key "${key}"`,
            severity: 'warning'
          });
        }
      });
    }

    return differences;
  };

  const runTests = async () => {
    setRunning(true);
    const testResults = [];

    for (const testCase of testCases) {
      try {
        const referenceJSON = JSON.parse(testCase.referenceJSON);
        const parserOutput = parseStatBlock(testCase.statBlock);
        
        const diffs = compareStructures(referenceJSON, parserOutput);
        const errors = diffs.filter(d => d.severity === 'error').length;
        const warnings = diffs.filter(d => d.severity === 'warning').length;
        
        testResults.push({
          ...testCase,
          status: errors === 0 ? 'pass' : 'fail',
          errors,
          warnings,
          totalIssues: diffs.length,
          differences: diffs,
          parserOutput: JSON.stringify(parserOutput, null, 2)
        });
      } catch (err) {
        testResults.push({
          ...testCase,
          status: 'error',
          error: err.message,
          errors: 1,
          warnings: 0,
          totalIssues: 1
        });
      }
    }

    setResults(testResults);
    setRunning(false);
  };

  const downloadReport = () => {
    if (!results) return;
    
    const report = {
      test_date: new Date().toISOString(),
      parser_version: 'v2.0-alpha.1',
      total_tests: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      errors: results.filter(r => r.status === 'error').length,
      results: results.map(r => ({
        name: r.name,
        status: r.status,
        errors: r.errors,
        warnings: r.warnings,
        differences: r.differences
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Parser Test Harness</h1>
          <p className="text-purple-200">Automated testing against verified JSON files</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-800 rounded-lg p-5 border border-purple-500/30">
              <h2 className="text-white font-semibold mb-4">Add Test Case</h2>
              
              <div className="space-y-3">
                <input
                  id="test-name"
                  type="text"
                  placeholder="Test name (e.g., Goblin)"
                  className="w-full bg-slate-700 text-white rounded px-3 py-2 text-sm border border-purple-400/30 focus:outline-none"
                />
                
                <textarea
                  id="stat-block"
                  placeholder="Paste stat block text..."
                  className="w-full h-32 bg-slate-700 text-white rounded p-3 text-xs font-mono border border-purple-400/30 focus:outline-none resize-none"
                />
                
                <textarea
                  id="reference-json"
                  placeholder="Paste verified working JSON..."
                  className="w-full h-32 bg-slate-700 text-white rounded p-3 text-xs font-mono border border-purple-400/30 focus:outline-none resize-none"
                />
                
                <button
                  onClick={() => {
                    const name = document.getElementById('test-name').value;
                    const statBlock = document.getElementById('stat-block').value;
                    const referenceJSON = document.getElementById('reference-json').value;
                    
                    if (name && statBlock && referenceJSON) {
                      addTestCase(name, statBlock, referenceJSON);
                      document.getElementById('test-name').value = '';
                      document.getElementById('stat-block').value = '';
                      document.getElementById('reference-json').value = '';
                    }
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded"
                >
                  Add Test Case
                </button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-5 border border-blue-500/30">
              <h2 className="text-white font-semibold mb-3">Test Cases ({testCases.length})</h2>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testCases.length === 0 ? (
                  <p className="text-slate-400 text-sm">No test cases added yet</p>
                ) : (
                  testCases.map(tc => (
                    <div key={tc.id} className="bg-slate-700 rounded p-2 flex items-center justify-between">
                      <span className="text-white text-sm">{tc.name}</span>
                      <button
                        onClick={() => setTestCases(prev => prev.filter(t => t.id !== tc.id))}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={runTests}
              disabled={testCases.length === 0 || running}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded flex items-center justify-center gap-2"
            >
              <Play size={20} />
              {running ? 'Running Tests...' : 'Run All Tests'}
            </button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {results ? (
              <>
                <div className="bg-slate-800 rounded-lg p-5 border border-green-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                      <BarChart3 size={20} />
                      Test Summary
                    </h2>
                    <button
                      onClick={downloadReport}
                      className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm flex items-center gap-2"
                    >
                      <Download size={14} />
                      Download Report
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-900/20 rounded p-3 border border-blue-500/30">
                      <div className="text-blue-400 text-2xl font-bold">{results.length}</div>
                      <div className="text-blue-300 text-sm">Total Tests</div>
                    </div>
                    <div className="bg-green-900/20 rounded p-3 border border-green-500/30">
                      <div className="text-green-400 text-2xl font-bold">{results.filter(r => r.status === 'pass').length}</div>
                      <div className="text-green-300 text-sm">Passed</div>
                    </div>
                    <div className="bg-red-900/20 rounded p-3 border border-red-500/30">
                      <div className="text-red-400 text-2xl font-bold">{results.filter(r => r.status === 'fail').length}</div>
                      <div className="text-red-300 text-sm">Failed</div>
                    </div>
                    <div className="bg-yellow-900/20 rounded p-3 border border-yellow-600/30">
                      <div className="text-yellow-400 text-2xl font-bold">
                        {results.reduce((sum, r) => sum + (r.warnings || 0), 0)}
                      </div>
                      <div className="text-yellow-300 text-sm">Warnings</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {results.map((result, idx) => (
                    <div key={idx} className={`bg-slate-800 rounded-lg p-4 border ${
                      result.status === 'pass' ? 'border-green-500/30' :
                      result.status === 'fail' ? 'border-red-500/30' : 'border-yellow-600/30'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                          {result.status === 'pass' ? <CheckCircle size={18} className="text-green-400" /> :
                           result.status === 'fail' ? <XCircle size={18} className="text-red-400" /> :
                           <AlertCircle size={18} className="text-yellow-400" />}
                          {result.name}
                        </h3>
                        <div className="flex gap-2 text-xs">
                          {result.errors > 0 && (
                            <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded">
                              {result.errors} errors
                            </span>
                          )}
                          {result.warnings > 0 && (
                            <span className="bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded">
                              {result.warnings} warnings
                            </span>
                          )}
                        </div>
                      </div>

                      {result.error && (
                        <div className="bg-red-900/20 rounded p-2 text-red-300 text-sm">
                          Error: {result.error}
                        </div>
                      )}

                      {result.differences && result.differences.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-slate-300 text-sm cursor-pointer hover:text-white">
                            Show {result.differences.length} differences
                          </summary>
                          <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                            {result.differences.slice(0, 10).map((diff, didx) => (
                              <div key={didx} className={`text-xs p-2 rounded ${
                                diff.severity === 'error' ? 'bg-red-900/20 text-red-300' : 'bg-yellow-900/20 text-yellow-300'
                              }`}>
                                <div className="font-mono font-bold">{diff.path}</div>
                                <div>{diff.issue.replace(/_/g, ' ')}: {diff.expected} → {diff.actual}</div>
                              </div>
                            ))}
                            {result.differences.length > 10 && (
                              <div className="text-xs text-slate-400 p-2">
                                ... and {result.differences.length - 10} more
                              </div>
                            )}
                          </div>
                        </details>
                      )}

                      {result.parserOutput && (
                        <details className="mt-2">
                          <summary className="text-slate-300 text-sm cursor-pointer hover:text-white">
                            Show parser output
                          </summary>
                          <pre className="mt-2 bg-slate-700 rounded p-2 text-xs text-green-400 max-h-48 overflow-auto">
                            {result.parserOutput}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-slate-800 rounded-lg p-12 border border-purple-500/30 flex flex-col items-center justify-center text-slate-400 h-96">
                <FileJson size={48} className="mb-4" />
                <p>Add test cases and click "Run All Tests" to begin</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <h3 className="text-purple-400 font-semibold mb-2">How to Use</h3>
          <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
            <li>Add test cases: name, stat block text, and verified working JSON</li>
            <li>Click "Run All Tests" to parse all stat blocks and compare to reference JSONs</li>
            <li>Review results: Pass (green) = perfect match, Fail (red) = structural differences</li>
            <li>Click "Show differences" to see specific issues</li>
            <li>Download report for detailed analysis</li>
            <li>Fix parser issues and re-run tests to verify fixes</li>
          </ol>
        </div>
      </div>
    </div>
  );
}