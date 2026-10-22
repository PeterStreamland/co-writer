// The keyboard's voicing box (beside the keyboard, David's layout): the
// voicings the current chord has, in the order ◀ ▶ steps through them, and
// the box's filters. No theory lives here; the voicings come from the theory
// core (task 6).
import {
  handSplit,
  inversions,
  keyboardVoicing,
  VOICING_STYLES,
  type ChordName,
  type LeftHand,
  type Note,
  type VoicingStyle,
} from '../theory'

export type VoicingChoice = VoicingStyle | 'split'

export type Voicing = {
  id: VoicingChoice
  label: string
  notes: Note[] // every note, lowest first
  left?: Note[] // with a split, the left hand's notes
  inversion?: number // with every inversion on offer, which one this is
}

// The piano filters (David's choice, matching the guitar's): which
// inversion, as the guitar's inversion filter, and what the left hand plays
// under a split.
export type VoicingFilters = {
  inversion: 'chord' | 'any' | number
  left: LeftHand
}

export const DEFAULT_VOICING_FILTERS: VoicingFilters = {
  inversion: 'chord',
  left: 'bass',
}

export const LEFT_HANDS: [LeftHand, string][] = [
  ['bass', 'Bass alone'],
  ['fifth', 'Root and 5th'],
  ['octave', 'Octave'],
]

const LABELS: Record<VoicingChoice, string> = {
  close: 'Close',
  open: 'Open',
  'drop-2': 'Drop-2',
  'drop-3': 'Drop-3',
  spread: 'Spread',
  split: 'Left/right hand',
}

// One chord's voicings: the five styles, skipping drops it can't take (a 9th
// chord has none), then the split.
function voicingsOf(chord: ChordName, left: LeftHand): Voicing[] {
  const choices: Voicing[] = VOICING_STYLES.flatMap((style) => {
    const notes = keyboardVoicing(chord, style)
    return notes ? [{ id: style, label: LABELS[style], notes }] : []
  })
  const split = handSplit(chord, { left })
  if (split) {
    choices.push({
      id: 'split',
      label: LABELS.split,
      notes: [...split.left, ...split.right],
      left: split.left,
    })
  }
  return choices
}

// Every voicing on offer: the chord's own (its bass as chosen), one
// inversion's, or every inversion's in turn. An inversion the chord doesn't
// have falls back to the chord as chosen.
export function voicingChoices(
  chord: ChordName,
  filters: VoicingFilters = DEFAULT_VOICING_FILTERS,
): Voicing[] {
  const all = inversions(chord)
  if (filters.inversion === 'any') {
    return all.flatMap(({ inversion, chord: inverted }) =>
      voicingsOf(inverted, filters.left).map((v) => ({ ...v, inversion })),
    )
  }
  const one =
    typeof filters.inversion === 'number'
      ? all[filters.inversion]?.chord
      : undefined
  return voicingsOf(one ?? chord, filters.left)
}
