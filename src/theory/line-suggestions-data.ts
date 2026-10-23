// How lines are offered as suggestions, as data (PLAN Phase 6 task 4, SPEC
// 6.2, 7.4): each mode's first line for the ⓘ panel, and the rules that
// rank lines within their group. Every cost and bonus is in points; a
// higher score ranks higher. Placeholders in {braces} are filled from the
// line: counted phrases like "4 approach notes", the key, the tonic.
import type { LineGroup, LineModeId } from './lines-data'

export const LINE_EXPLANATIONS: Record<LineModeId, string> = {
  roots: 'Holds each chord’s root: the plainest bass, solid under any style.',
  'root-fifth':
    'The root, then the 5th, under each chord: a two-feel that keeps the bass moving.',
  approach:
    'Each root held, then {approaches} leading by a semitone into the changes.',
  walking:
    'Walks a note a beat through each chord, with {approaches} leading into the next root.',
  pedal:
    '{tonic} held under every chord, against {pedals}: tension that resolves when the chords come home.',
  tenor: 'The tenor of four smooth parts, moving {moves} a chord on average.',
  alto: 'The alto of four smooth parts, moving {moves} a chord on average.',
  'guide-3rd':
    'Only 3rds and 7ths, the notes that say what each chord is, moving {moves} a chord on average.',
  'guide-7th':
    'Only 7ths and 3rds, the notes that say what each chord is, moving {moves} a chord on average.',
  'scale-steps':
    '{passing} and {neighbours} of {key} lead from chord to chord.',
  chromatic:
    '{passing} and {neighbours} slide by semitone around the chord tones, {chromatic} outside {key}.',
  enclosure:
    'Each change is closed in on from above and below: {approaches}, {chromatic} outside {key}.',
}

export type LineScoring = {
  // Points for the share of notes on strong beats (and downbeats) that are
  // chord tones: all of them earns the full weight.
  strongChordTones: number
  // Points off per semitone of the average move between notes, by group:
  // a bass may leap, an inner voice or a line between chords should not.
  leap: Record<LineGroup, number>
  // Points off for the share of notes outside the key.
  outside: number
}

export const LINE_SCORING: LineScoring = {
  strongChordTones: 3,
  leap: { bass: 0.05, inner: 0.3, between: 0.3 },
  outside: 2,
}

// When a rule moved a line far enough to say so in its context notes.
export const LINE_NOTE_THRESHOLDS = {
  // Average moves this small (in semitones) are "by step or less"; this
  // large, "leaps".
  stepwise: 2,
  leaping: 5,
  // A share of strong beats on chord tones below this is worth a note.
  strongBeats: 0.75,
}
