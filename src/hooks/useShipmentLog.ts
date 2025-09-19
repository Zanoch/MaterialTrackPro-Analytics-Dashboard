import { useQuery } from '@tanstack/react-query';
import { shipmentService } from '../api/services/shipment.service';
import { type ShipmentFilters } from '../types/shipment';

export const useShipmentLog = (filters?: ShipmentFilters) => {
  return useQuery({
    queryKey: ['shipment-log', filters],
    queryFn: () => shipmentService.getShipmentLog(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60, // 1 minute
    placeholderData: (previousData) => previousData, // Keep previous data during searches
  });
};

export const useShipmentFilterOptions = () => {
  return useQuery({
    queryKey: ['shipment-log', 'filter-options'],
    queryFn: () => shipmentService.getFilterOptions(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};