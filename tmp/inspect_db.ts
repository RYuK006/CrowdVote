import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function inspect() {
  console.log("--- Inspecting config/global ---");
  const configDoc = await db.collection('config').doc('global').get();
  if (configDoc.exists) {
    console.log("config/global data:", JSON.stringify(configDoc.data(), null, 2));
  } else {
    console.log("config/global does NOT exist!");
  }

  console.log("\n--- Inspecting users (limit 1) ---");
  const usersSnap = await db.collection('users').limit(1).get();
  usersSnap.forEach(doc => {
    console.log(`User ${doc.id}:`, JSON.stringify(doc.data(), null, 2));
  });

  console.log("\n--- Inspecting global_predictions (limit 1) ---");
  const predSnap = await db.collection('global_predictions').limit(1).get();
  predSnap.forEach(doc => {
    console.log(`Prediction ${doc.id}:`, JSON.stringify(doc.data(), null, 2));
  });

  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
