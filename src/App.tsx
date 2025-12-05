import { Link, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SessionPage from './pages/SessionPage';
import EvidencePage from './pages/EvidencePage';
import SettingsPage from './pages/SettingsPage';
import { useAuth } from './auth/AuthContext';
import AffiliatePage from './pages/AffiliatePage';

function AppLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // If not authenticated and not already on /login, go to login
  if (!isAuthenticated && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  // Login page is full screen
  if (location.pathname === '/login') {
    return <LoginPage />;
  }

  return (
    <div className="app-shell">
      {/* Sidebar / Top bar on mobile */}
      <aside className="app-sidebar">
        <div className="app-brand">
          <div className="app-brand-title">u-CRASH iWitness</div>
          <div className="app-brand-subtitle">Omega UI • Accident Reporting</div>
        </div>

       <nav className="app-nav">
         <Link className="app-nav-link" to="/">
         Dashboard
                     </Link>
            <Link className="app-nav-link" to="/evidence">
          Evidence
           </Link>
        <Link className="app-nav-link" to="/affiliate">
          Affiliate
       </Link>
       <Link className="app-nav-link" to="/settings">
    Settings
  </Link>
</nav>

        <div className="app-footer-note">
          All reports are logged and maintained under Omega UI / u-CRASH retention policies.
        </div>
      </aside>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sessions/:id" element={<SessionPage />} />
          <Route path="/evidence" element={<EvidencePage />} />
          <Route path="/affiliate" element={<AffiliatePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <AppLayout />;
}
