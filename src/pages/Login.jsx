// Login.jsx — with Biometric login + PWA Install button + Offline support
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

/* ══════════════════════════════════════
   WEBAUTHN BIOMETRIC HELPERS
══════════════════════════════════════ */
const CRED_KEY = "bio_credential_id";
const USER_ID = new TextEncoder().encode("daily-income-user-001");
const USER_NAME = "Abdul Jeelani";

const toB64 = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

const fromB64 = (s) => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};

async function bioAvailable() {
  if (!window.PublicKeyCredential) return false;
  try { return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); }
  catch { return false; }
}

async function registerBio() {
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "Daily Income Track" },
        user: { id: USER_ID, name: USER_NAME, displayName: USER_NAME },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      },
    });
    localStorage.setItem(CRED_KEY, toB64(cred.rawId));
    return { ok: true };
  } catch (e) {
    return { ok: false, err: e.name === "NotAllowedError" ? "Cancelled." : e.message };
  }
}

async function authenticateBio() {
  const saved = localStorage.getItem(CRED_KEY);
  if (!saved) return { ok: false, err: "No fingerprint registered." };
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ id: fromB64(saved), type: "public-key", transports: ["internal"] }],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return assertion ? { ok: true } : { ok: false, err: "Auth failed." };
  } catch (e) {
    return { ok: false, err: e.name === "NotAllowedError" ? "Cancelled." : e.message };
  }
}

/* ══════════════════════════════════════
   FINGERPRINT SVG
══════════════════════════════════════ */
function FpIcon({ size = 32, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 3.4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M2 12a10 10 0 0 1 18-6" />
      <path d="M2 17.5c.4.5 1.28 1.5 3 2.5" />
      <path d="M20 12c0 2-.4 4.12-1.2 5.5" />
      <path d="M5.14 9.5A10 10 0 0 0 2 17" />
      <path d="M8.65 22c.21-.57.55-1.59 1.35-2" />
      <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
    </svg>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function Login({ setLoggedIn }) {
  const navigate = useNavigate();

  // Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(null);

  // Biometric
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const [bioSupported, setBioSupported] = useState(false);
  const [bioRegistered, setBioRegistered] = useState(false);
  const [bioStatus, setBioStatus] = useState("idle"); // idle|scanning|success|error
  const [bioMsg, setBioMsg] = useState("");
  const [showBioSuccess, setShowBioSuccess] = useState(false);

  // PWA install
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallTip, setShowInstallTip] = useState(false);

  // Offline
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  /* ── Init checks ── */
  useEffect(() => {
    // Biometric
    if (isMobile) {
      bioAvailable().then((ok) => {
        setBioSupported(ok);
        setBioRegistered(!!localStorage.getItem(CRED_KEY));
      });
    }

    // PWA install prompt
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);

    // Already installed check
    if (window.matchMedia("(display-mode: standalone)").matches) setIsInstalled(true);
    window.addEventListener("appinstalled", () => { setIsInstalled(true); setInstallPrompt(null); });

    // Online/offline
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  /* ── Session auto-redirect ── */
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { setLoggedIn(true); navigate("/dashboard"); }
    };
    check();
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) { setLoggedIn(true); navigate("/dashboard"); }
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate, setLoggedIn]);

  /* ── Email login ── */
  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter email and password."); return; }
    setError(""); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setLoggedIn(true);
    navigate("/dashboard");
  };

  /* ── Biometric authenticate ── */
  const handleBioAuth = async () => {
    setBioMsg(""); setBioStatus("scanning");
    const result = await authenticateBio();
    if (result.ok) {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setBioStatus("success"); setBioMsg("Identity verified!");
        setShowBioSuccess(true);
        setTimeout(() => { setLoggedIn(true); navigate("/dashboard"); }, 1400);
      } else {
        setBioStatus("error");
        setBioMsg("Please sign in with email first, then use fingerprint next time.");
        setTimeout(() => { setBioStatus("idle"); setBioMsg(""); }, 3000);
      }
    } else {
      setBioStatus("error"); setBioMsg(result.err || "Failed.");
      setTimeout(() => { setBioStatus("idle"); setBioMsg(""); }, 2500);
    }
  };

  /* ── Biometric register (after email login success) ── */
  const handleBioRegister = async () => {
    setBioMsg(""); setBioStatus("scanning");
    const result = await registerBio();
    if (result.ok) {
      setBioRegistered(true); setBioStatus("success");
      setBioMsg("Fingerprint saved! Use it to sign in next time.");
      setTimeout(() => { setBioStatus("idle"); setBioMsg(""); }, 3000);
    } else {
      setBioStatus("error"); setBioMsg(result.err);
      setTimeout(() => { setBioStatus("idle"); setBioMsg(""); }, 2500);
    }
  };

  /* ── PWA install ── */
  const handleInstall = async () => {
    if (!installPrompt) { setShowInstallTip(true); setTimeout(() => setShowInstallTip(false), 4000); return; }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") { setIsInstalled(true); setInstallPrompt(null); }
  };

  /* ── Biometric button content ── */
  const fpBtnContent = () => {
    if (bioStatus === "scanning") return (
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, border: "3px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "lg-spin .7s linear infinite" }} />
    );
    if (bioStatus === "success") return <span style={{ fontSize: 28 }}>✓</span>;
    if (bioStatus === "error") return <span style={{ fontSize: 24 }}>✕</span>;
    return <FpIcon size={30} color="#fff" />;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

        *{box-sizing:border-box;margin:0;padding:0;}

        @keyframes lg-spin    { to{transform:rotate(360deg);} }
        @keyframes lg-fadein  { from{opacity:0;}to{opacity:1;} }
        @keyframes lg-riseup  { from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);} }
        @keyframes lg-shake   { 0%,100%{transform:translateX(0);}20%{transform:translateX(-7px);}40%{transform:translateX(7px);}60%{transform:translateX(-5px);}80%{transform:translateX(5px);} }
        @keyframes lg-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(13,148,136,.45);}70%{box-shadow:0 0 0 14px rgba(13,148,136,0);} }
        @keyframes lg-success { 0%{opacity:0;transform:scale(.8);}60%{transform:scale(1.1);}100%{opacity:1;transform:scale(1);} }
        @keyframes lg-slidedown { from{transform:translateY(-100%);opacity:0;}to{transform:translateY(0);opacity:1;} }
        @keyframes lg-popdown { from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);} }

        .lg-root {
          min-height:100vh; background:#f5f2ed;
          display:flex; font-family:'DM Sans',sans-serif;
          color:#1c1a17; position:relative; overflow:hidden;
        }
        .lg-root::before {
          content:''; position:absolute; inset:0;
          background:
            radial-gradient(circle at 80% 10%,rgba(13,148,136,.06) 0%,transparent 50%),
            radial-gradient(circle at 10% 90%,rgba(13,148,136,.04) 0%,transparent 45%);
          pointer-events:none;
        }
        .bg-circle { position:absolute; border-radius:50%; pointer-events:none; }
        .bc1{width:560px;height:560px;border:1.5px solid rgba(13,148,136,.08);top:-180px;right:-180px;}
        .bc2{width:360px;height:360px;border:1.5px solid rgba(13,148,136,.06);bottom:-80px;left:-80px;}
        .bc3{width:200px;height:200px;border:1px solid rgba(13,148,136,.05);top:40%;right:42%;}
        .bg-vline{position:absolute;top:0;bottom:0;left:50%;width:1px;background:linear-gradient(to bottom,transparent,rgba(13,148,136,.15),transparent);display:none;}
        @media(min-width:900px){.bg-vline{display:block;}}

        /* ── OFFLINE BANNER ── */
        .lg-offline {
          position:fixed;top:0;left:0;right:0;z-index:9999;
          background:#b45309;color:#fff;
          padding:10px 20px;
          display:flex;align-items:center;justify-content:center;gap:10px;
          font-size:13px;font-weight:600;
          box-shadow:0 2px 12px rgba(0,0,0,.2);
          animation:lg-slidedown .3s ease;
        }

        /* ── LEFT PANEL ── */
        .lg-left {
          display:none;flex:1;padding:56px 60px;flex-direction:column;
          justify-content:space-between;border-right:1.5px solid #e2dcd4;
          position:relative;background:#fff;
        }
        @media(min-width:900px){.lg-left{display:flex;}}
        .logo-mark{display:flex;align-items:center;gap:12px;}
        .logo-diamond{width:28px;height:28px;background:#0d9488;transform:rotate(45deg);flex-shrink:0;border-radius:3px;}
        .logo-text{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;letter-spacing:.03em;}
        .left-tag{font-size:11px;font-weight:600;color:#0d9488;letter-spacing:.18em;text-transform:uppercase;display:flex;align-items:center;gap:8px;margin-bottom:14px;}
        .left-tag::before{content:'';display:inline-block;width:20px;height:2px;background:#0d9488;border-radius:2px;}
        .left-h1{font-family:'Playfair Display',serif;font-size:clamp(36px,3.8vw,54px);font-weight:900;line-height:1.08;}
        .left-h1 em{font-style:italic;color:#0d9488;}
        .left-desc{margin-top:20px;font-size:14px;font-weight:300;color:#9a9187;line-height:1.7;max-width:340px;}
        .stats-row{display:flex;margin-top:44px;border:1.5px solid #e2dcd4;border-radius:12px;overflow:hidden;background:#f5f2ed;}
        .stat{flex:1;display:flex;flex-direction:column;gap:4px;padding:18px 20px;border-right:1.5px solid #e2dcd4;}
        .stat:last-child{border-right:none;}
        .stat-num{font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:#0d9488;}
        .stat-lbl{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#9a9187;}
        .left-foot{font-size:11px;color:#c4bdb4;letter-spacing:.08em;}

        /* ── RIGHT PANEL ── */
        .lg-right {
          width:100%;max-width:480px;margin:auto;padding:48px 36px;
          display:flex;flex-direction:column;justify-content:center;
          position:relative;z-index:1;
        }
        @media(min-width:900px){.lg-right{flex:0 0 480px;padding:56px 52px;margin:0;}}
        .corner{position:absolute;width:40px;height:40px;pointer-events:none;}
        .c-tr{top:22px;right:22px;border-top:2px solid rgba(13,148,136,.25);border-right:2px solid rgba(13,148,136,.25);border-radius:0 4px 0 0;}
        .c-bl{bottom:22px;left:22px;border-bottom:2px solid rgba(13,148,136,.25);border-left:2px solid rgba(13,148,136,.25);border-radius:0 0 0 4px;}
        .form-eye{font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#0d9488;margin-bottom:12px;display:flex;align-items:center;gap:8px;}
        .form-eye::before{content:'';display:inline-block;width:20px;height:2px;background:#0d9488;border-radius:2px;}
        .form-title{font-family:'Playfair Display',serif;font-size:36px;font-weight:900;line-height:1.08;margin-bottom:6px;}
        .form-title em{font-style:italic;color:#0d9488;}
        .form-sub{font-size:14px;font-weight:300;color:#9a9187;margin-bottom:32px;}

        /* ── INSTALL BUTTON (PWA) ── */
        .lg-install-btn {
          display:flex;align-items:center;justify-content:center;gap:8px;
          width:100%;padding:11px;margin-bottom:20px;
          background:linear-gradient(135deg,#0f766e,#0d9488);
          border:none;border-radius:10px;cursor:pointer;
          font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;
          letter-spacing:.08em;text-transform:uppercase;color:#fff;
          box-shadow:0 4px 14px rgba(13,148,136,.28);
          transition:all .2s;
          animation:lg-riseup .5s ease both;
        }
        .lg-install-btn:hover{transform:translateY(-2px);box-shadow:0 7px 20px rgba(13,148,136,.38);}
        .lg-install-btn.installed{background:linear-gradient(135deg,#059669,#10b981);cursor:default;}
        .lg-install-btn.installed:hover{transform:none;}
        .lg-install-tip{
          background:#fef3c7;border:1px solid #fde68a;
          border-radius:10px;padding:10px 14px;margin-bottom:14px;
          font-size:12px;color:#92400e;text-align:center;line-height:1.5;
          animation:lg-popdown .3s ease;
        }

        /* ── BIOMETRIC SECTION ── */
        .lg-bio {
          border:1.5px solid #e2dcd4;border-radius:16px;
          padding:20px 16px;margin-bottom:20px;
          background:#fafaf9;
          display:flex;flex-direction:column;align-items:center;gap:10px;
          transition:border-color .2s,background .2s;
          animation:lg-riseup .5s .1s ease both;
        }
        .lg-bio.scanning{background:#f0fdf9;border-color:#99d6d0;}
        .lg-bio.success {background:#f0fdf4;border-color:#6ee7b7;}
        .lg-bio.error   {background:#fff5f5;border-color:#fecaca;animation:lg-shake .4s ease;}

        .lg-fp-btn {
          width:72px;height:72px;border-radius:50%;border:none;cursor:pointer;
          background:linear-gradient(145deg,#0d9488,#0f766e);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 8px 24px rgba(13,148,136,.32);
          transition:all .22s;position:relative;
        }
        .lg-fp-btn:hover{transform:scale(1.07);box-shadow:0 12px 30px rgba(13,148,136,.42);}
        .lg-fp-btn:active{transform:scale(.95);}
        .lg-fp-btn:disabled{opacity:.5;cursor:not-allowed;transform:none!important;}
        .lg-fp-btn.pulsing{animation:lg-pulse 1.2s ease-in-out infinite;}
        .lg-fp-btn.success-btn{background:linear-gradient(145deg,#059669,#047857);}
        .lg-fp-btn.error-btn  {background:linear-gradient(145deg,#dc2626,#b91c1c);}

        .lg-bio-label{font-size:13px;font-weight:600;color:#374151;text-align:center;}
        .lg-bio-sub{font-size:11px;font-weight:400;color:#9ca3af;text-align:center;line-height:1.5;}
        .lg-bio-sub.ok {color:#059669;font-weight:600;}
        .lg-bio-sub.err{color:#dc2626;font-weight:600;}

        .lg-bio-link-row{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:2px;}
        .lg-bio-link{font-size:11px;color:#9ca3af;}
        .lg-bio-action{font-size:11px;font-weight:700;color:#0d9488;background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:underline;text-underline-offset:2px;transition:opacity .15s;padding:0;}
        .lg-bio-action:hover{opacity:.7;}
        .lg-bio-action.remove{color:#dc2626;}

        /* ── DIVIDER ── */
        .lg-divider{display:flex;align-items:center;gap:12px;margin:16px 0;}
        .lg-div-line{flex:1;height:1px;background:#e2dcd4;}
        .lg-div-txt{font-size:11px;font-weight:600;color:#c4bdb4;letter-spacing:.06em;white-space:nowrap;}

        /* ── FIELDS ── */
        .field-group{margin-bottom:18px;}
        .field-lbl{display:block;font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#5a5449;margin-bottom:7px;transition:color .2s;}
        .field-group.foc .field-lbl{color:#0d9488;}
        .field-wrap{position:relative;}
        .field-input{
          width:100%;background:#fff;border:1.5px solid #e2dcd4;border-radius:8px;
          padding:13px 44px 13px 16px;font-size:15px;
          font-family:'DM Sans',sans-serif;font-weight:400;color:#1c1a17;
          outline:none;transition:border-color .2s,box-shadow .2s;
        }
        .field-input::placeholder{color:#c4bdb4;}
        .field-input:focus{border-color:#0d9488;box-shadow:0 0 0 3px rgba(13,148,136,.1);}
        .field-icon{position:absolute;right:14px;top:50%;transform:translateY(-50%);color:#c4bdb4;cursor:pointer;background:none;border:none;padding:0;display:flex;align-items:center;transition:color .2s;}
        .field-group.foc .field-icon{color:#9a9187;}
        .field-icon:hover{color:#0d9488!important;}

        /* ── ERROR ── */
        .lg-error{margin:12px 0;padding:12px 16px;background:#fee2e2;border:1.5px solid rgba(220,38,38,.2);border-radius:8px;font-size:13px;color:#dc2626;text-align:center;font-weight:500;}

        /* ── LOGIN BTN ── */
        .lg-btn{
          width:100%;margin-top:24px;padding:15px;background:#0d9488;border:none;border-radius:8px;
          font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;
          color:#fff;cursor:pointer;transition:opacity .2s,transform .15s,box-shadow .15s;
          box-shadow:0 4px 14px rgba(13,148,136,.3);
          display:flex;align-items:center;justify-content:center;gap:8px;
        }
        .lg-btn:hover:not(:disabled){opacity:.9;transform:translateY(-1px);box-shadow:0 6px 20px rgba(13,148,136,.35);}
        .lg-btn:active:not(:disabled){transform:translateY(0);}
        .lg-btn:disabled{opacity:.5;cursor:not-allowed;}

        /* ── SPINNER ── */
        .sp{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:lg-spin .7s linear infinite;}

        /* ── SUCCESS OVERLAY ── */
        .lg-success-overlay{
          position:fixed;inset:0;z-index:9998;
          background:rgba(13,148,136,.92);
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;
          animation:lg-fadein .3s ease;
        }
        .lg-success-icon{font-size:60px;animation:lg-success .5s cubic-bezier(.34,1.56,.64,1) both;}
        .lg-success-txt{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#fff;animation:lg-riseup .4s .15s ease both;}
        .lg-success-sub{font-size:13px;color:rgba(255,255,255,.7);animation:lg-riseup .4s .25s ease both;}

        .lg-footer{margin-top:32px;text-align:center;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#c4bdb4;}
      `}</style>

      {/* ── OFFLINE BANNER ── */}
      {!isOnline && (
        <div className="lg-offline">
          <span>📡</span>
          <span>You're offline — limited functionality</span>
        </div>
      )}

      {/* ── BIOMETRIC SUCCESS OVERLAY ── */}
      {showBioSuccess && (
        <div className="lg-success-overlay">
          <div className="lg-success-icon">✅</div>
          <div className="lg-success-txt">Welcome back!</div>
          <div className="lg-success-sub">Fingerprint verified</div>
        </div>
      )}

      <div className="lg-root" style={{ paddingTop: !isOnline ? 42 : 0 }}>
        <div className="bg-circle bc1" />
        <div className="bg-circle bc2" />
        <div className="bg-circle bc3" />
        <div className="bg-vline" />

        {/* ── LEFT PANEL ── */}
        <div className="lg-left">
          <div className="logo-mark">
            <div className="logo-diamond" />
            <span className="logo-text">Daily Income Track</span>
          </div>
          <div>
            <div className="left-tag">Financial clarity, daily</div>
            <h1 className="left-h1">Track every<br /><em>income stream</em><br />with precision.</h1>
            <p className="left-desc">A clean, focused dashboard to record your daily income, expenses and payments — all in one place.</p>
            <div className="stats-row">
              <div className="stat"><span className="stat-num">100%</span><span className="stat-lbl">Accurate</span></div>
              <div className="stat"><span className="stat-num">Live</span><span className="stat-lbl">Real-time</span></div>
              <div className="stat"><span className="stat-num">Safe</span><span className="stat-lbl">& Private</span></div>
            </div>
          </div>
          <p className="left-foot">© 2026 Daily Income Track</p>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="lg-right">
          <div className="corner c-tr" />
          <div className="corner c-bl" />

          <div className="form-eye">Secure Access</div>
          <h2 className="form-title">Welcome<br /><em>back.</em></h2>
          <p className="form-sub">Sign in to your dashboard</p>

          {/* ══ PWA INSTALL BUTTON ══ */}
          {!isInstalled && (
            <>
              {showInstallTip && (
                <div className="lg-install-tip">
                  📱 On iOS: tap <strong>Share → Add to Home Screen</strong><br />
                  On Android: tap menu → <strong>Install App</strong>
                </div>
              )}
              <button className={`lg-install-btn${isInstalled ? " installed" : ""}`} onClick={handleInstall}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
                {isInstalled ? "✓ App Installed" : "📲 Install App"}
              </button>
            </>
          )}

          {/* ══ BIOMETRIC SECTION (mobile only) ══ */}
          {isMobile && bioSupported && (
            <>
              <div className={`lg-bio${bioStatus !== "idle" ? ` ${bioStatus}` : ""}`}>

                {/* Fingerprint button */}
                <button
                  className={`lg-fp-btn${bioStatus === "scanning" ? " pulsing" : ""}${bioStatus === "success" ? " success-btn" : ""}${bioStatus === "error" ? " error-btn" : ""}`}
                  onClick={bioRegistered ? handleBioAuth : handleBioRegister}
                  disabled={bioStatus === "scanning"}
                >
                  {fpBtnContent()}
                </button>

                <div className="lg-bio-label">
                  {bioStatus === "scanning" ? "Scanning…"
                    : bioStatus === "success" ? "Verified ✓"
                      : bioStatus === "error" ? "Try again"
                        : bioRegistered ? "Touch to sign in"
                          : "Register fingerprint"}
                </div>

                <div className={`lg-bio-sub${bioStatus === "success" ? " ok" : bioStatus === "error" ? " err" : ""}`}>
                  {bioMsg || (bioRegistered
                    ? "Use your fingerprint for instant access"
                    : "Sign in with email first, then register fingerprint")}
                </div>

                {/* Register / Remove link */}
                <div className="lg-bio-link-row">
                  {bioRegistered ? (
                    <>
                      <span className="lg-bio-link">Not your device?</span>
                      <button className="lg-bio-action remove" onClick={() => {
                        localStorage.removeItem(CRED_KEY);
                        setBioRegistered(false); setBioStatus("idle"); setBioMsg("");
                      }}>Remove</button>
                    </>
                  ) : (
                    <>
                      <span className="lg-bio-link">Already registered?</span>
                      <button className="lg-bio-action" onClick={handleBioAuth}>Authenticate</button>
                    </>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="lg-divider">
                <div className="lg-div-line" />
                <span className="lg-div-txt">or sign in with email</span>
                <div className="lg-div-line" />
              </div>
            </>
          )}

          {/* ══ EMAIL FORM ══ */}
          <div className={`field-group${focused === "email" ? " foc" : ""}`}>
            <label className="field-lbl">Email Address</label>
            <div className="field-wrap">
              <input
                type="email" className="field-input"
                placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
              />
              <span className="field-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 7l10 7 10-7" />
                </svg>
              </span>
            </div>
          </div>

          <div className={`field-group${focused === "password" ? " foc" : ""}`}>
            <label className="field-lbl">Password</label>
            <div className="field-wrap">
              <input
                type={showPwd ? "text" : "password"} className="field-input"
                placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <button type="button" className="field-icon" onClick={() => setShowPwd(!showPwd)} tabIndex={-1}>
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

          {error && <div className="lg-error">{error}</div>}

          <button className="lg-btn" onClick={handleLogin} disabled={loading}>
            {loading ? <><span className="sp" /> Signing in…</> : "Sign In"}
          </button>

          <p className="lg-footer">© 2026 Daily Income Track</p>
        </div>
      </div>
    </>
  );
}