import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Package, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Loading } from '../ui/Loading';
import { Pagination } from '../ui/Pagination';
import type { OrderRequest, ShipmentWithEvents } from '../../types/order';

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

  // Flatten the data for table display
  const tableData = orderRequests.flatMap(request => 
    request.shipments.map(shipment => ({
      request,
      shipment,
      key: `${request.request_code}-${shipment.shipment_code}`
    }))
  );
  
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
    switch (status) {
      case 'APPROVAL_REQUESTED':
      case 'ORDER_REQUESTED':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'SHIPMENT_ACCEPTED':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'SHIPMENT_DISPATCHED':
        return <Truck className="h-4 w-4 text-orange-500" />;
      case 'RECEIVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status?: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'APPROVAL_REQUESTED':
      case 'ORDER_REQUESTED':
        return 'warning';
      case 'SHIPMENT_ACCEPTED':
        return 'info';
      case 'SHIPMENT_DISPATCHED':
        return 'warning';
      case 'RECEIVED':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatStatus = (status?: string): string => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to render timeline steps
  const renderTimelineStep = (
    stepStatus: string, 
    stepLabel: string, 
    shipment: ShipmentWithEvents,
    request: OrderRequest
  ) => {
    const event = shipment.events.find(e => e.status === stepStatus);
    const currentStatus = shipment.current_status || '';
    
    // Determine if this step is active (current)
    const isActive = currentStatus === stepStatus;
    
    // Determine if this step is in the past (completed)
    const statusOrder = ['ORDER_REQUESTED', 'APPROVAL_REQUESTED', 'SHIPMENT_ACCEPTED', 'SHIPMENT_DISPATCHED', 'RECEIVED'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepStatus);
    const isPast = currentIndex >= 0 && stepIndex >= 0 && stepIndex <= currentIndex;

    return (
      <div className="relative flex items-start gap-3">
        {/* Status indicator */}
        <div className={`
          relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2
          ${isActive ? 'border-tea-600 bg-tea-600' : 
            isPast ? 'border-green-500 bg-green-500' : 
            'border-gray-300 bg-white'}
        `}>
          {isPast ? (
            <CheckCircle className="h-5 w-5 text-white" />
          ) : isActive ? (
            getStatusIcon(stepStatus)
          ) : (
            <div className="h-2 w-2 rounded-full bg-gray-400"></div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 pb-6">
          <div className="flex items-center justify-between">
            <h5 className={`text-sm font-medium ${isPast ? 'text-gray-900' : 'text-gray-500'}`}>
              {stepLabel}
            </h5>
            {event && (
              <time className="text-xs text-gray-500">
                {new Date(event.timestamp).toLocaleString()}
              </time>
            )}
          </div>
          
          {/* Show vehicle number for transit status */}
          {event && stepStatus === 'SHIPMENT_DISPATCHED' && event.shipment_vehicle && (
            <div className="mt-1 flex items-center gap-2">
              <Truck className="h-3 w-3 text-gray-400" />
              <span className="text-sm text-gray-600">
                Vehicle: <span className="font-medium">{event.shipment_vehicle}</span>
              </span>
            </div>
          )}
          
          {/* Show remarks if available */}
          {event && event.remarks && (
            <p className="mt-1 text-sm text-gray-600">{event.remarks}</p>
          )}
          
          {/* Show request details for the first step */}
          {stepStatus === 'ORDER_REQUESTED' && (
            <div className="mt-1 text-sm text-gray-600">
              <p>Request Code: {request.request_code}</p>
              <p>Quantity: {shipment.quantity.toLocaleString()} kg</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Material Requests</CardTitle>
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
                paginatedData.map(({ request, shipment, key }) => (
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
                        {shipment.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(shipment.current_status)}
                          <Badge variant={getStatusColor(shipment.current_status)}>
                            {formatStatus(shipment.current_status)}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(key) && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-gray-50 p-0">
                          <div className="p-6">
                            <h4 className="text-sm font-semibold text-gray-900 mb-4">
                              Order Timeline
                            </h4>
                            <div className="relative">
                              {/* Timeline line */}
                              <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200"></div>
                              
                              <div className="space-y-6">
                                {/* Show all timeline steps */}
                                {renderTimelineStep('ORDER_REQUESTED', 'Order Requested', shipment, request)}
                                {renderTimelineStep('APPROVAL_REQUESTED', 'Approval Requested', shipment, request)}
                                {renderTimelineStep('SHIPMENT_ACCEPTED', 'Shipment Approved', shipment, request)}
                                {renderTimelineStep('SHIPMENT_DISPATCHED', 'In Transit', shipment, request)}
                                {renderTimelineStep('RECEIVED', 'Received', shipment, request)}
                              </div>
                            </div>
                            {shipment.events.length === 0 && (
                              <p className="text-sm text-gray-500 mt-4">No events recorded</p>
                            )}
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