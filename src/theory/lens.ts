// Voicing lenses (PLAN Phase 5 task 4, SPEC 8): classical, rock, open and
// jazz. Each lens offers its own voicings for every chord (lens-data.ts says
// which), then picks one per chord so the whole progression costs least:
// each voicing's own cost, the voice-leading cost from the one before
// (voice-leading.ts) and the rules it breaks (voice-rules.ts), all weighted
// the lens's way. The same chords and lens always give the same voicings.
// The search is generic, so the guitar's lens shapes (src/instruments) use
// it too.
import { chordIntervals } from './chord'
import { chordNames, chordNotes, type ChordName } from './chord-symbol'
import { transpose, transposeDown } from './interval'
import { inversions } from './inversion'
import {
  formatNote,
  midiNumber,
  noteAtMidi,
  parseNote,
  pitchClass,
  type Note,
} from './note'
import { scaleNotes, type Key } from './scale'
import { voiceLeading } from './voice-leading'
import { rulePenalty, voiceRuleHits, type RuleHit } from './voice-rules'
import { ALL_LENSES, LENS_RULE_WEIGHTS, type Lens } from './voice-rules-data'
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
    case 'quartal':
      return quartal(voiced, form, key).map((v) =>
        make(nameVoicing(voiced, v.notes, key), v.notes, v.cost),
      )
    case 'cluster':
      return cluster(voiced, form, key).map((notes) =>
        make(nameVoicing(voiced, notes, key), notes),
      )
    case 'upper':
      return upperStructures(voiced, form, key).map((v) => ({
        ...make(nameVoicing(voiced, v.notes, key), v.notes),
        label: v.label,
      }))
    case 'drone':
      return drone(voiced, form, key).map((notes) => make(voiced, notes))
  }
}

// The notes the experimental forms may use: the key's, and the chord's own
// (in the chord's spelling), one per pitch class.
function poolOf(chord: ChordName, key: Key): Map<number, Note> {
  const pool = new Map<number, Note>()
  for (const t of tonesOf(chord)) pool.set(pitchClass(t.note), t.note)
  for (const n of scaleNotes(key.tonic, key.mode)) {
    if (!pool.has(pitchClass(n))) pool.set(pitchClass(n), n)
  }
  return pool
}

// Whether an added note clashes with the chord: a semitone above one of its
// tones (the ♭9 over the root, the 4th over a major 3rd, the ♭6 over the
// 5th: the avoid notes of arrangers' chord scales).
function clashes(chord: ChordName, pc: number): boolean {
  return clashSet(chord).has(pc)
}

// The pitch classes a semitone above a chord's tones, worked out once per
// chord.
const clashSets = new Map<string, Set<number>>()
function clashSet(chord: ChordName): Set<number> {
  const id = `${pitchClass(chord.root)} ${chord.quality}`
  let found = clashSets.get(id)
  if (!found) {
    found = new Set(tonesOf(chord).map((t) => (pitchClass(t.note) + 1) % 12))
    clashSets.set(id, found)
  }
  return found
}

// A bass under upper notes already placed: each octave in the form's range
// below them.
function withBass(bass: Note, upper: Note[], form: LensForm): Note[][] {
  if (!form.bass) return [upper]
  const low = Math.min(...upper.map(pitch))
  return octaves(bass, rangeOf(form.bass))
    .filter((b) => pitch(b) < low && low - pitch(b) <= 24)
    .map((b) => [b, ...upper])
}

// Notes of the key stacked in perfect 4ths from each starting note, the
// top one a major 3rd above the last where the key has it (E A D G B over
// D, the "So What" voicing). A stack must sound at least two of the
// chord's notes, counting the bass, and add no clash.
function quartal(
  chord: ChordName,
  form: LensForm,
  key: Key,
): { notes: Note[]; cost: number }[] {
  const pool = poolOf(chord, key)
  const own = new Set(tonesOf(chord).map((t) => pitchClass(t.note)))
  const bassPc = pitchClass(chord.bass ?? chord.root)
  const [fewest, most] = form.size ?? [3, 5]
  const range = rangeOf(form.upper)
  const fits = (n: Note) => pitch(n) >= range[0] && pitch(n) <= range[1]
  const spelled = (n: Note): Note | undefined => {
    const found = pool.get(pitchClass(n))
    if (!found) return undefined
    const pc = pitchClass(found)
    if (!own.has(pc) && clashes(chord, pc)) return undefined
    return noteAtMidi(found, pitch(n))
  }
  const found: { notes: Note[]; cost: number }[] = []
  const keep = (stack: Note[], cost: number) => {
    if (stack.length < fewest || !stack.every(fits)) return
    const sounded = new Set(
      [bassPc, ...stack.map(pitchClass)].filter((pc) => own.has(pc)),
    )
    if (sounded.size < 2) return
    for (const notes of withBass(chord.bass ?? chord.root, stack, form)) {
      found.push({ notes, cost })
    }
  }
  for (const start of pool.values()) {
    const pc = pitchClass(start)
    if (!own.has(pc) && clashes(chord, pc)) continue
    for (const first of octaves(start, range)) {
      const stack = [first]
      while (stack.length < most) {
        const next = spelled(
          transpose(stack.at(-1)!, { quality: 'P', number: 4 }),
        )
        if (!next) break
        stack.push(next)
        keep([...stack], 0)
        // The "So What" top: a major 3rd over a stack of 4ths.
        if (stack.length >= fewest && stack.length < most) {
          const top = spelled(
            transpose(stack.at(-1)!, { quality: 'M', number: 3 }),
          )
          if (top) keep([...stack, top], 0.5)
        }
      }
    }
  }
  return found
}

// The chord's tones (but the bass) packed within a 5th or so, with one or
// two notes of the key added that don't clash, so at least two sit a tone
// or a semitone apart.
function cluster(chord: ChordName, form: LensForm, key: Key): Note[][] {
  const pool = poolOf(chord, key)
  const own = tonesOf(chord)
  const bass = chord.bass ?? chord.root
  const rest = own
    .filter((t) => pitchClass(t.note) !== pitchClass(bass))
    .map((t) => t.note)
  const ownPcs = new Set(own.map((t) => pitchClass(t.note)))
  const added = [...pool.entries()]
    .filter(([pc]) => !ownPcs.has(pc) && !clashes(chord, pc))
    .map(([, n]) => n)
  const [fewest, most] = form.size ?? [3, 5]
  const sets: Note[][] = []
  added.forEach((a, i) => {
    sets.push([...rest, a])
    added.slice(i + 1).forEach((b) => sets.push([...rest, a, b]))
  })
  return sets
    .filter((set) => set.length >= fewest && set.length <= most)
    .flatMap((set) => place(bass, set, form))
    .filter((notes) => {
      const upper = notes.slice(1).map(pitch)
      return upper.some((m, k) => k > 0 && m - upper[k - 1] <= 2)
    })
}

// A triad from the key above the root and the chord's 3rd and 7th: one
// with a different root that adds at least one note not in the chord, none
// of them clashing (Em over Cmaj7 adds the 9th; Dm over G7 the 13th).
function upperStructures(
  chord: ChordName,
  form: LensForm,
  key: Key,
): { notes: Note[]; label: string }[] {
  const tones = tonesOf(chord)
  const ownPcs = new Set(tones.map((t) => pitchClass(t.note)))
  const third = tones.find((t) => t.number === 3)?.note
  if (!third) return []
  const seventh = tones.find((t) => t.number === 7)?.note
  const guides = seventh && !form.thirdOnly ? [third, seventh] : [third]
  const scale = scaleNotes(key.tonic, key.mode)
  if (scale.length !== 7) return []
  const triads = scale.flatMap((root, i) => {
    const notes = [root, scale[(i + 2) % 7], scale[(i + 4) % 7]]
    const [r, t, f] = notes.map(pitchClass)
    const shape = `${(t - r + 12) % 12},${(f - r + 12) % 12}`
    if (shape !== '4,7' && shape !== '3,7') return []
    if (r === pitchClass(chord.root)) return []
    if (!notes.some((n) => !ownPcs.has(pitchClass(n)))) return []
    if (
      notes.some(
        (n) => !ownPcs.has(pitchClass(n)) && clashes(chord, pitchClass(n)),
      )
    )
      return []
    const name = `${formatNote(root)}${shape === '3,7' ? 'm' : ''}`
    return [{ notes, name }]
  })
  const guideRange = rangeOf(form.guide ?? form.upper)
  const placedGuides = guides
    .map((g) => octaves(g, guideRange))
    .reduce<Note[][]>(
      (all, options) => all.flatMap((a) => options.map((o) => [...a, o])),
      [[]],
    )
    .map((g) => g.sort((a, b) => pitch(a) - pitch(b)))
  const found: { notes: Note[]; label: string }[] = []
  for (const triad of triads) {
    for (const top of place(undefined, triad.notes, form)) {
      for (const guide of placedGuides) {
        if (pitch(guide.at(-1)!) >= pitch(top[0])) continue
        for (const notes of withBass(chord.root, [...guide, ...top], form)) {
          found.push({
            notes,
            label: `${triad.name} over ${formatNote(chord.root)}`,
          })
        }
      }
    }
  }
  return found
}

// The key's tonic held low (with its 5th, in the form that asks), the chord
// in close position above it (without its own 5th, in the lighter form, as
// guitarists play it).
function drone(chord: ChordName, form: LensForm, key: Key): Note[][] {
  const tones = tonesOf(chord)
    .filter(
      (t) => !(form.omitFifth && t.number === 5 && tonesOf(chord).length > 3),
    )
    .map((t) => t.note)
  const above = place(undefined, tones, form)
  const tonic = key.tonic
  const fifth = transpose(tonic, { quality: 'P', number: 5 })
  return octaves(tonic, rangeOf(form.bass ?? form.upper)).flatMap((low) => {
    const held = form.fifth
      ? [low, noteAtMidi(fifth, pitch(low) + 7) as Note]
      : [low]
    const top = pitch(held.at(-1)!)
    return above
      .filter((upper) => pitch(upper[0]) > top && pitch(upper[0]) - top <= 24)
      .map((upper) => [...held, ...upper])
  })
}

// A voicing's name from its notes, read in the key, keeping the chord's
// root where a name allows (C D E G over C is Cadd9); otherwise the chord
// named by its lowest note.
function nameVoicing(chord: ChordName, notes: Note[], key: Key): ChordName {
  // Many voicings share their notes' spellings and lowest note, and naming
  // is slow, so names are kept for reuse.
  const lowest = notes.reduce((a, b) => (pitch(b) < pitch(a) ? b : a))
  const spell = (n: Note) => `${n.letter}${n.accidental}`
  const id = [
    formatNote(key.tonic),
    key.mode,
    spell(chord.root),
    chord.quality,
    spell(lowest),
    ...[...new Set(notes.map(spell))].sort(),
  ].join(' ')
  const known = voicingNames.get(id)
  if (known) return known
  if (voicingNames.size > MAX_KEPT_NAMES) voicingNames.clear()
  const named = nameFromNotes(chord, notes, key)
  voicingNames.set(id, named)
  return named
}

const voicingNames = new Map<string, ChordName>()
const MAX_KEPT_NAMES = 5000

function nameFromNotes(chord: ChordName, notes: Note[], key: Key): ChordName {
  const names = chordNames(notes, { key })
  const same = names.find((n) => pitchClass(n.root) === pitchClass(chord.root))
  if (!same || same.omitted?.length) return nameByLowest(chord, notes)
  const named: ChordName = { root: same.root, quality: same.quality }
  if (same.bass) named.bass = same.bass
  return named
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

// Every keyboard voicing a lens offers for a chord in a key. The Wildcard
// draws on chance, from `random` (0 to 1).
export function lensVoicings(
  lens: Lens,
  key: Key,
  chord: ChordName,
  random: () => number = Math.random,
): LensVoicing[] {
  if (lens === 'wildcard') return wildcardVoicings(key, chord, random)
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
export function voiceProgression(
  lens: Lens,
  steps: LensStep[],
  random: () => number = Math.random,
): LensChoice[] {
  return chooseVoicings(
    lens,
    steps,
    steps.map((s) => lensVoicings(lens, s.key, s.chord, random)),
  )
}

// The Wildcard (David's request): every other lens's voicings for a chord,
// each lens's few favourites after a roll of chance, labelled with the lens
// they come from. The search still weighs how they move, lightly, so the
// result is surprising but hangs together. A fresh `random` gives a fresh
// result every time.
const WILD_CHANCE = 8 // points of chance added to each voicing's cost
const WILD_KEEP = 6 // voicings kept from each lens
const WILD_TASTE = 0.25 // how much each lens's own liking still counts

export function wildcardVoicings(
  key: Key,
  chord: ChordName,
  random: () => number,
): LensVoicing[] {
  return wildcardPick(
    ALL_LENSES.filter((l) => l !== 'wildcard'),
    (lens) => lensVoicings(lens, key, chord),
    random,
  )
}

// Rolls chance over each lens's voicings and keeps a few from each, so the
// guitar's Wildcard can share it.
export function wildcardPick<V extends LensVoicing>(
  lenses: Lens[],
  voicingsOf: (lens: Lens) => V[],
  random: () => number,
): V[] {
  return lenses.flatMap((lens) =>
    voicingsOf(lens)
      .map((v) => ({
        ...v,
        label: `${LENS_SETTINGS[lens].name}: ${v.label}`,
        cost: v.cost * WILD_TASTE + random() * WILD_CHANCE,
      }))
      .sort((a, b) => a.cost - b.cost)
      .slice(0, WILD_KEEP),
  )
}

// A repeatable stream of chance from a seed (mulberry32), for tests and for
// holding one roll steady while the page redraws.
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
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
