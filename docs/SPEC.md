# Musical Co-Writer — Specification

Oct 21, 2026 · from Claude's interview with David Hathaway

This spec says what the app does and how it behaves. `docs/PLAN.md` says how and in what order we build it, and its decisions table still stands. Where this spec adds to the plan, for example sections, the progression tree and mixed meters, it says so in [Changes to the plan](#changes-to-the-plan). Each section notes the phase it lands in.

## 1. Who and where

- One user, David, writing songs on guitar and keyboard. A writing tool first; ⓘ panels teach on demand.
- **Laptop** (Chrome or Edge) is the main device: full writing sessions with a USB MIDI keyboard.
- **Android phone** (Chrome) is the second device, used for two jobs:
  - **Look-ups:** key explorer and chord shapes while holding the guitar.
  - **Idea capture:** entering a progression or melody by tapping.
  - Every screen must work at phone width, but suggestion, voicing and analysis screens only need to be usable on the phone, not optimised for it. Chrome on Android supports Web MIDI, so MIDI over USB-C/OTG should work there, but it isn't a requirement.
- UI text is in British English.
- Theme follows the OS, designed dark-first, with a light theme as well.

## 2. Workspace layout (Phase 2 onwards)

There is a single workspace, not separate screens. Everything reads from and writes to the current sketch.

```text
┌──────────────────────────────────────────────┐
│ Sketch ▾  Section: Verse ▾  Key: E minor ▾    │  header
│ Style: Rock ▾ ──●──── Pop ▾                   │
├──────────────────────────────────────────────┤
│ Em │ C │ G │ D │ [ + ]          ⟲ ⟳  🌳        │  progression strip
│ ♪ melody lane (Phase 7)                       │
├────────────────────────┬─────────────────────┤
│ Fretboard / Keyboard   │ Explore │ Suggest │  │  side panel tabs:
│ (instrument view)      │ Shapes │ Voice │    │  Explore, Shapes, Suggest,
│                        │ Lines │ Melody │     │  Voice, Lines, Melody,
│                        │ Analyse             │  Analyse
└────────────────────────┴─────────────────────┘
```

- **Header:** sketch picker, section picker, key and mode for the current position, and the style blend control.
- **Progression strip:** the active path of the current section's progression, with undo/redo and a button that opens the tree view. The melody lane sits under it from Phase 7.
- **Instrument view:** fretboard or keyboard, toggled. It highlights the scale, the selected chord, the suggestion being previewed, and any notes held on the MIDI keyboard.
- **Side panel:** one tab per tool. Selecting a chord anywhere, whether in the strip, the explorer or a suggestion, makes it the "current chord" for every tool.
- **Phone layout:** the instrument view and side panel stack vertically. The strip scrolls sideways, and the side panel becomes a bottom sheet.
- The vocabulary is large. Each picker shows common items first and puts the rest behind "More…" (plan, Risks).

## 3. Sketches, sections and song form (data model from Phase 1, UI in Phases 4 and 10)

A **sketch is a song made of sections**.

- **Section:** has a name (Intro, Verse, Pre-chorus, Chorus, Bridge, Solo, Outro, or a custom name). Each section has its own:
  - key and mode
  - meter
  - style blend
  - progression tree
  - melody
  - melody range preset
- **Linked repeats:** a section can be a linked copy of another ("Chorus 2" links to "Chorus"), so editing one edits both. **Unlink** turns it into an independent copy for variation.
- **Song form:** an ordered arrangement list, such as Intro, V, C, V, C, Bridge, C ×2. Each entry points to a section and can have a repeat count. Song playback follows the arrangement.
- **Section-aware suggestions:** the section label lightly adjusts the ranking. Each adjustment is a style-profile weight, so it can be tuned:
  - **Chorus** favours strong tonic arrivals.
  - **Pre-chorus** favours building to V.
  - **Bridge** favours leaving the key.
  - **Intro and outro** favour tonic and pedal ideas.
- Until the section UI arrives, a new sketch starts with one section called "Section 1", so early phases can ignore sections.

## 4. Theory conventions (Phase 1, used everywhere)

These are the musical truths the golden tests check. `.claude/skills/music-conventions/SKILL.md` will summarise them for Claude.

### Note spelling and display

- Every note stores its letter, accidental and optional octave. Pitch numbers are derived from these, never stored on their own (plan).
- Accidentals are shown as symbols: ♭ ♯ 𝄫 𝄪 ♮. Typing `b`, `#`, `bb`, `##` and `x` is always accepted.
- Octaves use scientific pitch notation, with **middle C = C4 = MIDI 60**.
- **Chromatic chords are spelled by function:**
  - ♭VI in C is A♭, not G♯.
  - V/vi in C is E7, which contains G♯.
  - A leading-note chord is spelled up to its target: G♯°7 resolves to Am.
  - The functional spelling stands even when it's awkward (F♭ in A♭ minor). The theory is right, and the ⓘ panel can explain it.
- **Degree labels follow spelling:** in C, E♭ is ♭3 and D♯ is ♯2.

### Keys and modes

- **Key = tonic + mode.** E Dorian and A Mixolydian are keys in their own right, as are major and the three minors. The key signature shown is the parent scale's (E Dorian shows two sharps).
- **Key picker:**
  - Shows the commonly used spelling of each key: D♭ major rather than C♯, and both F♯ and G♭ major.
  - An **enharmonic swap** button switches to the other spelling.
  - All 30 key signatures are reachable.
- **Key changes:** a key can change mid-section at a chord (see 6.4), and between sections.

### Roman numerals

- All numerals are measured from the **major scale on the tonic, with flats shown**. E minor reads i – ii° – ♭III – iv – v – ♭VI – ♭VII, so ♭VI means the same thing in every key and mode. This is rock and pop convention, and it matches the RS 200 corpus.
- Case shows quality:
  - upper case for major (I)
  - lower case for minor (ii)
  - ° for diminished
  - ø for half-diminished
  - \+ for augmented
- Extensions go after the numeral (V7, ii7, ♭VIImaj7). Inversions use figures (V⁶₅) or a slash (V7/3); classical figures are the default.
- Secondary chords are written V/vi or vii°7/V. Borrowed chords show their source mode in ⓘ ("♭VI, borrowed from E Aeolian").
- In modal keys, the numerals are relative to the modal tonic: in E Dorian, A is IV and C♯° is vi°.
- **Nashville numbers** are a label option from Phase 10, and use the same "from the major scale" reference.

### Chord symbols

- **Display style is a setting:**
  - lead-sheet plain (default): Cmaj7, Cm7, Cm7♭5, Cdim7, Caug
  - jazz symbols: C△7, C–7, Cø7, C°7, C+
- The parser accepts both styles regardless of the setting.
- **Ambiguous names (key-aware, bass-aware):**
  - The primary label is the name that fits the current key and keeps the lowest note as the root where possible. With no key, the lowest note is the root.
  - Every other valid name is listed underneath. C6 and Am7/C are the same notes; Cdim7 has four names.
- **Power chords and other incomplete chords** (C5, a 3rd-less triad) are quality-neutral:
  - They count as either major or minor in key finding.
  - They are never forced into a quality in naming or key finding.
  - Their numerals take the case of the key's own chord on that degree (i5 and iv5 in E minor), and upper case on a degree with no chord in the key (♭VI5): David's choice, recorded in DECISIONS.md.
- **Slash chords** show the bass note (C/E). Whether a chord is an inversion or a slash chord over a non-chord bass is worked out by the theory core.

## 5. Instruments (Phases 2–3)

### Guitar

- **Full neck:** horizontal tab view, nut on the left, low string at the bottom. A **left-handed** mirror is a setting.
- **Shape results:** small vertical chord boxes (nut at the top, low string on the left), so several fit side by side, including on a phone.
- Any tuning, string count, capo and fret range (plan). The presets are:
  - standard
  - drop D
  - DADGAD
  - 7-string B standard
- Fret dots only, no finger numbers (plan).
- **Capo:**
  - Chords are named by what sounds.
  - Each shape also gets a capo-relative shape name, e.g. "A (G shape, capo 2)".
  - Frets are numbered from the nut.
- **Fingering defaults:**
  - maximum span of 4 frets, adjustable up to 6
  - frets 0–15, adjustable up to 24
  - Filters as in the plan (inversion, string set, span, open strings, omit the 5th).

### Keyboard

- **Range:** fits the screen. Four octaves (C2–C6) on the laptop, two octaves with an octave scroll on the phone. The view scrolls automatically when MIDI notes are played outside it.
- **Left/right-hand split, default:** the left hand plays the bass note below C3, either the root alone, root+5th or an octave. The right hand plays the voicing around middle C. In an inversion, the chosen bass note goes to the left hand.

### MIDI input (Chrome/Edge; Phase 2 onwards)

- Held notes light up on both instrument views and are named live, with every valid name when the chord is ambiguous.
- **Chord entry:**
  - With **Record chords** on, notes held together for at least 150 ms are committed as one chord when all keys are released.
  - The sustain pedal extends the hold, so you can release the keys and keep the chord.
  - With Record chords off, MIDI only shows and names notes.
- Playing a chord can jump straight to its guitar shapes (plan, Phase 3).
- Melody recording is covered in 7.2.

### Playback (Tone.js)

- **Sounds:**
  - piano
  - clean guitar
  - distorted guitar (for rock and metal, so power chords and "thirds under gain" make sense to the ear)
  - bass (for bass lines)
  - pad/organ (for hearing voice leading)
- **Guitar chords:** played as a **quick strum**, low to high strings about 15 ms apart, using the notes of the fingering on screen.
- **Keyboard chords:** played as block chords.
- A count-in click is heard only when recording (7.2). There is no metronome or drum loop during normal playback.

## 6. Next-chord engine and next-token mode (Phase 4)

### 6.1 Context

- The engine reads the **whole current section**:
  - the last two or three chords most strongly
  - position in the phrase (4- and 8-bar phrase ends favour cadences)
  - how often each chord has already been used (overuse ranks lower)
  - whether the tonic has arrived yet
  - the section label (see 3)
  - the current key and mode
  - the style blend
- **Determinism:** the same section, key and style always produce the same ranking (tested; plan).

### 6.2 Presentation

- **Six to eight suggestions, grouped by category** in rank order within each group. The categories are:
  - Diatonic
  - Secondary
  - Borrowed
  - Chromatic (tritone substitutions and chromatic mediants)
  - Modulation
  - Rock moves
  - Pedal/static
- **Wildcard slot:** comes last and is visually marked. It is a valid but unlikely move, which can come from outside the current style.
  - It is chosen with a seed derived from the input, so it repeats for the same input.
  - An **Another** button steps through other low-ranked valid moves.
- **Clicking a suggestion previews it in context:** it plays the previous chord and then the candidate, and highlights the candidate on the instrument view. A separate **+** accepts it.
- **ⓘ panel:**
  - **First line:** plain musician's language, e.g. "Borrowed from E Phrygian: the ♭II gives a dark, Spanish pull back to Em."
  - **More:** the theory behind it (intervals, function, voice leading), and corpus examples once Phase 9 provides them.
  - **Context notes:** one short line for each context effect that moved the ranking, e.g. "Ranked lower: you've used Am three times" or "Ranked higher: bar 8 is a phrase end".

### 6.3 Chords you add yourself

You can add a chord that wasn't suggested, by typing it, playing it on MIDI or picking it from the explorer.

- It is **always accepted**.
- It gets a Roman-numeral reading and an ⓘ explaining it relative to the key, e.g. "♭II, borrowed from E Phrygian".
- Suggestions carry on from it.

### 6.4 Modulation

Accepting a pivot or modulation suggestion shows a one-tap prompt: **"Continue in A minor from here?"**

- **Yes** inserts a key change at that chord, and later chords are read in the new key.
- **No** keeps the old key and reads the chord as chromatic.

### 6.5 Progression tree and branching

- Each section's progression is stored as a **tree**, and the strip shows the **active path** through it.
- **Alternatives per slot:**
  - Any chord in the strip can hold stacked alternatives (sibling nodes). Swipe or use the arrows to switch which one is active.
  - Switching keeps the chords that follow, unless the chosen alternative already has its own continuation, in which case the strip shows that continuation.
  - An alternative with no continuation of its own shares the slot's existing continuation. Adding or changing a chord after it gives it its own.
- **Tree view** (🌳 button) is an optional overlay that shows every branch. Tap any node to make its path active.
- Undo and redo cover every change to the sketch.

### 6.6 Styles

- **Profiles:** pop, rock and metal first; jazz, folk and classical later (plan).
- **Blend control:** two style pickers and a slider from 100% A to 100% B, snapping in 25% steps. The blend is saved per section.
- **In-app style editor:**
  - A settings page lists each rule or move with a 0–5 weight per style ("♭VI in Metal: ●●●●○").
  - Edits are saved locally.
  - **Export as default** downloads a JSON file for Claude to commit as the new built-in weights.
  - **Reset** restores the built-in weights.
- There is no rating, thumbs or learning from your choices. Rankings come only from rules, profiles and (later) corpus tables.

### 6.7 Passing chords (added 2026-10-22)

- Pick two neighbouring chords in the strip and tap **+ between** to ask for chords to put between them.
- Each option is scored on both sides: how well it follows the first chord, and how strongly it leads into the second. Chords that lead strongly into the second rank highest: its secondary dominant, a chord falling a 5th into it (ii into V), its leading-note chord, or its tritone substitute. Between I and V, ii comes first and V7/V close behind (David's choice, 2026-10-22).
- The options use the same categories, ⓘ, preview and wildcard as next-chord suggestions. The ⓘ says how the chord leads into the second one, e.g. "D7 is V7/V: it pulls the C towards the G".
- Previewing plays all three chords: the first, the candidate and the second. Accepting inserts it into the strip.
- Passing chords are whole chords. Passing notes between chords are a separate feature in Phase 6.

## 7. Time, melody and lines (Phases 6–7)

### 7.1 Time

- **Durations and positions are exact fractions of a whole note** (a quarter note is 1/4, an eighth-note triplet is 1/12), so triplets and odd meters never round.
  - This refines the plan's `beats` field: "beats" in the UI still means the meter's beat unit.
  - Default chord length is one bar.
  - Rhythm stays optional everywhere; untimed chords and notes still get suggestions (plan).
- **Meters:**
  - **Supported:** 4/4, 3/4, 6/8, 12/8 and odd meters such as 5/4 and 7/8.
  - **Compound meters** put the strong beats on the dotted beats (in 6/8: 1 and 4).
  - **Odd meters** have a **grouping** setting (7/8 as 2+2+3 or 3+2+2, default 2+2+3) that decides the strong beats.
  - **Per section:** each section has its own meter.
  - **Per bar:** any bar can override it (a bar of 2/4 in a 4/4 verse, alternating 7/8 and 4/4).
- **Grid:** notes snap to 1/16 by default, with eighth-note triplets available. Snapping can be turned off for a single note.

### 7.2 Melody entry

- **Ways to enter a melody:**
  - tap on the fretboard or keyboard (step entry, with durations set on screen)
  - type note names
  - record on MIDI
- **MIDI recording:**
  - Set the tempo; a one-bar count-in click plays and continues while recording.
  - Notes are snapped to the grid.
  - Recording stops on a button press or when the section ends.

### 7.3 Melody suggestions

- **Range:** each section has a part preset:
  - voice: bass, baritone, tenor, alto or soprano
  - guitar lead or keys lead
  - custom low/high

  The default is tenor, C3–A4. Suggestions stay inside the preset and also lean towards the range already used.

- Next-note rules, motif options and the next-token interface follow the plan, and use the same grouped list, wildcard, preview and ⓘ as chords.

### 7.4 Harmonies and lines

- **Twin-guitar and melody harmony:**
  - **3rds above** is the default, with **6ths below** offered next.
  - Every interval is offered both above and below.
  - **Chord-aware:** harmony stays diatonic but prefers chord tones on strong beats, and is tagged and explained wherever it bends the strict interval.
  - **Power-chord parallels:** 5ths and 4ths below are offered for riffs.
- Bass lines, inner-voice lines and passing/approach lines follow the plan. Every note is tagged as a chord tone, passing note, neighbour, approach or chromatic note, with ⓘ.

## 8. Voicings and lenses (Phase 5)

- **Lens choice:** you pick two to four lenses: classical, rock, open/ambient or jazz.
  - **Laptop:** defaults to Rock and Classical side by side.
  - **Phone:** shows one lens at a time, with a swipe to change.
- **Instrument toggle:** guitar or keyboard, applied to all lens columns at once.
- **Playback:** each column plays the whole progression.
- Rule penalties are weighted per lens and are never global hard rules (plan). The classical lens must still produce no parallel 5ths or octaves (plan exit criterion).

## 9. Chord analysis (Phase 8)

- **Key readings:** the **top two or three keys, each with a confidence level** (clear, likely or ambiguous).
  - Tap a reading to relabel every numeral instantly.
  - **Relative pairs** (G major and E minor) are explained explicitly, e.g. "Same notes; the tonic feels like Em because the progression starts and cadences on it."
  - **Two-chord vamps and power-chord-only riffs** are shown as ambiguous rather than forced into one key.
- Readings with alternatives, borrowed-chord source modes and hand-off buttons follow the plan.

## 10. Saving and export (Phase 10)

- **Autosave:**
  - Every change is saved to the browser immediately, with no Save button.
  - **Version history** lets you roll a sketch back.
  - The app works offline as a PWA (plan).
- **Export and import** a sketch as a `.json` file, for backup and for moving sketches between laptop and phone. There is no cloud sync and no share links.
- The saved format carries a version number, and older files are migrated on load.
- MIDI, chord chart, notation and tab export follow the plan (alphaTab).

## 11. Labels and settings summary

| Setting                     | Options                                                                                     | Default     |
| --------------------------- | ------------------------------------------------------------------------------------------- | ----------- |
| Note labels on instruments  | note names, degrees (Phase 2); Roman numerals and Nashville numbers in the strip (Phase 10) | note names  |
| Chord symbol style          | lead-sheet, jazz                                                                            | lead-sheet  |
| Inversion display           | figures (V⁶₅), slash (V7/3)                                                                 | figures     |
| Handedness                  | right, left                                                                                 | right       |
| Fingering span / fret range | 3–6 frets / 0–24                                                                            | 4 / 0–15    |
| Guitar playback             | strum (fixed)                                                                               | strum       |
| Theme                       | system, dark, light                                                                         | system      |
| Melody range                | part presets, custom                                                                        | tenor C3–A4 |
| Grid                        | 1/8, 1/16, triplets, off                                                                    | 1/16        |

## 12. Core data model (refines the plan)

The plan's types stand. The changes are sections, a progression tree, exact durations and meter maps.

```ts
type Note = {
  letter: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
  accidental: number
  octave?: number
}
type Key = { tonic: Note; mode: string } // mode is a scale id: 'major', 'dorian', 'harmonic-minor'…
type Dur = { n: number; d: number } // exact fraction of a whole note
type Meter = { num: number; den: number; grouping?: number[] } // 7/8 as [2,2,3]
type ChordEvent = { root: Note; quality: string; bass?: Note; length?: Dur }
type ChordNode = {
  id: string
  chord: ChordEvent
  parent?: string
  children: string[]
  keyChange?: Key
}
type Progression = {
  nodes: Record<string, ChordNode>
  roots: string[]
  activePath: string[]
}
type MelodyNote = { note: Note; onset?: Dur; length?: Dur }
type StyleBlend = { a: string; b?: string; mix: number } // mix 0–1, in 0.25 steps
type Section = {
  id: string
  name: string
  key: Key
  meter: Meter
  barMeters?: Record<number, Meter>
  style: StyleBlend
  progression: Progression
  melody: MelodyNote[]
  range: { preset: string; low: Note; high: Note }
  linkedTo?: string // a linked repeat reads content from that section
}
type Sketch = {
  version: number
  id: string
  title: string
  sections: Section[]
  form: { section: string; repeats: number }[]
}
type Suggestion<T> = {
  candidate: T
  score: number
  tags: string[]
  ruleIds: string[]
  explanation: string
  more?: string
  contextNotes: string[]
}
```

## 13. Edge cases the tests must cover

- **Spelling:** functional spellings in awkward keys (F♭ in A♭ minor; G♯°7 in C; double sharps in D♯ minor's harmonic minor).
- **Keys and naming:**
  - modal keys numbered from their own tonic
  - enharmonic key swap preserves every chord's function
  - every name of a symmetrical chord (dim7, aug)
- **Power chords:**
  - stay quality-neutral through naming, key finding and numerals
  - a progression of only power chords
- **Time and meter:**
  - a bar-level meter override inside a section
  - 7/8 groupings change the strong beats
  - triplet durations sum exactly to a bar
- **Progression tree:**
  - switching a slot alternative with and without its own continuation
  - undo across a branch switch
- **Sections:** editing a linked repeat updates its source; unlinking makes an independent copy.
- **Modulation:** accepting with "Yes" relabels later chords; "No" leaves them unchanged.
- **Ranking:**
  - same input gives same ranking and same wildcard
  - "Another" never repeats a wildcard until the list wraps
- **MIDI:**
  - chord commit at the 150 ms threshold
  - sustain pedal hold
  - notes outside the keyboard view trigger a scroll
- **Capo:** sounding names stay correct with capo and alternate tuning combined.
- **Saving:** a saved sketch of an older version migrates and loads.

## Changes to the plan

None of the 13 decisions change. The spec adds:

1. **Sections, linked repeats and song form** in the data model from Phase 1, with the UI in Phase 4 (sections) and Phase 10 (form playback).
2. **A progression tree** with per-slot alternatives and an optional tree view, in Phase 4. This refines "branch to try an alternative".
3. **Exact fractional durations, odd-meter groupings and bar-level meter overrides**, in Phase 6. This refines "chord lengths in beats".
4. **An in-app style editor**, in Phase 4. This refines "editable JSON weights".
5. **More playback sounds:** distorted guitar, bass and pad, in Phases 2–6.
6. **Version history and JSON export/import**, in Phase 10.
7. **Passing chords** between two picked chords, in Phase 4 (added 2026-10-22).

These get dated entries in `docs/DECISIONS.md` in the next Phase 0 session.
