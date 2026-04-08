import admin from 'firebase-admin';
import * as fs from 'fs';
import path from 'path';

// Usage: npx tsx scripts/remove_weights.ts

async function removeWeights() {
  try {
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (!fs.existsSync(serviceAccountPath)) {
      console.error("❌ Error: serviceAccountKey.json not found in root directory.");
      process.exit(1);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const db = admin.firestore();

    console.log("🚀 Starting permanent removal of scoring fields...");

    // 1. Remove predictabilityScore from all users
    console.log("👥 Processing users...");
    const usersSnap = await db.collection("users").get();
    let userCount = 0;
    
    // Firestore batch limit is 500, let's use chunks if needed, but for now assuming small db
    const userBatch = db.batch();
    usersSnap.docs.forEach(doc => {
      userBatch.update(doc.ref, {
        predictabilityScore: admin.firestore.FieldValue.delete(),
        scoreWeight: admin.firestore.FieldValue.delete()
      });
      userCount++;
    });
    
    if (userCount > 0) {
      await userBatch.commit();
      console.log(`   ✅ Removed scoring fields from ${userCount} users.`);
    }

    // 2. Remove scoreWeight from all predictions
    console.log("📊 Processing predictions (top-level)...");
    const predsSnap = await db.collection("predictions").get();
    let predCount = 0;
    const predBatch = db.batch();
    
    predsSnap.docs.forEach(doc => {
      predBatch.update(doc.ref, {
        scoreWeight: admin.firestore.FieldValue.delete()
      });
      predCount++;
    });
    
    if (predCount > 0) {
      await predBatch.commit();
      console.log(`   ✅ Removed scoreWeight from ${predCount} predictions.`);
    }

    // 3. Delete Candidate_Score collection
    console.log("🧹 Deleting Candidate_Score collection...");
    const scoreSnap = await db.collection("Candidate_Score").get();
    if (scoreSnap.size > 0) {
      const scoreBatch = db.batch();
      scoreSnap.docs.forEach(doc => scoreBatch.delete(doc.ref));
      await scoreBatch.commit();
      console.log(`   ✅ Deleted ${scoreSnap.size} Candidate_Score entries.`);
    } else {
      console.log("   ℹ️ Candidate_Score collection already empty or missing.");
    }

    console.log("✨ MIGRATION SUCCESSFUL: All scoring data purged from the database.");
    process.exit(0);
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  }
}

removeWeights();
