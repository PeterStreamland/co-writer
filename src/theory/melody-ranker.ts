// The melody's next-token interface (PLAN Phase 7 task 4, SPEC 7.3): next
// notes shown as for next chords (SPEC 6.2). Six to eight, grouped (chord
// tones, steps and neighbours, leaps, colour notes), each with one context
// line for every rule that moved its ranking, then a wildcard: a valid but
// unlikely note, the same one for the same input, with Another stepping
// through the rest. ⓘ reads the note in the key, over the chord, and as a
// move from the note before.
import { chordSymbol } from './chord'
import { chordNotes, type ChordName } from './chord-symbol'
import { intervalWords } from './insight'
import { degreeLabel, degreeName, intervalBetween } from './interval'
import {
  MELODY_CONTEXT,
  IN_PLACE,
  IN_PLACE_TEXT,
  MELODY_RANKING as R,
  type MelodyCategory,
} from './melody-ranker-data'
import { subDur } from './duration'
import { melodyEnd } from './melody'
import { BIG_LEAP } from './next-note-data'
import {
  rankNextNotes,
  type NextNoteContext,
  type NextNoteSuggestion,
} from './next-note'
import {
  formatNote,
  letterIndex,
  midiNumber,
  pitchClass,
  type Note,
} from './note'
import { keyName } from './numeral'
import type { Key } from './scale'

export * from './melody-ranker-data'

export type MelodyGroup = {
  category: MelodyCategory
  suggestions: NextNoteSuggestion[]
}

export type RankedMelody = {
  shown: NextNoteSuggestion[]
  groups: MelodyGroup[]
  wildcard?: NextNoteSuggestion
  wildcards: number
}

// A next note's group: colour notes outside the key, then chord tones,
// leaps, and steps (with repeats).
export function melodyCategory(s: NextNoteSuggestion): MelodyCategory {
  if (s.tags.includes('chromatic')) return 'colour'
  if (s.tags.includes('chord-tone')) return 'chord-tones'
  if (s.tags.includes('leap')) return 'leaps'
  return 'steps'
}

// The context lines for the rules that moved a note's ranking.
function withContext(s: NextNoteSuggestion): NextNoteSuggestion {
  const lines = [
    ...new Set(s.ruleIds.flatMap((id) => MELODY_CONTEXT[id] ?? [])),
  ]
  return { ...s, contextNotes: lines }
}

const midiOf = (n: Note) => midiNumber(n) as number

// FNV-1a over the input, so the same melody, chords and range give the
// same wildcard (SPEC 6.2).
export function melodySeed(ctx: NextNoteContext): number {
  const text = [
    keyName(ctx.key),
    ctx.melody
      .map((m) => `${formatNote(m.note)}@${m.onset.n}/${m.onset.d}`)
      .join(' '),
    ctx.chords.map((c) => chordSymbol(c.chord, { ascii: true })).join(' '),
    `${formatNote(ctx.range.low)}-${formatNote(ctx.range.high)}`,
    `${ctx.length.n}/${ctx.length.d}`,
  ].join('|')
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

// The next notes as the Melody tab shows them, grouped, with a wildcard.
// another counts presses of Another.
export function rankMelody(
  ctx: NextNoteContext,
  { another = 0 }: { another?: number } = {},
): RankedMelody {
  const sorted = rankNextNotes(ctx).map(withContext)
  const shown: NextNoteSuggestion[] = []
  const per = new Map<MelodyCategory, number>()
  for (const s of sorted) {
    if (shown.length >= R.max) break
    const c = melodyCategory(s)
    if ((per.get(c) ?? 0) >= R.perCategory) continue
    per.set(c, (per.get(c) ?? 0) + 1)
    shown.push(s)
  }
  for (const s of sorted) {
    if (shown.length >= R.min) break
    if (!shown.includes(s)) shown.push(s)
  }
  shown.sort((a, b) => sorted.indexOf(a) - sorted.indexOf(b))
  const groups: MelodyGroup[] = []
  for (const s of shown) {
    const category = melodyCategory(s)
    const found = groups.find((g) => g.category === category)
    if (found) found.suggestions.push(s)
    else groups.push({ category, suggestions: [s] })
  }
  const rest = sorted.filter((s) => !shown.includes(s)).reverse()
  const pool = rest.slice(0, Math.ceil(rest.length * R.wildcardShare))
  const ranked: RankedMelody = { shown, groups, wildcards: pool.length }
  if (pool.length) {
    ranked.wildcard = pool[(melodySeed(ctx) + another) % pool.length]
  }
  return ranked
}

export type NoteInsight = {
  // "E4: the 3rd of C major (mediant), the 3rd of C".
  reading: string
  // "Up a minor 3rd from C♯4."
  move?: string
}

// A note's reading for the ⓘ panel: its degree in the key, its place in
// the chord under it, and its move from the note before.
export function noteInsight(
  key: Key,
  note: Note,
  chord?: ChordName,
  from?: Note,
): NoteInsight {
  const tonic = { ...key.tonic, octave: undefined }
  const degree = degreeLabel(tonic, note)
  const parts = [
    `degree ${degree} of ${keyName(key)} (${degreeName(tonic, note)})`,
  ]
  if (chord) {
    const tones = [...chordNotes(chord), ...(chord.bass ? [chord.bass] : [])]
    const tone = tones.find(
      (t) => t.letter === note.letter && t.accidental === note.accidental,
    )
    parts.push(
      tone
        ? `the ${ORDINAL[(letterIndex(note.letter) - letterIndex(chord.root.letter) + 7) % 7]} of ${chordSymbol(chord)}`
        : tones.some((t) => pitchClass(t) === pitchClass(note))
          ? `sounding as a note of ${chordSymbol(chord)}, spelled another way`
          : `not a note of ${chordSymbol(chord)}`,
    )
  }
  const insight: NoteInsight = {
    reading: `${formatNote(note)}: ${parts.join(', ')}.`,
  }
  if (from) insight.move = moveWords(from, note)
  return insight
}

const ORDINAL = ['root', '2nd', '3rd', '4th', '5th', '6th', '7th']

// "Up a major 2nd from C4", "Down an octave from G4", "The same note".
function moveWords(from: Note, to: Note): string {
  const a = midiOf(from)
  const b = midiOf(to)
  if (a === b && from.letter === to.letter) return `The same note as before.`
  const up =
    b > a || (b === a && letterIndex(to.letter) > letterIndex(from.letter))
  const [low, high] = up ? [from, to] : [to, from]
  const span = Math.abs(b - a)
  const steps =
    ((high.octave ?? 4) - (low.octave ?? 4)) * 7 +
    letterIndex(high.letter) -
    letterIndex(low.letter)
  const octaves = Math.floor(steps / 7)
  const simple = { ...high, octave: (high.octave ?? 4) - octaves }
  const within =
    span === 1
      ? 'a semitone'
      : span === 2 && steps === 1
        ? 'a tone'
        : intervalWords(intervalBetween(low, simple))
  const words =
    octaves === 0
      ? within
      : steps % 7 === 0 && span % 12 === 0
        ? octaves === 1
          ? 'an octave'
          : `${octaves} octaves`
        : `${within} and an octave`
  return `${up ? 'Up' : 'Down'} ${words} from ${formatNote(from)}.`
}

// Notes that could take a note's place (David's request): what could
// follow the notes before it, at its start and for its length, re-scored
// by how each leads into the note after. The note itself isn't offered.
export function rankNoteInPlace(
  ctx: Omit<NextNoteContext, 'length' | 'gap'>,
  index: number,
): NextNoteSuggestion[] {
  const target = ctx.melody[index]
  if (!target) return []
  const before = ctx.melody.slice(0, index)
  const after = ctx.melody[index + 1]
  const own = midiOf(target.note)
  return rankNextNotes({
    ...ctx,
    melody: before,
    length: target.length,
    gap: subDur(target.onset, melodyEnd(before)),
  })
    .filter((s) => midiOf(s.candidate.note) !== own)
    .map((s) => {
      if (!after) return withContext(s)
      const size = Math.abs(midiOf(after.note) - midiOf(s.candidate.note))
      const next = formatNote(after.note)
      const fill = (t: string) => t.replace('{next}', next)
      if (size > 0 && size <= 2) {
        return withContext({
          ...s,
          score: Math.round((s.score + IN_PLACE.stepInto) * 1000) / 1000,
          ruleIds: [...s.ruleIds, 'melody-step-into'],
          explanation: `${s.explanation} ${fill(IN_PLACE_TEXT.stepInto)}`,
        })
      }
      if (size >= BIG_LEAP) {
        return withContext({
          ...s,
          score: Math.round((s.score + IN_PLACE.leapInto) * 1000) / 1000,
          ruleIds: [...s.ruleIds, 'melody-leap-into'],
          explanation: `${s.explanation} ${fill(IN_PLACE_TEXT.leapInto)}`,
        })
      }
      return withContext(s)
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        midiOf(a.candidate.note) - midiOf(b.candidate.note),
    )
    .slice(0, IN_PLACE.shown)
}
