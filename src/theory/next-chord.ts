// Candidate generators for the next-chord engine (PLAN Phase 4 task 2, SPEC
// 6). Given the key and the chords so far, each generator proposes chords
// under one category, every one with its rule id, a neutral score and an
// explanation filled from its rule's template. Style profiles and the ranker
// (tasks 3 and 4) reweight and trim this list; the generators only say what
// is possible and why.
import {
  chordsInScale,
  chordSymbol,
  diatonicChords,
  hasDiatonicChords,
  type Chord,
} from './chord'
import { chordNotes, type ChordName } from './chord-symbol'
import {
  degreeLabel,
  parseInterval,
  transpose,
  transposeDown,
} from './interval'
import type { Interval } from './interval'
import { formatNote, pitchClass, type Note } from './note'
import { describeNumeral, keyName, romanNumeral } from './numeral'
import { getScale, keySignature, scaleNotes, type Key } from './scale'
import { MAX_WEIGHT, styleScore, type StyleWeights } from './style'
import {
  SUGGESTION_CATEGORIES,
  chordKey,
  fillTemplate,
  makeChordSuggestion,
  sortSuggestions,
  suggestionCategory,
  type ChordSuggestion,
} from './suggestion'
import {
  BORROW_SOURCES,
  DEGREE_ADJUSTMENTS,
  DEGREE_FUNCTIONS,
  FUNCTION_FLOW,
  FUNCTION_ROLES,
  MEDIANT_INTERVALS,
  NEXT_CHORD_RULES,
  PEDAL_INTERVALS,
  PIVOT_DEGREES,
  POWER_CHORD_INTERVALS,
  ROCK_MOVES,
  START_SCORES,
  type HarmonicFunction,
  type NextChordRule,
  type NextChordRuleId,
} from './next-chord-data'

export {
  NEXT_CHORD_RULES,
  type NextChordRule,
  type NextChordRuleId,
} from './next-chord-data'

// The chords so far, oldest first; the last one is the chord to follow.
// With weights (a blended style, see style.ts), each reading's score is
// scaled by its rule's weight; without them every rule counts in full.
export type NextChordContext = {
  key: Key
  previous: readonly ChordName[]
  weights?: StyleWeights
}

// A modulation suggestion also carries the key it leads into (SPEC 6.4).
export type NextChordSuggestion = ChordSuggestion & { keyChange?: Key }

type Candidate = {
  chord: ChordName
  rule: NextChordRuleId
  score?: number
  values: Record<string, string>
  tags?: string[]
  keyChange?: Key
}

type Context = {
  key: Key
  previous: ChordName
  // Whether the key's scale stacks in thirds (major, minor and their modes).
  stacks: boolean
}

const RULES = new Map<string, NextChordRule>(
  NEXT_CHORD_RULES.map((rule) => [rule.id, rule]),
)

function interval(text: string): Interval {
  const parsed = parseInterval(text)
  if (!parsed) throw new Error(`bad interval ${text}`)
  return parsed
}

const PERFECT_5TH = interval('P5')
const MAJOR_3RD = interval('M3')
const MINOR_2ND = interval('m2')

function sameNote(a: Note, b: Note): boolean {
  return a.letter === b.letter && a.accidental === b.accidental
}

function sameChord(a: ChordName, b: ChordName): boolean {
  return (
    sameNote(a.root, b.root) &&
    a.quality === b.quality &&
    (a.bass && b.bass ? sameNote(a.bass, b.bass) : !a.bass && !b.bass)
  )
}

function name(chord: ChordName): string {
  return chordSymbol(chord)
}

function plain(chord: Chord): ChordName {
  return { root: chord.root, quality: chord.quality }
}

function isNaturalMinor(key: Key): boolean {
  return getScale(key.mode)?.id === 'natural-minor'
}

// The key's major, minor and diminished triads: stacked in thirds where the
// scale allows, otherwise every such triad in the scale (pentatonics, blues).
function triads(key: Key): Chord[] {
  if (hasDiatonicChords(key.mode)) return diatonicChords(key, 'triad')
  return chordsInScale(key).filter((c) => ['M', 'm', 'dim'].includes(c.quality))
}

// The key's home chord: its triad on the tonic, or a power chord where the
// scale has none.
function tonicChord(key: Key): ChordName {
  const triad = triads(key).find((t) => sameNote(t.root, key.tonic))
  return triad ? plain(triad) : { root: key.tonic, quality: '5' }
}

function functionOf(key: Key, chord: ChordName): HarmonicFunction | undefined {
  return DEGREE_FUNCTIONS[degreeLabel(key.tonic, chord.root)]
}

function numeral(key: Key, chord: ChordName): string {
  return romanNumeral(key, chord).numeral
}

// Diatonic: the key's triads, and V7 where the key has one, scored by how
// the previous chord's function flows into theirs. With nothing picked yet,
// they are scored as places to start.
function diatonic(key: Key, previous: ChordName | undefined): Candidate[] {
  const chords = triads(key).map(plain)
  if (hasDiatonicChords(key.mode)) {
    const seventh = diatonicChords(key, 'seventh').find((c) => c.degree === 5)
    if (seventh?.quality === '7') chords.push(plain(seventh))
  }
  const before = previous && functionOf(key, previous)
  const tonic = name(tonicChord(key))
  const candidates: Candidate[] = []
  for (const chord of chords) {
    const label = degreeLabel(key.tonic, chord.root)
    const fn = DEGREE_FUNCTIONS[label]
    if (!fn) continue
    const values = { numeral: numeral(key, chord), role: FUNCTION_ROLES[fn] }
    const tags = [fn]
    if (!previous) {
      candidates.push({
        chord,
        rule: 'diatonic.start',
        score: START_SCORES[label] ?? 1,
        values: { ...values, keyName: keyName(key) },
        tags,
      })
    } else if (
      before === 'dominant' &&
      degreeLabel(key.tonic, previous.root) === '5' &&
      (label === '6' || label === '♭6') &&
      (chord.quality === 'M' || chord.quality === 'm')
    ) {
      candidates.push({
        chord,
        rule: 'diatonic.deceptive',
        values: { ...values, previous: name(previous), tonicChord: tonic },
        tags: [...tags, 'cadence'],
      })
    } else {
      const flow = FUNCTION_FLOW[before ?? 'tonic'][fn]
      candidates.push({
        chord,
        rule: 'diatonic.function',
        score: flow.score + (DEGREE_ADJUSTMENTS[label] ?? 0),
        values: {
          ...values,
          flow: fillTemplate(flow.text, { previous: name(previous) }),
        },
        tags,
      })
    }
  }
  candidates.push(...minorDominant(key, previous, before))
  return candidates
}

// A natural-minor key's dominant is usually major, from harmonic minor:
// B and B7 in E minor, whose D♯ leads home to Em.
function minorDominant(
  key: Key,
  previous: ChordName | undefined,
  before: HarmonicFunction | undefined,
): Candidate[] {
  if (!isNaturalMinor(key)) return []
  const root = scaleNotes(key.tonic, key.mode)[4]
  const score = previous
    ? FUNCTION_FLOW[before ?? 'tonic'].dominant.score
    : (START_SCORES['5'] ?? 1)
  return ['M', '7'].map((quality) => ({
    chord: { root, quality },
    rule: 'diatonic.minor-dominant',
    score,
    values: {
      numeral: numeral(key, { root, quality }),
      source: keyName({ tonic: key.tonic, mode: 'harmonic-minor' }),
      leadingNote: formatNote(transpose(root, MAJOR_3RD)),
      tonicChord: name(tonicChord(key)),
    },
    tags: ['dominant'],
  }))
}

// After a secondary chord, the chord it points at: E7 (V7/vi) goes to Am.
function resolveSecondary(ctx: Context): Candidate[] {
  const { key, previous } = ctx
  const reading = romanNumeral(key, previous)
  const target = reading.target
  if (reading.kind !== 'secondary' || !target) return []
  const triad = diatonicChords(key, 'triad').find(
    (t) => t.degree === target.degree,
  )
  if (!triad) return []
  const quality = /[IV]/.test(target.numeral) ? 'M' : 'm'
  const chord = { root: triad.root, quality }
  return [
    {
      chord,
      rule: 'diatonic.resolve-secondary',
      values: {
        numeral: numeral(key, chord),
        previous: name(previous),
        previousNumeral: reading.numeral,
      },
      tags: ['resolution'],
    },
  ]
}

// The key's major and minor triads that secondary chords can aim at: not
// the tonic, and not ♭VII (SPEC 4). A natural-minor key's v counts as V.
function secondaryTargets(key: Key): ChordName[] {
  return diatonicChords(key, 'triad')
    .filter(
      (t) =>
        t.degree !== 1 &&
        (t.quality === 'M' || t.quality === 'm') &&
        degreeLabel(key.tonic, t.root) !== '♭7',
    )
    .map((t) => ({
      root: t.root,
      quality: t.degree === 5 && isNaturalMinor(key) ? 'M' : t.quality,
    }))
}

function targetKeyName(target: ChordName): string {
  const mode = target.quality === 'M' ? 'major' : 'natural-minor'
  return keyName({ tonic: target.root, mode })
}

// Secondary: a dominant 7th a 5th above each target (V7/vi) and a dim7 a
// semitone below it (vii°7/vi), kept only where the numeral reads them as
// secondary (D7 in E minor is the key's own ♭VII7).
function secondary(ctx: Context): Candidate[] {
  const { key } = ctx
  const candidates: Candidate[] = []
  for (const target of secondaryTargets(key)) {
    const values = {
      target: targetKeyName(target),
      resolution: name(target),
    }
    const dominant = {
      root: transpose(target.root, PERFECT_5TH),
      quality: '7',
    }
    const asDominant = romanNumeral(key, dominant)
    if (asDominant.kind === 'secondary') {
      candidates.push({
        chord: dominant,
        rule: 'secondary.dominant',
        values: {
          ...values,
          numeral: asDominant.numeral,
          leadingNote: formatNote(transpose(dominant.root, MAJOR_3RD)),
        },
        tags: ['dominant'],
      })
    }
    const leading = {
      root: transposeDown(target.root, MINOR_2ND),
      quality: 'dim7',
    }
    const asLeading = romanNumeral(key, leading)
    if (asLeading.kind === 'secondary') {
      candidates.push({
        chord: leading,
        rule: 'secondary.leading-note',
        values: {
          ...values,
          numeral: asLeading.numeral,
          root: formatNote(leading.root),
        },
        tags: ['leading-note'],
      })
    }
  }
  return candidates
}

// Sharps minus flats in a scale's notes: more means brighter.
function brightness(key: Key): number {
  return scaleNotes(key.tonic, key.mode).reduce(
    (sum, n) => sum + n.accidental,
    0,
  )
}

// Borrowed: major and minor triads from a parallel mode, credited to the
// closest source the numeral names (A♭ in C is from C Aeolian, not Phrygian).
function borrowed(ctx: Context): Candidate[] {
  const { key } = ctx
  const own = getScale(key.mode)?.id
  const candidates: Candidate[] = []
  for (const { mode, rule } of BORROW_SOURCES) {
    if (mode === own) continue
    const source = { tonic: key.tonic, mode }
    for (const triad of diatonicChords(source, 'triad')) {
      if (triad.quality !== 'M' && triad.quality !== 'm') continue
      // A minor key's major V is its own dominant (minorDominant).
      if (isNaturalMinor(key) && triad.degree === 5) continue
      const chord = plain(triad)
      const reading = romanNumeral(key, chord)
      if (reading.kind !== 'borrowed' || reading.sources?.[0]?.mode !== mode) {
        continue
      }
      candidates.push({
        chord,
        rule,
        values: {
          description: describeNumeral(key, reading),
          colour:
            brightness(source) < brightness(key) ? 'darkens' : 'brightens',
        },
        tags: [mode],
      })
    }
  }
  return candidates
}

// Tritone substitutes: the dominant 7th a semitone above each target, in
// place of the target's own dominant (D♭7 for G7, heading to C). Targets on
// a lowered degree are left out, as their substitutes read awkwardly (in E
// minor, D♭7 heading to C would be 𝄫VII7).
function tritoneSubs(ctx: Context): Candidate[] {
  const { key } = ctx
  const targets = [tonicChord(key), ...secondaryTargets(key)].filter((t) =>
    /^\d$/.test(degreeLabel(key.tonic, t.root)),
  )
  return targets.map((target) => {
    const dominantRoot = transpose(target.root, PERFECT_5TH)
    const [, third, , seventh] = chordNotes({
      root: dominantRoot,
      quality: '7',
    })
    const chord = { root: transpose(target.root, MINOR_2ND), quality: '7' }
    return {
      chord,
      rule: 'chromatic.tritone-sub',
      values: {
        numeral: numeral(key, chord),
        dominant: name({ root: dominantRoot, quality: '7' }),
        tritone: `${formatNote(third)}–${formatNote(seventh)}`,
        resolution: name(target),
      },
      tags: ['substitution'],
    }
  })
}

// Chromatic mediants of the previous major or minor triad: the same quality
// a 3rd away, sharing just one note (C to E, A♭, A or E♭).
function mediants(ctx: Context): Candidate[] {
  const { key, previous } = ctx
  if (previous.quality !== 'M' && previous.quality !== 'm') return []
  const from = { root: previous.root, quality: previous.quality }
  const fromNotes = chordNotes(from)
  const candidates: Candidate[] = []
  for (const step of MEDIANT_INTERVALS) {
    const root = step.down
      ? transposeDown(from.root, interval(step.interval))
      : transpose(from.root, interval(step.interval))
    const chord = { root, quality: from.quality }
    if (romanNumeral(key, chord).kind === 'diatonic') continue
    const common = chordNotes(chord).filter((n) =>
      fromNotes.some((f) => pitchClass(f) === pitchClass(n)),
    )
    if (common.length !== 1) continue
    candidates.push({
      chord,
      rule: 'chromatic.mediant',
      values: {
        numeral: numeral(key, chord),
        previous: name(from),
        interval: step.name,
        common: formatNote(common[0]),
      },
      tags: ['mediant'],
    })
  }
  return candidates
}

// Modulation: for each closely related key (a major or minor triad of this
// key whose signature is at most one sharp or flat away), a chord both keys
// share, preferring one that is a predominant in the new key.
function pivots(ctx: Context): Candidate[] {
  const { key, previous } = ctx
  const signature = keySignature(key)
  if (signature === undefined) return []
  const own = diatonicChords(key, 'triad')
  const candidates: Candidate[] = []
  for (const triad of own) {
    if (triad.degree === 1) continue
    if (triad.quality !== 'M' && triad.quality !== 'm') continue
    const newKey: Key = {
      tonic: triad.root,
      mode: triad.quality === 'M' ? 'major' : 'natural-minor',
    }
    const theirs = keySignature(newKey)
    if (theirs === undefined || Math.abs(theirs - signature) > 1) continue
    const shared = diatonicChords(newKey, 'triad').filter(
      (c) =>
        (c.quality === 'M' || c.quality === 'm') &&
        own.some((o) => sameChord(plain(o), plain(c))) &&
        !sameChord(plain(c), previous),
    )
    const pivot = PIVOT_DEGREES.map((d) =>
      shared.find((c) => c.degree === d),
    ).find((c) => c !== undefined)
    if (!pivot) continue
    const chord = plain(pivot)
    candidates.push({
      chord,
      rule: 'modulation.pivot',
      values: {
        numeral: numeral(key, chord),
        keyName: keyName(key),
        newNumeral: numeral(newKey, chord),
        newKeyName: keyName(newKey),
      },
      tags: ['pivot'],
      keyChange: newKey,
    })
  }
  return candidates
}

// Rock moves: major chords on ♭VII, ♭VI and ♭III, and power-chord riffs
// when the previous chord is a power chord.
function rock(ctx: Context): Candidate[] {
  const { key, previous } = ctx
  const tonic = name(tonicChord(key))
  const candidates: Candidate[] = ROCK_MOVES.map((move) => {
    const root = move.down
      ? transposeDown(key.tonic, interval(move.interval))
      : transpose(key.tonic, interval(move.interval))
    const chord = { root, quality: 'M' }
    return {
      chord,
      rule: move.rule,
      values: { numeral: numeral(key, chord), tonicChord: tonic },
    }
  })
  if (previous.quality === '5') {
    for (const step of POWER_CHORD_INTERVALS) {
      const chord = { root: transpose(key.tonic, interval(step)), quality: '5' }
      candidates.push({
        chord,
        rule: 'rock.power-chord',
        values: { numeral: numeral(key, chord) },
        tags: ['power chord'],
      })
    }
  }
  return candidates
}

// Pedal and static harmony: stay put, move the harmony over the previous
// bass note, or suspend the previous chord's 3rd.
function pedal(ctx: Context): Candidate[] {
  const { key, previous } = ctx
  const candidates: Candidate[] = [
    { chord: previous, rule: 'pedal.static', values: {}, tags: ['static'] },
  ]
  const bass = previous.bass ?? previous.root
  const keyTriads = triads(key)
  for (const step of PEDAL_INTERVALS) {
    const root = transpose(bass, interval(step))
    const triad = keyTriads.find((t) => sameNote(t.root, root))
    if (!triad) continue
    const chord = { root, quality: triad.quality, bass }
    candidates.push({
      chord,
      rule: 'pedal.bass',
      values: { numeral: numeral(key, chord), pedal: formatNote(bass) },
      tags: ['pedal point'],
    })
  }
  if (previous.quality === 'M' || previous.quality === 'm') {
    for (const [quality, replacement] of [
      ['sus4', '4th'],
      ['sus2', '2nd'],
    ]) {
      const chord = { root: previous.root, quality }
      if (romanNumeral(key, chord).kind !== 'diatonic') continue
      candidates.push({
        chord,
        rule: 'pedal.sus',
        values: { previous: name(previous), replacement },
        tags: ['suspension'],
      })
    }
  }
  return candidates
}

function toSuggestion(
  candidate: Candidate,
  weights: StyleWeights | undefined,
): NextChordSuggestion {
  const rule = RULES.get(candidate.rule)
  if (!rule) throw new Error(`unknown rule ${candidate.rule}`)
  const suggestion: NextChordSuggestion = makeChordSuggestion({
    candidate: candidate.chord,
    score: styleScore(
      candidate.score ?? rule.weight,
      weights?.[rule.id] ?? MAX_WEIGHT,
    ),
    tags: [rule.category, ...(candidate.tags ?? [])],
    ruleIds: [rule.id],
    explanation: fillTemplate(rule.template, {
      chord: name(candidate.chord),
      ...candidate.values,
    }),
  })
  if (candidate.keyChange) suggestion.keyChange = candidate.keyChange
  return suggestion
}

function categoryRank(s: ChordSuggestion): number {
  const category = suggestionCategory(s)
  return category ? SUGGESTION_CATEGORIES.indexOf(category) : 0
}

// One suggestion per chord (and key change): the highest-scoring reading
// leads, with the category order breaking ties; the others add their rule
// ids and tags, and their explanations go under "More".
function merge(group: NextChordSuggestion[]): NextChordSuggestion {
  const [lead, ...rest] = [...group].sort(
    (a, b) => b.score - a.score || categoryRank(a) - categoryRank(b),
  )
  if (!rest.length) return lead
  const extraTags = rest.flatMap((s) => s.tags.slice(1))
  const merged: NextChordSuggestion = makeChordSuggestion({
    candidate: lead.candidate,
    score: lead.score,
    tags: [...lead.tags, ...extraTags],
    ruleIds: [...lead.ruleIds, ...rest.flatMap((s) => s.ruleIds)],
    explanation: lead.explanation,
    more: rest.map((s) => s.explanation).join(' '),
  })
  if (lead.keyChange) merged.keyChange = lead.keyChange
  return merged
}

// Every candidate next chord for the context, one per chord, in a fixed
// order (SPEC 6.1): highest score first, then category, then chord name.
// With no chord picked yet, the key's own chords are offered as places to
// start.
export function nextChordCandidates(
  context: NextChordContext,
): NextChordSuggestion[] {
  const { key } = context
  const previous = context.previous.at(-1)
  const candidates: Candidate[] = [...diatonic(key, previous)]
  if (previous) {
    const ctx: Context = {
      key,
      previous,
      stacks: hasDiatonicChords(key.mode),
    }
    candidates.push(...rock(ctx), ...mediants(ctx), ...pedal(ctx))
    if (ctx.stacks) {
      candidates.push(
        ...resolveSecondary(ctx),
        ...secondary(ctx),
        ...borrowed(ctx),
        ...tritoneSubs(ctx),
        ...pivots(ctx),
      )
    }
  }
  const groups = new Map<string, NextChordSuggestion[]>()
  for (const candidate of candidates) {
    if (
      previous &&
      candidate.rule !== 'pedal.static' &&
      sameChord(candidate.chord, previous)
    ) {
      continue
    }
    const suggestion = toSuggestion(candidate, context.weights)
    const id =
      chordKey(candidate.chord) +
      (candidate.keyChange ? ` > ${keyName(candidate.keyChange)}` : '')
    groups.set(id, [...(groups.get(id) ?? []), suggestion])
  }
  return sortSuggestions(
    [...groups.values()].map(merge),
    chordKey,
  ) as NextChordSuggestion[]
}
