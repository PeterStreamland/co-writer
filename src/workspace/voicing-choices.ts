// The keyboard's voicing box (beside the keyboard, David's layout): the
// voicings the current chord has, in the order ◀ ▶ steps through them. No
// theory lives here; the voicings come from the theory core (task 6).
import {
  handSplit,
  keyboardVoicing,
  VOICING_STYLES,
  type ChordName,
  type Note,
  type VoicingStyle,
} from '../theory'

export type VoicingChoice = VoicingStyle | 'split'

export type Voicing = {
  id: VoicingChoice
  label: string
  notes: Note[] // every note, lowest first
  left?: Note[] // with a split, the left hand's notes
}

const LABELS: Record<VoicingChoice, string> = {
  close: 'Close',
  open: 'Open',
  'drop-2': 'Drop-2',
  'drop-3': 'Drop-3',
  spread: 'Spread',
  split: 'Left/right hand',
}

// Every voicing the chord has: the five styles, skipping drops it can't take
// (a 9th chord has none), then the split with the right hand close.
export function voicingChoices(chord: ChordName): Voicing[] {
  const choices: Voicing[] = VOICING_STYLES.flatMap((style) => {
    const notes = keyboardVoicing(chord, style)
    return notes ? [{ id: style, label: LABELS[style], notes }] : []
  })
  const split = handSplit(chord)
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
