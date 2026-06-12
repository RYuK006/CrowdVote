import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const votes = await db.collection("global_votes").where("pollId", "in", ["mex-sou-win", "rep-cze-win"]).get();
  console.log(`Found ${votes.size} votes:`);
  votes.forEach(doc => console.log(doc.data()));
}
run().catch(console.error);
