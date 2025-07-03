import { cn } from '../../lib/utils';
import { type ReactNode } from 'react';

interface CardProps {
  className?: string;
  children: ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn("rounded-lg border bg-white p-6 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: CardProps) {
  return (
    <h3 className={cn("text-lg font-semibold", className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children }: CardProps) {
  return (
    <p className={cn("text-sm text-gray-600", className)}>
      {children}
    </p>
  );
}

export function CardContent({ className, children }: CardProps) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  );
}