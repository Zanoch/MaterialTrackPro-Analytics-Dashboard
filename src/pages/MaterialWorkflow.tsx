import { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  Package, 
  Leaf, 
  Sparkles, 
  Flower2, 
  Scale,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Activity,
  MapPin,
  Calendar
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { 
  useAdminBlendsheets,
  useAdminFlavorsheets,
  useAdminHerblines,
  useAdminBlendbalances,
  useTealineInventory
} from '../hooks';

// Types for workflow management
interface WorkflowNode {
  id: string;
  materialType: 'Tealine' | 'Blendsheet' | 'Flavorsheet' | 'Herbline' | 'Blendbalance';
  itemCode: string;
  itemName: string;
  stage: 'RECEIVED' | 'IN_STORAGE' | 'ALLOCATED' | 'IN_PROCESS' | 'COMPLETED' | 'SHIPPED';
  weight: number;
  location: string;
  lastUpdated: Date;
  nextStage?: string;
  dependencies: string[];
  processingTime: number; // hours
  assignedTo?: string;
  estimatedCompletion?: Date;
}

interface WorkflowTransition {
  from: WorkflowNode;
  to: WorkflowNode;
  transitionType: 'ALLOCATION' | 'PROCESSING' | 'TRANSFER' | 'COMPLETION';
  weight: number;
  timestamp: Date;
  triggeredBy: string;
  notes?: string;
}

interface WorkflowMetrics {
  totalItems: number;
  activeTransitions: number;
  completedToday: number;
  averageProcessingTime: number;
  bottlenecks: Array<{
    stage: string;
    itemCount: number;
    averageWaitTime: number;
  }>;
  efficiency: number;
}

// Material type configuration
const MATERIAL_TYPE_CONFIG = {
  Tealine: { icon: Package, color: 'blue', bgColor: 'bg-blue-50' },
  Blendsheet: { icon: Leaf, color: 'green', bgColor: 'bg-green-50' },
  Flavorsheet: { icon: Sparkles, color: 'purple', bgColor: 'bg-purple-50' },
  Herbline: { icon: Flower2, color: 'pink', bgColor: 'bg-pink-50' },
  Blendbalance: { icon: Scale, color: 'orange', bgColor: 'bg-orange-50' }
} as const;

// Stage configuration
const STAGE_CONFIG = {
  RECEIVED: { color: 'gray', label: 'Received', icon: Package },
  IN_STORAGE: { color: 'blue', label: 'In Storage', icon: MapPin },
  ALLOCATED: { color: 'yellow', label: 'Allocated', icon: ArrowRight },
  IN_PROCESS: { color: 'orange', label: 'In Process', icon: RefreshCw },
  COMPLETED: { color: 'green', label: 'Completed', icon: CheckCircle },
  SHIPPED: { color: 'purple', label: 'Shipped', icon: TrendingUp }
} as const;

export function MaterialWorkflow() {
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'workflow' | 'transitions' | 'metrics'>('workflow');

  // Fetch data from all material types
  const { data: tealineResponse, isLoading: tealineLoading } = useTealineInventory();
  const tealineData = Array.isArray(tealineResponse) ? tealineResponse : (tealineResponse?.data || []);
  const { data: blendsheetData = [], isLoading: blendsheetLoading } = useAdminBlendsheets();
  const { data: flavorsheetData = [], isLoading: flavorsheetLoading } = useAdminFlavorsheets() as { data: any[], isLoading: boolean };
  const { data: herblineData = [], isLoading: herblineLoading } = useAdminHerblines();
  const { data: blendbalanceData = [], isLoading: blendbalanceLoading } = useAdminBlendbalances();

  const isLoading = tealineLoading || blendsheetLoading || flavorsheetLoading || 
                    herblineLoading || blendbalanceLoading;

  // Generate workflow nodes from material data
  const workflowNodes = useMemo((): WorkflowNode[] => {
    const nodes: WorkflowNode[] = [];

    // Add tealine nodes
    tealineData.forEach((item: any, index: any) => {
      const stage = item.remaining > 0 ? 
        (item.pending > 0 ? 'RECEIVED' : 'IN_STORAGE') : 
        'ALLOCATED';
      
      nodes.push({
        id: `tealine-${item.item_code}-${item.created_ts}`,
        materialType: 'Tealine',
        itemCode: item.item_code,
        itemName: `${item.garden || 'Unknown Garden'} - ${item.grade || 'Unknown Grade'}`,
        stage,
        weight: item.remaining || 0,
        location: item.location || 'Warehouse A',
        lastUpdated: new Date(Date.now() - index * 2 * 60 * 60 * 1000),
        dependencies: [],
        processingTime: 4 + Math.random() * 8,
        assignedTo: undefined,
        estimatedCompletion: undefined
      });
    });

    // Add blendsheet nodes
    blendsheetData.forEach((item, index) => {
      const stage = item.created_batches === 0 ? 'ALLOCATED' :
                   item.created_batches < item.no_of_batches ? 'IN_PROCESS' :
                   'COMPLETED';
      
      nodes.push({
        id: `blendsheet-${item.blendsheet_no}`,
        materialType: 'Blendsheet',
        itemCode: item.blendsheet_no,
        itemName: item.standard,
        stage,
        weight: item.actual_weight || 0,
        location: 'Blending Floor',
        lastUpdated: new Date(Date.now() - (index + 5) * 2 * 60 * 60 * 1000),
        dependencies: ['tealine-processing'],
        processingTime: item.no_of_batches * 2,
        assignedTo: stage === 'IN_PROCESS' ? `Blend Team ${(index % 2) + 1}` : undefined,
        estimatedCompletion: stage === 'IN_PROCESS' ? 
          new Date(Date.now() + item.no_of_batches * 2 * 60 * 60 * 1000) : undefined
      });
    });

    // Add flavorsheet nodes
    flavorsheetData.forEach((item, index) => {
      const stage = item.batch_created ? 'COMPLETED' : 'ALLOCATED';
      
      nodes.push({
        id: `flavorsheet-${item.flavorsheet_no}`,
        materialType: 'Flavorsheet',
        itemCode: item.flavorsheet_no,
        itemName: item.flavor_code,
        stage,
        weight: 500 + index * 50, // Mock weight
        location: 'Flavor Lab',
        lastUpdated: new Date(Date.now() - (index + 10) * 3 * 60 * 60 * 1000),
        dependencies: ['herbline-processing'],
        processingTime: 6,
        assignedTo: undefined,
        estimatedCompletion: undefined
      });
    });

    // Add herbline nodes
    herblineData.forEach((item, index) => {
      const totalRemaining = item.record_list?.reduce((sum: any, record: any) => sum + (record.remaining || 0), 0) || 0;
      const stage = totalRemaining === 0 ? 'ALLOCATED' : 
                   totalRemaining < (item.weight || 0) ? 'IN_PROCESS' : 
                   'IN_STORAGE';
      
      nodes.push({
        id: `herbline-${item.item_code}-${item.created_at}`,
        materialType: 'Herbline',
        itemCode: item.item_code,
        itemName: item.item_name,
        stage,
        weight: totalRemaining,
        location: item.record_list?.[0]?.store_location || 'Storage Area',
        lastUpdated: new Date(Date.now() - (index + 15) * 4 * 60 * 60 * 1000),
        dependencies: [],
        processingTime: 3,
        assignedTo: stage === 'IN_PROCESS' ? `Storage Team ${(index % 2) + 1}` : undefined
      });
    });

    // Add blendbalance nodes
    blendbalanceData.forEach((item, index) => {
      const totalTransferred = item.record_list?.reduce((sum: any, record: any) => sum + (record.transfer_weight || 0), 0) || 0;
      const stage = totalTransferred === 0 ? 'IN_STORAGE' :
                   totalTransferred < (item.weight || 0) ? 'IN_PROCESS' :
                   'COMPLETED';
      
      nodes.push({
        id: `blendbalance-${item.item_code}-${item.created_at}`,
        materialType: 'Blendbalance',
        itemCode: item.item_code,
        itemName: `${item.blend_code} - ${item.transfer_id}`,
        stage,
        weight: item.weight || 0,
        location: 'Transfer Area',
        lastUpdated: new Date(Date.now() - (index + 20) * 5 * 60 * 60 * 1000),
        dependencies: ['blend-completion'],
        processingTime: 2,
        assignedTo: stage === 'IN_PROCESS' ? `Transfer Team ${(index % 2) + 1}` : undefined
      });
    });

    return nodes.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  }, [tealineData, blendsheetData, flavorsheetData, herblineData, blendbalanceData]);

  // Generate workflow transitions
  const workflowTransitions = useMemo((): WorkflowTransition[] => {
    const transitions: WorkflowTransition[] = [];
    
    // Create mock transitions between nodes
    const processedNodes = workflowNodes.filter(node => 
      node.stage === 'IN_PROCESS' || node.stage === 'COMPLETED'
    );
    
    processedNodes.forEach((node, index) => {
      const sourceNode = workflowNodes.find(source => 
        source.materialType === 'Tealine' && source.stage === 'ALLOCATED'
      );
      
      if (sourceNode && node.materialType === 'Blendsheet') {
        transitions.push({
          from: sourceNode,
          to: node,
          transitionType: 'ALLOCATION',
          weight: Math.min(sourceNode.weight, node.weight * 0.3),
          timestamp: new Date(Date.now() - (index + 1) * 60 * 60 * 1000),
          triggeredBy: node.assignedTo || 'System',
          notes: 'Tealine allocated to blendsheet production'
        });
      }
    });

    return transitions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [workflowNodes]);

  // Calculate workflow metrics
  const workflowMetrics = useMemo((): WorkflowMetrics => {
    const stageGroups = workflowNodes.reduce((groups, node) => {
      if (!groups[node.stage]) groups[node.stage] = [];
      groups[node.stage].push(node);
      return groups;
    }, {} as Record<string, WorkflowNode[]>);

    const bottlenecks = Object.entries(stageGroups)
      .map(([stage, nodes]) => ({
        stage,
        itemCount: nodes.length,
        averageWaitTime: nodes.reduce((sum, node) => {
          const waitTime = (Date.now() - node.lastUpdated.getTime()) / (1000 * 60 * 60);
          return sum + waitTime;
        }, 0) / nodes.length
      }))
      .filter(bottleneck => bottleneck.itemCount > 2)
      .sort((a, b) => b.averageWaitTime - a.averageWaitTime);

    const completedToday = workflowNodes.filter(node => 
      node.stage === 'COMPLETED' && 
      node.lastUpdated.toDateString() === new Date().toDateString()
    ).length;

    const inProcessNodes = workflowNodes.filter(node => node.stage === 'IN_PROCESS');
    const averageProcessingTime = inProcessNodes.length > 0 ? 
      inProcessNodes.reduce((sum, node) => sum + node.processingTime, 0) / inProcessNodes.length : 0;

    const efficiency = Math.min(100, Math.max(0, 
      100 - (bottlenecks.reduce((sum, b) => sum + b.averageWaitTime, 0) / Math.max(bottlenecks.length, 1))
    ));

    return {
      totalItems: workflowNodes.length,
      activeTransitions: workflowTransitions.filter(t => 
        new Date(Date.now() - 24 * 60 * 60 * 1000) < t.timestamp
      ).length,
      completedToday,
      averageProcessingTime,
      bottlenecks: bottlenecks.slice(0, 5),
      efficiency
    };
  }, [workflowNodes, workflowTransitions]);

  // Filter nodes based on selected criteria
  const filteredNodes = useMemo(() => {
    return workflowNodes.filter(node => {
      const matchesMaterialType = selectedMaterialType === 'all' || 
        node.materialType.toLowerCase() === selectedMaterialType;
      const matchesStage = selectedStage === 'all' || node.stage === selectedStage;
      const matchesLocation = selectedLocation === 'all' || node.location === selectedLocation;
      
      return matchesMaterialType && matchesStage && matchesLocation;
    });
  }, [workflowNodes, selectedMaterialType, selectedStage, selectedLocation]);

  // Get unique locations for filter
  const locations = useMemo(() => {
    return [...new Set(workflowNodes.map(node => node.location))];
  }, [workflowNodes]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loading size="lg" />
        <p className="mt-4 text-sm text-gray-600">Loading material workflow...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Material Workflow Management</h2>
        <p className="mt-1 text-sm text-gray-500">
          Track and manage material flow across all processing stages
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {workflowMetrics.totalItems}
              </p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Transitions</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {workflowMetrics.activeTransitions}
              </p>
            </div>
            <ArrowRight className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {workflowMetrics.completedToday}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-tea-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Efficiency</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {workflowMetrics.efficiency.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Filters and View Mode */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select
          value={selectedMaterialType}
          onValueChange={setSelectedMaterialType}
          placeholder="All Materials"
          options={[
            { value: 'all', label: 'All Materials' },
            { value: 'tealine', label: 'Tealine' },
            { value: 'blendsheet', label: 'Blendsheet' },
            { value: 'flavorsheet', label: 'Flavorsheet' },
            { value: 'herbline', label: 'Herbline' },
            { value: 'blendbalance', label: 'Blendbalance' }
          ]}
        />
        
        <Select
          value={selectedStage}
          onValueChange={setSelectedStage}
          placeholder="All Stages"
          options={[
            { value: 'all', label: 'All Stages' },
            { value: 'RECEIVED', label: 'Received' },
            { value: 'IN_STORAGE', label: 'In Storage' },
            { value: 'ALLOCATED', label: 'Allocated' },
            { value: 'IN_PROCESS', label: 'In Process' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'SHIPPED', label: 'Shipped' }
          ]}
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
        
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={() => setViewMode('workflow')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              viewMode === 'workflow' 
                ? 'bg-tea-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Workflow
          </button>
          <button
            onClick={() => setViewMode('transitions')}
            className={`px-4 py-2 text-sm font-medium ${
              viewMode === 'transitions' 
                ? 'bg-tea-600 text-white' 
                : 'bg-white text-gray-700 border-t border-b border-gray-300 hover:bg-gray-50'
            }`}
          >
            Transitions
          </button>
          <button
            onClick={() => setViewMode('metrics')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              viewMode === 'metrics' 
                ? 'bg-tea-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Metrics
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'workflow' && (
        <>
          {/* Stage Pipeline */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Pipeline</h3>
            
            <div className="flex justify-between items-center mb-6">
              {Object.entries(STAGE_CONFIG).map(([stage, config], index) => {
                const stageCount = filteredNodes.filter(node => node.stage === stage).length;
                
                return (
                  <div key={stage} className="flex flex-col items-center space-y-2">
                    <div className={`w-16 h-16 rounded-full bg-${config.color}-100 flex items-center justify-center`}>
                      <config.icon className={`h-8 w-8 text-${config.color}-600`} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{config.label}</p>
                      <p className="text-xs text-gray-500">{stageCount} items</p>
                    </div>
                    {index < Object.keys(STAGE_CONFIG).length - 1 && (
                      <ArrowRight className="h-4 w-4 text-gray-400 mt-4" />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Workflow Items */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Items</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weight
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Est. Completion
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNodes.map((node) => {
                    const materialConfig = MATERIAL_TYPE_CONFIG[node.materialType];
                    const stageConfig = STAGE_CONFIG[node.stage];
                    const Icon = materialConfig.icon;
                    
                    return (
                      <tr key={node.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-md ${materialConfig.bgColor}`}>
                              <Icon className="h-4 w-4 text-gray-700" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{node.itemName}</div>
                              <div className="text-sm text-gray-500">{node.itemCode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={
                            node.stage === 'COMPLETED' ? 'success' :
                            node.stage === 'IN_PROCESS' ? 'warning' :
                            node.stage === 'ALLOCATED' ? 'info' : 'default'
                          }>
                            {stageConfig.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {node.weight.toLocaleString()} kg
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{node.location}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {node.assignedTo || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{node.lastUpdated.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {node.estimatedCompletion ? (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{node.estimatedCompletion.toLocaleString()}</span>
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredNodes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No workflow items found matching the selected criteria
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {viewMode === 'transitions' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transitions</h3>
          
          <div className="space-y-4">
            {workflowTransitions.slice(0, 10).map((transition, index) => {
              const fromConfig = MATERIAL_TYPE_CONFIG[transition.from.materialType];
              const toConfig = MATERIAL_TYPE_CONFIG[transition.to.materialType];
              const FromIcon = fromConfig.icon;
              const ToIcon = toConfig.icon;
              
              return (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  {/* From Node */}
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-md ${fromConfig.bgColor}`}>
                      <FromIcon className="h-4 w-4 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transition.from.itemName}</p>
                      <p className="text-xs text-gray-500">{transition.from.itemCode}</p>
                    </div>
                  </div>
                  
                  {/* Transition Arrow */}
                  <div className="flex items-center space-x-2">
                    <ArrowRight className="h-5 w-5 text-tea-600" />
                    <div className="text-center">
                      <Badge variant="info" className="text-xs">
                        {transition.transitionType.replace(/_/g, ' ')}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{transition.weight.toLocaleString()} kg</p>
                    </div>
                  </div>
                  
                  {/* To Node */}
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-md ${toConfig.bgColor}`}>
                      <ToIcon className="h-4 w-4 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transition.to.itemName}</p>
                      <p className="text-xs text-gray-500">{transition.to.itemCode}</p>
                    </div>
                  </div>
                  
                  {/* Timestamp and User */}
                  <div className="flex-1 text-right">
                    <p className="text-sm text-gray-900">{transition.triggeredBy}</p>
                    <p className="text-xs text-gray-500">{transition.timestamp.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {workflowTransitions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recent transitions found
            </div>
          )}
        </Card>
      )}

      {viewMode === 'metrics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bottlenecks */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Bottlenecks</h3>
            <div className="space-y-3">
              {workflowMetrics.bottlenecks.map((bottleneck, index) => {
                const stageConfig = STAGE_CONFIG[bottleneck.stage as keyof typeof STAGE_CONFIG];
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium text-gray-900">{stageConfig?.label || bottleneck.stage}</p>
                        <p className="text-sm text-gray-600">{bottleneck.itemCount} items waiting</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">{bottleneck.averageWaitTime.toFixed(1)}h</p>
                      <p className="text-xs text-gray-500">avg wait time</p>
                    </div>
                  </div>
                );
              })}
              
              {workflowMetrics.bottlenecks.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No significant bottlenecks detected
                </div>
              )}
            </div>
          </Card>

          {/* Stage Distribution */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Distribution</h3>
            <div className="space-y-3">
              {Object.entries(STAGE_CONFIG).map(([stage, config]) => {
                const count = workflowNodes.filter(node => node.stage === stage).length;
                const percentage = workflowNodes.length > 0 ? (count / workflowNodes.length) * 100 : 0;
                
                return (
                  <div key={stage} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <config.icon className={`h-4 w-4 text-${config.color}-600`} />
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-${config.color}-500 h-2 rounded-full`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Processing Time</span>
                <span className="text-sm font-medium">{workflowMetrics.averageProcessingTime.toFixed(1)} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Workflow Efficiency</span>
                <span className="text-sm font-medium">{workflowMetrics.efficiency.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Items Completed Today</span>
                <span className="text-sm font-medium">{workflowMetrics.completedToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Transitions</span>
                <span className="text-sm font-medium">{workflowMetrics.activeTransitions}</span>
              </div>
            </div>
          </Card>

          {/* Material Type Performance */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Material Type Performance</h3>
            <div className="space-y-3">
              {Object.entries(MATERIAL_TYPE_CONFIG).map(([type, config]) => {
                const typeNodes = workflowNodes.filter(node => node.materialType === type);
                const completedNodes = typeNodes.filter(node => node.stage === 'COMPLETED');
                const completionRate = typeNodes.length > 0 ? (completedNodes.length / typeNodes.length) * 100 : 0;
                
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <config.icon className={`h-4 w-4 text-${config.color}-600`} />
                      <span className="text-sm font-medium">{type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-${config.color}-500 h-2 rounded-full`}
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12">{completionRate.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}