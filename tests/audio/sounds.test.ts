import { describe, expect, it } from 'vitest'
import {
  SAMPLE_NOTES,
  sampleMap,
  strumSchedule,
  type Sound,
} from '../../src/audio/sounds'
import { formatNote, parseNote } from '../../src/theory'

describe('sampleMap', () => {
  it('names sharps as Tone.js does', () => {
    expect(sampleMap('piano')['D#4']).toBe('Ds4.mp3')
    expect(sampleMap('guitar')['E2']).toBe('E2.mp3')
  })

  it('points at exactly the sample files there are', () => {
    const files = Object.keys(import.meta.glob('/public/samples/*/*.mp3'))
    const mapped = (Object.keys(SAMPLE_NOTES) as Sound[]).flatMap((sound) =>
      Object.values(sampleMap(sound)).map(
        (file) => `/public/samples/${sound}/${file}`,
      ),
    )
    expect(mapped.sort()).toEqual(files.sort())
  })

  it('covers the keyboard view (C2–C6) and the guitar neck (E2 up)', () => {
    expect(SAMPLE_NOTES.piano[0]).toBe('A1')
    expect(SAMPLE_NOTES.piano.at(-1)).toBe('C7')
    expect(SAMPLE_NOTES.guitar[0]).toBe('E2')
  })
})

describe('strumSchedule', () => {
  it('strums low to high, 15 ms apart, whatever order the notes come in', () => {
    const notes = ['G3', 'E4', 'C4', 'C3'].map((n) => parseNote(n)!)
    const schedule = strumSchedule(notes)
    expect(schedule.map((s) => formatNote(s.note))).toEqual([
      'C3',
      'G3',
      'C4',
      'E4',
    ])
    expect(schedule.map((s) => s.offset)).toEqual([0, 0.015, 0.03, 0.045])
  })
})
