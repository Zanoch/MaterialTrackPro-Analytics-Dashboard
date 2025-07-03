import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { herblineService } from '../api/services/herbline.service';
import type { 
  HerblineItem,
  HerblineSearchFilters,
  HerblineFilterOptions,
  CreateHerblineRequest,
  UpdateHerblineRequest,
  SearchContext,
  HerbCategory,
  HerblineFilters,
} from '../types/herbline';

// ===== QUERY KEYS =====
export const herblineKeys = {
  all: ['herblines'] as const,
  dashboard: () => [...herblineKeys.all, 'dashboard'] as const,
  lists: () => [...herblineKeys.all, 'list'] as const,
  list: (filters?: HerblineSearchFilters) => [...herblineKeys.lists(), filters] as const,
  search: (searchTerm: string, context: SearchContext, filters?: HerblineSearchFilters) => 
    [...herblineKeys.all, 'search', searchTerm, context, filters] as const,
  details: () => [...herblineKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...herblineKeys.details(), id] as const,
  filters: () => [...herblineKeys.all, 'filters'] as const,
  category: (category: HerbCategory) => [...herblineKeys.all, 'category', category] as const,
  expiring: (daysThreshold: number) => [...herblineKeys.all, 'expiring', daysThreshold] as const,
};

// ===== DASHBOARD HOOKS =====

/**
 * Get herbline dashboard summary metrics
 */
export const useHerblineDashboard = () => {
  return useQuery({
    queryKey: herblineKeys.dashboard(),
    queryFn: herblineService.getDashboardSummary,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
    retry: 2,
  });
};

// ===== DATA FETCHING HOOKS =====

/**
 * Get all herbs (admin access with enhanced data)
 */
export const useHerblines = (filters?: HerblineSearchFilters, enabled = true) => {
  return useQuery({
    queryKey: herblineKeys.list(filters),
    queryFn: () => herblineService.getAllHerbs(filters),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

/**
 * Get available herbs (user access)
 */
export const useAvailableHerblines = (filters?: HerblineSearchFilters, enabled = true) => {
  return useQuery({
    queryKey: [...herblineKeys.lists(), 'available', filters],
    queryFn: () => herblineService.getAvailableHerbs(filters),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });
};

/**
 * Search herbs with context awareness
 */
export const useHerblineSearch = (
  searchTerm: string,
  context: SearchContext = 'admin',
  filters?: HerblineSearchFilters,
  enabled = true
) => {
  return useQuery({
    queryKey: herblineKeys.search(searchTerm, context, filters),
    queryFn: () => herblineService.searchHerbs(searchTerm, context, filters),
    enabled: enabled && searchTerm.length >= 2,
    staleTime: 3 * 60 * 1000, // 3 minutes for search results
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Fewer retries for search
  });
};

/**
 * Get specific herb by ID - Enhanced version
 */
export const useHerblineDetail = (id: string | number, enabled = true) => {
  return useQuery({
    queryKey: herblineKeys.detail(id),
    queryFn: () => herblineService.getHerbById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes for details
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
};

// ===== FILTER AND UTILITY HOOKS =====

/**
 * Get filter options for dropdowns - Enhanced version
 */
export const useHerblineFilterOptions = (): { data: HerblineFilterOptions | undefined } => {
  return useQuery({
    queryKey: herblineKeys.filters(),
    queryFn: herblineService.getFilterOptions,
    staleTime: 10 * 60 * 1000, // 10 minutes for filter options
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });
};

/**
 * Get herbs by category
 */
export const useHerblinesByCategory = (category: HerbCategory, enabled = true) => {
  return useQuery({
    queryKey: herblineKeys.category(category),
    queryFn: () => herblineService.getHerbsByCategory(category),
    enabled: enabled && !!category,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
};

/**
 * Get expiring herbs
 */
export const useExpiringHerblines = (daysThreshold: number = 30, enabled = true) => {
  return useQuery({
    queryKey: herblineKeys.expiring(daysThreshold),
    queryFn: () => herblineService.getExpiringHerbs(daysThreshold),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 60 * 1000, // 1 minute for expiring herbs
    retry: 2,
  });
};

// ===== MUTATION HOOKS =====

/**
 * Create new herb record
 */
export const useCreateHerbline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHerblineRequest) => herblineService.createHerb(data),
    onSuccess: (newHerb) => {
      // Invalidate and refetch herb lists
      queryClient.invalidateQueries({ queryKey: herblineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: herblineKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: herblineKeys.filters() });
      
      // Add the new herb to existing queries if they exist
      queryClient.setQueryData(
        herblineKeys.list(),
        (oldData: HerblineItem[] | undefined) => {
          return oldData ? [newHerb, ...oldData] : [newHerb];
        }
      );
      
      console.log('✅ Created new herb:', newHerb.item_name);
    },
  });
};

/**
 * Update existing herb record
 */
export const useUpdateHerbline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: UpdateHerblineRequest }) =>
      herblineService.updateHerb(id, data),
    onSuccess: (updatedHerb, { id }) => {
      // Update the specific herb in cache
      queryClient.setQueryData(herblineKeys.detail(id), updatedHerb);
      
      // Update the herb in any list queries
      queryClient.setQueriesData(
        { queryKey: herblineKeys.lists() },
        (oldData: HerblineItem[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(herb => 
            herb.id === updatedHerb.id ? updatedHerb : herb
          );
        }
      );
      
      // Invalidate dashboard to recalculate metrics
      queryClient.invalidateQueries({ queryKey: herblineKeys.dashboard() });
      
      console.log('✅ Updated herb:', updatedHerb.item_name);
    },
  });
};

/**
 * Delete herb record
 */
export const useDeleteHerbline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => herblineService.deleteHerb(id),
    onSuccess: (_, deletedId) => {
      // Remove the herb from all list queries
      queryClient.setQueriesData(
        { queryKey: herblineKeys.lists() },
        (oldData: HerblineItem[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.filter(herb => herb.id !== deletedId);
        }
      );
      
      // Remove the specific herb detail from cache
      queryClient.removeQueries({ queryKey: herblineKeys.detail(deletedId) });
      
      // Invalidate dashboard and filters
      queryClient.invalidateQueries({ queryKey: herblineKeys.dashboard() });
      queryClient.invalidateQueries({ queryKey: herblineKeys.filters() });
      
      console.log('✅ Deleted herb with ID:', deletedId);
    },
  });
};

/**
 * Allocate herb to production
 */
export const useAllocateHerbline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (allocation: CreateHerblineRequest) => 
      herblineService.allocateHerb(allocation),
    onSuccess: (_, allocation) => {
      
      // Invalidate all lists to reflect allocation changes
      queryClient.invalidateQueries({ queryKey: herblineKeys.lists() });
      queryClient.invalidateQueries({ queryKey: herblineKeys.dashboard() });
      
      console.log('✅ Allocated herb to production:', allocation);
    },
  });
};

// ===== PREFETCH HOOKS =====

/**
 * Prefetch herb details
 */
export const usePrefetchHerblineDetail = () => {
  const queryClient = useQueryClient();

  return (id: string | number) => {
    queryClient.prefetchQuery({
      queryKey: herblineKeys.detail(id),
      queryFn: () => herblineService.getHerbById(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

/**
 * Prefetch herbs by category
 */
export const usePrefetchHerblinesByCategory = () => {
  const queryClient = useQueryClient();

  return (category: HerbCategory) => {
    queryClient.prefetchQuery({
      queryKey: herblineKeys.category(category),
      queryFn: () => herblineService.getHerbsByCategory(category),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// ===== DERIVED STATE HOOKS =====

/**
 * Get computed herbline statistics
 */
export const useHerblineStatistics = (herbs?: HerblineItem[]) => {
  const { data: allHerbs } = useHerblines(undefined, !herbs);
  const data = herbs || (Array.isArray(allHerbs) ? allHerbs : []) || [];

  const statistics = {
    totalHerbs: data.length,
    totalWeight: data.reduce((sum: number, h: any) => sum + h.weight, 0),
    availableWeight: data.reduce((sum: number, h: any) => sum + (h.remaining_weight || h.weight), 0),
    allocatedWeight: data.reduce((sum: number, h: any) => sum + (h.allocated_weight || 0), 0),
    averageAge: data.length > 0 
      ? data.reduce((sum: number, h: any) => sum + (h.age_days || 0), 0) / data.length 
      : 0,
    categoryCounts: data.reduce((counts: any, h: any) => {
      const category = h.category || 'OTHER';
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {} as Record<string, number>),
    qualityCounts: data.reduce((counts: any, h: any) => {
      const quality = h.quality_grade || 'STANDARD';
      counts[quality] = (counts[quality] || 0) + 1;
      return counts;
    }, {} as Record<string, number>),
    expiringCount: data.filter((h: any) => h.expiry_status === 'EXPIRING_SOON').length,
  };

  return {
    ...statistics,
    utilizationRate: statistics.totalWeight > 0 
      ? ((statistics.totalWeight - statistics.availableWeight) / statistics.totalWeight) * 100 
      : 0,
  };
};

/**
 * Get herbline search suggestions
 */
export const useHerblineSearchSuggestions = (searchTerm: string) => {
  const { data: filterOptions } = useHerblineFilterOptions();
  
  if (!filterOptions || searchTerm.length < 2 || !filterOptions.itemNames || !filterOptions.itemCodes || !filterOptions.categories) {
    return [];
  }

  const term = searchTerm.toLowerCase();
  const suggestions = [];

  // Add matching item names
  const matchingNames = filterOptions.itemNames
    .filter((name: any) => name.toLowerCase().includes(term))
    .slice(0, 3);
  suggestions.push(...matchingNames.map((name: any) => ({ type: 'name', value: name })));

  // Add matching item codes
  const matchingCodes = filterOptions.itemCodes
    .filter((code: any) => code.toLowerCase().includes(term))
    .slice(0, 3);
  suggestions.push(...matchingCodes.map((code: any) => ({ type: 'code', value: code })));

  // Add matching categories
  const matchingCategories = filterOptions.categories
    .filter((cat: any) => cat.toLowerCase().includes(term))
    .slice(0, 2);
  suggestions.push(...matchingCategories.map((cat: any) => ({ type: 'category', value: cat })));

  return suggestions.slice(0, 8); // Limit total suggestions
};

// ===== LEGACY HOOKS (for backward compatibility) =====

/**
 * Hook for admin herblines (legacy)
 */
export const useAdminHerblines = (filters?: HerblineFilters) => {
  return useQuery({
    queryKey: ['herblines', 'admin', filters],
    queryFn: () => herblineService.getAdminHerblines(filters),
    refetchInterval: 30000, // 30 seconds
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for herbline items (user view) (legacy)
 */
export const useHerblineItems = (filters?: HerblineFilters) => {
  return useQuery({
    queryKey: ['herblines', 'items', filters],
    queryFn: () => herblineService.getHerblineItems(filters),
    refetchInterval: 30000,
    staleTime: 5 * 60 * 1000,
  });
};