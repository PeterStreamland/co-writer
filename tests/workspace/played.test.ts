import { describe, expect, it } from 'vitest'
import { parseNote, type Key } from '../../src/theory'
import { played } from '../../src/workspace/played'

const C: Key = { tonic: parseNote('C')!, mode: 'major' }

describe('played', () => {
  it('names C E G A as C6, and Am7/C underneath', () => {
    const result = played(C, [48, 64, 67, 69])
    expect(result.labels).toEqual(['C3', 'E4', 'G4', 'A4'])
    expect(result.names.map((n) => n.symbol)).toEqual(['C6', 'Am7/C'])
    expect(result.names[0].numeral).toBe('I6')
  })

  it('lists every name of a diminished 7th', () => {
    const result = played(C, [56, 59, 62, 65])
    expect(result.names.map((n) => n.symbol)).toHaveLength(4)
    expect(result.names[0].symbol).toBe('G♯dim7')
    expect(result.names[0].reading).toContain('vii°7/vi')
  })

  it('says which notes a name leaves out', () => {
    const result = played(C, [55, 59, 65])
    expect(result.names[0].symbol).toBe('G7')
    expect(result.names[0].reading).toContain('no 5th')
  })

  it('names nothing for a single note', () => {
    expect(played(C, [61]).names).toEqual([])
    expect(played(C, [61]).labels).toEqual(['C♯4'])
  })
})
