// The melody as notes playing along with the chords (SPEC 7.2): each note
// sounds over the chord it starts under. Notes after the last chord ends
// don't play with the chords; Play melody plays them all.
import {
  DEFAULT_RANGE,
  addDur,
  barPosition,
  compareDur,
  counterpoint,
  counterpointLabel,
  counterpointOptions,
  editCounterpoint,
  pruneCounterpointEdits,
  editHarmony,
  harmonise,
  harmonyKind,
  melodyRange,
  pruneHarmonyEdits,
  midiNumber,
  type CounterpointLine,
  type CounterpointOptions,
  type HarmonyContext,
  type HarmonyEdit,
  type PlacedHarmonyNote,
  type MelodyNote,
  type MelodyRange,
  type Placement,
  type Dur,
  type MeterMap,
} from '../theory'
import type { MelodyRangeSetting } from '../sketch/progression'
import type { AlongNote } from './along'

export const MELODY_LOOK = 'melody'
// Harmonies of the melody (SPEC 7.4) play along the same way.
export const HARMONY_LOOK = 'harmony'

export function melodyAlong(
  melody: MelodyNote[],
  timing: Placement[],
  look = MELODY_LOOK,
): AlongNote[] {
  return melody.flatMap((m, ref) => {
    const step = timing.findIndex(
      (t) =>
        compareDur(t.start, m.onset) <= 0 &&
        compareDur(m.onset, addDur(t.start, t.length)) < 0,
    )
    return step < 0
      ? []
      : [
          {
            step,
            onset: m.onset,
            length: m.length,
            note: m.note,
            ref,
            look,
          },
        ]
  })
}

// A harmony of the melody as its own row under the chords (PLAN Phase 7
// task 11): its notes with your edits on them (David's request), and the
// same notes playing along, each harmony with a look of its own so its
// row knows which of its notes is sounding.
export type HarmonyRow = {
  id: string
  label: string
  notes: PlacedHarmonyNote[]
  along: AlongNote[]
  edited: number // how many of its notes are your own, or taken out
}

export function harmonyRows(
  ids: string[],
  ctx: HarmonyContext,
  timing: Placement[],
  edits: Record<string, HarmonyEdit[]> = {},
): HarmonyRow[] {
  return ids.flatMap((id) => {
    const kind = harmonyKind(id)
    if (!kind) return []
    const own = pruneHarmonyEdits(ctx.melody, edits[id] ?? [])
    const notes = editHarmony(ctx, harmonise(ctx, id).notes, own)
    return [
      {
        id,
        label: kind.label,
        notes,
        along: melodyAlong(notes, timing, harmonyLook(id)),
        edited: own.length,
      },
    ]
  })
}

// A counterpoint line against the melody (PLAN Phase 7 task 18), worked
// out once for each melody, key, chords and meter: the search takes a
// moment, and rows redraw while they play.
const lines = new Map<string, CounterpointLine>()
const LINES_KEPT = 40

export function counterpointLine(
  ctx: HarmonyContext,
  o: CounterpointOptions,
): CounterpointLine {
  const key = JSON.stringify([o, ctx.melody, ctx.key, ctx.chords, ctx.time])
  let line = lines.get(key)
  if (!line) {
    line = counterpoint(ctx, o)
    if (lines.size >= LINES_KEPT) lines.delete(lines.keys().next().value!)
    lines.set(key, line)
  }
  return line
}

// The counterpoint lines kept, each on a row of its own like a harmony,
// with your notes on it (as task 17).
export const COUNTERPOINT_LOOK = 'counterpoint'

export function counterpointRows(
  ids: string[],
  ctx: HarmonyContext,
  timing: Placement[],
  edits: Record<string, HarmonyEdit[]> = {},
): HarmonyRow[] {
  if (!ctx.melody.length) return []
  return ids.flatMap((id) => {
    const o = counterpointOptions(id)
    if (!o) return []
    const line = counterpointLine(ctx, o).notes
    const own = pruneCounterpointEdits(ctx.melody, edits[id] ?? [], line)
    const notes = editCounterpoint(ctx, o, line, own)
    return [
      {
        id,
        label: `Counterpoint: ${counterpointLabel(o)}`,
        notes,
        along: melodyAlong(notes, timing, `${COUNTERPOINT_LOOK}-${id}`),
        edited: own.length,
      },
    ]
  })
}

// The look a harmony's notes play along with: harmony-3rd-above.
export function harmonyLook(id: string): string {
  return `${HARMONY_LOOK}-${id}`
}

// The melody's range from its setting: a preset's, or the notes chosen for
// a range of your own when both are there and the low one is lower.
// Tenor when unset (SPEC 7.3).
export function rangeFromSetting(setting?: MelodyRangeSetting): MelodyRange {
  if (setting?.preset === 'custom' && setting.low && setting.high) {
    const low = midiNumber(setting.low)
    const high = midiNumber(setting.high)
    if (low !== undefined && high !== undefined && low < high) {
      return { low: setting.low, high: setting.high }
    }
  }
  return melodyRange(setting?.preset ?? DEFAULT_RANGE)
}

// Notes grouped by the bar each starts in, for showing a line bar by bar
// (the Harmony cards, Phase 7 task 15): each with its place in the line,
// and only the bars that have notes.
export function notesByBar<T extends { onset: Dur }>(
  notes: T[],
  time: MeterMap,
): { bar: number; notes: (T & { place: number })[] }[] {
  const bars: { bar: number; notes: (T & { place: number })[] }[] = []
  notes.forEach((n, place) => {
    const { bar } = barPosition(time, n.onset)
    const last = bars.at(-1)
    if (last?.bar === bar) last.notes.push({ ...n, place })
    else bars.push({ bar, notes: [{ ...n, place }] })
  })
  return bars
}
