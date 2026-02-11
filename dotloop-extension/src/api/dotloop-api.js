/**
 * Dotloop API Client
 * Fetches loops and transaction data from Dotloop API
 */

const API_BASE_URL = 'https://api.dotloop.com/v1';

/**
 * Fetch all loops for the authenticated user
 */
export async function fetchAllLoops(accessToken) {
  console.log('[Dotloop Extension] Fetching loops from API...');

  const loops = [];
  let page = 1;
  const pageSize = 100;

  try {
    while (true) {
      const url = `${API_BASE_URL}/loops?page=${page}&pageSize=${pageSize}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Token may have expired.');
        }
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        break; // No more pages
      }

      loops.push(...data.data);
      console.log(`[Dotloop Extension] Fetched ${loops.length} loops so far...`);

      if (!data.pagination || !data.pagination.hasNextPage) {
        break;
      }

      page++;
    }

    console.log(`[Dotloop Extension] Total loops fetched: ${loops.length}`);
    return loops;
  } catch (error) {
    console.error('[Dotloop Extension] Error fetching loops:', error);
    throw error;
  }
}

/**
 * Fetch details for a specific loop
 */
export async function fetchLoopDetails(accessToken, loopId) {
  const url = `${API_BASE_URL}/loops/${loopId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch loop details: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetch participants (agents) for a loop
 */
export async function fetchLoopParticipants(accessToken, loopId) {
  const url = `${API_BASE_URL}/loops/${loopId}/participants`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    return []; // Return empty array if no participants
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Transform Dotloop loops into transaction format
 */
export function transformLoopsToTransactions(loops) {
  console.log('[Dotloop Extension] Transforming loops to transactions...');

  return loops.map((loop) => {
    // Extract transaction details from loop custom fields
    const customFields = loop.customFields || {};

    return {
      loopId: loop.id,
      loopName: loop.name || 'Unknown',
      loopStatus: loop.status || 'Unknown',
      transactionType: customFields.transactionType || 'Unknown',
      price: parseFloat(customFields.listPrice) || 0,
      salePrice: parseFloat(customFields.salePrice) || 0,
      closingDate: customFields.closingDate || '',
      listingDate: customFields.listingDate || '',
      address: customFields.address || '',
      city: customFields.city || '',
      state: customFields.state || '',
      zip: customFields.zip || '',
      leadSource: customFields.leadSource || 'Unknown',
      saleCommissionRate: parseFloat(customFields.saleCommissionRate) || 0,
      saleCommissionTotal: parseFloat(customFields.saleCommissionTotal) || 0,
      buyCommissionRate: parseFloat(customFields.buyCommissionRate) || 0,
      buyCommissionTotal: parseFloat(customFields.buyCommissionTotal) || 0,
      propertyType: customFields.propertyType || 'Unknown',
      bedrooms: parseInt(customFields.bedrooms) || 0,
      bathrooms: parseInt(customFields.bathrooms) || 0,
      squareFootage: parseInt(customFields.squareFootage) || 0,
      yearBuilt: parseInt(customFields.yearBuilt) || 0,
      agent: customFields.agent || 'Unknown',
      createdDate: loop.createdAt || new Date().toISOString(),
      updatedDate: loop.updatedAt || new Date().toISOString(),
    };
  });
}

/**
 * Fetch all transaction data from Dotloop
 */
export async function fetchAllTransactions(accessToken) {
  try {
    const loops = await fetchAllLoops(accessToken);
    const transactions = transformLoopsToTransactions(loops);
    return transactions;
  } catch (error) {
    console.error('[Dotloop Extension] Error fetching transactions:', error);
    throw error;
  }
}
