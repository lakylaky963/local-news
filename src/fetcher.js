import Parser from 'rss-parser';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const parser = new Parser({ timeout: 15000, headers: { 'User-Agent': 'local-news/0.1 (homelab feed reader)' } });
export const feeds = JSON.parse(readFileSync(new URL('../config/feeds.json', import.meta.url)));

const hash = s => createHash('sha1').update(s).digest('hex');

export async function refreshAll(db) {
  const items = db.collection('items');
  const sources = db.collection('sources');
  for (const feed of feeds) {
    const started = new Date();
    try {
      const parsed = await parser.parseURL(feed.url);
      let added = 0;
      for (const it of (parsed.items || []).slice(0, 50)) {
        const link = it.link || it.guid;
        if (!link || !it.title) continue;
        const _id = hash(feed.id + '|' + (it.guid || link));
        const r = await items.updateOne({ _id }, {
          $setOnInsert: {
            title: it.title.trim(),
            link,
            source: feed.name,
            sourceId: feed.id,
            lang: feed.lang,
            category: feed.category,
            published: it.isoDate ? new Date(it.isoDate) : new Date(),
            summary: (it.contentSnippet || '').replace(/\s+/g, ' ').slice(0, 400)
          },
          $set: { fetchedAt: new Date() }
        }, { upsert: true });
        if (r.upsertedCount) added++;
      }
      await sources.updateOne({ _id: feed.id },
        { $set: { name: feed.name, lastRun: started, lastStatus: 'ok', lastAdded: added, lastTotal: (parsed.items || []).length } },
        { upsert: true });
      console.log(`[fetch] ${feed.id}: +${added} of ${(parsed.items || []).length}`);
    } catch (e) {
      await sources.updateOne({ _id: feed.id },
        { $set: { name: feed.name, lastRun: started, lastStatus: 'error: ' + String(e.message).slice(0, 200) } },
        { upsert: true });
      console.error(`[fetch] ${feed.id} FAILED: ${e.message}`);
    }
  }
}

// No-DB check that every configured feed parses (for the laptop / CI).
export async function dryRun() {
  let ok = 0;
  for (const feed of feeds) {
    try {
      const parsed = await parser.parseURL(feed.url);
      console.log(`OK   ${feed.id.padEnd(12)} ${(parsed.items || []).length} items`);
      ok++;
    } catch (e) {
      console.log(`FAIL ${feed.id.padEnd(12)} ${e.message}`);
    }
  }
  console.log(`${ok}/${feeds.length} feeds OK`);
  return ok;
}
