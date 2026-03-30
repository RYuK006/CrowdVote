import admin from 'firebase-admin';
import * as fs from 'fs';
import path from 'path';

// Usage: npx tsx scripts/promote_admin.ts <phoneNumber> <fullName>
const phoneNumber = process.argv[2] || "+919874563210";
const fullName = process.argv[3] || "Aaron Alex Mathew";

async function promote() {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'serviceAccountKey.json'), 'utf8'));
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const auth = admin.auth();
    const db = admin.firestore();

    console.log(`🔍 Searching for user with phone: ${phoneNumber}...`);
    
    try {
      const userRecord = await auth.getUserByPhoneNumber(phoneNumber);
      const uid = userRecord.uid;
      
      console.log(`✅ Found User: ${uid}`);
      console.log(`🚀 Promoting to Admin...`);

      await db.collection("admins").doc(uid).set({
        name: fullName,
        phone: phoneNumber,
        promotedAt: new Date().toISOString(),
        role: "SYSTEM_ADMIN"
      });

      console.log(`✨ SUCCESS: ${fullName} is now a System Administrator.`);
      process.exit(0);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        console.error(`❌ Error: User with phone ${phoneNumber} not found in Firebase Auth.`);
        console.log(`💡 Tip: Please sign in at least once as a regular user first so your account is created in Firebase.`);
      } else {
        throw err;
      }
      process.exit(1);
    }
  } catch (error) {
    console.error("💥 Critical Failure:", error);
    process.exit(1);
  }
}

promote();
