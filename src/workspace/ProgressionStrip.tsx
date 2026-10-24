import { useState } from 'preact/hooks'
import {
  ZERO,
  addDur,
  barLength,
  beatsOf,
  chordInsight,
  compareDur,
  CHORD_STYLES,
  chordStyle,
  chordSymbol,
  inversionOf,
  inversionStepLabel,
  durEquals,
  keyName,
  lengthChoices,
  lengthLabel,
  meterLabel,
  meterOfBar,
  ratioOf,
  romanNumeral,
  subDur,
  type BeatStrength,
  type ChordName,
  type Dur,
  type Key,
  type Meter,
  type MeterMap,
  type Placement,
} from '../theory'
import {
  alternatives,
  keyAt,
  pathNodes,
  styleAt,
  type ChordNode,
  type Progression,
} from '../sketch/progression'
import { InfoPanel, InfoToggle, useToggle } from './ChordInfo'
import { BAR_REM } from './MelodyLane'
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
  onClearAll,
  onPickNode,
  playingAt,
  onPlay,
  onStop,
  pulse,
  time,
  timing,
  onTimeChange,
  onLengthChange,
  between,
  onBetween,
  onShift,
  onRemove,
  onShiftAll,
  onChordStyle,
  onStyleAt,
  onStep,
  onHear,
  showInfo = true,
  barCount = 0,
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
  // Clears chords, rows and melody alike (David's request).
  onClearAll: () => void
  onPickNode: (id: string) => void
  playingAt: number | undefined
  onPlay: () => void
  onStop: () => void
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
  // Takes the chord at a slot out of the progression (David's request).
  onRemove: (index: number) => void
  onShiftAll: (by: number) => void
  // How the chords are played (David's request): for the whole
  // progression, and a chord's own, undefined to play as the rest do.
  onChordStyle: (style: string) => void
  onStyleAt: (index: number, style: string | undefined) => void
  // Steps a chord up (1) or down (-1) an inversion: C, C/E, C/G, then C
  // an octave up (David's request).
  onStep: (index: number, by: 1 | -1) => void
  // Plays a chord through its length in its style.
  onHear: (index: number) => void
  // The selected chord's options show (only one set of options is open
  // at a time, David's request).
  showInfo?: boolean
  // How many bars the lane shows, so the chords line up with it.
  barCount?: number
}) {
  const [treeOpen, setTreeOpen] = useState(false)
  // The less-used controls fold away (David's request).
  const [moreOpen, setMoreOpen] = useState(false)
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
  const selectedOptions =
    selected >= 0 ? alternatives(progression, selected) : []
  // The chords laid out bar by bar on the timeline, as wide as their
  // bars, lined up with the melody lane and the rows (David's request).
  const strips = chordStrips(path.length, timing, time, barCount)
  return (
    <section class="strip part-row" aria-label="Progression">
      <div class="part-head strip-bar">
        <h2>♬ Progression</h2>
        <div class="strip-tools">
          <BeatLights pulse={pulse} />
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
          <button
            type="button"
            class="strip-more-toggle"
            aria-expanded={moreOpen}
            title={
              moreOpen
                ? 'Hide the time, tempo, octave, tree and clear controls'
                : 'Show the time, tempo, octave, tree and clear controls'
            }
            onClick={() => setMoreOpen(!moreOpen)}
          >
            {moreOpen ? '▾ Less' : '▸ More'}
          </button>
        </div>
      </div>
      {moreOpen && (
        <div class="strip-more">
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
              if (
                confirm(
                  'Clear the chords and their rows? The melody stays. Undo brings them back.',
                )
              )
                onClear()
            }}
            disabled={path.length === 0}
            title="Clear the chords and their rows; the melody stays (Undo brings them back)"
          >
            Clear chords
          </button>
          <button
            type="button"
            title="Clear everything: the chords, the rows, the melody and its harmonies (Undo brings them back)"
            onClick={() => {
              if (
                confirm(
                  'Clear everything: chords, rows, melody and harmonies? Undo brings it back.',
                )
              )
                onClearAll()
            }}
          >
            Clear everything
          </button>
          {path.length > 0 && (
            <label
              class="chord-style"
              title={
                CHORD_STYLES.find(
                  (s) => s.id === chordStyle(progression.chordStyle),
                )?.explanation
              }
            >
              Chords play
              <select
                value={chordStyle(progression.chordStyle)}
                onChange={(e) => onChordStyle(e.currentTarget.value)}
              >
                {CHORD_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
      <div class="lane-bars chord-lane">
        {strips.map((strip) => {
          const pct = (d: Dur) => `${ratioOf(d, strip.length) * 100}%`
          return (
            <div
              key={strip.bar}
              class="lane-bar"
              style={{
                width: `${ratioOf(strip.length, { n: 1, d: 1 }) * BAR_REM}rem`,
              }}
            >
              <div class="lane-head">
                <span class="muted">Bar {strip.bar}</span>
              </div>
              <div class="lane-ruler">
                {beatsOf(strip.meter).map((b, k) => (
                  <span key={k} style={{ left: pct(b.onset) }}>
                    {k + 1}
                  </span>
                ))}
              </div>
              <div class="lane-track">
                {strip.chords.map((c) => {
                  const n = path[c.index]
                  const i = c.index
                  const key = keyAt(progression, i, sectionKey)
                  const marks = [
                    n.keyChange && `→ ${keyName(n.keyChange)}`,
                    n.style !== undefined &&
                      CHORD_STYLES.find((x) => x.id === styleAt(progression, i))
                        ?.label,
                    (n.octave || inversionOf(n.chord)) &&
                      inversionStepLabel(
                        inversionOf(n.chord) ?? 0,
                        n.octave ?? 0,
                      ),
                    alternatives(progression, i).length > 1 &&
                      `${alternatives(progression, i).indexOf(n.id) + 1}/${alternatives(progression, i).length}`,
                  ].filter(Boolean)
                  return (
                    <button
                      type="button"
                      key={i}
                      class={[
                        'lane-note',
                        'chord-box',
                        i === selected ? 'selected' : '',
                        i === playingAt ? 'sounding' : '',
                        c.tiedIn ? 'tied-in' : '',
                        c.tiedOut ? 'tied-out' : '',
                      ].join(' ')}
                      style={{
                        left: pct(c.from),
                        width: pct(subDur(c.to, c.from)),
                      }}
                      aria-pressed={i === selected}
                      title={[
                        `${chordSymbol(n.chord)}, ${romanNumeral(key, n.chord).numeral}`,
                        ...marks,
                      ].join(' · ')}
                      onClick={() => onSelect(i)}
                    >
                      <span class="lane-name">
                        {c.tiedIn ? '⌒' : ''}
                        {chordSymbol(n.chord)}
                      </span>
                      {!c.tiedIn && (
                        <span class="chord-numeral">
                          {romanNumeral(key, n.chord).numeral}
                          {marks.length > 0 ? ' •' : ''}
                        </span>
                      )}
                    </button>
                  )
                })}
                {strip.add && (
                  <button
                    type="button"
                    class="lane-note chord-box chord-add"
                    style={{
                      left: pct(strip.add.from),
                      width: pct(subDur(strip.add.to, strip.add.from)),
                    }}
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
                )}
              </div>
            </div>
          )
        })}
      </div>
      {selectedNode && showInfo && (
        <div class="strip-info row-tools">
          <div class="place-options chord-tools">
            <span class="octave-one">
              <button
                type="button"
                aria-label={`${chordSymbol(selectedNode.chord)} down an inversion`}
                title="Down an inversion: the chord tone below in the bass (C, C/G, C/E, then C an octave down)"
                onClick={() => onStep(selected, -1)}
              >
                ▼
              </button>
              <button
                type="button"
                aria-label={`${chordSymbol(selectedNode.chord)} up an inversion`}
                title="Up an inversion: the next chord tone in the bass (C, C/E, C/G, then C an octave up)"
                onClick={() => onStep(selected, 1)}
              >
                ▲
              </button>
              <button
                type="button"
                class="octave-step"
                aria-label={`${chordSymbol(selectedNode.chord)} down an octave`}
                title="Down a whole octave"
                onClick={() => onShift(selected, -1)}
              >
                ▼8ve
              </button>
              <button
                type="button"
                class="octave-step"
                aria-label={`${chordSymbol(selectedNode.chord)} up an octave`}
                title="Up a whole octave"
                onClick={() => onShift(selected, 1)}
              >
                ▲8ve
              </button>
              <button
                type="button"
                class="remove"
                aria-label={`Remove ${chordSymbol(selectedNode.chord)}`}
                title="Take this chord out (Undo brings it back)"
                onClick={() => onRemove(selected)}
              >
                ✕
              </button>
            </span>
            {selectedOptions.length > 1 && (
              <span class="alts">
                <button
                  type="button"
                  aria-label="Previous alternative"
                  onClick={() => onSwitch(selected, -1)}
                >
                  ‹
                </button>
                {selectedOptions.indexOf(selectedNode.id) + 1}/
                {selectedOptions.length}
                <button
                  type="button"
                  aria-label="Next alternative"
                  onClick={() => onSwitch(selected, 1)}
                >
                  ›
                </button>
              </span>
            )}
            {selected + 1 < path.length && (
              <button
                type="button"
                class={
                  between === selected ? 'chip passing active' : 'chip passing'
                }
                aria-pressed={between === selected}
                title={`Suggest a passing chord between ${chordSymbol(selectedNode.chord)} and ${chordSymbol(path[selected + 1].chord)}`}
                onClick={() => onBetween(selected)}
              >
                + between
              </button>
            )}
          </div>
          <p>
            <strong>{chordSymbol(selectedNode.chord)}</strong> ·{' '}
            {selectedInsight?.reading}{' '}
            <InfoToggle
              open={infoOpen}
              label={chordSymbol(selectedNode.chord)}
              onToggle={toggleInfo}
            />
          </p>
          <label class="chord-style">
            This chord plays
            <select
              value={
                selectedNode.style === undefined
                  ? ''
                  : styleAt(progression, selected)
              }
              onChange={(e) =>
                onStyleAt(selected, e.currentTarget.value || undefined)
              }
            >
              <option value="">
                As the progression (
                {
                  CHORD_STYLES.find(
                    (s) => s.id === chordStyle(progression.chordStyle),
                  )?.label
                }
                )
              </option>
              {CHORD_STYLES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            class="hear-style"
            title="Hear this chord for its length, as it plays"
            onClick={() => onHear(selected)}
          >
            ▶ Hear it
          </button>
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

// The time signature and tempo, for the whole song: at the top beside the
// key (David's request: the progression's less-used controls tidied away).
export function TimeAndTempo({
  time,
  bpm,
  onTimeChange,
  onBpmChange,
}: {
  time: MeterMap
  bpm: number
  onTimeChange: (time: MeterMap) => void
  onBpmChange: (bpm: number) => void
}) {
  return (
    <span class="time-tempo">
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
          onChange={(e) => onBpmChange(clampBpm(Number(e.currentTarget.value)))}
        />
        BPM
      </label>
    </span>
  )
}

type ChordStrip = {
  bar: number
  length: Dur
  meter: Meter
  chords: {
    index: number
    from: Dur
    to: Dur
    tiedIn: boolean
    tiedOut: boolean
  }[]
  add?: { from: Dur; to: Dur } // the space after the last chord, for +
}

// Each bar with the chords sounding in it, from its start, and where the
// + for a new chord goes: after the last chord, in its bar or the next.
export function chordStrips(
  count: number,
  timing: Placement[],
  time: MeterMap,
  barCount: number,
): ChordStrip[] {
  const end = count
    ? addDur(timing[count - 1].start, timing[count - 1].length)
    : ZERO
  const strips: ChordStrip[] = []
  let start = ZERO
  let added = false
  for (let bar = 1; ; bar++) {
    const meter = meterOfBar(time, bar)
    const length = barLength(meter)
    const barEnd = addDur(start, length)
    if (bar > barCount && compareDur(start, end) >= 0 && added) break
    const chords: ChordStrip['chords'] = []
    for (let i = 0; i < count; i++) {
      const t = timing[i]
      const tEnd = addDur(t.start, t.length)
      if (compareDur(tEnd, start) <= 0 || compareDur(t.start, barEnd) >= 0)
        continue
      const from = compareDur(t.start, start) > 0 ? t.start : start
      const to = compareDur(tEnd, barEnd) < 0 ? tEnd : barEnd
      chords.push({
        index: i,
        from: subDur(from, start),
        to: subDur(to, start),
        tiedIn: compareDur(t.start, start) < 0,
        tiedOut: compareDur(tEnd, barEnd) > 0,
      })
    }
    const strip: ChordStrip = { bar, length, meter, chords }
    if (!added && compareDur(end, barEnd) < 0) {
      const from = compareDur(end, start) > 0 ? subDur(end, start) : ZERO
      strip.add = { from, to: length }
      added = true
    }
    strips.push(strip)
    start = barEnd
  }
  return strips
}
