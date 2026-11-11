import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI || 'mongodb://10.0.0.230:27017';
const dbName = process.env.DB_NAME || 'news';

// Retries forever (like CodeZi's pattern) so the app survives Mongo restarts;
// pm2 restarts us if we ever crash anyway.
export async function connect() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  for (;;) {
    try { await client.connect(); break; }
    catch (e) {
      console.error('[mongo] connect failed, retrying in 15s:', e.message);
      await new Promise(r => setTimeout(r, 15000));
    }
  }
  const db = client.db(dbName);
  await db.collection('items').createIndex({ published: -1 });
  await db.collection('items').createIndex({ category: 1, published: -1 });
  // items disappear 45 days after they stop appearing in any feed
  await db.collection('items').createIndex({ fetchedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 45 });
  await db.collection('feedback').createIndex({ itemId: 1 }, { unique: true });
  console.log('[mongo] connected to', dbName);
  return db;
}
