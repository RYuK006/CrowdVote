import admin from 'firebase-admin';
import * as fs from 'fs';
import path from 'path';

async function verifyRemoval() {
  const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();

  console.log("🔍 Verifying removal of scoring fields...");

  const usersSnap = await db.collection("users").get();
  let userScoreFound = false;
  usersSnap.docs.forEach(doc => {
    if (doc.data().predictabilityScore !== undefined || doc.data().scoreWeight !== undefined) {
      console.log(`❌ User ${doc.id} still has scoring fields!`);
      userScoreFound = true;
    }
  });

  const predsSnap = await db.collection("predictions").get();
  let predWeightFound = false;
  predsSnap.docs.forEach(doc => {
    if (doc.data().scoreWeight !== undefined) {
      console.log(`❌ Prediction ${doc.id} still has scoreWeight!`);
      predWeightFound = true;
    }
  });

  const scoreSnap = await db.collection("Candidate_Score").get();
  if (scoreSnap.size > 0) {
    console.log(`❌ Candidate_Score collection still exists with ${scoreSnap.size} docs!`);
  } else {
    console.log("✅ Candidate_Score collection is gone.");
  }

  if (!userScoreFound && !predWeightFound && scoreSnap.size === 0) {
    console.log("✅ VERIFICATION SUCCESSFUL: No scoring fields found in DB.");
  } else {
    console.log("❌ VERIFICATION FAILED: Some fields still remain.");
  }
  process.exit(0);
}

verifyRemoval();
