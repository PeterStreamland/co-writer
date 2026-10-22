import { useState } from 'preact/hooks'
import { playChord } from '../audio/player'
import type { ChordName, Key } from '../theory'
import { chordRows, currentChord, type ChordButton } from './chord-rows'

// The key's chords, one row per kind. Clicking a chord plays it, strummed
// when the guitar view is showing, and makes it the current chord.
export function ChordRows({
  value,
  current,
  onSelect,
  strum,
}: {
  value: Key
  current: ChordName | undefined
  onSelect: (chord: ChordName) => void
  strum: boolean
}) {
  const [showMore, setShowMore] = useState(false)
  const rows = chordRows(value, showMore)
  const selected = current && currentChord(value, current)

  function choose(chord: ChordName) {
    onSelect(chord)
    void playChord(currentChord(value, chord).voicing, { strum })
  }

  const cell = (c: ChordButton | undefined, i: number) =>
    c ? (
      <td key={i}>
        <ChordCell
          chord={c}
          selected={selected?.symbol === c.symbol}
          onClick={choose}
        />
      </td>
    ) : (
      <td key={i} class="empty">
        —
      </td>
    )

  return (
    <section class="chords">
      <h2>Chords</h2>
      <div class="scroll">
        <table>
          <thead>
            <tr>
              {rows.stacked && <th />}
              {rows.degrees.map((d, i) => (
                <th key={i}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.stacked ? (
              rows.rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {row.cells.map(cell)}
                </tr>
              ))
            ) : (
              <tr>
                {rows.columns.map((column, i) => (
                  <td key={i}>
                    {column.length === 0 && <span class="empty">—</span>}
                    {column.map((c) => (
                      <ChordCell
                        key={c.id}
                        chord={c}
                        selected={selected?.symbol === c.symbol}
                        onClick={choose}
                      />
                    ))}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {rows.stacked && (
        <button type="button" onClick={() => setShowMore(!showMore)}>
          {showMore ? 'Fewer chords' : 'More chords: sus, add and 6ths'}
        </button>
      )}
      <p class="current" aria-live="polite">
        {selected ? (
          <>
            <strong>{selected.symbol}</strong> · {selected.description} ·{' '}
            <span class="muted">{selected.notes.join(' ')}</span>
          </>
        ) : (
          <span class="muted">Click any chord to hear it.</span>
        )}
      </p>
    </section>
  )
}

function ChordCell({
  chord,
  selected,
  onClick,
}: {
  chord: ChordButton
  selected: boolean
  onClick: (chord: ChordName) => void
}) {
  return (
    <button
      type="button"
      class={selected ? 'chord selected' : 'chord'}
      aria-pressed={selected}
      onClick={() => onClick(chord.chord)}
    >
      <span class="symbol">{chord.symbol}</span>
      <span class="numeral">{chord.numeral}</span>
    </button>
  )
}
