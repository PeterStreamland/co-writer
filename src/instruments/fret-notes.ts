// Fretting exact notes (David's experimental lenses): every way to play a
// given set of pitches on the guitar, one note per string, within a span,
// easiest first. The fingering search (fingering.ts) works from chord
// names; a stack of 4ths or a cluster is a set of notes instead. Pure: no
// UI, audio or DOM imports.
import { midiNumber, noteAtMidi, type Note } from '../theory'
import { DEFAULT_SPAN } from './fingering'
import { fretMidi, playableFrets, type Guitar } from './guitar'

export type FrettedNotes = {
  frets: (number | null)[] // low string first; null for a muted string
  strings: (Note | null)[] // each string's note, spelled as given
  cost: number // lower is easier
}

// What makes a shape harder, in points: each fret of stretch, each finger,
// each muted string between sounding ones, and each fret up the neck.
const STRETCH = 2
const FINGER = 0.5
const MUTED_INNER = 1.5
const POSITION = 0.1
// Each open string sounding with the hand above the 5th fret, a stretch
// across the neck.
const OPEN_FAR = 3
const FAR_FRET = 5

// The easiest ways to play the notes, up to `most` of them.
export function fretNotes(
  guitar: Guitar,
  notes: Note[],
  options: { maxSpan?: number; most?: number } = {},
): FrettedNotes[] {
  const maxSpan = options.maxSpan ?? DEFAULT_SPAN
  const count = guitar.strings.length
  if (notes.length === 0 || notes.length > count) return []
  const open = guitar.capo
  // Where each note can sound: [string, fret] pairs.
  const spots = notes.map((n) => {
    const midi = midiNumber(n) as number
    const found: [number, number][] = []
    for (let s = 0; s < count; s++) {
      for (const fret of playableFrets(guitar, s)) {
        if (fretMidi(guitar, s, fret) === midi) found.push([s, fret])
      }
    }
    return found
  })
  const results: FrettedNotes[] = []
  const frets: (number | null)[] = Array(count).fill(null)
  const strings: (Note | null)[] = Array(count).fill(null)
  const walk = (i: number) => {
    if (i === notes.length) {
      const fretted = frets.filter((f): f is number => f !== null && f > open)
      const low = fretted.length ? Math.min(...fretted) : open
      const high = fretted.length ? Math.max(...fretted) : open
      if (fretted.length && high - low + 1 > maxSpan) return
      const sounding = frets.flatMap((f, s) => (f === null ? [] : [s]))
      const first = sounding[0]
      const last = sounding.at(-1) as number
      const mutedInner = frets
        .slice(first, last + 1)
        .filter((f) => f === null).length
      results.push({
        frets: [...frets],
        strings: [...strings],
        cost:
          STRETCH * (fretted.length ? high - low : 0) +
          FINGER * fretted.length +
          MUTED_INNER * mutedInner +
          POSITION * low +
          (low > FAR_FRET
            ? OPEN_FAR * frets.filter((f) => f === open).length
            : 0),
      })
      return
    }
    for (const [s, fret] of spots[i]) {
      if (frets[s] !== null) continue
      frets[s] = fret
      strings[s] =
        noteAtMidi(notes[i], fretMidi(guitar, s, fret) as number) ?? notes[i]
      walk(i + 1)
      frets[s] = null
      strings[s] = null
    }
  }
  walk(0)
  return results
    .map((r, i) => ({ r, i }))
    .sort((a, b) => a.r.cost - b.r.cost || a.i - b.i)
    .slice(0, options.most ?? 3)
    .map(({ r }) => r)
}
