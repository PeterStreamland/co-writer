// Keeps the progression in this browser until sketches get autosave and
// version history (Phase 10).
import {
  EMPTY_PROGRESSION,
  isProgression,
  type Progression,
} from './progression'

const STORAGE_KEY = 'co-writer:progression'

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function loadProgression(store = storage()): Progression {
  try {
    const saved = JSON.parse(store?.getItem(STORAGE_KEY) ?? 'null')
    if (isProgression(saved)) return saved
  } catch {
    // Unreadable or blocked storage: start empty.
  }
  return EMPTY_PROGRESSION
}

export function saveProgression(p: Progression, store = storage()): void {
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    // Storage blocked: the progression lasts for this visit only.
  }
}
