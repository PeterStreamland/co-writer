// The meters the time-signature picker offers, as data (SPEC 7.1). Each
// lists its groupings, the default first: how the bar's pulses (the lower
// number's note) bunch into strong-beat groups. 4/4 is 2+2 crotchets, so
// beat 3 is strong; 6/8 is 3+3 quavers, so its two dotted beats are; 7/8
// defaults to 2+2+3 (SPEC 7.1) and 5/4 to 3+2, as in Take Five.

export type MeterData = { num: number; den: number; groupings: number[][] }

export const METERS: MeterData[] = [
  { num: 4, den: 4, groupings: [[2, 2]] },
  { num: 3, den: 4, groupings: [[3]] },
  { num: 2, den: 4, groupings: [[2]] },
  { num: 2, den: 2, groupings: [[2]] },
  { num: 6, den: 8, groupings: [[3, 3]] },
  { num: 9, den: 8, groupings: [[3, 3, 3]] },
  { num: 12, den: 8, groupings: [[3, 3, 3, 3]] },
  {
    num: 5,
    den: 4,
    groupings: [
      [3, 2],
      [2, 3],
    ],
  },
  {
    num: 5,
    den: 8,
    groupings: [
      [2, 3],
      [3, 2],
    ],
  },
  {
    num: 7,
    den: 8,
    groupings: [
      [2, 2, 3],
      [3, 2, 2],
      [2, 3, 2],
    ],
  },
]
