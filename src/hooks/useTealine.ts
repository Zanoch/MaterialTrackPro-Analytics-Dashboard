import { useQuery } from '@tanstack/react-query';
import { tealineService } from '../api/services/tealine.service';
import { type TealineFilters } from '../types/tealine';

export const usePendingTealines = (filters?: TealineFilters) => {
  return useQuery({
    queryKey: ['tealines', 'pending', filters],
    queryFn: () => tealineService.getPending(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 30, // 30 seconds
  });
};

export const useTealineInventory = (filters?: TealineFilters) => {
  return useQuery({
    queryKey: ['tealines', 'inventory', filters],
    queryFn: () => tealineService.getInventoryOptimized(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 30, // 30 seconds
  });
};

export const useTealineFilterOptions = () => {
  return useQuery({
    queryKey: ['tealines', 'filter-options'],
    queryFn: () => tealineService.getFilterOptions(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useTealineRecords = (itemCode: string, createdTs: string) => {
  return useQuery({
    queryKey: ['tealines', 'records', itemCode, createdTs],
    queryFn: () => tealineService.getRecords(itemCode, createdTs),
    enabled: !!itemCode && !!createdTs,
  });
};

// Hook for the new inventory complete endpoint with meta data
export const useTealineInventoryComplete = (filters?: TealineFilters) => {
  return useQuery({
    queryKey: ['tealines', 'inventory-complete', filters],
    queryFn: () => tealineService.getInventoryComplete(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 30, // 30 seconds
  });
};