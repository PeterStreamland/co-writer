// Chord styles as data (PLAN Phase 7 task 8, David's request): how a
// chord is played through its length. Each style is laid on the beats the
// chord covers, as the time signature counts them; a dotted beat (6/8) or
// an uneven group (7/8) is counted in its quavers.

export type ChordStyleId =
  'block' | 'strum' | 'pulse' | 'oom-pah' | 'broken' | 'stabs' | 'down-up'

export const CHORD_STYLES: {
  id: ChordStyleId
  label: string
  explanation: string
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
  },
  {
    id: 'down-up',
    label: 'Down-up strum',
    explanation:
      'A strumming pattern: down on the beats, up between them. In 4/4 it is down, down-up, up-down-up.',
  },
]

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
