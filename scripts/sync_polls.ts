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
  console.log("Deleting existing world_cup_polls...");
  await deleteCollection("world_cup_polls", 100);

  const pollsPath = path.join(process.cwd(), 'server', 'data', 'polls.json');
  if (!fs.existsSync(pollsPath)) {
    console.error("polls.json not found!");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(pollsPath, 'utf8'));
  console.log(`Seeding ${data.length} polls...`);

  const batch = db.batch();
  data.forEach((p: any) => {
    const docRef = db.collection('world_cup_polls').doc(p.id);
    batch.set(docRef, p);
  });
  await batch.commit();

  console.log("Done! world_cup_polls synchronized.");
  process.exit(0);
}

main().catch(console.error);
