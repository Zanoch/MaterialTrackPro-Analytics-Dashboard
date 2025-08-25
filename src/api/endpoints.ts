export const API_ENDPOINTS = {
  // Tealine endpoints
  TEALINE: {
    PENDING_OPTIMIZED: '/central/tealine/pending-with-calculations',
    ALL: '/central/admin/tealine',
    INVENTORY_OPTIMIZED: '/central/admin/tealine/inventory-complete',
  },
  
  // Blendsheet endpoints
  BLENDSHEET: {
    ALL: '/central/blendsheet',
    ADMIN: '/central/admin/blendsheet',
    PAGINATED: '/central/admin/blendsheet/paginated',
    OPERATIONS_DATA: '/central/admin/blendsheet/operations-data',
    BATCH: '/central/blendsheet/batch',
  },
  
  // Flavorsheet endpoints
  FLAVORSHEET: {
    ALL: '/central/flavorsheet',
    ADMIN: '/central/admin/flavorsheet',
    ADMIN_SEARCH: '/central/admin/flavorsheet/search',
    USER_SEARCH: '/central/flavorsheet/search',
    BATCH: '/central/flavorsheet/batch',
    BATCH_SEARCH: '/central/flavorsheet/batch/search',
    RECORD: '/central/flavorsheet/record',
    DASHBOARD_SUMMARY: '/central/admin/flavorsheet/dashboard-summary',
  },
  
  // Herbline endpoints
  HERBLINE: {
    ALL: '/central/herbline',
    ADMIN: '/central/admin/herbline',
    ADMIN_SEARCH: '/central/admin/herbline/search',
    USER_SEARCH: '/central/herbline/search',
    INVENTORY_COMPLETE: '/central/admin/herbline/inventory-complete',
    DASHBOARD_SUMMARY: '/central/admin/herbline/dashboard-summary',
    RECORD: '/central/herbline/record',
    ALLOCATIONS: '/central/herbline/allocations',
  },
  
  // Blendbalance endpoints
  BLENDBALANCE: {
    ALL: '/central/blendbalance',
    ADMIN: '/central/admin/blendbalance',
    RECORD: '/central/blendbalance/record',
  },
  
  // Order endpoints
  ORDER: {
    LIST: '/order',
    PLAN: '/order/plan',
    SCHEDULE: '/order/schedule',
    SHIPMENT: '/order/shipment',
  },
  
  // Common endpoints
  LOCATION: '/central/location',
  SCAN: '/central/scan',
  
  // Proxy to Central Handler
  CENTRAL: '/central',
} as const;