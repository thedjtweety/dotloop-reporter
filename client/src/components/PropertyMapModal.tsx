/**
 * Property Map Modal Component
 * Full-screen map view showing property locations with clickable pins
 * Integrates with Google Maps API for geocoding and visualization
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Phone, DollarSign, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapView } from '@/components/Map';
import { formatCurrency } from '@/lib/formatUtils';
import { DotloopRecord } from '@/lib/csvParser';

interface PropertyMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: DotloopRecord[];
  title: string;
}

interface PropertyPin {
  id: string;
  address: string;
  lat: number;
  lng: number;
  transaction: DotloopRecord;
  marker?: google.maps.marker.AdvancedMarkerElement;
}

export default function PropertyMapModal({
  isOpen,
  onClose,
  transactions,
  title,
}: PropertyMapModalProps) {
  const [pins, setPins] = useState<PropertyPin[]>([]);
  const [selectedPin, setSelectedPin] = useState<PropertyPin | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  // Calculate center point for all properties
  const calculateCenter = (properties: PropertyPin[]) => {
    if (properties.length === 0) return { lat: 40, lng: -95 };
    
    const avgLat = properties.reduce((sum, p) => sum + p.lat, 0) / properties.length;
    const avgLng = properties.reduce((sum, p) => sum + p.lng, 0) / properties.length;
    
    return { lat: avgLat, lng: avgLng };
  };

  // Wait for Google Maps API and geocode addresses
  useEffect(() => {
    if (!isOpen || transactions.length === 0) return;

    const geocodeProp = async () => {
      // Wait for Google Maps API to be available
      let attempts = 0;
      while (!window.google && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.google) {
        console.error('Google Maps API failed to load');
        setMapLoading(false);
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      const newPins: PropertyPin[] = [];

      for (const transaction of transactions) {
        if (!transaction.address) continue;

        try {
          const result = await new Promise<google.maps.GeocoderResult | null>((resolve) => {
            geocoder.geocode({ address: transaction.address }, (results, status) => {
              if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
                resolve(results[0]);
              } else {
                resolve(null);
              }
            });
          });

          if (result?.geometry?.location) {
            newPins.push({
              id: transaction.address || Math.random().toString(),
              address: transaction.address,
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
              transaction,
            });
          }
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      }

      setPins(newPins);
      setMapLoading(false);
    };

    geocodeProp();
  }, [isOpen, transactions]);

  // Create markers on map
  useEffect(() => {
    if (!mapRef.current || pins.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove?.());
    markersRef.current.clear();

    // Create new markers
    pins.forEach((pin) => {
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: pin.lat, lng: pin.lng },
        title: pin.address,
      });

      marker.addListener('click', () => {
        setSelectedPin(pin);
      });

      markersRef.current.set(pin.id, marker);
    });

    // Fit bounds to all markers
    if (pins.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      pins.forEach(pin => {
        bounds.extend({ lat: pin.lat, lng: pin.lng });
      });
      mapRef.current.fitBounds(bounds, { padding: 100 });
    }
  }, [pins]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-0">
      {/* Modal Container - Full screen */}
      <div className="w-screen h-screen max-w-none bg-slate-900 rounded-none flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-display font-semibold text-white">{title}</h2>
            <p className="text-sm text-slate-400 mt-1">
              {pins.length} properties mapped
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex gap-4 px-6 py-4">
          {/* Map */}
          <div className="flex-1 rounded-lg overflow-hidden border border-slate-700">
            {mapLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-800">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div>
                  <p className="text-slate-400">Loading map...</p>
                </div>
              </div>
            ) : (
              <MapView
                initialCenter={calculateCenter(pins)}
                initialZoom={pins.length > 1 ? 10 : 15}
                onMapReady={(map) => {
                  mapRef.current = map;
                }}
              />
            )}
          </div>

          {/* Property Details Sidebar */}
          <div className="w-80 flex flex-col gap-4">
            {/* Property List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <h3 className="font-semibold text-white text-sm mb-3">Properties ({pins.length})</h3>
              {pins.map((pin) => (
                <button
                  key={pin.id}
                  onClick={() => setSelectedPin(pin)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedPin?.id === pin.id
                      ? 'bg-emerald-600/20 border border-emerald-600/50'
                      : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <p className="text-sm font-medium text-white truncate">{pin.address}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatCurrency(pin.transaction.salePrice || pin.transaction.price || 0)}
                  </p>
                </button>
              ))}
            </div>

            {/* Selected Property Details */}
            {selectedPin && (
              <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-slate-800 border-emerald-500/20">
                <h4 className="font-semibold text-white mb-3 text-sm">Property Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-400">Address</p>
                      <p className="text-white font-medium">{selectedPin.address}</p>
                    </div>
                  </div>

                  {selectedPin.transaction.salePrice && (
                    <div className="flex items-start gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-slate-400">Sale Price</p>
                        <p className="text-white font-medium">
                          {formatCurrency(selectedPin.transaction.salePrice)}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedPin.transaction.agents && (
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-slate-400">Agent</p>
                        <p className="text-white font-medium">{selectedPin.transaction.agents}</p>
                      </div>
                    </div>
                  )}

                  {selectedPin.transaction.closingDate && (
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-slate-400">Closing Date</p>
                        <p className="text-white font-medium">
                          {new Date(selectedPin.transaction.closingDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedPin.transaction.loopStatus && (
                    <div>
                      <p className="text-slate-400 mb-1">Status</p>
                      <p className="text-white font-medium">{selectedPin.transaction.loopStatus}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-700 bg-slate-800 flex items-center justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
