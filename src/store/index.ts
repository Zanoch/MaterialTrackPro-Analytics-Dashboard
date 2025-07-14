import { create } from 'zustand';

interface AppState {
  user: {
    name: string;
    role: string;
  } | null;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  
  setUser: (user: AppState['user']) => void;
  toggleSidebar: () => void;
  setTheme: (theme: AppState['theme']) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  sidebarCollapsed: false,
  theme: 'light',
  
  setUser: (user) => set({ user }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
}));