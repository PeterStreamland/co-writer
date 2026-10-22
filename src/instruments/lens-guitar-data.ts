// The voicing lenses on guitar, as data (PLAN Phase 5 task 4): which shapes
// each lens takes from the fingering search and how much it likes them. The
// colours each lens gives chords are the keyboard's (src/theory/lens-data).
import type { CoreLens } from '../theory'

export type GuitarLensShape = {
  id: string
  label: string
  cost: number
  power?: boolean // the chord as a power chord (C5)
  notes: [fewest: number, most: number] // how many strings sound
  openStrings: boolean
  omitFifth?: boolean
}

export type GuitarLens = {
  shapes: GuitarLensShape[]
  // Points per point of playability score below 100, so easier shapes win
  // when the voice leading is equal.
  ease: number
  // The most shapes kept per chord, easiest first, to keep the search fast.
  keep: number
}

export const GUITAR_LENSES: Record<CoreLens, GuitarLens> = {
  // Four voices on four strings, like four-part writing.
  classical: {
    shapes: [
      {
        id: 'four',
        label: 'four parts',
        cost: 0,
        notes: [4, 4],
        openStrings: true,
      },
    ],
    ease: 0.1,
    keep: 60,
  },
  // Power chords on two or three strings; whole chords cost more.
  rock: {
    shapes: [
      {
        id: 'power',
        label: 'power chord',
        cost: 0,
        power: true,
        notes: [2, 3],
        openStrings: true,
      },
      {
        id: 'chord',
        label: 'whole chord',
        cost: 4,
        notes: [3, 6],
        openStrings: true,
      },
    ],
    ease: 0.3,
    keep: 40,
  },
  // Ringing shapes, open strings welcome.
  open: {
    shapes: [
      {
        id: 'ringing',
        label: 'ringing',
        cost: 0,
        notes: [4, 6],
        openStrings: true,
      },
    ],
    ease: 0.15,
    keep: 40,
  },
  // Shells on three strings and four-string grips, all fretted.
  jazz: {
    shapes: [
      {
        id: 'shell',
        label: 'shell',
        cost: 0,
        notes: [3, 3],
        openStrings: false,
        omitFifth: true,
      },
      {
        id: 'grip',
        label: 'four-string grip',
        cost: 0.5,
        notes: [4, 4],
        openStrings: false,
      },
    ],
    ease: 0.1,
    keep: 40,
  },
}

// The experimental lenses on guitar: their keyboard voicings, fretted as
// they are (or an octave up or down) where the hand can reach them.
export const FRETTED_LENS = {
  // Points per point of fretting cost, so easier shapes win when the voice
  // leading is equal.
  ease: 0.5,
  // The keyboard voicings tried per chord, the lens's favourites first.
  tried: 120,
}
