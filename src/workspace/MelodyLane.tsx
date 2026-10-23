import {
  formatNote,
  melodyBars,
  valueFraction,
  valueName,
  type MelodyNote,
  type MeterMap,
} from '../theory'

// The melody lane under the progression strip (SPEC 2, 7.2): the melody's
// notes bar by bar, each with its length as a fraction (1/4 a crotchet), the one sounding lit. Lining
// the bars up under the chords comes with Phase 7 task 6.
export function MelodyLane({
  melody,
  time,
  sounding,
  onOpen,
}: {
  melody: MelodyNote[]
  time: MeterMap
  sounding?: number
  // Opens the Melody tab.
  onOpen: () => void
}) {
  const bars = melodyBars(melody, time)
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
                    <span
                      key={i}
                      class={[
                        'line-note',
                        'melody-note',
                        i === sounding ? 'sounding' : '',
                      ].join(' ')}
                    >
                      <span class="label" title={valueName(melody[i].length)}>
                        {valueFraction(melody[i].length)}
                      </span>
                      <span class="name">{formatNote(melody[i].note)}</span>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
