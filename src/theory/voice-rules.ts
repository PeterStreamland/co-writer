// Voice-leading rule checks (PLAN Phase 5 task 3): parallel 5ths and
// octaves, leading-note and 7th resolution, spacing, low-register muddiness
// and 3rds under distortion. Each hit names its rule, its voices and what
// went wrong; a lens turns hits into a penalty with its own weights, so no
// rule is a hard limit.
// A voicing lists one note per voice, lowest voice first, with octaves.
// Rules on motion pair voices in order, so they need voicings of the same
// size; rules on one chord look at the second voicing, by pitch.
import { chordIntervals } from './chord'
import { chordNotes, type ChordName } from './chord-symbol'
import { intervalBetween, transpose, transposeDown } from './interval'
import {
  formatNote,
  midiNumber,
  parseNote,
  pitchClass,
  type Note,
} from './note'
import type { Key } from './scale'
import {
  LENS_RULE_WEIGHTS,
  LOW_INTERVAL_LIMITS,
  MAX_UPPER_GAP,
  VOICE_RULE_TEMPLATES,
  type Lens,
  type VoiceRule,
} from './voice-rules-data'

export type Voiced = { chord: ChordName; notes: Note[] }

export type RuleHit = {
  rule: VoiceRule
  ruleId: string // 'voice.parallel-fifths'
  voices: number[] // counted from 0 for the lowest voice
  explanation: string
}

export type RuleContext = {
  key: Key
  from?: Voiced
  to: Voiced
  gain?: boolean // a distorted sound, where 3rds turn harsh
}

function pitch(note: Note): number {
  const midi = midiNumber(note)
  if (midi === undefined) throw new Error('voice rules need octaves')
  return midi
}

const show = (note: Note) => formatNote(note)

// Voices by name: bass, tenor, alto and soprano in four parts; otherwise the
// bass, the top voice and the numbered voices between, from the bottom.
function voiceName(index: number, count: number): string {
  if (count === 4) return ['bass', 'tenor', 'alto', 'soprano'][index]
  if (index === 0) return 'bass'
  if (index === count - 1) return 'top voice'
  return `voice ${index + 1}`
}

function voiceNames(voices: number[], count: number): string {
  const names = voices.map((v) => voiceName(v, count))
  return names.length === 1 ? names[0] : `${names[0]} and ${names[1]}`
}

function hit(
  rule: VoiceRule,
  voices: number[],
  count: number,
  notes: string,
  more = '',
): RuleHit {
  const explanation = VOICE_RULE_TEMPLATES[rule]
    .replace('{voices}', voiceNames(voices, count))
    .replace('{notes}', notes)
    .replace('{more}', more)
  return { rule, ruleId: `voice.${rule}`, voices, explanation }
}

// The spelled interval's number reduced to within an octave: 1 for unisons
// and octaves, 5 for 5ths and 12ths. Perfect only, else undefined.
function perfect(a: Note, b: Note): 1 | 5 | undefined {
  const interval = intervalBetween(a, b)
  if (interval.quality !== 'P') return undefined
  const simple = ((interval.number - 1) % 7) + 1
  return simple === 1 ? 1 : simple === 5 ? 5 : undefined
}

// Parallel (or contrary) 5ths and octaves: two voices a perfect 5th, or an
// octave or unison, apart in both chords, both moving. A voice that holds
// its note makes oblique motion, which is fine.
function parallels(from: Note[], to: Note[]): RuleHit[] {
  const hits: RuleHit[] = []
  for (let i = 0; i < to.length; i++) {
    for (let j = i + 1; j < to.length; j++) {
      const before = perfect(from[i], from[j])
      if (!before || before !== perfect(to[i], to[j])) continue
      const moveI = pitch(to[i]) - pitch(from[i])
      const moveJ = pitch(to[j]) - pitch(from[j])
      if (moveI === 0 || moveJ === 0) continue
      const notes = `${show(from[i])}–${show(from[j])} to ${show(to[i])}–${show(to[j])}`
      const contrary = Math.sign(moveI) !== Math.sign(moveJ)
      hits.push(
        hit(
          before === 5 ? 'parallel-fifths' : 'parallel-octaves',
          [i, j],
          to.length,
          notes,
          contrary ? ', in contrary motion' : '',
        ),
      )
    }
  }
  return hits
}

// The leading note: a semitone below the tonic, raised in minor keys.
function leadingNote(key: Key): Note {
  return transposeDown(key.tonic, { quality: 'm', number: 2 })
}

// In V or vii° going to I, the leading note rises a semitone to the tonic.
// An inner voice may fall to the tonic chord's 5th instead, as the textbooks
// allow, and any voice may hold it when the tonic chord has it too (G7 to
// Cmaj7 keeps B as the major 7th).
function leadingNoteHits(key: Key, from: Voiced, to: Voiced): RuleHit[] {
  const tonic = pitchClass(key.tonic)
  const lead = pitchClass(leadingNote(key))
  const root = pitchClass(from.chord.root)
  const dominant = root === (tonic + 7) % 12 || root === lead
  if (!dominant || pitchClass(to.chord.root) !== tonic) return []
  const count = to.notes.length
  const keeps = chordNotes(to.chord).some((n) => pitchClass(n) === lead)
  const hits: RuleHit[] = []
  from.notes.forEach((note, i) => {
    if (pitchClass(note) !== lead) return
    const next = to.notes[i]
    const step = pitch(next) - pitch(note)
    if (step === 1 && pitchClass(next) === tonic) return
    if (step === 0 && keeps) return
    const inner = i > 0 && i < count - 1
    const toFifth = step < 0 && pitchClass(next) === (tonic + 7) % 12
    if (inner && toFifth) return
    hits.push(hit('leading-note', [i], count, show(note)))
  })
  return hits
}

const sameChord = (a: ChordName, b: ChordName) =>
  pitchClass(a.root) === pitchClass(b.root) && a.quality === b.quality

// A chord's 7th, when the chord changes, falls by step or is held.
function seventhHits(from: Voiced, to: Voiced): RuleHit[] {
  if (sameChord(from.chord, to.chord)) return []
  const interval = chordIntervals(from.chord.quality)?.find(
    (i) => i.number === 7,
  )
  if (!interval) return []
  const seventh = pitchClass(transpose(from.chord.root, interval))
  const hits: RuleHit[] = []
  from.notes.forEach((note, i) => {
    if (pitchClass(note) !== seventh) return
    const step = pitch(to.notes[i]) - pitch(note)
    if (step === 0 || step === -1 || step === -2) return
    hits.push(hit('seventh', [i], to.notes.length, show(note)))
  })
  return hits
}

// Each voice's index, lowest pitch first.
function byPitch(notes: Note[]): number[] {
  return notes
    .map((_, i) => i)
    .sort((a, b) => pitch(notes[a]) - pitch(notes[b]) || a - b)
}

const LIMITS = Object.fromEntries(
  Object.entries(LOW_INTERVAL_LIMITS).map(([size, note]) => [
    size,
    pitch(parseNote(note) as Note),
  ]),
) as Record<number, number>

// Rules on one chord, between neighbouring voices by pitch.
function chordHits(notes: Note[], gain: boolean): RuleHit[] {
  const order = byPitch(notes)
  const count = notes.length
  const pair = (a: number, b: number) => [a, b].sort((x, y) => x - y)
  const hits: RuleHit[] = []
  for (let k = 0; k + 1 < order.length; k++) {
    const [lo, hi] = [order[k], order[k + 1]]
    const gap = pitch(notes[hi]) - pitch(notes[lo])
    const notesText = `${show(notes[lo])}–${show(notes[hi])}`
    if (k > 0 && gap > MAX_UPPER_GAP) {
      hits.push(hit('spacing', pair(lo, hi), count, notesText))
    }
    const limit = LIMITS[gap]
    if (limit !== undefined && pitch(notes[lo]) < limit) {
      hits.push(hit('low-register', pair(lo, hi), count, notesText))
    }
  }
  if (gain) {
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const number = intervalBetween(notes[i], notes[j]).number
        if ((number - 1) % 7 === 2) {
          const text = `${show(notes[i])}–${show(notes[j])}`
          hits.push(hit('thirds-under-gain', [i, j], count, text))
        }
      }
    }
  }
  return hits
}

// Every rule the move into `to` breaks, motion rules first.
export function voiceRuleHits({
  key,
  from,
  to,
  gain = false,
}: RuleContext): RuleHit[] {
  const hits: RuleHit[] = []
  if (from && from.notes.length === to.notes.length) {
    hits.push(
      ...parallels(from.notes, to.notes),
      ...leadingNoteHits(key, from, to),
      ...seventhHits(from, to),
    )
  }
  hits.push(...chordHits(to.notes, gain))
  return hits
}

// What a lens charges for a set of hits.
export function rulePenalty(hits: RuleHit[], lens: Lens): number {
  const weights = LENS_RULE_WEIGHTS[lens]
  return hits.reduce((sum, h) => sum + weights[h.rule], 0)
}
