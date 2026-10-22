// The passing-chord ranker's settings, as data (PLAN Phase 4 task 7, SPEC
// 6.7): how a chord can lead into the chord after it, how strongly (0–5),
// and how the ⓘ panel's first line says so.

export type PassingLead = {
  id: string
  lead: number
  template: string
}

export const PASSING_LEADS = {
  // A dominant a 5th above the next chord: D7 into G.
  dominant: {
    id: 'passing.dominant',
    lead: 5,
    template:
      '{chord} is the dominant of {next}, so it pulls straight into it.',
  },
  // A leading-note chord a semitone below: F♯dim7 into G.
  leadingNote: {
    id: 'passing.leading-note',
    lead: 4.5,
    template:
      '{chord} sits a semitone below {next} and rises into it, like a leading note.',
  },
  // A minor or other chord a 5th above, falling a 5th: Dm into G (ii–V).
  fifth: {
    id: 'passing.fifth',
    lead: 5,
    template:
      '{chord} falls a 5th into {next}, the strongest root move there is, as ii does into V.',
  },
  // A dominant 7th a semitone above: A♭7 into G.
  tritoneSub: {
    id: 'passing.tritone-sub',
    lead: 4,
    template:
      '{chord} stands in for the dominant of {next} and slides down a semitone into it.',
  },
  // Otherwise, by harmonic function in the key: F into G is predominant to
  // dominant. Its lead is the function flow's score, scaled by flowScale so
  // the named relations above outrank it.
  flow: {
    id: 'passing.flow',
    lead: 0,
    template: '{chord} leads on into {next}, {from} to {to}.',
  },
  // A root a step from the next chord's, when nothing pulls harder.
  step: {
    id: 'passing.step',
    lead: 2.5,
    template: '{chord} steps into {next}, its root moving by step.',
  },
  // When nothing pulls, how the root moves into the next chord.
  other: {
    id: 'passing.other',
    lead: 1,
    template: '{chord} moves on into {next}: {motion}.',
  },
} as const satisfies Record<string, PassingLead>

export const PASSING = {
  // How much the fit after the first chord counts beside the lead into the
  // second.
  fromWeight: 0.5,
  flowScale: 0.8,
  // A chord on the first chord's root (Csus4 between C and F) barely moves,
  // so its lead counts for this much; a dominant 7th on it (C7, I to I7 to
  // IV) counts in full.
  sameRootFactor: 0.5,
}
