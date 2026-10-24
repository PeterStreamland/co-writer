// Golden fixture: your own notes in a harmony (David's request, 2026-10-24).
// Never edit this to make a test pass: ask David.
// A harmony keeps following the melody with your edits on top: a note
// changed or taken out stays so while the melody note it sits under is
// unchanged. Notes offered in place of a harmony's note are what the other
// harmonies would play there, one of each, chord tones first and notes
// outside the key last. Melodies are typed as the Melody tab reads them,
// each word a crotchet; chords are a bar each in 4/4.

export type HarmonyEditFixture = {
  name: string
  key: string
  chords: string[]
  melody: string
  kind: string
  // Edits by melody note: a note in its place, or '' to take it out.
  edits: Record<number, string>
  notes: string // the harmony with the edits, r where a note was taken out
  // Notes offered in place of the harmony's note under a melody note: the
  // first few, in order, and any that must come after the chord tones.
  offered?: { place: number; first: string; later?: string }
}

export const harmonyEdits: HarmonyEditFixture[] = [
  {
    // 3rds above E F G A over C is G A C C (on beat 3 B bends to C). Under E, G3, C4 and C5 are
    // chord tones of C; A3 is a passing 5th below.
    name: '3rds above over C, a note changed and one taken out',
    key: 'C major',
    chords: ['C', 'G7'],
    melody: 'E4 F4 G4 A4 G4 F4 E4 D4',
    kind: '3rd-above',
    edits: { 1: 'C5', 2: '' },
    notes: 'G4 C5 r C5 B4 A4 G4 F4',
    offered: { place: 0, first: 'G3 C4 C5', later: 'A3' },
  },
  {
    // Under G over G7, the 3rds below bend to D, the chord's 5th.
    name: 'notes in place of a 3rd above over G7',
    key: 'C major',
    chords: ['C', 'G7'],
    melody: 'E4 F4 G4 A4 G4 F4 E4 D4',
    kind: '3rd-above',
    edits: {},
    notes: 'G4 A4 C5 C5 B4 A4 G4 F4',
    offered: { place: 4, first: 'B3 D3 D4', later: 'C4' },
  },
]
