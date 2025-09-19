import { useState, useEffect, useRef } from "react";
import React from "react";
import {
  RefreshCw,
  Search,
  FileText,
  Truck,
  Package,
  Loader2,
  ChevronDown,
  ChevronRight,
  Calendar,
  Weight,
  Printer,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { KpiCard } from "../components/ui/KpiCard";
import { Input } from "../components/ui/Input";
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
import { useShipmentLog } from "../hooks/useShipmentLog";
import { printDocument } from "../utils/printUtils";
import type { ShipmentGroup, DispatchedShipment } from "../types/shipment";

export function ShipmentLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // For server-side search
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Refs for print functionality (matching original implementation)
  const headerContent = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch shipment log data with pagination and search
  const {
    data: shipmentResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useShipmentLog({
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage,
    ...(searchQuery && { search: searchQuery }),
  });

  // Watch for fetch completion and clear user interaction state
  useEffect(() => {
    if (isUserInteracting && !isFetching) {
      setIsUserInteracting(false);
    }
  }, [isFetching, isUserInteracting]);

  // Determine loading states
  const hasExistingData = !!shipmentResponse;
  const isInitialLoading = isLoading && !hasExistingData;
  const isInteractionLoading = isUserInteracting && isFetching && hasExistingData;


  // Handle accordion expansion
  const toggleGroupExpansion = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  // Generate unique key for shipment group
  const getGroupKey = (group: ShipmentGroup) => {
    return `${group.vehicle_number}-${group.created_datetime}`;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setIsUserInteracting(true);
  };

  // Handle page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    setItemsPerPage(newPageSize);
    setCurrentPage(1);
    setIsUserInteracting(true);
  };

  // Handle server-side search
  const handleSearch = () => {
    setIsUserInteracting(true);
    setSearchQuery(searchTerm.trim());
    setCurrentPage(1);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setIsUserInteracting(true);
    setSearchTerm("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Handle print gatepass (matching original implementation)
  const handlePrintGatepass = async (group: ShipmentGroup) => {
    if (!headerContent.current || !iframeRef.current) return;

    await printDocument(group, headerContent.current, iframeRef.current);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-tea-700">Shipment Log</h1>
        <p className="text-gray-600">Track dispatched shipments and gatepass documents</p>
      </div>

      {/* KPI Cards */}
      {shipmentResponse?.meta && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard
            title="Total Orders"
            value={shipmentResponse.meta.total_orders}
            icon={FileText}
            iconColor="text-tea-600"
            iconBgColor="bg-tea-100"
          />
          <KpiCard
            title="Total Dispatches"
            value={shipmentResponse.meta.total_dispatches}
            icon={Truck}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
          />
          <KpiCard
            title="Total Quantity"
            value={`${shipmentResponse.meta.total_quantity_dispatched} kg`}
            icon={Weight}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
          />
          <KpiCard
            title="Current Page"
            value={`${shipmentResponse.meta.current_page_dispatches} dispatches`}
            icon={Package}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="text-lg text-tea-700">Dispatched Shipments</CardTitle>
            <button
              onClick={() => {
                refetch();
                setIsUserInteracting(true);
              }}
              disabled={isInitialLoading}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          <div className="space-y-4">
            {/* Search Row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search vehicle, product, or PO..."
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
          </div>

          {/* Content Section */}
          {isInitialLoading ? (
            <Loading className="py-12" />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Error loading shipment log</p>
              <button onClick={() => refetch()} className="mt-2 text-tea-600 hover:text-tea-700">
                Try again
              </button>
            </div>
          ) : !shipmentResponse?.data?.length ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No shipments found</h3>
              <p>No dispatched shipments match your search criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Shipment Groups Table with Accordion */}
              <div className="border rounded-lg overflow-hidden relative">
                {/* Loading overlay for interaction loading */}
                {isInteractionLoading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <Loading className="p-4" />
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"> </TableHead>
                      <TableHead>Vehicle Number</TableHead>
                      <TableHead>Dispatch Date</TableHead>
                      <TableHead>Total Quantity</TableHead>
                      <TableHead>Bag Count</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipmentResponse.data.map((group) => {
                      const groupKey = getGroupKey(group);
                      const isExpanded = expandedGroups.has(groupKey);

                      return (
                        <React.Fragment key={groupKey}>
                          {/* Main Group Row */}
                          <TableRow
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => toggleGroupExpansion(groupKey)}
                          >
                            <TableCell>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-tea-600" />
                                {group.vehicle_number}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {formatTimestamp(group.created_datetime)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="info" className="font-mono">
                                {group.shipments.reduce(
                                  (total, { quantity }) => total + quantity,
                                  0
                                )}{" "}
                                kg
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">
                                {group.shipments.reduce(
                                  (total, { barcode_records }) => total + barcode_records.length,
                                  0
                                )}{" "}
                                bags
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="success">{group.shipments.length} orders</Badge>
                            </TableCell>
                            <TableCell>
                              <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                <button
                                  onClick={() => handlePrintGatepass(group)}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-tea-700 bg-tea-100 border border-tea-200 rounded hover:bg-tea-200 transition-colors"
                                  title="Print Gatepass"
                                >
                                  <Printer className="h-3 w-3" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Expanded Shipment Details */}
                          {isExpanded && (
                            <TableRow>
                              <TableCell colSpan={7} className="p-0 bg-gray-50">
                                <ShipmentDetails shipments={group.shipments} />
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {shipmentResponse?.meta?.pagination && (
                <Pagination
                  currentPage={shipmentResponse.meta.pagination.current_page}
                  totalPages={shipmentResponse.meta.pagination.total_pages}
                  onPageChange={handlePageChange}
                  totalItems={shipmentResponse.meta.pagination.total_count}
                  itemsPerPage={itemsPerPage}
                  onPageSizeChange={handlePageSizeChange}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden elements for print functionality (matching original implementation) */}
      <div ref={headerContent} style={{ display: "none" }}>
        {/* Content will be populated dynamically when printing */}
      </div>

      <iframe ref={iframeRef} className="hidden" title="Print Gatepass Document" />
    </div>
  );
}

// Shipment Details Component (used in accordion expansion)
interface ShipmentDetailsProps {
  shipments: DispatchedShipment[];
}

function ShipmentDetails({ shipments }: ShipmentDetailsProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleKeyExpansion = (key: string) => {
    setExpandedKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  return (
    <div className="p-3 space-y-3">
      {shipments.map((shipment) => {
        const key = `${shipment.request_code}-${shipment.shipment_code}`;
        const isExpanded = expandedKeys.has(key);

        return (
          <Card key={key} className="border-tea-200 p-0 overflow-hidden">
            <CardHeader className="mb-0 p-0">
              <div
                className="px-6 py-5 cursor-pointer hover:bg-tea-50 transition-colors flex items-center justify-between"
                onClick={() => toggleKeyExpansion(key)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                  <div>
                    <h4 className="font-medium text-tea-700">{shipment.production_order}</h4>
                    <p className="text-sm text-gray-600">{shipment.product_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="info" className="font-mono">
                    {shipment.quantity} kg
                  </Badge>
                  <Badge variant="default">{shipment.barcode_records.length} bags</Badge>
                </div>
              </div>
            </CardHeader>

            {isExpanded && shipment.barcode_records.length > 0 && (
              <div className="border-t overflow-hidden">
                <h5 className="text-sm font-medium text-gray-700 px-6 py-3 bg-gray-50 border-b">
                  Barcode Details ({shipment.barcode_records.length} items)
                </h5>
                <div className="max-h-60 overflow-y-auto">
                  <Table className="[&_th:first-child]:ps-6 [&_td:first-child]:ps-6 [&_th:last-child]:pe-6 [&_td:last-child]:pe-6">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Barcode</TableHead>
                        <TableHead className="text-xs">Item Code</TableHead>
                        <TableHead className="text-xs text-right">Weight (kg)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shipment.barcode_records.map((record, index) => (
                        <TableRow key={index} className="text-sm first:p-6">
                          <TableCell className="font-mono text-xs break-all">
                            {record.barcode}
                          </TableCell>
                          <TableCell className="text-xs">{record.item_code}</TableCell>
                          <TableCell className="text-right text-xs font-mono">
                            {record.amount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
