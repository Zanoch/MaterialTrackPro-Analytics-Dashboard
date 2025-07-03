// Blendbalance Type Definitions for Tea Dashboard
// Based on API endpoints: /app/admin/blendbalance, /app/blendbalance

// ===== CORE BLENDBALANCE INTERFACES =====

export interface BlendbalanceItem {
  id: number;
  item_code: string;
  blend_code: string;
  weight: number;
  transfer_id: string;
  created_at: string;
  
  // Enhanced fields (Phase 2 - when API available)
  remaining_weight?: number;
  transferred_weight?: number;
  status?: BlendbalanceStatus;
  source_blend?: string;
  target_blend?: string;
  transfer_type?: TransferType;
  completion_percentage?: number;
  transfer_date?: string;
  completion_date?: string;
  quality_check?: QualityCheck;
  transfer_notes?: string;
  
  // Legacy/API fields
  record_list?: any[];

  // Computed fields (client-side)
  age_days?: number;
  transfer_efficiency?: number;
  completion_status?: CompletionStatus;
  weight_distribution?: WeightDistribution;
}

export interface BlendbalanceTransfer {
  id: string;
  transfer_id: string;
  source_blend_code: string;
  target_blend_code: string;
  planned_weight: number;
  actual_weight?: number;
  transfer_type: TransferType;
  status: BlendbalanceStatus;
  created_at: string;
  transfer_date: string;
  completion_date?: string;
  quality_check?: QualityCheck;
  transfer_notes?: string;
  blendbalance_items: BlendbalanceItem[];
  
  // Computed fields
  completion_percentage: number;
  weight_variance: number;
  transfer_efficiency: number;
}

export interface WeightDistribution {
  source_weight: number;
  target_weight: number;
  transfer_weight: number;
  remaining_weight: number;
  loss_percentage: number;
}

export interface QualityCheck {
  performed_by?: string;
  check_date?: string;
  moisture_content?: number;
  color_grade?: string;
  texture_grade?: string;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
}

// Legacy interface for backward compatibility
export interface BlendbalanceRecord {
  id: number;
  received_ts: string;
  store_location: string;
  bag_weight: number;
  gross_weight: number;
  barcode: string;
  status?: 'ACCEPTED' | 'IN_PROCESS' | 'PROCESSED' | 'DISPATCHED';
  remaining?: number;
}

// ===== BLENDBALANCE STATUS ENUMS =====

export type BlendbalanceStatus = 
  | 'PENDING'       // Transfer planned but not started
  | 'IN_PROGRESS'   // Transfer in progress
  | 'COMPLETED'     // Transfer completed successfully
  | 'QUALITY_CHECK' // Awaiting quality verification
  | 'APPROVED'      // Quality approved, ready for use
  | 'REJECTED';     // Quality rejected, needs rework

export type TransferType =
  | 'BLEND_TO_BLEND'    // Transfer between different blends
  | 'BATCH_TO_BATCH'    // Transfer between batches
  | 'QUALITY_UPGRADE'   // Transfer for quality improvement
  | 'WEIGHT_BALANCE'    // Transfer for weight balancing
  | 'RECIPE_ADJUST';    // Transfer for recipe adjustment

export type CompletionStatus =
  | 'NOT_STARTED'   // Transfer not yet begun
  | 'IN_PROGRESS'   // Transfer ongoing
  | 'COMPLETED'     // Transfer finished
  | 'OVERWEIGHT'    // Transfer exceeded planned weight
  | 'UNDERWEIGHT';  // Transfer below planned weight

// ===== SEARCH INTERFACES =====

export interface BlendbalanceSearchFilters {
  search?: string;
  item_code?: string;
  blend_code?: string;
  transfer_id?: string;
  transfer_type?: TransferType;
  status?: BlendbalanceStatus;
  completion_status?: CompletionStatus;
  weight_min?: number;
  weight_max?: number;
  date_from?: string;
  date_to?: string;
  source_blend?: string;
  target_blend?: string;
  quality_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  // Pagination
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'weight' | 'completion_percentage' | 'transfer_date';
  sort_order?: 'asc' | 'desc';
}

export interface BlendbalanceSearchResponse {
  success: boolean;
  data: BlendbalanceItem[];
  meta: {
    total_results: number;
    search_time: number;
    search_term?: string;
    page?: number;
    limit?: number;
    total_pages?: number;
  };
}

export type SearchContext = 'admin' | 'user' | 'transfer' | 'quality';

// ===== DASHBOARD METRICS INTERFACES =====

export interface BlendbalanceDashboardMetrics {
  // Current metrics (calculable from basic API)
  total_transfers: number;
  total_weight_transferred: number;
  average_transfer_weight: number;
  active_transfers: number;
  
  // Enhanced metrics (Phase 2 - requires enhanced API)
  completed_transfers_today?: number;
  pending_quality_checks?: number;
  average_completion_time?: number; // in hours
  transfer_efficiency?: number; // percentage
  weight_variance_average?: number;
  completion_rate?: number; // percentage
  transfer_type_distribution?: {
    [key in TransferType]: number;
  };
  status_distribution?: {
    [key in BlendbalanceStatus]: number;
  };
  quality_approval_rate?: number;
  recent_activity?: BlendbalanceActivity[];
}

export interface BlendbalanceActivity {
  id: string;
  type: 'TRANSFER_STARTED' | 'TRANSFER_COMPLETED' | 'QUALITY_CHECK' | 'WEIGHT_ADJUSTED';
  transfer_id: string;
  blend_codes: string[];
  description: string;
  timestamp: string;
  user?: string;
  details?: Record<string, any>;
}

// ===== CRUD OPERATION INTERFACES =====

export interface CreateBlendbalanceRequest {
  item_code: string;
  blend_code: string;
  weight: number;
  transfer_id: string;
  transfer_type: TransferType;
  source_blend?: string;
  target_blend?: string;
  transfer_date?: string;
  transfer_notes?: string;
  quality_requirements?: {
    moisture_max?: number;
    color_grade_min?: string;
    texture_requirements?: string;
  };
}

export interface UpdateBlendbalanceRequest {
  weight?: number;
  remaining_weight?: number;
  transferred_weight?: number;
  status?: BlendbalanceStatus;
  completion_percentage?: number;
  completion_date?: string;
  quality_check?: Partial<QualityCheck>;
  transfer_notes?: string;
}

export interface CreateTransferRequest {
  transfer_id: string;
  source_blend_code: string;
  target_blend_code: string;
  planned_weight: number;
  transfer_type: TransferType;
  transfer_date: string;
  quality_requirements?: {
    moisture_max?: number;
    color_grade_min?: string;
    texture_requirements?: string;
  };
  transfer_notes?: string;
}

// ===== UI COMPONENT INTERFACES =====

export interface BlendbalanceTableProps {
  blendbalances: BlendbalanceItem[];
  loading?: boolean;
  onBlendbalanceSelect?: (item: BlendbalanceItem) => void;
  onStartTransfer?: (item: BlendbalanceItem) => void;
  onCompleteTransfer?: (item: BlendbalanceItem) => void;
  selectedItems?: number[];
  onSelectionChange?: (selectedIds: number[]) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export interface BlendbalanceTransferViewProps {
  transfers: BlendbalanceTransfer[];
  loading?: boolean;
  onTransferSelect?: (transfer: BlendbalanceTransfer) => void;
  viewMode?: 'active' | 'completed' | 'all';
  groupBy?: 'status' | 'type' | 'date';
}

export interface TransferDetailsModalProps {
  transfer: BlendbalanceTransfer | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (transfer: BlendbalanceTransfer, updates: UpdateBlendbalanceRequest) => void;
  onQualityCheck?: (transferId: string, qualityData: QualityCheck) => void;
  onComplete?: (transferId: string) => void;
}

export interface BlendbalanceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: BlendbalanceSearchFilters) => void;
  initialFilters?: BlendbalanceSearchFilters;
  filterOptions?: {
    blendCodes: string[];
    transferTypes: TransferType[];
    transferIds: string[];
  };
}

// Legacy interface for backward compatibility
export interface BlendbalanceFilters {
  item_code?: string;
  created_ts?: string;
  blend_code?: string;
  transfer_id?: string;
  store_location?: string;
}

export interface BlendbalanceApiResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

// ===== FILTER OPTIONS INTERFACE =====

export interface BlendbalanceFilterOptions {
  blendCodes: string[];
  transferIds: string[];
  itemCodes: string[];
  transferTypes: string[];
  sourceBlends: string[];
  targetBlends: string[];
  weightRange: {
    min: number;
    max: number;
  };
}

// ===== BLENDBALANCE CONSTANTS =====

export const TRANSFER_TYPES: Record<TransferType, { label: string; icon: string; color: string; description: string }> = {
  BLEND_TO_BLEND: { 
    label: 'Blend to Blend', 
    icon: '⚖️', 
    color: 'blue',
    description: 'Transfer between different blend types' 
  },
  BATCH_TO_BATCH: { 
    label: 'Batch to Batch', 
    icon: '📦', 
    color: 'green',
    description: 'Transfer between production batches' 
  },
  QUALITY_UPGRADE: { 
    label: 'Quality Upgrade', 
    icon: '⭐', 
    color: 'yellow',
    description: 'Transfer for quality improvement' 
  },
  WEIGHT_BALANCE: { 
    label: 'Weight Balance', 
    icon: '⚖️', 
    color: 'purple',
    description: 'Transfer for weight balancing' 
  },
  RECIPE_ADJUST: { 
    label: 'Recipe Adjust', 
    icon: '🔧', 
    color: 'orange',
    description: 'Transfer for recipe adjustment' 
  },
};

export const BLENDBALANCE_STATUS_LABELS: Record<BlendbalanceStatus, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Pending', color: 'gray', icon: '⏳' },
  IN_PROGRESS: { label: 'In Progress', color: 'blue', icon: '🔄' },
  COMPLETED: { label: 'Completed', color: 'green', icon: '✅' },
  QUALITY_CHECK: { label: 'Quality Check', color: 'yellow', icon: '🔍' },
  APPROVED: { label: 'Approved', color: 'green', icon: '✅' },
  REJECTED: { label: 'Rejected', color: 'red', icon: '❌' },
};

export const COMPLETION_STATUS_LABELS: Record<CompletionStatus, { label: string; color: string; icon: string }> = {
  NOT_STARTED: { label: 'Not Started', color: 'gray', icon: '⭕' },
  IN_PROGRESS: { label: 'In Progress', color: 'blue', icon: '🔄' },
  COMPLETED: { label: 'Completed', color: 'green', icon: '✅' },
  OVERWEIGHT: { label: 'Overweight', color: 'orange', icon: '⚠️' },
  UNDERWEIGHT: { label: 'Underweight', color: 'red', icon: '📉' },
};

// ===== UTILITY TYPE GUARDS =====

export function isValidTransferType(type: string): type is TransferType {
  return Object.keys(TRANSFER_TYPES).includes(type as TransferType);
}

export function isValidBlendbalanceStatus(status: string): status is BlendbalanceStatus {
  return Object.keys(BLENDBALANCE_STATUS_LABELS).includes(status as BlendbalanceStatus);
}

export function isValidCompletionStatus(status: string): status is CompletionStatus {
  return Object.keys(COMPLETION_STATUS_LABELS).includes(status as CompletionStatus);
}

// ===== CALCULATION HELPERS =====

export interface BlendbalanceCalculations {
  calculateAge: (createdAt: string) => number;
  calculateTransferEfficiency: (item: BlendbalanceItem) => number;
  calculateCompletionStatus: (item: BlendbalanceItem) => CompletionStatus;
  calculateWeightVariance: (planned: number, actual: number) => number;
  calculateCompletionPercentage: (item: BlendbalanceItem) => number;
  getTransferTypeDistribution: (items: BlendbalanceItem[]) => Record<TransferType, number>;
  getStatusDistribution: (items: BlendbalanceItem[]) => Record<BlendbalanceStatus, number>;
}