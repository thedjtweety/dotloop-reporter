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

// City coordinates for demo mode fallback geocoding
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Austin': { lat: 30.2672, lng: -97.7431 },
  'Round Rock': { lat: 30.5008, lng: -97.6789 },
  'Georgetown': { lat: 30.6327, lng: -97.6816 },
  'Cedar Park': { lat: 30.3414, lng: -97.8081 },
  'Pflugerville': { lat: 30.5746, lng: -97.6089 },
  'Leander': { lat: 30.7699, lng: -97.8558 },
  'Hutto': { lat: 30.5158, lng: -97.4689 },
  'Liberty Hill': { lat: 30.6882, lng: -97.8628 }
};

const STREETS = [
  'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Main', 'Washington', 'Lake', 
  'Hill', 'Park', 'View', 'Meadow', 'Forest', 'River', 'Spring'
];

const STATUSES = [
  'Sold', 'Sold', 'Sold', 'Sold', // Higher weight for sold
  'Active', 'Active', 
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

export function getCityCoordinates(city: string): { lat: number; lng: number } {
  return CITY_COORDS[city] || { lat: 30.2672, lng: -97.7431 }; // Default to Austin
}

export function generateSampleData(count: number = 150): DotloopRecord[] {
  const records: DotloopRecord[] = [];
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const threeMonthsFuture = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  // Ensure we have at least 15 sold properties for Price Reduction Analysis chart
  const minSoldProperties = 15;
  const soldCount = Math.max(minSoldProperties, Math.floor(count * 0.4)); // At least 15 or 40% of total

  for (let i = 0; i < count; i++) {
    // Guarantee first N records are 'Sold' to ensure Price Reduction Analysis has data
    const status = i < soldCount ? 'Sold' : STATUSES[Math.floor(Math.random() * STATUSES.length)];
    const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const streetName = STREETS[Math.floor(Math.random() * STREETS.length)];
    const streetNum = Math.floor(Math.random() * 9000) + 100;
    const price = Math.floor(Math.random() * 800000) + 250000; // 250k - 1.05M
    const zipCode = Math.floor(Math.random() * 900) + 78700; // Austin area zip codes
    const fullAddress = `${streetNum} ${streetName} St, ${city}, TX ${zipCode}`;
    
    // Dates logic
    const createdDate = randomDate(oneYearAgo, now);
    let closingDate = '';
    let offerDate = '';
    let listingDate = '';

    if (status === 'Sold') {
      const close = new Date(createdDate.getTime() + (Math.random() * 60 + 30) * 24 * 60 * 60 * 1000);
      closingDate = formatDate(close);
      offerDate = formatDate(new Date(close.getTime() - 30 * 24 * 60 * 60 * 1000));
    } else if (status === 'Under Contract') {
      offerDate = formatDate(new Date(createdDate.getTime() + 15 * 24 * 60 * 60 * 1000));
      // Ensure closing date is in the future for projection
      const futureClose = randomDate(now, threeMonthsFuture);
      closingDate = formatDate(futureClose);
    }

    if (status !== 'Archived') {
      listingDate = formatDate(createdDate);
    }

    // Commission logic
    const commissionRate = 0.03;
    // Ensure commission is calculated for Sold AND Under Contract status (projected)
    const totalCommission = (status === 'Sold' || status === 'Under Contract') ? price * commissionRate : 0;
    const isBuySide = Math.random() > 0.5;
    
    // For sold properties, ensure we have both original and final prices with realistic reductions
    const finalPrice = status === 'Sold' ? price : (status === 'Under Contract' ? price : 0);
    const listPrice = status === 'Sold' 
      ? price + Math.floor(Math.random() * 50000) + 5000  // List price is 5-55k higher than sale price
      : price + 10000;
    
    const loopId = crypto.randomUUID();

    records.push({
      loopId,
      loopViewUrl: `https://www.dotloop.com/loop/${loopId}/view`,
      loopName: `${streetNum} ${streetName} St, ${city}, TX`,
      loopStatus: status,
      createdDate: formatDate(createdDate),
      closingDate,
      listingDate,
      offerDate,
      address: fullAddress,
      price: finalPrice,
      propertyType: PROPERTY_TYPES[Math.floor(Math.random() * PROPERTY_TYPES.length)],
      bedrooms: Math.floor(Math.random() * 4) + 2,
      bathrooms: Math.floor(Math.random() * 3) + 2,
      squareFootage: Math.floor(Math.random() * 2500) + 1200,
      city,
      state: 'TX',
      county: 'Williamson',
      leadSource: LEAD_SOURCES[Math.floor(Math.random() * LEAD_SOURCES.length)],
      earnestMoney: price * 0.01,
      salePrice: status === 'Sold' ? price : 0,
      commissionRate: 3,
      commissionTotal: totalCommission,
      agents: agent,
      createdBy: agent,
      buySideCommission: isBuySide ? totalCommission : 0,
      sellSideCommission: !isBuySide ? totalCommission : 0,
      companyDollar: totalCommission * 0.2, // 80/20 split
      referralSource: '',
      referralPercentage: 0,
      complianceStatus: status === 'Sold' ? 'Approved' : 'Pending',
      tags: [],
      originalPrice: listPrice,
      yearBuilt: Math.floor(Math.random() * 30) + 1990,
      lotSize: Math.floor(Math.random() * 8000) + 4000,
      subdivision: 'Sample Estates',
      schoolDistrict: 'Sample ISD',
      expirationDate: '',
      transactionType: 'Residential'
    });
  }

  return records;
}
