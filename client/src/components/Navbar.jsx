
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Compass,
  LogOut,
  UserRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const navItems = [
  { label: "Explore", to: "/explore" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Plan Trip", to: "/plan-trip" },
  { label: "Flights", to: "/flights" },
  { label: "Trains", to: "/trains" },
  { label: "Buses", to: "/buses" },
  { label: "Hotels", to: "/hotels" },
  { label: "Cruises", to: "/cruises" },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = (user?.name || "T")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  function closeMenu() {
    setMenuOpen(false);
  }

  function goToExplore() {
    closeMenu();
    navigate("/explore");
  }

  function handleLogout() {
    closeMenu();
    logout();
    navigate("/login", { replace: true });
  }

  function renderLinks(mobile = false) {
    return navItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        onClick={mobile ? closeMenu : undefined}
        className={({ isActive }) =>
          `voyago-nav-link${isActive ? " active" : ""}`
        }
      >
        {item.label}
      </NavLink>
    ));
  }

  return (
    <header className="voyago-navbar">
      <nav className="voyago-navbar-inner" aria-label="Main navigation">
        <Link
          to="/explore"
          className="voyago-brand"
          onClick={closeMenu}
          aria-label="VOYAGO Explore"
        >
          <span className="voyago-brand-icon">
            <Compass size={22} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="voyago-brand-word">
            VOYAGO<span className="voyago-brand-period">.</span>
          </span>
        </Link>

        {isAuthenticated && (
          <div className="voyago-desktop-links">
            {renderLinks()}
          </div>
        )}

        <div className="voyago-desktop-actions">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="voyago-logout"
                aria-label="Open my profile"
              >
                <span
                  className="voyago-avatar"
                  style={{
                    width: 27,
                    height: 27,
                    borderRadius: 9,
                  }}
                >
                  {initials || "T"}
                </span>
                <span>Profile</span>
              </Link>

              <button
                className="voyago-logout"
                type="button"
                onClick={handleLogout}
              >
                <LogOut size={15} aria-hidden="true" />
                <span>Log out</span>
              </button>
            </>
          ) : (
            <>
              <Link className="voyago-login" to="/login">
                Log in
              </Link>
              <Link className="voyago-get-started" to="/register">
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="voyago-menu-toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="voyago-mobile-panel"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X size={22} aria-hidden="true" />
          ) : (
            <Menu size={22} aria-hidden="true" />
          )}
        </button>
      </nav>

      {menuOpen && (
        <div className="voyago-mobile-panel" id="voyago-mobile-panel">
          {isAuthenticated ? (
            <>
              <div className="voyago-mobile-links">
                <p className="voyago-mobile-section-label">
                  YOUR JOURNEY
                </p>
                {renderLinks(true)}
              </div>

              <div className="voyago-mobile-account">
                <div className="voyago-mobile-user-info">
                  <span className="voyago-avatar">
                    {initials || "T"}
                  </span>
                  <div>
                    <span className="voyago-mobile-user-name">
                      {user?.name || "Traveler"}
                    </span>
                    <span className="voyago-mobile-user-caption">
                      Signed in to VOYAGO
                    </span>
                  </div>
                </div>

                <Link
                  className="voyago-logout voyago-mobile-logout"
                  to="/profile"
                  onClick={closeMenu}
                >
                  <UserRound size={16} aria-hidden="true" />
                  My Profile
                </Link>

                <button
                  className="voyago-logout voyago-mobile-logout"
                  type="button"
                  onClick={handleLogout}
                >
                  <LogOut size={16} aria-hidden="true" />
                  Log out
                </button>
              </div>
            </>
          ) : (
            <div className="voyago-mobile-auth">
              <Link
                className="voyago-login"
                to="/login"
                onClick={closeMenu}
              >
                Log in
              </Link>
              <Link
                className="voyago-get-started"
                to="/register"
                onClick={closeMenu}
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
