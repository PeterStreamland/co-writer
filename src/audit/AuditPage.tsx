// The Phase 1 audit page (#/audit): every key's scales and chords from the
// theory core, for David to check and flag. Flags stay in this browser and
// copy out as text for the next session.
import { useEffect, useMemo, useState } from 'preact/hooks'
import {
  formatNote,
  parseNote,
  type ChordName,
  type ChordStyle,
  type DiatonicKind,
  type Key,
} from '../theory'
import {
  KINDS,
  KIND_LABELS,
  auditTonics,
  chordDetail,
  chordTable,
  keyName,
  keysForScale,
  parentLabel,
  scaleGroups,
  scaleRow,
  signatureLabel,
  stackedRow,
  type ChordCell,
} from './audit'

const FLAGS_KEY = 'co-writer.audit-flags'

function loadFlags(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(FLAGS_KEY) ?? '[]')
    return Array.isArray(saved)
      ? saved.filter((f) => typeof f === 'string')
      : []
  } catch {
    return []
  }
}

function saveFlags(flags: string[]) {
  try {
    localStorage.setItem(FLAGS_KEY, JSON.stringify(flags))
  } catch {
    // Flags still work for this visit without storage.
  }
}

export function AuditPage() {
  const [mode, setMode] = useState('major')
  const [tonic, setTonic] = useState('C')
  const [style, setStyle] = useState<ChordStyle>('lead-sheet')
  const [kind, setKind] = useState<DiatonicKind>('triad')
  const [showNotes, setShowNotes] = useState(false)
  const [selected, setSelected] = useState<ChordName | undefined>()
  const [flags, setFlags] = useState<string[]>(loadFlags)

  useEffect(() => saveFlags(flags), [flags])

  const key: Key = {
    tonic: parseNote(tonic) ?? { letter: 'C', accidental: 0 },
    mode,
  }
  const table = useMemo(() => chordTable(key, style), [tonic, mode, style])
  const addFlag = (text: string) => setFlags([...flags, text])

  function pickKey(next: Key, chord?: ChordName) {
    setTonic(formatNote(next.tonic, { ascii: true }))
    setMode(next.mode)
    setSelected(chord)
  }

  return (
    <main class="audit">
      <p>
        <a href="#/">← Home</a>
      </p>
      <h1>Phase 1 audit</h1>
      <p>
        Every scale and chord here comes straight from the theory core. Pick a
        key, check the spellings, numerals and names, and flag anything a
        musician wouldn't write. Click a chord to see all its names and
        inversions.
      </p>

      <Flags flags={flags} setFlags={setFlags} />

      <section class="controls">
        <label>
          Tonic{' '}
          <select
            value={tonic}
            onChange={(e) => {
              setTonic(e.currentTarget.value)
              setSelected(undefined)
            }}
          >
            {auditTonics().map((t) => (
              <option value={formatNote(t, { ascii: true })}>
                {formatNote(t)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Scale{' '}
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.currentTarget.value)
              setSelected(undefined)
            }}
          >
            {scaleGroups().map((group) => (
              <optgroup label={group.label}>
                {group.scales.map((s) => (
                  <option value={s.id}>{s.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          Chord symbols{' '}
          <select
            value={style}
            onChange={(e) => setStyle(e.currentTarget.value as ChordStyle)}
          >
            <option value="lead-sheet">Lead-sheet (Cmaj7)</option>
            <option value="jazz">Jazz (C△7)</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={showNotes}
            onChange={(e) => setShowNotes(e.currentTarget.checked)}
          />{' '}
          Show each chord's notes
        </label>
      </section>

      <KeySection keyValue={key} onFlag={addFlag} />

      <section>
        <h2>Chords in {keyName(key)}</h2>
        {table.stacked ? (
          <StackedTable
            keyValue={key}
            kinds={table.kinds}
            rows={table.rows}
            showNotes={showNotes}
            onPick={setSelected}
          />
        ) : (
          <ScaleChordList
            keyValue={key}
            degrees={table.degrees}
            showNotes={showNotes}
            onPick={setSelected}
          />
        )}
      </section>

      {selected && (
        <Detail
          keyValue={key}
          chord={selected}
          style={style}
          onFlag={addFlag}
          onClose={() => setSelected(undefined)}
        />
      )}

      <EveryKey
        mode={mode}
        kind={kind}
        setKind={setKind}
        style={style}
        stacked={table.stacked}
        onPick={pickKey}
      />
    </main>
  )
}

function Flags(props: { flags: string[]; setFlags: (f: string[]) => void }) {
  const { flags, setFlags } = props
  const [copied, setCopied] = useState(false)
  const text = flags.map((f) => `- ${f}`).join('\n')

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section class="flags">
      <h2>Your flags ({flags.length})</h2>
      {flags.length === 0 ? (
        <p>
          Nothing flagged yet. Use a Flag button below; your flags are kept in
          this browser.
        </p>
      ) : (
        <>
          <ul>
            {flags.map((f, i) => (
              <li>
                {f}{' '}
                <button
                  class="small"
                  onClick={() => setFlags(flags.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <p>
            <button onClick={copy}>
              {copied ? 'Copied' : 'Copy flags for Claude'}
            </button>{' '}
            <button
              onClick={() => {
                if (confirm('Clear every flag?')) setFlags([])
              }}
            >
              Clear all
            </button>
          </p>
          <textarea
            readOnly
            rows={Math.min(8, flags.length + 1)}
            value={text}
          />
        </>
      )}
    </section>
  )
}

function FlagForm(props: { subject: string; onFlag: (text: string) => void }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  if (!open) {
    return (
      <button class="small" onClick={() => setOpen(true)}>
        Flag
      </button>
    )
  }
  return (
    <form
      class="flag-form"
      onSubmit={(e) => {
        e.preventDefault()
        props.onFlag(`${props.subject}: ${note.trim() || 'looks wrong'}`)
        setNote('')
        setOpen(false)
      }}
    >
      <input
        value={note}
        placeholder="What's wrong? (optional)"
        onInput={(e) => setNote(e.currentTarget.value)}
        ref={(el) => el?.focus()}
      />
      <button type="submit" class="small">
        Add flag
      </button>
      <button type="button" class="small" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  )
}

function KeySection(props: { keyValue: Key; onFlag: (t: string) => void }) {
  const key = props.keyValue
  const row = scaleRow(key)
  const parent = parentLabel(key)
  return (
    <section>
      <h2>{keyName(key)}</h2>
      <p>
        Key signature: {signatureLabel(key)}
        {parent && ` (from ${parent})`}{' '}
        <FlagForm
          subject={`${keyName(key)} scale or signature`}
          onFlag={props.onFlag}
        />
      </p>
      <div class="scroll">
        <table>
          <tbody>
            <tr>
              <th>Note</th>
              {row.notes.map((n) => (
                <td>{n}</td>
              ))}
            </tr>
            <tr>
              <th>Degree</th>
              {row.degrees.map((d) => (
                <td>{d}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Cell(props: {
  cell: ChordCell | undefined
  showNotes: boolean
  numeral?: boolean
  onPick: (c: ChordName) => void
}) {
  const { cell } = props
  if (!cell) return <td class="empty">–</td>
  return (
    <td>
      <button class="chord" onClick={() => props.onPick(cell.chord)}>
        <span class="symbol">{cell.symbol}</span>
        {props.numeral !== false && <span class="numeral">{cell.numeral}</span>}
        {props.showNotes && <span class="notes">{cell.notes.join(' ')}</span>}
      </button>
    </td>
  )
}

function StackedTable(props: {
  keyValue: Key
  kinds: DiatonicKind[]
  rows: (ChordCell | undefined)[][]
  showNotes: boolean
  onPick: (c: ChordName) => void
}) {
  const degrees = scaleRow(props.keyValue).degrees
  return (
    <div class="scroll">
      <table class="chords">
        <thead>
          <tr>
            <th />
            {degrees.map((d) => (
              <th>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.kinds.map((kind, i) => (
            <tr>
              <th>{KIND_LABELS[kind]}</th>
              {props.rows[i].map((cell) => (
                <Cell
                  cell={cell}
                  showNotes={props.showNotes}
                  onPick={props.onPick}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ScaleChordList(props: {
  keyValue: Key
  degrees: ChordCell[][]
  showNotes: boolean
  onPick: (c: ChordName) => void
}) {
  const row = scaleRow(props.keyValue)
  return (
    <>
      <p>
        This scale doesn't stack in thirds, so it shows every chord whose notes
        all sit in the scale, on each scale note.
      </p>
      <div class="scroll">
        <table class="chords">
          <tbody>
            {props.degrees.map((cells, i) => (
              <tr>
                <th>
                  {row.notes[i]} ({row.degrees[i]})
                </th>
                <td>
                  <div class="list">
                    {cells.length === 0
                      ? '–'
                      : cells.map((cell) => (
                          <button
                            class="chord"
                            onClick={() => props.onPick(cell.chord)}
                          >
                            <span class="symbol">{cell.symbol}</span>
                            <span class="numeral">{cell.numeral}</span>
                            {props.showNotes && (
                              <span class="notes">{cell.notes.join(' ')}</span>
                            )}
                          </button>
                        ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Detail(props: {
  keyValue: Key
  chord: ChordName
  style: ChordStyle
  onFlag: (t: string) => void
  onClose: () => void
}) {
  const detail = chordDetail(props.keyValue, props.chord, props.style)
  const subject = `${detail.symbol} in ${keyName(props.keyValue)}`
  return (
    <section class="detail">
      <h2>
        {detail.symbol}{' '}
        <button class="small" onClick={props.onClose}>
          Close
        </button>
      </h2>
      <p>
        Notes: {detail.notes.join(' ')}
        <br />
        {detail.description}{' '}
        <FlagForm subject={subject} onFlag={props.onFlag} />
      </p>
      <h3>Every name for these notes, best first</h3>
      <ul>
        {detail.names.map((n) => (
          <li>
            {n.symbol}
            {n.omitted && (
              <span class="muted"> (leaves out the {n.omitted})</span>
            )}
          </li>
        ))}
      </ul>
      <h3>Inversions</h3>
      <div class="scroll">
        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>Symbol</th>
              <th>Numeral</th>
              <th>Close voicing</th>
            </tr>
          </thead>
          <tbody>
            {detail.inversions.map((inv) => (
              <tr>
                <td>{inv.label}</td>
                <td>{inv.symbol}</td>
                <td>{inv.numeral}</td>
                <td>{inv.voicing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function EveryKey(props: {
  mode: string
  kind: DiatonicKind
  setKind: (k: DiatonicKind) => void
  style: ChordStyle
  stacked: boolean
  onPick: (key: Key, chord?: ChordName) => void
}) {
  const keys = keysForScale(props.mode)
  const first = keys[0]
  const header =
    props.stacked && first ? stackedRow(first, props.kind, props.style) : []
  return (
    <section>
      <h2>Every key of this scale</h2>
      <p>
        One row per key with a real key signature. Click a key to open it above,
        or a chord to see its details.
      </p>
      {props.stacked && (
        <p>
          <label>
            Chords{' '}
            <select
              value={props.kind}
              onChange={(e) =>
                props.setKind(e.currentTarget.value as DiatonicKind)
              }
            >
              {KINDS.map((k) => (
                <option value={k}>{KIND_LABELS[k]}</option>
              ))}
            </select>
          </label>
        </p>
      )}
      <div class="scroll">
        <table class="chords">
          <thead>
            <tr>
              <th>Key</th>
              <th>Signature</th>
              {props.stacked ? (
                header.map((cell, i) => <th>{cell?.numeral ?? i + 1}</th>)
              ) : (
                <th>Notes</th>
              )}
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr>
                <th>
                  <button class="link" onClick={() => props.onPick(key)}>
                    {formatNote(key.tonic)}
                  </button>
                </th>
                <td>{signatureLabel(key)}</td>
                {props.stacked ? (
                  stackedRow(key, props.kind, props.style).map((cell) => (
                    <Cell
                      cell={cell}
                      showNotes={false}
                      numeral={false}
                      onPick={(chord) => props.onPick(key, chord)}
                    />
                  ))
                ) : (
                  <td>{scaleRow(key).notes.join(' ')}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
