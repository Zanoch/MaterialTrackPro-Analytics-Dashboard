// Hook to provide mock data for dev panel with same interface as real hooks
import { useQuery } from '@tanstack/react-query';
import { getMockInventoryData } from '../mocks/inventoryMockData';
import { getMockPendingTealineData } from '../mocks/pendingTealineMockData';
import { getMockBlendsheetData } from '../mocks/blendsheetMockData';
import type { TealineFilters } from '../types/tealine';

export function useDevTealineInventoryComplete(filters?: TealineFilters, options?: { enabled?: boolean }) {
  const limit = filters?.limit || 25;
  const offset = filters?.offset || 0;

  return useQuery({
    queryKey: ['dev-inventory-complete', limit, offset, filters?.search],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return getMockInventoryData(limit, offset);
    },
    staleTime: Infinity, // Mock data doesn't go stale
    enabled: options?.enabled ?? true,
  });
}

export function useDevPendingTealines(filters?: TealineFilters) {
  const limit = filters?.limit || 25;
  const offset = filters?.offset || 0;

  return useQuery({
    queryKey: ['dev-pending-tealines', limit, offset, filters?.search],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return getMockPendingTealineData(limit, offset);
    },
    staleTime: Infinity,
  });
}

export function useDevBlendsheetOperations(params?: { page?: number; limit?: number; timezone_offset?: string; filters?: any }) {
  const page = params?.page || 1;
  const limit = params?.limit || 25;

  return useQuery({
    queryKey: ['dev-blendsheet-operations', page, limit, params?.filters],
    queryFn: async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return getMockBlendsheetData(page, limit);
    },
    staleTime: Infinity,
  });
}