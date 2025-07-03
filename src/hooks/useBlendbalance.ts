import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blendbalanceService } from '../api/services/blendbalance.service';
import type { 
  BlendbalanceItem,
  BlendbalanceSearchFilters,
  CreateBlendbalanceRequest,
  UpdateBlendbalanceRequest,
  SearchContext,
  BlendbalanceFilters,
  TransferType,
  BlendbalanceStatus,
} from '../types/blendbalance';

// ===== QUERY KEYS =====
export const blendbalanceKeys = {
  all: ['blendbalances'] as const,
  dashboard: () => [...blendbalanceKeys.all, 'dashboard'] as const,
  lists: () => [...blendbalanceKeys.all, 'list'] as const,
  list: (filters?: BlendbalanceSearchFilters) => [...blendbalanceKeys.lists(), filters] as const,
  search: (searchTerm: string, context: SearchContext, filters?: BlendbalanceSearchFilters) => 
    [...blendbalanceKeys.all, 'search', searchTerm, context, filters] as const,
  details: () => [...blendbalanceKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...blendbalanceKeys.details(), id] as const,
  filters: () => [...blendbalanceKeys.all, 'filters'] as const,
  transfers: () => [...blendbalanceKeys.all, 'transfers'] as const,
  transfersByStatus: (status: BlendbalanceStatus) => [...blendbalanceKeys.transfers(), 'status', status] as const,
  transfersByType: (type: TransferType) => [...blendbalanceKeys.transfers(), 'type', type] as const,
  pending: () => [...blendbalanceKeys.all, 'pending'] as const,
  qualityQueue: () => [...blendbalanceKeys.all, 'quality-queue'] as const,
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
 * Get available blendbalances (user access)
 */
export const useAvailableBlendbalances = (filters?: BlendbalanceSearchFilters, enabled = true) => {
  return useQuery({
    queryKey: [...blendbalanceKeys.lists(), 'available', filters],
    queryFn: () => blendbalanceService.getAvailableBlendbalances(filters),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
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

/**
 * Get specific blendbalance by ID - Enhanced version
 */
export const useBlendbalanceDetail = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: blendbalanceKeys.detail(id),
    queryFn: () => blendbalanceService.getBlendbalanceById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes for details
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
};

// ===== TRANSFER MANAGEMENT HOOKS =====

/**
 * Get transfers by status
 */
export const useTransfersByStatus = (status: BlendbalanceStatus, enabled = true) => {
  return useQuery({
    queryKey: blendbalanceKeys.transfersByStatus(status),
    queryFn: () => blendbalanceService.getTransfersByStatus(status),
    enabled: enabled && !!status,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
};

/**
 * Get transfers by type
 */
export const useTransfersByType = (transferType: TransferType, enabled = true) => {
  return useQuery({
    queryKey: blendbalanceKeys.transfersByType(transferType),
    queryFn: () => blendbalanceService.getTransfersByType(transferType),
    enabled: enabled && !!transferType,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
};

/**
 * Get pending transfers
 */
export const usePendingTransfers = (enabled = true) => {
  return useQuery({
    queryKey: blendbalanceKeys.pending(),
    queryFn: blendbalanceService.getPendingTransfers,
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute for pending transfers
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000, // 30 seconds
    retry: 2,
  });
};

/**
 * Get quality check queue
 */
export const useQualityCheckQueue = (enabled = true) => {
  return useQuery({
    queryKey: blendbalanceKeys.qualityQueue(),
    queryFn: blendbalanceService.getQualityCheckQueue,
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute for quality queue
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000, // 30 seconds
    retry: 2,
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

// ===== MUTATION HOOKS =====

/**
 * Create new blendbalance record
 */
export const useCreateBlendbalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBlendbalanceRequest) => blendbalanceService.createBlendbalance(data),
    onSuccess: (newBlendbalance) => {
      // Invalidate and refetch blendbalance lists
      queryClient.invalidateQueries({ queryKey: blendbalanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: blendbalanceKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: blendbalanceKeys.filters() });
      
      // Add the new blendbalance to existing queries if they exist
      queryClient.setQueryData(
        blendbalanceKeys.list(),
        (oldData: BlendbalanceItem[] | undefined) => {
          return oldData ? [newBlendbalance, ...oldData] : [newBlendbalance];
        }
      );
      
      console.log('✅ Created new blendbalance:', newBlendbalance.transfer_id);
    },
  });
};

/**
 * Update existing blendbalance record
 */
export const useUpdateBlendbalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateBlendbalanceRequest }) =>
      blendbalanceService.updateBlendbalance(id, data),
    onSuccess: (updatedBlendbalance, { id }) => {
      // Update the specific blendbalance in cache
      queryClient.setQueryData(blendbalanceKeys.detail(id), updatedBlendbalance);
      
      // Update the blendbalance in any list queries
      queryClient.setQueriesData(
        { queryKey: blendbalanceKeys.lists() },
        (oldData: BlendbalanceItem[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(blendbalance => 
            blendbalance.id === updatedBlendbalance.id ? updatedBlendbalance : blendbalance
          );
        }
      );
      
      // Invalidate dashboard to recalculate metrics
      queryClient.invalidateQueries({ queryKey: blendbalanceKeys.dashboard() });
      
      console.log('✅ Updated blendbalance:', updatedBlendbalance.transfer_id);
    },
  });
};

/**
 * Delete blendbalance record
 */
export const useDeleteBlendbalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => blendbalanceService.deleteBlendbalance(id),
    onSuccess: (_, deletedId) => {
      // Remove the blendbalance from all list queries
      queryClient.setQueriesData(
        { queryKey: blendbalanceKeys.lists() },
        (oldData: BlendbalanceItem[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter(blendbalance => blendbalance.id !== deletedId);
        }
      );
      
      // Remove the specific blendbalance detail from cache
      queryClient.removeQueries({ queryKey: blendbalanceKeys.detail(deletedId) });
      
      // Invalidate dashboard and filters
      queryClient.invalidateQueries({ queryKey: blendbalanceKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: blendbalanceKeys.filters() });
      
      console.log('✅ Deleted blendbalance with ID:', deletedId);
    },
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

// ===== LEGACY HOOKS (for backward compatibility) =====

/**
 * Hook for admin blendbalances (legacy)
 */
export const useAdminBlendbalances = (filters?: BlendbalanceFilters) => {
  return useQuery({
    queryKey: ['blendbalances', 'admin', filters],
    queryFn: () => blendbalanceService.getAdminBlendbalances(filters),
    refetchInterval: 30000, // 30 seconds
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for incomplete blendbalances (legacy)
 */
export const useIncompleteBlendbalances = (filters?: BlendbalanceFilters) => {
  return useQuery({
    queryKey: ['blendbalances', 'incomplete', filters],
    queryFn: () => blendbalanceService.getIncompleteBlendbalances(filters),
    refetchInterval: 30000,
    staleTime: 5 * 60 * 1000,
  });
};