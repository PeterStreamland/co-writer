// Golden fixture: the key picker's spellings, step patterns and degree names,
// written out by hand. Never edit this to make a test pass: ask David.
// ASCII accidentals: # sharp, b flat, ## double sharp, bb double flat.

// The tonics the picker lists for a scale, in pitch order (SPEC 4: D♭ major
// rather than C♯, and both F♯ and G♭ major).
export const pickerTonics: Record<string, string[]> = {
  major: 'C Db D Eb E F F# Gb G Ab A Bb B'.split(' '),
  'natural-minor': 'C C# D D# Eb E F F# G G# A Bb B'.split(' '),
  dorian: 'C C# D Eb E F F# G G# Ab A Bb B'.split(' '),
  'harmonic-minor': 'C C# D Eb E F F# G G# Ab A Bb B'.split(' '),
  'minor-pentatonic': 'C C# D D# Eb E F F# G G# A Bb B'.split(' '),
}

// The enharmonic swap from each tonic, or null where the other spelling would
// need more than seven sharps or flats in its key signature or, for a scale
// with no signature, in its notes or a double sharp or flat.
export const swaps: { scale: string; from: string; to: string | null }[] = [
  { scale: 'major', from: 'Db', to: 'C#' },
  { scale: 'major', from: 'C#', to: 'Db' },
  { scale: 'major', from: 'F#', to: 'Gb' },
  { scale: 'major', from: 'Gb', to: 'F#' },
  { scale: 'major', from: 'B', to: 'Cb' },
  { scale: 'major', from: 'Cb', to: 'B' },
  { scale: 'major', from: 'Eb', to: null }, // D# major has F## and C##
  { scale: 'major', from: 'C', to: null }, // B# major
  { scale: 'major', from: 'E', to: null }, // Fb major has Bbb
  { scale: 'natural-minor', from: 'Bb', to: 'A#' },
  { scale: 'natural-minor', from: 'G#', to: 'Ab' },
  { scale: 'natural-minor', from: 'D#', to: 'Eb' },
  { scale: 'natural-minor', from: 'C#', to: null }, // Db minor has Bbb
  { scale: 'harmonic-minor', from: 'Eb', to: 'D#' },
  { scale: 'dorian', from: 'C#', to: 'Db' },
  { scale: 'melodic-minor', from: 'Eb', to: 'D#' }, // signature of D# minor
  { scale: 'minor-blues', from: 'C', to: null }, // B# blues has F##
  { scale: 'minor-blues', from: 'C#', to: null }, // Db blues has Abb
  { scale: 'minor-pentatonic', from: 'D#', to: 'Eb' },
]

// Steps between neighbouring notes, up to the octave: T tone, S semitone.
export const stepPatterns: Record<string, string[]> = {
  major: 'T T S T T T S'.split(' '),
  'natural-minor': 'T S T T S T T'.split(' '),
  dorian: 'T S T T T S T'.split(' '),
  'harmonic-minor': 'T S T T S T+S S'.split(' '),
  'melodic-minor': 'T S T T T T S'.split(' '),
  'major-pentatonic': 'T T T+S T T+S'.split(' '),
  'minor-pentatonic': 'T+S T T T+S T'.split(' '),
  'minor-blues': 'T+S T S S T+S T'.split(' '),
  'whole-tone': 'T T T T T T'.split(' '),
  'diminished-half-whole': 'S T S T S T S T'.split(' '),
  'bebop-dominant': 'T T S T T S S S'.split(' '),
}

// Degree labels and their traditional names, for the scale on C.
export const degreeNames: Record<string, [string, string][]> = {
  major: [
    ['1', 'tonic'],
    ['2', 'supertonic'],
    ['3', 'mediant'],
    ['4', 'subdominant'],
    ['5', 'dominant'],
    ['6', 'submediant'],
    ['7', 'leading note'],
  ],
  'natural-minor': [
    ['1', 'tonic'],
    ['2', 'supertonic'],
    ['b3', 'mediant'],
    ['4', 'subdominant'],
    ['5', 'dominant'],
    ['b6', 'submediant'],
    ['b7', 'subtonic'],
  ],
  'harmonic-minor': [
    ['1', 'tonic'],
    ['2', 'supertonic'],
    ['b3', 'mediant'],
    ['4', 'subdominant'],
    ['5', 'dominant'],
    ['b6', 'submediant'],
    ['7', 'leading note'],
  ],
  phrygian: [
    ['1', 'tonic'],
    ['b2', 'flattened supertonic'],
    ['b3', 'mediant'],
    ['4', 'subdominant'],
    ['5', 'dominant'],
    ['b6', 'submediant'],
    ['b7', 'subtonic'],
  ],
  lydian: [
    ['1', 'tonic'],
    ['2', 'supertonic'],
    ['3', 'mediant'],
    ['#4', 'sharpened subdominant'],
    ['5', 'dominant'],
    ['6', 'submediant'],
    ['7', 'leading note'],
  ],
  'minor-blues': [
    ['1', 'tonic'],
    ['b3', 'mediant'],
    ['4', 'subdominant'],
    ['b5', 'flattened dominant'],
    ['5', 'dominant'],
    ['b7', 'subtonic'],
  ],
  ultralocrian: [
    ['1', 'tonic'],
    ['b2', 'flattened supertonic'],
    ['b3', 'mediant'],
    ['b4', 'flattened subdominant'],
    ['b5', 'flattened dominant'],
    ['b6', 'submediant'],
    ['bb7', 'double-flattened seventh'],
  ],
}
