import { amplifyApiClient } from '../amplifyClient';
import { API_ENDPOINTS } from '../endpoints';

export const flavorsheetService = {
  // === OPERATIONS DATA ===
  
  // Get flavorsheet operations data with pagination and KPI metrics
  getOperationsData: async (params: {
    page?: number;
    limit?: number;
    timezone_offset?: string;
    search?: string;
    [key: string]: any;
  }) => {
    try {
      console.log('Fetching flavorsheet operations data with params:', params);
      const response = await amplifyApiClient.get(API_ENDPOINTS.FLAVORSHEET.OPERATIONS_DATA, params);
      
      // Return the full response to preserve both data and meta
      console.log('Flavorsheet operations API response:', response);
      
      return response;
    } catch (error) {
      console.error('Error fetching flavorsheet operations data:', error);
      throw error;
    }
  },
};