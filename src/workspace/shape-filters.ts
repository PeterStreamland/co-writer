// The chord boxes' filter controls (Phase 3 tasks 4 and 8): what each
// control offers and the search options it sets. No theory lives here.
import type { FingeringOptions } from '../instruments/fingering'
import { DEFAULT_SPAN, MAX_SPAN, MIN_SPAN } from '../instruments/fingering'
import { inversionName, inversions, type ChordName } from '../theory'

export type StringSet = 'all' | 'top4' | 'top3' | 'middle4' | 'bottom4'

export type ShapeFilters = {
  inversion: 'chord' | 'any' | number
  strings: StringSet
  maxSpan: number
  openStrings: boolean
  omitFifth: boolean
}

export const DEFAULT_FILTERS: ShapeFilters = {
  inversion: 'chord',
  strings: 'all',
  maxSpan: DEFAULT_SPAN,
  openStrings: true,
  omitFifth: false,
}

export const SPANS = Array.from(
  { length: MAX_SPAN - MIN_SPAN + 1 },
  (_, i) => MIN_SPAN + i,
)

export const STRING_SETS: [StringSet, string][] = [
  ['all', 'All strings'],
  ['top4', 'Top four'],
  ['top3', 'Top three'],
  ['middle4', 'Middle four'],
  ['bottom4', 'Bottom four'],
]

// The strings a set lets sound, lowest string 0, on a guitar with this many.
export function stringSet(set: StringSet, count: number): number[] {
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, i) => from + i)
  switch (set) {
    case 'all':
      return range(0, count - 1)
    case 'top4':
      return range(count - 4, count - 1)
    case 'top3':
      return range(count - 3, count - 1)
    case 'middle4':
      return range(count - 5, count - 2)
    case 'bottom4':
      return range(0, 3)
  }
}

// The inversion choices for a chord: as chosen (its own bass), any, then
// each inversion it has by name.
export function inversionChoices(
  chord: ChordName,
): [ShapeFilters['inversion'], string][] {
  return [
    ['chord', 'As chosen'],
    ['any', 'Any inversion'],
    ...inversions(chord).map(({ inversion }): [number, string] => [
      inversion,
      inversionName(inversion).replace(/^./, (c) => c.toUpperCase()),
    ]),
  ]
}

export function fingeringOptions(
  filters: ShapeFilters,
  count: number,
): FingeringOptions {
  return {
    maxSpan: filters.maxSpan,
    inversion: filters.inversion === 'chord' ? undefined : filters.inversion,
    strings: stringSet(filters.strings, count),
    openStrings: filters.openStrings,
    omitFifth: filters.omitFifth,
  }
}
