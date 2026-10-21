# Musical Co-Writer

Browser app for songwriting on guitar and keyboard, for David's personal use.
Spec: docs/SPEC.md. Plan and exit criteria: docs/PLAN.md. Decisions: docs/DECISIONS.md.
Theory conventions (spelling, keys, numerals, chord symbols): SPEC.md section 4, summarised in the music-conventions skill.

## Commands

- npm run dev: local app (cloud sessions can't show it to David; he tests the GitHub Pages build)
- npm test: Vitest (while iterating, run one file: npx vitest run <path>)
- npm run lint / npm run typecheck

## Architecture rules

- UI is Preact, not React: import from preact and preact/hooks
- src/theory is pure TypeScript: no UI, audio or DOM imports
- Notes always carry spelling (letter, accidental, octave); never store a bare pitch number
- Scales, chords, style profiles and rules are data, not code
- Every suggestion is a Suggestion: candidate, score, tags, ruleIds, explanation
- Third-party theory libraries sit behind our own interfaces in src/theory

## Testing

- Every theory function has unit tests; musical truths live in tests/fixtures
- Never edit a golden fixture to make a test pass: ask David
- Hooks run typecheck and tests after every code edit and block finishing while tests fail: fix the cause, don't bypass them

## Working with David

- David doesn't read code: end every task with a plain-English summary of what changed and two or three things to try in the app
- Handle all git and GitHub work yourself: finish each task on its branch with a pull request and tell David it's ready to merge
- One PLAN.md task per session; tick it off only when its check passes
- Record any decision that changes the plan in docs/DECISIONS.md
- British spelling in UI text
