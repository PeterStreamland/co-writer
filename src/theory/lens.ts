// Voicing lenses (PLAN Phase 5 task 4, SPEC 8): classical, rock, open and
// jazz. Each lens offers its own voicings for every chord (lens-data.ts says
// which), then picks one per chord so the whole progression costs least:
// each voicing's own cost, the voice-leading cost from the one before
// (voice-leading.ts) and the rules it breaks (voice-rules.ts), all weighted
// the lens's way. The same chords and lens always give the same voicings.
// The search is generic, so the guitar's lens shapes (src/instruments) use
// it too.
import { chordIntervals } from './chord'
import { chordNotes, type ChordName } from './chord-symbol'
import { transpose, transposeDown } from './interval'
import { inversions } from './inversion'
import { midiNumber, parseNote, pitchClass, type Note } from './note'
import { scaleNotes, type Key } from './scale'
import { voiceLeading } from './voice-leading'
import { rulePenalty, voiceRuleHits, type RuleHit } from './voice-rules'
import { LENS_RULE_WEIGHTS, type Lens } from './voice-rules-data'
import { keyboardVoicing } from './voicing'
import {
  LENS_SETTINGS,
  type LensForm,
  type LensSettings,
  type Recolour,
} from './lens-data'

// One way a lens voices a chord: the chord it sounds (Cadd9 for C in the
// open lens; C5 for a power chord), its notes lowest first, the form it
// takes and how much the lens likes it (0 is its favourite).
export type LensVoicing = {
  chord: ChordName
  notes: Note[]
  form: string
  label: string
  cost: number
}

// A chord to voice and the key it is read in.
export type LensStep = { key: Key; chord: ChordName }

// The voicing a lens chose for a chord, the rules it breaks coming from the
// chord before (only those the lens cares about), and how far its voices
// moved.
export type LensChoice<V extends LensVoicing = LensVoicing> = {
  voicing: V
  hits: RuleHit[]
  movement: number
}

// The cost of a chord left as written when nothing in the lens fits it.
const FALLBACK_COST = 10
// Doubling costs in four-part writing: the root, then the 5th, then the
// 3rd; never the leading note. A diminished triad doubles its 3rd instead,
// and hardly ever its diminished 5th.
const DOUBLING_COST: Record<number, number> = { 1: 0, 5: 0.5, 3: 1.5 }
const DIMINISHED_DOUBLING_COST: Record<number, number> = { 3: 0, 1: 1, 5: 3 }
const OTHER_DOUBLING_COST = 2
// Leaving tones out when a chord has more than the voices: the 5th first.
const OMIT_FIFTH_COST = 0.5
const OMIT_OTHER_COST = 3

function pitch(note: Note): number {
  return midiNumber(note) as number
}

const rangeOf = ([low, high]: [string, string]): [number, number] => [
  pitch(parseNote(low) as Note),
  pitch(parseNote(high) as Note),
]

// Every octave of a note within a range.
function octaves(note: Note, [low, high]: [number, number]): Note[] {
  const found: Note[] = []
  for (let octave = 0; octave <= 9; octave++) {
    const placed = { ...note, octave }
    const midi = pitch(placed)
    if (midi >= low && midi <= high) found.push(placed)
  }
  return found
}

type Tone = { note: Note; number: number } // number: 1 root, 3 3rd, 5 5th…

function tonesOf(chord: ChordName, quality = chord.quality): Tone[] {
  const intervals = chordIntervals(quality)
  if (!intervals) throw new Error(`unknown chord quality ${quality}`)
  return intervals.map((i) => ({
    note: transpose(chord.root, i),
    number: ((i.number - 1) % 7) + 1,
  }))
}

// Every way to place a bass and upper notes within a form's ranges and
// gaps, lowest first, with no note doubled at the same pitch.
function place(
  bass: Note | undefined,
  upper: Note[],
  form: LensForm,
): Note[][] {
  const upperRange = rangeOf(form.upper)
  const voices = form.voices?.map(rangeOf)
  const basses = bass && form.bass ? octaves(bass, rangeOf(form.bass)) : [bass]
  const choices = upper.map((n) => octaves(n, upperRange))
  const found = new Map<string, Note[]>()
  const pick = (i: number, chosen: Note[]) => {
    if (i < choices.length) {
      for (const n of choices[i]) pick(i + 1, [...chosen, n])
      return
    }
    const sorted = [...chosen].sort((a, b) => pitch(a) - pitch(b))
    const midis = sorted.map(pitch)
    if (new Set(midis).size !== midis.length) return
    for (let k = 1; k < midis.length; k++) {
      const gap = midis[k] - midis[k - 1]
      if (gap < (form.minGap ?? 1) || gap > (form.maxGap ?? 127)) return
    }
    if (form.maxSpan !== undefined && midis.at(-1)! - midis[0] > form.maxSpan)
      return
    if (voices?.some(([lo, hi], k) => midis[k] < lo || midis[k] > hi)) return
    for (const b of basses) {
      if (b) {
        const gap = midis[0] - pitch(b)
        if (gap <= 0 || gap > (form.maxBassGap ?? 127)) continue
      }
      const notes = b ? [b, ...sorted] : sorted
      found.set(notes.map(pitch).join(), notes)
    }
  }
  pick(0, [])
  return [...found.values()]
}

type ToneSet = { bass: Note; upper: Note[]; cost: number }

// The tone sets for "all" forms: the bass, then every other tone once.
// With voices to fill (four-part writing), a chord short of tones doubles
// some, the root first; one with too many leaves some out, the 5th first;
// and a chord that fits may still leave out its 5th and double the root,
// as textbook V7s do.
function toneSets(
  chord: ChordName,
  quality: string,
  form: LensForm,
  key: Key,
): ToneSet[] {
  const tones = tonesOf(chord, quality)
  const bass = chord.bass ?? chord.root
  const bassPc = pitchClass(bass)
  const rest = tones.filter((t) => pitchClass(t.note) !== bassPc)
  const wanted = form.voices?.length
  if (!wanted || !form.double) {
    return [{ bass, upper: rest.map((t) => t.note), cost: 0 }]
  }
  const lead = pitchClass(transposeDown(key.tonic, { quality: 'm', number: 2 }))
  const intervals = (chordIntervals(quality) ?? []).map(
    (i) => `${i.quality}${i.number}`,
  )
  const doubling =
    intervals.join() === 'P1,m3,d5' ? DIMINISHED_DOUBLING_COST : DOUBLING_COST
  const sets: ToneSet[] = []
  // Doubles tones of the chord (not one left out) until the voices are
  // full.
  const fill = (pool: Tone[], from: number, upper: Note[], cost: number) => {
    if (upper.length === wanted) {
      sets.push({ bass, upper, cost })
      return
    }
    for (let i = from; i < pool.length; i++) {
      const t = pool[i]
      if (pitchClass(t.note) === lead) continue
      const extra = doubling[t.number] ?? OTHER_DOUBLING_COST
      fill(pool, i, [...upper, t.note], cost + extra)
    }
  }
  // Leaves tones out until the voices are full.
  const choose = (kept: Tone[], from: number, cost: number) => {
    if (kept.length === wanted) {
      const left = rest.filter((t) => !kept.includes(t))
      const omitted = left.reduce(
        (sum, t) => sum + (t.number === 5 ? OMIT_FIFTH_COST : OMIT_OTHER_COST),
        0,
      )
      sets.push({ bass, upper: kept.map((t) => t.note), cost: cost + omitted })
      return
    }
    for (let i = from; i < rest.length; i++) {
      choose([...kept, rest[i]], i + 1, cost)
    }
  }
  if (rest.length > wanted) choose([], 0, 0)
  else
    fill(
      tones,
      0,
      rest.map((t) => t.note),
      0,
    )
  const fifth = rest.find((t) => t.number === 5)
  if (fifth && rest.length <= wanted) {
    const pool = tones.filter((t) => t !== fifth)
    fill(
      pool,
      0,
      rest.filter((t) => t !== fifth).map((t) => t.note),
      OMIT_FIFTH_COST,
    )
  }
  return sets
}

function voicingsOfForm(
  chord: ChordName,
  quality: string,
  form: LensForm,
  settings: LensSettings,
  key: Key,
): LensVoicing[] {
  const voiced = { ...chord, quality }
  const make = (c: ChordName, notes: Note[], extra = 0): LensVoicing => ({
    chord: c,
    notes,
    form: form.id,
    label: form.label,
    cost: form.cost + extra,
  })
  const tones = tonesOf(chord, quality)
  const find = (n: number) => tones.find((t) => t.number === n)?.note
  switch (form.kind) {
    case 'all':
      return toneSets(voiced, quality, form, key).flatMap((set) =>
        place(set.bass, set.upper, form).map((notes) =>
          make(voiced, notes, set.cost),
        ),
      )
    case 'power': {
      const fifth = tones.find(
        (t) =>
          t.number === 5 &&
          pitchClass(t.note) === (pitchClass(chord.root) + 7) % 12,
      )?.note
      if (!fifth) return []
      const power: ChordName = { root: chord.root, quality: '5' }
      if (form.fifthBass) power.bass = fifth
      const [low, high] = form.fifthBass
        ? [fifth, chord.root]
        : [chord.root, fifth]
      return [[high], [high, low]].flatMap((upper) =>
        place(low, upper, form).map((notes) => make(power, notes)),
      )
    }
    case 'shell': {
      const third = find(3) ?? find(4) ?? find(2)
      const seventh = find(7) ?? find(6)
      if (!third || !seventh) return []
      return place(chord.bass ?? chord.root, [third, seventh], form).map(
        (notes) => make(voiced, notes),
      )
    }
    case 'rootless': {
      const full = settings.rootless?.[quality]?.find((q) =>
        fitsKey(chord, quality, q, key),
      )
      if (!full) return []
      const upper = tonesOf(chord, full)
        .filter((t) => t.number !== 1)
        .map((t) => t.note)
      const named: ChordName = { root: chord.root, quality: full }
      return place(undefined, upper, form).map((notes) => make(named, notes))
    }
    case 'drop-2': {
      if (tones.length !== 4 || chord.bass) return []
      const range = rangeOf(form.upper)
      return inversions(voiced).flatMap(({ chord: inverted }) => {
        const notes = keyboardVoicing(inverted, 'drop-2')
        if (!notes) return []
        return [-12, 0, 12].flatMap((shift) => {
          const moved = notes.map((n) => ({
            ...n,
            octave: (n.octave as number) + shift / 12,
          }))
          const midis = moved.map(pitch)
          return midis[0] >= range[0] && midis.at(-1)! <= range[1]
            ? [make(voiced, moved)]
            : []
        })
      })
    }
  }
}

// Whether the notes a colour adds to a chord are all in the key's scale.
function fitsKey(
  chord: ChordName,
  from: string,
  to: string,
  key: Key,
): boolean {
  const scale = new Set(scaleNotes(key.tonic, key.mode).map(pitchClass))
  const own = new Set(tonesOf(chord, from).map((t) => pitchClass(t.note)))
  return tonesOf(chord, to).every((t) => {
    const pc = pitchClass(t.note)
    return own.has(pc) || scale.has(pc)
  })
}

// The chord as written, close and open, when no form of the lens fits it.
function fallback(chord: ChordName): LensVoicing[] {
  return (['close', 'open'] as const).flatMap((style) => {
    const notes = keyboardVoicing(chord, style)
    return notes
      ? [
          {
            chord,
            notes,
            form: style,
            label: 'as written',
            cost: FALLBACK_COST,
          },
        ]
      : []
  })
}

// The qualities a lens may voice a chord as, with their costs: its colours
// that fit the key, and the chord as written.
export function lensColours(
  lens: Lens,
  key: Key,
  chord: ChordName,
): Recolour[] {
  const settings = LENS_SETTINGS[lens]
  const colours = (settings.recolour[chord.quality] ?? []).filter((c) =>
    fitsKey(chord, chord.quality, c.quality, key),
  )
  return [
    { quality: chord.quality, cost: colours.length ? settings.keep : 0 },
    ...colours,
  ]
}

// A chord named by the lowest note of a voicing: as a slash chord when that
// isn't the root (C5 with G lowest is C5/G), spelled as the chord spells it.
export function nameByLowest(chord: ChordName, notes: Note[]): ChordName {
  const named: ChordName = { root: chord.root, quality: chord.quality }
  if (notes.length === 0) return chord
  const lowest = notes.reduce((a, b) => (pitch(b) < pitch(a) ? b : a))
  const pc = pitchClass(lowest)
  if (pc === pitchClass(chord.root)) return named
  const tone =
    chordNotes(named).find((n) => pitchClass(n) === pc) ??
    (chord.bass && pitchClass(chord.bass) === pc ? chord.bass : lowest)
  named.bass = { letter: tone.letter, accidental: tone.accidental }
  return named
}

// Every keyboard voicing a lens offers for a chord in a key.
export function lensVoicings(
  lens: Lens,
  key: Key,
  chord: ChordName,
): LensVoicing[] {
  const settings = LENS_SETTINGS[lens]
  const found = lensColours(lens, key, chord).flatMap((colour) =>
    settings.forms.flatMap((form) =>
      voicingsOfForm(chord, colour.quality, form, settings, key).map((v) => ({
        ...v,
        cost: v.cost + colour.cost,
      })),
    ),
  )
  // The same notes reached two ways keep the cheaper. Each is named by its
  // lowest note (a drop-2 Em7 with G at the bottom is Em7/G), except
  // rootless voicings, which leave the bass to the bass player.
  const unique = new Map<string, LensVoicing>()
  for (const each of found) {
    const v =
      each.form === 'rootless'
        ? each
        : { ...each, chord: nameByLowest(each.chord, each.notes) }
    const id = `${v.form} ${v.notes.map(pitch).join()}`
    const seen = unique.get(id)
    if (!seen || v.cost < seen.cost) unique.set(id, v)
  }
  return unique.size ? [...unique.values()] : fallback(chord)
}

// Picks one voicing per chord for the least total cost: each voicing's own
// cost, the voice-leading cost from the one before and the rules broken,
// weighted the lens's way. Ties go to the voicing offered first, so the
// same input always gives the same voicings.
export function chooseVoicings<V extends LensVoicing>(
  lens: Lens,
  steps: LensStep[],
  candidates: V[][],
): LensChoice<V>[] {
  const settings = LENS_SETTINGS[lens]
  if (steps.length === 0) return []
  if (candidates.some((c) => c.length === 0)) {
    throw new Error('every chord needs at least one voicing')
  }
  const rules = (i: number, from: V | undefined, to: V) =>
    voiceRuleHits({
      key: steps[i].key,
      from: from && { chord: from.chord, notes: from.notes },
      to: { chord: to.chord, notes: to.notes },
      gain: settings.gain,
    }).filter((h) => LENS_RULE_WEIGHTS[lens][h.rule] > 0)
  // best[i][j]: least cost of a path ending on candidate j of chord i.
  let best = candidates[0].map(
    (v) => v.cost + rulePenalty(rules(0, undefined, v), lens),
  )
  const back: number[][] = [candidates[0].map(() => -1)]
  for (let i = 1; i < steps.length; i++) {
    const next: number[] = []
    const from: number[] = []
    candidates[i].forEach((to) => {
      let low = Infinity
      let at = -1
      candidates[i - 1].forEach((prev, k) => {
        if (best[k] + to.cost >= low) return
        const cost =
          best[k] +
          to.cost +
          voiceLeading(prev.notes, to.notes, settings.movement).cost +
          rulePenalty(rules(i, prev, to), lens)
        if (cost < low) {
          low = cost
          at = k
        }
      })
      next.push(low)
      from.push(at)
    })
    best = next
    back.push(from)
  }
  let j = best.indexOf(Math.min(...best))
  const picked: V[] = []
  for (let i = steps.length - 1; i >= 0; i--) {
    picked.unshift(candidates[i][j])
    j = back[i][j]
  }
  return picked.map((voicing, i) => {
    const before = picked[i - 1]
    return {
      voicing,
      hits: rules(i, before, voicing),
      movement: before ? voiceLeading(before.notes, voicing.notes).movement : 0,
    }
  })
}

// A progression voiced on the keyboard through a lens.
export function voiceProgression(lens: Lens, steps: LensStep[]): LensChoice[] {
  return chooseVoicings(
    lens,
    steps,
    steps.map((s) => lensVoicings(lens, s.key, s.chord)),
  )
}

// The baseline every lens must beat (PLAN Phase 5): each chord in close
// root position, centred on middle C, whatever bass it was written with.
export function rootPositionVoicing(chord: ChordName): Note[] {
  const notes = keyboardVoicing(
    { root: chord.root, quality: chord.quality },
    'close',
  )
  if (!notes) throw new Error(`no close voicing for ${chord.quality}`)
  return notes
}
