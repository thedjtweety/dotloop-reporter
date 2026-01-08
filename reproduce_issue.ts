import * as fs from 'fs';
import * as path from 'path';

// Mock the parsing logic from Home.tsx
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

function testFile(filePath: string) {
  console.log(`\nTesting file: ${path.basename(filePath)}`);
  try {
    const text = fs.readFileSync(filePath, 'utf-8');
    const lines = text.split('\n').filter(l => l.trim());
    
    if (lines.length < 1) {
      console.log('File is empty');
      return;
    }

    let headers = parseLine(lines[0]).map(h => h.trim());
    
    // Heuristic from Home.tsx
    const isHeadless = headers.some(h => 
      !isNaN(parseFloat(h)) || // Is a number
      h.includes('/') || // Looks like a date
      h.length > 50 // Too long for a header
    );

    console.log(`Detected as headless: ${isHeadless}`);
    console.log(`First row (potential headers):`, headers.slice(0, 5)); // Show first 5 cols

    if (isHeadless) {
      const syntheticHeaders = headers.map((_, i) => `Column ${i + 1}`);
      console.log(`Generated synthetic headers:`, syntheticHeaders.slice(0, 5));
    }

  } catch (error) {
    console.error('Error reading file:', error);
  }
}

// Test all 3 files
testFile('/home/ubuntu/upload/ReportBuilding.csv');
testFile('/home/ubuntu/upload/2025final.csv');
testFile('/home/ubuntu/upload/6monthview.csv');
