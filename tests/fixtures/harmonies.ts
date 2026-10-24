// Golden fixture: harmonies of a melody (PLAN Phase 7 task 5, SPEC 7.4).
// Never edit this to make a test pass: ask David.
// A harmony moves with the melody, note for note, at an interval counted
// in the key's letters: a 3rd above C in C major is E, above D it is F.
// - Chord-aware: on a strong beat, where the melody is a tone of the chord
//   but the strict interval isn't, the harmony bends a step to a chord tone
//   it still sounds well against (away from the melody first, never to a
//   2nd or 7th from it), tagged bent.
// - Where the chord has the letter altered (E7's G♯ in C), the harmony
//   takes the chord's note, tagged chromatic.
// - A scale with no note on the letter (C major pentatonic has no F) bends
//   to a note of the key a step away.
// - Power-chord parallels are exact perfect 5ths and 4ths, as a power
//   chord is, tagged chromatic wherever they leave the key.
// Melodies are typed as the Melody tab reads them, each word a crotchet;
// chords are a bar each in 4/4, so beats 1 and 3 are strong.

export type HarmonyFixture = {
  name: string
  key: string // tonic and scale id
  chords: string[]
  melody: string
  kind: string // a harmony id
  notes: string // the harmony, note for note
  tags?: Record<number, string[]> // tags a note must carry, by index
  untagged?: Record<number, string[]> // tags a note must not carry
}

export const harmonies: HarmonyFixture[] = [
  {
    // C D E F over C: E F G A. E and G are chord tones on the strong beats;
    // F and A pass with the melody.
    name: '3rds above a scale over C',
    key: 'C major',
    chords: ['C'],
    melody: 'C4 D E F',
    kind: '3rd-above',
    notes: 'E4 F4 G4 A4',
    tags: { 0: ['chord-tone'], 1: ['passing'], 2: ['chord-tone'] },
    untagged: { 0: ['bent'], 1: ['chromatic'] },
  },
  {
    // G is the 5th of C, but B, a 3rd above it, isn't in C: on the strong
    // beats the harmony bends up to C, a 4th above. A's 3rd above is C
    // anyway; E's is G.
    name: '3rds above bend to a chord tone on strong beats',
    key: 'C major',
    chords: ['C'],
    melody: 'G4 A G E',
    kind: '3rd-above',
    notes: 'C5 C5 C5 G4',
    tags: { 0: ['bent', 'chord-tone'], 2: ['bent', 'chord-tone'] },
    untagged: { 1: ['bent'], 3: ['bent'] },
  },
  {
    // A weak beat doesn't bend: G on beat 4 keeps B a 3rd above. F♯ is
    // outside the key; the harmony stays in it, A a 3rd above.
    name: '3rds above a chromatic melody note stay in the key',
    key: 'C major',
    chords: ['C'],
    melody: 'E4 F# G G',
    kind: '3rd-above',
    notes: 'G4 A4 C5 B4',
    tags: { 2: ['bent'] },
    untagged: { 1: ['chromatic'], 3: ['bent'] },
  },
  {
    // 6ths below: G under E, A under F. Under G on the strong beat B isn't
    // in C, and a 7th below would clash, so it bends to C, a 5th below.
    name: '6ths below bend towards the melody rather than to a 7th',
    key: 'C major',
    chords: ['C'],
    melody: 'E4 F G C5',
    kind: '6th-below',
    notes: 'G3 A3 C4 E4',
    tags: { 2: ['bent', 'chord-tone'], 3: ['chord-tone'] },
  },
  {
    name: '3rds below a falling scale',
    key: 'C major',
    chords: ['C'],
    melody: 'G4 F E D',
    kind: '3rd-below',
    notes: 'E4 D4 C4 B3',
    tags: { 0: ['chord-tone'], 2: ['chord-tone'] },
  },
  {
    // E7 is V of vi in C: its G♯ replaces the key's G a 3rd above E.
    name: 'a chromatic chord lends its own note',
    key: 'C major',
    chords: ['E7'],
    melody: 'E4 D B3 D4',
    kind: '3rd-above',
    notes: 'G♯4 F4 D4 F4',
    tags: { 0: ['chord-tone', 'chromatic'], 2: ['chord-tone'] },
  },
  {
    // A harmonic minor has G♯: a 3rd above E over E is G♯, in the key.
    name: '3rds above in harmonic minor',
    key: 'A harmonic-minor',
    chords: ['E'],
    melody: 'E4 F G# A',
    kind: '3rd-above',
    notes: 'G♯4 A4 B4 C5',
    tags: { 0: ['chord-tone'], 2: ['chord-tone'] },
    untagged: { 0: ['chromatic'] },
  },
  {
    // C major pentatonic has no F or B: a 3rd above D bends to G, and a
    // 3rd above G bends to C.
    name: '3rds above in a pentatonic key bend round missing notes',
    key: 'C major-pentatonic',
    chords: ['C'],
    melody: 'C4 D E G',
    kind: '3rd-above',
    notes: 'E4 G4 G4 C5',
    tags: { 1: ['bent'], 3: ['bent'] },
    untagged: { 1: ['chromatic'], 3: ['chromatic'] },
  },
  {
    // A perfect 5th below F is B♭, outside C major.
    name: 'power 5ths below are exact',
    key: 'C major',
    chords: ['C'],
    melody: 'C4 D E F',
    kind: 'power-5th-below',
    notes: 'F3 G3 A3 B♭3',
    tags: { 3: ['chromatic'] },
    untagged: { 0: ['chromatic'], 1: ['chromatic'], 2: ['chromatic'] },
  },
  {
    name: 'power 4ths below are exact',
    key: 'C major',
    chords: ['C'],
    melody: 'C4 D E F',
    kind: 'power-4th-below',
    notes: 'G3 A3 B3 C4',
  },
  {
    // A diatonic 4th below B is F, a tritone, not the F♯ a perfect 4th
    // would be: the diatonic kind stays in the key. F is G7's 7th.
    name: 'diatonic 4ths below stay in the key',
    key: 'C major',
    chords: ['G7'],
    melody: 'B4 A G F',
    kind: '4th-below',
    notes: 'F4 E4 D4 C4',
    tags: { 0: ['chord-tone'], 2: ['chord-tone'] },
    untagged: { 0: ['chromatic', 'bent'] },
  },
  {
    name: 'octaves above',
    key: 'C major',
    chords: ['C'],
    melody: 'E4 F# G A',
    kind: 'octave-above',
    notes: 'E5 F♯5 G5 A5',
    tags: { 1: ['chromatic'] },
  },
]

// A countermelody: a line under the melody that moves against it, contrary
// motion where the melody moves, chord tones on strong beats, a 3rd, 6th or
// 10th below where it can, and never parallel 5ths or octaves with it.
export type CounterFixture = {
  name: string
  key: string
  chords: string[]
  melody: string
  notes?: string // the countermelody, where it is worked out by hand
}

export const counters: CounterFixture[] = [
  {
    // C D E F over C: the line falls as the melody rises. It starts on
    // E, a 6th below C (the 3rd of C), and falls by step through D to C
    // under E (a 10th apart) on the strong beat, then passes on to B.
    name: 'a rising scale gets a falling line',
    key: 'C major',
    chords: ['C'],
    melody: 'C5 D E F',
    notes: 'E4 D4 C4 B3',
  },
  {
    name: 'a falling line in A minor',
    key: 'A natural-minor',
    chords: ['Am', 'Dm', 'E', 'Am'],
    melody: 'E5 D C B A B C D E F E D C B A -',
  },
  {
    name: 'leaps and repeats in G major',
    key: 'G major',
    chords: ['G', 'C', 'D', 'G'],
    melody: 'D5 D B G A C B A G B D D C A F# -',
  },
]
