import admin from 'firebase-admin';
import * as fs from 'fs';
import path from 'path';

// Usage: npx tsx scripts/migrate_scores.ts

const PHASE_WEIGHTS: Record<string, number> = {
  pre_election: 0.5,
  campaign: 0.8,
  final: 1.2,
  exit: 1.5
};

const getConfidenceWeight = (confidence: number) => {
  if (confidence < 40) return 0.5; // Low
  if (confidence < 80) return 1.0; // Medium
  return 1.5; // High
};

async function migrate() {
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

    console.log("🚀 Starting migration of scores...");

    // Reset Candidate_Score collection if it exists (Optional, but safer for a clean migration)
    const existingScores = await db.collection("Candidate_Score").get();
    if (existingScores.size > 0) {
        console.log(`🧹 Cleaning up ${existingScores.size} existing Candidate_Score entries...`);
        const batch = db.batch();
        existingScores.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }

    const usersSnap = await db.collection("users").get();
    console.log(`👥 Found ${usersSnap.size} users.`);

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      let userTotalScore = 0;
      
      // 1. Get all predictions for this user across all subcollections
      const predsSnap = await db.collection("users").doc(userId).collection("predictions").get();
      
      console.log(`   - Processing user ${userId} (${predsSnap.size} predictions)...`);

      for (const predDoc of predsSnap.docs) {
        const pred = predDoc.data();
        const phase = pred.phase || "pre_election";
        const confidence = pred.confidence || 50;
        
        // Calculate new score: 1 * PhaseWeight * ConfidenceWeight
        const phaseWeight = PHASE_WEIGHTS[phase] || 0.5;
        const confidenceWeight = getConfidenceWeight(confidence);
        const newScore = 1 * phaseWeight * confidenceWeight;
        
        userTotalScore += newScore;

        // Update prediction document with its individual score weight
        await predDoc.ref.update({ scoreWeight: newScore });

        // Update Candidate_Score aggregate
        const scoreId = `${pred.constituencyId}_${pred.predictedParty}`;
        const scoreRef = db.collection("Candidate_Score").doc(scoreId);
        
        const scoreDoc = await scoreRef.get();
        if (!scoreDoc.exists) {
          await scoreRef.set({
            constituencyId: pred.constituencyId,
            predictedParty: pred.predictedParty,
            totalScore: newScore,
            predictionCount: 1,
            lastUpdated: new Date().toISOString()
          });
        } else {
          await scoreRef.update({
            totalScore: admin.firestore.FieldValue.increment(newScore),
            predictionCount: admin.firestore.FieldValue.increment(1),
            lastUpdated: new Date().toISOString()
          });
        }
      }

      // 2. Update user profile: remove influencePoints and set predictabilityScore
      await userDoc.ref.update({
        predictabilityScore: userTotalScore,
        influencePoints: admin.firestore.FieldValue.delete()
      });

      console.log(`   ✅ Migrated user ${userId}: New Score = ${userTotalScore.toFixed(2)}`);
    }

    console.log("✨ MIGRATION SUCCESSFUL: All scores recalculated and influencePoints removed.");
    process.exit(0);
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  }
}

migrate();
