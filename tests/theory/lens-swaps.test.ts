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
  neighbourOptions,
  voicingOptions,
  withSwaps,
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

  it('changes only the swapped chord (David’s request)', () => {
    const lens = 'classical'
    const choices = voiceProgression(lens, steps)
    const [swap] = voicingOptions(
      lens,
      steps,
      choices,
      1,
      lensVoicings(lens, C, steps[1].chord),
    )
    const after = withSwaps(lens, steps, choices, { 1: swap.candidate })
    expect(notesOf(after[1].voicing)).toBe(notesOf(swap.candidate))
    for (const i of [0, 2, 3]) {
      expect(notesOf(after[i].voicing)).toBe(notesOf(choices[i].voicing))
    }
    // The chord after it is judged afresh against its new neighbour.
    expect(after[0]).toBe(choices[0])
    expect(after[3]).toBe(choices[3])
    expect(after[2]).not.toBe(choices[2])
  })

  it('offers the neighbours smoother voicings for the new chord', () => {
    const lens = 'classical'
    const choices = voiceProgression(lens, steps)
    // Swap Am for C7 high up, so the chords either side sit badly by it.
    const c7 = { key: C, chord: parseChordSymbol('C7')! }
    const high = lensVoicings(lens, C, c7.chord).sort(
      (a, b) => midiNumber(b.notes[0])! - midiNumber(a.notes[0])!,
    )[0]
    const swapped = withSwaps(lens, steps, choices, { 1: high })
    const around = neighbourOptions(lens, steps, swapped, 1, (j) =>
      lensVoicings(lens, C, steps[j].chord),
    )
    expect(around.length).toBeGreaterThan(0)
    for (const { at, options } of around) {
      expect([0, 2]).toContain(at)
      expect(options.length).toBeGreaterThan(0)
      for (const o of options) {
        expect(notesOf(o.candidate)).not.toBe(notesOf(swapped[at].voicing))
      }
    }
  })
})
