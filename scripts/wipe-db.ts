import admin from 'firebase-admin';
import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccount = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'serviceAccountKey.json'), 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function clearCollection(collectionPath: string) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();

  if (snapshot.size === 0) {
    console.log(`Collection ${collectionPath} is already empty.`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  console.log(`Deleted ${snapshot.size} documents from ${collectionPath}.`);
}

async function wipeData() {
  try {
    const usersSnapshot = await db.collection('users').get();
    let deletedPredictions = 0;
    
    // Delete predictions subcollections for each user
    for (const userDoc of usersSnapshot.docs) {
      const predsSnapshot = await userDoc.ref.collection('predictions').get();
      if (predsSnapshot.size > 0) {
        const batch = db.batch();
        predsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        deletedPredictions += predsSnapshot.size;
      }
    }
    console.log(`Deleted ${deletedPredictions} predictions from user subcollections.`);

    // Clear top level collections
    await clearCollection('users');
    await clearCollection('global_predictions');
    await clearCollection('Candidate_Score');
    await clearCollection('admins'); // Clear admins too!
    
    console.log("Database successfully wiped.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

wipeData();
