// The voicing lenses' settings, as data (PLAN Phase 5 task 4, SPEC 8): which
// chord colours each lens reaches for, the voicing forms it builds on the
// keyboard with their ranges, how much it likes each, and how it weights
// voice movement. Rule weights are in voice-rules-data.ts. Every cost is in
// points, on the same scale as a semitone of movement.
import type { VoiceLeadingWeights } from './voice-leading-data'
import type { Lens } from './voice-rules-data'

// How a form picks its notes:
// - all: the bass, then every other chord tone once (a doubled tone where
//   `double` allows)
// - power: the root and 5th as a power chord, the root (or the 5th, if
//   `fifthBass`) at the bottom
// - shell: the bass, then the 3rd and 7th (or 6th)
// - rootless: no bass; the 3rd, 5th, 7th and 9th
// - drop-2: the arranger's drop-2 of each inversion (voicing.ts)
// The experimental lenses' forms take only notes of the key (or the chord):
// - quartal: the bass, then notes stacked in perfect 4ths, with a major 3rd
//   allowed on top ("So What"), sounding at least two of the chord's notes
// - cluster: the bass, then the chord's tones packed close with an added
//   2nd, 4th or 6th from the key
// - upper: the bass, its 3rd and 7th, and a triad from the key above them
//   that adds a colour (Em over Cmaj7)
// - drone: the key's tonic held low under every chord, the chord above it
// No added note may sit a semitone above the root or the 3rd (the clash
// arrangers avoid).
export type FormKind =
  | 'all'
  | 'power'
  | 'shell'
  | 'rootless'
  | 'drop-2'
  | 'quartal'
  | 'cluster'
  | 'upper'
  | 'drone'

export type LensForm = {
  id: string
  kind: FormKind
  label: string // shown with the voicing: "SATB", "power chord"
  cost: number // how much less the lens likes it than its favourite form
  bass?: [low: string, high: string] // the bass's range
  upper: [low: string, high: string] // the range of every note above it
  // The upper voices' own ranges, lowest first (tenor, alto, soprano).
  voices?: [low: string, high: string][]
  minGap?: number // the least gap between neighbouring upper notes
  maxGap?: number // the widest gap between neighbouring upper notes
  maxBassGap?: number // the widest gap from the bass to the next note
  maxSpan?: number // the widest the upper notes may spread
  double?: boolean // fill out a chord of fewer than four tones by doubling
  fifthBass?: boolean // power chords: the 5th under the root (C5/G)
  size?: [fewest: number, most: number] // upper notes, for stacks and clusters
  guide?: [low: string, high: string] // upper structures: the 3rd and 7th
  thirdOnly?: boolean // upper structures: the 3rd alone under the triad
  fifth?: boolean // drones: the tonic's 5th held with it
  omitFifth?: boolean // drones: the chord's own 5th left out above it
}

// A colour a lens gives a chord quality: the quality it becomes and the
// cost of choosing it. A colour is offered only when the notes it adds are
// in the key, so G becomes G7, not Gmaj7, in C major. The chord as written
// is always an option, at `keep` when it has colours.
export type Recolour = { quality: string; cost: number }

export type LensSettings = {
  id: Lens
  name: string
  forms: LensForm[]
  recolour: Record<string, Recolour[]>
  keep: number // the cost of leaving a recoloured quality as written
  // For rootless voicings: the qualities whose notes they may sound, the
  // first that fits the key (Cmaj7 as Cmaj9 without its root; E7 as E9, or
  // E7♭9 in A minor).
  rootless?: Record<string, string[]>
  movement: VoiceLeadingWeights
  gain: boolean // the lens imagines a distorted sound (3rds under gain)
}

export const LENS_SETTINGS: Record<Lens, LensSettings> = {
  // Four-part writing: SATB in their ranges, close upper voices, root
  // doubled before 5th before 3rd, no voice moving further than it must.
  classical: {
    id: 'classical',
    name: 'Classical',
    forms: [
      {
        id: 'satb',
        kind: 'all',
        label: 'four parts',
        cost: 0,
        bass: ['E2', 'C4'],
        upper: ['C3', 'G5'],
        voices: [
          ['C3', 'G4'],
          ['G3', 'C5'],
          ['C4', 'G5'],
        ],
        maxGap: 12,
        double: true,
      },
    ],
    recolour: {},
    keep: 0,
    movement: { semitone: 1, missedCommonTone: 2, crossing: 6, overlap: 3 },
    gain: false,
  },
  // Power chords low down, moving in parallel; whole chords only when a
  // chord has no perfect 5th.
  rock: {
    id: 'rock',
    name: 'Rock',
    forms: [
      {
        id: 'power',
        kind: 'power',
        label: 'power chord',
        cost: 0,
        bass: ['E2', 'E3'],
        upper: ['B2', 'B3'],
        maxGap: 7,
        maxBassGap: 7,
      },
      {
        id: 'power-fifth-bass',
        kind: 'power',
        label: 'power chord, 5th in the bass',
        cost: 3,
        bass: ['B1', 'B2'],
        upper: ['E2', 'E3'],
        maxGap: 7,
        maxBassGap: 5,
        fifthBass: true,
      },
      {
        id: 'chord',
        kind: 'all',
        label: 'whole chord',
        cost: 4,
        bass: ['E2', 'E3'],
        upper: ['E3', 'E4'],
        maxGap: 7,
        maxBassGap: 12,
      },
    ],
    recolour: {},
    keep: 0,
    movement: { semitone: 1, missedCommonTone: 0, crossing: 0, overlap: 0 },
    gain: true,
  },
  // A low bass and wide, open upper notes, with sus and add9 colours.
  open: {
    id: 'open',
    name: 'Open',
    forms: [
      {
        id: 'spread',
        kind: 'all',
        label: 'spread',
        cost: 0,
        bass: ['C2', 'C3'],
        upper: ['G3', 'D6'],
        minGap: 3,
        maxGap: 9,
        maxBassGap: 19,
      },
    ],
    recolour: {
      M: [
        { quality: 'add9', cost: 0 },
        { quality: 'sus2', cost: 2 },
      ],
      m: [{ quality: 'madd9', cost: 0 }],
      '7': [{ quality: '7sus4', cost: 1 }],
    },
    keep: 5,
    movement: { semitone: 1, missedCommonTone: 1, crossing: 2, overlap: 1 },
    gain: false,
  },
  // Shells under the left hand, rootless and drop-2 voicings in the middle,
  // triads turned into 7th chords.
  jazz: {
    id: 'jazz',
    name: 'Jazz',
    forms: [
      {
        id: 'rootless',
        kind: 'rootless',
        label: 'rootless',
        cost: 0,
        upper: ['C3', 'C5'],
        maxGap: 5,
        maxSpan: 12,
      },
      {
        id: 'shell',
        kind: 'shell',
        label: 'shell',
        cost: 1,
        bass: ['E2', 'Eb3'],
        upper: ['C3', 'G4'],
        maxGap: 11,
        maxBassGap: 16,
      },
      {
        id: 'drop-2',
        kind: 'drop-2',
        label: 'drop-2',
        cost: 1,
        upper: ['C3', 'C5'],
      },
    ],
    recolour: {
      M: [
        { quality: 'maj7', cost: 0 },
        { quality: '7', cost: 0 },
        { quality: '6', cost: 1 },
      ],
      m: [
        { quality: 'm7', cost: 0 },
        { quality: 'm6', cost: 1 },
      ],
      sus4: [{ quality: '7sus4', cost: 0 }],
      dim: [{ quality: 'm7b5', cost: 1 }],
    },
    keep: 4,
    rootless: {
      maj7: ['maj9'],
      m7: ['m9'],
      '7': ['9', '7b9'],
      '6': ['6/9'],
      m6: ['m6/9'],
    },
    movement: { semitone: 1, missedCommonTone: 2, crossing: 4, overlap: 2 },
    gain: false,
  },
  // Chords stacked in 4ths over the root, floating rather than pulling.
  quartal: {
    id: 'quartal',
    name: 'Quartal',
    forms: [
      {
        id: 'quartal',
        kind: 'quartal',
        label: 'stacked 4ths',
        cost: 0,
        bass: ['E2', 'Eb3'],
        upper: ['C3', 'C5'],
        size: [3, 5],
      },
    ],
    recolour: {},
    keep: 0,
    movement: { semitone: 1, missedCommonTone: 1, crossing: 2, overlap: 1 },
    gain: false,
  },
  // The chord's tones squeezed together with a 2nd, 4th or 6th added.
  cluster: {
    id: 'cluster',
    name: 'Clusters',
    forms: [
      {
        id: 'cluster',
        kind: 'cluster',
        label: 'cluster',
        cost: 0,
        bass: ['C2', 'C3'],
        upper: ['G3', 'C5'],
        maxGap: 3,
        maxSpan: 7,
        size: [3, 5],
      },
    ],
    recolour: {},
    keep: 0,
    movement: { semitone: 1, missedCommonTone: 1, crossing: 2, overlap: 1 },
    gain: false,
  },
  // A different triad from the key floating over the root, 3rd and 7th.
  upper: {
    id: 'upper',
    name: 'Upper structures',
    forms: [
      {
        id: 'upper',
        kind: 'upper',
        label: 'upper structure',
        cost: 0,
        bass: ['E2', 'Eb3'],
        guide: ['A2', 'E4'],
        upper: ['A3', 'E5'],
        maxGap: 5,
        maxSpan: 9,
      },
      {
        id: 'upper-light',
        kind: 'upper',
        label: 'upper structure',
        cost: 1,
        bass: ['E2', 'Eb3'],
        guide: ['A2', 'E4'],
        upper: ['A3', 'E5'],
        maxGap: 5,
        maxSpan: 9,
        thirdOnly: true,
      },
    ],
    recolour: {},
    keep: 0,
    movement: { semitone: 1, missedCommonTone: 1, crossing: 3, overlap: 1 },
    gain: false,
  },
  // The tonic held low as a pedal under every chord.
  drone: {
    id: 'drone',
    name: 'Drone',
    forms: [
      {
        id: 'drone',
        kind: 'drone',
        label: 'over the drone',
        cost: 0,
        bass: ['C2', 'B2'],
        upper: ['G3', 'E5'],
        maxGap: 5,
        maxSpan: 12,
      },
      {
        id: 'drone-fifth',
        kind: 'drone',
        label: 'over the drone and its 5th',
        cost: 0.5,
        bass: ['C2', 'B2'],
        upper: ['G3', 'E5'],
        maxGap: 5,
        maxSpan: 12,
        fifth: true,
      },
      {
        id: 'drone-light',
        kind: 'drone',
        label: 'over the drone',
        cost: 1,
        bass: ['C2', 'B2'],
        upper: ['G3', 'E5'],
        maxGap: 5,
        maxSpan: 12,
        omitFifth: true,
      },
    ],
    recolour: {},
    keep: 0,
    movement: { semitone: 1, missedCommonTone: 1, crossing: 2, overlap: 1 },
    gain: false,
  },
  // Every lens's voicings, picked at random each time; see lens.ts.
  wildcard: {
    id: 'wildcard',
    name: 'Wildcard',
    forms: [],
    recolour: {},
    keep: 0,
    movement: { semitone: 0.5, missedCommonTone: 0, crossing: 1, overlap: 0.5 },
    gain: false,
  },
}
