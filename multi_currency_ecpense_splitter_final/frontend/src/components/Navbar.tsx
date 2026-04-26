import { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaHome, FaUsers, FaPlus, FaWallet,
  FaBell, FaUser, FaSignOutAlt,
} from "react-icons/fa";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');

.nb-root {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  font-family: 'DM Sans', sans-serif;
}

/* Full-bleed bar */
.nb-bar {
  width: 100%;
  box-sizing: border-box;
  background: rgba(240,237,232,0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1.5px solid rgba(0,0,0,0.07);
  height: 68px;
  display: flex;
  align-items: center;
  /* Logo flush left edge, logout flush right edge */
  padding: 0 32px;
  gap: 0;
}

/* ── Logo — pinned to left edge ── */
.nb-logo {
  font-family: 'Fraunces', serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: #1a1f2e;
  text-decoration: none;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 9px;
  margin-right: auto; /* pushes everything else right */
}
.nb-logo-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #2d7a52;
  flex-shrink: 0;
}
.nb-logo-accent { color: #2d7a52; }

/* ── Centre nav links ── */
.nb-links {
  display: flex;
  align-items: center;
  gap: 4px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.nb-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  color: #6b7280;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}
.nb-link:hover {
  background: rgba(0,0,0,0.05);
  color: #1a1f2e;
}
.nb-link.active {
  background: #ffffff;
  color: #2d7a52;
  font-weight: 600;
  box-shadow: 0 1px 5px rgba(0,0,0,0.09);
}
.nb-link svg { font-size: 14px; flex-shrink: 0; opacity: 0.7; }
.nb-link.active svg, .nb-link:hover svg { opacity: 1; }

/* Add Expense accent pill */
.nb-link-add {
  background: #2d7a52 !important;
  color: #fff !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 10px rgba(45,122,82,0.30);
  margin: 0 6px;
}
.nb-link-add:hover {
  background: #236643 !important;
  color: #fff !important;
  transform: translateY(-1px);
  box-shadow: 0 5px 16px rgba(45,122,82,0.38) !important;
}
.nb-link-add svg { opacity: 1 !important; }

/* ── Right actions — pinned to right edge ── */
.nb-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: auto; /* pushes to right */
}

/* Icon buttons — larger */
.nb-icon-btn {
  width: 40px; height: 40px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  text-decoration: none;
  color: #6b7280;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 17px;
  transition: background 0.15s, color 0.15s;
  position: relative;
}
.nb-icon-btn:hover {
  background: rgba(0,0,0,0.06);
  color: #1a1f2e;
}
.nb-icon-btn.active {
  background: #fff;
  color: #2d7a52;
  box-shadow: 0 1px 5px rgba(0,0,0,0.09);
}

/* Notification dot */
.nb-badge {
  position: absolute;
  top: 7px; right: 7px;
  width: 7px; height: 7px;
  background: #ef4444;
  border-radius: 50%;
  border: 1.5px solid rgba(240,237,232,0.95);
}

.nb-divider {
  width: 1px; height: 24px;
  background: rgba(0,0,0,0.1);
  margin: 0 8px;
}

/* Logout button */
.nb-logout {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: 10px;
  background: transparent;
  border: 1.5px solid rgba(0,0,0,0.11);
  color: #6b7280;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.nb-logout:hover {
  background: rgba(220,38,38,0.06);
  border-color: rgba(220,38,38,0.22);
  color: #dc2626;
}
.nb-logout svg { font-size: 13px; }

/* Mobile */
@media (max-width: 900px) {
  .nb-links { display: none; }
  .nb-bar { padding: 0 20px; }
  .nb-logout span { display: none; }
}
`;

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard",   Icon: FaHome },
  { to: "/groups",    label: "Groups",      Icon: FaUsers },
  { to: "/expense",   label: "Add Expense", Icon: FaPlus, accent: true },
  { to: "/balances",  label: "Balance",     Icon: FaWallet },
];

const ICON_LINKS = [
  { to: "/notifications", label: "Notifications", Icon: FaBell, badge: true },
  { to: "/profile",       label: "Profile",        Icon: FaUser },
];

const Navbar = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (!document.getElementById("nb-styles")) {
      const tag = document.createElement("style");
      tag.id = "nb-styles";
      tag.textContent = CSS;
      document.head.appendChild(tag);
      styleRef.current = tag;
    }
    return () => { styleRef.current?.remove(); };
  }, []);

  const handleLogout = () => { logout(); navigate("/auth"); };
  if (!token) return null;
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="nb-root">
      <div className="nb-bar">

        {/* Logo — flush left */}
        <Link to="/dashboard" className="nb-logo">
          <span className="nb-logo-dot" />
          Split<span className="nb-logo-accent">wise</span>
        </Link>

        {/* Nav links — true center */}
        <div className="nb-links">
          {NAV_LINKS.map(({ to, label, Icon, accent }) => (
            <Link
              key={to}
              to={to}
              className={`nb-link${accent ? " nb-link-add" : ""}${!accent && isActive(to) ? " active" : ""}`}
            >
              <Icon />
              {label}
            </Link>
          ))}
        </div>

        {/* Right actions — flush right */}
        <div className="nb-actions">
          {ICON_LINKS.map(({ to, label, Icon, badge }) => (
            <Link
              key={to}
              to={to}
              title={label}
              className={`nb-icon-btn${isActive(to) ? " active" : ""}`}
            >
              <Icon />
              {badge && <span className="nb-badge" />}
            </Link>
          ))}
          <div className="nb-divider" />
          <button className="nb-logout" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;