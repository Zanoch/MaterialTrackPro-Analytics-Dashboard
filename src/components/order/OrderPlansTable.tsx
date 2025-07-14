import { useState } from 'react';
import { Calendar, Package, FileText, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Loading } from '../ui/Loading';
import { Pagination } from '../ui/Pagination';
import type { OrderPlanDetails } from '../../types/order';
import { calculateOrderProgress, getOrderStatusColor, getOrderStatusIcon, formatOrderStatus } from '../../hooks/useOrderDashboard';

interface OrderPlansTableProps {
  orderPlans: OrderPlanDetails[];
  isLoading?: boolean;
  onPlanSelect?: (plan: OrderPlanDetails) => void;
  showPagination?: boolean;
}

export function OrderPlansTable({ orderPlans, isLoading = false, onPlanSelect, showPagination = false }: OrderPlansTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination logic
  const totalItems = orderPlans.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPlans = showPagination 
    ? orderPlans.slice(startIndex, startIndex + itemsPerPage)
    : orderPlans;
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading className="flex justify-center py-8" />
        </CardContent>
      </Card>
    );
  }

  if (orderPlans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No order plans found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Order Plans ({orderPlans.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-3">Order Code</TableHead>
              <TableHead className="px-6 py-3">Product</TableHead>
              <TableHead className="px-6 py-3">Required</TableHead>
              <TableHead className="px-6 py-3">Allowed</TableHead>
              <TableHead className="px-6 py-3">Plan Period</TableHead>
              <TableHead className="px-6 py-3">Requests</TableHead>
              <TableHead className="px-6 py-3">Progress</TableHead>
              <TableHead className="px-6 py-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPlans.map((plan) => {
              const progress = calculateOrderProgress(plan);
              const hasRequests = plan.requests.length > 0;
              const latestRequestStatus = hasRequests ? plan.requests[plan.requests.length - 1].status : null;
              
              return (
                <TableRow 
                  key={plan.order_code}
                  className="hover:bg-gray-50"
                >
                  <TableCell className="px-6 py-4 font-medium text-tea-600">
                    <div 
                      className="cursor-pointer"
                      onClick={() => onPlanSelect?.(plan)}
                    >
                      {plan.order_code}
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-6 py-4">
                    <div className="max-w-48">
                      <div className="font-medium text-gray-900 truncate">
                        {plan.product_name}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium">{(plan.requirement / 1000).toFixed(1)}t</div>
                      <div className="text-gray-500">{plan.requirement.toLocaleString()}kg</div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium">{(plan.allowed / 1000).toFixed(1)}t</div>
                      <div className="text-gray-500">{plan.allowed.toLocaleString()}kg</div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-6 py-4">
                    <div className="text-sm">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>{plan.plan_start.toLocaleDateString()}</span>
                      </div>
                      <div className="text-gray-500">
                        to {plan.plan_end.toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={hasRequests ? "default" : "info"}
                        className="text-xs"
                      >
                        {plan.requests.length} request{plan.requests.length !== 1 ? 's' : ''}
                      </Badge>
                      {latestRequestStatus && (
                        <Badge 
                          variant="default"
                          className={`text-xs border-${getOrderStatusColor(latestRequestStatus)}-200 text-${getOrderStatusColor(latestRequestStatus)}-700`}
                        >
                          {getOrderStatusIcon(latestRequestStatus)} {formatOrderStatus(latestRequestStatus)}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 min-w-16">
                        <div 
                          className={`h-2 rounded-full ${
                            progress < 30 ? 'bg-red-500' :
                            progress < 70 ? 'bg-amber-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 min-w-8">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="px-6 py-4">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        {showPagination && totalItems > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageSizeChange={(value: any) => {
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface OrderPlanCardProps {
  plan: OrderPlanDetails;
  onClick?: () => void;
}

export function OrderPlanCard({ plan, onClick }: OrderPlanCardProps) {
  const progress = calculateOrderProgress(plan);
  const hasRequests = plan.requests.length > 0;
  const latestRequestStatus = hasRequests ? plan.requests[plan.requests.length - 1].status : null;

  return (
    <div 
      className="border border-gray-200 rounded-lg p-4 hover:border-tea-400 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-tea-600">{plan.order_code}</h3>
          <p className="text-sm text-gray-600 mt-1 truncate max-w-48">
            {plan.product_name}
          </p>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Required:</span>
          <span className="font-medium">{(plan.requirement / 1000).toFixed(1)}t</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Allowed:</span>
          <span className="font-medium">{(plan.allowed / 1000).toFixed(1)}t</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Requests:</span>
          <Badge variant={hasRequests ? "default" : "info"} className="text-xs">
            {plan.requests.length}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Progress:</span>
          <span className="font-medium">{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              progress < 30 ? 'bg-red-500' :
              progress < 70 ? 'bg-amber-500' :
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        
        {latestRequestStatus && (
          <div className="mt-2">
            <Badge 
              variant="default"
              className={`text-xs border-${getOrderStatusColor(latestRequestStatus)}-200 text-${getOrderStatusColor(latestRequestStatus)}-700`}
            >
              {getOrderStatusIcon(latestRequestStatus)} {formatOrderStatus(latestRequestStatus)}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}