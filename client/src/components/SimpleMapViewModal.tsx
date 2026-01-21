import { MapView } from './Map';
import { useRef, useEffect, useState } from 'react';
import { DotloopRecord } from '@/lib/csvParser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface SimpleMapViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  transactions?: DotloopRecord[];
}

type TransactionStatus = 'all' | 'active' | 'contract' | 'closed' | 'archived';

export default function SimpleMapViewModal({
  isOpen,
  onClose,
  title = 'Map View',
  transactions = []
}: SimpleMapViewModalProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const clustererRef = useRef<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter transactions by status and search query
  const filteredTransactions = transactions.filter(t => {
    // Status filter
    if (selectedStatus !== 'all') {
      const status = (t.loopStatus || '').toLowerCase();
      let statusMatch = false;
      switch (selectedStatus) {
        case 'active':
          statusMatch = status.includes('active');
          break;
        case 'contract':
          statusMatch = status.includes('contract') || status.includes('pending');
          break;
        case 'closed':
          statusMatch = status.includes('closed') || status.includes('sold');
          break;
        case 'archived':
          statusMatch = status.includes('archived');
          break;
      }
      if (!statusMatch) return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const address = ((t.address || '') + ' ' + (t.city || '') + ' ' + (t.state || '')).toLowerCase();
      const agent = (t.agent || '').toLowerCase();
      const loopName = (t.loopName || '').toLowerCase();
      
      return address.includes(query) || agent.includes(query) || loopName.includes(query);
    }

    return true;
  });

  // Get marker color based on status
  const getMarkerColor = (status: string): string => {
    const s = (status || '').toLowerCase();
    if (s.includes('active')) return '#10b981'; // emerald
    if (s.includes('contract') || s.includes('pending')) return '#f59e0b'; // amber
    if (s.includes('closed') || s.includes('sold')) return '#3b82f6'; // blue
    if (s.includes('archived')) return '#6b7280'; // gray
    return '#1e3a5f'; // slate
  };

  // Parse coordinates from address or generate random within state bounds
  const getCoordinatesForTransaction = (transaction: DotloopRecord): { lat: number; lng: number } | null => {
    // If transaction has pre-generated coordinates, use them
    if ((transaction as any).latitude && (transaction as any).longitude) {
      return {
        lat: (transaction as any).latitude,
        lng: (transaction as any).longitude
      };
    }

    // State bounds for approximate locations
    const stateBounds: Record<string, { lat: [number, number]; lng: [number, number] }> = {
      'TX': { lat: [25.8, 36.5], lng: [-106.6, -93.5] },
      'CA': { lat: [32.5, 42.0], lng: [-124.4, -114.1] },
      'FL': { lat: [24.5, 30.5], lng: [-87.6, -80.0] },
      'NY': { lat: [40.5, 45.0], lng: [-79.8, -71.9] },
      'PA': { lat: [39.7, 42.3], lng: [-80.5, -74.7] },
      'IL': { lat: [37.0, 42.5], lng: [-91.5, -87.0] },
      'OH': { lat: [38.4, 42.3], lng: [-84.8, -80.3] },
      'GA': { lat: [30.4, 35.0], lng: [-85.6, -80.8] },
      'NC': { lat: [33.8, 36.6], lng: [-84.3, -75.4] },
    };

    const state = transaction.state || 'TX';
    const bounds = stateBounds[state] || stateBounds['TX'];

    // Generate random coordinates within state bounds
    const lat = bounds.lat[0] + Math.random() * (bounds.lat[1] - bounds.lat[0]);
    const lng = bounds.lng[0] + Math.random() * (bounds.lng[1] - bounds.lng[0]);

    return { lat, lng };
  };

  // Add markers to map
  const addMarkers = async (map: google.maps.Map) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clear clusterer if it exists
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    if (filteredTransactions.length === 0) return;

    // Create markers
    const markers: google.maps.marker.AdvancedMarkerElement[] = [];
    const bounds = new google.maps.LatLngBounds();

    for (const transaction of filteredTransactions) {
      const coords = getCoordinatesForTransaction(transaction);
      if (!coords) continue;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: coords,
        title: transaction.loopName || transaction.address || 'Property',
      });

      // Create custom SVG for marker with color
      const color = getMarkerColor(transaction.loopStatus);
      const svg = `
        <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C9.4 0 4 5.4 4 12c0 8 12 28 12 28s12-20 12-28c0-6.6-5.4-12-12-12z" fill="${color}" stroke="white" stroke-width="2"/>
          <circle cx="16" cy="12" r="4" fill="white"/>
        </svg>
      `;

      const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);

      marker.content = new Image();
      (marker.content as HTMLImageElement).src = svgUrl;
      (marker.content as HTMLImageElement).style.width = '32px';
      (marker.content as HTMLImageElement).style.height = '40px';

      // Add click listener to show transaction details
      marker.addEventListener('click', () => {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; font-size: 12px; max-width: 200px;">
              <strong>${transaction.loopName || 'Property'}</strong><br/>
              ${transaction.address || ''}<br/>
              <strong>Status:</strong> ${transaction.loopStatus || 'Unknown'}<br/>
              <strong>Price:</strong> $${(transaction.salePrice || transaction.price || 0).toLocaleString()}<br/>
              <strong>Commission:</strong> $${(transaction.commissionTotal || 0).toLocaleString()}
            </div>
          `,
        });
        infoWindow.open(map, marker);
      });

      markers.push(marker);
      bounds.extend(coords);
    }

    markersRef.current = markers;

    // Marker clustering is handled by Google Maps automatically when many markers are present

    // Fit map to bounds
    if (markers.length > 0) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  };

  useEffect(() => {
    if (isOpen && mapRef.current) {
      addMarkers(mapRef.current);
    }
  }, [isOpen, filteredTransactions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="w-screen h-screen bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-sm text-slate-400 mt-1">{filteredTransactions.length} properties shown</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by address, agent name, or loop name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-600 rounded"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="px-6 py-4 border-b border-slate-700 bg-slate-800 flex gap-2 flex-wrap">
          <Button
            onClick={() => setSelectedStatus('all')}
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
          >
            All ({transactions.length})
          </Button>
          <Button
            onClick={() => setSelectedStatus('active')}
            variant={selectedStatus === 'active' ? 'default' : 'outline'}
            size="sm"
            className="gap-2 border-emerald-600"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Active ({transactions.filter(t => t.loopStatus?.toLowerCase().includes('active')).length})
          </Button>
          <Button
            onClick={() => setSelectedStatus('contract')}
            variant={selectedStatus === 'contract' ? 'default' : 'outline'}
            size="sm"
            className="gap-2 border-amber-600"
          >
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            Under Contract ({transactions.filter(t => (t.loopStatus?.toLowerCase().includes('contract') || t.loopStatus?.toLowerCase().includes('pending'))).length})
          </Button>
          <Button
            onClick={() => setSelectedStatus('closed')}
            variant={selectedStatus === 'closed' ? 'default' : 'outline'}
            size="sm"
            className="gap-2 border-blue-600"
          >
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Closed ({transactions.filter(t => (t.loopStatus?.toLowerCase().includes('closed') || t.loopStatus?.toLowerCase().includes('sold'))).length})
          </Button>
          <Button
            onClick={() => setSelectedStatus('archived')}
            variant={selectedStatus === 'archived' ? 'default' : 'outline'}
            size="sm"
            className="gap-2 border-gray-600"
          >
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            Archived ({transactions.filter(t => t.loopStatus?.toLowerCase().includes('archived')).length})
          </Button>
        </div>

        {/* Map Container */}
        <div className="flex-1 overflow-hidden">
          <MapView
            initialCenter={{ lat: 32.7767, lng: -96.7970 }} // Default to Dallas, TX
            initialZoom={4}
            className="w-full h-full"
            onMapReady={(map) => {
              mapRef.current = map;
              addMarkers(map);
            }}
          />
        </div>
      </div>
    </div>
  );
}
