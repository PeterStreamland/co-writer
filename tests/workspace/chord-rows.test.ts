import { describe, expect, it } from 'vitest'
import { chordRows, currentChord } from '../../src/workspace/chord-rows'
import {
  allScales,
  midiNumber,
  parseChordSymbol,
  parseNote,
  type Key,
} from '../../src/theory'

function key(tonic: string, mode: string): Key {
  return { tonic: parseNote(tonic)!, mode }
}

function stacked(k: Key, showMore = false) {
  const rows = chordRows(k, showMore)
  if (!rows.stacked) throw new Error(`${k.mode} should stack in thirds`)
  return rows
}

const symbols = (cells: ({ symbol: string } | undefined)[]) =>
  cells.map((c) => c?.symbol ?? '—')
const numerals = (cells: ({ numeral: string } | undefined)[]) =>
  cells.map((c) => c?.numeral ?? '—')

describe('chordRows for a scale that stacks in thirds', () => {
  it('shows C major triads, 7ths and extended chords with numerals', () => {
    const { rows, degrees } = stacked(key('C', 'major'))
    expect(degrees).toEqual('1 2 3 4 5 6 7'.split(' '))
    expect(rows.map((r) => r.label)).toEqual([
      'Triads',
      '7ths',
      '9ths',
      '11ths',
      '13ths',
    ])
    expect(symbols(rows[0].cells)).toEqual('C Dm Em F G Am Bdim'.split(' '))
    expect(numerals(rows[0].cells)).toEqual('I ii iii IV V vi vii°'.split(' '))
    expect(symbols(rows[1].cells)).toEqual(
      'Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7♭5'.split(' '),
    )
    expect(numerals(rows[1].cells)).toEqual(
      'Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7'.split(' '),
    )
  })

  it('numbers E minor from the major scale on E', () => {
    const { rows } = stacked(key('E', 'natural-minor'))
    expect(symbols(rows[0].cells)).toEqual('Em F♯dim G Am Bm C D'.split(' '))
    expect(numerals(rows[0].cells)).toEqual(
      'i ii° ♭III iv v ♭VI ♭VII'.split(' '),
    )
  })

  it('keeps more chords behind More chords, with gaps where none fits', () => {
    expect(stacked(key('C', 'major')).rows).toHaveLength(5)
    const { rows } = stacked(key('C', 'major'), true)
    expect(rows.map((r) => r.label).slice(5)).toEqual([
      'sus2',
      'sus4',
      '7sus4',
      'add9',
      'add11',
      '6ths',
    ])
    // F B♭ C isn't in C major, so there is no Fsus4.
    expect(symbols(rows[6].cells)[3]).toBe('—')
  })
})

describe('chordRows for a scale that does not stack in thirds', () => {
  it('lists every chord in A minor pentatonic, degree by degree', () => {
    const rows = chordRows(key('A', 'minor-pentatonic'), false)
    if (rows.stacked) throw new Error('pentatonic should not stack')
    expect(rows.degrees).toEqual('1 ♭3 4 5 ♭7'.split(' '))
    expect(rows.columns[0].map((c) => c.symbol)).toContain('Am7')
    expect(rows.columns[0].map((c) => c.symbol)).toContain('A5')
    expect(rows.columns[3].map((c) => c.symbol)).toEqual([])
  })
})

it('builds rows for every scale in the dictionary', () => {
  for (const scale of allScales()) {
    const rows = chordRows({ tonic: parseNote('D')!, mode: scale.id }, true)
    expect(rows.degrees.length, scale.id).toBeGreaterThan(0)
  }
})

describe('currentChord', () => {
  it('describes the chord and plays it around middle C', () => {
    const chord = currentChord(key('C', 'major'), parseChordSymbol('G7')!)
    expect(chord.symbol).toBe('G7')
    expect(chord.description).toBe('V7, diatonic in C major')
    expect(chord.notes).toEqual(['G', 'B', 'D', 'F'])
    expect(chord.voicing.map(midiNumber)).toEqual([55, 59, 62, 65])
  })
})
