import {
  addDur,
  beatsOf,
  compareDur,
  NOTE_VALUES,
  durEquals,
  formatNote,
  ratioOf,
  valueFraction,
  subDur,
  valueName,
  type Dur,
  type MelodyNote,
  type MeterMap,
  type NextNoteSuggestion,
  type Note,
} from '../theory'
import { melodyStrips, type Strip } from './melody-strips'

// How wide a bar of 4/4 is; other bars are in proportion to their length.
export const BAR_REM = 18

// The melody lane under the progression strip (SPEC 2, 7.2): each bar a
// time strip (Phase 7 task 6, David's choice), with its chords on top, a
// ruler of its beats and how full it is. Each note is as wide as it lasts;
// a held note marks where each hold began; rests are dashed and time not
// filled yet is faint; a note over the barline is split and tied. The note
// sounding is lit. Tapping a bar's name plays it. Tapping a note (David's request) plays it and offers
// notes for its place, best first, and ways to leave a gap there: silence
// it, hold the note before over it (no new note), or a beat's rest before
// it.
export function MelodyLane({
  melody,
  time,
  sounding,
  onOpen,
  selected,
  onSelect,
  options,
  onSwap,
  onSilence,
  onHold,
  onRestBefore,
  onLength,
  onRestAfter,
  onOctave,
  chords,
  barCount,
  onPlayBar,
}: {
  melody: MelodyNote[]
  time: MeterMap
  sounding?: number
  // Opens the Melody tab.
  onOpen: () => void
  selected?: number
  onSelect: (index: number | undefined) => void
  // Notes for the selected note's place.
  options: NextNoteSuggestion[]
  onSwap: (note: Note) => void
  onSilence: () => void
  onHold: () => void
  onRestBefore: () => void
  // A new length for the tapped note; the notes after it move along.
  onLength: (length: Dur) => void
  onRestAfter: () => void
  // Moves the tapped note up (1) or down (-1) an octave (David's request).
  onOctave: (by: number) => void
  // Each chord's symbol and where it sounds, for the strips' tops.
  chords: { symbol: string; start: Dur; length: Dur }[]
  // How many bars the chords cover: the lane shows at least these.
  barCount: number
  // Plays a bar: its melody over its chords (David's request).
  onPlayBar: (start: Dur, length: Dur) => void
}) {
  const strips = melodyStrips(melody, time, barCount)
  // The chord names over a bar: every chord sounding in it.
  const chordsIn = (strip: Strip) => {
    const end = addDur(strip.start, strip.length)
    return chords
      .filter(
        (c) =>
          compareDur(c.start, end) < 0 &&
          compareDur(addDur(c.start, c.length), strip.start) > 0,
      )
      .map((c) => c.symbol)
      .join(' ')
  }
  const chosen = selected === undefined ? undefined : melody[selected]
  return (
    <section class="part-rows melody-lane" aria-label="Melody">
      <div class="part-row">
        <div class="part-head">
          <strong>♪ Melody</strong>
          <button type="button" onClick={onOpen}>
            {melody.length ? 'Edit' : 'Add a melody'}
          </button>
        </div>
        {melody.length === 0 ? (
          <p class="muted">
            No melody yet: tap it on the instrument, type it or record it on
            MIDI in the Melody tab.
          </p>
        ) : (
          <div class="lane-bars">
            {strips.map((strip) => {
              const pct = (d: Dur) => `${ratioOf(d, strip.length) * 100}%`
              return (
                <div
                  key={strip.bar}
                  class="lane-bar"
                  style={{
                    width: `${ratioOf(strip.length, { n: 1, d: 1 }) * BAR_REM}rem`,
                  }}
                >
                  <div class="lane-chord">{chordsIn(strip) || '\u00a0'}</div>
                  <div class="lane-head">
                    <button
                      type="button"
                      class="lane-play"
                      title={`Play bar ${strip.bar}`}
                      onClick={() => onPlayBar(strip.start, strip.length)}
                    >
                      ▶ Bar {strip.bar}
                    </button>
                    <span class={strip.count === 'full' ? 'full' : 'muted'}>
                      {strip.count}
                    </span>
                  </div>
                  <div class="lane-ruler">
                    {beatsOf(strip.meter).map((b, k) => (
                      <span key={k} style={{ left: pct(b.onset) }}>
                        {k + 1}
                      </span>
                    ))}
                  </div>
                  <div class="lane-track">
                    {strip.segments.map((g, k) =>
                      g.kind === 'note' ? (
                        <button
                          type="button"
                          key={k}
                          class={[
                            'lane-note',
                            g.tiedIn ? 'tied-in' : '',
                            g.tiedOut ? 'tied-out' : '',
                            g.index === sounding ? 'sounding' : '',
                            g.index === selected ? 'selected' : '',
                          ].join(' ')}
                          style={{
                            left: pct(g.from),
                            width: pct(subDur(g.to, g.from)),
                          }}
                          aria-pressed={g.index === selected}
                          title={`${formatNote(melody[g.index].note)}, ${valueName(melody[g.index].length)}: tap for notes to play in its place`}
                          onClick={() =>
                            onSelect(g.index === selected ? undefined : g.index)
                          }
                        >
                          {(g.held ?? []).map((h, n) => (
                            <span
                              key={n}
                              class="lane-hold"
                              style={{
                                left: `${(ratioOf(subDur(h, g.from), subDur(g.to, g.from)) * 100).toFixed(2)}%`,
                              }}
                              title="Held: no new note here"
                            />
                          ))}
                          <span class="lane-name">
                            {g.tiedIn ? '⌒' : ''}
                            {formatNote(melody[g.index].note)}
                            {g.tiedOut ? '⌒' : ''}
                          </span>
                        </button>
                      ) : (
                        <span
                          key={k}
                          class={g.kind === 'rest' ? 'lane-rest' : 'lane-empty'}
                          style={{
                            left: pct(g.from),
                            width: pct(subDur(g.to, g.from)),
                          }}
                          title={
                            g.kind === 'rest' ? 'A rest' : 'Not filled yet'
                          }
                        >
                          {g.kind === 'rest' ? '𝄽' : ''}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {chosen && (
          <div class="lane-place">
            <strong>In place of {formatNote(chosen.note)}</strong>{' '}
            <span class="muted">(tap one to hear it there and put it in)</span>{' '}
            <button
              type="button"
              aria-label="Close"
              onClick={() => onSelect(undefined)}
            >
              ×
            </button>
            <div class="place-options">
              {options.map((s) => (
                <button
                  type="button"
                  key={formatNote(s.candidate.note)}
                  class="next-note"
                  title={s.explanation}
                  onClick={() => onSwap(s.candidate.note)}
                >
                  {formatNote(s.candidate.note)}{' '}
                  <span class="muted">
                    {s.tags
                      .filter((t) => t !== 'step')
                      .map((t) => TAG_WORDS[t] ?? t)
                      .join(', ')}
                  </span>
                </button>
              ))}
            </div>
            <div class="place-options" role="group" aria-label="Octave">
              <button
                type="button"
                title="This note down an octave"
                onClick={() => onOctave(-1)}
              >
                ▼ Octave
              </button>
              <button
                type="button"
                title="This note up an octave"
                onClick={() => onOctave(1)}
              >
                ▲ Octave
              </button>
            </div>
            <div class="place-options" role="group" aria-label="Length">
              <span class="muted">Length:</span>
              {NOTE_VALUES.map((v) => (
                <button
                  type="button"
                  key={v.id}
                  class="lane-length"
                  aria-pressed={durEquals(v.length, chosen.length)}
                  title={`Make it a ${v.name}; the notes after it move along`}
                  onClick={() => onLength(v.length)}
                >
                  {v.symbol}
                  <small>{valueFraction(v.length)}</small>
                </button>
              ))}
            </div>
            <div class="place-options">
              <button
                type="button"
                title="No note here: a rest in its place, the rest of the melody stays put"
                onClick={onSilence}
              >
                𝄽 Silence it
              </button>
              <button
                type="button"
                title="No new note here: the note before rings on through it"
                disabled={selected === 0}
                onClick={onHold}
              >
                – Hold the note before
              </button>
              <button
                type="button"
                title="A beat's rest before this note: it and the notes after move later"
                onClick={onRestBefore}
              >
                + A beat’s rest before it
              </button>
              <button
                type="button"
                title={
                  selected === melody.length - 1
                    ? 'A beat’s rest after the last note: the next note you add comes a beat later'
                    : 'A beat’s rest after this note: the notes after it move later'
                }
                onClick={onRestAfter}
              >
                + A beat’s rest after it
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

const TAG_WORDS: Record<string, string> = {
  'chord-tone': 'chord tone',
  tendency: 'resolves',
}
