import { describe, expect, it } from 'vitest'
import { parseNote, type Key } from '../../src/theory'
import { NO_CHORD, nextLastChord } from '../../src/workspace/last-chord'
import { played } from '../../src/workspace/played'

const C: Key = { tonic: parseNote('C')!, mode: 'major' }

// Feeds each set of held keys in turn, as the MIDI keyboard reports them.
function play(...steps: number[][]) {
  return steps.reduce(
    (last, held) => nextLastChord(last, played(C, held)),
    NO_CHORD,
  )
}

const first = (last: ReturnType<typeof play>) => last.names[0]?.symbol

describe('last chord played', () => {
  it('keeps the chord after the keys come up', () => {
    const last = play([60], [60, 64], [60, 64, 67], [])
    expect(first(last)).toBe('C')
    expect(last.holding).toBe(false)
    expect(last.names[0].chord).toEqual({
      root: parseNote('C'),
      quality: 'M',
    })
  })

  it('keeps the fullest chord while keys are let go one at a time', () => {
    const last = play([60, 64, 67], [60, 67], [60], [])
    expect(first(last)).toBe('C')
  })

  it('keeps the last chord while a lone note starts the next one', () => {
    expect(first(play([60, 64, 67], [], [57]))).toBe('C')
    expect(first(play([60, 64, 67], [], [57], [57, 60, 64]))).toBe('Am')
  })

  it('takes a new chord each time you play, even a smaller one', () => {
    expect(first(play([60, 64, 67, 71], [], [62, 69]))).toBe('D5')
  })

  it('follows a chord that grows while held', () => {
    expect(first(play([55, 59, 62], [55, 59, 62, 65]))).toBe('G7')
  })

  it('keeps every name, with its chord, for the chord boxes', () => {
    const last = play([48, 64, 67, 69])
    expect(last.names.map((n) => n.symbol)).toEqual(['C6', 'Am7/C'])
    expect(last.names[1].chord.bass).toEqual(parseNote('C'))
  })

  it('has nothing before anything is played', () => {
    expect(play().names).toEqual([])
    expect(play([61], []).names).toEqual([])
  })
})
