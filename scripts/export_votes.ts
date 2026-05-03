import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import csvParser from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// 1. Load the Firebase service account key
const serviceAccountPath = path.join(ROOT_DIR, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ serviceAccountKey.json not found in the root directory.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// 2. Load the constituency names from master_data.csv
const constituencyMap = new Map<string, string>();
const csvPath = path.join(ROOT_DIR, 'server', 'data', 'master_data.csv');

async function loadConstituencies() {
  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csvParser())
      .on('data', (row) => {
        const id = String(row['Constituency_ID']);
        const name = row['Constituency_Name'];
        const district = row['District'];
        if (id && name) {
          constituencyMap.set(id, `${name} (${district})`); // Added district for clarity, or just name
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded ${constituencyMap.size} constituencies from master_data.csv`);
        resolve();
      })
      .on('error', reject);
  });
}

// 3. Main export function
async function exportVotes() {
  await loadConstituencies();

  console.log("⏳ Fetching users and predictions from Firestore...");

  try {
    // Fetch all users to map uid -> displayName
    const usersSnap = await db.collection('users').get();
    const userMap = new Map<string, string>();
    usersSnap.forEach(doc => {
      const data = doc.data();
      userMap.set(doc.id, data.displayName || 'Anonymous User');
    });
    console.log(`✅ Loaded ${userMap.size} users`);

    // Fetch all predictions
    const predsSnap = await db.collection('global_predictions').get();
    console.log(`✅ Loaded ${predsSnap.size} votes/predictions`);

    // Prepare CSV data
    const csvFilePath = path.join(ROOT_DIR, 'CrowdVote.csv');
    const writeStream = fs.createWriteStream(csvFilePath);
    
    // Write CSV Header
    writeStream.write("Display Name,Constituency,Candidate Name,Candidate's Party,Confidence Level\n");

    let rowCount = 0;
    predsSnap.forEach(doc => {
      const data = doc.data();
      
      const userId = data.userId || 'Unknown';
      const displayName = userMap.get(userId) || 'Anonymous User';
      
      const constituencyId = String(data.constituencyId);
      // Clean name from the map, fallback to ID if not found
      const constituencyName = constituencyMap.get(constituencyId) || `Constituency ${constituencyId}`;
      
      const candidateName = data.predictedCandidate || 'N/A';
      const partyName = data.predictedParty || 'N/A';
      const confidence = data.confidence !== undefined ? data.confidence : 'N/A';

      // Escape fields for CSV (in case of commas in names)
      const escapeCsv = (str: string) => `"${String(str).replace(/"/g, '""')}"`;

      const row = [
        escapeCsv(displayName),
        escapeCsv(constituencyName),
        escapeCsv(candidateName),
        escapeCsv(partyName),
        escapeCsv(confidence)
      ].join(',') + '\n';

      writeStream.write(row);
      rowCount++;
    });

    writeStream.end();
    
    writeStream.on('finish', () => {
      console.log(`🎉 Successfully exported ${rowCount} records to ${csvFilePath}`);
      process.exit(0);
    });

  } catch (error) {
    console.error("❌ Error exporting votes:", error);
    process.exit(1);
  }
}

exportVotes();
