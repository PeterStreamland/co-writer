# Decisions

One dated entry per decision that changes or refines `docs/PLAN.md`, with its reason. Newest last.

## 2026-10-21 — Sections, linked repeats and song form

A sketch is a song made of named sections, each with its own key, meter, style blend, progression, melody and range. A section can be a linked repeat of another, and an arrangement list orders them. The data model carries this from Phase 1; the section UI arrives in Phase 4 and form playback in Phase 10.

Why: songs are written in sections that differ in key, feel and harmony, and the engine can use the section label (chorus, bridge) to shape suggestions. Building it into the data model now avoids a migration later. (SPEC sections 3 and 12.)

## 2026-10-21 — Progression tree with per-slot alternatives

Each section's progression is a tree; the strip shows the active path, any slot can hold stacked alternatives, and an optional tree view shows every branch. Phase 4. Refines the plan's "branch to try an alternative".

Why: next-token mode invites trying several options at one point without losing the others, and a tree makes undo, branching and comparison one consistent model. (SPEC 6.5.)

## 2026-10-21 — Exact fractional durations, odd-meter groupings and bar-level meter overrides

Durations and positions are exact fractions of a whole note; odd meters carry a grouping (7/8 as 2+2+3) that sets the strong beats; any bar can override its section's meter. Phase 6. Refines the plan's "chord lengths in beats".

Why: triplets and odd meters must never round, and David writes rock and metal where 7/8 and mixed-meter bars are common. Strong beats drive melodic grammar, so the grouping matters. (SPEC 7.1.)

## 2026-10-21 — In-app style editor

A settings page lists each rule or move with a 0–5 weight per style, saves edits locally, can reset to built-in weights, and can export a JSON file for Claude to commit as the new defaults. Phase 4. Refines the plan's "editable JSON weights".

Why: David doesn't edit code or JSON, so tuning a style has to happen in the app; export keeps the built-in defaults in the repo. (SPEC 6.6.)

## 2026-10-21 — More playback sounds

Playback adds distorted guitar, bass and a pad/organ to piano and clean guitar, across Phases 2–6.

Why: power chords and "thirds under gain" only make sense heard through distortion; bass lines need a bass; a sustained pad makes voice leading audible. (SPEC 5, Playback.)

## 2026-10-21 — Version history and JSON export/import

Autosave keeps a version history to roll a sketch back, and a sketch can be exported and imported as a versioned `.json` file. No cloud sync or share links. Phase 10.

Why: saving is local to each browser, so a file is the way to back up and to move sketches between laptop and phone; history protects against unwanted edits. (SPEC 10.)

## 2026-10-21 — Phase 0 library spike

Status: complete. All three libraries pass; none is replaced. Updated 2026-10-21.

- **tonal: passes spelling.** Automated tests (`tests/spike/tonal-keys.test.ts`) check all 15 major and 15 minor key signatures against a hand-written golden fixture, including F♯ major (E♯), C♭ major (F♭), C♯ major (B♯), A♭ minor (F♭) and D♯ harmonic minor (C𝄪). All 35 pass.
- **tonal: chord naming needs our own ranking.** `Chord.detect` for E–G–C returns `Em#5` before `CM/E`, ignoring spelling (Em♯5 needs B♯, not C). We keep tonal, but Phase 1's chord namer must rank names itself (key-aware, bass-aware, spelling-correct) per SPEC section 4.
- **Tone.js playback: passes on laptop and Android phone.** David heard the C major chord on the published page on both. We keep Tone.js.
- **Web MIDI: passes with David's USB keyboard.** On the published page, the keyboard connected, played notes appeared, and held chords were named correctly. We keep Web MIDI.
  - Before that, a headless Chromium run of the production build replaced `navigator.requestMIDIAccess` with a fake keyboard that sends real MIDI bytes. Thirteen checks passed with no page errors, covering:
    - the device list, including plugging in and unplugging devices
    - middle C read as C4, black keys, and the A0 and C8 extremes
    - note-off, and note-on with velocity 0
    - notes on any channel, with sustain pedal messages ignored
    - C–E–G named CM and A–C–E named Am

The spike page (`#/spike`) is temporary and is removed in Phase 2.

## 2026-10-21 — Correction to SPEC.md: E Dorian's vi chord is diminished

SPEC.md section 4 said "in E Dorian, A is IV and C♯m is vi". E Dorian is E F♯ G A B C♯ D, so the triad on its 6th degree is C♯–E–G, a diminished chord: vi°, not vi. SPEC.md and the music-conventions skill now read "C♯° is vi°". The rule the example illustrates (modal numerals count from the modal tonic) is unchanged.

Why: the Phase 0 gate review found it, and David agreed to correct it; accuracy comes first. Phase 1's diatonic-chord fixtures must record vi° for Dorian explicitly.

## 2026-10-21 — Correction to SPEC.md: tenor range is C3–A4

SPEC.md sections 7.3 and 11 gave the default tenor melody range as A2–A4. That sits a third low for a tenor and closer to a baritone. David chose to keep the tenor preset and correct its range to C3–A4.

Why: the preset's name should match its range, and accuracy comes first.

## 2026-10-21 — Scale spelling: one letter per degree, modes as rotations

The core scale dictionary (`src/theory/scale-data.ts`) is our own data, with a hand-written golden fixture (`tests/fixtures/scales.ts`). Seven-note scales spell one note per letter, so every mode is an exact rotation of its parent and every key's chords stack in clean thirds (Phase 1 task 3). This means C altered is C D♭ E♭ F♭ G♭ A♭ B♭ (mode 7 of D♭ melodic minor), not tonal's chord-tone spelling C D♭ D♯ E F♯ A♭ B♭. Other spellings follow tonal: whole-tone C D E F♯ G♯ A♯, blues C E♭ F G♭ G B♭, diminished C D E♭ F G♭ A♭ A B (whole-half) and C D♭ E♭ E F♯ G A B♭ (half-whole). Melodic minor is the ascending (jazz) form.

The rest of tonal's dictionary (about 60 scales, such as Hirajoshi and the Messiaen modes) sits behind the same interface with tonal's spellings, leaving out any scale whose pitches the core already covers. A mode records its parent and degree, so a key can find the parent scale whose signature it shows (E Dorian → D major).

Why: the plan lists the scales but not their spelling; one letter per degree is what makes modal numerals and diatonic chords spell correctly, and David can flag any spelling in the Phase 1 audit table.

## 2026-10-21 — Diatonic chords: naming extended chords, and which scales stack in thirds

Phase 1 task 3 builds each degree's chords from the scale's own notes, so they keep the key's spelling (F♭maj7 in A♭ minor, A♯7 in D♯ harmonic minor). Three choices the plan didn't settle:

- **Extended chords** are named from their 7th chord. The number is the highest unaltered extension and altered ones follow it: in C major, Fmaj13♯11, G13, Em11♭9♭13 and Bm11♭5♭9♭13; in A harmonic minor, E11♭9♭13. Every stacked tone is kept, so Cmaj13 includes the 11th (F).
- **Sus, add and 6th chords** (sus2, sus4, 7sus4, add9, add11, 6) appear only on degrees where the scale's notes make a dictionary chord of that shape: C major has Csus4 but no Fsus4, and Dm6 but no Em6. The 7sus4 row takes a major or a minor 7th, as David asked, so C major has Cmaj7sus4 as well as D7sus4. Task 6 should also check that a name such as Bdim11♭9 (a dim7 with ♭9 and 11, from harmonic major) can't be misread.
- **Which scales stack in thirds:** seven-note scales spelled one letter per degree whose every triad and 7th is a standard chord. That is major, harmonic and melodic minor and all 21 of their modes, plus harmonic major and Lydian diminished from tonal's wider dictionary. Scales such as Hungarian minor, whose stacked "thirds" include diminished 3rds, and every scale that isn't seven notes, use task 4's policy instead.

Chord qualities are stored as lead-sheet symbols in ASCII ('m7b5', 'maj13#11'), with 'M' for a plain major triad; the jazz display style comes with the parser in task 6.

Why: these are the conventions a lead sheet uses, they name every chord the core scales produce, and David can flag any name in the Phase 1 audit table.

## 2026-10-21 — Chords for scales that don't stack in thirds

Phase 1 task 4: a scale that doesn't stack in thirds (pentatonics, blues, whole-tone, diminished, bebop, Hungarian minor and the rest) shows every dictionary chord whose notes sit in the scale. David chose to match by pitch, not by written spelling: a chord counts if every note's pitch is in the scale, and its notes are spelled from its root so the name matches them. Roots are the scale's own notes, spelled as the scale spells them.

So C whole-tone has an augmented and a 7♯5 chord on every note (E7♯5 is E G♯ B♯ D, though the scale writes C); the half-whole diminished scale has dim7 on every note and major, minor, 7th and 6th chords on every other one; C Hungarian minor has A♭m spelled A♭ C♭ E♭ though the scale writes B. Matching by spelling would have given cleaner names but dropped chords from symmetrical scales (C whole-tone would only have C and D augmented).

The "dictionary" is the chord-quality list in `src/theory/chord-data.ts`. When task 6 widens it (power chords, 6/9 and altered dominants), these scales gain those chords with no further code. The function works on any scale, and for scales that stack in thirds it finds every diatonic triad, 7th, sus, add and 6th chord too.

Why: the plan didn't say whether "sit in the scale" means pitch or spelling; pitch keeps the symmetrical scales' chords, which are what those scales are used for.

## 2026-10-21 — Roman numerals: borrowed sources, secondary chords and inversions

Phase 1 task 5 (`src/theory/numeral.ts`, golden fixture `tests/fixtures/numerals.ts`). The plan and SPEC 4 set the numeral conventions; these choices they didn't settle:

- **Reading order:** a chord is diatonic if its notes are in the key, as spelled; otherwise secondary, then borrowed, otherwise chromatic. These match SPEC 6.2's categories.
- **Secondary chords** tonicise a major or minor diatonic triad other than the tonic: a major triad or dominant chord a 5th above it (V/vi, V7/V), or a dim, dim7 or m7♭5 chord a semitone below it (vii°7/vi). A plain major triad on the tonic reads as I, but C7 in C is V7/IV. ♭VII is never a target, so A in E minor is the Dorian IV, not V/♭VII. Secondaries of borrowed chords (E♭7 as V7/♭VI in C) wait for Phase 4.
- **Borrowed source (David's choice):** the parallel mode that changes the fewest notes of the key, with the other sources listed after it. Harmonic and melodic minor count as sources for minor keys, or when no major mode holds the chord. In C major, B♭ is borrowed from C Mixolydian, Fm and A♭ from C Aeolian, E♭ from C Dorian and D♭ from C Phrygian. In E minor, B7 is borrowed from E harmonic minor and A from E Dorian. Ties go in this order: major, Aeolian, Mixolydian, Dorian, Lydian, Phrygian, Locrian, harmonic minor, melodic minor. One exception, also David's choice: a chord on the tonic comes from the parallel major or minor first when that holds it, so E in E minor (a Picardy third) is borrowed from E major, not E Mixolydian, and Cm in C from C Aeolian.
- **Marks (David's choice for 3rd-less chords):** sus chords, and power chords when task 6 adds them, take the case of the key's own chord on their degree: ii7sus4 and iisus4 in C, vsus4 in C minor, Vsus4 in C major. On a degree with no chord in the key they are upper case, as SPEC 4 writes ♭VI5. Extensions follow the numeral as in the chord symbol: V13, IVmaj13♯11, viiø11♭9♭13, ♭III+maj7.
- **Inversions:** figures for triads and 7th chords, with the 7 absorbed: I⁶, I⁶₄, V⁶₅, V⁴₃, V⁴₂, IVmaj⁶₅, viiø⁶₅, V⁶₅/vi. Other chords, and the slash setting, name the chord tone in the bass: V7/3, Isus4/5, V9/3, (V7/vi)/3.
- **Bass outside the chord (David's choice):** the bass's degree in the key, IV (bass 5) for F/G in C. The bass counts towards the reading, so F/F♯ in C is chromatic, and C/B♭ is I (bass ♭7), borrowed from C Mixolydian.
- **Added 6ths:** Dm6 in C is ii6, which differs from the first inversion ii⁶ only by the superscript; plain-text export (Phase 10) must keep the two apart.
- **Augmented dominants** count as secondaries: E7♯5 in C is V+7/vi.

Why: these are the readings a rock or pop musician would give, and the borrowed rule picks the smallest change of colour. David can flag any numeral in the Phase 1 audit table.

## 2026-10-21 — Chord symbols: the parser, the namer and the wider dictionary

Phase 1 task 6 (`src/theory/chord-symbol.ts`, golden fixture `tests/fixtures/chord-symbols.ts`). SPEC 4 sets the two display styles and the ranking principle; these choices it didn't settle:

- **Wider dictionary:** power chords (C5), 7♭5, 6/9, m6/9 and 9sus4 join the dictionary, and altered dominants (C7♭9, C7♯9, C7♯11, C7♭13, C7♯5♭9 and so on) come from the extended-chord names. The namer knows 187 qualities: every 7th chord with natural or altered 9ths, 11ths and 13ths, minus names that double a pitch (7♯5♭13). Power chord numerals take the case of the key's chord on their degree, as already decided: E5 C5 D5 A5 in E minor reads i5 ♭VI5 ♭VII5 iv5. A 7♭5 inversion uses the slash form (V7♭5/3), not figures.
- **Scales that don't stack in thirds gain the new chords (David's choice).** The task 4 fixture now also lists, in order after the existing chords:
  - C major pentatonic: C5 and C6/9 on C, D5 and D9sus4 on D, G5, A5. A minor pentatonic gets the same chords.
  - C minor blues: C5; E♭5, E♭6/9 and E♭m6/9; F5 and F9sus4; B♭5.
  - C whole-tone: a 7♭5 on every note.
  - C half-whole diminished: a power chord and a 7♭5 on C, E♭, F♯ and A.
  - C Hungarian minor: C5, D7♭5, G5, A♭5 and A♭7♭5, B5.
- **An alteration adds only its own note:** C7♯11 is C E G B♭ F♯, with no 9th, and C7♭9 has no 11th. A natural extension still keeps the ones below it (C13 has its 9th and 11th, as decided in task 3). Every chord the diatonic stacks name keeps its notes.
- **The parser** reads both styles always: CM7, C△7, C△, Cma7, C-7, C–7, Cmin7, Cø, Cø9, C°7, Co7, C+, C+7, C7+5, C7-9, Cm(maj7), C–△7, C69, Csus, C7(♭9,♯11) and so on, in any order of alterations. A slash with a note after it is a bass (C/E); 6/9 is not. The jazz display style writes C–, C°, C+, C△7, C–7, Cø7, C°7, C–△7, C+△7, C+7, C△13♯11, Cø9.
- **The namer's ranking**, after fit with the key (diatonic, then secondary or borrowed, then chromatic):
  1. fewest notes respelled
  2. the lowest note as root, then as another chord tone, then a bass outside the chord
  3. fewest notes left out

  So C E G A is C6 then Am7/C, and Cdim7 lists Cdim7, E♭dim7/C, Adim7/C and G♭dim7/C. A root with a double accidental is respelled (B𝄫 reads as A). The bass keeps the spelling given (A♭ C E in A minor is Caug/A♭), but key fit reads it as the chord spells it, so Caug/A♭ counts as III+.

- **Left-out notes (David's choice):**
  - The 5th can go from any chord of four or more notes, unless it has a ♯11 or ♭13, which would then sound as a ♭5 or ♯5.
  - The 9th can go from 11th and 13th chords, and the 11th from 13th chords.
  - The 3rd, the 7th and altered notes always stay.

  Examples: C E B♭ is C7, C B♭ E A is C13, and E A D G B E is Em11. Each name lists the notes it leaves out (`omitted`). David asked for the instrument views to show these as notes that belong to the chord but can be left out; that is UI work for Phase 2 (keyboard) and Phase 3 (fretboard shapes).

- **Names left out:** no name puts a 9th, 11th or 13th in the bass (Fadd9/G is F/G; Em7♭5♭13/C is C9). A chord over a bass outside it (F/G) is only offered when no complete name has a chord tone in the bass, so C E G B♭ is C7, not also Edim/C.

Why: these follow SPEC 4's rule that the primary name fits the key and keeps the lowest note as root, and they give the names a guitarist would write for common voicings. David can flag any name in the Phase 1 audit table.

## 2026-10-21 — Inversions

Phase 1 task 7 (`src/theory/inversion.ts`, golden fixture `tests/fixtures/inversions.ts`). The plan says only "inversions for any chord"; these choices it didn't settle:

- **Which notes invert:** a chord inverts on its root, 3rd (or the 2nd or 4th of a sus chord), 5th, and 6th or 7th, in that order. A 9th, 11th or 13th in the bass makes a slash chord, not an inversion, as the namer already decided (Fadd9/G is F/G). So C has three positions, G7 and G13 four (G13/F is the third inversion), C5 two (C5/G), and Cadd9 three.
- **Spelling:** the bass keeps the chord's own spelling: B♭dim7 in third inversion is B♭dim7/A𝄫, E7♯5 in second inversion is E7♯5/B♯.
- **Recognising an inversion:** a slash chord whose bass matches a chord tone by pitch is that inversion, as chord symbols already read it (Caug/A♭ is a second inversion). A bass outside the chord, or on a 9th, 11th or 13th, is a slash chord with no inversion number.
- **Close-position voicing:** each inversion can be voiced with octaves for playback and the keyboard view: the bass at the octave asked for, the other chord tones each the next one up, then any 9th, 11th or 13th above them. C/E from octave 4 is E4 G4 C5; G13/B from octave 3 is B3 D4 F4 G4 A4 C5 E5. A slash chord puts its bass under the chord in root position: F/G from octave 2 is G2 F3 A3 C4. Phase 5's voicing lenses will offer other spacings.
- **Numerals** for inversions were settled in task 5 (I⁶, V⁶₅, V7/3); the tests now check them against every inversion this module produces.

Why: these match the conventions already in the core and give Phase 2 a ready voicing to play and Phase 3 a bass note to filter fingerings by. David can flag any of them in the Phase 1 audit table.

## 2026-10-21 — The Phase 1 audit table

Phase 1's "Your test" (`src/audit/`, at `#/audit` on the published app). The plan asks for "a table of every key's scales and chords"; these choices it didn't settle:

- **A page in the app, not a document:** the table is built live from the theory core, so it can never drift from what the code does, and David checks it on the published app as he does everything else. It shows one key in full (scale, degrees, every kind of stacked chord with its numeral, or every chord in the scale for scales that don't stack in thirds), any chord's names, numeral line and inversions, and every key of the chosen scale side by side.
- **Flags:** David flags anything wrong on the page; flags stay in his browser and copy out as text to paste into the next session.
- **Key signatures:** a new core function, `keySignature`, gives the parent scale's signature (SPEC 4). Harmonic and melodic minor and their modes show the natural minor's signature, with raised notes as accidentals (D♯ harmonic minor: 6 sharps, C𝄪 written in). Scales that aren't modes (pentatonics, blues, whole-tone, bebop and the wider dictionary) have no signature of their own.
- **"Every key":** a mode is listed on the 15 tonics whose parent key has a real signature (C♭ to C♯ for major, A♭ to A♯ for minor); a scale that isn't a mode on the 18 tonics of the 30 signatures. The single-key view accepts any of the 21 tonics with one sharp or flat.

Why: the audit is David's check that the core is musically right before Phases 2 onwards build on it. The page is temporary in the same way as the spike: Phase 2's key explorer may absorb or replace it.

## 2026-10-21 — Phase 1 audit passed

David went through the audit table on the published app (`#/audit`) and found nothing wrong, so Phase 1's "Your test" is ticked. The audit page stays until Phase 2's key explorer replaces it. Phase 1's gate still needs the theory-reviewer check and the release tag.

## 2026-10-21 — Phase 1 gate passed

The theory-reviewer checked all of Phase 1 (`v0.0-setup` to `d375b0c`) against SPEC 4 and 13 and found nothing blocking. It confirmed each exit criterion with evidence: all 30 key signatures spell correctly, the diatonic qualities are right for every scale and mode, 3,927 chord symbols round-trip (at least 200 were needed), and the core imports only `tonal`. 910 tests, lint and typecheck all pass, and no golden fixture was changed to make a test pass. Phase 1 is released as `v0.1-theory-core`, tagged on `main` once this record is merged.

- **Power-chord numerals:** SPEC 4 and the music-conventions skill still said power-chord numerals "show the root only". They now match David's recorded choice: the case of the key's chord on that degree (i5 in E minor), upper case where the key has none (♭VI5).
- **Open questions for David (not blocking):**
  - In a minor key, F♯7 in E minor reads V7/v, because minor keys are read as natural minor. Most charts write V7/V, because the chord usually resolves to a major B. This should be settled before Phase 4's engine relies on it.
  - SPEC 3 says the sketch data model (sections, chord events) comes "from Phase 1", but no Phase 1 task built it. It will be built when Phase 2 or 4 first needs it.
  - C2, Cadd2, C7alt and C7no5 don't parse yet. C2 and Cadd2 are common in guitar charts and could join the dictionary later.
