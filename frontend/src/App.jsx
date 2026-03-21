// App.jsx — Lazy-loaded routes for optimal bundle splitting
import { BrowserRouter, Routes, Route, Navigate, Suspense, lazy } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useToast } from './hooks/useToast';
import { Toast } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { Spinner } from './components/ui/Loading';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// ── Public pages (small — load immediately) ────────────────────────────────
import LandingPage     from './pages/public/LandingPage';
import LoginPage       from './pages/LoginPage';

// ── Public pages — lazy (loaded only when visited) ─────────────────────────
const PublicTrackPage = lazy(() => import('./pages/public/PublicTrackPage'));
const ServicesPage    = lazy(() => import('./pages/public/ServicesPage'));
const ContactPage     = lazy(() => import('./pages/public/ContactPage'));
const BookPage        = lazy(() => import('./pages/public/BookPage'));

// ── App pages — ALL lazy-loaded (none load until user is authenticated) ────
const DashboardPage         = lazy(() => import('./pages/DashboardPage'));
const NewEntryPage          = lazy(() => import('./pages/NewEntryPage'));
const ImportPage            = lazy(() => import('./pages/ImportPage'));
const AllShipmentsPage      = lazy(() => import('./pages/AllShipmentsPage'));
const DailySheetPage        = lazy(() => import('./pages/DailySheetPage'));
const MonthlyReportPage     = lazy(() => import('./pages/MonthlyReportPage'));
const ClientsPage           = lazy(() => import('./pages/ClientsPage'));
const ContractsPage         = lazy(() => import('./pages/ContractsPage'));
const InvoicesPage          = lazy(() => import('./pages/InvoicesPage'));
const PendingPage           = lazy(() => import('./pages/PendingPage'));
const TrackPage             = lazy(() => import('./pages/TrackPage'));
const SyncPage              = lazy(() => import('./pages/SyncPage'));
const UsersPage             = lazy(() => import('./pages/UsersPage'));
const AuditPage             = lazy(() => import('./pages/AuditPage'));
const RateCalculatorPage    = lazy(() => import('./pages/RateCalculatorPage'));
const ProfilePage           = lazy(() => import('./pages/ProfilePage'));
const OperationsDashboard   = lazy(() => import('./pages/OperationsDashboard'));
const BulkComparePage       = lazy(() => import('./pages/BulkComparePage'));
const RateCardPage          = lazy(() => import('./pages/RateCardPage'));
const QuoteHistoryPage      = lazy(() => import('./pages/QuoteHistoryPage'));
const ReconciliationPage    = lazy(() => import('./pages/ReconciliationPage'));
const RateManagementPage    = lazy(() => import('./pages/RateManagementPage'));
const WhatsAppPage          = lazy(() => import('./pages/WhatsAppPage'));
const ShipmentDashboardPage = lazy(() => import('./pages/ShipmentDashboardPage'));
const NDRPage               = lazy(() => import('./pages/NDRPage'));
const PickupSchedulerPage   = lazy(() => import('./pages/PickupSchedulerPage'));
const WalletPage            = lazy(() => import('./pages/WalletPage'));
const AnalyticsPage         = lazy(() => import('./pages/AnalyticsPage'));

// ── Client portal pages ────────────────────────────────────────────────────
const ClientPortalPage      = lazy(() => import('./pages/client/ClientPortalPage'));
const ClientShipmentsPage   = lazy(() => import('./pages/client/ClientShipmentsPage'));
const ClientInvoicesPage    = lazy(() => import('./pages/client/ClientInvoicesPage'));
const ClientWalletPage      = lazy(() => import('./pages/client/ClientWalletPage'));
const ClientTrackPage       = lazy(() => import('./pages/client/ClientTrackPage'));

// ── Fallback spinner shown while lazy chunks load ──────────────────────────
function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🦅</div>
        <Spinner size="lg" />
      </div>
    </div>
  );
}

// ── Route guard ────────────────────────────────────────────────────────────
function PrivateRoute({ children, adminOnly = false, roles = null }) {
  const { user, loading, isAdmin, hasRole } = useAuth();
  if (loading) return <PageLoader />;
  if (!user)                       return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin)       return <Navigate to="/app" replace />;
  if (roles && !hasRole(...roles)) return <Navigate to="/app" replace />;
  return children;
}

// ── Client-only route ──────────────────────────────────────────────────────
function ClientRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user)            return <Navigate to="/login" replace />;
  if (user.role === 'CLIENT') return children;
  return <Navigate to="/app" replace />;
}

function AppRoutes() {
  const { toasts, toast, removeToast } = useToast();
  const p = { toast };
  return (
    <>
      <Toast toasts={toasts} removeToast={removeToast} />
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Public ── */}
          <Route path="/"           element={<LandingPage />} />
          <Route path="/services"   element={<ServicesPage />} />
          <Route path="/contact"    element={<ContactPage />} />
          <Route path="/book"       element={<BookPage />} />
          <Route path="/track"      element={<PublicTrackPage />} />
          <Route path="/track/:awb" element={<PublicTrackPage />} />
          <Route path="/login"      element={<LoginPage />} />

          {/* ── Client self-service portal ── */}
          <Route path="/portal/*" element={
            <ClientRoute>
              <Routes>
                <Route path="/"          element={<ClientPortalPage   {...p} />} />
                <Route path="/shipments" element={<ClientShipmentsPage {...p} />} />
                <Route path="/invoices"  element={<ClientInvoicesPage  {...p} />} />
                <Route path="/wallet"    element={<ClientWalletPage    {...p} />} />
                <Route path="/track"     element={<ClientTrackPage     {...p} />} />
              </Routes>
            </ClientRoute>
          } />

          {/* ── Staff/admin app ── */}
          <Route path="/app/*" element={
            <PrivateRoute>
              <AppLayout>
                <Routes>
                  <Route path="/"               element={<DashboardPage         {...p} />} />
                  <Route path="/ops"            element={<OperationsDashboard   {...p} />} />
                  <Route path="/entry"          element={<NewEntryPage          {...p} />} />
                  <Route path="/import"         element={<ImportPage            {...p} />} />
                  <Route path="/all"            element={<AllShipmentsPage      {...p} />} />
                  <Route path="/pending"        element={<PendingPage           {...p} />} />
                  <Route path="/track"          element={<TrackPage             {...p} />} />
                  <Route path="/daily"          element={<DailySheetPage        {...p} />} />
                  <Route path="/monthly"        element={<MonthlyReportPage     {...p} />} />
                  <Route path="/clients"        element={<ClientsPage           {...p} />} />
                  <Route path="/contracts"      element={<ContractsPage         {...p} />} />
                  <Route path="/invoices"       element={<InvoicesPage          {...p} />} />
                  <Route path="/reconciliation" element={<ReconciliationPage    {...p} />} />
                  <Route path="/rates"          element={<RateCalculatorPage />} />
                  <Route path="/bulk"           element={<BulkComparePage       {...p} />} />
                  <Route path="/rate-card"      element={<RateCardPage          {...p} />} />
                  <Route path="/quotes"         element={<QuoteHistoryPage      {...p} />} />
                  <Route path="/whatsapp"       element={<WhatsAppPage          {...p} />} />
                  <Route path="/sync"           element={<SyncPage              {...p} />} />
                  <Route path="/profile"        element={<ProfilePage           {...p} />} />
                  <Route path="/shipments"      element={<ShipmentDashboardPage {...p} />} />
                  <Route path="/wallet"         element={<PrivateRoute roles={['ADMIN','OPS_MANAGER']}><WalletPage {...p} /></PrivateRoute>} />
                  <Route path="/analytics"      element={<PrivateRoute roles={['ADMIN','OPS_MANAGER']}><AnalyticsPage {...p} /></PrivateRoute>} />
                  <Route path="/ndr"            element={<PrivateRoute roles={['ADMIN','OPS_MANAGER','STAFF']}><NDRPage {...p} /></PrivateRoute>} />
                  <Route path="/pickups"        element={<PrivateRoute roles={['ADMIN','OPS_MANAGER','STAFF']}><PickupSchedulerPage {...p} /></PrivateRoute>} />
                  <Route path="/users"          element={<PrivateRoute adminOnly><UsersPage {...p} /></PrivateRoute>} />
                  <Route path="/audit"          element={<PrivateRoute adminOnly><AuditPage /></PrivateRoute>} />
                  <Route path="/rate-mgmt"      element={<PrivateRoute adminOnly><RateManagementPage {...p} /></PrivateRoute>} />
                </Routes>
              </AppLayout>
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
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
