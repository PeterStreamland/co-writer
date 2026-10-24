import { describe, expect, it } from 'vitest'
import {
  clearHarmonyEdit,
  dur,
  editHarmony,
  formatNote,
  harmonise,
  harmonyAlternatives,
  harmonyEditAt,
  layOut,
  parseChordSymbol,
  parseNote,
  pruneHarmonyEdits,
  setHarmonyEdit,
  typeMelody,
  type HarmonyContext,
  type HarmonyEdit,
} from '../../src/theory'
import { harmonyEdits } from '../fixtures/harmony-edits'

const FOUR = { meter: { num: 4, den: 4 } }

function context(c: {
  key: string
  chords: string[]
  melody: string
}): HarmonyContext {
  const [tonic, mode] = c.key.split(' ')
  const key = { tonic: parseNote(tonic)!, mode }
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

function withEdits(ctx: HarmonyContext, edits: Record<number, string>) {
  let out: HarmonyEdit[] = []
  for (const [place, text] of Object.entries(edits)) {
    out = setHarmonyEdit(
      ctx.melody,
      out,
      Number(place),
      text ? parseNote(text)! : undefined,
    )
  }
  return out
}

// The harmony as notes, r where one is taken out.
function text(ctx: HarmonyContext, kind: string, edits: HarmonyEdit[]) {
  const notes = editHarmony(ctx, harmonise(ctx, kind).notes, edits)
  return ctx.melody
    .map((_, place) => {
      const n = notes.find((h) => h.place === place)
      return n ? formatNote(n.note) : 'r'
    })
    .join(' ')
}

describe('your own notes in a harmony (David’s request)', () => {
  for (const c of harmonyEdits) {
    it(c.name, () => {
      const ctx = context(c)
      expect(text(ctx, c.kind, withEdits(ctx, c.edits))).toBe(c.notes)
      if (!c.offered) return
      const { place, first, later } = c.offered
      const current = harmonise(ctx, c.kind).notes[place].note
      const offered = harmonyAlternatives(ctx, place, current).map((s) =>
        formatNote(s.candidate.note),
      )
      const firsts = first.split(' ')
      expect(offered.slice(0, firsts.length)).toEqual(firsts)
      expect(offered).not.toContain(formatNote(current))
      expect(new Set(offered).size).toBe(offered.length)
      if (later) expect(offered).toContain(later)
    })
  }

  const ctx = context(harmonyEdits[0])
  const kind = '3rd-above'

  it('tags a changed note as yours and explains it', () => {
    const notes = editHarmony(
      ctx,
      harmonise(ctx, kind).notes,
      withEdits(ctx, { 1: 'C5' }),
    )
    expect(notes[1].edited).toBe(true)
    expect(notes[1].tags).toContain('edited')
    expect(notes[1].tags).toContain('chord-tone')
    expect(notes[1].explanation).toMatch(/^Your choice: C in place of A/)
    expect(notes[0].edited).toBeUndefined()
    // It keeps the melody note's time.
    expect(notes[1].onset).toEqual(ctx.melody[1].onset)
  })

  it('tags a note outside the key', () => {
    const notes = editHarmony(
      ctx,
      harmonise(ctx, kind).notes,
      withEdits(ctx, { 0: 'G♯4' }),
    )
    expect(notes[0].tags).toContain('chromatic')
  })

  it('changes a note again, or puts the harmony’s own back', () => {
    let edits = withEdits(ctx, { 1: 'C5' })
    edits = setHarmonyEdit(ctx.melody, edits, 1, parseNote('D5')!)
    expect(edits).toHaveLength(1)
    expect(text(ctx, kind, edits)).toBe('G4 D5 C5 C5 B4 A4 G4 F4')
    edits = clearHarmonyEdit(ctx.melody, edits, 1)
    expect(edits).toEqual([])
    expect(text(ctx, kind, edits)).toBe('G4 A4 C5 C5 B4 A4 G4 F4')
  })

  it('drops an edit once its melody note changes', () => {
    const edits = withEdits(ctx, { 1: 'C5', 2: '' })
    const melody = ctx.melody.map((m, i) =>
      i === 1 ? { ...m, note: parseNote('D4')! } : m,
    )
    const changed = { ...ctx, melody }
    expect(harmonyEditAt(melody, edits, 1)).toBeUndefined()
    expect(harmonyEditAt(melody, edits, 2)).toBe(edits[1])
    expect(pruneHarmonyEdits(melody, edits)).toEqual([edits[1]])
    // D4's 3rd above is F4, worked out again; the G4's is still out.
    expect(text(changed, kind, edits)).toBe('G4 F4 r C5 B4 A4 G4 F4')
  })
})
