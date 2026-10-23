// Arpeggios on the guitar (PLAN Phase 6 task 2): the arpeggio in one
// position (every tone within a 4-fret span, on every string, open strings
// in the open position), or the notes of its range as a run across the
// neck, two or three notes a string, moving up as it climbs.
// The notes come lowest first; a descending pattern plays the same spots
// back down. Pure: no UI, audio or DOM imports.
import {
  mod,
  noteAtMidi,
  pitchClass,
  type ArpeggioNote,
  type ArpeggioTone,
  type Note,
} from '../theory'
import { BOX_FRETS } from './chord-box'
import { roleOf, type ToneRole } from './chord-tones'
import { DEFAULT_SPAN } from './fingering'
import { fretMidi, playableFrets, type Guitar } from './guitar'

export type Spot = { string: number; fret: number }

// One position on the neck (David's request: every position up the neck,
// as guitarists learn them): a span of four frets, and every tone of the
// arpeggio that falls in it on every string, low E to high E, lowest first.
// So the position needn't start on the root: the C arpeggio in 5th position
// starts on the low E string's G. A note already played lower down on a
// lower string isn't repeated on the next.
export type ArpeggioPosition = {
  from: number // the span's lowest fret (the capo or nut for open position)
  spots: Spot[]
  notes: ArpeggioNote[]
}

export function arpeggioPositions(
  guitar: Guitar,
  tones: ArpeggioTone[],
  span = DEFAULT_SPAN,
): ArpeggioPosition[] {
  const byPitch = new Map(tones.map((t) => [pitchClass(t.note), t]))
  const found: ArpeggioPosition[] = []
  for (let from = guitar.capo; from + span - 1 <= guitar.frets.high; from++) {
    const inReach = (fret: number) =>
      (fret >= from && fret < from + span) ||
      (fret === guitar.capo && from <= guitar.capo + 1)
    const spots: Spot[] = []
    const notes: ArpeggioNote[] = []
    guitar.strings.forEach((_, s) => {
      for (const fret of playableFrets(guitar, s)) {
        const midi = fretMidi(guitar, s, fret) as number
        const tone = byPitch.get(mod(midi, 12))
        if (!inReach(fret) || !tone) continue
        if (notes.length && midi <= (notes.at(-1) as ArpeggioNote).midi)
          continue
        spots.push({ string: s, fret })
        notes.push({ ...tone, note: noteAtMidi(tone.note, midi) as Note, midi })
      }
    })
    if (notes.length) found.push({ from, spots, notes })
  }
  // A span whose notes all sit in a neighbouring span adds nothing new.
  const key = (s: Spot) => `${s.string}:${s.fret}`
  return found.filter((p, i) => {
    const mine = p.spots.map(key)
    return !found.some((q, j) => {
      if (j === i) return false
      const theirs = new Set(q.spots.map(key))
      const covered = mine.every((k) => theirs.has(k))
      return covered && (q.spots.length > mine.length || j < i)
    })
  })
}

// The run's costs, in points: each fret slid along a string, each fret
// back down the neck on a new string, a skipped string, leaving a string
// after a single note, and each fret up the neck where the run starts.
const SLIDE = 1
const BACK = 2
const SKIP = 3
const LONE = 1
const START = 0.1
const MOST_PER_STRING = 3
const MOST_SLIDE = 4

type Step = { spot: Spot; count: number; cost: number; from?: Step }

// The easiest run across the neck for the notes, or undefined when some
// note can't be played.
export function arpeggioRun(
  guitar: Guitar,
  midis: number[],
): Spot[] | undefined {
  let steps: Step[] = []
  midis.forEach((midi, i) => {
    const options: Spot[] = []
    guitar.strings.forEach((_, s) => {
      for (const fret of playableFrets(guitar, s)) {
        if (fretMidi(guitar, s, fret) === midi)
          options.push({ string: s, fret })
      }
    })
    if (i === 0) {
      steps = options.map((spot) => ({
        spot,
        count: 1,
        cost: START * spot.fret,
      }))
      return
    }
    const next: Step[] = []
    for (const spot of options) {
      for (const count of [1, 2, 3]) {
        let best: Step | undefined
        for (const before of steps) {
          const cost = moveCost(before, spot, count)
          if (cost === undefined) continue
          const total = before.cost + cost
          if (!best || total < best.cost)
            best = { spot, count, cost: total, from: before }
        }
        if (best) next.push(best)
      }
    }
    steps = next
  })
  if (!steps.length) return undefined
  let end = steps.reduce((a, b) => (b.cost < a.cost ? b : a))
  const spots: Spot[] = [end.spot]
  while (end.from) {
    end = end.from
    spots.unshift(end.spot)
  }
  return spots.length === midis.length ? spots : undefined
}

// What moving from one spot to the next costs, arriving as the `count`th
// note on its string; undefined when the move isn't allowed.
function moveCost(before: Step, spot: Spot, count: number): number | undefined {
  const { string, fret } = before.spot
  if (spot.string === string) {
    if (count !== before.count + 1 || count > MOST_PER_STRING) return undefined
    const slide = spot.fret - fret
    if (slide <= 0 || slide > MOST_SLIDE) return undefined
    return SLIDE * slide
  }
  if (spot.string < string || count !== 1) return undefined
  return (
    BACK * Math.max(0, fret - spot.fret) +
    SKIP * (spot.string - string - 1) +
    (before.count === 1 ? LONE : 0)
  )
}

// An arpeggio position drawn as a chord box (David's request): the frets it
// covers, nut or capo at the top near the open position, and a dot for each
// note, labelled and coloured by its tone. Unlike a chord shape, a string
// can carry several dots.
export type PositionDot = {
  string: number
  fret: number
  row?: number // 1 for the box's first fret row; unset when open
  open: boolean
  label: string
  role: ToneRole
}

export type PositionBox = {
  first: number
  rows: number
  top: 'nut' | 'capo' | 'none'
  strings: number
  dots: PositionDot[]
}

export function positionBox(
  guitar: Guitar,
  spots: Spot[],
  tones: { label: string; number: number }[],
): PositionBox {
  const open = guitar.capo
  const fretted = spots.map((s) => s.fret).filter((f) => f > open)
  const low = fretted.length ? Math.min(...fretted) : open + 1
  const high = fretted.length ? Math.max(...fretted) : open + 1
  const home = high <= open + BOX_FRETS
  const first = home ? open + 1 : low
  return {
    first,
    rows: Math.max(BOX_FRETS, high - first + 1),
    top: home ? (open === 0 ? 'nut' : 'capo') : 'none',
    strings: guitar.strings.length,
    dots: spots.map((spot, i) => ({
      ...spot,
      row: spot.fret === open ? undefined : spot.fret - first + 1,
      open: spot.fret === open,
      label: tones[i].label,
      role: roleOf(tones[i].number),
    })),
  }
}
