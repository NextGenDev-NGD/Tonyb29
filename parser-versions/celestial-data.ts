// celestial-data.ts
// Phase 18b — Celestial Calculator data layer
// Types, math, event detection, SVG path generation, Eldoria preset

// ── Types ──────────────────────────────────────────────────────────────────
export interface Moon {
  id: string
  name: string
  orbitDays: number
  size: 'tiny' | 'small' | 'medium' | 'large'
  color: string
  startPhase: number   // 0.0–1.0, phase at day 0 (0 = new moon at day 0)
  description: string
}

export interface EventEffects {
  boons: string[]
  pitfalls: string[]
}

export interface WorldCalendar {
  id: string
  name: string
  daysPerYear: number
  moons: Moon[]
  eventEffects: {
    conjunction: EventEffects
    opposition: EventEffects
    fullMoon: EventEffects
    newMoon: EventEffects
    eclipse: EventEffects
  }
}

export type EventType = 'conjunction' | 'opposition' | 'fullMoon' | 'newMoon' | 'eclipse'

export interface CelestialEvent {
  day: number
  type: EventType
  moonIds: string[]
  label: string
}

// ── Moon size → pixel radius ───────────────────────────────────────────────
export const MOON_RADIUS: Record<string, number> = {
  tiny: 10, small: 15, medium: 22, large: 30,
}

// ── Event metadata ─────────────────────────────────────────────────────────
export const EVENT_META: Record<EventType, { icon: string; color: string; label: string }> = {
  conjunction: { icon: '✦', color: '#c084fc', label: 'Conjunction' },
  opposition:  { icon: '↔', color: '#60a5fa', label: 'Opposition'  },
  fullMoon:    { icon: '🌕', color: '#fde68a', label: 'Full Moon'   },
  newMoon:     { icon: '🌑', color: '#94a3b8', label: 'New Moon'    },
  eclipse:     { icon: '◎', color: '#f87171', label: 'Eclipse'     },
}

// ── Phase math ─────────────────────────────────────────────────────────────
// Returns phase in [0, 1): 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter
export function moonPhase(moon: Moon, day: number): number {
  return (((day / moon.orbitDays) + moon.startPhase) % 1 + 1) % 1
}

// 0 at new moon, 1 at full moon
export function illumination(phase: number): number {
  return 1 - Math.abs(2 * phase - 1)
}

export function illuminationPct(phase: number): number {
  return Math.round(illumination(phase) * 100)
}

export function phaseName(phase: number): string {
  const p = ((phase % 1) + 1) % 1
  if (p < 0.03 || p > 0.97)  return 'New Moon'
  if (p < 0.22)               return 'Waxing Crescent'
  if (p < 0.28)               return 'First Quarter'
  if (p < 0.47)               return 'Waxing Gibbous'
  if (p < 0.53)               return 'Full Moon'
  if (p < 0.72)               return 'Waning Gibbous'
  if (p < 0.78)               return 'Last Quarter'
  if (p < 0.97)               return 'Waning Crescent'
  return 'New Moon'
}

// Days until next full / new moon
export function daysToPhase(moon: Moon, day: number, target: number): number {
  const p = moonPhase(moon, day)
  let diff = target - p
  if (diff <= 0.01) diff += 1
  return Math.max(1, Math.round(diff * moon.orbitDays))
}

// ── Event detection ────────────────────────────────────────────────────────
// Phase "distance" accounting for wrap-around (new moon near both 0 and 1)
function phaseDist(a: number, b: number): number {
  const d = Math.abs(a - b)
  return Math.min(d, 1 - d)
}

// Angular spread among all moons (used for conjunction detection)
function phaseSpread(phases: number[]): number {
  if (phases.length < 2) return 0
  let maxDist = 0
  for (let i = 0; i < phases.length; i++) {
    for (let j = i + 1; j < phases.length; j++) {
      maxDist = Math.max(maxDist, phaseDist(phases[i], phases[j]))
    }
  }
  return maxDist
}

export function findYearEvents(calendar: WorldCalendar, year = 1): CelestialEvent[] {
  const { moons, daysPerYear } = calendar
  const startDay = (year - 1) * daysPerYear
  const endDay   = year * daysPerYear - 1
  const events: CelestialEvent[] = []

  for (let d = startDay; d <= endDay; d++) {
    const phases  = moons.map(m => moonPhase(m, d))
    const phasesP = moons.map(m => moonPhase(m, d - 1)) // previous day
    const phasesN = moons.map(m => moonPhase(m, d + 1)) // next day

    // ── Full moons (local maximum of illumination near 0.5) ───────────────
    moons.forEach((moon, i) => {
      const illum  = illumination(phases[i])
      const illumP = illumination(phasesP[i])
      const illumN = illumination(phasesN[i])
      if (illum > 0.97 && illum >= illumP && illum >= illumN) {
        events.push({ day: d, type: 'fullMoon', moonIds: [moon.id], label: `${moon.name} — Full Moon` })
      }
    })

    // ── New moons (local minimum of dist-to-new-phase) ────────────────────
    moons.forEach((moon, i) => {
      const distNow  = Math.min(phases[i], 1 - phases[i])
      const distPrev = Math.min(phasesP[i], 1 - phasesP[i])
      const distNext = Math.min(phasesN[i], 1 - phasesN[i])
      if (distNow < 0.03 && distNow <= distPrev && distNow <= distNext) {
        events.push({ day: d, type: 'newMoon', moonIds: [moon.id], label: `${moon.name} — New Moon` })
      }
    })

    // ── Conjunction (local min of max pairwise phase spread) ─────────────
    if (moons.length >= 2) {
      const spread  = phaseSpread(phases)
      const spreadP = phaseSpread(phasesP)
      const spreadN = phaseSpread(phasesN)
      if (spread < 0.06 && spread <= spreadP && spread <= spreadN) {
        const moonNames = moons.map(m => m.name).join(' & ')
        events.push({ day: d, type: 'conjunction', moonIds: moons.map(m => m.id), label: `${moonNames} Conjunction` })
      }
    }

    // ── Opposition (2-moon: local max of phaseDist near 0.5) ─────────────
    if (moons.length === 2) {
      const dist  = phaseDist(phases[0], phases[1])
      const distP = phaseDist(phasesP[0], phasesP[1])
      const distN = phaseDist(phasesN[0], phasesN[1])
      if (dist > 0.47 && dist >= distP && dist >= distN) {
        events.push({ day: d, type: 'opposition', moonIds: moons.map(m => m.id), label: `${moons[0].name} & ${moons[1].name} Opposition` })
      }
    }

    // ── Eclipse (solar eclipse: conjunction at new moon — all moons align before the sun) ──
    // Conjunctions alternate between new-moon (solar eclipse) and full-moon alignments.
    // We emit an eclipse only when the conjunction peak falls within new-moon phase.
    if (moons.length >= 2) {
      const allNearNew = phases.every(p => Math.min(p, 1 - p) < 0.06)
      const spread     = phaseSpread(phases)
      const spreadP    = phaseSpread(phasesP)
      const spreadN    = phaseSpread(phasesN)
      // Peak day of conjunction (local spread minimum) while all moons are near new
      if (allNearNew && spread < 0.06 && spread <= spreadP && spread <= spreadN) {
        const moonNames = moons.map(m => m.name).join(' & ')
        events.push({
          day: d, type: 'eclipse', moonIds: moons.map(m => m.id),
          label: `Solar Eclipse — ${moonNames} align before the Sun`,
        })
      }
    }
  }

  // Deduplicate: keep only one event per (type, day)
  const seen = new Set<string>()
  return events
    .filter(e => { const k = `${e.type}-${e.day}`; if (seen.has(k)) return false; seen.add(k); return true })
    .sort((a, b) => a.day - b.day || a.type.localeCompare(b.type))
}

// ── SVG moon phase path (centered at origin, radius r) ────────────────────
// Returns the lit-area path string, or '' for new moon, 'full' for full moon
export function moonPhasePath(r: number, phase: number): string {
  const p = ((phase % 1) + 1) % 1

  if (p < 0.01 || p > 0.99) return ''         // new moon — no lit area

  if (Math.abs(p - 0.5) < 0.01) {
    // Full moon — full circle
    return `M ${-r} 0 A ${r} ${r} 0 1 1 ${r} 0 A ${r} ${r} 0 1 1 ${-r} 0 Z`
  }

  const waxing = p < 0.5
  // Terminator ellipse x-radius: positive = crescent phase, negative = gibbous phase
  const ex     = Math.cos(p * 2 * Math.PI) * r
  const absEx  = Math.abs(ex)

  const outerSweep = waxing ? 1 : 0
  // Crescent: terminator curves away from lit side (opposite sweep)
  // Gibbous:  terminator curves toward lit side (same sweep as outer)
  const innerSweep = waxing
    ? (ex >= 0 ? 0 : 1)   // waxing: crescent=0, gibbous=1
    : (ex <= 0 ? 1 : 0)   // waning: gibbous=1, crescent=0

  if (absEx < 1) {
    // Near quarter — straight line terminator
    return `M 0 ${-r} A ${r} ${r} 0 0 ${outerSweep} 0 ${r} L 0 ${-r} Z`
  }

  return `M 0 ${-r} A ${r} ${r} 0 0 ${outerSweep} 0 ${r} A ${absEx} ${r} 0 0 ${innerSweep} 0 ${-r} Z`
}

// ── Deterministic star positions for sky background ───────────────────────
function seeded(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function generateStars(count: number, width: number, height: number) {
  return Array.from({ length: count }, (_, i) => ({
    x: seeded(i * 3)     * width,
    y: seeded(i * 3 + 1) * height,
    r: seeded(i * 3 + 2) * 1.2 + 0.3,
    opacity: seeded(i * 7 + 5) * 0.5 + 0.3,
  }))
}

// ── Eldoria preset ─────────────────────────────────────────────────────────
export const ELDORIA_CALENDAR: WorldCalendar = {
  id: 'eldoria',
  name: 'Eldoria',
  daysPerYear: 360,
  moons: [
    {
      id: 'luna',
      name: 'Luna',
      orbitDays: 30,
      size: 'large',
      color: '#e2e8f0',
      startPhase: 0,
      description: 'The great silver moon. Governs tides, seasons, and divine magic.',
    },
    {
      id: 'selene',
      name: 'Selene',
      orbitDays: 50,
      size: 'small',
      color: '#93c5fd',
      startPhase: 0,
      description: 'The smaller blue moon. Governs arcane currents and prophecy.',
    },
  ],
  eventEffects: {
    conjunction: {
      boons: [
        'Healing spells restore an additional 1d8 hit points',
        'Once before the next conjunction, a creature may reroll one failed d20',
      ],
      pitfalls: [
        'Wild magic surges trigger on a 1–3 (instead of 1) on the Wild Magic table',
        'Restless night: werewolves, fiends, and undead are more aggressive',
      ],
    },
    opposition: {
      boons: [
        "Luna's Favor: creatures gain temporary HP equal to 1d10 + character level at dusk",
        "Selene's Insight: advantage on Insight and Arcana checks until dawn",
        'Sharper senses: advantage on Perception checks that rely on sight',
      ],
      pitfalls: [
        'Frayed focus: concentration checks require a DC 10 save each turn, even without damage',
        'Volatile emotions: social interactions are unpredictable — advantage AND disadvantage',
      ],
    },
    fullMoon: {
      boons: [
        "Luna's light: bright moonlight extends to 80 ft even near open windows indoors",
      ],
      pitfalls: [
        'Lycanthropes must succeed on a DC 15 Wisdom saving throw or be forced to transform',
      ],
    },
    newMoon: {
      boons: [
        'Shadows deepen: rogues and rangers have advantage on Stealth checks outdoors',
      ],
      pitfalls: [
        'Blindsight fails: creatures relying on moonlight for navigation move at half speed outdoors',
      ],
    },
    eclipse: {
      boons: [
        'A rare celestial omen: divine and arcane portents occur; NPCs may offer cryptic prophecy',
      ],
      pitfalls: [
        'Undead regain 1d6 hit points at the start of their turns for the duration of the eclipse',
      ],
    },
  },
}

export const BLANK_CALENDAR: WorldCalendar = {
  id: 'custom',
  name: 'My World',
  daysPerYear: 360,
  moons: [
    { id: 'moon1', name: 'Aether', orbitDays: 28, size: 'large', color: '#fde68a', startPhase: 0, description: '' },
  ],
  eventEffects: {
    conjunction: { boons: [], pitfalls: [] },
    opposition:  { boons: [], pitfalls: [] },
    fullMoon:    { boons: [], pitfalls: [] },
    newMoon:     { boons: [], pitfalls: [] },
    eclipse:     { boons: [], pitfalls: [] },
  },
}
