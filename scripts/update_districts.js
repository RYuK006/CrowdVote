import fs from 'fs';
import path from 'path';

const csvPath = 'server/data/master_data.csv';
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n');
const header = lines[0];
const dataLines = lines.slice(1).filter(line => line.trim() !== '');

const mapping = {
  Kasaragod: [1, 2, 3, 4, 5],
  Kannur: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  Wayanad: [17, 18, 19],
  Kozhikode: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32],
  Malappuram: [33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48],
  Palakkad: [49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
  Thrissur: [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
  Ernakulam: [74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87],
  Idukki: [88, 89, 90, 91, 92],
  Kottayam: [93, 94, 95, 96, 97, 98, 99, 100, 101],
  Alappuzha: [102, 103, 104, 105, 106, 107, 108, 109, 110],
  Pathanamthitta: [111, 112, 113, 114, 115],
  Kollam: [116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126],
  Thiruvananthapuram: [127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140]
};

const idToDistrict = {};
for (const [district, ids] of Object.entries(mapping)) {
  for (const id of ids) {
    idToDistrict[id] = district;
  }
}

const updatedLines = dataLines.map(line => {
  const parts = line.split(',');
  const id = parseInt(parts[0]);
  if (idToDistrict[id]) {
    parts[3] = idToDistrict[id];
  }
  return parts.join(',');
});

fs.writeFileSync(csvPath, [header, ...updatedLines].join('\n') + '\n');
console.log('Successfully updated districts in master_data.csv');
