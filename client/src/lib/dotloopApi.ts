/**
 * Dotloop API Client
 * 
 * Utilities for fetching data from Dotloop API and transforming it
 * to our internal DotloopRecord format.
 * 
 * API Documentation: https://dotloop.github.io/public-api/
 */

import { DotloopRecord } from './csvParser';
import { DotloopAccount } from './dotloopAuth';

// Use backend proxy to avoid CORS issues
const DOTLOOP_API_BASE = '/api/dotloop/proxy';

/**
 * Dotloop Loop API Response Types
 */
interface DotloopLoop {
  loopId: number;
  loopName: string;
  loopStatus: string;
  loopUrl: string;
  loopViewId: number;
  transactionType: string;
  streetNumber?: string;
  streetName?: string;
  unit?: string;
  city?: string;
  zipCode?: string;
  state?: string;
  country?: string;
  mlsNumber?: string;
  mlsPropertyType?: string;
  totalSqFt?: number;
  bedrooms?: number;
  bathrooms?: number;
  purchasePrice?: number;
  listPrice?: number;
  contractPrice?: number;
  closePrice?: number;
  listingDate?: string;
  contractDate?: string;
  closingDate?: string;
  created?: string;
  updated?: string;
}

interface DotloopLoopsResponse {
  data: DotloopLoop[];
  meta?: {
    total: number;
    count: number;
  };
}

/**
 * Fetch all loops for a given profile
 */
export async function fetchLoops(account: DotloopAccount): Promise<DotloopLoop[]> {
  try {
    const url = `${DOTLOOP_API_BASE}/profile/${account.profileId}/loop`;
    
    console.log('[Dotloop API] Fetching loops for profile:', account.profileId);
    console.log('[Dotloop API] Access token (first 20 chars):', account.accessToken?.substring(0, 20) + '...');
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${account.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // 404 means no loops found - return empty array
      if (response.status === 404) {
        console.log('[Dotloop API] No loops found (404), returning empty array');
        return [];
      }
      
      const errorText = await response.text();
      console.error('[Dotloop API] Fetch failed:', response.status, errorText);
      throw new Error(`Failed to fetch loops: ${response.status} ${errorText}`);
    }

    const data: DotloopLoopsResponse = await response.json();
    console.log('[Dotloop API] Fetched', data.data?.length || 0, 'loops');
    
    return data.data || [];
  } catch (error) {
    console.error('[Dotloop API] Error fetching loops:', error);
    throw error;
  }
}

/**
 * Transform Dotloop loop to DotloopRecord format
 */
export function transformLoopToRecord(loop: DotloopLoop): DotloopRecord {
  // Build full address
  const addressParts = [
    loop.streetNumber,
    loop.streetName,
    loop.unit,
  ].filter(Boolean);
  const propertyAddress = addressParts.join(' ');

  // Determine price based on transaction type and available data
  let price = loop.closePrice || loop.contractPrice || loop.listPrice || loop.purchasePrice || 0;
  let salePrice = loop.closePrice || loop.contractPrice || 0;

  // Calculate commission (assume 3% default rate)
  const commissionRate = 0.03;
  const commission = salePrice > 0 ? salePrice * commissionRate : 0;

  return {
    loopId: loop.loopId.toString(),
    loopName: loop.loopName,
    loopStatus: loop.loopStatus,
    loopViewUrl: loop.loopUrl,
    loopViewId: loop.loopViewId?.toString() || '',
    transactionType: loop.transactionType || 'Unknown',
    
    // Property details
    propertyAddress,
    address: propertyAddress, // Duplicate for compatibility
    streetNumber: loop.streetNumber || '',
    streetName: loop.streetName || '',
    unit: loop.unit || '',
    city: loop.city || '',
    state: loop.state || '',
    zipCode: loop.zipCode || '',
    county: '',
    country: loop.country || 'US',
    
    // MLS data
    mlsNumber: loop.mlsNumber || '',
    mlsPropertyType: loop.mlsPropertyType || '',
    
    // Property specs
    totalSqFt: loop.totalSqFt || 0,
    bedrooms: loop.bedrooms || 0,
    bathrooms: loop.bathrooms || 0,
    
    // Pricing
    price,
    salePrice,
    listPrice: loop.listPrice || 0,
    purchasePrice: loop.purchasePrice || 0,
    contractPrice: loop.contractPrice || 0,
    closePrice: loop.closePrice || 0,
    
    // Dates
    listingDate: loop.listingDate || '',
    contractDate: loop.contractDate || '',
    closingDate: loop.closingDate || '',
    offerDate: '',
    createdDate: loop.created || '',
    updatedDate: loop.updated || '',
    
    // Commission (calculated)
    commission,
    commissionRate,
    
    // Agent info (will be empty from API, needs to be enriched separately)
    agentName: '',
    agentEmail: '',
    teamName: '',
    officeName: '',
    
    // Lead source (not available from API)
    leadSource: '',
    
    // Additional CSV fields not in API
    propertyType: loop.transactionType || 'Unknown',
    squareFootage: loop.totalSqFt || 0,
    earnestMoney: 0,
    commissionTotal: commission,
    agents: '',
    createdBy: '',
    buySideCommission: 0,
    sellSideCommission: 0,
    companyDollar: 0,
    referralSource: '',
    referralPercentage: 0,
    complianceStatus: '',
    originalPrice: loop.listPrice || 0,
    yearBuilt: 0,
    lotSize: 0,
    subdivision: '',
    
    // Additional fields
    tags: [],
    notes: '',
  };
}

/**
 * Fetch and transform all loops for an account
 */
export async function fetchAndTransformLoops(account: DotloopAccount): Promise<DotloopRecord[]> {
  const loops = await fetchLoops(account);
  return loops.map(transformLoopToRecord);
}

/**
 * Fetch account profile information
 */
export async function fetchAccountProfile(accessToken: string) {
  try {
    const url = `${DOTLOOP_API_BASE}/account`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch account profile: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Dotloop API] Error fetching account profile:', error);
    throw error;
  }
}
