import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flavorsheetService } from '../api/services/flavorsheet.service';
import type {
  FlavorsheetBatch,
  FlavorsheetSearchFilters,
  CreateFlavorsheetRequest,
  CreateBatchRequest,
  UpdateBatchRequest,
  SearchContext,
} from '../types/flavorsheet';

// === QUERY KEYS ===
export const flavorsheetKeys = {
  all: ['flavorsheets'] as const,
  lists: () => [...flavorsheetKeys.all, 'list'] as const,
  list: (filters: FlavorsheetSearchFilters) => [...flavorsheetKeys.lists(), { filters }] as const,
  details: () => [...flavorsheetKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...flavorsheetKeys.details(), id] as const,
  search: (term: string, context: SearchContext, filters?: FlavorsheetSearchFilters) => 
    [...flavorsheetKeys.all, 'search', { term, context, filters }] as const,
  batches: () => [...flavorsheetKeys.all, 'batches'] as const,
  batchList: (filters?: FlavorsheetSearchFilters) => [...flavorsheetKeys.batches(), { filters }] as const,
  batchDetail: (id: string | number) => [...flavorsheetKeys.batches(), 'detail', id] as const,
  batchesForFlavorsheet: (flavorsheetId: number) => 
    [...flavorsheetKeys.batches(), 'flavorsheet', flavorsheetId] as const,
  dashboard: () => [...flavorsheetKeys.all, 'dashboard'] as const,
  filterOptions: () => [...flavorsheetKeys.all, 'filterOptions'] as const,
};

// === SEARCH HOOKS ===

// Search flavorsheets with context
export const useFlavorsheetSearch = (
  searchTerm: string,
  context: SearchContext = 'admin',
  filters?: FlavorsheetSearchFilters,
  enabled = true
) => {
  return useQuery({
    queryKey: flavorsheetKeys.search(searchTerm, context, filters),
    queryFn: () => flavorsheetService.searchFlavorsheets(searchTerm, context, filters),
    enabled: enabled && searchTerm.length >= 2, // Only search when term is meaningful
    staleTime: 3 * 60 * 1000, // 3 minutes cache for search results
    gcTime: 5 * 60 * 1000, // 5 minutes cache retention
    refetchOnWindowFocus: false,
  });
};

// Search batches
export const useBatchSearch = (
  searchTerm?: string,
  filters?: FlavorsheetSearchFilters,
  enabled = true
) => {
  return useQuery({
    queryKey: [...flavorsheetKeys.batches(), 'search', { searchTerm, filters }],
    queryFn: () => flavorsheetService.searchBatches(searchTerm, filters),
    enabled,
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

// === DASHBOARD HOOKS ===

// Dashboard summary with real-time updates
export const useFlavorsheetDashboard = () => {
  return useQuery({
    queryKey: flavorsheetKeys.dashboard(),
    queryFn: flavorsheetService.getDashboardSummary,
    staleTime: 1 * 60 * 1000, // 1 minute cache for dashboard
    gcTime: 3 * 60 * 1000, // 3 minutes retention
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

// === FLAVORSHEET HOOKS ===

// Get all flavorsheets (admin)
export const useFlavorsheets = (filters?: FlavorsheetSearchFilters) => {
  return useQuery({
    queryKey: flavorsheetKeys.list(filters || {}),
    queryFn: () => flavorsheetService.getAllFlavorsheets(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes retention
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
};

// Get incomplete flavorsheets (user)
export const useIncompleteFlavorsheets = (filters?: FlavorsheetSearchFilters) => {
  return useQuery({
    queryKey: [...flavorsheetKeys.lists(), 'incomplete', { filters }],
    queryFn: () => flavorsheetService.getIncompleteFlavorsheets(filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });
};

// Get single flavorsheet by ID
export const useFlavorsheet = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: flavorsheetKeys.detail(id),
    queryFn: () => flavorsheetService.getFlavorsheetById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// === BATCH HOOKS ===

// Get all batches
export const useFlavorsheetBatches = (filters?: FlavorsheetSearchFilters) => {
  return useQuery({
    queryKey: flavorsheetKeys.batchList(filters),
    queryFn: () => flavorsheetService.getAllBatches(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes cache for batches (more dynamic)
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds for active batches
  });
};

// Get single batch by ID
export const useFlavorsheetBatch = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: flavorsheetKeys.batchDetail(id),
    queryFn: () => flavorsheetService.getBatchById(id),
    enabled: enabled && !!id,
    staleTime: 1 * 60 * 1000, // 1 minute cache for individual batch
    gcTime: 3 * 60 * 1000,
    refetchInterval: 30 * 1000, // Frequent updates for batch progress
  });
};

// Get batches for specific flavorsheet
export const useBatchesForFlavorsheet = (flavorsheetId: number, enabled = true) => {
  return useQuery({
    queryKey: flavorsheetKeys.batchesForFlavorsheet(flavorsheetId),
    queryFn: () => flavorsheetService.getBatchesForFlavorsheet(flavorsheetId),
    enabled: enabled && !!flavorsheetId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 30 * 1000,
  });
};

// === UTILITY HOOKS ===

// Get filter options for dropdowns
export const useFlavorsheetFilterOptions = () => {
  return useQuery({
    queryKey: flavorsheetKeys.filterOptions(),
    queryFn: flavorsheetService.getFilterOptions,
    staleTime: 10 * 60 * 1000, // 10 minutes cache for filter options
    gcTime: 15 * 60 * 1000, // 15 minutes retention
    refetchOnWindowFocus: false,
  });
};

// === MUTATION HOOKS ===

// Create flavorsheet
export const useCreateFlavorsheet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFlavorsheetRequest) => flavorsheetService.createFlavorsheet(data),
    onSuccess: (newFlavorsheet) => {
      // Invalidate flavorsheet lists
      queryClient.invalidateQueries({ queryKey: flavorsheetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: flavorsheetKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: flavorsheetKeys.filterOptions() });
      
      // Add to cache
      queryClient.setQueryData(
        flavorsheetKeys.detail(newFlavorsheet.id),
        newFlavorsheet
      );
    },
    onError: (error) => {
      console.error('Failed to create flavorsheet:', error);
    },
  });
};

// Update flavorsheet
export const useUpdateFlavorsheet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<CreateFlavorsheetRequest> }) =>
      flavorsheetService.updateFlavorsheet(id, data),
    onSuccess: (updatedFlavorsheet, { id }) => {
      // Update specific flavorsheet cache
      queryClient.setQueryData(
        flavorsheetKeys.detail(id),
        updatedFlavorsheet
      );
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: flavorsheetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: flavorsheetKeys.dashboard() });
    },
    onError: (error) => {
      console.error('Failed to update flavorsheet:', error);
    },
  });
};

// Delete flavorsheet
export const useDeleteFlavorsheet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => flavorsheetService.deleteFlavorsheet(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: flavorsheetKeys.detail(id) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: flavorsheetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: flavorsheetKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: flavorsheetKeys.filterOptions() });
    },
    onError: (error) => {
      console.error('Failed to delete flavorsheet:', error);
    },
  });
};

// Create batch
export const useCreateBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBatchRequest) => flavorsheetService.createBatch(data),
    onSuccess: (newBatch) => {
      // Invalidate batch lists
      queryClient.invalidateQueries({ queryKey: flavorsheetKeys.batches() });
      queryClient.invalidateQueries({ queryKey: flavorsheetKeys.dashboard() });
      
      // Invalidate flavorsheet-specific batches
      if (newBatch.flavorsheet_id) {
        queryClient.invalidateQueries({ 
          queryKey: flavorsheetKeys.batchesForFlavorsheet(newBatch.flavorsheet_id) 
        });
      }
      
      // Add to cache
      queryClient.setQueryData(
        flavorsheetKeys.batchDetail(newBatch.id),
        newBatch
      );
    },
    onError: (error) => {
      console.error('Failed to create batch:', error);
    },
  });
};

// Update batch
export const useUpdateBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateBatchRequest }) =>
      flavorsheetService.updateBatch(id, data),
    onSuccess: (updatedBatch, { id }) => {
      // Update specific batch cache
      queryClient.setQueryData(
        flavorsheetKeys.batchDetail(id),
        updatedBatch
      );
      
      // Invalidate batch lists
      queryClient.invalidateQueries({ queryKey: flavorsheetKeys.batches() });
      queryClient.invalidateQueries({ queryKey: flavorsheetKeys.dashboard() });
      
      // Invalidate flavorsheet-specific batches
      if (updatedBatch.flavorsheet_id) {
        queryClient.invalidateQueries({ 
          queryKey: flavorsheetKeys.batchesForFlavorsheet(updatedBatch.flavorsheet_id) 
        });
      }
    },
    onError: (error) => {
      console.error('Failed to update batch:', error);
    },
  });
};

// Complete batch
export const useCompleteBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      completionData 
    }: { 
      id: string | number; 
      completionData?: {
        actual_weight?: number;
        quality_grade?: string;
        completion_notes?: string;
      } 
    }) => flavorsheetService.completeBatch(Number(id), completionData),
    onSuccess: (completedBatch: any, { id }) => {
      // Update specific batch cache
      queryClient.setQueryData(
        flavorsheetKeys.batchDetail(id),
        completedBatch
      );
      
      // Invalidate all batch-related queries
      queryClient.invalidateQueries({ queryKey: flavorsheetKeys.batches() });
      queryClient.invalidateQueries({ queryKey: flavorsheetKeys.dashboard() });
      
      // Invalidate flavorsheet-specific batches
      if (completedBatch.flavorsheet_id) {
        queryClient.invalidateQueries({ 
          queryKey: flavorsheetKeys.batchesForFlavorsheet(completedBatch.flavorsheet_id) 
        });
      }
    },
    onError: (error) => {
      console.error('Failed to complete batch:', error);
    },
  });
};

// Delete batch
export const useDeleteBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => flavorsheetService.deleteBatch(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: flavorsheetKeys.batchDetail(id) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: flavorsheetKeys.batches() });
      queryClient.invalidateQueries({ queryKey: flavorsheetKeys.dashboard() });
    },
    onError: (error) => {
      console.error('Failed to delete batch:', error);
    },
  });
};

// === PREFETCH HOOKS ===

// Prefetch related data for better UX
export const usePrefetchFlavorsheetData = () => {
  const queryClient = useQueryClient();

  const prefetchFlavorsheet = (id: string | number) => {
    queryClient.prefetchQuery({
      queryKey: flavorsheetKeys.detail(id),
      queryFn: () => flavorsheetService.getFlavorsheetById(id),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchBatchesForFlavorsheet = (flavorsheetId: number) => {
    queryClient.prefetchQuery({
      queryKey: flavorsheetKeys.batchesForFlavorsheet(flavorsheetId),
      queryFn: () => flavorsheetService.getBatchesForFlavorsheet(flavorsheetId),
      staleTime: 2 * 60 * 1000,
    });
  };

  return {
    prefetchFlavorsheet,
    prefetchBatchesForFlavorsheet,
  };
};

// === OPTIMISTIC UPDATES ===

// Optimistic batch status update
export const useOptimisticBatchUpdate = () => {
  const queryClient = useQueryClient();

  const updateBatchOptimistically = (
    batchId: string | number,
    updates: Partial<FlavorsheetBatch>
  ) => {
    queryClient.setQueryData(
      flavorsheetKeys.batchDetail(batchId),
      (oldBatch: FlavorsheetBatch | undefined) => {
        if (!oldBatch) return oldBatch;
        return { ...oldBatch, ...updates };
      }
    );
  };

  return { updateBatchOptimistically };
};

// === LEGACY HOOKS (for backward compatibility) ===

// Hook for admin flavorsheets (legacy)
export const useAdminFlavorsheets = (filters?: FlavorsheetSearchFilters) => {
  return useFlavorsheets(filters);
};

// Hook for flavorsheet detail (legacy)
export const useFlavorsheetDetail = (flavorsheetNo: string) => {
  return useFlavorsheet(flavorsheetNo);
};

// Hook for flavorsheet batch detail (legacy)
export const useFlavorsheetBatchDetail = (itemCode: string, createdTs: string) => {
  return useQuery({
    queryKey: ['flavorsheets', 'batch-detail', itemCode, createdTs],
    queryFn: () => flavorsheetService.getBatchById(`${itemCode}-${createdTs}`),
    enabled: !!itemCode && !!createdTs,
    refetchInterval: 30000,
    staleTime: 5 * 60 * 1000,
  });
};