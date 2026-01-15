/**
 * MetricCard Component
 * Displays key performance indicators with icons, animations, and styling
 */

import { ReactNode, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { MetricTrend } from '@/lib/csvParser';
import { formatPercentage } from '@/lib/formatUtils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color?: 'primary' | 'accent' | 'secondary';
  trend?: MetricTrend;
  onClick?: () => void;
}

// Count-up animation hook
function useCountUp(end: number, duration: number = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(startValue + (end - startValue) * easeOutQuart));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  onClick,
}: MetricCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Extract numeric value for animation
  const numericValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[^0-9.-]+/g, '')) 
    : value;
  
  const isNumeric = !isNaN(numericValue);
  const animatedCount = useCountUp(isNumeric ? numericValue : 0, 1500);

  // Format the animated value back to original format
  const displayValue = isNumeric && typeof value === 'string' && value.includes('$')
    ? `$${animatedCount.toLocaleString()}`
    : isNumeric && typeof value === 'string' && value.includes('%')
    ? `${animatedCount}%`
    : isNumeric
    ? animatedCount.toLocaleString()
    : value;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const colorConfig = {
    primary: {
      bg: 'from-blue-500/10 via-blue-400/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconText: 'text-white',
      glow: 'shadow-blue-500/20',
      border: 'border-blue-500/20',
    },
    accent: {
      bg: 'from-green-500/10 via-green-400/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-green-500 to-green-600',
      iconText: 'text-white',
      glow: 'shadow-green-500/20',
      border: 'border-green-500/20',
    },
    secondary: {
      bg: 'from-purple-500/10 via-purple-400/5 to-transparent',
      iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      iconText: 'text-white',
      glow: 'shadow-purple-500/20',
      border: 'border-purple-500/20',
    },
  };

  const config = colorConfig[color];

  return (
    <Card 
      className={`
        relative overflow-hidden p-6 bg-card border transition-all duration-500
        ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        hover:shadow-xl hover:${config.glow} hover:${config.border}
        group
      `}
      onClick={onClick}
    >
      {/* Gradient background overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />
      </div>

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-foreground font-medium mb-3 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-4xl font-display font-bold text-foreground mb-1 transition-all duration-300 group-hover:scale-105">
            {displayValue}
          </p>
          {trend ? (
            <div className="flex items-center gap-2 mt-3">
              <div className={`flex items-center text-sm font-semibold px-2 py-1 rounded-full ${
                trend.direction === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                trend.direction === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {trend.direction === 'up' && <ArrowUpRight className="w-4 h-4 mr-1" />}
                {trend.direction === 'down' && <ArrowDownRight className="w-4 h-4 mr-1" />}
                {trend.direction === 'neutral' && <Minus className="w-4 h-4 mr-1" />}
                {formatPercentage(trend.value)}
              </div>
              <p className="text-xs text-foreground">vs previous</p>
            </div>
          ) : subtitle && (
            <p className="text-sm text-foreground mt-2 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Enhanced icon with gradient and glow */}
        <div className={`
          relative w-14 h-14 rounded-xl ${config.iconBg} ${config.iconText}
          flex items-center justify-center flex-shrink-0
          shadow-lg transition-all duration-300
          group-hover:scale-110 group-hover:rotate-3
          group-hover:shadow-2xl group-hover:${config.glow}
        `}>
          <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm" />
          <div className="relative">
            {icon}
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${config.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </Card>
  );
}
