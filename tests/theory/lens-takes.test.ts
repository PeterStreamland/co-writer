import { describe, expect, it } from 'vitest'
import {
  LENSES,
  LENS_RULE_WEIGHTS,
  LENS_VARIATION,
  lensVoicings,
  midiNumber,
  parseChordSymbol,
  parseNote,
  seededRandom,
  voiceProgression,
  type Key,
  type LensChoice,
  type LensStep,
} from '../../src/theory'
import { takeRandom } from '../../src/workspace/lens-columns'

const C: Key = { tonic: parseNote('C')!, mode: 'major' }
const stepsOf = (chords: string): LensStep[] =>
  chords.split(' ').map((s) => ({ key: C, chord: parseChordSymbol(s)! }))

const shape = (choices: LensChoice[]) =>
  choices.map((c) => c.voicing.notes.map(midiNumber).join(',')).join(' | ')

const progressions = ['C Am F G', 'Dm7 G7 Cmaj7 A7', 'C F G C']

describe('another take on a lens (David’s request)', () => {
  for (const chords of progressions) {
    const steps = stepsOf(chords)
    for (const lens of LENSES) {
      it(`${lens} over ${chords}: new takes, each one the lens would choose`, () => {
        const best = voiceProgression(lens, steps)
        const takes = [1, 2, 3, 4, 5, 6].map((t) =>
          voiceProgression(lens, steps, Math.random, seededRandom(t * 977)),
        )
        // The same take is the same every time.
        expect(
          shape(voiceProgression(lens, steps, Math.random, seededRandom(977))),
        ).toBe(shape(takes[0]))
        for (const take of takes) {
          // Every voicing is one the lens offers for its chord.
          take.forEach((c, i) => {
            const offered = lensVoicings(lens, C, steps[i].chord).map((v) =>
              v.notes.map(midiNumber).join(','),
            )
            expect(offered).toContain(c.voicing.notes.map(midiNumber).join(','))
          })
          // The lens's strict rules (costing well over a take's chance)
          // that the best keeps, the takes keep; its mild likings (parallels
          // cost 1 in the Open lens) a take may trade for a smoother path.
          const strict = Object.entries(LENS_RULE_WEIGHTS[lens])
            .filter(([, w]) => w > 2 * LENS_VARIATION)
            .map(([r]) => r)
          for (const rule of strict) {
            const broken = (cs: LensChoice[]) =>
              cs.some((c) => c.hits.some((h) => h.rule === rule))
            if (!broken(best)) expect(broken(take)).toBe(false)
          }
        }
        if (lens === 'classical' || lens === 'jazz' || lens === 'open') {
          expect(new Set(takes.map(shape)).size).toBeGreaterThan(1)
        }
      })
    }
  }

  it('seeds each take from the chords, the lens and the take', () => {
    const steps = stepsOf('C Am F G')
    expect(takeRandom(steps, 'classical', 0)).toBeUndefined()
    const a = takeRandom(steps, 'classical', 2)!
    const b = takeRandom(steps, 'classical', 2)!
    expect(a()).toBe(b())
    expect(takeRandom(steps, 'classical', 3)!()).not.toBe(
      takeRandom(steps, 'classical', 2)!(),
    )
  })
})
