import { useQuery } from '@tanstack/react-query';
import { blendsheetService, type BlendsheetFilters } from '../api/services/blendsheet.service';

export const useBlendsheets = (filters?: BlendsheetFilters) => {
  return useQuery({
    queryKey: ['blendsheets', filters],
    queryFn: () => blendsheetService.getBlendsheets(filters),
    refetchInterval: 30000, // 30 seconds
  });
};

export const useBlendsheetAllocations = (blendsheetId: string) => {
  return useQuery({
    queryKey: ['blendsheet-allocations', blendsheetId],
    queryFn: () => blendsheetService.getBlendsheetAllocations(blendsheetId),
    enabled: !!blendsheetId,
  });
};

export const useBlendsheetRecords = (blendsheetId: string) => {
  return useQuery({
    queryKey: ['blendsheet-records', blendsheetId],
    queryFn: () => blendsheetService.getBlendsheetRecords(blendsheetId),
    enabled: !!blendsheetId,
  });
};

export const useWeightFlowAnalysis = (filters?: BlendsheetFilters) => {
  return useQuery({
    queryKey: ['weight-flow-analysis', filters],
    queryFn: () => blendsheetService.getWeightFlowAnalysis(filters),
    refetchInterval: 30000, // 30 seconds
  });
};

export const useBlendsheetFilterOptions = () => {
  return useQuery({
    queryKey: ['blendsheet-filter-options'],
    queryFn: blendsheetService.getFilterOptions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAdminBlendsheets = (filters?: BlendsheetFilters) => {
  return useQuery({
    queryKey: ['admin-blendsheets', filters],
    queryFn: () => blendsheetService.getAdminBlendsheets(filters),
    refetchInterval: 30000, // 30 seconds
  });
};

export const useBlendsheetsPaginated = (params: {
  page: number;
  limit: number;
  filters?: BlendsheetFilters;
}) => {
  return useQuery({
    queryKey: ['blendsheets-paginated', params],
    queryFn: () => blendsheetService.getBlendsheetsPaginated(params),
    refetchInterval: 30000, // 30 seconds
    staleTime: 25000, // 25 seconds
  });
};

// ===============================
// BATCH OPERATIONS HOOKS (New)
// ===============================

export const useActiveBatches = (filters?: { blendsheet_no?: string; status?: string }, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['blendsheet-active-batches', filters],
    queryFn: () => blendsheetService.getActiveBatches(filters),
    refetchInterval: 30000, // 30 seconds
    staleTime: 25000, // 25 seconds
    retry: false, // Don't retry on 404/500 errors
    enabled: options?.enabled ?? true,
  });
};

export const useTraderReviewQueue = (filters?: BlendsheetFilters, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['trader-review-queue', filters],
    queryFn: () => blendsheetService.getTraderReviewQueue(filters),
    refetchInterval: 30000, // 30 seconds
    retry: false, // Don't retry on 404/500 errors
    enabled: options?.enabled ?? true,
  });
};

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
