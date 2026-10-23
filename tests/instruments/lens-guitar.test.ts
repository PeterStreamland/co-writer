import { describe, expect, it } from 'vitest'
import {
  LENSES,
  averageMovement,
  midiNumber,
  pitchClass,
  rootPositionVoicing,
  voiceRuleHits,
  type Note,
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
          const voiced = voiceProgressionOnGuitar(guitar, lens, p.steps)
          for (const [i, c] of voiced.entries()) {
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
            // The search ran on the chord as written (or bare, for a power
            // chord); the name now follows the lowest note.
            const searched = [
              { ...p.steps[i].chord, quality: chord.quality },
              { root: chord.root, quality: chord.quality },
            ]
            const found = searched.some((asked) =>
              SEARCHES.some((options) =>
                findFingerings(guitar, asked, options).some(
                  (f) => formatFrets(f.frets) === shown,
                ),
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
      for (const guitar of [standard, dropD]) {
        const voiced = voiceProgressionOnGuitar(guitar, 'classical', p.steps)
        const hits = voiced.flatMap((c, i) =>
          voiceRuleHits({
            key: p.steps[i].key,
            from: i > 0 ? voiced[i - 1].voicing : undefined,
            to: c.voicing,
          }),
        )
        expect(hits.filter((h) => h.rule.startsWith('parallel'))).toEqual([])
      }
    },
  )

  it.each(LENSES)(
    '%s on guitar moves less than root position on average over the set',
    (lens) => {
      const average = (lists: Note[][][]) =>
        lists.reduce((sum, l) => sum + averageMovement(l), 0) / lists.length
      const baseline = average(
        progressions.map((p) =>
          p.steps.map((s) => rootPositionVoicing(s.chord)),
        ),
      )
      for (const guitar of [standard, dropD]) {
        const voiced = average(
          progressions.map((p) =>
            voiceProgressionOnGuitar(guitar, lens, p.steps).map(
              (c) => c.voicing.notes,
            ),
          ),
        )
        expect(voiced).toBeLessThan(baseline)
      }
    },
    // Voicing 19 progressions on two tunings takes about 4 s on its own,
    // more when the whole suite runs at once.
    30_000,
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

  it.each(LENSES)(
    'names each %s shape by its lowest note, keeping the classical bass',
    (lens) => {
      for (const p of progressions) {
        for (const [i, c] of voiceProgressionOnGuitar(
          standard,
          lens,
          p.steps,
        ).entries()) {
          const { chord: named, notes } = c.voicing
          const lowest = notes.reduce((a, b) =>
            (midiNumber(b) as number) < (midiNumber(a) as number) ? b : a,
          )
          expect(
            pitchClass(named.bass ?? named.root),
            formatFrets(c.voicing.frets),
          ).toBe(pitchClass(lowest))
          if (lens === 'classical') {
            const written = p.steps[i].chord
            expect(pitchClass(lowest)).toBe(
              pitchClass(written.bass ?? written.root),
            )
          }
        }
      }
    },
  )

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
