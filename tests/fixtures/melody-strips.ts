// Golden fixture: the melody lane as time strips (PLAN Phase 7 task 6,
// David's choice of Option A, 2026-10-24). Never edit this to make a test
// pass: ask David.
// Each bar is laid out as segments from its start, as fractions of a
// whole note: notes (tied in from the bar before, or out to the next),
// rests between notes, and empty time after the melody ends. The count is
// in the meter's beats (dotted crotchets in 6/8): "full" when no time is
// empty.

type F = { n: number; d: number }

export type StripSegment =
  | {
      kind: 'note'
      note: string
      from: F
      to: F
      tiedIn?: true
      tiedOut?: true
      held?: F[]
    }
  | { kind: 'rest'; from: F; to: F }
  | { kind: 'empty'; from: F; to: F }

export type StripFixture = {
  name: string
  meter: string
  notes: { note: string; onset: F; length: F; holds?: F[] }[]
  bars?: number // at least this many bars (the chords')
  strips: { bar: number; count: string; segments: StripSegment[] }[]
}

export const strips: StripFixture[] = [
  {
    // David's example: A3 for a beat; G3 struck on beat 2 and held through
    // beat 3; a half-beat rest; C4 on the "and" of 4, tied into bar 2;
    // then D4 for two beats, and 1½ beats not filled yet.
    name: 'a held note, a rest and a tie over the barline',
    meter: '4/4',
    notes: [
      { note: 'A3', onset: { n: 0, d: 1 }, length: { n: 1, d: 4 } },
      {
        note: 'G3',
        onset: { n: 1, d: 4 },
        length: { n: 1, d: 2 },
        holds: [{ n: 1, d: 4 }],
      },
      { note: 'C4', onset: { n: 7, d: 8 }, length: { n: 1, d: 4 } },
      { note: 'D4', onset: { n: 9, d: 8 }, length: { n: 1, d: 2 } },
    ],
    strips: [
      {
        bar: 1,
        count: 'full',
        segments: [
          {
            kind: 'note',
            note: 'A3',
            from: { n: 0, d: 1 },
            to: { n: 1, d: 4 },
          },
          {
            kind: 'note',
            note: 'G3',
            from: { n: 1, d: 4 },
            to: { n: 3, d: 4 },
            held: [{ n: 1, d: 2 }],
          },
          { kind: 'rest', from: { n: 3, d: 4 }, to: { n: 7, d: 8 } },
          {
            kind: 'note',
            note: 'C4',
            from: { n: 7, d: 8 },
            to: { n: 1, d: 1 },
            tiedOut: true,
          },
        ],
      },
      {
        bar: 2,
        count: '2½ of 4 beats',
        segments: [
          {
            kind: 'note',
            note: 'C4',
            from: { n: 0, d: 1 },
            to: { n: 1, d: 8 },
            tiedIn: true,
          },
          {
            kind: 'note',
            note: 'D4',
            from: { n: 1, d: 8 },
            to: { n: 5, d: 8 },
          },
          { kind: 'empty', from: { n: 5, d: 8 }, to: { n: 1, d: 1 } },
        ],
      },
    ],
  },
  {
    name: '3/4 counts three beats',
    meter: '3/4',
    notes: [
      { note: 'C4', onset: { n: 0, d: 1 }, length: { n: 1, d: 4 } },
      { note: 'D4', onset: { n: 1, d: 4 }, length: { n: 1, d: 4 } },
    ],
    strips: [
      {
        bar: 1,
        count: '2 of 3 beats',
        segments: [
          {
            kind: 'note',
            note: 'C4',
            from: { n: 0, d: 1 },
            to: { n: 1, d: 4 },
          },
          {
            kind: 'note',
            note: 'D4',
            from: { n: 1, d: 4 },
            to: { n: 1, d: 2 },
          },
          { kind: 'empty', from: { n: 1, d: 2 }, to: { n: 3, d: 4 } },
        ],
      },
    ],
  },
  {
    // 6/8 counts two dotted-crotchet beats.
    name: '6/8 counts in dotted crotchets',
    meter: '6/8',
    notes: [{ note: 'E4', onset: { n: 0, d: 1 }, length: { n: 3, d: 8 } }],
    strips: [
      {
        bar: 1,
        count: '1 of 2 beats',
        segments: [
          {
            kind: 'note',
            note: 'E4',
            from: { n: 0, d: 1 },
            to: { n: 3, d: 8 },
          },
          { kind: 'empty', from: { n: 3, d: 8 }, to: { n: 3, d: 4 } },
        ],
      },
    ],
  },
  {
    // A melody starting on beat 2 has a rest before it, and the bars the
    // chords cover show even with no melody in them.
    name: 'a rest at the start, and empty bars to the end of the chords',
    meter: '4/4',
    bars: 2,
    notes: [{ note: 'G4', onset: { n: 1, d: 4 }, length: { n: 3, d: 4 } }],
    strips: [
      {
        bar: 1,
        count: 'full',
        segments: [
          { kind: 'rest', from: { n: 0, d: 1 }, to: { n: 1, d: 4 } },
          {
            kind: 'note',
            note: 'G4',
            from: { n: 1, d: 4 },
            to: { n: 1, d: 1 },
          },
        ],
      },
      {
        bar: 2,
        count: '0 of 4 beats',
        segments: [{ kind: 'empty', from: { n: 0, d: 1 }, to: { n: 1, d: 1 } }],
      },
    ],
  },
]
