// The next-chord ranker (PLAN Phase 4 task 4, SPEC 6.1–6.2). It takes the
// generators' candidates, moves their scores for the section's context
// (overused chords, phrase ends, a tonic that hasn't arrived) with one note
// per effect, shows six to eight across categories, grouped by category,
// and picks a wildcard: a valid but unlikely move, the same one for the same
// input, with Another stepping through the rest.
import { chordKey, sortSuggestions, suggestionCategory } from './suggestion'
import type { SuggestionCategory } from './suggestion'
import type { ChordName } from './chord-symbol'
import { chordSymbol } from './chord'
import { parseInterval, transpose } from './interval'
import type { Interval } from './interval'
import { keyName, romanNumeral } from './numeral'
import type { Key } from './scale'
import {
  nextChordCandidates,
  type NextChordContext,
  type NextChordSuggestion,
} from './next-chord'
import { CONTEXT_EFFECTS, RANKING } from './ranker-data'

export { CONTEXT_EFFECTS, RANKING } from './ranker-data'

export type SuggestionGroup = {
  category: SuggestionCategory
  suggestions: NextChordSuggestion[]
}

export type RankedChords = {
  // The suggestions shown, in rank order, and the same grouped by category,
  // groups in the order of their best suggestion.
  shown: NextChordSuggestion[]
  groups: SuggestionGroup[]
  wildcard?: NextChordSuggestion
  // How many moves Another steps through before the wildcard repeats.
  wildcards: number
}

const PERFECT_5TH = parseInterval('P5') as Interval

function sameNote(a: { letter: string; accidental: number }, b: typeof a) {
  return a.letter === b.letter && a.accidental === b.accidental
}

// A root-position chord on the given root: a tonic or dominant arrival.
function isOn(chord: ChordName, root: ChordName['root']): boolean {
  return !chord.bass && sameNote(chord.root, root)
}

function times(count: number): string {
  if (count === 2) return 'twice'
  if (count === 3) return 'three times'
  return `${count} times`
}

type Effect = { amount: number; note: string }

// The context effects on one candidate (SPEC 6.1), each with the line the
// ⓘ panel shows for it.
function contextEffects(
  key: Key,
  previous: readonly ChordName[],
  candidate: ChordName,
): Effect[] {
  const effects: Effect[] = []
  const symbol = chordSymbol(candidate)
  // One earlier use is ordinary repetition; from the second, each use
  // counts against the chord (SPEC 6.2: "you've used Am three times").
  const used = previous.filter(
    (c) => chordKey(c) === chordKey(candidate),
  ).length
  if (used >= 2) {
    effects.push({
      amount: -CONTEXT_EFFECTS.overuse * (used - 1),
      note: `Ranked lower: you’ve used ${symbol} ${times(used)}`,
    })
  }
  if (previous.length === 0) return effects
  // A tonic arrival is the key's own chord on the tonic (C or Cmaj7 in C,
  // not C7 or Cm) or a tonic power chord; a half cadence lands on a major V.
  const tonic =
    isOn(candidate, key.tonic) &&
    (candidate.quality === '5' ||
      romanNumeral(key, candidate).kind === 'diatonic')
  const dominant =
    isOn(candidate, transpose(key.tonic, PERFECT_5TH)) &&
    ['M', '7', '5'].includes(candidate.quality)
  const bar = previous.length + 1
  const { phraseEnd, halfPhrase, tonicPending } = CONTEXT_EFFECTS
  if (bar % phraseEnd.every === 0) {
    if (tonic) {
      effects.push({
        amount: phraseEnd.tonic,
        note: `Ranked higher: bar ${bar} ends a phrase, a place to land on the tonic`,
      })
    }
  } else if (bar % halfPhrase.every === 0) {
    if (tonic || dominant) {
      effects.push({
        amount: tonic ? halfPhrase.tonic : halfPhrase.dominant,
        note: `Ranked higher: bar ${bar} ends half a phrase, a place to ${tonic ? 'come home' : 'pause on V'}`,
      })
    }
  }
  if (
    tonic &&
    previous.length >= tonicPending.after &&
    !previous.some((c) => sameNote(c.root, key.tonic))
  ) {
    effects.push({
      amount: tonicPending.bonus,
      note: `Ranked higher: the tonic hasn’t arrived yet after ${previous.length} chords`,
    })
  }
  return effects
}

function withContext(
  context: NextChordContext,
  suggestion: NextChordSuggestion,
): NextChordSuggestion {
  const effects = contextEffects(
    context.key,
    context.previous,
    suggestion.candidate,
  )
  if (!effects.length) return suggestion
  const score = effects.reduce((sum, e) => sum + e.amount, suggestion.score)
  return {
    ...suggestion,
    score: Math.max(0, score),
    contextNotes: [...suggestion.contextNotes, ...effects.map((e) => e.note)],
  }
}

// The suggestions to show: the best first, at most perCategory from any one
// category, at least min and at most max, and past min only those scoring
// at least keepAbove of the top score. A move weighted out by the style
// (score 0) is never shown, though the wildcard can find it.
function pick(sorted: NextChordSuggestion[]): NextChordSuggestion[] {
  const usable = sorted.filter((s) => s.score > 0)
  const top = usable[0]?.score ?? 0
  const shown: NextChordSuggestion[] = []
  const perCategory = new Map<string, number>()
  for (const s of usable) {
    if (shown.length >= RANKING.max) break
    if (shown.length >= RANKING.min && s.score < top * RANKING.keepAbove) {
      break
    }
    const category = suggestionCategory(s) ?? ''
    const count = perCategory.get(category) ?? 0
    if (count >= RANKING.perCategory) continue
    perCategory.set(category, count + 1)
    shown.push(s)
  }
  // Too few categories to reach min: fill with the best of the rest.
  for (const s of usable) {
    if (shown.length >= RANKING.min) break
    if (!shown.includes(s)) shown.push(s)
  }
  return sortSuggestions(shown, chordKey) as NextChordSuggestion[]
}

function group(shown: NextChordSuggestion[]): SuggestionGroup[] {
  const groups: SuggestionGroup[] = []
  for (const s of shown) {
    const category = suggestionCategory(s)
    if (!category) continue
    const found = groups.find((g) => g.category === category)
    if (found) found.suggestions.push(s)
    else groups.push({ category, suggestions: [s] })
  }
  return groups
}

// A 32-bit FNV-1a hash: the wildcard's seed, derived from the input so the
// same input always gives the same wildcard (SPEC 6.2).
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

function seedOf(context: NextChordContext): number {
  const weights = Object.entries(context.weights ?? {})
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, w]) => `${id}=${w}`)
    .join(',')
  return hash(
    [
      keyName(context.key),
      context.previous.map(chordKey).join(' '),
      weights,
    ].join('|'),
  )
}

// The wildcard pool: the lower-scoring share of the moves not shown, lowest
// first. Weighted-out moves are in it, so a wildcard can come from outside
// the current style.
function wildcardPool(
  sorted: NextChordSuggestion[],
  shown: NextChordSuggestion[],
): NextChordSuggestion[] {
  const rest = sorted.filter((s) => !shown.includes(s)).reverse()
  return rest.slice(0, Math.ceil(rest.length * RANKING.wildcardShare))
}

// The ranked next chords for the context. another counts presses of
// Another: each steps to the next wildcard, and none repeats until the pool
// wraps round.
export function rankNextChords(
  context: NextChordContext,
  options: { another?: number } = {},
): RankedChords {
  const sorted = sortSuggestions(
    nextChordCandidates(context).map((s) => withContext(context, s)),
    chordKey,
  ) as NextChordSuggestion[]
  const shown = pick(sorted)
  const pool = wildcardPool(sorted, shown)
  const ranked: RankedChords = {
    shown,
    groups: group(shown),
    wildcards: pool.length,
  }
  if (pool.length) {
    const at = (seedOf(context) + (options.another ?? 0)) % pool.length
    ranked.wildcard = pool[at]
  }
  return ranked
}
