import { describe, expect, it } from 'vitest'
import {
  BUILT_IN_STYLES,
  RANKING,
  blendWeights,
  chordKey,
  getScale,
  keyName,
  parseChordSymbol,
  parseNote,
  rankNextChords,
  suggestionCategory,
  type ChordName,
  type Key,
  type NextChordContext,
} from '../../src/theory'
import { knownProgressions } from '../fixtures/known-progressions'
import { styleRankings } from '../fixtures/style-rankings'

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
  keyText: string,
  chords: string[],
  style?: string,
): NextChordContext {
  return {
    key: key(keyText),
    previous: chords.map(parse),
    weights: style
      ? blendWeights(BUILT_IN_STYLES, { a: style, mix: 0 })
      : undefined,
  }
}

function shownKeys(c: NextChordContext): string[] {
  return rankNextChords(c).shown.map((s) => chordKey(s.candidate))
}

describe('known progressions (golden fixture)', () => {
  it.each(knownProgressions)(
    '$name ($style): $next is among the suggestions',
    ({ style, key: k, chords, next }) => {
      expect(shownKeys(context(k, chords, style))).toContain(
        chordKey(parse(next)),
      )
    },
  )
})

describe('the suggestions shown', () => {
  const cases = [
    context('C major', []),
    context('C major', ['C'], 'pop'),
    context('C major', ['C', 'G'], 'rock'),
    context('E minor', ['Em', 'C', 'D'], 'metal'),
    context('E minor', ['E5'], 'metal'),
    context('A minor-pentatonic', ['Am'], 'rock'),
    context('D dorian', ['Dm', 'G'], 'pop'),
  ]

  it.each(cases.map((c, i) => [i, c] as const))(
    'case %s: six to eight, mixed, explained and grouped',
    (_, c) => {
      const ranked = rankNextChords(c)
      const { shown } = ranked
      expect(shown.length).toBeLessThanOrEqual(RANKING.max)
      if (shown.length < RANKING.min) {
        // Only when there aren't enough playable moves.
        expect(c.key.mode).toBe('minor-pentatonic')
      }
      const counts = new Map<string, number>()
      for (const s of shown) {
        const category = suggestionCategory(s)
        expect(category).toBeDefined()
        expect(s.explanation.trim()).not.toBe('')
        expect(s.score).toBeGreaterThan(0)
        counts.set(category ?? '', (counts.get(category ?? '') ?? 0) + 1)
      }
      // One category fills more places only to reach six, when the others
      // have run out (the starting chords are all diatonic).
      if ([...counts.values()].some((n) => n > RANKING.perCategory)) {
        expect(shown.length).toBe(RANKING.min)
      }
      for (let i = 1; i < shown.length; i++) {
        expect(shown[i].score).toBeLessThanOrEqual(shown[i - 1].score)
      }
      // Groups hold the same suggestions, in order of their best one.
      expect(ranked.groups.flatMap((g) => g.suggestions).length).toBe(
        shown.length,
      )
      const firsts = ranked.groups.map((g) => shown.indexOf(g.suggestions[0]))
      expect([...firsts].sort((a, b) => a - b)).toEqual(firsts)
      for (const g of ranked.groups) {
        for (const s of g.suggestions) {
          expect(suggestionCategory(s)).toBe(g.category)
        }
      }
    },
  )

  it('never shows a move the style weighs at 0', () => {
    const weights = blendWeights(BUILT_IN_STYLES, { a: 'pop', mix: 0 })
    weights['diatonic.function'] = 0
    const ranked = rankNextChords({
      key: key('C major'),
      previous: [parse('C')],
      weights,
    })
    expect(ranked.shown.some((s) => s.ruleIds[0] === 'diatonic.function')).toBe(
      false,
    )
  })
})

describe('context effects (SPEC 6.1)', () => {
  function find(c: NextChordContext, chord: string) {
    const all = [...rankNextChords(c).shown]
    const ranked = rankNextChords(c)
    if (ranked.wildcard) all.push(ranked.wildcard)
    return all.find((s) => chordKey(s.candidate) === chordKey(parse(chord)))
  }

  it('ranks an overused chord lower and says so', () => {
    const fresh = context('C major', ['C', 'G'], 'pop')
    const tired = context('C major', ['C', 'F', 'C', 'F', 'C', 'G'], 'pop')
    const before = find(fresh, 'C')
    const after = find(tired, 'C')
    expect(after?.contextNotes).toContain(
      'Ranked lower: you’ve used C three times',
    )
    expect(after?.score).toBeLessThan(before?.score ?? 0)
  })

  it('favours the tonic at the end of an 8-bar phrase', () => {
    const c = context('C major', ['C', 'Am', 'F', 'G', 'C', 'Am', 'G7'], 'pop')
    const tonic = find(c, 'C')
    expect(tonic?.contextNotes).toContain(
      'Ranked higher: bar 8 ends a phrase, a place to land on the tonic',
    )
  })

  it('favours a half cadence at bar 4', () => {
    const c = context('C major', ['C', 'Am', 'F'], 'pop')
    expect(find(c, 'G')?.contextNotes).toContain(
      'Ranked higher: bar 4 ends half a phrase, a place to pause on V',
    )
  })

  it('favours the tonic when it hasn’t arrived yet', () => {
    const c = context('C major', ['Am', 'F', 'G'], 'pop')
    expect(find(c, 'C')?.contextNotes).toContain(
      'Ranked higher: the tonic hasn’t arrived yet after 3 chords',
    )
  })

  it('does not count C7 or Cm as a tonic arrival', () => {
    const c = context('C major', ['Am', 'F', 'G'])
    const notes = rankNextChords(c)
      .shown.filter((s) => ['C7', 'Cm'].includes(chordKey(s.candidate)))
      .flatMap((s) => s.contextNotes)
    expect(notes).toEqual([])
  })
})

describe('the wildcard (SPEC 6.2)', () => {
  const c = context('E minor', ['Em', 'C'], 'rock')

  it('is the same for the same input', () => {
    expect(rankNextChords(c)).toEqual(rankNextChords(c))
  })

  it('is never one of the suggestions shown', () => {
    const ranked = rankNextChords(c)
    const shown = ranked.shown.map((s) => chordKey(s.candidate))
    expect(ranked.wildcard).toBeDefined()
    expect(shown).not.toContain(chordKey(ranked.wildcard!.candidate))
  })

  it('steps through every other move before repeating', () => {
    const { wildcards } = rankNextChords(c)
    expect(wildcards).toBeGreaterThan(3)
    const id = (n: number) => {
      const w = rankNextChords(c, { another: n }).wildcard!
      return chordKey(w.candidate) + (w.keyChange ? keyName(w.keyChange) : '')
    }
    const seen = Array.from({ length: wildcards }, (_, n) => id(n))
    expect(new Set(seen).size).toBe(wildcards)
    expect(id(wildcards)).toBe(id(0))
  })

  it('can come from outside the style', () => {
    const weights = blendWeights(BUILT_IN_STYLES, { a: 'pop', mix: 0 })
    weights['chromatic.tritone-sub'] = 0
    const pool = Array.from(
      { length: 40 },
      (_, n) =>
        rankNextChords(
          { key: key('C major'), previous: [parse('C')], weights },
          { another: n },
        ).wildcard,
    )
    expect(pool.some((w) => w?.ruleIds[0] === 'chromatic.tritone-sub')).toBe(
      true,
    )
  })
})

describe('switching style moves the shown ranking (golden fixture)', () => {
  // Place in the suggestions shown, or past the end when not shown.
  function place(row: (typeof styleRankings)[number], style: string): number {
    const shown = shownKeys(context(row.key, [row.previous], style))
    const at = shown.indexOf(chordKey(parse(row.chord)))
    return at < 0 ? Infinity : at
  }

  it.each(styleRankings)(
    '$chord after $previous in $key: higher in $higherIn than $lowerIn',
    (row) => {
      const higher = place(row, row.higherIn)
      expect(higher, `${row.chord} shown in ${row.higherIn}`).toBeLessThan(
        Infinity,
      )
      expect(higher).toBeLessThan(place(row, row.lowerIn))
    },
  )
})
