import { Router } from 'express';
import { rebuildProfile, scoreItem } from './score.js';
import { refreshAll } from './fetcher.js';

export const api = Router();
const db = req => req.app.locals.db;
const CATS = ['israel', 'world', 'tech', 'finance'];

api.get('/items', async (req, res) => {
  const tab = String(req.query.tab || 'latest');
  const limit = Math.min(200, Number(req.query.limit) || 60);
  const q = CATS.includes(tab) ? { category: tab } : {};
  const items = await db(req).collection('items')
    .find(q).sort({ published: -1 }).limit(tab === 'foryou' ? 300 : limit).toArray();
  const fb = await db(req).collection('feedback').find({}).toArray();
  const votes = Object.fromEntries(fb.map(f => [f.itemId, f.vote]));
  let out = items.map(i => ({ ...i, myVote: votes[i._id] || 0 }));
  if (tab === 'foryou') {
    const profile = await db(req).collection('profile').findOne({ _id: 'owner' });
    out = out.map(i => ({ ...i, score: Math.round(scoreItem(i, profile) * 100) / 100 }))
      .sort((a, b) => b.score - a.score).slice(0, limit);
  }
  res.json(out);
});

api.post('/feedback', async (req, res) => {
  const { itemId, vote } = req.body || {};
  if (!itemId || ![1, -1, 0].includes(vote)) return res.status(400).json({ error: 'need itemId and vote 1/-1/0' });
  if (vote === 0) await db(req).collection('feedback').deleteOne({ itemId });
  else await db(req).collection('feedback').updateOne({ itemId },
    { $set: { itemId, vote, at: new Date() } }, { upsert: true });
  const profile = await rebuildProfile(db(req));
  res.json({ ok: true, profile });
});

api.post('/refresh', async (req, res) => {
  await refreshAll(db(req));
  res.json({ ok: true });
});

api.get('/sources', async (req, res) =>
  res.json(await db(req).collection('sources').find({}).toArray()));

api.get('/stats', async (req, res) => res.json({
  items: await db(req).collection('items').countDocuments(),
  feedback: await db(req).collection('feedback').countDocuments(),
  profile: await db(req).collection('profile')
    .findOne({ _id: 'owner' }, { projection: { samples: 1, updatedAt: 1 } })
}));
