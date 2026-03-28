// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useToast } from './hooks/useToast';
import { Toast } from './components/ui/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { Spinner } from './components/ui/Loading';


import ClientPortalPage from './pages/client/ClientPortalPage';
import LandingPage from './pages/public/LandingPage';
import PublicTrackPage from './pages/public/PublicTrackPage';
import ServicesPage from './pages/public/ServicesPage';
import ContactPage from './pages/public/ContactPage';
import BookPage from './pages/public/BookPage';
import LoginPage from './pages/LoginPage';

import DashboardPage from './pages/DashboardPage';
import NewEntryPage from './pages/NewEntryPage';
import ImportPage from './pages/ImportPage';
import AllShipmentsPage from './pages/AllShipmentsPage';
import DailySheetPage from './pages/DailySheetPage';
import MonthlyReportPage from './pages/MonthlyReportPage';
import ClientsPage from './pages/ClientsPage';
import ContractsPage from './pages/ContractsPage';
import InvoicesPage from './pages/InvoicesPage';
import PendingPage from './pages/PendingPage';
import TrackPage from './pages/TrackPage';
import SyncPage from './pages/SyncPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';
import RateCalculatorPage from './pages/RateCalculatorPage';
import ProfilePage from './pages/ProfilePage';
import OperationsDashboard from './pages/OperationsDashboard';
import BulkComparePage from './pages/BulkComparePage';
import RateCardPage from './pages/RateCardPage';
import QuoteHistoryPage from './pages/QuoteHistoryPage';
import ReconciliationPage from './pages/ReconciliationPage';
import RateManagementPage from './pages/RateManagementPage';
import WhatsAppPage from './pages/WhatsAppPage';
import ShipmentDashboardPage from './pages/ShipmentDashboardPage';
import ScanAWBPage from './pages/ScanAWBPage';
import NDRPage from './pages/NDRPage';
import PickupSchedulerPage from './pages/PickupSchedulerPage';
import WalletPage from './pages/WalletPage';
import AnalyticsPage from './pages/AnalyticsPage';

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
              padding: 4
            }}
          />
        </div>
        <Spinner size="lg" />
        <p style={{ color: '#475569', fontSize: 12, marginTop: 12, fontFamily: 'monospace' }}>Authenticating...</p>
      </div>
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

// CLIENT users should never reach /app — redirect them to /portal
function StaffRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'CLIENT') return <Navigate to="/portal" replace />;
  return children;
}

// CLIENT-only guard
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
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/book" element={<BookPage />} />
          <Route path="/track" element={<PublicTrackPage />} />
          <Route path="/track/:awb" element={<PublicTrackPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* ── CLIENT PORTAL ── */}
          <Route path="/portal" element={<ClientRoute><ClientPortalPage {...p} /></ClientRoute>} />
          <Route path="/portal/*" element={<ClientRoute><ClientPortalPage {...p} /></ClientRoute>} />

          <Route path="/app/*" element={
            <StaffRoute>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<DashboardPage         {...p} />} />
                  <Route path="/ops" element={<OperationsDashboard   {...p} />} />
                  <Route path="/entry" element={<NewEntryPage          {...p} />} />
                  <Route path="/import" element={<ImportPage            {...p} />} />
                  <Route path="/all" element={<AllShipmentsPage      {...p} />} />
                  <Route path="/pending" element={<PendingPage           {...p} />} />
                  <Route path="/track" element={<TrackPage             {...p} />} />
                  <Route path="/daily" element={<DailySheetPage        {...p} />} />
                  <Route path="/monthly" element={<MonthlyReportPage     {...p} />} />
                  <Route path="/clients" element={<ClientsPage      {...p} />} />
                  <Route path="/contracts" element={<ContractsPage    {...p} />} />
                  <Route path="/invoices" element={<InvoicesPage     {...p} />} />
                  <Route path="/reconciliation" element={<ReconciliationPage {...p} />} />
                  <Route path="/rates" element={<RateCalculatorPage />} />
                  <Route path="/bulk" element={<BulkComparePage       {...p} />} />
                  <Route path="/rate-card" element={<RateCardPage          {...p} />} />
                  <Route path="/quotes" element={<QuoteHistoryPage      {...p} />} />
                  <Route path="/whatsapp" element={<WhatsAppPage          {...p} />} />
                  <Route path="/sync" element={<SyncPage              {...p} />} />
                  <Route path="/scan" element={<ScanAWBPage           {...p} />} />
                  <Route path="/profile" element={<ProfilePage           {...p} />} />
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
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
