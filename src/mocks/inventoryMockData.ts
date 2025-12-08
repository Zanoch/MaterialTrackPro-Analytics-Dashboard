// Mock inventory data for dev panel testing
// Bag receive times spread 30-60 seconds apart

function generateBagDetails(count: number, startTime: Date) {
  const bags = [];
  let currentTime = startTime.getTime();

  for (let i = 0; i < count; i++) {
    // Random delay between 30-60 seconds
    const delay = Math.floor(Math.random() * 30000) + 30000; // 30-60 seconds in ms
    currentTime += delay;

    bags.push({
      bag_id: `mock-bag-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
      location: ['EBS-01-FG', 'EBS-02-FG', 'EBS-03-FG', 'WHS-01', 'WHS-02'][Math.floor(Math.random() * 5)],
      net_weight: Math.floor(Math.random() * 20) + 40, // 40-60 kg
      remaining_weight: Math.floor(Math.random() * 20) + 40,
      received_timestamp: new Date(currentTime).toISOString(),
    });
  }

  return bags;
}

function generateMockItem(index: number) {
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

  const bagCount = Math.floor(Math.random() * 50) + 10; // 10-60 bags
  const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Within last 7 days
  const bagDetails = generateBagDetails(bagCount, startTime);

  const totalNetWeight = bagDetails.reduce((sum, bag) => sum + bag.net_weight, 0);
  const remainingWeight = bagDetails.reduce((sum, bag) => sum + bag.remaining_weight, 0);

  return {
    item_code: `MOCK-${String(index + 1).padStart(4, '0')}`,
    created_ts: String(startTime.getTime()),
    broker: brokers[Math.floor(Math.random() * brokers.length)],
    garden: gardens[Math.floor(Math.random() * gardens.length)],
    grade: grades[Math.floor(Math.random() * grades.length)],
    total_bags_received: bagCount,
    total_net_weight: totalNetWeight,
    remaining_weight: remainingWeight,
    bag_details: bagDetails,
    first_received_date: bagDetails[0].received_timestamp,
    last_received_date: bagDetails[bagDetails.length - 1].received_timestamp,
    last_updated: bagDetails[bagDetails.length - 1].received_timestamp,
  };
}

// Generate 30 items (more than 1 page)
export const mockInventoryData = {
  success: true,
  data: Array.from({ length: 30 }, (_, i) => generateMockItem(i)),
  meta: {
    total_items: 30,
    current_page_items: 25,
    total_inventory_weight: 45000,
    total_available_weight: 42000,
    pagination: {
      limit: 25,
      offset: 0,
      total_count: 30,
      total_pages: 2,
      current_page: 1,
      has_next: true,
      has_previous: false,
    },
  },
};

// Function to get paginated mock data
export function getMockInventoryData(limit = 25, offset = 0) {
  // Sort by last_received_date descending (most recent first)
  const allData = [...mockInventoryData.data].sort((a, b) =>
    new Date(b.last_received_date).getTime() - new Date(a.last_received_date).getTime()
  );
  const paginatedData = allData.slice(offset, offset + limit);

  return {
    success: true,
    data: paginatedData,
    meta: {
      total_items: allData.length,
      current_page_items: paginatedData.length,
      total_inventory_weight: 45000,
      total_available_weight: 42000,
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
