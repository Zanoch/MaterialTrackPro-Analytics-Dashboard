// Shipment-related types following Analytics-Dashboard patterns

export interface ShipmentEvent {
  status: string;
  timestamp: number;
  shipment_vehicle?: string;
  order_remarks?: string;
}

export interface ShipmentItem {
  shipment_code: string;
  quantity: number;
  events: ShipmentEvent[];
}

export interface ShipmentOrder {
  order_code: string;
  request_code: string;
  product_name: string;
  requirement: number;
  shipments: ShipmentItem[];
}

// Processed dispatched shipment data
export interface DispatchedShipment {
  vehicle_number: string;
  created_datetime: number;
  production_order: string;
  request_code: string;
  product_name: string;
  quantity: number;
  shipment_code: string;
  order_status: string;
  barcode_records: BarcodeRecord[]; // Embedded barcode details
}

// Grouped shipments by vehicle and datetime
export interface ShipmentGroup {
  vehicle_number: string;
  created_datetime: number;
  production_order: string;
  shipments: DispatchedShipment[];
}

// Individual barcode record
export interface BarcodeRecord {
  barcode: string;
  item_code: string;
  amount: number;
}

// Barcode details response
export interface BarcodeDetailsResponse {
  success: boolean;
  data: BarcodeRecord[];
}

// Pagination metadata
export interface ShipmentPaginationMeta {
  limit: number;
  offset: number;
  total_count: number;
  total_pages: number;
  current_page: number;
  has_next: boolean;
  has_previous: boolean;
}

// Dashboard metadata
export interface ShipmentMeta {
  total_orders: number;
  total_dispatches: number;
  current_page_dispatches: number;
  total_quantity_dispatched: number;
  pagination: ShipmentPaginationMeta;
}

// Filters for shipment API calls
export interface ShipmentFilters {
  vehicle_number?: string;
  date_from?: string;
  date_to?: string;
  product_name?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

// Main API response for dispatched shipments
export interface DispatchedShipmentsResponse {
  success: boolean;
  data: ShipmentGroup[];
  meta: ShipmentMeta;
}

// Filter options for dropdowns
export interface ShipmentFilterOptions {
  vehicles: string[];
  products: string[];
}