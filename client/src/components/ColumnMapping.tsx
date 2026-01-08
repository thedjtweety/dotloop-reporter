import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Check, AlertCircle } from 'lucide-react';
import { inferColumnType } from '@/lib/dataCleaning';

// Define the required fields for our application
export const REQUIRED_FIELDS = [
  { key: 'agentName', label: 'Agent Name', required: true, type: 'text' },
  { key: 'address', label: 'Property Address', required: true, type: 'text' },
  { key: 'price', label: 'Sales Price', required: true, type: 'currency' },
  { key: 'closingDate', label: 'Closing Date', required: true, type: 'date' },
  { key: 'status', label: 'Status', required: true, type: 'text' },
  { key: 'commission', label: 'Total Commission', required: false, type: 'currency' },
  { key: 'buyCommission', label: 'Buy Side Commission', required: false, type: 'currency' },
  { key: 'sellCommission', label: 'Sell Side Commission', required: false, type: 'currency' },
  { key: 'companyDollar', label: 'Company Dollar / Net', required: false, type: 'currency' },
  { key: 'leadSource', label: 'Lead Source', required: false, type: 'text' },
  { key: 'propertyType', label: 'Property Type', required: false, type: 'text' },
  { key: 'listingDate', label: 'Listing Date', required: false, type: 'date' },
  { key: 'createdDate', label: 'Created Date', required: false, type: 'date' },
];

interface ColumnMappingProps {
  headers: string[];
  sampleData: any[][];
  onConfirm: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

export default function ColumnMapping({ headers, sampleData, onConfirm, onCancel }: ColumnMappingProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  
  // Auto-map on load
  useEffect(() => {
    const newMapping: Record<string, string> = {};
    
    REQUIRED_FIELDS.forEach(field => {
      // Try to find a matching header
      const match = headers.find(h => {
        const headerLower = h.toLowerCase();
        const labelLower = field.label.toLowerCase();
        const keyLower = field.key.toLowerCase();
        
        // Direct match
        if (headerLower === labelLower || headerLower === keyLower) return true;
        
        // Common variations
        if (field.key === 'price' && (headerLower.includes('current price') || headerLower.includes('purchase price') || headerLower.includes('price'))) return true;
        if (field.key === 'commission' && (headerLower.includes('total commission') || headerLower.includes('sale commission total') || headerLower === 'commission')) return true;
        if (field.key === 'buyCommission' && (headerLower.includes('buy side') && headerLower.includes('commission'))) return true;
        if (field.key === 'sellCommission' && (headerLower.includes('sell side') && headerLower.includes('commission'))) return true;
        if (field.key === 'companyDollar' && (headerLower.includes('company dollar') || headerLower.includes('net to office') || headerLower.includes('broker fee'))) return true;
        if (field.key === 'agentName' && (headerLower.includes('agent') || headerLower.includes('member') || headerLower.includes('created by'))) return true;
        if (field.key === 'closingDate' && (headerLower.includes('close') || headerLower.includes('closing'))) return true;
        if (field.key === 'address' && (headerLower.includes('address') || headerLower.includes('loop name'))) return true;
        if (field.key === 'status' && (headerLower.includes('status') || headerLower.includes('loop status'))) return true;
        
        return false;
      });
      
      if (match) {
        newMapping[field.key] = match;
      }
    });
    
    setMapping(newMapping);
  }, [headers]);

  const handleMapChange = (fieldKey: string, header: string) => {
    setMapping(prev => ({
      ...prev,
      [fieldKey]: header
    }));
  };

  const isComplete = REQUIRED_FIELDS.filter(f => f.required).every(f => mapping[f.key]);

  return (
    <Card className="p-6 w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold mb-2">Map Your Columns</h2>
        <p className="text-muted-foreground">
          We found some columns in your file. Please match them to the required fields below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Required Fields</h3>
          {REQUIRED_FIELDS.filter(f => f.required).map(field => (
            <div key={field.key} className="flex flex-col gap-2">
              <label className="text-sm font-medium flex items-center justify-between">
                {field.label}
                <span className="text-xs text-red-500 font-normal">* Required</span>
              </label>
              <Select 
                value={mapping[field.key] || ''} 
                onValueChange={(val) => handleMapChange(field.key, val)}
              >
                <SelectTrigger className={!mapping[field.key] ? "border-red-300 bg-red-50" : ""}>
                  <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent>
                  {headers.map(header => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mapping[field.key] && (
                <p className="text-xs text-muted-foreground truncate">
                  Sample: {sampleData[0]?.[headers.indexOf(mapping[field.key])] || 'Empty'}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Optional Fields</h3>
          {REQUIRED_FIELDS.filter(f => !f.required).map(field => (
            <div key={field.key} className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                {field.label}
              </label>
              <Select 
                value={mapping[field.key] || ''} 
                onValueChange={(val) => handleMapChange(field.key, val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select column (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ignore_field">-- Ignore --</SelectItem>
                  {headers.map(header => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={() => onConfirm(mapping)} 
          disabled={!isComplete}
          className="gap-2"
        >
          <Check className="w-4 h-4" />
          Confirm Mapping
        </Button>
      </div>
    </Card>
  );
}
