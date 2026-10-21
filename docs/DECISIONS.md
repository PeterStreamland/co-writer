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
