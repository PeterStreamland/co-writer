import { chordSymbol, type ChordName } from '../theory'
import type { ChordVoicing } from '../sketch/progression'

// What a chord box can do with the shape on show: add it after the selected
// chord, or put it in place of the selected chord (David's request).
export type BoxActions = {
  onAdd?: (chord: ChordName, voicing: ChordVoicing) => void
  replace?: {
    symbol: string // the selected chord in the progression
    onReplace: (chord: ChordName, voicing: ChordVoicing) => void
  }
}

// The + on a chord box: adds the chord as shaped (its inversion as a slash
// chord, C/E) to the progression after the selected chord, keeping the
// exact shape so it plays and shows as picked. Beside it, Replace puts it
// in place of the selected chord instead.
export function AddButton({
  chord,
  voicing,
  onAdd,
  replace,
}: BoxActions & {
  chord: ChordName
  voicing: ChordVoicing
}) {
  const symbol = chordSymbol(chord)
  return (
    <span class="box-actions">
      {onAdd && (
        <button
          type="button"
          class="box-add"
          aria-label={`Add ${symbol} to the progression`}
          title={`Add ${symbol} to the progression`}
          onClick={() => onAdd(chord, voicing)}
        >
          + {symbol}
        </button>
      )}
      {replace && (
        <button
          type="button"
          class="box-add"
          title={`Replace ${replace.symbol} in the progression with ${symbol}`}
          onClick={() => replace.onReplace(chord, voicing)}
        >
          ⇄ Replace {replace.symbol}
        </button>
      )}
    </span>
  )
}
