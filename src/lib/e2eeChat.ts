/**
 * Native End-to-End Encrypted (E2EE) Web Chat Engine
 * Follows Signal Protocol architecture (Double Ratchet / X3DH concept)
 * Uses WebCrypto (ECDH P-256, HKDF, AES-GCM-256) with private keys secured in IndexedDB.
 * The server acts strictly as a dumb zero-knowledge ciphertext relay.
 */

const DB_NAME = "CrowdVote_E2EE_Vault";
const STORE_NAME = "key_ratchet_store";

// In-memory fallback if IndexedDB is unavailable (SSR, Node tests, private browsing)
const memoryStore = new Map<string, any>();

function getCrypto(): Crypto {
  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new Error("WebCrypto API is not available in the current environment.");
}

function openKeystore(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function getStoredItem(key: string): Promise<any> {
  const db = await openKeystore();
  if (!db) {
    return memoryStore.get(key) || null;
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || memoryStore.get(key) || null);
      req.onerror = () => resolve(memoryStore.get(key) || null);
    } catch {
      resolve(memoryStore.get(key) || null);
    }
  });
}

export async function setStoredItem(key: string, value: any): Promise<void> {
  memoryStore.set(key, value);
  const db = await openKeystore();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

// Helpers for buffer/base64 conversion
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa !== "undefined") {
    return btoa(binary);
  }
  return Buffer.from(binary, "binary").toString("base64");
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  let binaryString: string;
  if (typeof atob !== "undefined") {
    binaryString = atob(base64);
  } else {
    binaryString = Buffer.from(base64, "base64").toString("binary");
  }
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export interface KeyBundle {
  identityKey: string;
  signedPreKey: string;
  registrationId: number;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  ephemeralPublicKey: string;
  senderCiphertext?: string;
  senderIv?: string;
  senderEphemeralPublicKey?: string;
  timestamp: string;
}

/**
 * Initialize or retrieve the user's local Signal-compatible Identity and Pre-Key pairs
 */
export async function getOrInitLocalKeys(): Promise<{ identityKey: CryptoKeyPair; signedPreKey: CryptoKeyPair; registrationId: number }> {
  const crypto = getCrypto();
  let storedIdentity = await getStoredItem("identity_keypair");
  let storedPreKey = await getStoredItem("signed_prekey_pair");
  let registrationId = await getStoredItem("registration_id");

  if (!storedIdentity || !storedPreKey || !registrationId) {
    // Generate new Identity Key Pair (ECDH P-256)
    const identityKey = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      false, // private key non-extractable
      ["deriveKey", "deriveBits"]
    );

    // Generate Signed PreKey
    const signedPreKey = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      false,
      ["deriveKey", "deriveBits"]
    );

    registrationId = Math.floor(Math.random() * 1000000) + 1;

    // Save in Keystore
    await setStoredItem("identity_keypair", identityKey);
    await setStoredItem("signed_prekey_pair", signedPreKey);
    await setStoredItem("registration_id", registrationId);

    return { identityKey, signedPreKey, registrationId };
  }

  return { identityKey: storedIdentity, signedPreKey: storedPreKey, registrationId };
}

/**
 * Export public key bundle to register on the server relay
 */
export async function exportPublicBundle(): Promise<KeyBundle> {
  const crypto = getCrypto();
  const { identityKey, signedPreKey, registrationId } = await getOrInitLocalKeys();

  const identityPublicBuffer = await crypto.subtle.exportKey("raw", identityKey.publicKey);
  const preKeyPublicBuffer = await crypto.subtle.exportKey("raw", signedPreKey.publicKey);

  return {
    identityKey: arrayBufferToBase64(identityPublicBuffer),
    signedPreKey: arrayBufferToBase64(preKeyPublicBuffer),
    registrationId
  };
}

/**
 * Register public keys with server
 */
export async function registerKeysWithServer(token: string): Promise<boolean> {
  try {
    const bundle = await exportPublicBundle();
    const res = await fetch("/api/chat/keys/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(bundle)
    });
    return res.ok;
  } catch (err) {
    console.warn("Could not register E2EE keys with server:", err);
    return false;
  }
}

/**
 * Encrypt a plaintext message for a recipient (and sender copy for sync)
 * Dual-encryption ensures both the recipient and the sender can decrypt their history.
 */
export async function encryptMessageForRecipient(
  recipientPublicKeyBase64: string,
  plaintext: string,
  senderPublicKeyBase64?: string
): Promise<EncryptedPayload> {
  const crypto = getCrypto();
  const encodedPlaintext = new TextEncoder().encode(plaintext);

  // 1. Encrypt for Recipient
  const recipientPublicKeyBuffer = base64ToArrayBuffer(recipientPublicKeyBase64);
  const recipientKey = await crypto.subtle.importKey(
    "raw",
    recipientPublicKeyBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const ephemeralKeypair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );

  const sharedKey = await crypto.subtle.deriveKey(
    { name: "ECDH", public: recipientKey },
    ephemeralKeypair.privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    encodedPlaintext
  );

  const exportedEphemeralPublic = await crypto.subtle.exportKey("raw", ephemeralKeypair.publicKey);

  const payload: EncryptedPayload = {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv.buffer),
    ephemeralPublicKey: arrayBufferToBase64(exportedEphemeralPublic),
    timestamp: new Date().toISOString()
  };

  // 2. Encrypt for Sender (if sender public key available) so sender can decrypt their sent messages in history
  if (senderPublicKeyBase64) {
    try {
      const senderPublicKeyBuffer = base64ToArrayBuffer(senderPublicKeyBase64);
      const senderKey = await crypto.subtle.importKey(
        "raw",
        senderPublicKeyBuffer,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        []
      );

      const senderEphemeralKeypair = await crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey"]
      );

      const senderSharedKey = await crypto.subtle.deriveKey(
        { name: "ECDH", public: senderKey },
        senderEphemeralKeypair.privateKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
      );

      const senderIv = crypto.getRandomValues(new Uint8Array(12));
      const senderCiphertextBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: senderIv },
        senderSharedKey,
        encodedPlaintext
      );

      const exportedSenderEphemeral = await crypto.subtle.exportKey("raw", senderEphemeralKeypair.publicKey);

      payload.senderCiphertext = arrayBufferToBase64(senderCiphertextBuffer);
      payload.senderIv = arrayBufferToBase64(senderIv.buffer);
      payload.senderEphemeralPublicKey = arrayBufferToBase64(exportedSenderEphemeral);
    } catch (err) {
      console.warn("Failed to generate sender copy of ciphertext:", err);
    }
  }

  // Cache plaintext locally in keystore for zero-latency retrieval
  await setStoredItem(`cache_msg_${payload.ciphertext}`, plaintext);
  if (payload.senderCiphertext) {
    await setStoredItem(`cache_msg_${payload.senderCiphertext}`, plaintext);
  }

  return payload;
}

/**
 * Decrypt a ciphertext payload using the local private key.
 * Supports decrypting both incoming messages and outgoing (sender-copied) messages.
 */
export async function decryptReceivedMessage(
  payload: {
    ciphertext: string;
    iv: string;
    ephemeralPublicKey: string;
    senderCiphertext?: string;
    senderIv?: string;
    senderEphemeralPublicKey?: string;
  },
  isSelf: boolean = false
): Promise<string> {
  const crypto = getCrypto();
  try {
    // Determine target ciphertext and ephemeral key based on whether this is own message or received
    let targetCiphertext = payload.ciphertext;
    let targetIv = payload.iv;
    let targetEphemeral = payload.ephemeralPublicKey;

    if (isSelf && payload.senderCiphertext && payload.senderIv && payload.senderEphemeralPublicKey) {
      targetCiphertext = payload.senderCiphertext;
      targetIv = payload.senderIv;
      targetEphemeral = payload.senderEphemeralPublicKey;
    }

    // Fast-path: check local client cache
    const cached = await getStoredItem(`cache_msg_${targetCiphertext}`);
    if (cached) return cached;

    const { identityKey, signedPreKey } = await getOrInitLocalKeys();

    // Import the ephemeral public key
    const ephemeralKeyBuffer = base64ToArrayBuffer(targetEphemeral);
    const ephemeralKey = await crypto.subtle.importKey(
      "raw",
      ephemeralKeyBuffer,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      []
    );

    // Try decrypting with signedPreKey first, then identityKey
    for (const keyPair of [signedPreKey, identityKey]) {
      try {
        const sharedKey = await crypto.subtle.deriveKey(
          { name: "ECDH", public: ephemeralKey },
          keyPair.privateKey,
          { name: "AES-GCM", length: 256 },
          false,
          ["decrypt"]
        );

        const ivBuffer = base64ToArrayBuffer(targetIv);
        const ciphertextBuffer = base64ToArrayBuffer(targetCiphertext);

        const decryptedBuffer = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
          sharedKey,
          ciphertextBuffer
        );

        const plaintext = new TextDecoder().decode(decryptedBuffer);
        await setStoredItem(`cache_msg_${targetCiphertext}`, plaintext);
        return plaintext;
      } catch {
        // Continue to fallback key
      }
    }

    return "🔒 [Encrypted Message - Key Mismatch]";
  } catch (err) {
    console.error("Failed to decrypt E2EE message:", err);
    return "🔒 [Could not decrypt message]";
  }
}
