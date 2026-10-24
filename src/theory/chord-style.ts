// Chord styles (PLAN Phase 7 task 8, David's request): how a chord is
// played through its length, as hits. Each hit is a slot of time with the
// notes struck at its start (none for a rest) and how long they sound.
// The slots of a chord follow one another from its start to its end, so
// every style fills the chord exactly, whatever its length and wherever
// it falls in the bar. The styles and their patterns are data, in
// chord-style-data.ts.
import {
  addDur,
  compareDur,
  dur,
  subDur,
  timesDur,
  ZERO,
  type Dur,
} from './duration'
import {
  CHORD_STYLES,
  DEFAULT_CHORD_STYLE,
  ROLL_GAP,
  STAB_SOUNDS,
  STRUM_BAR_PATTERNS,
  STRUM_BEAT_PATTERNS,
  UP_STRUM_NOTES,
  type ChordStyleId,
} from './chord-style-data'
import {
  barLength,
  beatsOf,
  meterOfBar,
  type MeterMap,
  type Placement,
} from './meter'
import { midiNumber, type Note } from './note'

export * from './chord-style-data'

export type ChordHit = {
  onset: Dur // from the chord's start
  length: Dur // its slot, to the next hit or the chord's end
  sound: Dur // how long its notes ring: within its slot, except a broken chord's notes, which ring to the chord's end
  notes: Note[] // none for a rest
  strum?: 'down' | 'up'
}

// A style id read back, or the default for one it doesn't know.
export function chordStyle(id: string | undefined): ChordStyleId {
  return CHORD_STYLES.find((s) => s.id === id)?.id ?? DEFAULT_CHORD_STYLE
}

// What a slot of a style plays: every note, the bass alone, the notes
// above it, a short stab, a strum down or up, a rest, or nothing new
// (the hit before rings on).
type Kind = 'all' | 'bass' | 'upper' | 'stab' | 'down' | 'up' | 'rest' | 'ring'
type Piece = { from: Dur; to: Dur; kind: Kind }

// The counted beats the chord covers, whole, from the start of the section.
function beatsCovered(placed: Placement, time: MeterMap) {
  const end = addDur(placed.start, placed.length)
  const out: {
    start: Dur
    length: Dur
    strong: boolean
    pulses: number
    bar: number
    barStart: Dur
  }[] = []
  let bar = placed.bar
  let barStart = subDur(placed.start, placed.offset)
  while (compareDur(barStart, end) < 0) {
    const meter = meterOfBar(time, bar)
    for (const beat of beatsOf(meter)) {
      const start = addDur(barStart, beat.onset)
      const beatEnd = addDur(start, beat.length)
      if (compareDur(beatEnd, placed.start) <= 0 || compareDur(start, end) >= 0)
        continue
      out.push({
        start,
        length: beat.length,
        strong: beat.strength !== 'weak',
        // How many quavers (or the meter's pulse) the beat holds.
        pulses: Math.round((beat.length.n * meter.den) / beat.length.d),
        bar,
        barStart,
      })
    }
    barStart = addDur(barStart, barLength(meter))
    bar++
  }
  return out
}

// A beat split into equal parts, each with its kind.
function split(start: Dur, length: Dur, kinds: Kind[]): Piece[] {
  const part = dur(length.n, length.d * kinds.length)
  return kinds.map((kind, k) => ({
    from: addDur(start, timesDur(part, k)),
    to: addDur(start, timesDur(part, k + 1)),
    kind,
  }))
}

const STROKES: Record<string, Kind> = { D: 'down', U: 'up', '.': 'ring' }

// The style's pieces over the beats the chord covers.
function piecesOf(
  style: ChordStyleId,
  placed: Placement,
  time: MeterMap,
): Piece[] {
  const end = addDur(placed.start, placed.length)
  if (style === 'block') return [{ from: placed.start, to: end, kind: 'all' }]
  if (style === 'strum') return [{ from: placed.start, to: end, kind: 'down' }]
  const beats = beatsCovered(placed, time)
  if (style === 'pulse') {
    return beats.map((b) => ({
      from: b.start,
      to: addDur(b.start, b.length),
      kind: 'all',
    }))
  }
  if (style === 'oom-pah') {
    // The bass on a strong beat's first quaver (every dotted or grouped
    // beat is strong), the chord on the rest.
    return beats.flatMap((b) =>
      b.pulses > 1
        ? split(b.start, b.length, [
            'bass',
            ...Array<Kind>(b.pulses - 1).fill('upper'),
          ])
        : [
            {
              from: b.start,
              to: addDur(b.start, b.length),
              kind: b.strong ? 'bass' : 'upper',
            },
          ],
    )
  }
  if (style === 'stabs') {
    return beats.flatMap((b) =>
      b.pulses > 1
        ? split(b.start, b.length, [
            'rest',
            ...Array<Kind>(b.pulses - 1).fill('stab'),
          ])
        : split(b.start, b.length, ['rest', 'stab']),
    )
  }
  // Down-up: a bar's own pattern where it has one, else each beat's.
  const pieces: Piece[] = []
  const barsDone = new Set<number>()
  for (const b of beats) {
    const meter = meterOfBar(time, b.bar)
    const own = STRUM_BAR_PATTERNS[`${meter.num}/${meter.den}`]
    if (own) {
      if (barsDone.has(b.bar)) continue
      barsDone.add(b.bar)
      pieces.push(
        ...split(
          b.barStart,
          barLength(meter),
          [...own].map((c) => STROKES[c]),
        ),
      )
      continue
    }
    const pattern = STRUM_BEAT_PATTERNS[b.pulses] ?? STRUM_BEAT_PATTERNS[1]
    pieces.push(
      ...split(
        b.start,
        b.length,
        [...pattern].map((c) => STROKES[c]),
      ),
    )
  }
  return pieces
}

const byPitch = (notes: Note[]) =>
  [...notes].sort(
    (a, b) => (midiNumber(a) as number) - (midiNumber(b) as number),
  )

// A chord played in a style: its hits, from its start to its end.
export function chordHits(
  styleId: string | undefined,
  notes: Note[],
  placed: Placement,
  time: MeterMap,
): ChordHit[] {
  const style = chordStyle(styleId)
  const sorted = byPitch(notes)
  const length = placed.length
  if (style === 'broken') return rolled(sorted, length)
  const bass = sorted.slice(0, 1)
  const upper = sorted.length > 1 ? sorted.slice(1) : sorted
  const top = sorted.slice(-UP_STRUM_NOTES)
  const end = addDur(placed.start, length)
  const hits: ChordHit[] = []
  for (const piece of piecesOf(style, placed, time)) {
    // Cut to the chord: a piece the chord starts inside begins with it.
    const from =
      compareDur(piece.from, placed.start) < 0 ? placed.start : piece.from
    const to = compareDur(piece.to, end) > 0 ? end : piece.to
    if (compareDur(to, from) <= 0) continue
    const onset = subDur(from, placed.start)
    const slot = subDur(to, from)
    const last = hits.at(-1)
    if (piece.kind === 'ring' && last && last.notes.length) {
      last.length = addDur(last.length, slot)
      last.sound = addDur(last.sound, slot)
      continue
    }
    // A chord is struck as it starts, even on a stroke the pattern misses.
    const kind = piece.kind === 'ring' ? 'down' : piece.kind
    const hit: ChordHit = { onset, length: slot, sound: slot, notes: [] }
    if (kind === 'all') hit.notes = sorted
    else if (kind === 'bass') hit.notes = bass
    else if (kind === 'upper') hit.notes = upper
    else if (kind === 'down')
      Object.assign(hit, { notes: sorted, strum: 'down' })
    else if (kind === 'up') Object.assign(hit, { notes: top, strum: 'up' })
    else if (kind === 'stab') {
      hit.notes = sorted
      hit.sound = dur(slot.n * STAB_SOUNDS.n, slot.d * STAB_SOUNDS.d)
    }
    if (!hit.notes.length) hit.sound = ZERO
    hits.push(hit)
  }
  return hits
}

// A broken (rolled) chord: each note comes in after the one before, low
// to high, and rings to the chord's end.
function rolled(sorted: Note[], length: Dur): ChordHit[] {
  if (!sorted.length) return [{ onset: ZERO, length, sound: ZERO, notes: [] }]
  const room = dur(length.n, length.d * 2 * sorted.length)
  const gap =
    compareDur(room, ROLL_GAP) < 0 ? room : dur(ROLL_GAP.n, ROLL_GAP.d)
  return sorted.map((note, k) => {
    const onset = timesDur(gap, k)
    const last = k === sorted.length - 1
    return {
      onset,
      length: last ? subDur(length, onset) : gap,
      sound: subDur(length, onset),
      notes: [note],
    }
  })
}
