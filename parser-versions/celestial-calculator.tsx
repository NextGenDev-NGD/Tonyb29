// celestial-calculator.tsx
// Phase 18b — Celestial Calculator (Tab 7)
// Night Sky viewer, moon phase tracker, year event calendar, boons/pitfalls, AI sky description

import React, { useState, useMemo, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Sparkles, Plus, Trash2, Pencil,
  Download, Copy,
} from 'lucide-react'
import {
  type Moon, type WorldCalendar, type CelestialEvent, type EventType,
  EVENT_META,
  moonPhase, illumination, illuminationPct, phaseName, daysToPhase,
  findYearEvents, moonPhasePath, generateStars,
  ELDORIA_CALENDAR, BLANK_CALENDAR,
} from './celestial-data'
import { generateSkyDescription } from './claude-api'

// ── Constants ─────────────────────────────────────────────────────────────────
const SKY_R: Record<string, number> = { tiny: 16, small: 24, medium: 34, large: 46 }
const STARS = generateStars(160, 600, 220)
const STORAGE_KEY = 'dnd_celestial_calendar'
const ACCENT = '#0e7490'

// ── Persistence ───────────────────────────────────────────────────────────────
function loadCalendar(): WorldCalendar {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as WorldCalendar
  } catch {}
  return ELDORIA_CALENDAR
}
function saveCalendar(cal: WorldCalendar) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cal))
}

// ── NightSky SVG ──────────────────────────────────────────────────────────────
function NightSky({ calendar, day }: { calendar: WorldCalendar; day: number }) {
  const W = 600, H = 220
  const { moons } = calendar
  const n = moons.length

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#03040d" />
          <stop offset="65%"  stopColor="#07092a" />
          <stop offset="100%" stopColor="#0c1340" />
        </linearGradient>
        <filter id="moon-glow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* Background */}
      <rect width={W} height={H} fill="url(#sky-grad)" />

      {/* Stars */}
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.opacity} />
      ))}

      {/* Horizon glow */}
      <ellipse cx={W / 2} cy={H} rx={W * 0.55} ry={36} fill="#0e7490" opacity="0.06" />

      {/* Moons */}
      {moons.map((moon, i) => {
        const cx   = (W / (n + 1)) * (i + 1)
        const cy   = H * 0.38 + (i % 2 === 0 ? 0 : -16)
        const r    = SKY_R[moon.size]
        const ph   = moonPhase(moon, day)
        const lit  = moonPhasePath(r, ph)
        const illm = illumination(ph)

        return (
          <g key={moon.id}>
            {/* Glow aura */}
            {illm > 0.06 && (
              <circle
                cx={cx} cy={cy} r={r * 2.4}
                fill={moon.color}
                opacity={illm * 0.2}
                filter="url(#moon-glow)"
              />
            )}
            {/* Moon body */}
            <g transform={`translate(${cx},${cy})`}>
              <circle r={r} fill="#060810" />
              {lit && <path d={lit} fill={moon.color} />}
            </g>
            {/* Limb ring */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={moon.color} strokeWidth="0.8" opacity="0.28" />
            {/* Labels */}
            <text x={cx} y={cy + r + 15} textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="system-ui,sans-serif">
              {moon.name}
            </text>
            <text x={cx} y={cy + r + 27} textAnchor="middle" fill="#64748b" fontSize="9.5" fontFamily="system-ui,sans-serif">
              {phaseName(ph)}
            </text>
          </g>
        )
      })}

      {/* Horizon */}
      <line x1={0} y1={H - 1} x2={W} y2={H - 1} stroke="#1e293b" strokeWidth="1" />
    </svg>
  )
}

// ── Moon phase icon (for cards & settings) ────────────────────────────────────
function MoonPhaseIcon({ moon, day, size = 56 }: { moon: Moon; day: number; size?: number }) {
  const r   = Math.floor(size / 2) - 4
  const ph  = moonPhase(moon, day)
  const lit = moonPhasePath(r, ph)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="#060810" />
      {lit && (
        <g transform={`translate(${size / 2},${size / 2})`}>
          <path d={lit} fill={moon.color} />
        </g>
      )}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={moon.color} strokeWidth="1" opacity="0.38" />
    </svg>
  )
}

// ── Moon status card ──────────────────────────────────────────────────────────
function MoonCard({ moon, day }: { moon: Moon; day: number }) {
  const ph    = moonPhase(moon, day)
  const illum = illuminationPct(ph)
  const dFull = daysToPhase(moon, day, 0.5)
  const dNew  = daysToPhase(moon, day, 0)
  return (
    <div style={{
      background: '#0d1117', border: '1px solid #1e293b', borderRadius: 10,
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
      flex: '1 1 200px', minWidth: 0,
    }}>
      <MoonPhaseIcon moon={moon} day={day} size={54} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: moon.color, fontSize: 14, marginBottom: 2 }}>{moon.name}</div>
        <div style={{ color: '#94a3b8', fontSize: 13 }}>{phaseName(ph)} — {illum}%</div>
        <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>Orbit: {moon.orbitDays}d</div>
        <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
          Full in {dFull}d · New in {dNew}d
        </div>
      </div>
    </div>
  )
}

// ── Event badge ───────────────────────────────────────────────────────────────
function EventBadge({ event }: { event: CelestialEvent }) {
  const meta = EVENT_META[event.type]
  return (
    <div style={{
      background: meta.color + '22', border: `1px solid ${meta.color}66`,
      borderRadius: 20, padding: '5px 12px', display: 'inline-flex',
      alignItems: 'center', gap: 6, color: meta.color, fontSize: 13,
    }}>
      <span>{meta.icon}</span>
      <span>{event.label}</span>
    </div>
  )
}

// ── Boons & pitfalls panel ────────────────────────────────────────────────────
function BoonsPitfalls({ calendar, events }: { calendar: WorldCalendar; events: CelestialEvent[] }) {
  const seen = new Set<EventType>()
  const effects: Array<{ type: EventType; boons: string[]; pitfalls: string[] }> = []
  events.forEach(ev => {
    if (!seen.has(ev.type)) {
      seen.add(ev.type)
      const fx = calendar.eventEffects[ev.type]
      if (fx.boons.length || fx.pitfalls.length) effects.push({ type: ev.type, ...fx })
    }
  })
  if (!effects.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
      {effects.map(({ type, boons, pitfalls }) => {
        const meta = EVENT_META[type]
        return (
          <div key={type} style={{ background: '#060912', border: `1px solid ${meta.color}33`, borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ color: meta.color, fontWeight: 600, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {meta.icon} {meta.label}
            </div>
            {boons.length > 0 && (
              <div style={{ marginBottom: pitfalls.length ? 8 : 0 }}>
                <div style={{ color: '#4ade80', fontSize: 10, fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Boons</div>
                {boons.map((b, i) => (
                  <div key={i} style={{ color: '#86efac', fontSize: 13, marginBottom: 4, paddingLeft: 10, borderLeft: '2px solid #166534' }}>{b}</div>
                ))}
              </div>
            )}
            {pitfalls.length > 0 && (
              <div>
                <div style={{ color: '#f87171', fontSize: 10, fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pitfalls</div>
                {pitfalls.map((p, i) => (
                  <div key={i} style={{ color: '#fca5a5', fontSize: 13, marginBottom: 4, paddingLeft: 10, borderLeft: '2px solid #7f1d1d' }}>{p}</div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Year calendar event row ───────────────────────────────────────────────────
function EventListItem({
  event, calendar, daysPerYear, expanded, onToggle,
}: {
  event: CelestialEvent
  calendar: WorldCalendar
  daysPerYear: number
  expanded: boolean
  onToggle: () => void
}) {
  const meta    = EVENT_META[event.type]
  const yearDay = (event.day % daysPerYear) + 1

  return (
    <div style={{ borderBottom: '1px solid #1a2030' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', background: 'none', border: 'none', padding: '9px 14px',
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ color: meta.color, fontSize: 15, width: 22, textAlign: 'center', flexShrink: 0 }}>{meta.icon}</span>
        <span style={{ color: '#64748b', fontSize: 12, width: 60, flexShrink: 0 }}>Day {yearDay}</span>
        <span style={{ color: meta.color, fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0 }}>{event.label}</span>
        <span style={{ color: '#475569', fontSize: 11, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div style={{ paddingLeft: 46, paddingRight: 14, paddingBottom: 12 }}>
          <BoonsPitfalls calendar={calendar} events={[event]} />
        </div>
      )}
    </div>
  )
}

// ── Moon editor form ──────────────────────────────────────────────────────────
function MoonEditorForm({ draft, onSave, onCancel }: {
  draft: Moon
  onSave: (m: Moon) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<Moon>({ ...draft })
  const set = (k: keyof Moon, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const inp: React.CSSProperties = {
    background: '#060912', border: '1px solid #334155', borderRadius: 6,
    color: '#e2e8f0', padding: '6px 10px', fontSize: 13, width: '100%', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = { color: '#94a3b8', fontSize: 12, marginBottom: 4, display: 'block' }

  return (
    <div style={{ background: '#0a0f1a', border: `1px solid ${ACCENT}66`, borderRadius: 10, padding: 16, marginTop: 6 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={lbl}>Name</label>
          <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Orbit (days)</label>
          <input style={inp} type="number" min="1" value={form.orbitDays} onChange={e => set('orbitDays', +e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Size</label>
          <select style={inp} value={form.size} onChange={e => set('size', e.target.value as any)}>
            <option value="tiny">Tiny</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Color</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
              style={{ width: 38, height: 30, background: 'none', border: '1px solid #334155', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
            <input style={{ ...inp, flex: 1 }} value={form.color} onChange={e => set('color', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={lbl}>Start Phase (0–1)</label>
          <input style={inp} type="number" min="0" max="1" step="0.01" value={form.startPhase}
            onChange={e => set('startPhase', +e.target.value)} />
        </div>
        <div>
          <label style={lbl}>ID (slug)</label>
          <input style={inp} value={form.id} onChange={e => set('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Description</label>
        <textarea style={{ ...inp, height: 54, resize: 'vertical', fontFamily: 'inherit' }}
          value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onSave(form)} style={{
          background: ACCENT, border: 'none', borderRadius: 6, color: 'white',
          padding: '7px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
        }}>Save Moon</button>
        <button onClick={onCancel} style={{
          background: 'none', border: '1px solid #334155', borderRadius: 6, color: '#94a3b8',
          padding: '7px 18px', cursor: 'pointer', fontSize: 13,
        }}>Cancel</button>
      </div>
    </div>
  )
}

// ── Event effects editor ──────────────────────────────────────────────────────
function EventEffectsEditor({ calendar, onUpdate }: {
  calendar: WorldCalendar
  onUpdate: (cal: WorldCalendar) => void
}) {
  const [openType, setOpenType] = useState<EventType | null>(null)

  function updateLines(type: EventType, field: 'boons' | 'pitfalls', text: string) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    onUpdate({
      ...calendar,
      eventEffects: { ...calendar.eventEffects, [type]: { ...calendar.eventEffects[type], [field]: lines } },
    })
  }

  const ta: React.CSSProperties = {
    background: '#060912', border: '1px solid #334155', borderRadius: 6,
    color: '#e2e8f0', padding: '8px 10px', fontSize: 12, width: '100%',
    boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, minHeight: 72,
  }

  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Event Effects</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(Object.keys(EVENT_META) as EventType[]).map(type => {
          const meta  = EVENT_META[type]
          const fx    = calendar.eventEffects[type]
          const isOpen = openType === type
          return (
            <div key={type} style={{ border: `1px solid ${meta.color}33`, borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={() => setOpenType(isOpen ? null : type)} style={{
                width: '100%', background: 'none', border: 'none', padding: '9px 14px',
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ color: meta.color }}>{meta.icon}</span>
                <span style={{ color: meta.color, fontWeight: 600, fontSize: 13, flex: 1 }}>{meta.label}</span>
                <span style={{ color: '#475569', fontSize: 11 }}>
                  {fx.boons.length}B · {fx.pitfalls.length}P
                </span>
                <span style={{ color: '#475569', fontSize: 11, marginLeft: 6 }}>{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div style={{ padding: '0 14px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ color: '#4ade80', fontSize: 10, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Boons (one per line)
                    </div>
                    <textarea style={ta} value={fx.boons.join('\n')}
                      onChange={e => updateLines(type, 'boons', e.target.value)} />
                  </div>
                  <div>
                    <div style={{ color: '#f87171', fontSize: 10, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Pitfalls (one per line)
                    </div>
                    <textarea style={ta} value={fx.pitfalls.join('\n')}
                      onChange={e => updateLines(type, 'pitfalls', e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main CelestialCalculator ──────────────────────────────────────────────────
export default function CelestialCalculator() {
  const [calendar, setCalendar]   = useState<WorldCalendar>(loadCalendar)
  const [displayDay,  setDay]     = useState(1)
  const [displayYear, setYear]    = useState(1)
  const [view, setView]           = useState<'sky' | 'calendar' | 'settings'>('sky')
  const [calFilter, setCalFilter] = useState<EventType | 'all'>('all')
  const [expandedKey, setExpKey]  = useState<string | null>(null)
  const [aiDesc, setAiDesc]       = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState('')
  const [editingIdx, setEditingIdx] = useState<number | 'new' | null>(null)
  const [copied, setCopied]       = useState(false)

  // Settings form mirrors
  const [calName, setCalName] = useState(calendar.name)
  const [calDays, setCalDays] = useState(String(calendar.daysPerYear))

  // ── Derived ─────────────────────────────────────────────────────────────────
  const actualDay = useMemo(
    () => (displayYear - 1) * calendar.daysPerYear + (displayDay - 1),
    [displayYear, displayDay, calendar.daysPerYear],
  )

  const yearEvents = useMemo(
    () => findYearEvents(calendar, displayYear),
    [calendar, displayYear],
  )

  const todayEvents = useMemo(
    () => yearEvents.filter(e => e.day === actualDay),
    [yearEvents, actualDay],
  )

  const filteredEvents = useMemo(
    () => calFilter === 'all' ? yearEvents : yearEvents.filter(e => e.type === calFilter),
    [yearEvents, calFilter],
  )

  // ── Calendar update (persists) ───────────────────────────────────────────────
  const updateCalendar = useCallback((cal: WorldCalendar) => {
    setCalendar(cal)
    saveCalendar(cal)
  }, [])

  // ── Navigation ───────────────────────────────────────────────────────────────
  function navigate(delta: number) {
    let d = displayDay + delta
    let y = displayYear
    while (d > calendar.daysPerYear) { d -= calendar.daysPerYear; y++ }
    while (d < 1) { d += calendar.daysPerYear; y = Math.max(1, y - 1) }
    setDay(d)
    setYear(y)
  }

  function goToNextEvent(direction: 1 | -1) {
    const events = direction > 0
      ? yearEvents.filter(e => e.day > actualDay)
      : [...yearEvents].reverse().filter(e => e.day < actualDay)
    if (events.length > 0) {
      const target = events[0]
      setDay((target.day % calendar.daysPerYear) + 1)
      // year is already correct since yearEvents is scoped to displayYear
    } else if (direction > 0) {
      // wrap to first event of next year
      const next = findYearEvents(calendar, displayYear + 1)
      if (next.length > 0) {
        setYear(displayYear + 1)
        setDay((next[0].day % calendar.daysPerYear) + 1)
      }
    } else {
      // wrap to last event of previous year
      if (displayYear > 1) {
        const prev = findYearEvents(calendar, displayYear - 1)
        if (prev.length > 0) {
          setYear(displayYear - 1)
          setDay((prev[prev.length - 1].day % calendar.daysPerYear) + 1)
        }
      }
    }
  }

  // ── AI description ────────────────────────────────────────────────────────────
  async function handleGenerateDesc() {
    setAiLoading(true)
    setAiError('')
    try {
      const moonDescs = calendar.moons.map(m => {
        const ph = moonPhase(m, actualDay)
        return `${m.name}: ${phaseName(ph)} (${illuminationPct(ph)}% lit)`
      })
      const eventDescs = todayEvents.map(e => e.label)
      const result = await generateSkyDescription(calendar.name, moonDescs, eventDescs)
      setAiDesc(result)
    } catch (e: any) {
      setAiError(e.message ?? 'Generation failed')
    } finally {
      setAiLoading(false)
    }
  }

  // ── Moon CRUD ─────────────────────────────────────────────────────────────────
  function saveMoon(moon: Moon) {
    const moons = [...calendar.moons]
    if (editingIdx === 'new') moons.push(moon)
    else if (editingIdx !== null) moons[editingIdx as number] = moon
    updateCalendar({ ...calendar, moons })
    setEditingIdx(null)
  }

  function deleteMoon(idx: number) {
    if (calendar.moons.length <= 1) return
    updateCalendar({ ...calendar, moons: calendar.moons.filter((_, i) => i !== idx) })
  }

  // ── Calendar basics apply ─────────────────────────────────────────────────────
  function applyCalBasics() {
    const days = Math.max(1, parseInt(calDays) || 360)
    updateCalendar({ ...calendar, name: calName.trim() || calendar.name, daysPerYear: days })
  }

  // ── Import / Export ───────────────────────────────────────────────────────────
  function handleExport() {
    const blob = new Blob([JSON.stringify(calendar, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${calendar.id}-celestial.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCopyJSON() {
    const text = JSON.stringify(calendar, null, 2)
    try {
      await navigator.clipboard?.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string) as WorldCalendar
        if (data.moons && data.daysPerYear && data.eventEffects) {
          updateCalendar(data)
          setCalName(data.name)
          setCalDays(String(data.daysPerYear))
        }
      } catch {}
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── New moon default ──────────────────────────────────────────────────────────
  const newMoonDraft: Moon = {
    id: `moon${calendar.moons.length + 1}`,
    name: 'New Moon',
    orbitDays: 28,
    size: 'medium',
    color: '#e2e8f0',
    startPhase: 0,
    description: '',
  }

  // ── Styles ────────────────────────────────────────────────────────────────────
  const viewBtn = (v: string): React.CSSProperties => ({
    background: view === v ? ACCENT + '28' : 'none',
    border: `1px solid ${view === v ? ACCENT + 'aa' : '#334155'}`,
    borderRadius: 7, padding: '7px 16px', cursor: 'pointer',
    color: view === v ? '#67e8f9' : '#94a3b8', fontSize: 13,
    fontWeight: view === v ? 600 : 400, transition: 'all 0.15s',
  })

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', padding: '20px 16px 40px' }}>
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ color: '#67e8f9', margin: '0 0 3px', fontSize: 20, fontWeight: 700 }}>
          ✦ {calendar.name} — Celestial Calculator
        </h2>
        <p style={{ color: '#64748b', margin: 0, fontSize: 13 }}>
          Track moon phases, celestial events, and their effects on your world
        </p>
      </div>

      {/* Day Navigator */}
      <div style={{
        background: '#0d1117', border: '1px solid #1e293b', borderRadius: 10,
        padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button onClick={() => goToNextEvent(-1)} title="Jump to previous event" style={{
          background: 'none', border: `1px solid ${ACCENT}66`, borderRadius: 5, color: '#67e8f9',
          padding: '3px 9px', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3,
        }}><ChevronLeft size={12} />Event</button>
        <button onClick={() => navigate(-7)} title="−7 days" style={{
          background: 'none', border: '1px solid #1e293b', borderRadius: 5, color: '#475569',
          padding: '3px 8px', cursor: 'pointer', fontSize: 11,
        }}>−7</button>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: '1px solid #334155', borderRadius: 5, color: '#94a3b8',
          padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
        }}>
          <ChevronLeft size={15} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 17 }}>Day {displayDay}</span>
          <span style={{ color: '#475569', fontSize: 14, margin: '0 6px' }}>of</span>
          <span style={{ color: '#94a3b8', fontSize: 15 }}>Year {displayYear}</span>
          {todayEvents.length > 0 && (
            <span style={{ marginLeft: 10, color: EVENT_META[todayEvents[0].type].color, fontSize: 12 }}>
              ✦ {todayEvents.length} event{todayEvents.length > 1 ? 's' : ''} today
            </span>
          )}
        </div>
        <button onClick={() => navigate(1)} style={{
          background: 'none', border: '1px solid #334155', borderRadius: 5, color: '#94a3b8',
          padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
        }}>
          <ChevronRight size={15} />
        </button>
        <button onClick={() => navigate(7)} title="+7 days" style={{
          background: 'none', border: '1px solid #1e293b', borderRadius: 5, color: '#475569',
          padding: '3px 8px', cursor: 'pointer', fontSize: 11,
        }}>+7</button>
        <button onClick={() => goToNextEvent(1)} title="Jump to next event" style={{
          background: 'none', border: `1px solid ${ACCENT}66`, borderRadius: 5, color: '#67e8f9',
          padding: '3px 9px', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3,
        }}>Event<ChevronRight size={12} /></button>
        <button onClick={() => { setDay(1); setYear(1) }} style={{
          background: 'none', border: '1px solid #1e293b', borderRadius: 5, color: '#475569',
          padding: '3px 10px', cursor: 'pointer', fontSize: 12,
        }}>Reset</button>
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button style={viewBtn('sky')}      onClick={() => setView('sky')}>🌙 Night Sky</button>
        <button style={viewBtn('calendar')} onClick={() => setView('calendar')}>📅 Year Calendar</button>
        <button style={viewBtn('settings')} onClick={() => setView('settings')}>⚙ Settings</button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* NIGHT SKY VIEW                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {view === 'sky' && (
        <div>
          {/* Sky SVG */}
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #1a2030', marginBottom: 14 }}>
            <NightSky calendar={calendar} day={actualDay} />
          </div>

          {/* Moon cards */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            {calendar.moons.map(moon => (
              <MoonCard key={moon.id} moon={moon} day={actualDay} />
            ))}
          </div>

          {/* Today's events + boons/pitfalls */}
          <div style={{
            background: '#0d1117', border: '1px solid #1e293b', borderRadius: 10,
            padding: '12px 16px', marginBottom: 14,
          }}>
            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Celestial Events — Day {displayDay}, Year {displayYear}
            </div>
            {todayEvents.length === 0 ? (
              <div style={{ color: '#475569', fontSize: 13, fontStyle: 'italic' }}>
                No celestial events today. Step forward to find the next event.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {todayEvents.map((ev, i) => <EventBadge key={i} event={ev} />)}
              </div>
            )}
            <BoonsPitfalls calendar={calendar} events={todayEvents} />
          </div>

          {/* AI Sky Description */}
          <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: aiDesc || aiError ? 12 : 0 }}>
              <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', flex: 1 }}>
                AI Sky Description
              </div>
              <button
                onClick={handleGenerateDesc}
                disabled={aiLoading}
                style={{
                  background: aiLoading ? '#1e293b' : `linear-gradient(135deg, ${ACCENT}, #0891b2)`,
                  border: 'none', borderRadius: 7, color: 'white', padding: '7px 16px',
                  cursor: aiLoading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Sparkles size={14} />
                {aiLoading ? 'Writing…' : 'Describe the Sky'}
              </button>
            </div>
            {aiError && (
              <div style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>{aiError}</div>
            )}
            {aiDesc && (
              <div style={{
                background: '#060912', border: `1px solid ${ACCENT}55`, borderRadius: 8,
                padding: '12px 16px', color: '#cbd5e1', fontSize: 14, fontStyle: 'italic', lineHeight: 1.75,
              }}>
                {aiDesc}
              </div>
            )}
            {!aiDesc && !aiError && (
              <div style={{ color: '#334155', fontSize: 12, fontStyle: 'italic' }}>
                Generate an evocative sky description to read aloud to your players.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* YEAR CALENDAR VIEW                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {view === 'calendar' && (
        <div>
          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {(['all', 'fullMoon', 'newMoon', 'conjunction', 'opposition', 'eclipse'] as const).map(f => {
              const meta    = f !== 'all' ? EVENT_META[f as EventType] : null
              const isActive = calFilter === f
              return (
                <button key={f} onClick={() => setCalFilter(f)} style={{
                  background: isActive ? ((meta?.color ?? ACCENT) + '2a') : 'none',
                  border:     `1px solid ${isActive ? (meta?.color ?? ACCENT) : '#334155'}`,
                  borderRadius: 20, padding: '5px 13px', cursor: 'pointer',
                  color: isActive ? (meta?.color ?? '#67e8f9') : '#64748b', fontSize: 12,
                  transition: 'all 0.15s',
                }}>
                  {meta ? `${meta.icon} ${meta.label}` : 'All Events'}
                </button>
              )
            })}
            <span style={{ color: '#475569', fontSize: 12, alignSelf: 'center', marginLeft: 2 }}>
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} in Year {displayYear}
            </span>
          </div>

          {/* Year selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <button onClick={() => setYear(y => Math.max(1, y - 1))} style={{
              background: 'none', border: '1px solid #334155', borderRadius: 5, color: '#94a3b8',
              padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}><ChevronLeft size={14} /></button>
            <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>Year {displayYear}</span>
            <button onClick={() => setYear(y => y + 1)} style={{
              background: 'none', border: '1px solid #334155', borderRadius: 5, color: '#94a3b8',
              padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}><ChevronRight size={14} /></button>
          </div>

          {/* Event list */}
          <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 10, overflow: 'hidden' }}>
            {filteredEvents.length === 0 ? (
              <div style={{ padding: '28px 16px', color: '#475569', fontSize: 13, fontStyle: 'italic', textAlign: 'center' }}>
                No {calFilter !== 'all' ? EVENT_META[calFilter as EventType].label : ''} events in Year {displayYear}.
              </div>
            ) : (
              filteredEvents.map(ev => {
                const key = `${ev.type}-${ev.day}`
                return (
                  <EventListItem
                    key={key} event={ev} calendar={calendar}
                    daysPerYear={calendar.daysPerYear}
                    expanded={expandedKey === key}
                    onToggle={() => setExpKey(expandedKey === key ? null : key)}
                  />
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SETTINGS VIEW                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {view === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Calendar basics */}
          <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Calendar</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ color: '#64748b', fontSize: 12, marginBottom: 4, display: 'block' }}>World Name</label>
                <input value={calName} onChange={e => setCalName(e.target.value)} style={{
                  background: '#060912', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0',
                  padding: '7px 10px', fontSize: 13, width: '100%', boxSizing: 'border-box',
                }} />
              </div>
              <div>
                <label style={{ color: '#64748b', fontSize: 12, marginBottom: 4, display: 'block' }}>Days per Year</label>
                <input value={calDays} type="number" min="1" onChange={e => setCalDays(e.target.value)} style={{
                  background: '#060912', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0',
                  padding: '7px 10px', fontSize: 13, width: '100%', boxSizing: 'border-box',
                }} />
              </div>
            </div>
            <button onClick={applyCalBasics} style={{
              background: ACCENT, border: 'none', borderRadius: 6, color: 'white',
              padding: '7px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            }}>Apply</button>
          </div>

          {/* Moon list */}
          <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Moons
              <button onClick={() => setEditingIdx('new')} style={{
                background: 'none', border: `1px solid ${ACCENT}`, borderRadius: 6, color: '#67e8f9',
                padding: '4px 12px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <Plus size={13} /> Add Moon
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {calendar.moons.map((moon, idx) => (
                <div key={moon.id}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#060912', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 12px',
                  }}>
                    <MoonPhaseIcon moon={moon} day={actualDay} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: moon.color, fontWeight: 700, fontSize: 14 }}>{moon.name}</span>
                      <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>
                        {moon.orbitDays}d · {moon.size}
                        {moon.description ? ` · ${moon.description.slice(0, 45)}${moon.description.length > 45 ? '…' : ''}` : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                      title="Edit"
                      style={{ background: 'none', border: '1px solid #334155', borderRadius: 5, color: '#94a3b8', padding: '4px 8px', cursor: 'pointer' }}
                    ><Pencil size={12} /></button>
                    <button
                      onClick={() => deleteMoon(idx)}
                      disabled={calendar.moons.length <= 1}
                      title="Delete"
                      style={{
                        background: 'none', border: '1px solid #334155', borderRadius: 5,
                        color: calendar.moons.length <= 1 ? '#1e293b' : '#f87171',
                        padding: '4px 8px', cursor: calendar.moons.length <= 1 ? 'not-allowed' : 'pointer',
                      }}
                    ><Trash2 size={12} /></button>
                  </div>
                  {editingIdx === idx && (
                    <MoonEditorForm draft={moon} onSave={saveMoon} onCancel={() => setEditingIdx(null)} />
                  )}
                </div>
              ))}
              {editingIdx === 'new' && (
                <MoonEditorForm draft={newMoonDraft} onSave={saveMoon} onCancel={() => setEditingIdx(null)} />
              )}
            </div>
          </div>

          {/* Event effects */}
          <EventEffectsEditor calendar={calendar} onUpdate={updateCalendar} />

          {/* Presets & export */}
          <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Presets & Export</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => {
                updateCalendar(ELDORIA_CALENDAR)
                setCalName(ELDORIA_CALENDAR.name)
                setCalDays(String(ELDORIA_CALENDAR.daysPerYear))
              }} style={{
                background: 'none', border: '1px solid #7c3aed', borderRadius: 6, color: '#a78bfa',
                padding: '7px 14px', cursor: 'pointer', fontSize: 13,
              }}>Load Eldoria</button>
              <button onClick={() => {
                updateCalendar(BLANK_CALENDAR)
                setCalName(BLANK_CALENDAR.name)
                setCalDays(String(BLANK_CALENDAR.daysPerYear))
              }} style={{
                background: 'none', border: '1px solid #334155', borderRadius: 6, color: '#64748b',
                padding: '7px 14px', cursor: 'pointer', fontSize: 13,
              }}>Start Blank</button>
              <button onClick={handleExport} style={{
                background: 'none', border: `1px solid ${ACCENT}`, borderRadius: 6, color: '#67e8f9',
                padding: '7px 14px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Download size={13} /> Export JSON
              </button>
              <button onClick={handleCopyJSON} style={{
                background: 'none', border: '1px solid #334155', borderRadius: 6,
                color: copied ? '#4ade80' : '#64748b',
                padding: '7px 14px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Copy size={13} /> {copied ? 'Copied!' : 'Copy JSON'}
              </button>
              <label style={{
                background: 'none', border: '1px solid #334155', borderRadius: 6, color: '#64748b',
                padding: '7px 14px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                Import JSON
                <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
              </label>
            </div>
            <div style={{ color: '#334155', fontSize: 11, marginTop: 10, fontStyle: 'italic' }}>
              Calendars auto-save to your browser. Export JSON regularly as a manual backup.
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}
