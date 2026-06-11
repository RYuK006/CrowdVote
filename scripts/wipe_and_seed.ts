import admin from 'firebase-admin';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const serviceAccountPath = path.join(rootDir, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error("No serviceAccountKey.json found at", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteCollection(collectionPath: string) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();
  
  const batchSize = snapshot.size;
  if (batchSize === 0) {
    console.log(`Collection ${collectionPath} is empty.`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Deleted ${batchSize} documents from ${collectionPath}.`);
}

async function runMigration() {
  try {
    console.log("Starting Database Migration...");

    // 1. Export Users
    console.log("1. Exporting existing users...");
    const usersSnap = await db.collection("users").get();
    const exportedUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    fs.writeFileSync(path.join(rootDir, 'exported_users.json'), JSON.stringify(exportedUsers, null, 2));
    console.log(`Exported ${exportedUsers.length} users to exported_users.json`);

    // 2. Wipe Collections
    console.log("2. Wiping existing Firestore collections...");
    await deleteCollection("users");
    await deleteCollection("world_cup_polls");
    await deleteCollection("votes");

    // 3. Re-seed Users
    console.log("3. Re-seeding users collection...");
    if (exportedUsers.length > 0) {
      const batch = db.batch();
      exportedUsers.forEach((user: any) => {
        const { id, ...data } = user;
        const docRef = db.collection("users").doc(id);
        batch.set(docRef, data);
      });
      await batch.commit();
      console.log(`Successfully re-seeded ${exportedUsers.length} users.`);
    }

    console.log("Migration Complete! ✅");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
