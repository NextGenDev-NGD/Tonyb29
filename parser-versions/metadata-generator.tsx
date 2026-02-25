import React, { useState } from 'react';
import { Download, Copy, CheckCircle, FileJson } from 'lucide-react';

export default function MetadataGenerator() {
  const [creatureName, setCreatureName] = useState('');
  const [source, setSource] = useState({ book: '', page: '', system: 'D&D 5e (2014)' });
  const [foundry, setFoundry] = useState({ coreVersion: '', system: 'dnd5e', systemVersion: '' });
  const [verification, setVerification] = useState({
    testDate: new Date().toISOString().split('T')[0],
    verifiedBy: '',
    importsSuccessfully: true,
    statsDisplayCorrectly: true,
    actionsWork: true
  });
  const [features, setFeatures] = useState({
    basic_stats: true,
    skills: true,
    saves: true,
    movement: true,
    senses: true,
    languages: true,
    actions: false,
    spellcasting: false,
    legendary_actions: false,
    lair_actions: false,
    reactions: false,
    bonus_actions: false
  });
  const [notes, setNotes] = useState('');
  const [knownIssues, setKnownIssues] = useState('');
  const [copied, setCopied] = useState(false);

  const generateMetadata = () => {
    const metadata = {
      creature_name: creatureName,
      source: {
        book: source.book,
        page: source.page || null,
        system: source.system
      },
      foundry: {
        core_version: foundry.coreVersion,
        system: foundry.system,
        system_version: foundry.systemVersion
      },
      verification: {
        test_date: verification.testDate,
        verified_by: verification.verifiedBy,
        imports_successfully: verification.importsSuccessfully,
        stats_display_correctly: verification.statsDisplayCorrectly,
        actions_work: verification.actionsWork,
        last_tested: verification.testDate
      },
      features: features,
      known_issues: knownIssues ? knownIssues.split('\n').filter(i => i.trim()) : [],
      notes: notes || null,
      parser_version: "v2.0-alpha.1"
    };

    return JSON.stringify(metadata, null, 2);
  };

  const toggleFeature = (feature) => {
    setFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  const metadata = generateMetadata();
  const filename = creatureName ? `${creatureName.toLowerCase().replace(/\s+/g, '-')}.meta.json` : 'creature.meta.json';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Metadata File Generator</h1>
          <p className="text-purple-200">Create metadata for verified Foundry VTT JSON files</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="bg-slate-800 rounded-lg p-5 border border-purple-500/30">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <FileJson size={18} />
                Basic Information
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Creature Name *</label>
                  <input
                    type="text"
                    value={creatureName}
                    onChange={(e) => setCreatureName(e.target.value)}
                    placeholder="e.g., Aarakocra Aeromancer"
                    className="w-full bg-slate-700 text-white rounded px-3 py-2 text-sm border border-purple-400/30 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-1">Source Book</label>
                  <input
                    type="text"
                    value={source.book}
                    onChange={(e) => setSource(prev => ({ ...prev, book: e.target.value }))}
                    placeholder="e.g., Monster Manual"
                    className="w-full bg-slate-700 text-white rounded px-3 py-2 text-sm border border-purple-400/30 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-1">Page Number</label>
                  <input
                    type="text"
                    value={source.page}
                    onChange={(e) => setSource(prev => ({ ...prev, page: e.target.value }))}
                    placeholder="e.g., 166"
                    className="w-full bg-slate-700 text-white rounded px-3 py-2 text-sm border border-purple-400/30 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-1">D&D System</label>
                  <select
                    value={source.system}
                    onChange={(e) => setSource(prev => ({ ...prev, system: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded px-3 py-2 text-sm border border-purple-400/30 focus:border-purple-400 focus:outline-none"
                  >
                    <option>D&D 5e (2014)</option>
                    <option>D&D 5e (2024)</option>
                    <option>Homebrew</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Foundry Info */}
            <div className="bg-slate-800 rounded-lg p-5 border border-blue-500/30">
              <h2 className="text-white font-semibold mb-4">Foundry VTT Version</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Foundry Core Version *</label>
                  <input
                    type="text"
                    value={foundry.coreVersion}
                    onChange={(e) => setFoundry(prev => ({ ...prev, coreVersion: e.target.value }))}
                    placeholder="e.g., 11.315"
                    className="w-full bg-slate-700 text-white rounded px-3 py-2 text-sm border border-blue-400/30 focus:border-blue-400 focus:outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">Find in Foundry: Settings → Game Details</p>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-1">D&D5e System Version *</label>
                  <input
                    type="text"
                    value={foundry.systemVersion}
                    onChange={(e) => setFoundry(prev => ({ ...prev, systemVersion: e.target.value }))}
                    placeholder="e.g., 3.3.1"
                    className="w-full bg-slate-700 text-white rounded px-3 py-2 text-sm border border-blue-400/30 focus:border-blue-400 focus:outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">Find in Foundry: Game Systems → dnd5e</p>
                </div>
              </div>
            </div>

            {/* Verification */}
            <div className="bg-slate-800 rounded-lg p-5 border border-green-500/30">
              <h2 className="text-white font-semibold mb-4">Verification Status</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Test Date</label>
                  <input
                    type="date"
                    value={verification.testDate}
                    onChange={(e) => setVerification(prev => ({ ...prev, testDate: e.target.value }))}
                    className="w-full bg-slate-700 text-white rounded px-3 py-2 text-sm border border-green-400/30 focus:border-green-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-1">Verified By</label>
                  <input
                    type="text"
                    value={verification.verifiedBy}
                    onChange={(e) => setVerification(prev => ({ ...prev, verifiedBy: e.target.value }))}
                    placeholder="Your name or username"
                    className="w-full bg-slate-700 text-white rounded px-3 py-2 text-sm border border-green-400/30 focus:border-green-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={verification.importsSuccessfully}
                      onChange={(e) => setVerification(prev => ({ ...prev, importsSuccessfully: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-slate-300">Imports successfully into Foundry</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={verification.statsDisplayCorrectly}
                      onChange={(e) => setVerification(prev => ({ ...prev, statsDisplayCorrectly: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-slate-300">All stats display correctly</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={verification.actionsWork}
                      onChange={(e) => setVerification(prev => ({ ...prev, actionsWork: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-slate-300">Actions/attacks work as expected</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Features */}
            <div className="bg-slate-800 rounded-lg p-5 border border-amber-500/30">
              <h2 className="text-white font-semibold mb-4">Features Tested</h2>
              <p className="text-xs text-slate-400 mb-3">Check which features were verified in the import</p>
              
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(features).map(([feature, checked]) => (
                  <label key={feature} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleFeature(feature)}
                      className="rounded"
                    />
                    <span className="text-slate-300">{feature.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes & Issues */}
            <div className="bg-slate-800 rounded-lg p-5 border border-slate-600">
              <h2 className="text-white font-semibold mb-4">Notes</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">General Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional observations..."
                    className="w-full h-24 bg-slate-700 text-white rounded px-3 py-2 text-sm border border-slate-500/30 focus:border-slate-400 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-1">Known Issues</label>
                  <textarea
                    value={knownIssues}
                    onChange={(e) => setKnownIssues(e.target.value)}
                    placeholder="One issue per line&#10;e.g., Actions missing damage rolls&#10;Legendary resistance not working"
                    className="w-full h-24 bg-slate-700 text-white rounded px-3 py-2 text-sm border border-slate-500/30 focus:border-slate-400 focus:outline-none resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">One issue per line</p>
                </div>
              </div>
            </div>

            {/* Output */}
            <div className="bg-slate-800 rounded-lg p-5 border border-green-500/30">
              <h2 className="text-white font-semibold mb-3">Generated Metadata</h2>
              
              <pre className="w-full h-96 bg-slate-700 text-green-400 rounded p-3 text-xs font-mono overflow-auto border border-green-400/30 mb-3">
                {metadata}
              </pre>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const blob = new Blob([metadata], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  disabled={!creatureName}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Download {filename}
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(metadata);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex-1 bg-green-600/50 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"
                >
                  <Copy size={16} />
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
          <h3 className="text-purple-400 font-semibold mb-2 flex items-center gap-2">
            <CheckCircle size={18} />
            How to Use This Tool
          </h3>
          <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
            <li>After successfully importing a JSON into Foundry, fill out this form</li>
            <li>Enter the creature name (required) and source information</li>
            <li>Enter your Foundry version info (found in Settings → Game Details)</li>
            <li>Mark which features you verified work correctly</li>
            <li>Add any notes or known issues</li>
            <li>Download the .meta.json file</li>
            <li>Save it alongside the working JSON file with the same name:
              <div className="bg-slate-800 rounded px-2 py-1 mt-1 font-mono text-xs">
                aarakocra-aeromancer.json<br/>
                aarakocra-aeromancer.meta.json
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}