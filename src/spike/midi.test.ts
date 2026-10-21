import { describe, expect, it } from 'vitest'
import { chordNames, noteName, parseMidiMessage } from './midi'

describe('parseMidiMessage', () => {
  it('reads note-on on any channel', () => {
    expect(parseMidiMessage([0x90, 60, 100])).toEqual({
      type: 'on',
      note: 60,
      velocity: 100,
    })
    expect(parseMidiMessage([0x93, 64, 1])).toEqual({
      type: 'on',
      note: 64,
      velocity: 1,
    })
  })

  it('treats note-off and velocity-0 note-on as off', () => {
    expect(parseMidiMessage([0x80, 60, 64])).toEqual({ type: 'off', note: 60 })
    expect(parseMidiMessage([0x90, 60, 0])).toEqual({ type: 'off', note: 60 })
  })

  it('ignores other messages such as the sustain pedal', () => {
    expect(parseMidiMessage([0xb0, 64, 127])).toEqual({ type: 'other' })
  })
})

describe('noteName', () => {
  it('names middle C as C4', () => {
    expect(noteName(60)).toBe('C4')
    expect(noteName(61)).toBe('C#4')
    expect(noteName(21)).toBe('A0')
  })
})

describe('chordNames', () => {
  it('names a held C major triad', () => {
    expect(chordNames([64, 60, 67])).toContain('CM')
  })

  it('lists C/E for a first-inversion C triad, but not first', () => {
    // Spike finding: tonal ranks 'Em#5' (E G B#) above 'CM/E' and ignores
    // spelling. Phase 1's wrapper must rank names itself (SPEC section 4).
    expect(chordNames([64, 67, 72])).toEqual(['Em#5', 'CM/E'])
  })
})
