import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  Download,
  Grid,
  List,
  Loader2,
  Scale,
  AlertTriangle,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { KpiCard } from "../components/ui/KpiCard";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Loading } from "../components/ui/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import {
  useBlendbalanceDashboard,
  useBlendbalanceSearch,
  useBlendbalances,
  useBlendbalanceFilterOptions,
  useQualityCheckQueue,
  useBlendbalanceStatistics,
} from "../hooks/useBlendbalance";
import type {
  BlendbalanceItem,
  BlendbalanceSearchFilters,
  BlendbalanceDashboardMetrics,
  BlendbalanceSearchResponse,
  SearchContext,
  TransferType,
  BlendbalanceStatus,
} from "../types/blendbalance";
import {
  TRANSFER_TYPES,
  BLENDBALANCE_STATUS_LABELS,
  COMPLETION_STATUS_LABELS,
} from "../types/blendbalance";

export function BlendbalanceOperations() {
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [searchContext, setSearchContext] = useState<SearchContext>("admin");
  const [filters, setFilters] = useState<BlendbalanceSearchFilters>({});
  const [selectedTransfer, setSelectedTransfer] = useState<BlendbalanceItem | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "transfers">("table");

  // Hooks
  const { data: dashboardData, isLoading: dashboardLoading } = useBlendbalanceDashboard() as {
    data: BlendbalanceDashboardMetrics | undefined;
    isLoading: boolean;
  };
  const { data: searchResults, isLoading: searchLoading } = useBlendbalanceSearch(
    searchTerm,
    searchContext,
    filters,
    searchTerm.length >= 2
  ) as { data: BlendbalanceSearchResponse | undefined; isLoading: boolean };

  // Fallback to get all blendbalances when no search term
  const { data: allBlendbalances, isLoading: allLoading } = useBlendbalances(
    filters,
    searchTerm.length < 2
  ) as { data: BlendbalanceItem[] | undefined; isLoading: boolean };
  const { data: filterOptions } = useBlendbalanceFilterOptions() as {
    data: { blendCodes: string[]; transferIds: string[] } | undefined;
  };
  const { data: qualityQueue } = useQualityCheckQueue() as { data: BlendbalanceItem[] | undefined };

  // Computed values
  const blendbalances = useMemo(() => {
    // Use search results if searching, otherwise use all blendbalances
    const data = searchTerm.length >= 2 ? searchResults?.data : allBlendbalances;
    console.log("⚖️ Search Term Length:", searchTerm.length);
    console.log("⚖️ Using Search Results:", searchTerm.length >= 2);
    console.log("⚖️ Search Results:", searchResults);
    console.log("⚖️ All Blendbalances:", allBlendbalances);
    console.log("⚖️ Final Data:", data);
    return data || [];
  }, [searchResults, allBlendbalances, searchTerm]);

  const searchResultsMeta = useMemo(() => {
    const meta = searchTerm.length >= 2 ? searchResults?.meta : null;
    console.log("📊 Search Meta:", meta);
    return (
      meta || {
        total_results: blendbalances.length,
        search_time: 0,
        search_term: searchTerm,
      }
    );
  }, [searchResults, blendbalances.length, searchTerm]);

  // Current loading state
  const isCurrentlyLoading = searchTerm.length >= 2 ? searchLoading : allLoading;

  // Get statistics for current blendbalances
  const statistics = useBlendbalanceStatistics(blendbalances);

  // Debug logging
  console.log("🎯 Dashboard Data:", dashboardData);
  console.log("🔍 Search Loading:", searchLoading);
  console.log("🔍 All Loading:", allLoading);
  console.log("🔍 Currently Loading:", isCurrentlyLoading);
  console.log("🔍 Search Term:", searchTerm);
  console.log("🔍 Search Context:", searchContext);
  console.log("🔍 Filters:", filters);
  console.log("📦 Blendbalances Array:", blendbalances);
  console.log("📏 Blendbalances Length:", blendbalances.length);

  // Event handlers
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleContextChange = (context: SearchContext) => {
    setSearchContext(context);
  };

  const handleTransferSelect = (transfer: BlendbalanceItem) => {
    setSelectedTransfer(transfer);
  };

  const handleCreateTransfer = async () => {
    // TODO: Open create transfer modal
    console.log("Create new transfer");
  };

  const handleStartTransfer = async (transfer: BlendbalanceItem) => {
    // TODO: Implement start transfer functionality
    console.log("Start transfer:", transfer.transfer_id);
  };

  const handleCompleteTransfer = async (transfer: BlendbalanceItem) => {
    // TODO: Implement complete transfer functionality
    console.log("Complete transfer:", transfer.transfer_id);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export blendbalance data");
  };

  // Loading state
  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
        <span className="ml-2 text-lg">Loading blendbalance dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-tea-600">⚖️ Blendbalance Operations Dashboard</h1>
          <p className="text-gray-600">
            Blend Balance Transfers & Weight Distribution • Total Transfers:{" "}
            {dashboardData?.total_transfers || 0} • Transferred:{" "}
            {dashboardData?.total_weight_transferred?.toFixed(1) || 0}kg
          </p>
        </div>
          
        {/* Global Search */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search transfers by ID, blend code, or item..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-96"
            />
          </div>

          {/* Quick Actions */}
          <button
            onClick={handleCreateTransfer}
            className="flex items-center space-x-2 bg-tea-600 hover:bg-tea-700 px-4 py-2 rounded-md transition-colors text-white"
          >
            <Plus className="h-4 w-4" />
            <span>New Transfer</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 bg-tea-600 hover:bg-tea-700 px-4 py-2 rounded-md transition-colors text-white"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          title="Total Transfers"
          value={dashboardData?.total_transfers || statistics.totalTransfers}
          icon={Scale}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
          trend="up"
          trendValue="active now"
        />

        <KpiCard
          title="Weight Transferred"
          value={`${(
            dashboardData?.total_weight_transferred || statistics.transferredWeight
          ).toFixed(1)}kg`}
          icon={TrendingUp}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          subtitle={`${(
            dashboardData?.average_transfer_weight || statistics.averageTransferWeight
          ).toFixed(1)}kg avg per transfer`}
        />

        <KpiCard
          title="Transfer Efficiency"
          value={`${(dashboardData?.transfer_efficiency || statistics.transferEfficiency).toFixed(
            1
          )}%`}
          icon={BarChart3}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          trend="up"
          trendValue="avg completion"
        />

        <KpiCard
          title="Quality Checks"
          value={dashboardData?.pending_quality_checks || qualityQueue?.length || 0}
          icon={AlertTriangle}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
          subtitle="Pending quality approval"
        />
      </div>

      {/* Search & Filter Interface */}
      <Card className="p-6 bg-tea-50">
        <div className="space-y-4">
          {/* Search Context Tabs */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleContextChange("admin")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                searchContext === "admin"
                  ? "bg-tea-500 text-white"
                  : "bg-white text-tea-600 hover:bg-tea-100"
              }`}
            >
              🔍 All Transfers
            </button>
            <button
              onClick={() => handleContextChange("user")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                searchContext === "user"
                  ? "bg-tea-500 text-white"
                  : "bg-white text-tea-600 hover:bg-tea-100"
              }`}
            >
              📦 Available
            </button>
            <button
              onClick={() => handleContextChange("transfer")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                searchContext === "transfer"
                  ? "bg-tea-500 text-white"
                  : "bg-white text-tea-600 hover:bg-tea-100"
              }`}
            >
              🔄 Active Transfers
            </button>
            <button
              onClick={() => handleContextChange("quality")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                searchContext === "quality"
                  ? "bg-tea-500 text-white"
                  : "bg-white text-tea-600 hover:bg-tea-100"
              }`}
            >
              🎯 Quality Queue
            </button>
          </div>

          {/* Quick Transfer Type Filters */}
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">Quick Filters:</span>
            {["BLEND_TO_BLEND", "BATCH_TO_BATCH", "QUALITY_UPGRADE", "WEIGHT_BALANCE"].map(
              (type) => (
                <button
                  key={type}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      transfer_type:
                        prev.transfer_type === type ? undefined : (type as TransferType),
                    }))
                  }
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filters.transfer_type === type
                      ? "bg-tea-500 text-white"
                      : "bg-tea-100 text-tea-700 hover:bg-tea-200"
                  }`}
                >
                  {TRANSFER_TYPES[type as TransferType]?.icon}{" "}
                  {TRANSFER_TYPES[type as TransferType]?.label}
                </button>
              )
            )}
          </div>

          {/* Filter Row */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select
                value={filters.blend_code || ""}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, blend_code: value }))}
                placeholder="Blend Code"
                options={
                  filterOptions?.blendCodes.map((code: any) => ({ value: code, label: code })) || []
                }
              />
            </div>
            <div className="flex-1">
              <Select
                value={filters.transfer_id || ""}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, transfer_id: value }))}
                placeholder="Transfer ID"
                options={
                  filterOptions?.transferIds.map((id: any) => ({ value: id, label: id })) || []
                }
              />
            </div>
            <div className="flex-1">
              <Select
                value={filters.status || ""}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value as BlendbalanceStatus }))
                }
                placeholder="Status"
                options={Object.entries(BLENDBALANCE_STATUS_LABELS).map(([key, info]) => ({
                  value: key,
                  label: `${info.icon} ${info.label}`,
                }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode(viewMode === "table" ? "transfers" : "table")}
                className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
              >
                {viewMode === "table" ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </button>
              <button
                onClick={handleExport}
                className="p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search Results Info */}
          {searchTerm.length >= 2 && (
            <div className="text-sm text-tea-700">
              🎯 Found {searchResultsMeta.total_results} results for "{searchTerm}" • Search time:{" "}
              {searchResultsMeta.search_time?.toFixed(1) || 0}s
            </div>
          )}

          {/* Debug Info - Remove after testing */}
          {import.meta.env.MODE === "development" && (
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
              Debug: Search={searchTerm.length >= 2 ? "YES" : "NO"} | Loading=
              {isCurrentlyLoading ? "YES" : "NO"} | Items={blendbalances.length} | SearchData=
              {searchResults?.data?.length || 0} | AllData={allBlendbalances?.length || 0}
            </div>
          )}
        </div>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Operations (Left Panel - 2/3) */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {viewMode === "table" ? "Transfer Operations" : "Transfer Tracking"} (
                  {blendbalances.length} transfers)
                </h2>
                <div className="flex items-center space-x-2">
                  <Badge variant={viewMode === "table" ? "default" : "info"}>
                    {viewMode === "table" ? "Table" : "Tracking"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-6">
              {isCurrentlyLoading ? (
                <Loading className="flex justify-center py-8" />
              ) : blendbalances.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm.length >= 2
                    ? "No transfers found for your search."
                    : "No transfers available."}
                </div>
              ) : viewMode === "table" ? (
                /* Table View */
                <BlendbalanceTable
                  blendbalances={blendbalances}
                  onTransferSelect={handleTransferSelect}
                  onStartTransfer={handleStartTransfer}
                  onCompleteTransfer={handleCompleteTransfer}
                />
              ) : (
                /* Transfer Tracking View */
                <TransferTrackingView
                  blendbalances={blendbalances}
                  onTransferSelect={handleTransferSelect}
                />
              )}
            </div>
          </Card>
        </div>

        {/* Transfer Details Panel (Right Panel - 1/3) */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedTransfer ? "Transfer Details" : "Select Transfer"}
                </h2>
                {selectedTransfer && (
                  <button
                    onClick={() => setSelectedTransfer(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {selectedTransfer ? (
                <TransferDetailsPanel transfer={selectedTransfer} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Scale className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>
                    Select a transfer to view detailed information, weight distribution, and quality
                    status.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Blendbalance Table Component
interface BlendbalanceTableProps {
  blendbalances: BlendbalanceItem[];
  onTransferSelect: (transfer: BlendbalanceItem) => void;
  onStartTransfer: (transfer: BlendbalanceItem) => void;
  onCompleteTransfer: (transfer: BlendbalanceItem) => void;
}

function BlendbalanceTable({
  blendbalances,
  onTransferSelect,
  onStartTransfer,
  onCompleteTransfer,
}: BlendbalanceTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transfer ID</TableHead>
            <TableHead>Blend Code</TableHead>
            <TableHead>Weight</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Efficiency</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {blendbalances.map((transfer) => (
            <BlendbalanceTableRow
              key={transfer.id}
              transfer={transfer}
              onClick={() => onTransferSelect(transfer)}
              onStartTransfer={() => onStartTransfer(transfer)}
              onCompleteTransfer={() => onCompleteTransfer(transfer)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Blendbalance Table Row Component
function BlendbalanceTableRow({
  transfer,
  onClick,
  onStartTransfer,
  onCompleteTransfer,
}: {
  transfer: BlendbalanceItem;
  onClick: () => void;
  onStartTransfer: () => void;
  onCompleteTransfer: () => void;
}) {
  const statusInfo = BLENDBALANCE_STATUS_LABELS[transfer.status || "PENDING"];
  const transferTypeInfo = TRANSFER_TYPES[transfer.transfer_type || "BLEND_TO_BLEND"];
  const completionInfo = COMPLETION_STATUS_LABELS[transfer.completion_status || "NOT_STARTED"];

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium text-tea-600">
        <div className="cursor-pointer" onClick={onClick}>
          {transfer.transfer_id}
        </div>
      </TableCell>
      <TableCell className="text-gray-900">
        <div>{transfer.blend_code}</div>
        <div className="text-xs text-gray-500">Item: {transfer.item_code}</div>
      </TableCell>
      <TableCell className="text-gray-600">
        <div>{(Number(transfer.weight) || 0).toFixed(1)}kg</div>
        {transfer.transferred_weight && (
          <div className="text-xs text-gray-500">
            {(Number(transfer.transferred_weight) || 0).toFixed(1)}kg transferred
          </div>
        )}
      </TableCell>
      <TableCell>
        <Badge
          variant="default"
          className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}
        >
          {statusInfo.icon} {statusInfo.label}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-1">
          <span>{transferTypeInfo.icon}</span>
          <span className="text-xs">{transferTypeInfo.label}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-tea-500 h-2 rounded-full"
              style={{ width: `${transfer.completion_percentage || 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">
            {(transfer.completion_percentage || 0).toFixed(0)}%
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {completionInfo.icon} {completionInfo.label}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm font-medium">{(transfer.transfer_efficiency || 0).toFixed(1)}%</div>
        <div className="text-xs text-gray-500">{transfer.age_days || 0}d old</div>
      </TableCell>
      <TableCell>
        <div className="flex space-x-1">
          {transfer.status === "PENDING" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartTransfer();
              }}
              className="bg-tea-500 text-white px-2 py-1 rounded text-xs hover:bg-tea-600 transition-colors"
            >
              Start
            </button>
          )}
          {transfer.status === "IN_PROGRESS" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCompleteTransfer();
              }}
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
            >
              Complete
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// Transfer Tracking View Component
function TransferTrackingView({
  blendbalances,
  onTransferSelect,
}: {
  blendbalances: BlendbalanceItem[];
  onTransferSelect: (transfer: BlendbalanceItem) => void;
}) {
  const groupedTransfers = useMemo(() => {
    const groups = {} as Record<string, BlendbalanceItem[]>;
    blendbalances.forEach((transfer) => {
      const status = transfer.status || "PENDING";
      if (!groups[status]) groups[status] = [];
      groups[status].push(transfer);
    });
    return groups;
  }, [blendbalances]);

  return (
    <div className="space-y-6">
      {Object.entries(groupedTransfers).map(([status, transfers]) => {
        const statusInfo = BLENDBALANCE_STATUS_LABELS[status as BlendbalanceStatus];
        const totalWeight = transfers.reduce((sum, t) => sum + t.weight, 0);

        return (
          <div key={status} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <span className="text-xl">{statusInfo.icon}</span>
                <span>{statusInfo.label}</span>
                <Badge variant="default">({transfers.length})</Badge>
              </h3>
              <div className="text-sm text-gray-600">Total: {totalWeight.toFixed(1)}kg</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {transfers.map((transfer) => (
                <TransferTrackingCard
                  key={transfer.id}
                  transfer={transfer}
                  onClick={() => onTransferSelect(transfer)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Transfer Tracking Card Component
function TransferTrackingCard({
  transfer,
  onClick,
}: {
  transfer: BlendbalanceItem;
  onClick: () => void;
}) {
  const transferTypeInfo = TRANSFER_TYPES[transfer.transfer_type || "BLEND_TO_BLEND"];

  return (
    <div
      className="border border-gray-200 rounded-md p-3 hover:border-tea-400 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate text-sm">{transfer.transfer_id}</h4>
          <p className="text-xs text-gray-600">
            {transfer.blend_code} → {transfer.target_blend || "Processing"}
          </p>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Weight:</span>
          <span className="font-medium">{transfer.weight.toFixed(1)}kg</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Type:</span>
          <Badge
            variant="default"
            className={`text-xs border-${transferTypeInfo.color}-200 text-${transferTypeInfo.color}-700`}
          >
            {transferTypeInfo.icon} {transferTypeInfo.label}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Progress:</span>
          <span>{(transfer.completion_percentage || 0).toFixed(0)}%</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Efficiency:</span>
          <span>{(transfer.transfer_efficiency || 0).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

// Transfer Details Panel Component
function TransferDetailsPanel({ transfer }: { transfer: BlendbalanceItem }) {
  const statusInfo = BLENDBALANCE_STATUS_LABELS[transfer.status || "PENDING"];
  const transferTypeInfo = TRANSFER_TYPES[transfer.transfer_type || "BLEND_TO_BLEND"];
  const completionInfo = COMPLETION_STATUS_LABELS[transfer.completion_status || "NOT_STARTED"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xl">{transferTypeInfo.icon}</span>
          <h3 className="text-lg font-semibold text-gray-900">{transfer.transfer_id}</h3>
        </div>
        <p className="text-sm text-gray-600">Blend Code: {transfer.blend_code}</p>
        <p className="text-sm text-gray-600">Item Code: {transfer.item_code}</p>
      </div>

      {/* Weight Distribution */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">⚖️ Weight Distribution</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Weight:</span>
            <span className="font-medium">{transfer.weight.toFixed(1)} kg</span>
          </div>
          {transfer.transferred_weight && (
            <div className="flex justify-between">
              <span className="text-gray-600">Transferred:</span>
              <span className="font-medium text-green-600">
                {transfer.transferred_weight.toFixed(1)} kg
              </span>
            </div>
          )}
          {transfer.remaining_weight && (
            <div className="flex justify-between">
              <span className="text-gray-600">Remaining:</span>
              <span className="font-medium text-orange-600">
                {transfer.remaining_weight.toFixed(1)} kg
              </span>
            </div>
          )}
          {transfer.weight_distribution && (
            <div className="flex justify-between">
              <span className="text-gray-600">Loss:</span>
              <span className="font-medium text-red-600">
                {transfer.weight_distribution.loss_percentage.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Information */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">🔄 Transfer Information</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <Badge
              variant="default"
              className={`border-${transferTypeInfo.color}-200 text-${transferTypeInfo.color}-700`}
            >
              {transferTypeInfo.icon} {transferTypeInfo.label}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <Badge
              variant="default"
              className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}
            >
              {statusInfo.icon} {statusInfo.label}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Completion:</span>
            <Badge
              variant="default"
              className={`border-${completionInfo.color}-200 text-${completionInfo.color}-700`}
            >
              {completionInfo.icon} {completionInfo.label}
            </Badge>
          </div>
          {transfer.source_blend && (
            <div className="flex justify-between">
              <span className="text-gray-600">Source:</span>
              <span className="font-medium">{transfer.source_blend}</span>
            </div>
          )}
          {transfer.target_blend && (
            <div className="flex justify-between">
              <span className="text-gray-600">Target:</span>
              <span className="font-medium">{transfer.target_blend}</span>
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">📊 Performance Metrics</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Progress:</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-tea-500 h-2 rounded-full"
                  style={{ width: `${transfer.completion_percentage || 0}%` }}
                />
              </div>
              <span className="font-medium">
                {(transfer.completion_percentage || 0).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Efficiency:</span>
            <span className="font-medium">{(transfer.transfer_efficiency || 0).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Age:</span>
            <span className="font-medium">{transfer.age_days || 0} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span className="font-medium">
              {new Date(transfer.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Quality Information */}
      {transfer.quality_check && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">🎯 Quality Check</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge
                variant={
                  transfer.quality_check.approval_status === "APPROVED" ? "default" : "warning"
                }
                className={
                  transfer.quality_check.approval_status === "APPROVED"
                    ? "bg-green-100 text-green-800"
                    : transfer.quality_check.approval_status === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }
              >
                {transfer.quality_check.approval_status}
              </Badge>
            </div>
            {transfer.quality_check.performed_by && (
              <div className="flex justify-between">
                <span className="text-gray-600">Checked by:</span>
                <span className="font-medium">{transfer.quality_check.performed_by}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 border-t">
        <div className="flex space-x-2">
          <button className="flex-1 bg-tea-500 text-white px-3 py-2 rounded text-sm hover:bg-tea-600 transition-colors">
            Update Status
          </button>
          <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 transition-colors">
            Edit Transfer
          </button>
        </div>
        <button className="w-full mt-2 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition-colors">
          View History
        </button>
      </div>
    </div>
  );
}
