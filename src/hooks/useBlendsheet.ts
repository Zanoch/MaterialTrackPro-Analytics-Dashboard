import { useQuery } from '@tanstack/react-query';
import { blendsheetService, type BlendsheetFilters } from '../api/services/blendsheet.service';

export const useBlendsheetOperationsData = (params: {
  page?: number;
  limit?: number;
  timezone_offset?: string;
  filters?: BlendsheetFilters;
}) => {
  return useQuery({
    queryKey: ['blendsheets', 'operations-data', params],
    queryFn: () => blendsheetService.getOperationsData({
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
