import admin from 'firebase-admin';
import * as fs from 'fs';
import path from 'path';

// Usage: npx tsx scripts/set_admin_claim.ts <emailOrUid>
const targetIdentifier = process.argv[2] || "aaronalexmathew48@gmail.com";

async function setAdminClaim() {
  try {
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    if (!fs.existsSync(serviceAccountPath)) {
      console.error("❌ serviceAccountKey.json not found.");
      process.exit(1);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const auth = admin.auth();
    const db = admin.firestore();

    let userRecord: admin.auth.UserRecord;

    if (targetIdentifier.includes('@')) {
      console.log(`🔍 Resolving user by email: ${targetIdentifier}...`);
      userRecord = await auth.getUserByEmail(targetIdentifier);
    } else {
      console.log(`🔍 Resolving user by UID: ${targetIdentifier}...`);
      userRecord = await auth.getUser(targetIdentifier);
    }

    console.log(`👤 Found user: ${userRecord.displayName || 'No Name'} (${userRecord.uid})`);

    // Assign Firebase Auth Custom Claims
    const customClaims = {
      admin: true,
      level: 1,
      grantedAt: new Date().toISOString()
    };

    await auth.setCustomUserClaims(userRecord.uid, customClaims);
    console.log(`🔐 Set custom claims { admin: true, level: 1 } for ${userRecord.uid}`);

    // Update Firestore admin doc
    await db.collection("admins").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email || null,
      displayName: userRecord.displayName || "Admin User",
      role: "SYSTEM_ADMIN",
      customClaims,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`✨ Successfully granted cryptographic admin privileges to ${userRecord.email || userRecord.uid}`);
    process.exit(0);
  } catch (err: any) {
    console.error("💥 Failed to set admin claim:", err.message);
    process.exit(1);
  }
}

setAdminClaim();
