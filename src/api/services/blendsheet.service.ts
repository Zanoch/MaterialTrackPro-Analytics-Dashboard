import { amplifyApiClient } from "../amplifyClient";
import { API_ENDPOINTS } from "../endpoints";

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
