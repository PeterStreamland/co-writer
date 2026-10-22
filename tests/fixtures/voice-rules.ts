// Golden fixture: voice-leading rule checks, worked out by hand (PLAN Phase
// 5 task 3). Never edit this to make a test pass: ask David.
// Voicings list one note per voice, lowest voice first (bass, tenor, alto,
// soprano in four parts), in ASCII (# sharp, b flat) with scientific
// octaves. Each hit is "rule voices", voices counted from 0 for the lowest.
// Rules on one chord (spacing, low register, thirds under gain) check the
// `to` voicing; rules on motion (parallels, resolutions) need `from` too.
// Thirds under gain are checked only for distorted sounds (`gain`).

export const voiceRules: {
  name: string
  key: string
  from?: { chord: string; notes: string }
  to: { chord: string; notes: string }
  gain?: boolean
  hits: string[]
}[] = [
  {
    name: 'parallel 5ths and octaves, everything moving up a tone',
    key: 'C major',
    from: { chord: 'C', notes: 'C3 G3 E4 C5' },
    to: { chord: 'Dm', notes: 'D3 A3 F4 D5' },
    hits: ['parallel-fifths 0-1', 'parallel-octaves 0-3'],
  },
  {
    name: '5ths by contrary motion count too',
    key: 'C major',
    from: { chord: 'C', notes: 'C3 G3 E4 C5' },
    to: { chord: 'G', notes: 'G2 D4 B4 D5' },
    hits: ['parallel-fifths 0-1'],
  },
  {
    name: 'C to F, smoothly, with nothing wrong',
    key: 'C major',
    from: { chord: 'C', notes: 'C3 E4 G4 C5' },
    to: { chord: 'F', notes: 'F3 F4 A4 C5' },
    hits: [],
  },
  {
    name: 'a diminished 5th to a perfect 5th is not parallel 5ths',
    key: 'C major',
    from: { chord: 'G7', notes: 'G2 B3 D4 F4' },
    to: { chord: 'C', notes: 'C3 C4 E4 G4' },
    // B–F to C–G is fine, but the 7th, F, rises to G.
    hits: ['seventh 3'],
  },
  {
    name: 'G7 to C: the leading note rises and the 7th falls',
    key: 'C major',
    from: { chord: 'G7', notes: 'G2 B3 D4 F4' },
    to: { chord: 'C', notes: 'C3 C4 C4 E4' },
    hits: [],
  },
  {
    name: 'the leading note in the top voice falls',
    key: 'C major',
    from: { chord: 'G', notes: 'G2 D4 G4 B4' },
    to: { chord: 'C', notes: 'C3 E4 G4 G4' },
    hits: ['leading-note 3'],
  },
  {
    name: 'an inner leading note may fall to the 5th',
    key: 'C major',
    from: { chord: 'G', notes: 'G2 B3 D4 G4' },
    to: { chord: 'C', notes: 'C3 G3 C4 E4' },
    hits: [],
  },
  {
    name: "the leading note doesn't have to rise when V doesn't go to I",
    key: 'C major',
    from: { chord: 'G', notes: 'G2 D4 G4 B4' },
    to: { chord: 'Am', notes: 'A2 C4 E4 A4' },
    // B falls to A, which is fine in the deceptive cadence.
    hits: [],
  },
  {
    name: 'G7 to Cmaj7: the leading note may stay as the major 7th',
    key: 'C major',
    from: { chord: 'G7', notes: 'G2 F3 G3 B3' },
    to: { chord: 'Cmaj7', notes: 'C3 E3 G3 B3' },
    hits: [],
  },
  {
    name: 'G to C: the leading note may not stay when C has no B',
    key: 'C major',
    from: { chord: 'G', notes: 'G2 D3 G3 B3' },
    to: { chord: 'C', notes: 'C3 E3 G3 B3' },
    hits: ['leading-note 3'],
  },
  {
    name: 'A minor: the raised leading note G# rises to A',
    key: 'A minor',
    from: { chord: 'E', notes: 'E3 B3 E4 G#4' },
    to: { chord: 'Am', notes: 'A2 C4 E4 A4' },
    hits: [],
  },
  {
    name: 'A minor: G# falling to E',
    key: 'A minor',
    from: { chord: 'E', notes: 'E3 B3 E4 G#4' },
    to: { chord: 'Am', notes: 'A2 C4 E4 E4' },
    hits: ['leading-note 3'],
  },
  {
    name: 'leading-note chord to I: B rises',
    key: 'C major',
    from: { chord: 'Bdim', notes: 'D3 F3 B3 D4' },
    to: { chord: 'C', notes: 'C3 E3 C4 E4' },
    hits: [],
  },
  {
    name: 'Dm7 to G: the 7th, C, falls to B',
    key: 'C major',
    from: { chord: 'Dm7', notes: 'D3 A3 C4 F4' },
    to: { chord: 'G', notes: 'G2 G3 B3 D4' },
    hits: [],
  },
  {
    name: 'Dm7 to Am: a 7th held into the next chord is fine',
    key: 'C major',
    from: { chord: 'Dm7', notes: 'D3 F3 A3 C4' },
    to: { chord: 'Am', notes: 'A2 E3 A3 C4' },
    hits: [],
  },
  {
    name: 'spacing: more than an octave between tenor and alto',
    key: 'C major',
    to: { chord: 'C', notes: 'C3 C4 E5 G5' },
    hits: ['spacing 1-2'],
  },
  {
    name: 'spacing: a wide gap over the bass is fine',
    key: 'C major',
    to: { chord: 'C', notes: 'C2 E4 G4 C5' },
    hits: [],
  },
  {
    name: 'low register: close 3rds in the bass are muddy',
    key: 'C major',
    to: { chord: 'C', notes: 'C2 E2 G2' },
    hits: ['low-register 0-1', 'low-register 1-2'],
  },
  {
    name: 'low register: an E power chord is clear',
    key: 'E minor',
    to: { chord: 'E5', notes: 'E2 B2 E3' },
    hits: [],
  },
  {
    name: 'low register: a 5th below B♭1 is muddy',
    key: 'A minor',
    to: { chord: 'A5', notes: 'A1 E2' },
    hits: ['low-register 0-1'],
  },
  {
    name: 'thirds under gain: an open E major chord has two',
    key: 'E major',
    to: { chord: 'E', notes: 'E2 B2 E3 G#3' },
    gain: true,
    // E2–G#3 is a 10th, E3–G#3 a 3rd; B2–G#3 is a 6th.
    hits: ['thirds-under-gain 0-3', 'thirds-under-gain 2-3'],
  },
  {
    name: 'thirds under gain: an E power chord has none',
    key: 'E minor',
    to: { chord: 'E5', notes: 'E2 B2 E3' },
    gain: true,
    hits: [],
  },
  {
    name: 'thirds under gain: not checked for a clean sound',
    key: 'E major',
    to: { chord: 'E', notes: 'E2 B2 E3 G#3' },
    hits: [],
  },
]
