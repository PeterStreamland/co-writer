// Golden fixture: chord symbols, written out by hand (SPEC 4, Phase 1 task 6).
// Never edit this to make a test pass: ask David.
// Notes are typed in ASCII (# sharp, b flat, x double sharp, bb double flat).
// Lead-sheet symbols are shown in ASCII; jazz symbols as displayed.

// Each symbol's notes, root first, spelled from the root. A slash chord puts
// its bass first: an inversion moves that chord tone to the bottom, and a
// bass outside the chord sits under the whole chord. An alteration adds only
// its own note (C7#11 has no 9th); a natural extension keeps the ones below
// it (C13 has its 9th and 11th).
export const symbolNotes: Record<string, string> = {
  C: 'C E G',
  Cm: 'C Eb G',
  Bdim: 'B D F',
  Caug: 'C E G#',
  Cmaj7: 'C E G B',
  'F#m7b5': 'F# A C E',
  Bbdim7: 'Bb Db Fb Abb',
  'G#dim7': 'G# B D F',
  C7: 'C E G Bb',
  Am7: 'A C E G',
  CmMaj7: 'C Eb G B',
  'Ebmaj7#5': 'Eb G B D',
  'E7#5': 'E G# B# D',
  C7b5: 'C E Gb Bb',
  C5: 'C G',
  Bb5: 'Bb F',
  Csus2: 'C D G',
  Dsus4: 'D G A',
  G7sus4: 'G C D F',
  G9sus4: 'G C D F A',
  Cadd9: 'C E G D',
  Cmadd9: 'C Eb G D',
  Cadd11: 'C E G F',
  C6: 'C E G A',
  Cm6: 'C Eb G A',
  'C6/9': 'C E G A D',
  'Cm6/9': 'C Eb G A D',
  Cmaj9: 'C E G B D',
  C9: 'C E G Bb D',
  Cm9: 'C Eb G Bb D',
  Cm11: 'C Eb G Bb D F',
  C11: 'C E G Bb D F',
  C13: 'C E G Bb D F A',
  'Fmaj13#11': 'F A C E G B D',
  E11b9b13: 'E G# B D F A C',
  // A dim7 with b9 and 11, from harmonic major (task 3 asked that it reads
  // back unchanged).
  Bdim11b9: 'B D F Ab C E',
  G7b9: 'G B D F Ab',
  'G7#9': 'G B D F A#',
  'C7#11': 'C E G Bb F#',
  'C9#11': 'C E G Bb D F#',
  C7b13: 'C E G Bb Ab',
  'C7#5b9': 'C E G# Bb Db',
  Cm9b5: 'C Eb Gb Bb D',
  'Db/F': 'F Ab Db',
  'F/G': 'G F A C',
  'C7/Bb': 'Bb C E G',
  'Cmaj9/E': 'E G B D C',
  'D/C': 'C D F# A',
  'F#m7b5/C': 'C E F# A',
}

// Typed forms, in either style and with typed or displayed accidentals, and
// the lead-sheet symbol each reads as.
export const typedSymbols: Record<string, string> = {
  CM7: 'Cmaj7',
  CΔ7: 'Cmaj7',
  'C△7': 'Cmaj7',
  'C△': 'Cmaj7',
  'C^7': 'Cmaj7',
  Cma7: 'Cmaj7',
  CM9: 'Cmaj9',
  'C△9': 'Cmaj9',
  CM: 'C',
  Cmaj: 'C',
  Cmin: 'Cm',
  Cmi: 'Cm',
  'C-': 'Cm',
  'C–': 'Cm',
  'C–7': 'Cm7',
  'C-7': 'Cm7',
  Cmin7: 'Cm7',
  'C-9': 'Cm9',
  Cø: 'Cm7b5',
  Cø7: 'Cm7b5',
  Cø9: 'Cm9b5',
  'C-7b5': 'Cm7b5',
  'Cm7(b5)': 'Cm7b5',
  'Cm7-5': 'Cm7b5',
  Co: 'Cdim',
  'C°': 'Cdim',
  Co7: 'Cdim7',
  'C°7': 'Cdim7',
  'C+': 'Caug',
  'C+7': 'C7#5',
  'C7+5': 'C7#5',
  'C7+': 'C7#5',
  Caug7: 'C7#5',
  'C+maj7': 'Cmaj7#5',
  'C+△7': 'Cmaj7#5',
  'Cm(maj7)': 'CmMaj7',
  CmM7: 'CmMaj7',
  'C-△7': 'CmMaj7',
  'C–△7': 'CmMaj7',
  Csus: 'Csus4',
  C7sus: 'C7sus4',
  C69: 'C6/9',
  Cm69: 'Cm6/9',
  'C(add9)': 'Cadd9',
  'Cm(add9)': 'Cmadd9',
  'C7(b9)': 'C7b9',
  'C7-9': 'C7b9',
  'C7(#9)': 'C7#9',
  'C7♯9': 'C7#9',
  'C7(b9,#11)': 'C7b9#11',
  'C7#11b9': 'C7b9#11',
  'C7b9#5': 'C7#5b9',
  'C13(#11)': 'C13#11',
  'B♭△7': 'Bbmaj7',
  'F♯ø7': 'F#m7b5',
  'E♭m7♭5': 'Ebm7b5',
  'C/C': 'C',
  'C7/E': 'C7/E',
  'B♭/D': 'Bb/D',
  'F𝄪dim': 'F##dim',
}

// Lead-sheet symbols and their jazz forms (SPEC 4: C△7, C–7, Cø7, C°7, C+).
export const jazzSymbols: Record<string, string> = {
  C: 'C',
  Cm: 'C–',
  Cdim: 'C°',
  Caug: 'C+',
  Cmaj7: 'C△7',
  C7: 'C7',
  Cm7: 'C–7',
  Cm7b5: 'Cø7',
  Cdim7: 'C°7',
  CmMaj7: 'C–△7',
  'Cmaj7#5': 'C+△7',
  'C7#5': 'C+7',
  Cm6: 'C–6',
  'Cm6/9': 'C–6/9',
  Cmadd9: 'C–add9',
  C5: 'C5',
  Csus4: 'Csus4',
  Cmaj9: 'C△9',
  Cm11: 'C–11',
  Cm9b5: 'Cø9',
  'Fmaj13#11': 'F△13♯11',
  G7b9: 'G7♭9',
  'C7#5b9': 'C+7♭9',
  'Bbmaj7/D': 'B♭△7/D',
}

// Notes (lowest first) and, optionally, a key; every name, primary first.
// Roots and the bass keep the spelling given, except a root with a double
// accidental, which is respelled (B𝄫 reads as A). A bass outside the chord is
// only offered when no complete name has a chord tone in the bass.
// The primary name fits the key and keeps the lowest note as root where it
// can (SPEC 4). A name may leave out the 5th, or the 9th and 11th of an 11th
// or 13th chord; omitted lists those chord tones.
export const nameCases: {
  notes: string
  key?: { tonic: string; mode: string }
  names: string[]
  omitted?: Record<string, number[]>
}[] = [
  { notes: 'C E G A', names: ['C6', 'Am7/C'] },
  { notes: 'A C E G', names: ['Am7', 'C6/A'] },
  {
    notes: 'C E G A',
    key: { tonic: 'A', mode: 'natural-minor' },
    names: ['C6', 'Am7/C'],
  },
  // A diminished 7th has four names, and an augmented triad three (SPEC 13).
  // A name with a double accidental at its root is respelled: B𝄫 reads as A.
  {
    notes: 'C Eb Gb Bbb',
    names: ['Cdim7', 'Ebdim7/C', 'Adim7/C', 'Gbdim7/C'],
  },
  { notes: 'C E G#', names: ['Caug', 'Eaug/C', 'G#aug/C'] },
  // Key-aware: in A minor, C E G# is the harmonic minor's III+, here over
  // its 5th. The bass keeps the spelling it was given.
  { notes: 'Ab C E', names: ['Abaug', 'Caug/Ab', 'Eaug/Ab'] },
  {
    notes: 'Ab C E',
    key: { tonic: 'A', mode: 'natural-minor' },
    names: ['Caug/Ab', 'Abaug', 'Eaug/Ab'],
  },
  {
    notes: 'B D F Ab',
    key: { tonic: 'C', mode: 'natural-minor' },
    names: ['Bdim7', 'Ddim7/B', 'Fdim7/B', 'Abdim7/B'],
  },
  // Tonal's detection ranks Em#5 above C/E; we don't (SPEC 4).
  { notes: 'E G C', names: ['C/E'] },
  { notes: 'E G C', key: { tonic: 'C', mode: 'major' }, names: ['C/E'] },
  // The lowest note stays the root where it can, even with a tone left
  // out: G9sus4 before F/G, and E A D G B E is Em11. Names with a 9th, 11th
  // or 13th in the bass are left out: Fadd9/G is F/G, and Em7b5b13/C is C9.
  {
    notes: 'G F A C',
    names: ['G9sus4', 'F/G'],
    omitted: { G9sus4: [5] },
  },
  {
    notes: 'E A D G B E',
    names: ['Em11', 'A9sus4/E', 'G6/9/E'],
    omitted: { Em11: [9] },
  },
  // The 5th can't go when a #11 or b13 would then sound as a b5 or #5: B D F A
  // is not also Bm7#11 without its 5th.
  { notes: 'B D F A', names: ['Bm7b5', 'Dm6/B'] },
  {
    notes: 'B F# A D E',
    names: ['Bm11', 'D6/9/B', 'E9sus4/B'],
    omitted: { Bm11: [9] },
  },
  { notes: 'C E Bb', names: ['C7'], omitted: { C7: [5] } },
  { notes: 'C E Bb A', names: ['C13'], omitted: { C13: [5, 9, 11] } },
  { notes: 'C E G Bb D', names: ['C9'] },
  { notes: 'D F# A C', key: { tonic: 'G', mode: 'major' }, names: ['D7'] },
  // Power chords stay quality-neutral (SPEC 13).
  { notes: 'C G', names: ['C5'] },
  { notes: 'G C', names: ['C5/G'] },
  { notes: 'E B', key: { tonic: 'E', mode: 'natural-minor' }, names: ['E5'] },
]
