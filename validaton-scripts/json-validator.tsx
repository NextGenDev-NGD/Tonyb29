import React, { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Info, FileJson, ArrowRight } from 'lucide-react';

export default function JSONValidator() {
  const [referenceJSON, setReferenceJSON] = useState('');
  const [testJSON, setTestJSON] = useState('');
  const [comparison, setComparison] = useState(null);

  const compareStructures = (ref, test, path = '') => {
    const differences = [];
    const refType = Array.isArray(ref) ? 'array' : typeof ref;
    const testType = Array.isArray(test) ? 'array' : typeof test;

    // Type mismatch
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

    // Null/undefined checks
    if (ref === null && test !== null) {
      differences.push({
        path: path || 'root',
        issue: 'null_mismatch',
        expected: 'null',
        actual: typeof test,
        severity: 'warning'
      });
      return differences;
    }

    // For objects, check structure
    if (refType === 'object' && ref !== null) {
      // Check for missing keys
      const refKeys = Object.keys(ref);
      const testKeys = Object.keys(test || {});

      refKeys.forEach(key => {
        const newPath = path ? `${path}.${key}` : key;
        
        if (!(key in (test || {}))) {
          differences.push({
            path: newPath,
            issue: 'missing_key',
            expected: `key "${key}" exists`,
            actual: 'key missing',
            severity: 'error'
          });
        } else {
          // Recursively check nested structures
          const nested = compareStructures(ref[key], test[key], newPath);
          differences.push(...nested);
        }
      });

      // Check for extra keys
      testKeys.forEach(key => {
        if (!(key in ref)) {
          const newPath = path ? `${path}.${key}` : key;
          differences.push({
            path: newPath,
            issue: 'extra_key',
            expected: 'key not present',
            actual: `key "${key}" exists`,
            severity: 'warning'
          });
        }
      });
    }

    // For arrays, check if empty/non-empty matches
    if (refType === 'array') {
      if (ref.length === 0 && test.length > 0) {
        differences.push({
          path: path || 'root',
          issue: 'array_not_empty',
          expected: 'empty array',
          actual: `array with ${test.length} items`,
          severity: 'info'
        });
      } else if (ref.length > 0 && test.length === 0) {
        differences.push({
          path: path || 'root',
          issue: 'array_empty',
          expected: `array with items`,
          actual: 'empty array',
          severity: 'warning'
        });
      } else if (ref.length > 0 && test.length > 0) {
        // Compare first item structure as template
        const nested = compareStructures(ref[0], test[0], `${path}[0]`);
        differences.push(...nested);
      }
    }

    return differences;
  };

  const validateJSONs = () => {
    try {
      const ref = JSON.parse(referenceJSON);
      const test = JSON.parse(testJSON);

      const diffs = compareStructures(ref, test);
      
      const errors = diffs.filter(d => d.severity === 'error');
      const warnings = diffs.filter(d => d.severity === 'warning');
      const info = diffs.filter(d => d.severity === 'info');

      setComparison({
        success: errors.length === 0,
        totalIssues: diffs.length,
        errors,
        warnings,
        info,
        summary: {
          errors: errors.length,
          warnings: warnings.length,
          info: info.length
        }
      });
    } catch (err) {
      setComparison({
        success: false,
        parseError: err.message,
        totalIssues: 1
      });
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'text-red-400 bg-red-900/30 border-red-500';
      case 'warning': return 'text-yellow-400 bg-yellow-900/30 border-yellow-600';
      case 'info': return 'text-blue-400 bg-blue-900/30 border-blue-500';
      default: return 'text-slate-400 bg-slate-900/30 border-slate-600';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error': return <XCircle size={16} />;
      case 'warning': return <AlertCircle size={16} />;
      case 'info': return <Info size={16} />;
      default: return <CheckCircle size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Foundry JSON Structure Validator</h1>
          <p className="text-indigo-200">Compare parser output against verified working JSON</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800 rounded-lg p-5 border border-green-500/30">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={20} className="text-green-400" />
              <label className="text-white font-semibold">Reference JSON (Working)</label>
            </div>
            <textarea
              value={referenceJSON}
              onChange={(e) => setReferenceJSON(e.target.value)}
              placeholder="Paste verified working Foundry JSON here..."
              className="w-full h-96 bg-slate-700 text-white rounded p-3 text-xs font-mono border border-green-400/30 focus:border-green-400 focus:outline-none resize-none"
            />
            <p className="text-xs text-slate-400 mt-2">
              This should be a JSON file that successfully imports into Foundry VTT
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-5 border border-orange-500/30">
            <div className="flex items-center gap-2 mb-3">
              <FileJson size={20} className="text-orange-400" />
              <label className="text-white font-semibold">Test JSON (Parser Output)</label>
            </div>
            <textarea
              value={testJSON}
              onChange={(e) => setTestJSON(e.target.value)}
              placeholder="Paste parser-generated JSON here..."
              className="w-full h-96 bg-slate-700 text-white rounded p-3 text-xs font-mono border border-orange-400/30 focus:border-orange-400 focus:outline-none resize-none"
            />
            <p className="text-xs text-slate-400 mt-2">
              This is the JSON output from the stat block parser
            </p>
          </div>
        </div>

        <button
          onClick={validateJSONs}
          disabled={!referenceJSON || !testJSON}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 mb-6"
        >
          <ArrowRight size={20} />
          Compare Structures
        </button>

        {comparison && (
          <div className="space-y-4">
            {comparison.parseError ? (
              <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <XCircle size={20} />
                  <span className="font-semibold">JSON Parse Error</span>
                </div>
                <p className="text-red-200 text-sm">{comparison.parseError}</p>
              </div>
            ) : (
              <>
                <div className={`rounded-lg p-4 border ${comparison.success ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'}`}>
                  <div className="flex items-center gap-3">
                    {comparison.success ? (
                      <>
                        <CheckCircle size={24} className="text-green-400" />
                        <div>
                          <div className="text-green-400 font-bold text-lg">Structure Match!</div>
                          <div className="text-green-200 text-sm">Parser output matches verified JSON structure</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle size={24} className="text-red-400" />
                        <div>
                          <div className="text-red-400 font-bold text-lg">Structure Mismatch</div>
                          <div className="text-red-200 text-sm">Found {comparison.totalIssues} structural differences</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-4 border border-slate-600">
                  <h3 className="text-white font-semibold mb-3">Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-red-900/20 rounded p-3 border border-red-500/30">
                      <div className="text-red-400 text-2xl font-bold">{comparison.summary.errors}</div>
                      <div className="text-red-300 text-sm">Errors</div>
                      <div className="text-xs text-slate-400 mt-1">Must fix for import</div>
                    </div>
                    <div className="bg-yellow-900/20 rounded p-3 border border-yellow-600/30">
                      <div className="text-yellow-400 text-2xl font-bold">{comparison.summary.warnings}</div>
                      <div className="text-yellow-300 text-sm">Warnings</div>
                      <div className="text-xs text-slate-400 mt-1">May cause issues</div>
                    </div>
                    <div className="bg-blue-900/20 rounded p-3 border border-blue-500/30">
                      <div className="text-blue-400 text-2xl font-bold">{comparison.summary.info}</div>
                      <div className="text-blue-300 text-sm">Info</div>
                      <div className="text-xs text-slate-400 mt-1">Minor differences</div>
                    </div>
                  </div>
                </div>

                {comparison.errors.length > 0 && (
                  <div className="bg-slate-800 rounded-lg p-4 border border-red-500/30">
                    <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                      <XCircle size={18} />
                      Errors ({comparison.errors.length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {comparison.errors.map((diff, idx) => (
                        <div key={idx} className={`rounded p-3 border ${getSeverityColor(diff.severity)}`}>
                          <div className="flex items-start gap-2">
                            {getSeverityIcon(diff.severity)}
                            <div className="flex-1">
                              <div className="font-mono text-xs font-bold mb-1">{diff.path}</div>
                              <div className="text-sm mb-1">
                                <span className="font-semibold">Issue:</span> {diff.issue.replace(/_/g, ' ')}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="font-semibold">Expected:</span> {diff.expected}
                                </div>
                                <div>
                                  <span className="font-semibold">Actual:</span> {diff.actual}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {comparison.warnings.length > 0 && (
                  <div className="bg-slate-800 rounded-lg p-4 border border-yellow-600/30">
                    <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle size={18} />
                      Warnings ({comparison.warnings.length})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {comparison.warnings.map((diff, idx) => (
                        <div key={idx} className={`rounded p-3 border ${getSeverityColor(diff.severity)}`}>
                          <div className="flex items-start gap-2">
                            {getSeverityIcon(diff.severity)}
                            <div className="flex-1">
                              <div className="font-mono text-xs font-bold mb-1">{diff.path}</div>
                              <div className="text-sm mb-1">
                                <span className="font-semibold">Issue:</span> {diff.issue.replace(/_/g, ' ')}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="font-semibold">Expected:</span> {diff.expected}
                                </div>
                                <div>
                                  <span className="font-semibold">Actual:</span> {diff.actual}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {comparison.info.length > 0 && (
                  <div className="bg-slate-800 rounded-lg p-4 border border-blue-500/30">
                    <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                      <Info size={18} />
                      Info ({comparison.info.length})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {comparison.info.map((diff, idx) => (
                        <div key={idx} className={`rounded p-3 border ${getSeverityColor(diff.severity)}`}>
                          <div className="flex items-start gap-2">
                            {getSeverityIcon(diff.severity)}
                            <div className="flex-1">
                              <div className="font-mono text-xs font-bold mb-1">{diff.path}</div>
                              <div className="text-sm mb-1">
                                <span className="font-semibold">Issue:</span> {diff.issue.replace(/_/g, ' ')}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="font-semibold">Expected:</span> {diff.expected}
                                </div>
                                <div>
                                  <span className="font-semibold">Actual:</span> {diff.actual}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-8 bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
          <h3 className="text-indigo-400 font-semibold mb-2">How to Use This Tool</h3>
          <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
            <li>Paste a verified working Foundry JSON (left side) - one that successfully imports</li>
            <li>Paste parser output JSON (right side) - from the stat block parser</li>
            <li>Click "Compare Structures" to see differences</li>
            <li><strong className="text-red-400">Errors</strong> must be fixed for Foundry import to work</li>
            <li><strong className="text-yellow-400">Warnings</strong> may cause issues but might work</li>
            <li><strong className="text-blue-400">Info</strong> are minor differences (usually okay)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}