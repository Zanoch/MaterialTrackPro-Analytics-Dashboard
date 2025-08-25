import { useState } from 'react';
import { Calendar, Package, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { Loading } from '../ui/Loading';
import { Pagination } from '../ui/Pagination';
import type { OrderSchedule } from '../../types/order';

// Mock data for order schedules
const mockOrderSchedules: OrderSchedule[] = [
  {
    schedule_code: "1",
    schedule_date: "2025-05-14",
    order_code: "EBRO/PPO/024295",
    shift: "DAY",
    section: "PERFECTA UNIVERSAL TAG 01",
    quantity: 335,
    filled_quantity: 335
  },
  {
    schedule_code: "2", 
    schedule_date: "2025-06-27",
    order_code: "EBRO/PPO/026835",
    shift: "NIGHT & DAY",
    section: "PERFECTA TAG 01",
    quantity: 1190,
    filled_quantity: 850
  },
  {
    schedule_code: "3",
    schedule_date: "2025-06-27", 
    order_code: "EBRO/PPO/026839",
    shift: "NIGHT & DAY",
    section: "PERFECTA TAG 02", 
    quantity: 1190,
    filled_quantity: 0
  },
  {
    schedule_code: "4",
    schedule_date: "2025-06-27",
    order_code: "EBRO/PPO/026803", 
    shift: "NIGHT & DAY",
    section: "PERFECTA UNIVERSAL TAG 01",
    quantity: 1296,
    filled_quantity: 900
  },
  {
    schedule_code: "5",
    schedule_date: "2025-06-27",
    order_code: "EBRO/PPO/026111",
    shift: "NIGHT & DAY", 
    section: "PERFECTA UNIVERSAL 01/02",
    quantity: 36821,
    filled_quantity: 25000
  },
  {
    schedule_code: "6",
    schedule_date: "2025-06-27",
    order_code: "EBRO/PPO/026095",
    shift: "NIGHT & DAY",
    section: "PERFECTA ENV 02",
    quantity: 2134,
    filled_quantity: 2134
  },
  {
    schedule_code: "7",
    schedule_date: "2025-06-27",
    order_code: "EBRO/PPO/026926",
    shift: "NIGHT & DAY",
    section: "CONSTANTA NEW 01", 
    quantity: 10,
    filled_quantity: 7
  },
  {
    schedule_code: "8",
    schedule_date: "2025-06-27",
    order_code: "EBRO/PPO/026824",
    shift: "NIGHT & DAY",
    section: "IMA",
    quantity: 2030,
    filled_quantity: 1500
  },
  {
    schedule_code: "9",
    schedule_date: "2025-06-27",
    order_code: "EBRO/PPO/026490",
    shift: "NIGHT & DAY",
    section: "MAISA TAG",
    quantity: 22102,
    filled_quantity: 0
  },
  {
    schedule_code: "10",
    schedule_date: "2025-06-27",
    order_code: "EBRO/PPO/025629", 
    shift: "NIGHT & DAY",
    section: "FUSO",
    quantity: 109,
    filled_quantity: 60
  },
  {
    schedule_code: "11",
    schedule_date: "2025-06-27",
    order_code: "EBRO/PPO/026654",
    shift: "NIGHT & DAY",
    section: "MAISA TAG",
    quantity: 2968,
    filled_quantity: 1800
  },
  {
    schedule_code: "12",
    schedule_date: "2025-06-27",
    order_code: "EBRO/PPO/026650",
    shift: "NIGHT & DAY", 
    section: "MAISA TAG",
    quantity: 31080,
    filled_quantity: 20000
  },
  {
    schedule_code: "13",
    schedule_date: "2025-06-27",
    order_code: "EBRO/PPO/026651",
    shift: "NIGHT & DAY",
    section: "MAISA TAG", 
    quantity: 31080,
    filled_quantity: 31080
  },
  {
    schedule_code: "14",
    schedule_date: "2025-06-27",
    order_code: "EBRO/PPO/026652",
    shift: "NIGHT & DAY",
    section: "MAISA TAG",
    quantity: 31080,
    filled_quantity: 15000
  },
  {
    schedule_code: "15",
    schedule_date: "2025-06-27",
    order_code: "EBRO/PPO/026653",
    shift: "NIGHT & DAY",
    section: "MAISA TAG",
    quantity: 31080,
    filled_quantity: 5000
  },
  {
    schedule_code: "16", 
    schedule_date: "2025-07-31",
    order_code: "EBRO/PPO/028465",
    shift: "NIGHT & DAY",
    section: "PERFECTA UNIVERSAL TAG",
    quantity: 3250,
    filled_quantity: 0
  },
  {
    schedule_code: "17",
    schedule_date: "2025-07-31",
    order_code: "EBRO/PPO/027101",
    shift: "NIGHT & DAY",
    section: "PERFECTA ENV 02",
    quantity: 11160,
    filled_quantity: 8000
  },
  {
    schedule_code: "18",
    schedule_date: "2025-08-01",
    order_code: "EBRO/PPO/028465",
    shift: "NIGHT & DAY", 
    section: "PERFECTA UNIVERSAL TAG",
    quantity: 3250,
    filled_quantity: 2500
  },
  {
    schedule_code: "19",
    schedule_date: "2025-08-01",
    order_code: "EBRO/PPO/027101",
    shift: "NIGHT & DAY",
    section: "PERFECTA ENV 02",
    quantity: 11160,
    filled_quantity: 3000
  }
];

interface OrderPlansTableProps {
  orderSchedules?: OrderSchedule[];
  isLoading?: boolean;
  showPagination?: boolean;
}

export function OrderPlansTable({ orderSchedules = mockOrderSchedules, isLoading = false, showPagination = false }: OrderPlansTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination logic
  const totalItems = orderSchedules.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSchedules = showPagination 
    ? orderSchedules.slice(startIndex, startIndex + itemsPerPage)
    : orderSchedules;
  if (isLoading) {
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
          <span>Order Schedules ({orderSchedules.length})</span>
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
              const progressPercentage = Math.min((schedule.filled_quantity / schedule.quantity) * 100, 100);
              const isCompleted = progressPercentage >= 100;
              const isInProgress = progressPercentage > 0 && progressPercentage < 100;
              
              return (
                <TableRow 
                  key={schedule.schedule_code}
                  className="hover:bg-gray-50"
                >
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
                      variant={schedule.shift === 'DAY' ? 'info' : schedule.shift === 'NIGHT' ? 'warning' : 'default'}
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
                            isCompleted ? 'bg-green-500' :
                            isInProgress ? 'bg-blue-500' :
                            'bg-gray-300'
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