// Exact durations and positions as fractions of a whole note (SPEC 7.1,
// 12): a crotchet is 1/4 and a quaver triplet 1/12, so triplets and odd
// meters never round. Every function returns a fraction in lowest terms.

export type Dur = { n: number; d: number }

export const ZERO: Dur = { n: 0, d: 1 }

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b)
}

// n/d in lowest terms, with the sign on the numerator.
export function dur(n: number, d: number): Dur {
  if (n === 0) return ZERO
  const g = gcd(n, d) * Math.sign(d)
  return { n: n / g, d: d / g }
}

export function addDur(a: Dur, b: Dur): Dur {
  return dur(a.n * b.d + b.n * a.d, a.d * b.d)
}

export function subDur(a: Dur, b: Dur): Dur {
  return dur(a.n * b.d - b.n * a.d, a.d * b.d)
}

export function timesDur(a: Dur, k: number): Dur {
  return dur(a.n * k, a.d)
}

export function sumDurs(ds: Dur[]): Dur {
  return ds.reduce(addDur, ZERO)
}

// How many times b goes into a (2 for a bar of 6/8 in dotted crotchets).
export function ratioOf(a: Dur, b: Dur): number {
  return (a.n * b.d) / (a.d * b.n)
}

export function compareDur(a: Dur, b: Dur): -1 | 0 | 1 {
  return Math.sign(a.n * b.d - b.n * a.d) as -1 | 0 | 1
}

export function durEquals(a: Dur, b: Dur): boolean {
  return compareDur(a, b) === 0
}
