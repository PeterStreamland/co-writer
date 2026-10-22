// The style blend in the header (SPEC 6.6): two styles and a mix in 25%
// steps. It is remembered in this browser until sections arrive and each
// section keeps its own.
import { snapMix, type StyleBlend, type StyleSet } from '../theory'

const STORAGE_KEY = 'co-writer:style-blend'

export const DEFAULT_BLEND: StyleBlend = { a: 'pop', b: 'rock', mix: 0 }

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
    if (
      ids.includes(saved?.a) &&
      ids.includes(saved?.b) &&
      typeof saved.mix === 'number'
    ) {
      return { a: saved.a, b: saved.b, mix: snapMix(saved.mix) }
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

// How the blend reads beside the slider: "Pop", "75% Pop, 25% Rock".
export function blendLabel(set: StyleSet, blend: StyleBlend): string {
  const name = (id: string | undefined) =>
    set.styles.find((s) => s.id === id)?.name ?? id ?? ''
  const mix = snapMix(blend.mix)
  if (mix === 0 || blend.b === undefined || blend.b === blend.a) {
    return name(blend.a)
  }
  if (mix === 1) return name(blend.b)
  const a = Math.round((1 - mix) * 100)
  return `${a}% ${name(blend.a)}, ${100 - a}% ${name(blend.b)}`
}
