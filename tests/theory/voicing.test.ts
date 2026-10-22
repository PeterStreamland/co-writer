import { describe, expect, it } from 'vitest'
import {
  chordNotes,
  formatNote,
  handSplit,
  keyboardVoicing,
  midiNumber,
  parseChordSymbol,
  pitchClass,
  VOICING_STYLES,
  type ChordName,
  type Note,
} from '../../src/theory'
import { handSplits, keyboardVoicings } from '../fixtures/voicings'

function parse(text: string): ChordName {
  const chord = parseChordSymbol(text)
  if (!chord) throw new Error(`${text} did not parse`)
  return chord
}

const show = (notes: Note[]) =>
  notes.map((n) => formatNote(n, { ascii: true })).join(' ')
const midi = (n: Note) => midiNumber(n) as number

const CHORDS = [
  'C', 'Cm', 'Cdim', 'Caug', 'Csus4', 'C5', 'C6',
  'Cmaj7', 'C7', 'Cm7', 'Cm7b5', 'Cdim7', 'CmMaj7', 'C9', 'C13',
  'F#', 'Gb', 'Bb7', 'Ebm7', 'Abmaj7', 'Db', 'B7',
  'C/E', 'C/G', 'G7/F', 'Am7/G', 'F/G', 'D/C',
] // prettier-ignore

describe('keyboard voicings', () => {
  it.each(keyboardVoicings)(
    'voices $chord as $style: $notes',
    ({ chord, style, notes }) => {
      expect(show(keyboardVoicing(parse(chord), style)!)).toBe(notes)
    },
  )

  it('keeps every chord tone, the chord’s spelling and its bass', () => {
    for (const symbol of CHORDS) {
      const chord = parse(symbol)
      const tones = chordNotes(chord)
      for (const style of VOICING_STYLES) {
        const voicing = keyboardVoicing(chord, style)
        if (!voicing) continue
        const label = `${symbol} ${style}`
        // Low to high, no pitch twice.
        const pitches = voicing.map(midi)
        expect(pitches, label).toEqual([...pitches].sort((a, b) => a - b))
        expect(new Set(pitches).size, label).toBe(pitches.length)
        // Every tone once, each as the chord spells it.
        expect(voicing, label).toHaveLength(tones.length)
        for (const tone of tones) {
          expect(
            voicing.some(
              (n) =>
                n.letter === tone.letter && n.accidental === tone.accidental,
            ),
            label,
          ).toBe(true)
        }
        // The bass at the bottom.
        expect(pitchClass(voicing[0]), label).toBe(
          pitchClass(chord.bass ?? chord.root),
        )
        // Near middle C: the average within a 6th either side.
        const mean = pitches.reduce((a, b) => a + b, 0) / pitches.length
        expect(Math.abs(mean - 60), label).toBeLessThanOrEqual(9)
      }
    }
  })

  it('voices every chord in every style, drops for up to four notes', () => {
    for (const symbol of CHORDS) {
      const chord = parse(symbol)
      // A bass outside the chord sits under the chord's own voicing.
      const size = chordNotes({
        root: chord.root,
        quality: chord.quality,
      }).length
      for (const style of VOICING_STYLES) {
        const voicing = keyboardVoicing(chord, style)
        // A drop needs a note that many places from the top, and is for
        // chords of up to four notes: a power chord has no drop-3.
        const from = { 'drop-2': 2, 'drop-3': 3 }[style as string]
        if (from && (size > 4 || size < from))
          expect(voicing, `${symbol} ${style}`).toBeUndefined()
        else expect(voicing, `${symbol} ${style}`).toBeDefined()
      }
    }
  })

  it('stacks close position within an octave and opens it wider', () => {
    for (const symbol of ['C', 'Cmaj7', 'G7', 'Am7', 'C/E', 'Cmaj7/B']) {
      const chord = parse(symbol)
      const span = (style: (typeof VOICING_STYLES)[number]) => {
        const v = keyboardVoicing(chord, style)!
        return midi(v[v.length - 1]) - midi(v[0])
      }
      expect(span('close'), symbol).toBeLessThan(12)
      expect(span('open'), symbol).toBeGreaterThan(12)
      expect(span('spread'), symbol).toBeGreaterThan(span('open'))
    }
  })

  it('refuses a chord it doesn’t know', () => {
    expect(() =>
      keyboardVoicing({ root: parse('C').root, quality: 'nonsense' }, 'close'),
    ).toThrow()
  })
})

describe('left/right-hand split', () => {
  it.each(handSplits)(
    'splits $chord ($style, left hand $left)',
    ({ chord, style, left, leftNotes, rightNotes }) => {
      const split = handSplit(parse(chord), { style, left })!
      expect(show(split.left)).toBe(leftNotes)
      expect(show(split.right)).toBe(rightNotes)
    },
  )

  it('keeps the left hand’s bass below C3 for every chord', () => {
    for (const symbol of CHORDS) {
      const chord = parse(symbol)
      for (const left of ['bass', 'fifth', 'octave'] as const) {
        const split = handSplit(chord, { left })!
        const bass = split.left[0]
        expect(midi(bass), symbol).toBeLessThan(48)
        expect(midi(bass), symbol).toBeGreaterThanOrEqual(36)
        expect(pitchClass(bass)).toBe(pitchClass(chord.bass ?? chord.root))
        // Each hand low to high, the left hand under the right.
        expect(midi(split.left[split.left.length - 1])).toBeLessThan(
          midi(split.right[split.right.length - 1]),
        )
      }
    }
  })
})
