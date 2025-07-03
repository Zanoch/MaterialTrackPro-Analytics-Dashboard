// Herbline Type Definitions for Tea Dashboard
// Based on API endpoints: /app/admin/herbline/search, /app/herbline/search

// ===== CORE HERBLINE INTERFACES =====

export interface HerblineItem {
  id: number;
  item_code: string;
  purchase_order: string;
  item_name: string;
  weight: number;
  created_at: string;
  
  // Enhanced fields (Phase 2 - when API available)
  remaining_weight?: number;
  allocated_weight?: number;
  status?: HerblineStatus;
  storage_location?: string;
  quality_grade?: QualityGrade;
  expiry_date?: string;
  moisture_content?: number;
  category?: HerbCategory;
  certifications?: string[];
  last_updated?: string;
  allocations?: HerblineAllocation[];
  
  // Legacy/API fields
  record_list?: any[];

  // Computed fields (client-side)
  age_days?: number;
  availability_ratio?: number;
  expiry_status?: ExpiryStatus;
}

export interface HerblineAllocation {
  allocation_type: 'blendsheet_batch' | 'flavorsheet_batch' | 'production_batch';
  allocation_id: string;
  quantity: number;
  allocated_date: string;
  status?: 'PENDING' | 'CONFIRMED' | 'USED';
}

// Legacy interface for backward compatibility
export interface HerblineRecord {
  received_ts: string;
  store_location: string;
  bag_weight: number;
  gross_weight: number;
  reference: string;
  barcode: string;
  remaining: number;
  status?: 'ACCEPTED' | 'IN_PROCESS' | 'PROCESSED' | 'DISPATCHED';
}

// ===== HERBLINE STATUS ENUMS =====

export type HerblineStatus = 
  | 'ACCEPTED'      // Received and accepted
  | 'IN_PROCESS'    // Being processed/prepared
  | 'PROCESSED'     // Ready for allocation
  | 'DISPATCHED';   // Allocated and dispatched

export type QualityGrade =
  | 'PREMIUM'       // Highest quality
  | 'GRADE_A'       // High quality
  | 'STANDARD'      // Standard quality
  | 'GRADE_B';      // Lower quality

export type HerbCategory =
  | 'FLORAL'        // Chamomile, Lavender, Rose
  | 'MEDICINAL'     // Ginger, Turmeric, Echinacea
  | 'CULINARY'      // Mint, Basil, Oregano
  | 'AROMATIC'      // Lemongrass, Citrus peel
  | 'SPICE'         // Cinnamon, Cardamom, Clove
  | 'ROOT'          // Ginger root, Turmeric root
  | 'LEAF'          // Mint leaves, Tea leaves
  | 'FLOWER'        // Chamomile flowers, Rose buds
  | 'OTHER';        // Miscellaneous herbs

export type ExpiryStatus =
  | 'FRESH'         // > 90 days to expiry
  | 'MODERATE'      // 30-90 days to expiry
  | 'EXPIRING_SOON' // < 30 days to expiry
  | 'EXPIRED';      // Past expiry date

// ===== SEARCH INTERFACES =====

export interface HerblineSearchFilters {
  search?: string;
  item_code?: string;
  item_name?: string;
  purchase_order?: string;
  category?: HerbCategory;
  quality_grade?: QualityGrade;
  status?: HerblineStatus;
  weight_min?: number;
  weight_max?: number;
  date_from?: string;
  date_to?: string;
  storage_location?: string;
  expiry_status?: ExpiryStatus;
  certifications?: string[];
  // Pagination
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'weight' | 'item_name' | 'expiry_date';
  sort_order?: 'asc' | 'desc';
}

export interface HerblineSearchResponse {
  success: boolean;
  data: HerblineItem[];
  meta: {
    total_results: number;
    search_time: number;
    search_term?: string;
    page?: number;
    limit?: number;
    total_pages?: number;
  };
}

export type SearchContext = 'admin' | 'user' | 'advanced';

// ===== DASHBOARD METRICS INTERFACES =====

export interface HerblineDashboardMetrics {
  // Current metrics (calculable from basic API)
  total_herb_types: number;
  total_inventory_weight: number;
  average_weight_per_herb: number;
  newest_herbs_count: number; // Last 7 days
  
  // Enhanced metrics (Phase 2 - requires enhanced API)
  total_available_weight?: number;
  total_allocated_weight?: number;
  expiring_soon_count?: number; // < 30 days
  quality_distribution?: {
    [key in QualityGrade]: number;
  };
  category_distribution?: {
    [key in HerbCategory]: number;
  };
  storage_utilization?: {
    location: string;
    total_weight: number;
    herb_count: number;
  }[];
  recent_activity?: HerblineActivity[];
}

export interface HerblineActivity {
  id: string;
  type: 'RECEIVED' | 'ALLOCATED' | 'PROCESSED' | 'MOVED' | 'QUALITY_UPDATE';
  herb_id: number;
  herb_name: string;
  description: string;
  timestamp: string;
  user?: string;
  details?: Record<string, any>;
}

// ===== CRUD OPERATION INTERFACES =====

export interface CreateHerblineRequest {
  item_code: string;
  item_name: string;
  purchase_order: string;
  weight: number;
  storage_location?: string;
  quality_grade?: QualityGrade;
  category?: HerbCategory;
  expiry_date?: string;
  moisture_content?: number;
  certifications?: string[];
  supplier_info?: {
    supplier_name: string;
    batch_number?: string;
    origin_country?: string;
  };
}

export interface UpdateHerblineRequest {
  item_name?: string;
  weight?: number;
  remaining_weight?: number;
  status?: HerblineStatus;
  storage_location?: string;
  quality_grade?: QualityGrade;
  moisture_content?: number;
  expiry_date?: string;
  certifications?: string[];
  notes?: string;
}

export interface AllocateHerblineRequest {
  herb_id: number;
  allocation_type: 'blendsheet_batch' | 'flavorsheet_batch' | 'production_batch';
  target_id: string;
  quantity: number;
  notes?: string;
}

// ===== UI COMPONENT INTERFACES =====

export interface HerblineTableProps {
  herbs: HerblineItem[];
  loading?: boolean;
  onHerbSelect?: (herb: HerblineItem) => void;
  onAllocate?: (herb: HerblineItem) => void;
  onUpdateStatus?: (herb: HerblineItem, status: HerblineStatus) => void;
  selectedHerbs?: number[];
  onSelectionChange?: (selectedIds: number[]) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export interface HerblineCategoryViewProps {
  herbs: HerblineItem[];
  loading?: boolean;
  onHerbSelect?: (herb: HerblineItem) => void;
  viewMode?: 'cards' | 'list';
  groupBy?: 'category' | 'status' | 'quality';
}

export interface HerbDetailsModalProps {
  herb: HerblineItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (herb: HerblineItem, updates: UpdateHerblineRequest) => void;
  onAllocate?: (allocation: AllocateHerblineRequest) => void;
  onDelete?: (herbId: number) => void;
}

export interface HerbSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: HerblineSearchFilters) => void;
  initialFilters?: HerblineSearchFilters;
  filterOptions?: {
    categories: HerbCategory[];
    qualityGrades: QualityGrade[];
    storageLocations: string[];
    certifications: string[];
  };
}

// Legacy interface for backward compatibility
export interface HerblineFilters {
  item_code?: string;
  created_ts?: string;
  item_name?: string;
  purchase_order?: string;
  store_location?: string;
}

export interface HerblineApiResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

// ===== FILTER OPTIONS INTERFACE =====

export interface HerblineFilterOptions {
  categories: string[];
  qualityGrades: string[];
  storageLocations: string[];
  certifications: string[];
  itemCodes: string[];
  purchaseOrders: string[];
  itemNames: string[];
  weightRange: {
    min: number;
    max: number;
  };
}

// ===== HERB CATEGORY CONSTANTS =====

export const HERB_CATEGORIES: Record<HerbCategory, { label: string; icon: string; color: string }> = {
  FLORAL: { label: 'Floral Herbs', icon: '🌸', color: 'pink' },
  MEDICINAL: { label: 'Medicinal Herbs', icon: '🌿', color: 'green' },
  CULINARY: { label: 'Culinary Herbs', icon: '🍃', color: 'lime' },
  AROMATIC: { label: 'Aromatic Herbs', icon: '🌾', color: 'yellow' },
  SPICE: { label: 'Spice Herbs', icon: '🌶️', color: 'orange' },
  ROOT: { label: 'Root Herbs', icon: '🥕', color: 'amber' },
  LEAF: { label: 'Leaf Herbs', icon: '🍀', color: 'emerald' },
  FLOWER: { label: 'Flower Herbs', icon: '🌺', color: 'rose' },
  OTHER: { label: 'Other Herbs', icon: '🌱', color: 'gray' },
};

export const QUALITY_GRADES: Record<QualityGrade, { label: string; color: string; description: string }> = {
  PREMIUM: { label: 'Premium', color: 'gold', description: 'Highest quality, certified organic' },
  GRADE_A: { label: 'Grade A', color: 'green', description: 'High quality, meets all standards' },
  STANDARD: { label: 'Standard', color: 'blue', description: 'Standard quality, commercial grade' },
  GRADE_B: { label: 'Grade B', color: 'orange', description: 'Lower quality, suitable for blending' },
};

export const HERBLINE_STATUS_LABELS: Record<HerblineStatus, { label: string; color: string; icon: string }> = {
  ACCEPTED: { label: 'Accepted', color: 'green', icon: '✅' },
  IN_PROCESS: { label: 'Processing', color: 'yellow', icon: '⚙️' },
  PROCESSED: { label: 'Ready', color: 'blue', icon: '📦' },
  DISPATCHED: { label: 'Dispatched', color: 'purple', icon: '🚚' },
};

// ===== UTILITY TYPE GUARDS =====

export function isValidHerbCategory(category: string): category is HerbCategory {
  return Object.keys(HERB_CATEGORIES).includes(category as HerbCategory);
}

export function isValidQualityGrade(grade: string): grade is QualityGrade {
  return Object.keys(QUALITY_GRADES).includes(grade as QualityGrade);
}

export function isValidHerblineStatus(status: string): status is HerblineStatus {
  return Object.keys(HERBLINE_STATUS_LABELS).includes(status as HerblineStatus);
}

// ===== CALCULATION HELPERS =====

export interface HerblineCalculations {
  calculateAge: (createdAt: string) => number;
  calculateAvailabilityRatio: (herb: HerblineItem) => number;
  calculateExpiryStatus: (expiryDate?: string) => ExpiryStatus;
  calculateTotalWeight: (herbs: HerblineItem[]) => number;
  calculateAvailableWeight: (herbs: HerblineItem[]) => number;
  getCategoryDistribution: (herbs: HerblineItem[]) => Record<HerbCategory, number>;
  getQualityDistribution: (herbs: HerblineItem[]) => Record<QualityGrade, number>;
}