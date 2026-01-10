/**
 * Sample Data Generator for Demo Mode
 * Generates realistic real estate transaction data for demonstration purposes
 */

import { DotloopRecord } from './csvParser';

const AGENTS = [
  'Sarah Miller', 'James Wilson', 'Michael Chen', 'Emily Davis', 
  'Robert Taylor', 'Jennifer Anderson', 'David Martinez', 'Lisa Thompson'
];

const CITIES = [
  'Austin', 'Round Rock', 'Georgetown', 'Cedar Park', 'Pflugerville', 
  'Leander', 'Hutto', 'Liberty Hill'
];

const STREETS = [
  'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Main', 'Washington', 'Lake', 
  'Hill', 'Park', 'View', 'Meadow', 'Forest', 'River', 'Spring'
];

const STATUSES = [
  'Sold', 'Sold', 'Sold', 'Sold', // Higher weight for sold
  'Active Listings', 'Active Listings', 
  'Under Contract', 'Under Contract',
  'Archived'
];

const LEAD_SOURCES = [
  'Referral', 'Zillow', 'Open House', 'Sphere of Influence', 
  'Social Media', 'Website', 'Sign Call', 'Past Client'
];

const PROPERTY_TYPES = [
  'Single Family', 'Single Family', 'Single Family', // Higher weight
  'Condo', 'Townhouse', 'Multi-Family', 'Land'
];

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date: Date) {
  return date.toISOString().split('T')[0];
}

export function generateSampleData(count: number = 150): DotloopRecord[] {
  const records: DotloopRecord[] = [];
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const threeMonthsFuture = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());

  for (let i = 0; i < count; i++) {
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const streetName = STREETS[Math.floor(Math.random() * STREETS.length)];
    const streetNum = Math.floor(Math.random() * 9000) + 100;
    const price = Math.floor(Math.random() * 800000) + 250000; // 250k - 1.05M
    
    // Dates logic
    const createdDate = randomDate(oneYearAgo, now);
    let closingDate = '';
    let offerDate = '';
    let listingDate = '';

    if (status === 'Sold') {
      // Sold in the past year
      const close = randomDate(createdDate, now);
      closingDate = formatDate(close);
      offerDate = formatDate(new Date(close.getTime() - 30 * 24 * 60 * 60 * 1000));
    } else if (status === 'Under Contract') {
      // Closing in the future (15-60 days from now)
      const futureClose = new Date(now.getTime() + (Math.random() * 45 + 15) * 24 * 60 * 60 * 1000);
      closingDate = formatDate(futureClose);
      offerDate = formatDate(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)); // Offer accepted recently
    } else if (status === 'Active Listings') {
      // Projected closing in future (30-90 days)
      const projectedClose = new Date(now.getTime() + (Math.random() * 60 + 30) * 24 * 60 * 60 * 1000);
      closingDate = formatDate(projectedClose); // Set for projection purposes
    }

    if (status !== 'Archived') {
      listingDate = formatDate(createdDate);
    }

    // Commission logic
    const commissionRate = 0.03;
    const totalCommission = price * commissionRate; // Calculate for ALL statuses so projections work
    const isBuySide = Math.random() > 0.5;
    
    const loopId = crypto.randomUUID(); // Generate a fake UUID
    // Use a realistic looking ID for the view URL
    const viewId = Math.floor(Math.random() * 100000000) + 200000000;

    records.push({
      loopId: loopId,
      loopViewUrl: `https://www.dotloop.com/loop/${viewId}/view`,
      loopName: `${streetNum} ${streetName} St, ${city}, TX`,
      loopStatus: status,
      createdDate: formatDate(createdDate),
      closingDate,
      listingDate,
      offerDate,
      address: `${streetNum} ${streetName} St`,
      price: price, // Always populate price
      propertyType: PROPERTY_TYPES[Math.floor(Math.random() * PROPERTY_TYPES.length)],
      bedrooms: Math.floor(Math.random() * 4) + 2,
      bathrooms: Math.floor(Math.random() * 3) + 2,
      squareFootage: Math.floor(Math.random() * 2500) + 1200,
      city,
      state: 'TX',
      county: 'Williamson',
      leadSource: LEAD_SOURCES[Math.floor(Math.random() * LEAD_SOURCES.length)],
      earnestMoney: price * 0.01,
      salePrice: status === 'Sold' ? price : 0, // Sale price only for sold
      commissionRate: 3,
      commissionTotal: totalCommission, // Populate for all to enable projections
      agents: agent,
      createdBy: agent,
      buySideCommission: isBuySide ? totalCommission : 0,
      sellSideCommission: !isBuySide ? totalCommission : 0,
      companyDollar: totalCommission * 0.2, // 80/20 split
      referralSource: '',
      referralPercentage: 0,
      complianceStatus: status === 'Sold' ? 'Approved' : 'Pending',
      tags: [],
      originalPrice: price + 10000,
      yearBuilt: Math.floor(Math.random() * 30) + 1990,
      lotSize: Math.floor(Math.random() * 8000) + 4000,
      subdivision: 'Sample Estates'
    });
  }

  return records;
}
