// The voicing lenses on guitar (PLAN Phase 5 task 4, SPEC 8): each lens
// takes its shapes from the fingering search (Phase 3), so every one is
// playable, then the theory core's search picks one per chord for the
// smoothest, best-fitting progression, the lens's way.
import {
  chooseVoicings,
  lensColours,
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
import { GUITAR_LENSES } from './lens-guitar-data'

// A lens voicing on guitar keeps its frets, low string first.
export type GuitarLensVoicing = LensVoicing & { frets: (number | null)[] }

// Every guitar shape a lens offers for a chord in a key, its favourites
// first.
export function guitarLensVoicings(
  guitar: Guitar,
  lens: Lens,
  key: Key,
  chord: ChordName,
): GuitarLensVoicing[] {
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
      for (const f of fingerings) {
        const notes = f.notes.filter((n): n is Note => n !== null)
        if (notes.length < shape.notes[0] || notes.length > shape.notes[1]) {
          continue
        }
        found.push({
          chord: voiced,
          notes,
          frets: f.frets,
          form: shape.id,
          label: shape.label,
          cost: shape.cost + colour.cost + settings.ease * (100 - f.score),
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

// A progression voiced on guitar through a lens.
export function voiceProgressionOnGuitar(
  guitar: Guitar,
  lens: Lens,
  steps: LensStep[],
): LensChoice<GuitarLensVoicing>[] {
  const candidates = steps.map((s) =>
    guitarLensVoicings(guitar, lens, s.key, s.chord),
  )
  // A chord with no shape in the lens falls back to its easiest shapes.
  const filled = candidates.map((list, i) =>
    list.length
      ? list
      : findFingerings(guitar, steps[i].chord)
          .slice(0, GUITAR_LENSES[lens].keep)
          .map((f) => ({
            chord: steps[i].chord,
            notes: f.notes.filter((n): n is Note => n !== null),
            frets: f.frets,
            form: 'as written',
            label: 'as written',
            cost: 10 + GUITAR_LENSES[lens].ease * (100 - f.score),
          })),
  )
  return chooseVoicings(lens, steps, filled)
}
