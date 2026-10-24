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
- **Every + inserts while + between is on (fixed after David's testing):** a suggestion card's +, a chord box's + and the strip's own + all put the chord between the two, keeping the chord after it and everything that follows. Before the fix, a chord box's + added an alternative instead, which dropped the following chords from that branch. Passing chords can go between passing chords too.
- **Why insertion rather than a branch:** a branch would need a copy of the following chords. SPEC 6.5's shared continuations would then show the second chord twice when switching back (C G G). Undo brings back the version without the passing chord.
- **The preview** plays all three chords.
- **New golden fixture:** `tests/fixtures/passing-chords.ts` has eight hand-written cases: the plan's three textbook bridges (V7/V and ii between I and V, V7 between ii and I), secondary dominants, a leading-note diminished 7th in classical, jazz's ii7, and a minor-key case. The exit criterion is ticked.
- **Next:** all seven Phase 4 tasks and all five exit criteria are done, so the Phase 4 gate comes next.

## 2026-10-22 — Tempo and chord lengths now, ahead of Phase 6 (David's request)

David asked for a BPM for playback and a length for each chord. A first slice of Phase 6's "minimal time" comes in now, in SPEC 7.1's format, so the beat grid can build on it.

- **Lengths:**
  - A chord's length is an exact fraction of a whole note: `length` on ChordNode, SPEC 12's `ChordEvent.length`. The default is one bar (SPEC 7.1), stored as no length.
  - The selected chord's **Length** menu offers 1, 2 and 3 beats, 1 bar, 1½ bars, 2, 3 and 4 bars.
  - A chip shows its length when it isn't one bar, and grows wider for longer chords.
  - Changing a length is undoable. A shared chord gets its own copy first.
- **Tempo:**
  - A **BPM** box (40–240, default 100) sits beside Play. It is remembered in the browser until sketches keep their own.
  - Play moves on after each chord's length at that tempo, and each chord now rings for its whole length.
- **For now everything is 4/4:** a beat is a quarter note.
- **Left for Phase 6:** meters, odd groupings, per-bar overrides, strong beats and a count-in. The ranker's phrase position still counts one chord as one bar; it should count real bars once the grid arrives.

## 2026-10-22 — Phase 4 gate: review and fixes (gate still open)

The theory-reviewer checked `v0.3-fingerings`..`main`:

- **Exit criteria 1–4** are confirmed with evidence: categories and explanations, deterministic rankings and wildcards, the style rankings, and the 10 known progressions.
- **Criterion 5** (passing chords) was only partly met.
- **Spelling, numerals and the ⓘ lines** check out, and so does the enharmonic swap (D♭/C♯, F♯/G♭, D♯m/E♭m, B/C♭).
- **Golden fixtures:** the two that changed (numerals F♯7-in-E-minor, next-chords D7-in-E-minor) both have David's go-ahead recorded.

Fixed from its findings, each with a test:

- **Passing chords now read roots by spelling, not pitch.** Between C and A♭, A7 no longer "stands in for the dominant of A♭", and D♯dim7 no longer "falls a 5th into A♭" (SPEC 4).
- **Every passing suggestion says how it leads in,** including every wildcard Another reaches. When nothing pulls, it names the root's move ("C♯dim7 moves on into G: its root …"). This completes criterion 5.
- **A secondary chord reads as dominant in passing chords:** "E7 leads on into A♭" no longer calls E7 a tonic.
- **Pivots never lead to a key beyond 7 sharps or flats,** so A♭ minor no longer offers D♭ minor (8 flats). The enharmonic-swap test now compares everything but pivots, since C♯ major loses its pivots into G♯ major and E♯ minor while D♭ major keeps A♭ major and F minor.
- **Wording:**
  - The rock ♭VII no longer says "Mixolydian", which was wrong in minor keys.
  - The falling-4th step no longer says "plagal".
  - The deceptive cadence is offered only after a major or dominant V, so not after Bm in E minor.
  - ⓘ names a note's move by its spelled interval: "C down a diminished 3rd to A♯", not "a tone".
- **"The tonic hasn't arrived" now uses the same test as tonic arrivals,** so an earlier Cm or C7 doesn't count.
- **Determinism:** a pivot offered into two keys sorts the same way whatever order the generators run in.
- **New test:** answering No to a key change keeps later chords in the old key (SPEC 13).

Settled by David:

- **Passing-chord order:** his fixture stands for now, so between C and G, Dm (ii) leads and D7 (V7/V) comes close behind. SPEC 6.7 is updated to match: chords that lead strongly into the second rank highest, with a fall of a 5th (ii into V) counting as strongly as a secondary dominant.
- **The passing-chords fixture's jazz comment** now reads "ii7 and V7/V". The row itself was already right. Changed with his go-ahead.

Still open: David's play-test. After that the gate closes and Phase 4 is tagged `v0.4-next-chord`.

## 2026-10-22 — Phase 4 gate passed

David has play-tested Phase 4 (five progressions in different styles), which was the last open item after the review and fixes above. The gate is closed. Phase 4 is released as `v0.4-next-chord`, on the merge of `claude/magical-edison-u6kati` (`0acbe87`). Phase 5 starts.

## 2026-10-22 — Typing chords, and Record chords on MIDI

Phase 5 task 1 (`src/workspace/typed-chords.ts`, `src/midi/record.ts`, `src/workspace/recorded.ts`). SPEC 5 sets how Record chords behaves; these choices it didn't settle:

- **Typing:**
  - A **Type chords** box under the strip takes chord symbols in either style, separated by spaces, commas or bar lines: "Em C G D", "| Am7 | D7 | Gmaj7 |". A dash on its own ("C - G") is a separator too.
  - A lower-case root is read as a capital, so "em c g d" works. Accidentals keep the spelling typed: A♯ stays A♯, even in F major.
  - The chords go after the selected chord, as + would add them: at the end they extend the progression, and mid-strip they start a branch, keeping the old chords as an alternative. While **+ between** is on, they all go between the two chords, in order.
  - **Nothing is added while any word can't be read** ("Hx" isn't a chord symbol), so a typo doesn't leave half a progression. The text stays in the box to fix.
- **Record chords** (a switch in the MIDI panel, off by default):
  - Notes sounding together for at least 150 ms make a chord, which is added once every key is up and the sustain pedal, if down, is up too (SPEC 13 edge cases, tested).
  - A rolled chord counts as one chord. Letting keys go one at a time keeps the fullest chord held.
  - **A lone note isn't recorded:** single notes are for melodies (Phase 7). Two notes are, as power chords (E5) need only two.
  - The chord takes the name the MIDI panel shows first, the best fit for the key at that point in the progression. It keeps the notes as played, octaves and all, so it plays back as voiced, like a chord added from the keyboard's voicing box.
  - A set of notes with no chord name isn't added, and the panel says so.
- **Undo** covers both, a typed line as one step.
- **Analysis:** Phase 8 builds key finding on progressions entered this way.

## 2026-10-22 — Voice-leading cost

Phase 5 task 2 (`src/theory/voice-leading.ts`, weights in `src/theory/voice-leading-data.ts`). Choices the plan and SPEC didn't settle:

- **A voicing is one note per voice, lowest voice first,** each with an octave. Pitch numbers come from the spelling, so C♯ to D♭ counts as a held note.
- **Pairing voices:**
  - Voicings of the same size pair voice by voice, in the order given. That lets a voice cross the one above it, which the cost can then count.
  - Voicings of different sizes (a triad into a 7th chord, a five-string shape into a six-string one) have no voices to follow. Their notes pair in pitch order for the least total movement, each note used at least once: C E G into G7 moves C to both G and B. These never count as crossing or overlapping.
- **What it measures:**
  - total semitones moved
  - voices that keep their note
  - pitch classes the chords share, and how many of them no voice keeps
  - crossings: pairs of voices out of order in the new chord
  - overlaps: a voice moving above where the voice above it just was, or below where the voice below it just was. So C E G to F A C in root position has two overlaps.
- **The cost** adds them up with weights stored as data: 1 per semitone, 2 per shared note let go, 6 per crossing and 3 per overlap. These are defaults; the lenses (tasks 3–4) will weight them their own way.
- **Average movement** over a progression is the measure for the exit criterion "every lens beats a root-position baseline".
- **New golden fixture:** `tests/fixtures/voice-leading.ts` has ten hand-worked cases, including G7 to C in four parts, a tenor crossing the alto, a triad into a 7th chord and back, and C♯ held as D♭.

## 2026-10-22 — Voice-leading rule checks and lens weights

Phase 5 task 3 (`src/theory/voice-rules.ts`, settings in `src/theory/voice-rules-data.ts`). Each rule hit names its rule, its voices and what went wrong ("Parallel 5ths: the bass and tenor move C3–G3 to D3–A3."). A lens turns hits into a penalty with its own weights, so no rule is a hard limit (plan). Choices the plan and SPEC didn't settle:

- **Parallel 5ths and octaves:**
  - Two voices a perfect 5th apart (or a unison or octave apart) in both chords, with both voices moving, count as parallel. Compound intervals count too (a 12th is a 5th).
  - **5ths and octaves by contrary motion count as well,** as strict classical writing forbids them. The explanation adds "in contrary motion".
  - Intervals are read by spelling, so B–F (a diminished 5th) to C–G isn't parallel 5ths.
  - A voice holding its note (oblique motion) never makes a parallel.
- **The leading note** (a semitone below the tonic, raised in minor) must rise to the tonic when V or vii° goes to I. **An inner voice may fall to the tonic chord's 5th instead,** as textbooks allow. In V to vi it may fall.
- **A chord's 7th** must fall by a tone or semitone when the chord changes. **Holding it into the next chord is fine** (Dm7 to Am keeps C).
- **Spacing:** no more than an octave between neighbouring upper voices; the bass may be further below.
- **Low register:** each interval between neighbouring notes has a lowest note it sounds clear above, from arrangers' low-interval-limit tables: a minor 3rd from C3, a major 3rd or 4th from B♭2, a 5th from B♭1. Intervals wider than an octave are exempt.
- **3rds under gain** are checked only when the sound is distorted. Any 3rd counts, including a 10th. 6ths don't.
- **Motion rules need voicings of the same size,** since they follow each voice. Chord rules look at the new chord by pitch.
- **Lens weights** (points per hit; 0 switches a rule off):

| Rule             | Classical | Rock | Open | Jazz |
| ---------------- | --------- | ---- | ---- | ---- |
| Parallel 5ths    | 20        | 0    | 1    | 1    |
| Parallel octaves | 20        | 0    | 1    | 3    |
| Leading note     | 6         | 0    | 0    | 0    |
| 7th              | 6         | 0    | 0    | 3    |
| Spacing          | 4         | 0    | 0    | 1    |
| Low register     | 3         | 3    | 4    | 4    |
| 3rds under gain  | 0         | 5    | 0    | 0    |

Jazz doesn't charge for the leading note, because in G7 to Cmaj7 it often stays as the major 7th. Task 4 builds the lenses on these weights, along with task 2's voice-leading cost.

- **New golden fixture:** `tests/fixtures/voice-rules.ts` has 22 hand-worked cases, including G7 to C in four parts, the frustrated leading note, A minor's G♯, and an open E chord under distortion.

## 2026-10-22 — The voicing lenses

Phase 5 task 4. The keyboard side is `src/theory/lens.ts` with settings in `src/theory/lens-data.ts`; the guitar side is `src/instruments/lens-guitar.ts` with settings in `lens-guitar-data.ts`. Choices the plan and SPEC 8 didn't settle:

- **How a lens works:**
  - It offers its own voicings for each chord.
  - It then picks one per chord so the whole progression costs least. The cost adds each voicing's own cost (how much less the lens likes that form or colour), task 2's voice-leading cost with the lens's weights, and the task 3 rules it breaks.
  - The same chords and lens always give the same voicings.
  - Each chord also lists the rules it breaks that the lens cares about. Rock never mentions parallel 5ths.
- **Colours fit the key:** a lens only adds a note the key has.
  - In C major, jazz makes G into G7 or G9, never Gmaj7, and E7 into E7♭9.
  - Open gives C add9 or sus2, but leaves Em alone (F♯ isn't in C major).
  - Fm in C major becomes Fm6 or Fm6/9 in jazz.
- **Classical** writes four parts:
  - bass E2–C4, tenor C3–G4, alto G3–C5, soprano C4–G5
  - upper voices within an octave of each other
  - the bass as written
  - It doubles the root first, then the 5th, then the 3rd, and never the leading note. It may leave out a 7th chord's 5th and double the root, as textbook V7s do.
- **Rock:**
  - Power chords low down, the root at E2–E3. A 5th-in-the-bass power chord (C5/G) is offered at a cost.
  - A chord with no perfect 5th (F♯dim) stays whole.
- **Open:** a bass at C2–C3 under upper notes spread at least a minor 3rd apart, with add9, madd9, sus2 and 7sus4 colours.
- **Jazz:**
  - Rootless voicings (the 3rd, 5th, 7th and 9th within an octave, named as the 9th chord they sound: Cmaj9, G9), shells (root, 3rd and 7th) and drop-2.
  - Triads become 7th chords that fit the key: maj7 or 7 for major, m7 or m6 for minor.
- **Guitar** takes its shapes from the Phase 3 fingering search, so every one is playable:
  - Classical uses four-string shapes, so its four voices can be checked like keyboard parts.
  - Rock uses two- and three-string power chords, preferring easy ones.
  - Open uses ringing four- to six-string shapes.
  - Jazz uses three-string shells and four-string grips, all fretted.
- **A rule refinement:** a leading note may stay put when the chord it moves to contains it. In G7 to Cmaj7, B stays as the major 7th. Two cases were added to `tests/fixtures/voice-rules.ts`; none changed.
- **Test progressions** are in `tests/fixtures/lens-progressions.ts`: 13 progressions in eight keys, with inversions, secondary dominants and a borrowed iv. (Corrected at the gate: F♯dim in E minor is ii°, not a leading-note chord; leading-note chords were added then. See the gate entry below.)
  - A progression of power chords only isn't among them: four-part writing can't move power chords without parallels, and power chords are rock's.
- **All three Phase 5 exit criteria are proven by tests**, on keyboard and on guitar (standard and drop D):
  - no parallel 5ths or octaves in classical
  - every lens moves less on average than root position close triads
  - every guitar voicing is a shape the fingering search finds, within its span

  The theory reviewer confirms them at the gate.

## 2026-10-22 — The Voice tab: lenses side by side

Phase 5 task 5 (`src/workspace/VoicePanel.tsx`, state in `src/workspace/lens-columns.ts`), following SPEC 8. Choices the spec didn't settle:

- **Where:** a new **Voice** tab beside Explore and Suggest. It voices the progression's active path, each chord in its own key after any key change. The chord box beside the panel hides on this tab to give the columns room.
- **Choosing lenses:** a tick box per lens, with two to four on at once. Classical and Rock are on by default (SPEC 8). The choice is remembered in this browser.
- **Instrument:** Guitar and Keyboard buttons switch every column at once. The tab opens on whichever instrument the main view shows.
- **Each column** shows the lens's name, what it is after, and every chord:
  - its voiced name, with "for C" when the lens changed the chord (Cadd9 for C)
  - its form (four parts, power chord, rootless…)
  - on keyboard, its notes; on guitar, a chord box and its frets
  - any rule it breaks that the lens cares about, as a ⚠ line
  - at the bottom, the average voice movement
- **Playback:** each column's ▶ Play plays the whole progression in that lens, at the strip's tempo and chord lengths. Guitar strums and keyboard plays block chords. Tapping a chord plays it alone. One column plays at a time.
- **Phones:** one lens at a time. Swipe sideways or use ‹ › to change lens; the tick boxes choose which ones to swipe through.
- **Not yet:** a lens voicing can't be added to the progression; the strip keeps its own shapes. Say if you'd like a + on each column.
- **Next:** all five Phase 5 tasks are done and all three exit criteria pass, so the Phase 5 gate comes next: the theory reviewer and your play-test.

## 2026-10-22 — Lens voicings into the progression, a chord viewer, and paler tones off the shape (David's choices)

After trying the Voice tab, David asked for three things.

- **Lens voicings into the progression:** each lens column has two buttons.
  - **⑂ New branch** makes a new branch from the first chord with the lens's chords and voicings ("Cadd9 Fsus2…"). The chords as they were stay one tap away on the first chord's ‹ › arrows.
  - **+ Add to end** adds the lens's chords after the last chord.
  - Either way each chord keeps its length and any key change, and its voicing (notes, and frets on guitar), so it plays as the lens voiced it. When added on the end after a key change, the last chord leads back to the starting key, so the copy is read as the original was.
  - Undo covers both.
- **A chord viewer beside the instrument** on laptops and tablets, with no +. The box with + stays beside the side panel. **The two stay in step** (David asked for Claude's view; Claude recommended it so the fretboard, the viewer and the box never disagree): stepping either one moves both, and the instrument follows. A phone keeps its one box, with +, under the instrument.
  - This partly undoes "the instrument view now runs on its own" from the chord-box entry above: the box with + still lives beside the side panel, and the viewer joins the instrument.
- **Paler tones off the shape:** on the fretboard and the keyboard, the notes of the shape or voicing on show keep full colour (and their ring). The chord's tones elsewhere stay in their colours, but paler. This works with note names, degrees and chord-tone colours alike.

## 2026-10-22 — Replace on the chord box (David's request)

- The chord box with + (beside the side panel, or under the instrument on a phone) has a second button beside it: **⇄ Replace G**, naming the chord selected in the progression.
- It puts the chord and shape on show in that chord's place. The chord keeps its length and any key change, and plays in the new shape. Undo brings the old one back.
- With the selected chord itself on show, Replace just changes its shape: step to another inversion or neck position and tap Replace.
- A shared chord gets its own copy first, as with any change.
- The viewer beside the instrument stays without buttons.

## 2026-10-22 — Phase 5 gate: review and fixes

The theory reviewer checked `v0.4-next-chord`..`main`.

- **Confirmed with evidence:**
  - All three exit criteria pass.
  - Every hand-worked value in the voice-leading and voice-rule fixtures is right.
  - No golden fixture was edited, only added to.
  - Spelling holds throughout: MIDI chords spelled by the key, typed spelling kept, and C𝄪 in D♯ minor and F♭ in A♭ minor through the lenses.
  - All 3,174 tests passed.

Fixed from its findings, each with a test:

- **Guitar shapes are named by the note that sounds lowest.** A lower note on a higher string (an open string under a fretted one) can sound below the "bass": `x-x-10-0-x-x` is C5/G, not C5.
  - Rock and the other lenses may still use such a shape, named for what sounds, at a cost.
  - Classical on guitar keeps the written bass at the bottom, as on keyboard.
- **Jazz drop-2 inversions are named with their bass** (Em7/G), as is every lens voicing. Rootless voicings stay unnamed for the bass, leaving it to the bass player.
- **Classical diminished triads double the 3rd** (vii°6 in C: D3 F3 B3 D4), then the root, and hardly ever the diminished 5th.
- **Secondary leading notes rise too:**
  - A dominant 7th, or a dominant from outside the key, a 5th above the next chord must raise its 3rd into that chord's root: G♯ to A in E7 to Am, F♯ to G in D to G.
  - So must a diminished chord a semitone below it.
  - Diatonic chords a 5th apart (C to F in C) aren't dominants, so E needn't rise to F.
  - **Not checked:** the augmented 2nd from G♯ falling to F in V–VI in minor. The classical lens raised G♯ to A in every progression tried.
- **A held 7th is fine only when the next chord contains it.**
- **Seven new hand-worked cases** in `tests/fixtures/voice-rules.ts`: E7 to Am, D to G, C to F, a 7th held into G, octaves in contrary motion, a unison moving to an octave, and a 7th falling a whole tone.
- **The movement criterion is an average over the set (David's choice).** The reviewer found short progressions where a lens can't beat root position on its own:
  - C Csus4 C barely moves in root position.
  - C Bdim/D C/E keeps its written bass in the lenses but not in the baseline.

  These six were added to the test set: C Bdim/D C/E, Am G♯dim7 Am, C Csus4 C, Am E F, C F♯dim7 G and G D/F♯ Em C. Each lens must move less than root position on average over all 19.

- **Tests now cover:**
  - the full SATB ranges
  - drop D for all three guitar checks
  - every voicing named by its lowest note

**Play-test:** David tried the lenses and they work for him.

The gate closes when this is merged. Phase 5 is released as `v0.5-voicings` on that merge; David adds the tag, as this session can't push tags. Next: the four experimental lenses and the Wildcard lens David asked for, then Phase 6.

## 2026-10-22 — Experimental lenses and the Wildcard (David's request)

David asked for more versatile, experimental lenses that are still informed by theory, and chose both ideas offered: four new lenses and a Wildcard, fresh every time. They sit beside the four core lenses (`EXPERIMENTAL_LENSES` in `src/theory/voice-rules-data.ts`, forms in `lens-data.ts`, generators in `lens.ts`). The Phase 5 exit criteria stay with the core four.

- **Every experimental voicing uses only notes of the key (or of the chord itself).** It may not add a note a semitone above a chord tone: no ♭9 over the root, no 4th over a major 3rd, no ♭6 over the 5th (the avoid notes of arrangers' chord scales).
- **Quartal:**
  - The root, then notes stacked in perfect 4ths, three to five of them, with a major 3rd allowed on top. This finds E A D G B over Dm7, the "So What" voicing.
  - A stack must sound at least two of the chord's notes, counting the bass. So What has no F, so the 3rd can't be required.
- **Clusters:** the chord's tones squeezed within about a 5th, with one or two added 2nds, 4ths or 6ths from the key, so at least two notes sit a tone or a semitone apart.
- **Upper structures:**
  - The root, its 3rd (and 7th), and a major or minor triad from the key above them. The triad has a different root and adds at least one new note: Em over C adds B, Dm over G7 adds the 13th, G over C adds the 9th.
  - The column names the triad ("Em over C").
  - A lighter form with only the 3rd under the triad suits the guitar.
- **Drone:**
  - The key's tonic held low (with its 5th, in one form) under every chord, the chord in close position above. C F G C becomes C F/C G/C C.
  - A lighter form leaves out the chord's 5th.
  - After a key change the drone moves to the new tonic.
- **Names:** clusters, stacks and upper structures are named from their notes where the namer can (Cadd9, Cmaj9, E7♯9), keeping the chord's root. Otherwise they keep the chord's name, and their label says what they are.
- **Wildcard:**
  - For each chord, a few voicings from every other lens after a roll of chance. Each lens's own liking counts a quarter.
  - The search still weighs how they move, lightly, so the result surprises but hangs together.
  - Each voicing is labelled with its lens ("Jazz: drop-2").
  - It rolls fresh whenever the progression or instrument changes, and again on **🎲 Another**. ⑂ New branch keeps a roll you like.
- **On guitar:**
  - The experimental lenses fret their keyboard voicings exactly, using a new search for exact notes (`src/instruments/fret-notes.ts`): one note per string, within the 4-fret stretch.
  - It tries the voicing as it is, an octave up or down, with notes below the low string raised an octave, and with everything above the lowest note an octave higher.
  - Open strings far from the hand cost more, as in the fingering search.
  - **Drones fit best in keys whose tonic is an open string (E, A, D, G).** In C, a held low C under Dm7 needs a 5-fret stretch, so some chords fall back to "as written", and the column says so.
- **The picker** groups the lenses as Core and Experimental. Two to four show side by side, chosen from all nine.
- **A bass range fix for the core lenses:** three bass ranges ran E2 to C3, which left no room for a D or E♭ bass. Jazz shells now cover D and E♭ chords too. The ranges now run E2 to E♭3.

## 2026-10-22 — No minimum number of lenses (David's choice)

The Voice tab no longer needs two lenses ticked. Up to four still show side by side, but any of them can be turned off, down to none. With none ticked the tab says to tick a lens. On a phone, the ‹ › arrows show only when there are two or more lenses to swipe between. This changes SPEC 8's "two to four lenses"; the default stays Classical and Rock.

## 2026-10-22 — An Arpeggio tab in Phase 6 (David's idea)

David asked for an Arpeggio tab beside Voice: a place to try arpeggios and extended chords that adds nothing to the progression. It joins the plan as Phase 6 task 2, straight after the beat grid (task 1), and the line tasks move along to 3–5. Phase 6 also gains a fourth exit criterion for it.

- **Why after the beat grid:** an arpeggio is notes in time. Its patterns and rates (8ths, triplets, 16ths) need the beats and subdivisions task 1 builds.
- **Shared with the line tasks:** the line modes need the same interval labels (chord tone, extension) and playback alongside the chords, so the two are built together.
- **What it reuses:**
  - the extended colours and key-fitting rules from the lenses
  - the instruments' highlighting
  - the exact-note guitar search (`fret-notes.ts`) for positions and runs across the neck
- **What it does:** pick a chord or step through the progression; choose the arpeggio (triad to 13th, or a lens's colours), a pattern, a rate and a range; hear it at the tempo, each note lit and labelled on the fretboard or keyboard.

SPEC's "Changes to the plan" lists it as item 8.

## 2026-10-22 — The beat grid (Phase 6 task 1)

Phase 6 task 1 is done: time signatures, strong and weak beats, and chord lengths counted in each meter. Durations stay exact fractions of a whole note, so triplets and odd meters never round. The meters live in the theory core (`src/theory/meter.ts`), with the picker's meters as data (`meter-data.ts`). The beat positions are golden in `tests/fixtures/meters.ts`.

- **Meters:** 4/4, 3/4, 2/4, 2/2, 6/8, 9/8, 12/8, 5/4, 5/8 and 7/8. The picker lists each grouping of the odd meters separately, e.g. 7/8 (2+2+3) and 7/8 (3+2+2).
- **Strong beats** (SPEC 7.1 doesn't settle every meter, so these are my calls; David can change them, as they are data and fixtures):
  - Beat 1 of each bar is the downbeat, the strongest.
  - In crotchet and minim meters every crotchet (or minim) is a beat. The start of each group is strong: beat 3 in 4/4 (2+2); none after the downbeat in 3/4 and 2/4; beat 4 in 5/4 (3+2).
  - In quaver meters each group is one beat, and every one is strong. 6/8 counts two dotted beats (1 and 4, as SPEC says), 9/8 three and 12/8 four. 7/8 (2+2+3) counts three uneven beats, on quavers 1, 3 and 5.
  - **5/4 defaults to 3+2** (as in Take Five), and 5/8 to 2+3. 7/8 defaults to 2+2+3 (SPEC 7.1).
- **What the tempo counts:**
  - the beat: ♩ in 4/4, 𝅗𝅥 in 2/2, ♩. in 6/8, 9/8 and 12/8
  - in 5/8 and 7/8, where the beats are uneven, the crotchet: 7/8 at ♩ = 120 has quavers at 240
  - The strip shows the note before the BPM box. The tempo stays between 40 and 240.
- **Chord lengths:**
  - The Length picker counts in the meter of the chord's bar: beats up to a bar, then 1, 1½ (where it comes out in whole beats), 2, 3 and 4 bars. In 5/8 and 7/8 it counts quavers ("5 eighths").
  - A chord with no length set lasts one bar of whatever meter its bar is in, so switching 4/4 to 3/4 shortens it to three beats. A length you pick is kept exactly, so "2 beats" stays a minim in any meter.
  - Before, picking "1 bar" in 4/4 stored nothing. It still does, but now four beats in 3/4 is stored as four beats, not mistaken for a bar.
- **A bar can have its own meter** (SPEC 7.1): select a chord, and "Bar N in" sets the meter of the bar it starts in, e.g. a bar of 2/4 in a 4/4 verse. Overrides are kept by bar number, as in a DAW, so inserting a chord earlier moves chords past them, not the overrides.
- **The strip:**
  - Each chord shows the bar it starts ("Bar 3") when it starts on a downbeat.
  - Dots under each chord show the beats it covers: the downbeat large and blue, strong beats filled, weak beats hollow, with a bar line where a new bar starts.
  - The selected chord says where it starts ("Starts bar 3, beat 2").
- **Where it's kept:** sections don't exist in the app yet (SPEC 3), so the time signature and bar overrides are remembered in this browser, like the tempo. They move into the section when sections arrive. Changing them isn't undoable yet.
- **Ready for the next tasks:** the theory core can say what accent any position has (downbeat, strong, weak or off the beat), and lists the beats each chord covers. The Arpeggio tab and line modes will use this for "land on a chord tone at each chord change" and "fit the beats available".

## 2026-10-23 — Beat and bar lights (David's request)

Two lights sit at the start of the strip's toolbar and flash in time while the progression plays, so the timing can be seen as well as heard. The beat light is amber and flashes on every counted beat; weak beats flash less brightly than the downbeat and strong beats. The bar light is red and flashes on the first beat of each bar, so in 6/8 the beat light flashes twice a bar and in 7/8 (2+2+3) three times, unevenly. They follow bar-level meter changes. When nothing plays, both stay dim. This is not a click: SPEC 5 keeps playback free of a metronome.

## 2026-10-23 — The Arpeggio tab (Phase 6 task 2)

The Arpeggio tab sits beside Voice. It arpeggiates any chord of the progression, or the current chord, and adds nothing to the progression. The theory is in `src/theory/arpeggio.ts`, the choices as data in `arpeggio-data.ts`, the guitar fretting in `src/instruments/arpeggio-guitar.ts`, and the golden tones in `tests/fixtures/arpeggios.ts`. The fourth Phase 6 exit criterion is proven by `tests/workspace/arpeggio-view.test.ts`, over 26 chords in four keys, with every choice, pattern, rate and four lengths.

- **Which notes (my calls, as the spec leaves them open):**
  - A chord's own tones always stay.
  - Any 7th, 9th, 11th or 13th the chord lacks comes from the key, stacked in 3rds on its root: the key's note six, one, three or five letters up. So in C, G gives G7, C gives Cmaj7 and F gives Fmaj13♯11. Chromatic chords work the same way: E is E7 (V/vi) and A♭ is A♭maj7 (♭VI). (Changed 2026-10-23 at the Phase 6 gate: a borrowed chord stacks from the mode it's borrowed from, so Fm in C is Fm7 and B♭ is B♭7.)
  - **An added note a semitone above a chord tone is left out:** the 11th over a major 3rd, and a ♭9 or ♭13 over a minor or major chord. These are the arranger's avoid notes, the same rule the experimental lenses use. The tab names each note it leaves out and why ("F (11), a semitone above the 3rd").
  - **A dominant 7th keeps its ♭9 and ♭13**, as they are its colours: E in A minor goes up to E7♭9♭13.
  - A 6th stands in for the 7th (C6 stays a 6/9 chord), and sus chords keep their 2nd or 4th.
  - Keys of fewer than seven notes (pentatonics) fall back to a ♭7, 9, 11 and 13.
- **Lens colours:** the Open and Jazz lenses colour chords (Cadd9, Cmaj7), so the tab offers "Open colours" and "Jazz colours" as well as Triad to 13th. The other lenses don't recolour chords.
- **Range:**
  - From the root up 1, 2 or 3 octaves, ending on the root at the top, with every tone in every octave.
  - So a 9th sounds a 2nd above the root in each octave, but is still labelled 9.
  - The default start is the root in octave 3 on keyboard, and the lowest root the guitar reaches.
- **Patterns:** up, down, up and down, down and up, broken (1–3, 2–4… of the arpeggio's notes) up or down, and in threes (1–2–3, 2–3–4…) up or down.
- **Rate:** 8ths, 8th triplets or 16ths.
- **Fitting the time:**
  - The pattern repeats from the start until it fills the chord's length. Every note starts on the rate's grid.
  - The last note is cut short when the length isn't a whole number of notes (triplets in 7/8).
  - The current chord, when it isn't in the progression, gets one bar.
- **On guitar:**
  - **One position:** every tone of the arpeggio within a 4-fret span, on every string from low to high, as guitarists learn arpeggio shapes (changed 2026-10-23 at David's request: the first version needed the whole chosen range in one span, which left only two or three positions). A position needn't start on the root. Open strings count in the open position. ‹ › steps through every position up the neck, and a span that holds nothing new is skipped. C has about nine positions in frets 0–15. In one position, From and Range are hidden, because the position sets the notes. Playing through every chord keeps each chord in the position nearest the selected one.
  - **Across the neck:** a run of two or three notes a string that moves up the neck as it climbs.
  - If a range doesn't fit, the tab says so and suggests fewer octaves or another start.
- **Hearing it:** Play plays the chord's arpeggio at the tempo, and Play through every chord steps through the progression. The note sounding glows amber on the instrument, as the beat light does. Every note in the arpeggio is ringed and labelled R, 3, 5, ♭7, 9, and so on. While the tab is open, the box beside the instrument stays (David's choice, 2026-10-23). On guitar it becomes a position picker (David's request): it draws the arpeggio's position as a box, every note a labelled dot, with ◀ ▶ to step through the positions that fit, and "Pick a position" when the run is across the neck. On keyboard it stays the chord's voicing box, and the voicing is no longer ringed on the keys, so the rings show only the arpeggio.

## 2026-10-23 — Line modes and the Lines tab (Phase 6 task 3)

The line modes are in `src/theory/lines.ts`, with the modes and their ranges as data in `lines-data.ts`. The golden moves (approach notes, enclosures, guide tones, root and 5th) are in `tests/fixtures/lines.ts`. A **Lines** tab beside Arpeggio shows a line over the progression and plays it alone. Playing it with the chords is task 5, and each line as a ranked Suggestion with ⓘ is task 4.

- **Built on the beat grid:** each chord's slots are its start and every beat inside it. Every note fills whole slots, so a line fits the beats exactly in any meter (two dotted beats a bar in 6/8, three uneven ones in 7/8). A chord shorter than a beat gets one note.
- **Bass lines** sit in E2–C4, low enough to sound like a bass and high enough for a guitar's low strings:
  - **Roots:** the root held.
  - **Root and 5th:** the root, then the 5th from the first strong beat after it (4/4 as two minims; 3/4 as root for two beats, then the 5th).
  - **Approach notes:** the root, then a semitone into the next root on the last beat, from the side the line comes from. If that note is the one already sounding, the approach comes from the other side.
  - **Walking:** a note a beat. The root, then the chord's tones climbing (or falling, when high in the range), then a semitone into the next root (G F D D♭ | C…).
  - **Pedal:** the key note held low. Under a chord that lacks it, it's tagged pedal.
- **Inner voices:**
  - the tenor and alto of the Classical lens's four parts
  - guide tones, from the 3rd or the 7th: each chord's 3rd or 7th, whichever is nearer the last (F F E over Dm7 G7 Cmaj7)
- **Between chords** (around middle C to C6): each chord starts on a chord tone, holds it, then leads into a tone of the next chord on its last beats.
  - **Scale steps:** passing notes of the key; a common tone gets a neighbour above.
  - **Chromatic:** every semitone, spelled raised going up and lowered coming down.
  - **Enclosures:** the key's step above the target, then the semitone below it. When the held note is already the step above, only the semitone below follows.
  - The target is the tone whose path fills the beats, then the nearest. Straying more than a 4th from the middle of the range costs as much as an empty beat, so long lines turn round instead of climbing.
- **The last chord leads back to the first**, as the progression repeats.
- **Tags:** chord tone, passing, neighbour, approach, pedal, and chromatic for any note outside the key (also on chord tones like the G♯ of E7 in C). Each note has a plain-English reason ("A♭ leads by a semitone down into G, the root of G7. A♭ is outside C major: a chromatic note.").
- **The tab:**
  - Pick a mode, and see each chord's notes labelled by their interval over the chord, outlined in their tag's colour, with a red underline outside the key.
  - Tap a note for its reason, or a chord to light its notes on the instrument.
  - On guitar, a line's notes ring everywhere they can be played, as lines have no fixed fingering yet.
- **Phase 6 exit criteria 1–3** are proven by `tests/theory/lines.test.ts`, over 12 progressions (4/4, 3/4, 6/8, 7/8, uneven and two-bar chords, power, sus and 6th chords) with all 12 modes.

## 2026-10-23 — Lines as suggestions (Phase 6 task 4)

Every line mode over the progression is now a Suggestion (`src/theory/line-suggestions.ts`, rules and wording as data in `line-suggestions-data.ts`). They're grouped as in SPEC 6.2, with the groups as categories (Bass lines, Inner voices, Between chords), and ranked within each group.

- **Ranking rules** (points; higher ranks first):
  - up to 3 for the share of strong beats and downbeats that are chord tones
  - minus the average move between notes in semitones: 0.05 a semitone for a bass, which may leap, and 0.3 for inner voices and lines between chords, which shouldn't
  - minus 2 times the share of notes outside the key
  - Ties keep the modes' own order, so the same progression always ranks the same way.
- **The ⓘ panel:**
  - The first line says what the line does, with its counts ("Walks a note a beat through each chord, with 4 approach notes leading into the next root").
  - "More" breaks the notes down by tag, and says where a pedal sounds against a chord.
  - Each rule that moved the line adds a context note ("Ranked higher: it moves by step or less", "Ranked lower: 2 notes outside C major").
- **Lines between chords changed:** ranking showed the scale-step and chromatic lines putting passing notes on strong beats (beat 3 in 4/4). They now follow the textbook rule: a chord tone on every strong beat, passing notes on the weak beats between, and the last stretch leading into the next chord. In a chromatic line, a common tone gets the semitone below as its neighbour (G F♯ G). Enclosures still take the chord's last beats.
- **The Lines tab** lists the lines as buttons in their groups, best first. The chosen line's first line shows beside an ⓘ.

## 2026-10-23 — Lines with the chords, and a Wildcard line (Phase 6 task 5, David's idea)

**Chords and lines play together (task 5).**

- The Lines tab's **▶ Play with chords** plays the progression the way the strip's ▶ Play does, with each chord in its chosen shape, the beat and bar lights and the strip highlight. The line sounds over it, note by note, and the sounding note glows on the instrument and in the tab.
- **▶ Line alone** still plays the line by itself.
- While a line plays along, each new chord lets the line's notes ring instead of cutting them off.
- Like any playback, changing the progression or the time signature stops it.

**A Wildcard line (David's request).**

- It sits last, in its own group, dashed like the chord Wildcard (SPEC 6.2).
- At each chord, chance picks the move into the next chord (scale steps, chromatic or an enclosure). It also picks which of the three best-fitting tones to aim for.
- So it is a new line every roll, but it still lands on a chord tone at every change, keeps chord tones on strong beats where it passes by step, and explains every note.
- The roll is seeded from the chords and where they fall, so the same progression gives the same Wildcard. **🎲 Another** rolls a fresh one.
- It is tested with the other modes against the three line exit criteria.
- SPEC's "Changes to the plan" lists it as item 9.

All five Phase 6 tasks and its four exit criteria are now ticked. The phase gate still needs a reviewer check of the criteria, David's play-test, and the `v0.6-lines` tag.

## 2026-10-23 — Arpeggios with the chords (David's request)

The Arpeggio tab gains **▶ Play with chords**, as the Lines tab has. It plays the progression the way the strip's ▶ Play does, with chord shapes, the beat and bar lights and the strip highlight, and each chord's arpeggio over it.

- Each arpeggio uses the tab's current choice, pattern and rate, and fills its chord's length.
- On guitar in one position, the other chords play in the position nearest the selected one.
- The chord picker follows the chord playing, and the sounding note glows.
- The current chord, when it isn't in the progression, isn't played, since it has no place in the bars.

Both tabs now hand their timed notes to the workspace in one shape (`src/workspace/along.ts`), so anything later that plays along (Phase 7's melodies) can do the same.

**Chord boxes in the Arpeggio tab (David's request, same day).** The chord menu and ‹ › are replaced by a box per chord, as in the Lines tab. Each box shows "C · bar 1", the arpeggio's name, and its notes in the order they play, outlined in the tone colours (root red, 3rd orange, 5th blue, 7th purple, extensions teal). Tap a box to choose that chord. The current chord, when it isn't in the progression, gets a box marked so.

## 2026-10-23 — Rows of lines and arpeggios under the progression (David's choice)

David asked for a way to add a line or an arpeggio to the progression without replacing the chords. They now go on rows under the strip.

- **+ Add as a row** on the Lines tab adds the chosen line, with the Wildcard's roll. On the Arpeggio tab it adds the current arpeggio settings, plus, on guitar in one position, the fret the position sits near.
- **Rows follow the chords (David's choice).** A row stores its recipe, not its notes, so it rewrites itself to fit when a chord, length, key or time signature changes. Freezing a row's notes for hand editing comes later, with Phase 7's melody editing.
- **Rows are saved with the progression (David's choice),** so saving, undo, redo and branches cover them.
  - Each row is anchored to the last chord on the active path when it was added. It shows while that chord is on the active path, so switching to another branch shows that branch's rows instead.
  - Removing a row can be undone.
- **What each row shows:** its name ("Walking", "Wildcard (roll 3)", "7th arpeggios, up, 8ths, around fret 7"), a 🔈/🔇 mute button, a × to remove it, and a box per chord with the notes it plays there.
- **The strip's ▶ Play** plays the chords with every row that isn't muted. The note sounding is lit in its row; with several rows playing, the light follows whichever note started last. The Lines and Arpeggio tabs' **Play with chords** still plays just that tab's line or arpeggio with the chords, for auditioning before adding.
- **The model:**
  - `Progression.parts` in `src/sketch/parts.ts`, with `addPart`, `removePart`, `setPartMuted` and `partsShown`, checked when a saved progression is read back.
  - Each recipe turns into notes in `src/workspace/parts-view.ts`.
  - SPEC 12's data model and its "Changes to the plan" (item 10) are updated.

## 2026-10-23 — Adding single bars to rows (David's request)

Each bar box in the Lines and Arpeggio tabs gains a **+** that adds just that bar to a row.

- **Where a bar goes:** into the latest line row (from Lines) or arpeggio row (from Arpeggio) on the branch showing. With none, it starts a new row that plays only that bar.
- **Bar by bar:** each bar can have its own setting (walking in bar 1, chromatic in bar 3; a 7th up in one bar, a 9th down in another), so a row can be built a bar at a time. Bars not added stay silent.
- **Over a whole row:** a bar added to a row made with **+ Add as a row** plays its own way and the rest keep the row's recipe.
- **Silencing a bar:** in a row, each bar that plays shows what it plays when it has its own setting, and a small **×** to silence it. Undo brings it back.
- **The model:** a row (`Part`) now has an optional `recipe` for every chord plus `cells`, each chord's own recipe (or null for silence), keyed by chord node, and a `kind`. Rows saved before this still load.
- **Lining up rows bar by bar under the chords** joins Phase 7 as task 6, with freezing a row into notes (David's request).

**Rows show bars as boxes (David's request, same day).** Each bar of a row is now a box like the Lines and Arpeggio tabs':

- "C · bar 1", and what the bar plays when it has its own setting.
- Its notes as chips labelled by interval, coloured by tag for lines (with the red underline outside the key) and by tone for arpeggios.
- The × to silence it.

Bars a row doesn't play show as faint "silent" boxes, so every row reads bar by bar across the progression.

## 2026-10-23 — Phase 6 gate review fixes

The theory reviewer checked Phase 6 against SPEC and found lines spelling notes the key already has as outside it, and borrowed chords taking the wrong 7ths. Fixed in `src/theory/lines.ts` and `src/theory/arpeggio.ts`, with new golden entries added to `tests/fixtures/lines.ts` and `tests/fixtures/arpeggios.ts` (no existing entry changed).

- **Outside the key means spelled outside it.** A line note is in the key when its letter and accidental match a scale note, not just its pitch. The criterion test now compares spellings too.
- **Approach notes use the key's spelling** when the key has that pitch: in C, the note above A♭ is A (not B♭♭) and the note below F♯ is F (not E♯). Otherwise the semitone is spelled toward the target, as before (F♯ to G, A♭ to G).
- **An enclosure's step above is at most a whole tone:** above A♭ in C it is B♭, not B.
- **Chromatic passing notes:** the scale's spelling where it has one, then a natural, then a sharp going up or a flat coming down. So C to E in C runs C♯ D D♯, and E to C runs E♭ D D♭. No letter carries two accidentals.
- **Wrapping round:** on the last chord, approach, walking and between lines lead into the line's actual first note, so the loop back to the start joins up.
- **Borrowed chords (David's choice: "what most players expect"):** a chord whose notes the key doesn't hold takes its 7th and extensions from the mode on the tonic it is borrowed from. Modes are tried in this order: in major keys, natural minor, Dorian, Mixolydian, Phrygian, Lydian, harmonic minor, melodic minor, Locrian; in minor keys, harmonic minor, melodic minor, Dorian, major, Mixolydian, Phrygian, Lydian, natural minor, Locrian. So in C, Fm is Fm7 (not FmMaj7), B♭ is B♭7 (the backdoor ♭VII7, where the numeral reading's Mixolydian would give B♭maj7) and A♭ stays A♭maj7. A chord no mode holds, such as a secondary dominant (E in C, V/vi), still stacks from the key, so E stays E7.
- **B°7 at the 13th keeps G (my call, as David asked for the prudent one):** each added tone is a whole tone above a chord tone (G above F), the standard diminished-7th tensions, and C, a semitone above B, is left out.
- **Sus names:** an extended sus4 chord is named with sus4 at the end, so G7sus4 at the 13th is G13sus4.

Still to do for the gate: David's Phase 6 play-test, then the `v0.6-lines` tag.

## 2026-10-23 — Editing lines (David's request)

David asked for ways to vary how many notes a bar a line plays, to see other notes that could go in a note's place (as chord suggestions do), and to add extra and bridging notes. It joins Phase 6 as task 6, before the gate (David's choice), and Phase 7 can build its melody editing and frozen rows on it. The theory is in `src/theory/line-edits.ts`, its weights and wording in `line-edits-data.ts`, and the densities in `lines-data.ts`.

- **Notes a bar, for the whole line and bar by bar (David's choice):** the Lines tab offers "As the line plays" (each mode as before), One a chord, Strong beats, Every beat and Twice a beat (three times in a dotted beat, so 6/8 runs in quavers). Each bar has − and + with its note count, which step to the next level with fewer or more notes.
  - A mode fills the slots of its level as it always does: walking walks in 8ths, passing lines get more room to pass. A note a mode holds (a root, a pedal, a guide tone) is struck again on each slot, so roots at Every beat pump crotchets.
  - Lines still land on a chord tone at each change, and fill each chord exactly, at every level, in every mode (tested).
- **Notes in a note's place:** tap a note and up to eight others come as ranked Suggestions, each with its tags and why.
  - They are within a 5th of the note.
  - Chord tones rank first where the chord changes and on strong beats.
  - Next come notes that step between their neighbours or lead by a semitone into the next note, the nearer the better.
  - Notes outside the key rank lower, and are spelled toward the note they move to (A♭ coming down to G).
  - A note that would stop the line landing on its chord at a change says so. Choosing one plays it and puts it in.
- **Adding notes after a note,** sharing its time evenly, never shorter than a semiquaver. The choices:
  - a passing note by scale step to the next note;
  - an approach note a semitone into it;
  - another tone of the chord (not the next note itself);
  - a scale or chromatic run of two or three notes into it;
  - the note struck again.
  - **Take it out** lets the note before hold on, or the next take its place at the start of the bar; a bar's only note stays.
- **Edited bars keep their notes (David's choice).** An edited bar is marked "edited", and ↺ gives it back to the line ("Undo all edits" does every bar).
  - Its notes are stored with their spelling and where each starts in the chord. Each lasts to the next, so the bar always fills its chord: if the chord gets shorter, notes past its end go, and if it gets longer, the last note holds on.
  - Every note is tagged again against its chord and its neighbours: chord tone, neighbour, passing or approach. A note that is none of these is "your own", a new tag in purple. A note outside the key is still tagged chromatic.
  - If an edited bar's first note isn't one of its chord's notes (after a chord change, say), the bar says so in red.
  - While a bar is edited, − and + are off: tap notes to add or take them out instead.
- **Each line keeps its own edits** (by mode, and the Wildcard's roll), so trying another mode and coming back finds them. They last while the app is open. Adding the line as a row saves them with the progression, so saving, undo and branches cover them.
- **Rows:**
  - A line recipe can now carry a density, and a bar of a row can carry edited notes.
  - **+ Add as a row** stores the line's density, and every bar with its own setting as a cell of the row.
  - A bar's **+ Row** (it was a bare +, renamed so it isn't confused with the new note +) adds the bar with its notes a bar and any edits.
  - Rows name it: "Walking, twice a beat", "Walking, edited". SPEC 12's data model is updated.
- **Limits:** a line that leads into an edited bar still aims for the chord's tone, not the edited first note. Editing notes in a row itself, rather than in the Lines tab, waits for Phase 7's frozen rows.

## 2026-10-23 — Bars of any length, and refreshing them (David's request)

After play-testing line editing, David asked for any number of notes from 1 to 16 in a bar; for a bar's number to stay put when the line changes; for fewer repeated notes when a bar has more notes than its line; and for a refresh on each bar. The theory is in `src/theory/line-fill.ts`, with each mode's likings and the chance a refresh adds as data in `line-fill-data.ts`.

- **1 to 16 notes a bar.** − and + now step one note at a time, up to 16, or fewer in a shorter chord (12 in a bar of 3/4, 4 in a one-beat chord).
  - Where the notes fall: the chord's start, then the strongest places in the bar (beats by strength, then half-beats, then semiquavers). Later places win a tie, so extra notes lead into the next chord: 3 notes in 4/4 fall on 1, 3 and 4, and 5 notes add the "and" of 4. In 6/8 a beat splits in three.
- **A bar's count is the same whatever the line (David's request).** Counts and refreshes belong to the bar, so trying Walking then Scale steps keeps 8 notes in bar 2. Notes edited by hand still belong to each line, as before.
- **Fewer repeats.** A bar with more notes than its line keeps the line's own notes where they fall. Between them it adds notes the line likes, each scored as data:
  - another chord tone, a scale step or semitone toward the next note, a neighbour, an approach into the next chord, or the note again;
  - each line type weighs these its own way: Roots and Pedal like repeats; Walking likes chord tones, steps and approaches; lines between chords like passing notes; Chromatic likes semitones;
  - moving further costs more, a note repeated twice costs more, and going straight back to the note before last costs a little, so long bars don't drum or rock between two notes;
  - a strong beat always takes a chord tone (a pedal may hold), and after a note outside the chord the line moves on rather than stepping further off;
  - the line type's approach into the next chord stays the bar's last note, unless that would put it on a strong beat.
- **Refresh (David's choice: best first, refresh varies; notes and rhythm both change).**
  - The first result is the rules' top pick, the same every time. 🎲 on a bar gives a new take: chance joins the scores for where the notes fall and which notes play. The bar keeps its count, its first note and every rule above.
  - Each refresh is seeded by the chords, the bar and how many times it has been refreshed, so a row plays exactly what the tab showed.
  - **🎲 Refresh every bar** refreshes them all. ↺ on a bar clears its count, refreshes and edits; "Undo all edits" clears every bar.
- **Rows** store a bar's count and refresh (`count`, `seed` on a line recipe) and name them: "Walking, 6 notes, refreshed".
- **Answering David's question:** before this, every line mode and every Voice lens gave exactly the same result for the same chords and settings. Only the Wildcards used chance. Refresh brings rule-following chance to every line. Voice lenses get the same next, as an Another on each lens.

## 2026-10-23 — Chords for a chord's place (David's request)

David asked for alternatives when he clicks a chord in the progression. Clicking a chord in the strip now opens **In place of Am** in the Suggest tab (David's choice of where, and of making a branch):

- **What it offers:** chords that could follow the chord before and lead into the chord after, ranked as passing chords are (Phase 4 task 7), each with its explanation and ⓘ. The last chord's place offers what could follow the chords before it; the first chord's place offers starting chords that lead into the second.
  - The chord already there is never offered, and neither is a change of key.
  - The Wildcard and Another work as usual.
  - The theory is `rankInPlace` in `src/theory/passing.ts`. Both rankers gained a `keep` option for this.
- **Tap** plays the chord before, the suggestion, then the chord after.
- **+ makes it an alternative at that slot.** The chords after it stay as they were, and the old chord is one ‹ › away. The place stays open, so several can be tried in turn.
- **"What comes after Am"** goes back to the next-chord suggestions after the selected chord, which is what clicking a chord showed before. Adding a chord any other way moves on, as before.

## 2026-10-23 — Another take on every Voice lens (David's request)

David asked whether each lens gives the same voicings every time (it did) and for other paths that still follow the rules. Every lens column now has **🎲 Another** (David's choice: one per lens), and **↺ Best** goes back to the lens's own best.

- **The first take is the lens's best,** as before (David's choice: best first, Another varies).
- **Another take:** each voicing's own cost gains up to 3 points of seeded chance before the search (`LENS_VARIATION` in `src/theory/lens.ts`). The search still weighs voice leading and every rule the lens's way.
  - Strict rules are kept: anything costing more than twice the chance, such as the Classical lens's parallels (20) and tendency notes (6), stays exactly as the best kept it (tested).
  - Mild likings, such as parallels costing 1 in the Open lens, may be traded for a smoother path.
- Each take is seeded by the chords, the lens and the take number, so a take plays the same until the progression changes, which starts every lens over at its best. On guitar, takes choose among the lens's guitar shapes.

## 2026-10-23 — Swapping a chord in a Voice lens column (David's request)

David found that clicking a chord in a Voice lens column didn't offer alternatives. Tapping a chord in a column now plays it and opens two lists under it (David's choice: both):

- **Other voicings:** the lens's other ways to voice that chord, up to six, best first. They are ranked by their own cost, how far the voices move from the chord before and into the chord after, and the lens's rules they would break (shown under the hover). The theory is `voicingOptions` in `src/theory/lens-swaps.ts`.
- **Other chords here:** chords for that place, ranked as the Suggest tab's "In place of" ranks them (`rankInPlace`), each voiced by the lens the same way.
- **Picking one swaps it into that column only (David's choice),** marked "swapped", with ↺ to go back.
  - The swap stays put, and the lens voices the other chords around it, so its neighbours may change to stay smooth. (Changed the same day at David's request: see below.)
  - Another keeps swaps in place. A change to the progression clears them.
  - **⑂ New branch** or **+ Add to end** puts the column, swaps and all, into the progression.
- On guitar the lists offer the lens's guitar shapes, as frets.

**Keyboard shapes in the Voice tab (David's question, same day).** Lens columns on keyboard showed only note names; only guitar drew its shapes. Each keyboard voicing is now drawn on a small keyboard, the same drawing as the voicing box beside the keyboard. It is cropped to the keys from the lowest note to the highest so it reads at a column's size, with each note coloured by its role. The lens columns also take the instrument's tone colours, so guitar boxes there are now coloured too (their dots had been black).

**Swaps change only their own chord (David's request, same day).** The lens's voicings for the other chords now stay exactly as they were when a chord is swapped. The swap is laid over the column (`withSwaps`), and the rules broken and the movement are worked out again only where the column changed.

- **A third list, "Suggestions due to the neighbour change"** (David's idea), appears under a swapped chord. For the chord before and the chord after, it offers up to two of the lens's voicings that sit better beside the new chord than theirs do now (`neighbourOptions`). Tapping one swaps that neighbour too. Nothing moves unless you choose it.
- "Other voicings" for a swapped chord now offers voicings of the chord that is there, for example C7 after a swap from Am.
- **Every chord box in a lens column is one size (David's request):** the same width everywhere, with one height on keyboard and a taller one on guitar for the chord box. Long names and notes are cut short. A rule a voicing breaks shows as ⚠ in its box, with the reasons in the panel below.
- The swap panel now opens below the column's chords, full width, so it no longer stretches one box.

**Neighbour suggestions, fixed (David's report, same day).** "Suggestions due to the neighbour change" was hardly ever seen, for two reasons:

- It only appeared on the swapped chord's own panel.
- It only listed voicings strictly smoother than the neighbour's own. That is rarely any, because "Other chords here" already voices a new chord to fit between its neighbours, and the lens's own path can never be bettered one chord at a time.

Now it also appears on the panel of a chord whose neighbour was swapped. Each neighbour always offers its two best other voicings beside the new chord: those that would be smoother than its own are marked "smoother", and otherwise the list says the chord is already the smoothest and offers two to try.

## 2026-10-23 — Moving chords and rows by octaves (David's request)

David asked for an easy way to move a piece up or down an octave. It is practical because every chord either keeps its exact notes (from a chord box or a lens) or is voiced when it plays, so moving it means moving those notes.

- **Chords (David's choice: both):**
  - ▼ ▲ beside the selected chord move just that chord.
  - **Octave ▼ ▲** on the progression bar moves every chord on the branch showing.
  - A moved chord shows "+1 oct" or "−1 oct".
  - A chord keeps its moved notes as its voicing, so playback, the fretboard, saving, undo and branches all follow. Its chord, length and key change stay, and changing the chord itself starts it over.
  - Each chord moves at most three octaves each way and stays within a piano's range. A chord that can't move that far stays where it is while the rest move.
- **On guitar (David's choice: nearest playable shape):** the same shape 12 frets along where the neck has room (open C at fret 12). Otherwise it uses the chord's shape whose notes sit nearest the pitch asked for, on that side, so a moved chord can always be played. The theory is `src/instruments/octave.ts`.
- **Rows (David's choice: the same controls as the chords):** ▼ ▲ on each row move the whole row, and ▼ ▲ on each bar of a row move just that bar, three octaves at most either way. Rows move on their own, not with the chords, so a bass line stays a bass line unless you move it. Notes keep their spelling and labels. They are stored as `octave` and `octaves` on the row (SPEC 12 updated).

## 2026-10-23 — Removing a chord (David's request)

David found no way to take a chord out of the progression. The selected chord in the strip now has **✕** beside its ▼ ▲ (`removeAt` in `src/sketch/progression.ts`):

- The chords after it close up behind the chord before, and the chord before is selected. Undo brings it back.
- **Alternatives:** the chord's own alternatives at its slot stay, one ‹ › away. Alternatives at the next slot move up with the chord on the path.
- **A key change** on the removed chord passes to the chord after it, so later chords keep their key.
- **Rows:** a row anchored to the removed chord moves to the chord before (or after, if it was the first), and the chord's own bars in rows go with it. With no chords left, the row goes too.

## 2026-10-23 — Melody entry (Phase 7 task 1)

A **Melody** tab joins the side panel, and a **♪ Melody** lane sits under the progression strip (SPEC 2, 7.2). The theory is `src/theory/melody.ts`, with the note values and grids as data in `melody-data.ts` and the musical truths in `tests/fixtures/melodies.ts`. Three ways in:

- **Tap the instrument (step entry).** While the Melody tab is open and "Tapping the instrument adds notes" is ticked (the default), every key and fret adds a note after the last, and plays it. Keys outside the scale can be tapped too.
  - Each note lasts the note value chosen: semiquaver, quaver triplet, quaver, dotted quaver, crotchet (the default), dotted crotchet, minim, dotted minim or semibreve. Each button shows its symbol and its fraction of a whole note (1/4), as the musical symbols look alike in some fonts.
  - **𝄽 Rest** leaves a rest of that value before the next note. **⌫ Last note** and **Clear** take notes out.
  - Spelling: as the instrument shows the note (the scale's, or the current chord's). Otherwise it is raised going up from the note before and lowered coming down, as the lines spell (C♯ after C, D♭ after D). With no note before, the key signature decides.
- **Type note names,** such as `E4 F# G - r B`. Each note lasts the chosen value, `r` is a rest and `-` holds the note before. Spelling is kept as typed.
  - **Octaves (my call):** a note without an octave goes to whichever octave is nearer the note before, within a 4th by letter, as LilyPond's relative mode reads it. So C up to F, C down to G, B up to C. The first note without one is in octave 4. Words it can't read are listed, not guessed.
- **Record on MIDI.** Choose the grid (semiquavers by default, quavers, quaver triplets, or off), then **● Record**. A bar of clicks counts in at the tempo, and the clicks carry on through the take.
  - **My calls:** the chords play from bar 1 while you record (a tick-box turns this off). The take replaces the melody, and Undo brings the old one back. Record chords is switched off while recording, so held notes don't become chords.
  - It stops on **■ Stop recording**, or at the end of the last chord. With no chords it runs until Stop.
  - **Snapping:** starts and ends snap to the grid, and one note sounds at a time. Notes struck together keep the highest, and a note held into the next ends there. A note let go a grid step or less before the next lasts until it, so slightly detached crotchets still read as crotchets (found when testing a recording). Longer gaps are rests, and no note is shorter than a grid step. A note struck just before the count-in ends counts from beat 1.
  - With the grid off, timing keeps a 96th of a whole note, still an exact fraction.
  - Notes are spelled by the key, then by the way the melody moves, as for taps.
  - The sustain pedal is ignored: a melody note lasts while its key is down.
- **The lane** shows the melody bar by bar, each note with its length as a fraction (1/4 for a crotchet). The note sounding is lit. Lining the bars up under the chords is Phase 7 task 6.
- **Playback:** the strip's **▶ Play** plays the melody with the chords and rows. On the Melody tab, **▶ Play melody** plays it alone, every note, and **▶ Play with chords** plays it over the chords alone. Notes after the last chord ends play only with Play melody.
- **Where it is kept:** on the progression as `melody` (SPEC 12 updated), outside the chord tree, so every branch plays over the same melody. This stands in for the section's melody until sections arrive. It is saved in the browser, undo and redo cover every change, and the strip's Clear keeps it.

## 2026-10-23 — Generating a phrase (David's request)

David asked whether the app would write melodies. The plan's melody features suggest the next note, a note at a time, rather than writing a whole tune. David asked for a generator as well. It joins Phase 7 as task 7, after the next-note suggestions it is built on, with an exit criterion of its own.

- **What it does:** one button writes the next few notes, or a bar or two, by choosing from the next-note suggestions. Chance plays a part, as the Wildcard line's does, but every next-note rule still holds.
- **Using it:** another press gives another take, and the phrase can be kept, trimmed or undone.

## 2026-10-23 — Next-note suggestions (Phase 7 task 2)

The Melody tab now has **Next note**: up to eight notes that could come next, best first. Each is tagged and comes with its reason, and tapping one adds it to the melody and plays it. Picking a range sits above the list. The grouped list, wildcard, preview and ⓘ of Phase 4 come with task 4. The theory is `src/theory/next-note.ts`, its weights, ranges and wording are data in `next-note-data.ts`, and the cases are in `tests/fixtures/next-notes.ts`.

- **Candidates:** every note within an octave of the last note, inside the range. For the first note, every tone of the first chord in the range, nearer the middle first.
  - Spelling: as the chord spells it, then as the key does, then raised going up and lowered coming down.
  - The next note starts after the last note (and any rest waiting), and lasts the note value chosen.
- **Rules, each a weight:**
  - **Chord tones:** a chord tone on a strong beat scores well. A note that isn't one, on a strong beat, costs. On weak beats a chord tone counts for less.
  - **Steps and skips:** steps are liked. A skip of a 3rd isn't penalised, as melodies outline chords that way. Leaps of a 4th or more cost, a 6th or more costs more, and nothing beyond an octave is offered.
  - **After a leap:** after a leap of a 4th or more, turning back (by step especially) is liked, and carrying on the same way costs. So does a second leap the same way, and a fifth note running the same way.
  - **Tendency notes:** the leading note rising to the tonic, 4 falling to 3, and a sharp rising or a flat falling by a semitone are liked.
  - **Notes outside the key** cost.
  - **Range:** going past the range the melody has used so far costs a little, so it leans towards that range (SPEC 7.3).
  - **Found while trying it:**
    - A third repeat of a note in a row gives way: each repeat already in a row costs more.
    - A third swing between the same two notes (C B C B) costs, so the melody moves on. Going back to a neighbour once is fine.
- **Tags:** chord tone, passing (a step on the same way, not a chord tone), neighbour (a step that turns back, not a chord tone), leap (a 3rd or more), repeat, chromatic, plus step and "resolves" for tendency notes. Every suggestion has at least one of the first six (tested over every range preset and several melodies).
- **Chords:** the chord under the next note is the one used. With no chords at all, the key's tonic triad stands in. Past the last chord there is no harmony, so no chord rules apply.
- **Ranges (SPEC 7.3, my call on the values; David to check):**

  | Preset                    | Range               |
  | ------------------------- | ------------------- |
  | Bass voice                | E2–E4               |
  | Baritone voice            | G2–G4               |
  | Tenor voice (the default) | C3–A4               |
  | Alto voice                | F3–D5               |
  | Soprano voice             | C4–A5               |
  | Guitar lead               | E3–E6, as it sounds |
  | Keys lead                 | C4–C6               |

  Or your own: two note names with octaves. The range is saved with the melody (`melodyRange`; SPEC 12 updated), undo covers it, and the strip's Clear keeps it.

- **Exit criterion 1** ("every suggestion stays in range and is tagged") is tested for next-note suggestions. It stays unticked until the motif options (task 3) and the next-token interface (task 4) are in, as it covers them too.

## 2026-10-23 — Motif options (Phase 7 task 3)

The Melody tab has a **Motif** section under Next note. It offers a motif from the melody again, in the next free bar, in up to five ways. Tap one to add it, or ▶ to hear it first. The theory is `src/theory/motif.ts`, its scores and wording are in `motif-data.ts`, and the cases are in `tests/fixtures/motifs.ts`.

- **What a motif is (my call):** the notes that start in one bar, two or more of them. So the melody "contains a motif" as soon as any bar has two notes, which makes the exit criterion testable. It is tested over four ranges, three keys and seven melodies, and ticked.
- **Which motif:** the bar whose rhythm (where each note falls in the bar, and its length) comes back most, else the first bar. A rhythm that recurs is the surest sign of a motif. **Motif from** picks any other bar with two or more notes.
- **Where the options go:** the next bar line at or after the melody's end (and any rest waiting). Each note keeps its place in the bar, so an upbeat stays an upbeat.
- **The options, best first.** Each is scored by how its notes sit on the chords where they land: chord tones on strong beats count for, other notes on strong beats against. Nearness to the melody's last note counts a little.
  - **Repeat:** the motif again.
  - **Sequence:** the motif moved up or down by one to three scale steps in the key. The best two show.
    - Notes take the key's spelling at the new height.
    - A note altered from the key keeps its alteration, so in A minor a step up from A G♯ A is B A♯ B (a tonal sequence).
    - Seven-note scales only.
  - **Changed ending:** the motif with its last note swapped for the best next note there, from the next-note rules, so it answers rather than repeats.
  - **Upside down:** each scale step from the first note mirrored, so C E G becomes C A F.
- **Range:** an option that doesn't fit moves by an octave (or two), and costs a little for it. One that can't fit at all isn't offered.
- Options are tagged "motif" and their kind, and explained. Exit criterion 1 still waits for task 4.

## 2026-10-24 — The melody's next-token interface (Phase 7 task 4)

Next note and Motif in the Melody tab now work as the Suggest tab does for chords (SPEC 6.2, 7.3). The theory is `src/theory/melody-ranker.ts`, with the groups, counts and context lines as data in `melody-ranker-data.ts` and the ⓘ readings in `tests/fixtures/note-insights.ts`.

- **Groups:** six to eight next notes, no more than three from a group:
  - **Chord tones**
  - **Steps and neighbours** (with repeats)
  - **Leaps**
  - **Colour notes** (outside the key)

  A first note is always a chord tone, so that group fills the list.

- **Wildcard:** a valid but unlikely note from the lower-scoring half of the notes not shown.
  - It is seeded by the melody, chords, key, range and note value, so it is the same for the same input.
  - **Another** steps through the rest without repeating until it wraps round.
- **Preview:** tapping a note plays the last note, then the candidate, and lights both on the instrument by degree, with the candidate as the one sounding. **+** adds it.
- **Motif options** sit in their own **Motif** group with the same cards: tap to hear them, lit; + to add.
- **ⓘ** gives the note's degree in the key (degrees count from the major scale on the tonic, SPEC 4), its place in the chord under it, and its move from the note before. A 2nd is named as a semitone or a tone; other moves by their spelled interval: "Down a minor 6th from E4".
- **Why it ranks here:** one line for each rule that moved the note, such as "Ranked higher: it turns back after the leap". Rules the explanation already states (a note outside the chord on a strong beat, a note outside the key) don't repeat there.
- **Found while trying it:** a motif's **changed ending** now ends on a note of the key. It had picked A♭ in C, which reads as a colour, not an answer.
- **Exit criterion 1 is ticked:** every note shown, every wildcard and every motif option stays in range and is tagged (tested over four ranges and six melodies, and over the motif cases).

## 2026-10-24 — Fixes and additions to melodies and arpeggios (David's requests)

- **Notes in a melody note's place.** Tapping a note in the melody lane plays it and offers up to eight notes for its place, best first. They are ranked as next notes after the notes before it (`rankNoteInPlace` in `src/theory/melody-ranker.ts`), then re-ranked by how they lead into the note after: a step into it ranks higher, a leap of a 4th or more away lower. Tapping one swaps it in at the same start and length, and plays it. The cases are in `tests/fixtures/notes-in-place.ts`.
- **Gaps (David's "ghost notes": a beat with no new note).** Two kinds, as David described both:
  - **A rest:** silence.
  - **A hold:** no new note, the note before rings on.

  Where you can use them:
  - **In the melody lane,** a tapped note offers:
    - **Silence it:** the note goes and the rest of the melody stays put.
    - **Hold the note before:** the note before rings on through its place.
    - **A beat's rest before it:** a beat of the time signature, and that note and the ones after move later.
  - **In the Arpeggio tab,** tap any note of a bar's pattern to hold the note before over it, again for a rest, and again to play it (`withGaps` in `src/theory/arpeggio.ts`). A hold after a rest stays silent.
  - **Rows:** + on a bar and **+ Add as a row** keep a bar's rests and holds (`gaps` on the arpeggio recipe; SPEC 12 updated), and the row's name counts them.

- **Arpeggio bars play when tapped.** Tapping a bar's name in the Arpeggio tab plays that bar, as other boxes do. While the arpeggios play with the chords, it only shows the bar.
- **Only the note playing lights.** Arpeggio notes were lit by pitch, so every note of the same pitch in the bar lit at once (every R). They now light by their place in the bar's pattern.
- **Each bar's own pattern.** Every bar in the Arpeggio tab has its own pattern menu: "Pattern as above" follows the tab's, or pick another. **+** and **+ Add as a row** keep each bar's pattern. Bar choices clear when a chord is added or taken out, as the bars move along.
- **More patterns.** Asked whether arpeggios have many set patterns: there are plenty of standard ones. Added:
  - **In fours** up and down (1–2–3–4, 2–3–4–5…)
  - **Turns** up and down (1–2–3–2, 2–3–4–3…)
  - **Alberti** (low–high–middle–high on the lowest three notes, the classic piano accompaniment)
  - **Pedal** on the lowest note (1–2–1–3–1–4…)
  - **Outside in** (lowest, highest, second lowest, second highest…)

## 2026-10-24 — The melody lane as time strips (Phase 7 task 6, first half; David's choice)

David asked for a way to see how much of each bar the melody fills, holds and silences included. From a mock-up of two ways, he chose Option A: each bar of the lane becomes a time strip. The layout is in `src/workspace/melody-strips.ts`, with the cases in `tests/fixtures/melody-strips.ts`.

- **Each bar** is as wide as it lasts (a bar of 4/4 is 18rem; 3/4 is three-quarters of that). On top are the chords sounding in it, then ▶ Bar n and how full it is ("full", or "2½ of 4 beats", counted in the meter's beats: dotted crotchets in 6/8), then a ruler of its beats.
- **Notes** are blocks as wide as they last.
  - A note over the barline is split, with ⌒ and a dotted edge on each side.
  - A held note shows a dashed line where each hold began, striped to its end. To keep this, a note now remembers where it was held over (`holds` on a melody note; SPEC 12 updated).
  - Tapping a note opens its alternatives, as before.
- **Gaps:** rests between notes are dashed boxes with 𝄽. Time after the melody's end is faint and empty.
- **Bars:** the lane shows at least every bar the chords cover, so empty bars to come are visible.
- **Playing one bar (David's request):** tapping ▶ Bar n plays that bar, its chords cut to it and its melody, with the note sounding lit. The bar names of the line and arpeggio rows under the progression ("C · bar 1") now play that bar of the row with its chord too.
- **Still to do for task 6:** lining the rows up bar by bar in the same strips under the chords, and freezing a row into notes to edit by hand.

## 2026-10-24 — Chord styles and inversion steps join Phase 7 (David's requests)

Two of David's ideas join Phase 7 as tasks 8 and 9, each with an exit criterion:

- **Chord styles (task 8).** Chords now always play as a block. A menu above the chord names will choose how they are played:
  - block
  - strum
  - pulse on every beat
  - bass then chord ("oom-pah")
  - broken (rolled)
  - off-beat stabs
  - a down-up strum pattern

  **David's choice:** both a style for the whole progression and a style of its own on any single chord.

- **Inversions before octaves (task 9).** ▲ ▼ on a chord will step through its inversions before moving it a whole octave: C, C/E, C/G, then C an octave up.
  - On guitar each step takes the nearest playable shape of that inversion, as octave moves do now.
  - **David asked** that it is always clear which kind of step a chord has had: an inversion or a perfect-octave move. So the chord shows labels such as "1st inversion", "+1 octave", or both.

## 2026-10-24 — A melody note's length, and a rest after it (David's requests)

Tapping a note in the melody lane now also offers:

- **Length:** every note value, from a semiquaver to a semibreve with dotted values and the quaver triplet, the note's own highlighted. Choosing one changes the note, and the notes after it move along by the difference. So the rest of the melody keeps its rhythm and its rests, and a longer note pushes on into the next bar (`setNoteLength` in `src/theory/melody.ts`). Holds past a shortened end go.
- **A beat's rest after it,** beside "A beat's rest before it": the notes after it move a beat later. After the last note there is nothing to move, so the next note added comes a beat later instead (the Melody tab says so).

## 2026-10-24 — Harmonies and a countermelody for the melody (Phase 7 task 5)

The Melody tab has a new **Harmony** section. The theory is in `src/theory/harmony.ts`, its intervals, weights and wording in `harmony-data.ts`, and the hand-worked cases in `tests/fixtures/harmonies.ts`.

- **What's offered (SPEC 7.4):** 3rds above first, then 6ths below, then a countermelody and 3rds below. Behind "More harmonies…": 6ths above, 4ths and 5ths above and below, octaves above and below, and power 5ths and 4ths below for riffs. 2nds and 7ths aren't offered, as a line of them only clashes.
- **Diatonic harmonies** move with the melody note for note, counted in the key's letters: a 3rd above C in C major is E, above D it is F. A chromatic melody note is harmonised from its letter, so the harmony stays in the key (A a 3rd above F♯ in C).
- **Chord-aware:**
  - On a strong beat, when the melody is a tone of the chord but the strict interval isn't, the harmony moves a step to a chord tone, away from the melody first (G under C: B becomes C, a 4th above). It never moves to a 2nd, 7th or tritone from the melody. Tagged **bent**.
  - When the melody note isn't a chord tone itself, the harmony moves with it unbent, so the two resolve together. Tagged **passing**.
  - Over a chromatic chord the harmony takes the chord's own note: G♯ over E7 in C, not G. Tagged **chromatic**.
  - A key with no note on the letter (C major pentatonic has no F) moves a step to a note it has, tagged **bent**.
- **Power 5ths and 4ths and octaves** are exact intervals, as a power chord is, so they can leave the key (B♭ a 5th below F in C). Each such note is tagged **chromatic**.
- **The countermelody** sits under the melody, note against note, from the key's notes and the chord's own. It starts on a chord tone a 6th or more below, then picks each note by score: contrary motion, chord tones on strong beats, steps, 3rds and 6ths with the melody. It never moves in parallel 5ths or octaves with it, and stays within two octaves below.
- **Playing them (my choice; easy to change):** + on a harmony plays it with the melody from then on: with ▶ Play melody, with the chords, with ▶ Play on the strip, and in a lane bar's ▶. Several can play at once (3rds above and 6ths below make three parts). The progression saves which are on, not their notes, so each harmony follows the melody as it changes, as rows follow the chords (`harmonies` on the progression; SPEC 12 updated). ✓ stops one. Tapping a card plays it with the melody once, and ⓘ explains it note by note.
- **Not yet:** harmonies don't show in the melody lane, and can't be edited note by note. Both fit task 6's work on the lane and on freezing rows into notes.
- **Exit criterion:** "Twin-harmony lines stay diatonic unless tagged" is tested across 16 keys and modes (major, minors, modes, pentatonics, blues), random melodies with notes outside the key, and chords that aren't in the key. Every harmony note is in the key or tagged chromatic.

## 2026-10-24 — Rows line up with the melody lane, and freeze into notes (Phase 7 task 6, second half)

Task 6 is finished. The rows under the progression now share the melody lane's time strips, and any row can be frozen into its notes to edit by hand. The layout is in `src/workspace/PartRows.tsx` and `Timeline.tsx`. Freezing is in `freezeRow` and `frozenLine` in `src/workspace/parts-view.ts` and `freezePart` in `src/sketch/parts.ts`.

- **Bar by bar under the chords:**
  - Each row is laid out in the same strips as the lane: every bar as wide as it lasts, the same bars in every row (all the bars the chords or the melody cover).
  - Each note is a block as wide as it lasts, labelled by interval and note name, and coloured as the Lines and Arpeggio tabs colour it. Rests are dashed.
  - The lane and the rows scroll sideways together, so the bars stay under each other on a phone too.
- **Each chord's name sits where it starts in a row (my choice; easy to change).** Tapping it opens that bar's tools, which used to sit in each box:
  - ▶ Play
  - ▼ ▲ Octave
  - 𝄽 Silence it
  - the bar's own setting, when it has one

  This keeps short chords readable: a one-beat chord's strip is too narrow for all the buttons.

- **❄ Freeze** on a row keeps the notes it plays now, exactly as heard:
  - the octave moves are written into the notes
  - silenced bars stay silent
  - an arpeggio keeps its rests and holds

  From then on the row no longer follows the chords: a changed chord keeps the old notes, and a chord added later gets nothing from the row. If a chord gets shorter or longer, its notes are fitted to it, as an edited bar in the Lines tab always was. The row is named after what it was, with "frozen": "Walking, frozen". Undo brings back the row as it was.

- **Editing a frozen row:**
  - Tapping a note plays it and shows what it is (chord tone, passing, your own…) and why.
  - Then come the Lines tab's tools: **Play instead** (ranked notes for its place), **Add after it** (passing note, approach, another chord tone, runs, strike it again) and **× Take it out**.
  - The other notes offered go no more than a 5th past the row's lowest or highest note.
  - Tapping a note in a row that isn't frozen explains it and offers ❄ Freeze.
- **Rests in edited bars:** a hand-edited bar's note used to always last until the next one. To keep an arpeggio's rests, a note can now stop earlier, leaving a rest (`length` on `BarNote` in `src/theory/line-edits.ts`).
  - Swapping a note or adding notes after it keeps its rest.
  - Taking a note out lets the note before ring on through, as the button says.
  - Tested in `tests/theory/line-edits.test.ts`; SPEC 12 is updated.
- **Frozen rows take no bars from the tabs:** a bar's **+ Row** in the Lines or Arpeggio tab goes to an unfrozen row of its kind, or starts a new row.
- **Not yet:** harmonies still don't show in the lane as their own strips.

## 2026-10-24 — Writing a phrase (Phase 7 task 7)

The Melody tab has a new **Write a phrase** section, under Next note. The theory is in `src/theory/phrase.ts`, with the sizes, rhythms and how much chance as data in `phrase-data.ts`. The starting melodies the tests write after are in `tests/fixtures/phrases.ts`.

- **How much:** the next four notes at the note value chosen, to the end of the bar, or two bars (to the barline after next).
- **How each note is chosen:** from the next-note suggestions, one at a time, each read after the notes chosen before it. Each is drawn from the best four that keep every rule, the better the likelier: a note's chance falls by e for every 1.5 points it scores below the best. A repeated note counts for 1.5 less, so phrases move.
- **The rules every note keeps** (the exit criterion, now ticked):
  - It is within the range.
  - It is a note of the key (my choice: colour notes stay yours to add).
  - It is a chord tone on every strong beat it sounds on, struck or held over, wherever a chord sounds.
  - After a leap of a 4th or more, it turns back. This is the same leap size the next-note rules turn back from, so a 3rd, which often runs along the chord, can carry on.
  - The phrase ends on a chord tone where one is available.

  Tested over ten starting melodies (major, minors, Dorian; 4/4, 3/4, 6/8 and 7/8; a narrow range, past the last chord, no chords at all), each with all three sizes and twelve takes.

- **Rhythm:** a bar or two is written beat by beat, each beat a whole note, two halves, a dotted pair, or held from the note before. A dotted beat (6/8) and a two-quaver beat (7/8) have their own options. A beat is held only after a note that filled its beat, so held notes last whole beats. The last beat is one note, so the phrase lands. Time left in a beat after the melody is one note.
- **Takes:** the same melody, chords and take always give the same phrase. The take goes straight into the melody, so it shows in the lane and plays at once. Then:
  - **↻ Another take** puts the next take in its place.
  - **✓ Keep** keeps it.
  - **✂ Trim a note** takes its last note off.
  - **⟲ Undo it** takes it out, along with any rest that was waiting before it.

  Any other change to the melody keeps the take as it stands.

## 2026-10-24 — Moving single notes by octaves (David's request)

David asked to move a note up or down an octave when it is tapped in the melody or arpeggio rows.

- **The melody lane:** a tapped note has **▼ Octave** and **▲ Octave**, beside its other tools. Its spelling, place and length stay (`shiftMelodyNote` in `src/theory/melody.ts`, octaves 0 to 8).
- **Arpeggio rows that follow the chords:** a tapped note has ▼ ▲ too.
  - The move is kept by the note's place in the bar's pattern, as rests and holds are, so it stays moved when the chord changes: the third note of the bar goes up, whatever the chord.
  - The bar gets a setting of its own for this, and the row's name says "with one bar of its own" ("1 note moved" in the bar's tools). It goes no further than three octaves (`shiftArpeggioNote` in `src/sketch/parts.ts`; `shifts` on an arpeggio recipe, SPEC 12 updated).
  - Freezing the row keeps the moves.
- **Frozen rows:** a tapped note has ▼ ▲ alongside Play instead and the rest.
- **Line rows that follow the chords** don't move single notes: their notes are rewritten whenever the chords change, so there is no fixed note to move. A tapped line note offers ❄ Freeze instead, then ▼ ▲.

## 2026-10-24 — Chord styles (Phase 7 task 8)

**Chords play** sits above the chord names. It sets how every chord is played, and any chord can have a style of its own: select the chord, then **This chord plays** under the strip. A chord with its own style shows it on its chip. The theory is in `src/theory/chord-style.ts`, with the styles and patterns as data in `chord-style-data.ts` and hand-worked cases in `tests/fixtures/chord-styles.ts`.

- **The styles,** laid on the beats each chord covers as the time signature counts them. A dotted beat (6/8, 12/8) and an uneven group (7/8) are counted in quavers.
  - **Block:** all together for the whole chord, as before. On guitar that is still the quick strum.
  - **Strum:** one slow strum down, 50 ms a string, held.
  - **Pulse:** the whole chord on every beat.
  - **Bass then chord:** the lowest note on the strong beats, the rest on the others, so oom-pah in 4/4 and oom-pah-pah in 3/4. A dotted or grouped beat takes the bass on its first quaver and the chord on the rest (6/8: bass, chord, chord, twice).
  - **Broken:** rolled, each note a demisemiquaver after the one before, low to high, all ringing to the end. The notes come closer together on a short chord.
  - **Off-beat stabs:** silence on each beat, a short chord on its "and" (on each later quaver of a dotted beat).
  - **Down-up strum:** in 4/4, the classic down, down-up, up-down-up in quavers, the missed strokes letting the strum before ring on. Other meters strum down on each beat and up between (a dotted beat: down, miss, up). Up-strums catch the top three notes, as up-strokes catch the top strings.
- **Where a chord falls:** a style follows the bar, not the chord. A half-bar chord on beat 3 takes the second half of the strum pattern. A chord is always struck as it starts, even on a stroke the pattern misses; only stabs begin with silence.
- **Exit criterion ticked:**
  - Every style fills each chord exactly. Tested in seven meters, eight chord lengths and four starting points: the slots follow one another from the chord's start to its end, and nothing rings past it.
  - A chord's own style overrides the progression's, and keeps it when the progression's style changes.
- **What follows the style:** ▶ Play on the strip, and ▶ Bar n in the melody lane and in the rows (each plays its stretch of the chords in style). Tapping a chord still plays it once, as a block, so you hear it straight away.
- **Saving:** the progression's style and each chord's own are saved with it, and changes can be undone (`chordStyle` on the progression and `style` on a chord; SPEC 12 updated).

## 2026-10-24 — Inversions before octaves (Phase 7 task 9)

▲ ▼ on a selected chord now step through its inversions. The theory is `stepInversion` and `inversionStepLabel` in `src/theory/inversion.ts`, with hand-worked cases in `tests/fixtures/inversion-steps.ts`. The guitar shapes come from `invertShape` in `src/instruments/octave.ts`.

- **A step:**
  - **▲** puts the next chord tone in the bass, the nearest above the bass now, and stacks the other tones closely above it. Any 9th, 11th or 13th stays on top.
  - So C goes C, C/E, C/G, then C an octave up. A 7th chord has four positions (G7, G7/B, G7/D, G7/F), a power chord two.
  - **▼** goes back the same way: C, C/G a little lower, C/E, then C an octave down.
  - The chord's name changes with it (C/E), so numerals, lines and arpeggios read the new bass. Spelling is kept: A♭/C, then A♭/E♭.
- **On guitar,** each step takes a playable shape of the inverted chord. In order, it looks for:
  - the bass asked for, or the nearest bass on that side;
  - every chord tone and as many strings as it can;
  - an easy shape;
  - the one nearest where the hand is.

  So C goes open C, open C/E, the open C/G on the top four strings, then C at the 5th fret. When the neck has nothing further that way, the chord stays put.

- **Labels (David's request):** the chip says which kind of move a chord has had: "1st inversion", "+1 octave", or both ("1st inversion, +1 octave"). Octaves are counted each time a step comes round past root position, and by octave moves.
- **Whole octaves** are still a tap away: **▼8ve ▲8ve** beside ▲ ▼ move the chord an octave as before, and the strip's Octave ▼ ▲ still moves every chord.
- **A slash chord over a note outside it** (F/G) has no inversions to step through, so ▲ ▼ move it a whole octave.
- **Exit criterion ticked:** stepping ▲ or ▼ visits every inversion once before landing in root position an octave away. Each step is labelled as an inversion, an octave or both. Tested in both directions over twelve chords (triads, 7ths, half-diminished, sus2, power chord, m6, dim7).
- **▶ Hear it (David's request):** beside **This chord plays**, it plays the selected chord through its length in its style, so a style can be heard before playing the progression.

## 2026-10-24 — Clearing everything, and clearing a bar (David's request)

David asked for clear buttons for everything and bar by bar. He chose **Everything** for clearing the whole song and left the per-bar design to me.

- **Clear everything** on the strip takes out the chords, the rows, the melody and its harmonies, after a confirm.
  - The melody's range and the chord style are settings, so they stay.
  - Undo brings it all back.
- **Clear chords** is the strip's old **Clear**, renamed so it says what it does: it takes out the chords and their rows, and the melody stays.
- **The Melody tab's Clear** still clears just the melody, and each row's **×** removes that row.
- **Clearing a bar (my choice):** ✕ beside each bar's count in the melody lane gives three choices:
  - **Everything in it:** its melody notes, and every row over its chords.
  - **Melody:** the notes starting in the bar go. A note ringing into it stops at the barline, and the notes after stay where they are (`clearSpan` in `src/theory/melody.ts`).
  - **Rows:** every row goes silent over the chords sounding in the bar (`silenceAll` in `src/sketch/parts.ts`). A row is set chord by chord, so a chord longer than the bar goes silent through its whole length.

  Chords aren't cleared by bar, because taking one out moves every bar after it; the chord's own ✕ on the strip does that. The lane now shows its bars whenever there are chords, even before a melody, so bars can be cleared from the start. Each one can be undone.

- **Row names:** a row with bars left silent now says so ("Walking, one bar silent") rather than counting them as bars of its own.

## 2026-10-24 — David's notes join Phase 7 as tasks 10 to 15

David wrote down six things to do after trying the app. They join Phase 7 before its gate:

10. Write a phrase into a bar he picks.
11. Rows for the melody, harmonies and countermelody.
12. Separate rows, each with its own clear: melody, arpeggios and lines apart.
13. The playing note's or chord's box stays dark until the next one takes over.
14. Harmonies and countermelody move to their own tab beside Melody.
15. The Harmony cards' note lists are laid out so they read clearly. His screenshot shows them as long grey runs of notes.

None of them has an exit criterion of its own; each is checked when it's built and in David's play-test.

## 2026-10-24 — Writing a phrase into a chosen bar (Phase 7 task 10, David's choices)

Write a phrase in the Melody tab can now write into a bar you pick, not only after the last note. The theory is `phraseSpan`, `placePhrase` and a bar for `generatePhrase` in `src/theory/phrase.ts`, with the cases in `tests/fixtures/phrases-into.ts`.

- **Picking the bar (David's choice: menu and lane):** an **Into** menu beside **How much** offers **After the melody** (as before) or any bar in the lane, and one more. Tapping **▶ Bar n** in the melody lane plays that bar and makes it the active bar too; the active bar is outlined.
- **A bar with notes in it (David's choice: replace them):** the phrase takes their place. It starts on the bar's downbeat and fills what **How much** says from there: four notes, to the bar's end, or two bars.
  - The notes starting in that span go.
  - A note ringing in from before stops at the barline, as clearing a bar does.
  - The notes after stay where they are.
  - **⟲ Undo it** brings the old notes back, and **✂ Trim a note** leaves a rest at the end of the bar.
- **Joining up:** the notes before the bar are what the phrase follows, as with a phrase after the melody. Its last note also leads into the note after:
  - it is less than a 4th away from that note (my choice, matching the leap size the next-note rules turn back from);
  - after a leap, it turns back.

  Other takes are tried first. Only if none can do this is the join left as it falls, and every other rule still holds.

- **An empty bar past the melody** starts with a rest from the melody's end to its downbeat.
- **Every rule a phrase keeps still holds** (the Phase 7 exit criterion): tested over six melodies (major, minor, harmonic minor; 4/4, 3/4 and 6/8; first, middle and empty bars; a note ringing in), all three sizes and twelve takes each. A phrase after the melody comes out exactly as before.
- **Changing the bar** keeps the take as it stands. The next press writes a fresh take into the new bar.

## 2026-10-24 — Rows for the harmonies, and the active bar by tapping (Phase 7 task 11, David's request)

- **A row for each harmony:** every harmony or countermelody playing with the melody now sits on its own row under the melody lane. It is laid out bar by bar like the lane and the line and arpeggio rows, so they all line up under the chords. Its notes are teal, and a note outside the key is dashed. When Play reaches a note, it lights on its own row (`harmonyRows` in `src/workspace/melody-view.ts`).
  - A harmony follows the melody note for note, so its row isn't edited by hand. Tapping a note plays it and says why it's there.
  - The row's **×** stops that harmony, the same as unticking it in the Melody tab. Undo brings it back.
- **The active bar by tapping (David's request):** the active bar no longer needs ▶. Tapping any of these makes its bar the active bar:
  - a chord on the strip;
  - anything in a bar of the melody lane;
  - anything in a bar of a harmony, line or arpeggio row.

  The active bar is outlined on every row. It is still the bar Write a phrase writes into, so tapping a chord also points Write a phrase's **Into** menu at that chord's bar.

- **Task 16 added (David's note):** more control for Write a phrase: more **How much** choices, a set number of notes, and ways of varying how long the notes are. It joins Phase 7 before its gate, for a session of its own.

## 2026-10-24 — Editing a harmony's notes (task 17, David's request and choice)

David asked for a harmony note to be deletable once it's tapped, and agreed each note should be changeable too. He chose that **edits sit on top of a harmony that keeps following the melody**, rather than freezing it into fixed notes. The logic is in `editHarmony`, `harmonyAlternatives` and the edit helpers in `src/theory/harmony.ts`, with the cases in `tests/fixtures/harmony-edits.ts`.

- **Tapping a note** in a harmony or countermelody row plays it, says why it's there and offers:
  - **▼ Octave ▲ Octave**;
  - **Play instead:** what each other harmony would play under that melody note (3rds below, 6ths below, the countermelody and so on), one of each note, chord tones first and notes outside the key last, each explained (my choice of what to offer);
  - **× Take it out**, which leaves a rest;
  - **↺ The harmony's own note**, on a note you've changed.
- **Your notes are purple.** The row's head says **↺ Undo my n changes** to put back every note the harmony worked out. Undo covers each change.
- **An edit belongs to the melody note it was made under** (its onset and its note). If that melody note changes, the edit there goes and the harmony works the note out again. Every other edit stays.
- Stopping a harmony drops its edits; **Clear chords** keeps them along with the melody; **Clear everything** clears them. They're saved with the song (`harmonyEdits` on the progression).
- **Added as Phase 7 task 17**, built in the same session as task 11 at David's request, and ticked as its check passes.

## 2026-10-24 — A Counterpoint tab joins Phase 7 as task 18; saving stays in Phase 10 (David's choices)

- **Counterpoint gets a tab of its own** (David's choice), with as many options as can be made reliably. The plan is:
  - **The five species:** note against note, two against one, four against one, tied across the beat (syncopation), and free (florid).
  - **Above or below** the melody.
  - **Strict or freer rules.** Strict follows the textbook. Freer allows things such as a passing dissonance on a weak beat, for lines that suit guitar.
  - **Every move checked** against the counterpoint rules: consonances on the beat, no parallel 5ths or octaves, dissonances approached and left by step, a cadence at the end. Each break is explained in plain words.
  - **A line plays with the melody** and sits on a row of its own, like a harmony, with its notes editable as in task 17.

  An option goes in only if its rules can be tested with golden fixtures; anything that can't be made reliable is left out and recorded here. Adding the task means Phase 7's gate comes later.

- **Save as, load and a new song** stay where they are, in Phase 10 task 1 (David's choice).

## 2026-10-24 — Rows kept apart, each with its own clear (Phase 7 task 12)

The melody, each line row and each arpeggio row already sat on rows of their own, and each line or arpeggio row had its **×**. Three things still let one row run into another, and they are fixed (`addCell` and `silenceAll` in `src/sketch/parts.ts`, `partLabels` in `src/workspace/parts-view.ts`):

- **The melody's own Clear:** the ♪ Melody row now has **× Clear**. It clears just the melody (its harmonies follow it), and the chords and rows stay. Undo brings it back. The Melody tab's Clear does the same.
- **Clearing a bar of one row (my choice):** a bar's **✕** in the melody lane used to offer only **Rows**, which silenced every row there. It now lists each row by name. Picking one silences that row's bar and leaves the others playing. **Every row** is still there when there's more than one row, along with **Everything in it** and **Melody**. Each row's own bar **×** still works as before.
- **Which row a bar goes into (my choice):** **+** on a bar in the Lines or Arpeggio tab always went into the latest row of its kind. When there is a row of that kind, it now asks: **Into** a row you name, or **A new row** with just that bar. With none, it starts a row, as before. Building a row bar by bar (walking in bar 1, chromatic in bar 3) still works by picking the same row each time. A frozen row takes no bars, as before.
- **Row names told apart:** two rows that would have the same name are numbered, for example "Lines, bar by bar (2)", so the menus can tell them apart.

## 2026-10-24 — Each row keeps its light until its next note (Phase 7 task 13)

The strip's **▶ Play** lit only one note at a time across the melody, its harmonies and every row: whichever note started last. So a held melody note lost its light as soon as a row played its next note. Now each row has a light of its own (`lightsAt` in `src/workspace/along.ts`, tested in `tests/workspace/along.test.ts`):

- **The note or chord sounding stays the darker colour until that row's next note takes over,** whatever the other rows do. That includes a held note and a note tied over the barline.
- **Through a rest (my reading of David's note):** the last note stays lit until the next note on its row. When playback ends, every light goes out.
- **Everywhere the rows play:** the strip's ▶ Play, the Melody tab's Play melody (the harmony rows now light too), and ▶ on a bar of the lane or a row.
- Chords on the strip, and the Arpeggio and Lines tabs' own playback, already held their light until the next one, and are unchanged.

## 2026-10-24 — A Harmony tab (Phase 7 task 14)

The harmonies and the countermelody have moved out of the Melody tab into a **Harmony** tab beside it (`src/workspace/HarmonyPanel.tsx`). They work as before:

- tap a card to hear it with the melody, lit on the instrument;
- **+** plays it with the melody from then on, on a row of its own;
- **More harmonies…** shows the rest, and ⓘ explains each one note by note.

The tab also has its own **▶ Play melody** and **▶ Play with chords** (my choice), so a harmony can be heard without going back to the Melody tab. With no melody yet, it says so and offers **Add a melody**, which opens the Melody tab.

**A fix to task 13:** the Melody tab's **▶ Play with chords** still lit one note at a time across the melody and its harmonies. It now uses a light for each row too, the same as the strip's ▶ Play.

## 2026-10-24 — The Harmony cards' notes, bar by bar (Phase 7 task 15)

Each Harmony card (3rds above, 6ths below, the countermelody, 3rds below and the rest) showed its notes as one long grey run of names. They are now laid out **bar by bar**, one bar to a line with "Bar n" in front (`notesByBar` in `src/workspace/melody-view.ts`). Each note is a teal chip like the notes on the harmony rows, and a note outside the key is dashed, as it is there. Hovering over a note says what it is (chord tone, passing, bent and so on). The card's explanation and ⓘ stay underneath.

## 2026-10-24 — More control for Write a phrase (Phase 7 task 16, David's choices)

Write a phrase in the Melody tab has three new controls (`PHRASE_SIZES`, `PHRASE_RHYTHMS` and `PHRASE_NOTES` in `src/theory/phrase-data.ts`; `generatePhrase` and `phraseSpan` take the options, and `writtenSpan` says where a phrase ends):

- **How much (David's choice):** **Four bars** joins "To the bar's end" and "Two bars". "A few notes" becomes **A set number of notes**.
- **A set number of notes (David's choice: a number box):** **Notes** sets it, from 1 to 16, four to start with. The phrase is exactly that many notes.
- **Rhythm (David's choice: Even, Varied, Mixed):**
  - **Even:** every note lasts the note value chosen under Tap or type.
  - **Varied:** beat by beat from the rhythm table, as bars were written before.
  - **Mixed:** mostly the note value, with the odd note (about one in four, never the first) twice as long.

  Until a rhythm is picked, it follows the size, as before: a set number of notes is even, and bars are varied. With nothing new chosen, every take comes out exactly as it did before.

- **Where it fits:** bars still end at their barline, so the last even or mixed note is cut short if needed. A set number of notes in a varied or mixed rhythm lasts as long as its notes do. Into a bar, it takes the place of the notes it covers.
- **Every rule still holds** (the Phase 7 exit criterion): tested over every golden melody in `tests/fixtures/phrases.ts`, in every size and rhythm, with 1, 7 and 16 notes, four takes each.

## 2026-10-24 — A Counterpoint tab (Phase 7 task 18, David's choices)

A **Counterpoint** tab sits beside Harmony. It writes a line against the melody in any of the five species, above or below, in strict or freer rules. The theory is in `src/theory/counterpoint.ts`, with the species, rules, weights and wording as data in `counterpoint-data.ts`. The golden cases are in `tests/fixtures/counterpoint.ts`.

- **Built on PR #102:** this task needs the Harmony tab and separate rows from tasks 12–16, which were waiting to be merged, so its branch starts from that pull request. Merge #102 first.
- **Species fit the melody note by note (David's choice):** against each melody note the line plays:
  - **1 · Note against note:** one note;
  - **2 · Two against one:** two;
  - **3 · Four against one:** four;
  - **4 · Tied across the beat:** a note that starts halfway through and is held over into the next melody note, after a rest at the start;
  - **5 · Free (florid):** a mix of these, varied note by note.

  The last melody note always gets one note of its own. A note too short to split (pieces under a semiquaver) gets fewer notes; quavers in third species get two each (my choice). Where the melody rests, the line rests too.

- **Strict or freer (David's choice: freer leans on the chords):**
  - **Strict** is two-voice textbook counterpoint against the melody.
  - **Freer** allows:
    - a passing dissonance against a melody note that starts off the beat;
    - neighbour notes in second species;
    - repeated notes, hidden 5ths and octaves, and any consonance to start;
    - more than three 3rds or 6ths in a row;
    - any 6th as a leap;
    - the chord's own notes.

    It prefers chord tones on the beat. A cadence and a unison or octave at the end are strongly preferred, not required.
- **The rules every line is checked against** (`CP_RULES`):
  - **Consonance on the beat:** unisons, 3rds, 5ths, 6ths, octaves and their compounds are consonant; a 4th counts as a dissonance.
  - **Dissonances:** a suspension (above 7–6, 4–3 or 9–8, below 2–3) falls a step to a consonance. A note held over the beat starts as a consonance. Any other dissonance comes off the beat, reached and left by step (passing, or stepping back). In strict second species it can only pass.
  - **Motion:** no parallel or consecutive 5ths or octaves, in either mode. Strict also bans 5ths or octaves on successive beats in second and third species, and hidden 5ths and octaves (a leap into one with the melody moving the same way).
  - **The line's own moves:**
    - no augmented or diminished leaps, 7ths, or leaps over an octave; strict leaps a 6th only when it is minor and rising;
    - a leap of a 5th or more turns back;
    - strict has no repeated notes from second species on.
  - **Shape:**
    - strict keeps unisons for the ends and allows no more than three 3rds or 6ths in a row on the beat;
    - the line stays on its side of the melody, within a 12th.
  - **The ends (strict):**
    - start on a unison, an octave, or a 5th above;
    - end on a unison or octave;
    - step into the end against the melody's step, with one voice moving by a semitone. The leading note is raised for it where the key has none (C♯ in D Dorian), and that's the only note outside the key strict allows.
- **Each break is explained:**
  - the note is outlined in red on the card and on its row;
  - the card lists each break in plain words;
  - ⓘ says why each note is there.

  A line always comes out. The search weighs every break heavily, so it only breaks a rule when the melody leaves no way round, for example when it ends on a leap.

- **What's proven:** against six textbook cantus firmi (D Dorian, E Phrygian, F Lydian, G Mixolydian, A Aeolian, C Ionian), every species, both sides and both modes give a line that keeps every rule and ends on a cadence. That is 120 lines. Against four melodies with rhythm (4/4 with a held note, a minor key with a rest, 3/4, 6/8 in quavers), every line stays on its side within a 12th and never has parallel 5ths or octaves, and any break is tagged and explained.
- **On a row of its own (as a harmony):**
  - **+** keeps a line. It sits under the harmony rows, lights as it plays, and plays with ▶ Play, Play melody and Play with chords.
  - Tap a note to hear it, move it an octave, take it out or play another note in its place. **Play instead** lists the notes that break no more rules first.
  - Your notes are purple and are checked again: a break they make is outlined and explained.
  - An edit stays while the melody note under it is unchanged.
  - **Clear chords** keeps the lines; **Clear everything** clears them. They are saved with the song (`counterpoints` and `counterpointEdits` on the progression).
- **The leading note** is raised only where the key's own note a letter below the melody's last is a whole step below it (C♯ in D Dorian, G♯ in A Aeolian, F♯ in G Mixolydian), never in Phrygian.
- **Checked by the theory reviewer:** every golden line was confirmed by hand. The review found gaps, now fixed and tested:
  - a hidden 5th or octave below the melody, where the melody is the upper voice that leaps, wasn't caught;
  - a 2nd above held over and falling into a unison passed as a suspension (strict allows only a 9–8);
  - a melody rising a whole step to its last note, with the line falling a whole step, was called a cadence;
  - some break wording.
- **Open, for David to decide (not built; decided in the entry after this one):**
  - 5ths or octaves on successive off-beats in fourth species (for example C–C then D–D across a suspension that rises). Many texts count them as consecutive octaves. Adding the rule would change a golden case.
  - The nota cambiata in third species, and the raised 6th before the raised 7th in Dorian and Aeolian (6–7–8 rising into the cadence). Both are textbook; for now strict flags them.
  - A diminished 5th moving to a perfect 5th (unequal 5ths), which some strict texts forbid.
  - Repeated notes in first species: strict allows them but weighs against them. Two golden lines repeat a note once each.
- **Left out as not reliable enough to test:**
  - a chromatic step inside the line (other than the leading note);
  - lines in more than two voices.
- **Search:** a deterministic beam search, so the same melody always gives the same line. It looks one note ahead at the end so the cadence is never cut off. A line is worked out once per melody and kept, so rows don't search again while they play.

## 2026-10-24 — Counterpoint's open questions settled (task 18 follow-up, David asked me to choose)

David asked me to settle the three open counterpoint questions as I judged best for the app. In each case I chose the textbook answer for **strict** counterpoint and left **freer** looser:

- **5ths or octaves on successive off-beats (fourth species) are a break in strict** (`cp-offbeat-parallel`). The ties don't hide them, as most texts say. With David's go-ahead, the golden case "a suspension that rises" now expects this break too: C–C, then D–D on the next off-beat.
- **The nota cambiata is allowed in third and fifth species** (both modes). The figure: step down to a dissonance off the beat, leap a 3rd down, then step back up. The note after the leap must step up, or it's a break (`cp-cambiata`). Golden case: "third species, a nota cambiata".
- **The raised 6th is allowed in strict** where the key lacks it, but only when it steps straight up to the raised leading note (F♯ to G♯ to A in A Aeolian). A line can then climb 6–7–8 into the cadence without an augmented 2nd. Golden case: "second species in A minor, the raised 6th and 7th". In Dorian the 6th is already raised, so nothing changes there.
- **A diminished 5th moving to a perfect 5th, both voices moving, is a break in strict** (`cp-unequal`, unequal 5ths). Freer allows it.
- **Repeated notes in first species stay allowed but weighed against.** Fux repeats a note now and then, and the golden lines that repeat once stay as they are.

All 120 lines against the textbook cantus firmi still keep every rule.

## 2026-10-24 — A ✕ for each bar of the harmony and counterpoint rows (Phase 7 task 19, David's request)

David asked for the harmony and counterpoint rows to match the rest of the UI. Besides the row's own × (which stops the whole row), each bar now has a ✕ in its header, as the melody lane does.

- **✕ on a bar** takes that row's notes out of the bar. Each becomes a rest, as **× Take it out** does for one note. The rest of the row plays on, and a note ringing in from the bar before stays.
- It is one change, so a single **Undo** brings the whole bar back. It counts in the row's **↺ Undo my n changes**.
- The ✕ only shows on bars where the row has notes. Pressing it also makes that bar the active bar, as tapping anywhere in a bar does.
- **A counterpoint line is checked again** without those notes. If taking them out breaks a rule (say, the line now starts on a 3rd in strict rules), that note turns red and says why.
- This is added as Phase 7 task 19 and ticked, with tests that clearing a bar of a harmony and of a counterpoint line leaves every other bar unchanged.

## 2026-10-24 — How often a line moves: Against and Harmonise (Phase 7 task 20, David's request and choices)

David asked for counterpoint lines and harmonies to move in bars and parts of a bar as well as note by note, and for as many options as possible. The steps are worked out in `src/theory/spans.ts` (`melodySpans`, `spanMelody`).

- **The choices:** each melody note (as before, and the default), every 2 bars, every bar, every ½ bar, every ¼ bar or every ⅛ bar.
  - The grid follows the bars, including a change of meter. Every 2 bars counts from bar 1.
  - Where the melody rests, the line rests too.
  - **The melody's last note always starts a step of its own, to the end** (my choice), so a line can close with it and a harmony harmonises the final note.
- **Counterpoint: an Against menu (David's choice: alongside the old way).**
  - The species divide each step: two against one, every bar, plays two half-bar notes per bar. Fourth species ties across the steps, and the shortest-piece rule still applies.
  - The line's beats are the steps.
  - **A held line note may clash with a melody note that passes or steps back** (David's choice): one reached and left by step, with no gap. Any other clash is a break (`cp-melody-clash`), outlined and explained.
  - 5ths or octaves on successive beats are now checked in first species too. With a melody note on each beat, as before, that is the same as parallel 5ths and octaves.
- **Harmony: a Harmonise menu.** On a grid, a harmony harmonises only the melody note sounding at each step, held for the step, so not every note gets a harmony. It is saved as, for example, "3rds above, every ½ bar" (`3rd-above@half`). Each step can be changed, moved an octave or taken out, and cleared with a bar's ✕.
- **Endings:** where a line can't make a cadence whatever it does (for example the melody's last moves fall between steps), it now prefers to end on the melody's note rather than elsewhere. One rule still breaks and is explained, but the line sounds finished.
- **What's proven:**
  - Each melody note gives exactly the lines it gave before (all 120 textbook lines unchanged).
  - Every bar against semibreves gives the same line as each note.
  - Two hand-checked golden cases: every bar against crotchets, with the melody passing (no breaks), and a clash with a melody note reached by a leap (one break).
  - Every species on every grid against four melodies with rhythm: first species has a note on every step, lines stay on their side, end with the melody, never have parallels, and every break is tagged and explained.

## 2026-10-24 — More ways to harmonise, the progression as a row, one set of options at a time (Phase 7 task 21, David's requests)

**More ways to harmonise** (David's ideas, and mine; `HARMONY_FILTERS` and `SPAN_UNITS` in `src/theory/spans.ts`). The Harmonise menu now has two groups:

- **Moving in steps:**
  - each melody note;
  - **every chord, held until it changes** (David's idea; a step to each bar where there are no chords);
  - every 2 bars, bar or ½ bar;
  - **every beat** (new, my choice; in 6/8 a beat is a dotted crotchet);
  - every ¼ or ⅛ bar.

  Every chord and every beat are offered in the Counterpoint tab's Against menu too.

- **Only some notes, each for its own length** (harmony only):
  - **notes on strong beats** (David's idea; beats 1 and 3 in 4/4, the downbeat in 3/4);
  - **notes on a beat** (not the notes between beats);
  - **the first note of each bar**;
  - **long notes**, a beat or more.

  These leave the other notes without a harmony. Your edits and a bar's ✕ work as before.

**The progression as a row** (David's question; my view: yes).

- It is now a card like the melody, harmony and counterpoint rows.
- Play, Undo and Redo stay in its header.
- **▸ More** shows the rest, and **▾ Less** folds them away again:
  - time signature and tempo;
  - octave;
  - Tree;
  - Clear chords and Clear everything;
  - how the chords play.
- It starts folded. The chords and Type chords stay as they were, since they're the progression itself.
- I kept the chords as chips rather than stretching them bar by bar like the rows. The melody lane already names each bar's chord above it, so they still line up.

**One set of options at a time** (David's request).

- Only one of these shows its options at once; opening one closes the others:
  - the picked chord (its info, its ▼ ▲ buttons and + between);
  - a melody note;
  - a bar's clear menu;
  - a harmony or counterpoint note;
  - a note or bar of a line or arpeggio row.
- A click on the background closes them. Clicks on buttons, menus, the instrument and the options themselves don't.
- Picking or adding a chord opens its options, as before.
