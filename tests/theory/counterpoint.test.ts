import { describe, expect, it } from 'vitest'
import {
  SPECIES,
  addDur,
  checkCounterpoint,
  compareDur,
  counterpoint,
  counterpointAlternatives,
  counterpointId,
  counterpointOptions,
  dur,
  editCounterpoint,
  formatNote,
  layOut,
  midiNumber,
  parseChordSymbol,
  parseNote,
  pruneCounterpointEdits,
  setCounterpointEdit,
  typeMelody,
  type CounterpointOptions,
  type Dur,
  type HarmonyContext,
  type MeterMap,
} from '../../src/theory'
import { CANTUS, RHYTHMIC, counterpointChecks } from '../fixtures/counterpoint'

const FOUR: MeterMap = { meter: { num: 4, den: 4 } }

function keyOf(text: string) {
  const [tonic, mode] = text.split(' ')
  return { tonic: parseNote(tonic)!, mode }
}

function value(text: string): Dur {
  const [n, d] = text.split('/').map(Number)
  return dur(n, d ?? 1)
}

function cantusContext(key: string, melody: string): HarmonyContext {
  return {
    melody: typeMelody(melody, dur(1, 1)).notes,
    key: keyOf(key),
    chords: [],
    time: FOUR,
  }
}

function rhythmicContext(r: (typeof RHYTHMIC)[number]): HarmonyContext {
  const key = keyOf(r.key)
  const time: MeterMap = { meter: { num: r.meter[0], den: r.meter[1] } }
  const timing = layOut(
    r.chords.map(() => undefined),
    time,
  )
  return {
    melody: typeMelody(r.melody, value(r.value)).notes,
    key,
    chords: r.chords.map((s, i) => ({
      chord: parseChordSymbol(s)!,
      key,
      start: timing[i].start,
      length: timing[i].length,
    })),
    time,
  }
}

const ALL: CounterpointOptions[] = SPECIES.flatMap((s) =>
  (['above', 'below'] as const).flatMap((side) =>
    (['strict', 'freer'] as const).map((mode) => ({
      species: s.id,
      side,
      mode,
    })),
  ),
)

const end = (n: { onset: Dur; length: Dur }) => addDur(n.onset, n.length)
const midi = (n: { note: Parameters<typeof midiNumber>[0] }) =>
  midiNumber(n.note) as number

describe('checking counterpoint against the rules (golden)', () => {
  for (const f of counterpointChecks) {
    it(f.name, () => {
      const ctx = cantusContext(f.key, f.melody)
      const line = typeMelody(f.line, value(f.value)).notes
      const o = { species: f.species, side: f.side, mode: f.mode }
      const { breaks, notes } = checkCounterpoint(ctx, o, line)
      expect(breaks.map((b) => `${b.ruleId}@${b.place}`)).toEqual(f.breaks)
      // Every break is in words, and on its note.
      for (const b of breaks) {
        expect(b.text.length).toBeGreaterThan(10)
        expect(notes[b.place].tags).toContain('break')
        expect(notes[b.place].explanation).toContain(b.text)
      }
      notes.forEach((n) => expect(n.explanation.length).toBeGreaterThan(0))
    })
  }
})

describe('suspensions and the leading note', () => {
  it('a 2nd above held over and falling to a unison is no suspension', () => {
    const ctx = cantusContext('C major', 'C4 D4 E4 D4 C4')
    const line = typeMelody('r C5 - B4 - E4 - B4 C5 -', dur(1, 2)).notes
    const o = { species: 4, side: 'above', mode: 'strict' } as const
    expect(
      checkCounterpoint(ctx, o, line).breaks.map((b) => b.ruleId),
    ).toContain('cp-suspension')
  })

  it('Phrygian keeps its own 2nd: no raised leading note', () => {
    const ctx = cantusContext('E phrygian', 'E4 F4 E4')
    const line = typeMelody('B4 D#5 E5', dur(1, 1)).notes
    const o = { species: 1, side: 'above', mode: 'strict' } as const
    expect(
      checkCounterpoint(ctx, o, line).breaks.map(
        (b) => `${b.ruleId}@${b.place}`,
      ),
    ).toContain('cp-key@1')
  })

  it('the cadence names the note to raise', () => {
    const f = counterpointChecks.find((x) => x.name.includes('no leading'))!
    const ctx = cantusContext(f.key, f.melody)
    const line = typeMelody(f.line, value(f.value)).notes
    const [b] = checkCounterpoint(ctx, f, line).breaks
    expect(b.text).toContain('raise C5 to C♯5')
  })
})

describe('a line against each cantus firmus', () => {
  for (const c of CANTUS) {
    const ctx = cantusContext(c.key, c.melody)
    for (const o of ALL) {
      it(`${c.name}, ${counterpointId(o)}`, () => {
        const line = counterpoint(ctx, o)
        // Strict and freer lines keep every rule against a textbook cantus.
        expect(
          line.breaks.map((b) => `${b.ruleId}@${b.place}: ${b.text}`),
        ).toEqual([])
        // Checking the line again finds the same.
        expect(checkCounterpoint(ctx, o, line.notes).breaks).toEqual([])
        expect(line.notes.at(-1)!.tags).toContain('cadence')
      })
    }
  }
})

describe('the rhythm of each species', () => {
  const c = CANTUS[0]
  const ctx = cantusContext(c.key, c.melody)
  const count = ctx.melody.length
  const onsetsIn = (line: { onset: Dur }[], i: number) =>
    line.filter(
      (n) =>
        compareDur(n.onset, ctx.melody[i].onset) >= 0 &&
        compareDur(n.onset, end(ctx.melody[i])) < 0,
    ).length
  const of = (species: CounterpointOptions['species']) =>
    counterpoint(ctx, { species, side: 'above', mode: 'strict' }).notes

  it('first species: a note against each', () => {
    const line = of(1)
    expect(line).toHaveLength(count)
    line.forEach((n, i) => {
      expect(n.onset).toEqual(ctx.melody[i].onset)
      expect(n.length).toEqual(ctx.melody[i].length)
    })
  })
  it('second species: two against each, one at the end', () => {
    const line = of(2)
    for (let i = 0; i < count - 1; i++) expect(onsetsIn(line, i)).toBe(2)
    expect(onsetsIn(line, count - 1)).toBe(1)
  })
  it('third species: four against each, one at the end', () => {
    const line = of(3)
    for (let i = 0; i < count - 1; i++) expect(onsetsIn(line, i)).toBe(4)
    expect(onsetsIn(line, count - 1)).toBe(1)
  })
  it('fourth species: a rest, then notes tied across each beat', () => {
    const line = of(4)
    expect(line[0].onset).toEqual(dur(1, 2))
    const tied = line.filter((n) =>
      ctx.melody.some(
        (m) =>
          compareDur(m.onset, n.onset) > 0 && compareDur(m.onset, end(n)) < 0,
      ),
    )
    expect(tied.length).toBeGreaterThanOrEqual(count - 3)
    expect(line.at(-1)!.onset).toEqual(ctx.melody.at(-1)!.onset)
  })
  it('fifth species: a mix, ending on a note of its own', () => {
    const line = of(5)
    expect(line.length).toBeGreaterThan(count)
    const lengths = new Set(line.map((n) => `${n.length.n}/${n.length.d}`))
    expect(lengths.size).toBeGreaterThan(1)
    expect(line.at(-1)!.onset).toEqual(ctx.melody.at(-1)!.onset)
  })
  it('a note too short to split gets fewer notes', () => {
    // Quavers: four against one would be demisemiquavers, so two.
    const r = RHYTHMIC.find((x) => x.meter[1] === 8)!
    const quick = rhythmicContext(r)
    const line = counterpoint(quick, {
      species: 3,
      side: 'below',
      mode: 'strict',
    }).notes
    line.forEach((n) =>
      expect(compareDur(n.length, dur(1, 16))).toBeGreaterThanOrEqual(0),
    )
    expect(
      line.filter((n) => compareDur(n.onset, quick.melody[0].length) < 0),
    ).toHaveLength(2)
  })
})

describe('lines against melodies with rhythm', () => {
  for (const r of RHYTHMIC) {
    const ctx = rhythmicContext(r)
    for (const o of ALL) {
      it(`${r.name}, ${counterpointId(o)}`, () => {
        const line = counterpoint(ctx, o)
        expect(line.notes.length).toBeGreaterThan(0)
        line.notes.forEach((n, i) => {
          // Sounding only with the melody, on its own side, within a 12th.
          const under = ctx.melody.find(
            (m) =>
              compareDur(m.onset, n.onset) <= 0 &&
              compareDur(n.onset, end(m)) < 0,
          )
          expect(under).toBeDefined()
          const gap = midi(n) - midi(under!)
          if (o.side === 'above') expect(gap).toBeGreaterThanOrEqual(0)
          else expect(gap).toBeLessThanOrEqual(0)
          expect(Math.abs(gap)).toBeLessThanOrEqual(19)
          // Notes don't overlap.
          if (i > 0) {
            expect(
              compareDur(end(line.notes[i - 1]), n.onset),
            ).toBeLessThanOrEqual(0)
          }
          expect(n.explanation.length).toBeGreaterThan(0)
        })
        // Every break is tagged on its note and explained.
        for (const b of line.breaks) {
          expect(line.notes[b.place].tags).toContain('break')
          expect(line.notes[b.place].explanation).toContain(b.text)
        }
        // No parallel 5ths or octaves, ever.
        expect(line.breaks.filter((b) => b.ruleId === 'cp-parallel')).toEqual(
          [],
        )
      })
    }
  }

  it('the same melody gives the same line', () => {
    const ctx = rhythmicContext(RHYTHMIC[0])
    const o: CounterpointOptions = { species: 5, side: 'above', mode: 'freer' }
    expect(counterpoint(ctx, o)).toEqual(counterpoint(ctx, o))
  })

  it('freer lines lean on the chords on the beat', () => {
    const ctx = rhythmicContext(RHYTHMIC[0])
    const tones = (mode: 'strict' | 'freer') =>
      counterpoint(ctx, { species: 1, side: 'below', mode }).notes.filter((n) =>
        n.tags.includes('chord-tone'),
      ).length
    expect(tones('freer')).toBeGreaterThan(0)
    expect(tones('strict')).toBe(0)
  })
})

describe('line ids', () => {
  it('round-trips every option', () => {
    for (const o of ALL)
      expect(counterpointOptions(counterpointId(o))).toEqual(o)
    expect(counterpointOptions('6-above-strict')).toBeUndefined()
    expect(counterpointOptions('1-over-strict')).toBeUndefined()
  })
})

describe('your own notes in a line', () => {
  const c = CANTUS[0]
  const ctx = cantusContext(c.key, c.melody)
  const o: CounterpointOptions = { species: 1, side: 'above', mode: 'strict' }
  const line = counterpoint(ctx, o).notes

  it('a note changed is checked against the rules', () => {
    // A unison with the melody's third note, on the beat.
    const edits = setCounterpointEdit(
      ctx.melody,
      line,
      [],
      2,
      ctx.melody[2].note,
    )
    const edited = editCounterpoint(ctx, o, line, edits)
    expect(edited).toHaveLength(line.length)
    expect(edited[2].edited).toBe(true)
    expect(edited[2].tags).toContain('edited')
    expect(edited[2].tags).toContain('break')
    expect(edited[2].explanation).toMatch(/unison/)
  })

  it('a note taken out leaves a rest', () => {
    const edits = setCounterpointEdit(ctx.melody, line, [], 3)
    const edited = editCounterpoint(ctx, o, line, edits)
    expect(edited).toHaveLength(line.length - 1)
    expect(edited.map((n) => n.place)).not.toContain(3)
  })

  it('an edit goes when the melody note under it changes', () => {
    const edits = setCounterpointEdit(ctx.melody, line, [], 4, parseNote('D5')!)
    expect(pruneCounterpointEdits(ctx.melody, edits, line)).toHaveLength(1)
    const changed = ctx.melody.map((m, i) =>
      i === 4 ? { ...m, note: parseNote('A4')! } : m,
    )
    expect(pruneCounterpointEdits(changed, edits, line)).toHaveLength(0)
    expect(pruneCounterpointEdits(changed, edits)).toHaveLength(0)
  })

  it('notes offered in its place: those keeping the rules first', () => {
    const placed = editCounterpoint(ctx, o, line, [])
    const offered = counterpointAlternatives(ctx, o, placed, 4, line[4].note)
    expect(offered.length).toBeGreaterThan(1)
    expect(offered.map((x) => formatNote(x.candidate.note))).not.toContain(
      formatNote(line[4].note),
    )
    expect(offered[0].tags).not.toContain('break')
    const firstBreak = offered.findIndex((x) => x.tags.includes('break'))
    if (firstBreak >= 0) {
      offered
        .slice(firstBreak)
        .forEach((x) => expect(x.tags).toContain('break'))
    }
  })
})
