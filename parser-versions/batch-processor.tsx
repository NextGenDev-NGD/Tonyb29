import { useState, useRef } from 'react'
import { Download, Zap, Copy, CheckCircle, XCircle, AlertTriangle, FileJson, Layers, Package, RefreshCw, Sparkles, X } from 'lucide-react'
import { parseStatBlock } from './dnd-parser-v20-stable'
import { toFantasyGroundsXML } from './fantasy-grounds-exporter'
import { generateStatBlockFromName, hasApiKey } from './claude-api'

// Split input into individual stat blocks on lines containing only "---"
function splitBlocks(text: string): string[] {
  return text
    .split(/^---+\s*$/m)
    .map(b => b.trim())
    .filter(Boolean)
}

const SOURCES = [
  { value: 'any',                              label: 'Any / Custom' },
  { value: 'the Monster Manual (2024)',         label: 'Monster Manual (2024)' },
  { value: 'the Monster Manual (2014)',         label: 'Monster Manual (2014)' },
  { value: "Mordenkainen's Tome of Foes",       label: "Mordenkainen's Tome of Foes" },
  { value: "Volo's Guide to Monsters",          label: "Volo's Guide to Monsters" },
  { value: "Tasha's Cauldron of Everything",    label: "Tasha's Cauldron of Everything" },
  { value: 'a homebrew campaign setting',       label: 'Homebrew / Custom Setting' },
]

type BlockResult = {
  index: number
  name: string
  accuracy: number | null
  defaultedFields: string[]
  errors: string[]
  warnings: string[]
  actor: any
  sourceName?: string   // original name from Name Mode — used for reroll
}

type GenProgress = { current: number; total: number; currentName: string }

export default function BatchProcessor({ onSendToEncounter }: { onSendToEncounter?: (actors: any[]) => void } = {}) {
  const [mode, setMode]           = useState<'text' | 'names'>('text')

  // Text mode
  const [input, setInput]         = useState('')

  // Name mode
  const [namesInput, setNamesInput] = useState('')
  const [context, setContext]       = useState('')
  const [source, setSource]         = useState('any')

  // Shared
  const [results, setResults]       = useState<BlockResult[]>([])
  const [running, setRunning]       = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState<GenProgress | null>(null)
  const [rerolling, setRerolling]   = useState<number | null>(null)

  const [copiedIdx, setCopiedIdx]     = useState<number | null>(null)
  const [copiedFGU, setCopiedFGU]     = useState<number | null>(null)
  const [copiedMacro, setCopiedMacro] = useState(false)

  const cancelledRef = useRef(false)

  // ── TEXT MODE PARSE ──────────────────────────────────────────

  const runAll = () => {
    setRunning(true)
    setTimeout(() => {
      const blocks = splitBlocks(input)
      const out: BlockResult[] = blocks.map((block, i) => {
        const { errors, warnings, stats, actor } = parseStatBlock(block)
        const name = actor?.name ?? block.split('\n').find(l => l.trim()) ?? `Block ${i + 1}`
        const defaultedFields = (stats?.fields ?? [])
          .filter((f: any) => f.method === 'default')
          .map((f: any) => f.name)
        return { index: i, name, accuracy: stats?.accuracy ?? null, defaultedFields, errors, warnings, actor }
      })
      setResults(out)
      setRunning(false)
    }, 50)
  }

  // ── NAME MODE GENERATE ───────────────────────────────────────

  const runNameBatch = async () => {
    const names = namesInput.split('\n').map(n => n.trim()).filter(Boolean)
    if (!names.length) return
    cancelledRef.current = false
    setGenerating(true)
    setResults([])
    const out: BlockResult[] = []

    for (let i = 0; i < names.length; i++) {
      if (cancelledRef.current) break
      setGenProgress({ current: i + 1, total: names.length, currentName: names[i] })

      try {
        const text = await generateStatBlockFromName(names[i], source, context)
        const { errors, warnings, stats, actor } = parseStatBlock(text)
        const name = actor?.name ?? names[i]
        const defaultedFields = (stats?.fields ?? [])
          .filter((f: any) => f.method === 'default')
          .map((f: any) => f.name)
        out.push({ index: i, name, accuracy: stats?.accuracy ?? null, defaultedFields, errors, warnings, actor, sourceName: names[i] })
      } catch (err: any) {
        out.push({
          index: i, name: names[i], accuracy: null, defaultedFields: [],
          errors: [`Generation failed: ${err.message}`], warnings: [], actor: null, sourceName: names[i],
        })
      }

      setResults([...out])
    }

    setGenerating(false)
    setGenProgress(null)
  }

  const cancelGeneration = () => { cancelledRef.current = true }

  // ── REROLL (Name Mode) ───────────────────────────────────────

  const reroll = async (idx: number, sourceName: string) => {
    setRerolling(idx)
    try {
      const text = await generateStatBlockFromName(sourceName, source, context)
      const { errors, warnings, stats, actor } = parseStatBlock(text)
      const name = actor?.name ?? sourceName
      const defaultedFields = (stats?.fields ?? [])
        .filter((f: any) => f.method === 'default')
        .map((f: any) => f.name)
      setResults(prev => prev.map(r =>
        r.index === idx ? { ...r, name, accuracy: stats?.accuracy ?? null, defaultedFields, errors, warnings, actor } : r
      ))
    } catch (err: any) {
      setResults(prev => prev.map(r =>
        r.index === idx ? { ...r, errors: [`Generation failed: ${err.message}`] } : r
      ))
    }
    setRerolling(null)
  }

  // ── EXPORTS ──────────────────────────────────────────────────

  const downloadAll = () => {
    const actors = results.filter(r => r.actor && !r.errors.length).map(r => r.actor)
    if (!actors.length) return
    const blob = new Blob([JSON.stringify(actors, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'batch-foundry-import.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const downloadFGU = () => {
    const actors = results.filter(r => r.actor && !r.errors.length).map(r => r.actor)
    if (!actors.length) return
    const npcBodies = actors.map((a, i) => {
      const xml  = toFantasyGroundsXML(a)
      const body = xml.match(/<npc>([\s\S]*?)<\/npc>/)?.[1] ?? ''
      const id   = String(i + 1).padStart(5, '0')
      return `\t\t<id-${id}>\n${body}\n\t\t</id-${id}>`
    })
    const xml = [
      `<?xml version="1.0" encoding="utf-8"?>`,
      `<root version="5.1" dataversion="20260124" release="9|CoreRPG:7">`,
      `\t<npclist>`,
      npcBodies.join('\n'),
      `\t</npclist>`,
      `</root>`,
    ].join('\n')
    const blob = new Blob([xml], { type: 'application/xml' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'batch-fgu-import.xml'; a.click()
    URL.revokeObjectURL(url)
  }

  const buildMacroScript = () => {
    const actors = results.filter(r => r.actor && !r.errors.length).map(r => r.actor)
    if (!actors.length) return null
    return [
      `// Batch Actor Import Macro`,
      `// Generated by DnD Stat Block Converter — ${actors.length} actor${actors.length !== 1 ? 's' : ''}`,
      `// Paste into a new Foundry macro and run it.`,
      ``,
      `const actors = ${JSON.stringify(actors, null, 2)};`,
      ``,
      `const created = await Actor.create(actors);`,
      `ui.notifications.info(\`Imported \${created.length} actor\${created.length !== 1 ? 's' : ''} successfully.\`);`,
    ].join('\n')
  }

  const copyMacro = () => {
    const script = buildMacroScript()
    if (!script) return
    navigator.clipboard.writeText(script)
    setCopiedMacro(true)
    setTimeout(() => setCopiedMacro(false), 2000)
  }

  const downloadMacro = () => {
    const script = buildMacroScript()
    if (!script) return
    const blob = new Blob([script], { type: 'text/javascript' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'batch-import-macro.js'; a.click()
    URL.revokeObjectURL(url)
  }

  const copyOne = (r: BlockResult, idx: number) => {
    navigator.clipboard.writeText(JSON.stringify(r.actor, null, 2))
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  const copyOneFGU = (r: BlockResult, idx: number) => {
    navigator.clipboard.writeText(toFantasyGroundsXML(r.actor))
    setCopiedFGU(idx)
    setTimeout(() => setCopiedFGU(null), 1500)
  }

  const parsedCount  = results.filter(r => r.actor && !r.errors.length).length
  const successCount = results.filter(r => r.actor && !r.errors.length && !r.defaultedFields?.length && !r.warnings.length).length
  const errorCount   = results.filter(r => r.errors.length > 0).length
  const warnCount    = results.filter(r => !r.errors.length && (r.warnings.length > 0 || r.defaultedFields?.length > 0)).length
  const nameCount    = namesInput.split('\n').map(n => n.trim()).filter(Boolean).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">

        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-4xl font-bold text-white">Batch Processor</h1>
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Layers size={14} /> Phase 11
          </span>
          <span className="bg-violet-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Sparkles size={14} /> Phase 14
          </span>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setMode('text'); setResults([]) }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              mode === 'text'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Text Mode
          </button>
          <button
            onClick={() => { setMode('names'); setResults([]) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              mode === 'names'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Sparkles size={14} /> AI Name Mode
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left — Input */}
          <div className="space-y-4">

            {mode === 'text' ? (
              <div className="bg-slate-800 rounded-lg p-5 border border-purple-500/30">
                <label className="block text-white font-semibold mb-1">Paste Multiple Stat Blocks</label>
                <p className="text-slate-400 text-xs mb-3">Separate each stat block with a line containing only <code className="bg-slate-700 px-1 rounded">---</code></p>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={"Goblin\nSmall humanoid...\n\n---\n\nOrc\nMedium humanoid..."}
                  className="w-full h-96 bg-slate-700 text-white rounded p-3 text-sm font-mono border border-purple-400/30 focus:border-purple-400 focus:outline-none resize-none"
                />
                <button
                  onClick={runAll}
                  disabled={running || !input.trim()}
                  className="mt-3 w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"
                >
                  <Zap size={16} />
                  {running ? 'Parsing...' : 'Parse All Blocks'}
                </button>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-lg p-5 border border-violet-500/30 space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-1">Monster / NPC Names</label>
                  <p className="text-slate-400 text-xs mb-2">One name per line — Claude generates a full stat block for each.</p>
                  <textarea
                    value={namesInput}
                    onChange={e => setNamesInput(e.target.value)}
                    placeholder={"Sun King Raedan Sunstrider\nHigh Druidess Elowen Galewind\nShadow Beast\nCorrupted Miner"}
                    className="w-full h-48 bg-slate-700 text-white rounded p-3 text-sm font-mono border border-violet-400/30 focus:border-violet-400 focus:outline-none resize-none"
                  />
                  {namesInput.trim() && (
                    <p className="text-slate-500 text-xs mt-1">{nameCount} name{nameCount !== 1 ? 's' : ''} queued</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-1">Campaign Context <span className="text-slate-500 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={context}
                    onChange={e => setContext(e.target.value)}
                    placeholder="e.g. Eldoria homebrew, CR 12, shadow magic theme, warlock multiclass"
                    className="w-full bg-slate-700 text-white rounded p-2 text-sm border border-violet-400/20 focus:border-violet-400 focus:outline-none"
                  />
                  <div className="text-slate-500 text-xs mt-1.5 space-y-0.5">
                    <p>Tips — what Claude uses to shape the stat block:</p>
                    <ul className="list-disc list-inside space-y-0.5 pl-1">
                      <li><span className="text-slate-400">CR</span> — most important; e.g. <em>CR 5</em>, <em>CR 1/2</em></li>
                      <li><span className="text-slate-400">Race / creature type</span> — e.g. <em>half-elf</em>, <em>undead</em>, <em>construct</em></li>
                      <li><span className="text-slate-400">Class / role</span> — e.g. <em>paladin</em>, <em>assassin rogue</em>, <em>war cleric</em></li>
                      <li><span className="text-slate-400">Theme / abilities</span> — e.g. <em>fire magic</em>, <em>shadow teleport</em>, <em>pack tactics</em></li>
                      <li><span className="text-slate-400">Setting</span> — e.g. <em>homebrew campaign</em>, <em>D&amp;D 5e 2024</em></li>
                    </ul>
                    <p className="text-slate-600 pt-0.5">The parser handles: ability scores, AC, HP, saves, skills, resistances/immunities, speeds, senses, spellcasting with full spell lists, traits, actions, bonus actions, reactions, and legendary actions.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-semibold mb-1">Source</label>
                  <select
                    value={source}
                    onChange={e => setSource(e.target.value)}
                    className="w-full bg-slate-700 text-white rounded p-2 text-sm border border-violet-400/20 focus:border-violet-400 focus:outline-none"
                  >
                    {SOURCES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {!hasApiKey() && (
                  <div className="text-yellow-300 text-xs bg-yellow-900/30 border border-yellow-600/30 rounded px-3 py-2">
                    ⚠ No API key configured — open Settings (⚙) to add your Claude key before generating.
                  </div>
                )}

                {/* Progress bar */}
                {generating && genProgress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Generating {genProgress.current} of {genProgress.total} — <span className="text-violet-300">{genProgress.currentName}</span></span>
                      <button
                        onClick={cancelGeneration}
                        className="flex items-center gap-1 text-red-400 hover:text-red-300 transition"
                      >
                        <X size={12} /> Cancel
                      </button>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-violet-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(genProgress.current / genProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={runNameBatch}
                  disabled={generating || !namesInput.trim() || !hasApiKey()}
                  className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  {generating ? `Generating ${genProgress?.current ?? 0} of ${genProgress?.total ?? nameCount}...` : `Generate ${nameCount} Stat Block${nameCount !== 1 ? 's' : ''}`}
                </button>
              </div>
            )}

            {/* Summary bar */}
            {results.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-4 border border-blue-500/30 space-y-3">
                <div className="text-blue-400 font-semibold text-sm">
                  Summary — {results.length} {mode === 'names' ? 'generated' : 'block'}{results.length !== 1 ? 's' : ''}
                  {generating && <span className="text-violet-400 ml-2">(in progress…)</span>}
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-400 flex items-center gap-1"><CheckCircle size={14} /> {successCount} ok</span>
                  <span className="text-yellow-400 flex items-center gap-1"><AlertTriangle size={14} /> {warnCount} warn</span>
                  <span className="text-red-400 flex items-center gap-1"><XCircle size={14} /> {errorCount} failed</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={copyMacro}
                    disabled={!parsedCount}
                    className="flex items-center gap-1 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded transition"
                    title="Copy self-contained Foundry macro to clipboard"
                  >
                    {copiedMacro ? <CheckCircle size={13} /> : <Copy size={13} />}
                    {copiedMacro ? 'Copied!' : `Copy Macro (${parsedCount})`}
                  </button>
                  <button
                    onClick={downloadMacro}
                    disabled={!parsedCount}
                    className="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded transition"
                  >
                    <Package size={13} /> Download Macro
                  </button>
                  <button
                    onClick={downloadAll}
                    disabled={!parsedCount}
                    className="flex items-center gap-1 bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded transition"
                  >
                    <Download size={13} /> JSON
                  </button>
                  <button
                    onClick={downloadFGU}
                    disabled={!parsedCount}
                    className="flex items-center gap-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded transition"
                  >
                    <Download size={13} /> FGU XML
                  </button>
                  {onSendToEncounter && (
                    <button
                      onClick={() => onSendToEncounter(results.filter(r => r.actor && !r.errors.length).map(r => r.actor))}
                      disabled={!parsedCount}
                      className="flex items-center gap-1 bg-orange-800 hover:bg-orange-700 disabled:opacity-40 text-white text-xs font-semibold px-3 py-1.5 rounded transition"
                      title="Send all parsed creatures to the Encounter Builder"
                    >
                      <Layers size={13} /> Send to Encounter
                    </button>
                  )}
                  <button
                    onClick={() => { setResults([]); setInput(''); setNamesInput(''); }}
                    className="flex items-center gap-1 bg-slate-700 hover:bg-red-900 text-slate-400 hover:text-red-300 text-xs font-semibold px-3 py-1.5 rounded transition ml-auto"
                    title="Clear all results and inputs"
                  >
                    <X size={13} /> Clear All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right — Results */}
          <div className="space-y-3">
            {results.length === 0 && !generating && (
              <div className="bg-slate-800 rounded-lg p-8 border border-slate-600/30 text-slate-500 text-center text-sm">
                {mode === 'names'
                  ? 'Enter names on the left and click Generate — results appear here as each stat block is created.'
                  : 'Results will appear here after parsing.'}
              </div>
            )}
            {results.map(r => (
              <div
                key={r.index}
                className={`bg-slate-800 rounded-lg p-4 border ${
                  r.errors.length
                    ? 'border-red-600/50'
                    : r.warnings.length || r.defaultedFields.length
                      ? 'border-yellow-500/40'
                      : 'border-green-600/40'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {r.errors.length
                      ? <XCircle size={16} className="text-red-400 flex-shrink-0" />
                      : (r.warnings.length || r.defaultedFields.length)
                        ? <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />
                        : <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                    }
                    <span className="text-white font-semibold text-sm">{r.name}</span>
                    {r.sourceName && r.sourceName !== r.name && (
                      <span className="text-slate-500 text-xs">({r.sourceName})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {r.accuracy !== null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        r.accuracy >= 80 ? 'bg-green-800 text-green-300'
                        : r.accuracy >= 60 ? 'bg-yellow-800 text-yellow-300'
                        : 'bg-red-800 text-red-300'
                      }`}>{r.accuracy}%</span>
                    )}
                    {/* Reroll button — Name Mode only */}
                    {r.sourceName && (
                      <button
                        onClick={() => reroll(r.index, r.sourceName!)}
                        disabled={rerolling === r.index || generating}
                        className="flex items-center gap-1 bg-violet-800 hover:bg-violet-700 disabled:opacity-40 text-violet-200 text-xs px-2 py-1 rounded transition"
                        title="Regenerate this stat block"
                      >
                        <RefreshCw size={12} className={rerolling === r.index ? 'animate-spin' : ''} />
                        {rerolling === r.index ? 'Rolling…' : 'Reroll'}
                      </button>
                    )}
                    {r.actor && (
                      <>
                        <button
                          onClick={() => copyOne(r, r.index)}
                          className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-2 py-1 rounded transition"
                          title="Copy Foundry JSON"
                        >
                          {copiedIdx === r.index ? <CheckCircle size={12} className="text-green-400" /> : <FileJson size={12} />}
                          {copiedIdx === r.index ? 'Copied' : 'JSON'}
                        </button>
                        <button
                          onClick={() => copyOneFGU(r, r.index)}
                          className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-2 py-1 rounded transition"
                          title="Copy FGU XML"
                        >
                          {copiedFGU === r.index ? <CheckCircle size={12} className="text-green-400" /> : <Copy size={12} />}
                          {copiedFGU === r.index ? 'Copied' : 'FGU'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stat summary */}
                {r.actor && !r.errors.length && (() => {
                  const sys = r.actor.system
                  const parts: string[] = []
                  const cr = sys?.details?.cr
                  if (cr !== undefined && cr !== null) parts.push(`CR ${cr < 1 && cr > 0 ? `1/${Math.round(1/cr)}` : cr}`)
                  const hp = sys?.attributes?.hp?.value
                  if (hp) parts.push(`HP ${hp}`)
                  const ac = sys?.attributes?.ac?.flat
                  if (ac) parts.push(`AC ${ac}`)
                  const walk = sys?.attributes?.movement?.walk
                  if (walk) parts.push(`Speed ${walk} ft.`)
                  const spellLvl = sys?.attributes?.spell?.level
                  if (spellLvl) parts.push(`Caster Lvl ${spellLvl}`)
                  const size = sys?.traits?.size
                  const type = sys?.details?.type?.value
                  if (size || type) parts.push([size, type].filter(Boolean).join(' '))
                  return parts.length ? (
                    <div className="text-slate-400 text-xs mt-1 font-mono">{parts.join(' · ')}</div>
                  ) : null
                })()}

                {/* Errors */}
                {r.errors.map((e, i) => (
                  <div key={i} className="text-red-300 text-xs bg-red-900/20 rounded px-2 py-1 mt-1">{e}</div>
                ))}

                {/* Warnings */}
                {r.warnings.map((w, i) => (
                  <div key={i} className="text-yellow-300 text-xs bg-yellow-900/20 rounded px-2 py-1 mt-1">{w}</div>
                ))}

                {/* Defaulted fields */}
                {r.defaultedFields.length > 0 && (
                  <div className="text-yellow-400 text-xs bg-yellow-900/20 rounded px-2 py-1 mt-1">
                    Used defaults for: {r.defaultedFields.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
