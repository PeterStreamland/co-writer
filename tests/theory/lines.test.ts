import { describe, expect, it } from 'vitest'
import {
  LINE_MODES,
  addDur,
  approachNote,
  compareDur,
  dur,
  durEquals,
  enclosureOf,
  formatNote,
  layOut,
  lineFor,
  parseChordSymbol,
  parseMeter,
  parseNote,
  pitchClass,
  scaleNotes,
  sumDurs,
  type Dur,
  type Key,
  type LineStep,
  type Meter,
} from '../../src/theory'
import {
  approaches,
  enclosures,
  guideTones,
  rootFifths,
} from '../fixtures/lines'

const ascii = (n: Parameters<typeof formatNote>[0]) =>
  formatNote({ ...n, octave: undefined }, { ascii: true })

function keyOf(text: string): Key {
  const [tonic, mode] = text.split(' ')
  return { tonic: parseNote(tonic)!, mode }
}

function stepsOf(
  keyText: string,
  chords: string,
  meter: Meter = { num: 4, den: 4 },
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
  }))
}

describe('line moves (golden)', () => {
  it.each(approaches)(
    '$note approaches $target from $from in $key',
    ({ key, target, from, note, chromatic }) => {
      const t = { ...parseNote(target)!, octave: 3 }
      const found = approachNote(t, from)
      expect(ascii(found)).toBe(note)
      const inKey = scaleNotes(keyOf(key).tonic, keyOf(key).mode).some(
        (n) => pitchClass(n) === pitchClass(found),
      )
      expect(!inKey).toBe(chromatic)
    },
  )

  it.each(enclosures)(
    'enclosing $target in $key: $notes',
    ({ key, target, notes }) => {
      const t = { ...parseNote(target)!, octave: 4 }
      const found = enclosureOf(keyOf(key), t)
      expect(found.map(ascii)).toEqual(notes)
      expect(found[0].octave === 4 || found[0].octave === 5).toBe(true)
    },
  )

  it.each(guideTones)(
    'guide tones over $chords from the $from',
    ({ key, chords, from, notes }) => {
      const line = lineFor(
        from === '3rd' ? 'guide-3rd' : 'guide-7th',
        stepsOf(key, chords),
      )
      expect(line.notes.map((n) => ascii(n.note))).toEqual(notes)
    },
  )

  it.each(rootFifths)('root and 5th over $chord', ({ key, chord, notes }) => {
    const line = lineFor('root-fifth', stepsOf(key, chord))
    expect(line.notes.map((n) => ascii(n.note))).toEqual(notes)
    expect(line.notes.map((n) => n.length)).toEqual([dur(1, 2), dur(1, 2)])
  })
})

// Progressions in several keys, with chords outside the key, in several
// meters and with uneven chord lengths.
const cases: [string, string, string, string, (Dur | undefined)[]][] = [
  ['ii–V–I', 'C major', 'Dm7 G7 Cmaj7', '4/4', []],
  ['pop', 'C major', 'C G Am F', '4/4', []],
  ['minor with V', 'A natural-minor', 'Am Dm E7 Am', '4/4', []],
  ['borrowed', 'C major', 'C Ab Bb C', '4/4', []],
  [
    'secondary',
    'C major',
    'C A7 Dm G7',
    '4/4',
    [dur(1, 2), dur(1, 2), undefined, undefined],
  ],
  ['waltz', 'G major', 'G Em C D7', '3/4', []],
  ['six-eight', 'E natural-minor', 'Em C G D', '6/8', []],
  ['seven-eight', 'D dorian', 'Dm7 G Dm7 C', '7/8', []],
  ['two-bar chords', 'E natural-minor', 'Em C', '4/4', [dur(2, 1)]],
  [
    'short chords',
    'C major',
    'C F G C',
    '4/4',
    [dur(1, 4), dur(1, 8), dur(3, 8), dur(1, 4)],
  ],
  ['power chords', 'E natural-minor', 'E5 G5 A5 C5', '4/4', []],
  ['sus and 6ths', 'C major', 'Csus4 C6 Fsus2 G7sus4', '4/4', []],
]

describe('every line (Phase 6 exit criteria)', () => {
  for (const [label, key, chords, meterText, lengths] of cases) {
    const steps = stepsOf(key, chords, parseMeter(meterText)!, lengths)
    const scale = new Set(
      scaleNotes(steps[0].key.tonic, steps[0].key.mode).map(pitchClass),
    )
    for (const mode of LINE_MODES) {
      it(`${mode.label} over ${label} (${chords}, ${meterText})`, () => {
        const { notes } = lineFor(mode.id, steps)
        // Lines land on a chord tone at each chord change unless tagged
        // otherwise.
        for (const [i, step] of steps.entries()) {
          const first = notes.find((n) => durEquals(n.onset, step.placed.start))
          expect(first, `a note starts with chord ${i + 1}`).toBeDefined()
          expect(first!.step).toBe(i)
          expect(
            first!.tags.includes('chord-tone') || first!.tags.includes('pedal'),
          ).toBe(true)
        }
        // Every note outside the scale is tagged and explained.
        for (const n of notes) {
          expect(n.tags.length).toBeGreaterThan(0)
          expect(n.explanation.length).toBeGreaterThan(0)
          if (!scale.has(pitchClass(n.note))) {
            expect(n.tags).toContain('chromatic')
            expect(n.explanation).toMatch(/outside/)
          }
        }
        // Lines fit the beats available: end to end, each within its chord,
        // starting on the chord or on one of its beats.
        let at = steps[0].placed.start
        for (const n of notes) {
          expect(n.onset).toEqual(at)
          at = addDur(n.onset, n.length)
          const { placed } = steps[n.step]
          const end = addDur(placed.start, placed.length)
          expect(compareDur(n.onset, placed.start)).toBeGreaterThanOrEqual(0)
          expect(compareDur(at, end)).toBeLessThanOrEqual(0)
          const onBeat =
            durEquals(n.onset, placed.start) ||
            placed.beats.some((b) => durEquals(b.at, n.onset))
          expect(onBeat).toBe(true)
        }
        expect(sumDurs(notes.map((n) => n.length))).toEqual(
          sumDurs(steps.map((s) => s.placed.length)),
        )
      })
    }
  }
})

describe('bass lines', () => {
  const steps = stepsOf('C major', 'Dm7 G7 Cmaj7')

  it('walks a note a beat, ending a semitone from the next root', () => {
    const { notes } = lineFor('walking', steps)
    expect(notes).toHaveLength(12)
    for (let bar = 0; bar < 3; bar++) {
      const beats = notes.slice(bar * 4, bar * 4 + 4)
      expect(beats[0].tags).toEqual(['chord-tone'])
      expect(pitchClass(beats[0].note)).toBe(pitchClass(steps[bar].chord.root))
      const next = notes[(bar * 4 + 4) % 12]
      expect(Math.abs(beats[3].midi - next.midi)).toBe(1)
      expect(beats[3].tags[0]).toBe('approach')
    }
  })

  it('stays in the bass range, give or take an approach', () => {
    for (const id of [
      'roots',
      'root-fifth',
      'approach',
      'walking',
      'pedal',
    ] as const) {
      for (const n of lineFor(id, steps).notes) {
        expect(n.midi).toBeGreaterThanOrEqual(39) // E♭2
        expect(n.midi).toBeLessThanOrEqual(61) // C♯4
      }
    }
  })

  it('tags a pedal note that is not in the chord', () => {
    const { notes } = lineFor('pedal', stepsOf('C major', 'C F G C'))
    expect(notes.map((n) => n.tags[0])).toEqual([
      'chord-tone',
      'chord-tone',
      'pedal',
      'chord-tone',
    ])
    expect(notes[2].explanation).toMatch(/pedal/)
  })
})

describe('lines between chords', () => {
  it('passes by scale step into the next chord', () => {
    const { notes } = lineFor('scale-steps', stepsOf('C major', 'C F'))
    const tags = notes.map((n) => n.tags[0])
    expect(tags[0]).toBe('chord-tone')
    expect(
      tags
        .slice(1)
        .every(
          (t) => t === 'passing' || t === 'neighbour' || t === 'chord-tone',
        ),
    ).toBe(true)
  })

  it.each(cases)(
    'scale-step and chromatic lines put chord tones on strong beats: %s',
    (_, key, chords, meter, lengths) => {
      const steps = stepsOf(key, chords, parseMeter(meter)!, lengths)
      for (const id of ['scale-steps', 'chromatic'] as const) {
        for (const n of lineFor(id, steps).notes) {
          const { placed } = steps[n.step]
          const strength = durEquals(n.onset, placed.start)
            ? 'start'
            : placed.beats.find((b) => durEquals(b.at, n.onset))?.strength
          if (strength !== 'weak') expect(n.tags[0], `${id}`).toBe('chord-tone')
        }
      }
    },
  )

  it('encloses each target from a step above and a semitone below', () => {
    const { notes } = lineFor('enclosure', stepsOf('C major', 'C G'))
    const bar1 = notes.filter((n) => n.step === 0)
    expect(bar1.map((n) => n.tags[0])).toEqual([
      'chord-tone',
      'approach',
      'approach',
    ])
    const target = notes.find((n) => n.step === 1)!
    expect(bar1[1].midi).toBeGreaterThan(target.midi)
    expect(bar1[2].midi).toBe(target.midi - 1)
  })
})

describe('lines move', () => {
  it.each(cases)(
    'never repeat a note into an approach: %s',
    (_, key, chords, meter, lengths) => {
      const steps = stepsOf(key, chords, parseMeter(meter)!, lengths)
      for (const id of ['walking', 'approach', 'enclosure'] as const) {
        const { notes } = lineFor(id, steps)
        notes.forEach((n, i) => {
          if (i > 0 && n.tags[0] === 'approach') {
            expect(n.midi, `${id} note ${i + 1}`).not.toBe(notes[i - 1].midi)
          }
        })
      }
    },
  )

  it('keeps lines between chords near the middle of their range', () => {
    const steps = stepsOf('C major', 'C G Am F C G Am F')
    for (const id of ['scale-steps', 'chromatic', 'enclosure'] as const) {
      for (const n of lineFor(id, steps).notes) {
        expect(n.midi).toBeGreaterThanOrEqual(59) // B3
        expect(n.midi).toBeLessThanOrEqual(79) // G5
      }
    }
  })
})
