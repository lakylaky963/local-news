import express from 'express';
import cron from 'node-cron';
import { connect } from './src/db.js';
import { refreshAll } from './src/fetcher.js';
import { api } from './src/routes.js';

const PORT = Number(process.env.PORT || 3000);
const REFRESH_MINUTES = Math.min(120, Math.max(5, Number(process.env.REFRESH_MINUTES || 30)));

const app = express();
app.use(express.json());
app.use('/api', api);
app.use(express.static('public'));
app.get('/healthz', (req, res) => res.json({ ok: true }));

const db = await connect();
app.locals.db = db;

app.listen(PORT, () => console.log(`local-news listening on :${PORT}, refresh every ${REFRESH_MINUTES}m`));

cron.schedule(`*/${REFRESH_MINUTES} * * * *`, () =>
  refreshAll(db).catch(e => console.error('[cron] refresh failed:', e.message)));
refreshAll(db).catch(e => console.error('[boot] initial refresh failed:', e.message));
