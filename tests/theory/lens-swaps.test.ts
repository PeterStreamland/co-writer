import { describe, expect, it } from 'vitest'
import {
  LENSES,
  SWAPS_SHOWN,
  chooseVoicings,
  lensVoicings,
  midiNumber,
  parseChordSymbol,
  parseNote,
  voiceProgression,
  voicingOptions,
  type Key,
  type LensStep,
  type LensVoicing,
} from '../../src/theory'

const C: Key = { tonic: parseNote('C')!, mode: 'major' }
const stepsOf = (chords: string): LensStep[] =>
  chords.split(' ').map((s) => ({ key: C, chord: parseChordSymbol(s)! }))
const notesOf = (v: LensVoicing) => v.notes.map(midiNumber).join(',')

describe('swapping a chord in a lens column (David’s request)', () => {
  const steps = stepsOf('C Am F G')

  for (const lens of LENSES) {
    it(`${lens}: offers the lens’s other voicings, best first`, () => {
      const choices = voiceProgression(lens, steps)
      const candidates = lensVoicings(lens, C, steps[1].chord)
      const options = voicingOptions(lens, steps, choices, 1, candidates)
      const offered = new Set(candidates.map(notesOf))
      expect(options.length).toBeLessThanOrEqual(SWAPS_SHOWN)
      for (const [k, o] of options.entries()) {
        expect(offered.has(notesOf(o.candidate))).toBe(true)
        expect(notesOf(o.candidate)).not.toBe(notesOf(choices[1].voicing))
        expect(o.explanation).toMatch(/move/)
        expect(o.ruleIds[0]).toBe(`lens-${lens}`)
        if (k > 0) expect(o.score).toBeLessThanOrEqual(options[k - 1].score)
      }
      expect(new Set(options.map((o) => notesOf(o.candidate))).size).toBe(
        options.length,
      )
    })
  }

  it('keeps a swapped voicing in place and voices the rest around it', () => {
    const lens = 'classical'
    const choices = voiceProgression(lens, steps)
    const [swap] = voicingOptions(
      lens,
      steps,
      choices,
      1,
      lensVoicings(lens, C, steps[1].chord),
    )
    const candidates = steps.map((s, i) =>
      i === 1 ? [swap.candidate] : lensVoicings(lens, s.key, s.chord),
    )
    const after = chooseVoicings(lens, steps, candidates)
    expect(notesOf(after[1].voicing)).toBe(notesOf(swap.candidate))
    expect(after).toHaveLength(steps.length)
  })

  it('voices another chord for the place', () => {
    const lens = 'jazz'
    const choices = voiceProgression(lens, steps)
    const other = { key: C, chord: parseChordSymbol('Em7')! }
    const [best] = voicingOptions(
      lens,
      steps.map((s, i) => (i === 1 ? other : s)),
      choices,
      1,
      lensVoicings(lens, C, other.chord),
      1,
    )
    expect(best.candidate.chord.root.letter).toBe('E')
    expect(best.explanation).toMatch(/from C.*into F/)
  })
})
