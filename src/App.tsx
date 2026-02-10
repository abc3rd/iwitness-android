import { Link, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SessionPage from './pages/SessionPage';
import EvidencePage from './pages/EvidencePage';
import SettingsPage from './pages/SettingsPage';
import AffiliatePage from './pages/AffiliatePage';
import CRMPage from './pages/CRMPage';
import LeadsPage from './pages/LeadsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import QRCampaignsPage from './pages/QRCampaignsPage';
import OffersPage from './pages/OffersPage';
import AttorneyPortalPage from './pages/AttorneyPortalPage';
import MedicalPortalPage from './pages/MedicalPortalPage';
import AdminPage from './pages/AdminPage';
import CaseIntakePage from './pages/CaseIntakePage';
import { useAuth } from './auth/AuthContext';
import { useState } from 'react';

type NavSection = {
  label: string;
  items: { to: string; label: string }[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Core',
    items: [
      { to: '/', label: 'Dashboard' },
      { to: '/leads', label: 'Leads' },
      { to: '/crm', label: 'CRM Pipeline' },
      { to: '/analytics', label: 'Analytics' },
    ],
  },
  {
    label: 'Affiliate',
    items: [
      { to: '/affiliate', label: 'My Affiliate' },
      { to: '/qr-campaigns', label: 'QR Campaigns' },
      { to: '/offers', label: 'Offer Marketplace' },
    ],
  },
  {
    label: 'Portals',
    items: [
      { to: '/attorney', label: 'Attorney Portal' },
      { to: '/medical', label: 'Medical Portal' },
      { to: '/intake', label: 'Case Intake' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/evidence', label: 'Evidence' },
      { to: '/admin', label: 'Admin' },
      { to: '/settings', label: 'Settings' },
    ],
  },
];

function AppLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [navCollapsed, setNavCollapsed] = useState(false);

  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname === '/login') {
    return <LoginPage />;
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar" style={{ width: navCollapsed ? 60 : 240 }}>
        <div className="app-brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="app-brand-title" style={{ fontSize: navCollapsed ? 12 : 18 }}>
              {navCollapsed ? 'uC' : 'u-CRASH iWitness'}
            </div>
            {!navCollapsed && (
              <div className="app-brand-subtitle">Smart Affiliate Scan & Share</div>
            )}
          </div>
          <button
            onClick={() => setNavCollapsed(!navCollapsed)}
            style={{
              background: 'transparent', border: 'none', color: '#94a3b8',
              cursor: 'pointer', fontSize: 14, padding: 4,
            }}
          >
            {navCollapsed ? '\u25B6' : '\u25C0'}
          </button>
        </div>

        <nav className="app-nav" style={{ flexDirection: 'column', gap: navCollapsed ? '0.2rem' : '0.35rem' }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {!navCollapsed && (
                <div style={{
                  fontSize: 9, fontWeight: 700, opacity: 0.4,
                  textTransform: 'uppercase', letterSpacing: 1,
                  marginTop: 8, marginBottom: 4, paddingLeft: 6,
                }}>
                  {section.label}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = location.pathname === item.to ||
                  (item.to !== '/' && location.pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    className="app-nav-link"
                    to={item.to}
                    style={{
                      background: isActive ? '#111827' : undefined,
                      borderLeft: isActive ? '2px solid #4bce2a' : '2px solid transparent',
                      paddingLeft: navCollapsed ? 4 : undefined,
                      fontSize: navCollapsed ? 10 : 14,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={item.label}
                  >
                    {navCollapsed ? item.label.slice(0, 2) : item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {!navCollapsed && (
          <div className="app-footer-note">
            UCrash + LegendaryLeads Fusion Platform. All data encrypted and compliant.
          </div>
        )}
      </aside>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sessions/:id" element={<SessionPage />} />
          <Route path="/evidence" element={<EvidencePage />} />
          <Route path="/affiliate" element={<AffiliatePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/crm" element={<CRMPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/qr-campaigns" element={<QRCampaignsPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/attorney" element={<AttorneyPortalPage />} />
          <Route path="/medical" element={<MedicalPortalPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/intake" element={<CaseIntakePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <AppLayout />;
}
