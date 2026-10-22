import type { Midi } from '../midi/useMidi'
import type { Played } from './played'

// The MIDI keyboard's connection, the notes being held, and every name for
// the chord they make, the best fit for the key first (SPEC 5).
export function MidiPanel({ midi, playing }: { midi: Midi; playing: Played }) {
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
  const [first, ...others] = playing.names
  return (
    <section class="midi" aria-live="polite">
      <p class="muted">
        MIDI:{' '}
        {midi.devices.length
          ? midi.devices.join(', ')
          : 'connected, but no keyboard found. Plug it in.'}
      </p>
      {playing.labels.length === 0 ? (
        <p class="muted">Play a note or chord on your keyboard.</p>
      ) : (
        <>
          <p class="played-notes">{playing.labels.join(' ')}</p>
          {first && (
            <p>
              <strong class="played-name">{first.symbol}</strong> ·{' '}
              {first.reading}
            </p>
          )}
          {others.length > 0 && (
            <p class="muted">
              Also: {others.map((n) => `${n.symbol} (${n.numeral})`).join(', ')}
            </p>
          )}
        </>
      )}
    </section>
  )
}
