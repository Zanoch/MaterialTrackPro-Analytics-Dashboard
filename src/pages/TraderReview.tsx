import { useState, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
 
  User, 
  Calendar,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Package,
  Leaf,
  Sparkles,
  Flower2,
  Scale,
  Search
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { 
  useAdminBlendsheets,
  useAdminFlavorsheets,
  useAdminHerblines,
  useAdminBlendbalances,
  useTealineInventory
} from '../hooks';

// Types for trader review system
interface ReviewItem {
  id: string;
  materialType: 'Tealine' | 'Blendsheet' | 'Flavorsheet' | 'Herbline' | 'Blendbalance';
  itemCode: string;
  itemName: string;
  submittedBy: string;
  submittedDate: Date;
  reviewType: 'QUALITY_APPROVAL' | 'BATCH_APPROVAL' | 'SPECIFICATION_REVIEW' | 'EXPORT_APPROVAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REQUIRES_CHANGES';
  assignedTrader: string;
  reviewNotes?: string;
  qualityMetrics?: QualityMetrics;
  attachments?: string[];
  deadline: Date;
  lastUpdated: Date;
  approvalHistory: ApprovalAction[];
}

interface QualityMetrics {
  moisture_content?: number;
  grade_classification?: string;
  color_analysis?: string;
  taste_profile?: string;
  overall_score?: number;
  meets_specification?: boolean;
}

interface ApprovalAction {
  timestamp: Date;
  action: 'SUBMITTED' | 'ASSIGNED' | 'REVIEWED' | 'APPROVED' | 'REJECTED' | 'COMMENTED';
  user: string;
  notes?: string;
}

interface TraderWorkload {
  traderId: string;
  traderName: string;
  pendingReviews: number;
  completedThisWeek: number;
  averageReviewTime: number;
  specializations: string[];
  availability: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
}

// Material type configuration
const MATERIAL_TYPE_CONFIG = {
  Tealine: { icon: Package, color: 'blue', bgColor: 'bg-blue-50' },
  Blendsheet: { icon: Leaf, color: 'green', bgColor: 'bg-green-50' },
  Flavorsheet: { icon: Sparkles, color: 'purple', bgColor: 'bg-purple-50' },
  Herbline: { icon: Flower2, color: 'pink', bgColor: 'bg-pink-50' },
  Blendbalance: { icon: Scale, color: 'orange', bgColor: 'bg-orange-50' }
} as const;

export function TraderReview() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>('all');
  const [selectedTrader, setSelectedTrader] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'workload' | 'analytics'>('list');
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);

  // Fetch data from all material types
  const { data: tealineResponse, isLoading: tealineLoading } = useTealineInventory();
  const tealineData = Array.isArray(tealineResponse) ? tealineResponse : (tealineResponse?.data || []);
  const { data: blendsheetData = [], isLoading: blendsheetLoading } = useAdminBlendsheets();
  const { data: flavorsheetData = [], isLoading: flavorsheetLoading } = useAdminFlavorsheets() as { data: any[], isLoading: boolean };
  const { data: herblineData = [], isLoading: herblineLoading } = useAdminHerblines();
  const { data: blendbalanceData = [], isLoading: blendbalanceLoading } = useAdminBlendbalances();

  const isLoading = tealineLoading || blendsheetLoading || flavorsheetLoading || 
                    herblineLoading || blendbalanceLoading;

  // Generate review items from material data
  const reviewItems = useMemo((): ReviewItem[] => {
    const items: ReviewItem[] = [];
    const traders = ['Sarah Chen', 'Michael Roberts', 'David Kumar', 'Lisa Wong', 'James Wilson'];
    const reviewTypes = ['QUALITY_APPROVAL', 'BATCH_APPROVAL', 'SPECIFICATION_REVIEW', 'EXPORT_APPROVAL'] as const;
    const statuses = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REQUIRES_CHANGES'] as const;

    // Generate tealine reviews
    tealineData.slice(0, 8).forEach((item: any, index: any) => {
      const submittedDate = new Date(Date.now() - (index * 2 + 1) * 24 * 60 * 60 * 1000);
      const deadline = new Date(submittedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      items.push({
        id: `tealine-review-${item.item_code}-${item.created_ts}`,
        materialType: 'Tealine',
        itemCode: item.item_code,
        itemName: `${item.garden || 'Unknown Garden'} - ${item.grade || 'Unknown Grade'}`,
        submittedBy: `QC Officer ${(index % 3) + 1}`,
        submittedDate,
        reviewType: reviewTypes[index % reviewTypes.length],
        priority: index < 2 ? 'HIGH' : index < 5 ? 'MEDIUM' : 'LOW',
        status: statuses[index % statuses.length],
        assignedTrader: traders[index % traders.length],
        qualityMetrics: {
          moisture_content: 12 + Math.random() * 3,
          grade_classification: item.grade || 'BOP',
          color_analysis: ['Dark', 'Medium', 'Light'][index % 3],
          taste_profile: ['Strong', 'Mild', 'Aromatic'][index % 3],
          overall_score: 85 + Math.random() * 10,
          meets_specification: Math.random() > 0.2
        },
        deadline,
        lastUpdated: new Date(Date.now() - index * 6 * 60 * 60 * 1000),
        approvalHistory: [
          {
            timestamp: submittedDate,
            action: 'SUBMITTED',
            user: `QC Officer ${(index % 3) + 1}`
          },
          {
            timestamp: new Date(submittedDate.getTime() + 2 * 60 * 60 * 1000),
            action: 'ASSIGNED',
            user: 'System',
            notes: `Assigned to ${traders[index % traders.length]}`
          }
        ]
      });
    });

    // Generate blendsheet reviews
    blendsheetData.slice(0, 6).forEach((item, index) => {
      const submittedDate = new Date(Date.now() - (index * 3 + 2) * 24 * 60 * 60 * 1000);
      const deadline = new Date(submittedDate.getTime() + 5 * 24 * 60 * 60 * 1000);
      
      items.push({
        id: `blendsheet-review-${item.blendsheet_no}`,
        materialType: 'Blendsheet',
        itemCode: item.blendsheet_no,
        itemName: item.standard,
        submittedBy: `Blend Supervisor ${(index % 2) + 1}`,
        submittedDate,
        reviewType: reviewTypes[(index + 1) % reviewTypes.length],
        priority: index < 2 ? 'URGENT' : index < 4 ? 'HIGH' : 'MEDIUM',
        status: statuses[(index + 2) % statuses.length],
        assignedTrader: traders[(index + 2) % traders.length],
        qualityMetrics: {
          overall_score: 80 + Math.random() * 15,
          meets_specification: Math.random() > 0.15,
          color_analysis: 'Consistent blend',
          taste_profile: 'Balanced'
        },
        deadline,
        lastUpdated: new Date(Date.now() - (index + 3) * 4 * 60 * 60 * 1000),
        approvalHistory: [
          {
            timestamp: submittedDate,
            action: 'SUBMITTED',
            user: `Blend Supervisor ${(index % 2) + 1}`
          }
        ]
      });
    });

    // Generate flavorsheet reviews
    flavorsheetData.slice(0, 4).forEach((item, index) => {
      const submittedDate = new Date(Date.now() - (index * 4 + 1) * 24 * 60 * 60 * 1000);
      const deadline = new Date(submittedDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      items.push({
        id: `flavorsheet-review-${item.flavorsheet_no}`,
        materialType: 'Flavorsheet',
        itemCode: item.flavorsheet_no,
        itemName: item.flavor_code,
        submittedBy: 'Flavor Specialist',
        submittedDate,
        reviewType: 'SPECIFICATION_REVIEW',
        priority: 'HIGH',
        status: statuses[(index + 1) % statuses.length],
        assignedTrader: traders[(index + 3) % traders.length],
        qualityMetrics: {
          taste_profile: 'Complex flavor profile',
          overall_score: 88 + Math.random() * 8,
          meets_specification: Math.random() > 0.1
        },
        deadline,
        lastUpdated: new Date(Date.now() - (index + 2) * 3 * 60 * 60 * 1000),
        approvalHistory: [
          {
            timestamp: submittedDate,
            action: 'SUBMITTED',
            user: 'Flavor Specialist'
          }
        ]
      });
    });

    return items.sort((a, b) => b.submittedDate.getTime() - a.submittedDate.getTime());
  }, [tealineData, blendsheetData, flavorsheetData, herblineData, blendbalanceData]);

  // Generate trader workload data
  const traderWorkloads = useMemo((): TraderWorkload[] => {
    const traders = [
      { id: 'sarah', name: 'Sarah Chen', specializations: ['Tealine Quality', 'Export Standards'] },
      { id: 'michael', name: 'Michael Roberts', specializations: ['Blendsheet Approval', 'Batch Review'] },
      { id: 'david', name: 'David Kumar', specializations: ['Flavorsheet Review', 'Specification'] },
      { id: 'lisa', name: 'Lisa Wong', specializations: ['Quality Control', 'Compliance'] },
      { id: 'james', name: 'James Wilson', specializations: ['General Review', 'Documentation'] }
    ];

    return traders.map((trader, index) => {
      const assignedReviews = reviewItems.filter(item => item.assignedTrader === trader.name);
      const pendingReviews = assignedReviews.filter(item => 
        item.status === 'PENDING' || item.status === 'UNDER_REVIEW'
      ).length;
      
      return {
        traderId: trader.id,
        traderName: trader.name,
        pendingReviews,
        completedThisWeek: 8 + Math.floor(Math.random() * 12),
        averageReviewTime: 4 + Math.random() * 8, // hours
        specializations: trader.specializations,
        availability: index < 3 ? 'AVAILABLE' : index < 4 ? 'BUSY' : 'OFFLINE'
      };
    });
  }, [reviewItems]);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviewItems.filter(item => {
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesMaterialType = selectedMaterialType === 'all' || 
        item.materialType.toLowerCase() === selectedMaterialType;
      const matchesTrader = selectedTrader === 'all' || item.assignedTrader === selectedTrader;
      const matchesSearch = !searchTerm || 
        item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesMaterialType && matchesTrader && matchesSearch;
    });
  }, [reviewItems, selectedStatus, selectedMaterialType, selectedTrader, searchTerm]);

  // Get unique traders for filter
  const traders = useMemo(() => {
    return [...new Set(reviewItems.map(item => item.assignedTrader))];
  }, [reviewItems]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loading size="lg" />
        <p className="mt-4 text-sm text-gray-600">Loading trader review system...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Trader Review & Approval</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage quality reviews, batch approvals, and trader workflows
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {reviewItems.filter(item => item.status === 'PENDING').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Under Review</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {reviewItems.filter(item => item.status === 'UNDER_REVIEW').length}
              </p>
            </div>
            <Eye className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved Today</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {reviewItems.filter(item => 
                  item.status === 'APPROVED' && 
                  item.lastUpdated.toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {reviewItems.filter(item => 
                  new Date() > item.deadline && 
                  (item.status === 'PENDING' || item.status === 'UNDER_REVIEW')
                ).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Filters and View Mode */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        
        <Select
          value={selectedStatus}
          onValueChange={setSelectedStatus}
          placeholder="All Statuses"
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'UNDER_REVIEW', label: 'Under Review' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'REJECTED', label: 'Rejected' },
            { value: 'REQUIRES_CHANGES', label: 'Requires Changes' }
          ]}
        />
        
        <Select
          value={selectedMaterialType}
          onValueChange={setSelectedMaterialType}
          placeholder="All Materials"
          options={[
            { value: 'all', label: 'All Materials' },
            { value: 'tealine', label: 'Tealine' },
            { value: 'blendsheet', label: 'Blendsheet' },
            { value: 'flavorsheet', label: 'Flavorsheet' },
            { value: 'herbline', label: 'Herbline' },
            { value: 'blendbalance', label: 'Blendbalance' }
          ]}
        />
        
        <Select
          value={selectedTrader}
          onValueChange={setSelectedTrader}
          placeholder="All Traders"
          options={[
            { value: 'all', label: 'All Traders' },
            ...traders.map(trader => ({ value: trader, label: trader }))
          ]}
        />
        
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              viewMode === 'list' 
                ? 'bg-tea-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Review List
          </button>
          <button
            onClick={() => setViewMode('workload')}
            className={`px-4 py-2 text-sm font-medium ${
              viewMode === 'workload' 
                ? 'bg-tea-600 text-white' 
                : 'bg-white text-gray-700 border-t border-b border-gray-300 hover:bg-gray-50'
            }`}
          >
            Trader Workload
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              viewMode === 'analytics' 
                ? 'bg-tea-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Items</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Trader
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReviews.map((item) => {
                  const materialConfig = MATERIAL_TYPE_CONFIG[item.materialType];
                  const Icon = materialConfig.icon;
                  const isOverdue = new Date() > item.deadline && 
                    (item.status === 'PENDING' || item.status === 'UNDER_REVIEW');
                  
                  return (
                    <tr key={item.id} className={isOverdue ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-md ${materialConfig.bgColor}`}>
                            <Icon className="h-4 w-4 text-gray-700" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                            <div className="text-sm text-gray-500">{item.itemCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.reviewType.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          item.priority === 'URGENT' ? 'error' :
                          item.priority === 'HIGH' ? 'warning' :
                          item.priority === 'MEDIUM' ? 'info' : 'default'
                        }>
                          {item.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          item.status === 'APPROVED' ? 'success' :
                          item.status === 'REJECTED' ? 'error' :
                          item.status === 'UNDER_REVIEW' ? 'warning' : 'info'
                        }>
                          {item.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{item.assignedTrader}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600' : ''}`}>
                          <Calendar className="h-4 w-4" />
                          <span>{item.deadline.toLocaleDateString()}</span>
                          {isOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedReview(item)}
                            className="text-tea-600 hover:text-tea-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {(item.status === 'PENDING' || item.status === 'UNDER_REVIEW') && (
                            <>
                              <button className="text-green-600 hover:text-green-900">
                                <ThumbsUp className="h-4 w-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                <ThumbsDown className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button className="text-blue-600 hover:text-blue-900">
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredReviews.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No review items found matching the selected criteria
              </div>
            )}
          </div>
        </Card>
      )}

      {viewMode === 'workload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {traderWorkloads.map((workload) => (
            <Card key={workload.traderId}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{workload.traderName}</h3>
                <Badge variant={
                  workload.availability === 'AVAILABLE' ? 'success' :
                  workload.availability === 'BUSY' ? 'warning' : 'error'
                }>
                  {workload.availability}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Pending Reviews</p>
                    <p className="font-medium text-gray-900">{workload.pendingReviews}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Completed This Week</p>
                    <p className="font-medium text-gray-900">{workload.completedThisWeek}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Avg Review Time</p>
                    <p className="font-medium text-gray-900">{workload.averageReviewTime.toFixed(1)} hours</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">Specializations</p>
                  <div className="flex flex-wrap gap-1">
                    {workload.specializations.map((spec, index) => (
                      <Badge key={index} variant="info" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Current Workload</span>
                    <span>{Math.min(100, workload.pendingReviews * 10)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        workload.pendingReviews > 8 ? 'bg-red-500' :
                        workload.pendingReviews > 5 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, workload.pendingReviews * 10)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {viewMode === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Status Distribution</h3>
            <div className="space-y-3">
              {[
                { status: 'PENDING', count: reviewItems.filter(i => i.status === 'PENDING').length, color: 'bg-orange-500' },
                { status: 'UNDER_REVIEW', count: reviewItems.filter(i => i.status === 'UNDER_REVIEW').length, color: 'bg-blue-500' },
                { status: 'APPROVED', count: reviewItems.filter(i => i.status === 'APPROVED').length, color: 'bg-green-500' },
                { status: 'REJECTED', count: reviewItems.filter(i => i.status === 'REJECTED').length, color: 'bg-red-500' },
                { status: 'REQUIRES_CHANGES', count: reviewItems.filter(i => i.status === 'REQUIRES_CHANGES').length, color: 'bg-yellow-500' }
              ].map(({ status, count, color }) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                    <span className="text-sm font-medium">{status.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Material Type Distribution</h3>
            <div className="space-y-3">
              {Object.entries(MATERIAL_TYPE_CONFIG).map(([type, config]) => {
                const count = reviewItems.filter(i => i.materialType === type).length;
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <config.icon className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">{type}</span>
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
            <div className="space-y-3">
              {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => {
                const count = reviewItems.filter(i => i.priority === priority).length;
                const color = priority === 'URGENT' ? 'bg-red-500' :
                            priority === 'HIGH' ? 'bg-orange-500' :
                            priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-gray-500';
                return (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${color}`}></div>
                      <span className="text-sm font-medium">{priority}</span>
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Review Time</span>
                <span className="text-sm font-medium">6.2 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Approval Rate</span>
                <span className="text-sm font-medium">
                  {Math.round((reviewItems.filter(i => i.status === 'APPROVED').length / reviewItems.length) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Overdue Items</span>
                <span className="text-sm font-medium text-red-600">
                  {reviewItems.filter(item => 
                    new Date() > item.deadline && 
                    (item.status === 'PENDING' || item.status === 'UNDER_REVIEW')
                  ).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Reviews This Week</span>
                <span className="text-sm font-medium">
                  {reviewItems.filter(item => {
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return item.submittedDate > weekAgo;
                  }).length}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Review Details</h3>
              <button
                onClick={() => setSelectedReview(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{selectedReview.itemName}</h4>
                <p className="text-sm text-gray-600">{selectedReview.itemCode}</p>
              </div>
              
              {selectedReview.qualityMetrics && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Quality Metrics</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedReview.qualityMetrics.overall_score && (
                      <div>
                        <span className="text-gray-600">Overall Score:</span>
                        <span className="ml-2 font-medium">{selectedReview.qualityMetrics.overall_score.toFixed(1)}</span>
                      </div>
                    )}
                    {selectedReview.qualityMetrics.moisture_content && (
                      <div>
                        <span className="text-gray-600">Moisture:</span>
                        <span className="ml-2 font-medium">{selectedReview.qualityMetrics.moisture_content.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Approval History</h5>
                <div className="space-y-2">
                  {selectedReview.approvalHistory.map((action, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-600">{action.action}</span>
                      <span className="text-gray-900">{action.user}</span>
                      <span className="text-gray-500">{action.timestamp.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}