import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MonthlyReport from "./pages/MonthlyReport";
import DailyReport from "./pages/DailyReport";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(localStorage.getItem("dummyLogin") === "true");
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/login"
          element={<Login setLoggedIn={setLoggedIn} />}
        />

        <Route
          path="/dashboard"
          element={loggedIn ? <Dashboard /> : <Navigate to="/login" />}
        />

        <Route
          path="/daily"
          element={loggedIn ? <DailyReport /> : <Navigate to="/login" />}
        />

        <Route
          path="/monthly"
          element={loggedIn ? <MonthlyReport /> : <Navigate to="/login" />}
        />

        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </BrowserRouter>
  );
}
