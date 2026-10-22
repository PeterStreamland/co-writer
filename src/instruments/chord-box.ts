// The chord box (Phase 3 task 8): a fingering drawn as a small vertical
// diagram, nut at the top and low string on the left (SPEC 5), as data for
// the view to draw. Pure: no UI, audio or DOM imports.
import { pitchClass, type ChordName } from '../theory'
import { chordTones, type ChordTone } from './chord-tones'
import type { Fingering } from './fingering'
import type { Guitar } from './guitar'

// A box shows four frets, or more when a shape spans more.
export const BOX_FRETS = 4

export type BoxString = {
  fret: number | null // as played, from the nut; null when muted
  row?: number // 1 for the box's first fret row; unset for open or muted
  open: boolean // played open, or on the capo's fret
  tone?: ChordTone
}

export type ChordBox = {
  first: number // the fret of the box's first row
  rows: number
  top: 'nut' | 'capo' | 'none' // the line across the top
  strings: BoxString[] // lowest string first
}

// Near the nut (or the capo) the box starts there and draws it across the
// top; further up it starts at the shape's lowest fret, which the view
// writes beside it.
export function chordBox(
  guitar: Guitar,
  chord: ChordName,
  fingering: Pick<Fingering, 'frets' | 'notes'>,
): ChordBox {
  const open = guitar.capo
  const fretted = fingering.frets.filter(
    (f): f is number => f !== null && f > open,
  )
  const low = fretted.length ? Math.min(...fretted) : open + 1
  const high = fretted.length ? Math.max(...fretted) : open + 1
  const home = high <= open + BOX_FRETS
  const first = home ? open + 1 : low
  const rows = Math.max(BOX_FRETS, high - first + 1)
  const tones = chordTones(chord)
  return {
    first,
    rows,
    top: home ? (open === 0 ? 'nut' : 'capo') : 'none',
    strings: fingering.frets.map((fret, s) => {
      const note = fingering.notes[s]
      const tone = note ? tones.get(pitchClass(note)) : undefined
      if (fret === null) return { fret, open: false }
      if (fret === open) return { fret, open: true, tone }
      return { fret, row: fret - first + 1, open: false, tone }
    }),
  }
}
