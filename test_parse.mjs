import fs from 'fs';

const csvContent = fs.readFileSync('/home/ubuntu/upload/2025soldtest.csv', 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

console.log('Total lines:', lines.length);
console.log('First line length:', lines[0].length);
console.log('First 200 chars of first line:', lines[0].substring(0, 200));

// Check header detection
const firstLine = lines[0];
const headerKeywords = ['Agent Name', 'Loop Name', 'Price', 'Closing Date', 'Address', 'Lead Source', 'Loop View', 'Loop ID', 'Loop Status', 'Created Date', 'Financials', 'Property'];

const hasKeyword = headerKeywords.some(h => firstLine.toLowerCase().includes(h.toLowerCase()));
console.log('Has header keyword:', hasKeyword);

// Try to parse first data line
console.log('\nFirst data line (line 2):');
console.log('Length:', lines[1].length);
console.log('First 200 chars:', lines[1].substring(0, 200));

// Count commas
const headerCommas = (lines[0].match(/,/g) || []).length;
const dataCommas = (lines[1].match(/,/g) || []).length;
console.log('\nHeader commas:', headerCommas);
console.log('Data commas:', dataCommas);
