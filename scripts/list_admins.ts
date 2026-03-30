import admin from 'firebase-admin';
import * as fs from 'fs';
import path from 'path';

async function listAdmins() {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'serviceAccountKey.json'), 'utf8'));
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const db = admin.firestore();
    const snapshot = await db.collection("admins").get();

    if (snapshot.empty) {
      console.log("📭 No admins found in 'admins' collection.");
    } else {
      console.log(`📋 Found ${snapshot.size} admins:`);
      snapshot.forEach(doc => {
        console.log(`- ID: ${doc.id}, Data:`, doc.data());
      });
    }
    process.exit(0);
  } catch (error) {
    console.error("💥 Error:", error);
    process.exit(1);
  }
}

listAdmins();
