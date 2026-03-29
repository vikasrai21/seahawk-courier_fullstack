import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useToast } from './hooks/useToast';
import { Toast } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { Spinner } from './components/ui/Loading';

const ClientPortalPage = lazy(() => import('./pages/client/ClientPortalPage'));
const ClientInvoicesPage = lazy(() => import('./pages/client/ClientInvoicesPage'));
const ClientWalletPage = lazy(() => import('./pages/client/ClientWalletPage'));
const ClientShipmentsPage = lazy(() => import('./pages/client/ClientShipmentsPage'));
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const PublicTrackPage = lazy(() => import('./pages/public/PublicTrackPage'));
const ServicesPage = lazy(() => import('./pages/public/ServicesPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const BookPage = lazy(() => import('./pages/public/BookPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const NewEntryPage = lazy(() => import('./pages/NewEntryPage'));
const ImportPage = lazy(() => import('./pages/ImportPage'));
const AllShipmentsPage = lazy(() => import('./pages/AllShipmentsPage'));
const DailySheetPage = lazy(() => import('./pages/DailySheetPage'));
const MonthlyReportPage = lazy(() => import('./pages/MonthlyReportPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const ContractsPage = lazy(() => import('./pages/ContractsPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const PendingPage = lazy(() => import('./pages/PendingPage'));
const TrackPage = lazy(() => import('./pages/TrackPage'));
const SyncPage = lazy(() => import('./pages/SyncPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const RateCalculatorPage = lazy(() => import('./pages/RateCalculatorPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OperationsDashboard = lazy(() => import('./pages/OperationsDashboard'));
const BulkComparePage = lazy(() => import('./pages/BulkComparePage'));
const RateCardPage = lazy(() => import('./pages/RateCardPage'));
const QuoteHistoryPage = lazy(() => import('./pages/QuoteHistoryPage'));
const ReconciliationPage = lazy(() => import('./pages/ReconciliationPage'));
const RateManagementPage = lazy(() => import('./pages/RateManagementPage'));
const WhatsAppPage = lazy(() => import('./pages/WhatsAppPage'));
const ShipmentDashboardPage = lazy(() => import('./pages/ShipmentDashboardPage'));
const ScanAWBPage = lazy(() => import('./pages/ScanAWBPage'));
const NDRPage = lazy(() => import('./pages/NDRPage'));
const PickupSchedulerPage = lazy(() => import('./pages/PickupSchedulerPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SupportTicketsPage = lazy(() => import('./pages/SupportTicketsPage'));

function AuthLoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#080d18' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 16 }}>
          <img
            src="/images/logo.png"
            alt="Sea Hawk Logo"
            style={{
              height: 64,
              width: 'auto',
              objectFit: 'contain',
              background: '#fff',
              borderRadius: 8,
              padding: 4,
            }}
          />
        </div>
        <Spinner size="lg" />
        <p style={{ color: '#475569', fontSize: 12, marginTop: 12, fontFamily: 'Outfit, sans-serif' }}>Authenticating...</p>
      </div>
    </div>
  );
}

function RouteLoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Spinner size="lg" />
    </div>
  );
}

function PrivateRoute({ children, adminOnly = false, roles = null }) {
  const { user, isAdmin, hasRole } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/app" replace />;
  if (roles && !hasRole(...roles)) return <Navigate to="/app" replace />;
  return children;
}

function StaffRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'CLIENT') return <Navigate to="/portal" replace />;
  return children;
}

function ClientRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'CLIENT' && user.role !== 'ADMIN') return <Navigate to="/app" replace />;
  return children;
}

function AuthGate({ children }) {
  const { loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  return children;
}

function AppRoutes() {
  const { toasts, toast, removeToast } = useToast();
  const p = { toast };

  return (
    <>
      <Toast toasts={toasts} removeToast={removeToast} />
      <AuthGate>
        <Suspense fallback={<RouteLoadingScreen />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/book" element={<BookPage />} />
            <Route path="/track" element={<PublicTrackPage />} />
            <Route path="/track/:awb" element={<PublicTrackPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/portal" element={<ClientRoute><ClientPortalPage {...p} /></ClientRoute>} />
            <Route path="/portal/invoices" element={<ClientRoute><ClientInvoicesPage {...p} /></ClientRoute>} />
            <Route path="/portal/wallet" element={<ClientRoute><ClientWalletPage {...p} /></ClientRoute>} />
            <Route path="/portal/shipments" element={<ClientRoute><ClientShipmentsPage {...p} /></ClientRoute>} />
            <Route path="/portal/*" element={<ClientRoute><ClientPortalPage {...p} /></ClientRoute>} />

            <Route
              path="/app/*"
              element={
                <StaffRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<DashboardPage {...p} />} />
                      <Route path="/ops" element={<OperationsDashboard {...p} />} />
                      <Route path="/entry" element={<NewEntryPage {...p} />} />
                      <Route path="/import" element={<ImportPage {...p} />} />
                      <Route path="/all" element={<AllShipmentsPage {...p} />} />
                      <Route path="/pending" element={<PendingPage {...p} />} />
                      <Route path="/track" element={<TrackPage {...p} />} />
                      <Route path="/daily" element={<DailySheetPage {...p} />} />
                      <Route path="/monthly" element={<MonthlyReportPage {...p} />} />
                      <Route path="/clients" element={<ClientsPage {...p} />} />
                      <Route path="/contracts" element={<ContractsPage {...p} />} />
                      <Route path="/invoices" element={<InvoicesPage {...p} />} />
                      <Route path="/support" element={<PrivateRoute roles={['ADMIN', 'OPS_MANAGER', 'STAFF']}><SupportTicketsPage {...p} /></PrivateRoute>} />
                      <Route path="/reconciliation" element={<ReconciliationPage {...p} />} />
                      <Route path="/rates" element={<RateCalculatorPage />} />
                      <Route path="/bulk" element={<BulkComparePage {...p} />} />
                      <Route path="/rate-card" element={<RateCardPage {...p} />} />
                      <Route path="/quotes" element={<QuoteHistoryPage {...p} />} />
                      <Route path="/whatsapp" element={<WhatsAppPage {...p} />} />
                      <Route path="/sync" element={<SyncPage {...p} />} />
                      <Route path="/scan" element={<ScanAWBPage {...p} />} />
                      <Route path="/profile" element={<ProfilePage {...p} />} />
                      <Route path="/shipments" element={<ShipmentDashboardPage {...p} />} />
                      <Route path="/wallet" element={<PrivateRoute roles={['ADMIN', 'OPS_MANAGER']}><WalletPage {...p} /></PrivateRoute>} />
                      <Route path="/analytics" element={<PrivateRoute roles={['ADMIN', 'OPS_MANAGER']}><AnalyticsPage {...p} /></PrivateRoute>} />
                      <Route path="/ndr" element={<PrivateRoute roles={['ADMIN', 'OPS_MANAGER', 'STAFF']}><NDRPage {...p} /></PrivateRoute>} />
                      <Route path="/pickups" element={<PrivateRoute roles={['ADMIN', 'OPS_MANAGER', 'STAFF']}><PickupSchedulerPage {...p} /></PrivateRoute>} />
                      <Route path="/users" element={<PrivateRoute adminOnly><UsersPage {...p} /></PrivateRoute>} />
                      <Route path="/audit" element={<PrivateRoute adminOnly><AuditPage /></PrivateRoute>} />
                      <Route path="/rate-mgmt" element={<PrivateRoute adminOnly><RateManagementPage {...p} /></PrivateRoute>} />
                    </Routes>
                  </AppLayout>
                </StaffRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthGate>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
