import { SparklineTrend, getTrendColor, getTrendArrow, generateSparklinePath } from '@/lib/sparklineUtils';

interface SparklineProps {
  trend: SparklineTrend;
  width?: number;
  height?: number;
  showLabel?: boolean;
}

export default function Sparkline({ trend, width = 100, height = 24, showLabel = true }: SparklineProps) {
  const color = getTrendColor(trend.direction);
  const arrow = getTrendArrow(trend.direction);
  const path = generateSparklinePath(trend.data, width, height);

  if (!path) {
    return <span className="text-xs text-muted-foreground">--</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="inline-block"
      >
        {/* Background grid (optional) */}
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#e5e7eb" strokeWidth="0.5" />
        
        {/* Trend line */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Fill area under curve */}
        <defs>
          <linearGradient id={`gradient-${Math.random()}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${path} L ${width} ${height} L 0 ${height} Z`}
          fill={`url(#gradient-${Math.random()})`}
        />
      </svg>

      {showLabel && (
        <div className="flex items-center gap-0.5">
          <span
            className="text-xs font-semibold"
            style={{ color }}
          >
            {arrow}
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color }}
          >
            {trend.percentChange > 0 ? '+' : ''}{trend.percentChange}%
          </span>
        </div>
      )}
    </div>
  );
}
