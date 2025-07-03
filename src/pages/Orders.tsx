import { useState } from 'react';
import { RefreshCw, Search, Package, Clock, TrendingUp, DollarSign, Loader2, FileDown, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useOrders, useOrderStats, useOrderFilterOptions } from '../hooks/useOrders';
import { exportToCSV, exportToPDF, exportStatsToPDF, exportChartDataToCSV, formatCurrencyForExport, formatDateForExport, type ExportColumn } from '../utils/exportUtils';

export function Orders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Fetch real data
  const { data: orders = [], isLoading, error, refetch } = useOrders({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    search: searchTerm || undefined,
  });

  const { data: stats } = useOrderStats();
  const { data: filterOptions } = useOrderFilterOptions();

  const statusOptions = filterOptions?.statuses.map((status: any) => ({
    value: status,
    label: status.charAt(0) + status.slice(1).toLowerCase(),
  })) || [];

  const priorityOptions = filterOptions?.priorities.map((priority: any) => ({
    value: priority,
    label: priority.charAt(0) + priority.slice(1).toLowerCase(),
  })) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="default">Pending Request</Badge>;
      case 'ACCEPTED':
        return <Badge variant="info">Accepted by Seeduwa</Badge>;
      case 'IN_TRANSIT':
        return <Badge variant="warning">In Transit to Grandpass</Badge>;
      case 'RECEIVED':
        return <Badge variant="success">Received at Grandpass</Badge>;
      case 'CANCELLED':
        return <Badge variant="error">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return <Badge variant="default">Low</Badge>;
      case 'MEDIUM':
        return <Badge variant="default">Medium</Badge>;
      case 'HIGH':
        return <Badge variant="default">High</Badge>;
      case 'URGENT':
        return <Badge variant="default">Urgent</Badge>;
      default:
        return <Badge variant="default">{priority}</Badge>;
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'JPY' ? 'USD' : currency, // Fallback for display
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatWeight = (weight: number) => `${weight.toLocaleString()} kg`;

  // Export functions
  const handleExportOrders = (format: 'csv' | 'pdf') => {
    const columns: ExportColumn[] = [
      { key: 'order_number', header: 'Order Number' },
      { key: 'customer_name', header: 'Customer Name' },
      { key: 'customer_email', header: 'Customer Email' },
      { key: 'status', header: 'Status' },
      { key: 'priority', header: 'Priority' },
      { key: 'total_weight', header: 'Total Weight (kg)' },
      { key: 'total_value', header: 'Total Value' },
      { key: 'currency', header: 'Currency' },
      { key: 'order_date', header: 'Order Date' },
      { key: 'delivery_date', header: 'Delivery Date' },
    ];

    const exportData = orders.map(order => ({
      ...order,
      total_weight: formatWeight(order.total_weight),
      total_value: formatCurrencyForExport(order.total_value, order.currency),
      order_date: formatDateForExport(order.order_date),
      delivery_date: order.delivery_date ? formatDateForExport(order.delivery_date) : 'Not Set',
    }));

    const filename = `orders_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      exportToCSV(exportData, filename, columns);
    } else {
      exportToPDF(
        exportData, 
        filename, 
        columns, 
        'Order Management Report',
        `Generated on ${new Date().toLocaleDateString()} • Total Orders: ${orders.length}`
      );
    }
  };

  const handleExportStats = () => {
    if (stats) {
      exportStatsToPDF(stats, `order_statistics_${new Date().toISOString().split('T')[0]}`, 'Order Statistics Summary');
    }
  };

  const handleExportChartData = () => {
    exportChartDataToCSV(orderTrendData, `order_trends_${new Date().toISOString().split('T')[0]}`);
  };

  // Mock chart data for order trends
  const orderTrendData = [
    { month: 'Jan', orders: 12, value: 245000 },
    { month: 'Feb', orders: 15, value: 298000 },
    { month: 'Mar', orders: 18, value: 356000 },
    { month: 'Apr', orders: 14, value: 287000 },
    { month: 'May', orders: 20, value: 412000 },
    { month: 'Jun', orders: 16, value: 334000 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
        <span className="ml-2 text-lg">Loading orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading orders: {error.message}</p>
          <button 
            onClick={() => refetch()}
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
          <h2 className="text-2xl font-bold text-gray-900">Internal Transfer Orders</h2>
          <p className="text-gray-600">Manage material transfer requests from Grandpass Packaging to Seeduwa Blending Factory</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-md bg-tea-600 px-4 py-2 text-sm font-medium text-white hover:bg-tea-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleExportOrders('csv')}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </button>
            <button 
              onClick={() => handleExportOrders('pdf')}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full p-3" style={{ backgroundColor: '#d9f2e3' }}>
                <Package className="h-6 w-6" style={{ color: '#237c4b' }} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{stats?.total_orders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full p-3" style={{ backgroundColor: '#d9f2e3' }}>
                <Clock className="h-6 w-6" style={{ color: '#237c4b' }} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold">{stats?.pending_orders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full p-3" style={{ backgroundColor: '#d9f2e3' }}>
                <TrendingUp className="h-6 w-6" style={{ color: '#237c4b' }} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">In Process</p>
                <p className="text-2xl font-bold">{stats?.active_orders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full p-3" style={{ backgroundColor: '#d9f2e3' }}>
                <DollarSign className="h-6 w-6" style={{ color: '#237c4b' }} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Transfer Value</p>
                <p className="text-2xl font-bold">
                  {stats ? formatCurrency(stats.total_value, 'USD') : '$0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by order number or facility..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              placeholder="All Status"
              options={statusOptions}
              className="w-40"
            />
            <Select
              value={priorityFilter}
              onValueChange={setPriorityFilter}
              placeholder="All Priorities"
              options={priorityOptions}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orders ({orders.length})</CardTitle>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportStats}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <FileText className="h-3 w-3" />
                Export Stats
              </button>
              <button 
                onClick={handleExportChartData}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <FileDown className="h-3 w-3" />
                Export Chart Data
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Delivery Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.order_id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer_name}</div>
                      {order.customer_email && (
                        <div className="text-sm text-gray-600">{order.customer_email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                  <TableCell>{formatWeight(order.total_weight)}</TableCell>
                  <TableCell>{formatCurrency(order.total_value, order.currency)}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(order.order_date)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {order.delivery_date ? formatDate(order.delivery_date) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Trends (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={orderTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#2e9b5f" 
                  strokeWidth={2}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Value Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orderTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                />
                <Bar dataKey="value" fill="#2e9b5f" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}