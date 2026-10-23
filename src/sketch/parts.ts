// Rows of lines and arpeggios under the progression (David's request,
// 2026-10-23). A row keeps its recipe, not its notes: which line mode (and
// the Wildcard's roll), or which arpeggio settings (and the guitar position
// it sits near), so it rewrites itself to fit whenever the chords change.
// Rows live in the progression, so saving, undo, redo and branches cover
// them: each is anchored to the last chord of the active path when it was
// added, and shows while that chord is on the active path. Every function
// returns a new progression and leaves its input alone.
import type { LineModeId } from '../theory'
import type { Progression } from './progression'

export type GuitarMode = 'position' | 'run'

export type ArpeggioSettings = {
  choice: string
  pattern: string
  rate: string
  octaves: number
  // The octave the root starts in; undefined for the instrument's default.
  octave?: number
  guitar: GuitarMode
}

export type PartRecipe =
  | { kind: 'line'; mode: LineModeId; roll: number }
  // On guitar in one position, `from` is the fret the position sits near.
  | { kind: 'arpeggio'; settings: ArpeggioSettings; from?: number }

export type Part = {
  id: string
  anchor: string
  recipe: PartRecipe
  muted?: boolean
}

function nextPartId(p: Progression): string {
  const numbers = (p.parts ?? []).map((r) => Number(r.id.slice(1)) || 0)
  return `r${Math.max(0, ...numbers) + 1}`
}

// Adds a row for the active path's chords; none without chords.
export function addPart(p: Progression, recipe: PartRecipe): Progression {
  const anchor = p.activePath.at(-1)
  if (!anchor) return p
  const part: Part = { id: nextPartId(p), anchor, recipe }
  return { ...p, parts: [...(p.parts ?? []), part] }
}

export function removePart(p: Progression, id: string): Progression {
  return { ...p, parts: (p.parts ?? []).filter((r) => r.id !== id) }
}

export function setPartMuted(
  p: Progression,
  id: string,
  muted: boolean,
): Progression {
  return {
    ...p,
    parts: (p.parts ?? []).map((r) => {
      if (r.id !== id) return r
      const changed: Part = { ...r, muted }
      if (!muted) delete changed.muted
      return changed
    }),
  }
}

// The rows of the branch showing: those whose anchor is on the active path.
export function partsShown(p: Progression): Part[] {
  return (p.parts ?? []).filter((r) => p.activePath.includes(r.anchor))
}

export function isPart(value: unknown, nodes: string[]): value is Part {
  if (typeof value !== 'object' || value === null) return false
  const r = value as Part
  if (typeof r.id !== 'string' || !nodes.includes(r.anchor)) return false
  const recipe = r.recipe as PartRecipe | undefined
  if (recipe?.kind === 'line') {
    return typeof recipe.mode === 'string' && typeof recipe.roll === 'number'
  }
  if (recipe?.kind === 'arpeggio') {
    return typeof recipe.settings?.choice === 'string'
  }
  return false
}
