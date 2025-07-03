import { amplifyApiClient } from '../amplifyClient';
import { API_ENDPOINTS } from '../endpoints';
import { 
  type FlavorsheetItem, 
  type FlavorsheetBatch,
  type FlavorsheetSearchFilters,
  type FlavorsheetSearchResponse,
  type BatchSearchResponse,
  type FlavorsheetDashboardMetrics,
  type CreateFlavorsheetRequest,
  type CreateBatchRequest,
  type UpdateBatchRequest,
  type SearchContext 
} from '../../types/flavorsheet';

export const flavorsheetService = {
  // === SEARCH OPERATIONS ===
  
  // Search flavorsheets with context-aware endpoints
  searchFlavorsheets: async (
    searchTerm: string, 
    context: SearchContext = 'admin',
    filters?: FlavorsheetSearchFilters
  ): Promise<FlavorsheetSearchResponse> => {
    const endpoints = {
      admin: API_ENDPOINTS.FLAVORSHEET.ADMIN_SEARCH,
      user: API_ENDPOINTS.FLAVORSHEET.USER_SEARCH,
      batch: API_ENDPOINTS.FLAVORSHEET.BATCH_SEARCH,
      advanced: API_ENDPOINTS.FLAVORSHEET.ADMIN_SEARCH, // Use admin for advanced search
    };
    
    try {
      const response = await amplifyApiClient.get(endpoints[context], {
          search: searchTerm,
          ...filters,
        });
      
      const responseData = response?.data || response;
      const rawData = Array.isArray(responseData) ? responseData : responseData?.data || [];
      
      // Transform API response to match our interface
      const transformedData = rawData.map((item: any, index: number) => ({
        id: item.id || index + 1, // Generate ID if missing
        flavor_code: item.flavor_code || '',
        flavorsheet_no: item.flavorsheet_no || '',
        mixtures: [], // API doesn't provide mixtures, we'll need to fetch separately
        created_at: item.created_at || new Date().toISOString(),
        remarks: item.remarks || '',
        batch_created: item.batch_created || false,
      }));
      
      return {
        success: true,
        data: transformedData,
        meta: response?.data || response?.meta || {
          total_results: transformedData.length,
          search_time: 0,
          search_term: searchTerm,
        },
      };
    } catch (error) {
      console.error(`Flavorsheet search error (${context}):`, error);
      return {
        success: false,
        data: [],
        meta: {
          total_results: 0,
          search_time: 0,
          search_term: searchTerm,
        },
      };
    }
  },

  // Search batches specifically
  searchBatches: async (
    searchTerm?: string,
    filters?: FlavorsheetSearchFilters
  ): Promise<BatchSearchResponse> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.FLAVORSHEET.BATCH_SEARCH, {
          search: searchTerm,
          ...filters,
        });
      
      const responseData = response?.data || response;
      const rawData = Array.isArray(responseData) ? responseData : responseData?.data || [];
      
      // Transform batch data and calculate progress for each batch
      const transformedData = rawData.map((batch: any) => ({
        ...batch,
        progress_percentage: calculateBatchProgress(batch),
      }));
      
      return {
        success: true,
        data: transformedData,
        meta: response?.data || response?.meta || {
          total_results: transformedData.length,
          search_time: 0,
        },
      };
    } catch (error) {
      console.error('Batch search error:', error);
      return {
        success: false,
        data: [],
        meta: {
          total_results: 0,
          search_time: 0,
        },
      };
    }
  },

  // === DASHBOARD DATA ===
  
  // Get dashboard summary (with fallback calculations)
  getDashboardSummary: async (): Promise<FlavorsheetDashboardMetrics> => {
    try {
      // Try the dedicated dashboard summary endpoint first
      const response = await amplifyApiClient.get(API_ENDPOINTS.FLAVORSHEET.DASHBOARD_SUMMARY);
      return response?.data || response;
    } catch (error) {
      console.warn('Dashboard summary endpoint not available, calculating client-side');
      
      // Fallback: Calculate metrics from available data
      try {
        const [flavorsheets, batches] = await Promise.all([
          flavorsheetService.getAllFlavorsheets(),
          flavorsheetService.getAllBatches(),
        ]);
        
        const activeBatches = batches.filter(b => !b.completed);
        const completedToday = batches.filter(b => {
          if (!b.completed_at) return false;
          const today = new Date().toDateString();
          return new Date(b.completed_at).toDateString() === today;
        });
        
        const flavorCodes = [...new Set(flavorsheets.map(f => f.flavor_code))];
        const totalMixtures = flavorsheets.reduce((sum, f) => sum + f.mixtures.length, 0);
        const totalBatches = batches.length;
        const completedBatches = batches.filter(b => b.completed).length;
        const efficiency = totalBatches > 0 ? (completedBatches / totalBatches) * 100 : 0;
        
        return {
          active_flavorsheets: flavorsheets.filter(f => !f.batch_created).length,
          batches_in_progress: activeBatches.length,
          completed_today: completedToday.length,
          flavor_varieties: flavorCodes.length,
          total_mixtures: totalMixtures,
          production_efficiency: Number(efficiency.toFixed(1)),
          recent_activity: [], // Would need additional API calls to populate
        };
      } catch (fallbackError) {
        console.error('Fallback dashboard calculation failed:', fallbackError);
        // Return default metrics
        return {
          active_flavorsheets: 0,
          batches_in_progress: 0,
          completed_today: 0,
          flavor_varieties: 0,
          total_mixtures: 0,
          production_efficiency: 0,
          recent_activity: [],
        };
      }
    }
  },

  // === BASIC CRUD OPERATIONS ===
  
  // Get all flavorsheets (admin access)
  getAllFlavorsheets: async (filters?: FlavorsheetSearchFilters): Promise<FlavorsheetItem[]> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.FLAVORSHEET.ADMIN, filters);
      
      const data = Array.isArray(response?.data || response) 
        ? response?.data || response 
        : response?.data || response?.data || response?.data || response?.items || response?.data || response?.results || [];
      
      // Transform API response to match our interface
      const transformedData = data.map((item: any, index: number) => ({
        id: item.id || index + 1, // Generate ID if missing
        flavor_code: item.flavor_code || '',
        flavorsheet_no: item.flavorsheet_no || '',
        mixtures: [], // API doesn't provide mixtures, we'll need to fetch separately
        created_at: item.created_at || new Date().toISOString(),
        remarks: item.remarks || '',
        batch_created: item.batch_created || false,
      }));
      
      console.log('📦 Transformed flavorsheets:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error fetching all flavorsheets:', error);
      return [];
    }
  },

  // Get incomplete flavorsheets (user access)
  getIncompleteFlavorsheets: async (filters?: FlavorsheetSearchFilters): Promise<FlavorsheetItem[]> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.FLAVORSHEET.ALL, filters);
      
      const data = Array.isArray(response?.data || response) 
        ? response?.data || response 
        : response?.data || response?.data || response?.data || response?.items || response?.data || response?.results || [];
      
      // Transform API response to match our interface (same as getAllFlavorsheets)
      const transformedData = data.map((item: any, index: number) => ({
        id: item.id || index + 1, // Generate ID if missing
        flavor_code: item.flavor_code || '',
        flavorsheet_no: item.flavorsheet_no || '',
        mixtures: [], // API doesn't provide mixtures, we'll need to fetch separately
        created_at: item.created_at || new Date().toISOString(),
        remarks: item.remarks || '',
        batch_created: item.batch_created || false,
      }));
      
      console.log('📦 Transformed incomplete flavorsheets:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error fetching incomplete flavorsheets:', error);
      return [];
    }
  },

  // Get all batches
  getAllBatches: async (filters?: FlavorsheetSearchFilters): Promise<FlavorsheetBatch[]> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.FLAVORSHEET.BATCH, filters);
      
      const data = Array.isArray(response?.data || response) 
        ? response?.data || response 
        : response?.data || response?.data || response?.data || response?.items || response?.data || response?.results || [];
      
      // Calculate progress percentage for each batch
      return data.map((batch: any) => ({
        ...batch,
        progress_percentage: calculateBatchProgress(batch),
      }));
    } catch (error) {
      console.error('Error fetching flavorsheet batches:', error);
      return [];
    }
  },

  // Get specific flavorsheet by ID or number
  getFlavorsheetById: async (id: string | number): Promise<FlavorsheetItem | null> => {
    try {
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.FLAVORSHEET.ADMIN}/${id}`);
      return response?.data || response || null;
    } catch (error) {
      console.error(`Error fetching flavorsheet ${id}:`, error);
      return null;
    }
  },

  // Get specific batch by ID
  getBatchById: async (id: string | number): Promise<FlavorsheetBatch | null> => {
    try {
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.FLAVORSHEET.BATCH}/${id}`);
      const batch = response?.data || response;
      
      if (batch) {
        return {
          ...batch,
          progress_percentage: calculateBatchProgress(batch),
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching batch ${id}:`, error);
      return null;
    }
  },

  // === CREATE OPERATIONS ===
  
  // Create new flavorsheet
  createFlavorsheet: async (data: CreateFlavorsheetRequest): Promise<FlavorsheetItem> => {
    const response = await amplifyApiClient.post(API_ENDPOINTS.FLAVORSHEET.ALL, data);
    return response?.data || response;
  },

  // Create new batch
  createBatch: async (data: CreateBatchRequest): Promise<FlavorsheetBatch> => {
    const response = await amplifyApiClient.post(API_ENDPOINTS.FLAVORSHEET.BATCH, data);
    const batch = response?.data || response;
    
    return {
      ...batch,
      progress_percentage: 0, // New batch starts at 0%
    };
  },

  // === UPDATE OPERATIONS ===
  
  // Update flavorsheet
  updateFlavorsheet: async (id: string | number, data: Partial<CreateFlavorsheetRequest>): Promise<FlavorsheetItem> => {
    const response = await amplifyApiClient.put(`${API_ENDPOINTS.FLAVORSHEET.ALL}/${id}`, data);
    return response?.data || response;
  },

  // Update batch
  updateBatch: async (id: string | number, data: UpdateBatchRequest): Promise<FlavorsheetBatch> => {
    const response = await amplifyApiClient.put(`${API_ENDPOINTS.FLAVORSHEET.BATCH}/${id}`, data);
    const batch = response?.data || response;
    
    return {
      ...batch,
      progress_percentage: data.progress_percentage || calculateBatchProgress(batch),
    };
  },

  // Complete batch

  // === DELETE OPERATIONS ===
  
  // Delete flavorsheet
  deleteFlavorsheet: async (id: string | number): Promise<void> => {
    await amplifyApiClient.delete(`${API_ENDPOINTS.FLAVORSHEET.ALL}/${id}`);
  },

  // Delete batch
  deleteBatch: async (id: string | number): Promise<void> => {
    await amplifyApiClient.delete(`${API_ENDPOINTS.FLAVORSHEET.BATCH}/${id}`);
  },

  // === UTILITY FUNCTIONS ===
  
  // Get filter options for dropdowns
  getFilterOptions: async () => {
    try {
      const flavorsheets = await flavorsheetService.getAllFlavorsheets();
      
      const flavorCodes = [...new Set(flavorsheets.map(f => f.flavor_code).filter(Boolean))];
      const mixtureCodes = [...new Set(
        flavorsheets.flatMap(f => f.mixtures.map(m => m.mixture_code)).filter(Boolean)
      )];
      
      return {
        flavorCodes: flavorCodes.sort(),
        mixtureCodes: mixtureCodes.sort(),
        flavorsheetNumbers: [...new Set(flavorsheets.map(f => f.flavorsheet_no).filter(Boolean))].sort(),
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return {
        flavorCodes: [],
        mixtureCodes: [],
        flavorsheetNumbers: [],
      };
    }
  },

  // Get batches for specific flavorsheet
  getBatchesForFlavorsheet: async (flavorsheetId: number): Promise<FlavorsheetBatch[]> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.FLAVORSHEET.BATCH, {
        params: { flavorsheet_id: flavorsheetId },
      });
      
      const data = Array.isArray(response?.data || response) 
        ? response?.data || response 
        : response?.data || response?.data || [];
      
      return data.map((batch: any) => ({
        ...batch,
        progress_percentage: calculateBatchProgress(batch),
      }));
    } catch (error) {
      console.error(`Error fetching batches for flavorsheet ${flavorsheetId}:`, error);
      return [];
    }
  },

  // Complete a batch
  completeBatch: async (batchId: number, completionData?: {
    actual_weight?: number;
    quality_grade?: string;
    completion_notes?: string;
  }): Promise<any> => {
    try {
      const response = await amplifyApiClient.post(`${API_ENDPOINTS.FLAVORSHEET.ADMIN}/batches/${batchId}/complete`, completionData);
      return response?.data || response;
    } catch (error) {
      console.error(`Error completing batch ${batchId}:`, error);
      throw error;
    }
  },
};

// === HELPER FUNCTIONS ===

// Calculate batch progress based on typical duration
function calculateBatchProgress(batch: FlavorsheetBatch): number {
  if (batch.completed) return 100;
  if (batch.progress_percentage !== undefined) return batch.progress_percentage;
  
  const startTime = new Date(batch.created_at);
  const currentTime = new Date();
  const elapsedHours = (currentTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  const typicalDuration = 48; // 48 hours typical batch time
  
  return Math.min((elapsedHours / typicalDuration) * 100, 100);
}