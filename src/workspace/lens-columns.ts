// The Voice tab's state (Phase 5 task 5, SPEC 8): which lenses are side by
// side, two to four of them, Rock and Classical by default; the progression
// as the lenses read it; and how a column's voicings play. No theory lives
// here.
import { LENSES, type Lens, type LensStep, type Key } from '../theory'
import {
  keyAt,
  lengthOf,
  pathNodes,
  type Progression,
} from '../sketch/progression'
import type { Dur } from '../sketch/time'

export const MIN_LENSES = 2
export const MAX_LENSES = 4
export const DEFAULT_LENSES: Lens[] = ['classical', 'rock']

const STORAGE_KEY = 'co-writer:lenses'

// Turns a lens on or off, keeping two to four and the order of LENSES.
export function toggleLens(chosen: Lens[], lens: Lens): Lens[] {
  const on = chosen.includes(lens)
  if (on && chosen.length <= MIN_LENSES) return chosen
  if (!on && chosen.length >= MAX_LENSES) return chosen
  const next = on ? chosen.filter((l) => l !== lens) : [...chosen, lens]
  return LENSES.filter((l) => next.includes(l))
}

// The progression's active path as lens steps, each chord in its own key
// (after any key change), with its length for playback.
export function lensSteps(
  progression: Progression,
  sectionKey: Key,
): (LensStep & { length: Dur })[] {
  return pathNodes(progression).map((n, i) => ({
    key: keyAt(progression, i, sectionKey),
    chord: n.chord,
    length: lengthOf(n),
  }))
}

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

// The lenses last chosen in this browser, or the default.
export function loadLenses(store = storage()): Lens[] {
  try {
    const saved: unknown = JSON.parse(store?.getItem(STORAGE_KEY) ?? 'null')
    if (
      Array.isArray(saved) &&
      saved.length >= MIN_LENSES &&
      saved.length <= MAX_LENSES &&
      saved.every((l) => LENSES.includes(l))
    ) {
      return LENSES.filter((l) => saved.includes(l))
    }
  } catch {
    // Unreadable or blocked storage: use the default.
  }
  return DEFAULT_LENSES
}

export function saveLenses(lenses: Lens[], store = storage()): void {
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify(lenses))
  } catch {
    // Storage blocked: the choice lasts for this visit only.
  }
}
