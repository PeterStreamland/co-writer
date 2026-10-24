import { describe, expect, it } from 'vitest'
import {
  HARMONY_KINDS,
  dur,
  harmonise,
  harmonyOptions,
  inKey,
  layOut,
  midiNumber,
  motifText,
  parseChordSymbol,
  parseNote,
  scaleNotes,
  seededRandom,
  typeMelody,
  type HarmonyContext,
  type Key,
} from '../../src/theory'
import { counters, harmonies } from '../fixtures/harmonies'

const FOUR = { meter: { num: 4, den: 4 } }

function keyOf(text: string): Key {
  const [tonic, mode] = text.split(' ')
  return { tonic: parseNote(tonic)!, mode }
}

function context(c: {
  key: string
  chords: string[]
  melody: string
}): HarmonyContext {
  const key = keyOf(c.key)
  const timing = layOut(
    c.chords.map(() => undefined),
    FOUR,
  )
  return {
    melody: typeMelody(c.melody, dur(1, 4)).notes,
    key,
    chords: c.chords.map((s, i) => ({
      chord: parseChordSymbol(s)!,
      key,
      start: timing[i].start,
      length: timing[i].length,
    })),
    time: FOUR,
  }
}

const midi = (n: Parameters<typeof midiNumber>[0]) => midiNumber(n) as number

describe('harmonies of a melody (Phase 7 task 5)', () => {
  for (const c of harmonies) {
    it(c.name, () => {
      const ctx = context(c)
      const line = harmonise(ctx, c.kind)
      expect(motifText(line.notes)).toBe(c.notes)
      for (const [i, tags] of Object.entries(c.tags ?? {})) {
        for (const t of tags) expect(line.notes[+i].tags).toContain(t)
      }
      for (const [i, tags] of Object.entries(c.untagged ?? {})) {
        for (const t of tags) expect(line.notes[+i].tags).not.toContain(t)
      }
    })
  }

  it('keeps each melody note’s place, length and holds', () => {
    const ctx = context({ key: 'C major', chords: ['C'], melody: 'E4 - r G4' })
    ctx.melody[0] = { ...ctx.melody[0], holds: [dur(1, 4)] }
    for (const kind of HARMONY_KINDS) {
      const { notes } = harmonise(ctx, kind.id)
      expect(notes.map((n) => [n.onset, n.length, n.holds])).toEqual(
        ctx.melody.map((m) => [m.onset, m.length, m.holds]),
      )
    }
  })

  it('offers 3rds above first, 6ths below next, every interval both ways', () => {
    const ctx = context({ key: 'C major', chords: ['C'], melody: 'C4 D E F' })
    const ids = harmonyOptions(ctx).map((s) => s.candidate.kind)
    expect(ids.slice(0, 2)).toEqual(['3rd-above', '6th-below'])
    for (const n of ['3rd', '4th', '5th', '6th', 'octave']) {
      expect(ids).toContain(`${n}-above`)
      expect(ids).toContain(`${n}-below`)
    }
    expect(ids).toContain('power-5th-below')
    expect(ids).toContain('power-4th-below')
    expect(ids).toContain('counter')
    expect(harmonyOptions({ ...ctx, melody: [] })).toEqual([])
  })

  it('explains every note and every option', () => {
    const ctx = context({
      key: 'C major',
      chords: ['C', 'E7', 'Am', 'G'],
      melody: 'E4 F# G A G# B C5 B4 A G F E D G B D5',
    })
    for (const s of harmonyOptions(ctx)) {
      expect(s.explanation).not.toBe('')
      for (const n of s.candidate.notes) expect(n.explanation).not.toBe('')
    }
  })

  it('gives the same harmony for the same melody', () => {
    const ctx = context(counters[1])
    for (const kind of HARMONY_KINDS) {
      expect(harmonise(ctx, kind.id)).toEqual(harmonise(ctx, kind.id))
    }
  })
})

// Exit criterion: twin-harmony lines stay diatonic unless tagged. Random
// melodies in many keys and modes, over the key's own chords and some
// chromatic ones: every note of every harmony is in the key or tagged
// chromatic.
describe('twin-harmony lines stay diatonic unless tagged', () => {
  const keys = [
    'C major',
    'G major',
    'F# major',
    'Db major',
    'A natural-minor',
    'E natural-minor',
    'D harmonic-minor',
    'G# harmonic-minor',
    'C melodic-minor',
    'E dorian',
    'A mixolydian',
    'F lydian',
    'B phrygian',
    'C major-pentatonic',
    'A minor-pentatonic',
    'E minor-blues',
  ]
  const random = seededRandom(7)
  for (const text of keys) {
    it(text, () => {
      const key = keyOf(text)
      const scale = scaleNotes(key.tonic, key.mode)
      const chordsFor = [
        `${scale[0].letter}${scale[0].accidental > 0 ? '#' : scale[0].accidental < 0 ? 'b' : ''}`,
        'E7',
        'Bb',
        'D',
      ]
      for (let take = 0; take < 6; take++) {
        const words: string[] = []
        for (let i = 0; i < 16; i++) {
          const n = scale[Math.floor(random() * scale.length)]
          const acc =
            n.accidental > 0
              ? '#'.repeat(n.accidental)
              : 'b'.repeat(-n.accidental)
          // Now and then a note outside the key.
          const bend = random() < 0.15 ? '#' : ''
          words.push(`${n.letter}${bend || acc}${4 + Math.floor(random() * 2)}`)
        }
        const ctx = context({
          key: text,
          chords: chordsFor,
          melody: words.join(' '),
        })
        for (const kind of HARMONY_KINDS) {
          const { notes } = harmonise(ctx, kind.id)
          expect(notes).toHaveLength(ctx.melody.length)
          for (const n of notes) {
            if (!inKey(key, n.note)) expect(n.tags).toContain('chromatic')
          }
        }
      }
    })
  }
})

describe('countermelodies', () => {
  for (const c of counters) {
    it(c.name, () => {
      const ctx = context(c)
      const { notes } = harmonise(ctx, 'counter')
      if (c.notes) expect(motifText(notes)).toBe(c.notes)
      const key = keyOf(c.key)
      let moving = 0
      let contrary = 0
      notes.forEach((n, i) => {
        const m = ctx.melody[i]
        // Below the melody, a 3rd or more.
        expect(midi(m.note) - midi(n.note)).toBeGreaterThanOrEqual(3)
        if (!inKey(key, n.note)) expect(n.tags).toContain('chromatic')
        if (i === 0) return
        const prev = notes[i - 1]
        const pm = ctx.melody[i - 1]
        const md = Math.sign(midi(m.note) - midi(pm.note))
        const cd = Math.sign(midi(n.note) - midi(prev.note))
        if (md !== 0) {
          moving++
          if (cd === -md) contrary++
        }
        // No parallel 5ths or octaves.
        const was = (midi(pm.note) - midi(prev.note)) % 12
        const now = (midi(m.note) - midi(n.note)) % 12
        if (md !== 0 && cd !== 0 && (now === 0 || now === 7)) {
          expect(was).not.toBe(now)
        }
      })
      // Mostly against the melody.
      expect(contrary).toBeGreaterThanOrEqual(moving / 2)
    })
  }
})
