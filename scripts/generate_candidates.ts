import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

// Paths
const CSV_FILE_PATH = path.join(process.cwd(), 'server', 'data', 'master_data.csv');
const OUTPUT_FILE_PATH = path.join(process.cwd(), 'src', 'candidates.json');

interface Candidate {
  id: string; // party short form or front
  name: string;
  party: string;
  front: string;
  symbol: string;
}

const symbolsMap: Record<string, string> = {
  'cpi(m)': 'cpim.png',
  'inc': 'inc.svg',
  'bjp': 'bjp.svg',
  'iuml': 'iuml.svg',
  'cpi': 'cpi.svg',
  'kerala congress (m)': 'kcm.svg',
  'bdjs': 'bjp.svg', // Defaulting BDJS to something generic or they don't have one? We can just leave symbol empty and default in UI
  'independent (inl support)': 'inl.png',
  // will be populated dynamically if possible
};

// Generic mapping logic for icons
function getSymbolForParty(partyName: string): string {
  if (!partyName) return '';
  const lower = partyName.toLowerCase();
  
  if (lower.includes('cpi(m)')) return 'cpim.png';
  if (lower.includes('cpi')) return 'cpi.svg';
  if (lower.includes('inc') || lower.includes('congress (secular)')) return 'inc.svg';
  if (lower.includes('bjp')) return 'bjp.svg';
  if (lower.includes('iuml')) return 'iuml.svg';
  if (lower.includes('inl')) return 'inl.png';
  if (lower.includes('kerala congress')) return 'kcm.svg';
  if (lower.includes('rmpi')) return 'rmpi.jpg';
  
  // Just use a clean version of the party name if we don't have exact match
  // The UI will fallback to a generic user icon if the symbol fails to load.
  const shortCode = lower.split('(')[0].replace(/[^a-z0-9]/g, '');
  return `${shortCode}.png`; 
}

async function processData() {
  const constituencies: Record<string, Candidate[]> = {};

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (row) => {
        const id = row['Constituency_ID'];
        if (!id) return;
        
        const candidates: Candidate[] = [];

        // Helper to add candidate
        const addCandidate = (name: string, party: string, front: string) => {
          if (!name || name === 'N/A' || name === '') return;
          candidates.push({
            id: party, // we use exact party as ID now
            name: name.trim(),
            party: party.trim(),
            front: front,
            symbol: getSymbolForParty(party)
          });
        };

        // LDF
        addCandidate(row['2026_LDF_Candidate'], row['2026_LDF_Party'], 'LDF');
        // UDF
        addCandidate(row['2026_UDF_Candidate'], row['2026_UDF_Party'], 'UDF');
        // NDA
        addCandidate(row['2026_NDA_Candidate'], row['2026_NDA_Party'], 'NDA');

        // OTH candidates could be split by '|'
        const othRaw = row['2026_OTH_Candidates'];
        if (othRaw && othRaw !== 'N/A') {
          const othList = othRaw.split('|');
          othList.forEach((othItem: string) => {
            // E.g., "Ravi Kulangara (TTP)"
            const match = othItem.match(/(.+?)\((.+?)\)/);
            if (match) {
              addCandidate(match[1].trim(), match[2].trim(), 'OTH');
            } else {
              addCandidate(othItem.trim(), 'Independent', 'OTH');
            }
          });
        }

        constituencies[id] = candidates;
      })
      .on('end', () => {
        fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(constituencies, null, 2));
        console.log(`✅ Generated candidates.json at ${OUTPUT_FILE_PATH}`);
        resolve();
      })
      .on('error', reject);
  });
}

processData().catch(console.error);
