// Phase 6 task 4: each line is a Suggestion, tagged and explained, ranked
// within its group.
import { describe, expect, it } from 'vitest'
import {
  LINE_GROUPS,
  LINE_MODES,
  layOut,
  lineSuggestions,
  parseChordSymbol,
  parseMeter,
  parseNote,
  type Key,
  type LineStep,
} from '../../src/theory'

function stepsOf(keyText: string, chords: string, meter = '4/4'): LineStep[] {
  const [tonic, mode] = keyText.split(' ')
  const key: Key = { tonic: parseNote(tonic)!, mode }
  const symbols = chords.split(' ')
  const placed = layOut(
    symbols.map(() => undefined),
    { meter: parseMeter(meter)! },
  )
  return symbols.map((s, i) => ({
    chord: parseChordSymbol(s)!,
    key,
    placed: placed[i],
  }))
}

const progressions: [string, string, string][] = [
  ['C major', 'Dm7 G7 Cmaj7 A7', '4/4'],
  ['A natural-minor', 'Am Dm E7 Am', '4/4'],
  ['G major', 'G Em C D7', '3/4'],
  ['E natural-minor', 'Em C G D', '6/8'],
]

describe('lines as suggestions', () => {
  it.each(progressions)(
    'offers every mode, grouped, over %s %s',
    (key, chords, meter) => {
      const found = lineSuggestions(stepsOf(key, chords, meter))
      expect(found).toHaveLength(LINE_MODES.length)
      // Grouped in the groups' order, ranked by score within each.
      const groups = found.map((s) => s.tags[0])
      expect(groups).toEqual(
        LINE_GROUPS.flatMap((g) =>
          LINE_MODES.filter((m) => m.group === g.id).map(() => g.id),
        ),
      )
      for (const g of LINE_GROUPS) {
        const scores = found
          .filter((s) => s.tags[0] === g.id)
          .map((s) => s.score)
        expect(scores).toEqual([...scores].sort((a, b) => b - a))
      }
      for (const s of found) {
        expect(Number.isFinite(s.score)).toBe(true)
        expect(s.ruleIds[0]).toBe(`line-mode-${s.candidate.mode.id}`)
        expect(s.explanation).not.toMatch(/[{}]/)
        expect(s.more).toMatch(/note/)
        // Its tags cover every tag its notes carry.
        for (const n of s.candidate.notes) {
          for (const t of n.tags) expect(s.tags).toContain(t)
        }
      }
    },
  )

  it('ranks the same way every time', () => {
    const steps = stepsOf('C major', 'C Am F G')
    const ids = (list: ReturnType<typeof lineSuggestions>) =>
      list.map((s) => `${s.candidate.mode.id} ${s.score}`)
    expect(ids(lineSuggestions(steps))).toEqual(ids(lineSuggestions(steps)))
  })

  it('counts what it explains', () => {
    const found = lineSuggestions(stepsOf('C major', 'Dm7 G7 Cmaj7 A7'))
    const walking = found.find((s) => s.candidate.mode.id === 'walking')!
    const approaches = walking.candidate.notes.filter((n) =>
      n.tags.includes('approach'),
    ).length
    expect(walking.explanation).toContain(`${approaches} approach notes`)
    const pedal = found.find((s) => s.candidate.mode.id === 'pedal')!
    expect(pedal.explanation).toMatch(/^C held under every chord, against/)
  })

  it('notes what moved a line up or down', () => {
    const found = lineSuggestions(stepsOf('C major', 'Dm7 G7 Cmaj7 A7'))
    const byId = (id: string) => found.find((s) => s.candidate.mode.id === id)!
    expect(byId('guide-3rd').contextNotes).toContain(
      'Ranked higher: it moves by step or less.',
    )
    expect(byId('chromatic').contextNotes.join(' ')).toMatch(
      /Ranked lower: .* outside C major/,
    )
    expect(byId('roots').contextNotes).toContain(
      'Ranked higher: every strong beat is a chord tone.',
    )
  })

  it('ranks scale steps above chromatic lines in a diatonic progression', () => {
    const found = lineSuggestions(stepsOf('C major', 'C F G C'))
    const between = found
      .filter((s) => s.tags[0] === 'between')
      .map((s) => s.candidate.mode.id)
    expect(between.indexOf('scale-steps')).toBeLessThan(
      between.indexOf('chromatic'),
    )
  })

  it('offers nothing without chords', () => {
    expect(lineSuggestions([])).toEqual([])
  })
})

describe('the Wildcard line', () => {
  const steps = stepsOf('C major', 'C Am F G C Am F G')
  const wild = (roll = 0) =>
    lineSuggestions(steps, roll).find((s) => s.tags[0] === 'wildcard')!
  const notes = (roll = 0) =>
    wild(roll).candidate.notes.map((n) => `${n.midi}@${n.onset.n}/${n.onset.d}`)

  it('comes last, as its own group', () => {
    const found = lineSuggestions(steps)
    expect(found.at(-1)?.candidate.mode.id).toBe('wildcard')
    expect(found.at(-1)?.tags[0]).toBe('wildcard')
  })

  it('rolls the same for the same chords, and fresh for Another', () => {
    expect(notes()).toEqual(notes())
    const rolls = new Set([0, 1, 2, 3, 4].map((r) => notes(r).join()))
    expect(rolls.size).toBeGreaterThan(1)
  })

  it('mixes its moves and explains them', () => {
    const tags = new Set(
      [0, 1, 2, 3].flatMap((r) =>
        wild(r).candidate.notes.map((n) => n.tags[0]),
      ),
    )
    expect(tags.has('passing') || tags.has('neighbour')).toBe(true)
    expect(tags.has('approach')).toBe(true)
    expect(wild().explanation).toMatch(
      /^Chance picked the move into each chord/,
    )
  })
})
