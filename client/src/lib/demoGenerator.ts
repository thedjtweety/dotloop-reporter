/**
 * Dynamic Demo Data Generator
 * Creates unique, realistic Dotloop data each session
 */

export interface DemoConfig {
  complexity?: 'small' | 'medium' | 'large' | 'random';
  seed?: number;
}

const MA_CITIES = ['Boston', 'Cambridge', 'Brookline', 'Newton', 'Somerville', 'Waltham', 'Quincy', 'Medford', 'Arlington', 'Belmont'];
const FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'David', 'Barbara', 'Richard', 'Elizabeth', 'Joseph', 'Susan', 'Thomas', 'Jessica'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez'];
const STREET_NAMES = ['Main', 'Oak', 'Elm', 'Maple', 'Pine', 'Washington', 'Broadway', 'Park'];
const PROPERTY_TYPES = ['Single Family', 'Condo', 'Townhouse', 'Multi-Family'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomName(): string {
  return `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
}

function randomAddress(): string {
  const num = randomInt(1, 999);
  const street = randomElement(STREET_NAMES);
  const type = randomElement(['St', 'Ave', 'Rd', 'Ln']);
  const city = randomElement(MA_CITIES);
  const zip = randomInt(2100, 2199);
  return `${num} ${street} ${type}, ${city}, MA 0${zip}`;
}

function randomDate(daysBack: number = 365): string {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysBack));
  return date.toISOString().split('T')[0];
}

export function generateDemoData(config: DemoConfig = {}) {
  const complexity = config.complexity || 'random';
  
  const ranges = {
    small: { agents: [1, 3], transactions: [5, 15] },
    medium: { agents: [8, 15], transactions: [20, 50] },
    large: { agents: [25, 50], transactions: [50, 200] },
    random: { agents: [1, 50], transactions: [5, 150] }
  };
  
  const range = ranges[complexity];
  const numAgents = randomInt(range.agents[0], range.agents[1]);
  const records = [];
  
  for (let i = 0; i < numAgents; i++) {
    const agentName = randomName();
    const numTransactions = randomInt(range.transactions[0], range.transactions[1]);
    
    for (let j = 0; j < numTransactions; j++) {
      const listPrice = randomInt(200000, 1500000);
      const salePrice = Math.round(listPrice * (0.85 + Math.random() * 0.15));
      const commissionRate = (randomInt(40, 70) / 10);
      const gci = Math.round(salePrice * (commissionRate / 100));
      const companySplit = randomInt(40, 60);
      const companyDollar = Math.round(gci * (companySplit / 100));
      const agentComm = gci - companyDollar;
      
      records.push({
        'Loop Name': `${randomInt(100, 999)} ${randomElement(STREET_NAMES)} St`,
        'Address': randomAddress(),
        'City': randomElement(MA_CITIES),
        'State': 'MA',
        'Zip': randomInt(2100, 2199).toString(),
        'Property Type': randomElement(PROPERTY_TYPES),
        'List Price': `$${listPrice.toLocaleString()}`,
        'Sale Price': `$${salePrice.toLocaleString()}`,
        'Sold Date': randomDate(),
        'Agent': agentName,
        'Commission Rate': `${commissionRate}%`,
        'GCI': `$${gci.toLocaleString()}`,
        'Company Split': `${companySplit}%`,
        'Company Dollar': `$${companyDollar.toLocaleString()}`,
        'Agent Commission': `$${agentComm.toLocaleString()}`,
      });
    }
  }
  
  const agents = new Set(records.map(r => r.Agent));
  const totalGCI = records.reduce((sum, r) => {
    const gci = parseFloat(r.GCI.replace(/[$,]/g, ''));
    return sum + (isNaN(gci) ? 0 : gci);
  }, 0);
  
  return {
    data: records,
    stats: {
      agentCount: agents.size,
      transactionCount: records.length,
      totalGCI,
      avgTransactionValue: Math.round(totalGCI / records.length),
      complexity
    }
  };
}
