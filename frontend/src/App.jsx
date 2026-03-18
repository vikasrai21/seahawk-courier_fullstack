// App.jsx — Updated with all public website routes integrated into React
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useToast } from './hooks/useToast';
import { Toast } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { Spinner } from './components/ui/Loading';

// ── Public website pages (no auth needed) ──────────────────────────────────
import LandingPage        from './pages/public/LandingPage';
import PublicTrackPage    from './pages/public/PublicTrackPage';
import ServicesPage       from './pages/public/ServicesPage';
import ContactPage        from './pages/public/ContactPage';
import BookPage           from './pages/public/BookPage';
import LoginPage          from './pages/LoginPage';

// ── App pages (auth required) ───────────────────────────────────────────────
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
  if (!user)                       return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin)       return <Navigate to="/app" replace />;
  if (roles && !hasRole(...roles)) return <Navigate to="/app" replace />;
  return children;
}

function AppRoutes() {
  const { toasts, toast, removeToast } = useToast();
  const p = { toast };
  return (
    <>
      <Toast toasts={toasts} removeToast={removeToast} />
      <Routes>
        {/* ══════════════════════════════════════════════════
            PUBLIC WEBSITE ROUTES — no auth required
            The full Sea Hawk website lives here as React pages
        ══════════════════════════════════════════════════ */}
        <Route path="/"          element={<LandingPage />} />
        <Route path="/services"  element={<ServicesPage />} />
        <Route path="/contact"   element={<ContactPage />} />
        <Route path="/book"      element={<BookPage />} />
        <Route path="/track"     element={<PublicTrackPage />} />
        <Route path="/track/:awb" element={<PublicTrackPage />} />
        <Route path="/login"     element={<LoginPage />} />

        {/* ══════════════════════════════════════════════════
            PROTECTED APP ROUTES — auth required
        ══════════════════════════════════════════════════ */}
        <Route path="/app/*" element={
          <PrivateRoute>
            <AppLayout>
              <Routes>
                <Route path="/"          element={<DashboardPage         {...p} />} />
                <Route path="/ops"       element={<OperationsDashboard   {...p} />} />
                <Route path="/entry"     element={<NewEntryPage          {...p} />} />
                <Route path="/import"    element={<ImportPage            {...p} />} />
                <Route path="/all"       element={<AllShipmentsPage      {...p} />} />
                <Route path="/pending"   element={<PendingPage           {...p} />} />
                <Route path="/track"     element={<TrackPage             {...p} />} />
                <Route path="/daily"     element={<DailySheetPage        {...p} />} />
                <Route path="/monthly"   element={<MonthlyReportPage     {...p} />} />
                <Route path="/clients"        element={<ClientsPage      {...p} />} />
                <Route path="/contracts"      element={<ContractsPage    {...p} />} />
                <Route path="/invoices"       element={<InvoicesPage     {...p} />} />
                <Route path="/reconciliation" element={<ReconciliationPage {...p} />} />
                <Route path="/rates"     element={<RateCalculatorPage />} />
                <Route path="/bulk"      element={<BulkComparePage       {...p} />} />
                <Route path="/rate-card" element={<RateCardPage          {...p} />} />
                <Route path="/quotes"    element={<QuoteHistoryPage      {...p} />} />
                <Route path="/whatsapp"  element={<WhatsAppPage          {...p} />} />
                <Route path="/sync"      element={<SyncPage              {...p} />} />
                <Route path="/profile"   element={<ProfilePage           {...p} />} />
                <Route path="/shipments" element={<ShipmentDashboardPage {...p} />} />
                <Route path="/wallet"    element={<PrivateRoute roles={['ADMIN','OPS_MANAGER']}><WalletPage {...p} /></PrivateRoute>} />
                <Route path="/analytics" element={<PrivateRoute roles={['ADMIN','OPS_MANAGER']}><AnalyticsPage {...p} /></PrivateRoute>} />
                <Route path="/ndr"       element={<PrivateRoute roles={['ADMIN','OPS_MANAGER','STAFF']}><NDRPage {...p} /></PrivateRoute>} />
                <Route path="/pickups"   element={<PrivateRoute roles={['ADMIN','OPS_MANAGER','STAFF']}><PickupSchedulerPage {...p} /></PrivateRoute>} />
                <Route path="/users"     element={<PrivateRoute adminOnly><UsersPage {...p} /></PrivateRoute>} />
                <Route path="/audit"     element={<PrivateRoute adminOnly><AuditPage /></PrivateRoute>} />
                <Route path="/rate-mgmt" element={<PrivateRoute adminOnly><RateManagementPage {...p} /></PrivateRoute>} />
              </Routes>
            </AppLayout>
          </PrivateRoute>
        } />

        {/* Catch-all — redirect to home */}
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
