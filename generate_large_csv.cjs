// Generate a large CSV file for testing progress tracking
const fs = require('fs');

const headers = 'Loop Name,Loop Status,Agent Name,Price,Commission,Created Date,Closing Date,Address,City,State,Lead Source,Property Type,Bedrooms,Bathrooms,Square Footage';

let csv = headers + '\n';

// Generate 50,000 rows (approximately 10MB)
for (let i = 1; i <= 50000; i++) {
  const row = [
    `Loop ${i}`,
    ['Closed', 'Active', 'Under Contract', 'Archived'][i % 4],
    `Agent ${(i % 20) + 1}`,
    `$${(250000 + (i * 1000)).toLocaleString()}`,
    `$${(7500 + (i * 30)).toLocaleString()}`,
    `${(i % 12) + 1}/${(i % 28) + 1}/2024`,
    `${((i % 12) + 1)}/${((i % 28) + 1)}/2024`,
    `${i} Main Street`,
    ['Austin', 'Dallas', 'Houston', 'San Antonio'][i % 4],
    'TX',
    ['Referral', 'Website', 'Social Media', 'Walk-in'][i % 4],
    ['Single Family', 'Condo', 'Townhouse', 'Multi-Family'][i % 4],
    (i % 5) + 2,
    (i % 4) + 1,
    1500 + (i % 2000)
  ].join(',');
  
  csv += row + '\n';
  
  // Progress indicator
  if (i % 10000 === 0) {
    console.log(`Generated ${i} rows...`);
  }
}

fs.writeFileSync('test_large_file.csv', csv);
console.log(`\nGenerated test_large_file.csv with ${50000} rows (${(csv.length / 1024 / 1024).toFixed(2)} MB)`);
