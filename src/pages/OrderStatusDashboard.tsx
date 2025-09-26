import { useState } from 'react';
import { Search, Download, RefreshCw, Package } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { OrderStatusCards } from '../components/order/OrderStatusCards';
import { OrderPlansTable } from '../components/order/OrderPlansTable';
import { MaterialRequestsTable } from '../components/order/MaterialRequestsTable';
import { useOrderDashboard } from '../hooks/useOrderDashboard';
import type { OrderDashboardFilters } from '../types/order';

export function OrderStatusDashboard() {
  // State management
  const [filters, setFilters] = useState<OrderDashboardFilters>({
    date_from: new Date().toISOString().split('T')[0], // Today
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'plans' | 'material-requests'>('material-requests');

  // Hooks
  const { data: dashboardData, isLoading, error, refetch } = useOrderDashboard(filters);

  // Event handlers
  const handleRefresh = () => {
    refetch();
  };

  const handleFilterChange = (key: keyof OrderDashboardFilters, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };



  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export order data');
  };

  const clearFilters = () => {
    setFilters({
      date_from: new Date().toISOString().split('T')[0],
    });
    setSearchTerm('');
  };

  // Active filters count
  const activeFiltersCount = Object.values(filters).filter(Boolean).length + (searchTerm ? 1 : 0);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-lg font-medium text-gray-900">Error Loading Order Data</p>
          <p className="text-sm text-gray-600 mb-4">{error.message || 'Failed to load order information'}</p>
          <button 
            onClick={handleRefresh}
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
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#237c4b' }}>🚚 Order Status Dashboard</h1>
          <p className="text-gray-600">
            Grandpass ↔ Seeduwa Tea Transfer Operations • 
            Active Orders: {dashboardData?.summary.pending_requests || 0} • 
            In Transit: {dashboardData?.summary.in_transit || 0}
          </p>
        </div>
          
        {/* Quick Actions */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search orders, shipments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          
          <button 
            onClick={handleRefresh}
            className="flex items-center space-x-2 bg-tea-600 hover:bg-tea-700 px-4 py-2 rounded-md transition-colors text-white"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
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

      {/* Status Summary Cards */}
      <OrderStatusCards 
        summary={dashboardData?.summary || {
          total_plans: 0,
          pending_requests: 0,
          accepted_orders: 0,
          in_transit: 0,
          received_today: 0,
          total_requirement_kg: 0,
          total_shipped_kg: 0,
          fulfillment_rate: 0
        }} 
        isLoading={isLoading} 
      />



      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* View Mode Toggle - Left Side */}
            <div className="flex items-center space-x-2">
              <div className="flex rounded-md border border-gray-200">
                <button
                  onClick={() => setViewMode('material-requests')}
                  className={`px-3 py-1 text-sm rounded-l-md ${
                    viewMode === 'material-requests' 
                      ? 'bg-tea-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Order Requests
                </button>
                <button
                  onClick={() => setViewMode('plans')}
                  className={`px-3 py-1 text-sm rounded-r-md border-l border-gray-200 ${
                    viewMode === 'plans' 
                      ? 'bg-tea-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Order Schedules
                </button>
              </div>
            </div>

            {/* Filter controls - Right Side (temporarily disabled) */}
            {false && viewMode === 'material-requests' && (
              <div className="flex items-center space-x-4">
                <Select
                  value={filters.date_from || ''}
                  onValueChange={(value) => handleFilterChange('date_from', value)}
                  placeholder="Select Date"
                  options={[
                    { value: new Date().toISOString().split('T')[0], label: 'Today' },
                    { value: new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0], label: 'Yesterday' },
                    { value: new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0], label: 'Last Week' },
                  ]}
                  className="w-40"
                />

                <Select
                  value={filters.status?.[0] || ''}
                  onValueChange={(value) => handleFilterChange('status', value ? [value] : [])}
                  placeholder="All Status"
                  options={[
                    { value: 'APPROVAL_REQUESTED', label: '⏳ Approval Requested' },
                    { value: 'SHIPMENT_ACCEPTED', label: '📦 Accepted' },
                    { value: 'SHIPMENT_DISPATCHED', label: '🚚 In Transit' },
                    { value: 'RECEIVED', label: '✔️ Received' },
                  ]}
                  className="w-48"
                />

                <Input
                  type="text"
                  placeholder="Vehicle number..."
                  value={filters.shipment_vehicle || ''}
                  onChange={(e) => handleFilterChange('shipment_vehicle', e.target.value)}
                  className="w-40"
                />

                {/* Clear filters button */}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear Filters ({activeFiltersCount})
                  </button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {viewMode === 'plans' && (
        <OrderPlansTable
          isLoading={isLoading}
          showPagination={true}
        />
      )}

      {viewMode === 'material-requests' && (
        <MaterialRequestsTable
          orderRequests={dashboardData?.activeOrders || []}
          isLoading={isLoading}
        />
      )}

      {/* Auto-refresh indicator */}
      {isLoading && (
        <div className="fixed bottom-4 right-4 bg-tea-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Refreshing...</span>
          </div>
        </div>
      )}
    </div>
  );
}