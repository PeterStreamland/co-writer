// Golden fixture: how each meter counts and where its strong beats fall
// (SPEC 7.1). Never edit this to make a test pass: ask David.
// Beats are numbered as a player counts the meter's smallest note value,
// from 1: in 6/8 the beats fall on eighths 1 and 4. The downbeat (1) is
// the strongest; "strong" beats come next; "weak" beats are counted but
// unaccented. Anything between beats is off the beat.
// Lengths and tempi are fractions of a whole note: a dotted crotchet is 3/8.

type Strength = 'downbeat' | 'strong' | 'weak'

export type MeterFixture = {
  meter: string
  grouping?: number[]
  bar: { n: number; d: number }
  beats: [number, Strength][]
  // What a chord length is counted in, and its name.
  count: { n: number; d: number; name: string }
  // The note value the tempo counts.
  tempo: { n: number; d: number }
}

export const meters: MeterFixture[] = [
  // Simple meters: the beat is the lower number's note; 4/4 leans on 1 and 3.
  {
    meter: '4/4',
    bar: { n: 1, d: 1 },
    beats: [
      [1, 'downbeat'],
      [2, 'weak'],
      [3, 'strong'],
      [4, 'weak'],
    ],
    count: { n: 1, d: 4, name: 'beat' },
    tempo: { n: 1, d: 4 },
  },
  {
    meter: '3/4',
    bar: { n: 3, d: 4 },
    beats: [
      [1, 'downbeat'],
      [2, 'weak'],
      [3, 'weak'],
    ],
    count: { n: 1, d: 4, name: 'beat' },
    tempo: { n: 1, d: 4 },
  },
  {
    meter: '2/4',
    bar: { n: 1, d: 2 },
    beats: [
      [1, 'downbeat'],
      [2, 'weak'],
    ],
    count: { n: 1, d: 4, name: 'beat' },
    tempo: { n: 1, d: 4 },
  },
  {
    meter: '2/2',
    bar: { n: 1, d: 1 },
    beats: [
      [1, 'downbeat'],
      [2, 'weak'],
    ],
    count: { n: 1, d: 2, name: 'beat' },
    tempo: { n: 1, d: 2 },
  },
  // Compound meters: the beat is a dotted crotchet, and every one is strong
  // (SPEC 7.1: in 6/8, 1 and 4).
  {
    meter: '6/8',
    bar: { n: 3, d: 4 },
    beats: [
      [1, 'downbeat'],
      [4, 'strong'],
    ],
    count: { n: 3, d: 8, name: 'beat' },
    tempo: { n: 3, d: 8 },
  },
  {
    meter: '9/8',
    bar: { n: 9, d: 8 },
    beats: [
      [1, 'downbeat'],
      [4, 'strong'],
      [7, 'strong'],
    ],
    count: { n: 3, d: 8, name: 'beat' },
    tempo: { n: 3, d: 8 },
  },
  {
    meter: '12/8',
    bar: { n: 3, d: 2 },
    beats: [
      [1, 'downbeat'],
      [4, 'strong'],
      [7, 'strong'],
      [10, 'strong'],
    ],
    count: { n: 3, d: 8, name: 'beat' },
    tempo: { n: 3, d: 8 },
  },
  // Odd meters in crotchets: every crotchet is a beat, and each group of
  // the grouping starts on a strong one. 5/4 defaults to 3+2 (Take Five).
  {
    meter: '5/4',
    bar: { n: 5, d: 4 },
    beats: [
      [1, 'downbeat'],
      [2, 'weak'],
      [3, 'weak'],
      [4, 'strong'],
      [5, 'weak'],
    ],
    count: { n: 1, d: 4, name: 'beat' },
    tempo: { n: 1, d: 4 },
  },
  {
    meter: '5/4',
    grouping: [2, 3],
    bar: { n: 5, d: 4 },
    beats: [
      [1, 'downbeat'],
      [2, 'weak'],
      [3, 'strong'],
      [4, 'weak'],
      [5, 'weak'],
    ],
    count: { n: 1, d: 4, name: 'beat' },
    tempo: { n: 1, d: 4 },
  },
  // Odd meters in quavers: each group is one (uneven) beat, all strong, as
  // in compound time. Lengths count quavers; the tempo counts crotchets.
  // 7/8 defaults to 2+2+3 (SPEC 7.1).
  {
    meter: '7/8',
    bar: { n: 7, d: 8 },
    beats: [
      [1, 'downbeat'],
      [3, 'strong'],
      [5, 'strong'],
    ],
    count: { n: 1, d: 8, name: 'eighth' },
    tempo: { n: 1, d: 4 },
  },
  {
    meter: '7/8',
    grouping: [3, 2, 2],
    bar: { n: 7, d: 8 },
    beats: [
      [1, 'downbeat'],
      [4, 'strong'],
      [6, 'strong'],
    ],
    count: { n: 1, d: 8, name: 'eighth' },
    tempo: { n: 1, d: 4 },
  },
  {
    meter: '7/8',
    grouping: [2, 3, 2],
    bar: { n: 7, d: 8 },
    beats: [
      [1, 'downbeat'],
      [3, 'strong'],
      [6, 'strong'],
    ],
    count: { n: 1, d: 8, name: 'eighth' },
    tempo: { n: 1, d: 4 },
  },
  {
    meter: '5/8',
    bar: { n: 5, d: 8 },
    beats: [
      [1, 'downbeat'],
      [3, 'strong'],
    ],
    count: { n: 1, d: 8, name: 'eighth' },
    tempo: { n: 1, d: 4 },
  },
  {
    meter: '5/8',
    grouping: [3, 2],
    bar: { n: 5, d: 8 },
    beats: [
      [1, 'downbeat'],
      [4, 'strong'],
    ],
    count: { n: 1, d: 8, name: 'eighth' },
    tempo: { n: 1, d: 4 },
  },
]

// Triplets and other tuplets fill their span exactly (SPEC 13). Each note
// is [n, d], a fraction of a whole note.
const times = (count: number, note: [number, number]) =>
  Array.from({ length: count }, () => note)

export const exactBars: { meter: string; notes: [number, number][] }[] = [
  // Twelve quaver triplets fill a bar of 4/4.
  { meter: '4/4', notes: times(12, [1, 12]) },
  // Six crotchet triplets fill a bar of 4/4.
  { meter: '4/4', notes: times(6, [1, 6]) },
  // A crotchet, three quaver triplets and a crotchet fill 3/4.
  { meter: '3/4', notes: [[1, 4], ...times(3, [1, 12]), [1, 4]] },
  // Two duplet quavers and a dotted crotchet fill 6/8.
  {
    meter: '6/8',
    notes: [
      [3, 16],
      [3, 16],
      [3, 8],
    ],
  },
  // Five quintuplet semiquavers over a crotchet, then 2+3 quavers, fill 7/8.
  { meter: '7/8', notes: [...times(5, [1, 20]), ...times(5, [1, 8])] },
]
