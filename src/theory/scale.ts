// Scales and keys. The core dictionary is our own data (scale-data.ts); the
// rest of tonal's dictionary is added behind the same interface, minus any
// scale whose pitches the core already covers.
import { ScaleType as TonalScaleType } from 'tonal'
import { parseInterval, semitones, transpose, transposeDown } from './interval'
import type { Interval } from './interval'
import type { Note } from './note'
import { CORE_SCALES, type ScaleData, type ScaleFamily } from './scale-data'

export type { ScaleFamily } from './scale-data'

export type Scale = {
  id: string
  name: string
  aliases: string[]
  family: ScaleFamily
  intervals: Interval[]
  modeOf?: { scale: string; degree: number }
}

// Key = tonic + mode, where mode is a scale id (SPEC 4, 12).
export type Key = { tonic: Note; mode: string }

function toInterval(text: string): Interval {
  const interval = parseInterval(text)
  if (!interval) throw new Error(`bad scale interval ${text}`)
  return interval
}

function fromData(data: ScaleData): Scale {
  return { ...data, intervals: data.intervals.map(toInterval) }
}

// tonal writes intervals number first: 5d is our d5.
function fromTonalInterval(text: string): string {
  return text.replace(/^(\d+)(.+)$/, '$2$1')
}

function pitchSet(intervals: Interval[]): string {
  return intervals
    .map((i) => semitones(i) % 12)
    .sort((a, b) => a - b)
    .join(',')
}

// Lookup key for an id or alias: case, spaces and hyphens don't matter.
function nameKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '-')
}

function slug(name: string): string {
  return nameKey(name)
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function capitalise(name: string): string {
  return name[0].toUpperCase() + name.slice(1)
}

function buildDictionary(): Scale[] {
  const core = CORE_SCALES.map(fromData)
  const covered = new Set(core.map((s) => pitchSet(s.intervals)))
  const names = new Set(core.flatMap((s) => [s.id, ...s.aliases].map(nameKey)))
  const wider: Scale[] = []
  for (const tonal of TonalScaleType.all()) {
    const intervals = tonal.intervals.map(fromTonalInterval).map(toInterval)
    const pitches = pitchSet(intervals)
    if (covered.has(pitches)) continue
    covered.add(pitches)
    const id = slug(tonal.name)
    names.add(id)
    const aliases: string[] = []
    for (const alias of [tonal.name, ...tonal.aliases]) {
      if (names.has(nameKey(alias))) continue
      names.add(nameKey(alias))
      aliases.push(alias)
    }
    wider.push({
      id,
      name: capitalise(tonal.name),
      aliases,
      family: 'other',
      intervals,
    })
  }
  return [...core, ...wider]
}

const SCALES = buildDictionary()
const BY_NAME = new Map<string, Scale>()
for (const scale of SCALES) {
  for (const name of [scale.id, ...scale.aliases]) {
    if (!BY_NAME.has(nameKey(name))) BY_NAME.set(nameKey(name), scale)
  }
}

// Every scale: the core dictionary first, then the wider one.
export function allScales(): Scale[] {
  return SCALES
}

// Finds a scale by id or alias, ignoring case, spaces and hyphens: 'dorian',
// 'aeolian', 'Blues', 'phrygian dominant'.
export function getScale(name: string): Scale | undefined {
  return BY_NAME.get(nameKey(name))
}

function requireScale(name: string): Scale {
  const scale = getScale(name)
  if (!scale) throw new Error(`unknown scale ${name}`)
  return scale
}

// The scale's notes from the tonic, spelled by interval: D♯ harmonic minor
// has C𝄪, A♭ natural minor has F♭.
export function scaleNotes(tonic: Note, scale: string): Note[] {
  return requireScale(scale).intervals.map((i) => transpose(tonic, i))
}

// The scale a mode belongs to, whose key signature it shows: E Dorian's
// parent is D major. A key that isn't a mode is its own parent.
export function parentKey(key: Key): Key {
  const scale = requireScale(key.mode)
  if (!scale.modeOf) return { tonic: key.tonic, mode: scale.id }
  const parent = requireScale(scale.modeOf.scale)
  const offset = parent.intervals[scale.modeOf.degree - 1]
  return { tonic: transposeDown(key.tonic, offset), mode: parent.id }
}
