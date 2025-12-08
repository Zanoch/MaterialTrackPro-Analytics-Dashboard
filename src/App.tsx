import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { queryClient } from './lib/react-query';
import { Authenticator } from './components/auth';
import { Layout } from './components/layout/Layout';
import { Unauthorized } from './pages/Unauthorized';
import { PendingTealines } from './pages/PendingTealines';
import { TealineInventory } from './pages/TealineInventory';
import { BlendsheetOperations } from './pages/BlendsheetOperations';
import { FlavorsheetOperations } from './pages/FlavorsheetOperations';
import { HerblineOperations } from './pages/HerblineOperations';
import { BlendbalanceOperations } from './pages/BlendbalanceOperations';
import { OrderStatusDashboard } from './pages/OrderStatusDashboard';
import { ShipmentLog } from './pages/ShipmentLog';
import { TraderRequests } from './pages/TraderRequests';

const DevTestPanel = import.meta.env.MODE === "development"
  ? lazy(() => import('./pages/DevTestPanel').then(m => ({ default: m.DevTestPanel })))
  : null;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Authenticator>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/inventory" replace />} />
              <Route path="pending-tealine" element={<PendingTealines />} />
              <Route path="blendsheet" element={<BlendsheetOperations />} />
              <Route path="flavorsheet" element={<FlavorsheetOperations />} />
              <Route path="herbline" element={<HerblineOperations />} />
              <Route path="blendbalance" element={<BlendbalanceOperations />} />
              <Route path="inventory" element={<TealineInventory />} />
              <Route path="order-status" element={<OrderStatusDashboard />} />
              <Route path="shipment-log" element={<ShipmentLog />} />
              <Route path="trader-requests" element={<TraderRequests />} />
              <Route path="unauthorized" element={<Unauthorized />} />
            </Route>
            {DevTestPanel && (
              <Route
                path="/dev-test/*"
                element={
                  <Suspense fallback={<div className="p-8">Loading...</div>}>
                    <DevTestPanel />
                  </Suspense>
                }
              />
            )}
          </Routes>
        </Router>
      </Authenticator>
    </QueryClientProvider>
  );
}

export default App;
