// Counterpoint against a melody as data (PLAN Phase 7 task 18): the five
// species and the rhythms each sets against a melody note, the rules a
// line is checked against in strict and freer counterpoint, how the
// search weighs its choices, and the wording of every reason and break.

export type CounterpointSide = 'above' | 'below'
export type CounterpointMode = 'strict' | 'freer'

// A piece of a line against one melody note, as a share of the note's
// length: a new note, a rest, or the note before held on (a tie).
export type Piece = { share: [number, number]; rest?: true; tie?: true }

export type Species = {
  id: 1 | 2 | 3 | 4 | 5
  label: string
  short: string
  // What a melody note gets: the first patterns that fit are used, in
  // order (David's choice: species fit the melody note by note). The last
  // melody note always gets one note of its own length.
  patterns: Piece[][]
  // The first melody note's patterns, where they differ.
  first?: Piece[][]
}

const WHOLE: Piece[] = [{ share: [1, 1] }]
const HALVES: Piece[] = [{ share: [1, 2] }, { share: [1, 2] }]
const QUARTERS: Piece[] = [
  { share: [1, 4] },
  { share: [1, 4] },
  { share: [1, 4] },
  { share: [1, 4] },
]
const TIED: Piece[] = [{ share: [1, 2], tie: true }, { share: [1, 2] }]
const REST_HALF: Piece[] = [{ share: [1, 2], rest: true }, { share: [1, 2] }]

export const SPECIES: Species[] = [
  {
    id: 1,
    label: 'Note against note',
    short: 'first species',
    patterns: [WHOLE],
  },
  {
    id: 2,
    label: 'Two against one',
    short: 'second species',
    patterns: [HALVES, WHOLE],
  },
  {
    id: 3,
    label: 'Four against one',
    short: 'third species',
    patterns: [QUARTERS, HALVES, WHOLE],
  },
  {
    id: 4,
    label: 'Tied across the beat',
    short: 'fourth species',
    // The tie first; where it can't be held, two notes (a broken tie,
    // weighed against), or one.
    patterns: [TIED, HALVES, WHOLE],
    first: [REST_HALF, WHOLE],
  },
  {
    id: 5,
    label: 'Free (florid)',
    short: 'fifth species',
    patterns: [
      HALVES,
      TIED,
      [{ share: [1, 2] }, { share: [1, 4] }, { share: [1, 4] }],
      QUARTERS,
      [{ share: [1, 4] }, { share: [1, 4] }, { share: [1, 2] }],
      [{ share: [1, 2], tie: true }, { share: [1, 4] }, { share: [1, 4] }],
      WHOLE,
    ],
    first: [
      HALVES,
      WHOLE,
      [{ share: [1, 2] }, { share: [1, 4] }, { share: [1, 4] }],
    ],
  },
]

// Pieces shorter than this are too short to split a note into (wholes):
// the next pattern down is used instead.
export const SHORTEST_PIECE: [number, number] = [1, 16]

// How far the line sits from the melody (semitones): never past a 12th,
// best within a 10th.
export const CP_SPACING = { max: 19, wide: 16 }
// How far the line moves from one note to the next: an octave at most.
export const CP_MAX_MOVE = 12
// How many states the search keeps at each step.
export const CP_BEAM = 32

export type CounterpointRule = {
  id: string
  modes: CounterpointMode[]
  // The species it applies to; every species when unset.
  species?: number[]
  label: string // in a list of breaks
  text: string // a break, filled in
}

// The rules, in the order breaks are listed. {note}, {melody},
// {interval}, {move}, {to} and {final} are filled in.
export const CP_RULES: CounterpointRule[] = [
  {
    id: 'cp-consonance',
    modes: ['strict', 'freer'],
    label: 'consonance on the beat',
    text: '{note} is {interval} where {melody} starts: a dissonance on the beat, where the rules want a consonance.',
  },
  {
    id: 'cp-suspension',
    modes: ['strict', 'freer'],
    label: 'a suspension resolves down a step',
    text: '{note} is held into a dissonance, {interval}, so it should fall a step to a consonance; it moves {move} to {to} instead.',
  },
  {
    id: 'cp-preparation',
    modes: ['strict', 'freer'],
    label: 'a tied note starts as a consonance',
    text: '{note} starts {interval} and is held over the beat; a note held over starts as a consonance, so the tie prepares what follows.',
  },
  {
    id: 'cp-melody-clash',
    modes: ['strict', 'freer'],
    label: 'clash only with passing melody notes',
    text: '{note} is held against {melody}, {interval}: a clash, and {melody} isn’t a passing or neighbour note in the melody (reached and left by step), so the line should move.',
  },
  {
    id: 'cp-dissonance-step',
    modes: ['strict', 'freer'],
    label: 'dissonances move by step',
    text: '{note} is {interval}, a dissonance off the beat, so it should be reached and left by step, passing on or stepping back.',
  },
  {
    id: 'cp-passing-only',
    modes: ['strict'],
    species: [2],
    label: 'second species dissonances pass',
    text: '{note} is {interval}, a dissonance that steps back where it came from; in second species a dissonance only passes between two notes.',
  },
  {
    id: 'cp-parallel',
    modes: ['strict', 'freer'],
    label: 'no parallel 5ths or octaves',
    text: '{note} makes {interval} straight after another {short}, both voices moving: {kind}, which make the two voices sound as one.',
  },
  {
    id: 'cp-beat-parallel',
    modes: ['strict'],
    species: [1, 2, 3],
    label: 'no 5ths or octaves on successive beats',
    text: '{note} makes {interval} on this beat and on the last one too: {kind} on successive beats.',
  },
  {
    id: 'cp-offbeat-parallel',
    modes: ['strict'],
    species: [4],
    label: 'no 5ths or octaves on successive off-beats',
    text: '{note} makes {interval} on this off-beat and on the last one too: {kind} on successive off-beats, which the ties don’t hide.',
  },
  {
    id: 'cp-unequal',
    modes: ['strict'],
    label: 'no diminished 5th to a perfect 5th',
    text: '{note} moves from a diminished 5th to {interval}, both voices moving: unequal 5ths, which sound like parallel 5ths.',
  },
  {
    id: 'cp-cambiata',
    modes: ['strict', 'freer'],
    species: [3, 5],
    label: 'a cambiata steps back up',
    text: '{note} ends a nota cambiata’s leap, so the line should step back up from it.',
  },
  {
    id: 'cp-hidden',
    modes: ['strict'],
    label: 'no hidden 5ths or octaves',
    text: '{note} and the melody move the same way into {interval}, the upper voice by a leap: a hidden {short}.',
  },
  {
    id: 'cp-unison',
    modes: ['strict'],
    label: 'unisons only at the ends',
    text: '{note} is a unison with {melody} on the beat; strict counterpoint keeps unisons for the first and last notes.',
  },
  {
    id: 'cp-start',
    modes: ['strict'],
    label: 'start on a perfect interval',
    text: '{note} starts the line {interval}; strict counterpoint starts on a unison, a 5th above or an octave.',
  },
  {
    id: 'cp-end',
    modes: ['strict'],
    label: 'end on a unison or octave',
    text: '{note} ends the line {interval}; strict counterpoint ends on a unison or an octave.',
  },
  {
    id: 'cp-cadence',
    modes: ['strict'],
    label: 'a cadence at the end',
    text: '{why}',
  },
  {
    id: 'cp-leap',
    modes: ['strict', 'freer'],
    label: 'singable leaps',
    text: '{note} is reached by {leap}, {why}.',
  },
  {
    id: 'cp-recover',
    modes: ['strict', 'freer'],
    label: 'turn back after a leap',
    text: '{note} carries on {move} after a leap of {leap}; a leap that big turns back.',
  },
  {
    id: 'cp-repeat',
    modes: ['strict'],
    species: [2, 3, 4, 5],
    label: 'no repeated notes',
    text: '{note} repeats the note before; in {species} the line keeps moving.',
  },
  {
    id: 'cp-run',
    modes: ['strict'],
    label: 'no more than three 3rds or 6ths in a row',
    text: '{note} makes the {count} {kind} in a row on the beat; more than three and the line loses its independence.',
  },
  {
    id: 'cp-key',
    modes: ['strict', 'freer'],
    label: 'stay in the key',
    text: '{note} is outside the key{exception}.',
  },
  {
    id: 'cp-crossing',
    modes: ['strict', 'freer'],
    label: 'stay on its side',
    text: '{note} crosses to the other side of {melody}.',
  },
  {
    id: 'cp-spacing',
    modes: ['strict', 'freer'],
    label: 'within a 12th',
    text: '{note} is {interval}, more than a 12th from the melody.',
  },
]

// The other wording: the reason for each note, the cadence's breaks and
// the card's summary.
export const CP_TEXT = {
  consonant: '{note}, {interval}.',
  onBeat: '{note}, {interval}, consonant on the beat.',
  passing: '{note}, {interval}, a passing note between {from} and {to}.',
  neighbour:
    '{note}, {interval}, a neighbour note stepping off {from} and back.',
  suspension:
    '{note} is held over into {interval}, a suspension that falls a step to {to}.',
  prepared: '{note}, {interval}, then held over the beat.',
  leadingNote: '{note}, the leading note, rises a semitone to {to}.',
  cadence:
    'The cadence: the line steps into {interval} as the melody moves the other way.',
  chordTone: 'It’s the {tone} of {chord}.',
  contrary: 'It moves {way} as the melody moves the other way.',
  oblique: 'It holds while the melody moves.',
  similar: 'It moves {way} with the melody.',
  edited: 'Your choice, in place of {was}.',
  cambiata:
    '{note}, {interval}, a nota cambiata: it steps down from {from}, then leaps a 3rd down to {to}, which steps back up.',
  raisedSixth: '{note}, the raised 6th, steps up to {to}, the leading note.',
  breaks: 'Breaks a rule: ',
  noFinal:
    'The melody reaches its last note by a leap, so the line can’t step into a cadence with it.',
  noStep:
    'The line should step into the last note against the melody’s step, moving the other way.',
  noSemitone:
    'Neither voice moves by a semitone; raise {lead} to {raised}, the leading note, so the line rises a semitone to {final}.',
  noLeading:
    'Neither voice moves by a semitone: the melody rises a whole step to its last note, so the cadence has no leading note.',
  keeps: 'Keeps every rule of {mode} counterpoint.',
  broken: 'Breaks {count} rule{s} of {mode} counterpoint: ',
  freerNote:
    'Freer rules allow a passing dissonance against a melody note off the beat, neighbour notes in second species, held dissonances of any size, repeated notes, unisons mid-line, hidden 5ths and octaves, long runs of 3rds or 6ths, any 6th as a leap, 5ths or octaves on successive off-beats, a diminished 5th moving to a perfect 5th, any consonance to start, and the chord’s own notes.',
  short: 'Some melody notes are too short to split, so they get fewer notes.',
  tieBroken: 'The tie is broken here: the line moves on the beat.',
}

// The search's weights for what the rules leave open: positive is better.
export const CP_PREFER = {
  breakCost: 100,
  step: 1.5,
  third: 0.5,
  fourth: -0.5,
  bigLeap: -1.5,
  repeat: -2,
  rocking: -2, // back and forth between two notes
  contrary: 2,
  oblique: 0.5,
  similarImperfect: 0,
  imperfect: 1,
  perfectInside: -0.5,
  wide: -1,
  chordTone: 1.5, // freer only, on the beat (David's choice)
  noCadence: -20, // freer: a cadence is strongly preferred
  notPerfectEnd: -4, // freer: so is a unison or octave at the end
  tieBroken: -10,
  samePattern: -0.6, // fifth species: vary the rhythm
  wholeInside: -1, // fifth species: keep moving
}

// How each tag reads.
export const CP_TAG_TEXT: Record<string, string> = {
  perfect: 'perfect',
  imperfect: 'imperfect',
  dissonant: 'dissonant',
  passing: 'passing',
  neighbour: 'neighbour',
  suspension: 'suspension',
  tied: 'tied',
  'leading-note': 'leading note',
  'raised-sixth': 'raised 6th',
  cambiata: 'cambiata',
  cadence: 'cadence',
  'chord-tone': 'chord tone',
  chromatic: 'chromatic',
  break: 'breaks a rule',
  edited: 'your choice',
}
