// Golden fixture: next-note suggestions (PLAN Phase 7 task 2, SPEC 7.3).
// Never edit this to make a test pass: ask David.
// Each case is a melody so far, typed as the Melody tab reads it (each
// word a crotchet unless `value` says otherwise), over chords a bar each
// in 4/4 unless given lengths. The next note comes straight after the last
// and lasts the same value. Notes are written with octaves (middle C is
// C4) and their spelling.
//
// What the rules say:
// - notes of the key first; notes outside it are tagged chromatic
// - chord tones on strong beats (1 and 3 in 4/4)
// - mostly steps; after a leap of a 4th or more, a change of direction
// - tendency notes resolve: the leading note (7) up to 1, 4 down to 3
// - every suggestion stays inside the range
//
// Tags: chord-tone, passing (a step on in the same direction, not a chord
// tone), neighbour (a step that turns back, or steps off a repeated note,
// not a chord tone), leap (a 3rd or more), repeat, chromatic.

export type NextNoteFixture = {
  name: string
  key: string // tonic and scale id: 'C major', 'A natural-minor'
  chords: (string | [string, { n: number; d: number }])[]
  melody: string
  value?: { n: number; d: number }
  range?: [string, string] // low, high; tenor C3–A4 when unset
  top?: string // the best suggestion
  inTop?: string[] // all within the suggestions shown
  above?: [string, string][] // the first ranks above the second
  absent?: string[] // never suggested
  tags?: Record<string, string[]> // a suggestion's tags include these
}

export const nextNotes: NextNoteFixture[] = [
  {
    // B4 on beat 2 is the leading note: next comes beat 3, a strong beat
    // of C, and C5 is both its resolution and a chord tone.
    name: 'the leading note rises to the tonic',
    key: 'C major',
    chords: ['C'],
    melody: 'A4 B4',
    range: ['C4', 'A5'],
    top: 'C5',
  },
  {
    // F on beat 4 of G7 falls to E on beat 1 of C: 4 down to 3.
    name: '4 falls to 3 over the next chord',
    key: 'C major',
    chords: ['G7', 'C'],
    melody: 'G4 A G F',
    top: 'E4',
  },
  {
    // A leap up a 6th, C to A, then a change of direction on beat 4: G (a
    // step down) ranks above B and C (on up), though C is a chord tone.
    name: 'after a leap the melody turns back',
    key: 'C major',
    chords: ['F'],
    melody: 'F4 C4 A4',
    range: ['C4', 'A5'],
    above: [
      ['G4', 'B4'],
      ['G4', 'C5'],
    ],
  },
  {
    // Beat 3 of G is strong: a chord tone comes first.
    name: 'a chord tone on the strong beat',
    key: 'G major',
    chords: ['G'],
    melody: 'B3 C4',
    top: 'B3',
    tags: { B3: ['chord-tone'], D4: ['chord-tone'] },
  },
  {
    // Tenor tops out at A4: nothing higher, even a step up.
    name: 'stays inside the tenor range',
    key: 'C major',
    chords: ['F'],
    melody: 'F4 G4 A4',
    absent: ['B4', 'C5', 'D5'],
  },
  {
    // Steps on a weak beat after D E: F carries on up, so it is passing;
    // D turns back, so it is a neighbour; A is a leap.
    name: 'passing and neighbour notes',
    key: 'C major',
    chords: ['C'],
    melody: 'D4 E4',
    value: { n: 1, d: 8 },
    tags: { F4: ['passing'], D4: ['neighbour'], A4: ['leap'] },
  },
  {
    // In C, C♯ is outside the key: spelled sharp going up from C, flat
    // coming down from D, and tagged chromatic either way.
    name: 'chromatic notes are spelled by direction and tagged',
    key: 'C major',
    chords: ['C'],
    melody: 'C4',
    value: { n: 1, d: 8 },
    tags: { 'C♯4': ['chromatic'] },
    absent: ['D♭4'],
    above: [['D4', 'C♯4']],
  },
  {
    name: 'coming down, the chromatic note is a flat',
    key: 'C major',
    chords: ['C'],
    melody: 'D4',
    value: { n: 1, d: 8 },
    tags: { 'D♭4': ['chromatic'] },
    absent: ['C♯4'],
  },
  {
    // Over E in A minor, G♯ is a chord tone, spelled as the chord spells
    // it, and the leading note rises to A over Am.
    name: 'harmonic minor: G♯ over E rises to A',
    key: 'A natural-minor',
    chords: ['E', 'Am'],
    melody: 'B3 C4 B3 G♯3',
    top: 'A3',
    absent: ['A♭3'],
  },
  {
    // With no melody yet, the first note is a tone of the first chord.
    name: 'the first note is a chord tone',
    key: 'D major',
    chords: ['D'],
    melody: '',
    inTop: ['D4', 'F♯4', 'A3'],
    tags: { 'F♯4': ['chord-tone'] },
  },
  {
    // A note struck again is offered, tagged repeat, and on a weak beat a
    // repeated chord tone is a fine choice.
    name: 'repeating the note',
    key: 'C major',
    chords: ['C'],
    melody: 'G4',
    tags: { G4: ['repeat', 'chord-tone'] },
    inTop: ['G4'],
  },
  {
    // Struck twice already, the note gives way: a third repeat in a row
    // drops below moving on.
    name: 'repeats give way after the second',
    key: 'C major',
    chords: ['C'],
    melody: 'E4 E4 E4',
    above: [
      ['D4', 'E4'],
      ['F4', 'E4'],
      ['G4', 'E4'],
    ],
  },
  {
    // C B C is a neighbour note; going back to B again would rock between
    // the two, so moving on to D comes first.
    name: 'no rocking between two notes',
    key: 'C major',
    chords: ['C'],
    melody: 'C4 B3 C4',
    above: [['D4', 'B3']],
  },
  {
    // Leaps larger than an octave are never offered.
    name: 'no leap beyond an octave',
    key: 'C major',
    chords: ['C'],
    melody: 'C4',
    range: ['C3', 'C6'],
    absent: ['D5', 'E5', 'B2'],
  },
]
