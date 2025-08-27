import React, { useState, useEffect } from "react";
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
import { useFlavorsheetOperationsData } from "../hooks/useFlavorsheet";
import {
  exportToCSV,
  exportToPDF,
  formatWeightForExport,
  formatPercentageForExport,
  type ExportColumn,
} from "../utils/exportUtils";


export function FlavorsheetOperations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // For server-side search
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

  // Fetch flavorsheet operations data with pagination and KPI metrics
  const {
    data: operationsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useFlavorsheetOperationsData({
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

  // Mock data with new structure matching blendsheet operations pattern
  const mockFlavorsheetData = [
    {
      flavorsheet_no: "FS001",
      flavor_code: "EARL-GREY-SUPREME",
      remarks: "Premium Earl Grey blend for export market",
      planned_weight: 2500,
      no_of_batches: 3,
      batches: [
        {
          item_code: "FS001-B01",
          created_ts: new Date("2024-01-15T08:00:00"),
          mix_in_weight: 850,
          mix_in_time: "08:00 - 10:30",
          mix_out_weight: 845,
          mix_out_time: "10:30 - 12:00",
          completed: true,
        },
        {
          item_code: "FS001-B02",
          created_ts: new Date("2024-01-15T13:00:00"),
          mix_in_weight: 820,
          mix_in_time: "13:00 - 15:15",
          mix_out_weight: 815,
          mix_out_time: "15:15 - 16:45",
          completed: true,
        },
        {
          item_code: "FS001-B03",
          created_ts: new Date("2024-01-16T09:00:00"),
          mix_in_weight: 830,
          mix_in_time: "09:00 - ongoing",
          mix_out_weight: 0,
          mix_out_time: "",
          completed: false,
        },
      ],
    },
    {
      flavorsheet_no: "FS002",
      flavor_code: "JASMINE-DRAGON-PEARLS",
      remarks: "Premium jasmine tea for specialty market",
      planned_weight: 1800,
      no_of_batches: 2,
      batches: [
        {
          item_code: "FS002-B01",
          created_ts: new Date("2024-01-14T14:00:00"),
          mix_in_weight: 900,
          mix_in_time: "14:00 - 16:30",
          mix_out_weight: 895,
          mix_out_time: "16:30 - 18:00",
          completed: true,
        },
        {
          item_code: "FS002-B02",
          created_ts: new Date("2024-01-15T10:00:00"),
          mix_in_weight: 900,
          mix_in_time: "10:00 - 12:45",
          mix_out_weight: 890,
          mix_out_time: "12:45 - 14:15",
          completed: true,
        },
      ],
    },
    {
      flavorsheet_no: "FS003",
      flavor_code: "CHAI-MASALA-BLEND",
      remarks: "Traditional chai spice blend",
      planned_weight: 3200,
      no_of_batches: 4,
      batches: [],
    }
  ];

  // Use API data, fallback to mock data for development
  const flavorsheetData = operationsResponse?.data || mockFlavorsheetData;
  const metaData = operationsResponse?.meta || {
    total_items: 0,
    current_page_items: 0,
    total_flavorsheets: 0,
    total_batches_created: 0,
    active_flavorsheets: 0,
    avg_efficiency_percentage: 0,
    total_planned_weight: 0,
    total_mix_in_weight: 0,
    total_mix_out_weight: 0,
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
  const displayData = flavorsheetData;
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
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowId)) {
      newExpandedRows.delete(rowId);
    } else {
      newExpandedRows.add(rowId);
    }
    setExpandedRows(newExpandedRows);
  };

  const formatWeight = (weight: number | undefined | null) => {
    if (weight === undefined || weight === null || isNaN(weight)) {
      return "0.00 kg";
    }
    // Convert from grams to kg if weight is greater than 1000
    const weightInKg = weight > 1000 ? weight / 1000 : weight;
    return `${weightInKg.toFixed(2)} kg`;
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0.0%";
    }
    return `${value.toFixed(1)}%`;
  };

  // Calculate mix-in weight (sum of mix_in_weight from all batches)
  const calculateMixInWeight = (item: any) => {
    return item.batches.reduce((sum: number, batch: any) => sum + batch.mix_in_weight, 0);
  };

  // Calculate mix-out weight (sum of mix_out_weight from all batches)
  const calculateMixOutWeight = (item: any) => {
    return item.batches.reduce((sum: number, batch: any) => sum + batch.mix_out_weight, 0);
  };

  // Get mix-in time range from the latest batch (by created_ts)
  const getLatestMixInTime = (item: any) => {
    if (item.batches.length === 0) return "-";

    // Find the latest batch by created_ts
    const latestBatch = item.batches.reduce((latest: any, current: any) =>
      current.created_ts > latest.created_ts ? current : latest
    );

    return latestBatch.mix_in_time || "-";
  };

  // Get mix-out time range from the latest batch (by created_ts)
  const getLatestMixOutTime = (item: any) => {
    if (item.batches.length === 0) return "-";

    // Find the latest batch by created_ts
    const latestBatch = item.batches.reduce((latest: any, current: any) =>
      current.created_ts > latest.created_ts ? current : latest
    );

    return latestBatch.mix_out_time || "-";
  };

  // Calculate flavorsheet status based on batch data
  const getFlavorsheetStatus = (item: any): "DRAFT" | "IN_PROGRESS" | "COMPLETED" => {
    // Draft if no batches created
    if (item.batches.length === 0) {
      return "DRAFT";
    }

    // Completed if all batches are created AND all are marked as completed
    if (
      item.batches.length === item.no_of_batches &&
      item.batches.every((batch: any) => batch.completed)
    ) {
      return "COMPLETED";
    }

    // Otherwise, in progress
    return "IN_PROGRESS";
  };

  // Calculate efficiency for a single batch (only if completed)
  const calculateBatchEfficiency = (batch: any): number | null => {
    if (!batch.completed || batch.mix_in_weight === 0) {
      return null;
    }
    return (batch.mix_out_weight / batch.mix_in_weight) * 100;
  };

  // Calculate overall flavorsheet efficiency (average of completed batch efficiencies)
  const calculateFlavorsheetEfficiency = (item: any): number | null => {
    const completedBatches = item.batches.filter((batch: any) => batch.completed);

    if (completedBatches.length === 0) {
      return null;
    }

    const efficiencies = completedBatches
      .map((batch: any) => calculateBatchEfficiency(batch))
      .filter((efficiency: any): efficiency is number => efficiency !== null);

    if (efficiencies.length === 0) {
      return null;
    }

    return efficiencies.reduce((sum: number, eff: number) => sum + eff, 0) / efficiencies.length;
  };

  // Calculate KPIs from mock data if API data not available
  if (!operationsResponse && flavorsheetData === mockFlavorsheetData) {
    const mockKPIData = {
      total_flavorsheets: mockFlavorsheetData.length,
      total_planned_weight: mockFlavorsheetData.reduce((sum, item) => sum + item.planned_weight, 0),
      total_mix_in_weight: mockFlavorsheetData.reduce((sum, item) => sum + calculateMixInWeight(item), 0),
      total_mix_out_weight: mockFlavorsheetData.reduce((sum, item) => sum + calculateMixOutWeight(item), 0),
      total_batches_created: mockFlavorsheetData.reduce((sum, item) => sum + item.batches.length, 0),
      total_count: mockFlavorsheetData.length,
    };
    
    // Update metaData with calculated values for mock data only
    metaData.total_items = mockKPIData.total_count;
    metaData.current_page_items = mockKPIData.total_count;
    metaData.total_flavorsheets = mockKPIData.total_flavorsheets;
    metaData.total_batches_created = mockKPIData.total_batches_created;
    metaData.active_flavorsheets = mockKPIData.total_flavorsheets;
    metaData.total_planned_weight = mockKPIData.total_planned_weight;
    metaData.total_mix_in_weight = mockKPIData.total_mix_in_weight;
    metaData.total_mix_out_weight = mockKPIData.total_mix_out_weight;
    metaData.pagination.total_count = mockKPIData.total_count;
    metaData.pagination.total_pages = Math.ceil(mockKPIData.total_count / 25);
  }

  // Log meta data to debug KPI values
  console.log('FlavorsheetOperations metaData:', metaData);
  console.log('API operationsResponse available:', !!operationsResponse);


  // Export functions
  const handleExportFlavorsheets = (format: "csv" | "pdf") => {
    const columns: ExportColumn[] = [
      { key: "flavorsheet_no", header: "Flavorsheet Number" },
      { key: "flavor_code", header: "Flavor Code" },
      { key: "remarks", header: "Remarks" },
      { key: "budget_weight", header: "Budget Weight (kg)" },
      { key: "actual_weight", header: "Actual Weight (kg)" },
      { key: "efficiency", header: "Efficiency (%)" },
      { key: "variance", header: "Variance (kg)" },
    ];

    const exportData = displayData.map((item: any) => {
      const mixOutWeight = calculateMixOutWeight(item);
      const efficiency = calculateFlavorsheetEfficiency(item);

      return {
        ...item,
        budget_weight: formatWeightForExport(item.planned_weight),
        actual_weight: formatWeightForExport(mixOutWeight),
        efficiency: formatPercentageForExport(efficiency || 0),
        variance: formatWeightForExport(mixOutWeight - item.planned_weight),
      };
    });

    const filename = `flavorsheet_operations_${new Date().toISOString().split("T")[0]}`;

    if (format === "csv") {
      exportToCSV(exportData, filename, columns);
    } else {
      exportToPDF(
        exportData,
        filename,
        columns,
        "Flavorsheet Operations Report",
        `Generated on ${new Date().toLocaleDateString()} • Total Flavorsheets: ${totalItems}`
      );
    }
  };

  // Use KPI data from API response
  const totalFlavorsheets = metaData.total_flavorsheets || 0;
  const totalPlanned = metaData.total_planned_weight || 0;
  const totalEffectiveMixIn = metaData.total_mix_in_weight || 0;
  const totalMixOut = metaData.total_mix_out_weight || 0;

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
        <span className="ml-2 text-lg">Loading flavorsheets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading flavorsheets: {error.message}</p>
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
            Flavorsheet Operations
          </h2>
          <p className="text-gray-600">Flavor formulation analysis and mixing progress tracking</p>
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
              onClick={() => handleExportFlavorsheets("csv")}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => handleExportFlavorsheets("pdf")}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards - Updated to match flavorsheet-flow page */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          title="Total Flavorsheets"
          value={totalFlavorsheets}
          icon={Package2}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
          trendValue="Flavor operations overview"
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
          title="Total Mix In"
          value={`${totalEffectiveMixIn.toLocaleString()} kg`}
          icon={BarChart3}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
          trendValue="Actual input weight"
          trendColor="text-gray-500"
        />

        <KpiCard
          title="Total Mix Out"
          value={`${totalMixOut.toLocaleString()} kg`}
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
                placeholder="Search flavorsheet number, flavor code..."
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


      {/* Flavorsheets Table */}
      {isInteractionLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-tea-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Updating results...</p>
              <p className="text-xs text-gray-500">Filtering flavorsheet data</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Flavorsheets ({totalItems} total, showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-3 w-8"> </TableHead>
                  <TableHead className="px-6 py-3">Flavorsheet Number</TableHead>
                  <TableHead className="px-6 py-3">Planned Weight</TableHead>
                  <TableHead className="px-6 py-3">Mix-In Weight</TableHead>
                  <TableHead className="px-6 py-3">Mix-Out Weight</TableHead>
                  <TableHead className="px-6 py-3">No of Batches</TableHead>
                  <TableHead className="px-6 py-3">Mix-In Time</TableHead>
                  <TableHead className="px-6 py-3">Mix-Out Time</TableHead>
                  <TableHead className="px-6 py-3">Status & Efficiency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(displayData) &&
                  displayData.map((item: any) => {
                    if (!item || !item.flavorsheet_no) return null;

                    return (
                      <React.Fragment key={item.flavorsheet_no}>
                        <TableRow
                          onClick={
                            getFlavorsheetStatus(item) !== "DRAFT"
                              ? () => toggleRowExpansion(item.flavorsheet_no)
                              : undefined
                          }
                          className={
                            getFlavorsheetStatus(item) !== "DRAFT"
                              ? "cursor-pointer hover:bg-gray-50"
                              : ""
                          }
                        >
                          <TableCell className="px-6 py-4">
                            {getFlavorsheetStatus(item) !== "DRAFT" ? (
                              expandedRows.has(item.flavorsheet_no) ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )
                            ) : null}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {item.flavorsheet_no} ({item.flavor_code})
                              </span>
                              <span className="text-xs text-gray-400 mt-0.5">{item.remarks}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {formatWeight(item.planned_weight)}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="text-blue-600 font-medium">
                              {formatWeight(calculateMixInWeight(item))}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="text-green-600 font-medium">
                              {formatWeight(calculateMixOutWeight(item))}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="font-medium">
                              {item.batches.length}/{item.no_of_batches}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-sm text-gray-600">
                            {getLatestMixInTime(item)}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-sm text-gray-600">
                            {getLatestMixOutTime(item)}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            {(() => {
                              const status = getFlavorsheetStatus(item);
                              const efficiency = calculateFlavorsheetEfficiency(item);

                              if (status === "DRAFT") {
                                return (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    Draft
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

                        {/* Expanded batch details - Only show if not in draft status */}
                        {expandedRows.has(item.flavorsheet_no) &&
                          getFlavorsheetStatus(item) !== "DRAFT" && (
                            <TableRow key={`${item.flavorsheet_no}-expanded`}>
                              <TableCell colSpan={9} className="px-0 py-0 bg-gray-50">
                                <div className="p-4">
                                  <h3 className="font-medium text-gray-900 mb-3">
                                    Batch Details for {item.flavorsheet_no}
                                  </h3>

                                  {/* Child Table Header */}
                                  <div className="bg-gray-200 border border-gray-300 rounded-t-lg">
                                    <div className="grid grid-cols-6 gap-4 p-3 text-sm font-medium text-gray-900">
                                      <div>Item Code</div>
                                      <div>Mix-In Weight</div>
                                      <div>Mix-Out Weight</div>
                                      <div>Mix-In Time</div>
                                      <div>Mix-Out Time</div>
                                      <div>Status & Efficiency</div>
                                    </div>
                                  </div>

                                  {/* Child Table Body - Using actual batch data */}
                                  <div className="border-x border-b border-gray-300 divide-y divide-gray-200 rounded-b-lg">
                                    {item.batches.map((batch: any) => {
                                      const batchEfficiency = calculateBatchEfficiency(batch);

                                      return (
                                        <div
                                          key={batch.item_code}
                                          className="grid grid-cols-6 gap-4 p-3 text-sm hover:bg-white"
                                        >
                                          <div className="font-medium font-mono text-blue-600">
                                            {batch.item_code}
                                          </div>
                                          <div className="text-blue-600 font-medium">
                                            {formatWeight(batch.mix_in_weight)}
                                          </div>
                                          <div className="text-green-600 font-medium">
                                            {batch.completed
                                              ? formatWeight(batch.mix_out_weight)
                                              : "-"}
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            {batch.mix_in_time}
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            {batch.mix_out_time || "-"}
                                          </div>
                                          <div>
                                            {!batch.completed && (
                                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                                In Progress
                                              </span>
                                            )}
                                            {batch.completed && (
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
                                  </div>
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