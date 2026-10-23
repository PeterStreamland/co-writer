// Lines as suggestions (PLAN Phase 6 task 4, SPEC 6.2, 7.4): every line
// mode over the progression, each a Suggestion grouped as bass lines,
// inner voices or lines between chords and ranked within its group by the
// rules in line-suggestions-data.ts. The ⓘ panel's first line says what
// the line does, with its counts; "More" breaks its notes down by tag; and
// each rule that moved it up or down adds a context note.
import { chordSymbol } from './chord'
import { durEquals } from './duration'
import {
  LINE_EXPLANATIONS,
  LINE_NOTE_THRESHOLDS,
  LINE_SCORING,
} from './line-suggestions-data'
import {
  LINE_GROUPS,
  LINE_MODES,
  lineFor,
  lineSeed,
  type Line,
  type LineNote,
  type LineStep,
  type LineTag,
} from './lines'
import { seededRandom } from './lens'
import { formatNote } from './note'
import { keyName } from './numeral'
import { fillTemplate, makeSuggestion, type Suggestion } from './suggestion'

export * from './line-suggestions-data'

export type LineSuggestion = Suggestion<Line>

// "4 approach notes", "one approach note", "no approach notes".
function counted(n: number, one: string, many = `${one}s`): string {
  if (n === 0) return `no ${many}`
  if (n === 1) return `one ${one}`
  return `${n} ${many}`
}

const has = (n: LineNote, tag: LineTag) => n.tags.includes(tag)

// Whether a note starts on a strong beat or a downbeat.
function onStrongBeat(n: LineNote, steps: LineStep[]): boolean {
  const { placed } = steps[n.step]
  if (durEquals(n.onset, placed.start))
    return placed.accent !== 'weak' && placed.accent !== 'off'
  const beat = placed.beats.find((b) => durEquals(b.at, n.onset))
  return beat !== undefined && beat.strength !== 'weak'
}

// The average move between one note and the next, in semitones.
function averageMove(notes: LineNote[]): number {
  if (notes.length < 2) return 0
  let total = 0
  for (let i = 1; i < notes.length; i++) {
    total += Math.abs(notes[i].midi - notes[i - 1].midi)
  }
  return total / (notes.length - 1)
}

const TAG_WORDS: Record<LineTag, [string, string]> = {
  'chord-tone': ['chord tone', 'chord tones'],
  passing: ['passing note', 'passing notes'],
  neighbour: ['neighbour note', 'neighbour notes'],
  approach: ['approach note', 'approach notes'],
  pedal: ['pedal note', 'pedal notes'],
  free: ['note of your own', 'notes of your own'],
  chromatic: ['note outside the key', 'notes outside the key'],
}

// One line as a suggestion: scored, tagged and explained.
export function lineSuggestion(line: Line, steps: LineStep[]): LineSuggestion {
  const { notes, mode } = line
  const key = steps[0].key
  const count = (tag: LineTag) => notes.filter((n) => has(n, tag)).length
  const strong = notes.filter((n) => onStrongBeat(n, steps))
  const strongTones = strong.filter((n) => has(n, 'chord-tone')).length
  const strongShare = strong.length ? strongTones / strong.length : 1
  const move = averageMove(notes)
  const outside = count('chromatic')
  const outsideShare = notes.length ? outside / notes.length : 0

  const ruleIds = [`line-mode-${mode.id}`]
  const contextNotes: string[] = []
  let score = LINE_SCORING.strongChordTones * strongShare
  if (strong.length && strongShare === 1) {
    ruleIds.push('line-strong-chord-tones')
    contextNotes.push('Ranked higher: every strong beat is a chord tone.')
  } else if (strongShare < LINE_NOTE_THRESHOLDS.strongBeats) {
    ruleIds.push('line-strong-chord-tones')
    contextNotes.push(
      `Ranked lower: ${strong.length - strongTones} of ${strong.length} strong beats aren’t chord tones.`,
    )
  }
  score -= LINE_SCORING.leap[mode.group] * move
  if (mode.group !== 'bass' && notes.length > 1) {
    if (move <= LINE_NOTE_THRESHOLDS.stepwise) {
      ruleIds.push('line-leaps')
      contextNotes.push('Ranked higher: it moves by step or less.')
    } else if (move >= LINE_NOTE_THRESHOLDS.leaping) {
      ruleIds.push('line-leaps')
      contextNotes.push(
        `Ranked lower: it leaps ${move.toFixed(1)} semitones a note on average.`,
      )
    }
  }
  score -= LINE_SCORING.outside * outsideShare
  if (outside > 0) {
    ruleIds.push('line-outside')
    contextNotes.push(
      `Ranked lower: ${counted(outside, 'note')} outside ${keyName(key)}.`,
    )
  }

  const pedals = new Set(
    notes.filter((n) => has(n, 'pedal')).map((n) => n.step),
  )
  const explanation = fillTemplate(LINE_EXPLANATIONS[mode.id], {
    approaches: counted(count('approach'), 'approach note'),
    passing: counted(count('passing'), 'passing note'),
    neighbours: counted(count('neighbour'), 'neighbour note'),
    chromatic: counted(outside, 'note'),
    key: keyName(key),
    tonic: formatNote(key.tonic),
    pedals: counted(pedals.size, 'chord that lacks it', 'chords that lack it'),
    moves: `${move.toFixed(1)} semitones`,
  })
  const tagged = (Object.keys(TAG_WORDS) as LineTag[])
    .filter((t) => t !== 'chromatic' && count(t) > 0)
    .map((t) => counted(count(t), ...TAG_WORDS[t]))
  const changes = steps.length
  const more = [
    `${mode.blurb}`,
    `${counted(notes.length, 'note')} over ${counted(changes, 'chord')}: ${tagged.join(', ')}${outside ? `; ${counted(outside, ...TAG_WORDS.chromatic)}` : ''}.`,
    pedals.size
      ? `It lands on a chord tone at every change but ${[...pedals].map((s) => chordSymbol(steps[s].chord)).join(', ')}, where the pedal sounds against the chord.`
      : 'It lands on a chord tone at every change.',
  ].join(' ')

  const tags = [
    mode.group,
    ...(Object.keys(TAG_WORDS) as LineTag[]).filter((t) => count(t) > 0),
  ]
  return makeSuggestion({
    candidate: line,
    score,
    tags,
    ruleIds,
    explanation,
    more,
    contextNotes,
  })
}

// Every line mode over the progression as a suggestion, grouped (bass
// lines, inner voices, between chords, then the Wildcard) and ranked within
// each group: the higher score first, ties in the modes' own order. The
// Wildcard's roll comes from the chords, so it repeats for the same input;
// each `roll` after the first (Another) gives a fresh one.
export function lineSuggestions(steps: LineStep[], roll = 0): LineSuggestion[] {
  if (steps.length === 0) return []
  return LINE_GROUPS.flatMap((g) =>
    LINE_MODES.filter((m) => m.group === g.id)
      .map((m, order) => ({
        s: lineSuggestion(
          lineFor(m.id, steps, seededRandom(lineSeed(steps) + roll)),
          steps,
        ),
        order,
      }))
      .sort((a, b) => b.s.score - a.s.score || a.order - b.order)
      .map(({ s }) => s),
  )
}
