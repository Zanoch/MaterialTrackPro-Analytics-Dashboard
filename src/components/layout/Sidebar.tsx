import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, Package, Warehouse, Sparkles, Flower2, Scale, Truck, FileText, UserCheck, ToggleLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store';

const menuItems = [
  { path: '/inventory', label: 'Tealine Inventory (S)', icon: Warehouse },
  { path: '/pending-tealine', label: 'Pending Tealine', icon: Package },
  { path: '/blendsheet', label: 'Blend Operations', icon: Leaf },
  { path: '/blendbalance', label: 'Blendbalance', icon: Scale },
  { path: '/flavorsheet', label: 'Flavor Operations', icon: Sparkles },
  { path: '/herbline', label: 'Herbline', icon: Flower2 },
  { path: '/order-status', label: 'Order Status', icon: Truck },
  { path: '/shipment-log', label: 'Shipment Log', icon: FileText },
  { path: '/trader-requests', label: 'Trader Requests', icon: UserCheck },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed } = useAppStore();

  const handleModeSwitch = () => {
    navigate('/dev-test');
  };

  return (
    <aside
      className={cn(
        "sticky top-16 h-[calc(100vh-4rem)] border-r bg-gray-50 transition-all duration-300 flex flex-col",
        sidebarCollapsed ? "w-16" : "w-56"
      )}
    >
      <nav className="space-y-1 p-2 flex-1">
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

      {/* Dev Mode Switch - only in development */}
      {import.meta.env.MODE === "development" && (
        <div className="p-3 border-t">
          <button
            onClick={handleModeSwitch}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors",
              sidebarCollapsed && "justify-center"
            )}
          >
            <ToggleLeft className="h-5 w-5 text-gray-500" />
            {!sidebarCollapsed && <span>Dev Mode</span>}
          </button>
        </div>
      )}
    </aside>
  );
}