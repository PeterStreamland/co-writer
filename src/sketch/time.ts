// Tempo and chord lengths (David's request, ahead of Phase 6's beat grid).
// Lengths are exact fractions of a whole note, as SPEC 7.1 and 12 store
// them (a quarter note is 1/4), so the grid can take them over unchanged.
// Until sections carry a meter, everything is in 4/4: a beat is a quarter
// note and a chord lasts one bar unless set otherwise.

export type Dur = { n: number; d: number }

export const BEATS_PER_BAR = 4
export const BEAT: Dur = { n: 1, d: 4 }
export const DEFAULT_LENGTH: Dur = { n: 1, d: 1 }

export const DEFAULT_BPM = 100
export const MIN_BPM = 40
export const MAX_BPM = 240

// The lengths the strip offers, in beats.
export const LENGTH_CHOICES = [1, 2, 3, 4, 6, 8, 12, 16]

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

// A length in beats as a whole-note fraction: 2 beats is 1/2, 6 is 3/2.
export function durOfBeats(beats: number): Dur {
  const n = beats * BEAT.n
  const d = BEAT.d
  const g = gcd(n, d)
  return { n: n / g, d: d / g }
}

export function beatsOf(dur: Dur): number {
  return (dur.n * BEAT.d) / (dur.d * BEAT.n)
}

// How a length reads: "1 beat", "3 beats", "1 bar", "1½ bars", "2 bars".
export function lengthLabel(beats: number): string {
  if (beats % BEATS_PER_BAR === 0 || beats > BEATS_PER_BAR) {
    const bars = beats / BEATS_PER_BAR
    const whole = Math.floor(bars)
    const text =
      bars === whole
        ? `${whole}`
        : bars % 1 === 0.5
          ? `${whole}½`
          : String(bars)
    return `${text} ${bars === 1 ? 'bar' : 'bars'}`
  }
  return `${beats} ${beats === 1 ? 'beat' : 'beats'}`
}

// How long a chord lasts at a tempo, in seconds.
export function secondsOf(dur: Dur, bpm: number): number {
  return (beatsOf(dur) * 60) / bpm
}

export function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return DEFAULT_BPM
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)))
}

const STORAGE_KEY = 'co-writer:bpm'

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

// The tempo remembered in this browser, until sketches keep their own.
export function loadBpm(store = storage()): number {
  try {
    const saved = Number(store?.getItem(STORAGE_KEY))
    if (saved) return clampBpm(saved)
  } catch {
    // Unreadable or blocked storage: use the default.
  }
  return DEFAULT_BPM
}

export function saveBpm(bpm: number, store = storage()): void {
  try {
    store?.setItem(STORAGE_KEY, String(clampBpm(bpm)))
  } catch {
    // Storage blocked: the tempo just isn't remembered.
  }
}
