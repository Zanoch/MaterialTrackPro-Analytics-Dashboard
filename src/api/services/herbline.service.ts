import { amplifyApiClient } from '../amplifyClient';
import { API_ENDPOINTS } from '../endpoints';
import { 
  type HerblineItem, 
  type HerblineSearchFilters,
  type HerblineSearchResponse,
  type HerblineDashboardMetrics,
  type CreateHerblineRequest,
  type UpdateHerblineRequest,
  type SearchContext,
  type HerblineFilterOptions,
  type HerbCategory,
  type QualityGrade,
  type ExpiryStatus,
  type HerblineFilters,
  HERB_CATEGORIES,
  QUALITY_GRADES,
} from '../../types/herbline';

export const herblineService = {
  // === SEARCH OPERATIONS ===
  
  // Search herbs with context-aware endpoints
  searchHerbs: async (
    searchTerm: string, 
    context: SearchContext = 'admin',
    filters?: HerblineSearchFilters
  ): Promise<HerblineSearchResponse> => {
    try {
      // Since search endpoints have SQL issues, use main endpoint and filter client-side
      const allHerbs = await herblineService.getAllHerbs(filters);
      
      // Filter by search term if provided
      const filteredHerbs = searchTerm.length >= 2
        ? allHerbs.filter(herb => 
            herb.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            herb.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            herb.purchase_order?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : allHerbs;
      
      console.log('🌿 Client-side search results:', filteredHerbs.length, 'herbs found');
      
      return {
        success: true,
        data: filteredHerbs,
        meta: {
          total_results: filteredHerbs.length,
          search_time: 0.1,
          search_term: searchTerm,
        },
      };
    } catch (error) {
      console.error(`Herbline search error (${context}):`, error);
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
  getDashboardSummary: async (): Promise<HerblineDashboardMetrics> => {
    try {
      // Try the dedicated dashboard summary endpoint first
      const response = await amplifyApiClient.get(API_ENDPOINTS.HERBLINE.DASHBOARD_SUMMARY);
      return response?.data || response;
    } catch (error) {
      console.warn('Herbline dashboard summary endpoint not available, calculating client-side');
      
      // Fallback: Calculate metrics from available data
      try {
        const herbs = await herblineService.getAllHerbs();
        
        const totalWeight = herbs.reduce((sum, h) => sum + h.weight, 0);
        const averageWeight = herbs.length > 0 ? totalWeight / herbs.length : 0;
        
        // Calculate newest herbs (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newestHerbs = herbs.filter(h => 
          new Date(h.created_at) > sevenDaysAgo
        );
        
        // Enhanced metrics (if data available)
        const availableWeight = herbs.reduce((sum, h) => 
          sum + (h.remaining_weight || h.weight), 0
        );
        const allocatedWeight = herbs.reduce((sum, h) => 
          sum + (h.allocated_weight || 0), 0
        );
        
        // Expiring soon count (< 30 days)
        const expiringSoon = herbs.filter(h => {
          if (!h.expiry_date) return false;
          const daysToExpiry = (new Date(h.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
          return daysToExpiry < 30 && daysToExpiry > 0;
        });
        
        // Category distribution
        const categoryDistribution = herbs.reduce((dist, h) => {
          const category = h.category || 'OTHER';
          dist[category as HerbCategory] = (dist[category as HerbCategory] || 0) + 1;
          return dist;
        }, {} as Record<HerbCategory, number>);
        
        // Quality distribution
        const qualityDistribution = herbs.reduce((dist, h) => {
          const quality = h.quality_grade || 'STANDARD';
          dist[quality as QualityGrade] = (dist[quality as QualityGrade] || 0) + 1;
          return dist;
        }, {} as Record<QualityGrade, number>);
        
        return {
          total_herb_types: herbs.length,
          total_inventory_weight: totalWeight,
          average_weight_per_herb: Number(averageWeight.toFixed(1)),
          newest_herbs_count: newestHerbs.length,
          total_available_weight: availableWeight,
          total_allocated_weight: allocatedWeight,
          expiring_soon_count: expiringSoon.length,
          quality_distribution: qualityDistribution,
          category_distribution: categoryDistribution,
          recent_activity: [], // Would need additional API calls to populate
        };
      } catch (fallbackError) {
        console.error('Fallback herbline dashboard calculation failed:', fallbackError);
        // Return default metrics
        return {
          total_herb_types: 0,
          total_inventory_weight: 0,
          average_weight_per_herb: 0,
          newest_herbs_count: 0,
          total_available_weight: 0,
          total_allocated_weight: 0,
          expiring_soon_count: 0,
          recent_activity: [],
        };
      }
    }
  },

  // === BASIC CRUD OPERATIONS ===
  
  // Get all herbs (admin access) - Enhanced version
  getAllHerbs: async (filters?: HerblineSearchFilters): Promise<HerblineItem[]> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.HERBLINE.ADMIN, filters);
      
      const data = Array.isArray(response?.data || response) 
        ? response?.data || response 
        : response?.data || response?.data || response?.data || response?.items || response?.data || response?.results || [];
      
      // Transform API response to match our interface
      const transformedData = data.map((item: any, index: number) => ({
        id: item.id || index + 1,
        item_code: item.item_code || '',
        item_name: item.item_name || '',
        purchase_order: item.purchase_order || '',
        weight: Number(item.weight) || 0,
        created_at: item.created_at || new Date().toISOString(),
        // Enhanced fields (Phase 2)
        remaining_weight: Number(item.remaining_weight) || 0,
        allocated_weight: Number(item.allocated_weight) || 0,
        status: item.status,
        storage_location: item.storage_location,
        quality_grade: item.quality_grade,
        expiry_date: item.expiry_date,
        moisture_content: item.moisture_content,
        category: item.category || inferHerbCategory(item.item_name),
        certifications: item.certifications || [],
        // Computed fields
        age_days: calculateAge(item.created_at),
        availability_ratio: calculateAvailabilityRatio(item),
        expiry_status: calculateExpiryStatus(item.expiry_date),
      }));
      
      console.log('🌿 Transformed all herbs:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error fetching all herbs:', error);
      return [];
    }
  },

  // Get available herbs (user access) - Enhanced version
  getAvailableHerbs: async (filters?: HerblineSearchFilters): Promise<HerblineItem[]> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.HERBLINE.ALL, filters);
      
      const data = Array.isArray(response?.data || response) 
        ? response?.data || response 
        : response?.data || response?.data || response?.data || response?.items || response?.data || response?.results || [];
      
      // Transform and apply same pattern as getAllHerbs
      const transformedData = data.map((item: any, index: number) => ({
        id: item.id || index + 1,
        item_code: item.item_code || '',
        item_name: item.item_name || '',
        purchase_order: item.purchase_order || '',
        weight: Number(item.weight) || 0,
        created_at: item.created_at || new Date().toISOString(),
        category: item.category || inferHerbCategory(item.item_name),
        age_days: calculateAge(item.created_at),
        availability_ratio: calculateAvailabilityRatio(item),
        expiry_status: calculateExpiryStatus(item.expiry_date),
      }));
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching available herbs:', error);
      return [];
    }
  },
  // Get all herblines with admin access
  getAdminHerblines: async (filters?: HerblineFilters): Promise<HerblineItem[]> => {
    const response = await amplifyApiClient.get(API_ENDPOINTS.HERBLINE.ADMIN, {
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

  // Get herbline detail with records
  getHerblineDetail: async (itemCode: string, createdTs: string): Promise<HerblineItem | null> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.HERBLINE.ADMIN, {
        params: { 
          item_code: itemCode, 
          created_ts: createdTs 
        },
      });
      
      return response?.data || response || null;
    } catch (error) {
      console.error(`Error fetching herbline detail for ${itemCode}:`, error);
      return null;
    }
  },

  // Get herbline items (user view)
  getHerblineItems: async (filters?: HerblineFilters): Promise<HerblineItem[]> => {
    const response = await amplifyApiClient.get(API_ENDPOINTS.HERBLINE.ALL, {
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

  // Get specific herb by ID - Enhanced version
  getHerbById: async (id: string | number): Promise<HerblineItem | null> => {
    try {
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.HERBLINE.ADMIN}/${id}`);
      const item = response?.data || response;
      
      if (item) {
        return {
          id: item.id || Number(id),
          item_code: item.item_code || '',
          item_name: item.item_name || '',
          purchase_order: item.purchase_order || '',
          weight: Number(item.weight) || 0,
          created_at: item.created_at || new Date().toISOString(),
          category: item.category || inferHerbCategory(item.item_name),
          age_days: calculateAge(item.created_at),
          availability_ratio: calculateAvailabilityRatio(item),
          expiry_status: calculateExpiryStatus(item.expiry_date),
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching herb ${id}:`, error);
      return null;
    }
  },

  // === CREATE OPERATIONS ===
  
  // Create new herb record
  createHerb: async (data: CreateHerblineRequest): Promise<HerblineItem> => {
    const response = await amplifyApiClient.post(API_ENDPOINTS.HERBLINE.RECORD, data);
    const item = response?.data || response;
    
    return {
      id: item.id,
      item_code: item.item_code,
      item_name: item.item_name,
      purchase_order: item.purchase_order,
      weight: item.weight,
      created_at: item.created_at || new Date().toISOString(),
      storage_location: item.storage_location,
      quality_grade: item.quality_grade,
      category: item.category || inferHerbCategory(item.item_name),
      expiry_date: item.expiry_date,
      moisture_content: item.moisture_content,
      certifications: item.certifications || [],
      age_days: 0, // New herb
      availability_ratio: 1.0, // Full availability
      expiry_status: calculateExpiryStatus(item.expiry_date),
    };
  },

  // === UPDATE OPERATIONS ===
  
  // Update herb record
  updateHerb: async (id: string | number, data: UpdateHerblineRequest): Promise<HerblineItem> => {
    const response = await amplifyApiClient.put(`${API_ENDPOINTS.HERBLINE.RECORD}/${id}`, data);
    const item = response?.data || response;
    
    return {
      ...item,
      category: item.category || inferHerbCategory(item.item_name),
      age_days: calculateAge(item.created_at),
      availability_ratio: calculateAvailabilityRatio(item),
      expiry_status: calculateExpiryStatus(item.expiry_date),
    };
  },

  // Allocate herb to production
  allocateHerb: async (allocation: CreateHerblineRequest): Promise<void> => {
    await amplifyApiClient.post(API_ENDPOINTS.HERBLINE.ALLOCATIONS, allocation);
  },

  // === DELETE OPERATIONS ===
  
  // Delete herb record
  deleteHerb: async (id: string | number): Promise<void> => {
    await amplifyApiClient.delete(`${API_ENDPOINTS.HERBLINE.RECORD}/${id}`);
  },

  // === UTILITY FUNCTIONS ===
  
  // Get filter options for dropdowns - Enhanced version
  getFilterOptions: async (): Promise<HerblineFilterOptions> => {
    try {
      const herbs = await herblineService.getAllHerbs();
      
      const itemCodes = [...new Set(herbs.map(h => h.item_code).filter(Boolean))] as string[];
      const itemNames = [...new Set(herbs.map(h => h.item_name).filter(Boolean))] as string[];
      const purchaseOrders = [...new Set(herbs.map(h => h.purchase_order).filter(Boolean))] as string[];
      const categories = [...new Set(herbs.map(h => h.category).filter(Boolean))] as string[];
      const qualityGrades = [...new Set(herbs.map(h => h.quality_grade).filter(Boolean))] as string[];
      const storageLocations = [...new Set(herbs.map(h => h.storage_location).filter(Boolean))] as string[];
      const certifications = [...new Set(
        herbs.flatMap(h => h.certifications || []).filter(Boolean)
      )] as string[];
      
      const weights = herbs.map(h => h.weight).filter(w => w > 0);
      const weightRange = {
        min: weights.length > 0 ? Math.min(...weights) : 0,
        max: weights.length > 0 ? Math.max(...weights) : 100,
      };
      
      return {
        itemCodes: itemCodes.sort(),
        itemNames: itemNames.sort(),
        purchaseOrders: purchaseOrders.sort(),
        categories: categories.sort(),
        qualityGrades: qualityGrades.sort(),
        storageLocations: storageLocations.sort(),
        certifications: certifications.sort(),
        weightRange,
      };
    } catch (error) {
      console.error('Error fetching herbline filter options:', error);
      return {
        itemCodes: [],
        itemNames: [],
        purchaseOrders: [],
        categories: Object.keys(HERB_CATEGORIES),
        qualityGrades: Object.keys(QUALITY_GRADES),
        storageLocations: [],
        certifications: [],
        weightRange: { min: 0, max: 100 },
      };
    }
  },

  // Get herbs by category
  getHerbsByCategory: async (category: HerbCategory): Promise<HerblineItem[]> => {
    try {
      const herbs = await herblineService.getAllHerbs();
      return herbs.filter(h => h.category === category);
    } catch (error) {
      console.error(`Error fetching herbs for category ${category}:`, error);
      return [];
    }
  },

  // Get expiring herbs
  getExpiringHerbs: async (daysThreshold: number = 30): Promise<HerblineItem[]> => {
    try {
      const herbs = await herblineService.getAllHerbs();
      return herbs.filter(h => {
        if (!h.expiry_date) return false;
        const daysToExpiry = (new Date(h.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysToExpiry < daysThreshold && daysToExpiry > 0;
      });
    } catch (error) {
      console.error('Error fetching expiring herbs:', error);
      return [];
    }
  },

  // CRUD Operations for Herbline Storage Management

  // Create new herbline
  createHerbline: async (data: {
    item_code: string;
    item_name: string;
    weight: number;
    purchase_order?: string;
    supplier?: string;
    description?: string;
  }): Promise<HerblineItem> => {
    const response = await amplifyApiClient.post(API_ENDPOINTS.HERBLINE.ALL, data);
    return response?.data || response;
  },

  // Update existing herbline
  updateHerbline: async (itemCode: string, createdTs: string, data: Partial<{
    item_name: string;
    weight: number;
    purchase_order: string;
    supplier: string;
    description: string;
  }>): Promise<HerblineItem> => {
    const response = await amplifyApiClient.put(API_ENDPOINTS.HERBLINE.ALL, {
      item_code: itemCode,
      created_ts: createdTs,
      ...data
    });
    return response?.data || response;
  },

  // Delete herbline
  deleteHerbline: async (itemCode: string, createdTs: string): Promise<void> => {
    await amplifyApiClient.delete(`${API_ENDPOINTS.HERBLINE.ALL}?item_code=${itemCode}&created_ts=${createdTs}`);
  },

  // Create storage record for herbline
  createRecord: async (data: {
    item_code: string;
    created_ts: string;
    gross_weight: number;
    bag_weight: number;
    store_location: string;
    remaining?: number;
    notes?: string;
  }): Promise<any> => {
    const response = await amplifyApiClient.post(API_ENDPOINTS.HERBLINE.RECORD, data);
    return response?.data || response;
  },

  // Update herbline record
  updateRecord: async (recordId: string, data: Partial<{
    gross_weight: number;
    bag_weight: number;
    store_location: string;
    remaining: number;
    notes: string;
  }>): Promise<any> => {
    const response = await amplifyApiClient.put(`${API_ENDPOINTS.HERBLINE.RECORD}/${recordId}`, data);
    return response?.data || response;
  },

  // Delete herbline record
  deleteRecord: async (recordId: string): Promise<void> => {
    await amplifyApiClient.delete(`${API_ENDPOINTS.HERBLINE.RECORD}/${recordId}`);
  },

  // Batch create multiple storage records
  batchCreateRecords: async (data: {
    item_code: string;
    created_ts: string;
    records: Array<{
      gross_weight: number;
      bag_weight: number;
      store_location: string;
    }>;
    received_by: string;
  }): Promise<any[]> => {
    const response = await amplifyApiClient.post(`${API_ENDPOINTS.HERBLINE.RECORD}/batch`, data);
    return response?.data || response;
  },

  // Allocate herbline to production
  allocateToProduction: async (data: {
    item_code: string;
    created_ts: string;
    allocation_weight: number;
    target_type: 'blendsheet' | 'flavorsheet';
    target_id: string;
    notes?: string;
  }): Promise<any> => {
    const response = await amplifyApiClient.post(`${API_ENDPOINTS.HERBLINE.ALL}/allocate`, data);
    return response?.data || response;
  },

  // Update allocation
  updateAllocation: async (allocationId: string, data: Partial<{
    allocation_weight: number;
    notes: string;
  }>): Promise<any> => {
    const response = await amplifyApiClient.put(`${API_ENDPOINTS.HERBLINE.ALL}/allocation/${allocationId}`, data);
    return response?.data || response;
  },

  // Remove allocation
  removeAllocation: async (allocationId: string): Promise<void> => {
    await amplifyApiClient.delete(`${API_ENDPOINTS.HERBLINE.ALL}/allocation/${allocationId}`);
  },


  // Get storage analytics
  getStorageAnalytics: async (filters?: HerblineFilters): Promise<{
    total_items: number;
    total_weight: number;
    remaining_weight: number;
    storage_locations: Array<{
      location: string;
      item_count: number;
      total_weight: number;
    }>;
    utilization_rate: number;
  }> => {
    try {
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.HERBLINE.ALL}/analytics`, {
        params: filters
      });
      return response?.data || response;
    } catch (error) {
      // Fallback calculation
      const herblines = await herblineService.getAdminHerblines(filters);
      
      const totalWeight = herblines.reduce((sum, h) => sum + (h.weight || 0), 0);
      const remainingWeight = herblines.reduce((sum, h) => {
        const remaining = h.record_list?.reduce((recordSum: number, record: any) => recordSum + (record.remaining || 0), 0) || 0;
        return sum + remaining;
      }, 0);
      
      // Group by location
      const locationMap = new Map<string, { count: number; weight: number }>();
      herblines.forEach(h => {
        h.record_list?.forEach((record: any) => {
          const location = record.store_location || 'Unknown';
          const current = locationMap.get(location) || { count: 0, weight: 0 };
          locationMap.set(location, {
            count: current.count + 1,
            weight: current.weight + (record.remaining || 0)
          });
        });
      });
      
      const storage_locations = Array.from(locationMap.entries()).map(([location, data]) => ({
        location,
        item_count: data.count,
        total_weight: data.weight
      }));
      
      return {
        total_items: herblines.length,
        total_weight: totalWeight,
        remaining_weight: remainingWeight,
        storage_locations,
        utilization_rate: totalWeight > 0 ? Math.round(((totalWeight - remainingWeight) / totalWeight) * 100) : 0,
      };
    }
  },

  // Search herblines by item name or code
  searchHerblines: async (searchTerm: string): Promise<HerblineItem[]> => {
    const response = await amplifyApiClient.get(API_ENDPOINTS.HERBLINE.ALL, {
      params: { search: searchTerm }
    });
    
    const data = Array.isArray(response?.data || response) 
      ? response?.data || response 
      : response?.data || response?.data || response?.data || response?.items || response?.data || response?.results || [];
    
    return data;
  },

  // Get quality control information
  getQualityInfo: async (itemCode: string, createdTs: string): Promise<{
    quality_grade?: string;
    moisture_content?: number;
    purity_percentage?: number;
    last_tested?: string;
    test_results?: any[];
  }> => {
    try {
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.HERBLINE.ALL}/quality`, {
        params: { item_code: itemCode, created_ts: createdTs }
      });
      return response?.data || response;
    } catch (error) {
      console.error('Error fetching quality info:', error);
      return {};
    }
  },
};

// === HELPER FUNCTIONS ===

// Calculate herb age in days
function calculateAge(createdAt: string): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

// Calculate availability ratio
function calculateAvailabilityRatio(herb: any): number {
  if (herb.remaining_weight !== undefined && herb.weight > 0) {
    return herb.remaining_weight / herb.weight;
  }
  return 1.0; // Default to full availability if no allocation data
}

// Calculate expiry status
function calculateExpiryStatus(expiryDate?: string): ExpiryStatus {
  if (!expiryDate) return 'FRESH';
  
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysToExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysToExpiry < 0) return 'EXPIRED';
  if (daysToExpiry < 30) return 'EXPIRING_SOON';
  if (daysToExpiry < 90) return 'MODERATE';
  return 'FRESH';
}

// Infer herb category from name
function inferHerbCategory(itemName: string): HerbCategory {
  const name = itemName.toLowerCase();
  
  // Floral herbs
  if (name.includes('chamomile') || name.includes('lavender') || name.includes('rose') || 
      name.includes('jasmine') || name.includes('hibiscus')) {
    return 'FLORAL';
  }
  
  // Medicinal herbs  
  if (name.includes('ginger') || name.includes('turmeric') || name.includes('echinacea') ||
      name.includes('ginseng') || name.includes('astragalus')) {
    return 'MEDICINAL';
  }
  
  // Culinary herbs
  if (name.includes('mint') || name.includes('basil') || name.includes('oregano') ||
      name.includes('thyme') || name.includes('rosemary')) {
    return 'CULINARY';
  }
  
  // Spice herbs
  if (name.includes('cinnamon') || name.includes('cardamom') || name.includes('clove') ||
      name.includes('pepper') || name.includes('nutmeg')) {
    return 'SPICE';
  }
  
  // Root herbs
  if (name.includes('root') || name.includes('ginger') || name.includes('turmeric')) {
    return 'ROOT';
  }
  
  // Flower herbs
  if (name.includes('flower') || name.includes('bud') || name.includes('petal')) {
    return 'FLOWER';
  }
  
  // Leaf herbs
  if (name.includes('leaf') || name.includes('leaves')) {
    return 'LEAF';
  }
  
  // Aromatic herbs
  if (name.includes('lemongrass') || name.includes('citrus') || name.includes('bergamot')) {
    return 'AROMATIC';
  }
  
  return 'OTHER';
}