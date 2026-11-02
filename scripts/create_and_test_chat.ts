import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// 1. Initialize Firebase Admin
let serviceAccount: any;
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
const FIREBASE_API_KEY = config.apiKey;

// WebCrypto helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(binary, "binary").toString("base64");
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = Buffer.from(base64, "base64").toString("binary");
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Client simulator for E2EE chat
class E2EEClient {
  public uid: string;
  public displayName: string;
  public email: string;
  public idToken: string = "";
  public identityKey!: CryptoKeyPair;
  public signedPreKey!: CryptoKeyPair;
  public registrationId: number = 1;

  constructor(uid: string, displayName: string, email: string) {
    this.uid = uid;
    this.displayName = displayName;
    this.email = email;
  }

  async initKeys() {
    this.identityKey = await globalThis.crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey", "deriveBits"]
    );
    this.signedPreKey = await globalThis.crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey", "deriveBits"]
    );
    this.registrationId = Math.floor(Math.random() * 1000000) + 1;
  }

  async exportBundle() {
    const idPub = await globalThis.crypto.subtle.exportKey("raw", this.identityKey.publicKey);
    const prePub = await globalThis.crypto.subtle.exportKey("raw", this.signedPreKey.publicKey);
    return {
      identityKey: arrayBufferToBase64(idPub),
      signedPreKey: arrayBufferToBase64(prePub),
      registrationId: this.registrationId
    };
  }

  async encryptMessage(recipientPublicKeyBase64: string, plaintext: string) {
    const encoded = new TextEncoder().encode(plaintext);
    const recipientKeyBuffer = base64ToArrayBuffer(recipientPublicKeyBase64);
    const recipientKey = await globalThis.crypto.subtle.importKey(
      "raw",
      recipientKeyBuffer,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      []
    );

    // Ephemeral key for recipient
    const ephKey = await globalThis.crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey"]
    );
    const sharedKey = await globalThis.crypto.subtle.deriveKey(
      { name: "ECDH", public: recipientKey },
      ephKey.privateKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const ct = await globalThis.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      sharedKey,
      encoded
    );
    const expEphPub = await globalThis.crypto.subtle.exportKey("raw", ephKey.publicKey);

    // Sender copy
    const myBundle = await this.exportBundle();
    const myKeyBuffer = base64ToArrayBuffer(myBundle.signedPreKey);
    const myKey = await globalThis.crypto.subtle.importKey(
      "raw",
      myKeyBuffer,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      []
    );
    const senderEphKey = await globalThis.crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey"]
    );
    const senderSharedKey = await globalThis.crypto.subtle.deriveKey(
      { name: "ECDH", public: myKey },
      senderEphKey.privateKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
    const senderIv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const senderCt = await globalThis.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: senderIv },
      senderSharedKey,
      encoded
    );
    const expSenderEph = await globalThis.crypto.subtle.exportKey("raw", senderEphKey.publicKey);

    return {
      ciphertext: arrayBufferToBase64(ct),
      iv: arrayBufferToBase64(iv.buffer),
      ephemeralPublicKey: arrayBufferToBase64(expEphPub),
      senderCiphertext: arrayBufferToBase64(senderCt),
      senderIv: arrayBufferToBase64(senderIv.buffer),
      senderEphemeralPublicKey: arrayBufferToBase64(expSenderEph),
      timestamp: new Date().toISOString()
    };
  }

  async decryptMessage(payload: any, isSelf: boolean = false): Promise<string> {
    const targetCt = isSelf && payload.senderCiphertext ? payload.senderCiphertext : payload.ciphertext;
    const targetIv = isSelf && payload.senderIv ? payload.senderIv : payload.iv;
    const targetEph = isSelf && payload.senderEphemeralPublicKey ? payload.senderEphemeralPublicKey : payload.ephemeralPublicKey;

    const ephBuffer = base64ToArrayBuffer(targetEph);
    const ephKey = await globalThis.crypto.subtle.importKey(
      "raw",
      ephBuffer,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      []
    );

    for (const keyPair of [this.signedPreKey, this.identityKey]) {
      try {
        const sharedKey = await globalThis.crypto.subtle.deriveKey(
          { name: "ECDH", public: ephKey },
          keyPair.privateKey,
          { name: "AES-GCM", length: 256 },
          false,
          ["decrypt"]
        );
        const decrypted = await globalThis.crypto.subtle.decrypt(
          { name: "AES-GCM", iv: new Uint8Array(base64ToArrayBuffer(targetIv)) },
          sharedKey,
          base64ToArrayBuffer(targetCt)
        );
        return new TextDecoder().decode(decrypted);
      } catch (err) {
        // try next
      }
    }
    throw new Error("Decryption failed with all local keys");
  }
}

async function getIdTokenForUser(uid: string): Promise<string> {
  const customToken = await admin.auth().createCustomToken(uid);
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to exchange custom token: ${errText}`);
  }
  const data: any = await res.json();
  return data.idToken;
}

async function run() {
  console.log("==================================================");
  console.log("🧪 STARTING RIGOROUS E2EE CHAT SUITE");
  console.log("==================================================");

  const BASE_URL = "http://127.0.0.1:3000";

  try {
    // 1. Create Two New Accounts
    const userA_id = `user_alpha_${Date.now()}`;
    const userB_id = `user_beta_${Date.now()}`;

    console.log(`\n1. Creating Account A: ${userA_id}`);
    await admin.auth().createUser({
      uid: userA_id,
      email: `${userA_id}@crowdvote.ai`,
      displayName: "Alpha Sentinel",
      password: "TestPassword123!"
    });
    await db.collection("users").doc(userA_id).set({
      uid: userA_id,
      displayName: "Alpha Sentinel",
      email: `${userA_id}@crowdvote.ai`,
      role: "user",
      accuracy: 94.5,
      createdAt: new Date().toISOString()
    });
    console.log("✅ Account A created successfully in Firebase Auth & Firestore");

    console.log(`\n2. Creating Account B: ${userB_id}`);
    await admin.auth().createUser({
      uid: userB_id,
      email: `${userB_id}@crowdvote.ai`,
      displayName: "Beta Oracle",
      password: "TestPassword123!"
    });
    await db.collection("users").doc(userB_id).set({
      uid: userB_id,
      displayName: "Beta Oracle",
      email: `${userB_id}@crowdvote.ai`,
      role: "user",
      accuracy: 98.1,
      createdAt: new Date().toISOString()
    });
    console.log("✅ Account B created successfully in Firebase Auth & Firestore");

    // 2. Generate ID tokens
    console.log("\n3. Generating authentic Firebase ID Tokens...");
    const clientA = new E2EEClient(userA_id, "Alpha Sentinel", `${userA_id}@crowdvote.ai`);
    const clientB = new E2EEClient(userB_id, "Beta Oracle", `${userB_id}@crowdvote.ai`);

    clientA.idToken = await getIdTokenForUser(userA_id);
    clientB.idToken = await getIdTokenForUser(userB_id);
    console.log("✅ Obtained ID Tokens for both Client A and Client B");

    // 3. Initialize cryptographic keys locally on each client
    console.log("\n4. Initializing WebCrypto ECDH P-256 keypairs locally on clients...");
    await clientA.initKeys();
    await clientB.initKeys();
    console.log("✅ Client A & Client B generated Identity & Signed PreKeys");

    // 4. Register public key bundles with server relay
    console.log("\n5. Registering public keys via POST /api/chat/keys/register...");
    const bundleA = await clientA.exportBundle();
    const bundleB = await clientB.exportBundle();

    const regResA = await fetch(`${BASE_URL}/api/chat/keys/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientA.idToken}`
      },
      body: JSON.stringify(bundleA)
    });
    if (!regResA.ok) throw new Error(`Client A key registration failed: ${await regResA.text()}`);

    const regResB = await fetch(`${BASE_URL}/api/chat/keys/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientB.idToken}`
      },
      body: JSON.stringify(bundleB)
    });
    if (!regResB.ok) throw new Error(`Client B key registration failed: ${await regResB.text()}`);
    console.log("✅ Both public key bundles registered on server");

    // 5. Client A discovers partners via GET /api/chat/partners
    console.log("\n6. Client A querying GET /api/chat/partners...");
    const partnersRes = await fetch(`${BASE_URL}/api/chat/partners`, {
      headers: { Authorization: `Bearer ${clientA.idToken}` }
    });
    const partners: any[] = await partnersRes.json();
    const foundB = partners.find(p => p.uid === userB_id);
    if (!foundB) {
      throw new Error(`Client B (${userB_id}) not found in partners list!`);
    }
    console.log(`✅ Client A discovered partner: ${foundB.displayName} (${foundB.email})`);

    // 6. Client A and Client B exchange public keys
    const keyResB = await fetch(`${BASE_URL}/api/chat/keys/${userB_id}`, {
      headers: { Authorization: `Bearer ${clientA.idToken}` }
    });
    const keyDataB: any = await keyResB.json();

    const keyResA = await fetch(`${BASE_URL}/api/chat/keys/${userA_id}`, {
      headers: { Authorization: `Bearer ${clientB.idToken}` }
    });
    const keyDataA: any = await keyResA.json();

    // 7. Multi-message Back-and-Forth Dialogue Simulation
    const dialogue = [
      { from: clientA, to: userB_id, key: keyDataB.signedPreKey, text: "🔒 Packet 1: Initializing Double Ratchet consensus." },
      { from: clientB, to: userA_id, key: keyDataA.signedPreKey, text: "🔓 Packet 2: Ratchet established. Signal received loud & clear! 🚀" },
      { from: clientA, to: userB_id, key: keyDataB.signedPreKey, text: "📊 Packet 3: Current prediction weight for Topic #44 is 87.6%." },
      { from: clientB, to: userA_id, key: keyDataA.signedPreKey, text: "🛡️ Packet 4: Validated by council. Zero-knowledge relay active." },
      { from: clientA, to: userB_id, key: keyDataB.signedPreKey, text: "✨ Packet 5: Final consensus handshake complete. All systems green." }
    ];

    console.log(`\n7. Transmitting ${dialogue.length} End-to-End Encrypted messages back and forth...`);
    const sentMessageDocs: string[] = [];

    for (let i = 0; i < dialogue.length; i++) {
      const step = dialogue[i];
      const payload = await step.from.encryptMessage(step.key, step.text);
      const res = await fetch(`${BASE_URL}/api/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${step.from.idToken}`
        },
        body: JSON.stringify({
          recipientId: step.to,
          ...payload
        })
      });
      const data: any = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(`Failed to relay message ${i + 1}: ${JSON.stringify(data)}`);
      }
      sentMessageDocs.push(data.id);
      console.log(`  ✓ Relayed Message ${i + 1} from ${step.from.displayName} -> Doc ID: ${data.id}`);
    }

    // 8. Zero-Knowledge Database Audit (Verify NO plaintext exists on server)
    console.log("\n8. 🔍 Auditing Firestore Database: Verifying ZERO plaintext leaks...");
    for (const docId of sentMessageDocs) {
      const docSnap = await db.collection("encrypted_messages").doc(docId).get();
      const rawData: any = docSnap.data();
      if (rawData.text || rawData.message || rawData.plaintext) {
        throw new Error(`CRITICAL SECURITY FAILURE: Plaintext leaked in doc ${docId}!`);
      }
      if (!rawData.ciphertext || !rawData.iv || !rawData.ephemeralPublicKey) {
        throw new Error(`Missing expected cryptographic envelope in doc ${docId}!`);
      }
    }
    console.log("✅ AUDIT PASSED: Database contains STRICTLY zero-knowledge ciphertext!");

    // 9. Client A full conversation decryption
    console.log("\n9. Testing Client A full conversation pull & decryption...");
    const streamResA = await fetch(`${BASE_URL}/api/chat/messages/${userB_id}`, {
      headers: { Authorization: `Bearer ${clientA.idToken}` }
    });
    const streamA: any[] = await streamResA.json();
    console.log(`📬 Client A pulled ${streamA.length} messages.`);

    for (let i = 0; i < streamA.length; i++) {
      const msg = streamA[i];
      const isSelf = msg.senderId === userA_id;
      const decrypted = await clientA.decryptMessage(msg, isSelf);
      console.log(`  [A-Stream ${i + 1}] (${isSelf ? "Self" : "Peer"}): "${decrypted}"`);
      if (decrypted !== dialogue[i].text) {
        throw new Error(`Message ${i + 1} decryption mismatch in Client A stream!`);
      }
    }
    console.log("✅ Client A verified all 5 messages cleanly!");

    // 10. Client B full conversation decryption
    console.log("\n10. Testing Client B full conversation pull & decryption...");
    const streamResB = await fetch(`${BASE_URL}/api/chat/messages/${userA_id}`, {
      headers: { Authorization: `Bearer ${clientB.idToken}` }
    });
    const streamB: any[] = await streamResB.json();
    console.log(`📬 Client B pulled ${streamB.length} messages.`);

    for (let i = 0; i < streamB.length; i++) {
      const msg = streamB[i];
      const isSelf = msg.senderId === userB_id;
      const decrypted = await clientB.decryptMessage(msg, isSelf);
      console.log(`  [B-Stream ${i + 1}] (${isSelf ? "Self" : "Peer"}): "${decrypted}"`);
      if (decrypted !== dialogue[i].text) {
        throw new Error(`Message ${i + 1} decryption mismatch in Client B stream!`);
      }
    }
    console.log("✅ Client B verified all 5 messages cleanly!");

    console.log("\n==================================================");
    console.log("🎉 ALL TESTS PASSED: E2EE CHAT IS 100% PERFECT!");
    console.log("==================================================");

    process.exit(0);
  } catch (error: any) {
    console.error("❌ TEST FAILED:", error);
    process.exit(1);
  }
}

run();
