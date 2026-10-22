// Keyboard voicings (Phase 3 task 6): close, open, drop-2, drop-3 and spread,
// and the left/right-hand split (SPEC 5). Each voicing keeps the chord's
// bass at the bottom and the chord's own spelling, and sits as near middle C
// as it goes: shifted by whole octaves until its notes average closest to
// C4 (the lower placement on a tie).
import { chordIntervals } from './chord'
import type { ChordName } from './chord-symbol'
import { transpose } from './interval'
import { closeVoicing, inversionOf, inversions } from './inversion'
import { midiNumber, pitchClass, type Note } from './note'

export type VoicingStyle = 'close' | 'open' | 'drop-2' | 'drop-3' | 'spread'

export const VOICING_STYLES: VoicingStyle[] = [
  'close',
  'open',
  'drop-2',
  'drop-3',
  'spread',
]

// What the left hand plays under a split: the bass alone, the root with the
// chord's 5th, or the bass doubled an octave up.
export type LeftHand = 'bass' | 'fifth' | 'octave'

const MIDDLE_C = 60
const C3 = 48

const midi = (note: Note) => midiNumber(note) as number

function shift(notes: Note[], octaves: number): Note[] {
  return notes.map((n) => ({ ...n, octave: (n.octave as number) + octaves }))
}

function byPitch(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => midi(a) - midi(b))
}

// The voicing moved by octaves so its notes average nearest middle C.
function centred(notes: Note[]): Note[] {
  const mean = (ns: Note[]) =>
    ns.reduce((sum, n) => sum + midi(n), 0) / ns.length
  let best = notes
  for (let octaves = -4; octaves <= 4; octaves++) {
    const moved = shift(notes, octaves)
    const gap = Math.abs(mean(moved) - MIDDLE_C)
    const bestGap = Math.abs(mean(best) - MIDDLE_C)
    if (gap < bestGap || (gap === bestGap && midi(moved[0]) < midi(best[0]))) {
      best = moved
    }
  }
  return best
}

// Drop voicings are for chords of up to four notes, as pianists and
// arrangers use them.
const MAX_DROP_NOTES = 4

// Close position with the note `fromTop` places from the top dropped an
// octave, starting from whichever close position leaves the bass asked for
// at the bottom. Undefined for chords of five notes or more.
function drop(chord: ChordName, fromTop: number): Note[] | undefined {
  const bass = pitchClass(chord.bass ?? chord.root)
  for (const { chord: rotation } of inversions(chord)) {
    const close = closeVoicing(rotation, 4)
    if (close.length > MAX_DROP_NOTES) return undefined
    const at = close.length - fromTop
    if (at < 0 || pitchClass(close[at]) !== bass) continue
    const dropped = close.map((n, i) => (i === at ? shift([n], -1)[0] : n))
    return byPitch(dropped)
  }
  return undefined
}

// Close position with every second note, counting up from the bass, raised
// an octave: 1 5 3 7.
function open(chord: ChordName): Note[] {
  const close = closeVoicing(chord, 4)
  return byPitch(close.map((n, i) => (i % 2 ? shift([n], 1)[0] : n)))
}

function voice(chord: ChordName, style: VoicingStyle): Note[] | undefined {
  switch (style) {
    case 'close':
      return closeVoicing(chord, 4)
    case 'open':
      return open(chord)
    case 'drop-2':
      return drop(chord, 2)
    case 'drop-3':
      return drop(chord, 3)
    case 'spread': {
      const [bass, ...rest] = open(chord)
      return [shift([bass], -1)[0], ...rest]
    }
  }
}

// A chord voiced in a style, lowest note first. A bass outside the chord
// (F/G) sits under the chord's own voicing, at the highest octave below it.
// Undefined when the style can't keep the chord's bass at the bottom.
export function keyboardVoicing(
  chord: ChordName,
  style: VoicingStyle,
): Note[] | undefined {
  if (!chordIntervals(chord.quality)) {
    throw new Error(`unknown chord quality ${chord.quality}`)
  }
  if (chord.bass && inversionOf(chord) === undefined) {
    const above = voice({ root: chord.root, quality: chord.quality }, style)
    if (!above) return undefined
    const bass: Note = { ...chord.bass, octave: 9 }
    while (midi(bass) >= midi(above[0]))
      bass.octave = (bass.octave as number) - 1
    return centred([bass, ...above])
  }
  const voiced = voice(chord, style)
  return voiced && centred(voiced)
}

// The split (SPEC 5): the left hand plays the bass below C3, as the highest
// bass under it, alone, with the chord's 5th, or doubled an octave up; the
// right hand plays the chord in root position, in the style given, around
// middle C. In an inversion the left hand takes the inverted bass, alone or
// doubled: a 5th above it wouldn't be the chord's 5th, so 'fifth' plays it
// alone.
export function handSplit(
  chord: ChordName,
  options: { style?: VoicingStyle; left?: LeftHand } = {},
): { left: Note[]; right: Note[] } | undefined {
  const style = options.style ?? 'close'
  const left = options.left ?? 'bass'
  const right = keyboardVoicing(
    { root: chord.root, quality: chord.quality },
    style,
  )
  if (!right) return undefined
  const bass: Note = { ...(chord.bass ?? chord.root), octave: 9 }
  while (midi(bass) >= C3) bass.octave = (bass.octave as number) - 1
  const hand = [bass]
  const rootPosition = pitchClass(bass) === pitchClass(chord.root)
  if (left === 'octave') hand.push(shift([bass], 1)[0])
  if (left === 'fifth' && rootPosition) {
    const fifth = (chordIntervals(chord.quality) ?? []).find(
      (i) => i.number === 5,
    )
    if (fifth) hand.push(transpose(bass, fifth))
  }
  return { left: hand, right }
}
