import { useState } from "react";
import {
  RefreshCw,
  Search,
  TrendingUp,
  Package2,
  BarChart3,
  Loader2,
  FileDown,
  FileText,
  Scale,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { KpiCard } from "../components/ui/KpiCard";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
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
import { useBlendsheetsPaginated } from "../hooks/useBlendsheet";
import { useQuery } from "@tanstack/react-query";
import { blendsheetService } from "../api/services/blendsheet.service";
import {
  exportToCSV,
  exportToPDF,
  formatDateForExport,
  formatWeightForExport,
  formatPercentageForExport,
  type ExportColumn,
} from "../utils/exportUtils";
import type { BlendsheetData } from "../types/blendsheet";

type TabType = "blendsheets" | "summary" | "blendbalance" | "analytics";

export function BlendsheetOperations() {
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch real API data with server-side pagination
  const {
    data: paginatedResponse,
    error,
    refetch,
  } = useBlendsheetsPaginated({
    page: currentPage,
    limit: itemsPerPage,
    filters: {
      ...(statusFilter && { status: statusFilter }),
      ...(searchTerm && { search: searchTerm }),
    },
  });

  // Fetch blendsheet summary data as primary query
  const {
    data: blendsheetSummary,
    isLoading: isLoadingSummary,
    error: summaryError,
  } = useQuery({
    queryKey: ["blendsheet-summary"],
    queryFn: blendsheetService.getBlendsheetSummary,
    staleTime: 30000,
    refetchInterval: 30000,
  });

  // Mock blendbalance data for the Blend Balance tab
  const mockBlendbalanceData = [
    { transfer_id: "TRF-001", blend_code: "BL-2024-001", weight: 250.5 },
    { transfer_id: "TRF-002", blend_code: "BL-2024-002", weight: 180.0 },
    { transfer_id: "TRF-003", blend_code: "BL-2024-003", weight: 320.75 },
    { transfer_id: "TRF-004", blend_code: "BL-2024-004", weight: 275.25 },
    { transfer_id: "TRF-005", blend_code: "BL-2024-005", weight: 195.8 },
  ];

  const apiData = paginatedResponse?.data || [];
  const pagination = paginatedResponse?.pagination || {
    page: currentPage,
    limit: itemsPerPage,
    total: 0,
    totalPages: 0,
  };

  const statusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" },
    { value: "SHIPPED", label: "Shipped" },
  ];

  // Server-side pagination - no need for client-side filtering
  const displayData = apiData;
  const totalItems = pagination.total;
  const totalPages = pagination.totalPages;

  // Reset to first page when filters change
  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (pageSize: number) => {
    setItemsPerPage(pageSize);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="default">Draft</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="warning">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "SHIPPED":
        return <Badge variant="info">Shipped</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Export functions
  const handleExportBlendsheets = (format: "csv" | "pdf") => {
    const columns: ExportColumn[] = [
      { key: "blendsheet_no", header: "Blendsheet Number" },
      { key: "grade", header: "Grade" },
      { key: "status", header: "Status" },
      { key: "budget_weight", header: "Budget Weight (kg)" },
      { key: "actual_weight", header: "Actual Weight (kg)" },
      { key: "efficiency", header: "Efficiency (%)" },
      { key: "variance", header: "Variance (kg)" },
      { key: "created_ts", header: "Created Date" },
    ];

    const exportData = displayData.map((item: BlendsheetData) => ({
      ...item,
      budget_weight: formatWeightForExport(item.actual_weight || 0),
      actual_weight: formatWeightForExport(item.actual_weight || 0),
      efficiency: formatPercentageForExport(item.efficiency || 0),
      variance: formatWeightForExport(0), // Placeholder since budget_weight is not available
      created_ts: item.created_ts ? formatDateForExport(item.created_ts) : "N/A",
    }));

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

  // Calculate summary stats matching blendsheet-flow page
  const getEffectiveBlendInWeight = (item: any) => {
    const blendIn = parseFloat(item.blend_in_weight) || 0;
    const planned = parseFloat(item.blendsheet_weight) || 0;
    return blendIn > 0 ? blendIn : planned;
  };

  // Use blendsheet summary data for KPIs if available, otherwise use regular data
  const summaryDataForKPIs = blendsheetSummary || [];
  const totalBlendsheets = summaryDataForKPIs.length || totalItems || 0;
  const totalPlanned = summaryDataForKPIs.reduce(
    (sum: number, item: any) => sum + (parseFloat(item.blendsheet_weight) || 0),
    0
  );
  const totalEffectiveBlendIn = summaryDataForKPIs.reduce(
    (sum: number, item: any) => sum + getEffectiveBlendInWeight(item),
    0
  );
  const totalBlendOut = summaryDataForKPIs.reduce(
    (sum: number, item: any) => sum + (parseFloat(item.blend_out_weight) || 0),
    0
  );

  if (isLoadingSummary) {
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

      {/* Summary Cards - Updated to match blendsheet-flow page */}
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
          title="Total Effective Blend In"
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

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by blendsheet code..."
                  value={searchTerm}
                  onChange={(e) => handleFilterChange(setSearchTerm)(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={handleFilterChange(setStatusFilter)}
              placeholder="All Status"
              options={statusOptions}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("summary")}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "summary"
                  ? "border-tea-600 text-tea-600 bg-tea-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Summary ({summaryDataForKPIs.length})
            </button>
            <button
              onClick={() => setActiveTab("blendsheets")}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "blendsheets"
                  ? "border-tea-600 text-tea-600 bg-tea-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Package2 className="h-4 w-4" />
              Blendsheets ({totalItems})
            </button>
            <button
              onClick={() => setActiveTab("blendbalance")}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "blendbalance"
                  ? "border-tea-600 text-tea-600 bg-tea-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Scale className="h-4 w-4" />
              Blend Balance
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === "blendsheets" && (
        <Card>
          <CardHeader>
            <CardTitle>
              Blendsheets ({totalItems} total, showing {(currentPage - 1) * itemsPerPage + 1} - {currentPage * itemsPerPage})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-6 py-3">Blendsheet Code</TableHead>
                      <TableHead className="px-6 py-3">Status</TableHead>
                      <TableHead className="px-6 py-3">Target Weight</TableHead>
                      <TableHead className="px-6 py-3">Progress</TableHead>
                      <TableHead className="px-6 py-3">Efficiency</TableHead>
                      <TableHead className="px-6 py-3">Batches</TableHead>
                      <TableHead className="px-6 py-3">Created</TableHead>
                      <TableHead className="px-6 py-3">Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(displayData) &&
                      displayData.map((item: BlendsheetData) => {
                        if (!item || !item.blendsheet_no) return null;

                        return (
                          <TableRow key={item.blendsheet_no}>
                            <TableCell className="px-6 py-4 font-medium">
                              {item.blendsheet_no}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              {getStatusBadge(item.status || "DRAFT")}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              {formatWeight(item.target_weight)}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-tea-600 h-2 rounded-full"
                                    style={{
                                      width: `${Math.min(100, Math.max(0, item.progress || 0))}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-600">
                                  {formatPercentage(item.progress)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <span
                                className={
                                  (item.efficiency || 0) > 95
                                    ? "text-green-600 font-medium"
                                    : (item.efficiency || 0) > 90
                                    ? "text-amber-600"
                                    : "text-red-600"
                                }
                              >
                                {formatPercentage(item.efficiency)}
                              </span>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              {item.created_batches || 0}/{item.no_of_batches || 0}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-sm text-gray-600">
                              {item.created_date ? formatDate(item.created_date.getTime()) : "-"}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-sm text-gray-600">
                              {item.completed_date ? formatDate(item.completed_date.getTime()) : "-"}
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
      )}

      {/* Summary Tab - Content from blendsheet-flow page */}
      {activeTab === "summary" && (
        <Card>
          <CardHeader>
            <CardTitle>Blendsheet Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingSummary ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
                <span className="ml-2">Loading summary...</span>
              </div>
            ) : summaryError ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-2">Error loading summary data</p>
                <p className="text-sm text-gray-600">{summaryError.message}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6 py-3">Blendsheet No.</TableHead>
                    <TableHead className="px-6 py-3 text-center">Batches</TableHead>
                    <TableHead className="px-6 py-3 text-right">Planned (kg)</TableHead>
                    <TableHead className="px-6 py-3 text-right">Effective Blend In (kg)</TableHead>
                    <TableHead className="px-6 py-3 text-right">Blend Out (kg)</TableHead>
                    <TableHead className="px-6 py-3 text-center">Efficiency</TableHead>
                    <TableHead className="px-6 py-3 text-center">Blend In Time</TableHead>
                    <TableHead className="px-6 py-3 text-center">Blend Out Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blendsheetSummary && blendsheetSummary.length > 0 ? (
                    blendsheetSummary.map((item: any) => {
                      const planned = parseFloat(item.blendsheet_weight) || 0;
                      const effectiveBlendIn = getEffectiveBlendInWeight(item);
                      const blendOut = parseFloat(item.blend_out_weight) || 0;
                      const efficiency =
                        effectiveBlendIn > 0 && blendOut > 0
                          ? ((blendOut / effectiveBlendIn) * 100).toFixed(1)
                          : "0.0";

                      const formatTimestamp = (timestamp: string) => {
                        if (!timestamp || timestamp === "0") return "-";
                        try {
                          const date = new Date(parseInt(timestamp));
                          return date.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          });
                        } catch (error) {
                          return "-";
                        }
                      };

                      return (
                        <TableRow key={item.blendsheet_no}>
                          <TableCell className="px-6 py-4 font-medium">
                            {item.blendsheet_no}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            {item.number_of_batches}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            {planned.toLocaleString()}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            {effectiveBlendIn.toLocaleString()}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            {blendOut > 0 ? (
                              blendOut.toLocaleString()
                            ) : (
                              <span className="text-gray-400">- pending -</span>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <span
                              className={
                                parseFloat(efficiency) > 95
                                  ? "text-green-600 font-medium"
                                  : parseFloat(efficiency) > 90
                                  ? "text-amber-600"
                                  : parseFloat(efficiency) > 0
                                  ? "text-red-600"
                                  : "text-gray-400"
                              }
                            >
                              {parseFloat(efficiency) > 0 ? `${efficiency}%` : "-"}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center text-sm">
                            {formatTimestamp(item.blend_in_timestamp)}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center text-sm">
                            {formatTimestamp(item.blend_out_timestamp)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No summary data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Blend Balance Tab */}
      {activeTab === "blendbalance" && (
        <Card>
          <CardHeader>
            <CardTitle>Blend Balance Operations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-3">Transfer ID</TableHead>
                  <TableHead className="px-6 py-3">Blend Code</TableHead>
                  <TableHead className="px-6 py-3">Weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockBlendbalanceData.map((item) => (
                  <TableRow key={item.transfer_id}>
                    <TableCell className="px-6 py-4 font-medium">{item.transfer_id}</TableCell>
                    <TableCell className="px-6 py-4">{item.blend_code}</TableCell>
                    <TableCell className="px-6 py-4">{item.weight.toFixed(2)} kg</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
