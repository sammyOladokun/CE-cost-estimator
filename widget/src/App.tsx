import React from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import MarketplacePage from "./pages/MarketplacePage";
import ToolDetailPage from "./pages/ToolDetailPage";
import DashboardPage from "./pages/DashboardPage";
import DashboardToolPage from "./pages/DashboardToolPage";
import AuthModal from "./components/AuthModal";
import { useAuth } from "./context/AuthContext";

const App: React.FC = () => {
  const { user, openAuth } = useAuth();
  return (
    <BrowserRouter>
      <div className="shell">
        <nav className="topnav">
          <Link to="/" className="brand">
            neXdigitals.agency
          </Link>
          <div className="nav-links">
            <Link to="/marketplace">Marketplace</Link>
            <Link to="/dashboard">Dashboard</Link>
            <div className="profile-pill" onClick={openAuth}>
              {user ? (
                <>
                  <span className="avatar">{user.full_name?.[0] || user.email[0]}</span>
                  <span>{user.email}</span>
                </>
              ) : (
                <span>Login / Register</span>
              )}
            </div>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/:slug" element={<ToolDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/tools/:slug" element={<DashboardToolPage />} />
        </Routes>
        <AuthModal />
      </div>
    </BrowserRouter>
  );
};

export default App;
