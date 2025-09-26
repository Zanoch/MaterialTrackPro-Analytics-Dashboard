import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Truck, CheckCircle, AlertCircle, FileText, XCircle, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Loading } from '../ui/Loading';
import { Pagination } from '../ui/Pagination';
import type { OrderRequest } from '../../types/order';

interface MaterialRequestsTableProps {
  orderRequests: OrderRequest[];
  isLoading: boolean;
}

export function MaterialRequestsTable({
  orderRequests,
  isLoading
}: MaterialRequestsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <Loading size="lg" />
        </CardContent>
      </Card>
    );
  }

  // Process the data to show one row per order request with consolidated shipment data
  const tableData = orderRequests.map(request => {
    // Calculate total shipment quantity across all shipments
    const totalShipmentQty = request.shipments.reduce((sum, shipment) => sum + shipment.quantity, 0);

    // Get the latest status from all events across all shipments (backend provides in desc order)
    const allEvents = request.shipments.flatMap(shipment => shipment.events);
    const latestEvent = allEvents.sort((a, b) => b.timestamp - a.timestamp)[0];
    const mostRecentStatus = latestEvent?.status || request.shipments[0]?.current_status || 'ORDER_REQUESTED';

    // Get the latest event timestamp for sorting
    const latestTimestamp = Math.max(
      ...request.shipments.flatMap(shipment =>
        shipment.events.map(event => event.timestamp)
      )
    );

    return {
      request,
      totalShipmentQty,
      mostRecentStatus,
      latestTimestamp,
      key: request.request_code
    };
  }).sort((a, b) => {
    const aCode = parseInt(String(a.request.request_code)) || 0;
    const bCode = parseInt(String(b.request.request_code)) || 0;
    return bCode - aCode; // Sort by request code numerically descending
  });
  
  console.log('Material Requests Table Data:', tableData);
  console.log('Order Requests:', orderRequests);

  // Pagination logic
  const totalItems = tableData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = tableData.slice(startIndex, startIndex + itemsPerPage);

  const toggleRowExpansion = (key: string) => {
    console.log('Toggling row:', key);
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(key)) {
        newExpanded.delete(key);
        console.log('Collapsed row:', key);
      } else {
        newExpanded.add(key);
        console.log('Expanded row:', key);
      }
      console.log('Expanded rows:', Array.from(newExpanded));
      return newExpanded;
    });
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return <AlertCircle className="h-4 w-4 text-gray-400" />;

    // APPROVAL_ statuses (except APPROVAL_BLOCKED)
    if (status.startsWith('APPROVAL_')) {
      if (status === 'APPROVAL_BLOCKED') {
        return <XCircle className="h-4 w-4 text-red-500" />;
      }
      return <Shield className="h-4 w-4 text-blue-500" />;
    }

    // ORDER_ statuses (except ORDER_NOT_READY for single shipment)
    if (status.startsWith('ORDER_')) {
      if (status === 'ORDER_NOT_READY') {
        return <XCircle className="h-4 w-4 text-red-500" />;
      }
      return <FileText className="h-4 w-4 text-purple-500" />;
    }

    // SHIPMENT_ statuses (except SHIPMENT_ACCEPTED)
    if (status.startsWith('SHIPMENT_')) {
      if (status === 'SHIPMENT_ACCEPTED') {
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      }
      return <Truck className="h-4 w-4 text-orange-500" />;
    }

    // Default for any other status
    return <AlertCircle className="h-4 w-4 text-gray-400" />;
  };

  const getStatusColor = (status?: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    if (!status) return 'default';

    // Danger statuses
    if (status === 'APPROVAL_BLOCKED' || status === 'ORDER_NOT_READY') {
      return 'error';
    }

    // Success status
    if (status === 'SHIPMENT_ACCEPTED') {
      return 'success';
    }

    // APPROVAL_ statuses (except blocked)
    if (status.startsWith('APPROVAL_')) {
      return 'info';
    }

    // ORDER_ statuses (except not ready)
    if (status.startsWith('ORDER_')) {
      return 'warning';
    }

    // SHIPMENT_ statuses (except accepted)
    if (status.startsWith('SHIPMENT_')) {
      return 'warning';
    }

    return 'default';
  };

  const formatStatus = (status?: string): string => {
    if (!status) return 'Unknown';
    // Convert snake_case to Title Case
    return status.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to render request timeline with dynamic status flow
  const renderRequestTimeline = (request: OrderRequest) => {
    // Get all unique events sorted by timestamp (chronological order)
    const allEvents = request.shipments.flatMap(shipment =>
      shipment.events.map(event => ({
        ...event,
        shipment_code: shipment.shipment_code,
        quantity: shipment.quantity
      }))
    ).sort((a, b) => a.timestamp - b.timestamp);

    // Get unique statuses in the order they occurred
    const uniqueStatuses = [...new Set(allEvents.map(event => event.status))];

    // Create initial request entry if not present in events
    const hasOrderRequested = uniqueStatuses.includes('ORDER_REQUESTED');
    if (!hasOrderRequested) {
      uniqueStatuses.unshift('ORDER_REQUESTED');
    }

    return (
      <div className="relative">
        {/* Timeline line - positioned to align with dot centers (20px from left = 5 * 4px) */}
        <div className="absolute left-4 top-8 bottom-8 w-px bg-gray-300"></div>

        <div className="space-y-8">
          {uniqueStatuses.map((status, index) => {
            const statusEvents = allEvents.filter(event => event.status === status);

            // Handle initial ORDER_REQUESTED status
            if (status === 'ORDER_REQUESTED' && !hasOrderRequested) {
              return (
                <div key={status} className="relative flex items-start gap-4">
                  {/* Timeline dot with icon */}
                  <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-gray-400 shadow-sm">
                    {getStatusIcon(status)}
                  </div>
                  <div className="flex-1 ml-2">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-base font-medium text-gray-900 flex items-center gap-2">
                        {formatStatus(status)}
                      </h5>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Request Code:</span>
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono">{request.request_code}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Total Requirement:</span>
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold">{request.requirement.toLocaleString()} kg</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            }


            return (
              <div key={`${status}-${index}`} className="relative flex items-start gap-4">
                {/* Timeline dot with icon */}
                <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-gray-400 shadow-sm">
                  {getStatusIcon(status)}
                </div>
                <div className="flex-1 ml-2">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-base font-medium text-gray-900 flex items-center gap-2">
                      {formatStatus(status)}
                    </h5>
                  </div>

                  {/* Show shipments for this status */}
                  {statusEvents.length > 0 && (
                    <div className="space-y-3">
                      {statusEvents.map((event, eventIndex) => (
                        <div key={`${event.shipment_code}-${eventIndex}`} className="py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-800 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                              {request.shipments.length > 1 ? `Shipment #${event.shipment_code}` : 'Shipment'}
                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                                {event.quantity.toLocaleString()} kg
                              </span>
                            </span>
                            <time className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                            </time>
                          </div>

                          {/* Show vehicle info for dispatched shipments */}
                          {status === 'SHIPMENT_DISPATCHED' && event.shipment_vehicle && (
                            <div className="mt-2 flex items-center gap-2 text-gray-600">
                              <Truck className="h-4 w-4" />
                              <span className="text-sm">
                                Vehicle: <span className="font-medium">{event.shipment_vehicle}</span>
                              </span>
                            </div>
                          )}

                          {/* Show remarks if available */}
                          {(event.remarks || event.shipment_remarks || event.order_remarks) && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600 italic">
                                "{event.remarks || event.shipment_remarks || event.order_remarks}"
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Show initial request details only for ORDER_REQUESTED */}
                  {status === 'ORDER_REQUESTED' && statusEvents.length > 0 && (
                    <div className="mt-3 text-sm space-y-1 text-gray-600 pt-2 border-t border-gray-100">
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Request Code:</span>
                        <span className="px-2 py-1 rounded text-xs font-mono bg-gray-100 text-gray-800">{request.request_code}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Total Requirement:</span>
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">{request.requirement.toLocaleString()} kg</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline completion indicator */}
        {uniqueStatuses.length > 0 && (
          <div className="absolute left-1 bottom-2 w-6 h-6 bg-gray-200 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"> </TableHead>
                <TableHead>Request Number</TableHead>
                <TableHead>Order Code</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty (kg)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No material requests found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map(({ request, totalShipmentQty, mostRecentStatus, key }) => (
                  <React.Fragment key={key}>
                    <TableRow className="hover:bg-gray-50">
                      <TableCell>
                        <div 
                          className="cursor-pointer p-1 hover:bg-gray-100 rounded inline-block"
                          onClick={(e: any) => {
                            e.stopPropagation();
                            toggleRowExpansion(key);
                          }}
                        >
                          {expandedRows.has(key) ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {request.request_code}
                      </TableCell>
                      <TableCell>{request.order_code}</TableCell>
                      <TableCell>{request.product_name}</TableCell>
                      <TableCell className="text-right font-medium">
                        {totalShipmentQty.toLocaleString()}
                        <div className="text-xs text-gray-500 mt-1">
                          Total Quantity
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(mostRecentStatus)}
                          <Badge variant={getStatusColor(mostRecentStatus)}>
                            {formatStatus(mostRecentStatus)}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(key) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-gray-50 p-0">
                          <div className="p-6">
                            <h4 className="text-sm font-semibold text-gray-900 mb-4">
                              Order Request Timeline
                            </h4>
                            <div className="space-y-6">
                              {/* Render timeline for the entire request */}
                              {renderRequestTimeline(request)}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageSizeChange={(value: any) => {
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}