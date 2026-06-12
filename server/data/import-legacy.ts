import * as fs from 'fs';
import xlsx from 'xlsx';
import admin from 'firebase-admin';

// Load service account manually for ESM
const serviceAccountPath = 'C:/Users/Aaron/Desktop/CrowdVotesAI/CrowdVote/serviceAccountKey.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function importLegacyData() {
  const usersRef = db.collection('users');
  const predictionsRef = db.collection('global_predictions');

  console.log("Starting legacy data migration...");

  // 1. Process result.csv for user scores
  const csvContent = fs.readFileSync('C:/Users/Aaron/Desktop/CrowdVotesAI/result.csv', 'utf8');
  // Simple CSV parser ignoring commas inside quotes
  const lines = csvContent.split('\n');
  const userScoreMap = new Map();
  
  lines.slice(1).forEach(line => {
    if (!line.trim()) return;
    // Assuming format: Rank,Username,Email,Total Predictions,Correct Predictions,Accuracy Points
    // Because some usernames might contain commas, we split carefully if needed, or just split by comma and take the last 3 items for scores.
    // e.g. "1,jyothis pt,jyothispt@gmail.com,140,104,8360"
    const parts = line.split(',');
    if (parts.length >= 6) {
      const points = parseInt(parts[parts.length - 1].trim(), 10) || 0;
      const correct = parseInt(parts[parts.length - 2].trim(), 10) || 0;
      const total = parseInt(parts[parts.length - 3].trim(), 10) || 0;
      const email = parts[parts.length - 4].trim();
      const displayName = parts.slice(1, parts.length - 4).join(',').trim();
      
      userScoreMap.set(email, { displayName, points, predictionCount: total });
    }
  });

  // Helper to create a consistent UID for legacy users
  const emailToUid = (email: string) => `legacy_${email.toLowerCase().replace(/[@.]/g, '_')}`;

  let batch = db.batch();
  let count = 0;

  for (const [email, data] of userScoreMap.entries()) {
    const uid = emailToUid(email);
    const docRef = usersRef.doc(uid);
    batch.set(docRef, {
      uid,
      email: email.toLowerCase(),
      displayName: data.displayName,
      score: data.points,
      predictionCount: data.predictionCount,
      role: 'user',
      createdAt: new Date().toISOString(),
      isLegacy: true
    }, { merge: true });
    
    count++;
    if (count % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }
  if (count % 400 !== 0) await batch.commit();
  console.log(`✅ Uploaded ${count} legacy users with their scores.`);

  // 2. Process Excel for individual predictions
  const wb = xlsx.readFile('C:/Users/Aaron/Desktop/CrowdVotesAI/user_predictions_report_v4.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const predictions = xlsx.utils.sheet_to_json(sheet);
  
  let predBatch = db.batch();
  let predCount = 0;

  // Clear existing legacy predictions to prevent duplicates if script is re-run
  const existingSnaps = await predictionsRef.where('isLegacy', '==', true).get();
  if (!existingSnaps.empty) {
    console.log(`Cleaning up ${existingSnaps.size} old legacy predictions...`);
    let delBatch = db.batch();
    let delCount = 0;
    for (const doc of existingSnaps.docs) {
      delBatch.delete(doc.ref);
      delCount++;
      if (delCount % 400 === 0) {
        await delBatch.commit();
        delBatch = db.batch();
      }
    }
    if (delCount % 400 !== 0) await delBatch.commit();
  }

  for (const row of predictions as any[]) {
    const email = row['User Email'];
    if (!email) continue;
    
    const uid = emailToUid(email);
    const docRef = predictionsRef.doc(); // Auto generate ID
    
    predBatch.set(docRef, {
      userId: uid,
      pollId: row['Constituency'],
      selectedOption: row['Vote Casted'],
      confidence: parseInt((row['Confidence'] || '0').toString().replace('%', ''), 10) || 50,
      timestamp: new Date().toISOString(),
      correct: row['Result'] === 'RIGHT',
      actualWinner: row['Actual Winner'],
      isLegacy: true
    });

    predCount++;
    if (predCount % 400 === 0) {
      await predBatch.commit();
      predBatch = db.batch();
    }
  }
  
  if (predCount % 400 !== 0) {
    await predBatch.commit();
  }
  
  console.log(`✅ Uploaded ${predCount} individual legacy predictions.`);
}

importLegacyData().then(() => {
  console.log('Migration Complete. Exiting...');
  process.exit(0);
}).catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
