// The line modes, as data (PLAN Phase 6 task 3, SPEC 7.4): each mode's
// group, its name, what it does in a phrase, and the range it sits in.
// Bass lines sit low enough to sound like a bass and high enough to play on
// a guitar's low strings; inner voices and lines between chords sit in the
// middle of the keyboard.

export type LineGroup = 'bass' | 'inner' | 'between' | 'wildcard'

export type LineModeId =
  | 'roots'
  | 'root-fifth'
  | 'approach'
  | 'walking'
  | 'pedal'
  | 'tenor'
  | 'alto'
  | 'guide-3rd'
  | 'guide-7th'
  | 'scale-steps'
  | 'chromatic'
  | 'enclosure'
  | 'wildcard'

export type LineMode = {
  id: LineModeId
  group: LineGroup
  label: string
  blurb: string
  range: [low: string, high: string]
}

export const LINE_GROUPS: { id: LineGroup; label: string }[] = [
  { id: 'bass', label: 'Bass lines' },
  { id: 'inner', label: 'Inner voices' },
  { id: 'between', label: 'Between chords' },
  { id: 'wildcard', label: 'Wildcard' },
]

const BASS: [string, string] = ['E2', 'C4']
const MIDDLE: [string, string] = ['C4', 'C6']

export const LINE_MODES: LineMode[] = [
  {
    id: 'roots',
    group: 'bass',
    label: 'Roots',
    blurb: 'The root of each chord, held.',
    range: BASS,
  },
  {
    id: 'root-fifth',
    group: 'bass',
    label: 'Root and 5th',
    blurb: 'The root, then the 5th halfway through the chord.',
    range: BASS,
  },
  {
    id: 'approach',
    group: 'bass',
    label: 'Approach notes',
    blurb: 'The root, then a semitone into the next root on the last beat.',
    range: BASS,
  },
  {
    id: 'walking',
    group: 'bass',
    label: 'Walking',
    blurb:
      'A note a beat: the root, the chord’s notes, and a semitone into the next root.',
    range: BASS,
  },
  {
    id: 'pedal',
    group: 'bass',
    label: 'Pedal',
    blurb: 'The key note held low under every chord.',
    range: BASS,
  },
  {
    id: 'tenor',
    group: 'inner',
    label: 'Tenor',
    blurb: 'The tenor part of the Classical lens’s four-part voicing.',
    range: ['C3', 'G4'],
  },
  {
    id: 'alto',
    group: 'inner',
    label: 'Alto',
    blurb: 'The alto part of the Classical lens’s four-part voicing.',
    range: ['G3', 'C5'],
  },
  {
    id: 'guide-3rd',
    group: 'inner',
    label: 'Guide tones, from the 3rd',
    blurb:
      'Each chord’s 3rd or 7th, whichever is nearer: a line that barely moves.',
    range: ['G3', 'G5'],
  },
  {
    id: 'guide-7th',
    group: 'inner',
    label: 'Guide tones, from the 7th',
    blurb: 'The same guide-tone line, starting on the first chord’s 7th.',
    range: ['G3', 'G5'],
  },
  {
    id: 'scale-steps',
    group: 'between',
    label: 'Scale steps',
    blurb:
      'A chord tone, then steps of the scale into a tone of the next chord.',
    range: MIDDLE,
  },
  {
    id: 'chromatic',
    group: 'between',
    label: 'Chromatic',
    blurb: 'A chord tone, then semitones into a tone of the next chord.',
    range: MIDDLE,
  },
  {
    id: 'enclosure',
    group: 'between',
    label: 'Enclosures',
    blurb:
      'A chord tone, then the step above and the semitone below the next chord’s tone.',
    range: MIDDLE,
  },
  // David's request: chance picks the move into each chord (scale steps,
  // chromatic or an enclosure) and which of its tones to aim for, so every
  // roll is a new line that still lands on a chord tone at each change.
  {
    id: 'wildcard',
    group: 'wildcard',
    label: 'Wildcard',
    blurb:
      'A new line every roll: chance picks each move into the next chord, and the tone it lands on.',
    range: MIDDLE,
  },
]
