import { describe, expect, it } from 'vitest'
import {
  LINE_DENSITIES,
  LINE_MODES,
  addDur,
  addOptions,
  barOf,
  compareDur,
  dur,
  durEquals,
  formatNote,
  layOut,
  lineFor,
  noteOptions,
  parseChordSymbol,
  parseMeter,
  parseNote,
  rangeOf,
  removeNote,
  scaleNotes,
  slotsOf,
  subDur,
  sumDurs,
  swapNote,
  withBars,
  type Dur,
  type Key,
  type LineDensity,
  type LineStep,
  type Meter,
  type Note,
} from '../../src/theory'

const ascii = (n: Note) =>
  formatNote({ ...n, octave: undefined }, { ascii: true })
const spelled = (n: { letter: string; accidental: number }) =>
  `${n.letter}${n.accidental}`

function keyOf(text: string): Key {
  const [tonic, mode] = text.split(' ')
  return { tonic: parseNote(tonic)!, mode }
}

function stepsOf(
  keyText: string,
  chords: string,
  meter: Meter = { num: 4, den: 4 },
  density?: LineDensity,
  lengths: (Dur | undefined)[] = [],
): LineStep[] {
  const key = keyOf(keyText)
  const symbols = chords.split(' ')
  const placed = layOut(
    symbols.map((_, i) => lengths[i % Math.max(1, lengths.length)]),
    { meter },
  )
  return symbols.map((s, i) => ({
    chord: parseChordSymbol(s)!,
    key,
    placed: placed[i],
    density,
  }))
}

const note = (text: string) => parseNote(text)!

const cases: [string, string, string, Dur[]?][] = [
  ['C major', 'C Am F G', '4/4'],
  ['A natural-minor', 'Am Dm E7 Am', '3/4'],
  ['D major', 'D G A D', '6/8'],
  ['C major', 'C F G C', '4/4', [dur(1, 2), dur(1, 1), dur(1, 4), dur(1, 1)]],
]

describe('notes a bar (David’s request)', () => {
  for (const [key, chords, meterText, lengths] of cases) {
    for (const density of LINE_DENSITIES) {
      const steps = stepsOf(
        key,
        chords,
        parseMeter(meterText)!,
        density.id,
        lengths,
      )
      for (const mode of LINE_MODES) {
        it(`${mode.label}, ${density.label}, over ${chords} in ${meterText}`, () => {
          const { notes } = lineFor(mode.id, steps)
          // Still lands on a chord tone at each change unless tagged.
          for (const [i, step] of steps.entries()) {
            const first = notes.find((n) =>
              durEquals(n.onset, step.placed.start),
            )
            expect(first?.step).toBe(i)
            expect(
              first!.tags.includes('chord-tone') ||
                first!.tags.includes('pedal'),
            ).toBe(true)
          }
          // Every note starts on one of its chord's slots and the line
          // fills the chords end to end.
          let at = steps[0].placed.start
          for (const n of notes) {
            expect(n.onset).toEqual(at)
            at = addDur(n.onset, n.length)
            const slots = slotsOf(steps[n.step].placed, density.id)
            expect(slots.some((s) => durEquals(s.at, n.onset))).toBe(true)
          }
          expect(sumDurs(notes.map((n) => n.length))).toEqual(
            sumDurs(steps.map((s) => s.placed.length)),
          )
        })
      }
    }
  }

  it('plays as many notes as the level asks', () => {
    const count = (density: LineDensity, meter = '4/4') => {
      const steps = stepsOf('C major', 'C F', parseMeter(meter)!, density)
      return lineFor('roots', steps).notes.filter((n) => n.step === 0).length
    }
    expect(count('held')).toBe(1)
    expect(count('strong')).toBe(2)
    expect(count('beats')).toBe(4)
    expect(count('split')).toBe(8)
    // A dotted beat splits in three: six quavers in a bar of 6/8.
    expect(count('split', '6/8')).toBe(6)
  })

  it('leaves each mode as it was with no level set', () => {
    const steps = stepsOf('C major', 'C Am F G')
    const roots = lineFor('roots', steps).notes
    expect(roots.length).toBe(4)
    const walking = lineFor('walking', steps).notes
    expect(walking.length).toBe(16)
  })

  it('walks twice a beat with eight notes in a bar', () => {
    const steps = stepsOf('C major', 'C Am F G', undefined, 'split')
    const bar = lineFor('walking', steps).notes.filter((n) => n.step === 0)
    expect(bar.length).toBe(8)
    expect(bar.at(-1)!.tags).toContain('approach')
  })
})

describe('edited bars', () => {
  const steps = stepsOf('C major', 'C F')
  const line = lineFor('walking', steps).notes

  it('reads a bar back as its notes and where each starts', () => {
    const bar = barOf(line, 0, steps)
    expect(bar.length).toBe(4)
    expect(bar.map((b) => b.at)).toEqual([
      dur(0, 1),
      dur(1, 4),
      dur(1, 2),
      dur(3, 4),
    ])
  })

  it('tags each edited note by what it is between its neighbours', () => {
    const bars = (notes: string[]) => ({
      0: notes.map((n, k) => ({ note: note(n), at: dur(k, 4) })),
    })
    const tagsOf = (notes: string[], at: number) =>
      withBars(line, steps, bars(notes))[at].tags
    expect(tagsOf(['C4', 'D4', 'E4', 'G4'], 1)).toEqual(['passing'])
    expect(tagsOf(['E4', 'F4', 'E4', 'G4'], 1)).toEqual(['neighbour'])
    expect(tagsOf(['C4', 'A4', 'F#4', 'G4'], 2)).toEqual([
      'approach',
      'chromatic',
    ])
    expect(tagsOf(['C4', 'F#4', 'C4', 'E4'], 1)).toEqual(['free', 'chromatic'])
    expect(tagsOf(['C4', 'A4', 'C4', 'E4'], 1)).toEqual(['free'])
    const [n] = withBars(line, steps, bars(['C4', 'A4', 'C4', 'E4'])).slice(1)
    expect(n.explanation).toMatch(/your own/)
  })

  it('keeps an edited bar to its chord’s length when the chord changes', () => {
    const bar = barOf(line, 0, steps)
    const shorter = stepsOf('C major', 'C F', undefined, undefined, [
      dur(1, 2),
      dur(1, 1),
    ])
    const notes = withBars(lineFor('walking', shorter).notes, shorter, {
      0: bar,
    })
    const first = notes.filter((n) => n.step === 0)
    expect(first.length).toBe(2)
    expect(sumDurs(first.map((n) => n.length))).toEqual(dur(1, 2))
    // And a longer one holds the last note on.
    const longer = stepsOf('C major', 'C F', undefined, undefined, [
      dur(3, 2),
      dur(1, 1),
    ])
    const held = withBars(lineFor('walking', longer).notes, longer, {
      0: bar,
    }).filter((n) => n.step === 0)
    expect(held.length).toBe(4)
    expect(held.at(-1)!.length).toEqual(dur(3, 4))
  })

  it('tags a note outside the key at the change, so the line still says why', () => {
    const notes = withBars(line, steps, {
      1: [{ note: note('F#3'), at: dur(0, 1) }],
    })
    const first = notes.find((n) => n.step === 1)!
    expect(first.tags).not.toContain('chord-tone')
    expect(first.tags).toContain('chromatic')
    expect(first.explanation).toMatch(/outside/)
  })
})

describe('notes for another note’s place', () => {
  const steps = stepsOf('C major', 'C Am F G')
  const line = lineFor('scale-steps', steps)
  const range = rangeOf(line.mode)
  const scale = new Set(scaleNotes(note('C'), 'major').map(spelled))

  it('offers chord tones first where the chord changes', () => {
    const options = noteOptions(line.notes, 0, steps, range)
    expect(options.length).toBeGreaterThan(3)
    expect(options[0].tags[0]).toBe('chord-tone')
    expect(['C', 'E', 'G']).toContain(ascii(options[0].candidate.note))
  })

  it('is every note a Suggestion, none the note already there', () => {
    for (const [i, n] of line.notes.entries()) {
      for (const o of noteOptions(line.notes, i, steps, range)) {
        expect(o.candidate.midi).not.toBe(n.midi)
        expect(o.tags.length).toBeGreaterThan(0)
        expect(o.ruleIds.length).toBeGreaterThan(0)
        expect(o.explanation.length).toBeGreaterThan(0)
        if (!scale.has(spelled(o.candidate.note))) {
          expect(o.tags).toContain('chromatic')
        }
        expect(o.candidate.onset).toEqual(n.onset)
        expect(o.candidate.length).toEqual(n.length)
      }
    }
  })

  it('spells a note outside the key toward the note it moves to', () => {
    const notes = withBars(line.notes, steps, {
      0: ['C4', 'A4', 'G4', 'E4'].map((n, k) => ({
        note: note(n),
        at: dur(k, 4),
      })),
    })
    const options = noteOptions(notes, 1, steps, range)
    const flat = options.find((o) => o.candidate.midi === 68)
    // Coming down to G, the note between G and A is A♭, not G♯.
    expect(flat && ascii(flat.candidate.note)).toBe('Ab')
  })

  it('swaps a note in place', () => {
    const [option] = noteOptions(line.notes, 1, steps, range)
    const bar = swapNote(line.notes, 1, steps, option.candidate.note)
    const notes = withBars(line.notes, steps, { 0: bar })
    expect(notes[1].midi).toBe(option.candidate.midi)
    expect(notes.length).toBe(line.notes.length)
  })
})

describe('adding notes', () => {
  // C held for a bar, then F: room to add.
  const steps = stepsOf('C major', 'C Am')
  const line = withBars(lineFor('roots', steps).notes, steps, {
    0: [{ note: note('C3'), at: dur(0, 1) }],
    1: [{ note: note('E3'), at: dur(0, 1) }],
  })
  const options = addOptions(line, 0, steps)
  const byMove = (id: string) => options.find((o) => o.tags[1] === id)!
  const names = (id: string) => byMove(id).candidate.map((b) => ascii(b.note))

  it('passes by step, leads by a semitone, or runs into the next note', () => {
    expect(names('passing')).toEqual(['C', 'D'])
    expect(names('approach')).toEqual(['C', 'D#'])
    expect(names('repeat')).toEqual(['C', 'C'])
    expect(names('chord-tone')).toEqual(['C', 'G'])
    expect(names('chromatic-run')).toEqual(['C', 'C#', 'D', 'D#'])
    for (const o of options) {
      expect(o.ruleIds[0]).toMatch(/^line-add-/)
      expect(o.explanation.length).toBeGreaterThan(0)
    }
  })

  it('adds a chord tone other than the note it leads to', () => {
    const notes = withBars(line, steps, {
      0: [
        { note: note('C3'), at: dur(0, 1) },
        { note: note('F#3'), at: dur(1, 2) },
        { note: note('G3'), at: dur(3, 4) },
      ],
    })
    const tone = addOptions(notes, 1, steps).find(
      (o) => o.tags[1] === 'chord-tone',
    )!
    expect(tone.candidate.map((b) => ascii(b.note))).toEqual([
      'C',
      'F#',
      'E',
      'G',
    ])
  })

  it('shares the note’s time evenly', () => {
    expect(byMove('passing').candidate.map((b) => b.at)).toEqual([
      dur(0, 1),
      dur(1, 2),
    ])
    expect(byMove('chromatic-run').candidate.map((b) => b.at)).toEqual([
      dur(0, 1),
      dur(1, 4),
      dur(1, 2),
      dur(3, 4),
    ])
  })

  it('never makes a note shorter than a semiquaver', () => {
    const fast = stepsOf('C major', 'C Am', undefined, 'split')
    const notes = lineFor('walking', fast).notes
    for (const [i] of notes.entries()) {
      for (const o of addOptions(notes, i, fast)) {
        const bar = o.candidate
        bar.forEach((b, k) => {
          const end = bar[k + 1]?.at ?? fast[notes[i].step].placed.length
          expect(
            compareDur(subDur(end, b.at), dur(1, 16)),
          ).toBeGreaterThanOrEqual(0)
        })
      }
    }
  })
})

describe('removing notes', () => {
  const steps = stepsOf('C major', 'C F')
  const line = lineFor('walking', steps).notes

  it('lets the note before hold on', () => {
    const bar = removeNote(line, 1, steps)!
    expect(bar.length).toBe(3)
    expect(bar.map((b) => b.at)).toEqual([dur(0, 1), dur(1, 2), dur(3, 4)])
  })

  it('moves the next note to the start when the first goes', () => {
    const bar = removeNote(line, 0, steps)!
    expect(bar[0].at).toEqual(dur(0, 1))
    expect(ascii(bar[0].note)).toBe(ascii(line[1].note))
  })

  it('keeps a bar’s only note', () => {
    const roots = lineFor('roots', steps).notes
    expect(removeNote(roots, 0, steps)).toBeUndefined()
  })
})
