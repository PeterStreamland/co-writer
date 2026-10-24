# Musical Co-Writer — Production Plan

Oct 21, 2026 · @David Hathaway

We build the co-writer as a browser app in TypeScript, in eleven gated phases: a tested theory core first, then the instrument views, then the suggestion engines, then real-world data and polish. Claude Code writes and tests the code; you direct it and do the musical testing. No LLM is needed: suggestions are rule-based, and openly licensed chord corpora exist to weight them later.

## Decisions so far

Thirteen decisions are settled; anything that changes them gets a dated entry in `docs/DECISIONS.md`.

| Area | Decision | Why |
| --- | --- | --- |
| Platform | Browser app in TypeScript, built with Vite | Runs on any device, easy audio and MIDI, close to your Three.js experience |
| Who codes | Claude, through Claude Code, including all git and GitHub work; you direct and play-test, with no code to read | You bring musical judgement; Claude brings implementation and tests |
| Theory primitives | [tonal](https://github.com/tonaljs/tonal), wrapped behind our own interfaces | TypeScript, pure functions, scale and chord dictionaries, chord detection; the wrapper lets us swap it |
| Audio, MIDI, notation | Tone.js for playback, Web MIDI for your USB keyboard from Phase 2, alphaTab for standard notation and tab | Candidates only until the Phase 0 spike confirms them |
| Suggestion engine | Rules generate candidates, style profiles weight them, corpus statistics added later | Transparent, free to run, explainable |
| Interaction | Next-token mode: ranked options, you pick one, your pick becomes context for the next round | Your idea; keeps the artist deciding |
| Explanations | Each rule carries its own explanation template, shown behind an ⓘ button | Works offline, costs nothing, always matches the rule that fired |
| Styles | Pop, rock and metal first; jazz, folk and classical as later profiles; any two can be blended | Matches your priorities; blending gives "rock with a classical feel" |
| Voicings | Several suggestion sets side by side, one per style lens | Your idea; no single rulebook wins |
| Time | Data model carries optional beat positions from day one; a simple beat grid arrives in Phase 6 | Chords don't need it; melody and lines do |
| Vocabulary | Large and data-driven: scales, chords and rules are data, not code | Adding a scale is a data edit, not a feature |
| Guitar | Any tuning, string count, capo and fret range; fret dots only, no finger numbers | Nearly free once the fretboard is an array of open-string pitches |
| Purpose | Writing tool first; ⓘ panels teach on demand | Your call |

## Your open points answered

### Does it need to know about time?

For chords, no: harmony suggestions work without rhythm. For melody and harmonic lines, a little: whether a note is a chord tone on a strong beat or a passing note on a weak one is most of melodic grammar, and a passing-note line needs to know how many notes fit before the next chord.

So there is no sequencer. Each chord gets a length in beats (default one bar), each melody note an optional beat position, and the engine knows which beats are strong. You can ignore all of it and still get suggestions; filling it in makes them sharper.

### LLM compute

You wouldn't need local compute: a hosted model such as the Claude API runs on Anthropic's servers and is billed per request. We don't need one, though. The ⓘ explanations come from templates attached to each rule, so they are free, instant and work offline. An LLM stays an optional late add-on for free-form "why does this work?" questions.

### Corpus data

Usable data exists, and the two best-curated sets have permissive licences. The rock corpus also includes melodies, which helps Phase 7.

| Dataset | What it holds | Size | Licence | Our use |
| --- | --- | --- | --- | --- |
| [McGill Billboard](https://ddmal.music.mcgill.ca/research/The_McGill_Billboard_Project_%28Chord_Analysis_Dataset%29/) | Expert chord transcriptions of Billboard Hot 100 songs from 1958–1991, at beat level, with song structure | 890 chart slots, 740 songs | CC0 (public domain); citation requested | Pop and rock chord-transition weights |
| [RS 200 rock corpus](https://rockcorpus.midside.com/) | Roman-numeral analyses of each song by two analysts, melodic transcriptions and timing data | 200 rock songs | CC BY 4.0 (credit the authors) | Rock harmony plus melody-over-chord statistics |
| [Chordonomicon](https://huggingface.co/datasets/ailsntua/Chordonomicon) | Chord progressions with genre, sub-genre, release date and section labels, scraped from user-submitted chord sheets | 666,000+ songs | MIT, as published | Genre-specific weights including metal; noisy, so filter and sanity-check |
| [Hooktheory Trends API](https://hooktheory.com/api/trends/docs) | Next-chord probabilities from TheoryTab | Live API, 10 requests per 10 seconds, account needed; no full data dump | Hooktheory's terms | Cross-check our weights; not a dependency |

The rock corpus authors found IV is the most common chord after I and often leads back to the tonic ([source](https://labs.sonicfield.org/library/a-corpus-analysis-of-rock-harmony)): exactly the kind of fact a style profile encodes. As the app is for you alone, the licence risk is low; if that ever changes, ship only derived transition tables and recheck each licence first. I'm not a lawyer.

## Architecture

One pure, tested theory core sits under everything, and all four suggestion features share one engine, so explanations come free with every suggestion.

&#91;embedded content: architecture · five layers, two side inputs\]

The interface never does theory itself: it asks the engine, which asks the instrument models and the core. Swapping tonal, adding a scale or retuning a style touches one box, not the whole app.

### Core data model

Notes keep their spelling; beats are optional everywhere, so the app works without rhythm and gets sharper with it.

```ts
type Note = { letter: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'; accidental: number; octave?: number } // -1 flat, +1 sharp
type ChordEvent = { root: Note; quality: string; bass?: Note; beats?: number }
type MelodyNote = { note: Note; onsetBeat?: number; beats?: number }
type Sketch = { key: Note; scale: string; meter?: [number, number]; chords: ChordEvent[]; melody: MelodyNote[] }
type Suggestion<T> = { candidate: T; score: number; tags: string[]; ruleIds: string[]; explanation: string }
type StyleProfile = { id: string; weights: Record<string, number> } // a blend is a weighted average of two
type Fretboard = { tuning: Note[]; capo: number; frets: number } // string count = tuning.length
```

## Roadmap

Eleven phases run in order, each ending at a gate; the only flexible one is Phase 9, which can start once Phase 4 is done.

&#91;embedded content: roadmap · 11 phases, 10 gates\]

Phases 2 to 8 each deliver one of the features you asked for; Phases 0 and 1 build what they stand on, and 9 and 10 sharpen and finish them. There are no dates: pace depends on how many sessions you run a week, so the gates set the rhythm instead.

## Phases 0–3: foundations

These four phases produce a correct theory core and the first two features you asked for: the key explorer and fingerings/inversions. Each phase lists what to build, the exit criteria that must all be ticked before the next phase starts, and the test only you can do.

### Phase 0 — Setup and spec

Goal: an empty app that builds and deploys, an agreed spec, and verified libraries.

1. On GitHub, create a public repo with a README (GitHub Pages is free only for public repos on the Free plan: [source](https://docs.github.com/en/get-started/learning-about-github/githubs-plans)); start a Claude Code session on it at claude.ai/code. ✅
2. Paste this plan, exported as Markdown, for Claude to save as `docs/PLAN.md`. ✅
3. Have Claude scaffold Vite, TypeScript, Vitest, ESLint and Prettier. ✅
4. Have Claude add a GitHub Actions workflow that runs the checks and publishes the app to GitHub Pages after every merge; you switch Pages on once. ✅
5. Run Claude's interview (kick-off prompt below) to produce `docs/SPEC.md`. ✅
6. Add `CLAUDE.md` (starter below) and `docs/DECISIONS.md`. ✅
7. Add hooks: typecheck and tests after edits; a Stop hook that won't let a task finish while tests fail. ✅
8. Library spike: tonal spells every key correctly, Tone.js plays a chord in your browser, Web MIDI sees your USB keyboard in Chrome or Edge. ✅

- [x] `npm run dev`, `npm test`, `npm run lint` and `npm run typecheck` all succeed
- [x] You have agreed `SPEC.md`
- [x] Spike results are in `DECISIONS.md`, with any failed library replaced
- [x] The published app opens on your laptop and phone, and updates after each merge

Your test: open the app, hear a C major chord, and see a note you play on your keyboard appear on screen. ✅

### Phase 1 — Theory core (no UI)

Goal: a pure, fully tested TypeScript module that is the single source of musical truth.

1. Note and interval types that keep spelling (letter, accidental, octave); pitch numbers are derived, never stored alone. ✅
2. Scale dictionary as data: major and its modes, harmonic and melodic minor and their modes, pentatonics, blues, whole-tone, diminished, bebop and tonal's wider dictionary. ✅
3. Diatonic chords for seven-note scales: triads, 7ths, 9/11/13 extensions, sus and add chords. ✅
4. A policy for scales that aren't seven notes: show every dictionary chord whose notes all sit in the scale. ✅
5. Roman-numeral labels, including borrowed and secondary chords. ✅
6. A chord-symbol parser and namer that returns every valid name (C6 and Am7 are the same notes). ✅
7. Inversions for any chord. ✅

- [x] Golden tests pass for all 15 major and 15 minor key signatures (F# major spells E#, C♭ major spells F♭)
- [x] Diatonic chord qualities are correct for major, natural/harmonic/melodic minor and all seven modes
- [x] At least 200 chord symbols round-trip: parse, name, parse again
- [x] The core imports no UI, audio or DOM code

Your test: Claude generates a table of every key's scales and chords; you audit it as a musician and flag anything wrong. The table is ready at `#/audit` on the published app. ✅

Gate passed: the theory-reviewer confirmed every exit criterion, and the release is tagged `v0.1-theory-core`. ✅

### Phase 2 — Key explorer and playback

Goal: the first usable screen, covering your first feature request.

1. Key and scale picker showing the interval pattern and degree names. ✅
2. Rows of diatonic triads, 7ths and extended chords; click any chord to hear it. ✅
3. Keyboard view and full-neck fretboard view with an instrument toggle; scale notes highlighted, root marked, labels switchable between note names and degrees. ✅
4. Playback through Tone.js with a piano and a clean-guitar sound. ✅
5. Tuning presets wired in now (standard, drop D, DADGAD, 7-string B standard), ready for Phase 3. ✅
6. MIDI input from your USB keyboard in Chrome or Edge: notes you play light up on both views, and a held chord is named, with every valid name when it's ambiguous. ✅
7. Workspace layout pass: arrange the screen as SPEC 2 sketches it, with the header, the instrument view beside a side panel (Explore holds the scale and chord rows), and on a phone the side panel stacked underneath. Layout only; the visual design (colours, type, spacing, themes) waits for the polish work near the end. ✅

- [x] Any key and scale shows correct notes on both instruments, checked automatically against Phase 1
- [x] Every highlighted note plays the right pitch (tests compare pitch numbers)
- [x] Changing tuning moves the fretboard highlights correctly
- [x] Notes and chords played on your keyboard appear and are named correctly, with no noticeable lag
- [x] Usable on your phone's screen

Your test: spend 20 minutes in keys you actually write in; note what you reach for that isn't there.

Gate passed: every exit criterion is ticked, David closed the phase, and the release is tagged `v0.2-key-explorer`. ✅

### Phase 3 — Fingerings and inversions

Goal: cycle any chord through playable guitar shapes and keyboard voicings.

1. Fretboard model: tuning as an array of open-string pitches, plus string count, capo and fret range. ✅
2. Fingering search: for each string, every fret that gives a chord tone, or muted; keep shapes with all required tones (5th optional), the right bass note for the inversion, and a span within the limit. ✅
3. Playability score: span, barre needed, muted inner strings, open strings, neck position. ✅
4. Filters: inversion, string set, maximum span, open strings on or off, omit the 5th. ✅
5. Grouping by CAGED shape in standard tuning. ✅
6. Keyboard voicings: close, open, drop-2, drop-3, spread, and a left-hand/right-hand split. ✅
7. Play a chord on your MIDI keyboard and jump straight to its guitar shapes. ✅
8. Chord boxes beside the fretboard (David's choice): the current chord's shape as a small vertical box (nut at the top, fret numbers underneath) to the right of the full neck, with ◀ ▶ arrows to step through its shapes, positions and inversions. The shape on show is also marked on the neck. ✅
9. Chord-tone colours (David's choice), built with the chord boxes: a third label setting, Chord tones, beside Note names and Degrees. The current chord's notes are coloured by their interval, with one colour each for root, 3rd, 5th and 7th and one shared colour for 9ths, 11ths, 13ths and altered notes. Each dot is labelled with its interval (R, ♭3, 5, ♭7, 9), and the rest of the scale fades to grey. The chord boxes use the same colours. With no chord selected, the views show the usual scale colours. ✅

- [x] For 30 common chords in standard tuning, the textbook shapes you supply appear in the top five
- [x] Every result is physically valid: one note per string, span within the setting
- [x] Drop D and 7-string fixtures produce correct shapes
- [x] Search returns in under 50 ms per chord

Your test: play the top shapes for those 30 chords on guitar; flag anything awkward so the scorer gets tuned.

Gate passed: the theory-reviewer confirmed every exit criterion, David closed the phase, and the release is tagged `v0.3-fingerings`. ✅

## Phases 4–7: suggestion engines

These phases build the four judgement features on one shared pattern: generators propose candidates, a style profile scores them, and every suggestion carries its tags and explanation.

### Phase 4 — Next-chord engine, next-token mode and ⓘ

Goal: pick a chord, get ranked and explained next-chord options, accept one and go again.

1. A Suggestion object: candidate, score, category tags, rule ids, explanation. Every later engine reuses it. ✅
2. Candidate generators: diatonic function (tonic, predominant, dominant), secondary dominants and leading-note chords, modal interchange, tritone substitution, chromatic mediants, pivot chords for modulation, pedal and static harmony, and rock moves (♭VII, ♭VI, ♭III, power-chord motion). ✅
3. Style profiles v1 for pop, rock and metal as editable JSON weights, with blending of any two. ✅
4. A ranker that shows the top six to eight across categories, plus one wildcard slot: a valid but unlikely move. ✅
5. A progression strip: accept to get the next round, undo, or branch to try an alternative. ✅
6. An ⓘ panel per suggestion from the rule's template, for example: "E7 is V7/vi, the dominant of A minor, pulling towards Am; its G# is A minor's leading note." ✅
7. Passing chords: pick two neighbouring chords in the strip and ask for chords to put between them, ranked by how well they leave the first chord and lead into the second, with the same categories, ⓘ and preview (added 2026-10-22, David's idea). ✅
8. Chords for a chord's place: tap a chord in the strip for chords that could stand there, after the one before and leading into the one after; + makes it an alternative there (added 2026-10-23, David's request). ✅

- [x] Every suggestion carries a category and an explanation
- [x] The same input and profile always give the same ranking (tested)
- [x] Switching profile moves the ranking the expected way (metal ranks ♭VI and ♭VII above where pop does)
- [x] For 10 known progressions, the real next chord appears in the top eight for the matching style
- [x] Between two chords, every passing suggestion explains how it leads into the second chord, and the textbook bridges appear (V7/V between I and V, ii between I and V, V7 between ii and I)

Your test: build five progressions in different styles and rate how often the options are ones you'd consider.

### Phase 5 — Voicings and voice leading

Goal: give a progression, get voicings that move well, in several style lenses side by side.

1. Progression entry by typing chord symbols or playing each chord on your MIDI keyboard (Phase 8 builds analysis on this). ✅
2. Voice-leading cost: total semitone movement, common tones kept, voice crossing. ✅
3. Rule checks as weighted penalties per lens: parallel 5ths and octaves, leading-note and 7th resolution, spacing, low-register muddiness, and thirds under high gain. ✅
4. Lenses: classical (smooth, strict), rock (power chords, open strings, parallels fine), open/ambient (spread, sus, add9) and jazz (drop-2, rootless, shells). ✅
5. Two to four lenses shown side by side on guitar and keyboard, each with playback. ✅
6. Another take on every lens: another smooth path that keeps the lens's strict rules, back to its best with ↺ (added 2026-10-23, David's request). ✅
7. Tap a chord in a lens column for the lens's other voicings of it and other chords for its place, swapped into that column until it is used (added 2026-10-23, David's request). ✅

- [x] The classical lens produces no parallel 5ths or octaves across the test progressions
- [x] Every lens beats a root-position baseline on average voice movement
- [x] Every guitar voicing passes the Phase 3 playability rules

Your test: run three of your own progressions through every lens; pick favourites and note why.

### Phase 6 — Beat grid and harmonic lines

Goal: lines within and between chords, chosen by mode.

1. Minimal time: chord lengths in beats, strong and weak beats, time signature. ✅
2. An Arpeggio tab beside Voice, for trying arpeggios without adding them to the progression (added 2026-10-22, David's idea). Pick a chord, or step through the progression, and an arpeggio: triad, 7th, 9th, 11th or 13th, or a lens's colours. Choose a pattern (up, down, up and down, broken 3rds, and so on), a rate (8ths, triplets, 16ths) and a range. Hear it at the tempo, with each note lit and labelled (R, 3, 5, 7, 9…) on the fretboard or keyboard; on guitar, in one position or as a run across the neck. ✅
3. Line modes: inner-voice lines (from Phase 5); bass lines (root, root–5th, approach notes, walking, pedal); passing and approach notes between chords (scale steps, chromatic, enclosures). ✅
4. Each line is a Suggestion, tagged chord tone, passing, neighbour or approach, with ⓘ. ✅
5. Chords and lines play back together. ✅ A Wildcard line joins the line modes (added 2026-10-23, David's idea).
6. Editing lines (added 2026-10-23, David's request): how many notes a bar, for the whole line and bar by bar (1 to 16, kept when the line changes, each bar refreshable for a new take by the rules); tap a note for notes to play in its place, ranked like chord suggestions; add passing, approach and other notes after it, or take it out. An edited bar keeps its notes when its chord changes. ✅

- [x] Lines land on a chord tone at each chord change unless tagged otherwise
- [x] Every note outside the scale is tagged and explained
- [x] Lines fit the beats available
- [x] Every arpeggio note is a tone of the chord or its chosen extensions, labelled by its interval, and the pattern fits the rate and beats chosen

Your test: generate a bass line and a passing-note line over two progressions and play them on guitar; play arpeggios of three chords in two patterns and check the notes and fingerings on the neck.

### Phase 7 — Melody suggestions and melody-based lines

Goal: enter a few notes and get next-note options; add harmonies and countermelodies to a melody.

1. Melody entry: click on the fretboard or keyboard, type note names, or play it on your MIDI keyboard, with rough timing snapped to the beat grid. ✅
2. Next-note generator: scale membership, chord tones on strong beats, mostly steps, a change of direction after a leap, tendency notes (7 to 1, 4 to 3), range and contour limits. ✅
3. Motif awareness: offer a repeat, a sequence (transposed repeat) or a varied repeat of an earlier motif. ✅
4. The same next-token interface as Phase 4. ✅
5. Melody-based lines: diatonic 3rds and 6ths (twin-guitar harmony) and a contrary-motion countermelody. ✅
6. The rows under the progression and the melody lane line up bar by bar under the chords, and a row can be frozen into notes to edit by hand (added 2026-10-23, David's request). ✅
7. Generate a phrase: one button that writes the next few notes, or a bar or two, by choosing from the next-note suggestions with a little chance, following every next-note rule; another press gives another take, and the phrase can be kept, trimmed or undone (added 2026-10-23, David's request). ✅
8. Chord styles (added 2026-10-24, David's request): how chords are played, from a menu above the chord names, for the whole progression and changeable on any single chord. Block (all together, as now), strum, pulse on every beat, bass then chord ("oom-pah"), broken (rolled), off-beat stabs, and a down-up strum pattern. Playback, rows and saving follow it. ✅
9. Inversions before octaves (added 2026-10-24, David's request): ▲ ▼ on a chord step through its inversions before moving a whole octave (C, C/E, C/G, then C an octave up), on keyboard and guitar (the nearest playable shape of each inversion). The chord always shows which it is, for example "1st inversion" or "+1 octave", so an inversion step can't be mistaken for a perfect-octave move. ✅
10. Write a phrase into a chosen bar (added 2026-10-24, David's note): the Melody tab's Write a phrase lets you pick which bar is active, the bar the phrase is written into, rather than always after the last note. ✅
11. Rows for the melody, harmonies and countermelody (added 2026-10-24, David's note): each plays on its own row under the chords, lined up bar by bar with the others. ✅
12. Separate rows with their own clear (added 2026-10-24, David's note): the melody, each arpeggio row and each line row sit on rows of their own, each with its own delete or clear, so clearing one never touches another. ✅
13. Hold the light while a note sounds (added 2026-10-24, David's note): when chords, melody or arpeggios play, the box of the note or chord sounding stays the darker colour until the next one takes over, including through held notes. ✅
14. A Harmony tab (added 2026-10-24, David's note): harmonies and the countermelody move out of the Melody tab into their own tab beside it. ✅
15. Fix the harmony cards' layout (added 2026-10-24, David's note): the note lists in the Harmony cards (3rds above, 6ths below, countermelody, 3rds below) run on in long grey blocks; show them so they read clearly, for example bar by bar. ✅
16. More control for Write a phrase (added 2026-10-24, David's note): more choices of How much, a set number of notes, and ways of varying how long the notes are. ✅
17. Edit a harmony's notes (added 2026-10-24, David's request): tap a note in a harmony or countermelody row to take it out, move it an octave or play another note in its place; the harmony keeps following the melody with your notes on top. ✅
18. A Counterpoint tab (added 2026-10-24, David's request): its own tab, with as many options as can be made reliably. Lines against the melody in each of the five species: note against note, two against one, four against one, tied across the beat, and free (florid). Each can go above or below the melody, in strict or freer rules. Every move is checked against the counterpoint rules (consonances on the beat, no parallel 5ths or octaves, approach and leave dissonances by step, a cadence at the end), and each break is explained. A line is heard with the melody and kept on a row of its own, like a harmony, with its notes editable as in task 17. ✅
19. A ✕ for each bar of a harmony or counterpoint row (added 2026-10-24, David's request): like the melody lane's, it takes that row's notes out of the bar and leaves the rest. ✅
20. How often a line moves (added 2026-10-24, David's request): a counterpoint line can move against each melody note or on a steady grid (every 2 bars, bar, ½ bar, ¼ bar or ⅛ bar), and so can a harmony, which then harmonises only the note sounding at each step. ✅
21. More ways to harmonise, and tidier rows (added 2026-10-24, David's requests): harmonies on strong beats, on the beats, on each bar's first note, on long notes, held through each chord or on every beat; the progression as a row card with its less-used controls folded away; and only one set of options open at a time, closed by a click on the background. ✅
22. The progression on the timeline, and more chord patterns (added 2026-10-24, David's requests): the chords laid out bar by bar like the other rows, time and tempo beside the key, and twelve more ways for chords to play. ✅
23. MIDI controls fold away at the top (added 2026-10-24, David's request). ✅

- [x] Every suggestion stays in range and is tagged (chord tone, passing, neighbour, leap, chromatic)
- [x] A motif option appears whenever the melody contains a motif
- [x] Twin-harmony lines stay diatonic unless tagged
- [x] A generated phrase follows every next-note rule: in range, chord tones on strong beats, and a change of direction after a leap
- [x] Every chord style fills each chord's length exactly, and a single chord's own style overrides the progression's
- [x] Stepping ▲ ▼ visits every inversion of the chord before the next octave, and each step is labelled as an inversion or an octave

Your test: start ten melodies from a few notes each and rate whether the options sound musical.

## Phases 8–10: analysis, data and polish

These phases add your fifth feature, swap hand-tuned weights for real statistics where that helps, and make the app something you write with day to day. Phase 9 can start any time after Phase 4.

### Phase 8 — Chord analysis

Goal: enter a progression and get its key, Roman numerals with alternatives, and one-click voicings, substitutions and lines.

1. Key finding across all keys and modes, returning the top candidates with scores.
2. Roman-numeral readings with alternatives (secondary dominant or brief modulation), and borrowed chords flagged with their source mode.
3. Hand-off buttons: voice this (Phase 5), suggest substitutions (Phase 4 engine), suggest lines (Phase 6).

- [ ] On 20 progressions with known analyses, the correct key is in the top two for at least 18
- [ ] Borrowed chords are flagged with their source mode
- [ ] Your E minor song with modal borrowing is analysed in a way you agree with

Your test: analyse five songs you know well and check the readings.

### Phase 9 — Corpus weights

Goal: replace hand-tuned weights with real statistics wherever they produce better suggestions.

1. An offline script, not shipped in the app, that parses McGill Billboard, the RS 200 corpus and Chordonomicon filtered by genre.
2. Convert every song to key-relative Roman numerals; compute chord-transition and melody-over-chord tables per style.
3. Ship only the small derived tables; a toggle compares hand-tuned and corpus weights.

- [ ] One command regenerates every table from the raw data
- [ ] Corpus weights beat hand-tuned weights on the Phase 4 top-eight test, or we keep the hand-tuned ones
- [ ] Licence and citation notes are recorded in `DECISIONS.md`

Your test: a blind A/B, rating suggestions without knowing which weights produced them.

### Phase 10 — Polish, save and export

Goal: a tool you can write a song with from start to finish.

1. Save and load sketches locally; installable as an offline app (PWA).
2. An on-screen score showing standard notation and tab together, plus export as MIDI file, chord chart, notation and tab, all via alphaTab.
3. Keyboard shortcuts and accessibility; label settings for note names, degrees, Roman numerals and Nashville numbers.
4. Later options, only if wanted: LLM-written answers to free-form questions, and single-note guitar input through your audio interface (pitch detection).

- [ ] A sketch survives a reload and works offline
- [ ] Exported MIDI opens correctly in your DAW
- [ ] Exported notation and tab match the voicings on screen

Your test: write one complete song section with the app.

## Working with Claude Code

Claude Code works best with small tasks it can verify, a short `CLAUDE.md`, and a fresh context for each task. The phases above are already cut that way. Its main constraint is the context window: performance drops as a session fills up ([best practices](https://code.claude.com/docs/en/best-practices)).

### Where to run it

You use Claude Code on the web (claude.ai/code), linked to GitHub. Each session runs on a fresh cloud machine that clones the repo, works on its own branch and opens a pull request; you merge it with one click. The cloud machine can't play you audio or see your MIDI keyboard, so the app is published to GitHub Pages after every merge and you test it there, on laptop or phone.

Skip Claude Code [Projects](https://code.claude.com/docs/en/claude-projects) for now. They run parallel cloud sessions, which use a Pro plan's limits faster and need extra GitHub setup. One local session at a time suits this build.

### Working within Pro limits

Pro gives a rolling allowance with a session limit and a weekly limit, shared across all models ([usage limits](https://code.claude.com/docs/en/errors)).

- Run one session at a time and keep each to one task.
- Type `/usage` to see what's left and when it resets.
- Save subagent reviews for phase gates, since each one reads the work afresh.
- If you hit a limit mid-task, Claude Code can wait and carry on after the reset.

### Repo files that steer Claude

| File | What goes in it |
| --- | --- |
| `CLAUDE.md` | Commands, architecture rules, testing rules and gotchas, kept short (starter below); loaded every session |
| `docs/SPEC.md` | What the app does, written from Claude's interview with you |
| `docs/PLAN.md` | This plan exported as Markdown; Claude ticks tasks off |
| `docs/DECISIONS.md` | One dated entry per decision and its reason |
| `.claude/skills/music-conventions/SKILL.md` | Spelling, chord-naming and Roman-numeral conventions, loaded only when relevant |
| `.claude/skills/next-task/SKILL.md` | A workflow you trigger: read `PLAN.md`, take the next unticked task, plan, build with tests, run checks, tick it off |
| `.claude/agents/theory-reviewer.md` | A subagent that reviews a diff for musical correctness against `SPEC.md` |
| `.claude/settings.json` | Hooks: typecheck and tests after edits; a Stop hook that won't let a task end with failing tests |

Hooks are the right home for anything that must happen every time, because `CLAUDE.md` instructions are advisory and hooks always run.

### The rhythm for each task

1. Start fresh: open a new session from the sidebar for every task (`/clear` doesn't work in web sessions).
2. Plan: switch the mode menu to plan mode and ask Claude to plan the next `PLAN.md` task; reply with any changes before approving.
3. Build: approve the plan; Claude writes code and tests and runs them until they pass.
4. Review: run `/code-review`, and save the theory-reviewer subagent for phase gates to spare your Pro limits. A fresh reviewer isn't biased towards code it just wrote.
5. Merge: Claude commits, ticks `PLAN.md` and opens a pull request; you click Merge and the published app updates shortly after.
6. Play-test: check the change on the published app, the one check only you can do. Anything wrong goes into the next session.

### Habits that keep it on track

- Ask for evidence (test output, a screenshot) rather than accepting "done".
- After two failed corrections on the same issue, start a new session and re-prompt with what you learned.
- Stop Claude mid-action as soon as it heads the wrong way, then redirect it.
- Name each session with `/rename <name>` after its phase and task so you can find it in the sidebar.
- Use `/compact` if a long session starts to drift.
- If a `CLAUDE.md` rule keeps being ignored, the file is too long or the rule should be a hook.

### The phase gate

A phase is finished only when all of these hold; then the next phase starts in a fresh session.

- [ ] All tests, lint and typecheck pass
- [ ] A reviewer subagent confirms each exit criterion with evidence
- [ ] Your play-test is done and its checkbox ticked
- [ ] `DECISIONS.md` is updated
- [ ] The commit is tagged (for example `v0.3-fingerings`)

### Who does what

You are product owner and musical QA: you set priorities, supply the musical facts tests check against (shapes you expect, analyses you agree with) and rate suggestions. Claude handles architecture, code, tests, reviews and keeping the docs current. You never need to read code: Claude ends every task with a plain-English summary of what changed and a short list of things to try.

## Starter CLAUDE.md and kick-off prompt

Paste the first block into `CLAUDE.md` at the repo root after scaffolding; refine it as the build teaches us what Claude gets wrong. Each line should earn its place: if removing it wouldn't cause a mistake, cut it.

```text
# Musical Co-Writer

Browser app for songwriting on guitar and keyboard, for David's personal use.
Spec: docs/SPEC.md. Plan and exit criteria: docs/PLAN.md. Decisions: docs/DECISIONS.md.

## Commands
- npm run dev: local app (cloud sessions can't show it to David; he tests the GitHub Pages build)
- npm test: Vitest (while iterating, run one file: npx vitest run <path>)
- npm run lint / npm run typecheck

## Architecture rules
- src/theory is pure TypeScript: no UI, audio or DOM imports
- Notes always carry spelling (letter, accidental, octave); never store a bare pitch number
- Scales, chords, style profiles and rules are data, not code
- Every suggestion is a Suggestion: candidate, score, tags, ruleIds, explanation
- Third-party theory libraries sit behind our own interfaces in src/theory

## Testing
- Every theory function has unit tests; musical truths live in tests/fixtures
- Never edit a golden fixture to make a test pass: ask David

## Working with David
- David doesn't read code: end every task with a plain-English summary of what changed and two or three things to try in the app
- Handle all git and GitHub work yourself: finish each task on its branch with a pull request and tell David it's ready to merge
- One PLAN.md task per session; tick it off only when its check passes
- Record any decision that changes the plan in docs/DECISIONS.md
- British spelling in UI text
```

Then open the first session with this prompt. It follows the interview pattern Claude Code's docs recommend for larger features: Claude asks the hard questions, writes the spec, and implementation starts in a fresh session.

```text
I want to build a browser-based musical co-writer for guitar and keyboard.
docs/PLAN.md holds our agreed production plan. Read it, then interview me in
detail using the AskUserQuestion tool about anything it leaves open: UI and
workflow, edge cases, theory conventions and trade-offs. Don't ask what the
plan already answers; dig into the hard parts I might not have considered.
When we've covered everything, write docs/SPEC.md and stop.
```

Once `SPEC.md` exists, start a new session for the rest of Phase 0 (step 6 onwards).

## Risks

The biggest risk is bland suggestions from a purely rule-based engine; the wildcard slot, style blending and Phase 9's corpus weights all target it.

| Risk | Mitigation |
| --- | --- |
| Suggestions feel bland or predictable | Wildcard slot, blended styles, corpus weights in Phase 9 |
| Note-spelling bugs (F where E# belongs) | Spelling stored with every note; golden tests across all keys in Phase 1 |
| Odd or unplayable guitar shapes | Your play-tests tune the scorer; fixtures of shapes you approve |
| Rules contradict between styles | Rules are weighted penalties per profile, never global hard rules |
| Scope creep from the large vocabulary | Vocabulary is data; the UI shows common items first and the rest behind "more" |
| Browser audio latency or quirks | Tested in the Phase 0 spike on your own devices |
| Licence trouble if the app is ever shared | Ship only derived tables; licence notes in `DECISIONS.md` |
| Claude Code drifting or filling its context | Small tasks, `/clear` per task, a short `CLAUDE.md`, hooks and reviewer gates |
| Pro plan usage limits slow the pace | One session at a time, small tasks, reviewer subagents only at phase gates; check /usage |

## Your answers and what they changed

All six questions are answered, and the changes are already worked into the phases above.

| Question | Your answer | What changed |
| --- | --- | --- |
| Who is it for? | Just you | Licence risk is low; the repo is public only so GitHub Pages can publish it for free |
| Main devices | Laptop, sometimes phone | Layouts work at phone width; the app is published to GitHub Pages, so it opens on any device |
| MIDI keyboard | Yes, over USB | MIDI input moves to Phase 2 and feeds shapes (Phase 3), progressions (Phase 5) and melodies (Phase 7); it works in Chrome or Edge on the laptop, not Safari or iPhone |
| Code involvement | Not at all | You test features, never code; Claude ends each task with a plain-English summary and things to try |
| GitHub and plan | Not comfortable with GitHub; Pro plan | Claude Code on the web: Claude handles branches and pull requests, you click Merge; one session at a time, no Projects, reviewers only at phase gates |
| Notation | Both | Phase 10 adds an on-screen score with standard notation and tab, and exports both |

## Sources

- [The McGill Billboard Project](https://ddmal.music.mcgill.ca/research/The_McGill_Billboard_Project_%28Chord_Analysis_Dataset%29/): CC0 licence, 890 slots and 740 songs
- [billboard-parser on Hackage](https://hackage.haskell.org/package/billboard-parser-1.0.0.0): Billboard Hot 100 date range, 1958–1991
- [Rock corpus portal (de Clercq & Temperley)](https://rockcorpus.midside.com/): RS 200 contents and CC BY 4.0 licence
- [A corpus analysis of rock harmony (2011)](https://labs.sonicfield.org/library/a-corpus-analysis-of-rock-harmony): IV as the most common chord after I
- [Chordonomicon on Hugging Face](https://huggingface.co/datasets/ailsntua/Chordonomicon) and [paper](https://arxiv.org/abs/2410.22046): size, metadata, MIT licence, scraped sources
- [Hooktheory Trends API docs](https://hooktheory.com/api/trends/docs): endpoints, rate limit, no data dump
- [tonal on GitHub](https://github.com/tonaljs/tonal): TypeScript theory library and its modules
- [Can I use: Web MIDI API](https://caniuse.com/midi): supported in Chrome, Edge and Firefox; not in Safari or on iPhone
- [Claude Code best practices](https://code.claude.com/docs/en/best-practices): context, plan mode, CLAUDE.md, hooks, skills, subagents, review
- [Claude Code Projects](https://code.claude.com/docs/en/claude-projects): beta status, plans, threads, GitHub App requirement
- [Claude Code errors: usage limits](https://code.claude.com/docs/en/errors): session and weekly limits, /usage, waiting for the reset
