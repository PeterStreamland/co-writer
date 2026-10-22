import { describe, expect, it } from 'vitest'
import {
  LENSES,
  averageMovement,
  rootPositionVoicing,
  voiceRuleHits,
} from '../../src/theory'
import {
  DEFAULT_SPAN,
  findFingerings,
  formatFrets,
} from '../../src/instruments/fingering'
import { makeGuitar } from '../../src/instruments/guitar'
import { voiceProgressionOnGuitar } from '../../src/instruments/lens-guitar'
import { STANDARD_TUNING, tuningStrings } from '../../src/instruments/tunings'
import { progressions, steps } from '../lens-helpers'

const standard = makeGuitar(STANDARD_TUNING)
const dropD = makeGuitar(tuningStrings('drop-d', false))

// Every option set the lenses search with.
const SEARCHES = [
  {},
  { omitFifth: true },
  { openStrings: false },
  { openStrings: false, omitFifth: true },
]

describe('guitar lens exit criteria (PLAN Phase 5)', () => {
  it.each(progressions)(
    'every guitar voicing passes the Phase 3 playability rules: $name',
    (p) => {
      for (const guitar of [standard, dropD]) {
        for (const lens of LENSES) {
          for (const c of voiceProgressionOnGuitar(guitar, lens, p.steps)) {
            const { frets, chord } = c.voicing
            const shown = formatFrets(frets)
            expect(frets).toHaveLength(guitar.strings.length)
            const fretted = frets.filter(
              (f): f is number => f !== null && f > 0,
            )
            if (fretted.length) {
              const span = Math.max(...fretted) - Math.min(...fretted) + 1
              expect(span, shown).toBeLessThanOrEqual(DEFAULT_SPAN)
            }
            const found = SEARCHES.some((options) =>
              findFingerings(guitar, chord, options).some(
                (f) => formatFrets(f.frets) === shown,
              ),
            )
            expect(found, `${lens}: ${shown}`).toBe(true)
          }
        }
      }
    },
  )

  it.each(progressions)(
    'classical on guitar has no parallel 5ths or octaves: $name',
    (p) => {
      const voiced = voiceProgressionOnGuitar(standard, 'classical', p.steps)
      const hits = voiced.flatMap((c, i) =>
        voiceRuleHits({
          key: p.steps[i].key,
          from: i > 0 ? voiced[i - 1].voicing : undefined,
          to: c.voicing,
        }),
      )
      expect(hits.filter((h) => h.rule.startsWith('parallel'))).toEqual([])
    },
  )

  it.each(progressions)(
    'every lens on guitar moves less than root position: $name',
    (p) => {
      const baseline = averageMovement(
        p.steps.map((s) => rootPositionVoicing(s.chord)),
      )
      for (const lens of LENSES) {
        const voiced = voiceProgressionOnGuitar(standard, lens, p.steps)
        const movement = averageMovement(voiced.map((c) => c.voicing.notes))
        expect(movement, lens).toBeLessThan(baseline)
      }
    },
  )
})

describe('guitar lenses', () => {
  it('plays power chords in the rock lens', () => {
    const voiced = voiceProgressionOnGuitar(
      standard,
      'rock',
      steps('E minor', 'Em C G D'),
    )
    for (const c of voiced) {
      expect(c.voicing.chord.quality).toBe('5')
      expect(c.voicing.notes.length).toBeLessThanOrEqual(3)
    }
  })

  it('uses four strings in the classical lens', () => {
    const voiced = voiceProgressionOnGuitar(
      standard,
      'classical',
      steps('C major', 'C F G7 C'),
    )
    for (const c of voiced) expect(c.voicing.notes).toHaveLength(4)
  })

  it('keeps every jazz shape off the open strings', () => {
    const voiced = voiceProgressionOnGuitar(
      standard,
      'jazz',
      steps('C major', 'Dm7 G7 Cmaj7'),
    )
    for (const c of voiced) expect(c.voicing.frets).not.toContain(0)
  })
})
