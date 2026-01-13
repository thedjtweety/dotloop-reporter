/**
 * Comprehensive Demo Data Generator
 * Generates vast variety of realistic real estate transaction data
 * Proves system can handle different-sized brokerages and operations
 */

export interface DemoConfig {
  complexity?: 'micro' | 'small' | 'medium' | 'large' | 'enterprise' | 'random';
  seed?: number;
}

// All 50 US states with major cities
const US_LOCATIONS = [
  { state: 'AL', cities: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville'] },
  { state: 'AK', cities: ['Anchorage', 'Fairbanks', 'Juneau'] },
  { state: 'AZ', cities: ['Phoenix', 'Tucson', 'Mesa', 'Scottsdale'] },
  { state: 'AR', cities: ['Little Rock', 'Fort Smith', 'Fayetteville'] },
  { state: 'CA', cities: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento'] },
  { state: 'CO', cities: ['Denver', 'Colorado Springs', 'Aurora', 'Boulder'] },
  { state: 'CT', cities: ['Hartford', 'New Haven', 'Stamford', 'Bridgeport'] },
  { state: 'DE', cities: ['Wilmington', 'Dover', 'Newark'] },
  { state: 'FL', cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'] },
  { state: 'GA', cities: ['Atlanta', 'Savannah', 'Augusta', 'Columbus'] },
  { state: 'HI', cities: ['Honolulu', 'Hilo', 'Kailua'] },
  { state: 'ID', cities: ['Boise', 'Meridian', 'Nampa'] },
  { state: 'IL', cities: ['Chicago', 'Aurora', 'Naperville', 'Rockford'] },
  { state: 'IN', cities: ['Indianapolis', 'Fort Wayne', 'Evansville'] },
  { state: 'IA', cities: ['Des Moines', 'Cedar Rapids', 'Davenport'] },
  { state: 'KS', cities: ['Wichita', 'Overland Park', 'Kansas City'] },
  { state: 'KY', cities: ['Louisville', 'Lexington', 'Bowling Green'] },
  { state: 'LA', cities: ['New Orleans', 'Baton Rouge', 'Shreveport'] },
  { state: 'ME', cities: ['Portland', 'Lewiston', 'Bangor'] },
  { state: 'MD', cities: ['Baltimore', 'Columbia', 'Silver Spring'] },
  { state: 'MA', cities: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Brookline'] },
  { state: 'MI', cities: ['Detroit', 'Grand Rapids', 'Ann Arbor', 'Lansing'] },
  { state: 'MN', cities: ['Minneapolis', 'St. Paul', 'Rochester'] },
  { state: 'MS', cities: ['Jackson', 'Gulfport', 'Southaven'] },
  { state: 'MO', cities: ['Kansas City', 'St. Louis', 'Springfield'] },
  { state: 'MT', cities: ['Billings', 'Missoula', 'Great Falls'] },
  { state: 'NE', cities: ['Omaha', 'Lincoln', 'Bellevue'] },
  { state: 'NV', cities: ['Las Vegas', 'Henderson', 'Reno'] },
  { state: 'NH', cities: ['Manchester', 'Nashua', 'Concord'] },
  { state: 'NJ', cities: ['Newark', 'Jersey City', 'Paterson', 'Princeton'] },
  { state: 'NM', cities: ['Albuquerque', 'Santa Fe', 'Las Cruces'] },
  { state: 'NY', cities: ['New York', 'Buffalo', 'Rochester', 'Albany', 'Syracuse'] },
  { state: 'NC', cities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham'] },
  { state: 'ND', cities: ['Fargo', 'Bismarck', 'Grand Forks'] },
  { state: 'OH', cities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo'] },
  { state: 'OK', cities: ['Oklahoma City', 'Tulsa', 'Norman'] },
  { state: 'OR', cities: ['Portland', 'Eugene', 'Salem', 'Bend'] },
  { state: 'PA', cities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie'] },
  { state: 'RI', cities: ['Providence', 'Warwick', 'Cranston'] },
  { state: 'SC', cities: ['Charleston', 'Columbia', 'Greenville'] },
  { state: 'SD', cities: ['Sioux Falls', 'Rapid City', 'Aberdeen'] },
  { state: 'TN', cities: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'] },
  { state: 'TX', cities: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'] },
  { state: 'UT', cities: ['Salt Lake City', 'Provo', 'West Valley City'] },
  { state: 'VT', cities: ['Burlington', 'South Burlington', 'Rutland'] },
  { state: 'VA', cities: ['Virginia Beach', 'Norfolk', 'Richmond', 'Arlington'] },
  { state: 'WA', cities: ['Seattle', 'Spokane', 'Tacoma', 'Bellevue'] },
  { state: 'WV', cities: ['Charleston', 'Huntington', 'Morgantown'] },
  { state: 'WI', cities: ['Milwaukee', 'Madison', 'Green Bay'] },
  { state: 'WY', cities: ['Cheyenne', 'Casper', 'Laramie'] }
];

const FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'David', 'Barbara', 'Richard', 'Elizabeth', 'Joseph', 'Susan', 'Thomas', 'Jessica', 'Charles', 'Sarah', 'Christopher', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra', 'Steven', 'Ashley', 'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna', 'Kenneth', 'Michelle', 'Kevin', 'Dorothy', 'Brian', 'Carol', 'George', 'Amanda', 'Edward', 'Melissa', 'Ronald', 'Deborah', 'Timothy', 'Stephanie', 'Jason', 'Rebecca', 'Jeffrey', 'Sharon', 'Ryan', 'Laura', 'Jacob', 'Cynthia', 'Gary', 'Kathleen', 'Nicholas', 'Amy', 'Eric', 'Angela'];

const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Peterson', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins'];

const STREET_NAMES = ['Main', 'Oak', 'Elm', 'Maple', 'Pine', 'Washington', 'Broadway', 'Park', 'School', 'Church', 'Lake', 'Hill', 'River', 'Forest', 'Cedar', 'Sunset', 'Mountain', 'Valley', 'Meadow', 'Spring'];

const PROPERTY_TYPES = [
  'Single Family Home',
  'Condo',
  'Townhouse',
  'Multi-Family',
  'Commercial',
  'Land',
  'New Construction',
  'Waterfront',
  'Luxury Estate',
  'Investment Property'
];

const TRANSACTION_STATUSES = ['Sold', 'Pending', 'Under Contract', 'Closed'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomName(): string {
  return `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
}

function randomLocation() {
  const location = randomElement(US_LOCATIONS);
  const city = randomElement(location.cities);
  return { city, state: location.state };
}

function randomAddress(): string {
  const num = randomInt(1, 9999);
  const street = randomElement(STREET_NAMES);
  const type = randomElement(['St', 'Ave', 'Rd', 'Ln', 'Dr', 'Way', 'Blvd', 'Ct', 'Pl']);
  const { city, state } = randomLocation();
  const zip = randomInt(10000, 99999);
  return `${num} ${street} ${type}, ${city}, ${state} ${zip}`;
}

function randomDate(startDaysBack: number = 730, endDaysBack: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(endDaysBack, startDaysBack));
  return date.toISOString().split('T')[0];
}

function randomPrice(propertyType: string): number {
  const ranges: Record<string, [number, number]> = {
    'Single Family Home': [150000, 800000],
    'Condo': [100000, 500000],
    'Townhouse': [180000, 450000],
    'Multi-Family': [300000, 1500000],
    'Commercial': [500000, 5000000],
    'Land': [50000, 500000],
    'New Construction': [250000, 900000],
    'Waterfront': [400000, 3000000],
    'Luxury Estate': [1000000, 15000000],
    'Investment Property': [200000, 1200000]
  };
  
  const [min, max] = ranges[propertyType] || [200000, 800000];
  return randomInt(min, max);
}

function getComplexityConfig(complexity: string) {
  const configs = {
    micro: { agents: [1, 2], transactionsPerAgent: [3, 10] },
    small: { agents: [3, 8], transactionsPerAgent: [10, 30] },
    medium: { agents: [10, 25], transactionsPerAgent: [25, 75] },
    large: { agents: [30, 60], transactionsPerAgent: [50, 150] },
    enterprise: { agents: [70, 120], transactionsPerAgent: [100, 300] },
    random: { agents: [1, 120], transactionsPerAgent: [3, 300] }
  };
  
  return configs[complexity as keyof typeof configs] || configs.random;
}

export function generateDemoData(config: DemoConfig = {}) {
  const complexity = config.complexity || 'random';
  const complexityConfig = getComplexityConfig(complexity);
  
  const numAgents = randomInt(complexityConfig.agents[0], complexityConfig.agents[1]);
  const records = [];
  
  for (let i = 0; i < numAgents; i++) {
    const agentName = randomName();
    const numTransactions = randomInt(complexityConfig.transactionsPerAgent[0], complexityConfig.transactionsPerAgent[1]);
    
    // Agent performance tier (affects commission rates and property values)
    const performanceTier = Math.random();
    const isTopProducer = performanceTier > 0.8;
    const isNewAgent = performanceTier < 0.2;
    
    for (let j = 0; j < numTransactions; j++) {
      const propertyType = randomElement(PROPERTY_TYPES);
      const listPrice = randomPrice(propertyType);
      
      // Sale price varies based on market conditions
      const marketCondition = Math.random();
      let salePrice;
      if (marketCondition > 0.7) {
        // Hot market - over asking
        salePrice = Math.round(listPrice * (1.0 + Math.random() * 0.15));
      } else if (marketCondition < 0.3) {
        // Slow market - under asking
        salePrice = Math.round(listPrice * (0.85 + Math.random() * 0.10));
      } else {
        // Normal market
        salePrice = Math.round(listPrice * (0.95 + Math.random() * 0.05));
      }
      
      // Commission rate varies by property type and agent tier
      let baseCommissionRate = randomInt(40, 70) / 10; // 4.0% to 7.0%
      if (propertyType === 'Luxury Estate') baseCommissionRate = randomInt(30, 50) / 10;
      if (propertyType === 'Commercial') baseCommissionRate = randomInt(50, 80) / 10;
      if (isTopProducer) baseCommissionRate += 0.5;
      
      const commissionRate = parseFloat(baseCommissionRate.toFixed(1));
      const gci = Math.round(salePrice * (commissionRate / 100));
      
      // Company split varies by agent experience
      let companySplit;
      if (isNewAgent) {
        companySplit = randomInt(60, 80); // New agents give more to company
      } else if (isTopProducer) {
        companySplit = randomInt(20, 40); // Top producers keep more
      } else {
        companySplit = randomInt(40, 60); // Average agents
      }
      
      const companyDollar = Math.round(gci * (companySplit / 100));
      const agentComm = gci - companyDollar;
      
      // Add some edge cases
      const isEdgeCase = Math.random() < 0.05;
      let finalGCI = gci;
      let finalCompanyDollar = companyDollar;
      let finalAgentComm = agentComm;
      
      if (isEdgeCase) {
        const edgeType = Math.random();
        if (edgeType < 0.3) {
          // Zero commission (referral or special deal)
          finalGCI = 0;
          finalCompanyDollar = 0;
          finalAgentComm = 0;
        } else if (edgeType < 0.6) {
          // Reduced commission
          finalGCI = Math.round(gci * 0.5);
          finalCompanyDollar = Math.round(companyDollar * 0.5);
          finalAgentComm = Math.round(agentComm * 0.5);
        }
      }
      
      const { city, state } = randomLocation();
      
      records.push({
        'Loop Name': `${randomInt(100, 9999)} ${randomElement(STREET_NAMES)} ${randomElement(['St', 'Ave', 'Rd'])}`,
        'Address': randomAddress(),
        'City': city,
        'State': state,
        'Zip': randomInt(10000, 99999).toString(),
        'Property Type': propertyType,
        'List Price': `$${listPrice.toLocaleString()}`,
        'Sale Price': `$${salePrice.toLocaleString()}`,
        'Sold Date': randomDate(730, 0),
        'Agent': agentName,
        'Commission Rate': `${commissionRate}%`,
        'GCI': `$${finalGCI.toLocaleString()}`,
        'Company Split': `${companySplit}%`,
        'Company Dollar': `$${finalCompanyDollar.toLocaleString()}`,
        'Agent Commission': `$${finalAgentComm.toLocaleString()}`,
        'Status': randomElement(TRANSACTION_STATUSES),
      });
    }
  }
  
  const agents = new Set(records.map(r => r.Agent));
  const states = new Set(records.map(r => r.State));
  const propertyTypes = new Set(records.map(r => r['Property Type']));
  
  const totalGCI = records.reduce((sum, r) => {
    const gci = parseFloat(r.GCI.replace(/[$,]/g, ''));
    return sum + (isNaN(gci) ? 0 : gci);
  }, 0);
  
  const totalVolume = records.reduce((sum, r) => {
    const price = parseFloat(r['Sale Price'].replace(/[$,]/g, ''));
    return sum + (isNaN(price) ? 0 : price);
  }, 0);
  
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
        earliest: records.reduce((min, r) => r['Sold Date'] < min ? r['Sold Date'] : min, '2099-12-31'),
        latest: records.reduce((max, r) => r['Sold Date'] > max ? r['Sold Date'] : max, '2000-01-01')
      }
    }
  };
}
