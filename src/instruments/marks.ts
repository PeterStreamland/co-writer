// What an instrument view shows on each pitch: whether it's in the scale,
// the root, or a tone of the current chord, spelled as the key spells it.
// Pure: no UI, audio or DOM imports.
import {
  chordNotes,
  degreeLabel,
  formatNote,
  midiNumber,
  noteAtMidi,
  pitchClass,
  scaleNotes,
  type ChordName,
  type Key,
  type Note,
} from '../theory'
import { chordTones, roleOf, type ChordTone } from './chord-tones'

export type Mark = {
  note: Note // spelled, with the octave that sounds the pitch
  name: string // C♯
  degree: string // ♭3
  root: boolean
  inScale: boolean
  chordTone: boolean
  held: boolean // being played on the MIDI keyboard, at this exact pitch
  tone?: ChordTone // a tone of the current chord, by its interval
}

// A function from MIDI number to its mark, or undefined for a pitch that is
// in neither the scale nor the current chord and isn't being played. A pitch
// in the scale takes the scale's spelling; a chord tone outside the scale
// takes the chord's, and a played note outside both its own. Extra tones
// (an arpeggio's added 7th, 9th, 11th or 13th) count as tones of the chord,
// labelled and coloured by their interval.
export function noteMarker(
  key: Key,
  chord?: ChordName,
  played: Note[] = [],
  extra: { note: Note; label: string; number: number }[] = [],
): (midi: number) => Mark | undefined {
  const scale = scaleNotes(key.tonic, key.mode)
  const tones = chord ? chordNotes(chord) : []
  if (chord?.bass) tones.push(chord.bass)
  // Spellings only: the octave comes from the key pressed.
  const spelled = extra.map((t) => ({
    ...t,
    note: { letter: t.note.letter, accidental: t.note.accidental },
  }))
  tones.push(...spelled.map((t) => t.note))
  const rootPitch = pitchClass(key.tonic)
  const scalePitches = new Set(scale.map(pitchClass))
  const tonePitches = new Set(tones.map(pitchClass))
  const toneOf = chord ? chordTones(chord) : new Map<number, ChordTone>()
  for (const t of spelled) {
    if (toneOf.has(pitchClass(t.note))) continue
    toneOf.set(pitchClass(t.note), {
      label: t.label,
      role: roleOf(t.number),
      note: t.note,
    })
  }
  const playedAt = new Map(
    played.map((n) => [
      midiNumber(n),
      { letter: n.letter, accidental: n.accidental },
    ]),
  )
  return (midi) => {
    const pitch = ((midi % 12) + 12) % 12
    const spelling =
      scale.find((n) => pitchClass(n) === pitch) ??
      tones.find((n) => pitchClass(n) === pitch) ??
      playedAt.get(midi)
    if (!spelling) return undefined
    const note = noteAtMidi(spelling, midi) as Note
    return {
      note,
      name: formatNote(spelling),
      degree: degreeLabel(key.tonic, spelling),
      root: pitch === rootPitch,
      inScale: scalePitches.has(pitch),
      chordTone: tonePitches.has(pitch),
      held: playedAt.has(midi),
      tone: toneOf.get(pitch),
    }
  }
}
