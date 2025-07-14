import { useState, useMemo } from 'react';
import { RefreshCw, Search, Package, MapPin, Loader2, FileDown, FileText, AlertTriangle, TrendingUp, BarChart2, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Pagination } from '../components/ui/Pagination';
import { useTealineInventoryComplete, useTealineFilterOptions } from '../hooks/useTealine';
import { exportToCSV, exportToPDF, formatDateForExport, formatWeightForExport, type ExportColumn } from '../utils/exportUtils';
import type { TealineInventoryComplete } from '../types/tealine';

// Progress bar component for bag allocation
interface AllocationProgressProps {
  available: number;
  allocated: number;
  processed: number;
  total: number;
}

function AllocationProgress({ available, allocated, processed, total }: AllocationProgressProps) {
  if (total === 0) return <div className="text-sm text-gray-500">No data</div>;
  
  const availablePercentage = (available / total) * 100;
  const allocatedPercentage = (allocated / total) * 100;
  const processedPercentage = (processed / total) * 100;
  
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-1">
        <div className="relative w-20 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="absolute left-0 h-full bg-tea-500 transition-all duration-300"
            style={{ width: `${availablePercentage}%` }}
          />
          <div 
            className="absolute h-full bg-tea-600 transition-all duration-300"
            style={{ left: `${availablePercentage}%`, width: `${allocatedPercentage}%` }}
          />
          <div 
            className="absolute h-full bg-gray-400 transition-all duration-300"
            style={{ left: `${availablePercentage + allocatedPercentage}%`, width: `${processedPercentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-600">{available}/{total}/{processed}</span>
      </div>
    </div>
  );
}

// Status calculation function
function calculateStatus(item: TealineInventoryComplete): 'GOOD' | 'MODERATE' | 'CRITICAL' {
  const availableRatio = item.available_bags / item.total_bags_received;
  const ageInDays = (Date.now() - new Date(item.first_received_date).getTime()) / (1000 * 60 * 60 * 24);
  
  if (availableRatio > 0.7 && ageInDays < 30) return 'GOOD';
  if (availableRatio > 0.3 && ageInDays < 60) return 'MODERATE';
  return 'CRITICAL';
}

// Status badge component
function StatusBadge({ status }: { status: 'GOOD' | 'MODERATE' | 'CRITICAL' }) {
  const statusConfig = {
    GOOD: { label: '🟢 Good', variant: 'success' as const },
    MODERATE: { label: '🟡 Moderate', variant: 'warning' as const },
    CRITICAL: { label: '🔴 Critical', variant: 'error' as const }
  };
  
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}

export function TealineInventory() {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [brokerFilter, setBrokerFilter] = useState('');
  const [gardenFilter, setGardenFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [weightRange, setWeightRange] = useState([0, 10000]);
  const [viewMode, setViewMode] = useState<'table' | 'location' | 'analytics'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Fetch inventory data with the new complete endpoint
  const { data: inventoryResponse, isLoading, error, refetch } = useTealineInventoryComplete(
    (brokerFilter || gardenFilter) ? {
      ...(brokerFilter && { broker: brokerFilter }),
      ...(gardenFilter && { garden: gardenFilter })
    } : undefined
  );
  
  // Fetch filter options
  const { data: filterOptions } = useTealineFilterOptions();
  
  const inventoryData = useMemo(() => inventoryResponse?.data || [], [inventoryResponse?.data]);
  const metaData = inventoryResponse?.meta || {
    total_items: 0,
    total_inventory_weight: 0,
    total_available_weight: 0
  };
  
  // Calculate storage utilization
  const storageUtilization = metaData.total_inventory_weight > 0 
    ? ((metaData.total_available_weight / metaData.total_inventory_weight) * 100).toFixed(1)
    : '0';
  
  // Extract unique values for filters from the data
  const uniqueGrades = [...new Set(inventoryData.map(item => item.grade))].filter(Boolean);
  const uniqueLocations = [...new Set(
    inventoryData.flatMap(item => item.location_distribution?.map(loc => loc.location) || [])
  )].filter(Boolean);
  
  // Filter options
  const brokerOptions = filterOptions?.brokers?.map((broker: any) => ({
    value: broker,
    label: broker
  })) || [];
  
  const gardenOptions = filterOptions?.gardens?.map((garden: any) => ({
    value: garden,
    label: garden
  })) || [];
  
  const gradeOptions = uniqueGrades.map(grade => ({
    value: grade,
    label: grade
  }));
  
  const locationOptions = uniqueLocations.map(location => ({
    value: location,
    label: location
  }));
  
  // Apply client-side filtering
  const filteredData = useMemo(() => {
    return inventoryData.filter(item => {
      const matchesSearch = !searchTerm || 
        item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.garden?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.broker?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGrade = !gradeFilter || item.grade === gradeFilter;
      
      const matchesLocation = !locationFilter || 
        item.location_distribution?.some(loc => loc.location === locationFilter);
      
      const matchesWeight = Number(item.remaining_weight || 0) >= weightRange[0] && 
        Number(item.remaining_weight || 0) <= weightRange[1];
      
      return matchesSearch && matchesGrade && matchesLocation && matchesWeight;
    });
  }, [inventoryData, searchTerm, gradeFilter, locationFilter, weightRange]);
  
  // Calculate filtered totals
  const filteredTotals = useMemo(() => {
    const totalWeight = filteredData.reduce((sum, item) => sum + Number(item.total_net_weight || 0), 0);
    const availableWeight = filteredData.reduce((sum, item) => sum + Number(item.remaining_weight || 0), 0);
    return { totalWeight, availableWeight };
  }, [filteredData]);
  
  // Pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);
  
  // Reset page when filters change
  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };
  
  const handleWeightRangeChange = (index: number, value: number) => {
    const newRange = [...weightRange];
    newRange[index] = value;
    setWeightRange(newRange);
    setCurrentPage(1);
  };
  
  // Export functions
  const handleExportInventory = (format: 'csv' | 'pdf') => {
    const columns: ExportColumn[] = [
      { key: 'item_code', header: 'Item Code' },
      { key: 'broker', header: 'Broker' },
      { key: 'garden', header: 'Garden' },
      { key: 'grade', header: 'Grade' },
      { key: 'total_bags_received', header: 'Total Bags' },
      { key: 'available_bags', header: 'Available Bags' },
      { key: 'allocated_bags', header: 'Allocated Bags' },
      { key: 'processed_bags', header: 'Processed Bags' },
      { key: 'total_net_weight', header: 'Total Weight (kg)' },
      { key: 'remaining_weight', header: 'Remaining Weight (kg)' },
      { key: 'first_received_date', header: 'First Received' },
      { key: 'last_updated', header: 'Last Updated' }
    ];
    
    const exportData = filteredData.map(item => ({
      ...item,
      first_received_date: formatDateForExport(new Date(item.first_received_date)),
      last_updated: formatDateForExport(new Date(item.last_updated)),
      total_net_weight: formatWeightForExport(item.total_net_weight),
      remaining_weight: formatWeightForExport(item.remaining_weight)
    }));
    
    const filename = `tealine_inventory_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      exportToCSV(exportData, filename, columns);
    } else {
      exportToPDF(
        exportData,
        filename,
        columns,
        'Tealine Inventory Report',
        `Generated on ${new Date().toLocaleDateString()} • Total Items: ${filteredData.length}`
      );
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-tea-600 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-900">Loading Inventory Data</p>
          <p className="text-sm text-gray-500">Please wait while we fetch the latest inventory...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-900">Error Loading Data</p>
          <p className="text-sm text-gray-600 mb-4">{error.message}</p>
          <button 
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-md bg-tea-600 px-4 py-2 text-sm font-medium text-white hover:bg-tea-700"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#237c4b' }}>Inventory Dashboard (Seeduwa)</h2>
          <p className="text-gray-600">Tea Stock Management • Last Sync: {new Date().toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-md bg-tea-600 px-4 py-2 text-sm font-medium text-white hover:bg-tea-700"
          >
            <RefreshCw className="h-4 w-4" />
            Sync
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleExportInventory('csv')}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </button>
            <button 
              onClick={() => handleExportInventory('pdf')}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>
      
      {/* Summary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-tea-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-tea-100 p-3">
                <Package className="h-6 w-6 text-tea-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-tea-700 uppercase">Total Tea Items</p>
                <p className="text-2xl font-bold text-tea-600">{metaData.total_items.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">↑ 12 new today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-tea-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-tea-100 p-3">
                <Package className="h-6 w-6 text-tea-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-tea-700 uppercase">Total Inventory Weight</p>
                <p className="text-2xl font-bold text-tea-600">{(metaData.total_inventory_weight / 1000).toFixed(0).toLocaleString()} kg</p>
                <p className="text-xs text-gray-500 mt-1">↓ 2.3% from yesterday</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-tea-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-tea-100 p-3">
                <TrendingUp className="h-6 w-6 text-tea-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-tea-700 uppercase">Available Weight</p>
                <p className="text-2xl font-bold text-tea-600">{(metaData.total_available_weight / 1000).toFixed(0).toLocaleString()} kg</p>
                <p className="text-xs text-gray-500 mt-1">{((metaData.total_available_weight / metaData.total_inventory_weight) * 100).toFixed(1)}% of total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-tea-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <BarChart2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-tea-700 uppercase">Storage Utilization</p>
                <p className="text-2xl font-bold text-tea-600">{storageUtilization}%</p>
                <p className="text-xs text-green-600 mt-1">🟢 Optimal capacity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters & View Controls */}
      <Card className="bg-tea-50">
        <CardContent>
          <div className="space-y-4">
            {/* Filter Row 1 */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search item code, broker, garden..."
                    value={searchTerm}
                    onChange={(e) => handleFilterChange(setSearchTerm)(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={brokerFilter}
                onValueChange={handleFilterChange(setBrokerFilter)}
                placeholder="All Brokers"
                options={brokerOptions}
                className="w-48"
              />
              <Select
                value={gardenFilter}
                onValueChange={handleFilterChange(setGardenFilter)}
                placeholder="All Gardens"
                options={gardenOptions}
                className="w-48"
              />
              <Select
                value={gradeFilter}
                onValueChange={handleFilterChange(setGradeFilter)}
                placeholder="All Grades"
                options={gradeOptions}
                className="w-40"
              />
              <Select
                value={locationFilter}
                onValueChange={handleFilterChange(setLocationFilter)}
                placeholder="All Locations"
                options={locationOptions}
                className="w-48"
              />
            </div>
            
            {/* Weight Range Slider */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Weight Range:</span>
              <input
                type="range"
                min="0"
                max="10000"
                value={weightRange[0]}
                onChange={(e) => handleWeightRangeChange(0, parseInt(e.target.value))}
                className="w-32"
                style={{
                  accentColor: '#237c4b',
                }}
              />
              <span className="text-sm text-gray-600">{weightRange[0]} kg</span>
              <span className="text-sm text-gray-600">to</span>
              <input
                type="range"
                min="0"
                max="10000"
                value={weightRange[1]}
                onChange={(e) => handleWeightRangeChange(1, parseInt(e.target.value))}
                className="w-32"
                style={{
                  accentColor: '#237c4b',
                }}
              />
              <span className="text-sm text-gray-600">{weightRange[1]} kg</span>
            </div>
            
            {/* View Toggle & Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    viewMode === 'table' 
                      ? 'bg-tea-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4 inline mr-1" />
                  Table View
                </button>
                <button
                  onClick={() => setViewMode('location')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    viewMode === 'location' 
                      ? 'bg-tea-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location View
                </button>
                <button
                  onClick={() => setViewMode('analytics')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    viewMode === 'analytics' 
                      ? 'bg-tea-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BarChart2 className="h-4 w-4 inline mr-1" />
                  Analytics View
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                🔍 Showing {filteredData.length} of {metaData.total_items} items • 
                Total: {(filteredTotals.totalWeight / 1000).toFixed(0)} kg • 
                Available: {(filteredTotals.availableWeight / 1000).toFixed(0)} kg
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Content Area - Table View */}
      {viewMode === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle>
              Inventory Items ({totalItems} items, showing {paginatedData.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-3">Item Code</TableHead>
                  <TableHead className="px-6 py-3">Broker</TableHead>
                  <TableHead className="px-6 py-3">Garden</TableHead>
                  <TableHead className="px-6 py-3">Grade</TableHead>
                  <TableHead className="px-6 py-3">Bags (A/T/P)</TableHead>
                  <TableHead className="px-6 py-3">Weight (R/T)</TableHead>
                  <TableHead className="px-6 py-3">Locations</TableHead>
                  <TableHead className="px-6 py-3">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item) => {
                  const ageInDays = Math.floor(
                    (Date.now() - new Date(item.first_received_date).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const status = calculateStatus(item);
                  
                  return (
                    <TableRow key={item.item_code}>
                      <TableCell className="px-6 py-4">
                        <div>
                          <div className="font-medium text-tea-700">{item.item_code}</div>
                          <div className="text-sm text-gray-500">📅 {ageInDays}d ago</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">{item.broker}</TableCell>
                      <TableCell className="px-6 py-4">{item.garden}</TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="default">{item.grade}</Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <AllocationProgress
                          available={item.available_bags}
                          allocated={item.allocated_bags}
                          processed={item.processed_bags}
                          total={item.total_bags_received}
                        />
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="text-sm">
                          <div>{Number(item.remaining_weight || 0).toFixed(0)}/{Number(item.total_net_weight || 0).toFixed(0)} kg</div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="text-sm">
                          {item.location_distribution.slice(0, 2).map((loc, idx) => (
                            <div key={idx}>
                              {loc.location}({loc.bags})
                            </div>
                          ))}
                          {item.location_distribution.length > 2 && (
                            <div className="text-gray-500">+{item.location_distribution.length - 2} more</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <StatusBadge status={status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Location View - Placeholder */}
      {viewMode === 'location' && (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Location View</p>
            <p className="text-sm text-gray-600">Location-based inventory visualization coming soon</p>
          </CardContent>
        </Card>
      )}
      
      {/* Analytics View - Placeholder */}
      {viewMode === 'analytics' && (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Analytics View</p>
            <p className="text-sm text-gray-600">Weight distribution and allocation analytics coming soon</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}