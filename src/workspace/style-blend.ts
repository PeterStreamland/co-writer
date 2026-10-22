// The style control in the header (SPEC 6.6): one style, or two blended in
// 25% steps, or no style at all (every move at full strength). It is
// remembered in this browser until sections arrive and each section keeps
// its own.
import {
  blendWeights,
  snapMix,
  type StyleBlend,
  type StyleSet,
  type StyleWeights,
} from '../theory'

const STORAGE_KEY = 'co-writer:style-blend'

// The style id meaning no style: the engine weighs every move in full.
export const NO_STYLE = 'none'

// One style and no blend: the slider is off until Blend is ticked.
export const DEFAULT_BLEND: StyleBlend = { a: 'pop', mix: 0 }

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

// The blend remembered in this browser, kept to styles the set has.
export function loadBlend(set: StyleSet, store = storage()): StyleBlend {
  const ids = set.styles.map((s) => s.id)
  try {
    const saved = JSON.parse(store?.getItem(STORAGE_KEY) ?? 'null')
    const a = saved?.a
    const b = saved?.b
    if (
      (a === NO_STYLE || ids.includes(a)) &&
      (b === undefined || (a !== NO_STYLE && ids.includes(b))) &&
      typeof saved.mix === 'number'
    ) {
      const blend: StyleBlend = { a, mix: snapMix(saved.mix) }
      if (b !== undefined) blend.b = b
      return blend
    }
  } catch {
    // Unreadable or blocked storage: start from the default.
  }
  return DEFAULT_BLEND
}

export function saveBlend(blend: StyleBlend, store = storage()): void {
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify(blend))
  } catch {
    // Storage blocked: the blend just isn't remembered.
  }
}

// The weights the engine uses, or none for No style.
export function blendedWeights(
  set: StyleSet,
  blend: StyleBlend,
): StyleWeights | undefined {
  return blend.a === NO_STYLE ? undefined : blendWeights(set, blend)
}

// Turns blending on (with the next style, half and half) or off.
export function withBlending(
  set: StyleSet,
  blend: StyleBlend,
  on: boolean,
): StyleBlend {
  if (!on || blend.a === NO_STYLE) return { a: blend.a, mix: 0 }
  const other = set.styles.find((s) => s.id !== blend.a)?.id ?? set.styles[0].id
  return { a: blend.a, b: other, mix: 0.5 }
}

// How the blend reads beside the control: "Pop", "75% Pop, 25% Rock".
export function blendLabel(set: StyleSet, blend: StyleBlend): string {
  if (blend.a === NO_STYLE) return 'Every move at full strength'
  const name = (id: string | undefined) =>
    set.styles.find((s) => s.id === id)?.name ?? id ?? ''
  const mix = snapMix(blend.mix)
  if (blend.b === undefined || blend.b === blend.a || mix === 0) {
    return name(blend.a)
  }
  if (mix === 1) return name(blend.b)
  const a = Math.round((1 - mix) * 100)
  return `${a}% ${name(blend.a)}, ${100 - a}% ${name(blend.b)}`
}
