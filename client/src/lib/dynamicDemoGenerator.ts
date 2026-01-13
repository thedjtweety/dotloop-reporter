/**
 * Dynamic Demo Data Generator
 * Creates unique, realistic Dotloop data each time with variable complexity
 */

import { DotloopRecord } from './csvParser';

interface GeneratorConfig {
  minAgents?: number;
  maxAgents?: number;
  minTransactionsPerAgent?: number;
  maxTransactionsPerAgent?: number;
  complexity?: 'small' | 'medium' | 'large' | 'random';
}

const MA_CITIES = [
  'Boston', 'Cambridge', 'Brookline', 'Newton', 'Somerville',
  'Waltham', 'Quincy', 'Medford', 'Arlington', 'Belmont',
  'Watertown', 'Needham', 'Wellesley', 'Framingham', 'Natick'
];

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer',
  'William', 'Linda', 'David', 'Barbara', 'Richard', 'Elizabeth',
  'Joseph', 'Susan', 'Thomas', 'Jessica', 'Charles', 'Sarah',
  'Christopher', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia',
  'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez',
  'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore',
  'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White'
];

const PROPERTY_TYPES = [
  'Single Family Home', 'Condo', 'Townhouse', 'Multi-Family',
  'Commercial', 'Land', 'New Construction', 'Waterfront'
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomName(): string {
  return `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
}

function randomAddress(): string {
  const streetNum = randomInt(1, 999);
  const streetNames = ['Main', 'Oak', 'Elm', 'Maple', 'Pine', 'Washington', 'Broadway', 'Park'];
  const streetType = ['St', 'Ave', 'Rd', 'Ln', 'Dr'];
  const city = randomElement(MA_CITIES);
  const zip = randomInt(2100, 2199);
  
  return `${streetNum} ${randomElement(streetNames)} ${randomElement(streetType)}, ${city}, MA 0${zip}`;
}

function randomDate(daysBack: number = 365): string {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysBack));
  return date.toISOString().split('T')[0];
}

function randomPrice(min: number = 200000, max: number = 1500000): number {
  return randomInt(min, max);
}

function randomCommissionRate(): number {
  return parseFloat((randomInt(40, 70) / 10).toFixed(1));
}

function getComplexityConfig(complexity: 'small' | 'medium' | 'large' | 'random'): GeneratorConfig {
  const configs = {
    small: { minAgents: 1, maxAgents: 3, minTransactionsPerAgent: 5, maxTransactionsPerAgent: 15 },
    medium: { minAgents: 8, maxAgents: 15, minTransactionsPerAgent: 20, maxTransactionsPerAgent: 50 },
    large: { minAgents: 25, maxAgents: 50, minTransactionsPerAgent: 50, maxTransactionsPerAgent: 200 },
    random: { minAgents: 1, maxAgents: 50, minTransactionsPerAgent: 5, maxTransactionsPerAgent: 150 }
  };
  
  return configs[complexity];
}

export function generateDemoData(config: GeneratorConfig = {}): DotloopRecord[] {
  const complexity = config.complexity || 'random';
  const complexityConfig = getComplexityConfig(complexity);
  
  const numAgents = config.minAgents || complexityConfig.minAgents || 5;
  const maxAgents = config.maxAgents || complexityConfig.maxAgents || 20;
  const minTransactions = config.minTransactionsPerAgent || complexityConfig.minTransactionsPerAgent || 10;
  const maxTransactions = config.maxTransactionsPerAgent || complexityConfig.maxTransactionsPerAgent || 50;
  
  const agents = randomInt(numAgents, maxAgents);
  const records: DotloopRecord[] = [];
  
  for (let i = 0; i < agents; i++) {
    const agentName = randomName();
    const agentTransactions = randomInt(minTransactions, maxTransactions);
    
    for (let j = 0; j < agentTransactions; j++) {
      const listPrice = randomPrice();
      const salePrice = Math.round(listPrice * (0.85 + Math.random() * 0.15));
      const commissionRate = randomCommissionRate();
      const gci = Math.round(salePrice * (commissionRate / 100));
      const companySplit = randomInt(40, 60);
      const companyDollar = Math.round(gci * (companySplit / 100));
      const agentComm = gci - companyDollar;
      
      records.push({
        'Loop Name': `${randomInt(100, 999)} ${randomElement(['Main', 'Oak', 'Elm', 'Park'])} St`,
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
  
  return records;
}

export function generateDemoDataWithStats(config: GeneratorConfig = {}) {
  const data = generateDemoData(config);
  
  const agents = new Set(data.map(r => r['Agent'] as string));
  const totalGCI = data.reduce((sum, r) => {
    const gci = parseFloat((r['GCI'] as string).replace(/[$,]/g, ''));
    return sum + (isNaN(gci) ? 0 : gci);
  }, 0);
  
  const stats = {
    agentCount: agents.size,
    transactionCount: data.length,
    totalGCI,
    avgTransactionValue: Math.round(totalGCI / data.length),
    dateRange: {
      earliest: data.reduce((min, r) => {
        const date = r['Sold Date'] as string;
        return date < min ? date : min;
      }, '2099-12-31'),
      latest: data.reduce((max, r) => {
        const date = r['Sold Date'] as string;
        return date > max ? date : max;
      }, '2000-01-01')
    }
  };
  
  return { data, stats };
}

export function getComplexityDescription(complexity: 'small' | 'medium' | 'large' | 'random'): string {
  const descriptions = {
    small: 'Small Brokerage (1-3 agents, 5-15 transactions each)',
    medium: 'Medium Brokerage (8-15 agents, 20-50 transactions each)',
    large: 'Large Brokerage (25-50 agents, 50-200 transactions each)',
    random: 'Random Complexity (varies each time)'
  };
  
  return descriptions[complexity];
}
