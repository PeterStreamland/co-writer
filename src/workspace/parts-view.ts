// What a row under the progression plays (David's request, 2026-10-23): its
// recipe turned into notes for the chords as they are now, so a row always
// fits. A line row is the line mode over the progression (the Wildcard at
// its roll); an arpeggio row is each chord's arpeggio with the stored
// settings, on guitar in the position nearest where it was added. No theory
// lives here.
import {
  ARPEGGIO_PATTERNS,
  ARPEGGIO_RATES,
  LINE_MODES,
  addDur,
  lineFor,
  lineSeed,
  seededRandom,
  type Key,
  type Placement,
} from '../theory'
import type { Guitar } from '../instruments/guitar'
import type { Part, PartRecipe } from '../sketch/parts'
import { keyAt, pathNodes, type Progression } from '../sketch/progression'
import type { AlongNote } from './along'
import { ARPEGGIO_CHOICES, planArpeggio, voiceOf } from './arpeggio-view'
import { lineSteps } from './lines-view'

// How a row reads: "Walking", "Wildcard (roll 3)", "7th arpeggios, up, 8ths".
export function partLabel(recipe: PartRecipe): string {
  if (recipe.kind === 'line') {
    const label = LINE_MODES.find((m) => m.id === recipe.mode)?.label ?? ''
    return recipe.mode === 'wildcard' && recipe.roll > 0
      ? `${label} (roll ${recipe.roll + 1})`
      : label
  }
  const { choice, pattern, rate } = recipe.settings
  const what = ARPEGGIO_CHOICES.find((c) => c.id === choice)?.label ?? choice
  const how = ARPEGGIO_PATTERNS.find((p) => p.id === pattern)?.label ?? pattern
  const speed = ARPEGGIO_RATES.find((r) => r.id === rate)?.label ?? rate
  const where = recipe.from !== undefined ? `, around fret ${recipe.from}` : ''
  return `${what} arpeggios, ${how.toLowerCase()}, ${speed}${where}`
}

// The row's notes over the progression's active path, each with the chord
// it sounds over and where it falls.
export function partNotes(
  part: Part,
  progression: Progression,
  sectionKey: Key,
  timing: Placement[],
  guitar?: Guitar,
): AlongNote[] {
  const { recipe } = part
  if (recipe.kind === 'line') {
    const steps = lineSteps(progression, sectionKey, timing)
    if (!steps.length) return []
    const line = lineFor(
      recipe.mode,
      steps,
      seededRandom(lineSeed(steps) + recipe.roll),
    )
    return line.notes.map((n, ref) => ({
      step: n.step,
      onset: n.onset,
      length: n.length,
      note: n.note,
      ref,
    }))
  }
  const onGuitar = recipe.from !== undefined && guitar !== undefined
  return pathNodes(progression).flatMap((n, i) => {
    const placed = timing[i]
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
    }))
  })
}
