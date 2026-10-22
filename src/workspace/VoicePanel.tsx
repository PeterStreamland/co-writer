import { useEffect, useMemo, useState } from 'preact/hooks'
import {
  EXPERIMENTAL_LENSES,
  LENSES,
  LENS_SETTINGS,
  averageMovement,
  chordSymbol,
  formatNote,
  voiceProgression,
  type ChordName,
  type Key,
  type Lens,
  type LensChoice,
  type LensVoicing,
} from '../theory'
import { playChord } from '../audio/player'
import { chordBox } from '../instruments/chord-box'
import { formatFrets } from '../instruments/fingering'
import type { Guitar } from '../instruments/guitar'
import {
  voiceProgressionOnGuitar,
  type GuitarLensVoicing,
} from '../instruments/lens-guitar'
import type { Progression } from '../sketch/progression'
import { secondsOf } from '../sketch/time'
import { BoxDiagram } from './ChordBoxes'
import type { Instrument } from './InstrumentView'
import {
  MAX_LENSES,
  lensSteps,
  loadLenses,
  saveLenses,
  toggleLens,
} from './lens-columns'

// What each lens is after, under its name.
const LENS_BLURBS: Record<Lens, string> = {
  classical: 'Four smooth, strict parts: no parallels, tendency notes resolve.',
  rock: 'Power chords low down, moving in parallel; no 3rds under the gain.',
  open: 'A low bass under wide, ringing notes, with add9 and sus colours.',
  jazz: '7th chords as rootless voicings, shells and drop-2.',
  quartal: 'Notes of the key stacked in 4ths over the root: open, floating.',
  cluster: 'The chord squeezed close, with a 2nd, 4th or 6th from the key.',
  upper: 'Another triad from the key floating over the root, 3rd and 7th.',
  drone: 'The key note held low under every chord, the chords moving above.',
  wildcard:
    'Any lens, by chance, still moving smoothly. Fresh every time: Another rolls again.',
}

type Choice = LensChoice<LensVoicing | GuitarLensVoicing>

// How far a swipe must go to change lens on a phone, in pixels.
const SWIPE = 50

// The Voice tab (Phase 5 task 5, SPEC 8): the progression voiced through two
// to four lenses side by side (from the four core lenses and the experimental
// ones), on guitar or keyboard for all of them at once,
// each column with its own Play. Tap a chord to hear it. Each column can go
// into the progression as a new branch, or on the end (David's request). On
// a phone one lens shows at a time; swipe or use the arrows to change it.
export function VoicePanel({
  progression,
  sectionKey,
  guitar,
  instrument: startInstrument,
  bpm,
  narrow,
  onUse,
}: {
  progression: Progression
  sectionKey: Key
  guitar: Guitar
  instrument: Instrument
  bpm: number
  narrow: boolean
  // Puts a lens's voicings into the progression.
  onUse: (
    voicings: (LensVoicing | GuitarLensVoicing)[],
    instrument: Instrument,
    where: 'branch' | 'end',
  ) => void
}) {
  const [lenses, setLenses] = useState(loadLenses)
  useEffect(() => saveLenses(lenses), [lenses])
  const [instrument, setInstrument] = useState(startInstrument)
  const [phoneAt, setPhoneAt] = useState(0)
  const steps = useMemo(
    () => lensSteps(progression, sectionKey),
    [progression, sectionKey],
  )
  const shown = narrow
    ? lenses.slice(phoneAt % lenses.length, (phoneAt % lenses.length) + 1)
    : lenses
  const voice = (lens: Lens) =>
    (instrument === 'guitar'
      ? voiceProgressionOnGuitar(guitar, lens, steps)
      : voiceProgression(lens, steps)) as Choice[]
  const settled = useMemo(
    () =>
      shown
        .filter((l) => l !== 'wildcard')
        .map((lens) => ({ lens, choices: voice(lens) })),
    [steps, instrument, guitar, shown.join()],
  )
  // The Wildcard rolls fresh whenever the progression or instrument changes,
  // and again on Another (David's choice).
  const [rolls, setRolls] = useState(0)
  const wild = useMemo(
    () => (shown.includes('wildcard') ? voice('wildcard') : []),
    [steps, instrument, guitar, shown.includes('wildcard'), rolls],
  )
  const columns = shown.map(
    (lens) => settled.find((c) => c.lens === lens) ?? { lens, choices: wild },
  )
  // The column playing and the chord sounding in it.
  const [playing, setPlaying] = useState<{ lens: Lens; at: number }>()
  useEffect(() => setPlaying(undefined), [settled, wild])
  useEffect(() => {
    if (!playing) return
    const column = columns.find((c) => c.lens === playing.lens)
    const choice = column?.choices[playing.at]
    if (!choice) {
      setPlaying(undefined)
      return
    }
    const seconds = secondsOf(steps[playing.at].length, bpm)
    play(choice, seconds)
    const timer = setTimeout(() => {
      const next = playing.at + 1
      setPlaying(next < steps.length ? { ...playing, at: next } : undefined)
    }, seconds * 1000)
    return () => clearTimeout(timer)
  }, [playing])
  function play(choice: Choice, seconds?: number) {
    void playChord(choice.voicing.notes, {
      strum: instrument === 'guitar',
      seconds,
    })
  }
  const step = (by: number) =>
    setPhoneAt((phoneAt + by + lenses.length) % Math.max(1, lenses.length))
  const [touchX, setTouchX] = useState<number>()

  if (steps.length === 0) {
    return (
      <section class="voice">
        <p class="muted">
          Add chords to the progression to hear them voiced through the lenses.
        </p>
      </section>
    )
  }
  return (
    <section class="voice" aria-label="Voicings">
      <div class="voice-bar">
        <fieldset class="lens-picker">
          <legend class="muted">Lenses (up to {MAX_LENSES})</legend>
          {[LENSES, EXPERIMENTAL_LENSES].map((group, g) => (
            <span key={g} class="lens-group">
              <span class="muted">{g === 0 ? 'Core:' : 'Experimental:'}</span>
              {group.map((lens: Lens) => {
                const on = lenses.includes(lens)
                const locked = !on && lenses.length >= MAX_LENSES
                return (
                  <label key={lens} class="check">
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={locked}
                      onChange={() => {
                        setLenses(toggleLens(lenses, lens))
                        setPhoneAt(0)
                      }}
                    />
                    {LENS_SETTINGS[lens].name}
                  </label>
                )
              })}
            </span>
          ))}
        </fieldset>
        <div class="toggle" role="group" aria-label="Instrument">
          {(['guitar', 'keyboard'] as const).map((i) => (
            <button
              key={i}
              type="button"
              aria-pressed={instrument === i}
              onClick={() => setInstrument(i)}
            >
              {i === 'guitar' ? 'Guitar' : 'Keyboard'}
            </button>
          ))}
        </div>
      </div>
      {lenses.length === 0 && (
        <p class="muted">Tick a lens to hear the progression voiced its way.</p>
      )}
      {narrow && lenses.length > 1 && (
        <div class="lens-nav">
          <button
            type="button"
            aria-label="Previous lens"
            onClick={() => step(-1)}
          >
            ‹
          </button>
          <span>
            {phoneAt + 1} of {lenses.length}
          </span>
          <button type="button" aria-label="Next lens" onClick={() => step(1)}>
            ›
          </button>
        </div>
      )}
      <div
        class="lens-columns"
        style={{ '--columns': columns.length }}
        onTouchStart={(e) => narrow && setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX === undefined) return
          const dx = e.changedTouches[0].clientX - touchX
          if (Math.abs(dx) >= SWIPE) step(dx < 0 ? 1 : -1)
          setTouchX(undefined)
        }}
      >
        {columns.map(({ lens, choices }) => (
          <LensColumn
            key={lens}
            lens={lens}
            choices={choices}
            written={steps.map((s) => s.chord)}
            guitar={instrument === 'guitar' ? guitar : undefined}
            playingAt={playing?.lens === lens ? playing.at : undefined}
            onPlay={() => setPlaying({ lens, at: 0 })}
            onStop={() => setPlaying(undefined)}
            onHear={(choice) => play(choice)}
            onAnother={
              lens === 'wildcard' ? () => setRolls(rolls + 1) : undefined
            }
            onUse={(where) =>
              onUse(
                choices.map((c) => c.voicing),
                instrument,
                where,
              )
            }
          />
        ))}
      </div>
    </section>
  )
}

function LensColumn({
  lens,
  choices,
  written,
  guitar,
  playingAt,
  onPlay,
  onStop,
  onHear,
  onAnother,
  onUse,
}: {
  lens: Lens
  choices: Choice[]
  written: ChordName[]
  guitar: Guitar | undefined
  playingAt: number | undefined
  onPlay: () => void
  onStop: () => void
  onHear: (choice: Choice) => void
  onAnother?: () => void // the Wildcard's roll again
  onUse: (where: 'branch' | 'end') => void
}) {
  const movement = averageMovement(choices.map((c) => c.voicing.notes))
  return (
    <section class="lens-column" aria-label={LENS_SETTINGS[lens].name}>
      <header>
        <h3>{LENS_SETTINGS[lens].name}</h3>
        {onAnother && (
          <button type="button" onClick={onAnother}>
            🎲 Another
          </button>
        )}
        {playingAt === undefined ? (
          <button type="button" class="play" onClick={onPlay}>
            ▶ Play
          </button>
        ) : (
          <button type="button" class="play" onClick={onStop}>
            ■ Stop
          </button>
        )}
      </header>
      <p class="muted blurb">{LENS_BLURBS[lens]}</p>
      <div class="lens-use">
        <button
          type="button"
          title={`A new branch of the progression with the ${LENS_SETTINGS[lens].name} voicings; the arrows on the first chord switch back`}
          onClick={() => onUse('branch')}
        >
          ⑂ New branch
        </button>
        <button
          type="button"
          title={`Add the ${LENS_SETTINGS[lens].name} voicings after the last chord`}
          onClick={() => onUse('end')}
        >
          + Add to end
        </button>
      </div>
      <ol class="lens-chords">
        {choices.map((choice, i) => {
          const { voicing } = choice
          const symbol = chordSymbol(voicing.chord)
          const asWritten = chordSymbol(written[i])
          const shape = guitar && 'frets' in voicing ? voicing : undefined
          return (
            <li key={i} class={i === playingAt ? 'playing' : ''}>
              <button
                type="button"
                class="lens-chord"
                title={`Play ${symbol}`}
                onClick={() => onHear(choice)}
              >
                <span class="lens-symbol">
                  <strong>{symbol}</strong>
                  {symbol !== asWritten && (
                    <span class="muted"> for {asWritten}</span>
                  )}
                </span>
                <span class="muted lens-form">{voicing.label}</span>
                {shape && guitar ? (
                  <>
                    <BoxDiagram box={chordBox(guitar, voicing.chord, shape)} />
                    <span class="lens-notes">{formatFrets(shape.frets)}</span>
                  </>
                ) : (
                  <span class="lens-notes">
                    {voicing.notes.map((n) => formatNote(n)).join(' ')}
                  </span>
                )}
              </button>
              {choice.hits.length > 0 && (
                <ul class="lens-hits">
                  {choice.hits.map((h, k) => (
                    <li key={k}>⚠ {h.explanation}</li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ol>
      <p class="muted">
        The voices move {movement.toFixed(1)} semitones a chord on average.
      </p>
    </section>
  )
}
