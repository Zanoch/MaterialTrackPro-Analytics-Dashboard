import { useState, useMemo } from 'react';
import { Package, Leaf, Sparkles, Flower2, Scale, TrendingUp, Clock, CheckCircle, Truck } from 'lucide-react';
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

// Material type configuration
const MATERIAL_TYPES = [
  { key: 'tealine', label: 'Tealine', icon: Package, color: 'blue' },
  { key: 'blendsheet', label: 'Blendsheet', icon: Leaf, color: 'green' },
  { key: 'flavorsheet', label: 'Flavorsheet', icon: Sparkles, color: 'purple' },
  { key: 'herbline', label: 'Herbline', icon: Flower2, color: 'pink' },
  { key: 'blendbalance', label: 'Blendbalance', icon: Scale, color: 'orange' }
] as const;

// Status configuration
const STATUS_CONFIG = {
  ACCEPTED: { label: 'Accepted', icon: Package, color: 'blue', badgeVariant: 'info' as const },
  IN_PROCESS: { label: 'In Process', icon: Clock, color: 'yellow', badgeVariant: 'warning' as const },
  PROCESSED: { label: 'Processed', icon: CheckCircle, color: 'green', badgeVariant: 'success' as const },
  DISPATCHED: { label: 'Dispatched', icon: Truck, color: 'gray', badgeVariant: 'default' as const }
} as const;

export function MaterialStatusTracking() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Fetch data from all material types
  const { data: tealineResponse, isLoading: tealineLoading } = useTealineInventory();
  const tealineData = Array.isArray(tealineResponse) ? tealineResponse : (tealineResponse?.data || []);
  const { data: blendsheetData = [], isLoading: blendsheetLoading } = useAdminBlendsheets();
  const { data: flavorsheetData = [], isLoading: flavorsheetLoading } = useAdminFlavorsheets() as { data: any[], isLoading: boolean };
  const { data: herblineData = [], isLoading: herblineLoading } = useAdminHerblines();
  const { data: blendbalanceData = [], isLoading: blendbalanceLoading } = useAdminBlendbalances();

  const isLoading = tealineLoading || blendsheetLoading || flavorsheetLoading || 
                    herblineLoading || blendbalanceLoading;

  // Aggregate all materials with their status
  const allMaterials = useMemo(() => {
    const materials: Array<{
      type: string;
      itemCode: string;
      description: string;
      status: string;
      createdDate: string | number;
      remaining?: number;
      location?: string;
      broker?: string;
      batchCount?: number;
      weight?: number;
    }> = [];

    // Process tealine data
    tealineData.forEach((item: any) => {
      materials.push({
        type: 'tealine',
        itemCode: item.item_code,
        description: `${item.garden || ''} - ${item.grade || ''}`,
        status: item.status || 'ACCEPTED',
        createdDate: item.created_at,
        remaining: item.remaining,
        location: item.location,
        broker: item.broker
      });
    });

    // Process blendsheet data
    blendsheetData.forEach(item => {
      const status = item.status || 'ACCEPTED';
      materials.push({
        type: 'blendsheet',
        itemCode: item.blendsheet_no,
        description: item.standard,
        status,
        createdDate: item.created_ts || new Date().toISOString(),
        remaining: item.target_weight - (item.actual_weight || 0),
        batchCount: item.created_batches || 0
      });
    });

    // Process flavorsheet data
    flavorsheetData.forEach(item => {
      const status = item.batch_created ? 'IN_PROCESS' : 'ACCEPTED';
      materials.push({
        type: 'flavorsheet',
        itemCode: item.flavorsheet_no,
        description: item.flavor_code,
        status,
        createdDate: new Date().toISOString(), // Using current date as placeholder
        batchCount: item.batch_created ? 1 : 0
      });
    });

    // Process herbline data
    herblineData.forEach((item: any) => {
      const totalRemaining = item.record_list?.reduce((sum: any, rec: any) => sum + rec.remaining, 0) || 0;
      const status = totalRemaining === 0 ? 'PROCESSED' : 
                     totalRemaining < item.weight ? 'IN_PROCESS' : 'ACCEPTED';
      materials.push({
        type: 'herbline',
        itemCode: item.item_code,
        description: item.item_name,
        status,
        createdDate: item.created_at,
        remaining: totalRemaining,
        location: item.record_list?.[0]?.store_location
      });
    });

    // Process blendbalance data
    blendbalanceData.forEach(item => {
      const hasRecords = item.record_list && item.record_list.length > 0;
      const status = hasRecords ? 'IN_PROCESS' : 'ACCEPTED';
      materials.push({
        type: 'blendbalance',
        itemCode: item.item_code,
        description: `${item.blend_code} - ${item.transfer_id}`,
        status,
        createdDate: item.created_at,
        weight: item.weight
      });
    });

    return materials;
  }, [tealineData, blendsheetData, flavorsheetData, herblineData, blendbalanceData]);

  // Filter materials
  const filteredMaterials = useMemo(() => {
    return allMaterials.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMaterial = selectedMaterial === 'all' || item.type === selectedMaterial;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

      return matchesSearch && matchesMaterial && matchesStatus;
    });
  }, [allMaterials, searchTerm, selectedMaterial, selectedStatus]);

  // Calculate status summary
  const statusSummary = useMemo(() => {
    const summary = {
      ACCEPTED: 0,
      IN_PROCESS: 0,
      PROCESSED: 0,
      DISPATCHED: 0
    };

    allMaterials.forEach(item => {
      if (item.status in summary) {
        summary[item.status as keyof typeof summary]++;
      }
    });

    return summary;
  }, [allMaterials]);

  // Calculate material type summary
  const materialSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    
    MATERIAL_TYPES.forEach(type => {
      summary[type.key] = 0;
    });

    allMaterials.forEach(item => {
      if (item.type in summary) {
        summary[item.type]++;
      }
    });

    return summary;
  }, [allMaterials]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loading size="lg" />
        <p className="mt-4 text-sm text-gray-600">Loading material status data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Material Status Tracking</h2>
        <p className="mt-1 text-sm text-gray-500">
          Track the status of all materials across the processing pipeline
        </p>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const Icon = config.icon;
          const count = statusSummary[status as keyof typeof statusSummary];
          const percentage = allMaterials.length > 0 
            ? ((count / allMaterials.length) * 100).toFixed(1)
            : '0';

          return (
            <Card key={status}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{config.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{count}</p>
                  <p className="mt-1 text-sm text-gray-500">{percentage}% of total</p>
                </div>
                <div className={`p-3 rounded-full bg-${config.color}-100`}>
                  <Icon className={`h-6 w-6 text-${config.color}-600`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Material Type Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {MATERIAL_TYPES.map(type => {
          const Icon = type.icon;
          const count = materialSummary[type.key];
          
          return (
            <Card key={type.key} className="text-center">
              <Icon className={`h-8 w-8 mx-auto text-${type.color}-600 mb-2`} />
              <p className="text-sm font-medium text-gray-600">{type.label}</p>
              <p className="text-xl font-semibold text-gray-900">{count}</p>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search by item code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          
          <Select
            value={selectedMaterial}
            onValueChange={setSelectedMaterial}
            placeholder="All Materials"
            options={[
              { value: 'all', label: 'All Materials' },
              ...MATERIAL_TYPES.map(type => ({ value: type.key, label: type.label }))
            ]}
          />

          <Select
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            placeholder="All Statuses"
            options={[
              { value: 'all', label: 'All Statuses' },
              ...Object.entries(STATUS_CONFIG).map(([status, config]) => ({
                value: status,
                label: config.label
              }))
            ]}
          />
        </div>
      </Card>

      {/* Materials Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMaterials.map((item, index) => {
                const materialType = MATERIAL_TYPES.find(t => t.key === item.type);
                const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
                const Icon = materialType?.icon || Package;

                return (
                  <tr key={`${item.type}-${item.itemCode}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Icon className={`h-5 w-5 text-${materialType?.color || 'gray'}-600 mr-2`} />
                        <span className="text-sm font-medium text-gray-900">
                          {materialType?.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.itemCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={statusConfig?.badgeVariant || 'default'}>
                        {statusConfig?.label || item.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.createdDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.location && <span>📍 {item.location}</span>}
                      {item.remaining !== undefined && item.remaining > 0 && (
                        <span className="ml-2">📦 {item.remaining} kg</span>
                      )}
                      {item.batchCount !== undefined && item.batchCount > 0 && (
                        <span className="ml-2">🔄 {item.batchCount} batches</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredMaterials.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No materials found matching your filters
            </div>
          )}
        </div>
      </Card>

      {/* Status Flow Visualization */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Flow Pipeline</h3>
        <div className="flex items-center justify-between">
          {Object.entries(STATUS_CONFIG).map(([status, config], index) => {
            const Icon = config.icon;
            const count = statusSummary[status as keyof typeof statusSummary];
            
            return (
              <div key={status} className="flex items-center">
                <div className="text-center">
                  <div className={`p-4 rounded-full bg-${config.color}-100 mb-2`}>
                    <Icon className={`h-8 w-8 text-${config.color}-600`} />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{config.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{count}</p>
                </div>
                {index < Object.entries(STATUS_CONFIG).length - 1 && (
                  <TrendingUp className="h-6 w-6 text-gray-400 mx-4" />
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}