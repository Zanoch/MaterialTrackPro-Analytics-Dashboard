import { Card, CardContent } from './Card';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  valueColor?: string;
  titleColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  trendColor?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-tea-600',
  iconBgColor = 'bg-tea-100',
  valueColor = 'text-tea-600',
  titleColor = 'text-tea-700',
  trend,
  trendValue,
  trendColor
}: KpiCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '';
  };

  const getTrendColor = () => {
    if (trendColor) return trendColor;
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <Card className="border-tea-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`rounded-full p-3 ${iconBgColor}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div>
            <p className={`text-sm font-medium uppercase ${titleColor}`}>
              {title}
            </p>
            <p className={`text-2xl font-bold ${valueColor}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {(subtitle || trendValue) && (
              <p className={`text-xs mt-1 ${getTrendColor()}`}>
                {getTrendIcon()} {trendValue || subtitle}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}