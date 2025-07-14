import { amplifyApiClient } from '../amplifyClient';
import { API_ENDPOINTS } from '../endpoints';
import { 
  type TealineItem, 
  type TealineInventoryItem, 
  type PendingTealineItem, 
  type TealineFilters,
  type InventoryCompleteResponse
} from '../../types/tealine';

// Mock data as fallback
const mockPendingTealines: PendingTealineItem[] = [];
const mockTealineInventory: TealineInventoryItem[] = [];

export const tealineService = {
  // Get pending tealines with Amplify API
  getPending: async (filters?: TealineFilters): Promise<PendingTealineItem[]> => {
    console.log('🚀 [Amplify] Getting pending tealines');
    
    try {
      const data = await amplifyApiClient.get(
        API_ENDPOINTS.TEALINE.PENDING_OPTIMIZED,
        filters
      );
      
      console.log('✅ [Amplify] Response received:', data);
      
      // Handle response structure
      if (data?.success && Array.isArray(data.data)) {
        return data.data;
      }
      
      if (Array.isArray(data)) {
        return data;
      }
      
      console.warn('⚠️ Unexpected response structure, using mock data');
      return mockPendingTealines;
    } catch (error) {
      console.error('❌ [Amplify] Error:', error);
      return mockPendingTealines;
    }
  },

  // Get all tealines
  getAll: async (filters?: TealineFilters): Promise<TealineItem[]> => {
    try {
      const data = await amplifyApiClient.get(
        API_ENDPOINTS.TEALINE.ALL,
        filters
      );
      
      if (Array.isArray(data)) return data;
      if (data?.data && Array.isArray(data.data)) return data.data;
      
      return [];
    } catch (error) {
      console.error('Error fetching tealines:', error);
      return [];
    }
  },

  // Get inventory
  getInventory: async (filters?: TealineFilters): Promise<TealineInventoryItem[]> => {
    try {
      const data = await amplifyApiClient.get(
        API_ENDPOINTS.TEALINE.ALL,
        filters
      );
      
      if (Array.isArray(data)) return data;
      if (data?.data && Array.isArray(data.data)) return data.data;
      
      return mockTealineInventory;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return mockTealineInventory;
    }
  },

  // Get optimized inventory
  getInventoryOptimized: async (filters?: TealineFilters): Promise<InventoryCompleteResponse> => {
    try {
      const data = await amplifyApiClient.get(
        API_ENDPOINTS.TEALINE.INVENTORY_OPTIMIZED,
        filters
      );
      
      return data;
    } catch (error) {
      console.error('Error fetching optimized inventory:', error);
      // Return default structure
      return {
        success: false,
        data: [],
        meta: {
          total_items: 0,
          total_inventory_weight: 0,
          total_available_weight: 0
        }
      };
    }
  },

  // Create record
  createRecord: async (data: any): Promise<any> => {
    return amplifyApiClient.post(API_ENDPOINTS.TEALINE.RECORD, data);
  },

  // Update record
  updateRecord: async (id: string, data: any): Promise<any> => {
    return amplifyApiClient.put(`${API_ENDPOINTS.TEALINE.RECORD}/${id}`, data);
  },

  // Delete record
  deleteRecord: async (id: string): Promise<any> => {
    return amplifyApiClient.delete(`${API_ENDPOINTS.TEALINE.RECORD}/${id}`);
  },

  // Get complete inventory data with pre-calculated allocations and location distribution
  getInventoryComplete: async (filters?: TealineFilters): Promise<InventoryCompleteResponse> => {
    try {
      console.log('🚀 [INVENTORY-COMPLETE] Starting getInventoryComplete function');
      console.log('🔍 [INVENTORY-COMPLETE] Filters:', filters);
      
      const response = await amplifyApiClient.get(API_ENDPOINTS.TEALINE.INVENTORY_OPTIMIZED, filters);
      
      console.log('📡 [INVENTORY-COMPLETE] Response received');
      
      // Handle response structure
      const data = response?.data || response;
      
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
          total_inventory_weight: 0,
          total_available_weight: 0
        }
      };
    } catch (error) {
      console.error('❌ [INVENTORY-COMPLETE] Error fetching inventory:', error);
      return {
        success: false,
        data: [],
        meta: {
          total_items: 0,
          total_inventory_weight: 0,
          total_available_weight: 0
        }
      };
    }
  },

  // Get filter options for dropdowns
  getFilterOptions: async (): Promise<any> => {
    try {
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.TEALINE.ALL}/filters`);
      return response?.data || response || {
        brokers: [],
        gardens: [],
        grades: [],
        locations: []
      };
    } catch (error) {
      console.error('Error fetching tealine filter options:', error);
      return {
        brokers: [],
        gardens: [],
        grades: [],
        locations: []
      };
    }
  },

  // Get records for a specific tealine item
  getRecords: async (itemCode: string, createdTs: string): Promise<any[]> => {
    try {
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.TEALINE.ALL}/records`, {
        item_code: itemCode,
        created_ts: createdTs
      });
      return response?.data || response || [];
    } catch (error) {
      console.error('Error fetching tealine records:', error);
      return [];
    }
  },
};