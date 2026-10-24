// Chord styles as data (PLAN Phase 7 task 8, David's request): how a
// chord is played through its length. Each style is laid on the beats the
// chord covers, as the time signature counts them; a dotted beat (6/8) or
// an uneven group (7/8) is counted in its quavers.

export type ChordStyleId =
  | 'block'
  | 'strum'
  | 'pulse'
  | 'oom-pah'
  | 'broken'
  | 'stabs'
  | 'down-up'
  | 'arp-up'
  | 'arp-down'
  | 'arp-updown'
  | 'alberti'
  | 'fingerpick'
  | 'country'
  | 'reggae'
  | 'charleston'
  | 'push'
  | 'gallop'
  | 'eighths'
  | 'tremolo'

export const CHORD_STYLES: {
  id: ChordStyleId
  label: string
  explanation: string
  restsFirst?: true // starts with a rest, on the beat
}[] = [
  {
    id: 'block',
    label: 'Block',
    explanation: 'All the notes together, held for the whole chord.',
  },
  {
    id: 'strum',
    label: 'Strum',
    explanation:
      'One slow strum down, low string to high, held for the whole chord.',
  },
  {
    id: 'pulse',
    label: 'Pulse',
    explanation: 'The whole chord again on every beat.',
  },
  {
    id: 'oom-pah',
    label: 'Bass then chord',
    explanation:
      'Oom-pah: the bass note on the strong beats, the rest of the chord on the others (oom-pah-pah in 3/4).',
  },
  {
    id: 'broken',
    label: 'Broken',
    explanation:
      'Rolled: the notes come in one after another, low to high, and ring on.',
  },
  {
    id: 'stabs',
    label: 'Off-beat stabs',
    explanation:
      'Short chords on the off-beats, silence on the beats, as in ska and reggae.',
    restsFirst: true,
  },
  {
    id: 'down-up',
    label: 'Down-up strum',
    explanation:
      'A strumming pattern: down on the beats, up between them. In 4/4 it is down, down-up, up-down-up.',
  },
  {
    id: 'arp-up',
    label: 'Arpeggio up',
    explanation: 'One note at a time, low to high and round again, in quavers.',
  },
  {
    id: 'arp-down',
    label: 'Arpeggio down',
    explanation: 'One note at a time, high to low and round again, in quavers.',
  },
  {
    id: 'arp-updown',
    label: 'Arpeggio up and down',
    explanation: 'One note at a time, up to the top and back down, in quavers.',
  },
  {
    id: 'alberti',
    label: 'Alberti bass',
    explanation:
      'Low, top, middle, top, in quavers: the classical piano accompaniment.',
  },
  {
    id: 'fingerpick',
    label: 'Fingerpicking',
    explanation:
      'A bass note on each beat, alternating, with the top notes picked between: Travis picking.',
  },
  {
    id: 'country',
    label: 'Boom-chick (alternating bass)',
    explanation:
      'The root, then the chord, then the 5th, then the chord: country and folk.',
  },
  {
    id: 'reggae',
    label: 'Reggae skank',
    explanation:
      'Short chords on beats 2 and 4 only (the backbeat), silence elsewhere.',
    restsFirst: true,
  },
  {
    id: 'charleston',
    label: 'Charleston',
    explanation: 'The chord on 1 and on the “and” of 2, then silence.',
  },
  {
    id: 'push',
    label: '3 + 3 + 2 push',
    explanation:
      'Three quavers, three, then two: the syncopated pop and Latin rhythm.',
  },
  {
    id: 'gallop',
    label: 'Gallop',
    explanation:
      'A quaver and two semiquavers on each beat: the metal and rock gallop.',
  },
  {
    id: 'eighths',
    label: 'Driving quavers',
    explanation: 'The whole chord on every quaver: rock rhythm guitar.',
  },
  {
    id: 'tremolo',
    label: 'Tremolo',
    explanation: 'The whole chord on every semiquaver, as fast as it goes.',
  },
]

// Patterns as data, for the styles that are one (David's request: more
// chord playing patterns). A bar of a time signature has its own pattern
// where one is given, split evenly; otherwise each beat takes the pattern
// for its size in pulses (a quaver beat in 6/8 is three), split evenly.
// X the whole chord; B the bass; U the notes above it; S a short stab;
// 1–6 one note counted from the bottom, a–f from the top; . the hit
// before rings on; - silence.
export const PATTERN_STYLES: Partial<
  Record<
    ChordStyleId,
    { bar?: Record<string, string>; beat: Record<number, string> }
  >
> = {
  'arp-up': {
    bar: { '4/4': '12341234', '3/4': '123412', '2/4': '1234' },
    beat: { 1: '12', 2: '12', 3: '123', 4: '1234' },
  },
  'arp-down': {
    bar: { '4/4': 'abcdabcd', '3/4': 'abcdab', '2/4': 'abcd' },
    beat: { 1: 'ab', 2: 'ab', 3: 'abc', 4: 'abcd' },
  },
  'arp-updown': {
    bar: { '4/4': '12343212', '3/4': '123432', '2/4': '1232' },
    beat: { 1: '12', 2: '12', 3: '123', 4: '1232' },
  },
  alberti: {
    bar: { '4/4': '1a2a1a2a', '3/4': '1a2a1a', '2/4': '1a2a' },
    beat: { 1: '1a', 2: '1a', 3: '1a2', 4: '1a2a' },
  },
  fingerpick: {
    bar: { '4/4': '1a3b1a3b', '3/4': '1a3b1a', '2/4': '1a3b' },
    beat: { 1: '1a', 2: '1a', 3: '1ab', 4: '1a3b' },
  },
  country: {
    bar: { '4/4': '1U3U', '3/4': '1UU', '2/4': '1U' },
    beat: { 1: '1', 2: '1U', 3: '1UU', 4: '1U3U' },
  },
  reggae: {
    bar: { '4/4': '--S---S-', '2/4': '--S-' },
    beat: { 1: '-S', 2: '-S', 3: '-S-', 4: '--S-' },
  },
  charleston: {
    bar: { '4/4': 'X..X----' },
    beat: { 1: 'X.', 2: 'X.', 3: 'X..', 4: 'X..X' },
  },
  push: {
    bar: { '4/4': 'X..X..X.' },
    beat: { 1: 'X.', 2: 'X.', 3: 'X..', 4: 'X..X' },
  },
  gallop: {
    beat: { 1: 'X.XX', 2: 'X.XX', 3: 'X.XX..', 4: 'X.XX' },
  },
  eighths: {
    beat: { 1: 'XX', 2: 'XX', 3: 'XXX', 4: 'XXXX' },
  },
  tremolo: {
    beat: { 1: 'XXXX', 2: 'XXXX', 3: 'XXXXXX', 4: 'XXXXXXXX' },
  },
}

export const DEFAULT_CHORD_STYLE: ChordStyleId = 'block'

// The roll of a broken chord: each note comes in a demisemiquaver after
// the one before, closer together when the chord is too short for that.
export const ROLL_GAP = { n: 1, d: 32 }

// How much of its slot an off-beat stab sounds for.
export const STAB_SOUNDS = { n: 1, d: 2 }

// How many of the highest notes an up-strum catches, as a guitarist's
// up-strokes catch the top strings.
export const UP_STRUM_NOTES = 3

// Down-up strum patterns: D down, U up, . a stroke missed (the strum
// before rings on). A bar of 4/4 has its own pattern, in quavers;
// otherwise each beat takes the pattern for its size, in its halves (a
// beat of one pulse) or its quavers.
export const STRUM_BAR_PATTERNS: Record<string, string> = {
  '4/4': 'D.DU.UDU',
}
export const STRUM_BEAT_PATTERNS: Record<number, string> = {
  1: 'DU',
  2: 'DU',
  3: 'D.U',
}
