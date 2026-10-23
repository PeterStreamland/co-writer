// Swapping one chord of a lens's column (David's request, 2026-10-23): the
// lens's other voicings for that chord, best first by what they cost in the
// lens's eyes where they stand: their own cost, how far the voices move from
// the chord before and into the chord after, and the lens's rules they
// break on the way. The same ranking voices another chord for that place.
// A swap changes only its own chord (David's request): the chords either
// side stay as they were, and are offered smoother voicings of their own
// for the new neighbour, to take or leave.
import { chordSymbol } from './chord'
import { LENS_SETTINGS } from './lens-data'
import type { LensChoice, LensStep, LensVoicing } from './lens'
import { midiNumber } from './note'
import { makeSuggestion, type Suggestion } from './suggestion'
import { voiceLeading } from './voice-leading'
import { rulePenalty, voiceRuleHits, type RuleHit } from './voice-rules'
import { LENS_RULE_WEIGHTS, type Lens } from './voice-rules-data'

// How many voicings a swap offers, and how many for each neighbour.
export const SWAPS_SHOWN = 6
export const NEIGHBOUR_SHOWN = 2

const notesOf = (v: LensVoicing) => v.notes.map(midiNumber).join(',')

// The lens's rules a move from one voicing to the next breaks.
function lensHits(
  lens: Lens,
  steps: LensStep[],
  index: number,
  from: LensVoicing | undefined,
  to: LensVoicing,
): RuleHit[] {
  return voiceRuleHits({
    key: steps[index].key,
    from: from && { chord: from.chord, notes: from.notes },
    to: { chord: to.chord, notes: to.notes },
    gain: LENS_SETTINGS[lens].gain,
  }).filter((h) => LENS_RULE_WEIGHTS[lens][h.rule] > 0)
}

// What a voicing costs at `index` between its neighbours in `choices`, the
// rules it breaks there, and how far its voices move each way.
function placed<V extends LensVoicing>(
  lens: Lens,
  steps: LensStep[],
  choices: LensChoice<V>[],
  index: number,
  v: V,
) {
  const settings = LENS_SETTINGS[lens]
  const prev = choices[index - 1]?.voicing
  const next = choices[index + 1]?.voicing
  const into = prev && voiceLeading(prev.notes, v.notes, settings.movement)
  const out = next && voiceLeading(v.notes, next.notes, settings.movement)
  const broken = [
    ...lensHits(lens, steps, index, prev, v),
    ...(next ? lensHits(lens, steps, index + 1, v, next) : []),
  ]
  const cost =
    v.cost + (into?.cost ?? 0) + (out?.cost ?? 0) + rulePenalty(broken, lens)
  const moves = [
    prev &&
      into &&
      `the voices move ${into.movement} semitones from ${chordSymbol(prev.chord)}`,
    next &&
      out &&
      `${into ? '' : 'the voices move '}${out.movement} into ${chordSymbol(next.chord)}`,
  ].filter(Boolean)
  return { cost, broken, moves }
}

// The lens's voicings for the chord at `index`, other than the one there,
// ranked where they stand between their neighbours in `choices`.
export function voicingOptions<V extends LensVoicing>(
  lens: Lens,
  steps: LensStep[],
  choices: LensChoice<V>[],
  index: number,
  candidates: V[],
  shown = SWAPS_SHOWN,
): Suggestion<V>[] {
  const current = choices[index]?.voicing
  const seen = new Set(current ? [notesOf(current)] : [])
  const options: Suggestion<V>[] = []
  for (const v of candidates) {
    const id = notesOf(v)
    if (seen.has(id)) continue
    seen.add(id)
    const { cost, broken, moves } = placed(lens, steps, choices, index, v)
    options.push(
      makeSuggestion({
        candidate: v,
        score: -cost,
        tags: [lens, v.form],
        ruleIds: [`lens-${lens}`, ...broken.map((h) => `voice-${h.rule}`)],
        explanation: `${chordSymbol(v.chord)}, ${v.label}${moves.length ? `: ${moves.join(' and ')}` : ''}.`,
        contextNotes: broken.map((h) => h.explanation),
      }),
    )
  }
  return options.sort((a, b) => b.score - a.score).slice(0, shown)
}

// The column with its swaps in place and nothing else changed: each
// swapped voicing replaces the lens's, and the rules broken and the
// movement are worked out again where the column changed.
export function withSwaps<V extends LensVoicing>(
  lens: Lens,
  steps: LensStep[],
  choices: LensChoice<V>[],
  swaps: Record<number, V>,
): LensChoice<V>[] {
  const voicings = choices.map((c, i) => swaps[i] ?? c.voicing)
  return choices.map((c, i) => {
    if (!(i in swaps) && !(i - 1 in swaps)) return c
    const before = voicings[i - 1]
    const voicing = voicings[i]
    return {
      voicing,
      hits: lensHits(lens, steps, i, before, voicing),
      movement: before ? voiceLeading(before.notes, voicing.notes).movement : 0,
    }
  })
}

// For the chords either side of `index`, the lens's voicings that sit
// better beside it than theirs do now, best first: after a swap, the
// suggestions its new neighbour makes.
export function neighbourOptions<V extends LensVoicing>(
  lens: Lens,
  steps: LensStep[],
  choices: LensChoice<V>[],
  index: number,
  candidatesAt: (at: number) => V[],
  shown = NEIGHBOUR_SHOWN,
): { at: number; options: Suggestion<V>[] }[] {
  return [index - 1, index + 1]
    .filter((at) => at >= 0 && at < choices.length)
    .map((at) => {
      const now = placed(lens, steps, choices, at, choices[at].voicing).cost
      const options = voicingOptions(
        lens,
        steps,
        choices,
        at,
        candidatesAt(at),
        SWAPS_SHOWN,
      )
        .filter((o) => -o.score < now - 1e-9)
        .slice(0, shown)
      return { at, options }
    })
    .filter((n) => n.options.length > 0)
}
