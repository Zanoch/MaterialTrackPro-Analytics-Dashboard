import { useState, useMemo } from 'react';
import { RefreshCw, Search, Loader2, FileDown, FileText, Clock, AlertTriangle, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { usePendingTealines, useTealineFilterOptions } from '../hooks/useTealine';
import { exportToCSV, type ExportColumn } from '../utils/exportUtils';
import { Pagination } from '../components/ui/Pagination';
import { Package } from 'lucide-react';

interface ProgressBarProps {
  percentage: number;
  className?: string;
}

function ProgressBar({ percentage, className = '' }: ProgressBarProps) {
  const getColorClass = (pct: number) => {
    if (pct <= 30) return 'bg-amber-600'; // Clay Brown equivalent
    if (pct <= 70) return 'bg-green-500'; // Olive Green equivalent  
    return 'bg-green-700'; // Forest Green
  };

  return (
    <div className={`relative w-40 h-5 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      <div 
        className={`h-full transition-all duration-300 ${getColorClass(percentage)}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );
}

interface StatusIconProps {
  ageDays: number;
}

function StatusIcon({ ageDays }: StatusIconProps) {
  if (ageDays <= 14) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  } else if (ageDays <= 30) {
    return <Clock className="h-4 w-4 text-orange-500" />;
  } else {
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  }
}

export function PendingTealines() {
  const [searchTerm, setSearchTerm] = useState('');
  const [brokerFilter, setBrokerFilter] = useState('');
  const [gardenFilter, setGardenFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ageRange, setAgeRange] = useState([0, 90]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState<'age_days' | 'item_code' | null>('age_days');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch real API data
  const { data: tealines = [], isLoading, error, refetch } = usePendingTealines(
    brokerFilter ? { broker: brokerFilter } : undefined
  );
  
  const { data: filterOptions } = useTealineFilterOptions();

  const brokerOptions = filterOptions?.brokers.map((broker: any) => ({
    value: broker,
    label: broker
  })) || [];

  const gardenOptions = filterOptions?.gardens?.map((garden: any) => ({
    value: garden,
    label: garden
  })) || [];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'critical', label: 'Critical (>30 days)' },
    { value: 'in_progress', label: 'In Progress' }
  ];

  // Client-side filtering and sorting
  const filteredData = useMemo(() => {
    let filtered = tealines.filter(item => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = item.item_code.toLowerCase().includes(searchLower) ||
                             item.garden?.toLowerCase().includes(searchLower) ||
                             item.broker?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Garden filter
      if (gardenFilter && item.garden !== gardenFilter) return false;
      
      // Status filter
      if (statusFilter) {
        if (statusFilter === 'critical' && item.age_days <= 30) return false;
        if (statusFilter === 'pending' && item.age_days > 30) return false;
      }
      
      // Age range filter
      if (item.age_days < ageRange[0] || item.age_days > ageRange[1]) return false;
      
      return true;
    });

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        let valueA: any, valueB: any;
        
        if (sortBy === 'age_days') {
          valueA = a.age_days;
          valueB = b.age_days;
        } else if (sortBy === 'item_code') {
          valueA = a.item_code;
          valueB = b.item_code;
        }
        
        if (typeof valueA === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }
        
        if (valueA < valueB) {
          return sortOrder === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortOrder === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [tealines, searchTerm, gardenFilter, statusFilter, ageRange, sortBy, sortOrder]);

  // Calculate KPI metrics
  const kpiMetrics = useMemo(() => {
    const totalPendingItems = filteredData.length;
    const totalPendingBags = filteredData.reduce((sum, item) => sum + (item.no_of_bags || 0), 0);
    
    // Calculate average age with validation
    const validAges = filteredData
      .map(item => {
        const age = Number(item.age_days);
        // Validate age is a reasonable number (between 0 and 1000 days)
        return (!isNaN(age) && age >= 0 && age <= 1000) ? age : 0;
      })
      .filter(age => age > 0);
    
    const averageAge = validAges.length > 0 
      ? validAges.reduce((sum, age) => sum + age, 0) / validAges.length 
      : 0;
    
    const criticalItems = filteredData.filter(item => {
      const age = Number(item.age_days);
      return !isNaN(age) && age > 30 && age <= 1000;
    }).length;
    
    return {
      totalPendingItems,
      totalPendingBags,
      averageAge,
      criticalItems
    };
  }, [filteredData]);

  // Pagination calculations
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleBrokerChange = (value: string) => {
    setBrokerFilter(value);
    setCurrentPage(1);
  };

  const handleGardenChange = (value: string) => {
    setGardenFilter(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (pageSize: number) => {
    setItemsPerPage(pageSize);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setBrokerFilter('');
    setGardenFilter('');
    setStatusFilter('');
    setAgeRange([0, 90]);
    setCurrentPage(1);
  };

  const handleSort = (column: 'age_days' | 'item_code') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (column: 'age_days' | 'item_code') => {
    if (sortBy !== column) {
      return <div className="w-4 h-4" />; // Empty space for alignment
    }
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };


  // Active filters count for display
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (brokerFilter) count++;
    if (gardenFilter) count++;
    if (statusFilter) count++;
    if (ageRange[0] > 0 || ageRange[1] < 90) count++;
    return count;
  }, [searchTerm, brokerFilter, gardenFilter, statusFilter, ageRange]);

  // Export functions
  const handleExportTealines = (format: 'csv' | 'pdf') => {
    const columns: ExportColumn[] = [
      { key: 'item_code', header: 'Item Code' },
      { key: 'broker', header: 'Broker' },
      { key: 'garden', header: 'Garden' },
      { key: 'grade', header: 'Grade' },
      { key: 'no_of_bags', header: 'Expected Bags' },
      { key: 'received_bags', header: 'Received Bags' },
      { key: 'pending_bags', header: 'Pending Bags' },
      { key: 'age_days', header: 'Age (Days)' },
      { key: 'progress_percentage', header: 'Progress %' }
    ];

    const exportData = filteredData.map(tealine => {
      const receivedBags = 0; // TODO: Calculate from tealine_records
      const pendingBags = tealine.no_of_bags - receivedBags;
      const progressPercentage = tealine.no_of_bags > 0 ? (receivedBags / tealine.no_of_bags) * 100 : 0;
      
      return {
        ...tealine,
        received_bags: receivedBags,
        pending_bags: pendingBags,
        progress_percentage: progressPercentage.toFixed(1)
      };
    });

    const filename = `pending_tealines_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      exportToCSV(exportData, filename, columns);
    } else {
      // TODO: Implement PDF export when needed
      exportToCSV(exportData, filename, columns);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-900">Loading Pending Tealines</p>
          <p className="text-sm text-gray-500">Please wait while we fetch the latest data...</p>
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
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
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
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6" style={{ color: '#237c4b' }} />
            <h2 className="text-2xl font-bold" style={{ color: '#237c4b' }}>Pending Tealines</h2>
          </div>
          <p className="text-gray-600">Monitor tealine items awaiting receipt</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search item code, broker, garden..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <button 
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-md bg-tea-600 px-4 py-2 text-sm font-medium text-white hover:bg-tea-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleExportTealines('csv')}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </button>
            <button 
              onClick={() => handleExportTealines('pdf')}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          title="Total Pending Items"
          value={kpiMetrics.totalPendingItems}
          icon={Package}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
        />
        
        <KpiCard
          title="Total Pending Bags"
          value={kpiMetrics.totalPendingBags}
          icon={Package}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
        />
        
        <KpiCard
          title="Average Age"
          value={`${isNaN(kpiMetrics.averageAge) || !isFinite(kpiMetrics.averageAge) ? '0.00' : kpiMetrics.averageAge.toFixed(2)} days`}
          icon={Clock}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
        />
        
        <KpiCard
          title="Critical Items"
          value={kpiMetrics.criticalItems}
          icon={AlertTriangle}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
          subtitle=">30 days old"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Select
              value={brokerFilter}
              onValueChange={handleBrokerChange}
              placeholder="All Brokers"
              options={brokerOptions}
              className="w-48"
            />
            <Select
              value={gardenFilter}
              onValueChange={handleGardenChange}
              placeholder="All Gardens"
              options={gardenOptions}
              className="w-48"
            />
            <Select
              value={statusFilter}
              onValueChange={handleStatusChange}
              placeholder="All Status"
              options={statusOptions}
              className="w-40"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Age:</span>
              <input
                type="range"
                min="0"
                max="90"
                value={ageRange[0]}
                onChange={(e) => setAgeRange([parseInt(e.target.value), ageRange[1]])}
                className="w-20"
                style={{
                  accentColor: '#237c4b',
                }}
              />
              <span className="text-sm text-gray-600">to</span>
              <input
                type="range"
                min="0"
                max="90"
                value={ageRange[1]}
                onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value)])}
                className="w-20"
                style={{
                  accentColor: '#237c4b',
                }}
              />
              <span className="text-sm text-gray-600">{ageRange[0]}-{ageRange[1]} days</span>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear All ({activeFiltersCount})
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Pending Tealines ({totalItems} total, showing {paginatedData.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6 py-3">
                  <div 
                    className="cursor-pointer hover:bg-gray-50 select-none flex items-center gap-1"
                    onClick={() => handleSort('item_code')}
                  >
                    Item Code
                    {getSortIcon('item_code')}
                  </div>
                </TableHead>
                <TableHead className="px-6 py-3">Broker</TableHead>
                <TableHead className="px-6 py-3">Garden</TableHead>
                <TableHead className="px-6 py-3">Grade</TableHead>
                <TableHead className="px-6 py-3 text-right">Expected Bags</TableHead>
                <TableHead className="px-6 py-3 text-right">Received Bags</TableHead>
                <TableHead className="px-6 py-3">Progress</TableHead>
                <TableHead className="px-6 py-3">
                  <div 
                    className="cursor-pointer hover:bg-gray-50 select-none flex items-center gap-1"
                    onClick={() => handleSort('age_days')}
                  >
                    Age
                    {getSortIcon('age_days')}
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item) => {
                const receivedBags = 0; // TODO: Calculate from tealine_records
                const progressPercentage = item.no_of_bags > 0 ? (receivedBags / item.no_of_bags) * 100 : 0;
                const isCritical = item.age_days > 30;
                
                return (
                  <TableRow 
                    key={`${item.item_code}-${item.created_ts}`}
                    className={isCritical ? 'border-l-4 border-l-red-500' : ''}
                  >
                    <TableCell className="px-6 py-4 font-medium">{item.item_code}</TableCell>
                    <TableCell className="px-6 py-4">{item.broker}</TableCell>
                    <TableCell className="px-6 py-4">{item.garden}</TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="default">{item.grade}</Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right font-medium">{item.no_of_bags}</TableCell>
                    <TableCell className="px-6 py-4 text-right font-medium text-green-600">{receivedBags}</TableCell>
                    <TableCell className="px-6 py-4">
                      <ProgressBar percentage={progressPercentage} />
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <StatusIcon ageDays={item.age_days} />
                        <span className="text-sm text-gray-600">{item.age_days} days</span>
                      </div>
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
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}