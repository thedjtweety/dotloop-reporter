import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { DotloopRecord } from '@/lib/csvParser';
import { formatCurrency } from '@/lib/formatUtils';

interface PropertyInsightsChartProps {
  data: DotloopRecord[];
}

export default function PropertyInsightsChart({ data }: PropertyInsightsChartProps) {
  // Filter for valid data
  const scatterData = data
    .filter(r => r.yearBuilt > 1900 && r.price > 0)
    .map(r => ({
      year: r.yearBuilt,
      price: r.price,
      address: r.address,
      size: r.squareFootage || 1000 // Fallback for bubble size
    }));

  if (scatterData.length === 0) return null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border p-2 rounded-lg shadow-lg text-sm">
          <p className="font-semibold">{data.address}</p>
          <p>Year Built: {data.year}</p>
          <p>Price: {formatCurrency(data.price)}</p>
          {data.size > 1000 && <p>Sq Ft: {data.size}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Price vs. Year Built</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis type="number" dataKey="year" name="Year Built" domain={['auto', 'auto']} tickCount={10} />
              <YAxis type="number" dataKey="price" name="Price" unit="$" tickFormatter={(val) => `$${val/1000}k`} />
              <ZAxis type="number" dataKey="size" range={[50, 400]} name="Sq Ft" />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Properties" data={scatterData} fill="#8884d8" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
