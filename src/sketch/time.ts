// Tempo and the section's time signature (SPEC 7.1). Lengths are exact
// fractions of a whole note (SPEC 12); the meters, beats and bar layout
// live in the theory core. Until sketches keep their own sections, the
// tempo and time signature are remembered in this browser.
import {
  COMMON_TIME,
  METERS,
  meterLabel,
  parseMeter,
  ratioOf,
  sameMeter,
  tempoUnit,
  type Dur,
  type Meter,
  type MeterMap,
} from '../theory'

export type { Dur } from '../theory'

export const DEFAULT_BPM = 100
export const MIN_BPM = 40
export const MAX_BPM = 240

export const DEFAULT_TIME: MeterMap = { meter: COMMON_TIME, barMeters: {} }

// How long a chord lasts at a tempo, in seconds. The tempo counts the
// section meter's beat (a dotted crotchet in 6/8).
export function secondsOf(
  length: Dur,
  bpm: number,
  meter: Meter = COMMON_TIME,
): number {
  return (ratioOf(length, tempoUnit(meter)) * 60) / bpm
}

export function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return DEFAULT_BPM
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)))
}

// The note the tempo counts, as the strip shows it: ♩, ♩. or 𝅗𝅥.
export function tempoNote(meter: Meter): string {
  const unit = tempoUnit(meter)
  const plain = { 2: '𝅗𝅥', 4: '♩', 8: '♪' }[unit.d]
  if (unit.n === 1 && plain) return plain
  const dotted = { 8: '♩.', 16: '♪.' }[unit.d]
  return unit.n === 3 && dotted ? dotted : `${unit.n}/${unit.d}`
}

// The time-signature picker's choices, one per meter and grouping:
// "4/4", "6/8", "7/8 (2+2+3)", "7/8 (3+2+2)".
export type MeterOption = { id: string; meter: Meter; label: string }

export function meterId(meter: Meter): string {
  const { num, den } = meter
  const label = meterLabel(meter)
  const grouping = label.match(/\((.*)\)/)?.[1]
  return grouping ? `${num}/${den}:${grouping}` : `${num}/${den}`
}

export const METER_OPTIONS: MeterOption[] = METERS.flatMap(
  ({ num, den, groupings }) =>
    groupings.map((grouping) => {
      const meter: Meter =
        groupings.length > 1 ? { num, den, grouping } : { num, den }
      return { id: meterId(meter), meter, label: meterLabel(meter) }
    }),
)

const STORAGE_KEY = 'co-writer:bpm'
const TIME_KEY = 'co-writer:time'

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

function readMeter(value: unknown): Meter | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const { num, den, grouping } = value as Record<string, unknown>
  const meter = parseMeter(`${String(num)}/${String(den)}`)
  if (!meter) return undefined
  if (Array.isArray(grouping) && grouping.every(Number.isInteger)) {
    return { ...meter, grouping: grouping as number[] }
  }
  return meter
}

// The time signature and any bar overrides remembered in this browser.
export function loadTime(store = storage()): MeterMap {
  try {
    const saved: unknown = JSON.parse(store?.getItem(TIME_KEY) ?? 'null')
    if (typeof saved !== 'object' || saved === null) return DEFAULT_TIME
    const { meter, barMeters } = saved as Record<string, unknown>
    const section = readMeter(meter)
    if (!section) return DEFAULT_TIME
    const bars: Record<number, Meter> = {}
    if (typeof barMeters === 'object' && barMeters !== null) {
      for (const [bar, m] of Object.entries(barMeters)) {
        const read = readMeter(m)
        if (read && Number(bar) >= 1) bars[Number(bar)] = read
      }
    }
    return { meter: section, barMeters: bars }
  } catch {
    // Unreadable or blocked storage: 4/4.
  }
  return DEFAULT_TIME
}

export function saveTime(time: MeterMap, store = storage()): void {
  try {
    store?.setItem(TIME_KEY, JSON.stringify(time))
  } catch {
    // Storage blocked: the time signature lasts for this visit only.
  }
}

// The time with one bar set to its own meter, or back to the section's
// when undefined or the same.
export function setBarMeter(
  time: MeterMap,
  bar: number,
  meter: Meter | undefined,
): MeterMap {
  const barMeters = { ...time.barMeters }
  delete barMeters[bar]
  if (meter && !sameMeter(meter, time.meter)) barMeters[bar] = meter
  return { ...time, barMeters }
}
