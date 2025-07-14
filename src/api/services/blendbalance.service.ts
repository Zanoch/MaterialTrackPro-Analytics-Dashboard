import { amplifyApiClient } from '../amplifyClient';
import { API_ENDPOINTS } from '../endpoints';
import { 
  type BlendbalanceItem, 
  type BlendbalanceSearchFilters,
  type BlendbalanceSearchResponse,
  type BlendbalanceDashboardMetrics,
  type CreateBlendbalanceRequest,
  type UpdateBlendbalanceRequest,
  type SearchContext,
  type BlendbalanceFilterOptions,
  type BlendbalanceFilters,
  type CompletionStatus,
  type BlendbalanceStatus,
  type TransferType,
  TRANSFER_TYPES,
} from '../../types/blendbalance';

export const blendbalanceService = {
  // === SEARCH OPERATIONS ===
  
  // Search blendbalances with context-aware endpoints
  searchBlendbalances: async (
    searchTerm: string, 
    context: SearchContext = 'admin',
    filters?: BlendbalanceSearchFilters
  ): Promise<BlendbalanceSearchResponse> => {
    const endpoints = {
      admin: `${API_ENDPOINTS.BLENDBALANCE.ADMIN}/search`,
      user: `${API_ENDPOINTS.BLENDBALANCE.ALL}/search`,
      transfer: `${API_ENDPOINTS.BLENDBALANCE.ADMIN}/transfers/search`,
      quality: `${API_ENDPOINTS.BLENDBALANCE.ADMIN}/quality/search`,
    };
    
    try {
      const response = await amplifyApiClient.get(endpoints[context] || endpoints.admin, {
          search: searchTerm,
          ...filters,
        });
      
      const responseData = response?.data || response;
      const data = Array.isArray(responseData) 
        ? responseData 
        : responseData?.data || responseData?.items || responseData?.results || [];
      
      // Transform API response to match our interface
      const transformedData = data.map((item: any, index: number) => ({
        id: item.id || index + 1,
        item_code: item.item_code || '',
        blend_code: item.blend_code || '',
        weight: Number(item.weight) || 0,
        transfer_id: item.transfer_id || '',
        created_at: item.created_at || new Date().toISOString(),
        // Enhanced fields (Phase 2)
        remaining_weight: Number(item.remaining_weight) || 0,
        transferred_weight: Number(item.transferred_weight) || 0,
        status: item.status || 'PENDING',
        source_blend: item.source_blend,
        target_blend: item.target_blend,
        transfer_type: item.transfer_type || 'BLEND_TO_BLEND',
        completion_percentage: item.completion_percentage || calculateCompletionPercentage(item),
        transfer_date: item.transfer_date,
        completion_date: item.completion_date,
        quality_check: item.quality_check,
        transfer_notes: item.transfer_notes,
        // Computed fields
        age_days: calculateAge(item.created_at),
        transfer_efficiency: calculateTransferEfficiency(item),
        completion_status: calculateCompletionStatus(item),
        weight_distribution: calculateWeightDistribution(item),
      }));
      
      console.log('⚖️ Transformed blendbalance search results:', transformedData);
      
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
      console.error(`Blendbalance search error (${context}):`, error);
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

  // === DASHBOARD DATA ===
  
  // Get dashboard summary (with fallback calculations)
  getDashboardSummary: async (): Promise<BlendbalanceDashboardMetrics> => {
    try {
      // Try the dedicated dashboard summary endpoint first
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.BLENDBALANCE.ADMIN}/dashboard-summary`);
      return response?.data || response;
    } catch (error) {
      console.warn('Blendbalance dashboard summary endpoint not available, calculating client-side');
      
      // Fallback: Calculate metrics from available data
      try {
        const blendbalances = await blendbalanceService.getAllBlendbalances();
        
        const totalWeight = blendbalances.reduce((sum, b) => sum + b.weight, 0);
        const averageWeight = blendbalances.length > 0 ? totalWeight / blendbalances.length : 0;
        
        // Calculate active transfers
        const activeTransfers = blendbalances.filter(b => 
          b.status === 'IN_PROGRESS' || b.status === 'QUALITY_CHECK'
        );
        
        // Enhanced metrics (if data available)
        const transferredWeight = blendbalances.reduce((sum, b) => 
          sum + (b.transferred_weight || 0), 0
        );
        
        return {
          total_transfers: blendbalances.length,
          total_weight_transferred: transferredWeight,
          average_transfer_weight: Number(averageWeight.toFixed(1)),
          active_transfers: activeTransfers.length,
        };
      } catch (fallbackError) {
        console.error('Fallback blendbalance dashboard calculation failed:', fallbackError);
        // Return default metrics
        return {
          total_transfers: 0,
          total_weight_transferred: 0,
          average_transfer_weight: 0,
          active_transfers: 0,
        };
      }
    }
  },

  // === BASIC CRUD OPERATIONS ===
  
  // Get all blendbalances (admin access) - Enhanced version
  getAllBlendbalances: async (filters?: BlendbalanceSearchFilters): Promise<BlendbalanceItem[]> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.BLENDBALANCE.ADMIN, filters);
      
      const responseData = response?.data || response;
      const data = Array.isArray(responseData) 
        ? responseData 
        : responseData?.data || responseData?.items || responseData?.results || [];
      
      // Transform API response to match our interface
      const transformedData = data.map((item: any, index: number) => ({
        id: item.id || index + 1,
        item_code: item.item_code || '',
        blend_code: item.blend_code || '',
        weight: Number(item.weight) || 0,
        transfer_id: item.transfer_id || '',
        created_at: item.created_at || new Date().toISOString(),
        // Enhanced fields (Phase 2)
        remaining_weight: Number(item.remaining_weight) || 0,
        transferred_weight: Number(item.transferred_weight) || 0,
        status: item.status || 'PENDING',
        source_blend: item.source_blend,
        target_blend: item.target_blend,
        transfer_type: item.transfer_type || 'BLEND_TO_BLEND',
        completion_percentage: item.completion_percentage || calculateCompletionPercentage(item),
        transfer_date: item.transfer_date,
        completion_date: item.completion_date,
        quality_check: item.quality_check,
        transfer_notes: item.transfer_notes,
        // Computed fields
        age_days: calculateAge(item.created_at),
        transfer_efficiency: calculateTransferEfficiency(item),
        completion_status: calculateCompletionStatus(item),
        weight_distribution: calculateWeightDistribution(item),
      }));
      
      console.log('⚖️ Transformed all blendbalances:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error fetching all blendbalances:', error);
      return [];
    }
  },

  // Get available blendbalances (user access) - Enhanced version
  getAvailableBlendbalances: async (filters?: BlendbalanceSearchFilters): Promise<BlendbalanceItem[]> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.BLENDBALANCE.ALL, filters);
      
      const responseData = response?.data || response;
      const data = Array.isArray(responseData) 
        ? responseData 
        : responseData?.data || responseData?.items || responseData?.results || [];
      
      // Transform and apply same pattern as getAllBlendbalances
      const transformedData = data.map((item: any, index: number) => ({
        id: item.id || index + 1,
        item_code: item.item_code || '',
        blend_code: item.blend_code || '',
        weight: Number(item.weight) || 0,
        transfer_id: item.transfer_id || '',
        created_at: item.created_at || new Date().toISOString(),
        status: item.status || 'PENDING',
        transfer_type: item.transfer_type || 'BLEND_TO_BLEND',
        age_days: calculateAge(item.created_at),
        completion_percentage: calculateCompletionPercentage(item),
        transfer_efficiency: calculateTransferEfficiency(item),
        completion_status: calculateCompletionStatus(item),
      }));
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching available blendbalances:', error);
      return [];
    }
  },

  // Get specific blendbalance by ID - Enhanced version
  getBlendbalanceById: async (id: string | number): Promise<BlendbalanceItem | null> => {
    try {
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.BLENDBALANCE.ADMIN}/${id}`);
      const item = response?.data || response;
      
      if (item) {
        return {
          id: item.id || Number(id),
          item_code: item.item_code || '',
          blend_code: item.blend_code || '',
          weight: Number(item.weight) || 0,
          transfer_id: item.transfer_id || '',
          created_at: item.created_at || new Date().toISOString(),
          status: item.status || 'PENDING',
          transfer_type: item.transfer_type || 'BLEND_TO_BLEND',
          age_days: calculateAge(item.created_at),
          completion_percentage: calculateCompletionPercentage(item),
          transfer_efficiency: calculateTransferEfficiency(item),
          completion_status: calculateCompletionStatus(item),
          weight_distribution: calculateWeightDistribution(item),
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching blendbalance ${id}:`, error);
      return null;
    }
  },

  // === CREATE OPERATIONS ===
  
  // Create new blendbalance item
  createBlendbalance: async (data: CreateBlendbalanceRequest): Promise<BlendbalanceItem> => {
    const response = await amplifyApiClient.post(API_ENDPOINTS.BLENDBALANCE.RECORD, data);
    const item = response?.data || response;
    
    return {
      id: item.id,
      item_code: item.item_code,
      blend_code: item.blend_code,
      weight: item.weight,
      transfer_id: item.transfer_id,
      created_at: item.created_at || new Date().toISOString(),
      source_blend: item.source_blend,
      target_blend: item.target_blend,
      transfer_type: item.transfer_type,
      transfer_date: item.transfer_date,
      transfer_notes: item.transfer_notes,
      status: 'PENDING', // New transfer starts as pending
      age_days: 0, // New transfer
      completion_percentage: 0, // Not started
      transfer_efficiency: 0, // Not yet calculated
      completion_status: 'NOT_STARTED',
    };
  },

  // === UPDATE OPERATIONS ===
  
  // Update blendbalance item
  updateBlendbalance: async (id: string | number, data: UpdateBlendbalanceRequest): Promise<BlendbalanceItem> => {
    const response = await amplifyApiClient.put(`${API_ENDPOINTS.BLENDBALANCE.RECORD}/${id}`, data);
    const item = response?.data || response;
    
    return {
      ...item,
      age_days: calculateAge(item.created_at),
      completion_percentage: calculateCompletionPercentage(item),
      transfer_efficiency: calculateTransferEfficiency(item),
      completion_status: calculateCompletionStatus(item),
      weight_distribution: calculateWeightDistribution(item),
    };
  },

  // === DELETE OPERATIONS ===
  
  // Delete blendbalance item
  deleteBlendbalance: async (id: string | number): Promise<void> => {
    await amplifyApiClient.delete(`${API_ENDPOINTS.BLENDBALANCE.RECORD}/${id}`);
  },

  // === UTILITY FUNCTIONS ===
  
  // Get filter options for dropdowns - Enhanced version
  getFilterOptions: async (): Promise<BlendbalanceFilterOptions> => {
    try {
      const blendbalances = await blendbalanceService.getAllBlendbalances();
      
      const blendCodes = [...new Set(blendbalances.map(b => b.blend_code).filter(Boolean))] as string[];
      const transferIds = [...new Set(blendbalances.map(b => b.transfer_id).filter(Boolean))] as string[];
      const itemCodes = [...new Set(blendbalances.map(b => b.item_code).filter(Boolean))] as string[];
      const transferTypes = [...new Set(blendbalances.map(b => b.transfer_type).filter(Boolean))] as string[];
      const sourceBlends = [...new Set(blendbalances.map(b => b.source_blend).filter(Boolean))] as string[];
      const targetBlends = [...new Set(blendbalances.map(b => b.target_blend).filter(Boolean))] as string[];
      
      const weights = blendbalances.map(b => b.weight).filter(w => w > 0);
      const weightRange = {
        min: weights.length > 0 ? Math.min(...weights) : 0,
        max: weights.length > 0 ? Math.max(...weights) : 100,
      };
      
      return {
        blendCodes: blendCodes.sort(),
        transferIds: transferIds.sort(),
        itemCodes: itemCodes.sort(),
        transferTypes: transferTypes.sort(),
        sourceBlends: sourceBlends.sort(),
        targetBlends: targetBlends.sort(),
        weightRange,
      };
    } catch (error) {
      console.error('Error fetching blendbalance filter options:', error);
      return {
        blendCodes: [],
        transferIds: [],
        itemCodes: [],
        transferTypes: Object.keys(TRANSFER_TYPES),
        sourceBlends: [],
        targetBlends: [],
        weightRange: { min: 0, max: 100 },
      };
    }
  },

  // === LEGACY SUPPORT ===
  
  // Get all blendbalances with admin access (legacy)
  getAdminBlendbalances: async (filters?: BlendbalanceFilters): Promise<BlendbalanceItem[]> => {
    const response = await amplifyApiClient.get(API_ENDPOINTS.BLENDBALANCE.ADMIN, {
      params: filters,
    });
    
    // Check if response?.data || response is an array
    const data = Array.isArray(response?.data || response) 
      ? response?.data || response 
      : response?.data || response?.data || response?.data || response?.items || response?.data || response?.results || [];
    
    if (!Array.isArray(data)) {
      console.error('Unexpected API response structure:', response?.data || response);
      return [];
    }
    
    return data;
  },

  // Get blendbalance detail with records
  getBlendbalanceDetail: async (itemCode: string, createdTs: string): Promise<BlendbalanceItem | null> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.BLENDBALANCE.ADMIN, {
        params: { 
          item_code: itemCode, 
          created_ts: createdTs 
        },
      });
      
      return response?.data || response || null;
    } catch (error) {
      console.error(`Error fetching blendbalance detail for ${itemCode}:`, error);
      return null;
    }
  },

  // Get incomplete blendbalance items (where recorded weight < expected weight)
  getIncompleteBlendbalances: async (filters?: BlendbalanceFilters): Promise<BlendbalanceItem[]> => {
    const response = await amplifyApiClient.get(API_ENDPOINTS.BLENDBALANCE.ALL, {
      params: filters,
    });
    
    // Check if response?.data || response is an array
    const data = Array.isArray(response?.data || response) 
      ? response?.data || response 
      : response?.data || response?.data || response?.data || response?.items || response?.data || response?.results || [];
    
    if (!Array.isArray(data)) {
      console.error('Unexpected API response structure:', response?.data || response);
      return [];
    }
    
    return data;
  },

  // CRUD Operations for Blendbalance Transfer Tracking

  // Create new blendbalance transfer (legacy)
  createBlendbalanceTransfer: async (data: {
    item_code: string;
    blend_code: string;
    transfer_id: string;
    weight: number;
    source_location?: string;
    target_location?: string;
    description?: string;
  }): Promise<BlendbalanceItem> => {
    const response = await amplifyApiClient.post(API_ENDPOINTS.BLENDBALANCE.ALL, data);
    return response?.data || response;
  },

  // Update existing blendbalance (legacy)
  updateBlendbalanceTransfer: async (itemCode: string, createdTs: string, data: Partial<{
    blend_code: string;
    transfer_id: string;
    weight: number;
    source_location: string;
    target_location: string;
    description: string;
  }>): Promise<BlendbalanceItem> => {
    const response = await amplifyApiClient.put(API_ENDPOINTS.BLENDBALANCE.ALL, {
      item_code: itemCode,
      created_ts: createdTs,
      ...data
    });
    return response?.data || response;
  },

  // Delete blendbalance (legacy)
  deleteBlendbalanceTransfer: async (itemCode: string, createdTs: string): Promise<void> => {
    await amplifyApiClient.delete(`${API_ENDPOINTS.BLENDBALANCE.ALL}?item_code=${itemCode}&created_ts=${createdTs}`);
  },

  // Create transfer record
  createRecord: async (data: {
    item_code: string;
    created_ts: string;
    transfer_weight: number;
    transfer_location: string;
    transfer_date?: Date;
    quality_notes?: string;
    transfer_by?: string;
  }): Promise<any> => {
    const response = await amplifyApiClient.post(API_ENDPOINTS.BLENDBALANCE.RECORD, data);
    return response?.data || response;
  },

  // Update transfer record
  updateRecord: async (recordId: string, data: Partial<{
    transfer_weight: number;
    transfer_location: string;
    quality_notes: string;
  }>): Promise<any> => {
    const response = await amplifyApiClient.put(`${API_ENDPOINTS.BLENDBALANCE.RECORD}/${recordId}`, data);
    return response?.data || response;
  },

  // Delete transfer record
  deleteRecord: async (recordId: string): Promise<void> => {
    await amplifyApiClient.delete(`${API_ENDPOINTS.BLENDBALANCE.RECORD}/${recordId}`);
  },

  // Complete transfer

  // Initiate blend transfer
  initiateTransfer: async (data: {
    item_code: string;
    created_ts: string;
    transfer_details: {
      from_location: string;
      to_location: string;
      transfer_weight: number;
      expected_completion: Date;
    };
    transfer_notes?: string;
  }): Promise<any> => {
    const response = await amplifyApiClient.post(`${API_ENDPOINTS.BLENDBALANCE.ALL}/transfer`, data);
    return response?.data || response;
  },


  // Get transfer tracking information
  getTransferTracking: async (itemCode: string, createdTs: string): Promise<{
    current_location: string;
    transfer_history: Array<{
      timestamp: string;
      from_location: string;
      to_location: string;
      weight_transferred: number;
      transfer_by: string;
    }>;
    expected_weight: number;
    actual_weight: number;
    completion_percentage: number;
  }> => {
    try {
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.BLENDBALANCE.ALL}/tracking`, {
        params: { item_code: itemCode, created_ts: createdTs }
      });
      return response?.data || response;
    } catch (error) {
      console.error('Error fetching transfer tracking:', error);
      
      // Fallback calculation
      const detail = await blendbalanceService.getBlendbalanceDetail(itemCode, createdTs);
      if (!detail) {
        return {
          current_location: 'Unknown',
          transfer_history: [],
          expected_weight: 0,
          actual_weight: 0,
          completion_percentage: 0
        };
      }
      
      const recordList = detail.record_list || [];
      const expectedWeight = detail.weight || 0;
      const actualWeight = recordList.reduce((sum: number, record: any) => sum + (record.transfer_weight || 0), 0);
      
      return {
        current_location: recordList.length > 0 ? recordList[recordList.length - 1].transfer_location : 'Unknown',
        transfer_history: recordList.map((record: any) => ({
          timestamp: record.transfer_date || detail.created_at,
          from_location: 'Source',
          to_location: record.transfer_location,
          weight_transferred: record.transfer_weight || 0,
          transfer_by: record.transfer_by || 'Unknown'
        })),
        expected_weight: expectedWeight,
        actual_weight: actualWeight,
        completion_percentage: expectedWeight > 0 ? Math.round((actualWeight / expectedWeight) * 100) : 0
      };
    }
  },

  // Get transfer analytics
  getTransferAnalytics: async (filters?: BlendbalanceFilters): Promise<{
    total_transfers: number;
    completed_transfers: number;
    pending_transfers: number;
    total_weight_transferred: number;
    average_completion_time: number;
    location_distribution: Array<{
      location: string;
      transfer_count: number;
      total_weight: number;
    }>;
  }> => {
    try {
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.BLENDBALANCE.ALL}/analytics`, {
        params: filters
      });
      return response?.data || response;
    } catch (error) {
      // Fallback calculation
      const blendbalances = await blendbalanceService.getAdminBlendbalances(filters);
      
      const transferredWeight = blendbalances.reduce((sum, b) => {
        const transferred = b.record_list?.reduce((recordSum: number, record: any) => recordSum + (record.transfer_weight || 0), 0) || 0;
        return sum + transferred;
      }, 0);
      
      // Group by blend code
      const locationMap = new Map<string, { count: number; weight: number }>();
      blendbalances.forEach(b => {
        const location = b.blend_code || 'Unknown';
        const current = locationMap.get(location) || { count: 0, weight: 0 };
        const transferredForItem = b.record_list?.reduce((sum: number, record: any) => sum + (record.transfer_weight || 0), 0) || 0;
        locationMap.set(location, {
          count: current.count + 1,
          weight: current.weight + transferredForItem
        });
      });
      
      const location_distribution = Array.from(locationMap.entries()).map(([location, data]) => ({
        location,
        transfer_count: data.count,
        total_weight: data.weight
      }));
      
      return {
        total_transfers: blendbalances.length,
        completed_transfers: blendbalances.filter(b => (b.record_list?.length || 0) > 0).length,
        pending_transfers: blendbalances.filter(b => (b.record_list?.length || 0) === 0).length,
        total_weight_transferred: transferredWeight,
        average_completion_time: 24, // Mock value - 24 hours average
        location_distribution,
      };
    }
  },

  // Get pending transfers
  getPendingTransfers: async (): Promise<BlendbalanceItem[]> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.BLENDBALANCE.ALL, {
        params: { status: 'PENDING' }
      });
      
      const responseData = response?.data || response;
      const data = Array.isArray(responseData) 
        ? responseData 
        : responseData?.data || responseData?.items || responseData?.results || [];
      
      return data.filter((item: any) => item.status === 'PENDING');
    } catch (error) {
      console.error('Error fetching pending transfers:', error);
      return [];
    }
  },

  // Get quality check queue
  getQualityCheckQueue: async (): Promise<BlendbalanceItem[]> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.BLENDBALANCE.ALL, {
        params: { status: 'QUALITY_CHECK' }
      });
      
      const responseData = response?.data || response;
      const data = Array.isArray(responseData) 
        ? responseData 
        : responseData?.data || responseData?.items || responseData?.results || [];
      
      return data.filter((item: any) => item.status === 'QUALITY_CHECK');
    } catch (error) {
      console.error('Error fetching quality check queue:', error);
      return [];
    }
  },

  // Search blendbalances by blend code or transfer ID (legacy)
  searchBlendbalancesLegacy: async (searchTerm: string): Promise<BlendbalanceItem[]> => {
    const response = await amplifyApiClient.get(API_ENDPOINTS.BLENDBALANCE.ALL, {
      params: { search: searchTerm }
    });
    
    const data = Array.isArray(response?.data || response) 
      ? response?.data || response 
      : response?.data || response?.data || response?.data || response?.items || response?.data || response?.results || [];
    
    return data;
  },

  // Validate transfer weight
  validateTransferWeight: async (itemCode: string, createdTs: string, proposedWeight: number): Promise<{
    is_valid: boolean;
    available_weight: number;
    reason?: string;
  }> => {
    try {
      const response = await amplifyApiClient.post(`${API_ENDPOINTS.BLENDBALANCE.ALL}/validate-weight`, {
        item_code: itemCode,
        created_ts: createdTs,
        proposed_weight: proposedWeight
      });
      return response?.data || response;
    } catch (error) {
      // Fallback validation
      const detail = await blendbalanceService.getBlendbalanceDetail(itemCode, createdTs);
      if (!detail) {
        return {
          is_valid: false,
          available_weight: 0,
          reason: 'Blendbalance not found'
        };
      }
      
      const totalWeight = detail.weight || 0;
      const transferredWeight = detail.record_list?.reduce((sum: number, record: any) => sum + (record.transfer_weight || 0), 0) || 0;
      const availableWeight = totalWeight - transferredWeight;
      
      return {
        is_valid: proposedWeight <= availableWeight,
        available_weight: availableWeight,
        reason: proposedWeight > availableWeight ? 'Insufficient available weight' : undefined
      };
    }
  },

  // Get transfers by status
  getTransfersByStatus: async (status: BlendbalanceStatus): Promise<BlendbalanceItem[]> => {
    try {
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.BLENDBALANCE.ADMIN}/status/${status}`);
      const data = response?.data || response || [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching transfers by status:', error);
      return [];
    }
  },

  // Get transfers by type
  getTransfersByType: async (transferType: TransferType): Promise<BlendbalanceItem[]> => {
    try {
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.BLENDBALANCE.ADMIN}/type/${transferType}`);
      const data = response?.data || response || [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching transfers by type:', error);
      return [];
    }
  },
};

// === HELPER FUNCTIONS ===

// Calculate age in days
function calculateAge(createdAt: string): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

// Calculate completion percentage
function calculateCompletionPercentage(item: any): number {
  if (item.completion_percentage !== undefined) {
    return item.completion_percentage;
  }
  
  if (item.status === 'COMPLETED' || item.status === 'APPROVED') {
    return 100;
  }
  
  if (item.transferred_weight && item.weight > 0) {
    return Math.min((item.transferred_weight / item.weight) * 100, 100);
  }
  
  return 0;
}

// Calculate transfer efficiency
function calculateTransferEfficiency(item: any): number {
  if (item.transferred_weight && item.weight > 0) {
    const variance = Math.abs(item.transferred_weight - item.weight) / item.weight;
    return Math.max(0, (1 - variance) * 100);
  }
  return 0;
}

// Calculate completion status
function calculateCompletionStatus(item: any): CompletionStatus {
  if (item.status === 'PENDING') return 'NOT_STARTED';
  if (item.status === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (item.status === 'COMPLETED' || item.status === 'APPROVED') {
    if (item.transferred_weight && item.weight > 0) {
      const ratio = item.transferred_weight / item.weight;
      if (ratio > 1.1) return 'OVERWEIGHT';
      if (ratio < 0.9) return 'UNDERWEIGHT';
    }
    return 'COMPLETED';
  }
  return 'NOT_STARTED';
}

// Calculate weight distribution
function calculateWeightDistribution(item: any): any {
  return {
    source_weight: item.weight || 0,
    target_weight: item.transferred_weight || 0,
    transfer_weight: item.transferred_weight || 0,
    remaining_weight: Math.max(0, (item.weight || 0) - (item.transferred_weight || 0)),
    loss_percentage: item.weight > 0 
      ? Math.max(0, ((item.weight - (item.transferred_weight || 0)) / item.weight) * 100)
      : 0,
  };
}