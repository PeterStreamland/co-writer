// Passing chords (PLAN Phase 4 task 7, SPEC 6.7): chords to put between two
// chords in the strip. Each candidate that could follow the first chord is
// scored again by how strongly it leads into the second (its dominant, its
// leading-note chord, a fall of a 5th, a tritone substitute, the key's
// function flow, or a step), and its explanation says how; its reading after
// the first chord moves to More.
import { qualityNumeral } from './chord'
import type { ChordName } from './chord-symbol'
import { chordSymbol } from './chord'
import {
  degreeLabel,
  parseInterval,
  transpose,
  transposeDown,
} from './interval'
import type { Interval } from './interval'
import { chordInsight } from './insight'
import { romanNumeral } from './numeral'
import { DEGREE_FUNCTIONS, FUNCTION_FLOW } from './next-chord-data'
import {
  nextChordCandidates,
  type NextChordContext,
  type NextChordSuggestion,
} from './next-chord'
import { PASSING, PASSING_LEADS } from './passing-data'
import { presentRanked, seedOf, type RankedChords } from './ranker'
import type { Key } from './scale'
import { chordKey, fillTemplate, sortSuggestions } from './suggestion'

export type PassingContext = NextChordContext & {
  // The chord the passing chord leads into.
  next: ChordName
}

const P5 = parseInterval('P5') as Interval
const M2 = parseInterval('M2') as Interval
const m2 = parseInterval('m2') as Interval

// Roots match by spelling, not sound (SPEC 4): D♯ is not E♭, so D♯dim7
// does not fall a 5th into A♭.
function sameNote(a: ChordName['root'], b: ChordName['root']): boolean {
  return a.letter === b.letter && a.accidental === b.accidental
}

const FUNCTION_NAMES = {
  tonic: 'tonic',
  predominant: 'predominant',
  dominant: 'dominant',
} as const

// How a chord leads into the next one: the strongest of the relations, with
// its lead (0–5), rule id and first line.
function leadInto(
  key: Key,
  chord: ChordName,
  next: ChordName,
): { lead: number; id: string; text: string } {
  const values = { chord: chordSymbol(chord), next: chordSymbol(next) }
  const role = qualityNumeral(chord.quality)?.secondary
  const found: { lead: number; id: string; text: string }[] = []
  const add = (
    rule: (typeof PASSING_LEADS)[keyof typeof PASSING_LEADS],
    lead: number = rule.lead,
    extra: Record<string, string> = {},
  ) =>
    found.push({
      lead,
      id: rule.id,
      text: fillTemplate(rule.template, { ...values, ...extra }),
    })
  const fifthAbove = sameNote(chord.root, transpose(next.root, P5))
  if (fifthAbove && role === 'dominant') add(PASSING_LEADS.dominant)
  else if (fifthAbove) add(PASSING_LEADS.fifth)
  if (
    sameNote(chord.root, transposeDown(next.root, m2)) &&
    role === 'leading-note'
  ) {
    add(PASSING_LEADS.leadingNote)
  }
  if (
    sameNote(chord.root, transpose(next.root, m2)) &&
    role === 'dominant' &&
    chord.quality !== 'M'
  ) {
    add(PASSING_LEADS.tritoneSub)
  }
  // A secondary chord (E7 as V7/vi) has dominant function whatever degree
  // its root sits on.
  const reading = romanNumeral(key, chord)
  const from =
    reading.kind === 'secondary'
      ? 'dominant'
      : DEGREE_FUNCTIONS[degreeLabel(key.tonic, chord.root)]
  const to = DEGREE_FUNCTIONS[degreeLabel(key.tonic, next.root)]
  if (from && to) {
    add(PASSING_LEADS.flow, FUNCTION_FLOW[from][to].score * PASSING.flowScale, {
      from: FUNCTION_NAMES[from],
      to: FUNCTION_NAMES[to],
    })
  }
  const step = [m2, M2].some(
    (i) =>
      sameNote(chord.root, transpose(next.root, i)) ||
      sameNote(chord.root, transposeDown(next.root, i)),
  )
  if (step) add(PASSING_LEADS.step)
  // Strongest first; on a tie the relation found first (the more specific)
  // wins, as the sort is stable.
  found.sort((a, b) => b.lead - a.lead)
  if (found[0]) return found[0]
  // Nothing pulls: say how the root moves into the next chord.
  const motion = chordInsight(key, next, chord).motion ?? ''
  return {
    lead: PASSING_LEADS.other.lead,
    id: PASSING_LEADS.other.id,
    text: fillTemplate(PASSING_LEADS.other.template, {
      ...values,
      motion: motion.replace(/^The root/, 'its root').replace(/\.$/, ''),
    }),
  }
}

// The ranked passing chords between the last chord of the context and the
// next one: six to eight across categories, and a wildcard.
export function rankPassingChords(
  context: PassingContext,
  options: { another?: number } = {},
): RankedChords {
  const { key, next } = context
  const first = context.previous.at(-1)
  const scored = nextChordCandidates(context)
    .filter(
      (s) =>
        !s.keyChange &&
        chordKey(s.candidate) !== chordKey(next) &&
        (!first || chordKey(s.candidate) !== chordKey(first)),
    )
    .map((s): NextChordSuggestion => {
      const into = leadInto(key, s.candidate, next)
      const stays =
        first !== undefined &&
        sameNote(s.candidate.root, first.root) &&
        qualityNumeral(s.candidate.quality)?.secondary !== 'dominant'
      const lead = into.lead * (stays ? PASSING.sameRootFactor : 1)
      return {
        ...s,
        score: s.score * PASSING.fromWeight + lead,
        ruleIds: [...s.ruleIds, into.id],
        // The card says how it leads in; its reading after the first chord
        // moves under More.
        explanation: into.text || s.explanation,
        more: [into.text ? s.explanation : '', s.more ?? '']
          .filter(Boolean)
          .join(' '),
      }
    })
  const sorted = sortSuggestions(scored, chordKey) as NextChordSuggestion[]
  const seed = seedOf({ ...context, previous: [...context.previous, next] })
  return presentRanked(sorted, seed, options.another)
}
