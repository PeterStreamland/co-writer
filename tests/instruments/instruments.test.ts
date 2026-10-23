import { describe, expect, it } from 'vitest'
import { fretboardGrid } from '../../src/instruments/fretboard'
import { makeGuitar } from '../../src/instruments/guitar'
import {
  KEYBOARD_HIGH,
  KEYBOARD_LOW,
  pianoKeys,
  scrollToHeld,
} from '../../src/instruments/keyboard'
import { noteMarker } from '../../src/instruments/marks'
import {
  STANDARD_TUNING,
  TUNINGS,
  tuningStrings,
} from '../../src/instruments/tunings'
import { tuningPitches } from '../fixtures/tunings'
import {
  allScales,
  arpeggioTones,
  enharmonicKey,
  formatNote,
  midiNumber,
  parseChordSymbol,
  parseNote,
  pickerTonics,
  pitchClass,
  scaleNotes,
  spellPitches,
  type Key,
} from '../../src/theory'

function key(tonic: string, mode: string): Key {
  return { tonic: parseNote(tonic)!, mode }
}

// Every key the picker can reach: each listed tonic and its swap.
function everyKey(): Key[] {
  return allScales().flatMap((scale) =>
    pickerTonics(scale.id).flatMap((tonic) => {
      const k = { tonic, mode: scale.id }
      const swapped = enharmonicKey(k)
      return swapped ? [k, swapped] : [k]
    }),
  )
}

describe('keyboard view', () => {
  it('spans C2 to C6, with black keys where a piano has them', () => {
    const keys = pianoKeys(KEYBOARD_LOW, KEYBOARD_HIGH, () => undefined)
    expect(keys).toHaveLength(49)
    expect(keys[0].midi).toBe(36)
    expect(keys.filter((k) => k.black)).toHaveLength(20)
    expect(keys.find((k) => k.midi === 61)?.black).toBe(true)
  })

  it('marks C major on the white keys, with C as the root', () => {
    const keys = pianoKeys(60, 71, noteMarker(key('C', 'major')))
    expect(keys.filter((k) => k.mark).map((k) => k.mark!.name)).toEqual(
      'C D E F G A B'.split(' '),
    )
    expect(keys.every((k) => !!k.mark === !k.black)).toBe(true)
    expect(keys.filter((k) => k.mark?.root).map((k) => k.midi)).toEqual([60])
  })

  it('labels degrees and spells by the key', () => {
    const keys = pianoKeys(59, 70, noteMarker(key('Eb', 'natural-minor')))
    const marked = keys.filter((k) => k.mark).map((k) => k.mark!)
    expect(marked.map((m) => m.name)).toEqual('C♭ D♭ E♭ F G♭ A♭ B♭'.split(' '))
    expect(marked.map((m) => m.degree)).toEqual('♭6 ♭7 1 2 ♭3 4 5'.split(' '))
    // C♭ sounds as B3's pitch but is spelled C♭4.
    expect(formatNote(marked[0].note, { ascii: true })).toBe('Cb4')
  })

  it('marks the current chord, even a tone outside the scale', () => {
    const mark = noteMarker(key('C', 'major'), parseChordSymbol('E7')!)
    const tones = pianoKeys(60, 71, mark).filter((k) => k.mark?.chordTone)
    expect(tones.map((k) => k.mark!.name)).toEqual(['D', 'E', 'G♯', 'B'])
    expect(tones.find((k) => k.mark!.name === 'G♯')?.mark!.inScale).toBe(false)
  })

  it("colours an arpeggio's added tones by their interval (C as Cmaj9)", () => {
    const C = key('C', 'major')
    const c = parseChordSymbol('C')!
    const { tones } = arpeggioTones(c, C, 'ninth')
    const mark = noteMarker(C, c, [], tones)
    const roles = pianoKeys(60, 71, mark)
      .filter((k) => k.mark?.tone)
      .map(
        (k) => `${k.mark!.name} ${k.mark!.tone!.label} ${k.mark!.tone!.role}`,
      )
    expect(roles).toEqual([
      'C R root',
      'D 9 extension',
      'E 3 third',
      'G 5 fifth',
      'B 7 seventh',
    ])
  })
})

describe('fretboard view', () => {
  it('tunes six strings to E2 A2 D3 G3 B3 E4, lowest first', () => {
    const grid = fretboardGrid(
      makeGuitar(STANDARD_TUNING, { high: 15 }),
      () => undefined,
    )
    expect(grid.map((row) => row[0].midi)).toEqual([40, 45, 50, 55, 59, 64])
    expect(grid.every((row) => row.length === 16)).toBe(true)
    expect(grid[0][15].midi).toBe(55)
  })

  it('shows A minor pentatonic on the low E string', () => {
    const grid = fretboardGrid(
      makeGuitar(STANDARD_TUNING, { high: 12 }),
      noteMarker(key('A', 'minor-pentatonic')),
    )
    const marked = grid[0].filter((f) => f.mark)
    expect(marked.map((f) => f.fret)).toEqual([0, 3, 5, 8, 10, 12])
    expect(marked.map((f) => f.mark!.name)).toEqual('E G A C D E'.split(' '))
    expect(marked.filter((f) => f.mark!.root).map((f) => f.fret)).toEqual([5])
  })

  it('marks nothing behind a capo, and the capo fret sounds open', () => {
    const grid = fretboardGrid(
      makeGuitar(STANDARD_TUNING, { capo: 2 }),
      noteMarker(key('A', 'minor-pentatonic')),
    )
    expect(grid[0].filter((f) => f.behindCapo).map((f) => f.fret)).toEqual([
      0, 1,
    ])
    expect(grid.flat().some((f) => f.behindCapo && f.mark)).toBe(false)
    // Low E with capo 2: F♯ at the capo isn't in A minor pentatonic; G at 3 is.
    expect(grid[0].filter((f) => f.mark).map((f) => f.fret)).toEqual([
      3, 5, 8, 10, 12, 15,
    ])
  })
})

// Phase 2 exit criteria: any key and scale shows the right notes on both
// instruments, checked against the Phase 1 core, and every highlighted note
// plays the pitch it sits on.
describe('every key and scale on both instruments', () => {
  for (const k of everyKey()) {
    const label = `${formatNote(k.tonic, { ascii: true })} ${k.mode}`
    it(label, () => {
      const scale = scaleNotes(k.tonic, k.mode)
      const names = new Set(scale.map((n) => formatNote(n)))
      const pitches = new Set(scale.map(pitchClass))
      const mark = noteMarker(k)
      const keys = pianoKeys(KEYBOARD_LOW, KEYBOARD_HIGH, mark)
      const frets = fretboardGrid(
        makeGuitar(STANDARD_TUNING, { high: 15 }),
        mark,
      ).flat()
      for (const spot of [...keys, ...frets]) {
        const inScale = pitches.has(spot.midi % 12)
        expect(!!spot.mark, `${label} at ${spot.midi}`).toBe(inScale)
        if (!spot.mark) continue
        expect(names.has(spot.mark.name)).toBe(true)
        expect(midiNumber(spot.mark.note)).toBe(spot.midi)
        expect(spot.mark.root).toBe(spot.midi % 12 === pitchClass(k.tonic))
      }
      const shown = new Set(keys.filter((x) => x.mark).map((x) => x.mark!.name))
      expect(shown).toEqual(names)
    })
  }
})

describe('tunings', () => {
  it.each(tuningPitches)(
    '$id, 7-string $sevenString: $strings',
    ({ id, sevenString, strings, midi }) => {
      const open = tuningStrings(id, sevenString)
      expect(open.map((n) => formatNote(n, { ascii: true })).join(' ')).toBe(
        strings,
      )
      expect(open.map(midiNumber)).toEqual(midi)
    },
  )

  it('moves the highlights with the tuning: D major in drop D', () => {
    const mark = noteMarker(key('D', 'major'))
    const standard = fretboardGrid(
      makeGuitar(tuningStrings('standard', false)),
      mark,
    )
    const dropD = fretboardGrid(
      makeGuitar(tuningStrings('drop-d', false)),
      mark,
    )
    // The low string's open note is now the root, and its root at fret 10
    // (D on the E string) moves down two frets to 12 (an octave up), then 0.
    expect(standard[0].filter((f) => f.mark?.root).map((f) => f.fret)).toEqual([
      10,
    ])
    expect(dropD[0].filter((f) => f.mark?.root).map((f) => f.fret)).toEqual([
      0, 12,
    ])
    // The other five strings are unchanged.
    expect(dropD.slice(1).map((row) => row.map((f) => !!f.mark))).toEqual(
      standard.slice(1).map((row) => row.map((f) => !!f.mark)),
    )
  })

  it('adds a low B string on a 7-string, with B as the 5th of E minor', () => {
    const grid = fretboardGrid(
      makeGuitar(tuningStrings('standard', true)),
      noteMarker(key('E', 'natural-minor')),
    )
    expect(grid).toHaveLength(7)
    expect(grid[0][0].midi).toBe(35)
    expect(grid[0][0].mark?.degree).toBe('5')
    expect(grid[0][5].mark?.root).toBe(true)
  })
})

// Phase 2 exit criterion: changing tuning moves the fretboard highlights
// correctly. On every tuning, 6- and 7-string, every key and scale marks
// exactly its own pitches, each playing the pitch of its fret.
describe('every key and scale in every tuning', () => {
  const keys = everyKey()
  for (const t of TUNINGS) {
    for (const seven of [false, true]) {
      it(`${t.name}${seven ? ', 7-string' : ''}`, () => {
        const strings = tuningStrings(t.id, seven)
        const wrong: string[] = []
        for (const k of keys) {
          const pitches = new Set(scaleNotes(k.tonic, k.mode).map(pitchClass))
          for (const spot of fretboardGrid(
            makeGuitar(strings, { high: 15 }),
            noteMarker(k),
          ).flat()) {
            const inScale = pitches.has(spot.midi % 12)
            const plays = spot.mark && midiNumber(spot.mark.note)
            if (!!spot.mark !== inScale || (spot.mark && plays !== spot.midi)) {
              wrong.push(`${formatNote(k.tonic)} ${k.mode} at ${spot.midi}`)
            }
          }
        }
        expect(wrong).toEqual([])
      })
    }
  }
})

describe('notes played on a MIDI keyboard', () => {
  it('light up at their exact pitch, spelled by the key', () => {
    const k = key('C', 'major')
    const played = spellPitches([58, 62, 65], k)
    const mark = noteMarker(k, undefined, played)
    const keys = pianoKeys(48, 72, mark).filter((x) => x.mark?.held)
    expect(keys.map((x) => x.midi)).toEqual([58, 62, 65])
    expect(keys.map((x) => x.mark!.name)).toEqual(['B♭', 'D', 'F'])
    // B♭ an octave up isn't played, and isn't in C major, so has no mark.
    expect(mark(70)).toBeUndefined()
    // D an octave up is in the scale but isn't being played.
    expect(mark(74)?.held).toBe(false)
  })

  it('light up on every fret that sounds the pitch', () => {
    const k = key('E', 'natural-minor')
    const mark = noteMarker(k, undefined, spellPitches([55], k))
    const frets = fretboardGrid(makeGuitar(STANDARD_TUNING, { high: 15 }), mark)
      .flat()
      .filter((f) => f.mark?.held)
    // G3: open G string, fret 5 on D, fret 10 on A, fret 15 on low E.
    expect(frets.map((f) => [f.string, f.fret])).toEqual([
      [0, 15],
      [1, 10],
      [2, 5],
      [3, 0],
    ])
  })
})

describe('scrollToHeld', () => {
  it('stays put when the played notes are in view or none are played', () => {
    expect(scrollToHeld(48, 24, [])).toBe(48)
    expect(scrollToHeld(48, 24, [48, 60, 72])).toBe(48)
  })

  it('moves to the octave of a note below or above the view', () => {
    expect(scrollToHeld(48, 24, [40])).toBe(36)
    expect(scrollToHeld(48, 24, [76, 79])).toBe(72)
  })

  it('keeps the lowest note when a chord is wider than the view', () => {
    expect(scrollToHeld(48, 24, [36, 67, 88])).toBe(36)
  })

  it('stops at the ends of an 88-key piano', () => {
    expect(scrollToHeld(36, 48, [105])).toBe(60)
    expect(scrollToHeld(48, 24, [21])).toBe(12)
  })
})
