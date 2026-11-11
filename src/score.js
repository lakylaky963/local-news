// Learns what the owner likes from 👍/👎 and ranks the "For You" tab.
// v1: source affinity + title keyword weights + freshness decay. No external AI.

const STOP = new Set([
  'the', 'a', 'an', 'of', 'to', 'in', 'on', 'for', 'and', 'is', 'are', 'with', 'at', 'by', 'from',
  'as', 'it', 'this', 'that', 'be', 'was', 'has', 'have', 'will', 'after', 'over', 'into', 'new',
  'של', 'את', 'על', 'עם', 'הוא', 'היא', 'זה', 'גם', 'לא', 'כי', 'אם', 'או', 'אבל', 'יש',
  'בין', 'אחרי', 'לפני', 'כל', 'עוד', 'נגד', 'אל', 'מה', 'מי', 'כך', 'יותר', 'בגלל',
  // common news filler words
  'דיווח', 'דיווחים', 'בלעדי', 'צפו', 'צפה', 'תיעוד', 'עדכון', 'עדכוני', 'לייב', 'מיוחד',
  'כתבה', 'וידאו', 'תמונות', 'חדשות', 'הנה', 'כך', 'אחרי', 'לאחר', 'במהלך', 'לפי', 'מסר',
  'נמסר', 'טוען', 'טענו', 'קרא', 'קראו', 'ככל', 'הבוקר', 'הערב', 'היום', 'אתמול', 'מחר'
]);

export function tokens(title) {
  return (String(title).toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'"-]*/gu) || [])
    .filter(w => w.length > 2 && !STOP.has(w));
}

export async function rebuildProfile(db) {
  const fb = await db.collection('feedback').aggregate([
    { $lookup: { from: 'items', localField: 'itemId', foreignField: '_id', as: 'item' } },
    { $unwind: '$item' }
  ]).toArray();
  const words = {}, sources = {};
  for (const f of fb) {
    sources[f.item.sourceId] = (sources[f.item.sourceId] || 0) + f.vote;
    for (const w of tokens(f.item.title)) words[w] = (words[w] || 0) + f.vote;
  }
  const top = Object.fromEntries(
    Object.entries(words).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 300));
  await db.collection('profile').updateOne({ _id: 'owner' },
    { $set: { words: top, sources, updatedAt: new Date(), samples: fb.length } },
    { upsert: true });
  return { samples: fb.length, words: Object.keys(top).length, sources: Object.keys(sources).length };
}

export function scoreItem(item, profile) {
  if (!profile) return 0;
  let s = (profile.sources?.[item.sourceId] || 0) * 2;
  const words = profile.words || {};
  for (const w of tokens(item.title)) s += words[w] || 0;
  const ageHours = (Date.now() - new Date(item.published).getTime()) / 36e5;
  return s - ageHours / 12; // freshness decay so For You doesn't go stale
}
