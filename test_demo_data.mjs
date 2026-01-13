import { generateDemoData } from './client/src/lib/demoGenerator.ts';

// Generate demo data with random complexity
const result = generateDemoData({ complexity: 'small' });

console.log('=== DEMO DATA GENERATION TEST ===\n');
console.log('Total Agents:', result.stats.agentCount);
console.log('Total Transactions:', result.stats.transactionCount);
console.log('Total GCI:', `$${result.stats.totalGCI.toLocaleString()}`);
console.log('Total Volume:', `$${result.stats.totalVolume.toLocaleString()}`);
console.log('Avg Transaction Value:', `$${result.stats.avgTransactionValue.toLocaleString()}`);
console.log('Avg Commission:', `$${result.stats.avgCommission.toLocaleString()}`);

// Count statuses
const statusCounts = {};
result.data.forEach(record => {
  statusCounts[record.loopStatus] = (statusCounts[record.loopStatus] || 0) + 1;
});

console.log('\n=== STATUS DISTRIBUTION ===');
Object.entries(statusCounts).forEach(([status, count]) => {
  const percentage = ((count / result.data.length) * 100).toFixed(1);
  console.log(`${status}: ${count} (${percentage}%)`);
});

// Sample agent breakdown
const agentMap = {};
result.data.forEach(record => {
  if (!agentMap[record.agents]) {
    agentMap[record.agents] = {
      transactions: 0,
      closed: 0,
      active: 0,
      underContract: 0,
      archived: 0,
      totalVolume: 0,
      totalGCI: 0
    };
  }
  agentMap[record.agents].transactions++;
  agentMap[record.agents].totalVolume += record.salePrice;
  agentMap[record.agents].totalGCI += record.commissionTotal;
  
  if (record.loopStatus === 'Closed') agentMap[record.agents].closed++;
  else if (record.loopStatus === 'Active Listings') agentMap[record.agents].active++;
  else if (record.loopStatus === 'Under Contract') agentMap[record.agents].underContract++;
  else if (record.loopStatus === 'Archived') agentMap[record.agents].archived++;
});

console.log('\n=== SAMPLE AGENT BREAKDOWN (First 3 Agents) ===');
Object.entries(agentMap).slice(0, 3).forEach(([agent, stats]) => {
  console.log(`\n${agent}:`);
  console.log(`  Total Transactions: ${stats.transactions}`);
  console.log(`  Closed: ${stats.closed}`);
  console.log(`  Active Listings: ${stats.active}`);
  console.log(`  Under Contract: ${stats.underContract}`);
  console.log(`  Archived: ${stats.archived}`);
  console.log(`  Total Volume: $${stats.totalVolume.toLocaleString()}`);
  console.log(`  Total GCI: $${stats.totalGCI.toLocaleString()}`);
  console.log(`  Avg Deal Value: $${(stats.totalVolume / stats.transactions).toLocaleString()}`);
});

console.log('\n✅ Demo data generation test complete!');
