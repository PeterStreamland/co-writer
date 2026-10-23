import { positionBox } from '../instruments/arpeggio-guitar'
import type { Guitar } from '../instruments/guitar'
import { GAP, LEFT, RADIUS, ROW, TOP } from './ChordBoxes'
import type { ArpeggioShow } from './InstrumentView'

// The chord box as a position picker while the Arpeggio tab is open on
// guitar (David's request): the position on show drawn as a box, every note
// a labelled dot, with ◀ ▶ to step through the positions that fit. Running
// across the neck, it says where the run goes and offers a position.
export function ArpeggioBox({
  guitar,
  show,
}: {
  guitar: Guitar
  show: ArpeggioShow
}) {
  const g = show.guitar
  if (!g) return null
  const spots = g.positions[g.at]
  const frets = (list: { fret: number }[]) => {
    const fretted = list.map((s) => s.fret).filter((f) => f > guitar.capo)
    if (!fretted.length) return 'open strings'
    const low = Math.min(...fretted)
    const high = Math.max(...fretted)
    return low === high ? `fret ${low}` : `frets ${low}–${high}`
  }
  const step = (by: number) =>
    g.onAt((g.at + by + g.positions.length) % g.positions.length)
  return (
    <section class="chord-boxes arpeggio-box" aria-label="Arpeggio positions">
      <div class="box-head">
        <h3>{show.name} arpeggio</h3>
      </div>
      {g.mode === 'run' ? (
        <>
          <p class="muted">
            Running across the neck
            {show.spots ? `, ${frets(show.spots)}` : ''}.
          </p>
          <button type="button" onClick={g.onOnePosition}>
            Pick a position
          </button>
        </>
      ) : spots ? (
        <>
          <div class="box">
            <PositionDiagram guitar={guitar} show={show} spots={spots} />
          </div>
          <div class="box-nav">
            <button
              type="button"
              aria-label="Lower position"
              disabled={g.positions.length < 2}
              onClick={() => step(-1)}
            >
              ◀
            </button>
            <span>
              Position {g.at + 1} of {g.positions.length}
            </span>
            <button
              type="button"
              aria-label="Higher position"
              disabled={g.positions.length < 2}
              onClick={() => step(1)}
            >
              ▶
            </button>
          </div>
          <p class="muted box-info">{frets(spots)}</p>
        </>
      ) : (
        <p class="muted">
          This range doesn't fit in one position: try fewer octaves or another
          starting note.
        </p>
      )}
    </section>
  )
}

// The position as SVG, drawn like a chord box: strings upright, low string
// on the left, nut or capo thick at the top near the open position, and a
// dot for each note (several to a string), with ○ for open strings.
function PositionDiagram({
  guitar,
  show,
  spots,
}: {
  guitar: Guitar
  show: ArpeggioShow
  spots: NonNullable<ArpeggioShow['spots']>
}) {
  const box = positionBox(guitar, spots, show.notes)
  const width = LEFT + (box.strings - 1) * GAP + RADIUS + 4
  const bottom = TOP + box.rows * ROW
  const height = bottom + 6
  const x = (s: number) => LEFT + s * GAP
  const sounding =
    show.sounding === undefined ? undefined : box.dots[show.sounding]
  return (
    <svg
      class="box-diagram"
      viewBox={`0 0 ${width} ${height}`}
      width={width * 1.25}
      height={height * 1.25}
      aria-hidden="true"
    >
      {Array.from({ length: box.rows + 1 }, (_, r) => (
        <line
          key={`fret-${r}`}
          class={r === 0 && box.top !== 'none' ? `top ${box.top}` : 'fret'}
          x1={x(0)}
          x2={x(box.strings - 1)}
          y1={TOP + r * ROW}
          y2={TOP + r * ROW}
        />
      ))}
      {Array.from({ length: box.strings }, (_, s) => (
        <line
          key={`string-${s}`}
          class="string"
          x1={x(s)}
          x2={x(s)}
          y1={TOP}
          y2={bottom}
        />
      ))}
      {box.top === 'none' && (
        <text class="first-fret" x={LEFT - 10} y={TOP + ROW / 2 + 4}>
          {box.first}
        </text>
      )}
      {box.dots.map((d, i) => {
        const on = d === sounding ? ' sounding' : ''
        if (d.open) {
          return (
            <circle
              key={i}
              class={`open-ring tone-${d.role}${on}`}
              cx={x(d.string)}
              cy={TOP - 8}
              r={5}
            />
          )
        }
        const cy = TOP + ((d.row as number) - 0.5) * ROW
        return [
          <circle
            key={`d-${i}`}
            class={`box-dot tone-${d.role}${on}`}
            cx={x(d.string)}
            cy={cy}
            r={RADIUS}
          />,
          <text key={`l-${i}`} class="dot-label" x={x(d.string)} y={cy + 3}>
            {d.label}
          </text>,
        ]
      })}
    </svg>
  )
}
