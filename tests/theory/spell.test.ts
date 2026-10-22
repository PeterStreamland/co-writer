import { describe, expect, it } from 'vitest'
import {
  chordNames,
  chordSymbol,
  formatNote,
  midiNumber,
  parseNote,
  spellPitches,
  type Key,
} from '../../src/theory'
import { playedNotes } from '../fixtures/played-notes'

function key(text: string): Key {
  const [tonic, mode] = text.split(' ')
  return { tonic: parseNote(tonic)!, mode }
}

describe('spellPitches', () => {
  it.each(playedNotes)(
    'in $key, $midi is $spelled',
    ({ key: k, midi, spelled, name }) => {
      const notes = spellPitches(midi, key(k))
      expect(notes.map((n) => formatNote(n, { ascii: true })).join(' ')).toBe(
        spelled,
      )
      expect(notes.map(midiNumber)).toEqual(midi)
      const names = chordNames(notes, { key: key(k) })
      expect(names[0] && chordSymbol(names[0], { ascii: true })).toBe(name)
    },
  )

  it('keeps every pitch for any cluster of notes', () => {
    const k = key('D major')
    for (let low = 48; low < 60; low++) {
      const midi = [low, low + 1, low + 4, low + 6, low + 10]
      expect(spellPitches(midi, k).map(midiNumber)).toEqual(midi)
    }
  })
})
