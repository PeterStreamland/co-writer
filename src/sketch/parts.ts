// Rows of lines and arpeggios under the progression (David's request,
// 2026-10-23). A row keeps its recipe, not its notes: which line mode (and
// the Wildcard's roll), or which arpeggio settings (and the guitar position
// it sits near), so it rewrites itself to fit whenever the chords change.
// Rows live in the progression, so saving, undo, redo and branches cover
// them: each is anchored to the last chord of the active path when it was
// added, and shows while that chord is on the active path. Every function
// returns a new progression and leaves its input alone.
import {
  LETTERS,
  LINE_DENSITIES,
  MOST_NOTES,
  type ArpeggioGap,
  type BarNote,
  type LineDensity,
  type LineModeId,
} from '../theory'
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

// A line recipe may set how many notes a bar (David's request), and a
// bar of its own may keep notes edited by hand, which it plays as they are.
export type PartRecipe =
  | {
      kind: 'line'
      mode: LineModeId
      roll: number
      density?: LineDensity
      // A bar's own number of notes, and its refreshes (David's request).
      count?: number
      seed?: number
      notes?: BarNote[]
    }
  // On guitar in one position, `from` is the fret the position sits near.
  | {
      kind: 'arpeggio'
      settings: ArpeggioSettings
      from?: number
      // Notes of the bar's pattern resting or held, by their place in it
      // (David's request, 2026-10-24).
      gaps?: Record<number, ArpeggioGap>
    }
  // A frozen row's bar (David's request, 2026-10-24): the notes it played,
  // edited by hand from then on.
  | { kind: 'notes'; notes: BarNote[] }

// A row plays its recipe over every chord, except where a bar has its own
// (David's request: + on a single bar): a cell keyed by the chord's node
// id, with its own recipe, or null for a bar left silent. A row made bar
// by bar has cells only. Its kind says which tab's + adds bars to it; a
// frozen row ('notes') takes no bars from the tabs, and says what it was.
export type Part = {
  id: string
  anchor: string
  kind?: PartRecipe['kind'] // rows saved before cells existed have none
  recipe?: PartRecipe
  cells?: Record<string, PartRecipe | null>
  muted?: boolean
  // Octaves the whole row is moved up (or down, below 0), and each bar's
  // own on top, by chord node id (David's request).
  octave?: number
  octaves?: Record<string, number>
  frozen?: string
}

export function partKind(part: Part): PartRecipe['kind'] {
  return part.kind ?? part.recipe?.kind ?? 'line'
}

// What a row plays over a chord: its cell there, or else its recipe.
export function recipeAt(part: Part, node: string): PartRecipe | undefined {
  const cell = part.cells?.[node]
  if (cell !== undefined) return cell ?? undefined
  return part.recipe
}

function nextPartId(p: Progression): string {
  const numbers = (p.parts ?? []).map((r) => Number(r.id.slice(1)) || 0)
  return `r${Math.max(0, ...numbers) + 1}`
}

// Adds a row for the active path's chords, with any bars of its own; none
// without chords.
export function addPart(
  p: Progression,
  recipe: PartRecipe,
  cells?: Record<string, PartRecipe>,
): Progression {
  const anchor = p.activePath.at(-1)
  if (!anchor) return p
  const part: Part = { id: nextPartId(p), anchor, kind: recipe.kind, recipe }
  if (cells && Object.keys(cells).length) part.cells = { ...cells }
  return { ...p, parts: [...(p.parts ?? []), part] }
}

// Adds one bar to the latest row of its kind showing, or to a new row of
// that bar alone; the bar takes the recipe over any it had.
export function addCell(
  p: Progression,
  node: string,
  recipe: PartRecipe,
): Progression {
  const target = partsShown(p)
    .filter((r) => partKind(r) === recipe.kind)
    .at(-1)
  if (!target) {
    const anchor = p.activePath.at(-1)
    if (!anchor || !p.activePath.includes(node)) return p
    const part: Part = {
      id: nextPartId(p),
      anchor,
      kind: recipe.kind,
      cells: { [node]: recipe },
    }
    return { ...p, parts: [...(p.parts ?? []), part] }
  }
  return setCell(p, target.id, node, recipe)
}

// Leaves one bar of a row silent.
export function clearCell(
  p: Progression,
  id: string,
  node: string,
): Progression {
  return setCell(p, id, node, null)
}

function setCell(
  p: Progression,
  id: string,
  node: string,
  recipe: PartRecipe | null,
): Progression {
  return {
    ...p,
    parts: (p.parts ?? []).map((r) =>
      r.id === id ? { ...r, cells: { ...r.cells, [node]: recipe } } : r,
    ),
  }
}

// Freezes a row into the notes it plays now, bar by bar (David's
// request): each chord of the active path keeps its notes, or is silent,
// and the row no longer follows the chords. Its octave moves are in the
// notes, so they go; `was` names what it was frozen from.
export function freezePart(
  p: Progression,
  id: string,
  bars: Record<string, BarNote[]>,
  was: string,
): Progression {
  return {
    ...p,
    parts: (p.parts ?? []).map((r) => {
      if (r.id !== id) return r
      const cells: Record<string, PartRecipe | null> = {}
      for (const node of p.activePath) {
        const notes = bars[node]
        cells[node] = notes?.length ? { kind: 'notes', notes } : null
      }
      const frozen: Part = {
        id: r.id,
        anchor: r.anchor,
        kind: 'notes',
        cells,
        frozen: was,
      }
      if (r.muted) frozen.muted = true
      return frozen
    }),
  }
}

// A frozen row's bar with notes edited by hand.
export function setFrozenBar(
  p: Progression,
  id: string,
  node: string,
  notes: BarNote[],
): Progression {
  return setCell(p, id, node, { kind: 'notes', notes })
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

// How far a row is moved at a chord: its own octaves and the bar's.
export function octaveAt(part: Part, node: string): number {
  return (part.octave ?? 0) + (part.octaves?.[node] ?? 0)
}

// Moves a whole row, or one bar of it, up (1) or down (-1) an octave; no
// further than three octaves either way.
export function shiftPart(
  p: Progression,
  id: string,
  by: number,
  node?: string,
): Progression {
  return {
    ...p,
    parts: (p.parts ?? []).map((r) => {
      if (r.id !== id) return r
      if (node === undefined) {
        const octave = clampOctave((r.octave ?? 0) + by)
        const moved: Part = { ...r, octave }
        if (!octave) delete moved.octave
        return moved
      }
      const octaves = { ...r.octaves }
      const octave = clampOctave((octaves[node] ?? 0) + by)
      if (octave) octaves[node] = octave
      else delete octaves[node]
      const moved: Part = { ...r, octaves }
      if (!Object.keys(octaves).length) delete moved.octaves
      return moved
    }),
  }
}

const OCTAVES = 3
const clampOctave = (n: number) => Math.max(-OCTAVES, Math.min(OCTAVES, n))

// The rows of the branch showing: those whose anchor is on the active path.
export function partsShown(p: Progression): Part[] {
  return (p.parts ?? []).filter((r) => p.activePath.includes(r.anchor))
}

export function isPart(value: unknown, nodes: string[]): value is Part {
  if (typeof value !== 'object' || value === null) return false
  const r = value as Part
  if (typeof r.id !== 'string' || !nodes.includes(r.anchor)) return false
  if (r.recipe === undefined && r.cells === undefined) return false
  if (r.octave !== undefined && !Number.isInteger(r.octave)) return false
  if (
    r.octaves !== undefined &&
    (typeof r.octaves !== 'object' ||
      r.octaves === null ||
      !Object.values(r.octaves).every(Number.isInteger))
  ) {
    return false
  }
  if (r.frozen !== undefined && typeof r.frozen !== 'string') return false
  if (r.recipe !== undefined && !isRecipe(r.recipe)) return false
  if (r.cells === undefined) return true
  if (typeof r.cells !== 'object' || r.cells === null) return false
  return Object.values(r.cells).every((c) => c === null || isRecipe(c))
}

const isNotes = (notes: unknown) =>
  Array.isArray(notes) && notes.length > 0 && notes.every(isBarNote)

function isRecipe(value: unknown): value is PartRecipe {
  const recipe = value as PartRecipe | undefined
  if (recipe?.kind === 'notes') return isNotes(recipe.notes)
  if (recipe?.kind === 'line') {
    return (
      typeof recipe.mode === 'string' &&
      typeof recipe.roll === 'number' &&
      (recipe.density === undefined ||
        LINE_DENSITIES.some((d) => d.id === recipe.density)) &&
      (recipe.count === undefined ||
        (Number.isInteger(recipe.count) &&
          recipe.count >= 1 &&
          recipe.count <= MOST_NOTES)) &&
      (recipe.seed === undefined ||
        (Number.isInteger(recipe.seed) && recipe.seed >= 0)) &&
      (recipe.notes === undefined || isNotes(recipe.notes))
    )
  }
  if (recipe?.kind === 'arpeggio') {
    return (
      typeof recipe.settings?.choice === 'string' &&
      (recipe.gaps === undefined ||
        (typeof recipe.gaps === 'object' &&
          recipe.gaps !== null &&
          Object.entries(recipe.gaps).every(
            ([k, g]) =>
              Number.isInteger(Number(k)) && (g === 'rest' || g === 'hold'),
          )))
    )
  }
  return false
}

function isBarNote(value: unknown): value is BarNote {
  const b = value as BarNote | undefined
  return (
    typeof b === 'object' &&
    b !== null &&
    (LETTERS as readonly string[]).includes(b.note?.letter) &&
    Number.isInteger(b.note.accidental) &&
    Number.isInteger(b.note.octave) &&
    Number.isInteger(b.at?.n) &&
    Number.isInteger(b.at?.d) &&
    b.at.n >= 0 &&
    b.at.d > 0 &&
    (b.length === undefined ||
      (Number.isInteger(b.length.n) &&
        Number.isInteger(b.length.d) &&
        b.length.n > 0 &&
        b.length.d > 0))
  )
}
