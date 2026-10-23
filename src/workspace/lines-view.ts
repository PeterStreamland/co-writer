// The Lines tab's state (PLAN Phase 6 task 3): the progression as the line
// modes read it (each chord in its key, where it falls in the bars), the
// mode chosen, remembered in this browser, and how tags read. No theory
// lives here.
import {
  LINE_DENSITIES,
  LINE_MODES,
  lineFor,
  lineSeed,
  seededRandom,
  slotsOf,
  withBars,
  type BarNote,
  type Key,
  type LineDensity,
  type LineModeId,
  type LineNote,
  type LineStep,
  type LineTag,
  type Placement,
} from '../theory'
import type { PartRecipe } from '../sketch/parts'
import { keyAt, pathNodes, type Progression } from '../sketch/progression'

export const DEFAULT_LINE_MODE: LineModeId = 'walking'

export const TAG_LABELS: Record<LineTag, string> = {
  'chord-tone': 'chord tone',
  passing: 'passing',
  neighbour: 'neighbour',
  approach: 'approach',
  pedal: 'pedal',
  free: 'your own',
  chromatic: 'chromatic',
}

// The active path's chords, each in its own key and place in the bars.
export function lineSteps(
  progression: Progression,
  sectionKey: Key,
  timing: Placement[],
): LineStep[] {
  return pathNodes(progression).map((n, i) => ({
    chord: n.chord,
    key: keyAt(progression, i, sectionKey),
    placed: timing[i],
  }))
}

// A tone's interval number from its label, for colouring it on the
// instrument: R is 1, ♭7 is 7; a note outside the chord counts as an
// extension.
export function labelNumber(label: string, chordTone: boolean): number {
  if (!chordTone) return 99
  if (label === 'R') return 1
  return Number(/\d+$/.exec(label)?.[0] ?? 99)
}

// What a bar of the Lines tab has of its own (David's request): how many
// notes, and notes edited by hand, which it keeps when its chord changes.
export type BarEdit = { density?: LineDensity; notes?: BarNote[] }

// A line's bars of their own, by chord node id.
export type LineEdits = Record<string, BarEdit>

// Each line's edits are kept apart, so trying another mode and coming
// back finds them as they were: by mode, and the Wildcard's roll.
export function editKey(mode: LineModeId, roll: number): string {
  return `${mode} ${mode === 'wildcard' ? roll : 0}`
}

// The chords with how many notes each plays: the bar's own, else the
// line's.
export function densitySteps(
  steps: LineStep[],
  nodes: string[],
  density: LineDensity | undefined,
  edits: LineEdits,
): LineStep[] {
  return steps.map((s, i) => ({
    ...s,
    density: edits[nodes[i]]?.density ?? density,
  }))
}

// The line as the tab plays it: the mode (at the Wildcard's roll), each bar
// with its own number of notes, and bars edited by hand in place.
export function editedLine(
  steps: LineStep[],
  nodes: string[],
  mode: LineModeId,
  roll: number,
  density: LineDensity | undefined,
  edits: LineEdits,
): LineNote[] {
  const dense = densitySteps(steps, nodes, density, edits)
  const line = lineFor(mode, dense, seededRandom(lineSeed(steps) + roll))
  const bars: Record<number, BarNote[]> = {}
  nodes.forEach((n, i) => {
    const notes = edits[n]?.notes
    if (notes) bars[i] = notes
  })
  return withBars(line.notes, dense, bars)
}

// The level for a bar with fewer (-1) or more (+1) notes than it has: the
// level whose slots come nearest the count on that side, or none.
export function densityStep(
  step: LineStep,
  count: number,
  dir: -1 | 1,
): LineDensity | undefined {
  const levels = LINE_DENSITIES.map((d) => ({
    id: d.id,
    count: slotsOf(step.placed, d.id).length,
  })).filter((l) => (dir > 0 ? l.count > count : l.count < count))
  const pick = dir > 0 ? levels[0] : levels.at(-1)
  return pick?.id
}

// A line recipe for a row or one of its bars, leaving out what isn't set.
export function lineRecipe(
  mode: LineModeId,
  roll: number,
  density?: LineDensity,
  notes?: BarNote[],
): PartRecipe {
  return {
    kind: 'line',
    mode,
    roll: mode === 'wildcard' ? roll : 0,
    ...(density ? { density } : {}),
    ...(notes ? { notes } : {}),
  }
}

const STORAGE_KEY = 'co-writer:line-mode'
const DENSITY_KEY = 'co-writer:line-density'

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function loadLineMode(store = storage()): LineModeId {
  try {
    const saved = store?.getItem(STORAGE_KEY)
    const mode = LINE_MODES.find((m) => m.id === saved)
    if (mode) return mode.id
  } catch {
    // Unreadable or blocked storage: use the default.
  }
  return DEFAULT_LINE_MODE
}

export function saveLineMode(mode: LineModeId, store = storage()): void {
  try {
    store?.setItem(STORAGE_KEY, mode)
  } catch {
    // Storage blocked: the choice lasts for this visit only.
  }
}

export function loadLineDensity(store = storage()): LineDensity | undefined {
  try {
    const saved = store?.getItem(DENSITY_KEY)
    return LINE_DENSITIES.find((d) => d.id === saved)?.id
  } catch {
    return undefined
  }
}

export function saveLineDensity(
  density: LineDensity | undefined,
  store = storage(),
): void {
  try {
    if (density) store?.setItem(DENSITY_KEY, density)
    else store?.removeItem(DENSITY_KEY)
  } catch {
    // Storage blocked: the choice lasts for this visit only.
  }
}
