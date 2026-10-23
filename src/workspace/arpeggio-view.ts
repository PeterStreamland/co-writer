// The Arpeggio tab's state (PLAN Phase 6 task 2): the choices, remembered
// in this browser, and the arpeggio they make for a chord: its tones, its
// notes in range, its rhythm over the chord's length and, on guitar, where
// each note sits. No theory lives here.
import {
  ARPEGGIO_LEVELS,
  ARPEGGIO_PATTERNS,
  ARPEGGIO_RATES,
  LENS_SETTINGS,
  arpeggioName,
  arpeggioNotes,
  arpeggioRhythm,
  arpeggioTones,
  chordSymbol,
  lensColours,
  midiNumber,
  ownTones,
  type ArpeggioEvent,
  type ArpeggioLevel,
  type ArpeggioNote,
  type ArpeggioTones,
  type ChordName,
  type Dur,
  type Key,
  type Lens,
  type Note,
} from '../theory'
import {
  arpeggioPositions,
  arpeggioRun,
  type Spot,
} from '../instruments/arpeggio-guitar'
import type { Guitar } from '../instruments/guitar'

// What the arpeggio stacks: a level (triad to 13th) or a lens's colour.
export const ARPEGGIO_CHOICES: { id: string; label: string }[] = [
  ...ARPEGGIO_LEVELS.map((l) => ({ id: l.id, label: l.label })),
  ...Object.values(LENS_SETTINGS)
    .filter((s) => Object.keys(s.recolour).length > 0)
    .map((s) => ({ id: `lens:${s.id}`, label: `${s.name} colours` })),
]

export type GuitarMode = 'position' | 'run'

export type ArpeggioSettings = {
  choice: string
  pattern: string
  rate: string
  octaves: number
  // The octave the root starts in; undefined for the instrument's default.
  octave?: number
  guitar: GuitarMode
}

export const DEFAULT_ARPEGGIO: ArpeggioSettings = {
  choice: 'seventh',
  pattern: 'up',
  rate: '8ths',
  octaves: 2,
  guitar: 'position',
}

export const OCTAVE_CHOICES = [1, 2, 3]
export const START_OCTAVES = [1, 2, 3, 4, 5]

// The arpeggio for a chord, as the tab shows and plays it.
export type ArpeggioPlan = ArpeggioTones & {
  name: string
  notes: ArpeggioNote[]
  events: ArpeggioEvent[]
  // On guitar: each position that plays every note, and the run across the
  // neck; each a spot per note.
  positions: Spot[][]
  run?: Spot[]
}

// The root's starting octave: the setting, or C3-ish on keyboard and the
// lowest octave the guitar's low string reaches.
export function startOctave(
  root: Note,
  settings: ArpeggioSettings,
  guitar?: Guitar,
): number {
  if (settings.octave !== undefined) return settings.octave
  if (!guitar) return 3
  const lowest = Math.min(...guitar.strings.map((s) => midiNumber(s) ?? 127))
  for (const octave of START_OCTAVES) {
    if ((midiNumber({ ...root, octave }) ?? 0) >= lowest) return octave
  }
  return 3
}

function tonesFor(
  chord: ChordName,
  key: Key,
  choice: string,
): ArpeggioTones & { name: string } {
  if (choice.startsWith('lens:')) {
    const lens = choice.slice(5) as Lens
    const colour = lensColours(lens, key, chord)
      .slice(1)
      .sort((a, b) => a.cost - b.cost)[0]
    const coloured = {
      root: chord.root,
      quality: colour?.quality ?? chord.quality,
    }
    return { tones: ownTones(coloured), left: [], name: chordSymbol(coloured) }
  }
  const level = ARPEGGIO_LEVELS.some((l) => l.id === choice)
    ? (choice as ArpeggioLevel)
    : 'seventh'
  const found = arpeggioTones(chord, key, level)
  const named = arpeggioName(chord, found)
  return {
    ...found,
    name:
      named ??
      `${chordSymbol(chord)} (${found.tones.map((t) => t.label).join(' ')})`,
  }
}

export function planArpeggio(
  chord: ChordName,
  key: Key,
  settings: ArpeggioSettings,
  length: Dur,
  guitar?: Guitar,
): ArpeggioPlan {
  const { tones, left, name } = tonesFor(chord, key, settings.choice)
  const low = {
    ...chord.root,
    octave: startOctave(chord.root, settings, guitar),
  }
  const notes = arpeggioNotes(tones, low, settings.octaves)
  const pattern =
    ARPEGGIO_PATTERNS.find((p) => p.id === settings.pattern) ??
    ARPEGGIO_PATTERNS[0]
  const rate = (
    ARPEGGIO_RATES.find((r) => r.id === settings.rate) ?? ARPEGGIO_RATES[0]
  ).note
  const events = arpeggioRhythm(notes.length, pattern, rate, length)
  const midis = notes.map((n) => n.midi)
  return {
    tones,
    left,
    name,
    notes,
    events,
    positions: guitar
      ? arpeggioPositions(guitar, midis).map((p) => p.spots)
      : [],
    run: guitar ? arpeggioRun(guitar, midis) : undefined,
  }
}

const STORAGE_KEY = 'co-writer:arpeggio'

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function loadArpeggio(store = storage()): ArpeggioSettings {
  try {
    const saved: unknown = JSON.parse(store?.getItem(STORAGE_KEY) ?? 'null')
    if (typeof saved !== 'object' || saved === null) return DEFAULT_ARPEGGIO
    const s = { ...DEFAULT_ARPEGGIO, ...(saved as Partial<ArpeggioSettings>) }
    const ok =
      ARPEGGIO_CHOICES.some((c) => c.id === s.choice) &&
      ARPEGGIO_PATTERNS.some((p) => p.id === s.pattern) &&
      ARPEGGIO_RATES.some((r) => r.id === s.rate) &&
      OCTAVE_CHOICES.includes(s.octaves) &&
      (s.octave === undefined || START_OCTAVES.includes(s.octave)) &&
      (s.guitar === 'position' || s.guitar === 'run')
    return ok ? s : DEFAULT_ARPEGGIO
  } catch {
    // Unreadable or blocked storage: use the default.
  }
  return DEFAULT_ARPEGGIO
}

export function saveArpeggio(
  settings: ArpeggioSettings,
  store = storage(),
): void {
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage blocked: the choice lasts for this visit only.
  }
}
