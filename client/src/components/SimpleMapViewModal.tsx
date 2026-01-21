import { X } from 'lucide-react';
import { MapView } from './Map';
import { useRef, useEffect } from 'react';

interface SimpleMapViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function SimpleMapViewModal({
  isOpen,
  onClose,
  title = 'Map View'
}: SimpleMapViewModalProps) {
  const mapRef = useRef<google.maps.Map | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="w-screen h-screen bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-800">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 overflow-hidden">
          <MapView
            initialCenter={{ lat: 32.7767, lng: -96.7970 }} // Default to Dallas, TX
            initialZoom={4}
            className="w-full h-full"
            onMapReady={(map) => {
              mapRef.current = map;
            }}
          />
        </div>
      </div>
    </div>
  );
}
