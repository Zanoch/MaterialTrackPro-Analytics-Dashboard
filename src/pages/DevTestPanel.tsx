import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Warehouse, Package, Leaf, Home, User, LogOut, ToggleRight, Menu } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store';
import { useAuthenticator } from '../components/auth/context';

// Import actual pages to replicate
import { DevTealineInventory } from './DevTealineInventory';
import { DevPendingTealines } from './DevPendingTealines';
import { DevBlendsheetOperations } from './DevBlendsheetOperations';

// Test menu items - mirrors main dashboard pages
const testMenuItems = [
  { path: '/dev-test', label: 'Overview', icon: Home, end: true },
  { path: '/dev-test/inventory', label: 'Tealine Inventory', icon: Warehouse },
  { path: '/dev-test/pending-tealine', label: 'Pending Tealine', icon: Package },
  { path: '/dev-test/blendsheet', label: 'Blend Operations', icon: Leaf },
];

// Dev Header Component
function DevHeader() {
  const { user, toggleSidebar } = useAppStore();
  const { logout } = useAuthenticator();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="flex h-16 items-center gap-4 px-4">
        <button
          onClick={toggleSidebar}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-gray-100 h-10 w-10"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-yellow-700">Dev Test Panel</h1>
            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
              DEV ONLY
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-yellow-100">
              <User className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user?.name || 'Guest User'}</p>
              <p className="text-xs text-gray-500">{user?.role || 'Viewer'}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-gray-100 h-10 w-10"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Dev Sidebar Component
function DevSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed } = useAppStore();

  const handleModeSwitch = () => {
    navigate('/inventory');
  };

  return (
    <aside
      className={cn(
        "sticky top-16 h-[calc(100vh-4rem)] border-r bg-gray-50 transition-all duration-300 flex flex-col",
        sidebarCollapsed ? "w-16" : "w-56"
      )}
    >
      <nav className="space-y-1 p-2 flex-1">
        {testMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.end
            ? location.pathname === item.path
            : location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-yellow-100 text-yellow-700"
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

      {/* Mode Switch */}
      <div className="p-3 border-t">
        <button
          onClick={handleModeSwitch}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors",
            sidebarCollapsed && "justify-center"
          )}
        >
          <ToggleRight className="h-5 w-5 text-yellow-600" />
          {!sidebarCollapsed && <span>Dev Mode</span>}
        </button>
      </div>
    </aside>
  );
}

// Overview Page
function DevOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dev Test Panel</h1>
        <p className="text-sm text-gray-500">This panel is only visible in development mode</p>
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> This entire panel and all test pages will be removed from production builds automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testMenuItems.slice(1).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="p-4 border rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors bg-white"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-yellow-600" />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Main DevTestPanel Layout
export function DevTestPanel() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DevHeader />
      <div className="flex">
        <DevSidebar />
        <main className="flex-1 p-6">
          <Routes>
            <Route index element={<DevOverview />} />
            <Route path="inventory" element={<DevTealineInventory />} />
            <Route path="pending-tealine" element={<DevPendingTealines />} />
            <Route path="blendsheet" element={<DevBlendsheetOperations />} />
            <Route path="*" element={<Navigate to="/dev-test" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}