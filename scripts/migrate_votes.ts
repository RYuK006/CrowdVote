import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function migrate() {
  const votesRef = db.collection("global_votes");
  const snap = await votesRef.get();
  const batch = db.batch();
  let count = 0;

  snap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.pollId === "kor-cze-1") {
      // Map old options to new options
      // Old: opt1=Korea, opt2=Czechia, opt3=Draw
      // New (rep-cze-win): opt1=Korea, opt2=Draw, opt3=Czechia
      let newOpt = data.selectedOption;
      if (data.selectedOption === "opt2") newOpt = "opt3";
      else if (data.selectedOption === "opt3") newOpt = "opt2";

      // Create new vote document for rep-cze-win
      const newVoteRef = votesRef.doc();
      batch.set(newVoteRef, {
        ...data,
        pollId: "rep-cze-win",
        selectedOption: newOpt
      });

      // Update user's predictions subcollection
      const userPredictionRef = db.collection("users").doc(data.userId).collection("predictions").doc("rep-cze-win");
      batch.set(userPredictionRef, {
        pollId: "rep-cze-win",
        selectedOption: newOpt,
        confidence: data.confidence,
        timestamp: data.timestamp
      });

      // Delete old vote
      batch.delete(doc.ref);
      batch.delete(db.collection("users").doc(data.userId).collection("predictions").doc("kor-cze-1"));
      
      count++;
    } else if (data.pollId === "mex-rsa-1") {
      let newOpt = data.selectedOption;
      if (data.selectedOption === "opt2") newOpt = "opt3";
      else if (data.selectedOption === "opt3") newOpt = "opt2";

      const newVoteRef = votesRef.doc();
      batch.set(newVoteRef, {
        ...data,
        pollId: "mex-sou-win",
        selectedOption: newOpt
      });

      const userPredictionRef = db.collection("users").doc(data.userId).collection("predictions").doc("mex-sou-win");
      batch.set(userPredictionRef, {
        pollId: "mex-sou-win",
        selectedOption: newOpt,
        confidence: data.confidence,
        timestamp: data.timestamp
      });

      batch.delete(doc.ref);
      batch.delete(db.collection("users").doc(data.userId).collection("predictions").doc("mex-rsa-1"));
      
      count++;
    } else if (data.pollId.startsWith("kor-cze-") || data.pollId.startsWith("mex-rsa-")) {
      // It's a secondary question vote (e.g. over 2.5 goals) which we deleted.
      // We can just clean it up so it doesn't clutter.
      batch.delete(doc.ref);
      batch.delete(db.collection("users").doc(data.userId).collection("predictions").doc(data.pollId));
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Migrated ${count} votes successfully!`);
  } else {
    console.log("No old votes found to migrate.");
  }
}

migrate().catch(console.error);
