import { describe, expect, it } from 'vitest'
import {
  dur,
  formatNote,
  layOut,
  mainMotif,
  melodyRange,
  midiNumber,
  motifLabel,
  motifOptions,
  motifText,
  motifsIn,
  parseChordSymbol,
  parseNote,
  transposeDiatonic,
  typeMelody,
  type Key,
  type MelodyNote,
} from '../../src/theory'
import { motifs } from '../fixtures/motifs'

const FOUR = { meter: { num: 4, den: 4 } }

function keyOf(text: string): Key {
  const [tonic, mode] = text.split(' ')
  return { tonic: parseNote(tonic)!, mode }
}

function context(c: (typeof motifs)[number]) {
  const key = keyOf(c.key)
  const timing = layOut(
    c.chords.map(() => undefined),
    FOUR,
  )
  return {
    melody: typeMelody(c.melody, dur(1, 4)).notes,
    key,
    chords: c.chords.map((s, i) => ({
      chord: parseChordSymbol(s)!,
      key,
      start: timing[i].start,
      length: timing[i].length,
    })),
    time: FOUR,
    range: c.range
      ? { low: parseNote(c.range[0])!, high: parseNote(c.range[1])! }
      : melodyRange('tenor'),
  }
}

describe('motif options (Phase 7 task 3)', () => {
  for (const c of motifs) {
    it(c.name, () => {
      const ctx = context(c)
      const motif = mainMotif(ctx.melody, ctx.time)
      const options = motifOptions(ctx)
      if (c.motifBar === undefined && !c.repeat && !c.sequence) {
        expect(motif).toBeUndefined()
        expect(options).toEqual([])
        return
      }
      if (c.motifBar !== undefined) expect(motif?.bar).toBe(c.motifBar)
      const of = (kind: string) =>
        options.filter((o) => o.candidate.kind === kind)
      if (c.repeat) {
        expect(motifText(of('repeat')[0].candidate.notes)).toBe(c.repeat)
      }
      if (c.startsAt) {
        for (const o of options) {
          expect(o.candidate.notes[0].onset).toEqual(
            dur(c.startsAt.n, c.startsAt.d),
          )
        }
      }
      if (c.bestSequence) {
        expect(motifText(of('sequence')[0].candidate.notes)).toBe(
          c.bestSequence,
        )
      }
      if (c.sequence) {
        expect(sequenceBy(ctx, c.sequence.steps)).toBe(c.sequence.notes)
        // When that sequence is among those shown, it is the same notes.
        const shown = options.find(
          (o) => o.candidate.steps === c.sequence!.steps,
        )
        if (shown) {
          expect(motifText(shown.candidate.notes)).toBe(c.sequence.notes)
        }
      }
      if (c.upsideDown) {
        expect(motifText(of('upside-down')[0].candidate.notes)).toBe(
          c.upsideDown,
        )
      }
    })
  }
})

// A sequence by a given step, whether or not it is among the best shown.
function sequenceBy(
  ctx: ReturnType<typeof context>,
  steps: number,
): string | undefined {
  const motif = mainMotif(ctx.melody, ctx.time)!
  const key = ctx.key
  return motif.notes
    .map((n: MelodyNote) => formatNote(transposeDiatonic(n.note, steps, key)))
    .join(' ')
}

// Exit criterion: a motif option appears whenever the melody contains a
// motif (a bar with two or more notes), and every option stays in range
// and is tagged.
describe('a motif option whenever there is a motif', () => {
  const melodies = [
    'C4 D',
    'E4 F G G',
    'C4 - D -',
    'G4 - - - A B C5 D5',
    'C4 D E F G A B C5 D5 E5',
    'B4 C5',
    'A3 G♯ A - E4 - - -',
  ]
  it('over every range preset and key', () => {
    let checked = 0
    for (const keyText of ['C major', 'A natural-minor', 'E♭ major']) {
      const key = keyOf(keyText)
      for (const preset of ['tenor', 'bass', 'soprano', 'guitar']) {
        const range = melodyRange(preset)
        for (const text of melodies) {
          const melody = typeMelody(text, dur(1, 4)).notes
          const ctx = { melody, key, chords: [], time: FOUR, range }
          const has = motifsIn(melody, FOUR).length > 0
          const options = motifOptions(ctx)
          expect(options.length > 0, `${text} in ${preset}`).toBe(has)
          for (const o of options) {
            expect(o.tags).toContain('motif')
            for (const n of o.candidate.notes) {
              const m = midiNumber(n.note)!
              expect(m).toBeGreaterThanOrEqual(midiNumber(range.low)!)
              expect(m).toBeLessThanOrEqual(midiNumber(range.high)!)
            }
            checked++
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(100)
  })
})

describe('option names', () => {
  it('names each option, with a sequence’s step', () => {
    expect(motifLabel({ kind: 'repeat', notes: [] })).toBe('Repeat')
    expect(motifLabel({ kind: 'sequence', steps: 2, notes: [] })).toBe(
      'Sequence up a 3rd',
    )
    expect(motifLabel({ kind: 'sequence', steps: -1, notes: [] })).toBe(
      'Sequence down a 2nd',
    )
    expect(motifLabel({ kind: 'upside-down', notes: [] })).toBe('Upside down')
  })
})
