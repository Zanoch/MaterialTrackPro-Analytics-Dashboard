import React from 'react';
import { Clock, CheckCircle, Package, Truck, AlertTriangle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Loading } from '../ui/Loading';
import type { ShipmentEventWithContext } from '../../types/order';
import { getOrderStatusColor, getOrderStatusIcon, formatOrderStatus } from '../../hooks/useOrderDashboard';

interface OrderTimelineProps {
  events: ShipmentEventWithContext[];
  isLoading?: boolean;
}

export function OrderTimeline({ events, isLoading = false }: OrderTimelineProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading className="flex justify-center py-8" />
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Activities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No recent activities</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Recent Activities ({events.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => (
            <TimelineEvent
              key={`${event.request_code}-${event.shipment_code}-${event.timestamp}`}
              event={event}
              isLatest={index === 0}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface TimelineEventProps {
  event: ShipmentEventWithContext;
  isLatest?: boolean;
}

function TimelineEvent({ event, isLatest = false }: TimelineEventProps) {
  const statusColor = getOrderStatusColor(event.status);
  const eventIcon = getEventIcon(event.status);
  const isImportant = ['SHIPMENT_DISPATCHED', 'RECEIVED', 'ORDER_NOT_READY'].includes(event.status);

  return (
    <div className={`flex items-start space-x-3 ${isLatest ? 'bg-tea-50 p-3 rounded-lg' : ''}`}>
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-full bg-${statusColor}-100 ${isImportant ? 'ring-2 ring-' + statusColor + '-200' : ''}`}>
          {React.createElement(eventIcon, {
            className: `h-4 w-4 text-${statusColor}-600`
          })}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <Badge 
                variant={isLatest ? "default" : "info"}
                className={`text-xs ${isLatest ? `bg-${statusColor}-100 text-${statusColor}-800` : ''}`}
              >
                {getOrderStatusIcon(event.status)} {formatOrderStatus(event.status)}
              </Badge>
              {isLatest && (
                <Badge variant="default" className="text-xs text-tea-600">
                  Latest
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-gray-900 font-medium">
              {getEventDescription(event)}
            </div>
            
            <div className="text-xs text-gray-500 mt-1">
              REQ-{event.request_code} • SHIP-{event.shipment_code} • {formatTimestamp(event.timestamp)}
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            {(event.quantity / 1000).toFixed(1)}t
          </div>
        </div>

        {/* Additional details */}
        <div className="mt-2 space-y-1">
          {event.shipment_vehicle && (
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <Truck className="h-3 w-3" />
              <span>Vehicle: {event.shipment_vehicle}</span>
            </div>
          )}

          {event.shipment_remarks && (
            <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
              <div className="font-medium mb-1">Shipment Notes:</div>
              {event.shipment_remarks}
            </div>
          )}

          {event.order_remarks && (
            <div className="text-xs text-red-600 bg-red-50 rounded p-2">
              <div className="font-medium mb-1">Order Issues:</div>
              {event.order_remarks}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact timeline for smaller spaces
interface CompactTimelineProps {
  events: ShipmentEventWithContext[];
  maxEvents?: number;
}

export function CompactTimeline({ events, maxEvents = 5 }: CompactTimelineProps) {
  const recentEvents = events.slice(0, maxEvents);

  return (
    <div className="space-y-3">
      {recentEvents.map((event, index) => {
        const statusColor = getOrderStatusColor(event.status);
        const isLatest = index === 0;

        return (
          <div key={`${event.request_code}-${event.timestamp}`} className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full bg-${statusColor}-500 ${isLatest ? 'ring-2 ring-' + statusColor + '-200' : ''}`} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {formatOrderStatus(event.status)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatTimestamp(event.timestamp)}
                </div>
              </div>
              
              <div className="text-xs text-gray-600 truncate">
                {event.product_name} • REQ-{event.request_code}
              </div>
            </div>
          </div>
        );
      })}
      
      {events.length > maxEvents && (
        <div className="text-center">
          <button className="text-xs text-tea-600 hover:text-tea-700">
            View {events.length - maxEvents} more events
          </button>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getEventIcon(status: string) {
  switch (status) {
    case 'APPROVAL_REQUESTED':
      return FileText;
    case 'APPROVAL_ALLOWED':
      return CheckCircle;
    case 'ORDER_REQUESTED':
      return Package;
    case 'SHIPMENT_ACCEPTED':
      return CheckCircle;
    case 'SHIPMENT_DISPATCHED':
      return Truck;
    case 'RECEIVED':
      return CheckCircle;
    case 'ORDER_NOT_READY':
      return AlertTriangle;
    default:
      return Clock;
  }
}

function getEventDescription(event: ShipmentEventWithContext): string {
  const productName = event.product_name.length > 30 ? 
    event.product_name.substring(0, 30) + '...' : 
    event.product_name;

  switch (event.status) {
    case 'APPROVAL_REQUESTED':
      return `Approval requested for ${productName}`;
    case 'APPROVAL_ALLOWED':
      return `Order approved for ${productName}`;
    case 'ORDER_REQUESTED':
      return `Order requested for ${productName}`;
    case 'SHIPMENT_ACCEPTED':
      return `Shipment accepted for ${productName}`;
    case 'SHIPMENT_DISPATCHED':
      return `Shipment dispatched for ${productName}`;
    case 'RECEIVED':
      return `Shipment received for ${productName}`;
    case 'ORDER_NOT_READY':
      return `Order not ready for ${productName}`;
    default:
      return `Status update for ${productName}`;
  }
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) {
    return date.toLocaleDateString();
  } else if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes > 0 ? `${diffMinutes}m ago` : 'Just now';
  }
}