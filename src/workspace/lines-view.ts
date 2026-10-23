// The Lines tab's state (PLAN Phase 6 task 3): the progression as the line
// modes read it (each chord in its key, where it falls in the bars), the
// mode chosen, remembered in this browser, and how tags read. No theory
// lives here.
import {
  LINE_MODES,
  type Key,
  type LineModeId,
  type LineStep,
  type LineTag,
  type Placement,
} from '../theory'
import { keyAt, pathNodes, type Progression } from '../sketch/progression'

export const DEFAULT_LINE_MODE: LineModeId = 'walking'

export const TAG_LABELS: Record<LineTag, string> = {
  'chord-tone': 'chord tone',
  passing: 'passing',
  neighbour: 'neighbour',
  approach: 'approach',
  pedal: 'pedal',
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

const STORAGE_KEY = 'co-writer:line-mode'

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
