// Order Management Types
export interface Order {
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  order_date: Date;
  delivery_date?: Date;
  status: 'PENDING' | 'ACCEPTED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  total_weight: number;
  total_value: number;
  currency: string;
  created_by: string;
  updated_at: Date;
}

// Order items/line items
export interface OrderItem {
  item_id: string;
  order_id: string;
  product_code: string;
  product_name: string;
  grade: string;
  quantity: number;
  unit_weight: number;
  total_weight: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

// Shipment tracking
export interface Shipment {
  shipment_id: string;
  order_id: string;
  shipment_number: string;
  carrier: string;
  tracking_number?: string;
  ship_date: Date;
  estimated_delivery?: Date;
  actual_delivery?: Date;
  status: 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';
  total_weight: number;
  total_packages: number;
}

// Order planning
export interface OrderPlan {
  plan_id: string;
  order_id: string;
  planned_start_date: Date;
  planned_completion_date: Date;
  production_notes?: string;
  allocated_blendsheets: string[];
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'DELAYED';
}

// Filters for order queries
export interface OrderFilters {
  status?: string;
  priority?: string;
  customer?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Order statistics
export interface OrderStats {
  total_orders: number;
  pending_orders: number;
  active_orders: number;
  completed_orders: number;
  total_value: number;
  average_order_value: number;
}

// API Response wrapper
export interface OrderApiResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

// Order Plan with allocation details
export interface OrderPlanDetails {
  order_code: string;
  product_name: string;
  requirement: number;
  plan_start: Date;
  plan_end: Date;
  allowed: number;
  requests: OrderPlanRequest[];
}

// Order plan request allocation
export interface OrderPlanRequest {
  request_code: string;
  shipment_code: number;
  quantity: number;
  status: string;
}

// Order request with shipment events
export interface OrderRequest {
  request_code: string;
  order_code: string;
  product_name: string;
  requirement: number;
  comments?: string;
  shipments: ShipmentWithEvents[];
}

// Shipment with event tracking
export interface ShipmentWithEvents {
  shipment_code: number;
  quantity: number;
  events: ShipmentEvent[];
  current_status?: string;
  latest_event?: ShipmentEvent;
}

// Shipment event details
export interface ShipmentEvent {
  status: 'APPROVAL_REQUESTED' | 'APPROVAL_ALLOWED' | 'ORDER_REQUESTED' | 
         'SHIPMENT_ACCEPTED' | 'SHIPMENT_DISPATCHED' | 'ORDER_NOT_READY' | 
         'RECEIVED';
  timestamp: number;
  shipment_vehicle?: string;
  shipment_remarks?: string;
  order_remarks?: string;
  remarks?: string;
}

// Order dashboard aggregated data
export interface OrderDashboardData {
  summary: OrderDashboardSummary;
  orderPlans: OrderPlanDetails[];
  activeOrders: OrderRequest[];
  recentEvents: ShipmentEventWithContext[];
}

// Dashboard summary metrics
export interface OrderDashboardSummary {
  total_plans: number;
  pending_requests: number;
  accepted_orders: number;
  in_transit: number;
  received_today: number;
  total_requirement_kg: number;
  total_shipped_kg: number;
  fulfillment_rate: number;
}

// Shipment event with context
export interface ShipmentEventWithContext extends ShipmentEvent {
  request_code: string;
  shipment_code: number;
  order_code: string;
  product_name: string;
  quantity: number;
}

// Order filters for dashboard
export interface OrderDashboardFilters {
  status?: string[];
  date_from?: string;
  date_to?: string;
  order_code?: string;
  shipment_vehicle?: string;
}