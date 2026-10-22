import { chordSymbol, type ChordName } from '../theory'
import type { ChordVoicing } from '../sketch/progression'

// The + on a chord box: adds the chord as shaped (its inversion as a slash
// chord, C/E) to the progression after the selected chord, keeping the
// exact shape so it plays and shows as picked.
export function AddButton({
  chord,
  voicing,
  onAdd,
}: {
  chord: ChordName
  voicing: ChordVoicing
  onAdd: (chord: ChordName, voicing: ChordVoicing) => void
}) {
  const symbol = chordSymbol(chord)
  return (
    <button
      type="button"
      class="box-add"
      aria-label={`Add ${symbol} to the progression`}
      title={`Add ${symbol} to the progression`}
      onClick={() => onAdd(chord, voicing)}
    >
      + {symbol}
    </button>
  )
}
