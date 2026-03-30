import admin from 'firebase-admin';
import * as fs from 'fs';
import path from 'path';

async function wipeFirebase() {
  const serviceAccount = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'serviceAccountKey.json'), 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();
  const auth = admin.auth();

  console.log("🔥 Starting Firebase Wipe...");

  // 1. Delete all Firestore Collections
  const collections = await db.listCollections();
  for (const collection of collections) {
    console.log(`Deleting collection: ${collection.id}...`);
    const snapshot = await collection.get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Collection ${collection.id} cleared.`);
  }

  // 2. Delete all Auth Users
  console.log("Deleting all Auth users...");
  let count = 0;
  const listUsers = async (nextPageToken?: string) => {
    const listResult = await auth.listUsers(1000, nextPageToken);
    const uids = listResult.users.map((user) => user.uid);
    if (uids.length > 0) {
      await auth.deleteUsers(uids);
      count += uids.length;
    }
    if (listResult.pageToken) {
      await listUsers(listResult.pageToken);
    }
  };

  await listUsers();
  console.log(`Successfully deleted ${count} users.`);
  console.log("✅ Firebase Wipe Complete.");
  process.exit(0);
}

wipeFirebase().catch((err) => {
  console.error("❌ Wipe failed:", err);
  process.exit(1);
});
