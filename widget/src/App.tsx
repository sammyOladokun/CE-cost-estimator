import React from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import MarketplacePage from "./pages/MarketplacePage";
import ToolDetailPage from "./pages/ToolDetailPage";
import DashboardPage from "./pages/DashboardPage";

const App: React.FC = () => {
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
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/marketplace/:slug" element={<ToolDetailPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
