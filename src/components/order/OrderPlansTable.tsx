import { Calendar, FileText, Package } from "lucide-react";
import { useState } from "react";
import { useOrderScheduleAnalytics } from "../../hooks/useOrderDashboard";
import { Badge } from "../ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Loading } from "../ui/Loading";
import { Pagination } from "../ui/Pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/Table";

interface OrderPlansTableProps {
  isLoading?: boolean;
  showPagination?: boolean;
}

export function OrderPlansTable({
  isLoading = false,
  showPagination = false,
}: OrderPlansTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Calculate pagination parameters
  const offset = (currentPage - 1) * itemsPerPage;

  // Use real API data with pagination - no date filter by default to show all schedules
  const { data: analyticsResponse, isLoading: isLoadingSchedules } = useOrderScheduleAnalytics({
    limit: itemsPerPage,
    offset: offset,
  });

  const orderSchedules = analyticsResponse?.data || [];
  const pagination = analyticsResponse?.pagination;

  // Combine loading states
  const loading = isLoading || isLoadingSchedules;

  // Use server-side pagination data
  const totalItems = pagination?.total || 0;
  const totalPages = pagination?.totalPages || 1;
  const paginatedSchedules = orderSchedules; // Already paginated from server
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <Loading className="flex justify-center py-8" />
        </CardContent>
      </Card>
    );
  }

  if (orderSchedules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No order schedules found</p>
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
          <span>
            Order Schedules ({totalItems} total, showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, totalItems)})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-3">Schedule Code</TableHead>
              <TableHead className="px-6 py-3">Schedule Date</TableHead>
              <TableHead className="px-6 py-3">Order Code</TableHead>
              <TableHead className="px-6 py-3">Shift</TableHead>
              <TableHead className="px-6 py-3">Section</TableHead>
              <TableHead className="px-6 py-3">Quantity (kg)</TableHead>
              <TableHead className="px-6 py-3">Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSchedules.map((schedule) => {
              const progressPercentage = Math.min(
                (schedule.filled_quantity / schedule.quantity) * 100,
                100
              );
              const isCompleted = progressPercentage >= 100;
              const isInProgress = progressPercentage > 0 && progressPercentage < 100;

              return (
                <TableRow key={schedule.schedule_code} className="hover:bg-gray-50">
                  <TableCell className="px-6 py-4 font-medium text-tea-600">
                    {schedule.schedule_code}
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <div className="text-sm">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(schedule.schedule_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4 font-medium text-gray-900">
                    {schedule.order_code}
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <Badge
                      variant={
                        schedule.shift === "DAY"
                          ? "info"
                          : schedule.shift === "NIGHT"
                          ? "warning"
                          : "default"
                      }
                      className="text-xs"
                    >
                      {schedule.shift}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <div className="max-w-64 truncate text-sm text-gray-900">
                      {schedule.section}
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium">{schedule.quantity.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">
                        {schedule.filled_quantity.toLocaleString()} filled
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <div className="flex items-center space-x-3 min-w-32">
                      <div className="flex-1 bg-gray-200 rounded-full h-3 min-w-20">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            isCompleted
                              ? "bg-green-500"
                              : isInProgress
                              ? "bg-blue-500"
                              : "bg-gray-300"
                          }`}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 min-w-10 text-right">
                        {progressPercentage.toFixed(0)}%
                      </span>
                    </div>
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
              onPageChange={(page: number) => {
                setCurrentPage(page);
              }}
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
