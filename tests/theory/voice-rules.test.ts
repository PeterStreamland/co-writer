import { describe, expect, it } from 'vitest'
import {
  LENSES,
  LENS_RULE_WEIGHTS,
  VOICE_RULES,
  getScale,
  parseChordSymbol,
  parseNote,
  rulePenalty,
  voiceRuleHits,
  type Key,
  type Note,
  type Voiced,
} from '../../src/theory'
import { voiceRules } from '../fixtures/voice-rules'

function key(text: string): Key {
  const [tonicText, modeText] = text.split(' ')
  const tonic = parseNote(tonicText)
  const mode = getScale(modeText === 'minor' ? 'natural-minor' : modeText)?.id
  if (!tonic || !mode) throw new Error(`${text} is not a key`)
  return { tonic, mode }
}

function voiced(v: { chord: string; notes: string }): Voiced {
  const chord = parseChordSymbol(v.chord)
  if (!chord) throw new Error(`${v.chord} did not parse`)
  const notes = v.notes.split(' ').map((word) => {
    const note = parseNote(word)
    if (note?.octave === undefined) throw new Error(`${word} did not parse`)
    return note as Note
  })
  return { chord, notes }
}

const fourParts = (from: string, to: string, chords = ['C', 'Dm']) => ({
  key: key('C major'),
  from: voiced({ chord: chords[0], notes: from }),
  to: voiced({ chord: chords[1], notes: to }),
})

describe('voice-leading rules', () => {
  it.each(voiceRules)('$name', (c) => {
    const hits = voiceRuleHits({
      key: key(c.key),
      from: c.from && voiced(c.from),
      to: voiced(c.to),
      gain: c.gain,
    })
    expect(hits.map((h) => `${h.rule} ${h.voices.join('-')}`)).toEqual(c.hits)
  })

  it('explains each hit in words, naming the voices and notes', () => {
    const hits = voiceRuleHits(fourParts('C3 G3 E4 C5', 'D3 A3 F4 D5'))
    expect(hits.map((h) => h.explanation)).toEqual([
      'Parallel 5ths: the bass and tenor move C3–G3 to D3–A3.',
      'Parallel octaves: the bass and soprano move C3–C5 to D3–D5.',
    ])
    expect(hits.map((h) => h.ruleId)).toEqual([
      'voice.parallel-fifths',
      'voice.parallel-octaves',
    ])
    const contrary = voiceRuleHits(
      fourParts('C3 G3 E4 C5', 'G2 D4 B4 D5', ['C', 'G']),
    )
    expect(contrary[0].explanation).toBe(
      'Parallel 5ths: the bass and tenor move C3–G3 to G2–D4, in contrary motion.',
    )
  })

  it('names voices outside four parts by position', () => {
    const [h] = voiceRuleHits({
      key: key('C major'),
      to: voiced({ chord: 'C', notes: 'C2 E2 G4' }),
    })
    expect(h.explanation).toBe(
      'Muddy low down: C2–E2 between the bass and voice 2.',
    )
  })

  it("doesn't count a 5th kept by one voice holding as parallel", () => {
    // The bass holds C while G leaps an octave: a 5th, then a 12th.
    const hits = voiceRuleHits({
      key: key('C major'),
      from: voiced({ chord: 'C5', notes: 'C3 G3' }),
      to: voiced({ chord: 'C5', notes: 'C3 G4' }),
    })
    expect(hits).toEqual([])
  })

  it('skips motion rules when the voicings differ in size', () => {
    const hits = voiceRuleHits({
      key: key('C major'),
      from: voiced({ chord: 'C', notes: 'C3 G3 C4' }),
      to: voiced({ chord: 'D', notes: 'D3 A3 D4 F#4' }),
    })
    expect(hits).toEqual([])
  })

  it('charges each lens its own weights', () => {
    const hits = voiceRuleHits(fourParts('C3 G3 E4 C5', 'D3 A3 F4 D5'))
    const w = LENS_RULE_WEIGHTS
    expect(rulePenalty(hits, 'classical')).toBe(
      w.classical['parallel-fifths'] + w.classical['parallel-octaves'],
    )
    expect(rulePenalty(hits, 'rock')).toBe(0)
    expect(rulePenalty([], 'classical')).toBe(0)
  })

  it('weights every rule for every lens, never below zero', () => {
    for (const lens of LENSES) {
      for (const rule of VOICE_RULES) {
        expect(LENS_RULE_WEIGHTS[lens][rule]).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('makes classical the strictest lens on parallels and rock on 3rds', () => {
    const w = LENS_RULE_WEIGHTS
    for (const lens of LENSES) {
      expect(w.classical['parallel-fifths']).toBeGreaterThanOrEqual(
        w[lens]['parallel-fifths'],
      )
      expect(w.rock['thirds-under-gain']).toBeGreaterThanOrEqual(
        w[lens]['thirds-under-gain'],
      )
    }
  })
})
