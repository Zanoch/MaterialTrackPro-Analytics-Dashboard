import { Bell, LogOut, Menu, User } from 'lucide-react';
import { useAppStore } from '../../store';
import { useAuthenticator } from '../auth/context';

export function Header() {
  const { toggleSidebar, user } = useAppStore();
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
          <h1 className="text-xl font-semibold text-tea-700">Tea Dashboard</h1>
          
          <div className="flex items-center gap-4">
            <button className="relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-gray-100 h-10 w-10">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-tea-100">
                <User className="h-5 w-5 text-tea-600" />
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
      </div>
    </header>
  );
}