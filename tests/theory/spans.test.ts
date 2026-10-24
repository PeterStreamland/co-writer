import { describe, expect, it } from 'vitest'
import {
  dur,
  formatNote,
  melodySpans,
  spanMelody,
  typeMelody,
  type Dur,
  type MeterMap,
} from '../../src/theory'

const FOUR: MeterMap = { meter: { num: 4, den: 4 } }
const text = (d: Dur) => `${d.n}/${d.d}`
const show = (spans: { onset: Dur; length: Dur; m: number }[]) =>
  spans.map((s) => `${text(s.onset)}+${text(s.length)}:${s.m}`)

describe('steps of a grid against the melody', () => {
  // Crotchets: two bars, then a semibreve to end.
  const melody = typeMelody('C4 D4 E4 F4 G4 F4 E4 D4 C4 - - -', dur(1, 4)).notes

  it('each melody note: the melody itself', () => {
    expect(melodySpans(melody, FOUR, 'note')).toHaveLength(melody.length)
  })

  it('every bar, every ½ bar', () => {
    expect(show(melodySpans(melody, FOUR, 'bar'))).toEqual([
      '0/1+1/1:0',
      '1/1+1/1:4',
      '2/1+1/1:8',
    ])
    expect(show(melodySpans(melody, FOUR, 'half'))).toEqual([
      '0/1+1/2:0',
      '1/2+1/2:2',
      '1/1+1/2:4',
      '3/2+1/2:6',
      // The last note is one step to the end.
      '2/1+1/1:8',
    ])
  })

  it('every 2 bars, from odd bars', () => {
    expect(show(melodySpans(melody, FOUR, 'bar2'))).toEqual([
      '0/1+2/1:0',
      '2/1+1/1:8',
    ])
  })

  it('the last note starts a step of its own, to the end', () => {
    // E for three beats, D across the barline, C from beat 2 of bar 2 on.
    const m = typeMelody('E4 - - D4 - C4 - - -', dur(1, 4)).notes
    expect(show(melodySpans(m, FOUR, 'bar'))).toEqual([
      '0/1+1/1:0',
      '1/1+1/4:1',
      '5/4+1/1:2',
    ])
  })

  it('a rest in the melody is a rest for the line', () => {
    const m = typeMelody('C4 D4 r r E4 F4 G4 A4', dur(1, 4)).notes
    expect(show(melodySpans(m, FOUR, 'half'))).toEqual([
      '0/1+1/2:0',
      '1/1+1/2:2',
      '3/2+1/4:4',
      '7/4+1/4:5',
    ])
  })

  it('follows a change of meter', () => {
    const time: MeterMap = {
      meter: { num: 4, den: 4 },
      barMeters: { 2: { num: 3, den: 4 } },
    }
    const m = typeMelody('C4 - - - D4 - - E4 - - -', dur(1, 4)).notes
    expect(show(melodySpans(m, time, 'bar'))).toEqual([
      '0/1+1/1:0',
      '1/1+3/4:1',
      '7/4+1/1:2',
    ])
  })

  it('the melody as the grid hears it', () => {
    const heard = spanMelody(melody, FOUR, 'half')
    expect(heard.map((n) => formatNote(n.note))).toEqual([
      'C4',
      'E4',
      'G4',
      'E4',
      'C4',
    ])
    expect(heard.slice(0, 4).every((n) => n.length.n * 2 === n.length.d)).toBe(
      true,
    )
  })
})
