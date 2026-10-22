import { describe, expect, it } from 'vitest'
import {
  BUILT_IN_STYLES,
  blendWeights,
  chordKey,
  chordSymbol,
  getScale,
  parseChordSymbol,
  parseNote,
  rankPassingChords,
  suggestionCategory,
  type ChordName,
  type Key,
  type PassingContext,
} from '../../src/theory'
import { passingChords } from '../fixtures/passing-chords'

function parse(text: string): ChordName {
  const chord = parseChordSymbol(text)
  if (!chord) throw new Error(`${text} did not parse`)
  return chord
}

function key(text: string): Key {
  const [tonicText, modeText] = text.split(' ')
  const tonic = parseNote(tonicText)
  const mode = getScale(modeText === 'minor' ? 'natural-minor' : modeText)?.id
  if (!tonic || !mode) throw new Error(`${text} is not a key`)
  return { tonic, mode }
}

function context(
  k: string,
  from: string,
  to: string,
  style = 'none',
): PassingContext {
  return {
    key: key(k),
    previous: [parse(from)],
    next: parse(to),
    weights:
      style === 'none'
        ? undefined
        : blendWeights(BUILT_IN_STYLES, { a: style, mix: 0 }),
  }
}

describe('textbook passing chords (golden fixture)', () => {
  it.each(passingChords)(
    '$from to $to in $key ($style)',
    ({ key: k, style, from, to, shown, first }) => {
      const ranked = rankPassingChords(context(k, from, to, style))
      const keys = ranked.shown.map((s) => chordKey(s.candidate))
      for (const chord of shown) expect(keys).toContain(chordKey(parse(chord)))
      if (first) expect(keys[0]).toBe(chordKey(parse(first)))
    },
  )
})

describe('every passing suggestion', () => {
  const pairs: [string, string, string, string][] = [
    ['C major', 'C', 'G', 'pop'],
    ['C major', 'Am', 'F', 'rock'],
    ['C major', 'F', 'C', 'none'],
    ['E minor', 'Em', 'D', 'metal'],
    ['E minor', 'C', 'B7', 'classical'],
    ['D dorian', 'Dm', 'G', 'jazz'],
    ['A minor-pentatonic', 'Am', 'C', 'blues'],
  ]

  it.each(pairs)(
    '%s, %s to %s (%s): says how it leads in',
    (k, a, b, style) => {
      const ranked = rankPassingChords(context(k, a, b, style))
      const all = [
        ...ranked.shown,
        ...(ranked.wildcard ? [ranked.wildcard] : []),
      ]
      expect(ranked.shown.length).toBeGreaterThan(0)
      for (const s of all) {
        expect(suggestionCategory(s)).toBeDefined()
        // The first sentence names the chord it leads into.
        expect(s.explanation.split('. ')[0]).toContain(chordSymbol(parse(b)))
        expect(s.ruleIds.some((id) => id.startsWith('passing.'))).toBe(true)
        expect(s.keyChange).toBeUndefined()
        expect([chordKey(parse(a)), chordKey(parse(b))]).not.toContain(
          chordKey(s.candidate),
        )
      }
    },
  )

  it('gives the same list and wildcard for the same input', () => {
    const c = context('C major', 'C', 'G', 'rock')
    expect(rankPassingChords(c)).toEqual(rankPassingChords(c))
    expect(rankPassingChords(c, { another: 1 }).wildcard).not.toEqual(
      rankPassingChords(c).wildcard,
    )
  })
})

describe('passing chords read by spelling (Phase 4 gate review)', () => {
  const firstSentence = (s: { explanation: string }) =>
    s.explanation.split('. ')[0]

  it('names no false relation into A♭', () => {
    const c = context('C major', 'C', 'Ab', 'pop')
    const { wildcards } = rankPassingChords(c)
    const all = [
      ...rankPassingChords(c).shown,
      ...Array.from(
        { length: wildcards },
        (_, n) => rankPassingChords(c, { another: n }).wildcard!,
      ),
    ]
    const text = (chord: string) =>
      all.find((s) => chordKey(s.candidate) === chordKey(parse(chord)))
    // A7 is V7/ii, not a tritone substitute for E♭7 (that is B𝄫7), and
    // D♯dim7 leads to E, not A♭.
    expect(text('A7')?.explanation ?? '').not.toContain('stands in')
    expect(text('D#dim7')?.explanation ?? '').not.toContain('falls a 5th')
    expect(text('E7')?.explanation ?? '').not.toContain('tonic to')
  })

  it.each([
    ['C major', 'C', 'G', 'pop'],
    ['C major', 'C', 'Gb', 'pop'],
    ['E minor', 'Em', 'C', 'metal'],
  ])('%s, %s to %s: every wildcard says how it leads in', (k, a, b, style) => {
    const c = context(k, a, b, style)
    const { wildcards } = rankPassingChords(c)
    for (let n = 0; n < wildcards; n++) {
      const w = rankPassingChords(c, { another: n }).wildcard!
      expect(firstSentence(w)).toContain(chordSymbol(parse(b)))
    }
  })
})
