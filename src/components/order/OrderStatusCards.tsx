import { Package, CheckCircle, Truck, Clock, TrendingUp } from 'lucide-react';
import { KpiCard } from '../ui/KpiCard';
import type { OrderDashboardSummary } from '../../types/order';

interface OrderStatusCardsProps {
  summary: OrderDashboardSummary;
  isLoading?: boolean;
}

export function OrderStatusCards({ summary, isLoading = false }: OrderStatusCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-24"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <KpiCard
        title="Total Orders"
        value={summary.total_plans}
        icon={Package}
        iconColor="#237c4b"
        iconBgColor="#d9f2e3"
        subtitle="Order plans created"
      />

      <KpiCard
        title="Pending Requests"
        value={summary.pending_requests}
        icon={Clock}
        iconColor="#237c4b"
        iconBgColor="#d9f2e3"
        subtitle="Awaiting approval"
      />

      <KpiCard
        title="Accepted Orders"
        value={summary.accepted_orders}
        icon={CheckCircle}
        iconColor="#237c4b"
        iconBgColor="#d9f2e3"
        subtitle="Ready for shipment"
      />

      <KpiCard
        title="In Transit"
        value={summary.in_transit}
        icon={Truck}
        iconColor="#237c4b"
        iconBgColor="#d9f2e3"
        subtitle="Currently shipping"
      />

      <KpiCard
        title="Received Today"
        value={summary.received_today}
        icon={CheckCircle}
        iconColor="#237c4b"
        iconBgColor="#d9f2e3"
        subtitle="Delivered successfully"
      />
    </div>
  );
}

interface OrderMetricsCardsProps {
  summary: OrderDashboardSummary;
  isLoading?: boolean;
}

export function OrderMetricsCards({ summary, isLoading = false }: OrderMetricsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-24"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <KpiCard
        title="Total Required"
        value={`${(summary.total_requirement_kg / 1000).toFixed(1)}t`}
        icon={Package}
        iconColor="#237c4b"
        iconBgColor="#d9f2e3"
        subtitle="Tea requirement"
      />

      <KpiCard
        title="Total Shipped"
        value={`${(summary.total_shipped_kg / 1000).toFixed(1)}t`}
        icon={Truck}
        iconColor="#237c4b"
        iconBgColor="#d9f2e3"
        subtitle="Tea shipped"
      />

      <KpiCard
        title="Fulfillment Rate"
        value={`${summary.fulfillment_rate.toFixed(1)}%`}
        icon={TrendingUp}
        iconColor="#237c4b"
        iconBgColor="#d9f2e3"
        trend={summary.fulfillment_rate >= 80 ? "up" : "down"}
        trendValue={summary.fulfillment_rate >= 80 ? "On target" : "Below target"}
      />
    </div>
  );
}