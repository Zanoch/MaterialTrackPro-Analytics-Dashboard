import { Card, CardContent } from './Card';

interface MainMetricCardProps {
  children?: React.ReactNode;
  className?: string;
}

export function MainMetricCard({ children, className = '' }: MainMetricCardProps) {
  return (
    <Card className={`border-tea-200 ${className}`}>
      <CardContent className="p-6 h-full flex items-center justify-center">
        {children || (
          <div className="text-center">
            <p className="text-gray-400 text-sm">Main Metric Placeholder</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
