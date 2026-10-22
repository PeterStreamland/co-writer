// CAGED grouping (Phase 3 task 5): which of the five open-chord shapes, C,
// A, G, E or D, a fingering is played from, in standard tuning or any tuning
// with its intervals (E♭, D and C standard, and the top six strings of a
// 7-string). A shape is known by where its roots sit: open C has roots on the
// A string's 3rd fret and the B string's 1st, so any fingering with its roots
// that way round, anywhere up the neck, is a C shape. Shapes are named by
// what sounds and the shape it's played from: "A (G shape, capo 2)" (SPEC 5).
import { chordSymbol, mod, pitchClass, type ChordName } from '../theory'
import type { Fingering } from './fingering'
import { fretMidi, type Guitar } from './guitar'

export type CagedShape = 'C' | 'A' | 'G' | 'E' | 'D'

export const CAGED_ORDER: CagedShape[] = ['C', 'A', 'G', 'E', 'D']

// Each shape as its open major chord, low E to high E, in frets above the
// shape's base (the nut for the open chord): where its roots sit, and the
// frets of the whole chord, null where the open chord mutes a string.
export const CAGED_SHAPES: {
  shape: CagedShape
  roots: Record<number, number>
  frets: (number | null)[]
}[] = [
  { shape: 'C', roots: { 1: 3, 4: 1 }, frets: [null, 3, 2, 0, 1, 0] },
  { shape: 'A', roots: { 1: 0, 3: 2 }, frets: [null, 0, 2, 2, 2, 0] },
  { shape: 'G', roots: { 0: 3, 3: 0, 5: 3 }, frets: [3, 2, 0, 0, 0, 3] },
  { shape: 'E', roots: { 0: 0, 2: 2, 5: 0 }, frets: [0, 2, 2, 1, 0, 0] },
  { shape: 'D', roots: { 2: 0, 4: 3 }, frets: [null, null, 0, 2, 3, 2] },
]

// Standard tuning's steps between strings, low to high: 4ths, with a major
// 3rd from G to B.
const STANDARD_STEPS = [5, 5, 5, 4, 5]

// The first of six strings tuned as standard is: 0 on a 6-string, 1 on a
// 7-string whose top six are. Undefined for other tunings (drop D, DADGAD).
function standardStrings(guitar: Guitar): number | undefined {
  const first = guitar.strings.length - 6
  if (first < 0) return undefined
  for (let i = 0; i < 5; i++) {
    const low = fretMidi(guitar, first + i, guitar.capo) as number
    const high = fretMidi(guitar, first + i + 1, guitar.capo) as number
    if (high - low !== STANDARD_STEPS[i]) return undefined
  }
  return first
}

// The CAGED shape a fingering is played from, or undefined when its roots
// fit no shape, or the tuning isn't standard. Every root must sit where the
// shape puts one, with every fretted note within the four frets from the
// shape's base (and no fret behind the capo); of the shapes that fit, the one
// whose open chord is nearest, fret by fret, wins.
export function cagedShape(
  guitar: Guitar,
  chord: ChordName,
  fingering: Fingering,
): CagedShape | undefined {
  const first = standardStrings(guitar)
  if (first === undefined) return undefined
  const open = guitar.capo
  const root = pitchClass(chord.root)
  const six = fingering.frets.slice(first, first + 6)
  const sounding = six.flatMap((fret, s) => {
    if (fret === null) return []
    const midi = fretMidi(guitar, first + s, fret) as number
    return [{ s, fret, root: mod(midi, 12) === root }]
  })
  const roots = sounding.filter((n) => n.root)
  if (roots.length === 0) return undefined

  let best: { shape: CagedShape; distance: number } | undefined
  for (const { shape, roots: at, frets } of CAGED_SHAPES) {
    const first = roots.find((n) => n.s in at)
    if (!first) continue
    const base = first.fret - at[first.s]
    if (base < open - 1) continue
    if (!roots.every((n) => n.s in at && n.fret === base + at[n.s])) continue
    const fretted = sounding.filter((n) => n.fret > open)
    if (fretted.some((n) => n.fret < base || n.fret > base + 3)) continue
    let distance = 0
    for (const { s, fret } of sounding) {
      const template = frets[s]
      if (template !== null) distance += Math.abs(fret - (base + template))
    }
    if (!best || distance < best.distance) best = { shape, distance }
  }
  return best?.shape
}

// Shapes grouped by CAGED shape in C A G E D order, then any that fit none,
// each group keeping the order it was given (easiest first).
export function groupByCaged(
  guitar: Guitar,
  chord: ChordName,
  fingerings: Fingering[],
): { shape: CagedShape | undefined; fingerings: Fingering[] }[] {
  const groups = new Map<CagedShape | undefined, Fingering[]>()
  for (const f of fingerings) {
    const shape = cagedShape(guitar, chord, f)
    groups.set(shape, [...(groups.get(shape) ?? []), f])
  }
  return [...CAGED_ORDER, undefined].flatMap((shape) => {
    const found = groups.get(shape)
    return found ? [{ shape, fingerings: found }] : []
  })
}

// A shape's name: the chord as it sounds, then the shape it's played from,
// with the chord's quality on the shape's letter and any capo (SPEC 5).
// "A (G shape, capo 2)", "Bm (Am shape)", "C7 (A7 shape)". Just the chord
// when no shape fits.
export function shapeName(
  guitar: Guitar,
  chord: ChordName,
  fingering: Fingering,
): string {
  const name = chordSymbol(chord)
  const shape = cagedShape(guitar, chord, fingering)
  if (!shape) return name
  const letter = chordSymbol({
    root: { letter: shape, accidental: 0 },
    quality: chord.quality,
  })
  const capo = guitar.capo ? `, capo ${guitar.capo}` : ''
  return `${name} (${letter} shape${capo})`
}
