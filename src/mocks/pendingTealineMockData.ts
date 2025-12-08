// Mock pending tealine data for dev panel testing

function generateMockPendingItem(index: number) {
  const brokers = [
    'ASIA SIYAKA COMMODITIES PLC',
    'EASTERN BROKERS LIMITED',
    'FORBES & WALKER TEA BROKERS (PVT) LTD',
    'BIO FOODS (PVT) LTD',
    'CEYLON TEA BROKERS PLC',
  ];

  const gardens = [
    'RADELLA',
    'MELFORT GREEN TEA',
    'WHITE TEA',
    'NEW THAMBILIGALA',
    'CHINESE GREEN TEA',
    'HAPUGASTENNE',
    'DIMBULA VALLEY',
  ];

  const grades = ['FGS', 'FGS1', 'HEYSON', 'GP1', 'BOP', 'BOPF', 'OP'];

  const expectedBags = Math.floor(Math.random() * 100) + 10; // 10-110 bags
  const createdTs = Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000; // Within last 30 days
  const receivedBags = Math.floor(Math.random() * expectedBags * 0.5); // 0-50% received
  const pendingBags = expectedBags - receivedBags;
  const completionPercentage = Math.round((receivedBags / expectedBags) * 100 * 10) / 10;

  return {
    item_code: `PEND-${String(index + 1).padStart(4, '0')}`,
    created_ts: String(createdTs),
    broker: brokers[Math.floor(Math.random() * brokers.length)],
    garden: gardens[Math.floor(Math.random() * gardens.length)],
    grade: grades[Math.floor(Math.random() * grades.length)],
    expected_bags: expectedBags,
    received_bags: receivedBags,
    pending_bags: pendingBags,
    completion_percentage: completionPercentage,
    age_days: Math.floor((Date.now() - createdTs) / (24 * 60 * 60 * 1000)),
  };
}

// Generate 35 items (more than 1 page)
const allPendingItems = Array.from({ length: 35 }, (_, i) => generateMockPendingItem(i));

export const mockPendingTealineData = {
  success: true,
  data: allPendingItems,
  meta: {
    total_items: 35,
    current_page_items: 25,
    total_pending_bags: allPendingItems.reduce((sum, item) => sum + item.pending_bags, 0),
    average_age_days: Math.round(
      allPendingItems.reduce((sum, item) => sum + item.age_days, 0) / allPendingItems.length
    ),
    pagination: {
      limit: 25,
      offset: 0,
      total_count: 35,
      total_pages: 2,
      current_page: 1,
      has_next: true,
      has_previous: false,
    },
  },
};

// Function to get paginated mock data
export function getMockPendingTealineData(limit = 25, offset = 0) {
  // Sort by age_days DESC (oldest first), then completion_percentage ASC (least complete first)
  const allData = [...mockPendingTealineData.data].sort((a, b) => {
    if (b.age_days !== a.age_days) {
      return b.age_days - a.age_days; // Older items first
    }
    return a.completion_percentage - b.completion_percentage; // Less complete first
  });
  const paginatedData = allData.slice(offset, offset + limit);

  return {
    success: true,
    data: paginatedData,
    meta: {
      total_items: allData.length,
      current_page_items: paginatedData.length,
      total_pending_bags: allData.reduce((sum, item) => sum + item.pending_bags, 0),
      average_age_days: Math.round(
        allData.reduce((sum, item) => sum + item.age_days, 0) / allData.length
      ),
      pagination: {
        limit,
        offset,
        total_count: allData.length,
        total_pages: Math.ceil(allData.length / limit),
        current_page: Math.floor(offset / limit) + 1,
        has_next: offset + limit < allData.length,
        has_previous: offset > 0,
      },
    },
  };
}
