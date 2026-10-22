import { describe, expect, it } from 'vitest'
import {
  LENSES,
  averageMovement,
  chordSymbol,
  formatNote,
  lensVoicings,
  midiNumber,
  pitchClass,
  rootPositionVoicing,
  voiceProgression,
  voiceRuleHits,
  type LensChoice,
  type Note,
} from '../../src/theory'
import { chord, key, progressions, steps } from '../lens-helpers'

const midi = (n: Note) => midiNumber(n) as number
const show = (notes: Note[]) =>
  notes.map((n) => formatNote(n, { ascii: true })).join(' ')
const symbols = (choices: LensChoice[]) =>
  choices.map((c) => chordSymbol(c.voicing.chord, { ascii: true }))

// Every rule hit along a voiced progression, whatever the lens weights.
function allHits(p: (typeof progressions)[number], choices: LensChoice[]) {
  return choices.flatMap((c, i) =>
    voiceRuleHits({
      key: p.steps[i].key,
      from: i > 0 ? choices[i - 1].voicing : undefined,
      to: c.voicing,
    }),
  )
}

describe('lens exit criteria (PLAN Phase 5)', () => {
  it.each(progressions)(
    'classical has no parallel 5ths or octaves: $name',
    (p) => {
      const hits = allHits(p, voiceProgression('classical', p.steps))
      expect(
        hits
          .filter((h) => h.rule.startsWith('parallel'))
          .map((h) => h.explanation),
      ).toEqual([])
    },
  )

  it.each(LENSES)(
    '%s moves less than root position on average over the set',
    (lens) => {
      const average = (lists: Note[][][]) =>
        lists.reduce((sum, l) => sum + averageMovement(l), 0) / lists.length
      const baseline = average(
        progressions.map((p) =>
          p.steps.map((s) => rootPositionVoicing(s.chord)),
        ),
      )
      const voiced = average(
        progressions.map((p) =>
          voiceProgression(lens, p.steps).map((c) => c.voicing.notes),
        ),
      )
      expect(voiced).toBeLessThan(baseline)
    },
  )
})

describe('voicing lenses', () => {
  it('gives the same voicings for the same input', () => {
    for (const lens of LENSES) {
      const p = progressions[0].steps
      expect(voiceProgression(lens, p)).toEqual(voiceProgression(lens, p))
    }
  })

  it('voices nothing for no chords', () => {
    expect(voiceProgression('classical', [])).toEqual([])
  })

  it('reports only the rules each lens charges for', () => {
    const voiced = voiceProgression('rock', steps('C major', 'C Am F G'))
    expect(voiced.flatMap((c) => c.hits.map((h) => h.rule))).not.toContain(
      'parallel-fifths',
    )
  })

  it('names every voicing by its lowest note, except rootless ones', () => {
    for (const p of progressions) {
      for (const lens of LENSES) {
        for (const c of voiceProgression(lens, p.steps)) {
          const { chord: named, notes, form } = c.voicing
          if (form === 'rootless') continue
          const lowest = notes.reduce((a, b) => (midi(b) < midi(a) ? b : a))
          expect(
            pitchClass(named.bass ?? named.root),
            `${lens} ${show(notes)}`,
          ).toBe(pitchClass(lowest))
        }
      }
    }
  })

  it('names a jazz drop-2 inversion as a slash chord', () => {
    const drop = lensVoicings('jazz', key('E minor'), chord('Em7')).find(
      (v) => v.form === 'drop-2' && v.notes[0].letter === 'G',
    )
    expect(drop && chordSymbol(drop.chord)).toBe('Em7/G')
  })

  it('records how far each chord moved', () => {
    const voiced = voiceProgression('classical', steps('C major', 'C F'))
    expect(voiced[0].movement).toBe(0)
    expect(voiced[1].movement).toBeGreaterThan(0)
  })

  describe('classical', () => {
    it('writes four parts in their ranges, the bass as written', () => {
      for (const p of progressions) {
        for (const [i, c] of voiceProgression('classical', p.steps).entries()) {
          const [bass, tenor, alto, soprano] = c.voicing.notes.map(midi)
          expect(c.voicing.notes).toHaveLength(4)
          expect(pitchClass(c.voicing.notes[0])).toBe(
            pitchClass(p.steps[i].chord.bass ?? p.steps[i].chord.root),
          )
          expect(bass).toBeGreaterThanOrEqual(40) // E2
          expect(bass).toBeLessThanOrEqual(60) // C4
          expect(tenor).toBeGreaterThanOrEqual(48) // C3
          expect(tenor).toBeLessThanOrEqual(67) // G4
          expect(alto).toBeGreaterThanOrEqual(55) // G3
          expect(alto).toBeLessThanOrEqual(72) // C5
          expect(soprano).toBeGreaterThanOrEqual(60) // C4
          expect(soprano).toBeLessThanOrEqual(79) // G5
          expect(alto - tenor).toBeLessThanOrEqual(12)
          expect(soprano - alto).toBeLessThanOrEqual(12)
        }
      }
    })

    it('keeps the chord as written and sounds its 3rd', () => {
      for (const p of progressions) {
        const voiced = voiceProgression('classical', p.steps)
        voiced.forEach((c, i) => {
          expect(chordSymbol(c.voicing.chord)).toBe(
            chordSymbol(p.steps[i].chord),
          )
        })
      }
      const [c] = voiceProgression('classical', steps('C major', 'C'))
      expect(c.voicing.notes.map((n) => n.letter)).toContain('E')
    })

    it('doubles the 3rd of a diminished triad', () => {
      const [, dim] = voiceProgression(
        'classical',
        steps('C major', 'C Bdim/D C/E'),
      )
      const ds = dim.voicing.notes.filter((n) => n.letter === 'D')
      expect(ds, show(dim.voicing.notes)).toHaveLength(2)
    })

    it('never doubles the leading note', () => {
      for (const v of lensVoicings('classical', key('C major'), chord('G'))) {
        const bs = v.notes.filter((n) => n.letter === 'B')
        expect(bs.length, show(v.notes)).toBeLessThanOrEqual(1)
      }
    })

    it('resolves G7 to C: the 7th falls and the leading note rises', () => {
      const [g7, c] = voiceProgression('classical', steps('C major', 'G7 C'))
      const f = g7.voicing.notes.findIndex((n) => n.letter === 'F')
      const b = g7.voicing.notes.findIndex((n) => n.letter === 'B')
      expect(midi(c.voicing.notes[f]) - midi(g7.voicing.notes[f])).toBeLessThan(
        0,
      )
      expect(c.hits).toEqual([])
      // The leading note rises unless an inner voice falls to G.
      const step = midi(c.voicing.notes[b]) - midi(g7.voicing.notes[b])
      expect([1, -4]).toContain(step)
    })
  })

  describe('rock', () => {
    it('turns chords with a perfect 5th into power chords low down', () => {
      const voiced = voiceProgression('rock', steps('E minor', 'Em C G D'))
      expect(symbols(voiced).map((s) => s.replace(/\/.*/, ''))).toEqual([
        'E5',
        'C5',
        'G5',
        'D5',
      ])
      for (const c of voiced) {
        expect(c.voicing.notes.length).toBeLessThanOrEqual(3)
        expect(midi(c.voicing.notes[0])).toBeLessThanOrEqual(52) // E3
      }
    })

    it('keeps a chord with no perfect 5th whole', () => {
      const [, dim] = voiceProgression('rock', steps('E minor', 'Em F#dim'))
      expect(chordSymbol(dim.voicing.chord, { ascii: true })).toBe('F#dim')
    })
  })

  describe('open', () => {
    it('colours chords with add9 or sus2 where the key has the note', () => {
      const offered = (k: string, c: string) =>
        new Set(
          lensVoicings('open', key(k), chord(c)).map((v) => v.chord.quality),
        )
      expect(offered('C major', 'C')).toEqual(new Set(['M', 'add9', 'sus2']))
      expect(offered('C major', 'Am')).toEqual(new Set(['m', 'madd9']))
      // F♯ isn't in C major, so Em stays as it is.
      expect(offered('C major', 'Em')).toEqual(new Set(['m']))
    })

    it('spreads the voicing over a low bass', () => {
      for (const c of voiceProgression('open', steps('G major', 'G Em C D'))) {
        const notes = c.voicing.notes.map(midi)
        expect(notes[0]).toBeLessThanOrEqual(48) // C3
        for (let i = 2; i < notes.length; i++) {
          expect(notes[i] - notes[i - 1]).toBeGreaterThanOrEqual(3)
        }
      }
    })
  })

  describe('jazz', () => {
    it('turns triads into 7th chords that fit the key', () => {
      const voiced = voiceProgression('jazz', steps('C major', 'C Am F G'))
      expect(symbols(voiced)).toEqual(['Cmaj9', 'Am9', 'Fmaj9', 'G9'])
    })

    it('voices E7 in A minor with a flat 9th, from the key', () => {
      const offered = lensVoicings('jazz', key('A minor'), chord('E7'))
      const rootless = offered.filter((v) => v.form === 'rootless')
      expect(new Set(rootless.map((v) => chordSymbol(v.chord)))).toEqual(
        new Set(['E7♭9']),
      )
    })

    it('leaves the root out of rootless voicings, close together', () => {
      for (const v of lensVoicings('jazz', key('C major'), chord('Dm7'))) {
        if (v.form !== 'rootless') continue
        expect(v.notes.map((n) => n.letter)).not.toContain('D')
        expect(midi(v.notes.at(-1)!) - midi(v.notes[0])).toBeLessThanOrEqual(12)
      }
    })

    it('offers shells of root, 3rd and 7th', () => {
      const shells = lensVoicings('jazz', key('C major'), chord('G7')).filter(
        (v) => v.form === 'shell',
      )
      expect(shells.length).toBeGreaterThan(0)
      for (const v of shells) {
        expect(v.notes.map((n) => n.letter).sort()).toEqual(['B', 'F', 'G'])
      }
    })
  })
})
