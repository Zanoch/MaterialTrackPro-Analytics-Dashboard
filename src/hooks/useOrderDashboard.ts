import { useQuery } from '@tanstack/react-query';
import { orderService } from '../api/services/order.service';
import type {
  OrderDashboardFilters,
} from '../types/order';

// Hook to fetch complete dashboard data
export function useOrderDashboard(filters?: OrderDashboardFilters) {
  return useQuery({
    queryKey: ['order-dashboard', filters],
    queryFn: () => orderService.getOrderDashboardData(filters),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000,
  });
}

// Hook to fetch schedule with real-time analytics (paginated)
export function useOrderScheduleAnalytics(filters?: {
  schedule_date?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['order-schedule-analytics', filters],
    queryFn: () => orderService.getOrderScheduleAnalytics(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - more frequent refresh for analytics
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
}

// Utility function to get status color
export function getOrderStatusColor(status: string): string {
  switch (status) {
    case 'APPROVAL_REQUESTED':
    case 'ORDER_REQUESTED':
      return 'amber';
    case 'APPROVAL_ALLOWED':
    case 'SHIPMENT_ACCEPTED':
      return 'green';
    case 'SHIPMENT_DISPATCHED':
      return 'blue';
    case 'RECEIVED':
      return 'tea';
    case 'ORDER_NOT_READY':
      return 'red';
    default:
      return 'gray';
  }
}

// Utility function to get status icon
export function getOrderStatusIcon(status: string): string {
  switch (status) {
    case 'APPROVAL_REQUESTED':
      return '⏳';
    case 'APPROVAL_ALLOWED':
      return '✅';
    case 'ORDER_REQUESTED':
      return '📋';
    case 'SHIPMENT_ACCEPTED':
      return '📦';
    case 'SHIPMENT_DISPATCHED':
      return '🚚';
    case 'RECEIVED':
      return '✔️';
    case 'ORDER_NOT_READY':
      return '❌';
    default:
      return '❓';
  }
}

// Utility function to format status text
export function formatOrderStatus(status: string): string {
  switch (status) {
    case 'APPROVAL_REQUESTED':
      return 'Approval Requested';
    case 'APPROVAL_ALLOWED':
      return 'Approved';
    case 'ORDER_REQUESTED':
      return 'Order Requested';
    case 'SHIPMENT_ACCEPTED':
      return 'Shipment Accepted';
    case 'SHIPMENT_DISPATCHED':
      return 'In Transit';
    case 'RECEIVED':
      return 'Received';
    case 'ORDER_NOT_READY':
      return 'Not Ready';
    default:
      return status;
  }
}
