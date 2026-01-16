/**
 * PropertyDetailCard Component
 * Displays detailed information about a selected property with action buttons
 */

import { DotloopRecord } from '@/lib/csvParser';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, Copy, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/formatUtils';
import { useState } from 'react';

interface PropertyDetailCardProps {
  property: (DotloopRecord & { lat: number; lng: number }) | null;
  onClose: () => void;
  onCompare?: (property: DotloopRecord & { lat: number; lng: number }) => void;
}

export default function PropertyDetailCard({ property, onClose, onCompare }: PropertyDetailCardProps) {
  const [copied, setCopied] = useState(false);

  if (!property) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(property.address || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const calculateDaysOnMarket = () => {
    if (!property.listDate) return 'N/A';
    const listDate = new Date(property.listDate);
    const today = new Date();
    const days = Math.floor((today.getTime() - listDate.getTime()) / (1000 * 60 * 60 * 24));
    return days >= 0 ? days : 'N/A';
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const lower = status.toLowerCase();
    if (lower.includes('sold') || lower.includes('closed')) return 'bg-green-100 text-green-800';
    if (lower.includes('active')) return 'bg-blue-100 text-blue-800';
    if (lower.includes('pending') || lower.includes('contract')) return 'bg-yellow-100 text-yellow-800';
    if (lower.includes('archived')) return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="absolute bottom-6 left-6 w-80 shadow-2xl border-border bg-card z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="p-4 border-b border-border flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-sm">
            {property.address || 'Property Details'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {property.city}, {property.state} {property.zip}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 p-1 hover:bg-muted rounded transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded p-2">
            <p className="text-xs text-muted-foreground font-medium">Price</p>
            <p className="font-semibold text-sm text-foreground">
              {formatCurrency(property.price || 0)}
            </p>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <p className="text-xs text-muted-foreground font-medium">Days on Market</p>
            <p className="font-semibold text-sm text-foreground">
              {calculateDaysOnMarket()}
            </p>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <p className="text-xs text-muted-foreground font-medium">Year Built</p>
            <p className="font-semibold text-sm text-foreground">
              {property.yearBuilt || 'N/A'}
            </p>
          </div>
          <div className="bg-muted/50 rounded p-2">
            <p className="text-xs text-muted-foreground font-medium">Sq Ft</p>
            <p className="font-semibold text-sm text-foreground">
              {property.sqft ? property.sqft.toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Status</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(property.loopStatus)}`}>
            {property.loopStatus || 'Unknown'}
          </span>
        </div>

        {/* Agent Info */}
        {property.agent && (
          <div className="bg-muted/30 rounded p-2 border border-border/50">
            <p className="text-xs text-muted-foreground font-medium">Agent</p>
            <p className="text-sm text-foreground font-medium">{property.agent}</p>
          </div>
        )}

        {/* Commission Info */}
        {(property.buySideCommission || property.sellSideCommission) && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {property.buySideCommission && (
              <div className="bg-muted/50 rounded p-2">
                <p className="text-muted-foreground font-medium">Buy Commission</p>
                <p className="font-semibold text-foreground">{formatCurrency(property.buySideCommission)}</p>
              </div>
            )}
            {property.sellSideCommission && (
              <div className="bg-muted/50 rounded p-2">
                <p className="text-muted-foreground font-medium">Sell Commission</p>
                <p className="font-semibold text-foreground">{formatCurrency(property.sellSideCommission)}</p>
              </div>
            )}
          </div>
        )}

        {/* Coordinates */}
        <div className="bg-muted/50 rounded p-2 text-xs">
          <p className="text-muted-foreground font-medium mb-1">Coordinates</p>
          <p className="font-mono text-foreground/70">
            {property.lat.toFixed(4)}, {property.lng.toFixed(4)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAddress}
            className="flex-1 h-8 text-xs"
          >
            <Copy className="w-3 h-3 mr-1" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          {onCompare && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCompare(property)}
              className="flex-1 h-8 text-xs"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Compare
            </Button>
          )}
        </div>

        {/* External Link */}
        <Button
          variant="default"
          size="sm"
          className="w-full h-8 text-xs"
          onClick={() => {
            // Placeholder for Dotloop link
            window.open(`https://dotloop.com/search?q=${encodeURIComponent(property.address || '')}`, '_blank');
          }}
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          View in Dotloop
        </Button>
      </div>
    </Card>
  );
}
