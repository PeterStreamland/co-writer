import { describe, expect, it } from 'vitest'
import {
  DEFAULT_VOICE_LEADING_WEIGHTS,
  averageMovement,
  formatNote,
  parseNote,
  voiceLeading,
  type Note,
} from '../../src/theory'
import { voiceLeadings } from '../fixtures/voice-leading'

function voicing(text: string): Note[] {
  return text.split(' ').map((word) => {
    const note = parseNote(word)
    if (note?.octave === undefined) throw new Error(`${word} did not parse`)
    return note
  })
}

describe('voice-leading cost', () => {
  it.each(voiceLeadings)('$name', ({ from, to, ...expected }) => {
    const { movement, kept, common, missed, crossings, overlaps } =
      voiceLeading(voicing(from), voicing(to))
    expect({ movement, kept, common, missed, crossings, overlaps }).toEqual({
      movement: expected.movement,
      kept: expected.kept,
      common: expected.common,
      missed: expected.missed,
      crossings: expected.crossings,
      overlaps: expected.overlaps,
    })
  })

  it('pairs voices in order and signs each move', () => {
    const moves = voiceLeading(
      voicing('G2 B3 D4 F4'),
      voicing('C3 C4 C4 E4'),
    ).moves
    expect(
      moves.map(
        (m) =>
          `${formatNote(m.from, { ascii: true })}>${formatNote(m.to, { ascii: true })} ${m.semitones}`,
      ),
    ).toEqual(['G2>C3 5', 'B3>C4 1', 'D4>C4 -2', 'F4>E4 -1'])
  })

  it('uses every note of both voicings when the sizes differ', () => {
    const { moves } = voiceLeading(voicing('C4 E4 G4'), voicing('G3 B3 D4 F4'))
    expect(moves).toHaveLength(4)
    const show = (ns: Note[]) =>
      ns.map((n) => formatNote(n, { ascii: true })).join(' ')
    expect(show(moves.map((m) => m.from))).toBe('C4 C4 E4 G4')
    expect(show(moves.map((m) => m.to))).toBe('G3 B3 D4 F4')
  })

  it('weighs movement, missed common tones, crossings and overlaps', () => {
    const w = DEFAULT_VOICE_LEADING_WEIGHTS
    const crossed = voiceLeading(voicing('C3 E4 G4 C5'), voicing('F3 A4 F4 C5'))
    expect(crossed.cost).toBe(12 * w.semitone + w.crossing + w.overlap)
    const leap = voiceLeading(voicing('C4 E4 G4'), voicing('F4 A4 C5'))
    expect(leap.cost).toBe(15 * w.semitone + w.missedCommonTone + 2 * w.overlap)
    const custom = voiceLeading(voicing('C4 E4 G4'), voicing('F4 A4 C5'), {
      semitone: 0,
      missedCommonTone: 10,
      crossing: 0,
      overlap: 0,
    })
    expect(custom.cost).toBe(10)
  })

  it('prefers smooth voicings to root-position leaps', () => {
    const smooth = voiceLeading(voicing('C4 E4 G4'), voicing('C4 F4 A4'))
    const leaps = voiceLeading(voicing('C4 E4 G4'), voicing('F4 A4 C5'))
    expect(smooth.cost).toBeLessThan(leaps.cost)
  })

  it('needs octaves', () => {
    expect(() => voiceLeading([parseNote('C')!], voicing('C4'))).toThrow()
  })

  it('averages movement over a progression', () => {
    // C F/C G/B C: 3, then 1 + 3 + 2 = 6 to G/B, then 1 + 2 + 0 = 3.
    const smooth = ['C4 E4 G4', 'C4 F4 A4', 'B3 D4 G4', 'C4 E4 G4'].map(voicing)
    const root = ['C4 E4 G4', 'F4 A4 C5', 'G4 B4 D5', 'C4 E4 G4'].map(voicing)
    expect(averageMovement(smooth)).toBe((3 + 6 + 3) / 3)
    expect(averageMovement(root)).toBe((15 + 6 + 21) / 3)
    expect(averageMovement([voicing('C4 E4 G4')])).toBe(0)
  })
})
