import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login({ setLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const navigate = useNavigate();

  const handleLogin = () => {
    console.log("LOGIN CLICKED"); // 🔍 debug

    if (email === "jeelanispt@gmail.com" && password === "385459") {
      localStorage.setItem("dummyLogin", "true");
      setLoggedIn(true);              // 🔥 MUST
      navigate("/dashboard");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-sm">
        <h2 className="text-xl font-bold text-center mb-4">
          Dashboard Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative mt-2">
          <input
            type={showPwd ? "text" : "password"}
            placeholder="Password"
            className="input pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-3 cursor-pointer"
          >
            {showPwd ? "🙈" : "👁️"}
          </span>
        </div>

        {error && (
          <p className="text-red-600 text-sm mt-2 text-center">
            {error}
          </p>
        )}

        {/* ⚠️ IMPORTANT: type="button" */}
        <button
          type="button"
          onClick={handleLogin}
          className="btn-green mt-4 w-full"
        >
          Login
        </button>
      </div>
    </div>
  );
}
