// Golden fixture: chord styles (PLAN Phase 7 task 8, David's request).
// Never edit this to make a test pass: ask David.
// Each case plays a chord's notes in a style for a length, starting at a
// point in the bar (`at`, from the bar's start; the bar's start when
// unset). Each hit is [onset from the chord's start, its slot, the notes
// struck ('' for a rest), and how long they sound when that isn't the
// whole slot]. Lengths are fractions of a whole note: 1/4 is a crotchet.
// C major is voiced C3 E3 G3 C4 throughout.

export type ChordStyleFixture = {
  name: string
  style: string
  meter: string
  length: string
  at?: string
  notes?: string
  hits: [string, string, string, string?][]
  strums?: ('down' | 'up' | undefined)[]
}

const C = 'C3 E3 G3 C4'
const UPPER = 'E3 G3 C4'

export const chordStyles: ChordStyleFixture[] = [
  {
    name: 'block: all together for the whole bar',
    style: 'block',
    meter: '4/4',
    length: '1/1',
    hits: [['0/1', '1/1', C]],
  },
  {
    name: 'oom-pah-pah in 3/4: the bass on 1, the chord on 2 and 3',
    style: 'oom-pah',
    meter: '3/4',
    length: '3/4',
    hits: [
      ['0/1', '1/4', 'C3'],
      ['1/4', '1/4', UPPER],
      ['1/2', '1/4', UPPER],
    ],
  },
  {
    name: 'oom-pah in 4/4: bass on 1 and 3, chord on 2 and 4',
    style: 'oom-pah',
    meter: '4/4',
    length: '1/1',
    hits: [
      ['0/1', '1/4', 'C3'],
      ['1/4', '1/4', UPPER],
      ['1/2', '1/4', 'C3'],
      ['3/4', '1/4', UPPER],
    ],
  },
  {
    name: 'oom-pah-pah twice in 6/8, in quavers',
    style: 'oom-pah',
    meter: '6/8',
    length: '3/4',
    hits: [
      ['0/1', '1/8', 'C3'],
      ['1/8', '1/8', UPPER],
      ['1/4', '1/8', UPPER],
      ['3/8', '1/8', 'C3'],
      ['1/2', '1/8', UPPER],
      ['5/8', '1/8', UPPER],
    ],
  },
  {
    name: 'oom-pah in 7/8 (2+2+3): the bass at each group',
    style: 'oom-pah',
    meter: '7/8',
    length: '7/8',
    hits: [
      ['0/1', '1/8', 'C3'],
      ['1/8', '1/8', UPPER],
      ['1/4', '1/8', 'C3'],
      ['3/8', '1/8', UPPER],
      ['1/2', '1/8', 'C3'],
      ['5/8', '1/8', UPPER],
      ['3/4', '1/8', UPPER],
    ],
  },
  {
    name: 'off-beat stabs in 4/4: silent beats, short chords on each "and"',
    style: 'stabs',
    meter: '4/4',
    length: '1/1',
    hits: [
      ['0/1', '1/8', ''],
      ['1/8', '1/8', C, '1/16'],
      ['1/4', '1/8', ''],
      ['3/8', '1/8', C, '1/16'],
      ['1/2', '1/8', ''],
      ['5/8', '1/8', C, '1/16'],
      ['3/4', '1/8', ''],
      ['7/8', '1/8', C, '1/16'],
    ],
  },
  {
    name: 'the down-up pattern in 4/4: down, down-up, up-down-up',
    style: 'down-up',
    meter: '4/4',
    length: '1/1',
    hits: [
      ['0/1', '1/4', C],
      ['1/4', '1/8', C],
      ['3/8', '1/4', UPPER],
      ['5/8', '1/8', UPPER],
      ['3/4', '1/8', C],
      ['7/8', '1/8', UPPER],
    ],
    strums: ['down', 'down', 'up', 'up', 'down', 'up'],
  },
  {
    name: 'a half-bar chord on beat 3 takes the second half of the pattern, struck as it starts',
    style: 'down-up',
    meter: '4/4',
    length: '1/2',
    at: '1/2',
    hits: [
      ['0/1', '1/8', C],
      ['1/8', '1/8', UPPER],
      ['1/4', '1/8', C],
      ['3/8', '1/8', UPPER],
    ],
    strums: ['down', 'up', 'down', 'up'],
  },
  {
    name: 'pulse on a half-bar chord from beat 3',
    style: 'pulse',
    meter: '4/4',
    length: '1/2',
    at: '1/2',
    hits: [
      ['0/1', '1/4', C],
      ['1/4', '1/4', C],
    ],
  },
  {
    name: 'pulse over the barline: a bar and a half from beat 3',
    style: 'pulse',
    meter: '3/4',
    length: '3/4',
    at: '1/2',
    hits: [
      ['0/1', '1/4', C],
      ['1/4', '1/4', C],
      ['1/2', '1/4', C],
    ],
  },
  {
    name: 'broken: rolled up a demisemiquaver apart, ringing to the end',
    style: 'broken',
    meter: '4/4',
    length: '1/1',
    notes: 'C3 E3 G3',
    hits: [
      ['0/1', '1/32', 'C3', '1/1'],
      ['1/32', '1/32', 'E3', '31/32'],
      ['1/16', '15/16', 'G3'],
    ],
  },
]
