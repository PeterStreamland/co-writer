import { describe, expect, it } from 'vitest'
import { chordSymbol, formatNote, parseNote, type Key } from '../../src/theory'
import { recordedChord } from '../../src/workspace/recorded'

const key = (tonic: string, mode: string): Key => ({
  tonic: parseNote(tonic)!,
  mode,
})

function recorded(k: Key, midis: number[]) {
  const r = recordedChord(k, midis)
  if (!r) return undefined
  return {
    symbol: chordSymbol(r.chord),
    notes: r.voicing.notes.map((n) => formatNote(n)).join(' '),
  }
}

describe('a recorded chord', () => {
  it('takes the best name for the key and keeps the notes as played', () => {
    expect(recorded(key('C', 'major'), [48, 64, 67, 72])).toEqual({
      symbol: 'C',
      notes: 'C3 E4 G4 C5',
    })
  })

  it('keeps an inversion as a slash chord', () => {
    expect(recorded(key('C', 'major'), [52, 60, 67])).toEqual({
      symbol: 'C/E',
      notes: 'E3 C4 G4',
    })
  })

  it('spells chromatic chords by function in the key', () => {
    // A♭ C E♭ in C major is ♭VI, not G♯ B♯ D♯.
    expect(recorded(key('C', 'major'), [56, 60, 63])).toEqual({
      symbol: 'A♭',
      notes: 'A♭3 C4 E♭4',
    })
    // E G♯ B D is E7, V7/vi.
    expect(recorded(key('C', 'major'), [52, 56, 59, 62])).toEqual({
      symbol: 'E7',
      notes: 'E3 G♯3 B3 D4',
    })
  })

  it('spells the octave of B♯ and C♭ by the pitch played', () => {
    // C♯ major's B♯ at MIDI 60 is B♯3.
    const r = recorded(key('C#', 'major'), [49, 53, 56, 60])
    expect(r?.symbol).toBe('C♯maj7')
    expect(r?.notes).toBe('C♯3 E♯3 G♯3 B♯3')
  })

  it('records power chords', () => {
    expect(recorded(key('E', 'minor'), [40, 47, 52])?.symbol).toBe('E5')
  })
})
