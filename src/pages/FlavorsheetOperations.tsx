import React, { useState } from "react";
import {
  RefreshCw,
  Search,
  TrendingUp,
  Package2,
  BarChart3,
  Loader2,
  FileDown,
  FileText,
  Scale,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { KpiCard } from "../components/ui/KpiCard";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { useFlavorsheets, useFlavorsheetDashboard } from "../hooks/useFlavorsheet";
import {
  exportToCSV,
  exportToPDF,
  formatDateForExport,
  formatWeightForExport,
  formatPercentageForExport,
  type ExportColumn,
} from "../utils/exportUtils";

type TabType = "flavorsheets" | "summary" | "flavorbalance" | "analytics";

export function FlavorsheetOperations() {
  const [activeTab, setActiveTab] = useState<TabType>("flavorsheets");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch flavorsheet data
  const {
    error,
    refetch,
    isLoading: isLoadingSummary,
  } = useFlavorsheets({
    ...(statusFilter && { status: statusFilter }),
    ...(searchTerm && { search: searchTerm }),
  });

  // Fetch flavorsheet dashboard data
  const {
    data: flavorsheetSummary,
  } = useFlavorsheetDashboard();

  // Mock flavorsheet data with expandable formula details
  const mockFlavorsheetData = [
    {
      id: "1",
      flavorsheetNumber: "FS001",
      flavorName: "Earl Grey Supreme",
      totalWeight: "2,500 kg",
      mixedWeight: "2,485 kg",
      outWeight: "2,470 kg",
      numberOfFormulas: 4,
      mixInTime: "09:00",
      mixOutTime: "14:30",
      efficiency: "98.8%",
      status: "COMPLETED",
      formulas: [
        {
          formulaId: "F001",
          ingredientCode: "BOP001",
          ingredient: "Black Orange Pekoe",
          weight: "1,200 kg",
          percentage: "48.0%",
          addTime: "09:00",
          status: "Added"
        },
        {
          formulaId: "F002",
          ingredientCode: "EG002",
          ingredient: "Earl Grey Oil",
          weight: "50 kg",
          percentage: "2.0%",
          addTime: "12:00",
          status: "Added"
        },
        {
          formulaId: "F003",
          ingredientCode: "COR003",
          ingredient: "Cornflower Petals",
          weight: "125 kg",
          percentage: "5.0%",
          addTime: "13:15",
          status: "Added"
        },
        {
          formulaId: "F004",
          ingredientCode: "BER004",
          ingredient: "Bergamot Essence",
          weight: "75 kg",
          percentage: "3.0%",
          addTime: "14:00",
          status: "Added"
        }
      ]
    },
    {
      id: "2",
      flavorsheetNumber: "FS002",
      flavorName: "Jasmine Dragon Pearls",
      totalWeight: "1,800 kg",
      mixedWeight: "1,785 kg",
      outWeight: "1,770 kg",
      numberOfFormulas: 3,
      mixInTime: "15:00",
      mixOutTime: "19:45",
      efficiency: "98.3%",
      status: "COMPLETED",
      formulas: [
        {
          formulaId: "F005",
          ingredientCode: "GP001",
          ingredient: "Green Pearls Base",
          weight: "1,400 kg",
          percentage: "77.8%",
          addTime: "15:00",
          status: "Added"
        },
        {
          formulaId: "F006",
          ingredientCode: "JAS002",
          ingredient: "Jasmine Flowers",
          weight: "300 kg",
          percentage: "16.7%",
          addTime: "17:30",
          status: "Added"
        },
        {
          formulaId: "F007",
          ingredientCode: "JOI003",
          ingredient: "Jasmine Oil",
          weight: "85 kg",
          percentage: "4.7%",
          addTime: "19:00",
          status: "Added"
        }
      ]
    },
    {
      id: "3",
      flavorsheetNumber: "FS003",
      flavorName: "Chai Masala Blend",
      totalWeight: "2,200 kg",
      mixedWeight: "2,190 kg",
      outWeight: "0 kg",
      numberOfFormulas: 5,
      mixInTime: "10:30",
      mixOutTime: "-",
      efficiency: "0.0%",
      status: "IN_PROGRESS",
      formulas: [
        {
          formulaId: "F008",
          ingredientCode: "BLA001",
          ingredient: "Black Tea Base",
          weight: "1,100 kg",
          percentage: "50.0%",
          addTime: "10:30",
          status: "Added"
        },
        {
          formulaId: "F009",
          ingredientCode: "CIN002",
          ingredient: "Ceylon Cinnamon",
          weight: "220 kg",
          percentage: "10.0%",
          addTime: "12:00",
          status: "Added"
        },
        {
          formulaId: "F010",
          ingredientCode: "CAR003",
          ingredient: "Green Cardamom",
          weight: "330 kg",
          percentage: "15.0%",
          addTime: "13:30",
          status: "Added"
        },
        {
          formulaId: "F011",
          ingredientCode: "GIN004",
          ingredient: "Fresh Ginger",
          weight: "440 kg",
          percentage: "20.0%",
          addTime: "14:45",
          status: "Pending"
        },
        {
          formulaId: "F012",
          ingredientCode: "CLS005",
          ingredient: "Whole Cloves",
          weight: "110 kg",
          percentage: "5.0%",
          addTime: "-",
          status: "Pending"
        }
      ]
    }
  ];

  // Mock flavorbalance data for the Flavor Balance tab
  const mockFlavorbalanceData = [
    { transfer_id: "TRF-F001", flavor_code: "FL-2024-001", weight: 450.5 },
    { transfer_id: "TRF-F002", flavor_code: "FL-2024-002", weight: 380.0 },
    { transfer_id: "TRF-F003", flavor_code: "FL-2024-003", weight: 520.75 },
    { transfer_id: "TRF-F004", flavor_code: "FL-2024-004", weight: 275.25 },
    { transfer_id: "TRF-F005", flavor_code: "FL-2024-005", weight: 395.8 },
  ];

  const statusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" },
    { value: "SHIPPED", label: "Shipped" },
  ];

  // Use mock data for now - expand to test pagination
  const expandedMockData = [
    ...mockFlavorsheetData,
    // Add more mock items to test pagination
    {
      id: "4",
      flavorsheetNumber: "FS004",
      flavorName: "English Breakfast Premium",
      totalWeight: "3,000 kg",
      mixedWeight: "2,995 kg",
      outWeight: "2,980 kg",
      numberOfFormulas: 3,
      mixInTime: "08:00",
      mixOutTime: "12:30",
      efficiency: "99.3%",
      status: "COMPLETED",
      formulas: [
        {
          formulaId: "F013",
          ingredientCode: "CEY001",
          ingredient: "Ceylon Black Tea",
          weight: "1,500 kg",
          percentage: "50.0%",
          addTime: "08:00",
          status: "Added"
        },
        {
          formulaId: "F014",
          ingredientCode: "ASS002",
          ingredient: "Assam Tea",
          weight: "900 kg",
          percentage: "30.0%",
          addTime: "10:00",
          status: "Added"
        },
        {
          formulaId: "F015",
          ingredientCode: "KEE003",
          ingredient: "Keemun Tea",
          weight: "600 kg",
          percentage: "20.0%",
          addTime: "11:30",
          status: "Added"
        }
      ]
    },
    {
      id: "5",
      flavorsheetNumber: "FS005",
      flavorName: "Chamomile Dreams",
      totalWeight: "1,200 kg",
      mixedWeight: "1,190 kg",
      outWeight: "0 kg",
      numberOfFormulas: 2,
      mixInTime: "14:00",
      mixOutTime: "-",
      efficiency: "0.0%",
      status: "IN_PROGRESS",
      formulas: [
        {
          formulaId: "F016",
          ingredientCode: "CHA001",
          ingredient: "Chamomile Flowers",
          weight: "960 kg",
          percentage: "80.0%",
          addTime: "14:00",
          status: "Added"
        },
        {
          formulaId: "F017",
          ingredientCode: "HON002",
          ingredient: "Honey Granules",
          weight: "240 kg",
          percentage: "20.0%",
          addTime: "-",
          status: "Pending"
        }
      ]
    }
  ];
  
  const displayData = expandedMockData;
  const totalItems = expandedMockData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset to first page when filters change
  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (pageSize: number) => {
    setItemsPerPage(pageSize);
    setCurrentPage(1);
  };

  const toggleRowExpansion = (rowId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowId)) {
      newExpandedRows.delete(rowId);
    } else {
      newExpandedRows.add(rowId);
    }
    setExpandedRows(newExpandedRows);
  };


  // Export functions
  const handleExportFlavorsheets = (format: "csv" | "pdf") => {
    const columns: ExportColumn[] = [
      { key: "flavorsheet_no", header: "Flavorsheet Number" },
      { key: "flavor_name", header: "Flavor Name" },
      { key: "status", header: "Status" },
      { key: "total_weight", header: "Total Weight (kg)" },
      { key: "mixed_weight", header: "Mixed Weight (kg)" },
      { key: "efficiency", header: "Efficiency (%)" },
      { key: "formulas_count", header: "Number of Formulas" },
      { key: "created_ts", header: "Created Date" },
    ];

    const exportData = displayData.map((item: any) => ({
      ...item,
      total_weight: formatWeightForExport(item.actual_weight || 0),
      mixed_weight: formatWeightForExport(item.actual_weight || 0),
      efficiency: formatPercentageForExport(item.efficiency || 0),
      formulas_count: item.numberOfFormulas || 0,
      created_ts: item.created_ts ? formatDateForExport(item.created_ts) : "N/A",
    }));

    const filename = `flavorsheet_operations_${new Date().toISOString().split("T")[0]}`;

    if (format === "csv") {
      exportToCSV(exportData, filename, columns);
    } else {
      exportToPDF(
        exportData,
        filename,
        columns,
        "Flavorsheet Operations Report",
        `Generated on ${new Date().toLocaleDateString()} • Total Flavorsheets: ${totalItems}`
      );
    }
  };


  // Use flavorsheet summary data for KPIs if available, otherwise use mock data
  const totalFlavorsheets = flavorsheetSummary?.active_flavorsheets || totalItems || 5;
  const totalPlanned = 15000; // Mock planned weight
  const totalEffectiveMixIn = 14800; // Mock effective mix in
  const totalMixOut = 14500; // Mock mix out

  if (isLoadingSummary) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
        <span className="ml-2 text-lg">Loading flavorsheets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading flavorsheets: {error.message}</p>
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
          <h2 className="text-2xl font-bold" style={{ color: "#237c4b" }}>
            Flavorsheet Operations
          </h2>
          <p className="text-gray-600">Flavor formulation analysis and mixing progress tracking</p>
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
              onClick={() => handleExportFlavorsheets("csv")}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => handleExportFlavorsheets("pdf")}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards - Updated to match flavorsheet-flow page */}
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard
          title="Total Flavorsheets"
          value={totalFlavorsheets}
          icon={Package2}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
          trendValue="Flavor operations overview"
          trendColor="text-gray-500"
        />

        <KpiCard
          title="Total Planned"
          value={`${totalPlanned.toLocaleString()} kg`}
          icon={Package2}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
          trendValue="Planned weight"
          trendColor="text-gray-500"
        />

        <KpiCard
          title="Total Effective Mix In"
          value={`${totalEffectiveMixIn.toLocaleString()} kg`}
          icon={BarChart3}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
          trendValue="Actual input weight"
          trendColor="text-gray-500"
        />

        <KpiCard
          title="Total Mix Out"
          value={`${totalMixOut.toLocaleString()} kg`}
          icon={TrendingUp}
          iconColor="#237c4b"
          iconBgColor="#d9f2e3"
          trendValue="Output produced"
          trendColor="text-gray-500"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by flavorsheet code..."
                  value={searchTerm}
                  onChange={(e) => handleFilterChange(setSearchTerm)(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={handleFilterChange(setStatusFilter)}
              placeholder="All Status"
              options={statusOptions}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("flavorsheets")}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "flavorsheets"
                  ? "border-tea-600 text-tea-600 bg-tea-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Package2 className="h-4 w-4" />
              Flavorsheets ({totalItems})
            </button>
            <button
              onClick={() => setActiveTab("flavorbalance")}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "flavorbalance"
                  ? "border-tea-600 text-tea-600 bg-tea-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Scale className="h-4 w-4" />
              Flavor Balance
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      {activeTab === "flavorsheets" && (
        <Card>
          <CardHeader>
            <CardTitle>
              Flavorsheets ({totalItems} total)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-3 w-8"> </TableHead>
                  <TableHead className="px-6 py-3">Flavorsheet Number</TableHead>
                  <TableHead className="px-6 py-3">Total Weight</TableHead>
                  <TableHead className="px-6 py-3">Mixed Weight</TableHead>
                  <TableHead className="px-6 py-3">Out Weight</TableHead>
                  <TableHead className="px-6 py-3">Formulas</TableHead>
                  <TableHead className="px-6 py-3">Mix In Time</TableHead>
                  <TableHead className="px-6 py-3">Mix Out Time</TableHead>
                  <TableHead className="px-6 py-3">Efficiency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((item) => (
                  <React.Fragment key={item.id}>
                    <TableRow 
                      onClick={() => toggleRowExpansion(item.id)}
                    >
                      <TableCell className="px-6 py-4">
                        {expandedRows.has(item.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-medium">
                        {item.flavorsheetNumber}
                      </TableCell>
                      <TableCell className="px-6 py-4">{item.totalWeight}</TableCell>
                      <TableCell className="px-6 py-4">{item.mixedWeight}</TableCell>
                      <TableCell className="px-6 py-4">{item.outWeight}</TableCell>
                      <TableCell className="px-6 py-4">{item.numberOfFormulas}</TableCell>
                      <TableCell className="px-6 py-4">{item.mixInTime}</TableCell>
                      <TableCell className="px-6 py-4">{item.mixOutTime}</TableCell>
                      <TableCell className="px-6 py-4">
                        <span className={
                          parseFloat(item.efficiency) > 95
                            ? "text-green-600 font-medium"
                            : parseFloat(item.efficiency) > 90
                            ? "text-amber-600"
                            : parseFloat(item.efficiency) > 0
                            ? "text-red-600"
                            : "text-gray-400"
                        }>
                          {item.efficiency}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Expanded formula details */}
                    {expandedRows.has(item.id) && (
                      <TableRow key={`${item.id}-expanded`}>
                        <TableCell colSpan={9} className="px-0 py-0 bg-gray-50">
                          <div className="p-4">
                            <h3 className="font-medium text-gray-900 mb-3">
                              Formula Details for {item.flavorName}
                            </h3>
                            
                            {/* Child Table Header */}
                            <div className="bg-gray-200 border border-gray-300 rounded-t-lg">
                              <div className="grid grid-cols-7 gap-4 p-3 text-sm font-medium text-gray-900">
                                <div>Formula ID</div>
                                <div>Ingredient Code</div>
                                <div>Ingredient Name</div>
                                <div>Weight</div>
                                <div>Percentage</div>
                                <div>Add Time</div>
                                <div>Status</div>
                              </div>
                            </div>
                            
                            {/* Child Table Body */}
                            <div className="border-x border-b border-gray-300 divide-y divide-gray-200 rounded-b-lg">
                              {item.formulas.map((formula) => (
                                <div 
                                  key={formula.formulaId}
                                  className="grid grid-cols-7 gap-4 p-3 text-sm hover:bg-white"
                                >
                                  <div className="font-medium">{formula.formulaId}</div>
                                  <div className="font-mono text-blue-600">{formula.ingredientCode}</div>
                                  <div className="font-medium">{formula.ingredient}</div>
                                  <div>{formula.weight}</div>
                                  <div className="font-medium text-green-600">{formula.percentage}</div>
                                  <div>{formula.addTime}</div>
                                  <div>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      formula.status === "Added" 
                                        ? "bg-green-100 text-green-800" 
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}>
                                      {formula.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </CardContent>
        </Card>
      )}


      {/* Flavor Balance Tab */}
      {activeTab === "flavorbalance" && (
        <Card>
          <CardHeader>
            <CardTitle>Flavor Balance Operations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-3">Transfer ID</TableHead>
                  <TableHead className="px-6 py-3">Flavor Code</TableHead>
                  <TableHead className="px-6 py-3">Weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockFlavorbalanceData.map((item) => (
                  <TableRow key={item.transfer_id}>
                    <TableCell className="px-6 py-4 font-medium">{item.transfer_id}</TableCell>
                    <TableCell className="px-6 py-4">{item.flavor_code}</TableCell>
                    <TableCell className="px-6 py-4">{item.weight.toFixed(2)} kg</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}