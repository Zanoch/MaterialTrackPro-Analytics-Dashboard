import { useState } from 'react';
import { HerblineOperations } from './HerblineOperations';

// Mock data for testing
const mockHerblineData = [
  {
    id: 1,
    created_ts: '1705320000000',
    item_code: 'HERB-001',
    remaining: 50,
    location: 'WAREHOUSE-A',
    herb_name: 'Chamomile Flowers',
    herb_category: 'FLORAL' as const,
    quality_grade: 'A' as const,
    status: 'ACCEPTED' as const,
    moisture_content: 8.5,
    harvest_date: '2024-01-10',
    supplier: 'Organic Herbs Ltd',
    certifications: ['ORGANIC', 'FAIR_TRADE'],
    remaining_weight: 50,
    initial_weight: 100,
    allocated_weight: 50,
    storage_conditions: {
      temperature: 18,
      humidity: 45,
      light_exposure: 'LOW'
    },
    allocations: [
      {
        allocation_id: 'ALLOC-001',
        batch_code: 'BATCH-2024-001',
        allocated_weight: 25,
        allocation_date: '2024-01-12',
        purpose: 'Herbal Tea Blend'
      },
      {
        allocation_id: 'ALLOC-002',
        batch_code: 'BATCH-2024-002',
        allocated_weight: 25,
        allocation_date: '2024-01-15',
        purpose: 'Premium Chamomile Tea'
      }
    ],
    quality_checks: [
      {
        check_date: '2024-01-11',
        inspector: 'QC-Inspector-1',
        parameters: {
          color: 'Golden Yellow',
          aroma: 'Sweet, Honey-like',
          purity: 99.5
        },
        result: 'PASSED'
      }
    ]
  },
  {
    id: 2,
    created_ts: '1705406400000',
    item_code: 'HERB-002',
    remaining: 75,
    location: 'WAREHOUSE-B',
    herb_name: 'Ginger Root',
    herb_category: 'MEDICINAL' as const,
    quality_grade: 'B' as const,
    status: 'IN_PROCESS' as const,
    moisture_content: 10.2,
    harvest_date: '2024-01-08',
    supplier: 'Spice Gardens Co',
    certifications: ['ORGANIC'],
    remaining_weight: 75,
    initial_weight: 150,
    allocated_weight: 75,
    storage_conditions: {
      temperature: 20,
      humidity: 50,
      light_exposure: 'MEDIUM'
    },
    allocations: [
      {
        allocation_id: 'ALLOC-003',
        batch_code: 'BATCH-2024-003',
        allocated_weight: 40,
        allocation_date: '2024-01-13',
        purpose: 'Ginger Tea Production'
      },
      {
        allocation_id: 'ALLOC-004',
        batch_code: 'BATCH-2024-004',
        allocated_weight: 35,
        allocation_date: '2024-01-16',
        purpose: 'Medicinal Blend'
      }
    ]
  },
  {
    id: 3,
    created_ts: '1705492800000',
    item_code: 'HERB-003',
    remaining: 120,
    location: 'WAREHOUSE-A',
    herb_name: 'Fresh Mint Leaves',
    herb_category: 'CULINARY' as const,
    quality_grade: 'A' as const,
    status: 'ACCEPTED' as const,
    moisture_content: 12.0,
    harvest_date: '2024-01-15',
    supplier: 'Garden Fresh Herbs',
    certifications: ['ORGANIC', 'LOCAL'],
    remaining_weight: 120,
    initial_weight: 120,
    allocated_weight: 0,
    storage_conditions: {
      temperature: 15,
      humidity: 60,
      light_exposure: 'LOW'
    },
    quality_checks: [
      {
        check_date: '2024-01-16',
        inspector: 'QC-Inspector-2',
        parameters: {
          color: 'Vibrant Green',
          aroma: 'Fresh, Minty',
          purity: 98.5
        },
        result: 'PASSED'
      }
    ]
  },
  {
    id: 4,
    created_ts: '1705579200000',
    item_code: 'HERB-004',
    remaining: 35,
    location: 'WAREHOUSE-C',
    herb_name: 'Lemongrass',
    herb_category: 'AROMATIC' as const,
    quality_grade: 'B' as const,
    status: 'PROCESSED' as const,
    moisture_content: 9.8,
    harvest_date: '2024-01-12',
    supplier: 'Aromatic Herbs Inc',
    certifications: ['FAIR_TRADE'],
    remaining_weight: 35,
    initial_weight: 200,
    allocated_weight: 165,
    storage_conditions: {
      temperature: 19,
      humidity: 48,
      light_exposure: 'LOW'
    },
    allocations: [
      {
        allocation_id: 'ALLOC-005',
        batch_code: 'BATCH-2024-005',
        allocated_weight: 100,
        allocation_date: '2024-01-14',
        purpose: 'Lemongrass Tea'
      },
      {
        allocation_id: 'ALLOC-006',
        batch_code: 'BATCH-2024-006',
        allocated_weight: 65,
        allocation_date: '2024-01-17',
        purpose: 'Citrus Blend'
      }
    ]
  },
  {
    id: 5,
    created_ts: '1705665600000',
    item_code: 'HERB-005',
    remaining: 90,
    location: 'WAREHOUSE-B',
    herb_name: 'Cinnamon Bark',
    herb_category: 'SPICE' as const,
    quality_grade: 'A' as const,
    status: 'ACCEPTED' as const,
    moisture_content: 7.5,
    harvest_date: '2024-01-05',
    supplier: 'Ceylon Spices Ltd',
    certifications: ['ORGANIC', 'FAIR_TRADE', 'RAINFOREST_ALLIANCE'],
    remaining_weight: 90,
    initial_weight: 100,
    allocated_weight: 10,
    storage_conditions: {
      temperature: 22,
      humidity: 40,
      light_exposure: 'NONE'
    }
  },
  {
    id: 6,
    created_ts: '1705752000000',
    item_code: 'HERB-006',
    remaining: 0,
    location: 'WAREHOUSE-A',
    herb_name: 'Rose Petals',
    herb_category: 'FLOWER' as const,
    quality_grade: 'C' as const,
    status: 'DISPATCHED' as const,
    moisture_content: 6.2,
    harvest_date: '2024-01-18',
    supplier: 'Floral Gardens',
    certifications: ['ORGANIC'],
    remaining_weight: 0,
    initial_weight: 50,
    allocated_weight: 50,
    dispatch_info: {
      dispatch_date: '2024-01-19',
      destination: 'Tea Factory A',
      batch_codes: ['BATCH-2024-007', 'BATCH-2024-008']
    }
  }
];

// Mock dashboard data
const mockDashboardData = {
  total_herb_types: 25,
  total_available_weight: 1250.5,
  pending_quality_checks: 8,
  active_processing: 12,
  categories_summary: {
    FLORAL: { count: 5, weight: 250 },
    MEDICINAL: { count: 8, weight: 450 },
    CULINARY: { count: 4, weight: 200 },
    AROMATIC: { count: 3, weight: 150 },
    SPICE: { count: 5, weight: 200.5 }
  },
  quality_distribution: {
    A: 45,
    B: 35,
    C: 20
  },
  status_summary: {
    ACCEPTED: 10,
    IN_PROCESS: 8,
    PROCESSED: 5,
    DISPATCHED: 2
  },
  storage_alerts: 3,
  expiring_soon: 2
};

// Mock filter options
const mockFilterOptions = {
  locations: ['WAREHOUSE-A', 'WAREHOUSE-B', 'WAREHOUSE-C'],
  categories: ['FLORAL', 'MEDICINAL', 'CULINARY', 'AROMATIC', 'SPICE', 'ROOT', 'LEAF', 'FLOWER', 'OTHER'],
  qualityGrades: ['A', 'B', 'C'],
  statuses: ['ACCEPTED', 'IN_PROCESS', 'PROCESSED', 'DISPATCHED'],
  suppliers: ['Organic Herbs Ltd', 'Spice Gardens Co', 'Garden Fresh Herbs', 'Aromatic Herbs Inc', 'Ceylon Spices Ltd', 'Floral Gardens']
};

export function HerblineTest() {
  const [showMockData, setShowMockData] = useState(false);
  const [testMode, setTestMode] = useState<'mock' | 'real'>('mock');

  // Override the hooks with mock data when in test mode
  if (testMode === 'mock') {
    // Mock the hooks
    (window as any).__MOCK_HERBLINE_HOOKS__ = {
      useHerblineDashboard: () => ({
        data: mockDashboardData,
        isLoading: false,
        error: null
      }),
      useHerblineSearch: () => ({
        data: { data: mockHerblineData, meta: { total_results: 6, search_time: 0.1, search_term: '' } },
        isLoading: false,
        error: null
      }),
      useHerblines: () => ({
        data: mockHerblineData,
        isLoading: false,
        error: null
      }),
      useHerblineFilterOptions: () => ({
        data: mockFilterOptions,
        isLoading: false,
        error: null
      }),
      useHerblinesByCategory: () => ({
        data: mockHerblineData,
        isLoading: false,
        error: null
      }),
      useHerblineStatistics: () => ({
        totalHerbs: mockHerblineData.length,
        totalWeight: mockHerblineData.reduce((sum, h) => sum + h.remaining, 0),
        averageQualityScore: 85,
        categoryDistribution: {
          FLORAL: 1,
          MEDICINAL: 1,
          CULINARY: 1,
          AROMATIC: 1,
          SPICE: 1,
          FLOWER: 1
        },
        statusCounts: {
          ACCEPTED: 3,
          IN_PROCESS: 1,
          PROCESSED: 1,
          DISPATCHED: 1
        }
      }),
      useCreateHerbline: () => ({
        mutate: () => console.log('Create herbline mutation called'),
        isLoading: false
      })
    };
  }

  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-green-800 mb-4">🌿 Herbline Test Mode</h2>
        
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => setTestMode('mock')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              testMode === 'mock'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Use Mock Data
          </button>
          <button
            onClick={() => {
              setTestMode('real');
              delete (window as any).__MOCK_HERBLINE_HOOKS__;
            }}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              testMode === 'real'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            Use Real API
          </button>
          <button
            onClick={() => setShowMockData(!showMockData)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            {showMockData ? 'Hide' : 'Show'} Mock Data
          </button>
        </div>

        {showMockData && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md overflow-auto max-h-96">
            <h3 className="font-semibold mb-2">Mock Herbline Data:</h3>
            <pre className="text-xs">{JSON.stringify(mockHerblineData, null, 2)}</pre>
            <h3 className="font-semibold mt-4 mb-2">Mock Dashboard Data:</h3>
            <pre className="text-xs">{JSON.stringify(mockDashboardData, null, 2)}</pre>
          </div>
        )}

        <div className="mt-4 text-sm text-green-700">
          <p>🔍 Test Scenarios:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Chamomile (HERB-001) - Floral, Grade A, 50% allocated</li>
            <li>Ginger Root (HERB-002) - Medicinal, Grade B, In Process</li>
            <li>Fresh Mint (HERB-003) - Culinary, Grade A, Fully available</li>
            <li>Lemongrass (HERB-004) - Aromatic, Grade B, Mostly allocated</li>
            <li>Cinnamon (HERB-005) - Spice, Grade A, Triple certified</li>
            <li>Rose Petals (HERB-006) - Flower, Grade C, Fully dispatched</li>
          </ul>
          <p className="mt-2">📊 Categories: FLORAL, MEDICINAL, CULINARY, AROMATIC, SPICE, FLOWER</p>
          <p>🏷️ Quality Grades: A (Premium), B (Standard), C (Economy)</p>
          <p>📍 Locations: WAREHOUSE-A, WAREHOUSE-B, WAREHOUSE-C</p>
        </div>
      </div>

      {/* Render the actual component */}
      <HerblineOperations />
    </div>
  );
}