// Swapping one chord of a lens's column (David's request, 2026-10-23): the
// lens's other voicings for that chord, best first by what they cost in the
// lens's eyes where they stand: their own cost, how far the voices move from
// the chord before and into the chord after, and the lens's rules they
// break on the way. The same ranking voices another chord for that place.
import { chordSymbol } from './chord'
import { LENS_SETTINGS } from './lens-data'
import type { LensChoice, LensStep, LensVoicing } from './lens'
import { midiNumber } from './note'
import { makeSuggestion, type Suggestion } from './suggestion'
import { voiceLeading } from './voice-leading'
import { rulePenalty, voiceRuleHits } from './voice-rules'
import { LENS_RULE_WEIGHTS, type Lens } from './voice-rules-data'

// How many voicings a swap offers.
export const SWAPS_SHOWN = 6

const notesOf = (v: LensVoicing) => v.notes.map(midiNumber).join(',')

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
  const settings = LENS_SETTINGS[lens]
  const prev = choices[index - 1]?.voicing
  const next = choices[index + 1]?.voicing
  const current = choices[index]?.voicing
  const hits = (i: number, from: V | undefined, to: V) =>
    voiceRuleHits({
      key: steps[i].key,
      from: from && { chord: from.chord, notes: from.notes },
      to: { chord: to.chord, notes: to.notes },
      gain: settings.gain,
    }).filter((h) => LENS_RULE_WEIGHTS[lens][h.rule] > 0)
  const seen = new Set(current ? [notesOf(current)] : [])
  const options: Suggestion<V>[] = []
  for (const v of candidates) {
    const id = notesOf(v)
    if (seen.has(id)) continue
    seen.add(id)
    const into = prev && voiceLeading(prev.notes, v.notes, settings.movement)
    const out = next && voiceLeading(v.notes, next.notes, settings.movement)
    const broken = [
      ...hits(index, prev, v),
      ...(next ? hits(index + 1, v, next) : []),
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
