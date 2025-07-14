import { Truck, Package, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Loading } from '../ui/Loading';
import type { OrderRequest, ShipmentWithEvents } from '../../types/order';
import { getOrderStatusColor, getOrderStatusIcon, formatOrderStatus } from '../../hooks/useOrderDashboard';

interface ShipmentTrackerProps {
  orderRequests: OrderRequest[];
  isLoading?: boolean;
  onShipmentSelect?: (request: OrderRequest, shipment: ShipmentWithEvents) => void;
}

export function ShipmentTracker({ orderRequests, isLoading = false, onShipmentSelect }: ShipmentTrackerProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shipment Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading className="flex justify-center py-8" />
        </CardContent>
      </Card>
    );
  }

  // Get active shipments (not completed)
  const activeShipments = orderRequests.flatMap(request => 
    request.shipments
      .filter(shipment => 
        shipment.current_status && 
        !['RECEIVED', 'ORDER_NOT_READY'].includes(shipment.current_status)
      )
      .map(shipment => ({ request, shipment }))
  );

  if (activeShipments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>Shipment Tracking</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No active shipments</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Truck className="h-5 w-5" />
          <span>Shipment Tracking ({activeShipments.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeShipments.map(({ request, shipment }) => (
          <ShipmentCard
            key={`${request.request_code}-${shipment.shipment_code}`}
            request={request}
            shipment={shipment}
            onClick={() => onShipmentSelect?.(request, shipment)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface ShipmentCardProps {
  request: OrderRequest;
  shipment: ShipmentWithEvents;
  onClick?: () => void;
}

function ShipmentCard({ request, shipment, onClick }: ShipmentCardProps) {
  const latestEvent = shipment.latest_event;
  const statusColor = getOrderStatusColor(shipment.current_status || '');
  const isInTransit = shipment.current_status === 'SHIPMENT_DISPATCHED';
  const isUrgent = latestEvent && (Date.now() - latestEvent.timestamp) > 24 * 60 * 60 * 1000; // Over 24 hours

  return (
    <div 
      className={`border rounded-lg p-4 hover:border-tea-400 cursor-pointer transition-colors ${
        isUrgent ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900">
              REQ-{request.request_code}
            </h3>
            <Badge variant="default" className="text-xs">
              SHIP-{shipment.shipment_code}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {request.product_name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isUrgent && (
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          )}
          <div className={`p-2 rounded-full bg-${statusColor}-100`}>
            {isInTransit ? (
              <Truck className={`h-4 w-4 text-${statusColor}-600`} />
            ) : (
              <Package className={`h-4 w-4 text-${statusColor}-600`} />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <Badge 
            variant="default"
            className={`bg-${statusColor}-100 text-${statusColor}-800`}
          >
            {getOrderStatusIcon(shipment.current_status || '')} {formatOrderStatus(shipment.current_status || '')}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Quantity:</span>
          <span className="text-sm font-medium">
            {(shipment.quantity / 1000).toFixed(1)}t
          </span>
        </div>

        {latestEvent && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Update:</span>
              <span className="text-sm text-gray-500">
                {formatTimestamp(latestEvent.timestamp)}
              </span>
            </div>

            {latestEvent.shipment_vehicle && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Vehicle:</span>
                <span className="text-sm font-medium">
                  {latestEvent.shipment_vehicle}
                </span>
              </div>
            )}

            {latestEvent.shipment_remarks && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                <div className="font-medium mb-1">Remarks:</div>
                {latestEvent.shipment_remarks}
              </div>
            )}
          </>
        )}
      </div>

      {isInTransit && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-blue-600">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">In Transit to Grandpass</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface ShipmentTimelineProps {
  shipment: ShipmentWithEvents;
}

export function ShipmentTimeline({ shipment }: ShipmentTimelineProps) {
  const sortedEvents = [...shipment.events].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Shipment Timeline</h3>
      <div className="space-y-3">
        {sortedEvents.map((event, index) => {
          const isLatest = index === sortedEvents.length - 1;
          const statusColor = getOrderStatusColor(event.status);

          return (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full bg-${statusColor}-100`}>
                  <div className={`w-2 h-2 rounded-full bg-${statusColor}-600`} />
                </div>
                {index < sortedEvents.length - 1 && (
                  <div className="w-px h-6 bg-gray-200 mt-2" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={isLatest ? "default" : "info"}
                    className={`text-xs ${isLatest ? `bg-${statusColor}-100 text-${statusColor}-800` : ''}`}
                  >
                    {getOrderStatusIcon(event.status)} {formatOrderStatus(event.status)}
                  </Badge>
                  {isLatest && (
                    <Badge variant="default" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-1 mt-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>

                {event.shipment_vehicle && (
                  <div className="mt-1 text-xs text-gray-600">
                    Vehicle: {event.shipment_vehicle}
                  </div>
                )}

                {event.shipment_remarks && (
                  <div className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    {event.shipment_remarks}
                  </div>
                )}

                {event.order_remarks && (
                  <div className="mt-1 p-2 bg-red-50 rounded text-xs text-red-600">
                    {event.order_remarks}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to format timestamp
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes}m ago`;
  }
}