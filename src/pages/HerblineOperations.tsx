import { useState, useMemo } from 'react';
import { Search, Download, Loader2, AlertTriangle, Package2, BarChart3, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Input } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import {
  useHerblineDashboard,
  useHerblines,
  useHerblineStatistics,
} from '../hooks/useHerbline';
import type { HerblineItem, HerblineDashboardMetrics } from '../types/herbline';

export function HerblineOperations() {
  // State management
  const [searchTerm, setSearchTerm] = useState('');

  // Hooks
  const { data: dashboardData, isLoading: dashboardLoading } = useHerblineDashboard() as { data: HerblineDashboardMetrics | undefined; isLoading: boolean };
  const { data: allHerbs, isLoading: allLoading } = useHerblines({}, true) as { data: HerblineItem[] | undefined; isLoading: boolean };

  // Computed values
  const herbs = useMemo(() => {
    if (!searchTerm) return allHerbs || [];
    
    // Client-side filtering by item code or herb name
    return (allHerbs || []).filter((herb: any) => 
      herb.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      herb.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allHerbs, searchTerm]);

  // Current loading state
  const isCurrentlyLoading = allLoading;

  // Get statistics for current herbs
  const statistics = useHerblineStatistics(herbs);

  // Event handlers
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };


  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export herb data');
  };

  // Loading state
  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
        <span className="ml-2 text-lg">Loading herbs dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#237c4b' }}>🌿 Herbs Management Dashboard</h1>
          <p className="text-gray-600">
            Herbal Ingredients & Processing • Total Types: {dashboardData?.total_herb_types || 0} • 
            Available: {(Number(dashboardData?.total_available_weight) || 0).toFixed(1)}kg
          </p>
        </div>
          
        {/* Global Search */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search herbs by name, code, or type..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-96"
            />
          </div>
          
          {/* Quick Actions */}
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 bg-tea-600 hover:bg-tea-700 px-4 py-2 rounded-md transition-colors text-white"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          title="Total Herb Types"
          value={dashboardData?.total_herb_types || statistics.totalHerbs}
          icon={Package2}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
          trend="up"
          trendValue="new this week"
        />

        <KpiCard
          title="Total Inventory"
          value={`${(Number(dashboardData?.total_inventory_weight) || statistics.totalWeight).toFixed(1)}kg`}
          icon={BarChart3}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
          subtitle={`${(dashboardData?.average_weight_per_herb || statistics.totalWeight/statistics.totalHerbs || 0).toFixed(1)}kg avg per herb`}
        />

        <KpiCard
          title="Available Weight"
          value={`${(Number(dashboardData?.total_available_weight) || statistics.availableWeight).toFixed(1)}kg`}
          icon={TrendingUp}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
          trend="up"
          trendValue="utilization rate"
        />

        <KpiCard
          title="Expiring Soon"
          value={dashboardData?.expiring_soon_count || statistics.expiringCount}
          icon={AlertTriangle}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
          subtitle="<30 days to expiry"
        />
      </div>


      {/* Main Content - Simplified Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Herb Inventory ({herbs.length} herbs)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isCurrentlyLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
              <span className="ml-2">Loading herbs...</span>
            </div>
          ) : herbs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm.length >= 2 ? 'No herbs found for your search.' : 'No herbs available.'}
            </div>
          ) : (
            /* Simplified Table View */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6 py-3">Item Code</TableHead>
                    <TableHead className="px-6 py-3">Herb Name</TableHead>
                    <TableHead className="px-6 py-3">Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {herbs.map((herb: any) => (
                    <TableRow key={herb.id} className="hover:bg-gray-50">
                      <TableCell className="px-6 py-4 font-medium text-tea-green-600">
                        {herb.item_code}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-gray-900">
                        {herb.item_name}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-gray-600">
                        {(Number(herb.weight) || 0).toFixed(1)}kg
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

