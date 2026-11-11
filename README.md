# local-news

News aggregator for the home lab: pulls RSS feeds (Israeli news HE/EN, tech, finance) into the
shared MongoDB and serves a dark/amber reader at `/news/`. 👍/👎 on items trains a ranking
profile for the "בשבילי" (For You) tab — source affinity + title keywords + freshness decay.

- **Server:** Node 22, Express 5, ESM, no build step. `npm start`.
- **DB:** shared Mongo on CT 106 (`mongodb://10.0.0.230:27017`, db `news`, no auth — house choice).
- **Refresh:** on boot + every `REFRESH_MINUTES` (default 30) via node-cron. Items expire 45 days
  after they leave all feeds (TTL index).
- **Feeds:** `config/feeds.json`. Check them with `npm run fetch:dry` (no DB needed).
- **API:** `GET api/items?tab=foryou|latest|israel|world|tech|finance`, `POST api/feedback
  {itemId, vote: 1|-1|0}`, `POST api/refresh`, `GET api/sources`, `GET api/stats`, `GET /healthz`.
- **Deploy:** CT `news` on Proxmox (pm2), route `/news/` via the proxy agent. All frontend
  fetches are relative, so the base path doesn't matter.

Runs on lakylaky963's home lab. See homelab-ops `CLAUDE.md` for the rules of the house.
