import { useState, useMemo } from 'react';
import { Search, RefreshCw, Loader2, Package2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { KpiCard } from '../components/ui/KpiCard';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import {
  useFlavorsheetDashboard,
  useFlavorsheets,
  useCreateBatch,
} from '../hooks/useFlavorsheet';
import type { 
  FlavorsheetItem,
  FlavorsheetDashboardMetrics
} from '../types/flavorsheet';

export function FlavorsheetOperations() {
  // State management
  const [searchTerm, setSearchTerm] = useState('');

  // Hooks
  const { data: dashboardData, isLoading: dashboardLoading } = useFlavorsheetDashboard() as { data: FlavorsheetDashboardMetrics | undefined; isLoading: boolean };
  const { data: allFlavorsheets, isLoading: allLoading } = useFlavorsheets() as { data: FlavorsheetItem[] | undefined; isLoading: boolean };
  const createBatchMutation = useCreateBatch();

  // Computed values
  const flavorsheets = useMemo(() => {
    if (!searchTerm) return allFlavorsheets || [];
    
    // Client-side filtering by flavor code
    return (allFlavorsheets || []).filter((flavorsheet: any) => 
      flavorsheet.flavor_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allFlavorsheets, searchTerm]);

  // Current loading state
  const isCurrentlyLoading = allLoading;

  // Event handlers
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleCreateBatch = async (flavorsheet: FlavorsheetItem) => {
    try {
      await createBatchMutation.mutateAsync({
        flavorsheet_id: flavorsheet.id,
        production_date: new Date().toISOString(),
      });
      // Success handling would show a toast notification
    } catch (error) {
      console.error('Failed to create batch:', error);
    }
  };

  // Loading state
  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
        <span className="ml-2 text-lg">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#237c4b' }}>🌿 Flavour Operations Dashboard</h1>
          <p className="text-gray-600">
            Flavor Production Management • Active Flavors: 1225 • Batches: 111
          </p>
        </div>
          
        {/* Global Search */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search flavour code..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-96"
            />
          </div>
          
          {/* Quick Actions */}
          <button className="flex items-center space-x-2 bg-tea-600 hover:bg-tea-700 px-4 py-2 rounded-md transition-colors text-white">
            <RefreshCw className="h-4 w-4" />
            <span>Batch</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-1">
        <KpiCard
          title="Flavour Sheet Number"
          value={dashboardData?.active_flavorsheets || 1225}
          icon={Package2}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
        />
      </div>


      {/* Main Content - Only Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Flavorsheets ({flavorsheets.length} results)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isCurrentlyLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
              <span className="ml-2">Loading flavorsheets...</span>
            </div>
          ) : flavorsheets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm.length >= 2 ? 'No flavorsheets found for your search.' : 'No flavorsheets available.'}
            </div>
          ) : (
            /* Table View Only */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6 py-3">Code</TableHead>
                    <TableHead className="px-6 py-3">Name</TableHead>
                    <TableHead className="px-6 py-3">Mixtures</TableHead>
                    <TableHead className="px-6 py-3">Batches</TableHead>
                    <TableHead className="px-6 py-3">Last Activity</TableHead>
                    <TableHead className="px-6 py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flavorsheets.map((flavorsheet: any) => (
                    <FlavorsheetRow
                      key={flavorsheet.id}
                      flavorsheet={flavorsheet}
                      onClick={() => {}}
                      onCreateBatch={() => handleCreateBatch(flavorsheet)}
                    />
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


// Flavorsheet Row Component (Table View)
interface FlavorsheetRowProps {
  flavorsheet: FlavorsheetItem;
  onClick: () => void;
  onCreateBatch: () => void;
}

function FlavorsheetRow({ flavorsheet, onClick, onCreateBatch }: FlavorsheetRowProps) {
  const totalWeight = flavorsheet.mixtures.reduce((sum, m) => sum + m.weight, 0);
  
  return (
    <TableRow 
      className="hover:bg-gray-50"
    >
      <TableCell className="font-medium text-tea-green-600">
        <div 
          className="cursor-pointer"
          onClick={onClick}
        >
          {flavorsheet.flavor_code}
        </div>
      </TableCell>
      <TableCell className="text-gray-900">
        {flavorsheet.flavorsheet_no}
      </TableCell>
      <TableCell className="text-gray-600">
        {flavorsheet.mixtures.length} types • {totalWeight.toFixed(0)}kg
      </TableCell>
      <TableCell>
        <Badge variant={flavorsheet.batch_created ? 'default' : 'warning'}>
          {flavorsheet.batch_created ? 'Has Batches' : 'No Batches'}
        </Badge>
      </TableCell>
      <TableCell className="text-gray-600">
        {new Date(flavorsheet.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCreateBatch();
          }}
          className="bg-tea-green-500 text-white px-3 py-1 rounded text-sm hover:bg-tea-green-600 transition-colors"
        >
          Batch
        </button>
      </TableCell>
    </TableRow>
  );
}

