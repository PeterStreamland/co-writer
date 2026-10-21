// Golden fixture: inversions, written out by hand (Phase 1 task 7).
// Never edit this to make a test pass: ask David.
// Notes are typed in ASCII (# sharp, b flat, x double sharp, bb double flat).

// Every inversion of each chord, root position first. A chord inverts on its
// root, 3rd (or the 2nd or 4th of a sus chord), 5th and 6th or 7th, in that
// order; a 9th, 11th or 13th never goes in the bass (Fadd9/G is F/G, as the
// namer decided). The bass keeps the chord's own spelling.
export const inversionSymbols: Record<string, string[]> = {
  C: ['C', 'C/E', 'C/G'],
  Am: ['Am', 'Am/C', 'Am/E'],
  Bdim: ['Bdim', 'Bdim/D', 'Bdim/F'],
  Caug: ['Caug', 'Caug/E', 'Caug/G#'],
  'F#': ['F#', 'F#/A#', 'F#/C#'],
  Fb: ['Fb', 'Fb/Ab', 'Fb/Cb'],
  C5: ['C5', 'C5/G'],
  Csus2: ['Csus2', 'Csus2/D', 'Csus2/G'],
  Dsus4: ['Dsus4', 'Dsus4/G', 'Dsus4/A'],
  Cmaj7: ['Cmaj7', 'Cmaj7/E', 'Cmaj7/G', 'Cmaj7/B'],
  G7: ['G7', 'G7/B', 'G7/D', 'G7/F'],
  'F#m7b5': ['F#m7b5', 'F#m7b5/A', 'F#m7b5/C', 'F#m7b5/E'],
  Bbdim7: ['Bbdim7', 'Bbdim7/Db', 'Bbdim7/Fb', 'Bbdim7/Abb'],
  'G#dim7': ['G#dim7', 'G#dim7/B', 'G#dim7/D', 'G#dim7/F'],
  'E7#5': ['E7#5', 'E7#5/G#', 'E7#5/B#', 'E7#5/D'],
  CmMaj7: ['CmMaj7', 'CmMaj7/Eb', 'CmMaj7/G', 'CmMaj7/B'],
  G7sus4: ['G7sus4', 'G7sus4/C', 'G7sus4/D', 'G7sus4/F'],
  C6: ['C6', 'C6/E', 'C6/G', 'C6/A'],
  'C6/9': ['C6/9', 'C6/9/E', 'C6/9/G', 'C6/9/A'],
  Cadd9: ['Cadd9', 'Cadd9/E', 'Cadd9/G'],
  Cmaj9: ['Cmaj9', 'Cmaj9/E', 'Cmaj9/G', 'Cmaj9/B'],
  Dm11: ['Dm11', 'Dm11/F', 'Dm11/A', 'Dm11/C'],
  G13: ['G13', 'G13/B', 'G13/D', 'G13/F'],
  A7b9: ['A7b9', 'A7b9/C#', 'A7b9/E', 'A7b9/G'],
}

// Which inversion a chord symbol is: 0 for root position, 1 for the 3rd in
// the bass and so on. null when the bass is outside the chord, or is a 9th,
// 11th or 13th: then it's a slash chord, not an inversion. A bass spelled
// differently from the chord tone still counts (Caug/Ab is Caug over its
// G#), as chord symbols already read it.
export const inversionNumbers: Record<string, number | null> = {
  C: 0,
  'C/E': 1,
  'C/G': 2,
  'Am7/C': 1,
  'Am7/E': 2,
  'Am7/G': 3,
  'Cmaj7/B': 3,
  'C5/G': 1,
  'Dsus4/G': 1,
  'G7sus4/F': 3,
  'Caug/Ab': 2,
  'Bbdim7/Abb': 3,
  'G13/F': 3,
  'F/G': null,
  'C/D': null,
  'Fadd9/G': null,
  'Cmaj9/D': null,
}

// Close-position voicings: the bass at the octave given, then the other
// chord tones in order, each the next one up, then any 9th, 11th or 13th
// above them. A bass outside the chord sits under the chord in root position.
export const voicings: { symbol: string; octave: number; notes: string }[] = [
  { symbol: 'C', octave: 4, notes: 'C4 E4 G4' },
  { symbol: 'C/E', octave: 4, notes: 'E4 G4 C5' },
  { symbol: 'C/G', octave: 3, notes: 'G3 C4 E4' },
  { symbol: 'Am/E', octave: 3, notes: 'E3 A3 C4' },
  { symbol: 'G7/F', octave: 3, notes: 'F3 G3 B3 D4' },
  { symbol: 'Cmaj7/B', octave: 3, notes: 'B3 C4 E4 G4' },
  { symbol: 'Cmaj9/E', octave: 3, notes: 'E3 G3 B3 C4 D4' },
  { symbol: 'G13/B', octave: 3, notes: 'B3 D4 F4 G4 A4 C5 E5' },
  { symbol: 'Bbdim7/Abb', octave: 3, notes: 'Abb3 Bb3 Db4 Fb4' },
  { symbol: 'E7#5/B#', octave: 3, notes: 'B#3 D4 E4 G#4' },
  { symbol: 'B/D#', octave: 3, notes: 'D#3 F#3 B3' },
  { symbol: 'Cb', octave: 4, notes: 'Cb4 Eb4 Gb4' },
  { symbol: 'Fb/Cb', octave: 4, notes: 'Cb4 Fb4 Ab4' },
  { symbol: 'C5/G', octave: 2, notes: 'G2 C3' },
  { symbol: 'Csus2/D', octave: 3, notes: 'D3 G3 C4' },
  { symbol: 'F/G', octave: 2, notes: 'G2 F3 A3 C4' },
  { symbol: 'Fadd9/G', octave: 2, notes: 'G2 F3 A3 C4 G4' },
  { symbol: 'Caug/Ab', octave: 3, notes: 'Ab3 C4 E4' },
]
