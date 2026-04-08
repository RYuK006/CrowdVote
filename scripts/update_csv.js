import fs from 'fs';
import path from 'path';

const csvPath = 'c:/Users/hp/Desktop/CrowdVote/server/data/master_data.csv';
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n');

const newLines = lines.map((line, index) => {
    if (!line.trim()) return line;
    const parts = line.split(',');
    if (index === 0) {
        // Find District index
        const districtIndex = parts.indexOf('District');
        parts.splice(districtIndex, 0, 'State');
    } else {
        // Insert at index 2 (after Constituency_Name)
        parts.splice(2, 0, 'Kerala');
    }
    return parts.join(',');
});

fs.writeFileSync(csvPath, newLines.join('\n'));
console.log('✅ master_data.csv updated with State column.');
