// Counterpoint against a melody (PLAN Phase 7 task 18, David's request):
// a line above or below the melody in one of the five species, in strict
// (textbook) or freer rules. Species fit the melody note by note (David's
// choice): one note against each, two, four, a note tied across into the
// next, or a free mix. Every note of a line, generated or your own, is
// checked against the rules, and each break is tagged and explained.
// Freer rules also lean on the chords (David's choice): chord tones on the
// beat are preferred, never required. The species, rules, weights and
// wording are data, in counterpoint-data.ts.
import { chordSymbol } from './chord'
import { chordNotes } from './chord-symbol'
import {
  CP_BEAM,
  CP_MAX_MOVE,
  CP_PREFER as W,
  CP_RULES,
  CP_SPACING,
  CP_TEXT as T,
  SHORTEST_PIECE,
  SPECIES,
  type CounterpointMode,
  type CounterpointSide,
  type Piece,
  type Species,
} from './counterpoint-data'
import { ZERO, addDur, compareDur, dur, timesDur, type Dur } from './duration'
import {
  chordToneName,
  harmonyPlace,
  intervalAgainst,
  type HarmonyContext,
  type HarmonyEdit,
  type HarmonyNote,
  type PlacedHarmonyNote,
} from './harmony'
import { intervalBetween, parseInterval, transposeDown } from './interval'
import { inKey } from './lines'
import type { MelodyNote } from './melody'
import {
  formatNote,
  letterIndex,
  midiNumber,
  mod,
  noteAtMidi,
  pitchClass,
  type Note,
} from './note'
import { scaleNotes } from './scale'
import {
  isSpanUnit,
  melodySpans,
  spanUnit,
  type Span,
  type SpanUnit,
} from './spans'
import { fillTemplate, makeSuggestion, type Suggestion } from './suggestion'

export * from './counterpoint-data'

export type CounterpointOptions = {
  species: Species['id']
  side: CounterpointSide
  mode: CounterpointMode
  // How often the line moves (David's request): each melody note when
  // unset, or a steady grid of bars and parts of a bar.
  unit?: SpanUnit
}

export type CounterpointBreak = { ruleId: string; place: number; text: string }

export type CounterpointLine = {
  id: string
  notes: HarmonyNote[]
  breaks: CounterpointBreak[]
}

export type CounterpointSuggestion = Suggestion<CounterpointLine>

// A line as options: '2-below-strict', '2-below-strict-half'.
export function counterpointId(o: CounterpointOptions): string {
  const unit = o.unit && o.unit !== 'note' ? `-${o.unit}` : ''
  return `${o.species}-${o.side}-${o.mode}${unit}`
}

export function counterpointOptions(
  id: string,
): CounterpointOptions | undefined {
  const [s, side, mode, unit, ...more] = id.split('-')
  const species = Number(s)
  if (!SPECIES.some((x) => x.id === species)) return undefined
  if (side !== 'above' && side !== 'below') return undefined
  if (mode !== 'strict' && mode !== 'freer') return undefined
  if (more.length || (unit !== undefined && !isSpanUnit(unit))) return undefined
  const o: CounterpointOptions = {
    species: species as Species['id'],
    side,
    mode,
  }
  if (unit && unit !== 'note') o.unit = unit as SpanUnit
  return o
}

export function speciesOf(id: number): Species {
  return SPECIES.find((s) => s.id === id) ?? SPECIES[0]
}

// "Two against one, below, strict", "…, strict, every ½ bar".
export function counterpointLabel(o: CounterpointOptions): string {
  const unit = o.unit && o.unit !== 'note' ? `, ${spanUnit(o.unit).short}` : ''
  return `${speciesOf(o.species).label}, ${o.side}, ${o.mode}${unit}`
}

const name = (n: Note) => formatNote({ ...n, octave: undefined })
const letterSteps = (n: Note) => (n.octave ?? 4) * 7 + letterIndex(n.letter)
const ORDINAL_WORDS = [
  '',
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
]
const midiOf = (n: Note) => midiNumber(n) as number
const end = (n: { onset: Dur; length: Dur }) => addDur(n.onset, n.length)
const same = (a: Dur, b: Dur) => compareDur(a, b) === 0
const durKey = (d: Dur) => `${d.n}/${d.d}`

// A note of a line as the rules see it.
type LineNote = { note: Note; midi: number; onset: Dur; length: Dur }

// Two notes sounding together, counted up from the lower.
type Vertical = {
  kind: 'perfect' | 'imperfect' | 'dissonant'
  perfect?: 'unison' | 'fifth' // a unison or octave, or a 5th
  simple: number // 1 to 7
  number: number // compound: a 9th is 9
  quality: string
  semis: number // the line's midi minus the melody's
  text: string // "a 6th above D"
}

function vertical(line: Note, melody: Note): Vertical {
  const a = midiOf(line)
  const b = midiOf(melody)
  const [low, high] =
    a < b || (a === b && line === melody) ? [line, melody] : [melody, line]
  const { quality, number } = intervalBetween(low, high)
  const simple = ((number - 1) % 7) + 1
  let kind: Vertical['kind'] = 'dissonant'
  let perfect: Vertical['perfect']
  if (quality === 'P' && simple === 1) {
    kind = 'perfect'
    perfect = 'unison'
  } else if (quality === 'P' && simple === 5) {
    kind = 'perfect'
    perfect = 'fifth'
  } else if (
    (simple === 3 || simple === 6) &&
    (quality === 'M' || quality === 'm')
  ) {
    kind = 'imperfect'
  }
  return {
    kind,
    perfect,
    simple,
    number,
    quality,
    semis: a - b,
    // In words only when a reason is written.
    get text() {
      return intervalAgainst(line, melody)
    },
  }
}

// A move from one note of the line to the next.
type Move = {
  semis: number
  letters: number // signed
  step: boolean // a 2nd, a tone or a semitone
  quality: string
  number: number
}

function move(from: LineNote, to: LineNote): Move {
  const semis = to.midi - from.midi
  const letters =
    (to.note.octave ?? 4) * 7 +
    letterIndex(to.note.letter) -
    ((from.note.octave ?? 4) * 7 + letterIndex(from.note.letter))
  const { quality, number } = intervalBetween(from.note, to.note)
  return {
    semis,
    letters,
    step:
      Math.abs(letters) === 1 && Math.abs(semis) >= 1 && Math.abs(semis) <= 2,
    quality,
    number,
  }
}

const NUMBER_WORDS: Record<number, string> = {
  1: 'unison',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
  7: '7th',
  8: 'octave',
}
const QUALITY_WORDS: Record<string, string> = {
  P: '',
  M: 'major ',
  m: 'minor ',
  A: 'augmented ',
  d: 'diminished ',
}

// "a minor 6th", "an augmented 4th", "a 5th", "an octave".
function leapWords(m: Move): string {
  const word = NUMBER_WORDS[m.number] ?? `${m.number}th`
  const quality = QUALITY_WORDS[m.quality[0]] ?? ''
  const text = `${quality}${word}`
  return /^[aeiou]/.test(text) || m.number === 8 || m.number === 11
    ? `an ${text}`
    : `a ${text}`
}

// What the rules need to know about the melody and the key at a time.
class Setting {
  private places = new Map<string, ReturnType<typeof harmonyPlace>>()
  readonly melodyMidi: number[]
  // Worked out once each: where a note meets the melody, and the notes
  // the line might play at a time.
  readonly points = new WeakMap<LineNote, Point[]>()
  readonly reach = new Map<string, LineNote[]>()
  readonly fits = new Map<string, { tone?: string; outside: boolean }>()
  readonly ctx: HarmonyContext
  readonly o: CounterpointOptions
  // The steps the line moves in (each melody note, or a grid), and where
  // each starts: the line's beats.
  readonly spans: Span[]
  private readonly starts: Set<string>
  constructor(ctx: HarmonyContext, o: CounterpointOptions) {
    this.ctx = ctx
    this.o = o
    this.melodyMidi = ctx.melody.map((m) => midiOf(m.note))
    this.spans = melodySpans(ctx.melody, ctx.time, o.unit ?? 'note', ctx.chords)
    this.starts = new Set(this.spans.map((sp) => durKey(sp.onset)))
  }
  isBeat(t: Dur): boolean {
    return this.starts.has(durKey(t))
  }
  // A melody note reached and left by step, with no gap: one that passes
  // or steps back while the line holds.
  melodyPasses(j: number): boolean {
    const melody = this.ctx.melody
    const [a, b, c] = [melody[j - 1], melody[j], melody[j + 1]]
    if (!a || !b || !c) return false
    if (!same(end(a), b.onset) || !same(end(b), c.onset)) return false
    const step = (x: Note, y: Note) =>
      Math.abs(letterSteps(x) - letterSteps(y)) === 1 &&
      Math.abs(midiOf(x) - midiOf(y)) <= 2 &&
      midiOf(x) !== midiOf(y)
    return step(a.note, b.note) && step(b.note, c.note)
  }
  // The melody note sounding at a time, by its place, or -1.
  melodyAt(t: Dur): number {
    const melody = this.ctx.melody
    let lo = 0
    let hi = melody.length - 1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      const m = melody[mid]
      if (compareDur(t, m.onset) < 0) hi = mid - 1
      else if (compareDur(t, end(m)) >= 0) lo = mid + 1
      else return mid
    }
    return -1
  }
  place(t: Dur) {
    const key = durKey(t)
    let p = this.places.get(key)
    if (!p) {
      p = harmonyPlace(this.ctx, {
        note: this.ctx.melody[0].note,
        onset: t,
        length: ZERO,
      })
      this.places.set(key, p)
    }
    return p
  }
  // Whether a note is outside the key, and which tone of the chord it is,
  // where it starts.
  fit(n: LineNote): { tone?: string; outside: boolean } {
    const key = `${durKey(n.onset)} ${formatNote(n.note)}`
    let f = this.fits.get(key)
    if (!f) {
      const place = this.place(n.onset)
      f = {
        tone: chordToneName(place.chord, n.note),
        outside: !inKey(place.key, n.note),
      }
      this.fits.set(key, f)
    }
    return f
  }
  // The leading note raised for the cadence, where the key's own note a
  // letter below the melody's last is a whole step below it (C♯ in D
  // Dorian, G♯ in A Aeolian); never in Phrygian, whose cadence falls a
  // semitone in the other voice.
  raisedLead(): Note | undefined {
    if (this.lead !== null) return this.lead
    const final = this.ctx.melody.at(-1)!
    const key = this.place(final.onset).key
    const raised = transposeDown(
      { ...final.note, octave: undefined },
      parseInterval('m2')!,
    )
    this.lead =
      key.mode === 'phrygian' || inKey(key, raised) ? undefined : raised
    return this.lead
  }
  private lead: Note | undefined | null = null
  isRaisedLead(n: LineNote): boolean {
    const raised = this.raisedLead()
    return (
      !!raised &&
      raised.letter === n.note.letter &&
      raised.accidental === n.note.accidental
    )
  }
  // The raised 6th, a whole step below the raised leading note, where the
  // key lacks it (F♯ in A Aeolian): it steps up to the leading note so
  // the line climbs 6–7–8 without an augmented 2nd.
  raisedSixth(): Note | undefined {
    if (this.sixth !== null) return this.sixth
    const lead = this.raisedLead()
    const final = this.ctx.melody.at(-1)!
    const key = this.place(final.onset).key
    const sixth = lead && transposeDown(lead, parseInterval('M2')!)
    this.sixth = sixth && !inKey(key, sixth) ? sixth : undefined
    return this.sixth
  }
  private sixth: Note | undefined | null = null
  isRaisedSixth(n: LineNote): boolean {
    const sixth = this.raisedSixth()
    return (
      !!sixth &&
      sixth.letter === n.note.letter &&
      sixth.accidental === n.note.accidental
    )
  }
  // The note a semitone below the melody's last, a letter below it.
  isLead(n: LineNote): boolean {
    const final = this.ctx.melody.at(-1)!.note
    return (
      mod(midiOf(final) - n.midi, 12) === 1 &&
      mod(letterIndex(final.letter) - letterIndex(n.note.letter), 7) === 1
    )
  }
  rule(id: string): boolean {
    const r = CP_RULES.find((x) => x.id === id)!
    return (
      r.modes.includes(this.o.mode) &&
      (!r.species || r.species.includes(this.o.species))
    )
  }
}

// Where a note of the line meets the melody: at its onset, and at every
// melody note that starts while it's held.
type Point = {
  t: Dur
  m: number // the melody note, by place
  strong: boolean // one of the line's beats: a step starts here
  held: boolean // the line's note started earlier
  v: Vertical
}

function pointsOf(s: Setting, n: LineNote): Point[] {
  const known = s.points.get(n)
  if (known) return known
  const out: Point[] = []
  s.points.set(n, out)
  const at = s.melodyAt(n.onset)
  if (at >= 0) {
    out.push({
      t: n.onset,
      m: at,
      strong: s.isBeat(n.onset),
      held: false,
      v: vertical(n.note, s.ctx.melody[at].note),
    })
  }
  // While it's held: each melody note that starts, and each of the
  // line's beats.
  const stop = end(n)
  const times = new Map<string, Dur>()
  for (const m of s.ctx.melody) {
    if (compareDur(m.onset, n.onset) <= 0) continue
    if (compareDur(m.onset, stop) >= 0) break
    times.set(durKey(m.onset), m.onset)
  }
  for (const sp of s.spans) {
    if (compareDur(sp.onset, n.onset) <= 0) continue
    if (compareDur(sp.onset, stop) >= 0) break
    times.set(durKey(sp.onset), sp.onset)
  }
  const inside = [...times.values()].sort(compareDur)
  for (const t of inside) {
    const j = s.melodyAt(t)
    if (j < 0) continue
    out.push({
      t,
      m: j,
      strong: s.isBeat(t),
      held: true,
      v: vertical(n.note, s.ctx.melody[j].note),
    })
  }
  return out
}

type Judgement = {
  breaks: { ruleId: string; text: string }[]
  prefer: number
  tags: string[]
  reasons: string[]
}

const ruleText = (id: string) => CP_RULES.find((r) => r.id === id)!.text

// Where a note is in its line. `nextLast`: the note after is the line's
// last. `pending`: the note after isn't chosen yet, so the rules that
// need it wait.
type Flags = {
  first: boolean
  last: boolean
  nextLast?: boolean
  explain?: boolean
  pending?: boolean
}

// The rules for one note of a line, with the notes around it: the ones
// before, and the one after where there is one. `last` marks the line's
// last note; `first` its first.
function judge(
  s: Setting,
  line: LineNote[],
  k: number,
  { first, last, nextLast = false, explain = false, pending = false }: Flags,
): Judgement {
  const n = line[k]
  const prev = first ? undefined : line[k - 1]
  const next = line[k + 1]
  const o = s.o
  const breaks: Judgement['breaks'] = []
  const tags: string[] = []
  const reasons: string[] = []
  let prefer = 0
  const points = pointsOf(s, n)
  const onset = points.find((p) => same(p.t, n.onset))
  const values = (p?: Point, extra: Record<string, string> = {}) => ({
    note: formatNote(n.note),
    melody: p ? name(s.ctx.melody[p.m].note) : '',
    interval: p ? p.v.text : '',
    ...extra,
  })
  const add = (id: string, extra: Record<string, string>, p?: Point) => {
    if (!s.rule(id)) return false
    if (breaks.some((b) => b.ruleId === id)) return true
    breaks.push({
      ruleId: id,
      text: explain ? fillTemplate(ruleText(id), values(p, extra)) : '',
    })
    return true
  }
  const joined = (a?: LineNote, b?: LineNote) =>
    !!a && !!b && same(end(a), b.onset)
  const before = joined(prev, n) ? prev : undefined
  const after = joined(n, next) ? next : undefined
  const towards = before ? move(before, n) : undefined
  const onwards = after ? move(n, after) : undefined

  // Against the melody, at each point. A note held over a beat starts
  // as a consonance.
  const heldOver = points.some((p) => p.held && p.strong)
  let crossed = false
  let wide = false
  for (const p of points) {
    const v = p.v
    if (!crossed && (o.side === 'above' ? v.semis < 0 : v.semis > 0)) {
      crossed = true
      add('cp-crossing', {}, p)
    }
    if (!wide && Math.abs(v.semis) > CP_SPACING.max) {
      wide = true
      add('cp-spacing', {}, p)
    }
    if (Math.abs(v.semis) > CP_SPACING.wide) prefer += W.wide
    // Off the beat, or (freer) against a melody note that starts off the
    // beat: a dissonance passes or steps back.
    const offBeat =
      !p.strong || (o.mode === 'freer' && !p.held && !s.place(p.t).strong)
    if (p.strong && !offBeat) {
      if (v.kind === 'dissonant') {
        if (p.held) {
          const prepared = onset && onset.v.kind !== 'dissonant'
          const resolves =
            !!onwards &&
            onwards.letters === -1 &&
            onwards.step &&
            vertical(
              after!.note,
              s.ctx.melody[s.melodyAt(after!.onset)]?.note ?? n.note,
            ).kind !== 'dissonant'
          const allowed =
            o.mode === 'freer' ||
            (o.side === 'above'
              ? // 7–6, 4–3 and 9–8; a 2nd above would fall into a unison
                (v.simple === 7 && /^[Mm]$/.test(v.quality)) ||
                (v.simple === 4 && v.quality === 'P') ||
                (v.simple === 2 && v.number >= 9 && /^[Mm]$/.test(v.quality))
              : // 2–3 (and 9–10)
                v.simple === 2 && /^[Mm]$/.test(v.quality))
          if (!prepared) {
            // a note held over that starts dissonant: cp-preparation, below
          } else if (pending && allowed) tags.push('suspension')
          else if (!resolves || !allowed) {
            add(
              'cp-suspension',
              {
                move: onwards
                  ? onwards.semis > 0
                    ? 'up'
                    : onwards.semis < 0
                      ? 'down'
                      : 'nowhere'
                  : 'on',
                to: after ? formatNote(after.note) : 'a rest',
              },
              p,
            )
          } else {
            tags.push('suspension')
            if (explain) {
              reasons.push(
                fillTemplate(T.suspension, {
                  note: formatNote(n.note),
                  interval: v.text,
                  to: formatNote(after!.note),
                }),
              )
            }
          }
        } else add('cp-consonance', {}, p)
      } else if (v.perfect === 'unison' && v.semis === 0 && !first && !last) {
        add('cp-unison', {}, p)
      }
    } else if (v.kind === 'dissonant' && p.held) {
      // The melody moves while the line holds: a clash is fine where the
      // melody note passes or steps back (David's choice).
      if (!s.melodyPasses(p.m)) add('cp-melody-clash', {}, p)
    } else if (v.kind === 'dissonant' && !p.held && heldOver) {
      add('cp-preparation', {}, p)
    } else if (v.kind === 'dissonant' && !p.held) {
      const passing =
        !!towards?.step &&
        !!onwards?.step &&
        Math.sign(towards.semis) === Math.sign(onwards.semis)
      const neighbour =
        !!towards?.step &&
        !!onwards?.step &&
        Math.sign(towards.semis) === -Math.sign(onwards.semis)
      // A nota cambiata (third and fifth species): stepping down to the
      // dissonance, then a 3rd down; the note after steps back up.
      const cambiata =
        (o.species === 3 || o.species === 5) &&
        !!towards?.step &&
        towards.semis < 0 &&
        (pending || onwards?.letters === -2)
      if (cambiata) {
        tags.push('cambiata')
        if (explain && after) {
          reasons.push(
            fillTemplate(T.cambiata, {
              note: formatNote(n.note),
              interval: v.text,
              from: formatNote(before!.note),
              to: formatNote(after.note),
            }),
          )
        }
      } else if (pending) {
        if (!towards?.step) add('cp-dissonance-step', {}, p)
      } else if (!passing && !neighbour) add('cp-dissonance-step', {}, p)
      else if (neighbour && add('cp-passing-only', {}, p)) {
        // second species, strict: a dissonance only passes
      } else {
        tags.push(passing ? 'passing' : 'neighbour')
        if (explain) {
          reasons.push(
            fillTemplate(passing ? T.passing : T.neighbour, {
              note: formatNote(n.note),
              interval: v.text,
              from: formatNote(before!.note),
              to: formatNote(after!.note),
            }),
          )
        }
      }
    }
  }
  if (onset) {
    tags.push(onset.v.kind)
    if (onset.strong && onset.v.kind === 'imperfect') prefer += W.imperfect
    if (onset.strong && onset.v.kind === 'perfect' && !first && !last)
      prefer += W.perfectInside
  }
  if (points.some((p) => p.held && p.strong)) tags.push('tied')

  // Moving into this note with the melody.
  if (before && onset) {
    const prevPoints = pointsOf(s, before)
    const from = prevPoints.at(-1)
    if (from) {
      const melMove = s.melodyMidi[onset.m] - s.melodyMidi[from.m]
      const lineMove = n.midi - before.midi
      const way = lineMove > 0 ? 'up' : 'down'
      if (melMove !== 0 && lineMove !== 0) {
        const plural = onset.v.perfect === 'fifth' ? '5ths' : 'octaves'
        const similar = Math.sign(melMove) === Math.sign(lineMove)
        // The upper voice leaping: the line above, the melody below.
        const melLetters = Math.abs(
          letterSteps(s.ctx.melody[onset.m].note) -
            letterSteps(s.ctx.melody[from.m].note),
        )
        const upperLeaps = o.side === 'above' ? !towards!.step : melLetters > 1
        if (onset.v.perfect && from.v.perfect === onset.v.perfect) {
          const kind = similar
            ? `parallel ${plural}`
            : `consecutive ${plural} by contrary motion`
          add(
            'cp-parallel',
            { kind, short: onset.v.perfect === 'fifth' ? '5th' : 'octave' },
            onset,
          )
        } else if (
          onset.v.perfect === 'fifth' &&
          from.v.simple === 5 &&
          from.v.quality.startsWith('d')
        ) {
          add('cp-unequal', {}, onset)
        } else if (onset.v.perfect && similar && upperLeaps) {
          add(
            'cp-hidden',
            { short: onset.v.perfect === 'fifth' ? '5th' : 'octave' },
            onset,
          )
        }
        if (Math.sign(melMove) !== Math.sign(lineMove)) {
          prefer += W.contrary
          tags.push('contrary')
          if (explain) reasons.push(fillTemplate(T.contrary, { way }))
        } else {
          prefer += W.similarImperfect
          tags.push('similar')
          if (explain) reasons.push(fillTemplate(T.similar, { way }))
        }
      } else if (melMove !== 0 || lineMove !== 0) {
        prefer += W.oblique
        tags.push('oblique')
      }
    }
  }

  // After a cambiata's leap, the line steps back up.
  if (before && k >= 2 && (o.species === 3 || o.species === 5)) {
    const before2 = line[k - 2]
    const into = before2 && joined(before2, before) && move(before2, before)
    const leap = move(before, n)
    const was = pointsOf(s, before)[0]
    if (
      into &&
      into.step &&
      into.semis < 0 &&
      leap.letters === -2 &&
      was &&
      !was.strong &&
      was.v.kind === 'dissonant' &&
      !pending &&
      !(onwards && onwards.letters === 1 && onwards.step)
    ) {
      add('cp-cambiata', {})
    }
  }

  // Off-beats in a row (fourth species): 5ths or octaves on one off-beat
  // and the next, both voices moving.
  if (onset && !onset.strong && before) {
    const was = pointsOf(s, before)[0]
    if (
      was &&
      !was.strong &&
      onset.v.perfect &&
      was.v.perfect === onset.v.perfect &&
      s.melodyMidi[was.m] !== s.melodyMidi[onset.m] &&
      before.midi !== n.midi
    ) {
      add(
        'cp-offbeat-parallel',
        { kind: onset.v.perfect === 'fifth' ? '5ths' : 'octaves' },
        onset,
      )
    }
  }

  // Beats in a row: 5ths or octaves on successive beats, and runs of
  // 3rds or 6ths. Looks back over the beats before this note's.
  if (onset && onset.strong && !onset.held) {
    const earlier: Point[] = []
    for (let j = k - 1; j >= 0 && j >= k - 16 && earlier.length < 3; j--) {
      if (!line[j]) break
      const ps = pointsOf(s, line[j]).filter((p) => p.strong)
      for (let q = ps.length - 1; q >= 0 && earlier.length < 3; q--)
        earlier.push(ps[q])
    }
    const last1 = earlier[0]
    const immediate =
      before && last1 && same(last1.t, pointsOf(s, before).at(-1)!.t)
    if (
      last1 &&
      !immediate &&
      onset.v.perfect &&
      last1.v.perfect === onset.v.perfect &&
      s.melodyMidi[last1.m] !== s.melodyMidi[onset.m]
    ) {
      const kind = onset.v.perfect === 'fifth' ? '5ths' : 'octaves'
      add('cp-beat-parallel', { kind }, onset)
    }
    if (onset.v.kind === 'imperfect') {
      const type = onset.v.simple
      const run = earlier.findIndex(
        (p) => p.v.kind !== 'imperfect' || p.v.simple !== type,
      )
      const count = (run < 0 ? earlier.length : run) + 1
      if (count > 3) {
        add(
          'cp-run',
          {
            count: ORDINAL_WORDS[count] ?? `${count}th`,
            kind: type === 3 ? '3rd' : '6th',
          },
          onset,
        )
      }
    }
  }

  // The line's own moves.
  if (prev) {
    const m = move(prev, n)
    const size = Math.abs(m.letters)
    if (m.semis === 0) {
      if (before) {
        if (!add('cp-repeat', { species: speciesOf(o.species).short }))
          prefer += W.repeat
      }
    } else if (m.step) prefer += W.step
    else if (size === 2) prefer += W.third
    else if (size === 3) prefer += W.fourth
    else prefer += W.bigLeap * (size - 3)
    if (size >= 1 && m.semis !== 0) {
      let why = ''
      if (m.quality[0] === 'A' || m.quality[0] === 'd')
        why = 'which is awkward to sing'
      else if (m.number === 7) why = 'which is awkward to sing'
      else if (m.number > 8) why = 'more than an octave'
      else if (
        o.mode === 'strict' &&
        m.number === 6 &&
        !(m.quality === 'm' && m.semis > 0)
      ) {
        why =
          'and strict counterpoint only leaps a 6th when it is minor and rising'
      }
      if (why) add('cp-leap', { leap: leapWords(m), why })
    }
    const prev2 = k >= 2 && !first ? line[k - 2] : undefined
    // Rocking between two notes (E D E D) keeps the rules but goes nowhere.
    const prev3 = k >= 3 ? line[k - 3] : undefined
    if (prev2 && prev3 && prev2.midi === n.midi && prev3.midi === prev.midi) {
      prefer += W.rocking
    }
    if (prev2) {
      const leap = move(prev2, prev)
      if (
        Math.abs(leap.letters) >= 4 &&
        m.semis !== 0 &&
        Math.sign(m.semis) === Math.sign(leap.semis)
      ) {
        add('cp-recover', {
          move: m.semis > 0 ? 'up' : 'down',
          leap: leapWords(leap),
        })
      }
    }
  }

  // The key, and the chord (freer leans on it).
  const place = s.place(n.onset)
  const { tone, outside } = s.fit(n)
  const leading =
    !!after && nextLast && after.midi - n.midi === 1 && s.isLead(n)
  if (outside) {
    tags.push('chromatic')
    const raised = s.isRaisedLead(n)
    const sixth =
      s.isRaisedSixth(n) &&
      (pending || (!!after && onwards!.step && s.isRaisedLead(after)))
    if (sixth) {
      tags.push('raised-sixth')
      if (explain && after) {
        reasons.push(
          fillTemplate(T.raisedSixth, {
            note: formatNote(n.note),
            to: formatNote(after.note),
          }),
        )
      }
    }
    const allowed =
      (leading && raised) ||
      sixth ||
      (o.mode === 'freer' && !!tone) ||
      (pending && raised)
    if (!allowed) {
      add('cp-key', { exception: '' })
    }
  }
  if (leading) {
    tags.push('leading-note')
    if (explain)
      reasons.push(
        fillTemplate(T.leadingNote, {
          note: formatNote(n.note),
          to: formatNote(after!.note),
        }),
      )
  }
  if (tone && place.chord) {
    if (o.mode === 'freer' && onset?.strong) {
      prefer += W.chordTone
      tags.push('chord-tone')
    }
    if (explain && o.mode === 'freer') {
      reasons.push(
        fillTemplate(T.chordTone, { tone, chord: chordSymbol(place.chord) }),
      )
    }
  }

  // The ends.
  if (first && onset) {
    const v = onset.v
    const ok =
      v.perfect === 'unison' || (v.perfect === 'fifth' && o.side === 'above')
    if (!ok) add('cp-start', {}, onset)
  }
  if (last && onset) {
    const v = onset.v
    if (v.perfect !== 'unison') {
      // No cadence closes on anything but a unison or an octave. Where
      // the rules break either way, ending on the melody's note (with no
      // cadence) still sounds more finished than ending elsewhere.
      if (!add('cp-end', {}, onset)) prefer += W.notPerfectEnd + W.noCadence
      else prefer += W.notPerfectEnd
    } else {
      let why = ''
      const mi = onset.m
      const melPrev = mi > 0 ? s.ctx.melody[mi - 1] : undefined
      const melStep =
        melPrev &&
        Math.abs(
          (s.ctx.melody[mi].note.octave ?? 4) * 7 +
            letterIndex(s.ctx.melody[mi].note.letter) -
            ((melPrev.note.octave ?? 4) * 7 + letterIndex(melPrev.note.letter)),
        ) === 1
      if (!melStep) why = T.noFinal
      else {
        const melMove = s.melodyMidi[mi] - midiOf(melPrev!.note)
        if (
          !towards ||
          !towards.step ||
          Math.sign(towards.semis) === Math.sign(melMove)
        ) {
          why = T.noStep
        } else if (Math.abs(towards.semis) !== 1 && Math.abs(melMove) !== 1) {
          why =
            towards.semis > 0
              ? fillTemplate(T.noSemitone, {
                  lead: formatNote(before!.note),
                  raised: formatNote(
                    transposeDown(n.note, parseInterval('m2')!),
                  ),
                  final: formatNote(n.note),
                })
              : T.noLeading
        }
      }
      if (why) {
        if (!add('cp-cadence', { why })) prefer += W.noCadence
      } else {
        tags.push('cadence')
        if (explain) reasons.push(fillTemplate(T.cadence, { interval: v.text }))
      }
    }
  }

  if (explain && onset) {
    const lead = fillTemplate(onset.strong ? T.onBeat : T.consonant, {
      note: formatNote(n.note),
      interval: onset.v.text,
    })
    const plain = onset.v.kind !== 'dissonant' && !tags.includes('suspension')
    if (plain) reasons.unshift(lead)
    if (
      tags.includes('tied') &&
      !tags.includes('suspension') &&
      onset.v.kind !== 'dissonant'
    ) {
      reasons[0] = fillTemplate(T.prepared, {
        note: formatNote(n.note),
        interval: onset.v.text,
      })
    }
  }
  if (breaks.length) tags.push('break')
  return { breaks, prefer, tags: [...new Set(tags)], reasons }
}

// Every rule checked over a whole line, note by note: each note tagged and
// explained, with every break it makes.
export function checkCounterpoint(
  ctx: HarmonyContext,
  o: CounterpointOptions,
  notes: { note: Note; onset: Dur; length: Dur }[],
): { notes: HarmonyNote[]; breaks: CounterpointBreak[] } {
  if (!notes.length || !ctx.melody.length) return { notes: [], breaks: [] }
  const s = new Setting(ctx, o)
  const line: LineNote[] = notes.map((n) => ({
    note: n.note,
    midi: midiOf(n.note),
    onset: n.onset,
    length: n.length,
  }))
  const breaks: CounterpointBreak[] = []
  const out = line.map((n, k) => {
    const j = judge(s, line, k, {
      first: k === 0,
      last: k === line.length - 1,
      nextLast: k + 1 === line.length - 1,
      explain: true,
    })
    j.breaks.forEach((b) => breaks.push({ ...b, place: k }))
    const reasons = [...j.reasons]
    if (j.breaks.length)
      reasons.push(T.breaks + j.breaks.map((b) => b.text).join(' '))
    return {
      note: n.note,
      onset: n.onset,
      length: n.length,
      tags: j.tags,
      explanation: reasons.join(' '),
    }
  })
  const order = CP_RULES.map((r) => r.id)
  breaks.sort(
    (a, b) =>
      a.place - b.place || order.indexOf(a.ruleId) - order.indexOf(b.ruleId),
  )
  return { notes: out, breaks }
}

// The pieces a melody note can get in a species, as patterns of times,
// and whether a broken tie is weighed against. A pattern whose pieces are
// shorter than a 16th gives way to the next.
type Planned = {
  pieces: (Piece & { onset: Dur; length: Dur })[]
  cost: number
  key: string
}

function plans(spans: Span[], species: Species, i: number): Planned[] {
  const m = spans[i]
  const lastNote = i === spans.length - 1
  const joined = i > 0 && same(end(spans[i - 1]), m.onset)
  const shortest = dur(SHORTEST_PIECE[0], SHORTEST_PIECE[1])
  const whole: Piece[] = [{ share: [1, 1] }]
  const options = lastNote
    ? [whole]
    : i === 0
      ? (species.first ?? species.patterns)
      : species.patterns
  const fits = options.filter(
    (p) =>
      p.every(
        (x) =>
          compareDur(timesDur(m.length, x.share[0] / x.share[1]), shortest) >=
          0,
      ) &&
      (joined || !p.some((x) => x.tie)),
  )
  const usable = fits.length ? fits : [whole]
  const tieFits = usable.some((p) => p.some((x) => x.tie))
  // Species 1 to 3 have one rhythm; the 4th and 5th choose.
  const chosen = species.id <= 3 ? usable.slice(0, 1) : usable
  return chosen.map((p, n) => {
    let at = m.onset
    const pieces = p.map((x) => {
      const length = lengthOf(m.length, x.share)
      const piece = { ...x, onset: at, length }
      at = addDur(at, length)
      return piece
    })
    let cost = 0
    if (species.id === 4 && tieFits && !p.some((x) => x.tie))
      cost -= W.tieBroken
    if (species.id === 5 && !lastNote && p.length === 1 && n > 0)
      cost -= W.wholeInside
    return {
      pieces,
      cost,
      key: p
        .map(
          (x) =>
            `${x.share[0]}/${x.share[1]}${x.tie ? 't' : ''}${x.rest ? 'r' : ''}`,
        )
        .join(' '),
    }
  })
}

function lengthOf(length: Dur, [n, d]: [number, number]): Dur {
  return { n: length.n * n, d: length.d * d }
}

// The notes the line might play at a time: the key's (with the chord's in
// freer rules) within reach of the melody and the note before, and the
// leading note into the melody's last note.
function candidates(
  s: Setting,
  t: Dur,
  before: LineNote | undefined,
  lead: boolean,
  sixth = false,
): LineNote[] {
  const cached = `${durKey(t)} ${lead} ${sixth}`
  let all = s.reach.get(cached)
  if (!all) {
    all = reachable(s, t, lead, sixth)
    s.reach.set(cached, all)
  }
  return before
    ? all.filter((c) => Math.abs(c.midi - before.midi) <= CP_MAX_MOVE)
    : all
}

function reachable(
  s: Setting,
  t: Dur,
  lead: boolean,
  sixth: boolean,
): LineNote[] {
  const at = s.melodyAt(t)
  const mel = s.melodyMidi[at]
  const place = s.place(t)
  const spellings: Note[] = [...scaleNotes(place.key.tonic, place.key.mode)]
  if (s.o.mode === 'freer' && place.chord)
    spellings.push(...chordNotes(place.chord))
  const raised = lead ? s.raisedLead() : undefined
  if (raised) spellings.push(raised)
  const raisedSixth = sixth ? s.raisedSixth() : undefined
  if (raisedSixth) spellings.push(raisedSixth)
  const [lo, hi] =
    s.o.side === 'above'
      ? [mel, mel + CP_SPACING.max]
      : [mel - CP_SPACING.max, mel]
  const out: LineNote[] = []
  for (let c = lo; c <= hi; c++) {
    const spelling = spellings.find((n) => pitchClass(n) === mod(c, 12))
    if (!spelling) continue
    const note = noteAtMidi(spelling, c)
    if (!note) continue
    out.push({ note, midi: c, onset: t, length: ZERO })
  }
  return out
}

// A line as the search builds it: the newest note last, each holding the
// one before.
type Link = { n: LineNote; prev?: Link; count: number }
type State = { last?: Link; cost: number; pattern?: string; ahead?: number }

function windowOf(link: Link | undefined, size: number): LineNote[] {
  const out: LineNote[] = []
  for (let l = link; l && out.length < size; l = l.prev) out.push(l.n)
  return out.reverse()
}

const WINDOW = 14

function judgeLast(
  s: Setting,
  state: State,
  next: LineNote | undefined,
  { last = false, nextLast = false, pending = false } = {},
) {
  const link = state.last!
  const line = windowOf(link, WINDOW)
  if (next) line.push(next)
  const k = line.length - (next ? 2 : 1)
  const j = judge(s, line, k, {
    first: link.count === 1,
    last,
    nextLast,
    pending,
  })
  return j.breaks.length * W.breakCost - j.prefer
}

// The cost of the best last note after a line's note before last.
function bestEnding(s: Setting, st: State): number {
  const m = s.ctx.melody.at(-1)!
  let best = Infinity
  for (const c of candidates(s, m.onset, st.last!.n, false)) {
    const n = { ...c, length: m.length }
    const step = judgeLast(s, st, n, { nextLast: true })
    const ended: State = {
      last: { n, prev: st.last, count: st.last!.count + 1 },
      cost: 0,
    }
    best = Math.min(best, step + judgeLast(s, ended, undefined, { last: true }))
  }
  return best === Infinity ? 0 : best
}

function prune(states: State[], width = CP_BEAM): State[] {
  const rank = (st: State) => st.cost + (st.ahead ?? 0)
  return states
    .map((st, i) => ({ st, i }))
    .sort((a, b) => rank(a.st) - rank(b.st) || a.i - b.i)
    .slice(0, width)
    .map((x) => x.st)
}

// A line against the melody: the search keeps the best few lines note by
// note, weighing every break heavily and the rules' preferences lightly,
// so a line always comes out and any break left in it is explained.
export function counterpoint(
  ctx: HarmonyContext,
  o: CounterpointOptions,
): CounterpointLine {
  const id = counterpointId(o)
  if (!ctx.melody.length) return { id, notes: [], breaks: [] }
  const s = new Setting(ctx, o)
  const species = speciesOf(o.species)
  let states: State[] = [{ cost: 0 }]
  const lastMel = s.spans.length - 1
  s.spans.forEach((_, i) => {
    const next: State[] = []
    for (const plan of plans(s.spans, species, i)) {
      let partial: State[] = states.map((st) => ({
        last: st.last,
        cost:
          st.cost +
          plan.cost -
          (species.id === 5 && st.pattern === plan.key ? W.samePattern : 0),
        pattern: plan.key,
      }))
      plan.pieces.forEach((piece, p) => {
        if (piece.rest) return
        if (piece.tie) {
          partial = partial.map((st) =>
            st.last && same(end(st.last.n), piece.onset)
              ? {
                  ...st,
                  last: {
                    ...st.last,
                    n: {
                      ...st.last.n,
                      length: addDur(st.last.n.length, piece.length),
                    },
                  },
                }
              : st,
          )
          return
        }
        const lead = i === lastMel - 1 && p === plan.pieces.length - 1
        const final = i === lastMel && p === plan.pieces.length - 1
        const grown: State[] = []
        for (const st of partial) {
          const before = st.last?.n
          // The raised 6th may lead up to the leading note.
          const sixth = !lead && i >= lastMel - 2 && i < lastMel
          for (const c of candidates(s, piece.onset, before, lead, sixth)) {
            const n = { ...c, length: piece.length }
            const cost = st.last
              ? st.cost + judgeLast(s, st, n, { nextLast: final })
              : st.cost
            const grownState: State = {
              last: { n, prev: st.last, count: (st.last?.count ?? 0) + 1 },
              cost,
              pattern: st.pattern,
            }
            // The last note is weighed as it's placed, ends and all, and the
            // note before it by the best ending it leaves open.
            if (final) {
              grownState.cost += judgeLast(s, grownState, undefined, {
                last: true,
              })
            } else if (lead) grownState.ahead = bestEnding(s, grownState)
            else
              grownState.ahead = judgeLast(s, grownState, undefined, {
                pending: true,
              })
            grown.push(grownState)
          }
        }
        // Fifth species weighs several rhythms at once: fewer of each.
        partial = prune(grown, species.id === 5 ? CP_BEAM / 2 : CP_BEAM)
      })
      next.push(...partial)
    }
    states = prune(next)
  })
  const best = states.find((st) => st.last)
  const raw: LineNote[] = []
  for (let l = best?.last; l; l = l.prev) raw.push(l.n)
  raw.reverse()
  const checked = checkCounterpoint(ctx, o, raw)
  return { id, ...checked }
}

// A line as a suggestion for the Counterpoint tab: what it is, and the
// rules it keeps or breaks.
export function counterpointOption(
  ctx: HarmonyContext,
  o: CounterpointOptions,
): CounterpointSuggestion {
  const line = counterpoint(ctx, o)
  const count = line.breaks.length
  const parts = [
    count === 0
      ? fillTemplate(T.keeps, { mode: o.mode })
      : fillTemplate(T.broken, {
          count: String(count),
          s: count === 1 ? '' : 's',
          mode: o.mode,
        }) +
        [
          ...new Set(
            line.breaks.map(
              (b) => CP_RULES.find((r) => r.id === b.ruleId)!.label,
            ),
          ),
        ].join('; ') +
        '.',
  ]
  if (o.mode === 'freer') parts.push(T.freerNote)
  return makeSuggestion({
    candidate: line,
    score: -count,
    tags: [o.mode, o.side, ...(count ? ['break'] : [])],
    ruleIds: [`counterpoint-${line.id}`, ...line.breaks.map((b) => b.ruleId)],
    explanation: parts.join(' '),
  })
}

// Your own notes in a line (as in a harmony, task 17): an edit belongs to
// the line's note by its onset and the melody note sounding then. Once that
// melody note changes, the edit goes and the line's note comes back.
const sameNote = (a: Note, b: Note) =>
  a.letter === b.letter &&
  a.accidental === b.accidental &&
  (a.octave ?? 4) === (b.octave ?? 4)

function underAt(melody: MelodyNote[], t: Dur): Note | undefined {
  return melody.find(
    (m) => compareDur(m.onset, t) <= 0 && compareDur(t, end(m)) < 0,
  )?.note
}

export function counterpointEditAt(
  melody: MelodyNote[],
  line: HarmonyNote[],
  edits: HarmonyEdit[],
  place: number,
): HarmonyEdit | undefined {
  const n = line[place]
  if (!n) return undefined
  const under = underAt(melody, n.onset)
  return edits.find(
    (e) => same(e.at, n.onset) && !!under && sameNote(e.under, under),
  )
}

// The edits that still apply: the melody under each is unchanged and,
// given the line, the line still has a note there.
export function pruneCounterpointEdits(
  melody: MelodyNote[],
  edits: HarmonyEdit[],
  line?: HarmonyNote[],
): HarmonyEdit[] {
  return edits.filter((e) => {
    const under = underAt(melody, e.at)
    return (
      !!under &&
      sameNote(e.under, under) &&
      (!line || line.some((n) => same(n.onset, e.at)))
    )
  })
}

export function setCounterpointEdit(
  melody: MelodyNote[],
  line: HarmonyNote[],
  edits: HarmonyEdit[],
  place: number,
  note?: Note,
): HarmonyEdit[] {
  const n = line[place]
  const under = n && underAt(melody, n.onset)
  if (!n || !under) return edits
  const rest = clearCounterpointEdit(melody, line, edits, place)
  const edit: HarmonyEdit = { at: n.onset, under }
  if (note) edit.note = note
  return [...rest, edit]
}

export function clearCounterpointEdit(
  melody: MelodyNote[],
  line: HarmonyNote[],
  edits: HarmonyEdit[],
  place: number,
): HarmonyEdit[] {
  const edit = counterpointEditAt(melody, line, edits, place)
  return edit ? edits.filter((e) => e !== edit) : edits
}

// A line with your edits on it, checked again: your notes are tagged and
// any rule they break is explained. Every note keeps its place in the
// line; a note taken out leaves a rest.
export function editCounterpoint(
  ctx: HarmonyContext,
  o: CounterpointOptions,
  line: HarmonyNote[],
  edits: HarmonyEdit[],
): PlacedHarmonyNote[] {
  if (!edits.length) return line.map((n, place) => ({ ...n, place }))
  const kept: { n: HarmonyNote; place: number; edit?: HarmonyEdit }[] = []
  line.forEach((n, place) => {
    const edit = counterpointEditAt(ctx.melody, line, edits, place)
    if (edit && !edit.note) return
    kept.push({ n: edit?.note ? { ...n, note: edit.note } : n, place, edit })
  })
  const checked = checkCounterpoint(
    ctx,
    o,
    kept.map((k) => k.n),
  ).notes
  return checked.map((n, i) => {
    const { place, edit } = kept[i]
    if (!edit) return { ...n, place }
    return {
      ...n,
      tags: ['edited', ...n.tags],
      explanation: `${fillTemplate(T.edited, { was: formatNote(line[place].note) })} ${n.explanation}`,
      place,
      edited: true as const,
    }
  })
}

// Notes to play in place of one of a line's notes: the notes within reach
// there, those that break no more rules than the line's own first, each
// with what it keeps or breaks.
export function counterpointAlternatives(
  ctx: HarmonyContext,
  o: CounterpointOptions,
  line: PlacedHarmonyNote[],
  place: number,
  current: Note,
): Suggestion<{ note: Note; kind: string }>[] {
  const at = line.findIndex((n) => n.place === place)
  if (at < 0) return []
  const s = new Setting(ctx, o)
  const notes: LineNote[] = line.map((n) => ({
    note: n.note,
    midi: midiOf(n.note),
    onset: n.onset,
    length: n.length,
  }))
  const target = notes[at]
  const lead = at === notes.length - 2
  const count = (ns: LineNote[]) => {
    let breaks = 0
    let prefer = 0
    const texts: string[] = []
    for (
      let k = Math.max(0, at - 1);
      k <= Math.min(ns.length - 1, at + 2);
      k++
    ) {
      const j = judge(s, ns, k, {
        first: k === 0,
        last: k === ns.length - 1,
        nextLast: k + 1 === ns.length - 1,
        explain: k === at,
      })
      breaks += j.breaks.length
      prefer += j.prefer
      if (k === at) texts.push(...j.breaks.map((b) => b.text))
    }
    return { breaks, prefer, texts }
  }
  const base = count(notes)
  const out: Suggestion<{ note: Note; kind: string }>[] = []
  for (const c of candidates(
    s,
    target.onset,
    at > 0 ? notes[at - 1] : undefined,
    lead,
    at === notes.length - 3,
  )) {
    if (sameNote(c.note, current)) continue
    const trial = [...notes]
    trial[at] = { ...c, length: target.length }
    const r = count(trial)
    const j = judge(s, trial, at, {
      first: at === 0,
      last: at === trial.length - 1,
      nextLast: at + 1 === trial.length - 1,
      explain: true,
    })
    const added = r.breaks - base.breaks
    out.push(
      makeSuggestion({
        candidate: { note: c.note, kind: 'counterpoint' },
        score: -r.breaks * W.breakCost + r.prefer,
        tags:
          r.breaks > base.breaks
            ? [...j.tags.filter((t) => t !== 'break'), 'break']
            : j.tags.filter((t) => t !== 'break'),
        ruleIds: ['counterpoint-alternative'],
        explanation:
          added > 0
            ? `${T.breaks}${r.texts.join(' ')}`
            : `${j.reasons.join(' ')}${added < 0 ? ' Fewer breaks than now.' : ''}`.trim(),
      }),
    )
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 8)
}
