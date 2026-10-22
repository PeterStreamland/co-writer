import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SPAN,
  findFingerings,
  formatFrets,
  type Fingering,
} from '../../src/instruments/fingering'
import { fretMidi, makeGuitar, type Guitar } from '../../src/instruments/guitar'
import { STANDARD_TUNING, tuningStrings } from '../../src/instruments/tunings'
import {
  chordIntervals,
  chordNotes,
  midiNumber,
  parseChordSymbol,
  pitchClass,
  transpose,
  type ChordName,
  type Interval,
  type Note,
} from '../../src/theory'
import { fingeringShapes } from '../fixtures/fingerings'

function chord(symbol: string): ChordName {
  const parsed = parseChordSymbol(symbol)
  if (!parsed) throw new Error(`bad symbol ${symbol}`)
  return parsed
}

// Common chords for the validity and speed checks: open, barre, 7th,
// extended, suspended, power and slash chords.
const COMMON = [
  'C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb', 'F#',
  'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm', 'C#m',
  'C7', 'D7', 'E7', 'G7', 'A7', 'B7',
  'Cmaj7', 'Fmaj7', 'Am7', 'Dm7', 'Em7', 'Bm7b5',
  'Bdim7', 'Caug', 'Dsus4', 'Asus2', 'C9', 'G13',
  'E5', 'A5', 'C/E', 'G/B', 'D/F#', 'F/G',
] // prettier-ignore

const GUITARS: [string, Guitar][] = [
  ['standard', makeGuitar(STANDARD_TUNING)],
  ['drop D', makeGuitar(tuningStrings('drop-d', false))],
  ['DADGAD, capo 2', makeGuitar(tuningStrings('dadgad', false), { capo: 2 })],
  ['7-string', makeGuitar(tuningStrings('standard', true))],
  ['7-string drop D', makeGuitar(tuningStrings('drop-d', true))],
]

// The same rules the search applies, checked independently on each result.
// Returns what's wrong with a shape, if anything.
function problem(
  guitar: Guitar,
  name: ChordName,
  f: Fingering,
  span: number,
): string | undefined {
  const open = guitar.capo
  // One entry per string, each a playable fret or muted.
  const strings = guitar.strings.length
  if (f.frets.length !== strings || f.notes.length !== strings) {
    return 'not one entry per string'
  }
  const sounding = f.frets.flatMap((fret, s) =>
    fret === null ? [] : [{ s, fret, midi: fretMidi(guitar, s, fret) }],
  )
  if (!sounding.length) return 'no strings sound'
  if (f.frets.some((fret, s) => (fret === null) !== (f.notes[s] === null))) {
    return 'a muted string has a note'
  }
  const tones = chordNotes(name)
  for (const { s, fret, midi } of sounding) {
    const note = f.notes[s] as Note
    if (midi === undefined) return `string ${s} can't play fret ${fret}`
    if (fret !== open && fret < guitar.frets.low) return 'outside the range'
    if (midiNumber(note) !== midi) return `string ${s} is mislabelled`
    // Only chord tones, spelled as the chord spells them.
    if (
      !tones.some(
        (t) => t.letter === note.letter && t.accidental === note.accidental,
      )
    ) {
      return `string ${s} is not a chord tone`
    }
  }
  // The bass is on the lowest sounding string.
  if (
    pitchClass(f.notes[sounding[0].s] as Note) !==
    pitchClass(name.bass ?? name.root)
  ) {
    return 'wrong bass'
  }
  // Every tone but the 5th and the omissible 9th and 11th is there.
  const heard = new Set(sounding.map(({ s }) => pitchClass(f.notes[s] as Note)))
  const intervals = chordIntervals(name.quality) as Interval[]
  const names = intervals.map((i) => `${i.quality}${i.number}`)
  for (const i of intervals) {
    const text = `${i.quality}${i.number}`
    const optional =
      (text === 'P5' &&
        intervals.length >= 3 &&
        !names.includes('A11') &&
        !names.includes('m13')) ||
      (text === 'M9' && (names.includes('P11') || names.includes('M13'))) ||
      (text === 'P11' && names.includes('M13'))
    if (!optional && !heard.has(pitchClass(transpose(name.root, i)))) {
      return `missing the ${text}`
    }
  }
  // Fretted notes fit the span and need at most four fingers, a barre on
  // the lowest fret counting as one, with no open string under it.
  const fretted = sounding.filter(({ fret }) => fret > open)
  if (!fretted.length) return undefined
  const frets = fretted.map(({ fret }) => fret)
  const lowest = Math.min(...frets)
  if (Math.max(...frets) - lowest + 1 > span) return 'too wide'
  if (fretted.length <= 4) return undefined
  const barred = fretted.filter(({ fret }) => fret === lowest)
  if (fretted.length - barred.length + 1 > 4) return 'too many fingers'
  for (let s = barred[0].s + 1; s < barred[barred.length - 1].s; s++) {
    if (f.frets[s] === open) return 'open string under the barre'
  }
  return undefined
}

function problems(
  guitar: Guitar,
  name: ChordName,
  found: Fingering[],
  span: number,
): string[] {
  return found.flatMap((f) => {
    const p = problem(guitar, name, f, span)
    return p ? [`${formatFrets(f.frets)}: ${p}`] : []
  })
}

describe('fingering search', () => {
  it.each(fingeringShapes)(
    'finds the textbook $chord shapes in $tuning (7-string: $sevenString, capo $capo)',
    ({ tuning, sevenString, capo, chord: symbol, includes, excludes }) => {
      const guitar = makeGuitar(tuningStrings(tuning, sevenString), { capo })
      const shapes = findFingerings(guitar, chord(symbol)).map((f) =>
        formatFrets(f.frets),
      )
      for (const shape of includes) expect(shapes).toContain(shape)
      for (const shape of excludes ?? []) expect(shapes).not.toContain(shape)
    },
  )

  it.each(GUITARS)('returns only playable shapes on %s', (_, guitar) => {
    for (const symbol of COMMON) {
      const name = chord(symbol)
      const found = findFingerings(guitar, name)
      expect(found.length, symbol).toBeGreaterThan(0)
      expect(problems(guitar, name, found, DEFAULT_SPAN), symbol).toEqual([])
      // Each shape once.
      const keys = found.map((f) => formatFrets(f.frets))
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('keeps every shape within a wider or narrower span', () => {
    const guitar = makeGuitar(STANDARD_TUNING)
    for (const span of [3, 6]) {
      for (const symbol of ['D', 'G', 'C9', 'F/G']) {
        const name = chord(symbol)
        const found = findFingerings(guitar, name, { maxSpan: span })
        expect(problems(guitar, name, found, span), symbol).toEqual([])
      }
    }
    // x50232 stretches frets 2–5: in at span 4, out at span 3.
    const shapes = (span: number) =>
      findFingerings(guitar, chord('D'), { maxSpan: span }).map((f) =>
        formatFrets(f.frets),
      )
    expect(shapes(4)).toContain('x50232')
    expect(shapes(3)).not.toContain('x50232')
  })

  it('searches only the fret range, keeping the open strings', () => {
    const guitar = makeGuitar(STANDARD_TUNING, { low: 5, high: 9 })
    const found = findFingerings(guitar, chord('Am'))
    const shapes = found.map((f) => formatFrets(f.frets))
    expect(shapes).toContain('577555')
    expect(shapes).toContain('x07555')
    expect(shapes).not.toContain('x02210')
    for (const f of found) {
      for (const fret of f.frets) {
        if (fret) expect(fret >= 5 && fret <= 9).toBe(true)
      }
    }
  })

  it('spells each string as the chord spells it', () => {
    const guitar = makeGuitar(STANDARD_TUNING)
    const flat = findFingerings(guitar, chord('Bb')).find(
      (f) => formatFrets(f.frets) === 'x13331',
    )
    expect(
      flat?.notes.map((n) => n && `${n.letter}${n.accidental}${n.octave}`),
    ).toEqual([null, 'B-12', 'F03', 'B-13', 'D04', 'F04'])
    const sharp = findFingerings(guitar, chord('F#')).find(
      (f) => formatFrets(f.frets) === '244322',
    )
    expect(sharp?.notes[0]).toEqual({ letter: 'F', accidental: 1, octave: 2 })
  })

  it('lists shapes from the nut up, fuller shapes first at each position', () => {
    const guitar = makeGuitar(STANDARD_TUNING)
    const found = findFingerings(guitar, chord('C'))
    expect(formatFrets(found[0].frets)).toBe('x32010')
    const position = (f: Fingering) => {
      const fretted = f.frets.filter((x): x is number => x !== null && x > 0)
      return fretted.length ? Math.min(...fretted) : 0
    }
    for (let i = 1; i < found.length; i++) {
      expect(position(found[i])).toBeGreaterThanOrEqual(position(found[i - 1]))
    }
    // The same input always gives the same list.
    expect(findFingerings(guitar, chord('C'))).toEqual(found)
  })

  it('writes frets past 9 with dashes', () => {
    expect(formatFrets([null, 3, 2, 0, 1, 0])).toBe('x32010')
    expect(formatFrets([null, 10, 12, 12, 12, 10])).toBe('x-10-12-12-12-10')
  })

  it('refuses a span outside 3–6 frets (SPEC 11)', () => {
    const guitar = makeGuitar(STANDARD_TUNING)
    expect(() => findFingerings(guitar, chord('C'), { maxSpan: 2 })).toThrow()
    expect(() => findFingerings(guitar, chord('C'), { maxSpan: 7 })).toThrow()
    expect(() =>
      findFingerings(guitar, { root: chord('C').root, quality: 'nonsense' }),
    ).toThrow()
  })

  // Exit criterion: under 50 ms per chord. Each chord is timed after a
  // warm-up run, at the default settings.
  it.each(GUITARS)(
    'searches each common chord in under 50 ms on %s',
    (_, guitar) => {
      for (const symbol of COMMON) {
        const name = chord(symbol)
        findFingerings(guitar, name)
        const start = performance.now()
        findFingerings(guitar, name)
        expect(performance.now() - start, symbol).toBeLessThan(50)
      }
    },
  )
})
