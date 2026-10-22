// The playability rules (Phase 3 task 3), as data: what each rule counts and
// how many points each one it counts costs a shape. A negative cost is a
// bonus. A shape's score is 100 less its costs, so easier shapes score
// higher; the weights can be tuned here without touching the search.
export type PlayabilityRuleId =
  | 'finger'
  | 'span'
  | 'barre'
  | 'muted-inner'
  | 'muted-low'
  | 'muted-high'
  | 'open-string'
  | 'open-string-far'
  | 'position'
  | 'omitted-tone'
  | 'thin'

export type PlayabilityRule = {
  id: PlayabilityRuleId
  cost: number
  // What one unit of the rule is, for an explanation: "3 fingers".
  unit: [one: string, many: string]
  explanation: string
}

export const PLAYABILITY_RULES: PlayabilityRule[] = [
  {
    id: 'finger',
    cost: 1,
    unit: ['finger', 'fingers'],
    explanation: 'Each finger on the fretboard is one more to place.',
  },
  {
    id: 'span',
    cost: 10,
    unit: ['fret of stretch', 'frets of stretch'],
    explanation:
      'Each fret the hand spreads beyond three makes the shape a stretch.',
  },
  {
    id: 'barre',
    cost: 1,
    unit: ['barre', 'barres'],
    explanation: 'A barre takes strength to hold every string down cleanly.',
  },
  {
    id: 'muted-inner',
    cost: 12,
    unit: ['muted inner string', 'muted inner strings'],
    explanation:
      'A muted string between sounding ones has to be damped by a finger while you strum across it.',
  },
  {
    id: 'muted-low',
    cost: 1,
    unit: ['muted low string', 'muted low strings'],
    explanation:
      'A muted string below the bass means starting the strum on the right string.',
  },
  {
    id: 'muted-high',
    cost: 3,
    unit: ['muted high string', 'muted high strings'],
    explanation:
      'A muted string above the top note thins the chord and has to be kept quiet.',
  },
  {
    id: 'open-string',
    cost: -2,
    unit: ['open string', 'open strings'],
    explanation: 'Open strings ring freely and need no finger.',
  },
  {
    id: 'open-string-far',
    cost: 2,
    unit: ['open string away from the hand', 'open strings away from the hand'],
    explanation:
      'With the hand more than four frets up, an open string ringing under it is awkward to reach across.',
  },
  {
    id: 'position',
    cost: 1,
    unit: ['fret up the neck', 'frets up the neck'],
    explanation:
      'Each fret further from the nut (or the capo) moves the hand away from home.',
  },
  {
    id: 'omitted-tone',
    cost: 3,
    unit: ['chord tone left out', 'chord tones left out'],
    explanation:
      'Leaving out the 5th, or an extended chord’s 9th or 11th, gives a thinner sound.',
  },
  {
    id: 'thin',
    cost: 3,
    unit: ['string short of a full chord', 'strings short of a full chord'],
    explanation:
      'A chord sounds full on four strings or more (three for a power chord); fewer sounds thin.',
  },
]
