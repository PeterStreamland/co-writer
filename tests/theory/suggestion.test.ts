import { describe, expect, it } from 'vitest'
import {
  CATEGORY_LABELS,
  SUGGESTION_CATEGORIES,
  chordKey,
  chordSymbol,
  fillTemplate,
  makeChordSuggestion,
  makeSuggestion,
  parseChordSymbol,
  parseNote,
  romanNumeral,
  sortSuggestions,
  suggestionCategory,
  type ChordName,
  type ChordSuggestion,
  type SuggestionCategory,
} from '../../src/theory'
import { explanations } from '../fixtures/suggestions'

function parse(text: string): ChordName {
  const chord = parseChordSymbol(text)
  if (!chord) throw new Error(`${text} did not parse`)
  return chord
}

function chord(
  symbol: string,
  score: number,
  category: SuggestionCategory = 'diatonic',
): ChordSuggestion {
  return makeChordSuggestion({
    candidate: parse(symbol),
    score,
    tags: [category],
    ruleIds: [`test.${category}`],
    explanation: `${symbol} as a ${category} move`,
  })
}

const base = {
  candidate: 'x',
  score: 1,
  tags: ['chord tone'],
  ruleIds: ['melody.chord-tone'],
  explanation: 'Lands on the 3rd.',
}

describe('makeSuggestion', () => {
  it('fills the defaults and copies the arrays', () => {
    const tags = ['chord tone', 'chord tone', 'leap']
    const s = makeSuggestion({ ...base, tags })
    expect(s).toEqual({
      ...base,
      tags: ['chord tone', 'leap'],
      contextNotes: [],
    })
    expect(s.tags).not.toBe(tags)
    expect('more' in s).toBe(false)
  })

  it('keeps More and the context notes', () => {
    const notes = ['Ranked lower: you’ve used Am three times']
    const s = makeSuggestion({ ...base, more: 'Theory.', contextNotes: notes })
    expect(s.more).toBe('Theory.')
    expect(s.contextNotes).toEqual(notes)
    expect(s.contextNotes).not.toBe(notes)
  })

  it.each([
    ['an infinite score', { score: Infinity }],
    ['a NaN score', { score: NaN }],
    ['no tags', { tags: [] }],
    ['no rule ids', { ruleIds: [] }],
    ['an empty explanation', { explanation: '  ' }],
  ])('rejects %s', (_, change) => {
    expect(() => makeSuggestion({ ...base, ...change })).toThrow()
  })
})

describe('makeChordSuggestion', () => {
  it('carries exactly one category, first', () => {
    const s = makeChordSuggestion({
      candidate: parse('Bb'),
      score: 2,
      tags: ['rock', 'power chord'],
      ruleIds: ['rock.flat-seven'],
      explanation: '♭VII, the rock move back to I.',
    })
    expect(suggestionCategory(s)).toBe('rock')
  })

  it.each([
    ['no category', ['power chord']],
    ['a category not first', ['power chord', 'rock']],
    ['two categories', ['rock', 'borrowed']],
  ])('rejects %s', (_, tags) => {
    expect(() =>
      makeChordSuggestion({
        candidate: parse('Bb'),
        score: 2,
        tags,
        ruleIds: ['rock.flat-seven'],
        explanation: '♭VII',
      }),
    ).toThrow()
  })
})

describe('categories', () => {
  it('follow SPEC 6.2, in order', () => {
    expect(SUGGESTION_CATEGORIES.map((c) => CATEGORY_LABELS[c])).toEqual([
      'Diatonic',
      'Secondary',
      'Borrowed',
      'Chromatic',
      'Modulation',
      'Rock moves',
      'Pedal/static',
    ])
  })

  it('a suggestion without a category tag has none', () => {
    expect(suggestionCategory(makeSuggestion(base))).toBeUndefined()
  })
})

describe('fillTemplate', () => {
  it.each(explanations)(
    'explains $chord in $key',
    ({ key, chord, template, values, explanation }) => {
      const [tonic, mode] = key.split(' ')
      const note = parseNote(tonic)
      if (!note) throw new Error(tonic)
      const numeral = romanNumeral({ tonic: note, mode }, parse(chord))
      const text = fillTemplate(template, {
        ...values,
        chord: chordSymbol(parse(chord)),
        numeral: numeral.numeral,
      })
      expect(text).toBe(explanation)
    },
  )

  it('throws on a placeholder with no value', () => {
    expect(() => fillTemplate('{chord} is {numeral}', { chord: 'E7' })).toThrow(
      /numeral/,
    )
  })

  it('leaves text without placeholders alone', () => {
    expect(fillTemplate('Back home to I.', {})).toBe('Back home to I.')
  })
})

describe('sortSuggestions', () => {
  const list = [
    chord('Ab', 3, 'borrowed'),
    chord('G7', 5),
    chord('E7', 3, 'secondary'),
    chord('F', 3),
    chord('Dm', 3),
    chord('Bb', 4, 'rock'),
  ]
  const expected = ['G7', 'Bb', 'Dm', 'F', 'E7', 'Ab']

  it('ranks by score, then category, then chord', () => {
    expect(
      sortSuggestions(list, chordKey).map((s) => chordKey(s.candidate)),
    ).toEqual(expected)
  })

  it('gives the same ranking whatever order the input comes in', () => {
    const orders = [
      list,
      [...list].reverse(),
      [3, 0, 5, 1, 4, 2].map((i) => list[i]),
    ]
    for (const order of orders) {
      const ranked = sortSuggestions(order, chordKey)
      expect(ranked.map((s) => chordKey(s.candidate))).toEqual(expected)
    }
  })

  it('leaves the input untouched', () => {
    const copy = [...list]
    sortSuggestions(list, chordKey)
    expect(list).toEqual(copy)
  })

  it('keys chords by their spelled ASCII symbol', () => {
    expect(chordKey(parse('F#m7b5/C'))).toBe('F#m7b5/C')
    expect(chordKey(parse('Gb'))).not.toBe(chordKey(parse('F#')))
  })
})
