import { useState } from 'react';

// Mock data for testing
const mockBlendbalanceData = [
  {
    id: 1,
    item_code: 'BB-001',
    blend_code: 'BLEND-2024-001',
    weight: 500,
    transfer_id: 'TRF-001',
    created_at: '2024-01-15T08:00:00Z',
    remaining_weight: 150,
    transferred_weight: 350,
    status: 'IN_PROGRESS' as const,
    source_blend: 'SRC-BLEND-001',
    target_blend: 'TGT-BLEND-001',
    transfer_type: 'BLEND_TO_BLEND' as const,
    completion_percentage: 70,
    transfer_date: '2024-01-15T09:00:00Z',
    quality_check: {
      approval_status: 'PENDING',
      performed_by: 'QC-Inspector-1',
      quality_score: 85,
      notes: 'Awaiting final approval'
    },
    transfer_notes: 'High priority transfer for export batch',
    age_days: 5,
    transfer_efficiency: 95.5,
    completion_status: 'IN_PROGRESS' as const,
    weight_distribution: {
      source_weight: 500,
      target_weight: 350,
      transfer_weight: 350,
      remaining_weight: 150,
      loss_percentage: 0
    }
  },
  {
    id: 2,
    item_code: 'BB-002',
    blend_code: 'BLEND-2024-002',
    weight: 750,
    transfer_id: 'TRF-002',
    created_at: '2024-01-14T10:00:00Z',
    remaining_weight: 0,
    transferred_weight: 750,
    status: 'COMPLETED' as const,
    source_blend: 'SRC-BLEND-002',
    target_blend: 'TGT-BLEND-002',
    transfer_type: 'BATCH_TO_BATCH' as const,
    completion_percentage: 100,
    transfer_date: '2024-01-14T11:00:00Z',
    completion_date: '2024-01-14T15:00:00Z',
    quality_check: {
      approval_status: 'APPROVED',
      performed_by: 'QC-Manager',
      quality_score: 98,
      notes: 'Excellent quality transfer'
    },
    age_days: 6,
    transfer_efficiency: 99.2,
    completion_status: 'COMPLETED' as const,
    weight_distribution: {
      source_weight: 750,
      target_weight: 750,
      transfer_weight: 750,
      remaining_weight: 0,
      loss_percentage: 0
    }
  },
  {
    id: 3,
    item_code: 'BB-003',
    blend_code: 'BLEND-2024-003',
    weight: 300,
    transfer_id: 'TRF-003',
    created_at: '2024-01-16T14:00:00Z',
    status: 'PENDING' as const,
    source_blend: 'SRC-BLEND-003',
    transfer_type: 'QUALITY_UPGRADE' as const,
    completion_percentage: 0,
    age_days: 4,
    transfer_efficiency: 0,
    completion_status: 'NOT_STARTED' as const,
  },
  {
    id: 4,
    item_code: 'BB-004',
    blend_code: 'BLEND-2024-004',
    weight: 450,
    transfer_id: 'TRF-004',
    created_at: '2024-01-13T09:00:00Z',
    remaining_weight: 50,
    transferred_weight: 400,
    status: 'QUALITY_CHECK' as const,
    source_blend: 'SRC-BLEND-004',
    target_blend: 'TGT-BLEND-004',
    transfer_type: 'WEIGHT_BALANCE' as const,
    completion_percentage: 89,
    transfer_date: '2024-01-13T10:00:00Z',
    quality_check: {
      approval_status: 'PENDING',
      performed_by: 'QC-Inspector-2',
      quality_score: 82,
      notes: 'Minor weight variance detected'
    },
    age_days: 7,
    transfer_efficiency: 88.9,
    completion_status: 'UNDERWEIGHT' as const,
    weight_distribution: {
      source_weight: 450,
      target_weight: 400,
      transfer_weight: 400,
      remaining_weight: 50,
      loss_percentage: 11.1
    }
  },
  {
    id: 5,
    item_code: 'BB-005',
    blend_code: 'BLEND-2024-005',
    weight: 600,
    transfer_id: 'TRF-005',
    created_at: '2024-01-17T11:00:00Z',
    status: 'REJECTED' as const,
    source_blend: 'SRC-BLEND-005',
    transfer_type: 'RECIPE_ADJUST' as const,
    completion_percentage: 0,
    quality_check: {
      approval_status: 'REJECTED',
      performed_by: 'QC-Supervisor',
      quality_score: 45,
      notes: 'Quality standards not met - contamination detected'
    },
    age_days: 3,
    transfer_efficiency: 0,
    completion_status: 'NOT_STARTED' as const,
  }
];

// Mock dashboard data
const mockDashboardData = {
  total_transfers: 45,
  total_weight_transferred: 15750.5,
  average_transfer_weight: 350,
  active_transfers: 12,
  completed_transfers_today: 8,
  pending_quality_checks: 5,
  average_completion_time: 4.2,
  transfer_efficiency: 92.5,
  weight_variance_average: 2.3,
  completion_rate: 78.5,
  transfer_type_distribution: {
    'BLEND_TO_BLEND': 15,
    'BATCH_TO_BATCH': 12,
    'QUALITY_UPGRADE': 8,
    'WEIGHT_BALANCE': 6,
    'RECIPE_ADJUST': 4
  },
  status_distribution: {
    'PENDING': 8,
    'IN_PROGRESS': 12,
    'QUALITY_CHECK': 5,
    'COMPLETED': 18,
    'REJECTED': 2
  },
  quality_approval_rate: 85.5,
  recent_activity: []
};


// Import the actual BlendbalanceOperations component and its imports
import { Search, Plus, Download, Scale, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import type { 
  BlendbalanceItem, 
} from '../types/blendbalance';
import { TRANSFER_TYPES, BLENDBALANCE_STATUS_LABELS } from '../types/blendbalance';

// Import the component functions from BlendbalanceOperations
import { BlendbalanceOperations } from './BlendbalanceOperations';

export function BlendbalanceTest() {
  const [showMockData, setShowMockData] = useState(false);
  const [testMode, setTestMode] = useState<'mock' | 'real'>('mock');

  if (testMode === 'real') {
    return (
      <div className="space-y-6">
        {/* Test Controls */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-4">🧪 Blendbalance Test Mode - Using Real API</h2>
          <button
            onClick={() => setTestMode('mock')}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Switch to Mock Data
          </button>
        </div>
        <BlendbalanceOperations />
      </div>
    );
  }

  // Mock Component with embedded mock data
  return (
    <div className="space-y-6">
      {/* Test Controls */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-yellow-800 mb-4">🧪 Blendbalance Test Mode</h2>
        
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => setTestMode('mock')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              testMode === 'mock'
                ? 'bg-yellow-600 text-white'
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            Use Mock Data
          </button>
          <button
            onClick={() => setTestMode('real')}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
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
            <h3 className="font-semibold mb-2">Mock Blendbalance Data:</h3>
            <pre className="text-xs">{JSON.stringify(mockBlendbalanceData, null, 2)}</pre>
            <h3 className="font-semibold mt-4 mb-2">Mock Dashboard Data:</h3>
            <pre className="text-xs">{JSON.stringify(mockDashboardData, null, 2)}</pre>
          </div>
        )}

        <div className="mt-4 text-sm text-yellow-700">
          <p>🔍 Test Scenarios:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Transfer ID: TRF-001 - In Progress (70% complete)</li>
            <li>Transfer ID: TRF-002 - Completed with approval</li>
            <li>Transfer ID: TRF-003 - Pending (not started)</li>
            <li>Transfer ID: TRF-004 - Quality Check with weight variance</li>
            <li>Transfer ID: TRF-005 - Rejected due to quality issues</li>
          </ul>
        </div>
      </div>

      {/* Render the mock version */}
      <MockBlendbalanceOperations />
    </div>
  );
}

// Mock version of BlendbalanceOperations with hardcoded data
function MockBlendbalanceOperations() {
  // State management
  const [searchTerm, setSearchTerm] = useState('');

  // Use mock data directly
  const dashboardData = mockDashboardData;
  const blendbalances = mockBlendbalanceData as BlendbalanceItem[];
  const pendingTransfers = mockBlendbalanceData.filter(b => b.status === 'PENDING');
  const qualityQueue = mockBlendbalanceData.filter(b => b.status === 'QUALITY_CHECK');
  
  const statistics = {
    totalTransfers: mockBlendbalanceData.length,
    totalWeight: mockBlendbalanceData.reduce((sum, b) => sum + b.weight, 0),
    transferredWeight: mockBlendbalanceData.reduce((sum, b) => sum + (b.transferred_weight || 0), 0),
    remainingWeight: mockBlendbalanceData.reduce((sum, b) => sum + (b.remaining_weight || 0), 0),
    averageCompletionPercentage: 52,
    statusCounts: { PENDING: 1, IN_PROGRESS: 1, QUALITY_CHECK: 1, COMPLETED: 1, REJECTED: 1 },
    transferTypeCounts: { BLEND_TO_BLEND: 1, BATCH_TO_BATCH: 1, QUALITY_UPGRADE: 1, WEIGHT_BALANCE: 1, RECIPE_ADJUST: 1 },
    transferEfficiency: 87.6,
    averageTransferWeight: 520
  };

  // Render the full UI with mock data
  return (
    <div className="space-y-6">
      {/* Copy the entire BlendbalanceOperations render content here */}
      {/* Header Section */}
      <div className="bg-tea-green-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">⚖️ Blendbalance Operations Dashboard</h1>
            <p className="text-tea-green-100">
              Blend Balance Transfers & Weight Distribution • Total Transfers: {dashboardData?.total_transfers || 0} • 
              Transferred: {dashboardData?.total_weight_transferred?.toFixed(1) || 0}kg
            </p>
          </div>
          
          {/* Global Search */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-tea-green-200" />
              <Input
                type="text"
                placeholder="Search transfers by ID, blend code, or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-96 bg-white/10 border-tea-green-400 text-white placeholder-tea-green-200"
              />
            </div>
            
            {/* Quick Actions */}
            <button className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md transition-colors">
              <Plus className="h-4 w-4" />
              <span>New Transfer</span>
            </button>
            <button className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md transition-colors">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transfers</p>
              <p className="text-3xl font-bold text-tea-green-600">
                {dashboardData?.total_transfers || statistics.totalTransfers}
              </p>
            </div>
            <div className="text-tea-green-500">
              <Scale className="h-8 w-8" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ↑ {dashboardData?.active_transfers || pendingTransfers?.length || 0} active now
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Weight Transferred</p>
              <p className="text-3xl font-bold text-tea-green-600">
                {(dashboardData?.total_weight_transferred || statistics.transferredWeight).toFixed(1)}kg
              </p>
            </div>
            <div className="text-tea-green-500">
              <TrendingUp className="h-8 w-8" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            📊 {(dashboardData?.average_transfer_weight || statistics.averageTransferWeight).toFixed(1)}kg avg per transfer
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transfer Efficiency</p>
              <p className="text-3xl font-bold text-tea-green-600">
                {(dashboardData?.transfer_efficiency || statistics.transferEfficiency).toFixed(1)}%
              </p>
            </div>
            <div className="text-green-500">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            📈 {statistics.averageCompletionPercentage.toFixed(1)}% avg completion
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Quality Checks</p>
              <p className="text-3xl font-bold text-tea-green-600">
                {dashboardData?.pending_quality_checks || qualityQueue?.length || 0}
              </p>
            </div>
            <div className="text-amber-500">
              <AlertTriangle className="h-8 w-8" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            ⚠️ {"Pending quality approval"}
          </p>
        </Card>
      </div>

      {/* Main Content - Show Table */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Transfer Operations ({blendbalances.length} transfers)
          </h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer ID</TableHead>
                  <TableHead>Blend Code</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Efficiency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blendbalances.map((transfer) => {
                  const statusInfo = BLENDBALANCE_STATUS_LABELS[transfer.status || 'PENDING'];
                  const transferTypeInfo = TRANSFER_TYPES[transfer.transfer_type || 'BLEND_TO_BLEND'];

                  return (
                    <TableRow 
                      key={transfer.id}
                      className="hover:bg-gray-50"
                    >
                      <TableCell className="font-medium text-tea-green-600">
                        {transfer.transfer_id}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        <div>{transfer.blend_code}</div>
                        <div className="text-xs text-gray-500">Item: {transfer.item_code}</div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div>{transfer.weight.toFixed(1)}kg</div>
                        {transfer.transferred_weight && (
                          <div className="text-xs text-gray-500">
                            {transfer.transferred_weight.toFixed(1)}kg transferred
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {statusInfo.icon} {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <span>{transferTypeInfo.icon}</span>
                          <span className="text-xs">{transferTypeInfo.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-tea-green-500 h-2 rounded-full"
                              style={{ width: `${transfer.completion_percentage || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">
                            {(transfer.completion_percentage || 0).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {(transfer.transfer_efficiency || 0).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {transfer.age_days || 0}d old
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
}