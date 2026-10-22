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

## 2026-10-21 — Power and sus chord numerals in pentatonic and blues scales

David's choice: E5 in E minor pentatonic is i5, as it is in E minor. Before this, a 3rd-less chord (a power or sus chord) in a scale that doesn't stack in thirds always came out upper case (I5), because the "key's own chord on its degree" rule only looked at seven-note scales. Now the scale's own triads on that root decide:

- Lower case when every triad there is minor or diminished: i5 and isus4 in E minor pentatonic, i5 in E blues (Em and E°), vi5 for F♯ in A major pentatonic.
- Upper case when there is no triad on the root (IV5 for A in E minor pentatonic) or when there are both a major and a minor one (I5 for C in C major blues, which holds C and Cm).

## 2026-10-21 — The key and scale picker

Phase 2 task 1 (`src/theory/key.ts`, `src/workspace/`, golden fixture `tests/fixtures/key-picker.ts`). SPEC 4 sets the picker's rules (common spellings, both F♯ and G♭ major, an enharmonic swap, all 30 signatures reachable); these choices it didn't settle:

- **Which tonics are listed:** the twelve pitches from C to B. A natural tonic is always the one listed. On a black key, the spelling with fewer sharps and flats in its notes wins, and both are listed on a tie. So major lists C D♭ D E♭ E F F♯ G♭ G A♭ A B♭ B, minor lists C C♯ D D♯ E♭ E F F♯ G G♯ A B♭ B, and every other scale follows the same rule (G♯ and A♭ Dorian are both listed).
- **The swap** goes to the other spelling with one sharp or flat at most, but only to a key people write in: a key signature of seven sharps or flats at most, or for a scale with no signature (pentatonics, blues), seven at most in its notes and no double sharps or flats. D♭ major swaps to C♯, B to C♭, B♭ minor to A♯ minor, E♭ melodic minor to D♯; C, E and E♭ major have no swap, nor has C blues (B♯ blues needs F𝄪). Major and minor together reach exactly the 30 key signatures.
- **Changing scale keeps the spelling** where the new scale can use it (C♯ major to C♯ Dorian), and otherwise moves to the listed spelling (D♭ major to C♯ minor, since D♭ minor needs B𝄫).
- **Scale list:** twelve common scales first (major, the three minors, the other major modes, both pentatonics and blues); "More…" adds every other scale by family. Scales are data: the common list sits in `scale-data.ts`.
- **Interval pattern:** each degree shows its interval from the tonic (P1 M2 m3…), and the steps between neighbouring notes use British tones and semitones: T T S T T T S for major, T+S for an augmented 2nd, 2T for a major 3rd gap.
- **Degree names** follow spelling, like the degree labels: tonic, supertonic, mediant, subdominant, dominant, submediant; a major 7th is the leading note and a minor 7th the subtonic. The 3rd and 6th keep their names whether major or minor. Any other alteration is named: ♭2 is the flattened supertonic, ♯4 the sharpened subdominant, ♭5 the flattened dominant.
- **The workspace is now the home page.** The key picker sits in its header and the scale view in what will become the Explore panel (SPEC 2). The last key chosen is remembered in the browser. The audit table and spike stay, linked from the footer.

Why: these give the spellings a guitarist or pianist would reach for while keeping every real key signature one tap away. David can flag any spelling or name when he tries the picker.

## 2026-10-22 — The diatonic chord rows

Phase 2 task 2 (`src/workspace/chord-rows.ts`, `src/audio/`, `playbackVoicing` in `src/theory/inversion.ts`, golden fixture `tests/fixtures/playback.ts`). The plan says "rows of diatonic triads, 7ths and extended chords; click any chord to hear it"; these choices it didn't settle:

- **Rows:** one row per kind of chord, one column per degree, each chord with its numeral. Triads, 7ths, 9ths, 11ths and 13ths show first; sus2, sus4, 7sus4, add9, add11 and 6ths sit behind "More chords" (SPEC 2: common items first). A gap (—) marks a degree where that shape isn't a chord in the key, as in the audit table.
- **Scales that don't stack in thirds** (pentatonics, blues, whole-tone, diminished, bebop) show every chord in the scale, listed under its degree, as decided for Phase 1 task 4.
- **Clicking a chord** plays it and makes it the current chord (SPEC 2). A line under the rows shows its numeral reading ("V7, diatonic in C major") and notes. The current chord stays when the key changes, so its numeral is reread in the new key.
- **What a click plays:** a block chord in close position, with the bass between F3 and E4 so every chord sits around middle C: C is C4 E4 G4, F is F3 A3 C4, G7 is G3 B3 D4 F4. Extended chords stack their 9th, 11th and 13th above.
- **Sound:** a plain synth for now. Task 4 brings the piano and clean-guitar sounds and the guitar strum (SPEC 5).

Why: this puts every chord of the key one tap away. The voicing keeps chords in the same register, so they can be compared by ear. David can flag anything that sounds or reads wrong.

## 2026-10-22 — The keyboard and fretboard views

Phase 2 task 3 (`src/instruments/`, `src/workspace/InstrumentView.tsx`, `noteAtMidi` in `src/theory/note.ts`). SPEC 5 sets the layouts (fretboard nut on the left with the low string at the bottom; keyboard C2–C6 on a laptop, two octaves with an octave scroll on a phone); these choices it didn't settle:

- **Marks:** scale notes are blue dots, the root is red, and tones of the current chord get an orange ring. A chord tone outside the scale (G♯ of E7 in C major) shows as a grey dot with the ring. Each dot is labelled with the note name or degree, as the toggle says. Spelling follows the key (C♭ in E♭ minor, never B), and a chord tone outside the scale takes the chord's spelling.
- **Clicking** a marked note plays it. Unmarked keys and frets are silent for now. MIDI input in task 6 is where unmarked notes start to matter.
- **Fretboard:** standard tuning, frets 0–15 (SPEC 5's default), the open strings in a column left of the nut, and position dots under frets 3, 5, 7, 9 and 15, with two dots at 12. It scrolls sideways on a phone. The other tunings come in task 5, and the left-handed mirror (SPEC 11) with the other settings later.
- **Phone keyboard:** two octaves, starting at C3–C5, with Lower and Higher buttons that step an octave within C2–C6.
- **Exit criteria:** a test walks every scale on every tonic the picker can reach. On every key from C2 to C6 and every fret 0–15 of standard tuning, it checks that exactly the scale's pitches are marked, spelled as Phase 1 spells the scale. It also checks that the note each mark plays has the MIDI number of the key or fret it sits on. That ticks Phase 2's first two exit criteria.

Why: the colours keep scale, root and chord apart at a glance, on a phone as well. Checking every key and scale ties both views to the Phase 1 core.

## 2026-10-22 — Layout before Phase 4, visual design last (David's choice)

Phase 2 gains a seventh task, after MIDI input and before the gate: a **workspace layout pass** that arranges the screen as SPEC 2 sketches it. The header holds the key picker. The instrument view sits beside a side panel whose Explore tab holds the scale and chord rows, and on a phone the panel stacks underneath. Until then, the pieces stay in one column as they are built.

The **visual design** (colours, type, spacing, the dark and light themes) waits until the features are all working, near the end of the plan.

Why: where things sit shapes how Phase 4's progression strip and suggestion panel get built, so the layout should be in place before them. Restyling the look while features keep changing would be wasted work.

## 2026-10-22 — Chord-tone colour and chord boxes (David's choice)

- **Chord tones are filled orange** on the keyboard and fretboard, not ringed, so the current chord stands out. The key's root always stays plain red, even when it is in the chord.
- **Chord boxes join Phase 3** as task 8. The current chord's shape appears as a small vertical chord box to the right of the full neck, with ◀ ▶ arrows to step through its shapes, positions and inversions, and the shape on show is also marked on the neck. The fingering search, scoring and filters of Phase 3 tasks 1–4 supply the shapes; SPEC 5 already set the box style (nut at the top, low string on the left, fret dots only).

Why: David's request after trying the fretboard view. The boxes need Phase 3's fingering search, so they arrive with it rather than in Phase 2.

## 2026-10-22 — Chord-tone colours join Phase 3 (David's choice)

Phase 3 gains task 9, built alongside the chord boxes (task 8) so the two share one design. A third label setting, **Chord tones**, joins Note names and Degrees:

- **Five colours at most:** root, 3rd, 5th and 7th get one colour each. The 9th, 11th, 13th and altered notes (♭5, ♯9 and so on) share a fifth, so a 13th chord stays readable.
- **Labels as well as colours:** each dot shows its interval (R, ♭3, 5, ♭7, 9), so tones that share a colour can still be told apart, and the view works for anyone who finds colours hard to tell apart.
- **Everything else fades:** the rest of the scale turns light grey, and the key's root is marked only when it's in the chord.
- **No chord selected:** the views show the usual scale colours.
- **Chord boxes** use the same colours, so the bass note's colour shows the inversion.

Why: seeing where each chord tone sits helps with moving shapes around the neck, telling inversions apart and knowing which notes can be left out. Building it with the chord boxes keeps the two consistent. The colours themselves are Claude's to pick unless David names them.

## 2026-10-22 — Piano and guitar playback

Phase 2 task 4 (`src/audio/`, samples in `public/samples/`). SPEC 5 sets block chords on the keyboard and a quick low-to-high strum, about 15 ms per string, on the guitar; these choices it didn't settle:

- **Recorded samples, not synths:**
  - Piano: the Salamander Grand Piano V3 (a Yamaha C5) by Alexander Holm, one note every minor third from A1 to C7.
  - Clean guitar: the clean electric guitar from Nicholas Brosowsky's tonejs-instruments, E2 to C6.

  Both are CC BY 3.0, credited in `public/samples/CREDITS.md`. Tone.js fills in the notes between samples by repitching the nearest one. That's about 3 MB in all, kept in the repo so the app needs no other website and can work offline later (Phase 10). Each sound loads the first time it plays, so the very first chord may take a moment.

- **Which sound plays follows the instrument view:** with Keyboard showing, chords and notes play on piano as block chords. With Guitar showing, chords strum and single notes pluck on the guitar.
- **Guitar chord notes, for now:** the strum uses the same voicing as the piano (bass between F3 and E4). Phase 3 replaces it with the notes of the shape on screen, as SPEC 5 says.
- **The other sounds** SPEC 5 lists (distorted guitar, bass, pad) arrive with the phases that need them.

Why: recorded instruments sound far closer to the real thing than synths, and tying the sound to the view means you hear the instrument you are looking at.

## 2026-10-22 — Tuning presets, a 7-string switch, and piano for everything

Phase 2 task 5 (`src/instruments/tunings.ts`, golden fixture `tests/fixtures/tunings.ts`), with two changes David asked for:

- **Presets:** Standard (E A D G B E), Drop D (D A D G B E) and DADGAD, chosen from a Tuning list in the guitar view. Tunings are data, so adding one is a data edit.
- **7-string is a switch, not a preset (David's choice):** 6-string / 7-string sits beside the tuning list. The 7-string adds a low B (B1) below whichever tuning is chosen, so Standard becomes 7-string B standard, the preset the plan names. Drop D on 7 strings is B D A D G B E. David can ask for the 7th string to follow the preset instead (A for Drop D, say).
- **String names:** each string's open note is shown to the left of the nut, so a non-standard tuning reads at a glance.
- **Piano for everything (David's choice, changing SPEC 5):** David prefers the piano samples, so the guitar view plays piano too. Chords there are still strummed low to high, about 15 ms apart, as SPEC 5 says; the keyboard view plays block chords. The clean-guitar samples were removed (they can come back from git history). The distorted guitar, bass and pad that SPEC 5 lists are left for the phases that need them, to be revisited then.
- **Exit criterion:** a test walks every key and scale through every tuning, 6- and 7-string, and checks that exactly the scale's pitches are marked and each plays its fret's pitch. That ticks "Changing tuning moves the fretboard highlights correctly".

Why: a 7-string is a different guitar, not another tuning of the same one, so a switch fits better than a fifth preset. The piano was David's ear's choice.

## 2026-10-22 — More tunings, and the 7th string a 4th below

David asked for more popular tunings. The list now has 15, grouped:

- **Standard and lowered:** Standard, E♭ standard, D standard, C standard.
- **Drop:** Drop D, Double drop D, Drop C♯, Drop C, Drop B.
- **Open and modal:** DADGAD, Open G, Open D, Open E, Open A, Open C.

Notes are spelled as guitarists name the strings (E♭ standard, not D♯).

**The 7-string switch now adds a string a perfect 4th below the lowest**, replacing the fixed low B decided earlier today. A fixed B would sit on top of Drop B's lowest string and a semitone under Drop C's. A 4th below keeps the guitar's own pattern: Standard still becomes 7-string B standard, E♭ standard gets a low B♭, D standard a low A, and Drop D a low A (A D A D G B E). The tunings fixture's Drop D 7-string entry changed to match. David can ask for a different rule.

## 2026-10-22 — MIDI input

Phase 2 task 6 (`src/midi/`, `spellPitches` in `src/theory/spell.ts`, golden fixture `tests/fixtures/played-notes.ts`). SPEC 5 sets what MIDI does; these choices it didn't settle:

- **Connecting:** a "Connect MIDI keyboard" button, because Chrome asks permission for MIDI. Once allowed, the app connects by itself on later visits. In browsers without Web MIDI (Safari, Firefox on some systems) the panel says to use Chrome or Edge.
- **Spelling what you play:** MIDI sends only pitch numbers, so the key spells them. Scale notes take the scale's spelling. Other notes take whichever spelling makes the chord read best in the key: a diatonic, borrowed or secondary reading beats a chromatic one, then fewer notes spelled differently from the chord's own spelling, then fewer sharps and flats. So in C major, B♭ D F is B♭ (♭VII, borrowed from C Mixolydian), A♭ C E♭ is A♭ (♭VI), E G♯ B D is E7 (V7/vi) and G♯ B D F is G♯dim7. A lone note outside the scale follows the key signature: C♯ in C major, G♭ in F major.
- **Naming:** the chord's best name for the key comes first, with its reading ("I6, diatonic in C major"), and every other name underneath with its numeral, as the namer already ranks them (C E G A is C6, then Am7/C). A name that leaves out a note says so ("no 5th").
- **On the instruments:** notes being played turn green at their exact pitch: one key on the keyboard, every fret that sounds that pitch on the guitar. Green takes priority over the other colours while you hold the note.
- **Sustain pedal:** with the pedal down, released notes stay held until it comes up, so a chord stays named after you let go (SPEC 13 edge case, tested). Record chords, which commits chords to the progression, is Phase 4's, as the strip arrives then.
- **Scrolling:** the keyboard view moves an octave at a time to bring notes you play outside it into view: the two-octave phone view, and the four-octave laptop view for notes outside C2–C6.
- **No sound from the app for MIDI notes:** your keyboard makes its own.
- **The Phase 0 spike page is gone**, as its own note said it would be once real MIDI input arrived. Its MIDI parser moved into `src/midi/` with sustain-pedal support.
- **Exit criterion not yet ticked:** "Notes and chords played on your keyboard appear and are named correctly, with no noticeable lag" needs David's real keyboard. In a test browser with a simulated keyboard, the screen updates within two frames (about 30 ms) of the notes arriving.

## 2026-10-22 — MIDI confirmed on David's keyboard

David tried MIDI input with his own keyboard: notes and chords appear, are named correctly and show no noticeable lag. That ticks the Phase 2 exit criterion. He noticed a short delay on the very first chord, which was the piano samples loading; see the next entry.

## 2026-10-22 — The workspace layout

Phase 2 task 7 (`src/workspace/Workspace.tsx`, `SidePanel.tsx`), arranging the screen as SPEC 2 sketches it. Layout only; the visual design waits, as decided.

- **Header:** the app name and the key picker. The sketch, section and style controls join it in Phase 4.
- **Stage:** the instrument view with its toolbar and the MIDI panel. Phase 4's progression strip will sit above it.
- **Side panel:** tabs, one per tool. Only Explore exists so far, holding the scale view and the chord rows; Shapes, Suggest, Voice, Lines, Melody and Analyse appear with their phases rather than as empty tabs.
- **Laptop (1024 px wide and up):** the stage takes the width and the side panel sits on the right, 22–28rem wide. The panel scrolls on its own and stays in place as the page scrolls. The page now uses the full screen width, up to 110rem.
- **Phone and narrow windows:** the side panel is a sheet along the bottom (SPEC 2), open by default at up to 42% of the screen height. Hide and Show collapse it to its tab bar, and the page leaves room so nothing hides behind it. On a phone the header and toolbar are tighter and the app name is hidden, so the instrument fits above the sheet.
- **First chord without the wait:** the piano samples now download into the browser's cache once the page is idle. The first press anywhere on the page starts decoding them, so they are ready before the first chord. No sound plays until you ask for one.
- **"Usable on your phone's screen"** stays unticked until David has tried the layout on his phone.

## 2026-10-22 — Side panel under the instrument (David's choice)

After trying the side-by-side layout, David preferred the side panel **under the instrument view at full width**: beside it, the chord rows were too narrow and needed scrolling sideways. On laptops and tablets the page now runs header, instrument view, MIDI panel, then the side panel's tabs (Explore) at full width. On phones (under 40rem) the side panel stays a sheet along the bottom with Hide and Show, as before. This changes SPEC 2's sketch, which put the side panel to the right.

## 2026-10-22 — Scale above the instrument, chords below (David's choice)

On laptops and tablets the scale view (notes, degrees, intervals, step pattern) now sits **above** the instrument view, and the chord rows stay **below** it in the Explore tab, so the page reads scale, instrument, chords. On phones the scale stays in the bottom sheet with the chords, because above the keyboard it would push the instrument behind the sheet.

## 2026-10-22 — Phase 2 gate passed

David confirmed the app works well on his phone, which ticks the last exit criterion, and closed the phase. Gate check, done in this session against `v0.1-theory-core`..`main`:

- **Exit criteria**, each with its evidence:
  - Every key and scale shows the right notes on both instruments: a test walks every scale on every tonic the picker reaches, across the keyboard (C2–C6) and every fret of every tuning, against the Phase 1 core.
  - Highlighted notes play the right pitch: the same tests compare MIDI numbers.
  - Changing tuning moves the highlights: the same walk runs on all 15 tunings, 6- and 7-string.
  - MIDI notes and chords are named correctly with no noticeable lag: golden fixture for spelling played notes, and confirmed by David on his keyboard.
  - Usable on a phone: confirmed by David.
- **The core** still imports no UI, audio or DOM code: the core-imports test passes. Phase 2's additions to it are the key picker spellings, degree names, step patterns, the playback voicing, `noteAtMidi` and `spellPitches`, each with golden fixtures.
- **Golden fixtures** changed since Phase 1: `numerals.ts` (David's power-chord choice, recorded 2026-10-21) and `tunings.ts` (the 7-string rule change, recorded above). Neither was changed to make a test pass.
- **All 2,494 tests,** lint, typecheck and build pass.
- **Your test (20 minutes in your own keys):** David closed the phase without a separate list of anything missing. Anything he finds later can still come in as a change.

Phase 2 is released as `v0.2-key-explorer`, tagged on `main` once this record is merged.

## 2026-10-22 — The guitar model, with a capo and a fret range

Phase 3 task 1 (`src/instruments/guitar.ts`, golden fixture `tests/fixtures/capo.ts`). One model of the guitar now drives the fretboard view and will drive the fingering search, so the two always agree.

- **What it holds:** the tuning as spelled open strings, lowest first (the string count is how many there are), the capo's fret, and the fret range. Pitches are worked out from the spelled strings, never stored.
- **Capo:** up to fret 12. Frets are still numbered from the nut (SPEC 5). Frets behind the capo can't be played and are greyed out on the neck; the capo is drawn as a dark bar, and the capo's fret sounds as the open string. The tuning names left of the nut stay the open strings' names; the notes on the neck show what sounds. David can ask for a higher capo limit.
- **Fret range:** frets 0–15 by default, up to 24 (SPEC 5). The guitar view has a Frets list (0–15, 17, 19, 21, 22 or 24) that sets how far the neck runs. The range can also start up the neck (frets 5–9, say) for the search; the open strings stay available then, and the "open strings on or off" filter (task 4) is what turns them off.
- **Golden fixture:** what the open strings sound with a capo, including capo on DADGAD, Open G and 7-string Drop D, covering SPEC 13's "capo with alternate tuning" case at the pitch level. Sounding chord names with a capo arrive with the fingering search.

## 2026-10-22 — The capo's open notes named beside it (David's choice)

With a capo on, the tuning names left of the nut stay as they are, and the fret just before the capo now names the strings' new open notes (capo 3 on standard: G C F A♯ D G, low string at the bottom). They are spelled by the key, each as a lone note is: the scale's spelling where the note is in the scale, otherwise by the key signature, so capo 1 in F major reads F B♭ E♭ A♭ C F. Golden fixture: `capoNames` in `tests/fixtures/capo.ts`.

## 2026-10-22 — Capo notes on the capo's fret (David's choice)

Replaces where the capo's open notes were shown in the entry above. David found them on the fret behind the capo (fret 1 with the capo on 2) and wanted them on the capo's own fret, which is the new open position. That fret now does both jobs: a note there that is in the scale keeps its usual colour (red root, blue scale note, orange chord tone) with a grey ring to mark it as an open note with the capo; a note outside the scale is named in grey. The frets behind the capo are all greyed out again. Spelling is unchanged.

## 2026-10-22 — The fingering search

Phase 3 task 2 (`src/instruments/fingering.ts`, golden fixture `tests/fixtures/fingerings.ts`). The search lists every way to play a chord on the guitar model; ranking by how easy a shape is to play is task 3. Choices the plan and SPEC didn't settle:

- **Which notes:** each string plays a fret that sounds a chord tone, or is muted. Muted strings can be anywhere, inner strings included; task 3 marks those down rather than ruling them out.
- **Which tones can go:** the perfect 5th of any chord with a 3rd or 4th (so a triad can be played as root and 3rd), but never a power chord's 5th, and not when a ♯11 or ♭13 would then sound like a ♭5 or ♯5. As the chord namer already allows, an 11th or 13th chord can leave out its 9th, and a 13th chord its 11th. Task 4's "omit the 5th" filter will turn the 5th off altogether.
- **Bass:** the lowest sounding string plays the chord's bass: the root, the inverted tone (C/E), or the slash bass (F/G).
- **Span:** counted over fretted notes only, so frets 2–5 span 4; open strings, or the capo's fret, don't count. Four frets by default, 3–6 allowed (SPEC 11).
- **Fingers:** a shape can need at most four fingers. A barre across its lowest fret counts as one, and an open string can't sit between the barre's ends, as the barre would fret it. F as 133211 passes; thumb-over shapes aren't counted yet.
- **Capo:** chords are searched by what sounds, as SPEC 5 says: with capo 2, the G shape (542225) comes up for A. The shape names ("A (G shape, capo 2)") come with the CAGED grouping, task 5.
- **Order until task 3:** up the neck from the nut, fuller shapes first at each position.
- **Exit criteria ticked:** every result is checked against these rules, independently of the search, for 42 common chords on standard, drop D, DADGAD with a capo, 7-string and 7-string drop D; the fixture's drop D and 7-string shapes are all found; and every one of those chords takes under 50 ms (most take 1–3 ms). "The textbook shapes you supply appear in the top five" waits for David's 30 shapes and task 3's score.

## 2026-10-22 — The playability score, and Claude's textbook shapes

Phase 3 task 3 (`src/instruments/playability-data.ts`, the scoring in `src/instruments/fingering.ts`, golden fixture `tests/fixtures/textbook-shapes.ts`). Every shape the search finds now gets a score, and shapes are listed easiest first.

- **How it scores:** each shape starts at 100 and loses points for each rule that applies; open strings near the nut add points, so the easiest open chords score just over 100. The rules and their weights are data, so they can be tuned (and later edited in the app) without touching the search:

  | Rule                                                                                    | Points                   |
  | --------------------------------------------------------------------------------------- | ------------------------ |
  | Each finger on the fretboard                                                            | −1                       |
  | Each fret of stretch beyond three (a hand covers three without stretching)              | −10                      |
  | A barre                                                                                 | −1, on top of its finger |
  | Each muted string between sounding ones                                                 | −12                      |
  | Each muted string below the bass                                                        | −1                       |
  | Each muted string above the top note (not for power chords, which damp them on purpose) | −3                       |
  | Each open string, with the hand within four frets of the nut or capo                    | +2                       |
  | Each open string with the hand further up the neck                                      | −2                       |
  | Each fret the hand sits up the neck, from the nut or the capo                           | −1                       |
  | Each chord tone left out (the 5th, or an extended chord's 9th or 11th)                  | −3                       |
  | Each string short of four sounding (three for a power chord)                            | −3                       |

- **Muted strings rank lower (David's choice).** A muted inner string costs the most. A muted string below the bass costs little, because chord books mute low strings to put the root in the bass (x32010).
- **Triads without their 5th stay, ranked lower (David left this to Claude).** They're real shapes, so they're still found, but they lose points for the missing 5th, so the full triad comes first.
- **Textbook shapes written by Claude.** David isn't supplying the 30 textbook shapes the exit criterion asked for, so Claude wrote them: the shape a chord book prints for 30 common open, barre, 7th, suspended and power chords in standard tuning. The weights were tuned until each one ranks in its chord's top five; all 30 do, and 22 rank first. The criterion is ticked on that list. David can swap in his own shapes at any time.
- **What David's play-test should look for:** the plan's test (play the top shapes and flag anything awkward) still stands once the chord boxes (task 8) show them. Anything awkward is a weight to change in `playability-data.ts`.

## 2026-10-22 — Fingering filters

Phase 3 task 4 (`FingeringOptions` in `src/instruments/fingering.ts`). The filters the chord boxes will offer, all off by default. Choices SPEC 5 didn't settle:

- **Inversion:** a number (root position, first, second, third inversion) or "any". By default a chord keeps its own bass, so C/E stays a first inversion. Asking for an inversion replaces a slash chord's bass. Each shape now says which inversion it is, ready for the chord boxes' ◀ ▶ arrows.
- **String set:** any set of strings, not just neighbouring ones, so "low E plus the top three" works. The strings left out are muted.
- **Open strings off:** with a capo, the capo's fret counts as open, so it's off too.
- **Omit the 5th:** leaves out the perfect 5th wherever a shape could already drop it. A power chord keeps its 5th, as do diminished and augmented chords, whose 5th isn't perfect. A 5th asked for in the bass (C/G) stays in the bass and nowhere else. With "any" inversion, no shape has the 5th in the bass. A 5th you asked to leave out costs no points.

## 2026-10-22 — CAGED shapes and shape names

Phase 3 task 5 (`src/instruments/caged.ts`, golden fixture `tests/fixtures/caged.ts`). Shapes can now be grouped by the open chord they're played from, and named as SPEC 5 asks. Choices the plan and SPEC didn't settle:

- **How a shape is recognised:** by where its roots sit. Open C has its roots on the A string's 3rd fret and the B string's 1st, so any fingering with its roots in that pattern, anywhere up the neck, is a C shape. Every fretted note must sit within four frets of the shape's base. When more than one shape fits, the one closest to its open chord, fret by fret, wins. This works for any chord, not just major: Am is an A shape, B7 (x21202) a C shape.
- **Which tunings:** standard, and any tuning with standard's intervals: E♭, D and C standard, and the top six strings of a 7-string. Drop and open tunings have no CAGED shapes, and their shapes are named by the chord alone.
- **Grouping:** C, A, G, E, D, then shapes that fit none, each group easiest first.
- **Names:** the chord as it sounds, then the shape with the chord's quality and any capo: "A (G shape, capo 2)", "Bm (Am shape)", "C7 (A7 shape)". With a capo, shapes are read from the capo, as if it were the nut. SPEC 5's example covers only a major chord; giving the shape the chord's quality (Am shape, not A shape) is Claude's choice, and David can ask for plain letters.

## 2026-10-22 — Keyboard voicings and the hand split

Phase 3 task 6 (`src/theory/voicing.ts`, golden fixture `tests/fixtures/voicings.ts`). Every chord can now be voiced five ways on the keyboard, or split between the hands. Choices the plan and SPEC didn't settle:

- **The five styles,** shown with Cmaj7:
  - Close: C E G B, as tight as the notes go.
  - Open: C G E B, close with every second note up an octave.
  - Drop-2: C G B E, the 2nd note from the top of a close voicing dropped an octave.
  - Drop-3: C B E G, the 3rd note from the top dropped.
  - Spread: C, then G E B, which is open with the bass a further octave down.
- **The bass stays at the bottom.** A drop voicing starts from whichever close position leaves the chord's bass at the bottom once a note is dropped, so Cmaj7/E in drop-2 is E B C G. A bass outside the chord (F/G) sits under the chord's own voicing.
- **Drops are for chords of up to four notes,** as pianists and arrangers use them. A 9th, 11th or 13th chord has no drop voicing, and a power chord has no drop-3. A triad's drop-2 is its open voicing, and its drop-3 drops the bass alone.
- **Register:** each voicing is moved by whole octaves until its notes average closest to middle C. Close C is C4 E4 G4, as when you click a chord; F is F3 A3 C4. A first inversion sits a little lower than the click voicing (C/E is E3 G3 C4, not E4 G4 C5), since this rule centres the whole chord rather than placing the bass.
- **The split (SPEC 5):** the left hand plays the bass at the highest octave below C3. It plays the bass alone by default, or with the chord's 5th, or doubled an octave up. In an inversion it plays the inverted bass alone or doubled, since a 5th above E isn't C major's 5th. The right hand plays the chord in root position, in any of the five styles, around middle C.

## 2026-10-22 — Chord boxes before MIDI-to-shapes (David's choice)

Phase 3 tasks 8 and 9 are done before task 7. Task 7 (play a chord on the MIDI keyboard and jump to its guitar shapes) needs somewhere to show the shapes, and the chord boxes are that place, so building them first avoids a stopgap list that would be thrown away. Task 7 comes next.

## 2026-10-22 — Chord boxes and chord-tone colours

Phase 3 tasks 8 and 9 (`src/workspace/ChordBoxes.tsx`, `src/instruments/chord-box.ts`, `src/instruments/chord-tones.ts`, golden fixture `tests/fixtures/chord-tones.ts`). Choices the plan didn't settle:

- **Chord box:** the shape at the top of the list, easiest first. ◀ ▶ steps through every shape and wraps round at the ends, with "3 of 246" between the arrows.
  - **Heading:** the shape's name, such as "A (G shape, capo 2)".
  - **Underneath:** the frets as written (x32010) and the inversion.
  - **Drawing:** the nut is drawn at the top when the shape fits in the first four frets, or a capo bar with the capo on. Further up the neck, the box starts at the shape's lowest fret, with that fret's number beside it. ○ marks open strings and × muted ones, and each string's fret is written underneath.
  - **On the neck:** the shape on show is ringed.
  - **Sound:** clicking the box strums the shape. Clicking a chord in the chord rows with the guitar showing strums the shape the box will show, as SPEC 5 asks.
- **Filters,** folded away under the box: inversion (as chosen, any, or a numbered inversion), strings (all, top four, top three, middle four, bottom four), stretch (3–6 frets), open strings, and leave out the 5th. A numbered inversion a new chord doesn't have (a triad's 3rd inversion) goes back to "as chosen".
- **Chord-tone colours:** red root, amber 3rd, blue 5th, purple 7th, and teal for every other tone, with the rest of the scale faded grey.
  - A 3rd, 5th or 7th keeps its colour whatever its quality, so the ♭5 of Cm7♭5 is blue.
  - A sus chord's 2nd or 4th, a 6th, and a bass outside the chord take the shared colour. G over F reads as the 9th, but C under D/C reads as the ♭7.
  - Notes being played on the MIDI keyboard stay green.

## 2026-10-22 — Top layout and the keyboard's voicing box (David's choice)

- **Top of the page:** the key name, key signature and step pattern stack on the left, and the scale's degree boxes sit beside them. The boxes are smaller, about the height of those three lines. On a phone the scale stays in the bottom sheet, where the boxes wrap below.
- **Keyboard:** laid out like the guitar view, with a box to the right of the keyboard for the current chord's voicing.
  - **Stepping:** ◀ ▶ step through close, open, drop-2, drop-3, spread and the left/right-hand split (Phase 3 task 6), skipping any a chord can't take.
  - **Drawing:** a small keyboard shows the voicing in chord-tone colours, and the same notes are ringed on the main keyboard. A split lists each hand's notes.
  - **Sound:** clicking the box plays the voicing. Clicking a chord in the chord rows plays the voicing on show. The style stays as you move between chords, and falls back to close for a chord that can't take it.

## 2026-10-22 — From the MIDI keyboard to the chord boxes

Phase 3 task 7 (`src/workspace/last-chord.ts`, the MIDI panel). Choices the plan and SPEC didn't settle:

- **The chord stays after you let go.** You can't click a button while both hands are on the keys, so the MIDI panel keeps showing the last chord you played, marked "Last chord".
  - It keeps the fullest chord of each go: letting the keys up one at a time doesn't swap C for the C5 left under your fingers.
  - A lone note starting the next chord doesn't clear it.
- **One click to the shapes.** "Guitar shapes ▸" beside the chord's name makes it the current chord and switches to the guitar's chord boxes. Each other name under "Also" does the same for its reading, since C6 and Am7/C give different shapes.
- **Follow my playing,** off by default, makes every chord you play the current chord without a click. With the guitar showing, the boxes follow your playing.

## 2026-10-22 — The boxes always show, and the keyboard matches the neck (David)

After trying the published app, David couldn't see the chord boxes, and the keyboard was much larger than the fretboard.

- **Boxes:** they appeared only once a chord was picked. The box beside each instrument now always shows, framed, with a prompt until a chord is clicked or played.
- **Keyboard size:** the keyboard stretched across the whole page. It is now as wide as the 15-fret neck, with its box right beside it, as the box sits beside the neck.

## 2026-10-22 — Shapes button follows the view, and piano filters (David's choice)

- **Shapes button:** the MIDI panel's button goes to the other instrument. On the keyboard it reads "Guitar shapes ▸" and opens the guitar's chord boxes. On the guitar it reads "Piano shapes ▸" and opens the keyboard's voicing box. The names under "Also" do the same.
- **Piano filters,** folded under the keyboard's voicing box like the guitar's:
  - **Inversion:** as chosen, any, or a numbered inversion. With "any", the box steps through each style for each inversion in turn and says which inversion it shows.
  - **Left hand under the split:** bass alone, root and 5th, or an octave (SPEC 5).
  - The guitar's other filters (strings, stretch, open strings) have no piano meaning, so there are none for them.

## 2026-10-22 — Phase 3 gate passed

David closed the phase after trying the chord boxes, voicings and MIDI keyboard ("everything works well"). Gate check, done in this session against `v0.2-key-explorer`..`main`:

- **Exit criteria,** each confirmed by the theory-reviewer with evidence:
  - **Textbook shapes in the top five:** all 30 shapes in Claude's list (David isn't supplying his own, recorded above) are the standard chord-book shapes, checked string by string. All 30 rank in their chord's top five, and 22 rank first. Every shape that outranks one is a valid voicing of the chord.
  - **Every result physically valid:** a checker independent of the search tests every result. It covers one note per string, chord tones only, the right bass, the required tones, the span and the fingers. It runs on 42 chords across standard, drop D, DADGAD with a capo, 7-string and 7-string drop D, at spans 3, 4 and 6.
  - **Drop D and 7-string shapes:** every fixture shape was checked by hand against its tuning, including the capo-on-alternate-tuning case from SPEC 13.
  - **Under 50 ms per chord:** at the default settings every common chord passes on all five guitars, mostly in 1–3 ms. At the widest settings, a 7-string with 24 frets and a stretch of 6, a 13th chord takes about 90 ms. That's still quick to use, and it can be sped up if it ever shows.
- **No musical errors** were found in the six new golden fixtures (shapes, textbook shapes, CAGED shapes, voicings, chord tones, capo) or in the code checked. No earlier golden fixture changed in Phase 3. The theory core still imports no UI, audio or DOM code.
- **All 2,725 tests,** lint, typecheck and build pass.
- **For David to look at when convenient** (none blocks the gate):
  - Five textbook shapes rank 4th or 5th: Bm, Gm, Cm, Fmaj7 and E5. For Bm and Gm the first shape is a lighter voicing (x20402, 310033). If they feel odd, the playability weights can be tuned.
  - With a capo, a note outside the scale is spelled by the key signature, so G major at capo 3 names A♯ where many guitarists would say B♭ (the blue note). This follows the rule recorded earlier; David can ask for B♭.
  - The piano split's "Root and 5th" plays the bass alone in an inversion. That's correct, but the label could say so.
  - The CAGED fixture's opening comment says every chord appears in all five shapes, but only C, A and G do. The data is right; the comment is in a golden fixture, so it's left for David to approve.

Phase 3 is released as `v0.3-fingerings`, tagged on `main` once this record is merged.

## 2026-10-22 — The Suggestion object

Phase 4 task 1 (`src/theory/suggestion.ts`), the shape every engine hands back, as SPEC 12 types it. Choices the plan and SPEC didn't settle:

- **Category:** a chord suggestion's first tag is its category, one of SPEC 6.2's seven (Diatonic, Secondary, Borrowed, Chromatic, Modulation, Rock moves, Pedal/static). It must have exactly one, so no chord suggestion can reach the screen without a category. Later engines (lines, melodies) use their own tags, such as "chord tone" or "passing".
- **Every suggestion is checked when it's made:** a real score, at least one tag and one rule id, and an explanation that isn't blank.
- **Explanations come from templates:** a rule's text has gaps such as `{chord} is {numeral}`, filled for each chord. A gap with nothing to fill it is an error, so a template and its rule can't drift apart.
- **Ties are broken the same way every time:** higher score first, then the category order above, then the chord's spelled name. The same input gives the same ranking whatever order the rules ran in (SPEC 6.1). G♭ and F♯ count as different chords.

## 2026-10-22 — F♯7 in E minor is V7/V (David asked Claude to choose)

This settles the open question from the Phase 1 gate before Phase 4's engine relies on it. In a minor key, a secondary chord aimed at the 5th degree points at V, not v. F♯7 in E minor reads V7/V, and A♯°7 reads vii°7/V.

- **Why:** the app already reads B7 in E minor as V7, borrowed from harmonic minor, so a minor key's dominant is major. A chord that leads to it should be named after the chord it actually goes to, as most charts write it.
- **Only minor keys:** modes keep their own v, so F♯7 in E Dorian stays V7/v. Harmonic and melodic minor already have a major V.
- **The golden fixture changed:** the numerals fixture's F♯7-in-E-minor row went from V7/v to V7/V, with David's go-ahead. Two rows were added: A♯°7 in E minor and F♯7 in E Dorian.

## 2026-10-22 — Next-chord candidate generators

Phase 4 task 2 (`src/theory/next-chord.ts`, rules in `src/theory/next-chord-data.ts`). Given the key and the chords so far, the generators list every chord worth offering next, each a Suggestion with its category, rule id, a neutral score and an explanation. Style profiles (task 3) and the ranker (task 4) will reweight and trim the list; nothing is shown in the app yet. Choices the plan and SPEC didn't settle:

- **Rules are data:** each rule has an id, a category, a neutral 0–5 weight (the style editor's scale) and an explanation template. Diatonic chords are scored by how the previous chord's function flows into theirs (predominant to dominant to tonic scores highest), with iii and vii° marked down as weaker members of their function.
- **What each category offers:**
  - **Diatonic:** the key's triads and V7. After a dominant, vi is offered as a deceptive cadence. After a secondary chord, its target ranks top (E7 then Am). In a minor key the major V and V7 from harmonic minor count as diatonic, as that is the key's usual dominant.
  - **Secondary:** V7 and vii°7 of each major or minor chord of the key except the tonic and ♭VII, kept only where the numeral reads them as secondary (D7 in E minor is the key's own ♭VII7).
  - **Borrowed:** major and minor triads from the parallel modes, credited to the closest source (A♭ in C from C Aeolian). Locrian is left out as too remote.
  - **Chromatic:** tritone substitutes for the dominants of chords on unaltered degrees (I, ii, IV, V and vi in major; i, iv and V in minor), as subs aimed at ♭III or ♭VI read awkwardly (D♭7 to C in E minor is 𝄫VII7), and chromatic mediants of the previous chord: same quality, a 3rd away, one shared note.
  - **Modulation:** one pivot chord into each closely related key (no more than one sharp or flat away), preferring a chord that is ii or IV in the new key. The suggestion carries the new key for SPEC 6.4's prompt.
  - **Rock moves:** ♭VII, ♭VI and ♭III, and power chords on 1, ♭2, ♭3, 4, 5, ♭6 and ♭7 after a power chord.
  - **Pedal/static:** stay on the chord, move the harmony over its bass note (G/C, F/C), or suspend it (Csus4, Csus2).
- **With no chord picked,** only the key's own chords are offered, the tonic first.
- **One suggestion per chord:** where two rules offer the same chord, the higher-scoring reading leads (category order on a tie) and the other's rule id and explanation are kept, the explanation under More. So B♭ in C shows as borrowed from Mixolydian, with the rock ♭VII under More, and a style that favours rock moves can still find it.
- **Scales that don't stack in thirds** (pentatonics, blues) get diatonic, rock, mediant and pedal suggestions only.
- **For the next tasks:** the context's phrase position and overuse (SPEC 6.1) belong to the ranker.
- **New golden fixture:** `tests/fixtures/next-chords.ts`, written by hand, lists chords each case must and must not offer, with their categories and numerals. David may want to check it. The E7 explanation in the existing suggestions fixture is now produced by the engine word for word.

## 2026-10-22 — Passing chords between two chords (David's idea)

David asked for a way to pick two chords and have the app suggest chords to bridge them. This is added to Phase 4 as task 7, with an exit criterion, and as SPEC 6.7.

- **Why Phase 4, after the strip:** it reuses this task's generators, scoring each candidate against the chord after it as well as the chord before. It needs the progression strip (task 5) to pick the two chords, and the ⓘ panel (task 6) to explain them, so it comes last in the phase, before the Phase 4 gate.
- **Not Phase 6:** Phase 6's passing and approach lines are single notes between chords; this is whole chords.

## 2026-10-22 — Style profiles, blending and the style editor

Phase 4 task 3 (`src/theory/style.ts`, built-in weights in `src/theory/styles.json`, editor at `#/styles`). Choices the plan and SPEC didn't settle:

- **A weight per rule:** each style gives every next-chord rule a whole-number weight from 0 to 5 (SPEC 6.6's dots). Borrowed chords now have one rule per source mode, rather than one for all, so a style can favour some sources over others: metal rates Phrygian's ♭II at 5 and pop at 1.
- **How a weight changes a score:** a suggestion's score is its fit in context (how well it follows the previous chord) times its weight out of 5. A 5 keeps a move at full strength and a 0 sends it to the bottom, where the ranker's wildcard can still find it. Without a style, every rule counts in full, as before.
- **The style picks the reading:** where two rules offer the same chord, the style decides which reading leads. A♭ in C shows as a borrowed chord in pop but as a rock move in metal.
- **Blending:** two styles blend rule by rule, with the mix snapped to 25% steps (SPEC 6.6). Each section's blend will be saved with it once sections and the blend control arrive with the strip (task 5). Until then the engine takes the weights directly.
- **Starting weights:** David should tune these in the editor.
  - **Pop:** strong on functional harmony, secondary dominants, the deceptive cadence and suspensions.
  - **Rock:** strong on Mixolydian, ♭VII, ♭III, power chords and static harmony.
  - **Metal:** strong on ♭VI, ♭VII, Phrygian, harmonic minor, chromatic mediants, power chords and pedal points; low on secondary dominants, tritone substitutes and modulation.
- **The style editor:**
  - It lists every rule under its category with five dots per style.
  - Tapping a dot sets the weight; tapping the last filled dot takes one off, so 0 is reachable.
  - Edits save in the browser and are marked •. Reset goes back to the built-in weights.
  - Export as default downloads a `styles.json` written exactly as the built-in file, ready to commit.
  - On a phone, one style shows at a time, with a Pop/Rock/Metal switch.
  - Saved edits are read over the built-in weights, so a rule added later still gets a weight.
- **Section adjustments** (SPEC 3: Chorus favours tonic arrivals, and so on) wait for sections to reach the engine.
- **Exit criterion not yet ticked:** "Switching profile moves the ranking the expected way" passes against the full candidate list. A new golden fixture, `tests/fixtures/style-rankings.ts`, has ten cases, including metal ranking ♭VI and ♭VII above where pop does. It will be ticked once the ranker (task 4) shows the same on its top eight.

## 2026-10-22 — The next-chord ranker and the Suggest tab

Phase 4 task 4 (`src/theory/ranker.ts`, settings in `src/theory/ranker-data.ts`), with a first Suggest tab and the header's style blend control so David can try it. Choices the plan and SPEC didn't settle:

- **Context effects (SPEC 6.1),** each with its own line in the suggestion's context notes:
  - **Overuse:** nothing after one earlier use of a chord, then 0.5 off per further use ("you've used C three times").
  - **Phrase position:** until the beat grid (Phase 6), each chord counts as one bar. Bar 8 favours the key's own tonic chord (+1). Bar 4 favours the tonic or a major V (+0.5).
  - **No tonic yet:** after three chords with no tonic, the tonic gets +0.5.
  - A tonic arrival is the key's own chord on the tonic, or a tonic power chord: C or Cmaj7 in C, never C7 or Cm.
  - Section labels wait for sections.
- **What's shown:** the best first, at most three from any one category, six to eight in all. Past six, only suggestions scoring at least half the top score are added. A move the style weighs at 0 is never shown. Groups appear in the order of their best suggestion.
- **The wildcard:**
  - It comes from the lower-scoring half of the moves not shown, including any the style weighs at 0. So it can come from outside the style (SPEC 6.2).
  - A seed made from the key, the chords and the style picks it, so the same input gives the same wildcard.
  - Another steps through the pool and repeats nothing until it wraps round.
- **New generator rules,** found by the known-progressions test:
  - **Falling-4th step** (rock): ♭VII to IV, IV to I, away from the tonic, as in I–♭VII–IV.
  - **Riff-style return to the tonic** (rock): i–♭II–i, i–♭VI–♭VII–i.
  - Both are weighted in all three styles.
- **Small scoring changes:**
  - Secondary dominants now fit by target: V7/V and V7/vi are the most common and V7/iii the rarest. A leading-note chord fits one less than the dominant to the same target.
  - Power chords on ♭III, ♭VI and ♭VII fit a little better than the other degrees, and ♭II a little worse.
- **New golden fixture:** `tests/fixtures/known-progressions.ts` has ten well-known progressions (I–V–vi–IV, ii–V–I, I–♭VII–IV, i–♭II–i and others). In each, the real next chord is among those shown for the matching style.
- **Exit criteria ticked:**
  - every suggestion carries a category and an explanation
  - the same input and style give the same list and wildcard
  - the style-rankings fixture holds on the shown list
  - the known progressions all pass
- **Suggest tab (ahead of tasks 5 and 6):**
  - It lists the suggestions after the current chord, grouped, with each explanation and context note shown inline. The ⓘ panel (task 6) will tidy this.
  - Tapping a suggestion plays the current chord, then the suggestion, and shows it on the instrument.
  - - makes it the current chord. A pivot asks "Continue in G major from here?" (SPEC 6.4).
  - With no strip yet, only the current chord counts as history, so phrase and overuse effects show once the strip (task 5) keeps the whole progression.
- **Style blend control:** sits in the header. It is remembered in this browser until each section keeps its own.

## 2026-10-22 — Jazz, blues and classical styles; blending optional (David's request)

David asked for a way to turn the style slider off and for jazz, blues and classical styles. The plan had jazz and classical "later"; they arrive now as styles over the existing rules, plus two new rules.

- **The style control:**
  - It picks one style by default.
  - Ticking **Blend** brings back the slider and a second style.
  - **No style** weighs every move at full strength, as the engine did before styles.
- **New styles:** jazz, blues and classical, alongside pop, rock and metal, all tunable on the Style weights page.
  - **Jazz:** favours 7th chords, secondary dominants and tritone substitutes.
  - **Blues:** favours dominant 7ths on I, IV and V, the ♭III and falling-4th steps.
  - **Classical:** favours functional harmony, the deceptive cadence, leading-note 7ths, pivots, suspensions and pedal points, with no rock moves or tritone substitutes.
- **New rules:**
  - **Diatonic 7th chords** (Imaj7, ii7, vi7, and ♭VII7 in a minor key). They fit half a point below their triads, so without a style the plain triads still lead.
  - **Blues dominant 7ths** (I7, IV7, V7). They sit under Rock moves, as SPEC 6.2's categories have no blues group.
- **Fits:**
  - A tritone substitute heading home (D♭7 to C) now fits like V7/V. Others fit half a point below their target's secondary dominant.
  - Classical rates leading-note chords at 5, so vii°7/V outranks V7/ii there.
- **Golden fixture:** `tests/fixtures/style-rankings.ts` gains five rows for the new styles.
- **♭VII7 in minor (David's choice):** D7 in E minor is offered as the key's own ♭VII7. The next-chord fixture's row changed with his go-ahead: it said D7 must not be offered, and now says it is offered as diatonic ♭VII7, never as a secondary dominant.

## 2026-10-22 — The progression strip

Phase 4 task 5 (`src/sketch/progression.ts`, `src/sketch/history.ts`, strip above the instrument view). It follows SPEC 6.5's tree. Choices the plan and SPEC didn't settle:

- **Selecting and adding:**
  - Tapping a chord in the strip selects it, plays it and makes it the current chord. Suggestions follow the strip up to the selected chord.
  - Using a suggestion after the last chord extends the progression. Using one after an earlier chord adds it as an alternative at the next slot, sharing what follows; this is how you branch.
- **Chords you add yourself (SPEC 6.3):**
  - A chord picked in Explore or played on MIDI that isn't the selected chord counts as the next chord. The strip's + adds it, and suggestions follow it.
  - Using a suggestion then adds both chords, so "pick a chord, accept what's next" still works from an empty strip.
- **Remembered branches:** each chord keeps track of the branch last shown after it (`activeChild`, an addition to SPEC 12's ChordNode). Switching back to an alternative brings back the continuation it had.
- **Shared continuations:** adding or changing a chord after a shared one first copies the shared chords up to that point, so the alternative gets its own continuation (SPEC 6.5).
- **Key changes:** accepting a pivot with "Yes" stores the new key on that chord. Chords after it are read in the new key, as are the suggestions that follow it (SPEC 6.4). The section's key in the header stays as it was.
- **Undo and redo:** they cover every change to the progression, up to 200 steps. Changes to the key and style aren't covered yet; they join when sketches and sections hold them.
- **Saving:** the progression is saved in the browser until sketches get autosave and version history (Phase 10).
- **Tree view:** 🌳 lists every branch as an indented tree, with the active path marked. Tapping a chord makes the path through it active.
- **Not yet:** removing a single chord from the middle (Undo and Clear cover mistakes for now), and sections with their own progressions (SPEC 3).

## 2026-10-22 — Strip under the MIDI panel, divider lines, Play, and + on the chord boxes (David's choices)

- **Where the strip sits:** under the MIDI panel, just above the side panel's tabs, instead of at the top of the stage. This replaces the layout entry's "the strip will sit above it".
- **Divider lines:** a plain line separates the header, scale, instrument, MIDI, progression and side panel. It is black in light mode and white in dark.
- **Play:**
  - It plays the progression from the first chord, 1.2 seconds per chord, until the beat grid gives chords their own lengths (Phase 6).
  - The chord sounding is lit in the strip and shown on the instrument.
  - Stop, or any change to the progression, stops it.
  - Each chord plays as the instrument view would play it: the top guitar shape strummed, or the keyboard voicing on show.
- **+ on the chord boxes:**
  - The guitar's chord box and the keyboard's voicing box each have a + that adds the chord as shaped after the selected chord.
  - The shape's lowest note becomes the bass, so an inversion is added as a slash chord (C/E). The bass is spelled as the chord spells that tone.

## 2026-10-22 — The chord box beside Explore and Suggest (David's choice)

- **Laptops and tablets:** the chord box moves from beside the instrument into the side panel, to the right of Explore's chord table and Suggest's cards. Building a progression and choosing a shape then happen in one place.
  - The box shows the guitar's shapes or the keyboard's voicings, whichever instrument is showing, with its + to add the shape on show.
  - Suggest keeps to three cards across to leave room.
  - The box stays in view as the list scrolls.
  - The instrument view now runs on its own.
- **Phones:** the box stays beside (under) the instrument, as the side panel is a small sheet along the bottom there.

## 2026-10-22 — Progression chords keep the shape they were added in (bug fix)

David found that a chord added from a chord box played back in root position, whatever inversion or neck position he had picked: the strip kept only the chord's name.

- Each progression chord added from a chord box now keeps its exact shape: the notes with octaves and, on guitar, the frets. This is `voicing` on ChordNode, an addition to SPEC 12.
- **Play, tapping a chip, and the first chord of a suggestion preview** all play that shape: strummed for guitar, together for keyboard.
- **Selecting or playing the chord** shows the same shape in the chord box, where the box still offers it with the current filters.
- **Chords added any other way** (a suggestion, or the strip's + for a chord picked in Explore) have no stored shape. They play as the instrument view would, as before.
- **Shapes travel and drop as needed:** a shared chord copied for an alternative keeps its shape, and changing a chord drops it.

## 2026-10-22 — The ⓘ panel

Phase 4 task 6 (`src/theory/insight.ts`, `src/workspace/ChordInfo.tsx`). Choices the plan and SPEC didn't settle:

- **On each suggestion card:** the first line is the rule's explanation, as before, followed by ⓘ. One context note shows on the card; the rest are under ⓘ. One panel is open at a time.
- **The panel holds:**
  - the chord's reading in the key and its notes ("♭VI, borrowed from C Aeolian · A♭ C E♭")
  - **More:** how the root moves from the chord before, the short way round ("The root rises a perfect 4th, G to C"); the notes the two share; and how the other notes move, each from the nearest free note of the chord before ("B up a semitone to C, F down a semitone to E"). Any other reading of the same chord follows as "Also: …".
  - **Why it ranks here:** the context notes.
  - Corpus examples join More in Phase 9.
- **Chords in the strip (SPEC 6.3):** the selected chord shows its reading under the strip, with an ⓘ that compares it with the chord before. This applies to every chord, suggested or added by hand.
- **New golden fixture:** `tests/fixtures/insights.ts` has six hand-written cases, including G7 to C (the leading note rising, the 7th falling) and Em to F (♭II from Phrygian, no shared notes).

## 2026-10-22 — Passing chords

Phase 4 task 7 (`src/theory/passing.ts`, settings in `src/theory/passing-data.ts`), following SPEC 6.7. Choices the spec didn't settle:

- **Where + between appears:** in the strip, beside the selected chord when another chord follows it. It switches the Suggest tab to "Between C and G" until another chord is selected or "Back to what comes next" is tapped.
- **How passing chords are scored:**
  - The candidates are those that could follow the first chord (styled as usual, minus pivots).
  - Each is rescored as half its fit after the first chord, plus how strongly it leads into the second. That lead is the strongest of these relations:
    - the second chord's dominant (5)
    - a chord a 5th above that falls into it, as ii does into V (5)
    - its leading-note chord (4.5)
    - its tritone substitute (4)
    - the key's function flow, scaled to at most 4
    - a root a step away (2.5)
  - On a tie, the more specific relation wins.
  - A chord on the first chord's root barely moves (Csus4 between C and F), so its lead counts half, unless it is a dominant 7th (C7, I to I7 to IV).
- **What the card says:** how the chord leads into the second one ("D7 is the dominant of G, so it pulls straight into it"). Its reading after the first chord moves under ⓘ's More.
- **Using one** inserts it between the two chords. The second chord and everything after it move along under the new chord, and other alternatives at that slot stay where they were. Undo covers it.
- **The preview** plays all three chords.
- **New golden fixture:** `tests/fixtures/passing-chords.ts` has eight hand-written cases: the plan's three textbook bridges (V7/V and ii between I and V, V7 between ii and I), secondary dominants, a leading-note diminished 7th in classical, jazz's ii7, and a minor-key case. The exit criterion is ticked.
- **Next:** all seven Phase 4 tasks and all five exit criteria are done, so the Phase 4 gate comes next.
