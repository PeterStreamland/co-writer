import { describe, expect, it } from 'vitest'
import {
  NEXT_CHORD_RULES,
  SUGGESTION_CATEGORIES,
  chordKey,
  chordSymbol,
  commonScales,
  enharmonicKey,
  getScale,
  keyName,
  nextChordCandidates,
  parseChordSymbol,
  parseNote,
  pickerTonics,
  romanNumeral,
  suggestionCategory,
  type ChordName,
  type Key,
  type NextChordRule,
  type NextChordSuggestion,
} from '../../src/theory'
import { nextChordCases } from '../fixtures/next-chords'
import { explanations } from '../fixtures/suggestions'

function parse(text: string): ChordName {
  const chord = parseChordSymbol(text)
  if (!chord) throw new Error(`${text} did not parse`)
  return chord
}

// 'C major', 'E minor', 'E dorian'.
function key(text: string): Key {
  const [tonicText, modeText] = text.split(' ')
  const tonic = parseNote(tonicText)
  const mode = getScale(modeText === 'minor' ? 'natural-minor' : modeText)?.id
  if (!tonic || !mode) throw new Error(`${text} is not a key`)
  return { tonic, mode }
}

function suggest(k: Key, previous: string[]): NextChordSuggestion[] {
  return nextChordCandidates({ key: k, previous: previous.map(parse) })
}

function find(
  suggestions: NextChordSuggestion[],
  chord: string,
  keyChange?: string,
): NextChordSuggestion | undefined {
  const wanted = chordKey(parse(chord))
  return suggestions.find(
    (s) =>
      chordKey(s.candidate) === wanted &&
      (s.keyChange ? keyName(s.keyChange) : undefined) === keyChange,
  )
}

describe('next-chord candidates (golden fixture)', () => {
  describe.each(nextChordCases)(
    '$key after [$previous]',
    ({ key: keyText, previous, expected, absent, top }) => {
      const k = key(keyText)
      const suggestions = suggest(k, previous)

      it.each(expected)(
        'offers $chord as $category $numeral',
        ({ chord, category, numeral, rule, keyChange }) => {
          const s = find(suggestions, chord, keyChange)
          expect(s, chord).toBeDefined()
          if (!s) return
          expect(suggestionCategory(s)).toBe(category)
          expect(romanNumeral(k, s.candidate).numeral).toBe(numeral)
          if (rule) expect(s.ruleIds).toContain(rule)
        },
      )

      if (absent) {
        it.each(absent)('does not offer %s', (chord) => {
          const wanted = chordKey(parse(chord))
          expect(
            suggestions.some((s) => chordKey(s.candidate) === wanted),
          ).toBe(false)
        })
      }

      if (top) {
        it(`ranks ${top.join(' and ')} highest`, () => {
          const best = suggestions[0].score
          const leaders = suggestions
            .filter((s) => s.score === best && !s.keyChange)
            .map((s) => chordSymbol(s.candidate, { ascii: true }))
          expect(leaders.sort()).toEqual([...top].sort())
        })
      }
    },
  )
})

describe('next-chord explanations', () => {
  it.each(explanations)(
    '$chord in $key reads as the golden explanation',
    ({ key: keyText, chord, explanation }) => {
      const s = find(suggest(key(keyText), [keyText.split(' ')[0]]), chord)
      expect(s?.explanation).toBe(explanation)
    },
  )

  it('names the source mode of a borrowed chord', () => {
    const s = find(suggest(key('C major'), ['C']), 'Ab')
    expect(s?.explanation).toBe(
      'A♭ is ♭VI, borrowed from C Aeolian: it darkens the key for a moment.',
    )
  })

  it('keeps a merged reading under More', () => {
    const s = find(suggest(key('C major'), ['C']), 'Bb')
    expect(s?.ruleIds).toEqual(['borrowed.parallel', 'rock.flat-seven'])
    expect(s?.more).toContain('the rock ♭VII')
  })

  it('explains a tritone substitute by the tritone it shares', () => {
    const s = find(suggest(key('C major'), ['C']), 'Db7')
    expect(s?.explanation).toBe(
      'D♭7 is ♭II7, the tritone substitute for G7: it shares G7’s tritone (B–F) and slides down a semitone to C.',
    )
  })

  it('names both keys of a pivot', () => {
    const s = find(suggest(key('C major'), ['C']), 'Am', 'G major')
    expect(s?.explanation).toBe(
      'Am is vi in C major and ii in G major, so it can pivot into G major.',
    )
    expect(s?.keyChange).toEqual(key('G major'))
  })
})

// Every key the picker offers in every common scale, after a tonic triad, a
// power chord and a dominant 7th.
const sweep = commonScales().flatMap((scale) =>
  pickerTonics(scale.id).map((tonic) => ({ tonic, mode: scale.id }) as Key),
)

function sweepPrevious(k: Key): ChordName[][] {
  return [
    [],
    [{ root: k.tonic, quality: 'm' }],
    [{ root: k.tonic, quality: 'M' }],
    [{ root: k.tonic, quality: '5' }],
    [{ root: k.tonic, quality: '7' }],
  ]
}

// The sweep runs once and its results are shared by the checks below.
let sweepRuns: { key: Key; suggestions: NextChordSuggestion[] }[] | undefined
function runs() {
  sweepRuns ??= sweep.flatMap((k) =>
    sweepPrevious(k).map((previous) => ({
      key: k,
      suggestions: nextChordCandidates({ key: k, previous }),
    })),
  )
  return sweepRuns
}

// The first check builds the sweep (about 900 runs), so it gets extra time.
describe('every suggestion', { timeout: 30_000 }, () => {
  const rules = new Map<string, NextChordRule>(
    NEXT_CHORD_RULES.map((r) => [r.id, r]),
  )

  it('has one category, known rules, a filled explanation and no repeats', () => {
    for (const { suggestions } of runs()) {
      expect(suggestions.length).toBeGreaterThan(0)
      const seen = new Set<string>()
      for (const s of suggestions) {
        const category = suggestionCategory(s)
        expect(category).toBeDefined()
        expect(
          s.tags.filter((t) =>
            (SUGGESTION_CATEGORIES as readonly string[]).includes(t),
          ),
        ).toEqual([category])
        for (const id of s.ruleIds) expect(rules.has(id), id).toBe(true)
        expect(rules.get(s.ruleIds[0])?.category).toBe(category)
        expect(s.explanation).not.toMatch(/[{}]|undefined/)
        expect(s.more ?? '').not.toMatch(/[{}]|undefined/)
        const id =
          chordKey(s.candidate) + (s.keyChange ? keyName(s.keyChange) : '')
        expect(seen.has(id), id).toBe(false)
        seen.add(id)
      }
    }
  })

  it('agrees with the numeral reading of secondary and borrowed chords', () => {
    for (const { key: k, suggestions } of runs()) {
      for (const s of suggestions) {
        const kind = romanNumeral(k, s.candidate).kind
        const category = suggestionCategory(s)
        if (category === 'secondary') expect(kind).toBe('secondary')
        if (category === 'borrowed') expect(kind).toBe('borrowed')
      }
    }
  })

  it('pivots only on a chord diatonic in both keys', () => {
    for (const k of sweep) {
      for (const s of nextChordCandidates({ key: k, previous: [parse('C')] })) {
        if (!s.keyChange) continue
        expect(suggestionCategory(s)).toBe('modulation')
        expect(romanNumeral(k, s.candidate).kind).toBe('diatonic')
        expect(romanNumeral(s.keyChange, s.candidate).kind).toBe('diatonic')
      }
    }
  })

  it('offers every category somewhere', () => {
    const found = new Set<string>()
    for (const previous of [['C'], ['C5']]) {
      for (const s of suggest(key('C major'), previous)) {
        found.add(suggestionCategory(s) ?? '')
      }
    }
    expect([...found].sort()).toEqual([...SUGGESTION_CATEGORIES].sort())
  })
})

describe('determinism (SPEC 6.1)', () => {
  it('gives the same ranking for the same input', () => {
    const k = key('E minor')
    const first = suggest(k, ['Em', 'C', 'D'])
    const second = suggest(k, ['Em', 'C', 'D'])
    expect(second).toEqual(first)
  })

  it('keeps every function through an enharmonic key swap (SPEC 13)', () => {
    const flat = key('Db major')
    const sharp = enharmonicKey(flat)
    expect(sharp).toBeDefined()
    if (!sharp) return
    const read = (k: Key) =>
      nextChordCandidates({
        key: k,
        previous: [{ root: k.tonic, quality: 'M' }],
      }).map((s) => [
        romanNumeral(k, s.candidate).numeral,
        suggestionCategory(s),
        s.score,
      ])
    // Ties are broken by chord name, which the swap respells, so compare
    // the readings as a set.
    const sorted = (k: Key) => read(k).map(String).sort()
    expect(sorted(sharp)).toEqual(sorted(flat))
  })
})
