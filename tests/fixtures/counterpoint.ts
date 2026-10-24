// Golden fixture: counterpoint against a melody (PLAN Phase 7 task 18,
// David's request, 2026-10-24). Never edit this to make a test pass: ask
// David.
//
// Two voices, the melody and a line above or below it. Intervals are
// counted up from the lower voice: P1, 3rds, P5, 6ths, P8 and their
// compounds are consonant; 2nds, 4ths, 7ths, the tritone and every
// augmented or diminished interval are dissonant. A "strong" point is where
// a melody note starts. Melodies and lines are typed as the Melody tab
// reads them: each word lasts `value` (wholes), r is a rest, - holds the
// note before.

export type CounterpointCheckFixture = {
  name: string
  key: string
  melody: string // whole notes
  species: 1 | 2 | 3 | 4 | 5
  side: 'above' | 'below'
  mode: 'strict' | 'freer'
  value: string // the length of each word of the line: '1', '1/2'
  line: string
  // Every rule the line breaks, as rule@place (the line note's index),
  // in order; [] when it keeps every rule.
  breaks: string[]
}

// Cantus firmi in whole notes, one in each of six modes, in the style of
// Fux's Gradus ad Parnassum. Each ends by step onto its final.
export const CANTUS: { name: string; key: string; melody: string }[] = [
  {
    name: 'D Dorian',
    key: 'D dorian',
    melody: 'D4 F4 E4 D4 G4 F4 A4 G4 F4 E4 D4',
  },
  {
    name: 'E Phrygian',
    key: 'E phrygian',
    melody: 'E4 C4 D4 C4 A3 A4 G4 E4 F4 E4',
  },
  {
    name: 'F Lydian',
    key: 'F lydian',
    melody: 'F4 G4 A4 F4 D4 E4 F4 C5 A4 F4 G4 F4',
  },
  {
    name: 'G Mixolydian',
    key: 'G mixolydian',
    melody: 'G4 C5 B4 G4 C5 E5 D5 G5 E5 C5 D5 B4 A4 G4',
  },
  {
    name: 'A Aeolian',
    key: 'A natural-minor',
    melody: 'A3 C4 B3 D4 C4 E4 F4 E4 D4 C4 B3 A3',
  },
  {
    name: 'C Ionian',
    key: 'C major',
    melody: 'C4 E4 F4 G4 E4 A4 G4 E4 F4 E4 D4 C4',
  },
]

const DORIAN = 'D4 F4 E4 D4 G4 F4 A4 G4 F4 E4 D4'
const SHORT = 'C4 D4 F4 E4 D4 C4'

export const counterpointChecks: CounterpointCheckFixture[] = [
  {
    // D–A P5 (start), F–A M3, E–G m3, D–A P5, G–B M3, F–C P5, A–C m3,
    // G–B M3, F–D M6, E–C♯ M6, D–D P8. C♯ is the raised leading note,
    // rising a semitone to D as the melody falls E–D: a cadence.
    name: 'first species above the Dorian cantus, keeping every rule',
    key: 'D dorian',
    melody: DORIAN,
    species: 1,
    side: 'above',
    mode: 'strict',
    value: '1',
    line: 'A4 A4 G4 A4 B4 C5 C5 B4 D5 C#5 D5',
    breaks: [],
  },
  {
    // D3–D4 P8 (start), A3–F4 m6 (a 5th's leap, turned back next), G3–E4
    // M6, F3–D4 M6, E3–G4 m10, D3–F4 m10, F3–A4 M10, G3–G4 P8, D4–F4 m3
    // (a 5th's leap, turned back next), C♯4–E4 m3, D4–D4 P1: the leading
    // note rises to a unison as the melody falls.
    name: 'first species below the Dorian cantus, keeping every rule',
    key: 'D dorian',
    melody: DORIAN,
    species: 1,
    side: 'below',
    mode: 'strict',
    value: '1',
    line: 'D3 A3 G3 F3 E3 D3 F3 G3 D4 C#4 D4',
    breaks: [],
  },
  {
    // D–A P5 to G–D P5, both rising, then to F–C P5, both falling.
    name: 'parallel 5ths',
    key: 'D dorian',
    melody: DORIAN,
    species: 1,
    side: 'above',
    mode: 'strict',
    value: '1',
    line: 'A4 A4 G4 A4 D5 C5 C5 B4 D5 C#5 D5',
    breaks: ['cp-parallel@4', 'cp-parallel@5'],
  },
  {
    // Parallel 5ths are out in freer rules too.
    name: 'parallel 5ths, freer',
    key: 'D dorian',
    melody: DORIAN,
    species: 1,
    side: 'above',
    mode: 'freer',
    value: '1',
    line: 'A4 A4 G4 A4 D5 C5 C5 B4 D5 C#5 D5',
    breaks: ['cp-parallel@4', 'cp-parallel@5'],
  },
  {
    // E–F, a minor 2nd, where a melody note starts.
    name: 'a dissonance on the beat',
    key: 'D dorian',
    melody: DORIAN,
    species: 1,
    side: 'above',
    mode: 'strict',
    value: '1',
    line: 'A4 A4 F4 A4 B4 C5 C5 B4 D5 C#5 D5',
    breaks: ['cp-consonance@2'],
  },
  {
    // A4 leaps a 5th up to E5 (G–E M6), then keeps rising to F5 (F–F P8).
    name: 'a leap that doesn’t turn back',
    key: 'D dorian',
    melody: DORIAN,
    species: 1,
    side: 'above',
    mode: 'strict',
    value: '1',
    line: 'A4 A4 G4 A4 E5 F5 C5 B4 D5 C#5 D5',
    breaks: ['cp-recover@5'],
  },
  {
    // E–C m6 to D–D P8: both voices move a whole step, so neither leads
    // in by a semitone; the line should raise C to C♯.
    name: 'no leading note at the cadence',
    key: 'D dorian',
    melody: DORIAN,
    species: 1,
    side: 'above',
    mode: 'strict',
    value: '1',
    line: 'A4 A4 G4 A4 B4 C5 C5 B4 D5 C5 D5',
    breaks: ['cp-cadence@10'],
  },
  {
    // F–A M3 to A–E P5: both rise, the line by a leap of a 5th: a hidden
    // (direct) 5th. E5 then turns back down to B4.
    name: 'a hidden 5th',
    key: 'D dorian',
    melody: DORIAN,
    species: 1,
    side: 'above',
    mode: 'strict',
    value: '1',
    line: 'A4 A4 G4 A4 B4 A4 E5 B4 D5 C#5 D5',
    breaks: ['cp-hidden@6'],
  },
  {
    // Freer rules allow a hidden 5th.
    name: 'a hidden 5th, freer',
    key: 'D dorian',
    melody: DORIAN,
    species: 1,
    side: 'above',
    mode: 'freer',
    value: '1',
    line: 'A4 A4 G4 A4 B4 A4 E5 B4 D5 C#5 D5',
    breaks: [],
  },
  {
    // D–F, a 3rd, to start: strict starts on a perfect interval.
    name: 'starting on a 3rd',
    key: 'D dorian',
    melody: DORIAN,
    species: 1,
    side: 'above',
    mode: 'strict',
    value: '1',
    line: 'F4 A4 G4 A4 B4 C5 C5 B4 D5 C#5 D5',
    breaks: ['cp-start@0'],
  },
  {
    // Freer starts on any consonance.
    name: 'starting on a 3rd, freer',
    key: 'D dorian',
    melody: DORIAN,
    species: 1,
    side: 'above',
    mode: 'freer',
    value: '1',
    line: 'F4 A4 G4 A4 B4 C5 C5 B4 D5 C#5 D5',
    breaks: [],
  },
  {
    // Halves: C–G P5, C–E M3 | D–F m3, D–G P4 passing F–G–A | F–A M3,
    // F–D M6 | E–C m6, E–G m3 | D–A P5, D–B M6 | C–C P8. B rises a
    // semitone to C as the melody falls D–C.
    name: 'second species above, keeping every rule',
    key: 'C major',
    melody: SHORT,
    species: 2,
    side: 'above',
    mode: 'strict',
    value: '1/2',
    line: 'G4 E4 F4 G4 A4 D5 C5 G4 A4 B4 C5 -',
    breaks: [],
  },
  {
    // D–G, a 4th off the beat, reached by step but left by a leap up to
    // C5, which rises with the melody into F–C, a 5th: a hidden 5th too.
    name: 'second species, a dissonance left by a leap',
    key: 'C major',
    melody: SHORT,
    species: 2,
    side: 'above',
    mode: 'strict',
    value: '1/2',
    line: 'G4 E4 F4 G4 C5 D5 C5 G4 A4 B4 C5 -',
    breaks: ['cp-dissonance-step@3', 'cp-hidden@4'],
  },
  {
    // Tied across the beat: C–C P8 held into D–C m7, a 7–6 suspension
    // resolving down to D–B M6; B held into E–B P5; C (E–C m6) held into
    // D–C m7, resolving to B; C–C P8 to end.
    name: 'fourth species above, keeping every rule',
    key: 'C major',
    melody: 'C4 D4 E4 D4 C4',
    species: 4,
    side: 'above',
    mode: 'strict',
    value: '1/2',
    line: 'r C5 - B4 - C5 - B4 C5 -',
    breaks: [],
  },
  {
    // C held into D–C m7 rises to D5 instead of falling a step: the
    // suspension isn't resolved. C–C on the off-beat, then D–D on the
    // next, both voices rising: octaves on successive off-beats (David
    // agreed, 2026-10-24, that strict counts these).
    name: 'fourth species, a suspension that rises',
    key: 'C major',
    melody: 'C4 D4 E4 D4 C4',
    species: 4,
    side: 'above',
    mode: 'strict',
    value: '1/2',
    line: 'r C5 - D5 - C5 - B4 C5 -',
    breaks: ['cp-suspension@0', 'cp-offbeat-parallel@1'],
  },
  {
    // D5 starts against E4, a minor 7th, and is held into D–D, an octave:
    // a tied note that starts as a dissonance isn't prepared. The rest
    // keeps every rule (C held into D–C m7 resolving to B; B held into
    // E–B P5; B rising a semitone to C to end).
    name: 'fourth species, a tied note that starts as a dissonance',
    key: 'C major',
    melody: 'C4 D4 E4 D4 C4',
    species: 4,
    side: 'above',
    mode: 'strict',
    value: '1/2',
    line: 'r C5 - B4 - D5 - B4 C5 -',
    breaks: ['cp-preparation@2'],
  },
  {
    // Below: E3–E4 P8, F3–C4 P5 (contrary), G3–G4 P8: both voices rise
    // into the octave and the upper voice, the melody, leaps C–G: a hidden
    // octave. Then A3–F4 m6, C4–E4 M3, B3–D4 m3, C4–C4 P1 (B rises a
    // semitone as the melody falls D–C).
    name: 'a hidden octave below, the melody leaping',
    key: 'C major',
    melody: 'E4 C4 G4 F4 E4 D4 C4',
    species: 1,
    side: 'below',
    mode: 'strict',
    value: '1',
    line: 'E3 F3 G3 A3 C4 B3 C4',
    breaks: ['cp-hidden@2'],
  },
  {
    // D–A P5, C–E M3, D–D P1: the melody rises C–D and the line falls
    // E–D, both a whole step, so neither leads in by a semitone.
    name: 'a melody rising a whole step to its last note',
    key: 'D dorian',
    melody: 'D4 C4 D4',
    species: 1,
    side: 'above',
    mode: 'strict',
    value: '1',
    line: 'A4 E4 D4',
    breaks: ['cp-cadence@2'],
  },
  {
    // Quarters over C: C5 (P8), B4 (M7, stepping down), G4 (P5, a 3rd's
    // leap down), A4 (M6, stepping back up): a nota cambiata. Over D: B4
    // M6, C5 m7 passing B–C–D, D5 P8, B4 M6. C–C P8 to end, B rising a
    // semitone as the melody falls.
    name: 'third species, a nota cambiata',
    key: 'C major',
    melody: 'C4 D4 C4',
    species: 3,
    side: 'above',
    mode: 'strict',
    value: '1/4',
    line: 'C5 B4 G4 A4 B4 C5 D5 B4 C5 - - -',
    breaks: [],
  },
  {
    // Halves: A–E P5, A–C m3 | B–D m3, B–G m6 | C–A M6, C–E M3 | B–F♯ P5
    // (contrary), B–G♯ M6 | A–A P8. F♯ is the raised 6th, stepping up to
    // G♯, the raised leading note, so the line climbs 6–7–8 into the
    // cadence without an augmented 2nd.
    name: 'second species in A minor, the raised 6th and 7th',
    key: 'A natural-minor',
    melody: 'A3 B3 C4 B3 A3',
    species: 2,
    side: 'above',
    mode: 'strict',
    value: '1/2',
    line: 'E4 C4 D4 G4 A4 E4 F#4 G#4 A4 -',
    breaks: [],
  },
]

// Melodies with rhythm (the app's melodies aren't whole notes), for the
// rules every line must keep or explain. Each word lasts `value`.
export const RHYTHMIC: {
  name: string
  key: string
  meter: [number, number]
  chords: string[] // a bar each
  value: string
  melody: string
}[] = [
  {
    name: 'C major, 4/4, with a held note',
    key: 'C major',
    meter: [4, 4],
    chords: ['C', 'F', 'G', 'C'],
    value: '1/4',
    melody: 'E4 G4 A4 G4 F4 A4 C5 A4 G4 F4 E4 D4 C4 - - -',
  },
  {
    name: 'A minor, 4/4, with a rest',
    key: 'A natural-minor',
    meter: [4, 4],
    chords: ['Am', 'Dm', 'E', 'Am'],
    value: '1/4',
    melody: 'A4 C5 B4 A4 F4 r A4 D5 E5 - B4 G#4 A4 - - -',
  },
  {
    name: 'G major, 3/4',
    key: 'G major',
    meter: [3, 4],
    chords: ['G', 'C', 'D', 'G'],
    value: '1/4',
    melody: 'D5 B4 G4 C5 E5 C5 A4 F#4 A4 G4 - -',
  },
  {
    name: 'E minor, 6/8, quavers',
    key: 'E natural-minor',
    meter: [6, 8],
    chords: ['Em', 'Am', 'B', 'Em'],
    value: '1/8',
    melody:
      'E4 G4 B4 A4 G4 F#4 E4 A4 C5 B4 A4 G4 F#4 A4 B4 D#5 B4 A4 G4 F#4 E4 - - -',
  },
]
