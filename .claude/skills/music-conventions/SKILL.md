---
name: music-conventions
description: Note spelling, key, Roman-numeral and chord-symbol conventions for this app. Use when writing or reviewing theory code, tests, fixtures or UI labels that spell notes, name chords, pick keys or show numerals.
---

# Music conventions

Summary of docs/SPEC.md section 4. SPEC.md is the authority; if this file and the spec disagree, the spec wins.

## Notes and spelling

- A note is letter + accidental + optional octave. Pitch numbers are derived, never stored alone.
- Display accidentals as ♭ ♯ 𝄫 𝄪 ♮. Always accept typed `b`, `#`, `bb`, `##` and `x`.
- Scientific pitch: middle C = C4 = MIDI 60.
- Chromatic chords are spelled by function, even when awkward:
  - ♭VI in C is A♭, not G♯
  - V/vi in C is E7, containing G♯
  - leading-note chords are spelled up to their target: G♯°7 resolves to Am
  - F♭ in A♭ minor stays F♭
- Degree labels follow spelling: in C, E♭ is ♭3 and D♯ is ♯2.

## Keys and modes

- Key = tonic + mode. Modes (E Dorian, A Mixolydian) and the three minors are keys in their own right.
- The key signature shown is the parent scale's (E Dorian shows two sharps).
- Picker shows the common spelling (D♭ major, not C♯), offers both F♯ and G♭ major, and has an enharmonic swap. All 30 key signatures are reachable.
- Keys can change mid-section at a chord, and between sections.

## Roman numerals

- Always measured from the major scale on the tonic, flats shown: E minor is i – ii° – ♭III – iv – v – ♭VI – ♭VII.
- Modal keys number from their own tonic: in E Dorian, A is IV and C♯m is vi.
- Case and marks: I major, ii minor, ° diminished, ø half-diminished, + augmented.
- Extensions follow the numeral (V7, ii7, ♭VIImaj7). Inversions use figures by default (V⁶₅), slash optional (V7/3).
- Secondary chords: V/vi, vii°7/V. Borrowed chords name their source mode in ⓘ ("♭VI, borrowed from E Aeolian").
- Nashville numbers (Phase 10) use the same major-scale reference.

## Chord symbols

- Display setting: lead-sheet (default: Cmaj7, Cm7, Cm7♭5, Cdim7, Caug) or jazz (C△7, C–7, Cø7, C°7, C+). The parser accepts both always.
- Ambiguous notes: the primary name fits the current key and keeps the lowest note as root where possible; with no key, lowest note is root. List every other valid name underneath (C6 = Am7/C; Cdim7 has four names).
- Don't trust tonal's `Chord.detect` order: it ranks Em♯5 above C/E for E–G–C and ignores spelling. Rank names ourselves.
- Power chords and other 3rd-less chords are quality-neutral: either major or minor in key finding, numerals show the root only (♭VI5), never forced into a quality.
- Slash chords show the bass (C/E); the core decides inversion vs non-chord bass.

## Edge cases tests must cover (SPEC section 13)

- F♭ in A♭ minor; G♯°7 in C; double sharps in D♯ harmonic minor
- Modal keys numbered from their own tonic; enharmonic key swap keeps every chord's function
- Every name of symmetrical chords (dim7, aug)
- Power chords quality-neutral through naming, key finding and numerals, including all-power-chord progressions
