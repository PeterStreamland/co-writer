// Harmonies of a melody (PLAN Phase 7 task 5, SPEC 7.4): a twin-guitar
// harmony that moves with the melody note for note at an interval counted
// in the key's letters (3rds above by default, 6ths below next, every
// interval above and below), power-chord parallels in exact 5ths and 4ths,
// and a countermelody that moves against the melody. Harmonies stay in the
// key but are chord-aware: on a strong beat a harmony bends a step to a
// chord tone, and over a chromatic chord it takes the chord's own note.
// Every bend and every note outside the key is tagged and explained. The
// intervals, weights and wording are data, in harmony-data.ts.
import { chordSymbol } from './chord'
import { chordNotes, type ChordName } from './chord-symbol'
import { compareDur, addDur } from './duration'
import {
  BEND_CONSONANT,
  COUNTER_GAP,
  COUNTER_MAX_MOVE,
  COUNTER_SCORING as S,
  HARMONY_KINDS,
  HARMONY_TEXT as T,
  type HarmonyKind,
} from './harmony-data'
import { parseInterval, transpose, transposeDown } from './interval'
import { inKey } from './lines'
import { barPosition, type MelodyNote } from './melody'
import type { Dur } from './duration'
import { accentAt, meterOfBar, type MeterMap } from './meter'
import type { MelodyChord } from './next-note'
import {
  LETTERS,
  formatNote,
  letterIndex,
  midiNumber,
  mod,
  noteAtMidi,
  pitchClass,
  type Note,
} from './note'
import { scaleNotes, type Key } from './scale'
import { fillTemplate, makeSuggestion, type Suggestion } from './suggestion'

export * from './harmony-data'

export type HarmonyContext = {
  melody: MelodyNote[]
  key: Key // the section's key, for notes past the last chord
  chords: MelodyChord[]
  time: MeterMap
}

// A note of a harmony: in the melody note's place, tagged and explained.
export type HarmonyNote = MelodyNote & { tags: string[]; explanation: string }

export type HarmonyLine = { kind: string; notes: HarmonyNote[] }

export type HarmonySuggestion = Suggestion<HarmonyLine>

const midiOf = (n: Note) => midiNumber(n) as number
const name = (n: Note) => formatNote({ ...n, octave: undefined })

const ORDINALS: Record<number, string> = {
  1: 'root',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
  7: '7th',
}

// What a note sounds over: its chord, the chord's key, and whether it
// falls on a strong beat.
function placeOf(ctx: HarmonyContext, m: MelodyNote) {
  const under = ctx.chords.find(
    (c) =>
      compareDur(c.start, m.onset) <= 0 &&
      compareDur(m.onset, addDur(c.start, c.length)) < 0,
  )
  const key = under?.key ?? ctx.chords.at(-1)?.key ?? ctx.key
  const { bar, offset } = barPosition(ctx.time, m.onset)
  const accent = accentAt(meterOfBar(ctx.time, bar), offset)
  return {
    chord: under?.chord,
    key,
    strong: accent === 'downbeat' || accent === 'strong',
  }
}

function tonesOf(chord: ChordName): Note[] {
  return [...chordNotes(chord), ...(chord.bass ? [chord.bass] : [])]
}

// Which tone of the chord a note is ("3rd"), if it is one.
function toneName(chord: ChordName | undefined, note: Note) {
  if (!chord) return undefined
  const tone = tonesOf(chord).find((t) => pitchClass(t) === pitchClass(note))
  if (!tone) return undefined
  const number =
    mod(letterIndex(tone.letter) - letterIndex(chord.root.letter), 7) + 1
  return ORDINALS[number]
}

// "a 3rd above C", "a 6th below E", "an octave above F♯".
function intervalText(note: Note, melody: Note): string {
  const up = midiOf(note) >= midiOf(melody)
  const [low, high] = up ? [melody, note] : [note, melody]
  const letters =
    (high.octave ?? 4) * 7 +
    letterIndex(high.letter) -
    ((low.octave ?? 4) * 7 + letterIndex(low.letter))
  const number = letters + 1
  const word =
    number === 1
      ? 'unison'
      : number === 8
        ? 'octave'
        : number <= 7
          ? ORDINALS[number]
          : `${number}th`
  if (number === 1) return `a unison with ${name(melody)}`
  const article = number === 8 || number === 11 || number === 18 ? 'an' : 'a'
  return `${article} ${word} ${up ? 'above' : 'below'} ${name(melody)}`
}

// The note `steps` letters from a note, spelled as the key spells that
// letter, or undefined where the key has no note on it.
function moveLetters(note: Note, steps: number, key: Key): Note | undefined {
  const position = (note.octave ?? 4) * 7 + letterIndex(note.letter) + steps
  const letter = LETTERS[mod(position, 7)]
  const inScale = scaleNotes(key.tonic, key.mode).find(
    (n) => n.letter === letter,
  )
  if (!inScale) return undefined
  return {
    letter,
    accidental: inScale.accidental,
    octave: Math.floor(position / 7),
  }
}

// Whether a note sounds well against the melody note: never a unison, 2nd,
// 7th or tritone, by letters and by sound.
function consonant(note: Note, melody: Note): boolean {
  const letters = Math.abs(
    (note.octave ?? 4) * 7 +
      letterIndex(note.letter) -
      ((melody.octave ?? 4) * 7 + letterIndex(melody.letter)),
  )
  if (letters === 0 || mod(letters, 7) === 1 || mod(letters, 7) === 6) {
    return false
  }
  return BEND_CONSONANT.includes(mod(midiOf(note) - midiOf(melody), 12))
}

// The chord's own spelling of a letter, where it differs from the note's.
function chordAltered(chord: ChordName | undefined, note: Note) {
  if (!chord) return undefined
  const tone = tonesOf(chord).find(
    (t) => t.letter === note.letter && t.accidental !== note.accidental,
  )
  return tone && { ...note, accidental: tone.accidental }
}

// One note of a parallel harmony.
function harmonyNote(
  ctx: HarmonyContext,
  m: MelodyNote,
  kind: HarmonyKind,
): HarmonyNote {
  const { chord, key, strong } = placeOf(ctx, m)
  const direction = kind.direction ?? 1
  const chordText = chord ? chordSymbol(chord) : ''
  const tags: string[] = []
  const reasons: string[] = []
  const say = (text: string, note: Note, strict?: Note) =>
    reasons.push(
      fillTemplate(text, {
        note: name(note),
        melody: name(m.note),
        interval: intervalText(note, m.note),
        chord: chordText,
        tone: toneName(chord, note) ?? '',
        strict: strict ? name(strict) : '',
      }),
    )
  let note: Note
  if (kind.exact) {
    const interval = parseInterval(kind.exact)!
    note =
      direction > 0
        ? transpose(m.note, interval)
        : transposeDown(m.note, interval)
    if (toneName(chord, note)) {
      tags.push('chord-tone')
      say(T.tone, note)
    } else if (chord) {
      tags.push('passing')
      say(T.passing, note)
    } else say(T.plain, note)
  } else {
    const steps = (kind.steps ?? 2) * direction
    // Away from the melody first, then towards it.
    const bends = [steps + direction, steps - direction]
    const strict = moveLetters(m.note, steps, key)
    if (!strict) {
      const natural = { ...stepLetter(m.note, steps), accidental: 0 }
      const bent = bends
        .map((s) => moveLetters(m.note, s, key))
        .find((n): n is Note => !!n && consonant(n, m.note))
      if (bent) {
        note = bent
        tags.push('bent')
        if (toneName(chord, note)) tags.push('chord-tone')
        say(T.missing, note, natural)
      } else {
        note = natural
        tags.push(chord ? 'passing' : 'chord-tone')
        say(chord ? T.passing : T.plain, note)
      }
    } else {
      const altered = chordAltered(chord, strict)
      if (altered) {
        note = altered
        tags.push('chord-tone')
        say(T.borrowed, note, strict)
      } else if (toneName(chord, strict)) {
        note = strict
        tags.push('chord-tone')
        say(T.tone, note)
      } else {
        const bent =
          strong && chord && toneName(chord, m.note)
            ? bends
                .map((s) => moveLetters(m.note, s, key))
                .map((n) => n && (chordAltered(chord, n) ?? n))
                .find(
                  (n): n is Note =>
                    !!n && consonant(n, m.note) && !!toneName(chord, n),
                )
            : undefined
        if (bent) {
          note = bent
          tags.push('bent', 'chord-tone')
          say(T.bent, note, strict)
        } else {
          note = strict
          if (chord) {
            tags.push('passing')
            say(T.passing, note)
          } else say(T.plain, note)
        }
      }
    }
  }
  if (!inKey(key, note)) {
    tags.push('chromatic')
    say(T.chromatic, note)
  }
  return {
    ...copyTime(m),
    note,
    tags: [...new Set(tags)],
    explanation: reasons.join(' '),
  }
}

function stepLetter(note: Note, steps: number): Note {
  const position = (note.octave ?? 4) * 7 + letterIndex(note.letter) + steps
  return {
    letter: LETTERS[mod(position, 7)],
    accidental: 0,
    octave: Math.floor(position / 7),
  }
}

// A melody note's place in time, holds included.
function copyTime(m: MelodyNote): Omit<MelodyNote, 'note'> {
  return {
    onset: m.onset,
    length: m.length,
    ...(m.holds && { holds: [...m.holds] }),
  }
}

// A countermelody: note against note under the melody, each note the best
// by COUNTER_SCORING from the notes of the key (and the chord's own
// notes) within reach of the note before.
function countermelody(ctx: HarmonyContext): HarmonyNote[] {
  const out: HarmonyNote[] = []
  let prevWay = 0
  ctx.melody.forEach((m, i) => {
    const { chord, key, strong } = placeOf(ctx, m)
    const mel = midiOf(m.note)
    const prev = out.at(-1)
    const prevMidi = prev ? midiOf(prev.note) : 0
    const prevMel = i > 0 ? midiOf(ctx.melody[i - 1].note) : undefined
    const melWay = prevMel === undefined ? 0 : Math.sign(mel - prevMel)
    const scale = scaleNotes(key.tonic, key.mode)
    const tones = chord ? tonesOf(chord) : [scale[0], scale[2], scale[4]]
    type Scored = { note: Note; midi: number; score: number; tags: string[] }
    let best: Scored | undefined
    for (let c = mel - COUNTER_GAP.max; c <= mel - COUNTER_GAP.min; c++) {
      const pc = mod(c, 12)
      const tone = tones.find((t) => pitchClass(t) === pc)
      const spelling = tone ?? scale.find((n) => pitchClass(n) === pc)
      if (!spelling) continue
      const note = noteAtMidi(spelling, c) as Note
      const gap = mel - c
      const imperfect = [3, 4, 8, 9].includes(mod(gap, 12))
      const perfect = [0, 7].includes(mod(gap, 12))
      const tags: string[] = []
      let score = 0
      if (tone) tags.push('chord-tone')
      if (!prev) {
        if (!tone || !(imperfect || perfect) || gap < COUNTER_GAP.first)
          continue
        if (strong || !chord) score += S.strongTone
        if (imperfect) score += S.imperfect
        score += S.fromSixth * Math.abs(gap - 9)
      } else {
        const d = c - prevMidi
        const size = Math.abs(d)
        if (size > COUNTER_MAX_MOVE) continue
        const way = Math.sign(d)
        if (melWay !== 0 && way !== 0) {
          if (way === -melWay) {
            tags.push('contrary')
            score += S.contrary
          } else {
            tags.push('similar')
            score += S.similar
          }
        } else if (melWay !== 0 || way !== 0) {
          tags.push('oblique')
          score += melWay !== 0 ? S.obliqueHold : S.obliqueMove
        }
        if (tone) score += strong ? S.strongTone : S.tone
        else if (strong) score += S.strongNonTone
        else if (size > 2) score += S.leapToNonTone
        if (!tone && size > 0 && size <= 2) {
          tags.push(prevWay === 0 || way === prevWay ? 'passing' : 'neighbour')
        }
        if (size > 0 && size <= 2) score += S.step
        if (size > 4) score += S.wideLeap
        if (imperfect) score += S.imperfect
        else if (!perfect) {
          score += strong ? S.strongDissonant : S.weakDissonant
        }
        const prevGap = midiOf(ctx.melody[i - 1].note) - prevMidi
        if (
          perfect &&
          mod(prevGap, 12) === mod(gap, 12) &&
          melWay !== 0 &&
          way !== 0
        ) {
          score += S.parallel
        }
      }
      if (gap > COUNTER_GAP.far) score += S.farBelow * (gap - COUNTER_GAP.far)
      const better =
        !best ||
        score > best.score + 1e-9 ||
        (Math.abs(score - best.score) <= 1e-9 &&
          prev &&
          Math.abs(c - prevMidi) < Math.abs(best.midi - prevMidi))
      if (better) best = { note, midi: c, score, tags }
    }
    if (!best) {
      // Nothing fits: the melody's own note an octave down.
      const note = { ...m.note, octave: (m.note.octave ?? 4) - 1 }
      best = { note, midi: midiOf(note), score: 0, tags: [] }
    }
    const { note, tags } = best
    const tone = toneName(chord, note)
    const values = {
      note: name(note),
      melody: name(m.note),
      interval: intervalText(note, m.note),
      chord: chord
        ? chordSymbol(chord)
        : `the tonic chord of ${name(key.tonic)}`,
      tone: tone ?? '',
      way: prev ? (best.midi > prevMidi ? 'up' : 'down') : '',
    }
    const reasons = [
      fillTemplate(
        !prev && tone
          ? T.counterFirst
          : tone
            ? T.counterTone
            : tags.includes('passing')
              ? T.counterPassing
              : tags.includes('neighbour')
                ? T.counterNeighbour
                : T.counterOther,
        values,
      ),
    ]
    if (tags.includes('contrary'))
      reasons.push(fillTemplate(T.contrary, values))
    if (tags.includes('similar')) reasons.push(fillTemplate(T.similar, values))
    if (tags.includes('oblique')) {
      reasons.push(
        fillTemplate(melWay !== 0 ? T.obliqueHold : T.obliqueMove, values),
      )
    }
    if (!inKey(key, note)) {
      tags.push('chromatic')
      reasons.push(fillTemplate(T.chromatic, values))
    }
    if (prev && best.midi !== prevMidi)
      prevWay = Math.sign(best.midi - prevMidi)
    out.push({
      ...copyTime(m),
      note,
      tags,
      explanation: reasons.join(' '),
    })
  })
  return out
}

export function harmonyKind(id: string): HarmonyKind | undefined {
  return HARMONY_KINDS.find((k) => k.id === id)
}

// The melody harmonised by one kind (a HARMONY_KINDS id).
export function harmonise(ctx: HarmonyContext, id: string): HarmonyLine {
  const kind = harmonyKind(id)
  if (!kind) return { kind: id, notes: [] }
  const notes = kind.counter
    ? countermelody(ctx)
    : ctx.melody.map((m) => harmonyNote(ctx, m, kind))
  return { kind: id, notes }
}

// Every harmony of the melody, in the order offered: 3rds above, 6ths
// below, the countermelody, then the rest. None without a melody.
export function harmonyOptions(ctx: HarmonyContext): HarmonySuggestion[] {
  if (!ctx.melody.length) return []
  return HARMONY_KINDS.map((kind, i) => {
    const line = harmonise(ctx, kind.id)
    const count = (tag: string) =>
      line.notes.filter((n) => n.tags.includes(tag)).length
    const bent = count('bent')
    const outside = count('chromatic')
    const moves = line.notes.length - 1
    const parts = [
      kind.counter
        ? `A line under the melody that moves against it: contrary motion on ${count('contrary')} of ${moves} move${moves === 1 ? '' : 's'}.`
        : kind.exact
          ? `${kind.label} of the melody, exact, as a power chord is.`
          : `${kind.label} of the melody, in the key.`,
    ]
    if (bent) {
      parts.push(
        `${bent} note${bent === 1 ? ' bends' : 's bend'} a step to fit the chord.`,
      )
    }
    if (outside) {
      parts.push(
        `${outside} note${outside === 1 ? ' is' : 's are'} outside the key.`,
      )
    }
    return makeSuggestion({
      candidate: line,
      score: -i,
      tags: [
        kind.counter ? 'counter' : kind.exact ? 'exact' : 'diatonic',
        ...(bent ? ['bent'] : []),
        ...(outside ? ['chromatic'] : []),
      ],
      ruleIds: [`harmony-${kind.id}`],
      explanation: parts.join(' '),
    })
  })
}

// Your own notes in a harmony (David's request): a note of the harmony
// changed, or taken out, while the harmony keeps following the melody. An
// edit belongs to the melody note it was made under, by its onset and its
// note; once that melody note changes, the edit no longer applies and the
// harmony works the note out again.
export type HarmonyEdit = { at: Dur; under: Note; note?: Note } // no note: taken out

// A harmony note with the melody note it sits under (its place in the
// melody), and whether it is your own.
export type PlacedHarmonyNote = HarmonyNote & { place: number; edited?: true }

const sameNote = (a: Note, b: Note) =>
  a.letter === b.letter &&
  a.accidental === b.accidental &&
  (a.octave ?? 4) === (b.octave ?? 4)

// The edit made under a melody note, if it still applies.
export function harmonyEditAt(
  melody: MelodyNote[],
  edits: HarmonyEdit[],
  place: number,
): HarmonyEdit | undefined {
  const m = melody[place]
  if (!m) return undefined
  return edits.find(
    (e) => compareDur(e.at, m.onset) === 0 && sameNote(e.under, m.note),
  )
}

// The edits that still apply to the melody as it is.
export function pruneHarmonyEdits(
  melody: MelodyNote[],
  edits: HarmonyEdit[],
): HarmonyEdit[] {
  return edits.filter((e) =>
    melody.some(
      (m) => compareDur(e.at, m.onset) === 0 && sameNote(e.under, m.note),
    ),
  )
}

// Sets the edit under a melody note, over any made there before; with no
// note given, the harmony's note there is taken out.
export function setHarmonyEdit(
  melody: MelodyNote[],
  edits: HarmonyEdit[],
  place: number,
  note?: Note,
): HarmonyEdit[] {
  const m = melody[place]
  if (!m) return edits
  const rest = clearHarmonyEdit(melody, edits, place)
  const edit: HarmonyEdit = { at: m.onset, under: m.note }
  if (note) edit.note = note
  return [...rest, edit]
}

// Takes away the edit under a melody note: the harmony's own note again.
export function clearHarmonyEdit(
  melody: MelodyNote[],
  edits: HarmonyEdit[],
  place: number,
): HarmonyEdit[] {
  const edit = harmonyEditAt(melody, edits, place)
  return edit ? edits.filter((e) => e !== edit) : edits
}

// A harmony with your edits on it: notes changed are tagged edited and
// explained, notes taken out are gone, and every note keeps its place.
export function editHarmony(
  ctx: HarmonyContext,
  notes: HarmonyNote[],
  edits: HarmonyEdit[],
): PlacedHarmonyNote[] {
  return notes.flatMap((n, place) => {
    const edit = edits.length
      ? harmonyEditAt(ctx.melody, edits, place)
      : undefined
    if (!edit) return [{ ...n, place }]
    if (!edit.note) return []
    const m = ctx.melody[place]
    const { chord, key } = placeOf(ctx, m)
    const tone = toneName(chord, edit.note)
    const tags = ['edited']
    if (tone) tags.push('chord-tone')
    const values = {
      note: name(edit.note),
      was: name(n.note),
      interval: intervalText(edit.note, m.note),
      tone: tone ?? '',
      chord: chord ? chordSymbol(chord) : '',
    }
    const reasons = [fillTemplate(tone ? T.editedTone : T.edited, values)]
    if (!inKey(key, edit.note)) {
      tags.push('chromatic')
      reasons.push(fillTemplate(T.chromatic, values))
    }
    return [
      {
        ...n,
        note: edit.note,
        tags,
        explanation: reasons.join(' '),
        place,
        edited: true as const,
      },
    ]
  })
}

// Notes to play in place of a harmony's note: what each other harmony
// would play under that melody note, one of each note, chord tones first
// and notes outside the key last.
export function harmonyAlternatives(
  ctx: HarmonyContext,
  place: number,
  current: Note,
): Suggestion<{ note: Note; kind: string }>[] {
  if (!ctx.melody[place]) return []
  const seen = new Set([formatNote(current)])
  const out: Suggestion<{ note: Note; kind: string }>[] = []
  HARMONY_KINDS.forEach((kind, order) => {
    const n = harmonise(ctx, kind.id).notes[place]
    if (!n) return
    const text = formatNote(n.note)
    if (seen.has(text)) return
    seen.add(text)
    const tags = n.tags.length ? n.tags : ['plain']
    let score = -order / 100
    if (tags.includes('chord-tone')) score += 2
    if (tags.includes('chromatic')) score -= 2
    out.push(
      makeSuggestion({
        candidate: { note: n.note, kind: kind.id },
        score,
        tags,
        ruleIds: [`harmony-${kind.id}`],
        explanation: fillTemplate(T.alternative, {
          kind: kind.label.toLowerCase(),
          why: n.explanation,
        }),
      }),
    )
  })
  return out.sort((a, b) => b.score - a.score)
}

// Shared with counterpoint.ts: what a note sounds over, which tone of a
// chord a note is, and an interval in words ("a 6th below E").
export {
  placeOf as harmonyPlace,
  toneName as chordToneName,
  intervalText as intervalAgainst,
}
