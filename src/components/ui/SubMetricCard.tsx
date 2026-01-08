import { Card, CardContent } from './Card';

interface SubMetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  className?: string;
}

export function SubMetricCard({
  title,
  value,
  icon: Icon,
  trend,
  className = ''
}: SubMetricCardProps) {
  return (
    <Card className={`border-tea-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-tea-100 p-2 flex-shrink-0">
            <Icon className="h-5 w-5 text-tea-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-tea-700 uppercase truncate">
              {title}
            </p>
            <p className="text-xl font-bold text-tea-600 truncate">
              {value}
            </p>
            {trend && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {trend}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
