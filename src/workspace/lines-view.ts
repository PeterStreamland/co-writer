// The Lines tab's state (PLAN Phase 6 task 3): the progression as the line
// modes read it (each chord in its key, where it falls in the bars), the
// mode chosen, remembered in this browser, and how tags read. No theory
// lives here.
import {
  LINE_DENSITIES,
  LINE_MODES,
  fillBar,
  lineFor,
  lineSeed,
  rangeOf,
  seededRandom,
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

// A bar's notes edited by hand in the Lines tab (David's request), which it
// keeps when its chord changes. Each line keeps its own.
export type BarEdit = { notes?: BarNote[] }

// A line's bars edited by hand, by chord node id.
export type LineEdits = Record<string, BarEdit>

// What a bar plays whatever the line (David's request: changing the line
// keeps it): how many notes, and how many times it has been refreshed.
export type BarSetting = { count?: number; roll?: number }

// The bars' settings, by chord node id.
export type LineBars = Record<string, BarSetting>

// Each line's edits are kept apart, so trying another mode and coming
// back finds them as they were: by mode, and the Wildcard's roll.
export function editKey(mode: LineModeId, roll: number): string {
  return `${mode} ${mode === 'wildcard' ? roll : 0}`
}

// The chance for a refreshed bar: from the chords, the line's roll, the
// bar's refreshes and where it is, so the same refresh plays the same.
function barRandom(
  steps: LineStep[],
  roll: number,
  barRoll: number,
  index: number,
): () => number {
  return seededRandom(
    lineSeed(steps) + 7919 * roll + 104729 * barRoll + 31 * index,
  )
}

// A bar with its own number of notes or refreshed, filled from the mode's
// line; none when it has neither.
export function filledBar(
  line: LineNote[],
  steps: LineStep[],
  index: number,
  mode: LineModeId,
  roll: number,
  setting: BarSetting | undefined,
): BarNote[] | undefined {
  if (!setting?.count && !setting?.roll) return undefined
  const lineMode = LINE_MODES.find((m) => m.id === mode)
  if (!lineMode) return undefined
  const count = setting.count ?? line.filter((n) => n.step === index).length
  return fillBar(
    line,
    steps,
    index,
    mode,
    rangeOf(lineMode),
    count,
    setting.roll ? barRandom(steps, roll, setting.roll, index) : undefined,
  )
}

// The line as the tab plays it: the mode (at the Wildcard's roll) with the
// line's notes a bar, each bar with its own count or refresh, and bars
// edited by hand in place.
export function editedLine(
  steps: LineStep[],
  nodes: string[],
  mode: LineModeId,
  roll: number,
  density: LineDensity | undefined,
  bars: LineBars,
  edits: LineEdits,
): LineNote[] {
  const dense = steps.map((s) => ({ ...s, density }))
  const line = lineFor(mode, dense, seededRandom(lineSeed(steps) + roll)).notes
  const own: Record<number, BarNote[]> = {}
  nodes.forEach((n, i) => {
    const notes =
      edits[n]?.notes ?? filledBar(line, dense, i, mode, roll, bars[n])
    if (notes) own[i] = notes
  })
  return withBars(line, dense, own)
}

// A line recipe for a row or one of its bars, leaving out what isn't set.
export function lineRecipe(
  mode: LineModeId,
  roll: number,
  density?: LineDensity,
  bar?: BarSetting,
  notes?: BarNote[],
): PartRecipe {
  return {
    kind: 'line',
    mode,
    roll: mode === 'wildcard' ? roll : 0,
    ...(density ? { density } : {}),
    ...(bar?.count ? { count: bar.count } : {}),
    ...(bar?.roll ? { seed: bar.roll } : {}),
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
