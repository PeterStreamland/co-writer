// The Voice tab's state (Phase 5 task 5, SPEC 8): which lenses are side by
// side, up to four of them (none at all is fine, David's choice), Classical
// and Rock by default; the progression
// as the lenses read it; and how a column's voicings play. No theory lives
// here.
import {
  ALL_LENSES,
  chordKey,
  keyName,
  seededRandom,
  type ChordName,
  type Key,
  type Lens,
  type LensStep,
  type LensVoicing,
  type MeterMap,
} from '../theory'
import {
  addAllAfter,
  keyAfter,
  keyAt,
  pathNodes,
  setKeyChangeAt,
  type AddOptions,
  timingOf,
  type Progression,
} from '../sketch/progression'
import { DEFAULT_TIME, type Dur } from '../sketch/time'

export const MAX_LENSES = 4
export const DEFAULT_LENSES: Lens[] = ['classical', 'rock']

const STORAGE_KEY = 'co-writer:lenses'

// Turns a lens on or off, keeping at most four and the order of
// ALL_LENSES.
export function toggleLens(chosen: Lens[], lens: Lens): Lens[] {
  const on = chosen.includes(lens)
  if (!on && chosen.length >= MAX_LENSES) return chosen
  const next = on ? chosen.filter((l) => l !== lens) : [...chosen, lens]
  return ALL_LENSES.filter((l) => next.includes(l))
}

// The progression's active path as lens steps, each chord in its own key
// (after any key change), with its length in the bars for playback.
export function lensSteps(
  progression: Progression,
  sectionKey: Key,
  time: MeterMap = DEFAULT_TIME,
): (LensStep & { length: Dur })[] {
  const timing = timingOf(progression, time)
  return pathNodes(progression).map((n, i) => ({
    key: keyAt(progression, i, sectionKey),
    chord: n.chord,
    length: timing[i].length,
  }))
}

// The chance for a lens's take (David's request: Another on every lens):
// from the chords, the lens and the take, so the same take plays the same;
// none for take 0, the lens's best.
export function takeRandom(
  steps: LensStep[],
  lens: Lens,
  take: number,
): (() => number) | undefined {
  if (take === 0) return undefined
  const text = `${lens} ${take} ${steps.map((s) => chordKey(s.chord)).join(' ')}`
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  }
  return seededRandom(hash >>> 0)
}

// A lens's voicings put into the progression (David's request): as a new
// branch from the start, leaving the chords as they were one tap away on
// the first chord's arrows, or added after the last chord. Each chord keeps
// its length and any key change, and its voicing, so it plays as the lens
// voiced it. Added on the end after a key change, the last chord leads back
// to the key the original started in.
export function addLensVoicings(
  progression: Progression,
  sectionKey: Key,
  voicings: (LensVoicing & { frets?: (number | null)[] })[],
  instrument: 'guitar' | 'keyboard',
  where: 'branch' | 'end',
): { progression: Progression; select: number } {
  const path = pathNodes(progression)
  const chords: ChordName[] = voicings.map((v) => v.chord)
  const options: AddOptions[] = voicings.map((v, i) => {
    const option: AddOptions = {
      voicing: { instrument, notes: v.notes },
      length: path[i].length,
      keyChange: path[i].keyChange,
    }
    if (v.frets && instrument === 'guitar') option.voicing!.frets = v.frets
    return option
  })
  if (where === 'branch') {
    return {
      progression: addAllAfter(progression, -1, chords, options),
      select: chords.length - 1,
    }
  }
  const last = path.length - 1
  const start = keyAt(progression, 0, sectionKey)
  const back =
    keyName(keyAfter(progression, last, sectionKey)) !== keyName(start)
      ? setKeyChangeAt(progression, last, start)
      : progression
  return {
    progression: addAllAfter(back, last, chords, options),
    select: last + chords.length,
  }
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
      saved.length <= MAX_LENSES &&
      saved.every((l) => ALL_LENSES.includes(l))
    ) {
      return ALL_LENSES.filter((l) => saved.includes(l))
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
