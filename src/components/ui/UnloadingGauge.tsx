interface GaugeSector {
  label: string;
  color: string;
  threshold: { min: number; max: number };
}

interface GaugeConfig {
  sectors: GaugeSector[];
  totalAngle: number;
}

interface UnloadingGaugeProps {
  delaySeconds: number;
  totalTime: string;
  itemCode: string;
  currentBag: number;
  totalBags: number;
  config?: GaugeConfig;
}

const DEFAULT_GAUGE_CONFIG: GaugeConfig = {
  totalAngle: 180,
  sectors: [
    { label: 'Too Slow', color: '#EF4444', threshold: { min: 120, max: Infinity } },
    { label: 'Slow', color: '#F97316', threshold: { min: 60, max: 120 } },
    { label: 'Normal', color: '#22C55E', threshold: { min: 30, max: 60 } },
    { label: 'Fast', color: '#F97316', threshold: { min: 15, max: 30 } },
    { label: 'Too Fast', color: '#EF4444', threshold: { min: 0, max: 15 } },
  ]
};

export function UnloadingGauge({
  delaySeconds,
  totalTime,
  itemCode,
  currentBag,
  totalBags,
  config = DEFAULT_GAUGE_CONFIG
}: UnloadingGaugeProps) {
  const { sectors, totalAngle } = config;

  // Calculate needle angle based on delay
  const calculateNeedleAngle = (): number => {
    // Clamp delay to reasonable max (e.g., 150 seconds)
    const maxDelay = 150;
    const clampedDelay = Math.min(delaySeconds, maxDelay);

    // Map delay to angle (180° to 360°)
    // Higher delay = more to the left (slower) = closer to 180°
    // Lower delay = more to the right (faster) = closer to 360°
    const normalizedDelay = clampedDelay / maxDelay;  // 0 (fast) to 1 (slow)
    const angle = 360 - (normalizedDelay * totalAngle);  // Maps to 360° (fast) to 180° (slow)

    return angle;
  };

  const needleAngle = calculateNeedleAngle();

  // Calculate sector paths (optimized for compact layout)
  const centerX = 100;  // Centered in optimized viewBox
  const centerY = 110;  // Center position (moved down for spacing from badge)
  const radius = 70;
  const startAngle = 180;  // Start from left (180°) to create bottom-flat semicircle
  const anglePerSector = totalAngle / sectors.length;

  const polarToCartesian = (angle: number, r: number) => {
    const angleInRadians = (angle * Math.PI) / 180;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians)
    };
  };

  const createArcPath = (start: number, end: number) => {
    const startPoint = polarToCartesian(start, radius);
    const endPoint = polarToCartesian(end, radius);
    const largeArcFlag = end - start > 180 ? 1 : 0;

    return `
      M ${startPoint.x} ${startPoint.y}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}
    `;
  };

  // Determine current zone based on needle angle
  const getCurrentZone = () => {
    const sectorIndex = Math.floor((needleAngle - startAngle) / anglePerSector);
    const clampedIndex = Math.max(0, Math.min(sectors.length - 1, sectorIndex));
    return sectors[clampedIndex];
  };

  const currentZone = getCurrentZone();

  // Create arrow indicator aligned with zones, pointing radially inward
  const arrowSize = 6; // Smaller arrow size
  const arrowTipGap = 4; // Gap between arrow tip and zone arc (easily adjustable)
  const arrowHeight = arrowSize * Math.sqrt(3) / 2; // Height of equilateral triangle

  const createArrowPath = () => {
    const angleRad = (needleAngle * Math.PI) / 180;

    // Tip of arrow (with gap from the arc)
    const tipPos = polarToCartesian(needleAngle, radius + arrowTipGap);
    const tipX = tipPos.x;
    const tipY = tipPos.y;

    // Base of arrow (outside) - calculate for equilateral triangle
    const basePos = polarToCartesian(needleAngle, radius + arrowHeight + arrowTipGap);
    const baseX = basePos.x;
    const baseY = basePos.y;

    // Calculate perpendicular points for arrow wings (equilateral triangle)
    const perpAngle1 = angleRad + Math.PI / 2;
    const perpAngle2 = angleRad - Math.PI / 2;
    const halfBase = arrowSize / 2;

    const wing1X = baseX + Math.cos(perpAngle1) * halfBase;
    const wing1Y = baseY + Math.sin(perpAngle1) * halfBase;

    const wing2X = baseX + Math.cos(perpAngle2) * halfBase;
    const wing2Y = baseY + Math.sin(perpAngle2) * halfBase;

    return `M ${tipX} ${tipY} L ${wing1X} ${wing1Y} L ${wing2X} ${wing2Y} Z`;
  };

  // Format delay for display (simplified - no seconds in minutes)
  const formatDelay = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} sec`;
    }
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Item Code and Progress (Centered) */}
      <div className="mb-4 text-center">
        <p className="text-sm font-medium text-tea-700">
          {itemCode}
        </p>
        <p className="text-xs text-gray-600">
          Bag {currentBag}/{totalBags}
        </p>
      </div>

      {/* Gauge SVG */}
      <div className="flex-1 flex items-center justify-center">
        <svg viewBox="0 0 200 130" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Sector arc outlines with rounded corners and gaps */}
          {sectors.map((sector, index) => {
            const gap = 3; // Increased gap between zones
            const sectorStartAngle = startAngle + (index * anglePerSector) + gap;
            const sectorEndAngle = sectorStartAngle + anglePerSector - (gap * 2);

            return (
              <path
                key={index}
                d={createArcPath(sectorStartAngle, sectorEndAngle)}
                fill="none"
                stroke={sector.color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="1.0"
              />
            );
          })}

          {/* Arrow indicator pointing radially inward */}
          <path
            d={createArrowPath()}
            fill={currentZone.color}
          />

          {/* Current Zone Label Badge - Fixed Position in SVG */}
          <g>
            {/* Badge background */}
            <rect
              x={centerX - 25}
              y={10}
              width={50}
              height={16}
              rx={8}
              fill={currentZone.color}
              fillOpacity={0.15}
              stroke={currentZone.color}
              strokeWidth={1.5}
            />
            {/* Badge text */}
            <text
              x={centerX}
              y={21}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill={currentZone.color}
            >
              {currentZone.label}
            </text>
          </g>

          {/* Bottom display - Delay per bag */}
          <text
            x={centerX}
            y={centerY - 18}
            textAnchor="middle"
            fontSize="16"
            fontWeight="bold"
            className="fill-tea-700"
          >
            {formatDelay(delaySeconds)}/bag
          </text>

          {/* Bottom display - Elapsed Time */}
          <text
            x={centerX}
            y={centerY - 6}
            textAnchor="middle"
            fontSize="8"
            className="fill-gray-600"
          >
            Elapsed: {totalTime}
          </text>
        </svg>
      </div>
    </div>
  );
}
