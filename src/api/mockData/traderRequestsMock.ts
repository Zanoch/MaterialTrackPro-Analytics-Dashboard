import {
  type TraderRequest,
  type TraderRequestsResponse,
  type TraderRequestFilters,
  type TraderRequestEntity,
} from '../../types/trader';

// Mock data generator for realistic trader requests
class TraderRequestsMockGenerator {
  private blendsheetRequests: TraderRequest[] = [];
  private flavorsheetRequests: TraderRequest[] = [];

  constructor() {
    this.generateMockData();
  }

  private generateMockData() {
    // Generate blendsheet requests
    this.blendsheetRequests = this.generateRequests('blendsheet', 150);

    // Generate flavorsheet requests
    this.flavorsheetRequests = this.generateRequests('flavorsheet', 85);
  }

  private generateRequests(entity: TraderRequestEntity, count: number): TraderRequest[] {
    const requests: TraderRequest[] = [];
    const now = Date.now();

    const statuses: Array<'TRADER_REQUESTED' | 'TRADER_ALLOWED' | 'TRADER_BLOCKED' | 'TRADER_ELEVATED'> = [
      'TRADER_ALLOWED',
      'TRADER_ALLOWED',
      'TRADER_ALLOWED',
      'TRADER_BLOCKED',
      'TRADER_ELEVATED',
      'TRADER_REQUESTED'
    ];

    const remarks = [
      'Urgent production requirement',
      'Quality testing requested',
      'Regular production batch',
      'Export order preparation',
      'Quality improvement initiative',
      'Customer specific blend',
      'Seasonal production',
      'Premium grade request',
      'Bulk order processing',
      'Sample preparation',
      null, // Some requests have no remarks
      null,
    ];

    for (let i = 0; i < count; i++) {
      // Generate date within last 6 months
      const daysAgo = Math.floor(Math.random() * 180);
      const createdDate = now - (daysAgo * 24 * 60 * 60 * 1000);

      // Generate entity number
      const entityNo = entity === 'blendsheet'
        ? `BLS${String(20240001 + i).padStart(8, '0')}`
        : `FLS${String(20240001 + i).padStart(8, '0')}`;

      // Random number of batches (1-5)
      const batchCount = Math.floor(Math.random() * 5) + 1;
      const batches = Array.from({ length: batchCount }, (_, batchIndex) => ({
        item_code: `${entity === 'blendsheet' ? 'BL' : 'FL'}${entityNo.slice(-4)}${String(batchIndex + 1).padStart(2, '0')}`,
        created_ts: createdDate + (batchIndex * 60 * 60 * 1000), // Stagger batch creation times
        event: Math.random() > 0.3 ? {
          status: 'TRADER_REQUESTED' as const,
          event_ts: createdDate + (batchIndex * 60 * 60 * 1000) + (2 * 60 * 60 * 1000),
          moisture_content: Math.random() > 0.5 ? Number((Math.random() * 5 + 8).toFixed(1)) : undefined,
          bag_id: Math.random() > 0.4 ? `BAG${String(Math.floor(Math.random() * 9999) + 1000)}` : undefined,
          storekeeper: Math.random() > 0.6 ? ['John Smith', 'Mary Johnson', 'David Wilson', 'Sarah Brown'][Math.floor(Math.random() * 4)] : undefined,
        } : undefined,
      }));

      // Random status
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const eventTs = status !== 'TRADER_REQUESTED'
        ? createdDate + (Math.floor(Math.random() * 72) + 24) * 60 * 60 * 1000 // 1-3 days after creation
        : createdDate + Math.floor(Math.random() * 24) * 60 * 60 * 1000; // Same day

      const request: TraderRequest = {
        entity_no: entityNo,
        remarks: remarks[Math.floor(Math.random() * remarks.length)] || undefined,
        created_ts: createdDate,
        batches,
        event: {
          status,
          event_ts: eventTs,
          moisture_content: Math.random() > 0.7 ? Number((Math.random() * 3 + 9).toFixed(1)) : undefined,
          bag_id: Math.random() > 0.6 ? `BAG${String(Math.floor(Math.random() * 9999) + 1000)}` : undefined,
          storekeeper: Math.random() > 0.5 ? ['Alice Cooper', 'Bob Martinez', 'Carol Davis', 'Dan Thompson'][Math.floor(Math.random() * 4)] : undefined,
        },
      };

      requests.push(request);
    }

    // Sort by creation date (newest first)
    return requests.sort((a, b) => b.created_ts - a.created_ts);
  }

  // Get paginated requests with filtering
  getRequests(
    entity: TraderRequestEntity,
    filters?: TraderRequestFilters
  ): TraderRequestsResponse {
    const allRequests = entity === 'blendsheet' ? this.blendsheetRequests : this.flavorsheetRequests;
    let filteredRequests = [...allRequests];

    // Apply date filtering
    if (filters?.start_date && filters?.end_date) {
      filteredRequests = filteredRequests.filter(request =>
        request.created_ts >= filters.start_date! &&
        request.created_ts <= filters.end_date!
      );
    }


    // Calculate summary statistics
    const totalApproved = filteredRequests.filter(r => r.event?.status === 'TRADER_ALLOWED').length;
    const totalBlocked = filteredRequests.filter(r => r.event?.status === 'TRADER_BLOCKED').length;
    const approvalRate = filteredRequests.length > 0
      ? Math.round((totalApproved / filteredRequests.length) * 100)
      : 0;

    // Apply pagination
    const limit = filters?.limit || 25;
    const offset = filters?.offset || 0;
    const paginatedRequests = filteredRequests.slice(offset, offset + limit);

    return {
      data: paginatedRequests,
      meta: {
        total: filteredRequests.length,
        total_approved: totalApproved,
        total_blocked: totalBlocked,
        approval_rate: approvalRate,
        pagination: {
          limit,
          offset,
          total_count: filteredRequests.length,
          total_pages: Math.ceil(filteredRequests.length / limit),
          current_page: Math.floor(offset / limit) + 1,
          has_next: offset + limit < filteredRequests.length,
          has_previous: offset > 0,
        },
      },
    };
  }

}

// Create singleton instance
export const traderRequestsMockGenerator = new TraderRequestsMockGenerator();

// Mock service implementation
export const traderRequestsMockService = {
  // Simulate API delay
  delay: (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms)),

  // Get trader requests with pagination and search
  getTraderRequests: async (
    entity: TraderRequestEntity,
    filters?: TraderRequestFilters
  ): Promise<TraderRequestsResponse> => {
    console.log(`🎭 [MOCK-API] Getting trader requests for ${entity}`, filters);

    // Simulate network delay (increased for testing loading indicator)
    await traderRequestsMockService.delay(1000 + Math.random() * 1000);

    const result = traderRequestsMockGenerator.getRequests(entity, filters);

    console.log(`✅ [MOCK-API] Returning ${result.data.length} requests (${result.meta.total} total)`);
    return result;
  },

};