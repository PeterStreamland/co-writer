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
  pathNodes,
  type ChordNode,
  type Progression,
} from '../sketch/progression'
import { InfoPanel, InfoToggle, useToggle } from './ChordInfo'

// The progression strip (SPEC 2, 6.5): the active path of the section's
// progression. Tap a chord to select it (suggestions then follow it); the
// arrows under a chord switch between its alternatives; + adds the current
// chord after the selected one. Play plays every chord from the start.
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
  onUndo,
  onRedo,
  onClear,
  onPickNode,
  playingAt,
  onPlay,
  onStop,
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
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onPickNode: (id: string) => void
  playingAt: number | undefined
  onPlay: () => void
  onStop: () => void
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
          return (
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
                aria-pressed={i === selected}
                onClick={() => onSelect(i)}
              >
                <span class="symbol">{chordSymbol(n.chord)}</span>
                <span class="numeral">
                  {romanNumeral(key, n.chord).numeral}
                </span>
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
            </li>
          )
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
          {infoOpen && selectedInsight && (
            <InfoPanel insight={selectedInsight} />
          )}
        </div>
      )}
      {path.length === 0 && (
        <p class="muted">
          Empty so far. Pick a chord in Explore and add it with +, or use a
          suggestion from the Suggest tab.
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
