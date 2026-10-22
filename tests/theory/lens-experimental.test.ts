import { describe, expect, it } from 'vitest'
import {
  EXPERIMENTAL_LENSES,
  chordNotes,
  chordSymbol,
  formatNote,
  intervalBetween,
  lensVoicings,
  midiNumber,
  pitchClass,
  scaleNotes,
  seededRandom,
  voiceProgression,
  type ChordName,
  type Key,
  type LensVoicing,
  type Note,
} from '../../src/theory'
import { chord, key, progressions, steps } from '../lens-helpers'

const midi = (n: Note) => midiNumber(n) as number
const show = (notes: Note[]) =>
  notes.map((n) => formatNote(n, { ascii: true })).join(' ')

// Every pitch class the key or the chord has.
function allowed(k: Key, c: ChordName): Set<number> {
  return new Set(
    [...scaleNotes(k.tonic, k.mode), ...chordNotes(c)].map(pitchClass),
  )
}

// Whether a note not in the chord sits a semitone above one that is.
function clashes(c: ChordName, n: Note): boolean {
  const own = chordNotes(c).map(pitchClass)
  const pc = pitchClass(n)
  return !own.includes(pc) && own.some((o) => pc === (o + 1) % 12)
}

const CASES: [string, string][] = [
  ['C major', 'C'],
  ['C major', 'Am'],
  ['C major', 'G7'],
  ['C major', 'Dm7'],
  ['A minor', 'E7'],
  ['E minor', 'D'],
  ['G major', 'Cmaj7'],
]

function offered(lens: string, k: string, c: string, form: string) {
  return lensVoicings(lens as never, key(k), chord(c)).filter(
    (v) => v.form === form,
  )
}

function checkKeyNotes(k: string, c: string, voicings: LensVoicing[]) {
  for (const v of voicings) {
    const pool = allowed(key(k), chord(c))
    for (const n of v.notes) {
      expect(pool.has(pitchClass(n)), `${c}: ${show(v.notes)}`).toBe(true)
      expect(clashes(chord(c), n), `${c}: ${show(v.notes)}`).toBe(false)
    }
  }
}

describe('experimental lenses', () => {
  it.each(CASES)('quartal stacks 4ths of the key over %s %s', (k, c) => {
    const found = offered('quartal', k, c, 'quartal')
    checkKeyNotes(k, c, found)
    for (const v of found) {
      const upper = v.notes.slice(1)
      const fourths = upper.slice(1).filter((n, i) => {
        const interval = intervalBetween(upper[i], n)
        return interval.quality === 'P' && interval.number === 4
      }).length
      expect(fourths, show(v.notes)).toBeGreaterThanOrEqual(2)
      const own = new Set(chordNotes(chord(c)).map(pitchClass))
      const sounded = new Set(
        v.notes.map(pitchClass).filter((pc) => own.has(pc)),
      )
      expect(sounded.size, show(v.notes)).toBeGreaterThanOrEqual(2)
    }
  })

  it('finds the So What voicing over Dm7 in C', () => {
    const shapes = offered('quartal', 'C major', 'Dm7', 'quartal').map((v) =>
      show(v.notes.slice(1)),
    )
    // E A D G B: 4ths with a major 3rd on top (Bill Evans, "So What").
    expect(shapes).toContain('E3 A3 D4 G4 B4')
  })

  it.each(CASES)('clusters pack %s %s close with a 2nd', (k, c) => {
    const found = offered('cluster', k, c, 'cluster')
    expect(found.length).toBeGreaterThan(0)
    checkKeyNotes(k, c, found)
    for (const v of found) {
      const upper = v.notes.slice(1).map(midi)
      expect(upper.at(-1)! - upper[0]).toBeLessThanOrEqual(7)
      expect(upper.some((m, i) => i > 0 && m - upper[i - 1] <= 2)).toBe(true)
    }
  })

  it.each(CASES)('upper structures float a key triad over %s %s', (k, c) => {
    const found = offered('upper', k, c, 'upper')
    checkKeyNotes(k, c, found)
    for (const v of found) {
      expect(pitchClass(v.notes[0])).toBe(pitchClass(chord(c).root))
      expect(v.label).toMatch(/ over /)
    }
  })

  it('puts Em over C in C, adding the major 7th', () => {
    const labels = offered('upper', 'C major', 'C', 'upper').map((v) => v.label)
    expect(labels).toContain('Em over C')
  })

  it('holds the tonic under every chord in the drone lens', () => {
    for (const p of progressions) {
      const tonic = pitchClass(p.steps[0].key.tonic)
      for (const c of voiceProgression('drone', p.steps)) {
        const lowest = c.voicing.notes.reduce((a, b) =>
          midi(b) < midi(a) ? b : a,
        )
        // Key changes move the drone to the new key's tonic.
        expect([tonic, pitchClass(p.steps.at(-1)!.key.tonic)]).toContain(
          pitchClass(lowest),
        )
      }
    }
    const voiced = voiceProgression('drone', steps('C major', 'C F G C'))
    expect(
      voiced.map((c) => chordSymbol(c.voicing.chord, { ascii: true })),
    ).toEqual(['C', 'F/C', 'G/C', 'C'])
  })

  it('voices every test progression in every experimental lens', () => {
    for (const p of progressions) {
      for (const lens of EXPERIMENTAL_LENSES) {
        const voiced = voiceProgression(lens, p.steps, seededRandom(1))
        expect(voiced).toHaveLength(p.steps.length)
      }
    }
  })
})

describe('the Wildcard', () => {
  const p = steps('C major', 'C Am F G7 C')
  const result = (seed: number) =>
    voiceProgression('wildcard', p, seededRandom(seed)).map((c) =>
      show(c.voicing.notes),
    )

  it('gives the same result for the same roll', () => {
    expect(result(42)).toEqual(result(42))
  })

  it('gives different results for different rolls', () => {
    const seen = new Set([1, 2, 3, 4, 5, 6].map((s) => result(s).join(' | ')))
    expect(seen.size).toBeGreaterThan(1)
  })

  it('says which lens each voicing came from', () => {
    for (const c of voiceProgression('wildcard', p, seededRandom(9))) {
      expect(c.voicing.label).toMatch(
        /^(Classical|Rock|Open|Jazz|Quartal|Clusters|Upper structures|Drone): /,
      )
    }
  })
})
