import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { useToast } from './hooks/useToast';
import { Toast } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { Spinner } from './components/ui/Loading';

const ClientPortalPage = lazy(() => import('./pages/client/ClientPortalPage'));
const ClientInvoicesPage = lazy(() => import('./pages/client/ClientInvoicesPage'));
const ClientWalletPage = lazy(() => import('./pages/client/ClientWalletPage'));
const ClientShipmentsPage = lazy(() => import('./pages/client/ClientShipmentsPage'));
const ClientBulkTrackPage = lazy(() => import('./pages/client/ClientBulkTrackPage'));
const ClientNDRPage = lazy(() => import('./pages/client/ClientNDRPage'));
const ClientPickupPage = lazy(() => import('./pages/client/ClientPickupPage'));
const ClientRateCalculatorPage = lazy(() => import('./pages/client/ClientRateCalculatorPage'));
const ClientImportPage = lazy(() => import('./pages/client/ClientImportPage'));
const ClientSupportTicketsPage = lazy(() => import('./pages/client/ClientSupportTicketsPage'));
const ClientLiveMapPage = lazy(() => import('./pages/client/ClientLiveMapPage'));
const ClientNotificationsPage = lazy(() => import('./pages/client/ClientNotificationsPage'));
const ClientRTOIntelligencePage = lazy(() => import('./pages/client/ClientRTOIntelligencePage'));
const ClientPODPage = lazy(() => import('./pages/client/ClientPODPage'));
const ClientBrandTrackingPage = lazy(() => import('./pages/client/ClientBrandTrackingPage'));
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
const BookingsPage = lazy(() => import('./pages/BookingsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const RateCalculatorPage = lazy(() => import('./pages/RateCalculatorPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));
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
const OwnerAuditPage = lazy(() => import('./pages/OwnerAuditPage'));

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
        <p style={{ color: '#475569', fontSize: 12, marginTop: 12, fontFamily: 'Inter, sans-serif' }}>Authenticating...</p>
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

function PrivateRoute({ children, adminOnly = false, ownerOnly = false, roles = null }) {
  const { user, isAdmin, isOwner, hasRole } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (ownerOnly && !isOwner) return <Navigate to="/app" replace />;
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
  const withToast = (Component, extraProps = {}) => <Component toast={toast} {...extraProps} />;

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

            <Route path="/portal" element={<ClientRoute>{withToast(ClientPortalPage)}</ClientRoute>} />
            <Route path="/portal/invoices" element={<ClientRoute>{withToast(ClientInvoicesPage)}</ClientRoute>} />
            <Route path="/portal/wallet" element={<ClientRoute>{withToast(ClientWalletPage)}</ClientRoute>} />
            <Route path="/portal/shipments" element={<ClientRoute>{withToast(ClientShipmentsPage)}</ClientRoute>} />
            <Route path="/portal/bulk-track" element={<ClientRoute>{withToast(ClientBulkTrackPage)}</ClientRoute>} />
            <Route path="/portal/ndr" element={<ClientRoute>{withToast(ClientNDRPage)}</ClientRoute>} />
            <Route path="/portal/pickups" element={<ClientRoute>{withToast(ClientPickupPage)}</ClientRoute>} />
            <Route path="/portal/rates" element={<ClientRoute>{withToast(ClientRateCalculatorPage)}</ClientRoute>} />
            <Route path="/portal/import" element={<ClientRoute>{withToast(ClientImportPage)}</ClientRoute>} />
            <Route path="/portal/support" element={<ClientRoute>{withToast(ClientSupportTicketsPage)}</ClientRoute>} />
            <Route path="/portal/map" element={<ClientRoute>{withToast(ClientLiveMapPage)}</ClientRoute>} />
            <Route path="/portal/notifications" element={<ClientRoute>{withToast(ClientNotificationsPage)}</ClientRoute>} />
            <Route path="/portal/rto-intelligence" element={<ClientRoute>{withToast(ClientRTOIntelligencePage)}</ClientRoute>} />
            <Route path="/portal/pod" element={<ClientRoute>{withToast(ClientPODPage)}</ClientRoute>} />
            <Route path="/portal/branding" element={<ClientRoute>{withToast(ClientBrandTrackingPage)}</ClientRoute>} />
            <Route path="/portal/*" element={<ClientRoute>{withToast(ClientPortalPage)}</ClientRoute>} />

            <Route
              path="/app/*"
              element={
                <StaffRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={withToast(DashboardPage)} />
                      <Route path="/ops" element={withToast(OperationsDashboard)} />
                      <Route path="/entry" element={withToast(NewEntryPage)} />
                      <Route path="/import" element={withToast(ImportPage)} />
                      <Route path="/all" element={<Navigate to="/app/shipments" replace />} />
                      <Route path="/pending" element={withToast(PendingPage)} />
                      <Route path="/track" element={withToast(TrackPage)} />
                      <Route path="/daily" element={withToast(DailySheetPage)} />
                      <Route path="/monthly" element={withToast(MonthlyReportPage)} />
                      <Route path="/bookings" element={<PrivateRoute roles={['ADMIN', 'OPS_MANAGER', 'STAFF']}><BookingsPage /></PrivateRoute>} />
                      <Route path="/clients" element={withToast(ClientsPage)} />
                      <Route path="/contracts" element={withToast(ContractsPage)} />
                      <Route path="/invoices" element={withToast(InvoicesPage)} />
                      <Route path="/support" element={<PrivateRoute roles={['ADMIN', 'OPS_MANAGER', 'STAFF']}>{withToast(SupportTicketsPage)}</PrivateRoute>} />
                      <Route path="/reconciliation" element={withToast(ReconciliationPage)} />
                      <Route path="/rates" element={<RateCalculatorPage />} />
                      <Route path="/audit" element={<PrivateRoute ownerOnly>{withToast(OwnerAuditPage)}</PrivateRoute>} />
                      <Route path="/billing-verify" element={<Navigate to="/app/audit" replace />} />
                      <Route path="/bulk" element={withToast(BulkComparePage)} />
                      <Route path="/rate-card" element={withToast(RateCardPage)} />
                      <Route path="/quotes" element={withToast(QuoteHistoryPage)} />
                      <Route path="/whatsapp" element={withToast(WhatsAppPage)} />
                      <Route path="/sync" element={withToast(SyncPage)} />
                      <Route path="/scan" element={withToast(ScanAWBPage)} />
                      <Route path="/change-password" element={<ChangePasswordPage />} />
                      <Route path="/profile" element={withToast(ProfilePage)} />
                      <Route path="/shipments" element={withToast(ShipmentDashboardPage)} />
                      <Route path="/wallet" element={<PrivateRoute roles={['ADMIN', 'OPS_MANAGER']}>{withToast(WalletPage)}</PrivateRoute>} />
                      <Route path="/analytics" element={<PrivateRoute roles={['ADMIN', 'OPS_MANAGER']}>{withToast(AnalyticsPage)}</PrivateRoute>} />
                      <Route path="/ndr" element={<PrivateRoute roles={['ADMIN', 'OPS_MANAGER', 'STAFF']}>{withToast(NDRPage)}</PrivateRoute>} />
                      <Route path="/pickups" element={<PrivateRoute roles={['ADMIN', 'OPS_MANAGER', 'STAFF']}>{withToast(PickupSchedulerPage)}</PrivateRoute>} />
                      <Route path="/users" element={<PrivateRoute adminOnly>{withToast(UsersPage)}</PrivateRoute>} />
                      <Route path="/audit-logs" element={<PrivateRoute adminOnly><AuditPage /></PrivateRoute>} />
                      <Route path="/rate-mgmt" element={<PrivateRoute adminOnly>{withToast(RateManagementPage)}</PrivateRoute>} />
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
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
