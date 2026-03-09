import { useState, useEffect, useRef, DragEvent, ChangeEvent } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Transcript {
  id: string
  filename: string
  created_at: string
  duration_s: number
  text: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}m ${sec}s`
}

function fmtDate(iso: string) {
  return new Date(iso + 'Z').toLocaleString()
}

function highlight(text: string, q: string) {
  if (!q) return text
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${safe})`, 'gi'))
  return parts.map(p =>
    p.toLowerCase() === q.toLowerCase()
      ? `<mark class="bg-yellow-300 text-black rounded px-0.5">${p}</mark>`
      : p
  ).join('')
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function App() {
  const [transcripts, setTranscripts]   = useState<Transcript[]>([])
  const [selected, setSelected]         = useState<Transcript | null>(null)
  const [query, setQuery]               = useState('')
  const [uploading, setUploading]       = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [dragging, setDragging]         = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Load transcripts (with optional search)
  const load = async (q = query) => {
    const url = q ? `/transcripts?q=${encodeURIComponent(q)}` : '/transcripts'
    const res = await fetch(url)
    const data = await res.json()
    setTranscripts(data)
  }

  useEffect(() => { load() }, [])

  // Search with debounce
  useEffect(() => {
    const t = setTimeout(() => load(query), 300)
    return () => clearTimeout(t)
  }, [query])

  // Upload handler
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadStatus(`Transcribing ${file.name} (${i + 1}/${files.length})…`)
      const form = new FormData()
      form.append('file', file)
      try {
        const res = await fetch('/transcribe', { method: 'POST', body: form })
        if (!res.ok) throw new Error(await res.text())
      } catch (e: any) {
        setUploadStatus(`Error on ${file.name}: ${e.message}`)
        setUploading(false)
        return
      }
    }

    setUploadStatus(`Done — ${files.length} file(s) transcribed.`)
    setUploading(false)
    load('')
    setQuery('')
  }

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const deleteTranscript = async (id: string) => {
    await fetch(`/transcripts/${id}`, { method: 'DELETE' })
    if (selected?.id === id) setSelected(null)
    load()
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-80 flex-shrink-0 bg-gray-900 border-r border-gray-700 flex flex-col">

        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-lg font-bold text-white mb-1">Audio Transcriber</h1>
          <p className="text-xs text-gray-400">Local · Whisper medium</p>
        </div>

        {/* Drop zone */}
        <div
          className={`m-4 rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors
            ${dragging ? 'border-blue-400 bg-blue-900/20' : 'border-gray-600 hover:border-gray-400'}
            ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div className="text-3xl mb-2">🎙️</div>
          <p className="text-sm text-gray-300 font-medium">
            {uploading ? uploadStatus : 'Drop audio files here'}
          </p>
          <p className="text-xs text-gray-500 mt-1">or click to browse</p>
          <p className="text-xs text-gray-600 mt-1">m4a · mp3 · wav · ogg · flac · mp4</p>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*,video/mp4"
            multiple
            className="hidden"
            onChange={onFileInput}
          />
        </div>

        {/* Upload status */}
        {uploadStatus && !uploading && (
          <p className="mx-4 -mt-2 mb-2 text-xs text-green-400">{uploadStatus}</p>
        )}

        {/* Search */}
        <div className="px-4 pb-3">
          <input
            type="text"
            placeholder="Search transcripts…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Transcript list */}
        <div className="flex-1 overflow-y-auto">
          {transcripts.length === 0 && (
            <p className="text-center text-gray-500 text-sm mt-8 px-4">
              {query ? 'No results.' : 'No transcripts yet.\nUpload an audio file to get started.'}
            </p>
          )}
          {transcripts.map(t => (
            <div
              key={t.id}
              onClick={() => setSelected(t)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-800 hover:bg-gray-800 transition-colors
                ${selected?.id === t.id ? 'bg-gray-800 border-l-2 border-l-blue-500' : ''}`}
            >
              <p className="text-sm font-medium text-white truncate">{t.filename}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {fmtDate(t.created_at)} · {fmtDuration(t.duration_s)}
              </p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.text.slice(0, 100)}…</p>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main panel ── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-950">
        {selected ? (
          <>
            {/* Transcript header */}
            <div className="px-8 py-5 border-b border-gray-800 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{selected.filename}</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {fmtDate(selected.created_at)} · {fmtDuration(selected.duration_s)}
                </p>
              </div>
              <button
                onClick={() => deleteTranscript(selected.id)}
                className="text-xs text-red-400 hover:text-red-300 border border-red-800 hover:border-red-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>

            {/* Transcript text */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div
                className="text-gray-200 text-base leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: highlight(selected.text, query) }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            <div className="text-center">
              <div className="text-5xl mb-4">📄</div>
              <p className="text-lg">Select a transcript to read it</p>
              <p className="text-sm mt-1">or upload an audio file to get started</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
