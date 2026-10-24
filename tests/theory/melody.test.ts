import { describe, expect, it } from 'vitest'
import {
  ZERO,
  appendNote,
  barPosition,
  dur,
  formatNote,
  melodyBars,
  melodyEnd,
  parseMeter,
  parseNote,
  quantise,
  holdOver,
  removeLast,
  restBefore,
  setNoteLength,
  silenceNote,
  swapMelodyNote,
  spellTapped,
  typeMelody,
  valueFraction,
  valueName,
  valueSymbol,
  type Key,
  type MelodyNote,
  type Meter,
} from '../../src/theory'
import {
  bars,
  recorded,
  typed,
  type MelodyFixtureNote,
} from '../fixtures/melodies'

function keyOf(text: string): Key {
  const [tonic, mode] = text.split(' ')
  return { tonic: parseNote(tonic)!, mode }
}

function meter(text: string): Meter {
  return parseMeter(text)!
}

const asFixture = (m: MelodyNote[]): MelodyFixtureNote[] =>
  m.map((n) => ({
    note: formatNote(n.note),
    onset: n.onset,
    length: n.length,
  }))

const norm = (notes: MelodyFixtureNote[]) =>
  notes.map((n) => ({
    ...n,
    onset: dur(n.onset.n, n.onset.d),
    length: dur(n.length.n, n.length.d),
  }))

describe('typing a melody (SPEC 7.2)', () => {
  for (const t of typed) {
    it(t.text, () => {
      const out = typeMelody(t.text, dur(t.value.n, t.value.d))
      expect(asFixture(out.notes)).toEqual(norm(t.notes))
      expect(out.unknown).toEqual(t.unknown ?? [])
    })
  }

  it('carries on after the melody so far, relative to its last note', () => {
    const out = typeMelody('D C', dur(1, 4), {
      start: dur(1, 1),
      from: parseNote('E5')!,
    })
    expect(asFixture(out.notes)).toEqual(
      norm([
        { note: 'D5', onset: { n: 1, d: 1 }, length: { n: 1, d: 4 } },
        { note: 'C5', onset: { n: 5, d: 4 }, length: { n: 1, d: 4 } },
      ]),
    )
  })
})

describe('recording on MIDI (SPEC 7.2)', () => {
  for (const r of recorded) {
    it(r.name, () => {
      const notes = quantise(r.played, {
        bpm: r.bpm,
        meter: meter(r.meter),
        grid: r.grid,
        key: keyOf(r.key),
        end: r.end && dur(r.end.n, r.end.d),
      })
      expect(asFixture(notes)).toEqual(norm(r.notes))
    })
  }

  it('notes never overlap and never fall off the grid', () => {
    for (const r of recorded) {
      const notes = quantise(r.played, {
        bpm: r.bpm,
        meter: meter(r.meter),
        grid: r.grid,
        key: keyOf(r.key),
      })
      notes.forEach((n, i) => {
        expect(n.length.n).toBeGreaterThan(0)
        const next = notes[i + 1]
        if (next) {
          const end = n.onset.n / n.onset.d + n.length.n / n.length.d
          expect(end).toBeLessThanOrEqual(next.onset.n / next.onset.d + 1e-9)
        }
      })
    }
  })

  it('with the grid off keeps fine timing, still as exact fractions', () => {
    const [n] = quantise([{ midi: 60, on: 0.1, off: 0.4 }], {
      bpm: 120,
      meter: meter('4/4'),
      grid: 'off',
      key: keyOf('C major'),
    })
    expect(n.onset).toEqual(dur(5, 96))
    expect(n.length).toEqual(dur(14, 96))
  })
})

describe('step entry by tapping', () => {
  const C = keyOf('C major')

  it('adds each note after the last, with rests as gaps', () => {
    let m = appendNote([], parseNote('E4')!, dur(1, 4))
    m = appendNote(m, parseNote('G4')!, dur(1, 8), dur(1, 4))
    expect(m[1].onset).toEqual(dur(1, 2))
    expect(melodyEnd(m)).toEqual(dur(5, 8))
    expect(removeLast(m)).toHaveLength(1)
    expect(melodyEnd([])).toEqual(ZERO)
  })

  it('spells a tapped note by the key, then by the way it moves', () => {
    const name = (n: ReturnType<typeof spellTapped>) => formatNote(n)
    expect(name(spellTapped(C, 64))).toBe('E4')
    expect(name(spellTapped(C, 61, parseNote('C4')!))).toBe('C♯4')
    expect(name(spellTapped(C, 61, parseNote('D4')!))).toBe('D♭4')
    expect(name(spellTapped(keyOf('F major'), 70))).toBe('B♭4')
    // With nothing before it, the key signature decides.
    expect(name(spellTapped(keyOf('E♭ major'), 66))).toBe('G♭4')
    expect(name(spellTapped(keyOf('D major'), 68))).toBe('G♯4')
  })
})

describe('bars', () => {
  it('finds the bar each note starts in, with bar meter overrides', () => {
    const map = {
      meter: meter(bars.meter),
      barMeters: { 2: meter(bars.barMeters[2]) },
    }
    bars.onsets.forEach((o, i) => {
      const at = barPosition(map, dur(o.n, o.d))
      const want = bars.placed[i]
      expect(at).toEqual({
        bar: want.bar,
        offset: dur(want.offset.n, want.offset.d),
      })
    })
    const melody = bars.onsets.map((o) => ({
      note: parseNote('C4')!,
      onset: dur(o.n, o.d),
      length: dur(1, 4),
    }))
    expect(melodyBars(melody, map)).toEqual([
      { bar: 1, notes: [0, 1] },
      { bar: 2, notes: [2, 3] },
      { bar: 3, notes: [4] },
      { bar: 4, notes: [5] },
    ])
  })

  it('names note values by their symbol', () => {
    expect(valueSymbol(dur(1, 4))).toBe('♩')
    expect(valueSymbol(dur(3, 8))).toBe('♩.')
    expect(valueSymbol(dur(5, 16))).toBe('5/16')
    expect(valueFraction(dur(3, 8))).toBe('3/8')
    expect(valueFraction(dur(2, 1))).toBe('2')
    expect(valueName(dur(1, 2))).toBe('minim')
    expect(valueName(dur(5, 16))).toBe('5/16')
  })
})

describe('silences (David’s request)', () => {
  const melody = () => typeMelody('C4 D E F', dur(1, 4)).notes
  it('silences a note, leaving the others where they are', () => {
    const m = silenceNote(melody(), 1)
    expect(m.map((n) => formatNote(n.note))).toEqual(['C4', 'E4', 'F4'])
    expect(m[1].onset).toEqual(dur(1, 2))
  })
  it('puts a rest before a note, moving it and the rest later', () => {
    const m = restBefore(melody(), 2, dur(1, 4))
    expect(m.map((n) => n.onset)).toEqual([
      dur(0, 1),
      dur(1, 4),
      dur(3, 4),
      dur(1, 1),
    ])
  })
  it('swaps a note for another in its place', () => {
    const m = swapMelodyNote(melody(), 1, parseNote('B3')!)
    expect(formatNote(m[1].note)).toBe('B3')
    expect(m[1].onset).toEqual(dur(1, 4))
    expect(m[1].length).toEqual(dur(1, 4))
  })
})

describe('holds (David’s request)', () => {
  it('holds the note before through a note’s place: no new note there', () => {
    const m = holdOver(typeMelody('C4 D E F', dur(1, 4)).notes, 2)
    expect(m.map((n) => formatNote(n.note))).toEqual(['C4', 'D4', 'F4'])
    expect(m[1].length).toEqual(dur(1, 2))
    expect(m[2].onset).toEqual(dur(3, 4))
    // It remembers where the hold began, a beat after D was struck.
    expect(m[1].holds).toEqual([dur(1, 4)])
  })
  it('a held note held again keeps both holds', () => {
    let m = typeMelody('C4 D E F', dur(1, 4)).notes
    m = holdOver(holdOver(m, 2), 2)
    expect(m[1].holds).toEqual([dur(1, 4), dur(1, 2)])
  })
  it('after a rest, the note before rings on to the end of the held note', () => {
    const m = holdOver(typeMelody('C4 r E', dur(1, 4)).notes, 1)
    expect(m).toHaveLength(1)
    expect(m[0].length).toEqual(dur(3, 4))
  })
  it('the first note has nothing to hold, so it falls silent', () => {
    const m = holdOver(typeMelody('C4 D', dur(1, 4)).notes, 0)
    expect(m.map((n) => formatNote(n.note))).toEqual(['D4'])
  })
})

describe('changing a note’s length (David’s request)', () => {
  const melody = () => typeMelody('C4 D E F', dur(1, 4)).notes
  it('a longer note moves the notes after it later', () => {
    const m = setNoteLength(melody(), 1, dur(1, 2))
    expect(m[1].length).toEqual(dur(1, 2))
    expect(m.map((n) => n.onset)).toEqual([
      dur(0, 1),
      dur(1, 4),
      dur(3, 4),
      dur(1, 1),
    ])
  })
  it('a shorter note brings the notes after it earlier', () => {
    const m = setNoteLength(melody(), 0, dur(1, 8))
    expect(m.map((n) => n.onset)).toEqual([
      dur(0, 1),
      dur(1, 8),
      dur(3, 8),
      dur(5, 8),
    ])
  })
  it('keeps rests after it as they were, moved along', () => {
    const m = setNoteLength(typeMelody('C4 r E', dur(1, 4)).notes, 0, dur(1, 2))
    expect(m[1].onset).toEqual(dur(3, 4))
  })
  it('drops holds that fall past a shortened end', () => {
    const held = holdOver(melody(), 2) // D held over E's place
    const m = setNoteLength(held, 1, dur(1, 4))
    expect(m[1].holds).toBeUndefined()
  })
})
