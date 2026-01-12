import fs from 'fs';

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

const csvContent = fs.readFileSync('/home/ubuntu/upload/2025soldtest.csv', 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

const headers = parseCSVLine(lines[0]);
console.log('Total headers:', headers.length);
console.log('\nHeaders:');
headers.forEach((h, i) => console.log(`  ${i}: ${h.substring(0, 60)}`));

const firstData = parseCSVLine(lines[1]);
console.log('\nFirst data row fields:', firstData.length);
console.log('Mismatch:', firstData.length - headers.length);

// Check which fields are populated
console.log('\nFirst 10 data fields:');
firstData.slice(0, 10).forEach((f, i) => console.log(`  ${i}: ${f.substring(0, 60)}`));
