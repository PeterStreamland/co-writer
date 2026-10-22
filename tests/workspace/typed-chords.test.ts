import { describe, expect, it } from 'vitest'
import { chordSymbol } from '../../src/theory'
import { readTypedChords } from '../../src/workspace/typed-chords'

const symbols = (text: string) =>
  readTypedChords(text).chords.map((c) => chordSymbol(c))

describe('typing chords', () => {
  it('reads chords separated by spaces', () => {
    expect(symbols('Em C G D')).toEqual(['Em', 'C', 'G', 'D'])
  })

  it('reads commas, bar lines and dashes as separators', () => {
    expect(symbols('| Am7 | D7 | Gmaj7 |')).toEqual(['Am7', 'D7', 'Gmaj7'])
    expect(symbols('F#m7b5, B7,Em')).toEqual(['F♯m7♭5', 'B7', 'Em'])
    expect(symbols('C - G – Am — F')).toEqual(['C', 'G', 'Am', 'F'])
  })

  it('keeps the spelling typed', () => {
    expect(symbols('Bb A# Gb F#')).toEqual(['B♭', 'A♯', 'G♭', 'F♯'])
  })

  it('reads jazz symbols, slash chords and power chords', () => {
    expect(symbols('C△7 C-7 Cø7 C°7 C+ C/E E5')).toEqual([
      'Cmaj7',
      'Cm7',
      'Cm7♭5',
      'Cdim7',
      'Caug',
      'C/E',
      'E5',
    ])
  })

  it('reads a lower-case root as a capital', () => {
    expect(symbols('em c bb7 f#m')).toEqual(['Em', 'C', 'B♭7', 'F♯m'])
  })

  it('lists the words it could not read', () => {
    const typed = readTypedChords('C Hm G xyz')
    expect(typed.chords.map((c) => chordSymbol(c))).toEqual(['C', 'G'])
    expect(typed.unread).toEqual(['Hm', 'xyz'])
  })

  it('reads nothing from an empty box', () => {
    expect(readTypedChords('   ')).toEqual({ chords: [], unread: [] })
  })
})
