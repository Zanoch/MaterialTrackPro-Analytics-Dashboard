// Dev version of TealineInventory that uses mock data
// This is a duplicate page for dev panel testing only

import { useState, useEffect } from "react";
import {
  RefreshCw,
  Search,
  Package,
  MapPin,
  Loader2,
  FileDown,
  FileText,
  AlertTriangle,
  TrendingUp,
  BarChart2,
  FileSpreadsheet,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { useDevTealineInventoryComplete } from "../hooks/useDevMockData";
import {
  exportToCSV,
  exportToPDF,
  formatDateForExport,
  formatWeightForExport,
  type ExportColumn,
} from "../utils/exportUtils";
import type { TealineInventoryComplete } from "../types/tealine";

export function DevTealineInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TealineInventoryComplete | null>(null);
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "location" | "analytics">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const queryParams = {
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    ...(searchQuery && { search: searchQuery }),
  };

  // Use mock data hook directly
  const {
    data: inventoryResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useDevTealineInventoryComplete(queryParams);

  useEffect(() => {
    if (isUserInteracting && !isFetching) {
      setIsUserInteracting(false);
    }
  }, [isFetching, isUserInteracting]);

  const hasExistingData = !!inventoryResponse;
  const isInitialLoading = isLoading && !hasExistingData;
  const isInteractionLoading = isUserInteracting && isFetching && hasExistingData;

  interface BagDetailsProps {
    item: TealineInventoryComplete;
    isOpen: boolean;
    onClose: () => void;
  }

  function BagDetailsSidebar({ item, isOpen, onClose }: BagDetailsProps) {
    if (!isOpen) return null;

    return (
      <Card className="w-[420px] min-w-[420px] flex-shrink-0 sticky top-20 h-[calc(100vh-6rem)] flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-tea-700">Bag Details</CardTitle>
              <p className="text-sm text-gray-600 font-mono">{item.item_code}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-2">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide">
              Item Information
            </h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Broker:</span>
                <span className="font-medium text-right text-xs">{item.broker}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Garden:</span>
                <span className="font-medium">{item.garden}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Grade:</span>
                <Badge variant="default" className="text-xs">
                  {item.grade}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Primary Location:</span>
                <Badge variant="default" className="text-xs whitespace-nowrap">
                  {item.bag_details?.length
                    ? Object.entries(
                        item.bag_details.reduce((acc: { [key: string]: number }, bag) => {
                          acc[bag.location] = (acc[bag.location] || 0) + 1;
                          return acc;
                        }, {})
                      ).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"
                    : "N/A"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-tea-50 rounded-lg text-center">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Total Bags</p>
              <p className="text-xl font-bold text-tea-700">{item.total_bags_received}</p>
            </div>
            <div className="p-3 bg-tea-50 rounded-lg text-center">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Total Weight</p>
              <p className="text-xl font-bold text-tea-700">{item.total_net_weight} kg</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide">
              Receiving Duration
            </h4>
            <div className="p-3 bg-tea-50 rounded-lg">
              {(() => {
                const bagTimestamps = item.bag_details
                  ? item.bag_details.map((bag: any) => new Date(bag.received_timestamp).getTime())
                  : [];

                let durationDisplay = "N/A";
                let avgDelayDisplay = "N/A";

                if (bagTimestamps.length > 0) {
                  const sortedTimestamps = bagTimestamps.sort((a: number, b: number) => a - b);
                  const firstTimestamp = sortedTimestamps[0];
                  const lastTimestamp = sortedTimestamps[sortedTimestamps.length - 1];
                  const durationMs = lastTimestamp - firstTimestamp;
                  const durationHours = durationMs / (1000 * 60 * 60);
                  const durationMinutes = durationMs / (1000 * 60);

                  if (durationMs === 0) {
                    durationDisplay = "Same time";
                  } else if (durationHours < 1) {
                    durationDisplay = `${Math.ceil(durationMinutes)} min`;
                  } else if (durationHours < 24) {
                    const hours = Math.floor(durationHours);
                    const remainingMinutes = Math.ceil(durationMinutes - hours * 60);
                    durationDisplay =
                      remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
                  } else {
                    const days = Math.floor(durationHours / 24);
                    const remainingHours = Math.floor(durationHours - days * 24);
                    durationDisplay =
                      remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
                  }

                  const totalBags = Math.max(bagTimestamps.length - 1, 1);
                  const avgDelayMinutes = durationMinutes / totalBags;
                  if (avgDelayMinutes < 1) {
                    avgDelayDisplay = "<1 min/bag";
                  } else if (avgDelayMinutes < 60) {
                    avgDelayDisplay = `~${Math.ceil(avgDelayMinutes)} min/bag`;
                  } else {
                    const avgDelayHours = avgDelayMinutes / 60;
                    avgDelayDisplay = `~${avgDelayHours.toFixed(1)}h/bag`;
                  }
                }

                return (
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Duration:</span>
                      <span className="font-semibold text-tea-700">{durationDisplay}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Avg. per Bag:</span>
                      <span className="font-medium text-gray-700">{avgDelayDisplay}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide">
              Individual Bags ({item.bag_details?.length || 0})
            </h4>
            <div className="space-y-2">
              {item.bag_details && item.bag_details.length > 0 ? (
                item.bag_details.map((bag) => (
                  <div
                    key={bag.bag_id}
                    className="p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs font-medium text-tea-700">
                        {bag.bag_id}
                      </span>
                      <Badge variant="default" className="text-xs whitespace-nowrap flex-shrink-0">
                        {bag.location}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Net Weight:</span>
                        <span className="font-medium">{bag.net_weight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Received:</span>
                        <span className="font-medium">
                          {new Date(bag.received_timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Detailed bag information not available</p>
                  <p className="text-xs mt-1">Contact administrator to enable bag tracking</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const inventoryData = inventoryResponse?.data || [];
  const metaData = inventoryResponse?.meta || {
    total_items: 0,
    current_page_items: 0,
    total_inventory_weight: 0,
    total_available_weight: 0,
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

  const computedTotals = {
    inventory_weight: inventoryData.reduce(
      (sum, item) => sum + Number(item.total_net_weight || 0),
      0
    ),
    available_weight: inventoryData.reduce(
      (sum, item) => sum + Number(item.remaining_weight || 0),
      0
    ),
  };

  const displayTotals = {
    total_inventory_weight: metaData.total_inventory_weight || computedTotals.inventory_weight,
    total_available_weight: metaData.total_available_weight || computedTotals.available_weight,
  };

  const handleSearch = () => {
    setIsUserInteracting(true);
    setSearchQuery(searchTerm.trim());
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setIsUserInteracting(true);
    setSearchTerm("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setIsUserInteracting(true);
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setIsUserInteracting(true);
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  const totalItems = metaData.pagination?.total_count || 0;
  const totalPages = metaData.pagination?.total_pages || 1;
  const paginatedData = inventoryData;

  const handleExportInventory = (format: "csv" | "pdf") => {
    const columns: ExportColumn[] = [
      { key: "item_code", header: "Item Code" },
      { key: "broker", header: "Broker" },
      { key: "garden", header: "Garden" },
      { key: "grade", header: "Grade" },
      { key: "total_bags_received", header: "Total Bags" },
      { key: "total_net_weight", header: "Total Weight (kg)" },
      { key: "remaining_weight", header: "Remaining Weight (kg)" },
      { key: "first_received_date", header: "First Received" },
      { key: "last_received_date", header: "Last Received" },
      { key: "last_updated", header: "Last Updated" },
    ];

    const exportData = inventoryData.map((item) => ({
      ...item,
      first_received_date: formatDateForExport(new Date(item.first_received_date)),
      last_received_date: formatDateForExport(new Date(item.last_received_date)),
      last_updated: formatDateForExport(new Date(item.last_updated)),
      total_net_weight: formatWeightForExport(item.total_net_weight),
      remaining_weight: formatWeightForExport(item.remaining_weight),
    }));

    const filename = `tealine_inventory_${new Date().toISOString().split("T")[0]}`;

    if (format === "csv") {
      exportToCSV(exportData, filename, columns);
    } else {
      exportToPDF(
        exportData,
        filename,
        columns,
        "Tealine Inventory Report",
        `Generated on ${new Date().toLocaleDateString()} • Total Items: ${paginatedData.length}`
      );
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-tea-600 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-900">Loading Inventory Data</p>
          <p className="text-sm text-gray-500">
            Please wait while we fetch the latest inventory...
          </p>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#237c4b" }}>
            Tealine Inventory - Seeduwa
          </h2>
          <p className="text-gray-600">
            Tea Stock Management • Last Sync: {new Date().toLocaleTimeString()}
          </p>
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
              onClick={() => handleExportInventory("csv")}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => handleExportInventory("pdf")}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-tea-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-tea-100 p-3">
                <Package className="h-6 w-6 text-tea-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-tea-700 uppercase">Total Tea Items</p>
                <p className="text-2xl font-bold text-tea-600">
                  {metaData.total_items.toLocaleString()}
                </p>
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
                <p className="text-2xl font-bold text-tea-600">
                  {displayTotals.total_inventory_weight.toFixed(0).toLocaleString()} kg
                </p>
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
                <p className="text-2xl font-bold text-tea-600">
                  {displayTotals.total_available_weight.toFixed(0).toLocaleString()} kg
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {displayTotals.total_inventory_weight > 0
                    ? (
                        (displayTotals.total_available_weight /
                          displayTotals.total_inventory_weight) *
                        100
                      ).toFixed(1)
                    : "0.0"}
                  % of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-tea-50">
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search item code, broker, garden..."
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

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    viewMode === "table"
                      ? "bg-tea-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4 inline mr-1" />
                  Table View
                </button>
                <button
                  onClick={() => setViewMode("location")}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    viewMode === "location"
                      ? "bg-tea-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location View
                </button>
                <button
                  onClick={() => setViewMode("analytics")}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    viewMode === "analytics"
                      ? "bg-tea-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <BarChart2 className="h-4 w-4 inline mr-1" />
                  Analytics View
                </button>
              </div>

              <div className="text-sm text-gray-600">
                🔍 Showing {paginatedData.length} of {metaData.pagination.total_count} items
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === "table" && (
        <div className="flex gap-6 items-start relative">
          {isInteractionLoading ? (
            <Card className={`${detailsPanelOpen ? "flex-1" : "w-full"}`}>
              <CardContent className="flex items-center justify-center py-24">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-tea-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Updating results...</p>
                  <p className="text-xs text-gray-500">Filtering inventory data</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className={`${detailsPanelOpen ? "flex-1" : "w-full"}`}>
              <CardHeader>
                <CardTitle>
                  Inventory Items ({totalItems} items, showing {paginatedData.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-6 py-3">Last Received</TableHead>
                        <TableHead className="px-6 py-3">Item Code</TableHead>
                        <TableHead className="px-6 py-3">No of bags</TableHead>
                        <TableHead className="px-6 py-3">Weight</TableHead>
                        <TableHead className="px-6 py-3">Receiving Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((item) => {
                        const bagTimestamps = item.bag_details
                          ? item.bag_details.map((bag: any) =>
                              new Date(bag.received_timestamp).getTime()
                            )
                          : [];

                        let durationDisplay = "N/A";
                        let avgDelayDisplay = "N/A";

                        if (bagTimestamps.length > 0) {
                          const firstTimestamp = Math.min(...bagTimestamps);
                          const lastTimestamp = Math.max(...bagTimestamps);
                          const durationSeconds = (lastTimestamp - firstTimestamp) / 1000;
                          const durationMinutes = durationSeconds / 60;
                          const durationHours = durationSeconds / 3600;

                          if (durationSeconds === 0) {
                            durationDisplay = "Same time";
                          } else if (durationHours < 1) {
                            durationDisplay = `${Math.ceil(durationMinutes)} min`;
                          } else if (durationHours < 24) {
                            const hours = Math.floor(durationHours);
                            const remainingMinutes = Math.ceil(durationMinutes - hours * 60);
                            durationDisplay =
                              remainingMinutes > 0
                                ? `${hours}h ${remainingMinutes}min`
                                : `${hours}h`;
                          } else {
                            const days = Math.floor(durationHours / 24);
                            const remainingHours = Math.ceil(durationHours - days * 24);
                            durationDisplay =
                              remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
                          }

                          const totalBags = Math.max(bagTimestamps.length - 1, 1);
                          const avgDelaySeconds = durationSeconds / totalBags;
                          if (avgDelaySeconds < 60) {
                            avgDelayDisplay = `~${Math.ceil(avgDelaySeconds)}s/bag`;
                          } else if (avgDelaySeconds < 3600) {
                            avgDelayDisplay = `~${Math.ceil(avgDelaySeconds / 60)} min/bag`;
                          } else {
                            avgDelayDisplay = `~${(avgDelaySeconds / 3600).toFixed(1)}h/bag`;
                          }
                        }

                        return (
                          <TableRow key={item.item_code}>
                            <TableCell className="px-6 py-4">
                              <div className="text-sm">
                                {new Date(item.last_received_date).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div>
                                <button
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setDetailsPanelOpen(true);
                                  }}
                                  className="font-medium text-tea-700 hover:text-tea-800 hover:underline cursor-pointer"
                                >
                                  {item.item_code}
                                </button>
                                <div className="text-sm text-gray-500">
                                  {item.broker} • {item.garden}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div className="text-sm font-medium">{item.total_bags_received}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div className="text-sm font-medium">
                                {Number(item.total_net_weight || 0).toFixed(0)} kg
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium">{durationDisplay}</div>
                                <div className="text-xs text-gray-500">{avgDelayDisplay} avg</div>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

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

          {!isInteractionLoading && selectedItem && detailsPanelOpen && (
            <BagDetailsSidebar
              item={selectedItem}
              isOpen={detailsPanelOpen}
              onClose={() => {
                setDetailsPanelOpen(false);
                setSelectedItem(null);
              }}
            />
          )}
        </div>
      )}

      {viewMode === "location" && (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Location View</p>
            <p className="text-sm text-gray-600">
              Location-based inventory visualization coming soon
            </p>
          </CardContent>
        </Card>
      )}

      {viewMode === "analytics" && (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Analytics View</p>
            <p className="text-sm text-gray-600">
              Weight distribution and allocation analytics coming soon
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
