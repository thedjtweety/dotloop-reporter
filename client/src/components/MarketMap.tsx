import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Layers, Filter, ZoomIn, Save, Bookmark, Trash2 } from 'lucide-react';
import { DotloopRecord } from '@/lib/csvParser';
import { MapView } from '@/components/Map';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { saveFilterPreset, getFilterPresets, deleteFilterPreset, formatPresetDate, FilterPreset } from '@/lib/filterPresets';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

interface MarketMapProps {
  data: DotloopRecord[];
}

interface PropertyMarker {
  id: number;
  lat: number;
  lng: number;
  address: string;
  price: number;
  status: string;
  agent: string;
  closingDate?: string;
  color: string;
}

// State-to-color mapping for markers
const STATUS_COLORS: Record<string, string> = {
  'closed': '#10b981',      // emerald
  'active': '#3b82f6',      // blue
  'contract': '#f59e0b',    // gold
  'archived': '#ef4444',    // red
};

// US state coordinates for demo data
const STATE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'CA': { lat: 36.1162, lng: -119.6816 },
  'TX': { lat: 31.9686, lng: -99.9018 },
  'FL': { lat: 27.9947, lng: -81.7603 },
  'NY': { lat: 42.1657, lng: -74.9481 },
  'PA': { lat: 40.5908, lng: -77.2098 },
  'IL': { lat: 40.3495, lng: -88.9861 },
  'OH': { lat: 40.3888, lng: -82.7649 },
  'GA': { lat: 33.0406, lng: -83.6431 },
  'NC': { lat: 35.6301, lng: -79.8064 },
  'MI': { lat: 43.3266, lng: -84.5361 },
};

// Generate random coordinates within a state for demo data
const generateDemoCoordinates = (state: string, index: number): { lat: number; lng: number } => {
  const center = STATE_COORDINATES[state] || { lat: 39.8283, lng: -98.5795 }; // US center
  const offset = 0.5; // ~30 miles variance
  const lat = center.lat + (Math.random() - 0.5) * offset;
  const lng = center.lng + (Math.random() - 0.5) * offset;
  return { lat, lng };
};

// Parse coordinates from address or generate demo coordinates
const getCoordinates = (record: DotloopRecord, index: number): { lat: number; lng: number } => {
  // If record has explicit coordinates, use them
  if (record.latitude && record.longitude) {
    return { lat: record.latitude, lng: record.longitude };
  }
  
  // Otherwise, generate demo coordinates based on state
  const state = record.state || 'CA';
  return generateDemoCoordinates(state, index);
};

// Get status color for marker
const getStatusColor = (status: string): string => {
  const normalizedStatus = status?.toLowerCase() || 'active';
  for (const [key, color] of Object.entries(STATUS_COLORS)) {
    if (normalizedStatus.includes(key)) {
      return color;
    }
  }
  return '#6b7280'; // gray default
};

export default function MarketMap({ data }: MarketMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<PropertyMarker | null>(null);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [savePresetName, setSavePresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    const loadedPresets = getFilterPresets('map');
    setPresets(loadedPresets);
  }, []);

  // Process property markers
  const propertyMarkers = useMemo(() => {
    return data
      .map((record, index) => {
        const coords = getCoordinates(record, index);
        const status = record.loopStatus || 'Active';
        const color = getStatusColor(status);
        
        return {
          id: index,
          lat: coords.lat,
          lng: coords.lng,
          address: record.address || `Property ${index + 1}`,
          price: record.salePrice || record.price || 0,
          status,
          agent: record.agent || 'Unassigned',
          closingDate: record.closingDate,
          color,
        };
      })
      .filter(marker => {
        // Apply filters
        if (statusFilter && !marker.status.toLowerCase().includes(statusFilter.toLowerCase())) {
          return false;
        }
        if (agentFilter && marker.agent !== agentFilter) {
          return false;
        }
        return true;
      });
  }, [data, statusFilter, agentFilter]);

  // Get unique agents for filter
  const uniqueAgents = useMemo(() => {
    return Array.from(new Set(data.map(r => r.agent || 'Unassigned'))).sort();
  }, [data]);

  // Handle save preset
  const handleSavePreset = () => {
    if (!savePresetName.trim()) {
      toast.error('Preset name is required');
      return;
    }
    const preset = saveFilterPreset(
      savePresetName,
      { statusFilter, agentFilter },
      'map'
    );
    if (preset) {
      setPresets([...presets, preset]);
      setSavePresetName('');
      setShowSaveDialog(false);
      toast.success(`Filter preset "${preset.name}" saved`);
    } else {
      toast.error('Failed to save preset');
    }
  };

  // Handle apply preset
  const handleApplyPreset = (preset: FilterPreset) => {
    setStatusFilter(preset.filters.statusFilter || '');
    setAgentFilter(preset.filters.agentFilter || '');
    toast.success(`Applied preset: ${preset.name}`);
  };

  // Handle delete preset
  const handleDeletePreset = (presetId: string) => {
    if (deleteFilterPreset(presetId, 'map')) {
      setPresets(presets.filter(p => p.id !== presetId));
      toast.success('Preset deleted');
    }
  };

  // Calculate map center and bounds
  const mapCenter = useMemo(() => {
    if (propertyMarkers.length === 0) {
      return { lat: 39.8283, lng: -98.5795 }; // US center
    }
    
    const avgLat = propertyMarkers.reduce((sum, m) => sum + m.lat, 0) / propertyMarkers.length;
    const avgLng = propertyMarkers.reduce((sum, m) => sum + m.lng, 0) / propertyMarkers.length;
    return { lat: avgLat, lng: avgLng };
  }, [propertyMarkers]);

  // Handle map ready
  const handleMapReady = async (map: google.maps.Map) => {
    mapRef.current = map;
    
    // Load visualization library for heatmap
    const script = document.createElement('script');
    script.src = `${import.meta.env.VITE_FRONTEND_FORGE_API_URL || 'https://forge.butterfly-effect.dev'}/v1/maps/proxy/maps/api/js?key=${import.meta.env.VITE_FRONTEND_FORGE_API_KEY}&v=weekly&libraries=visualization`;
    script.async = true;
    script.onload = () => {
      renderMarkers();
    };
    document.head.appendChild(script);
  };

  // Render markers on map
  const renderMarkers = () => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    // Add new markers
    propertyMarkers.forEach(marker => {
      const element = document.createElement('div');
      element.style.width = '32px';
      element.style.height = '32px';
      element.style.backgroundColor = marker.color;
      element.style.borderRadius = '50%';
      element.style.border = '3px solid white';
      element.style.boxShadow = `0 2px 8px rgba(0,0,0,0.3)`;
      element.style.cursor = 'pointer';
      element.style.display = 'flex';
      element.style.alignItems = 'center';
      element.style.justifyContent = 'center';
      element.style.fontSize = '16px';
      element.style.fontWeight = 'bold';
      element.style.color = 'white';
      element.innerHTML = '<span style="text-shadow: 0 1px 2px rgba(0,0,0,0.5);">📍</span>';

      const advancedMarker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: marker.lat, lng: marker.lng },
        content: element,
        title: marker.address,
      });

      // Add click listener for info window
      advancedMarker.addListener('click', () => {
        showPropertyInfo(marker);
      });

      markersRef.current.push(advancedMarker);
    });

    // Update heatmap if visible
    if (showHeatmap) {
      updateHeatmap();
    }

    // Fit bounds to all markers
    fitMapToMarkers();
  };

  // Show property info in info window
  const showPropertyInfo = (marker: PropertyMarker) => {
    if (!mapRef.current) return;

    // Close existing info window
    if (infoWindow) {
      infoWindow.close();
    }

    const statusColor = marker.color;
    const content = `
      <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; max-width: 300px;">
        <div style="margin-bottom: 8px;">
          <strong style="font-size: 14px; color: #1f2937;">${marker.address}</strong>
        </div>
        <div style="margin-bottom: 6px; font-size: 13px;">
          <span style="color: #6b7280;">Price:</span>
          <span style="color: #1f2937; font-weight: 500;">$${(marker.price / 1000000).toFixed(2)}M</span>
        </div>
        <div style="margin-bottom: 6px; font-size: 13px;">
          <span style="color: #6b7280;">Agent:</span>
          <span style="color: #1f2937; font-weight: 500;">${marker.agent}</span>
        </div>
        <div style="margin-bottom: 6px; font-size: 13px;">
          <span style="color: #6b7280;">Status:</span>
          <span style="display: inline-block; padding: 2px 8px; background-color: ${statusColor}20; color: ${statusColor}; border-radius: 4px; font-weight: 500; margin-left: 4px;">${marker.status}</span>
        </div>
        ${marker.closingDate ? `
          <div style="font-size: 13px;">
            <span style="color: #6b7280;">Closing:</span>
            <span style="color: #1f2937; font-weight: 500;">${new Date(marker.closingDate).toLocaleDateString()}</span>
          </div>
        ` : ''}
      </div>
    `;

    const newInfoWindow = new google.maps.InfoWindow({
      content,
      ariaLabel: marker.address,
    });

    newInfoWindow.open({
      anchor: markersRef.current[marker.id],
      map: mapRef.current,
    });

    setInfoWindow(newInfoWindow);
    setSelectedMarker(marker);
  };

  // Update heatmap layer
  const updateHeatmap = () => {
    if (!mapRef.current) return;

    // Remove existing heatmap
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
    }

    // Create heatmap data
    const heatmapData = propertyMarkers.map(marker => ({
      location: new google.maps.LatLng(marker.lat, marker.lng),
      weight: marker.price / 1000000, // Weight by price
    }));

    if (heatmapData.length > 0 && window.google?.maps?.visualization?.HeatmapLayer) {
      heatmapRef.current = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: mapRef.current,
        radius: 30,
        opacity: 0.6,
      });
    }
  };

  // Fit map to show all markers
  const fitMapToMarkers = () => {
    if (!mapRef.current || propertyMarkers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    propertyMarkers.forEach(marker => {
      bounds.extend({ lat: marker.lat, lng: marker.lng });
    });

    mapRef.current.fitBounds(bounds, { padding: 50 });
  };

  // Re-render markers when filters or data change
  useEffect(() => {
    renderMarkers();
  }, [propertyMarkers, showHeatmap]);

  // Handle heatmap toggle
  const handleHeatmapToggle = () => {
    setShowHeatmap(!showHeatmap);
  };

  return (
    <Card className="h-full border-border/50 shadow-lg">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Market Map</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Geographic Deal Distribution</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showHeatmap ? 'default' : 'outline'}
                size="sm"
                onClick={handleHeatmapToggle}
                className="gap-2"
              >
                <Layers className="h-4 w-4" />
                Heat Map
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fitMapToMarkers}
                className="gap-2"
              >
                <ZoomIn className="h-4 w-4" />
                Fit
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="contract">Under Contract</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Agents</SelectItem>
                {uniqueAgents.map(agent => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Save Preset Button */}
            <Popover open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Preset Name</label>
                    <Input
                      placeholder="e.g., Active Listings"
                      value={savePresetName}
                      onChange={(e) => setSavePresetName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    onClick={handleSavePreset}
                    className="w-full"
                    size="sm"
                  >
                    Save Preset
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Presets Dropdown */}
            {presets.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Bookmark className="h-4 w-4" />
                    Presets ({presets.length})
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {presets.map(preset => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 border border-border/50 cursor-pointer"
                        onClick={() => handleApplyPreset(preset)}
                      >
                        <div>
                          <div className="font-medium text-sm">{preset.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatPresetDate(preset.createdAt)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePreset(preset.id);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <span className="text-sm text-muted-foreground ml-auto">
              {propertyMarkers.length} properties
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.closed }} />
              <span className="text-muted-foreground">Closed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.active }} />
              <span className="text-muted-foreground">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.contract }} />
              <span className="text-muted-foreground">Contract</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.archived }} />
              <span className="text-muted-foreground">Archived</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <MapView
          initialCenter={mapCenter}
          initialZoom={4}
          onMapReady={handleMapReady}
          className="w-full h-[500px] rounded-lg border border-border/50"
        />
      </CardContent>
    </Card>
  );
}
