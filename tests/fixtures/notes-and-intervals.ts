// Golden fixture: note spelling, pitch numbers, intervals and degree labels.
// Musical truths from SPEC.md section 4. Never edit to make a test pass: ask David.
// Notes are written with typed accidentals (b, #, bb, ##); x is also accepted.

// Scientific pitch, middle C = C4 = MIDI 60. Enharmonic spellings keep their
// letter but share a pitch number.
export const midiNumbers: [note: string, midi: number][] = [
  ['C4', 60],
  ['A4', 69],
  ['A0', 21],
  ['C8', 108],
  ['C-1', 0],
  ['C#4', 61],
  ['Db4', 61],
  ['B3', 59],
  ['Cb4', 59], // C♭4 sits below C4, so it sounds as B3
  ['B#3', 60], // B♯3 sounds as C4
  ['E#4', 65],
  ['Fb4', 64],
  ['C##4', 62],
  ['Dbb4', 60],
  ['F##4', 67],
  ['Bbb3', 57],
]

// How notes display: symbols, never typed characters.
export const displayNames: [typed: string, shown: string][] = [
  ['C', 'C'],
  ['F#', 'F♯'],
  ['Bb', 'B♭'],
  ['C##', 'C𝄪'],
  ['Fx', 'F𝄪'],
  ['Ebb', 'E𝄫'],
  ['Ab3', 'A♭3'],
  ['E#5', 'E♯5'],
]

// Ascending simple intervals between spelled notes. Spelling decides the
// interval: C–D♯ is an augmented 2nd, C–E♭ a minor 3rd.
export const intervals: [from: string, to: string, interval: string][] = [
  ['C', 'C', 'P1'],
  ['C', 'D', 'M2'],
  ['C', 'Eb', 'm3'],
  ['C', 'D#', 'A2'],
  ['C', 'E', 'M3'],
  ['C', 'Fb', 'd4'],
  ['C', 'F', 'P4'],
  ['C', 'F#', 'A4'],
  ['C', 'Gb', 'd5'],
  ['C', 'G', 'P5'],
  ['C', 'G#', 'A5'],
  ['C', 'Ab', 'm6'],
  ['C', 'A', 'M6'],
  ['C', 'Bbb', 'd7'],
  ['C', 'Cb', 'd8'], // up to a lowered copy of the same letter
  ['C', 'C#', 'A1'],
  ['E#', 'Fb', 'dd9'], // F♭ sits below E♯, so the next one up
  ['C', 'Bb', 'm7'],
  ['C', 'B', 'M7'],
  ['E', 'C', 'm6'],
  ['B', 'F', 'd5'],
  ['F', 'B', 'A4'],
  ['G#', 'F', 'd7'], // G♯°7 in C: G♯ up to F
  ['Ab', 'Fb', 'm6'], // F♭ is the 6th of A♭ minor
  ['D#', 'C##', 'M7'], // D♯ harmonic minor's leading note
  ['Bb', 'D', 'M3'],
  ['F#', 'E#', 'M7'],
]

// Transposing keeps spelling: the letter moves by the interval's number.
export const transpositions: [
  note: string,
  interval: string,
  result: string,
][] = [
  ['C4', 'M3', 'E4'],
  ['C4', 'm3', 'Eb4'],
  ['C4', 'A2', 'D#4'],
  ['C4', 'P8', 'C5'],
  ['C4', 'M9', 'D5'],
  ['B3', 'm2', 'C4'], // crosses the octave at C
  ['B3', 'A1', 'B#3'],
  ['Ab3', 'm6', 'Fb4'], // F♭ in A♭ minor
  ['D#4', 'M7', 'C##5'], // C𝄪 in D♯ harmonic minor
  ['E4', 'M3', 'G#4'], // V/vi in C is E7, with G♯
  ['G#3', 'd7', 'F4'], // G♯°7 resolves to Am
  ['C4', 'm6', 'Ab4'], // ♭VI in C is A♭, not G♯
  ['F#', 'M7', 'E#'],
  ['Gb', 'P4', 'Cb'],
]

// Degree labels follow spelling and count from the major scale on the tonic.
export const degreeLabels: [tonic: string, note: string, label: string][] = [
  ['C', 'C', '1'],
  ['C', 'Eb', '♭3'],
  ['C', 'D#', '♯2'],
  ['C', 'F#', '♯4'],
  ['C', 'Gb', '♭5'],
  ['C', 'Bb', '♭7'],
  ['C', 'Ab', '♭6'],
  ['C', 'Bbb', '𝄫7'],
  ['C', 'Cb', '♭1'],
  ['A', 'C', '♭3'], // A minor's 3rd, measured from A major
  ['A', 'G', '♭7'],
  ['E', 'C#', '6'], // E Dorian's raised 6th is a plain 6
  ['Ab', 'Fb', '♭6'],
  ['D#', 'C##', '7'],
  ['F#', 'E#', '7'],
]
