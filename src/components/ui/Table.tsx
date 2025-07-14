import { cn } from '../../lib/utils';
import { type ReactNode } from 'react';

interface TableProps {
  className?: string;
  children: ReactNode;
}

interface TableCellProps extends TableProps {
  colSpan?: number;
}

export function Table({ className, children }: TableProps) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn("w-full border-collapse caption-bottom text-sm", className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children }: TableProps) {
  return (
    <thead className={cn("border-b", className)}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children }: TableProps) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children }: TableProps) {
  return (
    <tr className={cn("border-b transition-colors hover:bg-gray-50", className)}>
      {children}
    </tr>
  );
}

export function TableHead({ className, children }: TableProps) {
  return (
    <th className={cn("h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0", className)}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, colSpan }: TableCellProps) {
  return (
    <td className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} colSpan={colSpan}>
      {children}
    </td>
  );
}