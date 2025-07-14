import { useState, useMemo } from 'react';
import { 
  Scan, 
  Package, 
  Leaf, 
  Sparkles, 
  Flower2, 
  Scale, 
  History, 
  Calendar,
  Barcode,
  CheckCircle
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { 
  useTealineInventory,
  useAdminBlendsheets,
  useAdminFlavorsheets,
  useAdminHerblines,
  useAdminBlendbalances
} from '../hooks';

// Types for universal scanning
interface ScanResult {
  barcode: string;
  materialType: 'Tealine' | 'Blendsheet' | 'Flavorsheet' | 'Herbline' | 'Blendbalance';
  itemCode: string;
  itemName: string;
  status: string;
  location?: string;
  weight?: number;
  grade?: string;
  garden?: string;
  batchInfo?: string;
  allocations?: AllocationInfo[];
  lastScanTime: string;
  scanCount: number;
}

interface AllocationInfo {
  targetType: string;
  targetId: string;
  allocatedWeight: number;
  allocationDate: string;
}

interface ScanHistory {
  timestamp: string;
  barcode: string;
  materialType: string;
  itemCode: string;
  scanType: 'LOOKUP' | 'ALLOCATION' | 'SHIPMENT';
  result: 'SUCCESS' | 'NOT_FOUND' | 'ERROR';
}

// Material type configuration
const MATERIAL_TYPE_CONFIG = {
  Tealine: { icon: Package, color: 'blue', bgColor: 'bg-blue-50' },
  Blendsheet: { icon: Leaf, color: 'green', bgColor: 'bg-green-50' },
  Flavorsheet: { icon: Sparkles, color: 'purple', bgColor: 'bg-purple-50' },
  Herbline: { icon: Flower2, color: 'pink', bgColor: 'bg-pink-50' },
  Blendbalance: { icon: Scale, color: 'orange', bgColor: 'bg-orange-50' }
} as const;

export function UniversalScanner() {
  const [scanInput, setScanInput] = useState('');
  const [scanMode, setScanMode] = useState<string>('lookup');
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>('all');
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Fetch data from all material types for scanning
  const { data: tealineResponse, isLoading: tealineLoading } = useTealineInventory();
  const tealineData = Array.isArray(tealineResponse) ? tealineResponse : (tealineResponse?.data || []);
  const { data: blendsheetData = [], isLoading: blendsheetLoading } = useAdminBlendsheets();
  const { data: flavorsheetData = [], isLoading: flavorsheetLoading } = useAdminFlavorsheets() as { data: any[], isLoading: boolean };
  const { data: herblineData = [], isLoading: herblineLoading } = useAdminHerblines();
  const { data: blendbalanceData = [], isLoading: blendbalanceLoading } = useAdminBlendbalances();

  const isLoading = tealineLoading || blendsheetLoading || flavorsheetLoading || 
                    herblineLoading || blendbalanceLoading;

  // Generate comprehensive barcode database
  const barcodeDatabase = useMemo(() => {
    const database = new Map<string, ScanResult>();

    // Add tealine barcodes
    tealineData.forEach((item: any, index: any) => {
      const barcode = `TEA-${item.item_code}-${Date.now().toString().slice(-6)}`;
      database.set(barcode, {
        barcode,
        materialType: 'Tealine',
        itemCode: item.item_code,
        itemName: `${item.garden || 'Unknown Garden'} - ${item.grade || 'Unknown Grade'}`,
        status: item.status || 'ACCEPTED',
        location: item.location,
        weight: item.remaining,
        grade: item.grade,
        garden: item.garden,
        allocations: [
          {
            targetType: 'Blendsheet',
            targetId: `BS00${index + 1}`,
            allocatedWeight: Math.round((item.remaining || 0) * 0.8),
            allocationDate: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        lastScanTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        scanCount: Math.floor(Math.random() * 20) + 1
      });
    });

    // Add blendsheet barcodes
    blendsheetData.forEach((item, index) => {
      const barcode = `BLD-${item.blendsheet_no}-${Date.now().toString().slice(-6)}`;
      database.set(barcode, {
        barcode,
        materialType: 'Blendsheet',
        itemCode: item.blendsheet_no,
        itemName: item.standard,
        status: item.status || 'IN_PROGRESS',
        weight: item.actual_weight,
        batchInfo: `${item.created_batches}/${item.no_of_batches} batches`,
        allocations: [
          {
            targetType: 'Shipment',
            targetId: `SHIP-00${index + 1}`,
            allocatedWeight: item.actual_weight,
            allocationDate: new Date(Date.now() - index * 12 * 60 * 60 * 1000).toISOString()
          }
        ],
        lastScanTime: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
        scanCount: Math.floor(Math.random() * 15) + 1
      });
    });

    // Add flavorsheet barcodes
    flavorsheetData.forEach((item, index) => {
      const barcode = `FLV-${item.flavorsheet_no}-${Date.now().toString().slice(-6)}`;
      database.set(barcode, {
        barcode,
        materialType: 'Flavorsheet',
        itemCode: item.flavorsheet_no,
        itemName: item.flavor_code,
        status: item.batch_created ? 'IN_PROCESS' : 'ACCEPTED',
        batchInfo: item.batch_created ? 'Batch Created' : 'Awaiting Batch',
        allocations: [
          {
            targetType: 'Blendsheet',
            targetId: `BS-FL-00${index + 1}`,
            allocatedWeight: 150 + index * 25,
            allocationDate: new Date(Date.now() - index * 18 * 60 * 60 * 1000).toISOString()
          }
        ],
        lastScanTime: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
        scanCount: Math.floor(Math.random() * 10) + 1
      });
    });

    // Add herbline barcodes
    herblineData.forEach((item, index) => {
      const barcode = `HRB-${item.item_code}-${Date.now().toString().slice(-6)}`;
      const totalWeight = item.record_list?.reduce((sum: any, rec: any) => sum + rec.remaining, 0) || 0;
      database.set(barcode, {
        barcode,
        materialType: 'Herbline',
        itemCode: item.item_code,
        itemName: item.item_name,
        status: totalWeight === 0 ? 'PROCESSED' : totalWeight < item.weight ? 'IN_PROCESS' : 'ACCEPTED',
        location: item.record_list?.[0]?.store_location,
        weight: totalWeight,
        allocations: [
          {
            targetType: 'Blendsheet',
            targetId: `BS-HR-00${index + 1}`,
            allocatedWeight: Math.round(totalWeight * 0.7),
            allocationDate: new Date(Date.now() - index * 16 * 60 * 60 * 1000).toISOString()
          }
        ],
        lastScanTime: new Date(Date.now() - Math.random() * 4 * 24 * 60 * 60 * 1000).toISOString(),
        scanCount: Math.floor(Math.random() * 8) + 1
      });
    });

    // Add blendbalance barcodes
    blendbalanceData.forEach((item, index) => {
      const barcode = `BBL-${item.item_code}-${Date.now().toString().slice(-6)}`;
      database.set(barcode, {
        barcode,
        materialType: 'Blendbalance',
        itemCode: item.item_code,
        itemName: `${item.blend_code} - ${item.transfer_id}`,
        status: item.record_list && item.record_list.length > 0 ? 'IN_PROCESS' : 'ACCEPTED',
        weight: item.weight,
        allocations: [
          {
            targetType: 'Blendsheet',
            targetId: `BS-BB-00${index + 1}`,
            allocatedWeight: Math.round(item.weight * 0.9),
            allocationDate: new Date(Date.now() - index * 14 * 60 * 60 * 1000).toISOString()
          }
        ],
        lastScanTime: new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000).toISOString(),
        scanCount: Math.floor(Math.random() * 12) + 1
      });
    });

    return database;
  }, [tealineData, blendsheetData, flavorsheetData, herblineData, blendbalanceData]);

  // Generate scan history
  const scanHistory = useMemo((): ScanHistory[] => {
    const history: ScanHistory[] = [];
    const barcodes = Array.from(barcodeDatabase.keys());
    
    for (let i = 0; i < 20; i++) {
      const randomBarcode = barcodes[Math.floor(Math.random() * barcodes.length)];
      const scanResult = barcodeDatabase.get(randomBarcode);
      
      if (scanResult) {
        history.push({
          timestamp: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
          barcode: randomBarcode,
          materialType: scanResult.materialType,
          itemCode: scanResult.itemCode,
          scanType: ['LOOKUP', 'ALLOCATION', 'SHIPMENT'][Math.floor(Math.random() * 3)] as any,
          result: Math.random() > 0.1 ? 'SUCCESS' : 'NOT_FOUND'
        });
      }
    }
    
    return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [barcodeDatabase]);

  // Handle barcode scan
  const handleScan = async () => {
    if (!scanInput.trim()) return;
    
    setIsScanning(true);
    
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = barcodeDatabase.get(scanInput) || null;
    setCurrentScan(result);
    setIsScanning(false);
    
    // Add to history (in real app, this would be sent to backend)
    if (result) {
      console.log('Scan successful:', result);
    } else {
      console.log('Barcode not found:', scanInput);
    }
  };

  // Filter scan history
  const filteredHistory = useMemo(() => {
    return scanHistory.filter(scan => {
      if (selectedMaterialType === 'all') return true;
      return scan.materialType.toLowerCase() === selectedMaterialType;
    });
  }, [scanHistory, selectedMaterialType]);

  // Quick scan buttons (predefined barcodes for demo)
  const quickScanBarcodes = useMemo(() => {
    const barcodes = Array.from(barcodeDatabase.keys());
    return barcodes.slice(0, 6);
  }, [barcodeDatabase]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loading size="lg" />
        <p className="mt-4 text-sm text-gray-600">Loading barcode scanner...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Universal Barcode Scanner</h2>
        <p className="mt-1 text-sm text-gray-500">
          Scan barcodes to lookup materials, track allocations, and manage inventory
        </p>
      </div>

      {/* Scanner Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Barcodes</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {barcodeDatabase.size}
              </p>
            </div>
            <Barcode className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Material Types</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">5</p>
            </div>
            <Package className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Scans</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {scanHistory.length}
              </p>
            </div>
            <History className="h-8 w-8 text-tea-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {Math.round((scanHistory.filter(s => s.result === 'SUCCESS').length / scanHistory.length) * 100)}%
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Scanner Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scan Input */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Barcode Scanner</h3>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter or scan barcode..."
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleScan()}
              />
              <button
                onClick={handleScan}
                disabled={isScanning || !scanInput.trim()}
                className="px-4 py-2 bg-tea-600 text-white rounded-md hover:bg-tea-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isScanning ? (
                  <Loading size="sm" />
                ) : (
                  <Scan className="h-4 w-4" />
                )}
                <span>{isScanning ? 'Scanning...' : 'Scan'}</span>
              </button>
            </div>

            <div className="flex space-x-2">
              <Select
                value={scanMode}
                onValueChange={setScanMode}
                placeholder="Scan Mode"
                options={[
                  { value: 'lookup', label: 'Material Lookup' },
                  { value: 'allocation', label: 'Allocation Tracking' },
                  { value: 'shipment', label: 'Shipment Verification' }
                ]}
              />
            </div>

            {/* Quick Scan Buttons */}
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Quick Scan (Demo):</p>
              <div className="grid grid-cols-2 gap-2">
                {quickScanBarcodes.map((barcode) => (
                  <button
                    key={barcode}
                    onClick={() => setScanInput(barcode)}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    {barcode.substring(0, 12)}...
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Scan Result */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Result</h3>
          
          {currentScan ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${MATERIAL_TYPE_CONFIG[currentScan.materialType].bgColor}`}>
                <div className="flex items-center space-x-3">
                  {(() => {
                    const Icon = MATERIAL_TYPE_CONFIG[currentScan.materialType].icon;
                    return <Icon className="h-8 w-8 text-gray-700" />;
                  })()}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{currentScan.itemName}</h4>
                    <p className="text-sm text-gray-600">{currentScan.materialType}: {currentScan.itemCode}</p>
                  </div>
                  <Badge variant={
                    currentScan.status === 'PROCESSED' ? 'success' :
                    currentScan.status === 'IN_PROCESS' ? 'warning' : 'info'
                  }>
                    {currentScan.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Barcode</p>
                  <p className="font-mono text-gray-900">{currentScan.barcode}</p>
                </div>
                {currentScan.weight && (
                  <div>
                    <p className="text-gray-600">Weight</p>
                    <p className="font-medium text-gray-900">{currentScan.weight.toLocaleString()} kg</p>
                  </div>
                )}
                {currentScan.location && (
                  <div>
                    <p className="text-gray-600">Location</p>
                    <p className="font-medium text-gray-900">📍 {currentScan.location}</p>
                  </div>
                )}
                {currentScan.grade && (
                  <div>
                    <p className="text-gray-600">Grade</p>
                    <p className="font-medium text-gray-900">{currentScan.grade}</p>
                  </div>
                )}
                {currentScan.garden && (
                  <div>
                    <p className="text-gray-600">Garden</p>
                    <p className="font-medium text-gray-900">{currentScan.garden}</p>
                  </div>
                )}
                {currentScan.batchInfo && (
                  <div>
                    <p className="text-gray-600">Batch Info</p>
                    <p className="font-medium text-gray-900">{currentScan.batchInfo}</p>
                  </div>
                )}
              </div>

              {currentScan.allocations && currentScan.allocations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Allocations</p>
                  <div className="space-y-2">
                    {currentScan.allocations.map((allocation, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{allocation.targetId}</p>
                          <p className="text-xs text-gray-500">{allocation.targetType}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{allocation.allocatedWeight.toLocaleString()} kg</p>
                          <p className="text-xs text-gray-500">
                            {new Date(allocation.allocationDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 border-t pt-2">
                <div className="flex justify-between">
                  <span>Last scanned: {new Date(currentScan.lastScanTime).toLocaleString()}</span>
                  <span>Scan count: {currentScan.scanCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Scan className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Enter a barcode above to see scan results</p>
              <p className="text-sm">or use the Quick Scan buttons for demo</p>
            </div>
          )}
        </Card>
      </div>

      {/* Scan History */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Scan History</h3>
          <Select
            value={selectedMaterialType}
            onValueChange={setSelectedMaterialType}
            placeholder="All Material Types"
            options={[
              { value: 'all', label: 'All Material Types' },
              { value: 'tealine', label: 'Tealine' },
              { value: 'blendsheet', label: 'Blendsheet' },
              { value: 'flavorsheet', label: 'Flavorsheet' },
              { value: 'herbline', label: 'Herbline' },
              { value: 'blendbalance', label: 'Blendbalance' }
            ]}
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Material Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scan Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistory.map((scan, index) => {
                const materialConfig = MATERIAL_TYPE_CONFIG[scan.materialType as keyof typeof MATERIAL_TYPE_CONFIG];
                const Icon = materialConfig?.icon || Package;
                
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(scan.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {scan.barcode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-900">{scan.materialType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {scan.itemCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {scan.scanType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={scan.result === 'SUCCESS' ? 'success' : 'error'}>
                        {scan.result}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No scan history found
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}