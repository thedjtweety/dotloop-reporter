/**
 * PropertyMapView Component
 * Interactive map visualization of properties with markers and heatmap layer
 */

import { useEffect, useRef, useState } from 'react';
import { MapView } from './Map';
import { DotloopRecord } from '@/lib/csvParser';
import { geocodeProperties, calculateCenter, propertiesToHeatmapData } from '@/lib/geocodingUtils';
import { getCityCoordinates } from '@/lib/sampleData';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Layers, MapPin, Pen, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatUtils';
import PropertyDetailCard from './PropertyDetailCard';

interface PropertyMapViewProps {
  data: DotloopRecord[];
  title?: string;
}

type MapLayerType = 'markers' | 'heatmap' | 'both';

export default function PropertyMapView({ data, title = 'Property Locations' }: PropertyMapViewProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [geocodedProperties, setGeocodedProperties] = useState<Array<DotloopRecord & { lat: number; lng: number }>>([]);
  const [selectedProperty, setSelectedProperty] = useState<DotloopRecord & { lat: number; lng: number } | null>(null);
  const [layerType, setLayerType] = useState<MapLayerType>('both');
  const [geocodeProgress, setGeocodeProgress] = useState(0);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [drawingMode, setDrawingMode] = useState<google.maps.drawing.OverlayType | null>(null);
  const drawnShapesRef = useRef<any[]>([]);

  // Initialize map and geocoder
  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
  };

  // Handle drawing manager ready
  const handleDrawingReady = (manager: google.maps.drawing.DrawingManager) => {
    setDrawingManager(manager);
    
    // Listen for completed drawings
    manager.addListener('overlaycomplete', (event: any) => {
      drawnShapesRef.current.push(event);
      manager.setDrawingMode(null);
    });
  };

  const toggleDrawingMode = (mode: string) => {
    if (drawingManager) {
      if (drawingMode === mode) {
        drawingManager.setDrawingMode(null);
        setDrawingMode(null);
      } else {
        drawingManager.setDrawingMode(mode as any);
        setDrawingMode(mode as any);
      }
    }
  };

  const clearDrawings = () => {
    drawnShapesRef.current.forEach((event: any) => {
      if (event.overlay) {
        event.overlay.setMap(null);
      }
    });
    drawnShapesRef.current = [];
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
      setDrawingMode(null);
    }
  };

  // Geocode properties on mount
  useEffect(() => {
    if (!geocoderRef.current || data.length === 0) {
      setIsLoading(false);
      return;
    }

    const geocodeAsync = async () => {
      try {
        setIsLoading(true);
        const properties: Array<DotloopRecord & { lat: number; lng: number }> = [];

        for (let i = 0; i < data.length; i++) {
          const property = data[i];
          if (!property.address) continue;

          try {
            const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
              geocoderRef.current!.geocode({ address: property.address }, (results, status) => {
                if (status === 'OK' && results) {
                  resolve(results);
                } else {
                  reject(new Error(`Geocoding failed: ${status}`));
                }
              });
            });

            if (results && results[0]) {
              const location = results[0].geometry.location;
              properties.push({
                ...property,
                lat: location.lat(),
                lng: location.lng(),
              });
            }
          } catch (error) {
            console.error(`Failed to geocode "${property.address}":`, error);
            // Fallback: use city coordinates with slight variation for demo mode
            if (property.city) {
              const cityCoords = getCityCoordinates(property.city);
              // Add slight random variation so properties don't all appear at exact same point
              const variation = 0.02; // ~2km variation
              properties.push({
                ...property,
                lat: cityCoords.lat + (Math.random() - 0.5) * variation,
                lng: cityCoords.lng + (Math.random() - 0.5) * variation,
              });
            }
          }

          // Update progress
          setGeocodeProgress(Math.round(((i + 1) / data.length) * 100));

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        setGeocodedProperties(properties);

        // Center map on properties
        if (properties.length > 0 && mapRef.current) {
          const center = calculateCenter(properties.map(p => ({ lat: p.lat, lng: p.lng })));
          mapRef.current.setCenter(center);
          mapRef.current.setZoom(properties.length > 1 ? 12 : 15);
        }
      } catch (error) {
        console.error('Error geocoding properties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    geocodeAsync();
  }, [data]);

  // Add markers to map
  useEffect(() => {
    if (!mapRef.current || geocodedProperties.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    // Add new markers if markers layer is enabled
    if (layerType === 'markers' || layerType === 'both') {
      geocodedProperties.forEach(property => {
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current,
          position: { lat: property.lat, lng: property.lng },
          title: property.address || 'Property',
        });

        // Add click listener to show property details
        marker.addEventListener('click', () => {
          setSelectedProperty(property);
        });

        markersRef.current.push(marker);
      });
    }
  }, [geocodedProperties, layerType]);

  // Add heatmap layer
  useEffect(() => {
    if (!mapRef.current || geocodedProperties.length === 0) return;

    // Remove existing heatmap
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
    }

    // Add heatmap if heatmap layer is enabled
    if (layerType === 'heatmap' || layerType === 'both') {
      const heatmapData = geocodedProperties.map(property => ({
        location: new google.maps.LatLng(property.lat, property.lng),
        weight: property.price ? Math.min(property.price / 100000, 10) : 1,
      }));

      heatmapRef.current = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: mapRef.current,
        radius: 50,
        opacity: 0.6,
      });
    }
  }, [geocodedProperties, layerType]);

  if (isLoading && geocodedProperties.length === 0) {
    return (
      <div className="h-full w-full flex flex-col bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">
              Geocoding properties... {geocodeProgress}%
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-6 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <div className="flex gap-2">
            <Button
              variant={layerType === 'markers' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayerType('markers')}
              title="Show Markers"
            >
              <MapPin className="w-4 h-4" />
            </Button>
            <Button
              variant={layerType === 'heatmap' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayerType('heatmap')}
              title="Show Heatmap"
            >
              <Layers className="w-4 h-4" />
            </Button>
            <Button
              variant={layerType === 'both' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayerType('both')}
              title="Show Both"
            >
              <div className="flex gap-1">
                <MapPin className="w-3 h-3" />
                <Layers className="w-3 h-3" />
              </div>
            </Button>
          </div>
        </div>
        
        {/* Drawing Tools */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={drawingMode === 'polygon' ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleDrawingMode('polygon')}
            title="Draw Polygon"
            className="text-xs"
          >
            <Pen className="w-3 h-3 mr-1" />
            Polygon
          </Button>
          <Button
            variant={drawingMode === 'circle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleDrawingMode('circle')}
            title="Draw Circle"
            className="text-xs"
          >
            <Pen className="w-3 h-3 mr-1" />
            Circle
          </Button>
          <Button
            variant={drawingMode === 'rectangle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleDrawingMode('rectangle')}
            title="Draw Rectangle"
            className="text-xs"
          >
            <Pen className="w-3 h-3 mr-1" />
            Rectangle
          </Button>
          {drawnShapesRef.current.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={clearDrawings}
              title="Clear Drawings"
              className="text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 w-full relative">
        <MapView
          className="w-full h-full"
          initialCenter={geocodedProperties.length > 0 ? { lat: geocodedProperties[0].lat, lng: geocodedProperties[0].lng } : undefined}
          initialZoom={12}
          onMapReady={handleMapReady}
          enableDrawing={true}
          onDrawingReady={handleDrawingReady}
        />
        
        {/* Property Detail Card */}
        <PropertyDetailCard
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      </div>


    </div>
  );
}
