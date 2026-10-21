import { describe, expect, it } from 'vitest'
import {
  auditTonics,
  chordDetail,
  chordTable,
  keyName,
  keysForScale,
  parentLabel,
  scaleRow,
  signatureLabel,
} from '../../src/audit/audit'
import { allScales, formatNote, parseNote, type Key } from '../../src/theory'

function key(tonic: string, mode: string): Key {
  const note = parseNote(tonic)
  if (!note) throw new Error(`bad note ${tonic}`)
  return { tonic: note, mode }
}

const tonics = (keys: Key[]) =>
  keys.map((k) => formatNote(k.tonic, { ascii: true }))

describe('keysForScale', () => {
  it('lists the 15 major keys, flats to sharps', () => {
    expect(tonics(keysForScale('major'))).toEqual(
      'Cb Gb Db Ab Eb Bb F C G D A E B F# C#'.split(' '),
    )
  })

  it('lists the 15 minor keys', () => {
    expect(tonics(keysForScale('natural-minor'))).toEqual(
      'Ab Eb Bb F C G D A E B F# C# G# D# A#'.split(' '),
    )
  })

  it('lists a mode on the tonics whose parent has a signature', () => {
    expect(tonics(keysForScale('dorian'))).toEqual(
      'Db Ab Eb Bb F C G D A E B F# C# G# D#'.split(' '),
    )
  })

  it('lists harmonic minor modes by their parent minor key', () => {
    const keys = tonics(keysForScale('phrygian-dominant'))
    expect(keys).toHaveLength(15)
    expect(keys).toContain('E')
    expect(keys).toContain('E#')
  })

  it('lists a scale that is not a mode on all 18 key-signature tonics', () => {
    expect(keysForScale('minor-pentatonic')).toHaveLength(18)
  })
})

describe('labels', () => {
  it('names the key and its signature', () => {
    const e = key('E', 'dorian')
    expect(keyName(e)).toBe('E Dorian')
    expect(signatureLabel(e)).toBe('2♯')
    expect(parentLabel(e)).toBe('D Major (Ionian)')
    expect(signatureLabel(key('Ab', 'natural-minor'))).toBe('7♭')
    expect(signatureLabel(key('C', 'major'))).toBe('no sharps or flats')
    expect(parentLabel(key('C', 'major'))).toBeUndefined()
    expect(signatureLabel(key('C', 'whole-tone'))).toBe('none (not a mode)')
  })

  it('spells the scale with degree labels', () => {
    expect(scaleRow(key('Ab', 'natural-minor'))).toEqual({
      notes: ['A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F♭', 'G♭'],
      degrees: ['1', '2', '♭3', '4', '5', '♭6', '♭7'],
    })
  })
})

describe('chordTable', () => {
  it('stacks triads with numerals in E minor', () => {
    const table = chordTable(key('E', 'natural-minor'), 'lead-sheet')
    if (!table.stacked) throw new Error('expected stacked chords')
    expect(table.rows[0].map((c) => c?.symbol)).toEqual([
      'Em',
      'F♯dim',
      'G',
      'Am',
      'Bm',
      'C',
      'D',
    ])
    expect(table.rows[0].map((c) => c?.numeral)).toEqual([
      'i',
      'ii°',
      '♭III',
      'iv',
      'v',
      '♭VI',
      '♭VII',
    ])
  })

  it('leaves a gap where a shape is not a chord', () => {
    const table = chordTable(key('C', 'major'), 'lead-sheet')
    if (!table.stacked) throw new Error('expected stacked chords')
    const sus4 = table.rows[table.kinds.indexOf('sus4')]
    expect(sus4[3]).toBeUndefined()
  })

  it('uses jazz symbols when asked', () => {
    const table = chordTable(key('C', 'major'), 'jazz')
    if (!table.stacked) throw new Error('expected stacked chords')
    expect(table.rows[1][0]?.symbol).toBe('C△7')
  })

  it('lists every chord in a scale that does not stack in thirds', () => {
    const table = chordTable(key('C', 'major-pentatonic'), 'lead-sheet')
    if (table.stacked) throw new Error('expected a chord list')
    expect(table.degrees[0].map((c) => c.symbol)).toEqual([
      'C',
      'Csus2',
      'Cadd9',
      'C6',
      'C5',
      'C6/9',
    ])
  })
})

describe('chordDetail', () => {
  it('gives every name, the numeral line and the inversions', () => {
    const detail = chordDetail(
      key('C', 'major'),
      { root: { letter: 'C', accidental: 0 }, quality: '6' },
      'lead-sheet',
    )
    expect(detail.notes).toEqual(['C', 'E', 'G', 'A'])
    expect(detail.names.map((n) => n.symbol).slice(0, 2)).toEqual([
      'C6',
      'Am7/C',
    ])
    expect(detail.description).toBe('I6, diatonic in C major')
    expect(detail.inversions[1]).toMatchObject({
      label: 'first inversion',
      symbol: 'C6/E',
    })
  })
})

// The page shows any tonic with any scale, so every one must build.
describe('every tonic and scale', () => {
  it.each(allScales().map((s) => s.id))(
    'builds %s on all 21 tonics',
    (mode) => {
      for (const tonic of auditTonics()) {
        const k = { tonic, mode }
        const table = chordTable(k, 'lead-sheet')
        const first = table.stacked ? table.rows[0][0] : table.degrees.flat()[0]
        if (first) chordDetail(k, first.chord, 'lead-sheet')
        expect(scaleRow(k).notes.length).toBeGreaterThan(0)
      }
    },
  )
})
