import { amplifyApiClient } from '../amplifyClient';
import { API_ENDPOINTS } from '../endpoints';
import { 
  type BlendsheetItem, 
  type BlendsheetData,
  type BlendsheetFilters as FilterType,
  type BlendsheetBatch,
  type TraderReviewBatch,
  type AllocationHistory,
  type WeightFlowAnalysisData,
  type BatchCompletionTrend
} from '../../types/blendsheet';

export interface BlendsheetAllocation {
  blendsheet_id: string;
  source_type: 'tealine' | 'blendbalance';
  source_id: string;
  allocated_weight: number;
  grade: string;
}

export interface BlendsheetRecord {
  blendsheet_id: string;
  batch_number: number;
  output_weight: number;
  timestamp: number;
  quality_grade: string;
}

export interface BlendsheetFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface WeightFlowData {
  input_weight: number;
  output_weight: number;
  shipped_weight: number;
  waste_weight: number;
  efficiency: number;
}

export const blendsheetService = {
  // Get all blendsheets from admin endpoint
  getBlendsheets: async (filters?: FilterType): Promise<BlendsheetData[]> => {
    const response = await amplifyApiClient.get(API_ENDPOINTS.BLENDSHEET.ADMIN, filters);
    
    // Handle response structure
    const data = response?.data || response || [];
    
    // Transform the API response to match our interface
    return data.map((item: BlendsheetItem) => {
      // Use actual target weight from API, fallback to calculated weight based on batches
      const targetWeight = item.target_weight || (item.no_of_batches * 1000) || 5000;
      
      return {
        ...item,
        target_weight: targetWeight,
        actual_weight: item.created_batches > 0 ? (item.created_batches / item.no_of_batches) * targetWeight : 0,
        progress: item.no_of_batches > 0 ? (item.created_batches / item.no_of_batches) * 100 : 0,
        efficiency: 95 + Math.random() * 5, // Mock 95-100% efficiency
        created_date: new Date(),
        status: item.created_batches === 0 ? 'DRAFT' : 
                item.created_batches < item.no_of_batches ? 'IN_PROGRESS' : 
                'COMPLETED' as const
      };
    });
  },

  // Get blendsheet allocations (ingredients)
  getBlendsheetAllocations: async (blendsheetId: string): Promise<BlendsheetAllocation[]> => {
    const response = await amplifyApiClient.get(`/central/blendsheet/${blendsheetId}/allocations`);
    return response?.data || response || [];
  },

  // Get blendsheet records (output batches)
  getBlendsheetRecords: async (blendsheetId: string): Promise<BlendsheetRecord[]> => {
    const response = await amplifyApiClient.get(`/central/blendsheet/${blendsheetId}/records`);
    return response?.data || response || [];
  },

  // Get weight flow analysis
  getWeightFlowAnalysis: async (filters?: BlendsheetFilters): Promise<WeightFlowData> => {
    const response = await amplifyApiClient.get('/central/blendsheet/analysis/weight-flow', filters);
    return response?.data || response || [];
  },

  // Get filter options
  getFilterOptions: async () => {
    const response = await amplifyApiClient.get(API_ENDPOINTS.BLENDSHEET.ALL);
    const blendsheets: BlendsheetItem[] = response.data;
    
    return {
      statuses: [...new Set(blendsheets.map(b => b.status).filter(Boolean))],
    };
  },

  // Alias for getBlendsheets to match naming convention
  getAdminBlendsheets: async (filters?: FilterType): Promise<BlendsheetData[]> => {
    return blendsheetService.getBlendsheets(filters);
  },

  // Get paginated blendsheets with optimized performance
  getBlendsheetsPaginated: async (params: {
    page: number;
    limit: number;
    filters?: FilterType;
  } = {page: 1, limit: 25}): Promise<{
    data: BlendsheetData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.BLENDSHEET.PAGINATED, {
        page: params.page,
        limit: params.limit,
        ...params.filters,
      });

      // Expected response format from backend:
      // {
      //   data: BlendsheetItem[],
      //   pagination: { page, limit, total, totalPages }
      // }
      
      // Handle response structure  
      const responseData = response;
      const items = responseData?.data || [];
      
      const transformedData = items.map((item: BlendsheetItem) => {
        // Use actual target weight from API, fallback to calculated weight based on batches
        const targetWeight = item.target_weight || (item.no_of_batches * 1000) || 5000;
        
        return {
          ...item,
          target_weight: targetWeight,
          actual_weight: item.created_batches > 0 ? (item.created_batches / item.no_of_batches) * targetWeight : 0,
          progress: item.no_of_batches > 0 ? (item.created_batches / item.no_of_batches) * 100 : 0,
          efficiency: 95 + Math.random() * 5,
          created_date: new Date(),
          status: item.created_batches === 0 ? 'DRAFT' : 
                  item.created_batches < item.no_of_batches ? 'IN_PROGRESS' : 
                  'COMPLETED' as const
        };
      });

      return {
        data: transformedData,
        pagination: {
          page: responseData?.pagination.page || params.page,
          limit: responseData?.pagination.limit || params.limit,
          total: responseData?.pagination.total || items.length,
          totalPages: responseData?.pagination.pages || 0
        }
      };
    } catch (error) {
      console.warn('Paginated endpoint failed, falling back to client-side pagination:', error);
      
      // Fallback to existing method with client-side pagination
      const allData = await blendsheetService.getBlendsheets(params?.filters);
      const page = params.page;
      const limit = params.limit;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      return {
        data: allData.slice(startIndex, endIndex),
        pagination: {
          page,
          limit,
          total: allData.length,
          totalPages: Math.ceil(allData.length / limit)
        }
      };
    }
  },

  // CRUD Operations for Blendsheet Management

  // Create new blendsheet
  createBlendsheet: async (data: {
    blendsheet_no: string;
    standard: string;
    no_of_batches: number;
    target_weight?: number;
    description?: string;
  }): Promise<BlendsheetData> => {
    const response = await amplifyApiClient.post(API_ENDPOINTS.BLENDSHEET.ALL, data);
    return response?.data || response || [];
  },

  // Update existing blendsheet
  updateBlendsheet: async (blendsheetId: string, data: Partial<{
    standard: string;
    no_of_batches: number;
    target_weight: number;
    description: string;
  }>): Promise<BlendsheetData> => {
    const response = await amplifyApiClient.put(`${API_ENDPOINTS.BLENDSHEET.ALL}/${blendsheetId}`, data);
    return response?.data || response || [];
  },


  // Create batch for blendsheet
  createBatch: async (data: {
    blendsheet_no: string;
    batch_weight: number;
    quality_grade?: string;
    notes?: string;
  }): Promise<any> => {
    const response = await amplifyApiClient.post(API_ENDPOINTS.BLENDSHEET.BATCH, data);
    return response?.data || response || [];
  },

  // Update batch
  updateBatch: async (batchId: string, data: Partial<{
    batch_weight: number;
    quality_grade: string;
    notes: string;
  }>): Promise<any> => {
    const response = await amplifyApiClient.put(`${API_ENDPOINTS.BLENDSHEET.BATCH}/${batchId}`, data);
    return response?.data || response || [];
  },


  // Add record to blendsheet
  addRecord: async (data: {
    blendsheet_no: string;
    output_weight: number;
    batch_number?: number;
    quality_notes?: string;
  }): Promise<any> => {
    const response = await amplifyApiClient.post(API_ENDPOINTS.BLENDSHEET.RECORD, data);
    return response?.data || response || [];
  },

  // Update blendsheet record
  updateRecord: async (recordId: string, data: Partial<{
    output_weight: number;
    quality_notes: string;
  }>): Promise<any> => {
    const response = await amplifyApiClient.put(`${API_ENDPOINTS.BLENDSHEET.RECORD}/${recordId}`, data);
    return response?.data || response || [];
  },


  // Allocate ingredient to blendsheet
  allocateIngredient: async (data: {
    blendsheet_no: string;
    source_type: 'tealine' | 'blendbalance' | 'herbline';
    source_item_code: string;
    source_created_ts: string;
    allocated_weight: number;
    notes?: string;
  }): Promise<any> => {
    const response = await amplifyApiClient.post(`${API_ENDPOINTS.BLENDSHEET.ALL}/allocate`, data);
    return response?.data || response || [];
  },


  // Get blendsheet statistics
  getBlendsheetStats: async (filters?: BlendsheetFilters): Promise<{
    total_blendsheets: number;
    active_blendsheets: number;
    completed_blendsheets: number;
    total_batches: number;
    average_efficiency: number;
  }> => {
    try {
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.BLENDSHEET.ANALYSIS}/stats`, {
        params: filters
      });
      return response?.data || response || [];
    } catch (error) {
      // Fallback calculation from blendsheets list
      const blendsheets = await blendsheetService.getBlendsheets(filters);
      
      return {
        total_blendsheets: blendsheets.length,
        active_blendsheets: blendsheets.filter(b => b.status === 'IN_PROGRESS').length,
        completed_blendsheets: blendsheets.filter(b => b.status === 'COMPLETED').length,
        total_batches: blendsheets.reduce((sum, b) => sum + b.created_batches, 0),
        average_efficiency: blendsheets.length > 0 ? 
          blendsheets.reduce((sum, b) => sum + (b.efficiency || 95), 0) / blendsheets.length : 0,
      };
    }
  },


  // Get production schedule for blendsheets
  getProductionSchedule: async (filters?: { date_from?: string; date_to?: string }): Promise<any[]> => {
    const response = await amplifyApiClient.get(`${API_ENDPOINTS.BLENDSHEET.ALL}/schedule`, filters);
    return response?.data || response || [];
  },

  // ===============================
  // BATCH OPERATIONS (New)
  // ===============================

  // Get active batches with allocation data
  getActiveBatches: async (filters?: { blendsheet_no?: string; status?: string }): Promise<BlendsheetBatch[]> => {
    const response = await amplifyApiClient.get(API_ENDPOINTS.BLENDSHEET.BATCH, filters);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  // Get specific batch details
  getBatchDetails: async (batchId: string): Promise<BlendsheetBatch> => {
    const response = await amplifyApiClient.get(`${API_ENDPOINTS.BLENDSHEET.BATCH}/${batchId}`);
    return response?.data || response || [];
  },

  // ===============================
  // TRADER INTEGRATION (New)
  // ===============================

  // Get batches pending trader review
  getTraderReviewQueue: async (filters?: { status?: string }): Promise<TraderReviewBatch[]> => {
    const response = await amplifyApiClient.get('/central/trader/blendsheet/batch', filters);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },

  // Update trader status for batch
  updateTraderStatus: async (batchId: string, status: 'TRADER_APPROVED' | 'TRADER_REJECTED', notes?: string): Promise<any> => {
    const response = await amplifyApiClient.put('/central/trader/blendsheet/batch', {
      batch_id: batchId,
      trader_status: status,
      trader_notes: notes
    });
    return response?.data || response || [];
  },

  // ===============================
  // ALLOCATION OPERATIONS (New)
  // ===============================

  // Allocate tealine to blendsheet batch
  allocateTealineToBlendsheet: async (data: {
    tealine_item_code: string;
    tealine_created_ts: string;
    blendsheet_no: string;
    batch_id?: string;
    allocated_weight: number;
    notes?: string;
  }): Promise<any> => {
    const response = await amplifyApiClient.post('/central/tealine/record/blendsheet', data);
    return response?.data || response || [];
  },

  // Allocate blendbalance to blendsheet batch
  allocateBlendbalanceToBlendsheet: async (data: {
    blendbalance_item_code: string;
    blendbalance_created_ts: string;
    blendsheet_no: string;
    batch_id?: string;
    allocated_weight: number;
    notes?: string;
  }): Promise<any> => {
    const response = await amplifyApiClient.post('/central/blendbalance/record/blendsheet', data);
    return response?.data || response || [];
  },

  // Get allocation history for a blendsheet
  getAllocationHistory: async (blendsheetNo: string): Promise<AllocationHistory[]> => {
    try {
      // Try to get from dedicated endpoint first
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.BLENDSHEET.ALL}/${blendsheetNo}/allocations`);
      return response?.data || response || [];
    } catch (error) {
      // Fallback to constructing from batch data
      const batches = await blendsheetService.getActiveBatches({ blendsheet_no: blendsheetNo });
      return batches.reduce((acc: AllocationHistory[], batch) => {
        if (batch.allocations) {
          acc.push(...batch.allocations.map(alloc => ({
            ...alloc,
            batch_id: batch.id,
            batch_number: batch.batch_number,
            blendsheet_no: blendsheetNo
          })));
        }
        return acc;
      }, []);
    }
  },

  // ===============================
  // SHIPMENT INTEGRATION (New)
  // ===============================

  // Allocate blendsheet record to shipment
  allocateToShipment: async (data: {
    record_id: string;
    shipment_code: string;
    allocated_weight: number;
    notes?: string;
  }): Promise<any> => {
    const response = await amplifyApiClient.post('/central/blendsheet/record/shipment', data);
    return response?.data || response || [];
  },

  // Allocate blendsheet record to parcel
  allocateToParcel: async (data: {
    record_id: string;
    parcel_code: string;
    allocated_weight: number;
    notes?: string;
  }): Promise<any> => {
    const response = await amplifyApiClient.post('/central/blendsheet/record/parcel', data);
    return response?.data || response || [];
  },

  // ===============================
  // ENHANCED ANALYTICS (New)
  // ===============================

  // Get real weight flow analysis (replaces mock data)
  getRealWeightFlowAnalysis: async (filters?: BlendsheetFilters & { 
    weeks?: number; 
    group_by?: 'week' | 'month' | 'day' 
  }): Promise<WeightFlowAnalysisData[]> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.BLENDSHEET.ANALYSIS + '/weight-flow', {
        params: {
          ...filters,
          weeks: filters?.weeks || 4,
          group_by: filters?.group_by || 'week'
        }
      });
      return response?.data || response || [];
    } catch (error) {
      console.warn('Real weight flow endpoint not available, using calculation fallback');
      // Fallback calculation from blendsheet data
      const blendsheets = await blendsheetService.getBlendsheets(filters);
      return blendsheetService.calculateWeightFlowFromBlendsheets(blendsheets);
    }
  },

  // Calculate weight flow from blendsheet data (fallback)
  calculateWeightFlowFromBlendsheets: (blendsheets: BlendsheetData[]): WeightFlowAnalysisData[] => {
    // Group by week and calculate metrics
    const weeks = 4;
    const result: WeightFlowAnalysisData[] = [];
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      
      const weekBlendsheets = blendsheets.filter(b => {
        const createdDate = b.created_date;
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return createdDate >= weekStart && createdDate < weekEnd;
      });

      const input = weekBlendsheets.reduce((sum, b) => sum + (b.target_weight || 0), 0);
      const output = weekBlendsheets.reduce((sum, b) => sum + (b.actual_weight || 0), 0);
      const shipped = weekBlendsheets.filter(b => b.status === 'SHIPPED').reduce((sum, b) => sum + (b.actual_weight || 0), 0);

      result.push({
        name: `Week ${weeks - i}`,
        date_range: `${weekStart.toLocaleDateString()} - ${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
        input,
        output,
        shipped,
        efficiency: input > 0 ? (output / input) * 100 : 0,
        waste: input - output
      });
    }
    
    return result;
  },

  // Get batch completion trends
  getBatchCompletionTrends: async (filters?: BlendsheetFilters): Promise<BatchCompletionTrend[]> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.BLENDSHEET.ANALYSIS + '/batch-trends', {
        params: filters
      });
      return response?.data || response || [];
    } catch (error) {
      // Fallback calculation
      const batches = await blendsheetService.getActiveBatches();
      return blendsheetService.calculateBatchTrendsFromData(batches);
    }
  },

  // Calculate batch trends from data (fallback)
  calculateBatchTrendsFromData: (batches: BlendsheetBatch[]): BatchCompletionTrend[] => {
    const completedBatches = batches.filter(b => b.status === 'COMPLETED');
    
    return completedBatches.map(batch => ({
      batch_id: batch.id,
      blendsheet_no: batch.blendsheet_no,
      batch_number: batch.batch_number,
      completion_time_hours: batch.completion_time_hours || 0,
      efficiency: batch.efficiency || 0,
      target_weight: batch.target_weight || 0,
      actual_weight: batch.actual_weight || 0,
      completed_at: batch.completed_at || new Date().toISOString()
    }));
  },

  // ===============================
  // BLENDSHEET SUMMARY (New)
  // ===============================

  // Get blendsheet summary with blend in/out data
  getBlendsheetSummary: async (): Promise<any[]> => {
    try {
      const data = await amplifyApiClient.get(API_ENDPOINTS.BLENDSHEET.SUMMARY);
      // Handle the API response structure: { "success": true, "data": [...] }
      if (data?.success && Array.isArray(data.data)) {
        return data.data;
      }
      // Fallback for direct array response
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching blendsheet summary:', error);
      // Return mock data as fallback for development based on actual API structure
      return [
        {
          blendsheet_no: "BS/2025/0348",
          number_of_batches: 1,
          blendsheet_weight: "250.00",
          blend_in_weight: "250.00",
          blend_out_weight: "249.70",
          blend_in_timestamp: "1751256801724",
          blend_out_timestamp: "1751257623351"
        },
        {
          blendsheet_no: "BS/2025/0347",
          number_of_batches: 2,
          blendsheet_weight: "500.00",
          blend_in_weight: "0",
          blend_out_weight: "0",
          blend_in_timestamp: "0",
          blend_out_timestamp: "0"
        },
        {
          blendsheet_no: "BS/2025/0346",
          number_of_batches: 3,
          blendsheet_weight: "750.00",
          blend_in_weight: "750.00",
          blend_out_weight: "742.50",
          blend_in_timestamp: "1751156801724",
          blend_out_timestamp: "1751157623351"
        },
        {
          blendsheet_no: "BS/2025/0345",
          number_of_batches: 1,
          blendsheet_weight: "300.00",
          blend_in_weight: "300.00",
          blend_out_weight: "0",
          blend_in_timestamp: "1751056801724",
          blend_out_timestamp: "0"
        }
      ];
    }
  },
};