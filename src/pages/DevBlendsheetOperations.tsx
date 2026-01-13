import { useState, useEffect } from "react";
import React from "react";
import {
  RefreshCw,
  Search,
  TrendingUp,
  Package2,
  BarChart3,
  Loader2,
  FileDown,
  FileText,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { KpiCard } from "../components/ui/KpiCard";
import { Input } from "../components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { useDevBlendsheetOperations } from "../hooks/useDevMockData";
import {
  exportToCSV,
  exportToPDF,
  formatWeightForExport,
  formatPercentageForExport,
  type ExportColumn,
} from "../utils/exportUtils";
import type { BlendsheetData, BlendsheetBatchData } from "../types/blendsheet";

// Dev version of BlendsheetOperations that uses mock data
// This is a duplicate page for dev panel testing only

type TimeRange = 'this_week' | 'this_month' | 'this_year' | 'lifetime';

export function DevBlendsheetOperations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // For server-side search
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('this_week');
  const [expandedRowTabs, setExpandedRowTabs] = useState<Record<string, 'batches' | 'info'>>({});
  const [expandedMixtureSections, setExpandedMixtureSections] = useState<Record<string, Set<string>>>({});
  const [expandedBatchAllocations, setExpandedBatchAllocations] = useState<Record<string, string | null>>({});

  // Get browser's timezone offset in ±HH:MM format
  const getBrowserTimezoneOffset = (): string => {
    const offsetMinutes = new Date().getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offsetMinutes / 60));
    const offsetMins = Math.abs(offsetMinutes % 60);
    const sign = offsetMinutes <= 0 ? "+" : "-";

    return `${sign}${offsetHours.toString().padStart(2, "0")}:${offsetMins
      .toString()
      .padStart(2, "0")}`;
  };

  const timezoneOffset = getBrowserTimezoneOffset();

  // Debug: Log timezone offset
  useEffect(() => {
    console.log("Browser timezone offset:", timezoneOffset);
  }, [timezoneOffset]);

  // Use mock data hook directly
  const {
    data: operationsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useDevBlendsheetOperations({
    page: currentPage,
    limit: itemsPerPage,
    timezone_offset: timezoneOffset,
    filters: {
      ...(searchQuery && { search: searchQuery }),
    },
  });

  // Watch for fetch completion and clear user interaction state
  useEffect(() => {
    if (isUserInteracting && !isFetching) {
      setIsUserInteracting(false);
    }
  }, [isFetching, isUserInteracting]);

  // Determine loading states based on existing data
  const hasExistingData = !!operationsResponse;
  const isInitialLoading = isLoading && !hasExistingData;
  const isInteractionLoading = isUserInteracting && isFetching && hasExistingData;

  // Use API data or empty array as fallback
  const blendsheetData = operationsResponse?.data || [];
  const metaData = operationsResponse?.meta || {
    total_items: 0,
    current_page_items: 0,
    total_blendsheets: 0,
    total_batches_created: 0,
    active_blendsheets: 0,
    avg_efficiency_percentage: 0,
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

  // Server-side pagination from API response
  const displayData = blendsheetData;
  const totalItems = metaData.pagination?.total_count || 0;
  const totalPages = metaData.pagination?.total_pages || 1;

  // Handle server-side search
  const handleSearch = () => {
    setIsUserInteracting(true); // Mark as user-initiated interaction
    setSearchQuery(searchTerm.trim());
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle clear search
  const handleClearSearch = () => {
    setIsUserInteracting(true); // Mark as user-initiated interaction
    setSearchTerm("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setIsUserInteracting(true); // Mark as user-initiated interaction
    setCurrentPage(page);
  };

  // Handle page size changes
  const handlePageSizeChange = (pageSize: number) => {
    setIsUserInteracting(true); // Mark as user-initiated interaction
    setItemsPerPage(pageSize);
    setCurrentPage(1);
  };

  const toggleRowExpansion = (rowId: string) => {
    if (expandedRow === rowId) {
      // Collapse current row
      setExpandedRow(null);
      // Clean up tab state when row is collapsed
      const newTabs = { ...expandedRowTabs };
      delete newTabs[rowId];
      setExpandedRowTabs(newTabs);
    } else {
      // Expand new row (automatically collapses previous)
      setExpandedRow(rowId);
      // Initialize tab to 'batches' when row is expanded
      setExpandedRowTabs({ [rowId]: 'batches' });
    }
  };

  const setExpandedRowTab = (rowId: string, tab: 'batches' | 'info') => {
    setExpandedRowTabs({ ...expandedRowTabs, [rowId]: tab });
  };

  const toggleMixtureSection = (blendsheetNo: string, sectionName: string) => {
    const currentSections = expandedMixtureSections[blendsheetNo] || new Set<string>();
    const newSections = new Set(currentSections);

    if (newSections.has(sectionName)) {
      newSections.delete(sectionName);
    } else {
      newSections.add(sectionName);
    }

    setExpandedMixtureSections({
      ...expandedMixtureSections,
      [blendsheetNo]: newSections
    });
  };

  const isMixtureSectionExpanded = (blendsheetNo: string, sectionName: string) => {
    return expandedMixtureSections[blendsheetNo]?.has(sectionName) || false;
  };

  const toggleBatchAllocation = (blendsheetNo: string, batchCode: string) => {
    const currentExpanded = expandedBatchAllocations[blendsheetNo];
    setExpandedBatchAllocations({
      ...expandedBatchAllocations,
      [blendsheetNo]: currentExpanded === batchCode ? null : batchCode
    });
  };

  const isBatchAllocationExpanded = (blendsheetNo: string, batchCode: string) => {
    return expandedBatchAllocations[blendsheetNo] === batchCode;
  };

  const formatWeight = (weight: number | undefined | null) => {
    if (weight === undefined || weight === null || isNaN(weight)) {
      return "0.00 kg";
    }
    return `${weight.toFixed(2)} kg`;
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0.0%";
    }
    return `${value.toFixed(1)}%`;
  };

  // Calculate blend-in weight (sum of blend_in_weight from all batches)
  const calculateBlendInWeight = (item: BlendsheetData) => {
    return item.batches.reduce((sum, batch) => sum + batch.blend_in_weight, 0);
  };

  // Calculate blend-out weight (sum of blend_out_weight from all batches)
  const calculateBlendOutWeight = (item: BlendsheetData) => {
    return item.batches.reduce((sum, batch) => sum + (batch.blend_out_weight || 0), 0);
  };

  // Calculate blendsheet status based on batch data
  const getBlendsheetStatus = (item: BlendsheetData): "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" => {
    // Not Started if no batches created
    if (item.batches.length === 0) {
      return "NOT_STARTED";
    }

    // Completed if all batches are created AND all are marked as completed
    if (
      item.batches.length === item.no_of_batches &&
      item.batches.every((batch) => batch.status === 'COMPLETED')
    ) {
      return "COMPLETED";
    }

    // Otherwise, in progress
    return "IN_PROGRESS";
  };

  // Calculate efficiency for a single batch (only if completed)
  // Efficiency is divided by total number of batches to get proportional contribution
  const calculateBatchEfficiency = (batch: BlendsheetBatchData, no_of_batches: number): number | null => {
    if (batch.status !== 'COMPLETED' || batch.blend_in_weight === 0 || !batch.blend_out_weight) {
      return null;
    }
    const rawEfficiency = (batch.blend_out_weight / batch.blend_in_weight) * 100;
    return rawEfficiency / no_of_batches;
  };

  // Calculate overall blendsheet efficiency (sum of completed batch efficiencies)
  // Each batch contributes a proportional share based on total batches
  const calculateBlendsheetEfficiency = (item: BlendsheetData): number | null => {
    const completedBatches = item.batches.filter((batch) => batch.status === 'COMPLETED');

    if (completedBatches.length === 0) {
      return null;
    }

    const efficiencies = completedBatches
      .map((batch) => calculateBatchEfficiency(batch, item.no_of_batches))
      .filter((efficiency): efficiency is number => efficiency !== null);

    if (efficiencies.length === 0) {
      return null;
    }

    return efficiencies.reduce((sum, eff) => sum + eff, 0);
  };

  // Export functions
  const handleExportBlendsheets = (format: "csv" | "pdf") => {
    const columns: ExportColumn[] = [
      { key: "blendsheet_no", header: "Blendsheet Number" },
      { key: "blend_code", header: "Blend Code" },
      { key: "remarks", header: "Remarks" },
      { key: "budget_weight", header: "Budget Weight (kg)" },
      { key: "actual_weight", header: "Actual Weight (kg)" },
      { key: "efficiency", header: "Efficiency (%)" },
      { key: "variance", header: "Variance (kg)" },
    ];

    const exportData = displayData.map((item: BlendsheetData) => {
      const blendOutWeight = calculateBlendOutWeight(item);
      const efficiency = calculateBlendsheetEfficiency(item);

      return {
        ...item,
        budget_weight: formatWeightForExport(item.planned_weight),
        actual_weight: formatWeightForExport(blendOutWeight),
        efficiency: formatPercentageForExport(efficiency || 0),
        variance: formatWeightForExport(blendOutWeight - item.planned_weight),
      };
    });

    const filename = `blendsheet_operations_${new Date().toISOString().split("T")[0]}`;

    if (format === "csv") {
      exportToCSV(exportData, filename, columns);
    } else {
      exportToPDF(
        exportData,
        filename,
        columns,
        "Blendsheet Operations Report",
        `Generated on ${new Date().toLocaleDateString()} • Total Blendsheets: ${totalItems}`
      );
    }
  };

  // Use KPI values from meta for selected time range (all ranges pre-calculated)
  const timeRangeMetrics = (metaData as any)?.time_ranges?.[timeRange] || {};
  const totalBlendsheets = timeRangeMetrics.total_blendsheets || 0;
  const totalPlanned = timeRangeMetrics.total_planned_weight || 0;
  const totalEffectiveBlendIn = timeRangeMetrics.total_blend_in_weight || 0;
  const totalBlendOut = timeRangeMetrics.total_blend_out_weight || 0;

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
        <span className="ml-2 text-lg">Loading blendsheets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading blendsheets: {error.message}</p>
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
          <h2 className="text-2xl font-bold" style={{ color: "#237c4b" }}>
            Blendsheet Operations
          </h2>
          <p className="text-gray-600">Weight flow analysis and batch progress tracking</p>
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
              onClick={() => handleExportBlendsheets("csv")}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => handleExportBlendsheets("pdf")}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Time Range Tabs */}
      <Card className="p-4 bg-tea-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Time Range:</span>
            <div className="flex rounded-md border border-gray-200 bg-white">
              <button
                onClick={() => setTimeRange('this_week')}
                className={`px-4 py-2 text-sm rounded-l-md transition-colors ${
                  timeRange === 'this_week'
                    ? 'bg-tea-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTimeRange('this_month')}
                className={`px-4 py-2 text-sm border-l border-gray-200 transition-colors ${
                  timeRange === 'this_month'
                    ? 'bg-tea-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeRange('this_year')}
                className={`px-4 py-2 text-sm border-l border-gray-200 transition-colors ${
                  timeRange === 'this_year'
                    ? 'bg-tea-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                This Year
              </button>
              <button
                onClick={() => setTimeRange('lifetime')}
                className={`px-4 py-2 text-sm border-l border-gray-200 rounded-r-md transition-colors ${
                  timeRange === 'lifetime'
                    ? 'bg-tea-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Lifetime
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Showing data for <span className="font-medium">{timeRange.replace('_', ' ')}</span>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          title="Total Blendsheets"
          value={totalBlendsheets}
          icon={Package2}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
          trendValue="Blend operations overview"
          trendColor="text-gray-500"
        />

        <KpiCard
          title="Total Planned"
          value={`${totalPlanned.toLocaleString()} kg`}
          icon={Package2}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
          trendValue="Planned weight"
          trendColor="text-gray-500"
        />

        <KpiCard
          title="Total Blend In"
          value={`${totalEffectiveBlendIn.toLocaleString()} kg`}
          icon={BarChart3}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
          trendValue="Actual input weight"
          trendColor="text-gray-500"
        />

        <KpiCard
          title="Total Blend Out"
          value={`${totalBlendOut.toLocaleString()} kg`}
          icon={TrendingUp}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
          trendValue="Output produced"
          trendColor="text-gray-500"
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search blendsheet number, blend code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="pl-10"
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
        </CardContent>
      </Card>

      {/* Blendsheets Table */}
      {isInteractionLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-tea-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Updating results...</p>
              <p className="text-xs text-gray-500">Filtering blendsheet data</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Blendsheets ({totalItems} total, showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {currentPage * itemsPerPage})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-3 w-8"> </TableHead>
                  <TableHead className="px-6 py-3">Blendsheet Number</TableHead>
                  <TableHead className="px-6 py-3">Planned Weight</TableHead>
                  <TableHead className="px-6 py-3">Blend-In Weight</TableHead>
                  <TableHead className="px-6 py-3">Blend-Out Weight</TableHead>
                  <TableHead className="px-6 py-3">No of Batches</TableHead>
                  <TableHead className="px-6 py-3">Status & Efficiency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(displayData) &&
                  displayData.map((item: BlendsheetData) => {
                    if (!item || !item.blendsheet_no) return null;

                    return (
                      <React.Fragment key={item.blendsheet_no}>
                        <TableRow
                          onClick={() => toggleRowExpansion(item.blendsheet_no)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <TableCell className="px-6 py-4">
                            {expandedRow === item.blendsheet_no ? (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {item.blendsheet_no} ({item.blend_code})
                              </span>
                              <span className="text-xs text-gray-400 mt-0.5">{item.remarks}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {formatWeight(item.planned_weight)}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="text-blue-600 font-medium">
                              {formatWeight(calculateBlendInWeight(item))}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="text-green-600 font-medium">
                              {formatWeight(calculateBlendOutWeight(item))}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="font-medium">
                              {item.batches.length}/{item.no_of_batches}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {(() => {
                              const status = getBlendsheetStatus(item);
                              const efficiency = calculateBlendsheetEfficiency(item);

                              if (status === "NOT_STARTED") {
                                return (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    Not Started
                                  </span>
                                );
                              }

                              if (status === "IN_PROGRESS") {
                                return (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                    In Progress
                                    {efficiency ? ` • ${formatPercentage(efficiency)}` : ""}
                                  </span>
                                );
                              }

                              if (status === "COMPLETED") {
                                return (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    Completed
                                    {efficiency ? ` • ${formatPercentage(efficiency)}` : ""}
                                  </span>
                                );
                              }
                            })()}
                          </TableCell>
                        </TableRow>

                        {/* Expanded details with tabs */}
                        {expandedRow === item.blendsheet_no && (
                            <TableRow key={`${item.blendsheet_no}-expanded`}>
                              <TableCell colSpan={7} className="px-6 py-4 bg-gray-50">
                                <div className="space-y-4">
                                  {/* Tab Navigation */}
                                  <div className="flex items-center space-x-1 border-b border-gray-200">
                                    <button
                                      onClick={() => setExpandedRowTab(item.blendsheet_no, 'batches')}
                                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                                        (expandedRowTabs[item.blendsheet_no] || 'batches') === 'batches'
                                          ? 'border-tea-600 text-tea-600'
                                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                      }`}
                                    >
                                      Batch Details ({item.batches.length})
                                    </button>
                                    <button
                                      onClick={() => setExpandedRowTab(item.blendsheet_no, 'allocations')}
                                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                                        expandedRowTabs[item.blendsheet_no] === 'allocations'
                                          ? 'border-tea-600 text-tea-600'
                                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                      }`}
                                    >
                                      Allocation Details
                                    </button>
                                    <button
                                      onClick={() => setExpandedRowTab(item.blendsheet_no, 'info')}
                                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                                        expandedRowTabs[item.blendsheet_no] === 'info'
                                          ? 'border-tea-600 text-tea-600'
                                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                      }`}
                                    >
                                      Mixture Details
                                    </button>
                                  </div>

                                  {/* Tab Content */}
                                  {(expandedRowTabs[item.blendsheet_no] || 'batches') === 'batches' ? (
                                    /* Batch Details Tab */
                                    <div>
                                      <h3 className="font-medium text-gray-900 mb-3">
                                        Batch Details for {item.blendsheet_no}
                                      </h3>

                                      <>
                                        {/* Child Table Header */}
                                        <div className="bg-gray-200 border border-gray-300 rounded-t-lg">
                                          <div className="grid grid-cols-6 gap-4 p-3 text-sm font-medium text-gray-900">
                                            <div>Item Code</div>
                                            <div>Blend-In Weight</div>
                                            <div>Blend-In Time</div>
                                            <div>Blend-Out Weight</div>
                                            <div>Blend-Out Time</div>
                                            <div>Status & Efficiency</div>
                                          </div>
                                        </div>

                                        {/* Child Table Body - Using actual batch data */}
                                        <div className="border-x border-b border-gray-300 divide-y divide-gray-200 rounded-b-lg">
                                          {/* Render created batches */}
                                          {item.batches.map((batch) => {
                                            const batchEfficiency = calculateBatchEfficiency(batch, item.no_of_batches);

                                            return (
                                              <div
                                                key={batch.item_code}
                                                className="grid grid-cols-6 gap-4 p-3 text-sm hover:bg-white"
                                              >
                                                <div className="font-medium font-mono text-blue-600">
                                                  {batch.item_code}
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-blue-600 font-medium">
                                                    {formatWeight(batch.blend_in_weight)}
                                                  </span>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setExpandedRowTab(item.blendsheet_no, 'allocations');
                                                      // Expand this specific batch in the accordion
                                                      setExpandedBatchAllocations({
                                                        ...expandedBatchAllocations,
                                                        [item.blendsheet_no]: batch.item_code
                                                      });
                                                    }}
                                                    className="text-xs text-tea-600 hover:text-tea-700 hover:underline text-left mt-0.5"
                                                  >
                                                    View allocations →
                                                  </button>
                                                </div>
                                                <div className="text-gray-700">
                                                  {batch.status === 'ALLOCATE' ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                      Ongoing
                                                    </span>
                                                  ) : (
                                                    batch.blend_in_time || '-'
                                                  )}
                                                </div>
                                                <div className="text-green-600 font-medium">
                                                  {batch.status === 'COMPLETED' || batch.status === 'RECEIVE'
                                                    ? formatWeight(batch.blend_out_weight)
                                                    : '-'}
                                                </div>
                                                <div className="text-gray-700">
                                                  {batch.status === 'RECEIVE' ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                      Ongoing
                                                    </span>
                                                  ) : (
                                                    batch.blend_out_time || '-'
                                                  )}
                                                </div>
                                                <div>
                                                  {batch.status !== 'COMPLETED' && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                      In Progress
                                                    </span>
                                                  )}
                                                  {batch.status === 'COMPLETED' && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                      Completed
                                                      {batchEfficiency
                                                        ? ` • ${formatPercentage(batchEfficiency)}`
                                                        : ""}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}

                                          {/* Render uncreated batch placeholders */}
                                          {Array.from({ length: item.no_of_batches - item.batches.length }).map((_, index) => {
                                            const batchNumber = item.batches.length + index + 1;
                                            return (
                                              <div
                                                key={`uncreated-${batchNumber}`}
                                                className="grid grid-cols-6 gap-4 p-3 text-sm bg-gray-50"
                                              >
                                                <div>
                                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                                                    Not Created
                                                  </span>
                                                </div>
                                                <div className="text-gray-400">-</div>
                                                <div className="text-gray-400">-</div>
                                                <div className="text-gray-400">-</div>
                                                <div className="text-gray-400">-</div>
                                                <div className="text-gray-400">-</div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </>
                                    </div>
                                  ) : expandedRowTabs[item.blendsheet_no] === 'allocations' ? (
                                    /* Allocation Details Tab */
                                    <div className="space-y-4">
                                      <h3 className="font-medium text-gray-900">
                                        Allocation Details for {item.blendsheet_no}
                                      </h3>

                                      {item.batches.map((batch: any) => (
                                        <div key={batch.item_code} className="bg-white rounded-md border border-gray-200">
                                          <div
                                            className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                                            onClick={() => toggleBatchAllocation(item.blendsheet_no, batch.item_code)}
                                          >
                                            <h4 className="font-medium text-sm text-gray-900">
                                              Batch {batch.item_code} ({batch.allocations?.length || 0} allocations)
                                            </h4>
                                            {isBatchAllocationExpanded(item.blendsheet_no, batch.item_code) ? (
                                              <ChevronDown className="h-4 w-4 text-gray-500" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4 text-gray-500" />
                                            )}
                                          </div>
                                          {isBatchAllocationExpanded(item.blendsheet_no, batch.item_code) && (
                                            <div className="p-4">
                                              {batch.allocations && batch.allocations.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                  <table className="w-full text-sm">
                                                    <thead>
                                                      <tr className="border-b border-gray-200 bg-gray-50">
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Item Code</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Source Type</th>
                                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-700">Weight</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                      {batch.allocations.map((alloc: any) => (
                                                        <tr key={alloc.id} className="hover:bg-gray-50">
                                                          <td className="px-3 py-2">
                                                            <div className="flex flex-col">
                                                              <span className="font-mono text-xs text-gray-900">{alloc.source_item_code}</span>
                                                              <span className="font-mono text-[10px] text-gray-500">{alloc.id}</span>
                                                            </div>
                                                          </td>
                                                          <td className="px-3 py-2">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                              {alloc.source_type}
                                                            </span>
                                                          </td>
                                                          <td className="px-3 py-2 text-right font-semibold">{formatWeight(alloc.allocated_weight)}</td>
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              ) : (
                                                <p className="text-sm text-gray-500 italic py-2">
                                                  No allocations recorded (batch in ALLOCATE status or not yet started)
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    /* Mixture Details Tab (moved to third position) */
                                    <div className="space-y-3">
                                      <h3 className="font-medium text-gray-900">
                                        Mixture Details for {item.blendsheet_no}
                                      </h3>

                                      {/* Tealine Mixture */}
                                      {(item as any).mixture_allocations?.tealine && Object.keys((item as any).mixture_allocations.tealine).length > 0 ? (
                                        <div className="bg-white rounded-md border border-gray-200">
                                          <div
                                            className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                                            onClick={() => toggleMixtureSection(item.blendsheet_no, 'tealine')}
                                          >
                                            <h4 className="font-medium text-sm text-gray-900">
                                              Tealine ({Object.keys((item as any).mixture_allocations.tealine).length} items)
                                            </h4>
                                            {isMixtureSectionExpanded(item.blendsheet_no, 'tealine') ? (
                                              <ChevronDown className="h-4 w-4 text-gray-500" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4 text-gray-500" />
                                            )}
                                          </div>
                                          {isMixtureSectionExpanded(item.blendsheet_no, 'tealine') && (
                                            <div className="overflow-x-auto">
                                              <table className="w-full">
                                                <thead>
                                                  <tr className="border-b border-gray-200">
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                                                      Mixture Code
                                                    </th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">
                                                      No. of Bags
                                                    </th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">
                                                      Weight/Bag
                                                    </th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">
                                                      Total Weight
                                                    </th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                  {Object.entries((item as any).mixture_allocations.tealine).map(([mixtureCode, itemData]: [string, any], idx: number) => {
                                                    // Handle both old format (number) and new format (object) for backward compatibility
                                                    const noOfBags = typeof itemData === 'number' ? itemData : itemData.no_of_bags;
                                                    const weightPerBag = typeof itemData === 'number' ? null : itemData.weight_per_bag;
                                                    const totalWeight = weightPerBag ? noOfBags * weightPerBag : null;

                                                    return (
                                                      <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 text-sm font-mono text-gray-900">
                                                          {mixtureCode}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm font-mono text-gray-900 text-right">
                                                          {noOfBags}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-600 text-right">
                                                          {weightPerBag ? `${weightPerBag} kg/bag` : '-'}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm font-semibold text-gray-900 text-right">
                                                          {totalWeight ? `${totalWeight.toFixed(2)} kg` : '-'}
                                                        </td>
                                                      </tr>
                                                    );
                                                  })}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="bg-white rounded-md border border-gray-200">
                                          <div className="px-4 py-3 bg-gray-50">
                                            <h4 className="font-medium text-sm text-gray-500">Tealine (0 items)</h4>
                                          </div>
                                        </div>
                                      )}

                                      {/* Blendbalance Mixture */}
                                      {(item as any).mixture_allocations?.blendbalance && Object.keys((item as any).mixture_allocations.blendbalance).length > 0 ? (
                                        <div className="bg-white rounded-md border border-gray-200">
                                          <div
                                            className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100"
                                            onClick={() => toggleMixtureSection(item.blendsheet_no, 'blendbalance')}
                                          >
                                            <h4 className="font-medium text-sm text-gray-900">
                                              Blendbalance ({Object.keys((item as any).mixture_allocations.blendbalance).length} items)
                                            </h4>
                                            {isMixtureSectionExpanded(item.blendsheet_no, 'blendbalance') ? (
                                              <ChevronDown className="h-4 w-4 text-gray-500" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4 text-gray-500" />
                                            )}
                                          </div>
                                          {isMixtureSectionExpanded(item.blendsheet_no, 'blendbalance') && (
                                            <div className="overflow-x-auto">
                                              <table className="w-full">
                                                <thead>
                                                  <tr className="border-b border-gray-200">
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                                                      Mixture Code
                                                    </th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">
                                                      Weight (kg)
                                                    </th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                  {Object.entries((item as any).mixture_allocations.blendbalance).map(([mixtureCode, weight]: [string, any], idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                      <td className="px-4 py-2 text-sm font-mono text-gray-900">{mixtureCode}</td>
                                                      <td className="px-4 py-2 text-sm font-mono text-gray-900 text-right">{weight.toFixed(2)}</td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="bg-white rounded-md border border-gray-200">
                                          <div className="px-4 py-3 bg-gray-50">
                                            <h4 className="font-medium text-sm text-gray-500">Blendbalance (0 items)</h4>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                      </React.Fragment>
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
