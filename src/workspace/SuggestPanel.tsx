import { useEffect, useMemo, useState } from 'preact/hooks'
import {
  CATEGORY_LABELS,
  chordInsight,
  chordKey,
  chordSymbol,
  keyName,
  rankNextChords,
  rankPassingChords,
  romanNumeral,
  type ChordName,
  type Key,
  type NextChordSuggestion,
  type StyleWeights,
} from '../theory'
import { InfoPanel, InfoToggle } from './ChordInfo'

// The Suggest tab (SPEC 6.2): what could follow the chords so far (the
// strip up to the selected chord, plus the current chord when it isn't in
// the strip), six to eight grouped by category, then the wildcard with
// Another. Clicking a suggestion previews it (the last chord, then the
// suggestion, shown on the instrument); + adds it to the strip, so the
// suggestions carry on from it. With no chords yet, it offers places to
// start.
export function SuggestPanel({
  keyValue,
  previous,
  next,
  onLeave,
  weights,
  preview,
  onPreview,
  onAccept,
}: {
  keyValue: Key
  previous: ChordName[]
  // With a next chord, the panel offers passing chords to put between the
  // last chord and it (SPEC 6.7); onLeave goes back to what comes next.
  next?: ChordName
  onLeave?: () => void
  weights: StyleWeights | undefined
  preview: NextChordSuggestion | undefined
  onPreview: (s: NextChordSuggestion) => void
  onAccept: (s: NextChordSuggestion) => void
}) {
  const [another, setAnother] = useState(0)
  const history = previous.map(chordKey).join(' ')
  const target = next && chordKey(next)
  useEffect(() => setAnother(0), [keyValue, history, target, weights])
  const ranked = useMemo(
    () =>
      next
        ? rankPassingChords(
            { key: keyValue, previous, next, weights },
            { another },
          )
        : rankNextChords({ key: keyValue, previous, weights }, { another }),
    [keyValue, history, target, weights, another],
  )
  const chord = previous.at(-1)
  // The suggestion whose ⓘ panel is open, if any.
  const [openId, setOpenId] = useState<string>()

  const card = (s: NextChordSuggestion, wildcard = false) => {
    const id = chordKey(s.candidate) + (s.keyChange ? keyName(s.keyChange) : '')
    const previewing =
      preview !== undefined &&
      chordKey(preview.candidate) === chordKey(s.candidate) &&
      preview.keyChange === s.keyChange
    const symbol = chordSymbol(s.candidate)
    return (
      <li key={id} class={previewing ? 'suggestion previewing' : 'suggestion'}>
        <button
          type="button"
          class="preview"
          aria-pressed={previewing}
          onClick={() => onPreview(s)}
        >
          <span class="symbol">{symbol}</span>
          <span class="numeral">
            {romanNumeral(keyValue, s.candidate).numeral}
            {s.keyChange && ` → ${keyName(s.keyChange)}`}
          </span>
          {wildcard && <span class="badge">Wildcard</span>}
        </button>
        <button
          type="button"
          class="accept"
          aria-label={`Use ${symbol}`}
          title={`Use ${symbol}`}
          onClick={() => onAccept(s)}
        >
          +
        </button>
        <p class="why">
          {s.explanation}{' '}
          <InfoToggle
            open={openId === id}
            label={symbol}
            onToggle={() => setOpenId(openId === id ? undefined : id)}
          />
        </p>
        {s.contextNotes.length > 0 && openId !== id && (
          <p class="context">
            {s.contextNotes.length === 1
              ? s.contextNotes[0]
              : `${s.contextNotes[0]} (and more under ⓘ)`}
          </p>
        )}
        {openId === id && (
          <InfoPanel
            insight={chordInsight(keyValue, s.candidate, chord)}
            also={s.more}
            contextNotes={s.contextNotes}
          />
        )}
      </li>
    )
  }

  return (
    <section class="suggest">
      {next && chord ? (
        <>
          <h2>
            Between {chordSymbol(chord)} and {chordSymbol(next)}
          </h2>
          <p class="muted">
            Passing chords: tap one to hear all three; + puts it between them.{' '}
            <button type="button" class="leave" onClick={onLeave}>
              Back to what comes next
            </button>
          </p>
        </>
      ) : (
        <>
          <h2>{chord ? `After ${chordSymbol(chord)}` : 'Places to start'}</h2>
          <p class="muted">
            {chord
              ? 'Tap a chord to hear it after the last one; + to add it to the progression and carry on from there.'
              : 'Pick a chord in Explore, play one, or start from one of these.'}
          </p>
        </>
      )}
      {ranked.groups.map((group) => (
        <div key={group.category} class="group">
          <h3>{CATEGORY_LABELS[group.category]}</h3>
          <ul>{group.suggestions.map((s) => card(s))}</ul>
        </div>
      ))}
      {ranked.wildcard && (
        <div class="group wildcard">
          <h3>
            Wildcard{' '}
            <button
              type="button"
              class="another"
              disabled={ranked.wildcards < 2}
              onClick={() => setAnother(another + 1)}
            >
              Another
            </button>
          </h3>
          <ul>{card(ranked.wildcard, true)}</ul>
        </div>
      )}
    </section>
  )
}
