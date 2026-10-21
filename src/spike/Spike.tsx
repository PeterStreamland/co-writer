// Temporary Phase 0 library spike: Tone.js playback and Web MIDI input.
// Remove in Phase 2, when the real key explorer and MIDI input arrive.
import { useEffect, useRef, useState } from 'preact/hooks'
import * as Tone from 'tone'
import { chordNames, noteName, parseMidiMessage } from './midi'

let synth: Tone.PolySynth | undefined

export function Spike() {
  return (
    <main class="spike">
      <p>
        <a href="#/">← Home</a>
      </p>
      <h1>Library spike</h1>
      <p>Temporary test page for Phase 0. It goes away in Phase 2.</p>
      <AudioTest />
      <MidiTest />
    </main>
  )
}

function AudioTest() {
  const [state, setState] = useState('not started')

  async function play() {
    await Tone.start()
    synth ??= new Tone.PolySynth(Tone.Synth).toDestination()
    synth.triggerAttackRelease(['C4', 'E4', 'G4'], 1.5)
    setState(
      `${Tone.getContext().state}, sample rate ${Tone.getContext().sampleRate} Hz`,
    )
  }

  return (
    <section>
      <h2>1. Sound (Tone.js)</h2>
      <button onClick={play}>Play C major (C4 E4 G4)</button>
      <p>Audio: {state}</p>
    </section>
  )
}

type Status = 'idle' | 'unsupported' | 'denied' | 'connected'

function MidiTest() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [inputs, setInputs] = useState<string[]>([])
  const [held, setHeld] = useState<number[]>([])
  const [log, setLog] = useState<string[]>([])
  const access = useRef<MIDIAccess | null>(null)

  useEffect(() => {
    if (!('requestMIDIAccess' in navigator)) setStatus('unsupported')
    return () => {
      access.current?.inputs.forEach((input) => (input.onmidimessage = null))
    }
  }, [])

  function onMessage(event: MIDIMessageEvent) {
    if (!event.data) return
    const parsed = parseMidiMessage(event.data)
    if (parsed.type === 'other') return
    const name = noteName(parsed.note)
    setHeld((notes) =>
      parsed.type === 'on'
        ? [...notes.filter((n) => n !== parsed.note), parsed.note]
        : notes.filter((n) => n !== parsed.note),
    )
    setLog((lines) =>
      [`${parsed.type === 'on' ? 'down' : 'up'} ${name}`, ...lines].slice(0, 8),
    )
  }

  function refresh(midi: MIDIAccess) {
    const names: string[] = []
    midi.inputs.forEach((input) => {
      input.onmidimessage = onMessage
      names.push(input.name ?? 'Unnamed device')
    })
    setInputs(names)
  }

  async function connect() {
    try {
      const midi = await navigator.requestMIDIAccess()
      access.current = midi
      midi.onstatechange = () => refresh(midi)
      refresh(midi)
      setStatus('connected')
    } catch (e) {
      setStatus('denied')
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const sorted = [...held].sort((a, b) => a - b)
  const names = held.length >= 2 ? chordNames(held) : []

  return (
    <section>
      <h2>2. MIDI keyboard (Web MIDI)</h2>
      {status === 'unsupported' && (
        <p>This browser doesn't support Web MIDI. Use Chrome or Edge.</p>
      )}
      {status === 'idle' && <button onClick={connect}>Connect MIDI</button>}
      {status === 'denied' && <p>MIDI access was refused: {error}</p>}
      {status === 'connected' && (
        <>
          <p>
            Devices:{' '}
            {inputs.length
              ? inputs.join(', ')
              : 'none found. Plug your keyboard in.'}
          </p>
          <p class="held">
            {sorted.length ? sorted.map(noteName).join(' ') : 'Play a note…'}
          </p>
          <p>Chord: {names.length ? names.join(', ') : '—'}</p>
          <ol class="log">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
