// Golden fixture: each chord's notes labelled by their interval above the
// root, in the chord's own order, as the chord-tone colours show them, with
// the colour role in brackets (R root, 3 third, 5 fifth, 7 seventh, x the
// shared colour for 9ths, 11ths, 13ths, sus tones, 6ths and a bass outside
// the chord). Written out by hand; never edit this to make a test pass: ask
// David.
export const chordToneLabels: Record<string, string> = {
  C: 'C:R(R) E:3(3) G:5(5)',
  Cm: 'C:R(R) Eb:b3(3) G:5(5)',
  Cdim: 'C:R(R) Eb:b3(3) Gb:b5(5)',
  Caug: 'C:R(R) E:3(3) G#:#5(5)',
  C7: 'C:R(R) E:3(3) G:5(5) Bb:b7(7)',
  Cmaj7: 'C:R(R) E:3(3) G:5(5) B:7(7)',
  Cm7b5: 'C:R(R) Eb:b3(3) Gb:b5(5) Bb:b7(7)',
  Cdim7: 'C:R(R) Eb:b3(3) Gb:b5(5) Bbb:bb7(7)',
  C9: 'C:R(R) E:3(3) G:5(5) Bb:b7(7) D:9(x)',
  'C7#9': 'C:R(R) E:3(3) G:5(5) Bb:b7(7) D#:#9(x)',
  C7b9: 'C:R(R) E:3(3) G:5(5) Bb:b7(7) Db:b9(x)',
  'C7#11': 'C:R(R) E:3(3) G:5(5) Bb:b7(7) F#:#11(x)',
  C13: 'C:R(R) E:3(3) G:5(5) Bb:b7(7) D:9(x) F:11(x) A:13(x)',
  Csus4: 'C:R(R) F:4(x) G:5(5)',
  Csus2: 'C:R(R) D:2(x) G:5(5)',
  C6: 'C:R(R) E:3(3) G:5(5) A:6(x)',
  C5: 'C:R(R) G:5(5)',
  // Spelling follows the chord: F♯'s 3rd is A♯, B♭m's ♭3 is D♭.
  'F#': 'F#:R(R) A#:3(3) C#:5(5)',
  Bbm: 'Bb:R(R) Db:b3(3) F:5(5)',
  // An inversion labels the same tones; a bass outside the chord is named
  // as the extension it would be.
  'C/E': 'C:R(R) E:3(3) G:5(5)',
  'F/G': 'F:R(R) A:3(3) C:5(5) G:9(x)',
  'D/C': 'D:R(R) F#:3(3) A:5(5) C:b7(7)',
}
