/**
 * Geocoding Utilities for Property Addresses
 * Converts addresses to lat/lng coordinates using Google Maps Geocoder
 */

import { DotloopRecord } from './csvParser';

// Cache for geocoded addresses to avoid repeated API calls
const geocodeCache = new Map<string, google.maps.LatLngLiteral>();

/**
 * Geocode a single address to coordinates
 */
export async function geocodeAddress(
  address: string,
  geocoder: google.maps.Geocoder
): Promise<google.maps.LatLngLiteral | null> {
  // Check cache first
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address)!;
  }

  try {
    const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results) {
          resolve(results);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });

    if (results && results[0]) {
      const location = results[0].geometry.location;
      const coords = { lat: location.lat(), lng: location.lng() };
      geocodeCache.set(address, coords);
      return coords;
    }
  } catch (error) {
    console.error(`Failed to geocode address "${address}":`, error);
  }

  return null;
}

/**
 * Geocode multiple addresses in batch
 * Uses a delay between requests to avoid rate limiting
 */
export async function geocodeAddressesBatch(
  addresses: string[],
  geocoder: google.maps.Geocoder,
  delayMs: number = 100
): Promise<Map<string, google.maps.LatLngLiteral>> {
  const results = new Map<string, google.maps.LatLngLiteral>();

  for (const address of addresses) {
    if (!address) continue;

    const coords = await geocodeAddress(address, geocoder);
    if (coords) {
      results.set(address, coords);
    }

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  return results;
}

/**
 * Geocode properties and return enhanced records with coordinates
 */
export async function geocodeProperties(
  properties: DotloopRecord[],
  geocoder: google.maps.Geocoder
): Promise<Array<DotloopRecord & { lat: number; lng: number }>> {
  const geocodedProperties: Array<DotloopRecord & { lat: number; lng: number }> = [];

  for (const property of properties) {
    if (!property.address) continue;

    const coords = await geocodeAddress(property.address, geocoder);
    if (coords) {
      geocodedProperties.push({
        ...property,
        lat: coords.lat,
        lng: coords.lng,
      });
    }

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return geocodedProperties;
}

/**
 * Calculate the center point of multiple coordinates
 */
export function calculateCenter(
  coords: google.maps.LatLngLiteral[]
): google.maps.LatLngLiteral {
  if (coords.length === 0) {
    return { lat: 37.7749, lng: -122.4194 }; // Default to San Francisco
  }

  const sum = coords.reduce(
    (acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / coords.length,
    lng: sum.lng / coords.length,
  };
}

/**
 * Convert properties to heatmap data points
 */
export function propertiesToHeatmapData(
  properties: Array<DotloopRecord & { lat: number; lng: number }>
): google.maps.visualization.WeightedLocation[] {
  return properties.map(property => ({
    location: new google.maps.LatLng(property.lat, property.lng),
    weight: property.price ? Math.min(property.price / 100000, 10) : 1, // Weight by price
  }));
}

/**
 * Clear the geocoding cache
 */
export function clearGeocodeCache(): void {
  geocodeCache.clear();
}

/**
 * Get cache statistics
 */
export function getGeocodeStats(): { cached: number; size: number } {
  return {
    cached: geocodeCache.size,
    size: new Blob([JSON.stringify(Array.from(geocodeCache.entries()))]).size,
  };
}
