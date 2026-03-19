// App.jsx — Phase 3: Client portal added, error boundaries wrapped
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useToast } from './hooks/useToast';
import { Toast } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { Spinner } from './components/ui/Loading';
import ErrorBoundary from './components/ErrorBoundary';

// ── Public website pages ────────────────────────────────────────────────────
import LandingPage        from './pages/public/LandingPage';
import PublicTrackPage    from './pages/public/PublicTrackPage';
import ServicesPage       from './pages/public/ServicesPage';
import ContactPage        from './pages/public/ContactPage';
import BookPage           from './pages/public/BookPage';
import LoginPage          from './pages/LoginPage';

// ── Client portal ────────────────────────────────────────────────────────────
import ClientLoginPage    from './pages/client/ClientLoginPage';
import ClientPortalPage   from './pages/client/ClientPortalPage';

// ── App pages (staff/admin) ─────────────────────────────────────────────────
import DashboardPage       from './pages/DashboardPage';
import NewEntryPage        from './pages/NewEntryPage';
import ImportPage          from './pages/ImportPage';
import AllShipmentsPage    from './pages/AllShipmentsPage';
import DailySheetPage      from './pages/DailySheetPage';
import MonthlyReportPage   from './pages/MonthlyReportPage';
import ClientsPage         from './pages/ClientsPage';
import ContractsPage       from './pages/ContractsPage';
import InvoicesPage        from './pages/InvoicesPage';
import PendingPage         from './pages/PendingPage';
import TrackPage           from './pages/TrackPage';
import SyncPage            from './pages/SyncPage';
import UsersPage           from './pages/UsersPage';
import AuditPage           from './pages/AuditPage';
import RateCalculatorPage  from './pages/RateCalculatorPage';
import ProfilePage         from './pages/ProfilePage';
import OperationsDashboard from './pages/OperationsDashboard';
import BulkComparePage     from './pages/BulkComparePage';
import RateCardPage        from './pages/RateCardPage';
import QuoteHistoryPage    from './pages/QuoteHistoryPage';
import ReconciliationPage  from './pages/ReconciliationPage';
import RateManagementPage  from './pages/RateManagementPage';
import WhatsAppPage        from './pages/WhatsAppPage';
import ShipmentDashboardPage from './pages/ShipmentDashboardPage';
import NDRPage             from './pages/NDRPage';
import PickupSchedulerPage from './pages/PickupSchedulerPage';
import WalletPage          from './pages/WalletPage';
import AnalyticsPage       from './pages/AnalyticsPage';

// ── Private route guard ─────────────────────────────────────────────────────
function PrivateRoute({ children, adminOnly = false, roles = null }) {
  const { user, loading, isAdmin, hasRole } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="text-5xl mb-3">🦅</div>
        <Spinner size="lg" />
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/app" replace />;
  if (roles && !hasRole(...roles)) return <Navigate to="/app" replace />;
  return children;
}

// ── Client portal route guard ───────────────────────────────────────────────
function ClientRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Spinner size="lg" />
    </div>
  );
  if (!user) return <Navigate to="/client-login" replace />;
  if (user.role !== 'CLIENT') return <Navigate to="/app" replace />;
  return children;
}

function AppRoutes() {
  const { toasts, toast, removeToast } = useToast();
  const p = { toast };
  return (
    <>
      <Toast toasts={toasts} removeToast={removeToast} />
      <Routes>
        {/* ── Public website routes ──────────────────────────────────────── */}
        <Route path="/"          element={<LandingPage />} />
        <Route path="/services"  element={<ServicesPage />} />
        <Route path="/contact"   element={<ContactPage />} />
        <Route path="/book"      element={<BookPage />} />
        <Route path="/track"     element={<PublicTrackPage />} />
        <Route path="/track/:awb" element={<PublicTrackPage />} />
        <Route path="/login"     element={<LoginPage />} />

        {/* ── Client portal routes ───────────────────────────────────────── */}
        <Route path="/client-login" element={<ClientLoginPage />} />
        <Route path="/client-portal" element={
          <ClientRoute>
            <ErrorBoundary>
              <ClientPortalPage />
            </ErrorBoundary>
          </ClientRoute>
        } />

        {/* ── Staff/Admin app routes ─────────────────────────────────────── */}
        <Route path="/app/*" element={
          <PrivateRoute>
            <AppLayout>
              <Routes>
                <Route path="/"          element={<ErrorBoundary><DashboardPage         {...p} /></ErrorBoundary>} />
                <Route path="/ops"       element={<ErrorBoundary><OperationsDashboard   {...p} /></ErrorBoundary>} />
                <Route path="/entry"     element={<ErrorBoundary><NewEntryPage          {...p} /></ErrorBoundary>} />
                <Route path="/import"    element={<ErrorBoundary><ImportPage            {...p} /></ErrorBoundary>} />
                <Route path="/all"       element={<ErrorBoundary><AllShipmentsPage      {...p} /></ErrorBoundary>} />
                <Route path="/pending"   element={<ErrorBoundary><PendingPage           {...p} /></ErrorBoundary>} />
                <Route path="/track"     element={<ErrorBoundary><TrackPage             {...p} /></ErrorBoundary>} />
                <Route path="/daily"     element={<ErrorBoundary><DailySheetPage        {...p} /></ErrorBoundary>} />
                <Route path="/monthly"   element={<ErrorBoundary><MonthlyReportPage     {...p} /></ErrorBoundary>} />
                <Route path="/clients"        element={<ErrorBoundary><ClientsPage      {...p} /></ErrorBoundary>} />
                <Route path="/contracts"      element={<ErrorBoundary><ContractsPage    {...p} /></ErrorBoundary>} />
                <Route path="/invoices"       element={<ErrorBoundary><InvoicesPage     {...p} /></ErrorBoundary>} />
                <Route path="/reconciliation" element={<ErrorBoundary><ReconciliationPage {...p} /></ErrorBoundary>} />
                <Route path="/rates"     element={<ErrorBoundary><RateCalculatorPage /></ErrorBoundary>} />
                <Route path="/bulk"      element={<ErrorBoundary><BulkComparePage       {...p} /></ErrorBoundary>} />
                <Route path="/rate-card" element={<ErrorBoundary><RateCardPage          {...p} /></ErrorBoundary>} />
                <Route path="/quotes"    element={<ErrorBoundary><QuoteHistoryPage      {...p} /></ErrorBoundary>} />
                <Route path="/whatsapp"  element={<ErrorBoundary><WhatsAppPage          {...p} /></ErrorBoundary>} />
                <Route path="/sync"      element={<ErrorBoundary><SyncPage              {...p} /></ErrorBoundary>} />
                <Route path="/profile"   element={<ErrorBoundary><ProfilePage           {...p} /></ErrorBoundary>} />
                <Route path="/shipments" element={<ErrorBoundary><ShipmentDashboardPage {...p} /></ErrorBoundary>} />
                <Route path="/wallet"    element={<PrivateRoute roles={['ADMIN','OPS_MANAGER']}><ErrorBoundary><WalletPage {...p} /></ErrorBoundary></PrivateRoute>} />
                <Route path="/analytics" element={<PrivateRoute roles={['ADMIN','OPS_MANAGER']}><ErrorBoundary><AnalyticsPage {...p} /></ErrorBoundary></PrivateRoute>} />
                <Route path="/ndr"       element={<PrivateRoute roles={['ADMIN','OPS_MANAGER','STAFF']}><ErrorBoundary><NDRPage {...p} /></ErrorBoundary></PrivateRoute>} />
                <Route path="/pickups"   element={<PrivateRoute roles={['ADMIN','OPS_MANAGER','STAFF']}><ErrorBoundary><PickupSchedulerPage {...p} /></ErrorBoundary></PrivateRoute>} />
                <Route path="/users"     element={<PrivateRoute adminOnly><ErrorBoundary><UsersPage {...p} /></ErrorBoundary></PrivateRoute>} />
                <Route path="/audit"     element={<PrivateRoute adminOnly><ErrorBoundary><AuditPage /></ErrorBoundary></PrivateRoute>} />
                <Route path="/rate-mgmt" element={<PrivateRoute adminOnly><ErrorBoundary><RateManagementPage {...p} /></ErrorBoundary></PrivateRoute>} />
              </Routes>
            </AppLayout>
          </PrivateRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
