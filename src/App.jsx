// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MonthlyReport from "./pages/MonthlyReport";
import DailyReport from "./pages/DailyReport";
import BulkTracker from "./pages/BulkTracker";
import SplashScreen from "./components/SplashScreen";
import { supabase } from "./lib/supabase";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  /* ── 1. Register Service Worker for offline mode ── */
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("SW registered ✓"))
        .catch((err) => console.error("SW error:", err));
    }
  }, []);

  /* ── 2. Online / offline listener ── */
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  /* ── 3. Session check + splash ── */
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setLoggedIn(!!session);
      setTimeout(() => setLoading(false), 2000);
    };
    checkSession();
  }, []);

  /* ── 4. Back button handler ── */
  useEffect(() => {
    const handleBack = () => { if (window.history.length > 1) window.history.back(); };
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, []);

  if (loading) return <SplashScreen />;

  return (
    <>
      {/* ── Offline banner ── */}
      {!isOnline && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "#b45309", color: "#fff",
          padding: "10px 20px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          fontSize: 13, fontWeight: 600, fontFamily: "sans-serif",
          boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
          animation: "slideDown .3s ease",
        }}>
          <span>📡</span>
          <span>You're offline — showing cached data</span>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>

      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login setLoggedIn={setLoggedIn} />} />
          <Route path="/dashboard" element={loggedIn ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/daily" element={loggedIn ? <DailyReport /> : <Navigate to="/login" />} />
          <Route path="/monthly" element={loggedIn ? <MonthlyReport /> : <Navigate to="/login" />} />
          <Route path="/bulk" element={loggedIn ? <BulkTracker /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}