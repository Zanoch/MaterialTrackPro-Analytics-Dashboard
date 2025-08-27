import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../api/services/order.service';
import type { 
  OrderDashboardFilters, 
  OrderPlanDetails,
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

// Hook to fetch order plans
export function useOrderPlans(currentDate?: string) {
  return useQuery({
    queryKey: ['order-plans', currentDate],
    queryFn: () => orderService.getOrderPlans(currentDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch order requests
export function useOrderRequests(filters?: OrderDashboardFilters) {
  return useQuery({
    queryKey: ['order-requests', filters],
    queryFn: () => orderService.getOrderRequests(filters),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000,
  });
}

// Hook to create shipment event
export function useCreateShipmentEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (events: Array<{
      request_code: string;
      shipment_code: number;
      status: string;
      shipment_vehicle?: string;
      shipment_remarks?: string;
      order_remarks?: string;
    }>) => orderService.createShipmentEvent(events),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['order-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['order-requests'] });
    },
  });
}

// Hook to get filter options
export function useOrderFilterOptions() {
  return useQuery({
    queryKey: ['order-filter-options'],
    queryFn: () => orderService.getFilterOptions(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to fetch schedule
export function useOrderSchedule(scheduleDate?: string) {
  return useQuery({
    queryKey: ['order-schedule', scheduleDate],
    queryFn: () => orderService.getOrderSchedule({ schedule_date: scheduleDate }),
    enabled: !!scheduleDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

// Utility function to calculate progress percentage
export function calculateOrderProgress(orderPlan: OrderPlanDetails): number {
  if (!orderPlan.requirement || orderPlan.requirement === 0) return 0;
  
  let shipped = 0;
  orderPlan.requests.forEach(request => {
    if (request.status === 'SHIPMENT_DISPATCHED' || request.status === 'RECEIVED') {
      shipped += request.quantity;
    }
  });
  
  return Math.min(100, (shipped / orderPlan.requirement) * 100);
}