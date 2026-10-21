---
name: next-task
description: Take the next unticked task in docs/PLAN.md, plan it, build it with tests, run the checks, tick it off and open a pull request.
disable-model-invocation: true
---

# Next task

1. Read CLAUDE.md, docs/PLAN.md, docs/SPEC.md and docs/DECISIONS.md. SPEC.md wins where it adds detail to the plan.
2. Find the current phase: the first one whose exit criteria aren't all ticked. Take its first unfinished task. Do only that task this session.
3. Plan in plan mode: what you'll build, which tests prove it, and which SPEC sections apply. For theory work, load the music-conventions skill. Ask David only about musical facts or product choices the spec doesn't settle.
4. Build test-first for theory code. Musical truths go in tests/fixtures; never edit a golden fixture to make a test pass.
5. Run `npm test`, `npm run lint`, `npm run typecheck` and `npm run build`. All must pass. Run `npm run format` before lint if needed.
6. Tick the task in docs/PLAN.md, and any exit criterion now proven, only when its check passes. Add a dated entry to docs/DECISIONS.md for anything that changes the plan.
7. Commit, push the session branch and open a pull request. Watch CI until it's green.
8. End with a plain-English summary for David: what changed, two or three things to try on the published app once he merges, and anything you need from him.
