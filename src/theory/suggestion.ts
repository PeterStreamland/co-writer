// The Suggestion object (Phase 4 task 1, SPEC 12). Every engine hands back
// its candidates in this shape: the next-chord engine now, voicings, lines
// and melodies later. A suggestion carries its score, its tags, the ids of
// the rules that produced or moved it, a plain-language explanation for the
// ⓘ panel, an optional "More" with the theory behind it, and one line for
// each context effect that moved the ranking (SPEC 6.2).
import { chordSymbol } from './chord'
import type { ChordName } from './chord-symbol'

export type Suggestion<T> = {
  candidate: T
  score: number
  tags: string[]
  ruleIds: string[]
  explanation: string
  more?: string
  contextNotes: string[]
}

// The next-chord engine's categories, in the order SPEC 6.2 lists them. A
// chord suggestion's first tag is its category.
export const SUGGESTION_CATEGORIES = [
  'diatonic',
  'secondary',
  'borrowed',
  'chromatic',
  'modulation',
  'rock',
  'pedal',
] as const

export type SuggestionCategory = (typeof SUGGESTION_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<SuggestionCategory, string> = {
  diatonic: 'Diatonic',
  secondary: 'Secondary',
  borrowed: 'Borrowed',
  chromatic: 'Chromatic',
  modulation: 'Modulation',
  rock: 'Rock moves',
  pedal: 'Pedal/static',
}

export type ChordSuggestion = Suggestion<ChordName>

type SuggestionFields<T> = Omit<Suggestion<T>, 'contextNotes'> & {
  contextNotes?: string[]
}

export function isSuggestionCategory(tag: string): tag is SuggestionCategory {
  return (SUGGESTION_CATEGORIES as readonly string[]).includes(tag)
}

// A checked suggestion: a finite score, at least one tag and one rule id, and
// an explanation. Tags and rule ids lose duplicates but keep their order, and
// the arrays are copied so a rule's own data is never shared.
export function makeSuggestion<T>(fields: SuggestionFields<T>): Suggestion<T> {
  const { candidate, score, explanation, more } = fields
  if (!Number.isFinite(score)) throw new Error(`score ${score} is not finite`)
  const tags = [...new Set(fields.tags)]
  const ruleIds = [...new Set(fields.ruleIds)]
  if (tags.length === 0) throw new Error('a suggestion needs a tag')
  if (ruleIds.length === 0) throw new Error('a suggestion needs a rule id')
  if (!explanation.trim()) throw new Error('a suggestion needs an explanation')
  const suggestion: Suggestion<T> = {
    candidate,
    score,
    tags,
    ruleIds,
    explanation,
    contextNotes: [...(fields.contextNotes ?? [])],
  }
  if (more !== undefined) suggestion.more = more
  return suggestion
}

// A next-chord suggestion: its first tag must be one of the categories, and
// no other tag may be, so every chord suggestion has exactly one category.
export function makeChordSuggestion(
  fields: SuggestionFields<ChordName>,
): ChordSuggestion {
  const suggestion = makeSuggestion(fields)
  const categories = suggestion.tags.filter(isSuggestionCategory)
  if (categories.length !== 1 || categories[0] !== suggestion.tags[0]) {
    throw new Error(
      `a chord suggestion's first tag must be its one category: ${suggestion.tags.join(', ')}`,
    )
  }
  return suggestion
}

// A chord suggestion's category: its first tag.
export function suggestionCategory(
  suggestion: Suggestion<unknown>,
): SuggestionCategory | undefined {
  const first = suggestion.tags[0]
  return first !== undefined && isSuggestionCategory(first) ? first : undefined
}

// Fills a rule's explanation template: "{chord} is {numeral}" with
// { chord: 'E7', numeral: 'V7/vi' } gives "E7 is V7/vi". A placeholder with
// no value throws, so a template and its rule can't drift apart unnoticed.
export function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = values[name]
    if (value === undefined) {
      throw new Error(`template "${template}" has no value for {${name}}`)
    }
    return value
  })
}

// A stable text key for a chord candidate, used to break ties: F#m7b5/C.
export function chordKey(chord: ChordName): string {
  return chordSymbol(chord, { ascii: true })
}

// Orders suggestions deterministically (SPEC 6.1): higher score first, then
// category order for chord suggestions, then the candidate's key, so the same
// input always gives the same ranking whatever order the generators ran in.
export function compareSuggestions<T>(
  keyOf: (candidate: T) => string,
): (a: Suggestion<T>, b: Suggestion<T>) => number {
  const rank = (s: Suggestion<T>) => {
    const category = suggestionCategory(s)
    return category
      ? SUGGESTION_CATEGORIES.indexOf(category)
      : SUGGESTION_CATEGORIES.length
  }
  return (a, b) => {
    if (a.score !== b.score) return b.score - a.score
    const byCategory = rank(a) - rank(b)
    if (byCategory) return byCategory
    const ka = keyOf(a.candidate)
    const kb = keyOf(b.candidate)
    return ka < kb ? -1 : ka > kb ? 1 : 0
  }
}

// Sorts a copy of the suggestions with compareSuggestions.
export function sortSuggestions<T>(
  suggestions: readonly Suggestion<T>[],
  keyOf: (candidate: T) => string,
): Suggestion<T>[] {
  return [...suggestions].sort(compareSuggestions(keyOf))
}
