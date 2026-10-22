import { describe, expect, it } from 'vitest'
import { chordTones } from '../../src/instruments/chord-tones'
import {
  chordNotes,
  formatNote,
  parseChordSymbol,
  pitchClass,
  type ChordName,
} from '../../src/theory'
import { chordToneLabels } from '../fixtures/chord-tones'

function parse(text: string): ChordName {
  const chord = parseChordSymbol(text)
  if (!chord) throw new Error(`${text} did not parse`)
  return chord
}

const ROLE = { root: 'R', third: '3', fifth: '5', seventh: '7', extension: 'x' }

describe('chord tones', () => {
  it.each(Object.entries(chordToneLabels))('labels %s', (symbol, expected) => {
    const chord = parse(symbol)
    const tones = chordTones(chord)
    // In the chord's own order, root first, then a bass outside the chord.
    const notes = chordNotes({ root: chord.root, quality: chord.quality })
    if (
      chord.bass &&
      !notes.some((n) => pitchClass(n) === pitchClass(chord.bass!))
    )
      notes.push(chord.bass)
    const text = notes
      .map((n) => {
        const tone = tones.get(pitchClass(n))!
        return `${formatNote(tone.note, { ascii: true })}:${tone.label
          .replace(/♭/g, 'b')
          .replace(/♯/g, '#')
          .replace(/𝄫/g, 'bb')}(${ROLE[tone.role]})`
      })
      .join(' ')
    expect(text).toBe(expected)
    expect(tones.size).toBe(notes.length)
  })

  it('refuses a chord it doesn’t know', () => {
    expect(() =>
      chordTones({ root: parse('C').root, quality: 'nonsense' }),
    ).toThrow()
  })
})
