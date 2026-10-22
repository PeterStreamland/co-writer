// Undo and redo (SPEC 6.5): every change to the sketch is a new present,
// with the old one kept to step back to.

export type History<T> = { past: T[]; present: T; future: T[] }

// How many steps back undo can go.
export const HISTORY_LIMIT = 200

export function startHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] }
}

// A change: the old present can be undone, and redo is cleared.
export function record<T>(h: History<T>, next: T): History<T> {
  if (next === h.present) return h
  return {
    past: [...h.past, h.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
  }
}

export function undo<T>(h: History<T>): History<T> {
  const previous = h.past.at(-1)
  if (previous === undefined) return h
  return {
    past: h.past.slice(0, -1),
    present: previous,
    future: [h.present, ...h.future],
  }
}

export function redo<T>(h: History<T>): History<T> {
  const [next, ...future] = h.future
  if (next === undefined) return h
  return { past: [...h.past, h.present], present: next, future }
}
