/**
 * Comprehensive Demo Data Generator
 * Generates vast variety of realistic real estate transaction data
 * Matches DotloopRecord interface for proper dashboard display
 */

export interface DemoConfig {
  complexity?: 'micro' | 'small' | 'medium' | 'large' | 'enterprise' | 'random';
  seed?: number;
}

// All 50 US states with major cities
const US_LOCATIONS = [
  { state: 'AL', cities: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville'], county: 'Jefferson' },
  { state: 'AZ', cities: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale'], county: 'Maricopa' },
  { state: 'CA', cities: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose'], county: 'Los Angeles' },
  { state: 'CO', cities: ['Denver', 'Colorado Springs', 'Aurora', 'Boulder'], county: 'Denver' },
  { state: 'FL', cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville'], county: 'Miami-Dade' },
  { state: 'GA', cities: ['Atlanta', 'Savannah', 'Augusta', 'Columbus'], county: 'Fulton' },
  { state: 'IL', cities: ['Chicago', 'Aurora', 'Naperville', 'Rockford'], county: 'Cook' },
  { state: 'MA', cities: ['Boston', 'Worcester', 'Springfield', 'Cambridge'], county: 'Suffolk' },
  { state: 'MI', cities: ['Detroit', 'Grand Rapids', 'Ann Arbor', 'Lansing'], county: 'Wayne' },
  { state: 'NY', cities: ['New York', 'Buffalo', 'Rochester', 'Albany'], county: 'New York' },
  { state: 'NC', cities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham'], county: 'Mecklenburg' },
  { state: 'OH', cities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo'], county: 'Franklin' },
  { state: 'PA', cities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie'], county: 'Philadelphia' },
  { state: 'TX', cities: ['Houston', 'Dallas', 'Austin', 'San Antonio'], county: 'Harris' },
  { state: 'WA', cities: ['Seattle', 'Spokane', 'Tacoma', 'Bellevue'], county: 'King' }
];

const FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'David', 'Barbara', 'Richard', 'Elizabeth', 'Joseph', 'Susan', 'Thomas', 'Jessica', 'Charles', 'Sarah', 'Christopher', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra'];

const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore'];

const STREET_NAMES = ['Main', 'Oak', 'Elm', 'Maple', 'Pine', 'Washington', 'Broadway', 'Park', 'School', 'Church', 'Lake', 'Hill', 'River', 'Forest'];

const PROPERTY_TYPES = ['Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Commercial', 'Land', 'New Construction', 'Waterfront'];

const LEAD_SOURCES = ['Referral', 'Website', 'Zillow', 'Realtor.com', 'Open House', 'Social Media', 'Past Client', 'Direct Mail'];

const LOOP_STATUSES = ['Closed', 'Closed', 'Closed', 'Closed', 'Closed', 'Closed', 'Closed', 'Closed', 'Under Contract', 'Under Contract', 'Under Contract', 'Active Listings', 'Active Listings', 'Active Listings', 'Archived'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomName(): string {
  return `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
}

function randomDate(startDaysBack: number = 730, endDaysBack: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(endDaysBack, startDaysBack));
  return date.toISOString().split('T')[0];
}

function randomPrice(propertyType: string): number {
  const ranges: Record<string, [number, number]> = {
    'Single Family': [250000, 550000],
    'Condo': [200000, 400000],
    'Townhouse': [250000, 400000],
    'Multi-Family': [350000, 800000],
    'Commercial': [400000, 1200000],
    'Land': [80000, 300000],
    'New Construction': [300000, 600000],
    'Waterfront': [350000, 900000]
  };
  
  const [min, max] = ranges[propertyType] || [300000, 500000];
  return randomInt(min, max);
}

function getComplexityConfig(complexity: string) {
  // Updated to generate realistic US brokerage production numbers
  // Median: 10 transactions per agent per year, with 2-5 active listings, 1-3 under contract, 1-2 archived
  const configs = {
    micro: { agents: [1, 2], transactionsPerAgent: [8, 12] },
    small: { agents: [3, 8], transactionsPerAgent: [8, 12] },
    medium: { agents: [10, 25], transactionsPerAgent: [8, 12] },
    large: { agents: [30, 60], transactionsPerAgent: [8, 12] },
    enterprise: { agents: [70, 120], transactionsPerAgent: [8, 12] },
    random: { agents: [1, 120], transactionsPerAgent: [8, 12] }
  };
  
  return configs[complexity as keyof typeof configs] || configs.random;
}

export function generateDemoData(config: DemoConfig = {}) {
  const complexity = config.complexity || 'random';
  const complexityConfig = getComplexityConfig(complexity);
  
  const numAgents = randomInt(complexityConfig.agents[0], complexityConfig.agents[1]);
  const records: any[] = [];
  
  for (let i = 0; i < numAgents; i++) {
    const agentName = randomName();
    const numTransactions = randomInt(complexityConfig.transactionsPerAgent[0], complexityConfig.transactionsPerAgent[1]);
    
    // Agent performance tier
    const performanceTier = Math.random();
    const isTopProducer = performanceTier > 0.8;
    const isNewAgent = performanceTier < 0.2;
    
    for (let j = 0; j < numTransactions; j++) {
      const propertyType = randomElement(PROPERTY_TYPES);
      const location = randomElement(US_LOCATIONS);
      const city = randomElement(location.cities);
      const state = location.state;
      const county = location.county;
      
      const listPrice = randomPrice(propertyType);
      const marketCondition = Math.random();
      let salePrice;
      if (marketCondition > 0.7) {
        salePrice = Math.round(listPrice * (1.0 + Math.random() * 0.15));
      } else if (marketCondition < 0.3) {
        salePrice = Math.round(listPrice * (0.85 + Math.random() * 0.10));
      } else {
        salePrice = Math.round(listPrice * (0.95 + Math.random() * 0.05));
      }
      
      let baseCommissionRate = randomInt(40, 70) / 10;
      if (propertyType === 'Commercial') baseCommissionRate = randomInt(50, 80) / 10;
      if (isTopProducer) baseCommissionRate += 0.5;
      
      const commissionRate = parseFloat(baseCommissionRate.toFixed(1));
      const commissionTotal = Math.round(salePrice * (commissionRate / 100));
      
      let companySplit;
      if (isNewAgent) {
        companySplit = randomInt(60, 80);
      } else if (isTopProducer) {
        companySplit = randomInt(20, 40);
      } else {
        companySplit = randomInt(40, 60);
      }
      
      const companyDollar = Math.round(commissionTotal * (companySplit / 100));
      const buySideCommission = Math.round(commissionTotal * 0.5);
      const sellSideCommission = commissionTotal - buySideCommission;
      
      const closingDate = randomDate(730, 0);
      const createdDate = new Date(closingDate);
      createdDate.setDate(createdDate.getDate() - randomInt(30, 90));
      
      const listingDate = new Date(createdDate);
      listingDate.setDate(listingDate.getDate() + randomInt(1, 15));
      
      const offerDate = new Date(listingDate);
      offerDate.setDate(offerDate.getDate() + randomInt(5, 45));
      
      const num = randomInt(1, 9999);
      const street = randomElement(STREET_NAMES);
      const type = randomElement(['St', 'Ave', 'Rd', 'Ln', 'Dr']);
      const address = `${num} ${street} ${type}`;
      
      records.push({
        loopId: `LOOP-${randomInt(100000, 999999)}`,
        loopViewUrl: `https://www.dotloop.com/loop/${randomInt(100000, 999999)}`,
        loopName: `${num} ${street} ${type}`,
        loopStatus: randomElement(LOOP_STATUSES),
        createdDate: createdDate.toISOString().split('T')[0],
        closingDate,
        listingDate: listingDate.toISOString().split('T')[0],
        offerDate: offerDate.toISOString().split('T')[0],
        address,
        price: listPrice,
        propertyType,
        bedrooms: randomInt(1, 6),
        bathrooms: randomInt(1, 5),
        squareFootage: randomInt(800, 5000),
        city,
        state,
        county,
        leadSource: randomElement(LEAD_SOURCES),
        earnestMoney: Math.round(salePrice * 0.01),
        salePrice,
        commissionRate,
        commissionTotal,
        agents: agentName,
        createdBy: agentName,
        buySideCommission,
        sellSideCommission,
        companyDollar,
        referralSource: Math.random() > 0.8 ? randomElement(LEAD_SOURCES) : '',
        referralPercentage: Math.random() > 0.8 ? randomInt(10, 25) : 0,
        complianceStatus: 'Complete',
        tags: [],
        originalPrice: listPrice,
        yearBuilt: randomInt(1950, 2024),
        lotSize: randomInt(1000, 50000),
        subdivision: `${randomElement(STREET_NAMES)} ${randomElement(['Heights', 'Estates', 'Village', 'Park'])}`
      });
    }
  }
  
  const agents = new Set(records.map(r => r.agents));
  const states = new Set(records.map(r => r.state));
  const propertyTypes = new Set(records.map(r => r.propertyType));
  
  const totalGCI = records.reduce((sum, r) => sum + r.commissionTotal, 0);
  const totalVolume = records.reduce((sum, r) => sum + r.salePrice, 0);
  
  return {
    data: records,
    stats: {
      agentCount: agents.size,
      transactionCount: records.length,
      totalGCI,
      totalVolume,
      avgTransactionValue: Math.round(totalVolume / records.length),
      avgCommission: Math.round(totalGCI / records.length),
      stateCount: states.size,
      propertyTypeCount: propertyTypes.size,
      complexity,
      dateRange: {
        earliest: records.reduce((min, r) => r.closingDate < min ? r.closingDate : min, '2099-12-31'),
        latest: records.reduce((max, r) => r.closingDate > max ? r.closingDate : max, '2000-01-01')
      }
    }
  };
}
