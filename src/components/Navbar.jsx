import { useNavigate, NavLink } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("dummyLogin");
    navigate("/login");
    window.location.reload();
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition ${
      isActive
        ? "bg-green-100 text-green-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-green-700"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* LOGO / BRAND */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-green-600 text-white font-bold">
            ₹
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              Daily Tracker
            </h1>
            <p className="text-xs text-slate-500 -mt-1">
              Income & Expense
            </p>
          </div>
        </div>

        {/* NAV LINKS */}
        <div className="flex items-center gap-2">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>

          <NavLink to="/daily" className={linkClass}>
            Daily
          </NavLink>

          <NavLink to="/monthly" className={linkClass}>
            Monthly
          </NavLink>

          {/* LOGOUT */}
          <button
            onClick={logout}
            className="ml-2 bg-red-500 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
