import { useQuery } from '@tanstack/react-query';
import { flavorsheetService } from '../api/services/flavorsheet.service';
import type {
  FlavorsheetSearchFilters,
} from '../types/flavorsheet';

// === OPERATIONS DATA HOOKS ===

export const useFlavorsheetOperationsData = (params: {
  page?: number;
  limit?: number;
  timezone_offset?: string;
  filters?: FlavorsheetSearchFilters;
}) => {
  return useQuery({
    queryKey: ['flavorsheets', 'operations-data', params],
    queryFn: () => flavorsheetService.getOperationsData({
      ...params.filters,
      page: params.page,
      limit: params.limit,
      timezone_offset: params.timezone_offset,
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 30, // 30 seconds
    placeholderData: (previousData) => previousData, // Keep previous data during searches (React Query v5)
  });
};