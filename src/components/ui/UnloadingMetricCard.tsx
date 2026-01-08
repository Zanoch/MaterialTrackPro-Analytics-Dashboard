import { Package } from 'lucide-react';
import { Card, CardContent } from './Card';
import { UnloadingGauge } from './UnloadingGauge';

export interface UnloadingData {
  itemCode: string;
  currentDelay: number;
  totalTime: string;
  currentBag: number;
  totalBags: number;
  isUnloading: boolean;
}

interface GaugeSector {
  label: string;
  color: string;
  threshold: { min: number; max: number };
}

interface GaugeConfig {
  sectors: GaugeSector[];
  totalAngle: number;
}

interface UnloadingMetricCardProps {
  data: UnloadingData | null;
  gaugeConfig?: GaugeConfig;
  className?: string;
}

export function UnloadingMetricCard({
  data,
  gaugeConfig,
  className = ''
}: UnloadingMetricCardProps) {
  return (
    <Card className={`border-tea-200 ${className}`}>
      <CardContent className="h-full flex justify-center">
        {data && data.isUnloading ? (
          <UnloadingGauge
            delaySeconds={data.currentDelay}
            totalTime={data.totalTime}
            itemCode={data.itemCode}
            currentBag={data.currentBag}
            totalBags={data.totalBags}
            config={gaugeConfig}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Package className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              No Active Unloading
            </p>
            <div className="w-24 h-px bg-gray-300 mb-2" />
            <p className="text-sm text-gray-500">
              Waiting for tea items to arrive...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
