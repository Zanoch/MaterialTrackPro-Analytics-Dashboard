import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  titleClassName?: string;
  actions?: React.ReactElement[];
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  titleClassName = 'text-tea-700',
  actions
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      {/* Left side - Icon, Title & Subtitle */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {Icon && (
          <div className="flex-shrink-0">
            <Icon className={`h-8 w-8 ${titleClassName}`} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className={`text-2xl font-bold whitespace-nowrap ${titleClassName}`}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 text-sm truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {actions.map((action, index) => (
            <React.Fragment key={action.key || index}>
              {action}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
