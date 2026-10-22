import { chordSymbol, type ChordName } from '../theory'

// The + on a chord box: adds the chord as shaped (its inversion as a slash
// chord, C/E) to the progression after the selected chord.
export function AddButton({
  chord,
  onAdd,
}: {
  chord: ChordName
  onAdd: (chord: ChordName) => void
}) {
  const symbol = chordSymbol(chord)
  return (
    <button
      type="button"
      class="box-add"
      aria-label={`Add ${symbol} to the progression`}
      title={`Add ${symbol} to the progression`}
      onClick={() => onAdd(chord)}
    >
      + {symbol}
    </button>
  )
}
