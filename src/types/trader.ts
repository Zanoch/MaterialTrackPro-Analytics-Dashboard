// Trader Request types following Analytics Dashboard patterns

export interface TraderRequestEvent {
  status: 'TRADER_REQUESTED' | 'TRADER_ALLOWED' | 'TRADER_BLOCKED' | 'TRADER_ELEVATED';
  event_ts: number;
  moisture_content?: number;
  bag_id?: string;
  storekeeper?: string;
}

export interface TraderRequestBatch {
  item_code: string;
  created_ts: number;
  event?: TraderRequestEvent;
}

export interface TraderRequest {
  entity_no: string;
  remarks?: string;
  created_ts: number;
  batches: TraderRequestBatch[];
  event?: TraderRequestEvent;
}

// Pagination metadata
export interface TraderRequestPaginationMeta {
  limit: number;
  offset: number;
  total_count: number;
  total_pages: number;
  current_page: number;
  has_next: boolean;
  has_previous: boolean;
}

// Response structure following Analytics Dashboard patterns
export interface TraderRequestsResponse {
  data: TraderRequest[];
  meta: {
    total: number;
    total_approved: number;
    total_blocked: number;
    approval_rate: number;
    pagination: TraderRequestPaginationMeta;
  };
}

// Filters interface following existing patterns
export interface TraderRequestFilters {
  limit?: number;
  offset?: number;
  search?: string;
  start_date?: number;
  end_date?: number;
}

// Helper type for entity selection
export type TraderRequestEntity = 'blendsheet' | 'flavorsheet';