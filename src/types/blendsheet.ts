// Blendsheet API Response Types
export interface BlendsheetItem {
  blendsheet_no: string;
  standard: string;
  no_of_batches: number;
  created_batches: number;
  created_ts?: string;
  status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'SHIPPED';
  target_weight?: number;
  actual_weight?: number;
}

// Extended blendsheet with calculated fields
export interface BlendsheetData extends BlendsheetItem {
  target_weight: number;
  actual_weight: number;
  progress: number;
  efficiency: number;
  created_date: Date;
  completed_date?: Date;
}

// Weight flow data for charts
export interface WeightFlowData {
  week: string;
  input: number;
  output: number;
}

// Efficiency data for charts
export interface EfficiencyData {
  blendsheet: string;
  efficiency: number;
}

// Filters for blendsheet queries
export interface BlendsheetFilters {
  status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

// API Response wrapper
export interface BlendsheetApiResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

// ===============================
// BATCH INTERFACES (New)
// ===============================

export interface BlendsheetBatch {
  id: string;
  blendsheet_no: string;
  batch_number: number;
  target_weight: number;
  actual_weight: number;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'AWAITING_TRADER' | 'TRADER_APPROVED' | 'TRADER_REJECTED';
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  completion_time_hours?: number;
  efficiency?: number;
  quality_grade?: string;
  notes?: string;
  allocations?: BatchAllocation[];
}

export interface BatchAllocation {
  id: string;
  source_type: 'tealine' | 'blendbalance' | 'herbline';
  source_item_code: string;
  source_created_ts: string;
  allocated_weight: number;
  grade?: string;
  notes?: string;
  allocated_at: string;
}

// ===============================
// TRADER INTERFACES (New)
// ===============================

export interface TraderReviewBatch {
  batch_id: string;
  blendsheet_no: string;
  batch_number: number;
  standard: string;
  weight: number;
  status: 'TRADER_PENDING' | 'TRADER_REQUESTED' | 'TRADER_ELEVATED' | 'TRADER_ALLOWED' | 'TRADER_BLOCKED';
  trader_assigned?: string;
  trader_notes?: string;
  quality_metrics?: {
    color: number;
    aroma: number;
    taste: number;
    overall: number;
  };
  created_at: string;
  review_deadline?: string;
}

// ===============================
// ALLOCATION INTERFACES (New)
// ===============================

export interface AllocationHistory {
  id: string;
  source_type: 'tealine' | 'blendbalance' | 'herbline';
  source_item_code: string;
  source_created_ts: string;
  blendsheet_no: string;
  batch_id?: string;
  batch_number?: number;
  allocated_weight: number;
  remaining_weight?: number;
  grade?: string;
  notes?: string;
  allocated_at: string;
  allocated_by?: string;
}

export interface AllocationRequest {
  source_type: 'tealine' | 'blendbalance' | 'herbline';
  source_item_code: string;
  source_created_ts: string;
  blendsheet_no: string;
  batch_id?: string;
  allocated_weight: number;
  notes?: string;
}

// ===============================
// ANALYTICS INTERFACES (New)
// ===============================

export interface WeightFlowAnalysisData {
  name: string;
  date_range: string;
  input: number;
  output: number;
  shipped: number;
  efficiency: number;
  waste: number;
}

export interface BatchCompletionTrend {
  batch_id: string;
  blendsheet_no: string;
  batch_number: number;
  completion_time_hours: number;
  efficiency: number;
  target_weight: number;
  actual_weight: number;
  completed_at: string;
}

export interface BlendsheetEfficiencyData {
  blendsheet_no: string;
  standard: string;
  efficiency: number;
  target_weight: number;
  actual_weight: number;
  batch_count: number;
  avg_completion_time: number;
}

// ===============================
// SHIPMENT INTERFACES (New)
// ===============================

export interface ShipmentAllocation {
  id: string;
  record_id: string;
  shipment_code: string;
  allocated_weight: number;
  shipment_status: 'PENDING' | 'ACCEPTED' | 'DISPATCHED' | 'DELIVERED';
  notes?: string;
  allocated_at: string;
}

export interface ParcelAllocation {
  id: string;
  record_id: string;
  parcel_code: string;
  allocated_weight: number;
  parcel_status: 'PACKED' | 'SHIPPED' | 'DELIVERED';
  destination?: string;
  tracking_number?: string;
  notes?: string;
  allocated_at: string;
}