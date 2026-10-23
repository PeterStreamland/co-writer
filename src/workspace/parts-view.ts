// What a row under the progression plays (David's request, 2026-10-23): its
// recipe, and any bars of its own, turned into notes for the chords as
// they are now, so a row always fits. A line row is the line mode over the progression (the Wildcard at
// its roll); an arpeggio row is each chord's arpeggio with the stored
// settings, on guitar in the position nearest where it was added. No theory
// lives here.
import {
  ARPEGGIO_PATTERNS,
  ARPEGGIO_RATES,
  LINE_DENSITIES,
  LINE_MODES,
  addDur,
  lineFor,
  lineSeed,
  seededRandom,
  withBars,
  type BarNote,
  type Key,
  type LineModeId,
  type LineNote,
  type Placement,
} from '../theory'
import { roleOf } from '../instruments/chord-tones'
import type { Guitar } from '../instruments/guitar'
import { partKind, recipeAt, type Part, type PartRecipe } from '../sketch/parts'
import { keyAt, pathNodes, type Progression } from '../sketch/progression'
import type { AlongNote } from './along'
import { ARPEGGIO_CHOICES, planArpeggio, voiceOf } from './arpeggio-view'
import { lineSteps } from './lines-view'

// How a recipe reads: "Walking", "Wildcard (roll 3)", "7th arpeggios, up,
// 8ths".
export function recipeLabel(recipe: PartRecipe): string {
  if (recipe.kind === 'line') {
    const label = LINE_MODES.find((m) => m.id === recipe.mode)?.label ?? ''
    const density = LINE_DENSITIES.find((d) => d.id === recipe.density)
    return [
      recipe.mode === 'wildcard' && recipe.roll > 0
        ? `${label} (roll ${recipe.roll + 1})`
        : label,
      ...(density && !recipe.notes ? [density.label.toLowerCase()] : []),
      ...(recipe.notes ? ['edited'] : []),
    ].join(', ')
  }
  const { choice, pattern, rate } = recipe.settings
  const what = ARPEGGIO_CHOICES.find((c) => c.id === choice)?.label ?? choice
  const how = ARPEGGIO_PATTERNS.find((p) => p.id === pattern)?.label ?? pattern
  const speed = ARPEGGIO_RATES.find((r) => r.id === rate)?.label ?? rate
  const where = recipe.from !== undefined ? `, around fret ${recipe.from}` : ''
  return `${what} arpeggios, ${how.toLowerCase()}, ${speed}${where}`
}

// How a row reads: its recipe, noting any bars of its own, or for a row
// built bar by bar, what kind it is.
export function partLabel(part: Part): string {
  const bars = Object.keys(part.cells ?? {}).length
  if (part.recipe) {
    return bars
      ? `${recipeLabel(part.recipe)}, with ${bars === 1 ? 'one bar' : `${bars} bars`} of its own`
      : recipeLabel(part.recipe)
  }
  return partKind(part) === 'line'
    ? 'Lines, bar by bar'
    : 'Arpeggios, bar by bar'
}

// The row's notes over the progression's active path, each with the chord
// it sounds over and where it falls: each chord plays what the row has for
// it, a bar of its own or the row's recipe; a silent bar plays nothing.
export function partNotes(
  part: Part,
  progression: Progression,
  sectionKey: Key,
  timing: Placement[],
  guitar?: Guitar,
): AlongNote[] {
  const nodes = pathNodes(progression)
  if (partKind(part) === 'line') {
    return rowLine(part, progression, sectionKey, timing).map((note, ref) => ({
      step: note.step,
      onset: note.onset,
      length: note.length,
      note: note.note,
      ref,
      label: note.label,
      look: [
        `tag-${note.tags[0]}`,
        note.tags.includes('chromatic') ? 'chromatic' : '',
      ].join(' '),
    }))
  }
  return nodes.flatMap((n, i): AlongNote[] => {
    const recipe = recipeAt(part, n.id)
    if (!recipe || recipe.kind !== 'arpeggio') return []
    const placed = timing[i]
    const onGuitar = recipe.from !== undefined && guitar !== undefined
    const plan = planArpeggio(
      n.chord,
      keyAt(progression, i, sectionKey),
      recipe.settings,
      placed.length,
      onGuitar ? guitar : undefined,
    )
    let voice = voiceOf(plan, undefined)
    if (onGuitar && plan.positions.length) {
      const from = recipe.from as number
      const nearest = plan.positions.reduce(
        (best, p, j) =>
          Math.abs(p.from - from) < Math.abs(plan.positions[best].from - from)
            ? j
            : best,
        0,
      )
      voice = voiceOf(plan, 'position', nearest)
    }
    return voice.events.map((e) => ({
      step: i,
      onset: addDur(placed.start, e.onset),
      length: e.length,
      note: voice.notes[e.index].note,
      ref: e.index,
      label: voice.notes[e.index].label,
      look: `role-${roleOf(voice.notes[e.index].number)}`,
    }))
  })
}

// A line row's notes: each bar the line of its recipe's mode, with as many
// notes as the recipe sets, or the notes it keeps if edited by hand. Lines
// of a mode are worked out once, over the whole progression.
function rowLine(
  part: Part,
  progression: Progression,
  sectionKey: Key,
  timing: Placement[],
): LineNote[] {
  const nodes = pathNodes(progression)
  const recipes = nodes.map((n) => {
    const r = recipeAt(part, n.id)
    return r?.kind === 'line' ? r : undefined
  })
  const steps = lineSteps(progression, sectionKey, timing).map((s, i) => ({
    ...s,
    density: recipes[i]?.density,
  }))
  const lines = new Map<string, LineNote[]>()
  const lineNotes = (mode: LineModeId, roll: number) => {
    const id = `${mode} ${roll}`
    if (!lines.has(id)) {
      const seed = seededRandom(lineSeed(steps) + roll)
      lines.set(id, lineFor(mode, steps, seed).notes)
    }
    return lines.get(id) as LineNote[]
  }
  const played = recipes.flatMap((r, i) =>
    r && !r.notes
      ? lineNotes(r.mode, r.roll).filter((note) => note.step === i)
      : [],
  )
  const bars: Record<number, BarNote[]> = {}
  recipes.forEach((r, i) => {
    if (r?.notes) bars[i] = r.notes
  })
  const silent = new Set(recipes.flatMap((r, i) => (r ? [] : [i])))
  return withBars(played, steps, bars).filter((note) => !silent.has(note.step))
}
