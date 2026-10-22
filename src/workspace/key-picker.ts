// What the key picker and the Explore panel show, read from the theory core.
// No theory lives here; this only arranges what the core returns for display.
import {
  allScales,
  commonScales,
  degreeLabel,
  degreeName,
  enharmonicKey,
  formatInterval,
  formatNote,
  getScale,
  intervalBetween,
  keyInMode,
  keySignature,
  parentKey,
  parseNote,
  pickerTonics,
  pitchClass,
  scaleNotes,
  scaleSteps,
  stepLabel,
  type Key,
  type Note,
  type Scale,
} from '../theory'

export const DEFAULT_KEY: Key = {
  tonic: { letter: 'C', accidental: 0 },
  mode: 'major',
}

export type Option = { value: string; label: string }

function sameNote(a: Note, b: Note): boolean {
  return a.letter === b.letter && a.accidental === b.accidental
}

// The picker's tonics for the key's scale. A swapped spelling the picker
// doesn't list (C♯ major) takes the place of the one it swapped from.
export function tonicOptions(key: Key): Option[] {
  const tonics = pickerTonics(key.mode)
  const listed = tonics.some((t) => sameNote(t, key.tonic))
  const pitch = pitchClass(key.tonic)
  const shown = listed
    ? tonics
    : tonics.flatMap((t, i) => {
        if (pitchClass(t) !== pitch) return [t]
        const first = tonics.findIndex((u) => pitchClass(u) === pitch)
        return i === first ? [key.tonic] : []
      })
  return shown.map((t) => ({
    value: formatNote(t, { ascii: true }),
    label: formatNote(t),
  }))
}

export function tonicValue(key: Key): string {
  return formatNote(key.tonic, { ascii: true })
}

export function withTonic(key: Key, value: string): Key {
  const tonic = parseNote(value)
  return tonic ? { tonic, mode: key.mode } : key
}

export function withScale(key: Key, mode: string): Key {
  return getScale(mode) ? keyInMode(key, mode) : key
}

export type ScaleGroup = { label: string; scales: Option[] }

const FAMILY_LABELS: Record<string, string> = {
  'major-modes': 'Major and its modes',
  'harmonic-minor-modes': 'Harmonic minor and its modes',
  'melodic-minor-modes': 'Melodic minor and its modes',
  pentatonic: 'Pentatonic',
  blues: 'Blues',
  symmetrical: 'Symmetrical',
  bebop: 'Bebop',
  other: 'Wider dictionary',
}

const option = (scale: Scale): Option => ({
  value: scale.id,
  label: scale.name,
})

// Common scales first; with "More…" open, every scale by family as well. A
// scale chosen from "More…" stays listed when it is closed again.
export function scaleGroups(showAll: boolean, current: string): ScaleGroup[] {
  const common = commonScales()
  const groups: ScaleGroup[] = [{ label: 'Common', scales: common.map(option) }]
  const isCommon = common.some((s) => s.id === current)
  if (!showAll) {
    const chosen = getScale(current)
    if (chosen && !isCommon)
      groups.push({ label: 'Chosen', scales: [option(chosen)] })
    return groups
  }
  const byFamily = new Map<string, Scale[]>()
  for (const scale of allScales()) {
    if (common.includes(scale)) continue
    byFamily.set(scale.family, [...(byFamily.get(scale.family) ?? []), scale])
  }
  for (const [family, scales] of byFamily) {
    groups.push({
      label: FAMILY_LABELS[family] ?? family,
      scales: scales.map(option),
    })
  }
  return groups
}

export function keyName(key: Key): string {
  return `${formatNote(key.tonic)} ${getScale(key.mode)?.name ?? key.mode}`
}

// The enharmonic swap button's target, or undefined when there is none.
export const swapTarget = enharmonicKey

// '2 sharps (D major)', 'no sharps or flats', or undefined for a scale that
// isn't a mode and so has no signature of its own.
export function signatureText(key: Key): string | undefined {
  const n = keySignature(key)
  if (n === undefined) return undefined
  const count =
    n === 0
      ? 'no sharps or flats'
      : `${Math.abs(n)} ${n > 0 ? 'sharp' : 'flat'}${Math.abs(n) > 1 ? 's' : ''}`
  const parent = parentKey(key)
  const own = parent.mode === key.mode && sameNote(parent.tonic, key.tonic)
  return own ? count : `${count}, from ${keyName(parent)}`
}

export type Degree = {
  note: string
  label: string
  interval: string
  name: string
}

export type ScaleView = {
  degrees: Degree[]
  steps: string[]
  semitones: number[]
}

export function scaleView(key: Key): ScaleView {
  const notes = scaleNotes(key.tonic, key.mode)
  const semitones = scaleSteps(key.mode)
  return {
    degrees: notes.map((note) => ({
      note: formatNote(note),
      label: degreeLabel(key.tonic, note),
      interval: formatInterval(intervalBetween(key.tonic, note)),
      name: degreeName(key.tonic, note),
    })),
    steps: semitones.map(stepLabel),
    semitones,
  }
}

const STORAGE_KEY = 'co-writer:key'

// The last key chosen, remembered in this browser; C major if there is none.
export function loadKey(): Key {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    const tonic = parseNote(saved?.tonic ?? '')
    if (tonic && getScale(saved.mode)) return { tonic, mode: saved.mode }
  } catch {
    // No storage, or something unreadable in it: start from the default.
  }
  return DEFAULT_KEY
}

export function saveKey(key: Key): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tonic: tonicValue(key), mode: key.mode }),
    )
  } catch {
    // Storage blocked: the key just isn't remembered.
  }
}
