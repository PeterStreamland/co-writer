// The ranker's settings, as data (PLAN Phase 4 task 4, SPEC 6.1–6.2): how
// much each context effect moves a score, and how many suggestions to show.

export const CONTEXT_EFFECTS = {
  // Taken off for each earlier use of the chord in the section past the
  // first: nothing after one use, 0.5 after two, 1 after three.
  overuse: 0.5,
  // Chords count as one bar each until the beat grid (Phase 6). The bar
  // that ends an 8-bar phrase favours a tonic arrival; the bar that ends
  // its first half favours the tonic or a half cadence on V.
  phraseEnd: { every: 8, tonic: 1 },
  halfPhrase: { every: 4, tonic: 0.5, dominant: 0.5 },
  // After this many chords with no tonic, the tonic is favoured.
  tonicPending: { after: 3, bonus: 0.5 },
}

export const RANKING = {
  // Six to eight suggestions (SPEC 6.2): past six, only those scoring at
  // least this share of the top score are added.
  min: 6,
  max: 8,
  keepAbove: 0.5,
  // No category may fill more than this many places, so the list mixes
  // categories.
  perCategory: 3,
  // The wildcard comes from the lower-scoring share of the moves not shown.
  wildcardShare: 0.5,
}
