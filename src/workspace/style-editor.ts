// The style editor's logic (SPEC 6.6): which rules it lists under each
// category, setting a weight, and keeping edits in this browser. Edits are
// read over the built-in weights, so a rule added later still gets one.
import {
  BUILT_IN_STYLES,
  CATEGORY_LABELS,
  NEXT_CHORD_RULES,
  SUGGESTION_CATEGORIES,
  MAX_WEIGHT,
  readStyleSet,
  styleSetJson,
  type StyleSet,
  type SuggestionCategory,
} from '../theory'

const STORAGE_KEY = 'co-writer:styles'

export type EditorGroup = {
  category: SuggestionCategory
  label: string
  rules: { id: string; label: string }[]
}

// The rules grouped by category, in the order suggestions are listed.
export function editorGroups(): EditorGroup[] {
  return SUGGESTION_CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    rules: NEXT_CHORD_RULES.filter((r) => r.category === category).map((r) => ({
      id: r.id,
      label: r.label,
    })),
  })).filter((group) => group.rules.length > 0)
}

// The set with one weight changed, clamped to a whole number from 0 to 5.
export function setWeight(
  set: StyleSet,
  styleId: string,
  ruleId: string,
  weight: number,
): StyleSet {
  const value = Math.min(MAX_WEIGHT, Math.max(0, Math.round(weight)))
  return {
    ...set,
    styles: set.styles.map((style) =>
      style.id === styleId
        ? { ...style, weights: { ...style.weights, [ruleId]: value } }
        : style,
    ),
  }
}

// Tapping a dot sets the weight to that dot; tapping the dot that is
// already the weight takes one off, so the first dot can reach 0.
export function tapDot(current: number, dot: number): number {
  return current === dot ? dot - 1 : dot
}

// Whether a weight differs from the built-in one.
export function isEdited(set: StyleSet, styleId: string, ruleId: string) {
  const weight = (s: StyleSet) =>
    s.styles.find((style) => style.id === styleId)?.weights[ruleId]
  return weight(set) !== weight(BUILT_IN_STYLES)
}

export function editCount(set: StyleSet): number {
  return set.styles.reduce(
    (sum, style) =>
      sum +
      Object.keys(style.weights).filter((id) => isEdited(set, style.id, id))
        .length,
    0,
  )
}

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

// The weights saved in this browser, or the built-in ones.
export function loadStyles(store = storage()): StyleSet {
  try {
    const saved = store?.getItem(STORAGE_KEY)
    if (saved) return readStyleSet(JSON.parse(saved))
  } catch {
    // Unreadable or blocked storage: use the built-in weights.
  }
  return BUILT_IN_STYLES
}

// Saves the weights, or forgets them when they match the built-in ones.
export function saveStyles(set: StyleSet, store = storage()): void {
  try {
    if (editCount(set) === 0) store?.removeItem(STORAGE_KEY)
    else store?.setItem(STORAGE_KEY, JSON.stringify(set))
  } catch {
    // Storage blocked: edits last for this visit only.
  }
}

// The file Export as default downloads: styles.json, ready to commit.
export function exportText(set: StyleSet): string {
  return styleSetJson(set)
}
