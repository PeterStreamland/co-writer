// The voice-leading cost's weights, as data (PLAN Phase 5 task 2): what each
// semitone moved, each shared note let go, each crossing and each overlap
// adds to the cost. These are the defaults; the lenses (Phase 5 tasks 3–4)
// weight them their own way.

export type VoiceLeadingWeights = {
  semitone: number // per semitone moved, summed over every voice
  missedCommonTone: number // per shared pitch class no voice holds
  crossing: number // per pair of voices out of order
  overlap: number // per voice moving past where a neighbour just was
}

export const DEFAULT_VOICE_LEADING_WEIGHTS: VoiceLeadingWeights = {
  semitone: 1,
  missedCommonTone: 2,
  crossing: 6,
  overlap: 3,
}
