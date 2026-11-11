# Overnight task list (work top to bottom, one task per iteration, mark [x] + date when done)

Rules: see CLAUDE.md in this folder. Commit after each task. If blocked, note it under
"Needs owner" and move to the next task. Stop when everything is [x] or usage cap is hit.

## Tasks
- [ ] Run `npm run fetch:dry`. For every FAIL feed, find the correct current RSS URL (web search),
      fix config/feeds.json, re-run until all feeds OK (or mark a feed `"disabled": true` with a comment why).
- [ ] Add 2-3 more quality feeds the owner would like based on his picks: Israeli business/stocks
      (e.g. TheMarker/Bizportal if they have RSS) and one more tech source. Verify with fetch:dry.
- [ ] Unit tests with `node --test`: src/score.js (tokens on Hebrew+English titles, scoreItem ordering,
      rebuildProfile math with a stubbed db). Add `"test": "node --test"` script.
- [ ] UI: thin sources-status strip at the bottom (from api/sources): green/red dot per source,
      tooltip with lastStatus. Keep the house style.
- [ ] UI: relative times in Hebrew for he items (לפני 5 ד׳ / שעה / אתמול), keep English for en.
- [ ] Improve the Hebrew stopword list in src/score.js (common news words: דיווח, בלעדי, צפו, תיעוד...).
- [ ] If the site is live on the server: curl the /news/ route and api/stats from the server side
      (ssh root@server), confirm items are flowing; write findings in the daily note.
- [ ] Update ../agents-ops/50-daily/<tomorrow's date>.md with a morning summary
      (finished / blocked / needs owner) and push the vault.
- [ ] If homelab status changed: update ../homeLab/CLAUDE.md Status + TODO, commit as
      `brain: news site`, push.

## Needs owner
(agents append here instead of getting stuck)
