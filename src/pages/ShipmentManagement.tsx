import { useState, useMemo } from 'react';
import { Truck, Package2, MapPin, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Ship, Plane } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useOrders } from '../hooks';

// Enhanced types for shipment management
interface ShipmentItem {
  shipmentId: string;
  orderNumber: string;
  customerName: string;
  destination: string;
  carrier: string;
  trackingNumber: string;
  status: 'PREPARING' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  shipmentDate: string;
  estimatedDelivery: string;
  totalWeight: number;
  totalPackages: number;
  totalValue: number;
  materialCount: number;
  port: string;
  shippingMethod: 'AIR' | 'SEA' | 'LAND';
}

interface ParcelItem {
  parcelId: string;
  shipmentId: string;
  scheduleCode: string;
  weight: number;
  dimensions: string;
  contents: string[];
  status: 'PACKED' | 'SEALED' | 'LOADED' | 'DISPATCHED';
}

// Status configuration for shipments
const SHIPMENT_STATUS_CONFIG = {
  PREPARING: { label: 'Preparing', icon: Package2, color: 'warning', bgColor: 'bg-yellow-100' },
  SHIPPED: { label: 'Shipped', icon: Ship, color: 'info', bgColor: 'bg-blue-100' },
  IN_TRANSIT: { label: 'In Transit', icon: Truck, color: 'info', bgColor: 'bg-blue-100' },
  DELIVERED: { label: 'Delivered', icon: CheckCircle, color: 'success', bgColor: 'bg-green-100' },
  RETURNED: { label: 'Returned', icon: XCircle, color: 'error', bgColor: 'bg-red-100' }
} as const;

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', color: 'default' },
  MEDIUM: { label: 'Medium', color: 'info' },
  HIGH: { label: 'High', color: 'warning' },
  URGENT: { label: 'Urgent', color: 'error' }
} as const;

export function ShipmentManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedView, setSelectedView] = useState<string>('shipments');

  // Fetch orders data (will be extended with shipment data)
  const { data: ordersData = [], isLoading: ordersLoading } = useOrders();

  // Generate comprehensive shipment data with mockup
  const shipmentData = useMemo((): ShipmentItem[] => {

    // Enhanced mockup shipment data
    const mockShipments = [
      {
        shipmentId: 'SHIP-001',
        orderNumber: 'ORD-2024-001',
        customerName: 'British Tea Company Ltd',
        destination: 'London, UK',
        carrier: 'DHL Express',
        trackingNumber: 'DHL-UK-789456123',
        status: 'IN_TRANSIT' as const,
        priority: 'HIGH' as const,
        shipmentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        totalWeight: 4850,
        totalPackages: 12,
        totalValue: 125000,
        materialCount: 8,
        port: 'Colombo',
        shippingMethod: 'AIR' as const
      },
      {
        shipmentId: 'SHIP-002',
        orderNumber: 'ORD-2024-002',
        customerName: 'Deutsche Tee GmbH',
        destination: 'Hamburg, Germany',
        carrier: 'Hapag-Lloyd',
        trackingNumber: 'HL-DE-456789012',
        status: 'SHIPPED' as const,
        priority: 'MEDIUM' as const,
        shipmentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        totalWeight: 4320,
        totalPackages: 15,
        totalValue: 98000,
        materialCount: 6,
        port: 'Colombo',
        shippingMethod: 'SEA' as const
      },
      {
        shipmentId: 'SHIP-003',
        orderNumber: 'ORD-2024-003',
        customerName: 'American Tea Corporation',
        destination: 'New York, USA',
        carrier: 'FedEx International',
        trackingNumber: 'FDX-US-321654987',
        status: 'PREPARING' as const,
        priority: 'URGENT' as const,
        shipmentDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        totalWeight: 5780,
        totalPackages: 18,
        totalValue: 145000,
        materialCount: 12,
        port: 'Colombo',
        shippingMethod: 'AIR' as const
      },
      {
        shipmentId: 'SHIP-004',
        orderNumber: 'ORD-2024-004',
        customerName: 'Tokyo Tea Limited',
        destination: 'Tokyo, Japan',
        carrier: 'Japan Post',
        trackingNumber: 'JP-TK-987123456',
        status: 'DELIVERED' as const,
        priority: 'MEDIUM' as const,
        shipmentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        totalWeight: 4050,
        totalPackages: 10,
        totalValue: 92000,
        materialCount: 7,
        port: 'Colombo',
        shippingMethod: 'SEA' as const
      },
      {
        shipmentId: 'SHIP-005',
        orderNumber: 'ORD-2024-005',
        customerName: 'Ceylon Tea Board',
        destination: 'Colombo, Sri Lanka',
        carrier: 'Local Distribution',
        trackingNumber: 'LCL-SL-555666777',
        status: 'DELIVERED' as const,
        priority: 'LOW' as const,
        shipmentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        totalWeight: 3650,
        totalPackages: 8,
        totalValue: 78000,
        materialCount: 5,
        port: 'Colombo',
        shippingMethod: 'LAND' as const
      },
      {
        shipmentId: 'SHIP-006',
        orderNumber: 'ORD-2024-006',
        customerName: 'Australian Premium Tea',
        destination: 'Sydney, Australia',
        carrier: 'Qantas Freight',
        trackingNumber: 'QF-AU-888999000',
        status: 'SHIPPED' as const,
        priority: 'HIGH' as const,
        shipmentDate: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        totalWeight: 5200,
        totalPackages: 14,
        totalValue: 118000,
        materialCount: 9,
        port: 'Colombo',
        shippingMethod: 'AIR' as const
      }
    ];

    return mockShipments;
  }, [ordersData]);

  // Generate parcel data
  const parcelData = useMemo((): ParcelItem[] => {
    const parcels: ParcelItem[] = [];
    
    shipmentData.forEach((shipment, index) => {
      const parcelCount = Math.ceil(shipment.totalPackages / 3); // Group packages into parcels
      
      for (let i = 0; i < parcelCount; i++) {
        parcels.push({
          parcelId: `PRC-${shipment.shipmentId}-${String(i + 1).padStart(2, '0')}`,
          shipmentId: shipment.shipmentId,
          scheduleCode: `SCH-${index + 1}-${i + 1}`,
          weight: Math.round(shipment.totalWeight / parcelCount),
          dimensions: `${80 + i * 10}x${60 + i * 5}x${40 + i * 3}cm`,
          contents: [`Batch-${index + 1}-${i + 1}`, `Grade-A Tea`, `Premium Blend`],
          status: shipment.status === 'DELIVERED' ? 'DISPATCHED' : 
                  shipment.status === 'SHIPPED' || shipment.status === 'IN_TRANSIT' ? 'LOADED' :
                  shipment.status === 'PREPARING' ? 'PACKED' : 'SEALED'
        });
      }
    });

    return parcels;
  }, [shipmentData]);

  // Filter shipments
  const filteredShipments = useMemo(() => {
    return shipmentData.filter(shipment => {
      const matchesSearch = searchTerm === '' || 
        shipment.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.destination.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = selectedStatus === 'all' || shipment.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || shipment.priority === selectedPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [shipmentData, searchTerm, selectedStatus, selectedPriority]);

  // Calculate shipment summary
  const shipmentSummary = useMemo(() => {
    const summary = {
      totalShipments: shipmentData.length,
      totalWeight: shipmentData.reduce((sum, s) => sum + s.totalWeight, 0),
      totalValue: shipmentData.reduce((sum, s) => sum + s.totalValue, 0),
      byStatus: {
        PREPARING: shipmentData.filter(s => s.status === 'PREPARING').length,
        SHIPPED: shipmentData.filter(s => s.status === 'SHIPPED').length,
        IN_TRANSIT: shipmentData.filter(s => s.status === 'IN_TRANSIT').length,
        DELIVERED: shipmentData.filter(s => s.status === 'DELIVERED').length,
        RETURNED: shipmentData.filter(s => s.status === 'RETURNED').length
      },
      byMethod: {
        AIR: shipmentData.filter(s => s.shippingMethod === 'AIR').length,
        SEA: shipmentData.filter(s => s.shippingMethod === 'SEA').length,
        LAND: shipmentData.filter(s => s.shippingMethod === 'LAND').length
      },
      urgentShipments: shipmentData.filter(s => s.priority === 'URGENT').length
    };
    return summary;
  }, [shipmentData]);

  if (ordersLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loading size="lg" />
        <p className="mt-4 text-sm text-gray-600">Loading shipment management data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Shipment Management</h2>
        <p className="mt-1 text-sm text-gray-500">
          Track and manage shipments, orders, and delivery operations
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Shipments</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {shipmentSummary.totalShipments}
              </p>
            </div>
            <Ship className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Weight</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {shipmentSummary.totalWeight.toLocaleString()} kg
              </p>
            </div>
            <Package2 className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                ${shipmentSummary.totalValue.toLocaleString()}
              </p>
            </div>
            <Truck className="h-8 w-8 text-tea-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Urgent Shipments</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {shipmentSummary.urgentShipments}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(SHIPMENT_STATUS_CONFIG).map(([status, config]) => {
          const Icon = config.icon;
          const count = shipmentSummary.byStatus[status as keyof typeof shipmentSummary.byStatus];
          
          return (
            <Card key={status} className={`${config.bgColor} border-none`}>
              <div className="text-center">
                <Icon className="h-8 w-8 mx-auto mb-2 text-gray-700" />
                <p className="text-sm font-medium text-gray-700">{config.label}</p>
                <p className="text-xl font-semibold text-gray-900">{count}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Shipping Method Summary */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Methods</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-sky-50 rounded-lg">
            <Plane className="h-8 w-8 mx-auto mb-2 text-sky-600" />
            <p className="text-sm font-medium text-gray-600">Air Freight</p>
            <p className="text-xl font-semibold text-gray-900">{shipmentSummary.byMethod.AIR}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Ship className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-sm font-medium text-gray-600">Sea Freight</p>
            <p className="text-xl font-semibold text-gray-900">{shipmentSummary.byMethod.SEA}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Truck className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-sm font-medium text-gray-600">Land Transport</p>
            <p className="text-xl font-semibold text-gray-900">{shipmentSummary.byMethod.LAND}</p>
          </div>
        </div>
      </Card>

      {/* Filters and View Toggle */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select
            value={selectedView}
            onValueChange={setSelectedView}
            placeholder="Select View"
            options={[
              { value: 'shipments', label: 'Shipments' },
              { value: 'parcels', label: 'Parcels' }
            ]}
          />

          <Input
            placeholder="Search shipments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          
          <Select
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            placeholder="All Statuses"
            options={[
              { value: 'all', label: 'All Statuses' },
              ...Object.entries(SHIPMENT_STATUS_CONFIG).map(([status, config]) => ({
                value: status,
                label: config.label
              }))
            ]}
          />

          <Select
            value={selectedPriority}
            onValueChange={setSelectedPriority}
            placeholder="All Priorities"
            options={[
              { value: 'all', label: 'All Priorities' },
              ...Object.entries(PRIORITY_CONFIG).map(([priority, config]) => ({
                value: priority,
                label: config.label
              }))
            ]}
          />

          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {selectedView === 'shipments' ? 'Shipment View' : 'Parcel View'}
            </span>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      {selectedView === 'shipments' ? (
        /* Shipments Table */
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Shipments</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shipment Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer & Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Carrier & Tracking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight & Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredShipments.map((shipment) => {
                  const statusConfig = SHIPMENT_STATUS_CONFIG[shipment.status];
                  const priorityConfig = PRIORITY_CONFIG[shipment.priority];
                  const StatusIcon = statusConfig.icon;
                  const isUrgent = shipment.priority === 'URGENT';

                  return (
                    <tr key={shipment.shipmentId} className={isUrgent ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {shipment.shipmentId}
                          </div>
                          <div className="text-sm text-gray-500">
                            Order: {shipment.orderNumber}
                          </div>
                          <div className="text-xs text-gray-400">
                            {shipment.totalPackages} packages • {shipment.materialCount} materials
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {shipment.customerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            📍 {shipment.destination}
                          </div>
                          <div className="text-xs text-gray-400">
                            Port: {shipment.port}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {shipment.carrier}
                          </div>
                          <div className="text-sm text-gray-500">
                            {shipment.trackingNumber}
                          </div>
                          <div className="text-xs text-gray-400">
                            {shipment.shippingMethod === 'AIR' && '✈️ Air Freight'}
                            {shipment.shippingMethod === 'SEA' && '🚢 Sea Freight'}
                            {shipment.shippingMethod === 'LAND' && '🚛 Land Transport'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <StatusIcon className="h-4 w-4" />
                            <Badge variant={statusConfig.color}>
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <Badge variant={priorityConfig.color}>
                            {priorityConfig.label}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {shipment.totalWeight.toLocaleString()} kg
                          </div>
                          <div className="text-sm text-gray-500">
                            ${shipment.totalValue.toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(shipment.shipmentDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(shipment.estimatedDelivery).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredShipments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No shipments found matching your filters
              </div>
            )}
          </div>
        </Card>
      ) : (
        /* Parcels View */
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Parcel Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parcelData.map((parcel) => (
              <div key={parcel.parcelId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{parcel.parcelId}</h4>
                  <Badge variant={
                    parcel.status === 'DISPATCHED' ? 'success' :
                    parcel.status === 'LOADED' ? 'info' :
                    parcel.status === 'SEALED' ? 'warning' : 'default'
                  }>
                    {parcel.status}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>Shipment: {parcel.shipmentId}</div>
                  <div>Schedule: {parcel.scheduleCode}</div>
                  <div>Weight: {parcel.weight.toLocaleString()} kg</div>
                  <div>Dimensions: {parcel.dimensions}</div>
                  <div>
                    Contents: {parcel.contents.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}