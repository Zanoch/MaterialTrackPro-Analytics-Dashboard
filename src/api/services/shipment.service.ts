import { get } from 'aws-amplify/api';
import {
  type DispatchedShipmentsResponse,
  type ShipmentFilters,
  type ShipmentFilterOptions
} from '../../types/shipment';

export const shipmentService = {
  // Unified shipment log service - using real API endpoint
  getShipmentLog: async (filters?: ShipmentFilters): Promise<DispatchedShipmentsResponse> => {
    console.log('🚀 [SHIPMENT-LOG-API] Starting getShipmentLog API call');
    console.log('🔍 [SHIPMENT-LOG-API] Filters:', filters);

    // Build query parameters
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const path = `/order/shipment/log${queryString ? `?${queryString}` : ''}`;

    console.log('📡 [SHIPMENT-LOG-API] API Path:', path);

    // Make API call to the optimized endpoint
    const response = await get({
      apiName: 'MTP-API',
      path: path
    }).response;

    console.log('📡 [SHIPMENT-LOG-API] Response status:', response.statusCode);

    const data = await response.body.json() as unknown as DispatchedShipmentsResponse;

    console.log('✅ [SHIPMENT-LOG-API] API response received');
    console.log('📊 [SHIPMENT-LOG-API] Groups:', data.data?.length || 0);
    console.log('📊 [SHIPMENT-LOG-API] Total orders:', data.meta?.total_orders || 0);

    return data;
  }
};
