import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login({ setLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const navigate = useNavigate();

  const handleLogin = () => {
    if (email === "jeelanispt@gmail.com" && password === "385459") {
      localStorage.setItem("dummyLogin", "true");
      setLoggedIn(true);
      navigate("/dashboard");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            Dashboard Login
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to continue
          </p>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="text-sm text-slate-600 mb-1 block">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-slate-400">📧</span>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="text-sm text-slate-600 mb-1 block">
            Password
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-slate-400">🔒</span>
            <input
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-3 cursor-pointer"
            >
              {showPwd ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-600 text-sm text-center mt-2">
            {error}
          </p>
        )}

        {/* Button */}
        <button
          type="button"
          onClick={handleLogin}
          className="w-full mt-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:opacity-90 transition"
        >
          Login
        </button>

        {/* Footer */}
        <p className="text-xs text-center text-slate-400 mt-6">
          © 2026 Daily Income Track
        </p>
      </div>
    </div>
  );
}
