import { useState, useEffect } from 'react';
import { RefreshCw, Search, Loader2, FileDown, FileText, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { usePendingTealines } from '../hooks/useTealine';
import { exportToCSV, type ExportColumn } from '../utils/exportUtils';
import { Pagination } from '../components/ui/Pagination';
import { Package } from 'lucide-react';


export function PendingTealines() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // For server-side search
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch real API data with pagination and search
  const queryParams = {
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    ...(searchQuery && { search: searchQuery }),
  };
  
  
  // Always pass the query params (never undefined)
  const { data: pendingResponse, isLoading, isFetching, error, refetch } = usePendingTealines(queryParams);

  // Watch for fetch completion and clear user interaction state
  useEffect(() => {
    if (isUserInteracting && !isFetching) {
      setIsUserInteracting(false);
    }
  }, [isFetching, isUserInteracting]);

  // Determine loading states based on existing data
  const hasExistingData = !!pendingResponse;
  const isInitialLoading = isLoading && !hasExistingData;
  const isInteractionLoading = isUserInteracting && isFetching && hasExistingData;

  // Use real API data - handle both old and new response formats
  const pendingData = Array.isArray(pendingResponse) ? pendingResponse : (pendingResponse?.data || []);
  const metaData = Array.isArray(pendingResponse) ? {
    total_items: pendingResponse.length,
    current_page_items: pendingResponse.length,
    total_pending_bags: 0,
    average_age_days: 0,
    pagination: {
      limit: itemsPerPage,
      offset: 0,
      total_count: pendingResponse.length,
      total_pages: Math.ceil(pendingResponse.length / itemsPerPage),
      current_page: currentPage,
      has_next: false,
      has_previous: false,
    },
  } : (pendingResponse?.meta || {
    total_items: 0,
    current_page_items: 0,
    total_pending_bags: 0,
    average_age_days: 0,
    pagination: {
      limit: 25,
      offset: 0,
      total_count: 0,
      total_pages: 0,
      current_page: 1,
      has_next: false,
      has_previous: false,
    },
  });

  // Server-side pagination from API response
  const totalItems = metaData.pagination?.total_count || 0;
  const totalPages = metaData.pagination?.total_pages || 1;
  
  // Use server-side paginated data directly
  const paginatedData = pendingData;

  const handleSearch = () => {
    setIsUserInteracting(true);
    setSearchQuery(searchTerm.trim());
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setIsUserInteracting(true);
    setSearchTerm('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setIsUserInteracting(true);
    setCurrentPage(page);
  };

  const handlePageSizeChange = (pageSize: number) => {
    setIsUserInteracting(true);
    setItemsPerPage(pageSize);
    setCurrentPage(1);
  };




  // Export functions
  const handleExportTealines = (format: 'csv' | 'pdf') => {
    const columns: ExportColumn[] = [
      { key: 'item_code', header: 'Item Code' },
      { key: 'broker', header: 'Broker' },
      { key: 'garden', header: 'Garden' },
      { key: 'grade', header: 'Grade' },
      { key: 'expected_bags', header: 'Expected Bags' }
    ];

    const exportData = paginatedData.map((tealine: any) => {
      return {
        ...tealine
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

  if (isInitialLoading) {
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
          <div className="h-12 w-12 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-500 text-xl">!</span>
          </div>
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
            <h2 className="text-2xl font-bold" style={{ color: '#237c4b' }}>Pending Tealine</h2>
          </div>
          <p className="text-gray-600">Monitor tealine items awaiting receipt</p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Search */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search item code, broker, garden..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-md bg-tea-600 px-4 py-2 text-sm font-medium text-white hover:bg-tea-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInteractionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </button>
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="text-sm text-gray-600 mt-2">
              🔍 Showing {paginatedData.length} of {totalItems} items matching "{searchQuery}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Data Table */}
      {isInteractionLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-tea-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Updating results...</p>
              <p className="text-xs text-gray-500">Filtering pending tealines</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Pending Tealine ({totalItems} total{searchQuery ? ` • Search: "${searchQuery}"` : ''}, showing {paginatedData.length})
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
                <TableHead className="px-6 py-3 text-right">Expected Bags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item: any) => {
                
                return (
                  <TableRow 
                    key={`${item.item_code}-${item.created_ts}`}
                  >
                    <TableCell className="px-6 py-4 font-medium">{item.item_code}</TableCell>
                    <TableCell className="px-6 py-4">{item.broker}</TableCell>
                    <TableCell className="px-6 py-4">{item.garden}</TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="default">{item.grade}</Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right font-medium">{item.expected_bags || 'N/A'}</TableCell>
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
      )}
    </div>
  );
}