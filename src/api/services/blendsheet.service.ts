import { amplifyApiClient } from "../amplifyClient";
import { API_ENDPOINTS } from "../endpoints";
import {
  type BlendsheetItem,
  type BlendsheetData,
  type BlendsheetFilters as FilterType,
  type BlendsheetBatch,
  type TraderReviewBatch,
} from "../../types/blendsheet";

export interface BlendsheetAllocation {
  blendsheet_id: string;
  source_type: "tealine" | "blendbalance";
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
  page?: number;
  limit?: number;
  timezone_offset?: string;
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
      const targetWeight = item.target_weight || item.no_of_batches * 1000 || 5000;

      return {
        ...item,
        target_weight: targetWeight,
        actual_weight:
          item.created_batches > 0 ? (item.created_batches / item.no_of_batches) * targetWeight : 0,
        progress: item.no_of_batches > 0 ? (item.created_batches / item.no_of_batches) * 100 : 0,
        efficiency: 95 + Math.random() * 5, // Mock 95-100% efficiency
        created_date: new Date(),
        status:
          item.created_batches === 0
            ? "DRAFT"
            : item.created_batches < item.no_of_batches
            ? "IN_PROGRESS"
            : ("COMPLETED" as const),
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
    const response = await amplifyApiClient.get(
      "/central/blendsheet/analysis/weight-flow",
      filters
    );
    return response?.data || response || [];
  },

  // Get filter options
  getFilterOptions: async () => {
    const response = await amplifyApiClient.get(API_ENDPOINTS.BLENDSHEET.ALL);
    const blendsheets: BlendsheetItem[] = response.data;

    return {
      statuses: [...new Set(blendsheets.map((b) => b.status).filter(Boolean))],
    };
  },

  // Alias for getBlendsheets to match naming convention
  getAdminBlendsheets: async (filters?: FilterType): Promise<BlendsheetData[]> => {
    return blendsheetService.getBlendsheets(filters);
  },

  // Get paginated blendsheets with optimized performance
  getBlendsheetsPaginated: async (
    params: {
      page: number;
      limit: number;
      filters?: FilterType;
    } = { page: 1, limit: 25 }
  ): Promise<{
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
        const targetWeight = item.target_weight || item.no_of_batches * 1000 || 5000;

        return {
          ...item,
          target_weight: targetWeight,
          actual_weight:
            item.created_batches > 0
              ? (item.created_batches / item.no_of_batches) * targetWeight
              : 0,
          progress: item.no_of_batches > 0 ? (item.created_batches / item.no_of_batches) * 100 : 0,
          efficiency: 95 + Math.random() * 5,
          created_date: new Date(),
          status:
            item.created_batches === 0
              ? "DRAFT"
              : item.created_batches < item.no_of_batches
              ? "IN_PROGRESS"
              : ("COMPLETED" as const),
        };
      });

      return {
        data: transformedData,
        pagination: {
          page: responseData?.pagination.page || params.page,
          limit: responseData?.pagination.limit || params.limit,
          total: responseData?.pagination.total || items.length,
          totalPages: responseData?.pagination.pages || 0,
        },
      };
    } catch (error) {
      console.warn("Paginated endpoint failed, falling back to client-side pagination:", error);

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
          totalPages: Math.ceil(allData.length / limit),
        },
      };
    }
  },


  // ===============================
  // BATCH OPERATIONS (New)
  // ===============================

  // Get active batches with allocation data
  getActiveBatches: async (filters?: {
    blendsheet_no?: string;
    status?: string;
  }): Promise<BlendsheetBatch[]> => {
    const response = await amplifyApiClient.get(API_ENDPOINTS.BLENDSHEET.BATCH, filters);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },


  // ===============================
  // TRADER INTEGRATION (New)
  // ===============================

  // Get batches pending trader review
  getTraderReviewQueue: async (filters?: { status?: string }): Promise<TraderReviewBatch[]> => {
    const response = await amplifyApiClient.get("/central/trader/blendsheet/batch", filters);
    return Array.isArray(response.data) ? response.data : response.data?.data || [];
  },





  // ===============================
  // BLENDSHEET SUMMARY (New)
  // ===============================

  // Get blendsheet operations data with KPI metrics
  getOperationsData: async (filters?: BlendsheetFilters): Promise<any> => {
    try {
      const response = await amplifyApiClient.get(
        API_ENDPOINTS.BLENDSHEET.OPERATIONS_DATA,
        filters
      );
      return response;
    } catch (error) {
      console.error("Error fetching blendsheet operations data:", error);
      throw error;
    }
  },

};
