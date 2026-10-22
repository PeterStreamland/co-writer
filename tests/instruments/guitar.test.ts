import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FRET_RANGE,
  capoNotes,
  MAX_CAPO,
  MAX_FRET,
  fretMidi,
  makeGuitar,
  playableFrets,
  soundingOpenStrings,
  stringCount,
} from '../../src/instruments/guitar'
import { STANDARD_TUNING, tuningStrings } from '../../src/instruments/tunings'
import { capoNames, capoPitches } from '../fixtures/capo'
import { formatNote, midiNumber, parseNote, type Note } from '../../src/theory'

describe('guitar model', () => {
  it('defaults to no capo and frets 0–15 (SPEC 5)', () => {
    const guitar = makeGuitar(STANDARD_TUNING)
    expect(guitar.capo).toBe(0)
    expect(guitar.frets).toEqual({ low: 0, high: 15 })
    expect(DEFAULT_FRET_RANGE).toEqual({ low: 0, high: 15 })
    expect(MAX_FRET).toBe(24)
  })

  it('keeps the tuning as spelled notes and counts its strings', () => {
    expect(stringCount(makeGuitar(STANDARD_TUNING))).toBe(6)
    const seven = makeGuitar(tuningStrings('standard', true))
    expect(stringCount(seven)).toBe(7)
    expect(seven.strings[0]).toEqual(parseNote('B1'))
  })

  it.each(capoPitches)(
    'sounds the open strings of $tuning (7-string: $sevenString) with capo $capo',
    ({ tuning, sevenString, capo, midi }) => {
      const guitar = makeGuitar(tuningStrings(tuning, sevenString), { capo })
      expect(soundingOpenStrings(guitar)).toEqual(midi)
      guitar.strings.forEach((_, s) =>
        expect(fretMidi(guitar, s, capo)).toBe(midi[s]),
      )
    },
  )

  it.each(capoNames)(
    'names the open notes at capo $capo on $tuning in $key',
    ({ tuning, capo, key, names }) => {
      const [tonic, mode] = key.split(' ')
      const guitar = makeGuitar(tuningStrings(tuning, false), { capo })
      const notes = capoNotes(guitar, { tonic: parseNote(tonic)!, mode })
      expect(
        notes.map((n) => formatNote({ ...n, octave: undefined })).join(' '),
      ).toBe(names)
      // Each name sounds the capo fret's pitch.
      expect(notes.map(midiNumber)).toEqual(soundingOpenStrings(guitar))
    },
  )

  it('numbers frets from the nut, capo or not', () => {
    const guitar = makeGuitar(STANDARD_TUNING, { capo: 2 })
    // Low E string, 5th fret: A2, whatever the capo.
    expect(fretMidi(guitar, 0, 5)).toBe(45)
    expect(fretMidi(makeGuitar(STANDARD_TUNING), 0, 5)).toBe(45)
  })

  it('has nothing to play behind the capo or past the last fret', () => {
    const guitar = makeGuitar(STANDARD_TUNING, { capo: 3, high: 12 })
    expect(fretMidi(guitar, 0, 0)).toBeUndefined()
    expect(fretMidi(guitar, 0, 2)).toBeUndefined()
    expect(fretMidi(guitar, 0, 3)).toBe(43)
    expect(fretMidi(guitar, 0, 12)).toBe(52)
    expect(fretMidi(guitar, 0, 13)).toBeUndefined()
    expect(fretMidi(guitar, 6, 5)).toBeUndefined()
    expect(fretMidi(guitar, -1, 5)).toBeUndefined()
  })

  it('lists each string’s playable frets: open (or the capo) first', () => {
    expect(playableFrets(makeGuitar(STANDARD_TUNING), 0)).toEqual(
      Array.from({ length: 16 }, (_, f) => f),
    )
    expect(playableFrets(makeGuitar(STANDARD_TUNING, { capo: 2 }), 0)).toEqual(
      Array.from({ length: 14 }, (_, i) => i + 2),
    )
    // A fret range that starts up the neck still offers the open string;
    // turning open strings off is a fingering filter (Phase 3, task 4).
    expect(
      playableFrets(makeGuitar(STANDARD_TUNING, { low: 5, high: 9 }), 0),
    ).toEqual([0, 5, 6, 7, 8, 9])
    expect(
      playableFrets(
        makeGuitar(STANDARD_TUNING, { capo: 7, low: 5, high: 9 }),
        0,
      ),
    ).toEqual([7, 8, 9])
  })

  it('reaches fret 24 when the range allows it', () => {
    const guitar = makeGuitar(STANDARD_TUNING, { high: 24 })
    expect(fretMidi(guitar, 5, 24)).toBe(88) // E6
  })

  it('refuses settings a guitar can’t have', () => {
    expect(() => makeGuitar([])).toThrow()
    expect(() => makeGuitar([{ letter: 'E', accidental: 0 } as Note])).toThrow()
    expect(() => makeGuitar(STANDARD_TUNING, { capo: -1 })).toThrow()
    expect(() => makeGuitar(STANDARD_TUNING, { capo: MAX_CAPO + 1 })).toThrow()
    expect(() => makeGuitar(STANDARD_TUNING, { capo: 1.5 })).toThrow()
    expect(() => makeGuitar(STANDARD_TUNING, { high: 25 })).toThrow()
    expect(() => makeGuitar(STANDARD_TUNING, { low: 10, high: 9 })).toThrow()
    expect(() => makeGuitar(STANDARD_TUNING, { capo: 15, high: 15 })).toThrow()
  })
})
