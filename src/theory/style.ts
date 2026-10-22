// Style profiles (PLAN Phase 4 task 3, SPEC 6.6). A style gives every
// next-chord rule a weight from 0 to 5; the built-in weights live in
// styles.json, which the in-app editor's export reproduces exactly, so an
// exported file can be committed as the new defaults. Two styles blend in
// 25% steps, and a suggestion's score is its fit in context scaled by the
// blended weight of its rule: 5 keeps it at full strength, 0 sends it to the
// bottom of the list.
import builtIn from './styles.json'
import { NEXT_CHORD_RULES } from './next-chord-data'

export type StyleWeights = Record<string, number>
export type StyleProfile = { id: string; name: string; weights: StyleWeights }
export type StyleSet = { version: number; styles: StyleProfile[] }
// SPEC 12: style a at 100% when mix is 0, style b at 100% when it is 1.
export type StyleBlend = { a: string; b?: string; mix: number }

export const STYLE_SET_VERSION = 1
export const MAX_WEIGHT = 5

const RULE_IDS = NEXT_CHORD_RULES.map((r) => r.id)

function isWeight(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 5
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// What is wrong with a style set, one line per problem: a style without an
// id or name, or a rule with no whole-number weight from 0 to 5.
export function styleSetProblems(value: unknown): string[] {
  if (!isRecord(value) || !Array.isArray(value.styles)) {
    return ['not a style set']
  }
  const problems: string[] = []
  if (value.version !== STYLE_SET_VERSION) {
    problems.push(
      `version ${String(value.version)} is not ${STYLE_SET_VERSION}`,
    )
  }
  value.styles.forEach((style: unknown, i) => {
    if (!isRecord(style) || typeof style.id !== 'string') {
      problems.push(`style ${i + 1} has no id`)
      return
    }
    if (typeof style.name !== 'string') problems.push(`${style.id} has no name`)
    const weights = isRecord(style.weights) ? style.weights : {}
    for (const id of RULE_IDS) {
      if (!isWeight(weights[id]))
        problems.push(`${style.id} has no weight for ${id}`)
    }
    for (const id of Object.keys(weights)) {
      if (!RULE_IDS.includes(id as (typeof RULE_IDS)[number])) {
        problems.push(`${style.id} weighs unknown rule ${id}`)
      }
    }
  })
  return problems
}

function readBuiltIn(): StyleSet {
  const problems = styleSetProblems(builtIn)
  if (problems.length) throw new Error(`styles.json: ${problems.join('; ')}`)
  return builtIn as StyleSet
}

export const BUILT_IN_STYLES: StyleSet = readBuiltIn()

// A style set read over a fallback (the built-in one by default): each of the
// fallback's styles takes the value's weight for a rule where that is a whole
// number from 0 to 5, and keeps its own otherwise. Styles and rules the
// fallback doesn't have are dropped, so saved edits survive a rule being
// added or removed.
export function readStyleSet(
  value: unknown,
  fallback: StyleSet = BUILT_IN_STYLES,
): StyleSet {
  const saved =
    isRecord(value) && Array.isArray(value.styles) ? value.styles : []
  return {
    version: STYLE_SET_VERSION,
    styles: fallback.styles.map((style) => {
      const match: unknown = saved.find(
        (s: unknown) => isRecord(s) && s.id === style.id,
      )
      const weights =
        isRecord(match) && isRecord(match.weights) ? match.weights : {}
      return {
        id: style.id,
        name: style.name,
        weights: Object.fromEntries(
          RULE_IDS.map((id) => {
            const w = weights[id]
            return [id, isWeight(w) ? w : style.weights[id]]
          }),
        ),
      }
    }),
  }
}

// A blend's mix snapped to the nearest 25% step, between 0 and 1.
export function snapMix(mix: number): number {
  return Math.min(1, Math.max(0, Math.round(mix * 4) / 4))
}

function requireStyle(set: StyleSet, id: string): StyleProfile {
  const style = set.styles.find((s) => s.id === id)
  if (!style) throw new Error(`unknown style ${id}`)
  return style
}

// Each rule's weight for a blend of two styles: 50% rock and 50% metal
// weighs ♭VI halfway between the two.
export function blendWeights(set: StyleSet, blend: StyleBlend): StyleWeights {
  const a = requireStyle(set, blend.a)
  const b = blend.b === undefined ? a : requireStyle(set, blend.b)
  const mix = snapMix(blend.mix)
  return Object.fromEntries(
    RULE_IDS.map((id) => [id, a.weights[id] * (1 - mix) + b.weights[id] * mix]),
  )
}

// A suggestion's score in a style: its fit in context, scaled by its rule's
// weight.
export function styleScore(fit: number, weight: number): number {
  return (fit * weight) / MAX_WEIGHT
}

// The style set as styles.json writes it, for the editor's export.
export function styleSetJson(set: StyleSet): string {
  return `${JSON.stringify(set, null, 2)}\n`
}
