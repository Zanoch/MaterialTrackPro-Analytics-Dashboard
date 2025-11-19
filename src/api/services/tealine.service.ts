import { amplifyApiClient } from '../amplifyClient';
import { API_ENDPOINTS } from '../endpoints';
import {
  type PendingTealineItem,
  type TealineFilters,
  type InventoryCompleteResponse
} from '../../types/tealine';

// Mock data as fallback
const mockPendingTealines: PendingTealineItem[] = [];

export const tealineService = {
  // Get pending tealines with Amplify API
  getPending: async (filters?: TealineFilters) => {
    try {
      const data = await amplifyApiClient.get(
        API_ENDPOINTS.TEALINE.PENDING_OPTIMIZED,
        filters
      );

      // Return the full response object (with success, data, and meta)
      if (data?.success) {
        return data;
      }

      // Fallback for old response format (array of items)
      if (Array.isArray(data)) {
        return {
          success: true,
          data: data,
          meta: {
            total_items: data.length,
            current_page_items: data.length,
            total_pending_bags: 0,
            average_age_days: 0,
            pagination: {
              limit: 25,
              offset: 0,
              total_count: data.length,
              total_pages: Math.ceil(data.length / 25),
              current_page: 1,
              has_next: false,
              has_previous: false,
            },
          },
        };
      }

      console.warn('⚠️ Unexpected response structure, using mock data');
      return {
        success: false,
        data: mockPendingTealines,
        meta: {
          total_items: 0,
          current_page_items: 0,
          total_pending_bags: 0,
          average_age_days: 0,
          pagination: {
            limit: 25,
            offset: 0,
            total_count: 0,
            total_pages: 0,
            current_page: 1,
            has_next: false,
            has_previous: false,
          },
        },
      };
    } catch (error) {
      console.error('❌ [Amplify] Error:', error);
      return {
        success: false,
        data: mockPendingTealines,
        meta: {
          total_items: 0,
          current_page_items: 0,
          total_pending_bags: 0,
          average_age_days: 0,
          pagination: {
            limit: 25,
            offset: 0,
            total_count: 0,
            total_pages: 0,
            current_page: 1,
            has_next: false,
            has_previous: false,
          },
        },
      };
    }
  },

  // Get complete inventory data with pre-calculated allocations and location distribution
  getInventoryComplete: async (filters?: TealineFilters): Promise<InventoryCompleteResponse> => {
    try {
      console.log('🚀 [INVENTORY-COMPLETE] Starting getInventoryComplete function');
      console.log('🔍 [INVENTORY-COMPLETE] Filters:', filters);


      const response = await amplifyApiClient.get(API_ENDPOINTS.TEALINE.INVENTORY_OPTIMIZED, filters);

      console.log('📡 [INVENTORY-COMPLETE] Response received');

      // Handle response structure - the response should already be the complete structure
      const data = response;

      // Return the complete response structure including meta data
      if (data?.success) {
        return data as InventoryCompleteResponse;
      }

      // Return empty structure if API response is not in expected format
      return {
        success: false,
        data: [],
        meta: {
          total_items: 0,
          current_page_items: 0,
          total_inventory_weight: 0,
          total_available_weight: 0,
          pagination: {
            limit: 25,
            offset: 0,
            total_count: 0,
            total_pages: 0,
            current_page: 1,
            has_next: false,
            has_previous: false
          }
        }
      };
    } catch (error) {
      console.error('❌ [INVENTORY-COMPLETE] Error fetching inventory:', error);
      return {
        success: false,
        data: [],
        meta: {
          total_items: 0,
          current_page_items: 0,
          total_inventory_weight: 0,
          total_available_weight: 0,
          pagination: {
            limit: 25,
            offset: 0,
            total_count: 0,
            total_pages: 0,
            current_page: 1,
            has_next: false,
            has_previous: false
          }
        }
      };
    }
  },

};
