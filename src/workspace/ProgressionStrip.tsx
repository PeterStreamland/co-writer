import { useState } from 'preact/hooks'
import {
  chordInsight,
  chordSymbol,
  keyName,
  romanNumeral,
  type ChordName,
  type Key,
} from '../theory'
import {
  alternatives,
  keyAt,
  lengthOf,
  pathNodes,
  type ChordNode,
  type Progression,
} from '../sketch/progression'
import { InfoPanel, InfoToggle, useToggle } from './ChordInfo'
import { readTypedChords } from './typed-chords'
import {
  LENGTH_CHOICES,
  MAX_BPM,
  MIN_BPM,
  beatsOf,
  clampBpm,
  durOfBeats,
  lengthLabel,
  type Dur,
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
  onLengthChange,
  between,
  onBetween,
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
  // Sets the selected chord's length.
  onLengthChange: (length: Dur) => void
  // The slot whose gap to the next chord is being filled, if any.
  between: number | undefined
  onBetween: (index: number) => void
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
          <label class="tempo">
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
                style={{ minWidth: `${2.6 + beatsOf(lengthOf(n)) * 0.4}rem` }}
                aria-pressed={i === selected}
                onClick={() => onSelect(i)}
              >
                <span class="symbol">{chordSymbol(n.chord)}</span>
                <span class="numeral">
                  {romanNumeral(key, n.chord).numeral}
                </span>
                {n.length && (
                  <span class="length-label">
                    {lengthLabel(beatsOf(n.length))}
                  </span>
                )}
                {n.keyChange && (
                  <span class="key-change">→ {keyName(n.keyChange)}</span>
                )}
              </button>
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
          <label class="length">
            Length
            <select
              value={beatsOf(lengthOf(selectedNode))}
              onChange={(e) =>
                onLengthChange(durOfBeats(Number(e.currentTarget.value)))
              }
            >
              {LENGTH_CHOICES.map((beats) => (
                <option key={beats} value={beats}>
                  {lengthLabel(beats)}
                </option>
              ))}
            </select>
          </label>
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
