import { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Package, 
  Leaf, 
  Sparkles, 
  Flower2, 
  Scale,
  Play,
  AlertTriangle,
  Users,
  MapPin
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { 
  useAdminBlendsheets,
  useAdminFlavorsheets,
  useAdminHerblines,
  useAdminBlendbalances,
  useTealineInventory
} from '../hooks';

// Types for production scheduling
interface ProductionScheduleItem {
  id: string;
  materialType: 'Tealine' | 'Blendsheet' | 'Flavorsheet' | 'Herbline' | 'Blendbalance';
  itemCode: string;
  itemName: string;
  scheduledDate: Date;
  scheduledTime: string;
  duration: number; // hours
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
  assignedTo: string;
  location: string;
  requiredWeight: number;
  availableWeight: number;
  dependencies: string[];
  estimatedCompletion: Date;
}

interface ProductionCapacity {
  location: string;
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
  operatorCount: number;
  equipmentStatus: 'OPERATIONAL' | 'MAINTENANCE' | 'OFFLINE';
}

// Material type configuration
const MATERIAL_TYPE_CONFIG = {
  Tealine: { icon: Package, color: 'blue', bgColor: 'bg-blue-50' },
  Blendsheet: { icon: Leaf, color: 'green', bgColor: 'bg-green-50' },
  Flavorsheet: { icon: Sparkles, color: 'purple', bgColor: 'bg-purple-50' },
  Herbline: { icon: Flower2, color: 'pink', bgColor: 'bg-pink-50' },
  Blendbalance: { icon: Scale, color: 'orange', bgColor: 'bg-orange-50' }
} as const;

export function ProductionScheduling() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'schedule' | 'capacity' | 'timeline'>('schedule');

  // Fetch data from all material types
  const { data: tealineResponse, isLoading: tealineLoading } = useTealineInventory();
  const tealineData = Array.isArray(tealineResponse) ? tealineResponse : (tealineResponse?.data || []);
  const { data: blendsheetData = [], isLoading: blendsheetLoading } = useAdminBlendsheets();
  const { data: flavorsheetData = [], isLoading: flavorsheetLoading } = useAdminFlavorsheets() as { data: any[], isLoading: boolean };
  const { data: herblineData = [], isLoading: herblineLoading } = useAdminHerblines();
  const { data: blendbalanceData = [], isLoading: blendbalanceLoading } = useAdminBlendbalances();

  const isLoading = tealineLoading || blendsheetLoading || flavorsheetLoading || 
                    herblineLoading || blendbalanceLoading;

  // Generate production schedule from material data
  const productionSchedule = useMemo((): ProductionScheduleItem[] => {
    const schedule: ProductionScheduleItem[] = [];
    const baseDate = new Date(selectedDate);

    // Add tealine processing schedules
    tealineData.forEach((item: any, index: any) => {
      if (item.pending && item.pending > 0) {
        const scheduleDate = new Date(baseDate);
        scheduleDate.setDate(scheduleDate.getDate() + (index % 7));
        
        schedule.push({
          id: `tealine-${item.item_code}-${item.created_ts}`,
          materialType: 'Tealine',
          itemCode: item.item_code,
          itemName: `${item.garden || 'Unknown Garden'} - ${item.grade || 'Unknown Grade'}`,
          scheduledDate: scheduleDate,
          scheduledTime: `${8 + (index % 8)}:00`,
          duration: Math.ceil((item.pending || 0) / 50), // 50 bags per hour
          priority: item.pending > 100 ? 'HIGH' : item.pending > 50 ? 'MEDIUM' : 'LOW',
          status: 'SCHEDULED',
          assignedTo: `Operator ${(index % 5) + 1}`,
          location: item.location || 'Warehouse A',
          requiredWeight: (item.pending || 0) * 25, // Assuming 25kg per bag
          availableWeight: item.remaining || 0,
          dependencies: [],
          estimatedCompletion: new Date(scheduleDate.getTime() + Math.ceil((item.pending || 0) / 50) * 60 * 60 * 1000)
        });
      }
    });

    // Add blendsheet production schedules
    blendsheetData.forEach((item, index) => {
      if (item.created_batches < item.no_of_batches) {
        const scheduleDate = new Date(baseDate);
        scheduleDate.setDate(scheduleDate.getDate() + ((index + 2) % 7));
        
        const remainingBatches = item.no_of_batches - item.created_batches;
        
        schedule.push({
          id: `blendsheet-${item.blendsheet_no}`,
          materialType: 'Blendsheet',
          itemCode: item.blendsheet_no,
          itemName: item.standard,
          scheduledDate: scheduleDate,
          scheduledTime: `${9 + (index % 7)}:00`,
          duration: remainingBatches * 2, // 2 hours per batch
          priority: remainingBatches > 5 ? 'HIGH' : 'MEDIUM',
          status: item.created_batches > 0 ? 'IN_PROGRESS' : 'SCHEDULED',
          assignedTo: `Blend Team ${(index % 3) + 1}`,
          location: 'Blending Floor',
          requiredWeight: remainingBatches * 1000, // 1000kg per batch
          availableWeight: item.actual_weight || 0,
          dependencies: ['tealine-processing'],
          estimatedCompletion: new Date(scheduleDate.getTime() + remainingBatches * 2 * 60 * 60 * 1000)
        });
      }
    });

    // Add flavorsheet production schedules
    flavorsheetData.forEach((item, index) => {
      if (!item.batch_created) {
        const scheduleDate = new Date(baseDate);
        scheduleDate.setDate(scheduleDate.getDate() + ((index + 4) % 7));
        
        schedule.push({
          id: `flavorsheet-${item.flavorsheet_no}`,
          materialType: 'Flavorsheet',
          itemCode: item.flavorsheet_no,
          itemName: item.flavor_code,
          scheduledDate: scheduleDate,
          scheduledTime: `${10 + (index % 6)}:00`,
          duration: 4, // 4 hours for flavor batch
          priority: 'MEDIUM',
          status: 'SCHEDULED',
          assignedTo: `Flavor Specialist ${(index % 2) + 1}`,
          location: 'Flavor Lab',
          requiredWeight: 500, // Standard flavor batch
          availableWeight: 500,
          dependencies: ['herbline-processing'],
          estimatedCompletion: new Date(scheduleDate.getTime() + 4 * 60 * 60 * 1000)
        });
      }
    });

    return schedule.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }, [tealineData, blendsheetData, flavorsheetData, herblineData, blendbalanceData, selectedDate]);

  // Generate production capacity data
  const productionCapacity = useMemo((): ProductionCapacity[] => {
    const locations = ['Warehouse A', 'Warehouse B', 'Blending Floor', 'Flavor Lab', 'Processing Area'];
    
    return locations.map((location, index) => {
      const scheduledItems = productionSchedule.filter(item => 
        item.location === location && 
        item.scheduledDate.toDateString() === new Date(selectedDate).toDateString()
      );
      
      const usedCapacity = scheduledItems.reduce((sum, item) => sum + item.duration, 0);
      const totalCapacity = 16; // 16 hours per day
      
      return {
        location,
        totalCapacity,
        usedCapacity,
        availableCapacity: totalCapacity - usedCapacity,
        operatorCount: 3 + (index % 3),
        equipmentStatus: index === 2 ? 'MAINTENANCE' : 'OPERATIONAL'
      };
    });
  }, [productionSchedule, selectedDate]);

  // Filter schedule based on selected filters
  const filteredSchedule = useMemo(() => {
    return productionSchedule.filter(item => {
      const matchesDate = item.scheduledDate.toDateString() === new Date(selectedDate).toDateString();
      const matchesLocation = selectedLocation === 'all' || item.location === selectedLocation;
      const matchesMaterialType = selectedMaterialType === 'all' || 
        item.materialType.toLowerCase() === selectedMaterialType;
      
      return matchesDate && matchesLocation && matchesMaterialType;
    });
  }, [productionSchedule, selectedDate, selectedLocation, selectedMaterialType]);

  // Get unique locations for filter
  const locations = useMemo(() => {
    return [...new Set(productionSchedule.map(item => item.location))];
  }, [productionSchedule]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loading size="lg" />
        <p className="mt-4 text-sm text-gray-600">Loading production schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Production Scheduling</h2>
        <p className="mt-1 text-sm text-gray-500">
          Plan and manage production activities across all material types
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Tasks</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {filteredSchedule.length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {filteredSchedule.filter(item => item.status === 'IN_PROGRESS').length}
              </p>
            </div>
            <Play className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {filteredSchedule.filter(item => item.priority === 'HIGH' || item.priority === 'URGENT').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Capacity</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {Math.round(productionCapacity.reduce((sum, cap) => sum + (cap.usedCapacity / cap.totalCapacity * 100), 0) / productionCapacity.length)}%
              </p>
            </div>
            <Clock className="h-8 w-8 text-tea-600" />
          </div>
        </Card>
      </div>

      {/* Filters and View Mode */}
      <div className="flex flex-wrap gap-4 items-center">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto"
        />
        
        <Select
          value={selectedLocation}
          onValueChange={setSelectedLocation}
          placeholder="All Locations"
          options={[
            { value: 'all', label: 'All Locations' },
            ...locations.map(location => ({ value: location, label: location }))
          ]}
        />
        
        <Select
          value={selectedMaterialType}
          onValueChange={setSelectedMaterialType}
          placeholder="All Material Types"
          options={[
            { value: 'all', label: 'All Material Types' },
            { value: 'tealine', label: 'Tealine' },
            { value: 'blendsheet', label: 'Blendsheet' },
            { value: 'flavorsheet', label: 'Flavorsheet' },
            { value: 'herbline', label: 'Herbline' },
            { value: 'blendbalance', label: 'Blendbalance' }
          ]}
        />
        
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={() => setViewMode('schedule')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              viewMode === 'schedule' 
                ? 'bg-tea-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => setViewMode('capacity')}
            className={`px-4 py-2 text-sm font-medium ${
              viewMode === 'capacity' 
                ? 'bg-tea-600 text-white' 
                : 'bg-white text-gray-700 border-t border-b border-gray-300 hover:bg-gray-50'
            }`}
          >
            Capacity
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              viewMode === 'timeline' 
                ? 'bg-tea-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'schedule' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Schedule</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSchedule.map((item) => {
                  const materialConfig = MATERIAL_TYPE_CONFIG[item.materialType];
                  const Icon = materialConfig.icon;
                  
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-md ${materialConfig.bgColor}`}>
                            <Icon className="h-4 w-4 text-gray-700" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                            <div className="text-sm text-gray-500">{item.itemCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.scheduledTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.duration}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          item.priority === 'URGENT' ? 'error' :
                          item.priority === 'HIGH' ? 'warning' :
                          item.priority === 'MEDIUM' ? 'info' : 'default'
                        }>
                          {item.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          item.status === 'COMPLETED' ? 'success' :
                          item.status === 'IN_PROGRESS' ? 'warning' :
                          item.status === 'DELAYED' ? 'error' : 'info'
                        }>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{item.assignedTo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{item.location}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredSchedule.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No production tasks scheduled for the selected criteria
              </div>
            )}
          </div>
        </Card>
      )}

      {viewMode === 'capacity' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {productionCapacity.map((capacity) => (
            <Card key={capacity.location}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{capacity.location}</h3>
                <Badge variant={capacity.equipmentStatus === 'OPERATIONAL' ? 'success' : 'warning'}>
                  {capacity.equipmentStatus}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Capacity Utilization</span>
                    <span>{Math.round((capacity.usedCapacity / capacity.totalCapacity) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-tea-600 h-2 rounded-full" 
                      style={{ width: `${(capacity.usedCapacity / capacity.totalCapacity) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{capacity.usedCapacity}h used</span>
                    <span>{capacity.availableCapacity}h available</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Capacity</p>
                    <p className="font-medium text-gray-900">{capacity.totalCapacity} hours</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Operators</p>
                    <p className="font-medium text-gray-900">{capacity.operatorCount} active</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {viewMode === 'timeline' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Timeline</h3>
          
          <div className="space-y-4">
            {filteredSchedule.map((item) => {
              const materialConfig = MATERIAL_TYPE_CONFIG[item.materialType];
              const Icon = materialConfig.icon;
              
              return (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-md ${materialConfig.bgColor}`}>
                    <Icon className="h-5 w-5 text-gray-700" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{item.itemName}</h4>
                      <Badge variant={
                        item.status === 'COMPLETED' ? 'success' :
                        item.status === 'IN_PROGRESS' ? 'warning' :
                        item.status === 'DELAYED' ? 'error' : 'info'
                      }>
                        {item.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{item.scheduledTime} ({item.duration}h)</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{item.assignedTo}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{item.location}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredSchedule.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No production timeline available for the selected criteria
            </div>
          )}
        </Card>
      )}
    </div>
  );
}