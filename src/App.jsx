// App.jsx  —  Service Worker + Offline banner + Routing
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MonthlyReport from "./pages/MonthlyReport";
import DailyReport from "./pages/DailyReport";
import CashBox from "./pages/CashBox";
import ImportExpenses from "./pages/ImportExpenses";
import BulkTracker from "./pages/BulkTracker";
import Reports from "./pages/Reports";
import SplashScreen from "./components/SplashScreen";
import { supabase } from "./lib/supabase";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);

  /* ── Register Service Worker (offline support) ── */
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then(reg => {
            console.log("✅ SW registered:", reg.scope);
            // Auto-update on new version
            reg.onupdatefound = () => {
              const w = reg.installing;
              if (!w) return;
              w.onstatechange = () => {
                if (w.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("🔄 New version available — reload to update.");
                }
              };
            };
          })
          .catch(err => console.warn("SW failed:", err));
      });
    }
  }, []);

  /* ── Network listeners ── */
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  /* ── Session check + splash ── */
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setLoggedIn(!!session);
      setTimeout(() => setLoading(false), 2000);
    };
    init();
  }, []);

  /* ── Android back button ── */
  useEffect(() => {
    const handler = () => { if (window.history.length > 1) window.history.back(); };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  /* ── Splash ── */
  if (loading) return <SplashScreen />;

  return (
    <>
      {/* Global offline bar (shown on all pages except Login which has its own) */}
      {!online && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 9999,
          background: "#b45309",
          color: "#fff",
          padding: "11px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "sans-serif",
          boxShadow: "0 3px 14px rgba(0,0,0,.22)",
          animation: "offlineBanner .3s ease",
        }}>
          <span>📡</span>
          <span>You're offline — showing cached data</span>
        </div>
      )}

      <style>{`
        @keyframes offlineBanner {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        /* Push content below offline banner on all pages */
        body { transition: padding-top .3s; }
      `}</style>

      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login setLoggedIn={setLoggedIn} />} />
          <Route path="/dashboard" element={loggedIn ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/cashbox" element={loggedIn ? <CashBox /> : <Navigate to="/login" replace />} />
          <Route path="/daily" element={loggedIn ? <DailyReport /> : <Navigate to="/login" replace />} />
          <Route path="/monthly" element={loggedIn ? <MonthlyReport /> : <Navigate to="/login" replace />} />
          <Route path="/bulk" element={loggedIn ? <BulkTracker /> : <Navigate to="/login" replace />} />
          <Route path="/reports" element={loggedIn ? <Reports /> : <Navigate to="/login" replace />} />
          <Route path="/import-expenses" element={loggedIn ? <ImportExpenses /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}