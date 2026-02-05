import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/formatUtils';
import { DotloopRecord } from '@/lib/csvParser';

interface BuySellTrendChartProps {
  data: DotloopRecord[];
  onDataPointClick?: (month: string, buySideDeals: DotloopRecord[], sellSideDeals: DotloopRecord[]) => void;
}

export default function BuySellTrendChart({ data, onDataPointClick }: BuySellTrendChartProps) {
  // Aggregate data by month - track buy-side vs sell-side transaction volume
  const monthlyData = React.useMemo(() => {
    const grouped = new Map<string, { 
      buySide: number; 
      sellSide: number; 
      date: Date;
      buySideDeals: DotloopRecord[];
      sellSideDeals: DotloopRecord[];
    }>();

    data.forEach(record => {
      // Use listing date to capture all deals (not just closed ones)
      const dateToUse = record.listingDate || record.closingDate;
      if (!dateToUse) return;
      
      const date = new Date(dateToUse);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, { 
          buySide: 0, 
          sellSide: 0, 
          date,
          buySideDeals: [],
          sellSideDeals: []
        });
      }
      
      const entry = grouped.get(key)!;
      // Calculate deal value
      const dealValue = record.salePrice || record.price || 0;
      
      // Determine side based on transaction type
      // Buy-side: buyer's agent, Sell-side: seller's agent
      if (record.transactionType === 'Buy' || record.transactionType?.toLowerCase().includes('buy')) {
        entry.buySide += dealValue;
        entry.buySideDeals.push(record);
      } else if (record.transactionType === 'Sell' || record.transactionType?.toLowerCase().includes('sell')) {
        entry.sellSide += dealValue;
        entry.sellSideDeals.push(record);
      } else {
        // If no clear side, use commission ratio to determine side
        const buySideComm = record.buySideCommission || 0;
        const sellSideComm = record.sellSideCommission || 0;
        
        if (buySideComm > sellSideComm) {
          entry.buySide += dealValue;
          entry.buySideDeals.push(record);
        } else if (sellSideComm > buySideComm) {
          entry.sellSide += dealValue;
          entry.sellSideDeals.push(record);
        } else {
          // Split equally if no clear indicator
          entry.buySide += dealValue / 2;
          entry.sellSide += dealValue / 2;
          entry.buySideDeals.push(record);
          entry.sellSideDeals.push(record);
        }
      }
    });

    return Array.from(grouped.entries())
      .map(([key, value]) => ({
        name: key,
        displayDate: value.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        buySide: value.buySide,
        sellSide: value.sellSide,
        timestamp: value.date.getTime(),
        buySideDeals: value.buySideDeals,
        sellSideDeals: value.sellSideDeals
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded-lg shadow-lg text-sm">
          <p className="font-semibold mb-1">{payload[0].payload.displayDate}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          <p className="text-xs text-muted-foreground mt-1">Click to view deals →</p>
        </div>
      );
    }
    return null;
  };

  const handleClick = (data: any) => {
    if (onDataPointClick) {
      onDataPointClick(data.displayDate, data.buySideDeals, data.sellSideDeals);
    }
  };

  if (monthlyData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Buy vs Sell Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-foreground">
          No trend data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Buy vs Sell Trend</CardTitle>
        <p className="text-xs text-muted-foreground mt-2">
          Monthly transaction volume by side. Click data points to view deals.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full cursor-pointer">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="displayDate" 
                className="text-xs" 
                tick={{ fill: 'currentColor' }}
              />
              <YAxis 
                tickFormatter={(value) => `$${value / 1000000}M`}
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="buySide" 
                name="Buy Side" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ r: 4, cursor: 'pointer' }}
                activeDot={{ r: 6 }}
                onClick={(data) => handleClick(data)}
              />
              <Line 
                type="monotone" 
                dataKey="sellSide" 
                name="Sell Side" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ r: 4, cursor: 'pointer' }}
                activeDot={{ r: 6 }}
                onClick={(data) => handleClick(data)}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
