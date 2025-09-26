import { useState, useEffect, useRef, useMemo } from "react";
import {
  RefreshCw,
  UserCheck,
  Printer,
  Loader2,
  ChevronDown,
  ChevronRight,
  Droplets,
  User,
  Package,
  Clock,
  NotebookPen,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { KpiCard } from "../components/ui/KpiCard";
import { Badge } from "../components/ui/Badge";
import { Loading } from "../components/ui/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { MonthPicker } from "../components/ui/MonthPicker";
import { useTraderRequests } from "../hooks/useTraderRequests";
import { printTraderRequestDocument } from "../utils/traderRequestsPrint";
import type { TraderRequest, TraderRequestEntity } from "../types/trader";

export function TraderRequests() {
  // State management (following Analytics Dashboard patterns)
  const [selectedEntity, setSelectedEntity] = useState<TraderRequestEntity>('blendsheet');
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Refs for print functionality (following ShipmentLog pattern)
  const headerContent = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Calculate date range from selected month
  const dateFilters = useMemo(() => {
    const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    return {
      start_date: start.getTime(),
      end_date: end.getTime(),
    };
  }, [selectedMonth]);

  // Fetch trader requests data
  const {
    data: traderRequestsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useTraderRequests(selectedEntity, {
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    ...dateFilters,
  });

  // Watch for fetch completion and clear user interaction state
  useEffect(() => {
    if (isUserInteracting && !isFetching) {
      setIsUserInteracting(false);
    }
  }, [isFetching, isUserInteracting]);

  // Determine loading states
  const hasExistingData = !!traderRequestsResponse;
  const isInitialLoading = isLoading && !hasExistingData;
  const isInteractionLoading = isUserInteracting && isFetching;

  // Debug loading states (temporary)
  console.log('🔍 Loading States:', {
    isUserInteracting,
    isFetching,
    isLoading,
    hasExistingData,
    isInitialLoading,
    isInteractionLoading
  });


  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setIsUserInteracting(true);
  };

  // Handle page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
    setIsUserInteracting(true);
  };

  // Handle entity tab change
  const handleEntityChange = (entity: TraderRequestEntity) => {
    setSelectedEntity(entity);
    setCurrentPage(1);
    setIsUserInteracting(true);
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
    setIsUserInteracting(true);
  };

  // Handle row expansion toggle
  const toggleRowExpansion = (entityNo: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entityNo)) {
        newSet.delete(entityNo);
      } else {
        newSet.add(entityNo);
      }
      return newSet;
    });
  };

  // Handle print individual trader request (following ShipmentLog pattern)
  const handlePrintTraderRequest = async (traderRequest: TraderRequest) => {
    if (!headerContent.current || !iframeRef.current) return;

    await printTraderRequestDocument(
      traderRequest,
      selectedEntity,
      headerContent.current,
      iframeRef.current
    );
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Get status badge variant
  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'TRADER_ALLOWED':
        return 'success';
      case 'TRADER_BLOCKED':
        return 'error';
      case 'TRADER_ELEVATED':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Extract data with safe fallbacks
  const traderRequests = traderRequestsResponse?.data || [];
  const meta = traderRequestsResponse?.meta || {
    total: 0,
    total_approved: 0,
    total_blocked: 0,
    approval_rate: 0,
    pagination: {
      limit: 25,
      offset: 0,
      total_count: 0,
      total_pages: 0,
      current_page: 1,
      has_next: false,
      has_previous: false,
    },
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <UserCheck className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-900">Error Loading Trader Requests</p>
          <p className="text-sm text-gray-600 mb-4">{error.message || 'Failed to load trader request information'}</p>
          <button
            onClick={handleRefresh}
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
          <h1 className="text-2xl font-bold mb-2 text-tea-700">📋 Trader Requests</h1>
          <p className="text-gray-600">
            Historical analysis of trader requests •
            Month: {selectedMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} •
            Total: {meta.total || 0} requests
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 bg-tea-600 hover:bg-tea-700 px-4 py-2 rounded-md transition-colors text-white"
            disabled={isInitialLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Statistics KPI Cards */}
      {!isInitialLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard
            title="Total Requests"
            value={meta.total}
            icon={UserCheck}
            iconColor="text-tea-600"
            iconBgColor="bg-tea-100"
          />
          <KpiCard
            title="Approved"
            value={meta.total_approved}
            icon={UserCheck}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <KpiCard
            title="Blocked"
            value={meta.total_blocked}
            icon={UserCheck}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
          />
          <KpiCard
            title="Approval Rate"
            value={`${meta.approval_rate}%`}
            icon={UserCheck}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
        </div>
      )}

      {/* Entity Tabs + Controls */}
      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Entity Tab Navigation */}
            <div className="flex items-center space-x-2">
              <div className="flex rounded-md border border-gray-200">
                <button
                  onClick={() => handleEntityChange('blendsheet')}
                  className={`px-3 py-1 text-sm rounded-l-md ${
                    selectedEntity === 'blendsheet'
                      ? 'bg-tea-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Blendsheet Requests
                </button>
                <button
                  onClick={() => handleEntityChange('flavorsheet')}
                  className={`px-3 py-1 text-sm rounded-r-md border-l border-gray-200 ${
                    selectedEntity === 'flavorsheet'
                      ? 'bg-tea-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Flavorsheet Requests
                </button>
              </div>
            </div>

            {/* Month Picker */}
            <MonthPicker
              value={selectedMonth}
              onChange={(date) => {
                setSelectedMonth(date);
                setCurrentPage(1);
                setIsUserInteracting(true);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      {isInteractionLoading ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-tea-700">
              {selectedEntity.charAt(0).toUpperCase() + selectedEntity.slice(1)} Trader Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-tea-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Updating results...</p>
              <p className="text-xs text-gray-500">Filtering trader request data</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="text-lg text-tea-700">
                {selectedEntity.charAt(0).toUpperCase() + selectedEntity.slice(1)} Trader Requests
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            {isInitialLoading ? (
              <Loading className="py-12" />
            ) : !traderRequests.length ? (
              <div className="text-center py-12 text-gray-500">
                <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No trader requests found</h3>
                <p className="text-sm">Try adjusting your search criteria or date range.</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"> </TableHead>
                      <TableHead>{selectedEntity.charAt(0).toUpperCase() + selectedEntity.slice(1)} No</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Samples</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Request Time</TableHead>
                      <TableHead>Storekeeper</TableHead>
                      <TableHead className="text-center w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {traderRequests.map((request) => {
                      const entityNo = request.entity_no;
                      const isExpanded = expandedRows.has(entityNo);
                      const hasBatchSamples = request.batches?.some(batch => batch.event?.moisture_content || batch.event?.bag_id);

                      return (
                        <>
                          <TableRow
                            key={entityNo}
                            className={hasBatchSamples ? "hover:bg-gray-50 cursor-pointer" : ""}
                            onClick={hasBatchSamples ? () => toggleRowExpansion(entityNo) : undefined}
                          >
                            <TableCell>
                              {hasBatchSamples && (
                                isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{entityNo}</TableCell>
                            <TableCell>{request.remarks || '-'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {hasBatchSamples && (
                                  <Badge className="bg-tea-100 text-tea-800">
                                    {request.batches?.filter(batch => batch.event?.moisture_content || batch.event?.bag_id).length || 0} Lab Samples
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(request.event?.status)}>
                                {request.event?.status?.replace('TRADER_', '').split('').reduce((u, l) => u.concat(l.toLocaleLowerCase())) || 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatTimestamp(request.event?.event_ts || request.created_ts)}
                            </TableCell>
                            <TableCell>
                              {request.event?.storekeeper ? (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm">{request.event.storekeeper}</span>
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintTraderRequest(request);
                                }}
                                className="inline-flex items-center justify-center rounded-md h-8 w-8 text-gray-600 hover:bg-tea-50"
                                title="Print Request Document"
                              >
                                <Printer className="h-3 w-3" />
                              </button>
                            </TableCell>
                          </TableRow>

                          {/* Expandable Lab Samples Row */}
                          {isExpanded && hasBatchSamples && (
                            <TableRow key={`${entityNo}-expanded`}>
                              <TableCell colSpan={8} className="p-0">
                                <div className="bg-gray-50 p-4 border-t">
                                  <div className="mb-3">
                                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                      <Package className="h-4 w-4" />
                                      Batch Lab Samples
                                    </h4>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {request.batches
                                      ?.filter(batch => batch.event?.moisture_content || batch.event?.bag_id)
                                      .map((batch, index) => (
                                        <div key={`${batch.item_code}-${index}`} className="bg-white rounded-md p-3 border border-gray-200">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-900">{batch.item_code}</span>
                                            {batch.event?.moisture_content && (
                                              <div className="flex items-center gap-1 text-tea-600 bg-tea-50 px-2 py-1 rounded-md">
                                                <Droplets className="h-3 w-3" />
                                                <span className="font-medium text-sm">{batch.event.moisture_content}%</span>
                                              </div>
                                            )}
                                          </div>
                                          <div className="space-y-1 text-xs text-gray-600">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>Created:</span>
                                              </div>
                                              <span>{formatTimestamp(batch.created_ts)}</span>
                                            </div>
                                            {batch.event?.bag_id && (
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                  <Tag className="h-3 w-3" />
                                                  <span>Bag ID:</span>
                                                </div>
                                                <span className="font-medium">{batch.event.bag_id}</span>
                                              </div>
                                            )}
                                            {batch.event?.storekeeper && (
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                  <User className="h-3 w-3" />
                                                  <span>Handler:</span>
                                                </div>
                                                <span className="font-medium">{batch.event.storekeeper}</span>
                                              </div>
                                            )}
                                            {batch.event?.event_ts && (
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                  <NotebookPen className="h-3 w-3" />
                                                  <span>Sample Time:</span>
                                                </div>
                                                <span>{formatTimestamp(batch.event.event_ts)}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <Pagination
                  currentPage={meta.pagination.current_page}
                  totalPages={meta.pagination.total_pages}
                  totalItems={meta.pagination.total_count}
                  itemsPerPage={meta.pagination.limit}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hidden elements for print functionality (following ShipmentLog pattern) */}
      <div ref={headerContent} className="hidden">
        {/* Content will be populated dynamically when printing */}
      </div>
      <iframe ref={iframeRef} className="hidden" title="Print Trader Request Document" />

    </div>
  );
}