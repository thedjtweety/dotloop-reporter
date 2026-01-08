import * as fs from 'fs';

function parseLine(line: string) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (line[i] === ',' && !inQuotes) {
      fields.push(current); current = '';
    } else { current += line[i]; }
  }
  fields.push(current);
  return fields;
}

const text = fs.readFileSync('/home/ubuntu/upload/2025final.csv', 'utf-8');
const lines = text.split('\n').filter(l => l.trim());
const headers = parseLine(lines[0]);
const row = parseLine(lines[1]); // First data row

console.log('Mapping for first row:');
headers.forEach((h, i) => {
  if (row[i]) {
    console.log(`[${i}] ${h}: ${row[i]}`);
  }
});
