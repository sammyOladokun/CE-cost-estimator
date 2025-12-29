import React from "react";
import { BrowserRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import MarketplacePage from "./pages/MarketplacePage";
import ToolDetailPage from "./pages/ToolDetailPage";
import DashboardPage from "./pages/DashboardPage";
import DashboardToolPage from "./pages/DashboardToolPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AuthModal from "./components/AuthModal";
import { useAuth } from "./context/AuthContext";

const App: React.FC = () => {
  const { user, openAuth, logout } = useAuth();
  const location = useLocation();
  const [showProfileCard, setShowProfileCard] = React.useState(false);

  const inDashboard = location.pathname.startsWith("/dashboard");
  const inTenant = location.pathname.startsWith("/tenant");
  const inMarketplace = location.pathname.startsWith("/marketplace");

  const handleProfileClick = () => {
    if (!user) {
      openAuth();
      return;
    }
    setShowProfileCard((prev) => !prev);
  };

  return (
    <div className="shell" onClick={() => setShowProfileCard(false)}>
      <nav className="topnav" onClick={(e) => e.stopPropagation()}>
        <Link to="/" className="brand">
          neXdigitals.agency
        </Link>
        <div className="nav-links">
          {!inMarketplace && (
            <Link to="/marketplace" className="icon-link">
              <span className="icon">🛍</span>
              <span className="icon-label">Marketplace</span>
            </Link>
          )}
          {!inDashboard && (
            <Link to="/dashboard" className="icon-link">
              <span className="icon">📊</span>
              <span className="icon-label">Command Center</span>
            </Link>
          )}
          {!inTenant && (
            <Link to="/tenant" className="icon-link">
              <span className="icon">🧰</span>
              <span className="icon-label">Tenant</span>
            </Link>
          )}
          <div className="profile-pill" onClick={handleProfileClick}>
            {user ? (
              <>
                <span className="avatar">{user.full_name?.[0] || user.email[0]}</span>
                <span>{user.email}</span>
              </>
            ) : (
              <span>Login / Register</span>
            )}
          </div>
          {user && showProfileCard && (
            <div className="profile-card">
              <p className="nx-kicker">Profile</p>
              <p className="nx-subtle">{user.full_name}</p>
              <p className="nx-subtle">{user.email}</p>
              <button className="nx-ghost" onClick={logout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/marketplace/:slug" element={<ToolDetailPage />} />
        <Route path="/dashboard" element={<AdminDashboardPage />} />
        <Route path="/tenant" element={<DashboardPage />} />
        <Route path="/tenant/tools/:slug" element={<DashboardToolPage />} />
      </Routes>
      <AuthModal />
    </div>
  );
};

export default function AppWithRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
