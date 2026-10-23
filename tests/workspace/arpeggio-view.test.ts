// Phase 6 exit criterion: every arpeggio note is a tone of the chord or its
// chosen extensions, labelled by its interval, and the pattern fits the rate
// and beats chosen.
import { describe, expect, it } from 'vitest'
import { makeGuitar } from '../../src/instruments/guitar'
import { STANDARD_TUNING } from '../../src/instruments/tunings'
import {
  ARPEGGIO_PATTERNS,
  ARPEGGIO_RATES,
  chordIntervals,
  compareDur,
  dur,
  durEquals,
  eventsLength,
  parseChordSymbol,
  parseNote,
  pitchClass,
  ratioOf,
  toneLabel,
  transpose,
  type ChordName,
  type Key,
} from '../../src/theory'
import {
  ARPEGGIO_CHOICES,
  DEFAULT_ARPEGGIO,
  loadArpeggio,
  planArpeggio,
  saveArpeggio,
  startOctave,
} from '../../src/workspace/arpeggio-view'

const guitar = makeGuitar(STANDARD_TUNING)
const key = (text: string): Key => {
  const [tonic, mode] = text.split(' ')
  return { tonic: parseNote(tonic)!, mode }
}
const chord = (text: string): ChordName => parseChordSymbol(text)!

// Progressions in their keys, with chords from outside the key too.
const progressions: [string, string[]][] = [
  ['C major', ['C', 'Am', 'F', 'G7', 'E7', 'Ab', 'Bdim', 'Csus4']],
  ['E natural-minor', ['Em', 'C', 'G', 'D', 'B7', 'E5']],
  ['D dorian', ['Dm7', 'G', 'Cmaj7', 'Am']],
  ['A minor-pentatonic', ['Am', 'D', 'E7']],
]
const lengths = [dur(1, 1), dur(3, 4), dur(7, 8), dur(1, 2)]

function memoryStore(): Storage {
  const items = new Map<string, string>()
  return {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (k) => items.get(k) ?? null,
    key: (i) => [...items.keys()][i] ?? null,
    removeItem: (k) => void items.delete(k),
    setItem: (k, v) => void items.set(k, v),
  }
}

describe('every arpeggio (exit criterion)', () => {
  for (const [keyText, chords] of progressions) {
    for (const symbol of chords) {
      it(`${symbol} in ${keyText}, every choice, pattern and rate`, () => {
        const k = key(keyText)
        const c = chord(symbol)
        const own = new Set(
          chordIntervals(c.quality)!.map((i) =>
            pitchClass(transpose(c.root, i)),
          ),
        )
        for (const choice of ARPEGGIO_CHOICES) {
          for (const pattern of ARPEGGIO_PATTERNS) {
            for (const rate of ARPEGGIO_RATES) {
              for (const length of lengths) {
                const settings = {
                  ...DEFAULT_ARPEGGIO,
                  choice: choice.id,
                  pattern: pattern.id,
                  rate: rate.id,
                }
                // The guitar's positions don't depend on the pattern, so
                // they're searched for one pattern; every pattern runs over
                // the range.
                const plan = planArpeggio(
                  c,
                  k,
                  settings,
                  length,
                  pattern.id === 'up-down' ? guitar : undefined,
                )
                const tonePcs = new Set(
                  plan.tones.map((t) => pitchClass(t.note)),
                )
                // The chord's own tones are always there (as triad, its 3rd
                // and 5th at least), and every note is one of the tones.
                if (choice.id === 'triad') {
                  for (const t of plan.tones)
                    expect(own.has(pitchClass(t.note))).toBe(true)
                }
                const voices = [plan, ...plan.positions]
                for (const n of voices.flatMap((v) => v.notes)) {
                  expect(tonePcs.has(pitchClass(n.note))).toBe(true)
                  expect(n.label).toBe(toneLabel(c.root, n.note, n.number))
                }
                // The rhythm fills the length on the rate's grid, in the
                // range and in every position on the neck.
                for (const v of voices) {
                  expect(durEquals(eventsLength(v.events), length)).toBe(true)
                  v.events.forEach((e, i) => {
                    expect(e.onset).toEqual(dur(rate.note.n * i, rate.note.d))
                    expect(compareDur(e.length, rate.note)).toBeLessThanOrEqual(
                      0,
                    )
                    expect(v.notes[e.index]).toBeDefined()
                  })
                  expect(v.events).toHaveLength(
                    Math.ceil(ratioOf(length, rate.note)),
                  )
                }
              }
            }
          }
        }
      })
    }
  }
})

describe('the arpeggio tab', () => {
  it('offers the levels and the lenses that colour chords', () => {
    expect(ARPEGGIO_CHOICES.map((c) => c.label)).toEqual([
      'Triad',
      '7th',
      '9th',
      '11th',
      '13th',
      'Open colours',
      'Jazz colours',
    ])
  })

  it("colours a chord the lens's way", () => {
    const plan = (choice: string) =>
      planArpeggio(
        chord('C'),
        key('C major'),
        { ...DEFAULT_ARPEGGIO, choice },
        dur(1, 1),
      )
    expect(plan('lens:jazz').name).toBe('Cmaj7')
    expect(plan('lens:open').name).toBe('Cadd9')
    expect(plan('ninth').name).toBe('Cmaj9')
  })

  it('starts on the lowest octave the guitar reaches, or C3 on keyboard', () => {
    const at = (root: string, g = guitar) =>
      startOctave(parseNote(root)!, DEFAULT_ARPEGGIO, g)
    expect(at('E')).toBe(2)
    expect(at('A')).toBe(2)
    expect(at('C')).toBe(3)
    expect(at('Eb')).toBe(3)
    expect(startOctave(parseNote('C')!, DEFAULT_ARPEGGIO)).toBe(3)
    expect(
      startOctave(parseNote('C')!, { ...DEFAULT_ARPEGGIO, octave: 4 }),
    ).toBe(4)
  })

  it('frets the arpeggio in position and as a run', () => {
    const plan = planArpeggio(
      chord('G'),
      key('C major'),
      DEFAULT_ARPEGGIO,
      dur(1, 1),
      guitar,
    )
    expect(plan.positions.length).toBeGreaterThan(0)
    for (const p of plan.positions) {
      expect(p.spots).toHaveLength(p.notes.length)
      expect(durEquals(eventsLength(p.events), dur(1, 1))).toBe(true)
    }
    expect(plan.positions.length).toBeGreaterThanOrEqual(5)
    expect(plan.run).toHaveLength(plan.notes.length)
  })

  it('remembers the choices, and ignores unreadable ones', () => {
    const store = memoryStore()
    expect(loadArpeggio(store)).toEqual(DEFAULT_ARPEGGIO)
    const chosen = {
      ...DEFAULT_ARPEGGIO,
      choice: 'ninth',
      rate: '16ths',
      octave: 4,
    }
    saveArpeggio(chosen, store)
    expect(loadArpeggio(store)).toEqual(chosen)
    store.setItem('co-writer:arpeggio', '{"pattern":"sideways"}')
    expect(loadArpeggio(store)).toEqual(DEFAULT_ARPEGGIO)
  })
})
