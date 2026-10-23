import { describe, expect, it } from 'vitest'
import {
  chordKey,
  chordSymbol,
  parseChordSymbol,
  parseNote,
  rankInPlace,
  rankPassingChords,
  type ChordName,
  type Key,
} from '../../src/theory'

const C: Key = { tonic: parseNote('C')!, mode: 'major' }
const chord = (text: string): ChordName => parseChordSymbol(text)!
const symbols = (r: ReturnType<typeof rankInPlace>) =>
  r.shown.map((s) => chordSymbol(s.candidate))

describe('chords for a chord’s place (David’s request)', () => {
  it('offers chords between its neighbours, never the chord itself', () => {
    const r = rankInPlace({
      key: C,
      previous: [chord('C')],
      current: chord('Am'),
      next: chord('G'),
    })
    expect(r.shown.length).toBeGreaterThan(3)
    expect(symbols(r)).not.toContain('Am')
    expect(symbols(r)).not.toContain('G')
    // It ranks as a passing chord into G would.
    const passing = rankPassingChords({
      key: C,
      previous: [chord('C')],
      next: chord('G'),
    })
    expect(symbols(r)).toEqual(
      passing.shown
        .filter((s) => chordKey(s.candidate) !== chordKey(chord('Am')))
        .map((s) => chordSymbol(s.candidate))
        .slice(0, r.shown.length),
    )
    // D or D7 leads into G as its dominant, so it is offered.
    expect(symbols(r).some((s) => s === 'D' || s === 'D7' || s === 'Dm')).toBe(
      true,
    )
  })

  it('offers what could follow for the last chord, without key changes', () => {
    const r = rankInPlace({
      key: C,
      previous: [chord('C'), chord('F')],
      current: chord('G'),
    })
    expect(symbols(r)).not.toContain('G')
    for (const s of [...r.shown, ...(r.wildcard ? [r.wildcard] : [])]) {
      expect(s.keyChange).toBeUndefined()
      expect(s.explanation.length).toBeGreaterThan(0)
    }
  })

  it('works for the first chord, leading into the second', () => {
    const r = rankInPlace({
      key: C,
      previous: [],
      current: chord('C'),
      next: chord('F'),
    })
    expect(r.shown.length).toBeGreaterThan(3)
    expect(symbols(r)).not.toContain('C')
    expect(symbols(r)).not.toContain('F')
  })

  it('steps the wildcard with Another', () => {
    const context = {
      key: C,
      previous: [chord('C')],
      current: chord('Am'),
      next: chord('F'),
    }
    const first = rankInPlace(context)
    const second = rankInPlace(context, { another: 1 })
    if (first.wildcards > 1) {
      expect(chordKey(second.wildcard!.candidate)).not.toBe(
        chordKey(first.wildcard!.candidate),
      )
    }
  })
})
