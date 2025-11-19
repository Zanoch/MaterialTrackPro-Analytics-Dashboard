import { useQuery } from '@tanstack/react-query';
import { herblineService } from '../api/services/herbline.service';
import type {
  HerblineItem,
  HerblineSearchFilters,
  HerblineFilterOptions,
} from '../types/herbline';

// ===== QUERY KEYS =====
export const herblineKeys = {
  all: ['herblines'] as const,
  dashboard: () => [...herblineKeys.all, 'dashboard'] as const,
  lists: () => [...herblineKeys.all, 'list'] as const,
  list: (filters?: HerblineSearchFilters) => [...herblineKeys.lists(), filters] as const,
  filters: () => [...herblineKeys.all, 'filters'] as const,
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
