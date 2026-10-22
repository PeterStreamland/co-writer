// The voicing lenses on guitar (PLAN Phase 5 task 4, SPEC 8): each lens
// takes its shapes from the fingering search (Phase 3), so every one is
// playable, then the theory core's search picks one per chord for the
// smoothest, best-fitting progression, the lens's way.
import {
  ALL_LENSES,
  LENSES,
  chooseVoicings,
  lensColours,
  lensVoicings,
  wildcardPick,
  type CoreLens,
  midiNumber,
  nameByLowest,
  pitchClass,
  type ChordName,
  type Key,
  type Lens,
  type LensChoice,
  type LensStep,
  type LensVoicing,
  type Note,
} from '../theory'
import { findFingerings } from './fingering'
import type { Guitar } from './guitar'
import { fretNotes } from './fret-notes'
import { FRETTED_LENS, GUITAR_LENSES } from './lens-guitar-data'

// The cost of a shape whose lowest note isn't the bass meant.
const MOVED_BASS_COST = 3
// The easiest shapes kept for a chord no lens shape fits.
const FALLBACK_KEEP = 40

// A lens voicing on guitar keeps its frets and each string's note, low
// string first (null for a muted string), for its chord box.
export type GuitarLensVoicing = LensVoicing & {
  frets: (number | null)[]
  strings: (Note | null)[]
}

// Every guitar shape a lens offers for a chord in a key, its favourites
// first.
export function guitarLensVoicings(
  guitar: Guitar,
  lens: Lens,
  key: Key,
  chord: ChordName,
  random: () => number = Math.random,
): GuitarLensVoicing[] {
  if (lens === 'wildcard') {
    return wildcardPick(
      ALL_LENSES.filter((l) => l !== 'wildcard'),
      (other) => guitarLensVoicings(guitar, other, key, chord),
      random,
    )
  }
  if (!isCore(lens)) return frettedVoicings(guitar, lens, key, chord)
  const settings = GUITAR_LENSES[lens]
  const found: GuitarLensVoicing[] = []
  for (const shape of settings.shapes) {
    const colours = shape.power
      ? [{ quality: '5', cost: 0 }]
      : lensColours(lens, key, chord)
    for (const colour of colours) {
      const voiced: ChordName = { ...chord, quality: colour.quality }
      if (shape.power) delete voiced.bass
      let fingerings
      try {
        fingerings = findFingerings(guitar, voiced, {
          openStrings: shape.openStrings,
          omitFifth: shape.omitFifth,
        })
      } catch {
        continue // a power chord on a chord with no perfect 5th
      }
      // The note meant to sound lowest: the root of a power chord, else the
      // chord's bass as written.
      const bass = pitchClass(
        shape.power ? chord.root : (chord.bass ?? chord.root),
      )
      for (const f of fingerings) {
        const notes = f.notes.filter((n): n is Note => n !== null)
        if (notes.length < shape.notes[0] || notes.length > shape.notes[1]) {
          continue
        }
        // A lower note on a higher string (an open string under a fretted
        // one) can put another note at the bottom. Classical keeps the bass
        // as written; the other lenses may take such a shape, named for
        // what sounds lowest (C5/G), at a cost.
        const lowest = notes.reduce((a, b) =>
          (midiNumber(b) as number) < (midiNumber(a) as number) ? b : a,
        )
        const moved = pitchClass(lowest) !== bass
        if (moved && lens === 'classical') continue
        found.push({
          chord: nameByLowest(voiced, notes),
          notes,
          frets: f.frets,
          strings: f.notes,
          form: shape.id,
          label: shape.label,
          cost:
            shape.cost +
            colour.cost +
            settings.ease * (100 - f.score) +
            (moved ? MOVED_BASS_COST : 0),
        })
      }
    }
  }
  return found
    .map((v, i) => ({ v, i }))
    .sort((a, b) => a.v.cost - b.v.cost || a.i - b.i)
    .slice(0, settings.keep)
    .map(({ v }) => v)
}

// An experimental lens on guitar: its keyboard voicings, fretted as they
// are or an octave up or down, where the hand can reach them.
function frettedVoicings(
  guitar: Guitar,
  lens: Lens,
  key: Key,
  chord: ChordName,
): GuitarLensVoicing[] {
  const tried = lensVoicings(lens, key, chord)
    .map((v, i) => ({ v, i }))
    .sort((a, b) => a.v.cost - b.v.cost || a.i - b.i)
    .slice(0, FRETTED_LENS.tried)
  const bottom = Math.min(...guitar.strings.map((s) => midiNumber(s) as number))
  return tried.flatMap(({ v }) => {
    const shifted = [0, -1, 1].map((shift) =>
      v.notes.map((n) => ({ ...n, octave: (n.octave as number) + shift })),
    )
    // A drone or bass below the guitar's lowest string, up an octave.
    const raised = v.notes
      .map((n) =>
        (midiNumber(n) as number) < bottom
          ? { ...n, octave: (n.octave as number) + 1 }
          : n,
      )
      .sort((a, b) => (midiNumber(a) as number) - (midiNumber(b) as number))
    // The same with everything above the lowest note an octave higher,
    // where the hand can hold a low drone and the chord together.
    const opened = raised.map((n, i) =>
      i === 0 ? n : { ...n, octave: (n.octave as number) + 1 },
    )
    for (const notes of [...shifted, raised, opened]) {
      if (new Set(notes.map((n) => midiNumber(n))).size !== notes.length) {
        continue
      }
      const [best] = fretNotes(guitar, notes, { most: 1 })
      if (best) {
        return [
          {
            ...v,
            notes,
            frets: best.frets,
            strings: best.strings,
            cost: v.cost + FRETTED_LENS.ease * best.cost,
          },
        ]
      }
    }
    return []
  })
}

const isCore = (lens: Lens): lens is CoreLens =>
  (LENSES as Lens[]).includes(lens)

// A progression voiced on guitar through a lens. The Wildcard draws on
// chance, from `random`.
export function voiceProgressionOnGuitar(
  guitar: Guitar,
  lens: Lens,
  steps: LensStep[],
  random: () => number = Math.random,
): LensChoice<GuitarLensVoicing>[] {
  const candidates = steps.map((s) =>
    guitarLensVoicings(guitar, lens, s.key, s.chord, random),
  )
  // A chord with no shape in the lens falls back to its easiest shapes.
  const filled = candidates.map((list, i) =>
    list.length
      ? list
      : findFingerings(guitar, steps[i].chord)
          .slice(0, FALLBACK_KEEP)
          .map((f) => ({
            chord: steps[i].chord,
            notes: f.notes.filter((n): n is Note => n !== null),
            frets: f.frets,
            strings: f.notes,
            form: 'as written',
            label: 'as written',
            cost: 10 + 0.1 * (100 - f.score),
          })),
  )
  return chooseVoicings(lens, steps, filled)
}
