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
