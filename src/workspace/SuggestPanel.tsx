import { useEffect, useMemo, useState } from 'preact/hooks'
import {
  CATEGORY_LABELS,
  chordKey,
  chordSymbol,
  keyName,
  rankNextChords,
  romanNumeral,
  type ChordName,
  type Key,
  type NextChordSuggestion,
  type StyleWeights,
} from '../theory'

// The Suggest tab (SPEC 6.2): what could follow the current chord, six to
// eight grouped by category, then the wildcard with Another. Clicking a
// suggestion previews it (the current chord, then the suggestion, shown on
// the instrument); + makes it the current chord, so the suggestions carry on
// from it. With no chord yet, it offers places to start.
export function SuggestPanel({
  keyValue,
  chord,
  weights,
  preview,
  onPreview,
  onAccept,
}: {
  keyValue: Key
  chord: ChordName | undefined
  weights: StyleWeights | undefined
  preview: NextChordSuggestion | undefined
  onPreview: (s: NextChordSuggestion) => void
  onAccept: (s: NextChordSuggestion) => void
}) {
  const [another, setAnother] = useState(0)
  useEffect(() => setAnother(0), [keyValue, chord, weights])
  const ranked = useMemo(
    () =>
      rankNextChords(
        { key: keyValue, previous: chord ? [chord] : [], weights },
        { another },
      ),
    [keyValue, chord, weights, another],
  )

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
        <p class="why">{s.explanation}</p>
        {s.contextNotes.map((note) => (
          <p key={note} class="context">
            {note}
          </p>
        ))}
      </li>
    )
  }

  return (
    <section class="suggest">
      <h2>{chord ? `After ${chordSymbol(chord)}` : 'Places to start'}</h2>
      <p class="muted">
        {chord
          ? 'Tap a chord to hear it after the current one; + to use it and carry on from there.'
          : 'Pick a chord in Explore, play one, or start from one of these.'}
      </p>
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
