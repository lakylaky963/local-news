// One-shot fetch. `--dry` parses every feed without touching the DB (works on the laptop).
import { refreshAll, dryRun } from './fetcher.js';
import { connect } from './db.js';

if (process.argv.includes('--dry')) {
  const ok = await dryRun();
  process.exit(ok > 0 ? 0 : 1);
}
const db = await connect();
await refreshAll(db);
process.exit(0);
