import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login({ setLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setLoggedIn(true);
      navigate("/dashboard");
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setLoggedIn(true);
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate, setLoggedIn]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          background: #f5f2ed;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          color: #1c1a17;
          position: relative;
          overflow: hidden;
        }

        /* Subtle background texture */
        .login-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 80% 10%, rgba(13,148,136,0.06) 0%, transparent 50%),
            radial-gradient(circle at 10% 90%, rgba(13,148,136,0.04) 0%, transparent 45%);
          pointer-events: none;
        }

        /* Decorative circles */
        .bg-circle-1 {
          position: absolute;
          width: 560px;
          height: 560px;
          border-radius: 50%;
          border: 1.5px solid rgba(13,148,136,0.08);
          top: -180px;
          right: -180px;
          pointer-events: none;
        }
        .bg-circle-2 {
          position: absolute;
          width: 360px;
          height: 360px;
          border-radius: 50%;
          border: 1.5px solid rgba(13,148,136,0.06);
          bottom: -80px;
          left: -80px;
          pointer-events: none;
        }
        .bg-circle-3 {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          border: 1px solid rgba(13,148,136,0.05);
          top: 40%;
          right: 42%;
          pointer-events: none;
        }

        /* Vertical divider line */
        .bg-line {
          position: absolute;
          top: 0; bottom: 0;
          left: 50%;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(13,148,136,0.15), transparent);
          pointer-events: none;
          display: none;
        }
        @media(min-width: 900px) { .bg-line { display: block; } }

        /* ─── LEFT PANEL ─── */
        .left-panel {
          display: none;
          flex: 1;
          padding: 56px 60px;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1.5px solid #e2dcd4;
          position: relative;
          background: #ffffff;
        }
        @media(min-width: 900px) { .left-panel { display: flex; } }

        .logo-mark {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-diamond {
          width: 28px;
          height: 28px;
          background: #0d9488;
          transform: rotate(45deg);
          flex-shrink: 0;
          border-radius: 3px;
        }
        .logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: #1c1a17;
        }

        .left-tagline {
          font-size: 11px;
          font-weight: 600;
          color: #0d9488;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        .left-tagline::before {
          content: '';
          display: inline-block;
          width: 20px;
          height: 2px;
          background: #0d9488;
          border-radius: 2px;
        }

        .left-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 3.8vw, 54px);
          font-weight: 900;
          line-height: 1.08;
          color: #1c1a17;
        }
        .left-headline em {
          font-style: italic;
          color: #0d9488;
        }

        .left-desc {
          margin-top: 20px;
          font-size: 14px;
          font-weight: 300;
          color: #9a9187;
          line-height: 1.7;
          max-width: 340px;
        }

        /* Stats row */
        .stats-row {
          display: flex;
          gap: 0;
          margin-top: 44px;
          border: 1.5px solid #e2dcd4;
          border-radius: 12px;
          overflow: hidden;
          background: #f5f2ed;
        }
        .stat {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 18px 20px;
          border-right: 1.5px solid #e2dcd4;
        }
        .stat:last-child { border-right: none; }
        .stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          font-weight: 700;
          color: #0d9488;
        }
        .stat-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #9a9187;
        }

        .left-footer {
          font-size: 11px;
          color: #c4bdb4;
          letter-spacing: 0.08em;
        }

        /* ─── RIGHT PANEL ─── */
        .right-panel {
          width: 100%;
          max-width: 480px;
          margin: auto;
          padding: 48px 36px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 1;
        }
        @media(min-width: 900px) {
          .right-panel {
            flex: 0 0 480px;
            padding: 64px 56px;
            margin: 0;
          }
        }

        /* Corner decorations */
        .corner-tr {
          position: absolute;
          top: 28px; right: 28px;
          width: 44px; height: 44px;
          border-top: 2px solid rgba(13,148,136,0.25);
          border-right: 2px solid rgba(13,148,136,0.25);
          border-radius: 0 4px 0 0;
          pointer-events: none;
        }
        .corner-bl {
          position: absolute;
          bottom: 28px; left: 28px;
          width: 44px; height: 44px;
          border-bottom: 2px solid rgba(13,148,136,0.25);
          border-left: 2px solid rgba(13,148,136,0.25);
          border-radius: 0 0 0 4px;
          pointer-events: none;
        }

        .form-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #0d9488;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .form-eyebrow::before {
          content: '';
          display: inline-block;
          width: 20px;
          height: 2px;
          background: #0d9488;
          border-radius: 2px;
        }

        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 38px;
          font-weight: 900;
          line-height: 1.08;
          color: #1c1a17;
          margin-bottom: 8px;
        }
        .form-title em {
          font-style: italic;
          color: #0d9488;
        }
        .form-subtitle {
          font-size: 14px;
          font-weight: 300;
          color: #9a9187;
          margin-bottom: 40px;
        }

        /* Fields */
        .field-group { margin-bottom: 20px; }

        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #5a5449;
          margin-bottom: 8px;
          transition: color 0.2s;
        }
        .field-group.is-focused .field-label { color: #0d9488; }

        .field-wrap { position: relative; }

        .field-input {
          width: 100%;
          background: #ffffff;
          border: 1.5px solid #e2dcd4;
          border-radius: 8px;
          padding: 13px 44px 13px 16px;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 400;
          color: #1c1a17;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .field-input::placeholder { color: #c4bdb4; }
        .field-input:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13,148,136,0.1);
        }

        .field-icon {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #c4bdb4;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .field-group.is-focused .field-icon { color: #9a9187; }
        .field-icon:hover { color: #0d9488 !important; }

        /* Error */
        .error-msg {
          margin-top: 12px;
          padding: 12px 16px;
          background: #fee2e2;
          border: 1.5px solid rgba(220,38,38,0.2);
          border-radius: 8px;
          font-size: 13px;
          color: #dc2626;
          text-align: center;
          font-weight: 500;
        }

        /* Button */
        .login-btn {
          width: 100%;
          margin-top: 32px;
          padding: 15px;
          background: #0d9488;
          border: none;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #ffffff;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 14px rgba(13,148,136,0.3);
        }
        .login-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(13,148,136,0.35);
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(13,148,136,0.2);
        }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Spinner */
        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .footer-note {
          margin-top: 36px;
          text-align: center;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #c4bdb4;
        }
      `}</style>

      <div className="login-root">
        <div className="bg-circle-1" />
        <div className="bg-circle-2" />
        <div className="bg-circle-3" />
        <div className="bg-line" />

        {/* ── LEFT PANEL ── */}
        <div className="left-panel">
          <div className="logo-mark">
            <div className="logo-diamond" />
            <span className="logo-text">Daily Income Track</span>
          </div>

          <div>
            <div className="left-tagline">Financial clarity, daily</div>
            <h1 className="left-headline">
              Track every<br /><em>income stream</em><br />with precision.
            </h1>
            <p className="left-desc">
              A clean, focused dashboard to record your daily income, expenses, and home payments — all in one place.
            </p>
            <div className="stats-row">
              <div className="stat">
                <span className="stat-num">100%</span>
                <span className="stat-label">Accurate</span>
              </div>
              <div className="stat">
                <span className="stat-num">Live</span>
                <span className="stat-label">Real-time</span>
              </div>
              <div className="stat">
                <span className="stat-num">Safe</span>
                <span className="stat-label">& Private</span>
              </div>
            </div>
          </div>

          <p className="left-footer">© 2026 Daily Income Track</p>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          <div className="corner-tr" />
          <div className="corner-bl" />

          <div className="form-eyebrow">Secure Access</div>
          <h2 className="form-title">Welcome<br /><em>back.</em></h2>
          <p className="form-subtitle">Sign in to your dashboard</p>

          {/* Email */}
          <div className={`field-group${focused === 'email' ? ' is-focused' : ''}`}>
            <label className="field-label">Email Address</label>
            <div className="field-wrap">
              <input
                type="email"
                className="field-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
              <span className="field-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 7l10 7 10-7" />
                </svg>
              </span>
            </div>
          </div>

          {/* Password */}
          <div className={`field-group${focused === 'password' ? ' is-focused' : ''}`}>
            <label className="field-label">Password</label>
            <div className="field-wrap">
              <input
                type={showPwd ? "text" : "password"}
                className="field-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                type="button"
                className="field-icon"
                onClick={() => setShowPwd(!showPwd)}
                tabIndex={-1}
              >
                {showPwd ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            type="button"
            className="login-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading && <span className="spinner" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="footer-note">© 2026 Daily Income Track</p>
        </div>
      </div>
    </>
  );
}