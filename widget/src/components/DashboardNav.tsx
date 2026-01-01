import React from "react";
import { Link } from "react-router-dom";
import { LinkSimple, Storefront } from "@phosphor-icons/react";

type DashboardNavProps = {
  user: { full_name?: string; email?: string } | null;
  showProfile: boolean;
  onToggleProfile: () => void;
};

const DashboardNav: React.FC<DashboardNavProps> = ({ user, showProfile, onToggleProfile }) => (
  <nav className="syn-nav glass-panel" onClick={(e) => e.stopPropagation()}>
    <div className="syn-container syn-nav-inner">
      <Link to="/" className="syn-brand">
        <div className="syn-brand-mark">
          <LinkSimple size={18} weight="duotone" />
        </div>
        <span>Synapse</span>
      </Link>
      <div className="syn-nav-links" aria-hidden="true" />
      <div className="syn-nav-actions">
        <Link to="/marketplace" className="syn-link nav-with-icon">
          <Storefront size={16} weight="duotone" />
          MarketPlace
        </Link>
        <div className="profile-wrap" onClick={(e) => e.stopPropagation()}>
          <button className="profile-pill" onClick={onToggleProfile}>
            <span className="avatar">{user?.full_name?.[0] || user?.email?.[0]}</span>
          </button>
          {user && showProfile && (
            <div className="profile-card">
              <p className="nx-kicker">Profile</p>
              <p className="nx-subtle">{user.full_name}</p>
              <p className="nx-subtle">{user.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </nav>
);

export default DashboardNav;
