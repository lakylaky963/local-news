# Rules for agents in local-news

Read the homelab Brain first: `../homeLab/CLAUDE.md` (owner rules, architecture). They all apply here.

## This project
- Plain Node 22 + Express 5, ESM, **no build step, no frameworks** — keep it that way.
- DB is the shared Mongo (10.0.0.230, db `news`, no auth — owner's choice; do not add auth).
- Frontend: vanilla JS, relative `api/...` fetches only (the site lives under `/news/`), dark+amber
  house style, Hebrew RTL via `dir="auto"`.
- Feeds live in `config/feeds.json`; verify with `npm run fetch:dry` after any change.
- The ranking profile (src/score.js) must stay explainable: no external AI calls for scoring.

## Model policy (owner's rule)
- Default model: **sonnet**. File chores, bulk edits, log reading: **haiku**.
- The biggest available model only for design decisions — and those are mostly already made.

## Overnight loop rules
- Work through PROMPT.md top to bottom, one task per iteration; mark finished tasks `[x]` with a date.
- Commit after each completed task; push to origin `main`.
- Never force-push, never delete data, never touch other containers or repos (except the two brains below).
- If a task needs the owner (password, money, risky choice): add it under "Needs owner" in PROMPT.md, skip it, move on.
- After each session: update the vault daily note (`../agents-ops/50-daily/<date>.md`) and, if homelab
  status changed, homelab-ops `CLAUDE.md` Status/TODO (commit as `brain: ...`).
