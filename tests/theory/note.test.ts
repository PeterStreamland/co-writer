import { Note as TonalNote } from 'tonal'
import { describe, expect, it } from 'vitest'
import {
  enharmonic,
  formatNote,
  noteAtMidi,
  midiNumber,
  parseNote,
  pitchClass,
  sameSpelling,
} from '../../src/theory'
import { displayNames, midiNumbers } from '../fixtures/notes-and-intervals'

function note(text: string) {
  const parsed = parseNote(text)
  if (!parsed) throw new Error(`fixture note ${text} did not parse`)
  return parsed
}

describe('parseNote', () => {
  it('keeps letter, accidental and octave', () => {
    expect(parseNote('C4')).toEqual({ letter: 'C', accidental: 0, octave: 4 })
    expect(parseNote('Bb3')).toEqual({ letter: 'B', accidental: -1, octave: 3 })
    expect(parseNote('E#')).toEqual({ letter: 'E', accidental: 1 })
    expect(parseNote('C-1')).toEqual({ letter: 'C', accidental: 0, octave: -1 })
  })

  it.each([
    ['C##', 2],
    ['Cx', 2],
    ['C𝄪', 2],
    ['C#', 1],
    ['C♯', 1],
    ['Cb', -1],
    ['C♭', -1],
    ['Cbb', -2],
    ['C𝄫', -2],
    ['C♮', 0],
    ['C', 0],
  ])('reads %s as accidental %i', (text, accidental) => {
    expect(note(text).accidental).toBe(accidental)
  })

  it('accepts a lower-case letter, so bb is B♭', () => {
    expect(parseNote('bb')).toEqual({ letter: 'B', accidental: -1 })
    expect(parseNote('f#4')).toEqual({ letter: 'F', accidental: 1, octave: 4 })
  })

  it('ignores surrounding spaces', () => {
    expect(parseNote(' Eb ')).toEqual({ letter: 'E', accidental: -1 })
  })

  it('reads a triple sharp written as #x', () => {
    expect(note('C#x').accidental).toBe(3)
  })

  it.each(['', 'H', 'C#b', 'Cb#', 'C♮#', 'C4.5', 'Cx♭', '4', 'Cbbb#'])(
    'rejects %j',
    (text) => {
      expect(parseNote(text)).toBeUndefined()
    },
  )
})

describe('formatNote', () => {
  it.each(displayNames)('shows %s as %s', (typed, shown) => {
    expect(formatNote(note(typed))).toBe(shown)
  })

  it('can write typed characters instead of symbols', () => {
    expect(formatNote(note('F𝄪4'), { ascii: true })).toBe('F##4')
    expect(formatNote(note('E𝄫'), { ascii: true })).toBe('Ebb')
  })

  it('round-trips every spelling from 𝄫 to 𝄪 in several octaves', () => {
    for (const letter of 'CDEFGAB') {
      for (const acc of ['bb', 'b', '', '#', '##']) {
        for (const octave of ['', '0', '4', '8']) {
          const text = `${letter}${acc}${octave}`
          expect(parseNote(formatNote(note(text)))).toEqual(note(text))
        }
      }
    }
  })
})

describe('midiNumber', () => {
  it.each(midiNumbers)('%s is MIDI %i', (text, midi) => {
    expect(midiNumber(note(text))).toBe(midi)
  })

  it('matches tonal for every spelling from 𝄫 to 𝄪 across the piano', () => {
    for (const letter of 'CDEFGAB') {
      for (const acc of ['bb', 'b', '', '#', '##']) {
        for (let octave = 0; octave <= 8; octave++) {
          const text = `${letter}${acc}${octave}`
          expect(midiNumber(note(text))).toBe(TonalNote.midi(text))
        }
      }
    }
  })

  it('needs an octave', () => {
    expect(midiNumber(note('C'))).toBeUndefined()
  })
})

describe('pitch class and enharmonics', () => {
  it('derives the pitch class from the spelling', () => {
    expect(pitchClass(note('C'))).toBe(0)
    expect(pitchClass(note('B#'))).toBe(0)
    expect(pitchClass(note('Cb'))).toBe(11)
    expect(pitchClass(note('Fb'))).toBe(4)
    expect(pitchClass(note('Ebb'))).toBe(2)
  })

  it('treats enharmonic spellings as the same pitch but different notes', () => {
    expect(enharmonic(note('G#'), note('Ab'))).toBe(true)
    expect(sameSpelling(note('G#'), note('Ab'))).toBe(false)
    expect(enharmonic(note('E#4'), note('F4'))).toBe(true)
    expect(enharmonic(note('B#3'), note('C4'))).toBe(true)
    expect(enharmonic(note('B#4'), note('C4'))).toBe(false)
    expect(sameSpelling(note('Eb4'), note('Eb4'))).toBe(true)
    expect(sameSpelling(note('Eb4'), note('Eb'))).toBe(false)
  })
})

describe('noteAtMidi', () => {
  const at = (text: string, midi: number) => {
    const note = noteAtMidi(parseNote(text)!, midi)
    return note && formatNote(note, { ascii: true })
  }

  it('puts a spelling in the octave that sounds the pitch', () => {
    expect(at('C', 60)).toBe('C4')
    expect(at('E', 40)).toBe('E2')
    expect(at('B#', 60)).toBe('B#3')
    expect(at('Cb', 59)).toBe('Cb4')
    expect(at('F##', 43)).toBe('F##2')
  })

  it('refuses a spelling of another pitch', () => {
    expect(at('C#', 60)).toBeUndefined()
  })
})
