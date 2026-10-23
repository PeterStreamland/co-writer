// The Web MIDI connection (Chrome and Edge, SPEC 1 and 5). Thin on purpose:
// reading messages and tracking held notes is in held.ts, which is tested.
import { useEffect, useRef, useState } from 'preact/hooks'
import {
  NOTHING_HELD,
  heldNotes,
  nextHeld,
  parseMidiMessage,
  type MidiEvent,
} from './held'

export type MidiStatus = 'unsupported' | 'idle' | 'connected' | 'denied'

export type Midi = {
  status: MidiStatus
  devices: string[]
  held: number[]
  connect: () => void
  // Hears every key and pedal event as it comes, with its time in
  // milliseconds on performance.now()'s clock (melody recording, SPEC 7.2).
  // Returns a function that stops listening.
  onEvent: (listener: MidiListener) => () => void
}

export type MidiListener = (event: MidiEvent, at: number) => void

export function useMidi(): Midi {
  const supported =
    typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator
  const [status, setStatus] = useState<MidiStatus>(
    supported ? 'idle' : 'unsupported',
  )
  const [devices, setDevices] = useState<string[]>([])
  const [state, setState] = useState(NOTHING_HELD)
  const access = useRef<MIDIAccess | null>(null)
  const listeners = useRef(new Set<MidiListener>())

  function listen(midi: MIDIAccess) {
    const names: string[] = []
    midi.inputs.forEach((input) => {
      input.onmidimessage = (event) => {
        if (!event.data) return
        const message = parseMidiMessage(event.data)
        if (message.type === 'other') return
        setState((s) => nextHeld(s, message))
        listeners.current.forEach((l) => l(message, event.timeStamp))
      }
      names.push(input.name ?? 'MIDI keyboard')
    })
    setDevices(names)
  }

  async function connect() {
    try {
      const midi = await navigator.requestMIDIAccess()
      access.current = midi
      midi.onstatechange = () => listen(midi)
      listen(midi)
      setStatus('connected')
    } catch {
      setStatus('denied')
    }
  }

  // Connect straight away if this browser has already been allowed to.
  useEffect(() => {
    if (!supported) return
    navigator.permissions
      ?.query({ name: 'midi' as PermissionName })
      .then((p) => {
        if (p.state === 'granted') void connect()
      })
      .catch(() => {})
    return () => {
      access.current?.inputs.forEach((input) => (input.onmidimessage = null))
    }
  }, [])

  const onEvent = (listener: MidiListener) => {
    listeners.current.add(listener)
    return () => void listeners.current.delete(listener)
  }

  return { status, devices, held: heldNotes(state), connect, onEvent }
}
