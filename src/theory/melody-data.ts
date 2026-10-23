// Melody entry as data (SPEC 7.1, 7.2): the note values step entry offers,
// the grids recorded notes snap to, and what a typed melody's words mean.
import type { Dur } from './duration'

export type NoteValue = {
  id: string
  length: Dur
  symbol: string
  name: string
}

// Shortest first; the crotchet is the default.
export const NOTE_VALUES: NoteValue[] = [
  { id: '16th', length: { n: 1, d: 16 }, symbol: '𝅘𝅥𝅯', name: 'semiquaver' },
  {
    id: 'triplet',
    length: { n: 1, d: 12 },
    symbol: '♪³',
    name: 'quaver triplet',
  },
  { id: '8th', length: { n: 1, d: 8 }, symbol: '♪', name: 'quaver' },
  {
    id: 'dotted-8th',
    length: { n: 3, d: 16 },
    symbol: '♪.',
    name: 'dotted quaver',
  },
  { id: 'quarter', length: { n: 1, d: 4 }, symbol: '♩', name: 'crotchet' },
  {
    id: 'dotted-quarter',
    length: { n: 3, d: 8 },
    symbol: '♩.',
    name: 'dotted crotchet',
  },
  { id: 'half', length: { n: 1, d: 2 }, symbol: '𝅗𝅥', name: 'minim' },
  {
    id: 'dotted-half',
    length: { n: 3, d: 4 },
    symbol: '𝅗𝅥.',
    name: 'dotted minim',
  },
  { id: 'whole', length: { n: 1, d: 1 }, symbol: '𝅝', name: 'semibreve' },
]

export const DEFAULT_NOTE_VALUE = 'quarter'

export type GridId = '1/16' | '1/8' | 'triplets' | 'off'

// The grid recorded notes snap to (SPEC 7.1, 11): 1/16 by default. Off
// still keeps exact fractions, at a 96th of a whole note (a 64th-note
// triplet), finer than anyone plays on purpose.
export const GRIDS: { id: GridId; step: Dur; label: string }[] = [
  { id: '1/16', step: { n: 1, d: 16 }, label: 'Semiquavers (1/16)' },
  { id: '1/8', step: { n: 1, d: 8 }, label: 'Quavers (1/8)' },
  { id: 'triplets', step: { n: 1, d: 12 }, label: 'Quaver triplets' },
  { id: 'off', step: { n: 1, d: 96 }, label: 'Off' },
]

export const DEFAULT_GRID: GridId = '1/16'

// Words in a typed melody besides note names.
export const REST_WORDS = ['r', 'R', 'rest']
export const HOLD_WORDS = ['-', '_', '–']

// The octave of a typed melody's first note when it has none.
export const FIRST_OCTAVE = 4
