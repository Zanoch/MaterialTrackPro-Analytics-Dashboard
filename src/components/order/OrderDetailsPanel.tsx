import { useState } from 'react';
import { Package, Clock, Edit, X, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { OrderPlanDetails, OrderRequest, ShipmentWithEvents } from '../../types/order';
import { ShipmentTimeline } from './ShipmentTracker';
import { getOrderStatusColor, getOrderStatusIcon, formatOrderStatus, useCreateShipmentEvent } from '../../hooks/useOrderDashboard';

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
  const [isEditing, setIsEditing] = useState(false);

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
            isEditing={isEditing}
            onEditToggle={() => setIsEditing(!isEditing)}
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
  isEditing?: boolean;
  onEditToggle?: () => void;
}

function OrderRequestDetails({ request, selectedShipment, isEditing = false, onEditToggle }: OrderRequestDetailsProps) {
  const [eventForm, setEventForm] = useState({
    status: '',
    vehicle: '',
    remarks: ''
  });

  const createShipmentEvent = useCreateShipmentEvent();

  const handleCreateEvent = async () => {
    if (!selectedShipment || !eventForm.status) return;

    try {
      await createShipmentEvent.mutateAsync([{
        request_code: request.request_code,
        shipment_code: selectedShipment.shipment_code,
        status: eventForm.status,
        shipment_vehicle: eventForm.vehicle || undefined,
        shipment_remarks: eventForm.remarks || undefined,
      }]);

      // Reset form
      setEventForm({ status: '', vehicle: '', remarks: '' });
      onEditToggle?.();
    } catch (error) {
      console.error('Failed to create shipment event:', error);
    }
  };

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
          {selectedShipment && (
            <button
              onClick={onEditToggle}
              className="text-tea-600 hover:text-tea-700 text-sm"
            >
              <Edit className="h-4 w-4 inline mr-1" />
              Update Status
            </button>
          )}
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

      {/* Event Creation Form */}
      {isEditing && selectedShipment && (
        <div className="border border-tea-200 rounded-lg p-4 bg-tea-50">
          <h4 className="font-medium text-gray-900 mb-3">Update Shipment Status</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
              <Select
                value={eventForm.status}
                onValueChange={(value) => setEventForm(prev => ({ ...prev, status: value }))}
                placeholder="Select status"
                options={[
                  { value: 'APPROVAL_ALLOWED', label: '✅ Approval Allowed' },
                  { value: 'SHIPMENT_ACCEPTED', label: '📦 Shipment Accepted' },
                  { value: 'SHIPMENT_DISPATCHED', label: '🚚 Shipment Dispatched' },
                  { value: 'RECEIVED', label: '✔️ Received' },
                  { value: 'ORDER_NOT_READY', label: '❌ Order Not Ready' },
                ]}
              />
            </div>

            {eventForm.status === 'SHIPMENT_DISPATCHED' && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle</label>
                <Input
                  type="text"
                  value={eventForm.vehicle}
                  onChange={(e) => setEventForm(prev => ({ ...prev, vehicle: e.target.value }))}
                  placeholder="Enter vehicle number"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Remarks</label>
              <Input
                type="text"
                value={eventForm.remarks}
                onChange={(e) => setEventForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Enter remarks (optional)"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCreateEvent}
                disabled={!eventForm.status || createShipmentEvent.isPending}
                className="flex-1 bg-tea-600 text-white px-4 py-2 rounded-md hover:bg-tea-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {createShipmentEvent.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Update Status
                  </>
                )}
              </button>
              <button
                onClick={onEditToggle}
                disabled={createShipmentEvent.isPending}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}