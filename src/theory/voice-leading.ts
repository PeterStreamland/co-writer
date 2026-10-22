// Voice-leading cost (PLAN Phase 5 task 2): how far the voices move from one
// voicing to the next, which shared notes stay put, and whether voices cross
// or overlap. A voicing lists one note per voice, lowest voice first, each
// with an octave.
// Voicings of the same size pair voice by voice, in the order given, so a
// voice can cross the one listed above it. Voicings of different sizes (a
// triad into a 7th chord, a five-string guitar shape into a six-string one)
// have no voices to follow, so their notes pair in pitch order, each note of
// each voicing used at least once, for the least total movement; they never
// cross or overlap.
import { midiNumber, pitchClass, type Note } from './note'
import {
  DEFAULT_VOICE_LEADING_WEIGHTS,
  type VoiceLeadingWeights,
} from './voice-leading-data'

export type VoiceMove = { from: Note; to: Note; semitones: number }

export type VoiceLeading = {
  moves: VoiceMove[] // signed: up is positive
  movement: number // total semitones moved
  kept: number // voices holding their note (enharmonics count: C♯ to D♭)
  common: number // pitch classes the two voicings share
  missed: number // shared pitch classes no voice holds
  crossings: number // pairs of voices out of order in the second voicing
  overlaps: number // voices moving above (below) where the voice above (below) just was
  cost: number
}

function pitch(note: Note): number {
  const midi = midiNumber(note)
  if (midi === undefined) throw new Error('voice-leading needs octaves')
  return midi
}

const move = (from: Note, to: Note): VoiceMove => ({
  from,
  to,
  semitones: pitch(to) - pitch(from),
})

// Pairs two voicings of different sizes in pitch order, for the least total
// movement, using every note of each at least once.
function align(from: Note[], to: Note[]): VoiceMove[] {
  const a = [...from].sort((x, y) => pitch(x) - pitch(y))
  const b = [...to].sort((x, y) => pitch(x) - pitch(y))
  // best[i][j]: least movement pairing a[0..i] with b[0..j], ending on (i, j).
  const best = a.map(() => b.map(() => Infinity))
  const back: [number, number][][] = a.map(() => b.map(() => [-1, -1]))
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      const here = Math.abs(pitch(b[j]) - pitch(a[i]))
      if (i === 0 && j === 0) {
        best[i][j] = here
        continue
      }
      // Diagonal first, so a tie keeps voices one to one.
      const steps: [number, number][] = [
        [i - 1, j - 1],
        [i - 1, j],
        [i, j - 1],
      ]
      for (const [pi, pj] of steps) {
        if (pi < 0 || pj < 0) continue
        if (best[pi][pj] + here < best[i][j]) {
          best[i][j] = best[pi][pj] + here
          back[i][j] = [pi, pj]
        }
      }
    }
  }
  const moves: VoiceMove[] = []
  let [i, j] = [a.length - 1, b.length - 1]
  while (i >= 0 && j >= 0) {
    moves.unshift(move(a[i], b[j]))
    ;[i, j] = back[i][j]
  }
  return moves
}

// Pairs of voices in the second voicing where the lower-listed voice sits
// above the higher-listed one.
function crossings(to: Note[]): number {
  let count = 0
  for (let i = 0; i < to.length; i++) {
    for (let j = i + 1; j < to.length; j++) {
      if (pitch(to[i]) > pitch(to[j])) count++
    }
  }
  return count
}

// Voices moving above where the voice listed above them just was, or below
// where the voice listed below them just was.
function overlaps(from: Note[], to: Note[]): number {
  let count = 0
  for (let i = 0; i < to.length; i++) {
    const above = from[i + 1]
    const below = from[i - 1]
    if (
      (above && pitch(to[i]) > pitch(above)) ||
      (below && pitch(to[i]) < pitch(below))
    ) {
      count++
    }
  }
  return count
}

export function voiceLeading(
  from: Note[],
  to: Note[],
  weights: VoiceLeadingWeights = DEFAULT_VOICE_LEADING_WEIGHTS,
): VoiceLeading {
  if (!from.length || !to.length) throw new Error('empty voicing')
  const paired = from.length === to.length
  const moves = paired ? from.map((f, i) => move(f, to[i])) : align(from, to)
  const held = moves.filter((m) => m.semitones === 0)
  const shared = new Set(from.map(pitchClass))
  const common = [...new Set(to.map(pitchClass))].filter((p) => shared.has(p))
  const heldClasses = new Set(held.map((m) => pitchClass(m.to)))
  const missed = common.filter((p) => !heldClasses.has(p)).length
  const result = {
    moves,
    movement: moves.reduce((sum, m) => sum + Math.abs(m.semitones), 0),
    kept: held.length,
    common: common.length,
    missed,
    crossings: paired ? crossings(to) : 0,
    overlaps: paired ? overlaps(from, to) : 0,
  }
  return {
    ...result,
    cost:
      weights.semitone * result.movement +
      weights.missedCommonTone * result.missed +
      weights.crossing * result.crossings +
      weights.overlap * result.overlaps,
  }
}

// The average total movement per chord change across a run of voicings: the
// measure the lenses must beat a root-position baseline on (PLAN Phase 5).
// Zero for fewer than two voicings.
export function averageMovement(voicings: Note[][]): number {
  if (voicings.length < 2) return 0
  let total = 0
  for (let i = 1; i < voicings.length; i++) {
    total += voiceLeading(voicings[i - 1], voicings[i]).movement
  }
  return total / (voicings.length - 1)
}
