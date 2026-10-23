import { useState } from 'preact/hooks'
import {
  barLength,
  chordInsight,
  chordSymbol,
  durEquals,
  keyName,
  lengthChoices,
  lengthLabel,
  meterLabel,
  meterOfBar,
  ratioOf,
  romanNumeral,
  type BeatStrength,
  type ChordName,
  type Dur,
  type Key,
  type MeterMap,
  type Placement,
} from '../theory'
import {
  alternatives,
  keyAt,
  pathNodes,
  type ChordNode,
  type Progression,
} from '../sketch/progression'
import { InfoPanel, InfoToggle, useToggle } from './ChordInfo'
import { readTypedChords } from './typed-chords'
import {
  MAX_BPM,
  METER_OPTIONS,
  MIN_BPM,
  clampBpm,
  meterId,
  setBarMeter,
  tempoNote,
} from '../sketch/time'

// The progression strip (SPEC 2, 6.5): the active path of the section's
// progression. Tap a chord to select it (suggestions then follow it); the
// arrows under a chord switch between its alternatives; + adds the current
// chord after the selected one; + between, beside a selected chord with
// another after it, asks for passing chords (SPEC 6.7). Play plays every
// chord from the start. The box under the chords takes typed chord symbols
// ("Em C G D") and adds them in order after the selected chord.
// Undo and redo cover every change, and the tree button shows every branch.
export function ProgressionStrip({
  progression,
  sectionKey,
  selected,
  freeChord,
  canUndo,
  canRedo,
  onSelect,
  onSwitch,
  onAddFree,
  onAddTyped,
  onUndo,
  onRedo,
  onClear,
  onPickNode,
  playingAt,
  onPlay,
  onStop,
  bpm,
  onBpmChange,
  pulse,
  time,
  timing,
  onTimeChange,
  onLengthChange,
  between,
  onBetween,
  onShift,
  onShiftAll,
}: {
  progression: Progression
  sectionKey: Key
  selected: number
  freeChord: ChordName | undefined
  canUndo: boolean
  canRedo: boolean
  onSelect: (index: number) => void
  onSwitch: (index: number, step: number) => void
  onAddFree: () => void
  onAddTyped: (chords: ChordName[]) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onPickNode: (id: string) => void
  playingAt: number | undefined
  onPlay: () => void
  onStop: () => void
  bpm: number
  onBpmChange: (bpm: number) => void
  // The latest beat while playing, for the beat and bar lights.
  pulse: Pulse | undefined
  // The time signature, any bar overrides, and where each chord falls.
  time: MeterMap
  timing: Placement[]
  onTimeChange: (time: MeterMap) => void
  // Sets the selected chord's length; undefined is one bar.
  onLengthChange: (length: Dur | undefined) => void
  // The slot whose gap to the next chord is being filled, if any.
  between: number | undefined
  onBetween: (index: number) => void
  // Moves one chord, or every chord, up (1) or down (-1) an octave (David's
  // request).
  onShift: (index: number, by: number) => void
  onShiftAll: (by: number) => void
}) {
  const [treeOpen, setTreeOpen] = useState(false)
  const path = pathNodes(progression)
  // The selected chord's reading in its key, with an ⓘ panel comparing it
  // with the chord before (SPEC 6.3: every chord, suggested or not).
  const [infoOpen, toggleInfo] = useToggle()
  const selectedNode = selected >= 0 ? path[selected] : undefined
  const selectedInsight =
    selectedNode &&
    chordInsight(
      keyAt(progression, selected, sectionKey),
      selectedNode.chord,
      selected > 0 ? path[selected - 1].chord : undefined,
    )
  return (
    <section class="strip" aria-label="Progression">
      <div class="strip-bar">
        <h2>Progression</h2>
        <div class="strip-tools">
          <BeatLights pulse={pulse} />
          <label class="time-signature">
            Time
            <select
              value={meterId(time.meter)}
              aria-label="Time signature"
              onChange={(e) => {
                const option = METER_OPTIONS.find(
                  (o) => o.id === e.currentTarget.value,
                )
                if (option) onTimeChange({ ...time, meter: option.meter })
              }}
            >
              {METER_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label class="tempo">
            <span aria-hidden="true">{tempoNote(time.meter)} =</span>
            <input
              type="number"
              min={MIN_BPM}
              max={MAX_BPM}
              value={bpm}
              aria-label="Tempo in beats per minute"
              onChange={(e) =>
                onBpmChange(clampBpm(Number(e.currentTarget.value)))
              }
            />
            BPM
          </label>
          {playingAt === undefined ? (
            <button
              type="button"
              class="play"
              onClick={onPlay}
              disabled={path.length === 0}
            >
              ▶ Play
            </button>
          ) : (
            <button type="button" class="play" onClick={onStop}>
              ■ Stop
            </button>
          )}
          <button type="button" onClick={onUndo} disabled={!canUndo}>
            ⟲ Undo
          </button>
          <button type="button" onClick={onRedo} disabled={!canRedo}>
            ⟳ Redo
          </button>
          <span class="octave-all" role="group" aria-label="Every chord">
            Octave
            <button
              type="button"
              aria-label="Every chord down an octave"
              title="Every chord down an octave"
              onClick={() => onShiftAll(-1)}
              disabled={path.length === 0}
            >
              ▼
            </button>
            <button
              type="button"
              aria-label="Every chord up an octave"
              title="Every chord up an octave"
              onClick={() => onShiftAll(1)}
              disabled={path.length === 0}
            >
              ▲
            </button>
          </span>
          <button
            type="button"
            aria-expanded={treeOpen}
            onClick={() => setTreeOpen(!treeOpen)}
            disabled={path.length === 0}
          >
            🌳 Tree
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Clear the whole progression? Undo brings it back.'))
                onClear()
            }}
            disabled={path.length === 0}
          >
            Clear
          </button>
        </div>
      </div>
      <ol class="chips">
        {path.map((n, i) => {
          const options = alternatives(progression, i)
          const at = options.indexOf(n.id)
          const key = keyAt(progression, i, sectionKey)
          const placed = timing[i]
          return [
            <li
              key={`${i}-${n.id}`}
              class={[
                i === selected ? 'selected' : '',
                i === playingAt ? 'playing' : '',
              ].join(' ')}
            >
              <button
                type="button"
                class="chip"
                style={{ minWidth: `${2.6 + chipWidth(placed.length)}rem` }}
                aria-pressed={i === selected}
                onClick={() => onSelect(i)}
              >
                <span class="bar-number">
                  {placed.beat === 1 ? `Bar ${placed.bar}` : '\u00a0'}
                </span>
                <span class="symbol">{chordSymbol(n.chord)}</span>
                <span class="numeral">
                  {romanNumeral(key, n.chord).numeral}
                </span>
                {n.length && (
                  <span class="length-label">
                    {lengthLabel(meterOfBar(time, placed.bar), n.length)}
                  </span>
                )}
                <BeatDots placed={placed} />
                {n.keyChange && (
                  <span class="key-change">→ {keyName(n.keyChange)}</span>
                )}
                {n.octave ? (
                  <span class="octave-label">
                    {n.octave > 0 ? '+' : '−'}
                    {Math.abs(n.octave)} oct
                  </span>
                ) : null}
              </button>
              {i === selected && (
                <span class="octave-one">
                  <button
                    type="button"
                    aria-label={`${chordSymbol(n.chord)} down an octave`}
                    title="Down an octave"
                    onClick={() => onShift(i, -1)}
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    aria-label={`${chordSymbol(n.chord)} up an octave`}
                    title="Up an octave"
                    onClick={() => onShift(i, 1)}
                  >
                    ▲
                  </button>
                </span>
              )}
              {options.length > 1 && (
                <span class="alts">
                  <button
                    type="button"
                    aria-label="Previous alternative"
                    onClick={() => onSwitch(i, -1)}
                  >
                    ‹
                  </button>
                  {at + 1}/{options.length}
                  <button
                    type="button"
                    aria-label="Next alternative"
                    onClick={() => onSwitch(i, 1)}
                  >
                    ›
                  </button>
                </span>
              )}
            </li>,
            i === selected && i + 1 < path.length && (
              <li key={`between-${i}`} class="between">
                <button
                  type="button"
                  class={between === i ? 'chip passing active' : 'chip passing'}
                  aria-pressed={between === i}
                  title={`Suggest a passing chord between ${chordSymbol(n.chord)} and ${chordSymbol(path[i + 1].chord)}`}
                  onClick={() => onBetween(i)}
                >
                  + between
                </button>
              </li>
            ),
          ]
        })}
        <li>
          <button
            type="button"
            class="chip add"
            onClick={onAddFree}
            disabled={!freeChord}
            title={
              freeChord
                ? `Add ${chordSymbol(freeChord)} after the selected chord`
                : 'Pick a chord in Explore, or play one, to add it'
            }
          >
            + {freeChord ? chordSymbol(freeChord) : ''}
          </button>
        </li>
      </ol>
      <TypeChords
        where={
          between !== undefined
            ? `between ${chordSymbol(path[between].chord)} and ${chordSymbol(path[between + 1].chord)}`
            : selectedNode
              ? `after ${chordSymbol(selectedNode.chord)}`
              : 'to start the progression'
        }
        onAdd={onAddTyped}
      />
      {selectedNode && (
        <div class="strip-info">
          <p>
            <strong>{chordSymbol(selectedNode.chord)}</strong> ·{' '}
            {selectedInsight?.reading}{' '}
            <InfoToggle
              open={infoOpen}
              label={chordSymbol(selectedNode.chord)}
              onToggle={toggleInfo}
            />
          </p>
          <ChordTime
            time={time}
            placed={timing[selected]}
            length={selectedNode.length}
            onLengthChange={onLengthChange}
            onTimeChange={onTimeChange}
          />
          {infoOpen && selectedInsight && (
            <InfoPanel insight={selectedInsight} />
          )}
        </div>
      )}
      {path.length === 0 && (
        <p class="muted">
          Empty so far. Type some chords above, pick a chord in Explore and add
          it with +, play one with Record chords on, or use a suggestion from
          the Suggest tab.
        </p>
      )}
      {treeOpen && (
        <Tree
          progression={progression}
          onPick={(id) => {
            onPickNode(id)
            setTreeOpen(false)
          }}
        />
      )}
    </section>
  )
}

// Typing chords (Phase 5 task 1): chord symbols in either style, separated
// by spaces, commas or bar lines. Nothing is added while any word can't be
// read, so a typo doesn't leave half a progression.
function TypeChords({
  where,
  onAdd,
}: {
  where: string // where the chords will go, e.g. "after G"
  onAdd: (chords: ChordName[]) => void
}) {
  const [text, setText] = useState('')
  const [problem, setProblem] = useState('')
  function submit(e: Event) {
    e.preventDefault()
    const typed = readTypedChords(text)
    if (typed.unread.length) {
      const words = typed.unread.map((w) => `"${w}"`).join(', ')
      setProblem(
        `${words} ${typed.unread.length > 1 ? "aren't chord symbols" : "isn't a chord symbol"}, so nothing was added.`,
      )
      return
    }
    if (!typed.chords.length) return
    onAdd(typed.chords)
    setText('')
    setProblem('')
  }
  return (
    <form class="type-chords" onSubmit={submit}>
      <label>
        Type chords
        <input
          type="text"
          value={text}
          placeholder="e.g. Em C G D"
          autocomplete="off"
          spellcheck={false}
          onInput={(e) => setText(e.currentTarget.value)}
        />
      </label>
      <button type="submit" disabled={!text.trim()}>
        Add {where}
      </button>
      {problem && <p class="muted problem">{problem}</p>}
    </form>
  )
}

// The tree view (SPEC 6.5): every branch, the active path marked. Tap a
// chord to make the path through it active.
function Tree({
  progression,
  onPick,
}: {
  progression: Progression
  onPick: (id: string) => void
}) {
  const active = new Set(progression.activePath)
  const branch = (ids: string[]) => (
    <ul>
      {ids.map((id) => {
        const n: ChordNode = progression.nodes[id]
        return (
          <li key={id}>
            <button
              type="button"
              class={active.has(id) ? 'active' : ''}
              onClick={() => onPick(id)}
            >
              {chordSymbol(n.chord)}
            </button>
            {n.children.length > 0 && branch(n.children)}
          </li>
        )
      })}
    </ul>
  )
  return (
    <div class="tree" aria-label="Every branch">
      {branch(progression.roots)}
    </div>
  )
}

// The beat that last sounded during playback: how many beats and bars so
// far, and how strong it was.
export type Pulse = { beats: number; bars: number; strength: BeatStrength }

// Two lights that flash in time while the progression plays (David's
// request): amber on every beat, brighter on strong beats, and red on the
// first beat of each bar. Each flash remounts its light, restarting the
// fade.
function BeatLights({ pulse }: { pulse: Pulse | undefined }) {
  return (
    <span class="beat-lights" aria-hidden="true">
      <i
        key={`beat-${pulse?.beats ?? 0}`}
        class={pulse ? `light beat flash ${pulse.strength}` : 'light beat'}
        title="Beat"
      />
      <i
        key={`bar-${pulse?.bars ?? 0}`}
        class={pulse && pulse.bars > 0 ? 'light bar flash' : 'light bar'}
        title="Bar"
      />
    </span>
  )
}

// Chips grow with their length: a bar of 4/4 adds 1.6rem.
function chipWidth(length: Dur): number {
  return ratioOf(length, { n: 1, d: 1 }) * 1.6
}

// The beats a chord covers, under its symbol: the downbeat largest, strong
// beats filled, weak beats hollow, with a bar line where a new bar starts.
function BeatDots({ placed }: { placed: Placement }) {
  return (
    <span
      class="beat-dots"
      aria-label={
        placed.beat
          ? `Starts on beat ${placed.beat} of bar ${placed.bar}`
          : `Starts between beats in bar ${placed.bar}`
      }
    >
      {placed.beats.map((b, i) => [
        b.beat === 1 && i > 0 && <i key={`bar-${b.bar}`} class="bar-line" />,
        <i key={`${b.bar}-${b.beat}`} class={b.strength} />,
      ])}
    </span>
  )
}

// The selected chord's place in time: its length, counted in its bar's
// meter, where it starts, and that bar's own time signature, which can
// differ from the section's (a bar of 2/4 in a 4/4 verse).
function ChordTime({
  time,
  placed,
  length,
  onLengthChange,
  onTimeChange,
}: {
  time: MeterMap
  placed: Placement
  length: Dur | undefined
  onLengthChange: (length: Dur | undefined) => void
  onTimeChange: (time: MeterMap) => void
}) {
  const meter = meterOfBar(time, placed.bar)
  const bar = time.barMeters?.[placed.bar]
  // One bar is stored as no length, so it follows the bar's meter.
  const choices: (Dur | undefined)[] = lengthChoices(meter).map((d) =>
    durEquals(d, barLength(meter)) ? undefined : d,
  )
  if (length && !choices.some((c) => c && durEquals(c, length))) {
    choices.push(length)
  }
  const value = (d: Dur | undefined) => (d ? `${d.n}/${d.d}` : '')
  return (
    <div class="chord-time">
      <label class="length">
        Length
        <select
          value={value(length)}
          onChange={(e) =>
            onLengthChange(
              choices.find((c) => value(c) === e.currentTarget.value),
            )
          }
        >
          {choices.map((d) => (
            <option key={value(d)} value={value(d)}>
              {d ? lengthLabel(meter, d) : '1 bar'}
            </option>
          ))}
        </select>
      </label>
      <span class="starts">
        {placed.beat
          ? `Starts bar ${placed.bar}, beat ${placed.beat}`
          : `Starts between beats in bar ${placed.bar}`}
      </span>
      <label class="bar-meter">
        Bar {placed.bar} in
        <select
          value={bar ? meterId(bar) : ''}
          onChange={(e) => {
            const option = METER_OPTIONS.find(
              (o) => o.id === e.currentTarget.value,
            )
            onTimeChange(setBarMeter(time, placed.bar, option?.meter))
          }}
        >
          <option value="">{meterLabel(time.meter)}, as the section</option>
          {METER_OPTIONS.filter((o) => o.id !== meterId(time.meter)).map(
            (o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ),
          )}
        </select>
      </label>
    </div>
  )
}
