import { describe, expect, it } from 'vitest'
import {
  chordNames,
  chordNotes,
  chordQualityIds,
  chordSymbol,
  closeVoicing,
  formatNote,
  inversionName,
  inversionOf,
  inversions,
  midiNumber,
  parseChordSymbol,
  parseNote,
  pitchClass,
  playbackVoicing,
  romanNumeral,
  sameSpelling,
  type ChordName,
  type Key,
} from '../../src/theory'
import {
  inversionNumbers,
  inversionSymbols,
  voicings,
} from '../fixtures/inversions'
import { playbackPitches } from '../fixtures/playback'

function parse(text: string): ChordName {
  const chord = parseChordSymbol(text)
  if (!chord) throw new Error(`${text} did not parse`)
  return chord
}

const ascii = (chord: ChordName) => chordSymbol(chord, { ascii: true })
const asciiNote = (note: Parameters<typeof formatNote>[0]) =>
  formatNote(note, { ascii: true })

describe('inversions', () => {
  it.each(Object.entries(inversionSymbols))(
    '%s inverts as the fixture says',
    (symbol, expected) => {
      const found = inversions(parse(symbol))
      expect(found.map((inv) => ascii(inv.chord))).toEqual(expected)
      expect(found.map((inv) => inv.inversion)).toEqual(
        expected.map((_, i) => i),
      )
    },
  )

  it('names the bass tone of each inversion', () => {
    expect(inversions(parse('G7')).map((inv) => inv.bassTone)).toEqual([
      1, 3, 5, 7,
    ])
    expect(inversions(parse('Dsus4')).map((inv) => inv.bassTone)).toEqual([
      1, 4, 5,
    ])
    expect(inversions(parse('C6')).map((inv) => inv.bassTone)).toEqual([
      1, 3, 5, 6,
    ])
  })

  it('ignores a bass on the chord given', () => {
    expect(inversions(parse('C/E')).map((inv) => ascii(inv.chord))).toEqual(
      inversionSymbols.C,
    )
  })

  it('names inversions in words', () => {
    expect([0, 1, 2, 3].map(inversionName)).toEqual([
      'root position',
      'first inversion',
      'second inversion',
      'third inversion',
    ])
  })
})

describe('inversionOf', () => {
  it.each(Object.entries(inversionNumbers))('%s is %s', (symbol, expected) => {
    expect(inversionOf(parse(symbol)) ?? null).toBe(expected)
  })
})

describe('closeVoicing', () => {
  it.each(voicings)(
    '$symbol at octave $octave',
    ({ symbol, octave, notes }) => {
      expect(closeVoicing(parse(symbol), octave).map(asciiNote).join(' ')).toBe(
        notes,
      )
    },
  )
})

// Every quality the namer knows, on roots with sharps, flats and naturals.
const roots = ['C', 'F#', 'Bb', 'Eb', 'B']
const cases = roots.flatMap((root) =>
  chordQualityIds().map((quality) => ({
    root: parseNote(root) as NonNullable<ReturnType<typeof parseNote>>,
    quality,
  })),
)

describe('every inversion of every chord', () => {
  it('covers the whole dictionary', () => {
    expect(cases.length).toBeGreaterThan(900)
  })

  it('round-trips through its symbol and knows which inversion it is', () => {
    for (const chord of cases) {
      for (const inv of inversions(chord)) {
        const text = ascii(inv.chord)
        const back = parse(text)
        expect(ascii(back), text).toBe(text)
        expect(inversionOf(back), text).toBe(inv.inversion)
      }
    }
  })

  it('voices the chord tones, bass first, rising, in the chord spelling', () => {
    for (const chord of cases) {
      for (const inv of inversions(chord)) {
        const text = ascii(inv.chord)
        const voicing = closeVoicing(inv.chord, 3)
        expect(
          sameSpelling(
            { ...voicing[0], octave: undefined },
            inv.chord.bass ?? chord.root,
          ),
        ).toBe(true)
        expect(voicing[0].octave, text).toBe(3)
        const midis = voicing.map((n) => midiNumber(n) as number)
        midis
          .slice(1)
          .forEach((m, i) => expect(m, text).toBeGreaterThan(midis[i]))
        // Close position: the chord tones up to the 7th fit inside an octave.
        const spread = midis[inversions(chord).length - 1] - midis[0]
        expect(spread, text).toBeLessThan(12)
        const spelled = (notes: typeof voicing) =>
          notes.map(asciiNote).map((n) => n.replace(/-?\d+$/, ''))
        expect(spelled(voicing).sort(), text).toEqual(
          spelled(
            chordNotes({ root: chord.root, quality: chord.quality }),
          ).sort(),
        )
      }
    }
  })

  it('is named as that inversion by the namer', () => {
    for (const chord of cases) {
      for (const inv of inversions(chord)) {
        const text = ascii(inv.chord)
        const names = chordNames(closeVoicing(inv.chord, 3)).map(ascii)
        expect(names, text).toContain(text)
      }
    }
  })
})

describe('inversions with Roman numerals', () => {
  const C: Key = { tonic: { letter: 'C', accidental: 0 }, mode: 'major' }
  const Am: Key = {
    tonic: { letter: 'A', accidental: 0 },
    mode: 'harmonic-minor',
  }
  const numerals = (symbol: string, key: Key) =>
    inversions(parse(symbol)).map((inv) => romanNumeral(key, inv.chord).numeral)

  it('gives classical figures for triads and 7th chords', () => {
    expect(numerals('C', C)).toEqual(['I', 'I⁶', 'I⁶₄'])
    expect(numerals('G7', C)).toEqual(['V7', 'V⁶₅', 'V⁴₃', 'V⁴₂'])
    expect(numerals('G#dim7', Am)).toEqual([
      'vii°7',
      'vii°⁶₅',
      'vii°⁴₃',
      'vii°⁴₂',
    ])
  })

  it('keeps every bass pitch a chord tone', () => {
    for (const inv of inversions(parse('E7#5'))) {
      const pitches = chordNotes(inv.chord).map(pitchClass)
      expect(new Set(pitches).size).toBe(4)
    }
  })
})

describe('playbackVoicing', () => {
  it.each(Object.entries(playbackPitches))('%s', (symbol, pitches) => {
    expect(playbackVoicing(parse(symbol)).map(midiNumber)).toEqual(pitches)
  })

  it('keeps every chord quality between F3 and E4 in the bass', () => {
    for (const { root, quality } of cases) {
      const voicing = playbackVoicing({ root, quality })
      const bass = midiNumber(voicing[0]) as number
      expect(bass).toBeGreaterThanOrEqual(53)
      expect(bass).toBeLessThanOrEqual(64)
      expect(voicing.map(pitchClass).sort()).toEqual(
        chordNotes({ root, quality }).map(pitchClass).sort(),
      )
    }
  })
})
