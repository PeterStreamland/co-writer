// Golden fixture: next-chord candidates, written out by hand (PLAN Phase 4
// task 2, SPEC 6). Never edit this to make a test pass: ask David.
// Keys and chords are typed in ASCII (# sharp, b flat); numerals are written
// as displayed. Each row lists chords that must be offered after the previous
// chord, with their category and numeral, and chords that must not be.
// `top` lists chords that must share the highest score.

import type { SuggestionCategory } from '../../src/theory'

type Expected = {
  chord: string
  category: SuggestionCategory
  numeral: string
  // A rule that must be among the suggestion's rule ids.
  rule?: string
  // A modulation's new key.
  keyChange?: string
}

export const nextChordCases: {
  key: string
  previous: string[]
  expected: Expected[]
  absent?: string[]
  top?: string[]
}[] = [
  {
    key: 'C major',
    previous: [],
    expected: [
      { chord: 'C', category: 'diatonic', numeral: 'I' },
      { chord: 'F', category: 'diatonic', numeral: 'IV' },
      { chord: 'Am', category: 'diatonic', numeral: 'vi' },
    ],
    // With nothing picked, only the key's own chords are offered.
    absent: ['E7', 'Ab', 'Bb', 'Db7'],
    top: ['C'],
  },
  {
    key: 'C major',
    previous: ['C'],
    expected: [
      { chord: 'F', category: 'diatonic', numeral: 'IV' },
      { chord: 'Dm', category: 'diatonic', numeral: 'ii' },
      { chord: 'G', category: 'diatonic', numeral: 'V' },
      { chord: 'G7', category: 'diatonic', numeral: 'V7' },
      { chord: 'E7', category: 'secondary', numeral: 'V7/vi' },
      { chord: 'D7', category: 'secondary', numeral: 'V7/V' },
      { chord: 'A7', category: 'secondary', numeral: 'V7/ii' },
      { chord: 'G#dim7', category: 'secondary', numeral: 'vii°7/vi' },
      { chord: 'F#dim7', category: 'secondary', numeral: 'vii°7/V' },
      { chord: 'Ab', category: 'borrowed', numeral: '♭VI' },
      { chord: 'Bb', category: 'borrowed', numeral: '♭VII' },
      { chord: 'Fm', category: 'borrowed', numeral: 'iv' },
      { chord: 'Db', category: 'borrowed', numeral: '♭II' },
      { chord: 'Db7', category: 'chromatic', numeral: '♭II7' },
      { chord: 'E', category: 'chromatic', numeral: 'V/vi' },
      {
        chord: 'Am',
        category: 'modulation',
        numeral: 'vi',
        keyChange: 'G major',
      },
      {
        chord: 'Dm',
        category: 'modulation',
        numeral: 'ii',
        keyChange: 'F major',
      },
      {
        chord: 'Dm',
        category: 'modulation',
        numeral: 'ii',
        keyChange: 'A minor',
      },
      { chord: 'C', category: 'pedal', numeral: 'I', rule: 'pedal.static' },
      { chord: 'Csus4', category: 'pedal', numeral: 'Isus4' },
      { chord: 'G/C', category: 'pedal', numeral: 'V (bass 1)' },
      { chord: 'F/C', category: 'pedal', numeral: 'IV⁶₄' },
    ],
    top: ['Dm', 'F'],
  },
  {
    key: 'C major',
    previous: ['Dm'],
    expected: [
      { chord: 'G', category: 'diatonic', numeral: 'V' },
      { chord: 'G7', category: 'diatonic', numeral: 'V7' },
    ],
    top: ['G', 'G7'],
  },
  {
    key: 'C major',
    previous: ['G7'],
    expected: [
      { chord: 'C', category: 'diatonic', numeral: 'I' },
      {
        chord: 'Am',
        category: 'diatonic',
        numeral: 'vi',
        rule: 'diatonic.deceptive',
      },
      // G7 holds G in the bass under C: a dominant pedal.
      { chord: 'C/G', category: 'pedal', numeral: 'I⁶₄', rule: 'pedal.bass' },
    ],
    top: ['C'],
  },
  {
    key: 'C major',
    previous: ['E7'],
    expected: [
      {
        chord: 'Am',
        category: 'diatonic',
        numeral: 'vi',
        rule: 'diatonic.resolve-secondary',
      },
    ],
    top: ['Am'],
  },
  {
    key: 'C major',
    previous: ['C5'],
    expected: [
      { chord: 'G5', category: 'rock', numeral: 'V5' },
      { chord: 'Bb5', category: 'rock', numeral: '♭VII5' },
      { chord: 'Ab5', category: 'rock', numeral: '♭VI5' },
      {
        chord: 'Bb',
        category: 'borrowed',
        numeral: '♭VII',
        rule: 'rock.flat-seven',
      },
    ],
  },
  {
    key: 'E minor',
    previous: ['Em'],
    expected: [
      { chord: 'Am', category: 'diatonic', numeral: 'iv' },
      {
        chord: 'C',
        category: 'diatonic',
        numeral: '♭VI',
        rule: 'rock.flat-six',
      },
      {
        chord: 'D',
        category: 'diatonic',
        numeral: '♭VII',
        rule: 'rock.flat-seven',
      },
      { chord: 'B', category: 'diatonic', numeral: 'V' },
      { chord: 'B7', category: 'diatonic', numeral: 'V7' },
      { chord: 'F#7', category: 'secondary', numeral: 'V7/V' },
      { chord: 'E7', category: 'secondary', numeral: 'V7/iv' },
      { chord: 'A', category: 'borrowed', numeral: 'IV' },
      { chord: 'E', category: 'borrowed', numeral: 'I' },
      { chord: 'F', category: 'borrowed', numeral: '♭II' },
      { chord: 'F7', category: 'chromatic', numeral: '♭II7' },
      {
        chord: 'Am',
        category: 'modulation',
        numeral: 'iv',
        keyChange: 'G major',
      },
      { chord: 'Esus4', category: 'pedal', numeral: 'isus4' },
      // D7 is the key's own ♭VII7, not a secondary dominant of ♭III
      // (changed 2026-10-22 with David's go-ahead: it was ruled out before
      // the engine offered diatonic 7th chords).
      { chord: 'D7', category: 'diatonic', numeral: '♭VII7' },
    ],
  },
  {
    key: 'Ab minor',
    previous: ['Abm'],
    expected: [
      { chord: 'Fb', category: 'diatonic', numeral: '♭VI' },
      { chord: 'Dbm', category: 'diatonic', numeral: 'iv' },
      { chord: 'Eb7', category: 'diatonic', numeral: 'V7' },
      { chord: 'Bb7', category: 'secondary', numeral: 'V7/V' },
    ],
    // ♭VI is F♭ in A♭ minor, never E.
    absent: ['E'],
  },
  {
    key: 'E dorian',
    previous: ['Em'],
    expected: [
      { chord: 'A', category: 'diatonic', numeral: 'IV' },
      { chord: 'C#dim', category: 'diatonic', numeral: 'vi°' },
      { chord: 'C', category: 'borrowed', numeral: '♭VI' },
    ],
  },
]
