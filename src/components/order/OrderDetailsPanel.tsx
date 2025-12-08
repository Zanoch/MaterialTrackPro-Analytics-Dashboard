import { Package, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { OrderPlanDetails, OrderRequest, ShipmentWithEvents } from '../../types/order';
import { ShipmentTimeline } from './ShipmentTracker';
import { getOrderStatusColor, getOrderStatusIcon, formatOrderStatus } from '../../hooks/useOrderDashboard';

interface OrderDetailsPanelProps {
  selectedOrder?: {
    type: 'plan' | 'request';
    plan?: OrderPlanDetails;
    request?: OrderRequest;
    shipment?: ShipmentWithEvents;
  };
  onClose?: () => void;
}

export function OrderDetailsPanel({ selectedOrder, onClose }: OrderDetailsPanelProps) {
  if (!selectedOrder) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Select an order to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { type, plan, request, shipment } = selectedOrder;

  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>
              {type === 'plan' ? 'Order Plan Details' : 'Order Request Details'}
            </span>
          </CardTitle>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 max-h-[600px] overflow-y-auto">
        {type === 'plan' && plan && (
          <OrderPlanDetails plan={plan} />
        )}

        {type === 'request' && request && (
          <OrderRequestDetails
            request={request}
            selectedShipment={shipment}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface OrderPlanDetailsProps {
  plan: OrderPlanDetails;
}

function OrderPlanDetails({ plan }: OrderPlanDetailsProps) {
  const progress = plan.requests.reduce((total, req) => {
    if (req.status === 'SHIPMENT_DISPATCHED' || req.status === 'RECEIVED') {
      return total + req.quantity;
    }
    return total;
  }, 0);

  const progressPercentage = plan.requirement > 0 ? (progress / plan.requirement) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Plan Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Order Code</label>
            <p className="text-sm font-medium text-tea-600">{plan.order_code}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Product</label>
            <p className="text-sm text-gray-900">{plan.product_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Required</label>
            <p className="text-sm text-gray-900">{(plan.requirement / 1000).toFixed(1)}t</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Allowed</label>
            <p className="text-sm text-gray-900">{(plan.allowed / 1000).toFixed(1)}t</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Plan Start</label>
            <p className="text-sm text-gray-900">{plan.plan_start.toLocaleDateString()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Plan End</label>
            <p className="text-sm text-gray-900">{plan.plan_end.toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Progress</label>
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                progressPercentage < 30 ? 'bg-red-500' :
                progressPercentage < 70 ? 'bg-amber-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">
            {progressPercentage.toFixed(0)}%
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {(progress / 1000).toFixed(1)}t of {(plan.requirement / 1000).toFixed(1)}t completed
        </p>
      </div>

      {/* Requests */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Requests ({plan.requests.length})</h4>
        {plan.requests.length === 0 ? (
          <p className="text-sm text-gray-500">No requests created yet</p>
        ) : (
          <div className="space-y-2">
            {plan.requests.map((request, index) => {
              const statusColor = getOrderStatusColor(request.status);
              
              return (
                <div key={index} className="border border-gray-200 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">REQ-{request.request_code}</span>
                    <Badge 
                      variant="default"
                      className={`bg-${statusColor}-100 text-${statusColor}-800 text-xs`}
                    >
                      {getOrderStatusIcon(request.status)} {formatOrderStatus(request.status)}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    Shipment: {request.shipment_code} • Quantity: {(request.quantity / 1000).toFixed(1)}t
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface OrderRequestDetailsProps {
  request: OrderRequest;
  selectedShipment?: ShipmentWithEvents;
}

function OrderRequestDetails({ request, selectedShipment }: OrderRequestDetailsProps) {

  return (
    <div className="space-y-6">
      {/* Request Overview */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Request Code</label>
            <p className="text-sm font-medium text-tea-600">REQ-{request.request_code}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Order Code</label>
            <p className="text-sm text-gray-900">{request.order_code}</p>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-600">Product</label>
            <p className="text-sm text-gray-900">{request.product_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Requirement</label>
            <p className="text-sm text-gray-900">{(request.requirement / 1000).toFixed(1)}t</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Shipments</label>
            <p className="text-sm text-gray-900">{request.shipments.length}</p>
          </div>
        </div>

        {request.comments && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-600">Comments</label>
            <p className="text-sm text-gray-900 bg-gray-50 rounded p-2">{request.comments}</p>
          </div>
        )}
      </div>

      {/* Shipments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">
            Shipments ({request.shipments.length})
          </h4>
        </div>

        {request.shipments.length === 0 ? (
          <p className="text-sm text-gray-500">No shipments created yet</p>
        ) : (
          <div className="space-y-3">
            {request.shipments.map((shipment) => {
              const isSelected = selectedShipment?.shipment_code === shipment.shipment_code;
              const statusColor = getOrderStatusColor(shipment.current_status || '');
              
              return (
                <div 
                  key={shipment.shipment_code}
                  className={`border rounded p-3 ${
                    isSelected ? 'border-tea-500 bg-tea-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">SHIP-{shipment.shipment_code}</span>
                    <Badge 
                      variant="default"
                      className={`bg-${statusColor}-100 text-${statusColor}-800 text-xs`}
                    >
                      {getOrderStatusIcon(shipment.current_status || '')} 
                      {formatOrderStatus(shipment.current_status || '')}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    Quantity: {(shipment.quantity / 1000).toFixed(1)}t • Events: {shipment.events.length}
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <ShipmentTimeline shipment={shipment} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}