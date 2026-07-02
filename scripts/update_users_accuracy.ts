import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import csvParser from 'csv-parser';
import dotenv from 'dotenv';
dotenv.config();

let serviceAccount: any;
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  console.log("Using local serviceAccountKey.json");
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
} else {
  console.error("No service account found");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

let accuracyMap: Record<string, number> = {};

async function run() {
  const targetPath = path.join(process.cwd(), '..', 'result.csv');
  console.log("Reading from:", targetPath);
  
  if (fs.existsSync(targetPath)) {
    await new Promise((resolve) => {
      fs.createReadStream(targetPath)
        .pipe(csvParser())
        .on('data', (row: any) => {
          const email = row['Email']?.trim();
          const score = parseInt(row['Accuracy Points'], 10);
          if (email && !isNaN(score)) {
            accuracyMap[email] = score === 0 ? 100 : score;
          }
        })
        .on('end', () => {
          console.log(`Loaded ${Object.keys(accuracyMap).length} accuracy scores from result.csv`);
          resolve(true);
        });
    });

    const usersSnap = await db.collection("users").get();
    console.log(`Found ${usersSnap.docs.length} users in database.`);

    const batches = [];
    let currentBatch = db.batch();
    let operationCount = 0;
    let updatedCount = 0;

    usersSnap.docs.forEach((doc) => {
      const u = doc.data();
      const email = u.email;
      let newScore = 100;
      if (email && accuracyMap[email] !== undefined) {
        newScore = accuracyMap[email];
      }
      
      currentBatch.update(doc.ref, { accuracyScore: newScore });
      operationCount++;
      updatedCount++;

      if (operationCount === 500) {
        batches.push(currentBatch.commit());
        currentBatch = db.batch();
        operationCount = 0;
      }
    });

    if (operationCount > 0) {
      batches.push(currentBatch.commit());
    }

    await Promise.all(batches);
    console.log(`Successfully updated ${updatedCount} users with accuracy scores.`);
  } else {
    console.log("result.csv not found");
  }
}

run().catch(console.error);
