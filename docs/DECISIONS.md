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
- **Sus, add and 6th chords** (sus2, sus4, 7sus4, add9, add11, 6) appear only on degrees where the scale holds them: C major has Csus4 but no Fsus4, and Dm6 but no Em6.
- **Which scales stack in thirds:** seven-note scales spelled one letter per degree whose every triad and 7th is a standard chord. That is major, harmonic and melodic minor and all 21 of their modes, plus harmonic major and Lydian diminished from tonal's wider dictionary. Scales such as Hungarian minor, whose stacked "thirds" include diminished 3rds, and every scale that isn't seven notes, use task 4's policy instead.

Chord qualities are stored as lead-sheet symbols in ASCII ('m7b5', 'maj13#11'), with 'M' for a plain major triad; the jazz display style comes with the parser in task 6.

Why: these are the conventions a lead sheet uses, they name every chord the core scales produce, and David can flag any name in the Phase 1 audit table.
