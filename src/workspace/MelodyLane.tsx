import {
  formatNote,
  melodyBars,
  valueFraction,
  valueName,
  type MelodyNote,
  type MeterMap,
  type NextNoteSuggestion,
  type Note,
} from '../theory'

// The melody lane under the progression strip (SPEC 2, 7.2): the melody's
// notes bar by bar, each with its length as a fraction (1/4 a crotchet),
// the one sounding lit. Lining the bars up under the chords comes with
// Phase 7 task 6. Tapping a note (David's request) plays it and offers
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
}) {
  const bars = melodyBars(melody, time)
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
          <ol class="line-chords part-chords">
            {bars.map(({ bar, notes }) => (
              <li key={bar} class="line-chord">
                <div class="bar-head">
                  <span class="line-chord-name muted">Bar {bar}</span>
                </div>
                <span class="line-notes">
                  {notes.map((i) => (
                    <button
                      type="button"
                      key={i}
                      class={[
                        'line-note',
                        'melody-note',
                        i === sounding ? 'sounding' : '',
                        i === selected ? 'selected' : '',
                      ].join(' ')}
                      aria-pressed={i === selected}
                      title="Tap for notes to play in its place"
                      onClick={() => onSelect(i === selected ? undefined : i)}
                    >
                      <span class="label" title={valueName(melody[i].length)}>
                        {valueFraction(melody[i].length)}
                      </span>
                      <span class="name">{formatNote(melody[i].note)}</span>
                    </button>
                  ))}
                </span>
              </li>
            ))}
          </ol>
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
