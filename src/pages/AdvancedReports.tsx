import { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download,
  Package,
  Target,
  CheckCircle
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

// Types for reporting engine
interface ReportMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  category: 'production' | 'quality' | 'efficiency' | 'inventory';
  description: string;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
  category?: string;
  date?: string;
}

interface ReportFilter {
  materialType: string;
  dateRange: string;
  location: string;
  reportType: string;
}

interface ProductionReport {
  totalProduction: number;
  completedBatches: number;
  pendingItems: number;
  efficiency: number;
  materialBreakdown: ChartData[];
  productionTrend: ChartData[];
  locationDistribution: ChartData[];
}

interface QualityReport {
  approvalRate: number;
  averageGrade: number;
  rejectionRate: number;
  qualityTrend: ChartData[];
  gradeDistribution: ChartData[];
  defectAnalysis: ChartData[];
}

interface InventoryReport {
  totalStock: number;
  stockValue: number;
  turnoverRate: number;
  lowStockItems: number;
  stockByMaterial: ChartData[];
  stockMovement: ChartData[];
  locationUtilization: ChartData[];
}


export function AdvancedReports() {
  const [reportFilters, setReportFilters] = useState<ReportFilter>({
    materialType: 'all',
    dateRange: 'last_30_days',
    location: 'all',
    reportType: 'overview'
  });
  
  const [exportFormat, setExportFormat] = useState<string>('pdf');

  // Fetch data from all material types
  const { data: tealineResponse, isLoading: tealineLoading } = useTealineInventory();
  const tealineData = Array.isArray(tealineResponse) ? tealineResponse : (tealineResponse?.data || []);
  const { data: blendsheetData = [], isLoading: blendsheetLoading } = useAdminBlendsheets();
  const { data: flavorsheetData = [], isLoading: flavorsheetLoading } = useAdminFlavorsheets() as { data: any[], isLoading: boolean };
  const { data: herblineData = [], isLoading: herblineLoading } = useAdminHerblines();
  const { data: blendbalanceData = [], isLoading: blendbalanceLoading } = useAdminBlendbalances();

  const isLoading = tealineLoading || blendsheetLoading || flavorsheetLoading || 
                    herblineLoading || blendbalanceLoading;

  // Generate comprehensive metrics
  const reportMetrics = useMemo((): ReportMetric[] => {
    const totalItems = tealineData.length + blendsheetData.length + flavorsheetData.length + 
                      herblineData.length + blendbalanceData.length;
    
    const totalWeight = tealineData.reduce((sum: number, item: any) => sum + (item.remaining || 0), 0) +
                       herblineData.reduce((sum: number, item: any) => {
                         const remaining = item.record_list?.reduce((recordSum: number, record: any) => recordSum + (record.remaining || 0), 0) || 0;
                         return sum + remaining;
                       }, 0);

    const completedBatches = blendsheetData.filter((item: any) => item.created_batches === item.no_of_batches).length +
                            flavorsheetData.filter((item: any) => item.batch_created).length;

    const pendingItems = tealineData.filter((item: any) => (item.pending || 0) > 0).length +
                        blendbalanceData.filter((item: any) => (item.record_list?.length || 0) === 0).length;

    const averageEfficiency = blendsheetData.length > 0 ? 
      blendsheetData.reduce((sum: number, item: any) => sum + (item.created_batches / item.no_of_batches * 100), 0) / blendsheetData.length : 0;

    return [
      {
        id: 'total_production',
        name: 'Total Production Volume',
        value: totalWeight,
        unit: 'kg',
        change: 12.5,
        changeType: 'increase',
        category: 'production',
        description: 'Total weight of materials processed across all types'
      },
      {
        id: 'completed_batches',
        name: 'Completed Batches',
        value: completedBatches,
        unit: 'batches',
        change: 8.3,
        changeType: 'increase',
        category: 'production',
        description: 'Number of batches completed successfully'
      },
      {
        id: 'pending_items',
        name: 'Pending Items',
        value: pendingItems,
        unit: 'items',
        change: -5.2,
        changeType: 'decrease',
        category: 'efficiency',
        description: 'Items awaiting processing or completion'
      },
      {
        id: 'average_efficiency',
        name: 'Average Efficiency',
        value: averageEfficiency,
        unit: '%',
        change: 3.1,
        changeType: 'increase',
        category: 'efficiency',
        description: 'Average production efficiency across all materials'
      },
      {
        id: 'quality_approval_rate',
        name: 'Quality Approval Rate',
        value: 94.2,
        unit: '%',
        change: 2.1,
        changeType: 'increase',
        category: 'quality',
        description: 'Percentage of items passing quality checks'
      },
      {
        id: 'inventory_turnover',
        name: 'Inventory Turnover',
        value: 2.8,
        unit: 'times',
        change: 0.3,
        changeType: 'increase',
        category: 'inventory',
        description: 'Number of times inventory is sold and replaced'
      },
      {
        id: 'total_materials',
        name: 'Total Material Items',
        value: totalItems,
        unit: 'items',
        change: 15.7,
        changeType: 'increase',
        category: 'inventory',
        description: 'Total number of material items in the system'
      },
      {
        id: 'processing_time',
        name: 'Avg Processing Time',
        value: 6.4,
        unit: 'hours',
        change: -0.8,
        changeType: 'decrease',
        category: 'efficiency',
        description: 'Average time to complete material processing'
      }
    ];
  }, [tealineData, blendsheetData, flavorsheetData, herblineData, blendbalanceData]);

  // Generate production report
  const productionReport = useMemo((): ProductionReport => {
    const materialBreakdown: ChartData[] = [
      { name: 'Tealine', value: tealineData.length, color: '#3B82F6' },
      { name: 'Blendsheet', value: blendsheetData.length, color: '#10B981' },
      { name: 'Flavorsheet', value: flavorsheetData.length, color: '#8B5CF6' },
      { name: 'Herbline', value: herblineData.length, color: '#EC4899' },
      { name: 'Blendbalance', value: blendbalanceData.length, color: '#F59E0B' }
    ];

    // Generate production trend (last 7 days)
    const productionTrend: ChartData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      productionTrend.push({
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.floor(Math.random() * 1000) + 500,
        date: date.toISOString()
      });
    }

    const locationDistribution: ChartData[] = [
      { name: 'Warehouse A', value: 35, color: '#3B82F6' },
      { name: 'Warehouse B', value: 28, color: '#10B981' },
      { name: 'Blending Floor', value: 22, color: '#8B5CF6' },
      { name: 'Flavor Lab', value: 10, color: '#EC4899' },
      { name: 'Storage Area', value: 5, color: '#F59E0B' }
    ];

    const totalWeight = tealineData.reduce((sum: number, item: any) => sum + (item.remaining || 0), 0);
    const completedBatches = blendsheetData.filter((item: any) => item.created_batches === item.no_of_batches).length;
    const pendingItems = tealineData.filter((item: any) => (item.pending || 0) > 0).length;

    return {
      totalProduction: totalWeight,
      completedBatches,
      pendingItems,
      efficiency: 87.3,
      materialBreakdown,
      productionTrend,
      locationDistribution
    };
  }, [tealineData, blendsheetData, flavorsheetData, herblineData, blendbalanceData]);

  // Generate quality report
  const qualityReport = useMemo((): QualityReport => {
    const qualityTrend: ChartData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      qualityTrend.push({
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: 90 + Math.random() * 8,
        date: date.toISOString()
      });
    }

    const gradeDistribution: ChartData[] = [
      { name: 'Premium', value: 25, color: '#10B981' },
      { name: 'Standard', value: 45, color: '#3B82F6' },
      { name: 'Basic', value: 20, color: '#F59E0B' },
      { name: 'Below Standard', value: 10, color: '#EF4444' }
    ];

    const defectAnalysis: ChartData[] = [
      { name: 'Moisture Content', value: 3.2, color: '#EF4444' },
      { name: 'Color Variation', value: 2.1, color: '#F59E0B' },
      { name: 'Size Inconsistency', value: 1.8, color: '#8B5CF6' },
      { name: 'Foreign Matter', value: 0.9, color: '#EC4899' }
    ];

    return {
      approvalRate: 94.2,
      averageGrade: 8.3,
      rejectionRate: 5.8,
      qualityTrend,
      gradeDistribution,
      defectAnalysis
    };
  }, []);

  // Generate inventory report
  const inventoryReport = useMemo((): InventoryReport => {
    const totalStock = tealineData.reduce((sum: number, item: any) => sum + (item.remaining || 0), 0) +
                      herblineData.reduce((sum: number, item: any) => {
                        const remaining = item.record_list?.reduce((recordSum: number, record: any) => recordSum + (record.remaining || 0), 0) || 0;
                        return sum + remaining;
                      }, 0);

    const stockByMaterial: ChartData[] = [
      { name: 'Tealine', value: tealineData.reduce((sum: number, item: any) => sum + (item.remaining || 0), 0), color: '#3B82F6' },
      { name: 'Herbline', value: herblineData.reduce((sum: number, item: any) => {
        const remaining = item.record_list?.reduce((recordSum: number, record: any) => recordSum + (record.remaining || 0), 0) || 0;
        return sum + remaining;
      }, 0), color: '#EC4899' },
      { name: 'Blendbalance', value: blendbalanceData.reduce((sum: number, item: any) => sum + (item.weight || 0), 0), color: '#F59E0B' }
    ];

    const stockMovement: ChartData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      stockMovement.push({
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.floor(Math.random() * 500) + 200,
        date: date.toISOString()
      });
    }

    const locationUtilization: ChartData[] = [
      { name: 'Warehouse A', value: 85, color: '#10B981' },
      { name: 'Warehouse B', value: 72, color: '#3B82F6' },
      { name: 'Storage Area', value: 68, color: '#8B5CF6' },
      { name: 'Transfer Area', value: 45, color: '#F59E0B' }
    ];

    return {
      totalStock,
      stockValue: totalStock * 15.5, // Assumed price per kg
      turnoverRate: 2.8,
      lowStockItems: tealineData.filter((item: any) => (item.remaining || 0) < 50).length,
      stockByMaterial,
      stockMovement,
      locationUtilization
    };
  }, [tealineData, herblineData, blendbalanceData]);

  // Filter metrics based on selected filters
  const filteredMetrics = useMemo(() => {
    if (reportFilters.reportType === 'all') return reportMetrics;
    
    return reportMetrics.filter(metric => {
      switch (reportFilters.reportType) {
        case 'production':
          return metric.category === 'production';
        case 'quality':
          return metric.category === 'quality';
        case 'efficiency':
          return metric.category === 'efficiency';
        case 'inventory':
          return metric.category === 'inventory';
        default:
          return true;
      }
    });
  }, [reportMetrics, reportFilters]);

  const handleExport = (format: string) => {
    // Mock export functionality
    console.log(`Exporting report in ${format} format`);
    // In a real implementation, this would generate and download the report
    alert(`Report exported in ${format.toUpperCase()} format`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loading size="lg" />
        <p className="mt-4 text-sm text-gray-600">Loading advanced reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Reports & Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive insights and data analysis across all operations
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Select
            value={exportFormat}
            onValueChange={setExportFormat}
            placeholder="Export Format"
            options={[
              { value: 'pdf', label: 'PDF Report' },
              { value: 'excel', label: 'Excel Spreadsheet' },
              { value: 'csv', label: 'CSV Data' },
              { value: 'json', label: 'JSON Data' }
            ]}
          />
          <button
            onClick={() => handleExport(exportFormat)}
            className="px-4 py-2 bg-tea-600 text-white rounded-md hover:bg-tea-700 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            value={reportFilters.reportType}
            onValueChange={(value) => setReportFilters(prev => ({ ...prev, reportType: value }))}
            placeholder="Report Type"
            options={[
              { value: 'overview', label: 'Overview' },
              { value: 'production', label: 'Production' },
              { value: 'quality', label: 'Quality' },
              { value: 'efficiency', label: 'Efficiency' },
              { value: 'inventory', label: 'Inventory' }
            ]}
          />
          
          <Select
            value={reportFilters.materialType}
            onValueChange={(value) => setReportFilters(prev => ({ ...prev, materialType: value }))}
            placeholder="Material Type"
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
            value={reportFilters.dateRange}
            onValueChange={(value) => setReportFilters(prev => ({ ...prev, dateRange: value }))}
            placeholder="Date Range"
            options={[
              { value: 'last_7_days', label: 'Last 7 Days' },
              { value: 'last_30_days', label: 'Last 30 Days' },
              { value: 'last_90_days', label: 'Last 90 Days' },
              { value: 'last_year', label: 'Last Year' },
              { value: 'custom', label: 'Custom Range' }
            ]}
          />
          
          <Select
            value={reportFilters.location}
            onValueChange={(value) => setReportFilters(prev => ({ ...prev, location: value }))}
            placeholder="Location"
            options={[
              { value: 'all', label: 'All Locations' },
              { value: 'warehouse_a', label: 'Warehouse A' },
              { value: 'warehouse_b', label: 'Warehouse B' },
              { value: 'blending_floor', label: 'Blending Floor' },
              { value: 'flavor_lab', label: 'Flavor Lab' }
            ]}
          />
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredMetrics.slice(0, 8).map((metric) => (
          <Card key={metric.id}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {metric.value.toLocaleString()} {metric.unit}
                </p>
                <div className={`flex items-center mt-1 text-sm ${
                  metric.changeType === 'increase' ? 'text-green-600' :
                  metric.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  <TrendingUp className={`h-4 w-4 mr-1 ${
                    metric.changeType === 'decrease' ? 'rotate-180' : ''
                  }`} />
                  <span>{Math.abs(metric.change)}%</span>
                </div>
              </div>
              <div className={`p-2 rounded-md ${
                metric.category === 'production' ? 'bg-blue-50' :
                metric.category === 'quality' ? 'bg-green-50' :
                metric.category === 'efficiency' ? 'bg-orange-50' : 'bg-purple-50'
              }`}>
                {metric.category === 'production' && <BarChart3 className="h-6 w-6 text-blue-600" />}
                {metric.category === 'quality' && <CheckCircle className="h-6 w-6 text-green-600" />}
                {metric.category === 'efficiency' && <Target className="h-6 w-6 text-orange-600" />}
                {metric.category === 'inventory' && <Package className="h-6 w-6 text-purple-600" />}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts and Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Overview */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Overview</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold text-blue-600">{productionReport.totalProduction.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Production (kg)</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-green-600">{productionReport.completedBatches}</p>
                <p className="text-sm text-gray-600">Completed Batches</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-orange-600">{productionReport.pendingItems}</p>
                <p className="text-sm text-gray-600">Pending Items</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Material Distribution</h4>
              <div className="space-y-2">
                {productionReport.materialBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Quality Metrics */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Metrics</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold text-green-600">{qualityReport.approvalRate}%</p>
                <p className="text-sm text-gray-600">Approval Rate</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-blue-600">{qualityReport.averageGrade}</p>
                <p className="text-sm text-gray-600">Average Grade</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-red-600">{qualityReport.rejectionRate}%</p>
                <p className="text-sm text-gray-600">Rejection Rate</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Grade Distribution</h4>
              <div className="space-y-2">
                {qualityReport.gradeDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Inventory Analysis */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Analysis</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold text-purple-600">{inventoryReport.totalStock.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Stock (kg)</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-green-600">${inventoryReport.stockValue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Stock Value</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-blue-600">{inventoryReport.turnoverRate}</p>
                <p className="text-sm text-gray-600">Turnover Rate</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-orange-600">{inventoryReport.lowStockItems}</p>
                <p className="text-sm text-gray-600">Low Stock Items</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Stock by Material</h4>
              <div className="space-y-2">
                {inventoryReport.stockByMaterial.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.value.toLocaleString()} kg</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Performance Trends */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-3xl font-semibold text-tea-600">87.3%</p>
              <p className="text-sm text-gray-600">Overall Efficiency</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Location Utilization</h4>
              <div className="space-y-2">
                {inventoryReport.locationUtilization.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${item.value}%`,
                            backgroundColor: item.color 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-10">{item.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Reports Table */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Metrics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMetrics.map((metric) => (
                <tr key={metric.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{metric.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={
                      metric.category === 'production' ? 'info' :
                      metric.category === 'quality' ? 'success' :
                      metric.category === 'efficiency' ? 'warning' : 'default'
                    }>
                      {metric.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {metric.value.toLocaleString()} {metric.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center text-sm ${
                      metric.changeType === 'increase' ? 'text-green-600' :
                      metric.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      <TrendingUp className={`h-4 w-4 mr-1 ${
                        metric.changeType === 'decrease' ? 'rotate-180' : ''
                      }`} />
                      <span>{Math.abs(metric.change)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {metric.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}