import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (err) {
      alert("Logout failed");
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');

        .nav-root {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #ffffff;
          border-bottom: 1.5px solid #e2dcd4;
          box-shadow: 0 1px 8px rgba(0,0,0,0.05);
          font-family: 'DM Sans', sans-serif;
        }

        /* ─── TOP BAR ─── */
        .nav-inner {
          max-width: 1200px;
          margin: auto;
          padding: 0 24px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        /* ─── BRAND ─── */
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .nav-logo-diamond {
          width: 32px;
          height: 32px;
          background: #0d9488;
          transform: rotate(45deg);
          border-radius: 5px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nav-logo-diamond span {
          display: block;
          transform: rotate(-45deg);
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
        }
        .nav-brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }
        .nav-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          font-weight: 700;
          color: #1c1a17;
          letter-spacing: 0.01em;
        }
        .nav-brand-sub {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9a9187;
          margin-top: 2px;
        }

        /* ─── DESKTOP LINKS ─── */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        @media(max-width: 640px) { .nav-links { display: none; } }

        .nav-link {
          position: relative;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.03em;
          color: #5a5449;
          text-decoration: none;
          transition: background 0.18s, color 0.18s;
          white-space: nowrap;
        }
        .nav-link:hover {
          background: #f0faf9;
          color: #0d9488;
        }
        .nav-link.active {
          background: #e0f2f0;
          color: #0d9488;
          font-weight: 600;
        }
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 14px;
          right: 14px;
          height: 2px;
          background: #0d9488;
          border-radius: 2px 2px 0 0;
        }

        /* ─── DIVIDER ─── */
        .nav-divider {
          width: 1px;
          height: 22px;
          background: #e2dcd4;
          margin: 0 4px;
        }

        /* ─── LOGOUT (desktop) ─── */
        .nav-logout {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: #dc2626;
          background: #fee2e2;
          border: 1.5px solid rgba(220,38,38,0.2);
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s, transform 0.15s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .nav-logout:hover {
          background: #fecaca;
          border-color: rgba(220,38,38,0.35);
          transform: translateY(-1px);
        }
        .nav-logout:active { transform: translateY(0); }

        /* ─── HAMBURGER ─── */
        .nav-hamburger {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 38px;
          height: 38px;
          border: 1.5px solid #e2dcd4;
          border-radius: 8px;
          background: #faf8f5;
          cursor: pointer;
          gap: 5px;
          padding: 0;
          flex-shrink: 0;
          transition: background 0.18s, border-color 0.18s;
        }
        .nav-hamburger:hover {
          background: #e0f2f0;
          border-color: #0d9488;
        }
        @media(max-width: 640px) { .nav-hamburger { display: flex; } }

        .hb-line {
          display: block;
          width: 16px;
          height: 2px;
          background: #5a5449;
          border-radius: 2px;
          transition: transform 0.22s, opacity 0.22s, width 0.22s;
          transform-origin: center;
        }
        .nav-hamburger.open .hb-line:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
        }
        .nav-hamburger.open .hb-line:nth-child(2) {
          opacity: 0;
          width: 0;
        }
        .nav-hamburger.open .hb-line:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
        }

        /* ─── MOBILE DRAWER ─── */
        .nav-mobile-drawer {
          display: none;
          background: #ffffff;
          border-top: 1.5px solid #e2dcd4;
          padding: 12px 20px 20px;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .nav-mobile-drawer.open { display: flex; }

        .mob-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #5a5449;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .mob-link:hover {
          background: #f0faf9;
          color: #0d9488;
        }
        .mob-link.active {
          background: #e0f2f0;
          color: #0d9488;
          font-weight: 600;
        }
        .mob-link-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #f5f2ed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .mob-link.active .mob-link-icon {
          background: #0d9488;
        }
        .mob-link-icon svg { stroke: #5a5449; transition: stroke 0.15s; }
        .mob-link.active .mob-link-icon svg { stroke: #fff; }

        .mob-divider {
          height: 1px;
          background: #e2dcd4;
          margin: 6px 0;
          border-radius: 1px;
        }

        .mob-logout {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #dc2626;
          background: #fee2e2;
          border: 1.5px solid rgba(220,38,38,0.2);
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          width: 100%;
          transition: background 0.15s;
          margin-top: 4px;
        }
        .mob-logout:hover { background: #fecaca; }
        .mob-logout-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(220,38,38,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
      `}</style>

      <nav className="nav-root">
        {/* TOP BAR */}
        <div className="nav-inner">

          {/* BRAND */}
          <div className="nav-brand">
            <div className="nav-logo-diamond">
              <span>₹</span>
            </div>
            <div className="nav-brand-text">
              <span className="nav-brand-name">Daily Tracker</span>
              <span className="nav-brand-sub">Income & Expense</span>
            </div>
          </div>

          {/* DESKTOP LINKS */}
          <div className="nav-links">
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Dashboard</NavLink>
            <NavLink to="/daily" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Daily</NavLink>
            <NavLink to="/monthly" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Monthly</NavLink>
            <div className="nav-divider" />
            <button className="nav-logout" onClick={logout}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>

          {/* HAMBURGER (mobile only) */}
          <button
            className={`nav-hamburger${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className="hb-line" />
            <span className="hb-line" />
            <span className="hb-line" />
          </button>

        </div>

        {/* MOBILE DRAWER */}
        <div className={`nav-mobile-drawer${menuOpen ? " open" : ""}`}>

          <NavLink to="/dashboard" onClick={closeMenu} className={({ isActive }) => `mob-link${isActive ? " active" : ""}`}>
            <div className="mob-link-icon">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            Dashboard
          </NavLink>

          <NavLink to="/daily" onClick={closeMenu} className={({ isActive }) => `mob-link${isActive ? " active" : ""}`}>
            <div className="mob-link-icon">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            Daily
          </NavLink>

          <NavLink to="/monthly" onClick={closeMenu} className={({ isActive }) => `mob-link${isActive ? " active" : ""}`}>
            <div className="mob-link-icon">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 4-6" />
              </svg>
            </div>
            Monthly
          </NavLink>

          <div className="mob-divider" />

          <button className="mob-logout" onClick={() => { closeMenu(); logout(); }}>
            <div className="mob-logout-icon">
              <svg width="14" height="14" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            Logout
          </button>

        </div>
      </nav>
    </>
  );
}