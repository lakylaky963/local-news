import test from 'node:test';
import assert from 'node:assert/strict';
import { tokens, scoreItem, rebuildProfile } from '../src/score.js';

test('tokens: English lowercases and drops stopwords/short words', () => {
  assert.deepEqual(tokens('The New Apple Chip is in AI'), ['apple', 'chip']);
});

test('tokens: Hebrew words kept, stopwords dropped', () => {
  const t = tokens('הממשלה אישרה את התקציב של המדינה');
  assert.ok(t.includes('הממשלה'));
  assert.ok(t.includes('התקציב'));
  assert.ok(!t.includes('את'));
  assert.ok(!t.includes('של'));
});

test('tokens: mixed Hebrew + English', () => {
  const t = tokens('Nvidia מכריזה על שבב חדש');
  assert.ok(t.includes('nvidia'));
  assert.ok(t.includes('שבב'));
});

test('tokens: handles empty/null-ish input', () => {
  assert.deepEqual(tokens(''), []);
  assert.deepEqual(tokens('!!! ??'), []);
});

test('scoreItem: no profile gives 0', () => {
  assert.equal(scoreItem({ title: 'x', sourceId: 's', published: new Date() }, null), 0);
});

test('scoreItem: liked source/words outrank disliked ones', () => {
  const profile = { sources: { good: 3, bad: -3 }, words: { apple: 2, boring: -2 } };
  const now = new Date();
  const liked = scoreItem({ title: 'Apple ships chip', sourceId: 'good', published: now }, profile);
  const neutral = scoreItem({ title: 'Something else', sourceId: 'other', published: now }, profile);
  const disliked = scoreItem({ title: 'Boring update', sourceId: 'bad', published: now }, profile);
  assert.ok(liked > neutral);
  assert.ok(neutral > disliked);
});

test('scoreItem: fresher beats older with same content', () => {
  const profile = { sources: { s: 1 }, words: {} };
  const fresh = scoreItem({ title: 'same title', sourceId: 's', published: new Date() }, profile);
  const old = scoreItem({ title: 'same title', sourceId: 's', published: new Date(Date.now() - 48 * 36e5) }, profile);
  assert.ok(fresh > old);
  assert.ok(Math.abs((fresh - old) - 4) < 0.01); // 48h / 12
});

test('rebuildProfile: sums votes per source and word using a stubbed db', async () => {
  const fb = [
    { vote: 1, item: { sourceId: 'a', title: 'Apple chip launch' } },
    { vote: 1, item: { sourceId: 'a', title: 'Apple earnings' } },
    { vote: -1, item: { sourceId: 'b', title: 'Boring launch' } }
  ];
  let saved;
  const db = {
    collection: name => ({
      aggregate: () => ({ toArray: async () => fb }),
      updateOne: async (filter, update, opts) => { saved = { name, filter, update, opts }; }
    })
  };
  const res = await rebuildProfile(db);
  assert.equal(res.samples, 3);
  assert.equal(saved.name, 'profile');
  assert.equal(saved.filter._id, 'owner');
  assert.equal(saved.opts.upsert, true);
  const { words, sources, samples } = saved.update.$set;
  assert.deepEqual(sources, { a: 2, b: -1 });
  assert.equal(words.apple, 2);
  assert.equal(words.launch, 0); // +1 -1
  assert.equal(words.boring, -1);
  assert.equal(samples, 3);
});
