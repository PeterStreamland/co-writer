import type { Midi } from '../midi/useMidi'
import type { ChordName } from '../theory'
import type { LastChord } from './last-chord'
import type { Played } from './played'

// The MIDI keyboard's connection, the notes being held, and every name for
// the chord last played, the best fit for the key first (SPEC 5). Each name
// jumps to its shapes on the other instrument: the guitar's chord boxes from
// the keyboard view (Phase 3 task 7), the piano voicings from the guitar
// view (David's choice). Follow my playing makes each chord played the
// current chord.
export function MidiPanel({
  midi,
  playing,
  last,
  follow,
  onFollowChange,
  shapesOn,
  onShowShapes,
}: {
  midi: Midi
  playing: Played
  last: LastChord
  follow: boolean
  onFollowChange: (follow: boolean) => void
  shapesOn: 'guitar' | 'keyboard' // where the shapes button goes
  onShowShapes: (chord: ChordName) => void
}) {
  if (midi.status === 'unsupported') {
    return (
      <p class="midi muted">
        MIDI keyboards work in Chrome or Edge; this browser doesn't support
        them.
      </p>
    )
  }
  if (midi.status === 'idle' || midi.status === 'denied') {
    return (
      <p class="midi">
        <button type="button" onClick={midi.connect}>
          Connect MIDI keyboard
        </button>{' '}
        {midi.status === 'denied' && (
          <span class="muted">
            The browser refused MIDI access. Allow it in the site settings and
            try again.
          </span>
        )}
      </p>
    )
  }
  const [first, ...others] = last.names
  return (
    <section class="midi" aria-live="polite">
      <p class="muted">
        MIDI:{' '}
        {midi.devices.length
          ? midi.devices.join(', ')
          : 'connected, but no keyboard found. Plug it in.'}
      </p>
      {playing.labels.length > 0 ? (
        <p class="played-notes">{playing.labels.join(' ')}</p>
      ) : (
        !first && <p class="muted">Play a note or chord on your keyboard.</p>
      )}
      {first && (
        <>
          <p>
            {!last.holding && <span class="muted">Last chord: </span>}
            <strong class="played-name">{first.symbol}</strong> ·{' '}
            {first.reading}{' '}
            <button type="button" onClick={() => onShowShapes(first.chord)}>
              {shapesOn === 'guitar' ? 'Guitar shapes ▸' : 'Piano shapes ▸'}
            </button>
          </p>
          {others.length > 0 && (
            <p class="muted also">
              Also:{' '}
              {others.map((n) => (
                <button
                  key={n.symbol}
                  type="button"
                  class="link"
                  title={`Show the ${shapesOn === 'guitar' ? 'guitar' : 'piano'} shapes for ${n.symbol}`}
                  onClick={() => onShowShapes(n.chord)}
                >
                  {n.symbol} ({n.numeral})
                </button>
              ))}
            </p>
          )}
        </>
      )}
      <label class="follow">
        <input
          type="checkbox"
          checked={follow}
          onChange={(e) => onFollowChange(e.currentTarget.checked)}
        />{' '}
        Follow my playing: each chord played becomes the current chord
      </label>
    </section>
  )
}
