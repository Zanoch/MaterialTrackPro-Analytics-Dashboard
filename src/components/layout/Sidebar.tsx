import { Link, useLocation } from 'react-router-dom';
import { Leaf, Package, Warehouse, Sparkles, Flower2, Scale, Truck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store';

const menuItems = [
  { path: '/tealine', label: 'Tealine', icon: Package },
  { path: '/blendsheet', label: 'Blend Operations', icon: Leaf },
  { path: '/blendbalance', label: 'Blendbalance', icon: Scale },
  { path: '/flavorsheet', label: 'Flavorsheet', icon: Sparkles },
  { path: '/herbline', label: 'Herbline', icon: Flower2 },
  { path: '/inventory', label: 'Inventory (S)', icon: Warehouse },
  { path: '/order-status', label: 'Order Status', icon: Truck },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed } = useAppStore();

  return (
    <aside
      className={cn(
        "sticky top-16 h-[calc(100vh-4rem)] border-r bg-gray-50 transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-56"
      )}
    >
      <nav className="space-y-1 p-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-tea-100 text-tea-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                sidebarCollapsed && "justify-center"
              )}
            >
              <Icon className="h-5 w-5" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}