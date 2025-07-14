import { useState, useMemo } from 'react';
import { 
  ArrowRight, 
  Package, 
  Leaf, 
  Sparkles, 
  Flower2, 
  Scale,
  GitBranch,
  Activity,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
  BarChart3,
  Zap
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

// Types for cross-material integration
interface MaterialConnection {
  id: string;
  sourceType: 'Tealine' | 'Blendsheet' | 'Flavorsheet' | 'Herbline' | 'Blendbalance';
  sourceId: string;
  sourceName: string;
  targetType: 'Tealine' | 'Blendsheet' | 'Flavorsheet' | 'Herbline' | 'Blendbalance';
  targetId: string;
  targetName: string;
  connectionType: 'INPUT' | 'OUTPUT' | 'TRANSFORM' | 'BLEND' | 'ALLOCATION';
  weight: number;
  efficiency: number;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'FAILED';
  timestamp: Date;
  qualityScore?: number;
}

interface IntegrationMetrics {
  totalConnections: number;
  activeConnections: number;
  averageEfficiency: number;
  materialUtilization: number;
  crossMaterialFlows: number;
  optimizationOpportunities: number;
}

interface MaterialFlow {
  path: MaterialConnection[];
  totalWeight: number;
  totalTime: number;
  efficiency: number;
  bottlenecks: string[];
  optimization: number;
}

interface DependencyMap {
  material: string;
  dependencies: string[];
  dependents: string[];
  criticalityScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Material type configuration
const MATERIAL_TYPE_CONFIG = {
  Tealine: { icon: Package, color: 'blue', bgColor: 'bg-blue-50' },
  Blendsheet: { icon: Leaf, color: 'green', bgColor: 'bg-green-50' },
  Flavorsheet: { icon: Sparkles, color: 'purple', bgColor: 'bg-purple-50' },
  Herbline: { icon: Flower2, color: 'pink', bgColor: 'bg-pink-50' },
  Blendbalance: { icon: Scale, color: 'orange', bgColor: 'bg-orange-50' }
} as const;

export function CrossMaterialIntegration() {
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>('all');
  const [selectedConnectionType, setSelectedConnectionType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'connections' | 'flows' | 'dependencies' | 'optimization'>('connections');
  const [timeRange, setTimeRange] = useState<string>('24h');

  // Fetch data from all material types
  const { data: tealineResponse, isLoading: tealineLoading } = useTealineInventory();
  const tealineData = Array.isArray(tealineResponse) ? tealineResponse : (tealineResponse?.data || []);
  const { data: blendsheetData = [], isLoading: blendsheetLoading } = useAdminBlendsheets();
  const { data: flavorsheetData = [], isLoading: flavorsheetLoading } = useAdminFlavorsheets() as { data: any[], isLoading: boolean };
  const { data: herblineData = [], isLoading: herblineLoading } = useAdminHerblines();
  const { data: blendbalanceData = [], isLoading: blendbalanceLoading } = useAdminBlendbalances();

  const isLoading = tealineLoading || blendsheetLoading || flavorsheetLoading || 
                    herblineLoading || blendbalanceLoading;

  // Generate material connections
  const materialConnections = useMemo((): MaterialConnection[] => {
    const connections: MaterialConnection[] = [];

    // Tealine to Blendsheet connections
    tealineData.forEach((tealine: any, index: number) => {
      const targetBlendsheet = blendsheetData[index % blendsheetData.length];
      if (targetBlendsheet && (tealine.remaining || 0) > 0) {
        connections.push({
          id: `tealine-blendsheet-${tealine.item_code}-${targetBlendsheet.blendsheet_no}`,
          sourceType: 'Tealine',
          sourceId: tealine.item_code,
          sourceName: `${tealine.garden || 'Unknown'} - ${tealine.grade || 'Unknown'}`,
          targetType: 'Blendsheet',
          targetId: targetBlendsheet.blendsheet_no,
          targetName: targetBlendsheet.standard,
          connectionType: 'INPUT',
          weight: Math.min(tealine.remaining || 0, 500),
          efficiency: 92 + Math.random() * 6,
          status: tealine.remaining > 100 ? 'ACTIVE' : 'PENDING',
          timestamp: new Date(Date.now() - index * 2 * 60 * 60 * 1000),
          qualityScore: 88 + Math.random() * 10
        });
      }
    });

    // Herbline to Flavorsheet connections
    herblineData.forEach((herbline, index) => {
      const targetFlavorsheet = flavorsheetData[index % flavorsheetData.length];
      if (targetFlavorsheet) {
        const remainingWeight = herbline.record_list?.reduce((sum: number, record: any) => sum + (record.remaining || 0), 0) || 0;
        if (remainingWeight > 0) {
          connections.push({
            id: `herbline-flavorsheet-${herbline.item_code}-${targetFlavorsheet.flavorsheet_no}`,
            sourceType: 'Herbline',
            sourceId: herbline.item_code,
            sourceName: herbline.item_name,
            targetType: 'Flavorsheet',
            targetId: targetFlavorsheet.flavorsheet_no,
            targetName: targetFlavorsheet.flavor_code,
            connectionType: 'BLEND',
            weight: Math.min(remainingWeight, 200),
            efficiency: 85 + Math.random() * 10,
            status: !targetFlavorsheet.batch_created ? 'PENDING' : 'COMPLETED',
            timestamp: new Date(Date.now() - index * 3 * 60 * 60 * 1000),
            qualityScore: 90 + Math.random() * 8
          });
        }
      }
    });

    // Blendsheet to Blendbalance connections
    blendsheetData.forEach((blendsheet, index) => {
      const targetBlendbalance = blendbalanceData[index % blendbalanceData.length];
      if (targetBlendbalance && blendsheet.created_batches > 0) {
        connections.push({
          id: `blendsheet-blendbalance-${blendsheet.blendsheet_no}-${targetBlendbalance.item_code}`,
          sourceType: 'Blendsheet',
          sourceId: blendsheet.blendsheet_no,
          sourceName: blendsheet.standard,
          targetType: 'Blendbalance',
          targetId: targetBlendbalance.item_code,
          targetName: `${targetBlendbalance.blend_code} - ${targetBlendbalance.transfer_id}`,
          connectionType: 'TRANSFORM',
          weight: blendsheet.actual_weight || 0,
          efficiency: 89 + Math.random() * 8,
          status: blendsheet.created_batches === blendsheet.no_of_batches ? 'COMPLETED' : 'ACTIVE',
          timestamp: new Date(Date.now() - index * 4 * 60 * 60 * 1000),
          qualityScore: 87 + Math.random() * 10
        });
      }
    });

    // Cross-material allocations
    const crossConnections: MaterialConnection[] = [];
    for (let i = 0; i < 5; i++) {
      const sourceTypes = ['Tealine', 'Herbline'] as const;
      const targetTypes = ['Blendsheet', 'Flavorsheet'] as const;
      
      const sourceType = sourceTypes[i % sourceTypes.length];
      const targetType = targetTypes[i % targetTypes.length];
      
      crossConnections.push({
        id: `cross-${sourceType.toLowerCase()}-${targetType.toLowerCase()}-${i}`,
        sourceType,
        sourceId: `${sourceType.toUpperCase()}-${1000 + i}`,
        sourceName: `${sourceType} Material ${i + 1}`,
        targetType,
        targetId: `${targetType.toUpperCase()}-${2000 + i}`,
        targetName: `${targetType} Product ${i + 1}`,
        connectionType: 'ALLOCATION',
        weight: 100 + Math.random() * 400,
        efficiency: 80 + Math.random() * 15,
        status: ['ACTIVE', 'PENDING', 'COMPLETED'][i % 3] as any,
        timestamp: new Date(Date.now() - i * 6 * 60 * 60 * 1000),
        qualityScore: 85 + Math.random() * 12
      });
    }

    return [...connections, ...crossConnections].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [tealineData, blendsheetData, flavorsheetData, herblineData, blendbalanceData]);

  // Calculate integration metrics
  const integrationMetrics = useMemo((): IntegrationMetrics => {
    const activeConnections = materialConnections.filter(conn => conn.status === 'ACTIVE').length;
    const averageEfficiency = materialConnections.length > 0 ? 
      materialConnections.reduce((sum, conn) => sum + conn.efficiency, 0) / materialConnections.length : 0;
    
    const totalWeight = materialConnections.reduce((sum, conn) => sum + conn.weight, 0);
    const utilizationRate = totalWeight > 0 ? Math.min(100, (totalWeight / 10000) * 100) : 0;
    
    const crossFlows = materialConnections.filter(conn => 
      conn.sourceType !== conn.targetType
    ).length;

    return {
      totalConnections: materialConnections.length,
      activeConnections,
      averageEfficiency,
      materialUtilization: utilizationRate,
      crossMaterialFlows: crossFlows,
      optimizationOpportunities: materialConnections.filter(conn => conn.efficiency < 85).length
    };
  }, [materialConnections]);

  // Generate material flows
  const materialFlows = useMemo((): MaterialFlow[] => {
    const flows: MaterialFlow[] = [];
    
    // Group connections by source-target pairs
    const flowGroups = materialConnections.reduce((groups, connection) => {
      const key = `${connection.sourceType}-${connection.targetType}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(connection);
      return groups;
    }, {} as Record<string, MaterialConnection[]>);

    Object.entries(flowGroups).forEach(([_, connections]) => {
      const totalWeight = connections.reduce((sum, conn) => sum + conn.weight, 0);
      const avgEfficiency = connections.reduce((sum, conn) => sum + conn.efficiency, 0) / connections.length;
      const totalTime = connections.length * 2; // Estimated hours per connection
      
      const bottlenecks = connections
        .filter(conn => conn.efficiency < 85)
        .map(conn => conn.sourceName)
        .slice(0, 3);

      flows.push({
        path: connections,
        totalWeight,
        totalTime,
        efficiency: avgEfficiency,
        bottlenecks,
        optimization: Math.max(0, 95 - avgEfficiency)
      });
    });

    return flows.sort((a, b) => b.totalWeight - a.totalWeight);
  }, [materialConnections]);

  // Generate dependency map
  const dependencyMap = useMemo((): DependencyMap[] => {
    const materialTypes = ['Tealine', 'Blendsheet', 'Flavorsheet', 'Herbline', 'Blendbalance'];
    
    return materialTypes.map(material => {
      const dependencies = materialConnections
        .filter(conn => conn.targetType === material)
        .map(conn => conn.sourceType)
        .filter((type, index, arr) => arr.indexOf(type) === index);

      const dependents = materialConnections
        .filter(conn => conn.sourceType === material)
        .map(conn => conn.targetType)
        .filter((type, index, arr) => arr.indexOf(type) === index);

      const criticalityScore = (dependencies.length * 2) + dependents.length;
      const riskLevel = criticalityScore > 6 ? 'CRITICAL' :
                      criticalityScore > 4 ? 'HIGH' :
                      criticalityScore > 2 ? 'MEDIUM' : 'LOW';

      return {
        material,
        dependencies,
        dependents,
        criticalityScore,
        riskLevel
      };
    });
  }, [materialConnections]);

  // Filter connections
  const filteredConnections = useMemo(() => {
    return materialConnections.filter(connection => {
      const matchesMaterialType = selectedMaterialType === 'all' || 
        connection.sourceType.toLowerCase() === selectedMaterialType ||
        connection.targetType.toLowerCase() === selectedMaterialType;
      
      const matchesConnectionType = selectedConnectionType === 'all' || 
        connection.connectionType === selectedConnectionType;
      
      const matchesSearch = !searchTerm || 
        connection.sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        connection.targetName.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesMaterialType && matchesConnectionType && matchesSearch;
    });
  }, [materialConnections, selectedMaterialType, selectedConnectionType, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loading size="lg" />
        <p className="mt-4 text-sm text-gray-600">Loading cross-material integration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Cross-Material Integration</h2>
        <p className="mt-1 text-sm text-gray-500">
          Analyze and optimize material flows across all processing systems
        </p>
      </div>

      {/* Integration Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Connections</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {integrationMetrics.totalConnections}
              </p>
            </div>
            <GitBranch className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Flows</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {integrationMetrics.activeConnections}
              </p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Efficiency</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {integrationMetrics.averageEfficiency.toFixed(1)}%
              </p>
            </div>
            <Target className="h-8 w-8 text-tea-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilization</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {integrationMetrics.materialUtilization.toFixed(1)}%
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Cross Flows</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {integrationMetrics.crossMaterialFlows}
              </p>
            </div>
            <ArrowRight className="h-8 w-8 text-orange-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Optimizations</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {integrationMetrics.optimizationOpportunities}
              </p>
            </div>
            <Zap className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        
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
          value={selectedConnectionType}
          onValueChange={setSelectedConnectionType}
          placeholder="All Connection Types"
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'INPUT', label: 'Input' },
            { value: 'OUTPUT', label: 'Output' },
            { value: 'TRANSFORM', label: 'Transform' },
            { value: 'BLEND', label: 'Blend' },
            { value: 'ALLOCATION', label: 'Allocation' }
          ]}
        />
        
        <Select
          value={timeRange}
          onValueChange={setTimeRange}
          placeholder="Time Range"
          options={[
            { value: '24h', label: 'Last 24 Hours' },
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: '90d', label: 'Last 90 Days' }
          ]}
        />
        
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={() => setViewMode('connections')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              viewMode === 'connections' 
                ? 'bg-tea-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Connections
          </button>
          <button
            onClick={() => setViewMode('flows')}
            className={`px-4 py-2 text-sm font-medium ${
              viewMode === 'flows' 
                ? 'bg-tea-600 text-white' 
                : 'bg-white text-gray-700 border-t border-b border-gray-300 hover:bg-gray-50'
            }`}
          >
            Flows
          </button>
          <button
            onClick={() => setViewMode('dependencies')}
            className={`px-4 py-2 text-sm font-medium ${
              viewMode === 'dependencies' 
                ? 'bg-tea-600 text-white' 
                : 'bg-white text-gray-700 border-t border-b border-gray-300 hover:bg-gray-50'
            }`}
          >
            Dependencies
          </button>
          <button
            onClick={() => setViewMode('optimization')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              viewMode === 'optimization' 
                ? 'bg-tea-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Optimization
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'connections' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 px-6 pt-6">Material Connections</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source → Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Connection Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efficiency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConnections.map((connection) => {
                  const sourceConfig = MATERIAL_TYPE_CONFIG[connection.sourceType];
                  const targetConfig = MATERIAL_TYPE_CONFIG[connection.targetType];
                  const SourceIcon = sourceConfig.icon;
                  const TargetIcon = targetConfig.icon;
                  
                  return (
                    <tr key={connection.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <div className={`p-1 rounded ${sourceConfig.bgColor}`}>
                              <SourceIcon className="h-4 w-4 text-gray-700" />
                            </div>
                            <span className="text-sm text-gray-900">{connection.sourceName}</span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                          <div className="flex items-center space-x-2">
                            <div className={`p-1 rounded ${targetConfig.bgColor}`}>
                              <TargetIcon className="h-4 w-4 text-gray-700" />
                            </div>
                            <span className="text-sm text-gray-900">{connection.targetName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          connection.connectionType === 'INPUT' ? 'info' :
                          connection.connectionType === 'OUTPUT' ? 'success' :
                          connection.connectionType === 'TRANSFORM' ? 'warning' : 'default'
                        }>
                          {connection.connectionType}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {connection.weight.toLocaleString()} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                connection.efficiency >= 90 ? 'bg-green-500' :
                                connection.efficiency >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${connection.efficiency}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{connection.efficiency.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          connection.status === 'COMPLETED' ? 'success' :
                          connection.status === 'ACTIVE' ? 'warning' :
                          connection.status === 'FAILED' ? 'error' : 'info'
                        }>
                          {connection.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {connection.qualityScore ? `${connection.qualityScore.toFixed(1)}/100` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{connection.timestamp.toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredConnections.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No connections found matching the selected criteria
              </div>
            )}
          </div>
        </Card>
      )}

      {viewMode === 'flows' && (
        <div className="space-y-6">
          {materialFlows.map((flow, index) => (
            <Card key={index}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 px-6 pt-6">
                Material Flow: {flow.path[0]?.sourceType} → {flow.path[0]?.targetType}
              </h3>
              
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-blue-600">{flow.totalWeight.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Weight (kg)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-green-600">{flow.efficiency.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Efficiency</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-orange-600">{flow.totalTime}</p>
                    <p className="text-sm text-gray-600">Total Time (hours)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-purple-600">{flow.optimization.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Optimization Potential</p>
                  </div>
                </div>
                
                {flow.bottlenecks.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Identified Bottlenecks</h4>
                    <div className="flex flex-wrap gap-2">
                      {flow.bottlenecks.map((bottleneck, idx) => (
                        <Badge key={idx} variant="warning" className="flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{bottleneck}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {viewMode === 'dependencies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dependencyMap.map((item) => {
            const materialConfig = MATERIAL_TYPE_CONFIG[item.material as keyof typeof MATERIAL_TYPE_CONFIG];
            const Icon = materialConfig.icon;
            
            return (
              <Card key={item.material}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-md ${materialConfig.bgColor}`}>
                        <Icon className="h-6 w-6 text-gray-700" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.material}</h3>
                    </div>
                    <Badge variant={
                      item.riskLevel === 'CRITICAL' ? 'error' :
                      item.riskLevel === 'HIGH' ? 'warning' :
                      item.riskLevel === 'MEDIUM' ? 'info' : 'default'
                    }>
                      {item.riskLevel}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Dependencies</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.dependencies.length > 0 ? item.dependencies.map((dep, idx) => (
                          <Badge key={idx} variant="info" className="text-xs">{dep}</Badge>
                        )) : (
                          <span className="text-sm text-gray-500">None</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600">Dependents</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.dependents.length > 0 ? item.dependents.map((dep, idx) => (
                          <Badge key={idx} variant="success" className="text-xs">{dep}</Badge>
                        )) : (
                          <span className="text-sm text-gray-500">None</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600">Criticality Score</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              item.criticalityScore > 6 ? 'bg-red-500' :
                              item.criticalityScore > 4 ? 'bg-yellow-500' :
                              item.criticalityScore > 2 ? 'bg-blue-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, (item.criticalityScore / 10) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{item.criticalityScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {viewMode === 'optimization' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 px-6 pt-6">Optimization Opportunities</h3>
            
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {materialConnections
                  .filter(conn => conn.efficiency < 90)
                  .slice(0, 10)
                  .map((connection) => {
                    const optimizationPotential = 95 - connection.efficiency;
                    const sourceConfig = MATERIAL_TYPE_CONFIG[connection.sourceType];
                    const targetConfig = MATERIAL_TYPE_CONFIG[connection.targetType];
                    
                    return (
                      <div key={connection.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <sourceConfig.icon className="h-5 w-5 text-gray-600" />
                            <span className="font-medium">{connection.sourceName}</span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                          <div className="flex items-center space-x-2">
                            <targetConfig.icon className="h-5 w-5 text-gray-600" />
                            <span className="font-medium">{connection.targetName}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              Current: {connection.efficiency.toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-600">
                              Potential: +{optimizationPotential.toFixed(1)}%
                            </p>
                          </div>
                          <button className="px-3 py-1 bg-tea-600 text-white rounded-md text-sm hover:bg-tea-700">
                            Optimize
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {materialConnections.filter(conn => conn.efficiency < 90).length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-lg font-medium text-gray-900">All connections are optimized!</p>
                  <p className="text-sm text-gray-600">No optimization opportunities found at this time.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}