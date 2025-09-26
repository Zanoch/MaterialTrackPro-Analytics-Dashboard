import { useQuery } from '@tanstack/react-query';
import { traderRequestsService } from '../api/services/traderRequests.service';
import {
  type TraderRequestFilters,
  type TraderRequestEntity
} from '../types/trader';

// Main hook for trader requests data (following useShipmentLog pattern)
export const useTraderRequests = (
  entity: TraderRequestEntity,
  filters?: TraderRequestFilters
) => {
  return useQuery({
    queryKey: ['trader-requests', entity, filters],
    queryFn: () => traderRequestsService.getTraderRequests(entity, filters),
    staleTime: 1000 * 60 * 5, // 5 minutes (following shipmentLog pattern)
    refetchInterval: 1000 * 60, // 1 minute (following shipmentLog pattern)
    placeholderData: (previousData) => previousData, // Keep previous data during searches
  });
};

