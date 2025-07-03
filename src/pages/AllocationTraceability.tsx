import { useState, useMemo } from 'react';
import { Package, Leaf, ArrowRight, BarChart3, Eye, GitBranch } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { 
  useTealineInventory,
  useAdminBlendsheets,
  useAdminFlavorsheets,
  useAdminHerblines,
  useAdminBlendbalances
} from '../hooks';

// Types for allocation tracking
interface AllocationItem {
  id: string;
  sourceType: string;
  sourceId: string;
  sourceName: string;
  targetType: string;
  targetId: string;
  targetName: string;
  allocatedWeight: number;
  status: string;
  createdDate: string;
  grade?: string;
  location?: string;
}

interface TraceabilityNode {
  id: string;
  type: string;
  name: string;
  status: string;
  weight: number;
  children: TraceabilityNode[];
  parent?: TraceabilityNode;
}

export function AllocationTraceability() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedView, setSelectedView] = useState<string>('allocations');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');

  // Fetch data from all material types
  const { data: tealineData = [], isLoading: tealineLoading } = useTealineInventory();
  const { data: blendsheetData = [], isLoading: blendsheetLoading } = useAdminBlendsheets();
  const { isLoading: flavorsheetLoading } = useAdminFlavorsheets();
  const { isLoading: herblineLoading } = useAdminHerblines();
  const { data: blendbalanceData = [], isLoading: blendbalanceLoading } = useAdminBlendbalances();

  const isLoading = tealineLoading || blendsheetLoading || flavorsheetLoading || 
                    herblineLoading || blendbalanceLoading;

  // Generate comprehensive allocation data with enhanced mockup
  const allocationData = useMemo((): AllocationItem[] => {
    const allocations: AllocationItem[] = [];

    // Enhanced mockup data for realistic allocations
    const mockTealineData = [
      { item_code: 'TEA001', garden: 'Dimbula Estate', grade: 'PEKOE', weight: 2500, location: 'Seeduwa-A1' },
      { item_code: 'TEA002', garden: 'Nuwara Eliya', grade: 'BOPF', weight: 3200, location: 'Seeduwa-A2' },
      { item_code: 'TEA003', garden: 'Kandy Hills', grade: 'FBOP', weight: 2800, location: 'Seeduwa-B1' },
      { item_code: 'TEA004', garden: 'Uva Province', grade: 'ORANGE_PEKOE', weight: 3500, location: 'Seeduwa-B2' },
      { item_code: 'TEA005', garden: 'Ratnapura', grade: 'FLOWERY_PEKOE', weight: 2100, location: 'Seeduwa-A1' },
      { item_code: 'TEA006', garden: 'Maskeliya', grade: 'PEKOE', weight: 2900, location: 'Seeduwa-A2' },
      { item_code: 'TEA007', garden: 'Bogawantalawa', grade: 'BOPF', weight: 3300, location: 'Seeduwa-B1' },
      { item_code: 'TEA008', garden: 'Haputale', grade: 'FBOP', weight: 2700, location: 'Seeduwa-B2' }
    ];

    const mockBlendbalanceData = [
      { item_code: 'BB001', blend_code: 'EARL_GREY', transfer_id: 'TXN-001', weight: 800 },
      { item_code: 'BB002', blend_code: 'ENGLISH_BREAKFAST', transfer_id: 'TXN-002', weight: 950 },
      { item_code: 'BB003', blend_code: 'CEYLON_GOLD', transfer_id: 'TXN-003', weight: 750 },
      { item_code: 'BB004', blend_code: 'ROYAL_BLEND', transfer_id: 'TXN-004', weight: 880 },
      { item_code: 'BB005', blend_code: 'MORNING_TEA', transfer_id: 'TXN-005', weight: 720 }
    ];

    const mockBlendsheets = [
      { no: 'BS001', name: 'Premium Ceylon Blend', target_weight: 5000, actual_weight: 4850, status: 'COMPLETED' },
      { no: 'BS002', name: 'Earl Grey Supreme', target_weight: 4500, actual_weight: 4320, status: 'COMPLETED' },
      { no: 'BS003', name: 'English Breakfast Classic', target_weight: 6000, actual_weight: 5780, status: 'IN_PROGRESS' },
      { no: 'BS004', name: 'Royal Ceylon Gold', target_weight: 4200, actual_weight: 4050, status: 'COMPLETED' },
      { no: 'BS005', name: 'Morning Blend Special', target_weight: 3800, actual_weight: 3650, status: 'IN_PROGRESS' },
      { no: 'BS006', name: 'High Grown Estate', target_weight: 5500, actual_weight: 0, status: 'ALLOCATED' }
    ];

    const mockShipments = [
      { id: 'SHIP-001', name: 'Export to UK - Container 1', customer: 'British Tea Co.', port: 'Colombo' },
      { id: 'SHIP-002', name: 'Export to Germany - Container 2', customer: 'Deutsche Tee GmbH', port: 'Colombo' },
      { id: 'SHIP-003', name: 'Export to USA - Container 3', customer: 'American Tea Corp', port: 'Colombo' },
      { id: 'SHIP-004', name: 'Export to Japan - Container 4', customer: 'Tokyo Tea Ltd', port: 'Colombo' },
      { id: 'SHIP-005', name: 'Local Distribution', customer: 'Ceylon Tea Board', port: 'Colombo' }
    ];

    // Generate Tealine → Blendsheet allocations
    mockBlendsheets.forEach((blendsheet, bIndex) => {
      const requiredTealines = 2 + (bIndex % 3); // 2-4 tealines per blendsheet
      const startIndex = (bIndex * 2) % mockTealineData.length;
      
      for (let i = 0; i < requiredTealines; i++) {
        const tealineIndex = (startIndex + i) % mockTealineData.length;
        const tealine = mockTealineData[tealineIndex];
        const allocatedWeight = Math.round((blendsheet.actual_weight || blendsheet.target_weight) / requiredTealines);
        
        allocations.push({
          id: `${blendsheet.no}-${tealine.item_code}`,
          sourceType: 'Tealine',
          sourceId: tealine.item_code,
          sourceName: `${tealine.garden} - ${tealine.grade}`,
          targetType: 'Blendsheet',
          targetId: blendsheet.no,
          targetName: blendsheet.name,
          allocatedWeight: allocatedWeight,
          status: blendsheet.status === 'ALLOCATED' ? 'PENDING' : 'ALLOCATED',
          createdDate: new Date(Date.now() - (bIndex + i) * 24 * 60 * 60 * 1000).toISOString(),
          grade: tealine.grade,
          location: tealine.location
        });
      }
    });

    // Generate Blendbalance → Blendsheet allocations
    mockBlendsheets.forEach((blendsheet, bIndex) => {
      if (bIndex < mockBlendbalanceData.length) {
        const blendbalance = mockBlendbalanceData[bIndex];
        allocations.push({
          id: `${blendsheet.no}-${blendbalance.item_code}`,
          sourceType: 'Blendbalance',
          sourceId: blendbalance.item_code,
          sourceName: `${blendbalance.blend_code} (${blendbalance.transfer_id})`,
          targetType: 'Blendsheet',
          targetId: blendsheet.no,
          targetName: blendsheet.name,
          allocatedWeight: blendbalance.weight,
          status: blendsheet.status === 'ALLOCATED' ? 'PENDING' : 'ALLOCATED',
          createdDate: new Date(Date.now() - bIndex * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    });

    // Generate Blendsheet → Shipment allocations
    mockBlendsheets.forEach((blendsheet, bIndex) => {
      if (blendsheet.status === 'COMPLETED' && bIndex < mockShipments.length) {
        const shipment = mockShipments[bIndex];
        allocations.push({
          id: `${shipment.id}-${blendsheet.no}`,
          sourceType: 'Blendsheet',
          sourceId: blendsheet.no,
          sourceName: blendsheet.name,
          targetType: 'Shipment',
          targetId: shipment.id,
          targetName: `${shipment.name} (${shipment.customer})`,
          allocatedWeight: blendsheet.actual_weight,
          status: 'SHIPPED',
          createdDate: new Date(Date.now() - (bIndex * 12 * 60 * 60 * 1000)).toISOString()
        });
      }
    });

    // Generate some Herbline allocations
    const mockHerblineAllocations = [
      {
        sourceId: 'HERB001',
        sourceName: 'Chamomile Flowers - Premium Grade',
        targetId: 'BS007',
        targetName: 'Herbal Wellness Blend',
        weight: 450
      },
      {
        sourceId: 'HERB002', 
        sourceName: 'Peppermint Leaves - Organic',
        targetId: 'BS008',
        targetName: 'Digestive Herbal Tea',
        weight: 320
      },
      {
        sourceId: 'HERB003',
        sourceName: 'Lemon Grass - Fresh Cut',
        targetId: 'BS009',
        targetName: 'Citrus Herbal Blend',
        weight: 280
      }
    ];

    mockHerblineAllocations.forEach((herb, index) => {
      allocations.push({
        id: `herbline-${herb.sourceId}`,
        sourceType: 'Herbline',
        sourceId: herb.sourceId,
        sourceName: herb.sourceName,
        targetType: 'Blendsheet',
        targetId: herb.targetId,
        targetName: herb.targetName,
        allocatedWeight: herb.weight,
        status: 'ALLOCATED',
        createdDate: new Date(Date.now() - (index + 15) * 24 * 60 * 60 * 1000).toISOString()
      });
    });

    // Generate some Flavorsheet allocations
    const mockFlavorsheetAllocations = [
      {
        sourceId: 'FL001',
        sourceName: 'Vanilla Essence Blend',
        targetId: 'BS010',
        targetName: 'Vanilla Ceylon Tea',
        weight: 150
      },
      {
        sourceId: 'FL002',
        sourceName: 'Bergamot Oil Infusion',
        targetId: 'BS002',
        targetName: 'Earl Grey Supreme',
        weight: 125
      },
      {
        sourceId: 'FL003',
        sourceName: 'Jasmine Flower Extract',
        targetId: 'BS011',
        targetName: 'Jasmine Green Tea',
        weight: 180
      }
    ];

    mockFlavorsheetAllocations.forEach((flavor, index) => {
      allocations.push({
        id: `flavorsheet-${flavor.sourceId}`,
        sourceType: 'Flavorsheet',
        sourceId: flavor.sourceId,
        sourceName: flavor.sourceName,
        targetType: 'Blendsheet',
        targetId: flavor.targetId,
        targetName: flavor.targetName,
        allocatedWeight: flavor.weight,
        status: 'ALLOCATED',
        createdDate: new Date(Date.now() - (index + 20) * 24 * 60 * 60 * 1000).toISOString()
      });
    });

    return allocations;
  }, [tealineData, blendsheetData, blendbalanceData]);

  // Generate enhanced traceability tree with comprehensive data
  const traceabilityData = useMemo((): TraceabilityNode[] => {
    const nodes: TraceabilityNode[] = [];

    // Create unique shipment nodes as root
    const uniqueShipments = new Map<string, TraceabilityNode>();
    
    allocationData
      .filter(a => a.targetType === 'Shipment')
      .forEach(a => {
        if (!uniqueShipments.has(a.targetId)) {
          uniqueShipments.set(a.targetId, {
            id: a.targetId,
            type: 'Shipment',
            name: a.targetName,
            status: 'SHIPPED',
            weight: 0, // Will be calculated
            children: []
          });
        }
      });

    // Build traceability for each shipment
    uniqueShipments.forEach(shipment => {
      let totalShipmentWeight = 0;

      // Find blendsheets allocated to this shipment
      const blendsheetAllocations = allocationData.filter(
        a => a.targetType === 'Shipment' && a.targetId === shipment.id
      );

      blendsheetAllocations.forEach(allocation => {
        totalShipmentWeight += allocation.allocatedWeight;
        
        const blendsheetNode: TraceabilityNode = {
          id: allocation.sourceId,
          type: 'Blendsheet',
          name: allocation.sourceName,
          status: 'COMPLETED',
          weight: allocation.allocatedWeight,
          children: []
        };

        // Find all materials allocated to this blendsheet
        const materialAllocations = allocationData.filter(
          a => a.targetType === 'Blendsheet' && a.targetId === allocation.sourceId
        );

        // Group materials by type for better organization
        const materialsByType = materialAllocations.reduce((acc, mat) => {
          if (!acc[mat.sourceType]) acc[mat.sourceType] = [];
          acc[mat.sourceType].push(mat);
          return acc;
        }, {} as Record<string, typeof materialAllocations>);

        // Add materials to blendsheet node
        Object.entries(materialsByType).forEach(([, materials]) => {
          materials.forEach(matAllocation => {
            blendsheetNode.children.push({
              id: matAllocation.sourceId,
              type: matAllocation.sourceType,
              name: matAllocation.sourceName,
              status: 'PROCESSED',
              weight: matAllocation.allocatedWeight,
              children: []
            });
          });
        });

        // Sort children by weight (descending)
        blendsheetNode.children.sort((a, b) => b.weight - a.weight);
        
        shipment.children.push(blendsheetNode);
      });

      // Update shipment total weight
      shipment.weight = totalShipmentWeight;
      
      // Sort blendsheets by weight (descending)
      shipment.children.sort((a, b) => b.weight - a.weight);
      
      nodes.push(shipment);
    });

    // Add some mock standalone blendsheets that haven't been shipped yet
    const unshippedBlendsheets = allocationData
      .filter(a => a.targetType === 'Blendsheet' && 
                   !allocationData.some(ship => ship.sourceId === a.targetId && ship.targetType === 'Shipment'))
      .reduce((acc, a) => {
        if (!acc.has(a.targetId)) {
          acc.set(a.targetId, {
            id: a.targetId,
            type: 'Blendsheet',
            name: a.targetName,
            status: 'IN_PROGRESS',
            weight: 0,
            children: []
          });
        }
        return acc;
      }, new Map<string, TraceabilityNode>());

    unshippedBlendsheets.forEach(blendsheet => {
      const materialAllocations = allocationData.filter(
        a => a.targetType === 'Blendsheet' && a.targetId === blendsheet.id
      );

      let totalWeight = 0;
      materialAllocations.forEach(matAllocation => {
        totalWeight += matAllocation.allocatedWeight;
        blendsheet.children.push({
          id: matAllocation.sourceId,
          type: matAllocation.sourceType,
          name: matAllocation.sourceName,
          status: 'ALLOCATED',
          weight: matAllocation.allocatedWeight,
          children: []
        });
      });

      blendsheet.weight = totalWeight;
      blendsheet.children.sort((a, b) => b.weight - a.weight);
      
      if (blendsheet.children.length > 0) {
        nodes.push(blendsheet);
      }
    });

    // Sort all nodes by weight (descending)
    return nodes.sort((a, b) => b.weight - a.weight);
  }, [allocationData]);

  // Filter allocations
  const filteredAllocations = useMemo(() => {
    return allocationData.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.targetId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMaterial = selectedMaterial === 'all' || 
        item.sourceType.toLowerCase() === selectedMaterial ||
        item.targetType.toLowerCase() === selectedMaterial;

      return matchesSearch && matchesMaterial;
    });
  }, [allocationData, searchTerm, selectedMaterial]);

  // Calculate allocation summary
  const allocationSummary = useMemo(() => {
    const summary = {
      totalAllocations: allocationData.length,
      totalWeight: allocationData.reduce((sum, item) => sum + item.allocatedWeight, 0),
      byStatus: {
        PENDING: allocationData.filter(a => a.status === 'PENDING').length,
        ALLOCATED: allocationData.filter(a => a.status === 'ALLOCATED').length,
        SHIPPED: allocationData.filter(a => a.status === 'SHIPPED').length
      },
      byType: {
        'Tealine → Blendsheet': allocationData.filter(a => a.sourceType === 'Tealine' && a.targetType === 'Blendsheet').length,
        'Blendbalance → Blendsheet': allocationData.filter(a => a.sourceType === 'Blendbalance' && a.targetType === 'Blendsheet').length,
        'Herbline → Blendsheet': allocationData.filter(a => a.sourceType === 'Herbline' && a.targetType === 'Blendsheet').length,
        'Flavorsheet → Blendsheet': allocationData.filter(a => a.sourceType === 'Flavorsheet' && a.targetType === 'Blendsheet').length,
        'Blendsheet → Shipment': allocationData.filter(a => a.sourceType === 'Blendsheet' && a.targetType === 'Shipment').length
      }
    };
    return summary;
  }, [allocationData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loading size="lg" />
        <p className="mt-4 text-sm text-gray-600">Loading allocation and traceability data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Allocation & Traceability</h2>
        <p className="mt-1 text-sm text-gray-500">
          Track material allocations and trace the flow from source to shipment
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Allocations</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {allocationSummary.totalAllocations}
              </p>
            </div>
            <GitBranch className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Weight</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {allocationSummary.totalWeight.toLocaleString()} kg
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {allocationSummary.byStatus.PENDING}
              </p>
            </div>
            <Package className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Allocated</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {allocationSummary.byStatus.ALLOCATED}
              </p>
            </div>
            <GitBranch className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Shipped</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {allocationSummary.byStatus.SHIPPED}
              </p>
            </div>
            <Leaf className="h-8 w-8 text-tea-600" />
          </div>
        </Card>
      </div>

      {/* Allocation Type Summary */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocation Flow Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(allocationSummary.byType).map(([type, count]) => (
            <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">{type}</p>
              <p className="text-xl font-semibold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* View Toggle and Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={selectedView}
            onValueChange={setSelectedView}
            placeholder="Select View"
            options={[
              { value: 'allocations', label: 'Allocation List' },
              { value: 'traceability', label: 'Traceability Tree' }
            ]}
          />

          <Input
            placeholder="Search allocations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          
          <Select
            value={selectedMaterial}
            onValueChange={setSelectedMaterial}
            placeholder="All Material Types"
            options={[
              { value: 'all', label: 'All Material Types' },
              { value: 'tealine', label: 'Tealine' },
              { value: 'blendsheet', label: 'Blendsheet' },
              { value: 'blendbalance', label: 'Blendbalance' },
              { value: 'herbline', label: 'Herbline' },
              { value: 'flavorsheet', label: 'Flavorsheet' },
              { value: 'shipment', label: 'Shipment' }
            ]}
          />

          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {selectedView === 'allocations' ? 'List View' : 'Tree View'}
            </span>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      {selectedView === 'allocations' ? (
        /* Allocation List View */
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Material Allocations</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arrow
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAllocations.map((allocation) => (
                  <tr key={allocation.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {allocation.sourceName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {allocation.sourceType}: {allocation.sourceId}
                        </div>
                        {allocation.grade && (
                          <div className="text-xs text-gray-400">Grade: {allocation.grade}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <ArrowRight className="h-5 w-5 text-gray-400 mx-auto" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {allocation.targetName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {allocation.targetType}: {allocation.targetId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {allocation.allocatedWeight.toLocaleString()} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={
                        allocation.status === 'SHIPPED' ? 'success' : 
                        allocation.status === 'ALLOCATED' ? 'info' :
                        allocation.status === 'PENDING' ? 'warning' : 'default'
                      }>
                        {allocation.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(allocation.createdDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredAllocations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No allocations found matching your filters
              </div>
            )}
          </div>
        </Card>
      ) : (
        /* Traceability Tree View */
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Material Traceability Tree</h3>
          <div className="space-y-6">
            {traceabilityData.map((shipment) => (
              <div key={shipment.id} className="border rounded-lg p-4">
                {/* Shipment Level */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0 w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-lg font-medium text-gray-900">{shipment.name}</div>
                    <div className="text-sm text-gray-500">
                      {shipment.type}: {shipment.id} • {shipment.weight.toLocaleString()} kg
                    </div>
                  </div>
                  <Badge variant="success">{shipment.status}</Badge>
                </div>

                {/* Blendsheet Level */}
                {shipment.children.map((blendsheet) => (
                  <div key={blendsheet.id} className="ml-8 mb-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-md font-medium text-gray-800">{blendsheet.name}</div>
                        <div className="text-sm text-gray-500">
                          {blendsheet.type}: {blendsheet.id} • {blendsheet.weight.toLocaleString()} kg
                        </div>
                      </div>
                      <Badge variant="info">{blendsheet.status}</Badge>
                    </div>

                    {/* Material Level */}
                    {blendsheet.children.map((material) => (
                      <div key={material.id} className="ml-8 flex items-center space-x-3 mb-2">
                        <div className="flex-shrink-0 w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700">{material.name}</div>
                          <div className="text-xs text-gray-500">
                            {material.type}: {material.id} • {material.weight.toLocaleString()} kg
                          </div>
                        </div>
                        <Badge variant="default">{material.status}</Badge>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}

            {traceabilityData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No traceability data available
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}