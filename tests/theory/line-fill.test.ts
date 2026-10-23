import { describe, expect, it } from 'vitest'
import {
  LINE_MODES,
  MOST_NOTES,
  addDur,
  dur,
  durEquals,
  fillBar,
  layOut,
  lineFor,
  mostNotes,
  parseChordSymbol,
  parseMeter,
  parseNote,
  rangeOf,
  rhythmOf,
  scaleNotes,
  seededRandom,
  subDur,
  sumDurs,
  tonesOf,
  pitchClass,
  withBars,
  type Key,
  type LineStep,
  type Meter,
} from '../../src/theory'

function keyOf(text: string): Key {
  const [tonic, mode] = text.split(' ')
  return { tonic: parseNote(tonic)!, mode }
}

function stepsOf(keyText: string, chords: string, meter: Meter): LineStep[] {
  const key = keyOf(keyText)
  const symbols = chords.split(' ')
  const placed = layOut(
    symbols.map(() => undefined),
    { meter },
  )
  return symbols.map((s, i) => ({
    chord: parseChordSymbol(s)!,
    key,
    placed: placed[i],
  }))
}

const spelled = (n: { letter: string; accidental: number }) =>
  `${n.letter}${n.accidental}`

const at = (steps: LineStep[], i: number, times: ReturnType<typeof dur>[]) =>
  times.map((t) => subDur(t, steps[i].placed.start))

describe('where a bar’s notes fall', () => {
  const steps = stepsOf('C major', 'C F', { num: 4, den: 4 })
  const placed = steps[0].placed

  it('takes the strongest places, later ones first on a tie', () => {
    const q = (n: number) => dur(n, 4)
    expect(at(steps, 0, rhythmOf(placed, 1))).toEqual([q(0)])
    expect(at(steps, 0, rhythmOf(placed, 2))).toEqual([q(0), q(2)])
    // Three: beats 1, 3 and 4, leading into the next chord.
    expect(at(steps, 0, rhythmOf(placed, 3))).toEqual([q(0), q(2), q(3)])
    expect(at(steps, 0, rhythmOf(placed, 4))).toEqual([q(0), q(1), q(2), q(3)])
    // Five: the extra half-beat is the last.
    expect(at(steps, 0, rhythmOf(placed, 5))).toEqual([
      q(0),
      q(1),
      q(2),
      q(3),
      dur(7, 8),
    ])
    expect(rhythmOf(placed, 16)).toHaveLength(16)
  })

  it('holds up to sixteen notes, fewer in a short chord or 3/4', () => {
    expect(mostNotes(placed)).toBe(MOST_NOTES)
    const waltz = stepsOf('C major', 'C', { num: 3, den: 4 })
    expect(mostNotes(waltz[0].placed)).toBe(12)
    const short = layOut([dur(1, 4)], { meter: { num: 4, den: 4 } })
    expect(mostNotes(short[0])).toBe(4)
  })

  it('splits dotted beats in threes in 6/8', () => {
    const six = stepsOf('C major', 'C', { num: 6, den: 8 })
    expect(at(six, 0, rhythmOf(six[0].placed, 2))).toEqual([
      dur(0, 1),
      dur(3, 8),
    ])
    expect(at(six, 0, rhythmOf(six[0].placed, 6))).toEqual(
      [0, 1, 2, 3, 4, 5].map((k) => dur(k, 8)),
    )
  })

  it('always starts on the chord, whatever the chance', () => {
    for (let seed = 1; seed < 30; seed++) {
      const onsets = rhythmOf(placed, 5, seededRandom(seed))
      expect(onsets).toHaveLength(5)
      expect(onsets[0]).toEqual(placed.start)
    }
  })
})

const cases: [string, string, string][] = [
  ['C major', 'C Am F G', '4/4'],
  ['A natural-minor', 'Am Dm E7 Am', '3/4'],
  ['D major', 'D G A D', '6/8'],
]

describe('filled bars keep the rules (Phase 6 exit criteria)', () => {
  for (const [keyText, chords, meterText] of cases) {
    const steps = stepsOf(keyText, chords, parseMeter(meterText)!)
    const scale = new Set(
      scaleNotes(steps[0].key.tonic, steps[0].key.mode).map(spelled),
    )
    for (const mode of LINE_MODES) {
      it(`${mode.label} over ${chords} in ${meterText}, 1 to 16 notes, refreshed`, () => {
        const line = lineFor(mode.id, steps).notes
        const range = rangeOf(mode)
        for (const roll of [0, 1, 2, 3]) {
          for (let count = 1; count <= 16; count++) {
            const bars: Record<number, ReturnType<typeof fillBar>> = {}
            steps.forEach((_, i) => {
              bars[i] = fillBar(
                line,
                steps,
                i,
                mode.id,
                range,
                count,
                roll ? seededRandom(roll * 100 + count) : undefined,
              )
            })
            const notes = withBars(line, steps, bars)
            for (const [i, step] of steps.entries()) {
              const own = notes.filter((n) => n.step === i)
              expect(own).toHaveLength(Math.min(count, mostNotes(step.placed)))
              // Lands on a chord tone at the change unless tagged.
              expect(durEquals(own[0].onset, step.placed.start)).toBe(true)
              expect(
                own[0].tags.includes('chord-tone') ||
                  own[0].tags.includes('pedal') ||
                  mode.id === 'pedal',
              ).toBe(true)
              // Strong beats take chord tones (a pedal may hold), but for the
              // mode's own notes kept as they were: in 6/8 an approach can
              // fall on the second beat.
              const tones = tonesOf(step.chord).map((t) => pitchClass(t.note))
              for (const n of own) {
                const kept = line.some(
                  (m) => durEquals(m.onset, n.onset) && m.midi === n.midi,
                )
                if (kept) continue
                const beat = step.placed.beats.find((b) =>
                  durEquals(b.at, n.onset),
                )
                if (mode.id !== 'pedal' && beat && beat.strength !== 'weak') {
                  expect(tones).toContain(pitchClass(n.note))
                }
              }
            }
            // Tagged and explained; outside the key tagged chromatic.
            for (const n of notes) {
              expect(n.tags.length).toBeGreaterThan(0)
              expect(n.explanation.length).toBeGreaterThan(0)
              if (!scale.has(spelled(n.note))) {
                expect(n.tags).toContain('chromatic')
              }
              expect(n.midi).toBeGreaterThanOrEqual(range[0] - 2)
              expect(n.midi).toBeLessThanOrEqual(range[1] + 2)
            }
            // Fits the beats: end to end, filling every chord.
            let time = steps[0].placed.start
            for (const n of notes) {
              expect(n.onset).toEqual(time)
              time = addDur(n.onset, n.length)
            }
            expect(sumDurs(notes.map((n) => n.length))).toEqual(
              sumDurs(steps.map((s) => s.placed.length)),
            )
          }
        }
      })
    }
  }
})

describe('filling between the line’s own notes', () => {
  const steps = stepsOf('C major', 'C Am F G', { num: 4, den: 4 })

  it('keeps the mode’s notes where they fall, and adds to them', () => {
    const line = lineFor('walking', steps).notes
    const range = rangeOf(LINE_MODES.find((m) => m.id === 'walking')!)
    const own = line.filter((n) => n.step === 0)
    const eight = fillBar(line, steps, 0, 'walking', range, 8)
    const onBeats = eight.filter((_, k) => k % 2 === 0).map((b) => b.note)
    expect(onBeats.slice(0, 3)).toEqual(own.slice(0, 3).map((n) => n.note))
    // The walk's approach into the next chord moves to the last note.
    expect(eight.at(-1)!.note).toEqual(own.at(-1)!.note)
    expect(eight.at(-1)!.at).toEqual(dur(7, 8))
  })

  it('lets roots and pedals repeat, as they do', () => {
    const line = lineFor('pedal', steps).notes
    const range = rangeOf(LINE_MODES.find((m) => m.id === 'pedal')!)
    const bar = fillBar(line, steps, 1, 'pedal', range, 4)
    expect(new Set(bar.map((b) => spelled(b.note)))).toEqual(new Set(['C0']))
  })
})
