export const API_ENDPOINTS = {
  // Tealine endpoints (migrated to grandpass-handler)
  TEALINE: {
    PENDING_OPTIMIZED: '/grandpass/tealine/pending-with-calculations',
    INVENTORY_OPTIMIZED: '/grandpass/admin/tealine/inventory-complete',
  },

  // Blendsheet endpoints (migrated to grandpass-handler)
  BLENDSHEET: {
    OPERATIONS_DATA: '/grandpass/admin/blendsheet/operations-data',
  },

  // Flavorsheet endpoints (migrated to grandpass-handler)
  FLAVORSHEET: {
    OPERATIONS_DATA: '/grandpass/admin/flavorsheet/operations-data',
  },

  // Herbline endpoints (migrated to grandpass-handler)
  HERBLINE: {
    ADMIN: '/grandpass/admin/herbline',
    DASHBOARD_SUMMARY: '/grandpass/admin/herbline/dashboard-summary',
  },

  // Blendbalance endpoints (migrated to grandpass-handler)
  BLENDBALANCE: {
    ADMIN: '/grandpass/admin/blendbalance',
  },

  // Order endpoints (migrated to grandpass-handler)
  ORDER: {
    LIST: '/grandpass/order/plan',
    PLAN: '/grandpass/order/plan',
    SCHEDULE_ANALYTICS: '/grandpass/order/schedule/analytics',
  },

  // Shipment Log endpoint (migrated to grandpass-handler)
  SHIPMENT_LOG: '/grandpass/order/shipment/log',

  // Trader Request endpoints (migrated to grandpass-handler)
  TRADER_REQUESTS: {
    BLENDSHEET: '/grandpass/analytics/trader-requests/blendsheet',
    FLAVORSHEET: '/grandpass/analytics/trader-requests/flavorsheet',
  },
} as const;
