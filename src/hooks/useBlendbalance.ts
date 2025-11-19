import { useQuery } from '@tanstack/react-query';
import { blendbalanceService } from '../api/services/blendbalance.service';
import type {
  BlendbalanceItem,
  BlendbalanceSearchFilters,
  SearchContext,
} from '../types/blendbalance';

// ===== QUERY KEYS =====
export const blendbalanceKeys = {
  all: ['blendbalances'] as const,
  dashboard: () => [...blendbalanceKeys.all, 'dashboard'] as const,
  lists: () => [...blendbalanceKeys.all, 'list'] as const,
  list: (filters?: BlendbalanceSearchFilters) => [...blendbalanceKeys.lists(), filters] as const,
  search: (searchTerm: string, context: SearchContext, filters?: BlendbalanceSearchFilters) =>
    [...blendbalanceKeys.all, 'search', searchTerm, context, filters] as const,
  filters: () => [...blendbalanceKeys.all, 'filters'] as const,
};

// ===== DASHBOARD HOOKS =====

/**
 * Get blendbalance dashboard summary metrics
 */
export const useBlendbalanceDashboard = () => {
  return useQuery({
    queryKey: blendbalanceKeys.dashboard(),
    queryFn: blendbalanceService.getDashboardSummary,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
    retry: 2,
  });
};

// ===== DATA FETCHING HOOKS =====

/**
 * Get all blendbalances (admin access with enhanced data)
 */
export const useBlendbalances = (filters?: BlendbalanceSearchFilters, enabled = true) => {
  return useQuery({
    queryKey: blendbalanceKeys.list(filters),
    queryFn: () => blendbalanceService.getAllBlendbalances(filters),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

/**
 * Search blendbalances with context awareness
 */
export const useBlendbalanceSearch = (
  searchTerm: string,
  context: SearchContext = 'admin',
  filters?: BlendbalanceSearchFilters,
  enabled = true
) => {
  return useQuery({
    queryKey: blendbalanceKeys.search(searchTerm, context, filters),
    queryFn: () => blendbalanceService.searchBlendbalances(searchTerm, context, filters),
    enabled: enabled && searchTerm.length >= 2,
    staleTime: 3 * 60 * 1000, // 3 minutes for search results
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Fewer retries for search
  });
};

// ===== FILTER AND UTILITY HOOKS =====

/**
 * Get filter options for dropdowns - Enhanced version
 */
export const useBlendbalanceFilterOptions = () => {
  return useQuery({
    queryKey: blendbalanceKeys.filters(),
    queryFn: blendbalanceService.getFilterOptions,
    staleTime: 10 * 60 * 1000, // 10 minutes for filter options
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
};

// ===== DERIVED STATE HOOKS =====

/**
 * Get computed blendbalance statistics
 */
export const useBlendbalanceStatistics = (blendbalances?: BlendbalanceItem[]) => {
  const { data: allBlendbalances } = useBlendbalances(undefined, !blendbalances);
  const data = blendbalances || (Array.isArray(allBlendbalances) ? allBlendbalances : []) || [];

  const statistics = {
    totalTransfers: data.length,
    totalWeight: data.reduce((sum: number, b: any) => sum + b.weight, 0),
    transferredWeight: data.reduce((sum: number, b: any) => sum + (b.transferred_weight || 0), 0),
    remainingWeight: data.reduce((sum: number, b: any) => sum + (b.remaining_weight || b.weight), 0),
    averageCompletionPercentage: data.length > 0 
      ? data.reduce((sum: number, b: any) => sum + (b.completion_percentage || 0), 0) / data.length 
      : 0,
    statusCounts: data.reduce((counts: any, b: any) => {
      const status = b.status || 'PENDING';
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>),
    transferTypeCounts: data.reduce((counts: any, b: any) => {
      const type = b.transfer_type || 'BLEND_TO_BLEND';
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>),
  };

  return {
    ...statistics,
    transferEfficiency: statistics.totalWeight > 0 
      ? (statistics.transferredWeight / statistics.totalWeight) * 100 
      : 0,
    averageTransferWeight: statistics.totalTransfers > 0 
      ? statistics.totalWeight / statistics.totalTransfers 
      : 0,
  };
};

