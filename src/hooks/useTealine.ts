import { useQuery } from '@tanstack/react-query';
import { tealineService } from '../api/services/tealine.service';
import { type TealineFilters } from '../types/tealine';

export const usePendingTealines = (filters?: TealineFilters) => {
  return useQuery({
    queryKey: ['tealines', 'pending', filters],
    queryFn: () => tealineService.getPending(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes (shorter for better pagination response)
    refetchInterval: 1000 * 60, // 1 minute (slower for better performance)
    placeholderData: (previousData) => previousData, // Keep previous data during searches (React Query v5)
  });
};

export const useTealineFilterOptions = () => {
  return useQuery({
    queryKey: ['tealines', 'filter-options'],
    queryFn: () => tealineService.getFilterOptions(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Hook for the new inventory complete endpoint with meta data
export const useTealineInventoryComplete = (filters?: TealineFilters) => {
  return useQuery({
    queryKey: ['tealines', 'inventory-complete', filters],
    queryFn: () => tealineService.getInventoryComplete(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 30, // 30 seconds
    placeholderData: (previousData) => previousData, // Keep previous data during searches (React Query v5)
  });
};