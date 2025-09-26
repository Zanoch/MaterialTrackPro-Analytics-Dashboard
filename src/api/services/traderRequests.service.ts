import { amplifyApiClient } from "../amplifyClient";
import { API_ENDPOINTS } from "../endpoints";
import { traderRequestsMockService } from "../mockData/traderRequestsMock";
import {
  type TraderRequestsResponse,
  type TraderRequestFilters,
  type TraderRequestEntity,
} from "../../types/trader";

// Toggle between mock and real API
const USE_MOCK_DATA = false;

export const traderRequestsService = {
  // Get trader requests with pagination and search (following shipmentService pattern)
  getTraderRequests: async (
    entity: TraderRequestEntity,
    filters?: TraderRequestFilters
  ): Promise<TraderRequestsResponse> => {
    console.log(`🚀 [TRADER-REQUESTS-API] Starting getTraderRequests API call for ${entity}`);
    console.log('🔍 [TRADER-REQUESTS-API] Filters:', filters);

    // Use mock data for demonstration
    if (USE_MOCK_DATA) {
      return await traderRequestsMockService.getTraderRequests(entity, filters);
    }

    // Build query parameters (following shipmentService pattern)
    const params: Record<string, string> = {};
    if (filters?.limit) params.limit = filters.limit.toString();
    if (filters?.offset) params.offset = filters.offset.toString();
    if (filters?.search) params.search = filters.search;
    if (filters?.start_date) params.start_date = filters.start_date.toString();
    if (filters?.end_date) params.end_date = filters.end_date.toString();

    const endpoint = entity === 'blendsheet'
      ? API_ENDPOINTS.TRADER_REQUESTS.BLENDSHEET
      : API_ENDPOINTS.TRADER_REQUESTS.FLAVORSHEET;

    console.log('📡 [TRADER-REQUESTS-API] API Path:', endpoint);
    console.log('📡 [TRADER-REQUESTS-API] Params:', params);

    // Use amplifyApiClient (following existing pattern)
    const data = await amplifyApiClient.get(endpoint, params);

    console.log('✅ [TRADER-REQUESTS-API] API response received');
    console.log('📊 [TRADER-REQUESTS-API] Requests:', data.data?.length || 0);
    console.log('📊 [TRADER-REQUESTS-API] Total:', data.meta?.total || 0);

    return data;
  },

};