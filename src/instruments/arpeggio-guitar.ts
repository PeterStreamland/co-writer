// Arpeggios on the guitar (PLAN Phase 6 task 2): where each note of an
// arpeggio's range sits on the neck, either in one position (every note
// within a 4-fret span, open strings in the open position) or as a run
// across the neck, two or three notes a string, moving up as it climbs.
// The notes come lowest first; a descending pattern plays the same spots
// back down. Pure: no UI, audio or DOM imports.
import { DEFAULT_SPAN } from './fingering'
import { fretMidi, playableFrets, type Guitar } from './guitar'

export type Spot = { string: number; fret: number }

// One position on the neck: the lowest fret of its span, and a spot for
// every note.
export type ArpeggioPosition = { from: number; spots: Spot[] }

// Every position that plays all the notes, lowest first. In each, the
// notes climb string by string (never back to a lower string), on the
// lowest string that can reach them.
export function arpeggioPositions(
  guitar: Guitar,
  midis: number[],
  span = DEFAULT_SPAN,
): ArpeggioPosition[] {
  const positions: ArpeggioPosition[] = []
  const seen = new Set<string>()
  for (let from = guitar.capo; from + span - 1 <= guitar.frets.high; from++) {
    const inReach = (fret: number) =>
      (fret >= from && fret < from + span) ||
      (fret === guitar.capo && from <= guitar.capo + 1)
    const spots = place(guitar, midis, inReach)
    if (!spots) continue
    const id = spots.map((s) => `${s.string}:${s.fret}`).join()
    if (seen.has(id)) continue
    seen.add(id)
    const fretted = spots.map((s) => s.fret).filter((f) => f > guitar.capo)
    positions.push({
      from: fretted.length ? Math.min(...fretted) : guitar.capo,
      spots,
    })
  }
  return positions
}

// Spots for the notes, lowest string first, each note on the same string
// as the one before or a higher one, using only frets in reach.
function place(
  guitar: Guitar,
  midis: number[],
  inReach: (fret: number) => boolean,
): Spot[] | undefined {
  const spots: Spot[] = []
  const walk = (i: number, lowest: number): boolean => {
    if (i === midis.length) return true
    for (let s = lowest; s < guitar.strings.length; s++) {
      const fret = playableFrets(guitar, s).find(
        (f) => inReach(f) && fretMidi(guitar, s, f) === midis[i],
      )
      if (fret === undefined) continue
      spots.push({ string: s, fret })
      if (walk(i + 1, s)) return true
      spots.pop()
    }
    return false
  }
  return walk(0, 0) ? spots : undefined
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
