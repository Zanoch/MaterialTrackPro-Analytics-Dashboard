import { useQuery } from '@tanstack/react-query';
import { orderService } from '../api/services/order.service';
import { type OrderFilters } from '../types/order';

export const useOrders = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => orderService.getOrders(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 30, // 30 seconds
  });
};

export const useOrderById = (orderId: string) => {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: !!orderId,
  });
};

export const useOrderItems = (orderId: string) => {
  return useQuery({
    queryKey: ['orders', orderId, 'items'],
    queryFn: () => orderService.getOrderItems(orderId),
    enabled: !!orderId,
  });
};

export const useOrderShipments = (orderId: string) => {
  return useQuery({
    queryKey: ['orders', orderId, 'shipments'],
    queryFn: () => orderService.getOrderShipments(orderId),
    enabled: !!orderId,
  });
};

export const useOrderStats = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: ['orders', 'stats', filters],
    queryFn: () => orderService.getOrderStats(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60, // 1 minute
  });
};

export const useOrderFilterOptions = () => {
  return useQuery({
    queryKey: ['orders', 'filter-options'],
    queryFn: orderService.getFilterOptions,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};