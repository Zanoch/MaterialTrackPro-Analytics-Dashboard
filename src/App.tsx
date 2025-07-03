import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';
import { Authenticator } from './components/auth';
import { Layout } from './components/layout/Layout';
import { Unauthorized } from './pages/Unauthorized';
import { PendingTealines } from './pages/PendingTealines';
import { TealineInventory } from './pages/TealineInventory';
import { BlendsheetOperations } from './pages/BlendsheetOperations';
import { FlavorsheetOperations } from './pages/FlavorsheetOperations';
import { HerblineOperations } from './pages/HerblineOperations';
import { HerblineTest } from './pages/HerblineTest';
import { BlendbalanceOperations } from './pages/BlendbalanceOperations';
import { BlendbalanceTest } from './pages/BlendbalanceTest';
import { MaterialStatusTracking } from './pages/MaterialStatusTracking';
import { AllocationTraceability } from './pages/AllocationTraceability';
import { ShipmentManagement } from './pages/ShipmentManagement';
import { UniversalScanner } from './pages/UniversalScanner';
import { ProductionScheduling } from './pages/ProductionScheduling';
import { TraderReview } from './pages/TraderReview';
import { MaterialWorkflow } from './pages/MaterialWorkflow';
import { CrossMaterialIntegration } from './pages/CrossMaterialIntegration';
import { Orders } from './pages/Orders';
import { OrderStatusDashboard } from './pages/OrderStatusDashboard';
import { Reports } from './pages/Reports';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Authenticator>
        <Router basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/tealine" replace />} />
              <Route path="tealine" element={<PendingTealines />} />
              <Route path="blendsheet" element={<BlendsheetOperations />} />
              <Route path="flavorsheet" element={<FlavorsheetOperations />} />
              <Route path="herbline" element={<HerblineOperations />} />
              <Route path="herbline-test" element={<HerblineTest />} />
              <Route path="blendbalance" element={<BlendbalanceOperations />} />
              <Route path="blendbalance-test" element={<BlendbalanceTest />} />
              <Route path="material-status" element={<MaterialStatusTracking />} />
              <Route path="allocation-traceability" element={<AllocationTraceability />} />
              <Route path="shipment-management" element={<ShipmentManagement />} />
              <Route path="scanner" element={<UniversalScanner />} />
              <Route path="production-scheduling" element={<ProductionScheduling />} />
              <Route path="inventory" element={<TealineInventory />} />
              <Route path="orders" element={<Orders />} />
              <Route path="order-status" element={<OrderStatusDashboard />} />
              <Route path="reports" element={<Reports />} />
              <Route path="trader-review" element={<TraderReview />} />
              <Route path="material-workflow" element={<MaterialWorkflow />} />
              <Route path="cross-material-integration" element={<CrossMaterialIntegration />} />
              <Route path="unauthorized" element={<Unauthorized />} />
            </Route>
          </Routes>
        </Router>
      </Authenticator>
    </QueryClientProvider>
  );
}

export default App;
