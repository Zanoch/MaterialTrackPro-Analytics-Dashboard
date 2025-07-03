// Flavorsheet Types - Tea Dashboard
// Based on API documentation and UI.md specifications

export interface FlavorsheetMixture {
  mixture_code: string;
  weight: number;
  percentage?: number; // Calculated client-side
}

export interface FlavorsheetItem {
  id: number;
  flavor_code: string;
  flavorsheet_no: string;
  mixtures: FlavorsheetMixture[];
  created_at: string;
  remarks?: string;
  batch_created?: boolean;
}

export interface FlavorsheetBatch {
  id: number;
  flavorsheet_id: number;
  batch_no: number;
  completed: boolean;
  created_at: string;
  completed_at?: string;
  flavorsheet: {
    flavor_code: string;
    flavorsheet_no: string;
  };
  progress_percentage?: number; // Calculated client-side
  quality_parameters?: {
    temperature?: number;
    humidity?: number;
    consistency?: 'good' | 'fair' | 'poor';
  };
  checkpoints?: BatchCheckpoint[];
}

export interface BatchCheckpoint {
  name: string;
  completed: boolean;
  timestamp?: string;
}

export interface FlavorsheetRecord {
  id: number;
  batch_id: number;
  received_ts: string;
  store_location: string;
  bag_weight: number;
  gross_weight: number;
  barcode: string;
  status: 'ACCEPTED' | 'IN_PROCESS' | 'PROCESSED' | 'DISPATCHED';
  remaining?: number;
}

// Search-related interfaces
export interface FlavorsheetSearchFilters {
  search?: string;
  flavor_code?: string;
  mixture_code?: string;
  date_from?: string;
  date_to?: string;
  has_batches?: boolean;
  completed_only?: boolean;
}

export interface FlavorsheetSearchResponse {
  success: boolean;
  data: FlavorsheetItem[];
  meta?: {
    total_results: number;
    search_time: number;
    search_term: string;
  };
}

export interface BatchSearchResponse {
  success: boolean;
  data: FlavorsheetBatch[];
  meta?: {
    total_results: number;
    search_time: number;
  };
}

// Dashboard KPI interfaces (calculated client-side until API provides endpoint)
export interface FlavorsheetDashboardMetrics {
  active_flavorsheets: number;
  batches_in_progress: number;
  completed_today: number;
  flavor_varieties: number;
  total_mixtures: number;
  production_efficiency: number;
  recent_activity?: RecentActivity[];
}

export interface RecentActivity {
  type: 'batch_created' | 'batch_completed' | 'flavorsheet_created';
  flavor_code: string;
  timestamp: string;
  details?: string;
}

// Search context types
export type SearchContext = 'admin' | 'user' | 'batch' | 'advanced';

// Status types for batch management
export type BatchStatus = 'in_progress' | 'delayed' | 'completed' | 'failed' | 'paused';

// UI component interfaces
export interface FlavorsheetCardProps {
  flavorsheet: FlavorsheetItem;
  batches?: FlavorsheetBatch[];
  onClick?: (flavorsheet: FlavorsheetItem) => void;
  onCreateBatch?: (flavorsheet: FlavorsheetItem) => void;
}

export interface BatchCardProps {
  batch: FlavorsheetBatch;
  onComplete?: (batch: FlavorsheetBatch) => void;
  onViewDetails?: (batch: FlavorsheetBatch) => void;
}

export interface MixtureVisualizerProps {
  mixtures: FlavorsheetMixture[];
  totalWeight?: number;
  showLabels?: boolean;
}

// Form interfaces for creating/editing
export interface CreateFlavorsheetRequest {
  flavor_code: string;
  flavorsheet_no: string;
  mixture_data: FlavorsheetMixture[];
  remarks?: string;
}

export interface CreateBatchRequest {
  flavorsheet_id: number;
  production_date?: string;
  shift?: 'day' | 'night';
  notes?: string;
}

export interface UpdateBatchRequest {
  completed?: boolean;
  progress_percentage?: number;
  quality_parameters?: {
    temperature?: number;
    humidity?: number;
    consistency?: 'good' | 'fair' | 'poor';
  };
  notes?: string;
}

// Export utilities
export interface FlavorsheetExportData {
  flavor_code: string;
  flavorsheet_no: string;
  total_mixtures: number;
  total_weight: number;
  active_batches: number;
  completed_batches: number;
  last_activity: string;
  status: string;
}

// Error handling
export interface FlavorsheetError {
  code: string;
  message: string;
  details?: any;
}

// Re-export for convenience
export type {
  FlavorsheetMixture as Mixture,
  FlavorsheetItem as Flavorsheet,
  FlavorsheetBatch as Batch,
  FlavorsheetRecord as Record,
};