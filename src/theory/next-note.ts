// Next-note suggestions (PLAN Phase 7 task 2, SPEC 7.3): given the melody
// so far and the chords under it, every note it could go to next, scored
// by the rules and explained, best first. Notes of the key come first,
// chord tones on strong beats, mostly steps, a change of direction after a
// leap, and tendency notes resolving (7 up to 1, 4 down to 3); every
// suggestion stays inside the melody's range. The weights and wording are
// data, in next-note-data.ts.
import { chordSymbol } from './chord'
import { chordNotes, type ChordName } from './chord-symbol'
import { ZERO, addDur, compareDur, type Dur } from './duration'
import { spellPitch } from './lines'
import { barPosition, melodyEnd, type MelodyNote } from './melody'
import { accentAt, meterOfBar, type MeterMap } from './meter'
import {
  BIG_LEAP,
  DEFAULT_RANGE,
  LEAP,
  LONG_RUN,
  MAX_LEAP,
  NEXT_NOTE_SCORING as S,
  NEXT_NOTE_SHOWN,
  NEXT_NOTE_TEXT as T,
  RANGE_PRESETS,
  WIDE_LEAP,
} from './next-note-data'
import {
  formatNote,
  letterIndex,
  midiNumber,
  mod,
  noteAtMidi,
  parseNote,
  pitchClass,
  type Note,
} from './note'
import { keySignature, scaleNotes, type Key } from './scale'
import { fillTemplate, makeSuggestion, type Suggestion } from './suggestion'

export * from './next-note-data'

// A chord the melody sounds over, from the start of the section.
export type MelodyChord = {
  chord: ChordName
  key: Key
  start: Dur
  length: Dur
}

export type MelodyRange = { low: Note; high: Note }

export type NextNoteContext = {
  melody: MelodyNote[]
  key: Key // the section's key, for notes past the last chord
  chords: MelodyChord[]
  time: MeterMap
  range: MelodyRange
  length: Dur // how long the next note lasts
  gap?: Dur // a rest before it
}

export type NextNoteSuggestion = Suggestion<MelodyNote>

// A preset's range, or tenor for an id it doesn't know.
export function melodyRange(preset: string): MelodyRange {
  const found =
    RANGE_PRESETS.find((p) => p.id === preset) ??
    RANGE_PRESETS.find((p) => p.id === DEFAULT_RANGE)!
  return { low: parseNote(found.low)!, high: parseNote(found.high)! }
}

const name = (n: Note) => formatNote(n)
const midiOf = (n: Note) => midiNumber(n) as number

const ORDINALS: Record<number, string> = {
  1: 'root',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
  7: '7th',
}

// The chord's notes and root; with no chord, the key's tonic triad.
function chordTones(
  chord: ChordName | undefined,
  key: Key,
): { root: Note; tones: Note[] } {
  if (chord) {
    return {
      root: chord.root,
      tones: [...chordNotes(chord), ...(chord.bass ? [chord.bass] : [])],
    }
  }
  const scale = scaleNotes(key.tonic, key.mode)
  return { root: key.tonic, tones: [scale[0], scale[2], scale[4]] }
}

// The chord tone a pitch is, if any, with its spelling and number.
function toneOf(
  { root, tones }: { root: Note; tones: Note[] },
  midi: number,
): { note: Note; number: number } | undefined {
  const tone = tones.find((t) => pitchClass(t) === mod(midi, 12))
  if (!tone) return undefined
  const number = mod(letterIndex(tone.letter) - letterIndex(root.letter), 7) + 1
  return { note: noteAtMidi(tone, midi) as Note, number }
}

function inKey(key: Key, note: Note): boolean {
  return scaleNotes(key.tonic, key.mode).some(
    (n) => n.letter === note.letter && n.accidental === note.accidental,
  )
}

const sign = (n: number) => Math.sign(n)

// Every note the melody could go to next, best first (all of them; see
// nextNotes for the ones shown).
export function rankNextNotes(ctx: NextNoteContext): NextNoteSuggestion[] {
  const { melody, chords, time, range } = ctx
  const onset = addDur(melodyEnd(melody), ctx.gap ?? ZERO)
  const under = chords.find(
    (c) =>
      compareDur(c.start, onset) <= 0 &&
      compareDur(onset, addDur(c.start, c.length)) < 0,
  )
  const chord = under?.chord
  const key = under?.key ?? chords.at(-1)?.key ?? ctx.key
  const { bar, offset } = barPosition(time, onset)
  const accent = accentAt(meterOfBar(time, bar), offset)
  const strong = accent === 'downbeat' || accent === 'strong'
  const low = midiOf(range.low)
  const high = midiOf(range.high)
  const last = melody.at(-1)
  const lastMidi = last && midiOf(last.note)
  // The moves so far, as signed semitones, latest last.
  const moves = melody
    .slice(1)
    .map((m, i) => midiOf(m.note) - midiOf(melody[i].note))
  const lastMove = moves.at(-1) ?? 0
  const prevWay = sign([...moves].reverse().find((m) => m !== 0) ?? 0)
  let run = 0
  for (let i = moves.length - 1; i >= 0 && moves[i] !== 0; i--) {
    if (sign(moves[i]) !== sign(lastMove)) break
    run++
  }
  const used = melody.map((m) => midiOf(m.note))
  const tonicPc = pitchClass(key.tonic)
  // With no chords at all, the key's tonic triad stands in, as it does for
  // a first note; past the last chord there is no harmony to lean on.
  const harmony =
    chord || chords.length === 0 || lastMidi === undefined
      ? chordTones(chord, key)
      : undefined
  const chordText = chord
    ? chordSymbol(chord)
    : `the tonic chord of ${name({ ...key.tonic, octave: undefined })}`
  const out: NextNoteSuggestion[] = []
  const from = lastMidi === undefined ? low : Math.max(low, lastMidi - MAX_LEAP)
  const to = lastMidi === undefined ? high : Math.min(high, lastMidi + MAX_LEAP)
  for (let m = from; m <= to; m++) {
    const tone = harmony && toneOf(harmony, m)
    const rising =
      lastMidi === undefined ? (keySignature(key) ?? 0) >= 0 : m >= lastMidi
    const note =
      tone?.note ??
      (lastMidi === m && last ? last.note : spellPitch(key, m, rising))
    const values = {
      note: name(note),
      from: last ? name(last.note) : '',
      chord: chordText,
      tone: tone ? ORDINALS[tone.number] : '',
      tonic: name({ ...key.tonic, octave: undefined }),
    }
    const tags: string[] = []
    const ruleIds: string[] = []
    const reasons: string[] = []
    let score = 0
    const add = (points: number, rule: string, text?: string) => {
      score += points
      ruleIds.push(`melody-${rule}`)
      if (text) reasons.push(fillTemplate(text, values))
    }
    if (tone) tags.push('chord-tone')
    const outside = !inKey(key, note) && !tone
    if (lastMidi === undefined) {
      // The first note: a chord tone (of the tonic triad with no chords),
      // near the middle of the range.
      if (!tone) continue
      add(strong ? S.strongTone : S.tone, 'first-tone', T.first)
      if (mod(m - tonicPc, 12) === 0) add(S.tonic, 'first-tonic')
      score += S.fromCentre * Math.abs(m - (low + high) / 2)
    } else {
      const d = m - lastMidi
      const size = Math.abs(d)
      const way = sign(d)
      if (tone) {
        add(
          strong ? S.strongTone : S.tone,
          'chord-tone',
          strong ? T.strongTone : T.tone,
        )
      } else if (strong && harmony) {
        add(S.strongNonTone, 'strong-non-tone', T.strongNonTone)
      }
      if (size === 0) {
        tags.push('repeat')
        add(S.repeat, 'repeat', T.repeat)
        let again = 0
        for (let i = moves.length - 1; i >= 0 && moves[i] === 0; i--) again++
        if (again) add(S.repeatAgain * again, 'repeat-again')
      } else if (size < LEAP) {
        if (tone) {
          tags.push('step')
          add(S.step, 'step', T.step)
        } else {
          const kind =
            prevWay === 0 || way === prevWay ? 'passing' : 'neighbour'
          tags.push(kind)
          add(S.step, kind, kind === 'passing' ? T.passing : T.neighbour)
        }
      } else {
        tags.push('leap')
        if (size >= BIG_LEAP) add(S.leap, 'leap', T.leap)
        else add(0, 'skip', T.skip)
        if (size >= WIDE_LEAP && size !== 12) add(S.wideLeap, 'wide-leap')
        if (!tone && harmony) add(S.leapToNonTone, 'leap-to-non-tone')
      }
      // After a leap of a 4th or more, turn back.
      if (Math.abs(lastMove) >= BIG_LEAP && size > 0) {
        if (way !== sign(lastMove)) {
          if (size < LEAP) add(S.recoverStep, 'recover', T.recover)
          else add(S.recoverLeap, 'recover')
        } else {
          add(S.sameWayAfterLeap, 'same-way', T.sameWay)
        }
      }
      if (
        size >= LEAP &&
        Math.abs(lastMove) >= LEAP &&
        way === sign(lastMove)
      ) {
        add(S.twoLeaps, 'two-leaps')
      }
      if (run >= LONG_RUN && way === sign(lastMove)) add(S.longRun, 'long-run')
      const back = used.at(-2)
      if (size > 0 && m === back && used.at(-3) === lastMidi) {
        add(S.rocking, 'rocking')
      }
      // Tendency notes.
      const lastPc = mod(lastMidi, 12)
      if (mod(lastPc + 1 - tonicPc, 12) === 0 && d === 1) {
        tags.push('tendency')
        add(S.leadingNote, 'leading-note', T.leadingNote)
      }
      const scale = scaleNotes(key.tonic, key.mode)
      const fourth = scale[3]
      const third = scale[2]
      if (
        scale.length === 7 &&
        last &&
        last.note.letter === fourth.letter &&
        last.note.accidental === fourth.accidental &&
        note.letter === third.letter &&
        note.accidental === third.accidental &&
        d < 0 &&
        size <= 2
      ) {
        tags.push('tendency')
        add(S.fourToThree, 'four-to-three', T.fourToThree)
      }
      if (
        last &&
        !inKey(key, last.note) &&
        size === 1 &&
        sign(
          last.note.accidental -
            (scale.find((n) => n.letter === last.note.letter)?.accidental ?? 0),
        ) === way
      ) {
        tags.push('tendency')
        add(S.chromaticResolves, 'chromatic-resolves', T.chromaticResolves)
      }
      score += S.move * size
      const top = Math.max(...used)
      const bottom = Math.min(...used)
      if (m > top) add(S.beyondUsed * (m - top), 'beyond-used')
      if (m < bottom) add(S.beyondUsed * (bottom - m), 'beyond-used')
    }
    if (outside) {
      tags.push('chromatic')
      add(S.chromatic, 'chromatic', T.chromatic)
    }
    out.push(
      makeSuggestion({
        candidate: { note, onset, length: ctx.length },
        score: Math.round(score * 1000) / 1000,
        tags,
        ruleIds,
        explanation: reasons.join(' '),
      }),
    )
  }
  return out.sort(
    (a, b) =>
      b.score - a.score || midiOf(a.candidate.note) - midiOf(b.candidate.note),
  )
}

// The suggestions shown: the best few.
export function nextNotes(ctx: NextNoteContext): NextNoteSuggestion[] {
  return rankNextNotes(ctx).slice(0, NEXT_NOTE_SHOWN)
}
