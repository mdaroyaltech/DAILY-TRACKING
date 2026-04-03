import { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
      alert("Logout failed");
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');

        :root {
          --nav-bg:#ffffff; --nav-border:#e2dcd4; --nav-text:#5a5449;
          --nav-text-dark:#1c1a17; --nav-bg2:#f5f2ed;
          --nav-teal:#0d9488; --nav-teal-light:#e0f2f0;
          --nav-red:#dc2626; --nav-red-bg:#fee2e2;
          --nav-shadow:0 1px 8px rgba(0,0,0,0.05);
        }
        [data-theme="dark"] {
          --nav-bg:#141210; --nav-border:#2a2620; --nav-text:#9a9187;
          --nav-text-dark:#f0ece6; --nav-bg2:#1a1815;
          --nav-teal:#2dd4bf; --nav-teal-light:rgba(45,212,191,0.12);
          --nav-red:#f87171; --nav-red-bg:rgba(248,113,113,0.12);
          --nav-shadow:0 1px 8px rgba(0,0,0,0.35);
        }

        /* ══ GLOBAL DARK MODE for all pages ══ */
        [data-theme="dark"] {
          --bg:#0f0e0c; --bg2:#1a1815; --surface:#1c1a17; --surface2:#211f1b;
          --border:#2a2620; --border2:#3a3530;
          --text:#f0ece6; --text-med:#c4bdb4; --text-dim:#7a746e; --text-faint:#4a4540;
          --teal:#2dd4bf; --teal-light:rgba(45,212,191,0.12); --teal-mid:rgba(45,212,191,0.3);
          --green:#4ade80; --green-bg:rgba(74,222,128,0.12);
          --red:#f87171; --red-bg:rgba(248,113,113,0.12);
          --amber:#fbbf24; --amber-bg:rgba(251,191,36,0.12);
          --blue:#60a5fa; --blue-bg:rgba(96,165,250,0.12);
          --purple:#a78bfa; --purple-bg:rgba(167,139,250,0.12);
          --shadow-sm:0 1px 3px rgba(0,0,0,0.3);
          --shadow:0 4px 16px rgba(0,0,0,0.4);
        }
        [data-theme="dark"] body, [data-theme="dark"] #root {
          background:#0f0e0c !important; color:#f0ece6 !important;
        }

        .nav-root {
          position:sticky; top:0; z-index:100;
          background:var(--nav-bg); border-bottom:1.5px solid var(--nav-border);
          box-shadow:var(--nav-shadow); font-family:'DM Sans',sans-serif;
          transition:background .25s,border-color .25s;
        }
        .nav-inner {
          max-width:1200px; margin:auto; padding:0 24px;
          height:60px; display:flex; align-items:center; justify-content:space-between; gap:12px;
        }
        .nav-brand { display:flex; align-items:center; gap:10px; text-decoration:none; flex-shrink:0; }
        .nav-logo-diamond {
          width:32px; height:32px; background:#0d9488;
          transform:rotate(45deg); border-radius:5px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
        }
        .nav-logo-diamond span { display:block; transform:rotate(-45deg); color:#fff; font-size:13px; font-weight:700; }
        .nav-brand-text { display:flex; flex-direction:column; line-height:1; }
        .nav-brand-name { font-family:'Playfair Display',serif; font-size:16px; font-weight:700; color:var(--nav-text-dark); }
        .nav-brand-sub { font-size:9px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--nav-text); margin-top:2px; }

        .nav-links { display:flex; align-items:center; gap:4px; }
        @media(max-width:640px){ .nav-links{display:none;} }

        .nav-link {
          position:relative; padding:7px 14px; border-radius:8px;
          font-size:13px; font-weight:500; color:var(--nav-text); text-decoration:none;
          transition:background .18s,color .18s; white-space:nowrap;
        }
        .nav-link:hover { background:var(--nav-teal-light); color:var(--nav-teal); }
        .nav-link.active { background:var(--nav-teal-light); color:var(--nav-teal); font-weight:600; }
        .nav-link.active::after {
          content:''; position:absolute; bottom:-1px; left:14px; right:14px;
          height:2px; background:var(--nav-teal); border-radius:2px 2px 0 0;
        }

        .nav-divider { width:1px; height:22px; background:var(--nav-border); margin:0 4px; }

        .theme-toggle {
          width:36px; height:36px; border-radius:9px;
          border:1.5px solid var(--nav-border); background:var(--nav-bg2);
          cursor:pointer; display:flex; align-items:center; justify-content:center;
          font-size:16px; transition:all .2s; flex-shrink:0;
        }
        .theme-toggle:hover { background:var(--nav-teal-light); border-color:var(--nav-teal); transform:scale(1.08); }

        .nav-logout {
          display:flex; align-items:center; gap:6px; padding:7px 14px;
          border-radius:8px; font-size:12px; font-weight:600; letter-spacing:.05em;
          color:var(--nav-red); background:var(--nav-red-bg);
          border:1.5px solid rgba(220,38,38,0.2); cursor:pointer;
          font-family:'DM Sans',sans-serif; white-space:nowrap;
          transition:all .18s;
        }
        .nav-logout:hover { opacity:.85; transform:translateY(-1px); }

        .nav-hamburger {
          display:none; flex-direction:column; justify-content:center;
          align-items:center; width:38px; height:38px;
          border:1.5px solid var(--nav-border); border-radius:8px;
          background:var(--nav-bg2); cursor:pointer; gap:5px; padding:0; flex-shrink:0;
          transition:background .18s,border-color .18s;
        }
        .nav-hamburger:hover { background:var(--nav-teal-light); border-color:var(--nav-teal); }
        @media(max-width:640px){ .nav-hamburger{display:flex;} }
        .hb-line {
          display:block; width:16px; height:2px; background:var(--nav-text);
          border-radius:2px; transition:transform .22s,opacity .22s,width .22s; transform-origin:center;
        }
        .nav-hamburger.open .hb-line:nth-child(1){ transform:translateY(7px) rotate(45deg); }
        .nav-hamburger.open .hb-line:nth-child(2){ opacity:0; width:0; }
        .nav-hamburger.open .hb-line:nth-child(3){ transform:translateY(-7px) rotate(-45deg); }

        .nav-mobile-drawer {
          display:none; background:var(--nav-bg);
          border-top:1.5px solid var(--nav-border);
          padding:12px 20px 20px; flex-direction:column; gap:4px;
          box-shadow:0 8px 24px rgba(0,0,0,0.08);
        }
        .nav-mobile-drawer.open { display:flex; }

        .mob-link {
          display:flex; align-items:center; gap:10px; padding:12px 14px;
          border-radius:10px; font-size:14px; font-weight:500;
          color:var(--nav-text); text-decoration:none; transition:background .15s,color .15s;
        }
        .mob-link:hover { background:var(--nav-teal-light); color:var(--nav-teal); }
        .mob-link.active { background:var(--nav-teal-light); color:var(--nav-teal); font-weight:600; }
        .mob-link-icon {
          width:30px; height:30px; border-radius:8px; background:var(--nav-bg2);
          display:flex; align-items:center; justify-content:center;
          font-size:14px; flex-shrink:0;
        }
        .mob-link.active .mob-link-icon { background:var(--nav-teal); }
        .mob-link-icon svg { stroke:var(--nav-text); }
        .mob-link.active .mob-link-icon svg { stroke:#fff; }
        .mob-divider { height:1px; background:var(--nav-border); margin:6px 0; }

        .mob-theme-row {
          display:flex; align-items:center; justify-content:space-between;
          padding:10px 14px; border-radius:10px;
          background:var(--nav-bg2); border:1.5px solid var(--nav-border); margin-bottom:4px;
        }
        .mob-theme-label { font-size:13px; font-weight:600; color:var(--nav-text); }
        .mob-theme-btn {
          width:48px; height:26px; border-radius:13px;
          border:1.5px solid var(--nav-border);
          background:var(--nav-bg); position:relative; cursor:pointer;
          transition:background .25s,border-color .25s; flex-shrink:0;
        }
        .mob-theme-btn.on { background:var(--nav-teal); border-color:var(--nav-teal); }
        .mob-theme-knob {
          position:absolute; top:2px; left:2px;
          width:18px; height:18px; border-radius:50%;
          background:#fff; transition:left .22s;
          box-shadow:0 1px 4px rgba(0,0,0,0.2);
        }
        .mob-theme-btn.on .mob-theme-knob { left:24px; }

        .mob-logout {
          display:flex; align-items:center; gap:10px; padding:12px 14px;
          border-radius:10px; font-size:14px; font-weight:600;
          color:var(--nav-red); background:var(--nav-red-bg);
          border:1.5px solid rgba(220,38,38,0.2);
          cursor:pointer; font-family:'DM Sans',sans-serif; width:100%;
          transition:opacity .15s; margin-top:4px;
        }
        .mob-logout:hover { opacity:.85; }
        .mob-logout-icon {
          width:30px; height:30px; border-radius:8px;
          background:rgba(220,38,38,0.1);
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
      `}</style>

      <nav className="nav-root">
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="nav-logo-diamond"><span>₹</span></div>
            <div className="nav-brand-text">
              <span className="nav-brand-name">Daily Tracker</span>
              <span className="nav-brand-sub">Income & Expense</span>
            </div>
          </div>

          <div className="nav-links">
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Dashboard</NavLink>
            <NavLink to="/cashbox" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Cash Box</NavLink>
            <NavLink to="/daily" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Daily</NavLink>
            <NavLink to="/monthly" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Monthly</NavLink>
            <NavLink to="/bulk" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Bulk Tracker</NavLink>
            <NavLink to="/reports" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>Reports</NavLink>

            <div className="nav-divider" />
            <button className="theme-toggle" onClick={() => setDark(d => !d)} title="Toggle dark mode">
              {dark ? "☀️" : "🌙"}
            </button>
            <button className="nav-logout" onClick={logout}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>

          <button className={`nav-hamburger${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <span className="hb-line" /><span className="hb-line" /><span className="hb-line" />
          </button>
        </div>

        <div className={`nav-mobile-drawer${menuOpen ? " open" : ""}`}>
          {[
            { to: "/dashboard", label: "Dashboard", icon: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></> },
            { to: "/cashbox", label: "Cash Box", icon: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></> },
            { to: "/daily", label: "Daily", icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></> },
            { to: "/monthly", label: "Monthly", icon: <><path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 4-6" /></> },
            { to: "/bulk", label: "Bulk Tracker", icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></> },
            {
              to: "/reports",
              label: "Reports",
              icon: (
                <>
                  <path d="M3 3v18h18" />
                  <path d="M7 16l4-4 4 4 4-6" />
                </>
              ),
            },
          ].map(item => (
            <NavLink key={item.to} to={item.to} onClick={closeMenu} className={({ isActive }) => `mob-link${isActive ? " active" : ""}`}>
              <div className="mob-link-icon">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">{item.icon}</svg>
              </div>
              {item.label}
            </NavLink>
          ))}

          <div className="mob-divider" />

          <div className="mob-theme-row">
            <span className="mob-theme-label">{dark ? "🌙 Dark Mode" : "☀️ Light Mode"}</span>
            <button className={`mob-theme-btn${dark ? " on" : ""}`} onClick={() => setDark(d => !d)}>
              <div className="mob-theme-knob" />
            </button>
          </div>

          <button className="mob-logout" onClick={() => { closeMenu(); logout(); }}>
            <div className="mob-logout-icon">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}