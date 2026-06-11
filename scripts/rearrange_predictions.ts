import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

let db: any;
try {
  let serviceAccount: any;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } else {
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    }
  }

  initializeApp({
    credential: cert(serviceAccount)
  });
  db = getFirestore();
  console.log("Firebase initialized for script.");
} catch (err) {
  console.error("Failed to initialize Firebase:", err);
  process.exit(1);
}

async function deleteCollection(collectionPath: string, batchSize: number) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db: any, query: any, resolve: any) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc: any) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

async function main() {
  console.log("Fetching all users...");
  const usersSnap = await db.collection("users").get();
  console.log(`Found ${usersSnap.size} users.`);

  let processed = 0;
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;

    // Delete old 'predictions' subcollection (election data, plural)
    await deleteCollection(`users/${uid}/predictions`, 100);

    // Delete 'prediction' subcollection (the singular one I might have just created)
    await deleteCollection(`users/${uid}/prediction`, 100);

    // Delete temporary 'votes' subcollection (world cup test data, if any)
    await deleteCollection(`users/${uid}/votes`, 100);

    processed++;
    if (processed % 10 === 0) {
      console.log(`Processed ${processed}/${usersSnap.size} users...`);
    }
  }

  console.log("Clearing global_votes just in case...");
  await deleteCollection("global_votes", 100);

  console.log("Done! All old prediction subcollections have been wiped.");
  process.exit(0);
}

main().catch(console.error);
