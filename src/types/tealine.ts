// Tealine API Response Types
export interface TealineItem {
  item_code: string;
  created_ts: string;
  broker: string;
  garden: string;
  purchase_order: string;
}

// Warehouse record interface
export interface TealineRecord {
  id: number;
  received_ts: string;
  store_location: string;
  bag_weight: number;
  gross_weight: number;
  barcode: string;
}

// Location distribution for inventory items
export interface LocationDistribution {
  location: string;
  bags: number;
  weight: number;
}

// Tealine Inventory Types (for admin endpoint)
export interface TealineInventoryItem extends TealineItem {
  // Additional fields from inventory endpoint
  invoice_no?: string;
  grade?: string;
  no_of_bags?: number;
  weight_per_bag?: number;
  // Calculated fields from warehouse records
  gross_weight?: number;
  bag_weight?: number;
  net_weight?: number;
  received?: number;
  pending?: number;  // Added for compatibility with pages that use it
  status?: 'ACCEPTED' | 'IN_PROCESS' | 'PROCESSED' | 'DISPATCHED';
  location?: string;
  remaining?: number;
  last_updated?: number;
  // Actual warehouse records
  record_list?: TealineRecord[];
}

// New inventory complete type matching the optimized API endpoint
export interface TealineInventoryComplete {
  item_code: string;
  created_ts: string;
  broker: string;
  garden: string;
  grade: string;
  expected_bags: number;
  total_bags_received: number;
  available_bags: number;
  allocated_bags: number;
  processed_bags: number;
  total_gross_weight: number;
  total_bag_weight: number;
  total_net_weight: number;
  remaining_weight: number;
  location_distribution: LocationDistribution[];
  first_received_date: string;
  last_received_date: string;
  last_updated: string;
}

// Meta information for inventory dashboard
export interface InventoryMeta {
  total_items: number;
  total_inventory_weight: number;
  total_available_weight: number;
}

// API Response for inventory complete endpoint
export interface InventoryCompleteResponse {
  success: boolean;
  data: TealineInventoryComplete[];
  meta: InventoryMeta;
}

// Pending Tealines (calculated from tealine vs records)
export interface PendingTealineItem extends TealineItem {
  // Additional fields from detailed API response
  invoice_no?: string;
  grade?: string;
  weight_per_bag?: number;
  // Calculated pending fields
  no_of_bags: number;
  received: number;
  pending: number;
  age_days: number;
}

// Filters for API calls
export interface TealineFilters {
  broker?: string;
  garden?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

// API Response wrapper
export interface TealineApiResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}