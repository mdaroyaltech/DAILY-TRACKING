// ─────────────────────────────────────────────────────────────
//  Login.jsx  —  Mobile-first  |  Biometric  |  PWA Install  |  Offline
// ─────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

/* ══════════════════════════════════════════════════════
   WEBAUTHN  ─  rock-solid helpers
══════════════════════════════════════════════════════ */
const BIO_KEY = "dit_bio_cred_v1";
const UID_BYTES = new TextEncoder().encode("dit-user-001");

const b64e = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

const b64d = (s) => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};

export async function checkBioAvailable() {
  try {
    if (!window.PublicKeyCredential) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch { return false; }
}

export function hasBioRegistered() {
  return !!localStorage.getItem(BIO_KEY);
}

export async function bioRegister() {
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "Daily Income Track" },
        user: { id: UID_BYTES, name: "user", displayName: "User" },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },  // ES256
          { type: "public-key", alg: -257 },  // RS256
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
    localStorage.setItem(BIO_KEY, b64e(cred.rawId));
    return { ok: true };
  } catch (e) {
    if (e.name === "NotAllowedError") return { ok: false, msg: "Cancelled — please try again." };
    if (e.name === "InvalidStateError") return { ok: false, msg: "Already registered on this device." };
    return { ok: false, msg: e.message };
  }
}

export async function bioAuthenticate() {
  const saved = localStorage.getItem(BIO_KEY);
  if (!saved) return { ok: false, msg: "No fingerprint registered on this device." };
  try {
    const result = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ id: b64d(saved), type: "public-key", transports: ["internal"] }],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return result ? { ok: true } : { ok: false, msg: "Authentication failed." };
  } catch (e) {
    if (e.name === "NotAllowedError") return { ok: false, msg: "Cancelled — please try again." };
    return { ok: false, msg: e.message };
  }
}

/* ══════════════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════════════ */
const IconFingerprint = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 10a2 2 0 0 0-2 2c0 1-.1 2.5-.26 3.4" />
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

const IconInstall = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 16l-5-5h3V4h4v7h3l-5 5z" />
    <path d="M20 21H4" />
  </svg>
);

const IconEmail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);

const IconEye = ({ show }) => show ? (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/* ══════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{height:100%;-webkit-tap-highlight-color:transparent;}

/* keyframes */
@keyframes lg-spin     {to{transform:rotate(360deg);}}
@keyframes lg-fadein   {from{opacity:0;}to{opacity:1;}}
@keyframes lg-up       {from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
@keyframes lg-scalein  {0%{opacity:0;transform:scale(.8);}65%{transform:scale(1.05);}100%{opacity:1;transform:scale(1);}}
@keyframes lg-shake    {0%,100%{transform:translateX(0);}20%{transform:translateX(-8px);}40%{transform:translateX(8px);}60%{transform:translateX(-5px);}80%{transform:translateX(5px);}}
@keyframes lg-pulse    {0%,100%{box-shadow:0 0 0 0 rgba(13,148,136,.5);}70%{box-shadow:0 0 0 18px rgba(13,148,136,0);}}
@keyframes lg-success  {0%{opacity:0;transform:scale(.75);}60%{transform:scale(1.12);}100%{opacity:1;transform:scale(1);}}
@keyframes lg-banner   {from{transform:translateY(-100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
@keyframes lg-shimmer  {0%{background-position:-200% center;}100%{background-position:200% center;}}

/* ── ROOT ── */
.lg-root{
  min-height:100vh;min-height:100dvh;
  background:#f5f2ed;
  display:flex;align-items:center;justify-content:center;
  font-family:'DM Sans',sans-serif;color:#1c1a17;
  position:relative;overflow-x:hidden;
  padding:20px 16px;
}
.lg-root::before{
  content:'';position:absolute;inset:0;pointer-events:none;
  background:
    radial-gradient(ellipse 70% 50% at 20% 10%,rgba(13,148,136,.07) 0%,transparent 60%),
    radial-gradient(ellipse 60% 45% at 85% 88%,rgba(13,148,136,.05) 0%,transparent 60%);
}
.lg-root::after{
  content:'';position:absolute;inset:0;pointer-events:none;
  background-image:radial-gradient(circle,rgba(13,148,136,.07) 1px,transparent 1px);
  background-size:28px 28px;opacity:.5;
}

/* ── OFFLINE BANNER ── */
.lg-offline-bar{
  position:fixed;top:0;left:0;right:0;z-index:9999;
  background:#b45309;color:#fff;
  padding:11px 20px;
  display:flex;align-items:center;justify-content:center;gap:8px;
  font-size:13px;font-weight:600;letter-spacing:.02em;
  box-shadow:0 3px 14px rgba(0,0,0,.2);
  animation:lg-banner .3s ease;
}

/* ── CARD ── */
.lg-card{
  position:relative;z-index:1;
  width:100%;max-width:420px;
  background:#fff;border-radius:24px;overflow:hidden;
  box-shadow:0 2px 6px rgba(0,0,0,.05),0 16px 48px rgba(0,0,0,.11),0 0 0 1px rgba(0,0,0,.04);
  animation:lg-up .5s .05s ease both;
}

/* ── CARD HEADER BAND ── */
.lg-band{
  padding:32px 28px 26px;
  background:linear-gradient(155deg,#064e3b 0%,#065f46 50%,#047857 100%);
  position:relative;overflow:hidden;
  display:flex;flex-direction:column;align-items:center;text-align:center;
}
.lg-band::before{
  content:'';position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(-50deg,rgba(255,255,255,.025) 0,rgba(255,255,255,.025) 1px,transparent 1px,transparent 26px);
}
.lg-band::after{
  content:'';position:absolute;bottom:-22px;left:-5%;right:-5%;
  height:44px;background:#fff;border-radius:50% 50% 0 0/100% 100% 0 0;
}
.lg-band-icon{
  width:68px;height:68px;border-radius:20px;
  background:rgba(255,255,255,.14);border:1.5px solid rgba(255,255,255,.22);
  display:flex;align-items:center;justify-content:center;
  font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#fff;
  margin-bottom:16px;position:relative;z-index:1;
  animation:lg-scalein .6s .15s cubic-bezier(.34,1.4,.64,1) both;
}
.lg-band-title{
  font-family:'Playfair Display',serif;font-size:20px;font-weight:700;
  color:#fff;line-height:1.15;position:relative;z-index:1;
  animation:lg-up .5s .25s ease both;margin-bottom:4px;
}
.lg-band-title em{font-style:italic;color:#6ee7b7;}
.lg-band-sub{
  font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;
  color:rgba(255,255,255,.45);position:relative;z-index:1;
  animation:lg-up .5s .32s ease both;
}

/* ── CARD BODY ── */
.lg-body{padding:28px 24px 24px;}

/* ── INSTALL BUTTON ── */
.lg-install{
  display:flex;align-items:center;justify-content:center;gap:8px;
  width:100%;padding:12px;margin-bottom:18px;
  background:linear-gradient(135deg,#0f766e,#0d9488);
  color:#fff;border:none;border-radius:12px;cursor:pointer;
  font-family:'DM Sans',sans-serif;font-size:12px;font-weight:700;
  letter-spacing:.1em;text-transform:uppercase;
  box-shadow:0 4px 16px rgba(13,148,136,.28);
  transition:all .22s;-webkit-tap-highlight-color:transparent;
  animation:lg-up .4s .35s ease both;
}
.lg-install:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(13,148,136,.38);}
.lg-install:active{transform:scale(.98);}
.lg-install.done{
  background:linear-gradient(135deg,#059669,#10b981);
  pointer-events:none;
}
.lg-install-tip{
  background:#fef3c7;border:1px solid #fde68a;border-radius:10px;
  padding:10px 14px;margin-bottom:14px;
  font-size:12px;color:#92400e;text-align:center;line-height:1.6;
  animation:lg-up .25s ease both;
}

/* ── BIO SECTION ── */
.lg-bio{
  border:1.5px solid #e5e7eb;border-radius:16px;
  padding:20px 16px;background:#fafaf9;
  display:flex;flex-direction:column;align-items:center;gap:10px;
  margin-bottom:18px;
  transition:border-color .25s,background .25s;
  animation:lg-up .4s .4s ease both;
}
.lg-bio.state-scanning{background:#f0fdf9;border-color:#99d6d0;}
.lg-bio.state-success {background:#f0fdf4;border-color:#6ee7b7;}
.lg-bio.state-error   {background:#fff5f5;border-color:#fecaca;animation:lg-shake .4s ease;}

/* Fingerprint button */
.lg-fp{
  width:70px;height:70px;border-radius:50%;border:none;cursor:pointer;
  background:linear-gradient(145deg,#0d9488,#0f766e);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 6px 22px rgba(13,148,136,.35);
  color:#fff;position:relative;
  transition:all .22s;-webkit-tap-highlight-color:transparent;
  -webkit-appearance:none;
}
.lg-fp:hover   {transform:scale(1.06);box-shadow:0 10px 28px rgba(13,148,136,.45);}
.lg-fp:active  {transform:scale(.95);}
.lg-fp:disabled{opacity:.5;cursor:not-allowed;transform:none!important;}
.lg-fp.pulsing {animation:lg-pulse 1.1s ease-in-out infinite;}
.lg-fp.ok-btn  {background:linear-gradient(145deg,#059669,#047857);}
.lg-fp.err-btn {background:linear-gradient(145deg,#dc2626,#b91c1c);}

/* Spinner inside fp btn */
.lg-fp-spin{
  width:26px;height:26px;border-radius:50%;
  border:3px solid rgba(255,255,255,.25);border-top-color:#fff;
  animation:lg-spin .7s linear infinite;
}

.lg-bio-title{
  font-size:14px;font-weight:600;color:#1f2937;text-align:center;
}
.lg-bio-desc{
  font-size:12px;font-weight:400;color:#9ca3af;text-align:center;line-height:1.5;
}
.lg-bio-desc.ok {color:#059669;font-weight:600;}
.lg-bio-desc.err{color:#dc2626;font-weight:600;}

.lg-bio-links{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:2px;}
.lg-bio-text{font-size:11px;color:#d1d5db;}
.lg-bio-act{
  font-size:11px;font-weight:700;color:#0d9488;
  background:none;border:none;cursor:pointer;padding:0;
  font-family:'DM Sans',sans-serif;
  text-decoration:underline;text-underline-offset:2px;
  transition:opacity .15s;-webkit-tap-highlight-color:transparent;
}
.lg-bio-act:hover{opacity:.7;}
.lg-bio-act.danger{color:#dc2626;}

/* ── DIVIDER ── */
.lg-div{display:flex;align-items:center;gap:10px;margin:4px 0 18px;}
.lg-div-line{flex:1;height:1px;background:#e5e7eb;}
.lg-div-txt{font-size:10px;font-weight:600;color:#d1d5db;letter-spacing:.07em;white-space:nowrap;}

/* ── FIELD ── */
.lg-field{margin-bottom:16px;}
.lg-label{
  display:block;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:#6b7280;margin-bottom:7px;transition:color .2s;
}
.lg-field.foc .lg-label{color:#0d9488;}
.lg-wrap{position:relative;}
.lg-input{
  width:100%;background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:11px;
  padding:13px 44px 13px 16px;font-size:15px;
  font-family:'DM Sans',sans-serif;font-weight:400;color:#1c1a17;
  outline:none;-webkit-appearance:none;
  transition:border-color .2s,box-shadow .2s,background .2s;
  /* better touch target */
  min-height:50px;
}
.lg-input::placeholder{color:#d1d5db;}
.lg-input:focus{
  border-color:#0d9488;background:#fff;
  box-shadow:0 0 0 4px rgba(13,148,136,.1);
}
.lg-icon{
  position:absolute;right:14px;top:50%;transform:translateY(-50%);
  color:#d1d5db;background:none;border:none;padding:6px;cursor:pointer;
  display:flex;align-items:center;transition:color .2s;
  -webkit-tap-highlight-color:transparent;
}
.lg-field.foc .lg-icon{color:#9ca3af;}
.lg-icon:hover{color:#0d9488!important;}

/* ── ERROR BOX ── */
.lg-err{
  background:#fee2e2;border:1.5px solid rgba(220,38,38,.18);border-radius:10px;
  padding:12px 16px;font-size:13px;color:#dc2626;text-align:center;
  font-weight:500;margin:4px 0 12px;animation:lg-up .25s ease;
}

/* ── SUBMIT BTN ── */
.lg-submit{
  width:100%;margin-top:20px;padding:15px;
  background:linear-gradient(135deg,#0d9488,#0f766e);
  border:none;border-radius:12px;
  font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;
  letter-spacing:.14em;text-transform:uppercase;color:#fff;cursor:pointer;
  box-shadow:0 4px 16px rgba(13,148,136,.32);
  display:flex;align-items:center;justify-content:center;gap:8px;
  transition:all .22s;-webkit-tap-highlight-color:transparent;
  min-height:52px;
}
.lg-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 22px rgba(13,148,136,.4);}
.lg-submit:active:not(:disabled){transform:scale(.98);}
.lg-submit:disabled{opacity:.45;cursor:not-allowed;box-shadow:none;}
.lg-submit-spin{
  width:14px;height:14px;border-radius:50%;
  border:2px solid rgba(255,255,255,.3);border-top-color:#fff;
  animation:lg-spin .7s linear infinite;flex-shrink:0;
}

/* ── FOOTER ── */
.lg-foot{
  margin-top:24px;text-align:center;
  font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#c4bdb4;
}

/* ── SUCCESS OVERLAY ── */
.lg-overlay{
  position:fixed;inset:0;z-index:9998;
  background:rgba(6,78,59,.93);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
  animation:lg-fadein .3s ease;
  padding:24px;
}
.lg-ov-icon{font-size:66px;animation:lg-success .55s cubic-bezier(.34,1.56,.64,1) both;}
.lg-ov-title{
  font-family:'Playfair Display',serif;font-size:26px;font-weight:700;
  color:#fff;text-align:center;animation:lg-up .4s .12s ease both;
}
.lg-ov-sub{font-size:14px;color:rgba(255,255,255,.65);animation:lg-up .4s .22s ease both;}

/* ── MOBILE SAFE AREA ── */
@supports(padding:max(0px)){
  .lg-root{
    padding-top:max(20px,env(safe-area-inset-top));
    padding-bottom:max(20px,env(safe-area-inset-bottom));
    padding-left:max(16px,env(safe-area-inset-left));
    padding-right:max(16px,env(safe-area-inset-right));
  }
}
`;

/* ══════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════ */
export default function Login({ setLoggedIn }) {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [focused, setFocused] = useState(null);

  // Biometric state
  const [bioAvail, setBioAvail] = useState(false);
  const [bioReg, setBioReg] = useState(false);
  const [bioState, setBioState] = useState("idle"); // idle|scanning|success|error
  const [bioDesc, setBioDesc] = useState("");
  const [showOvlay, setShowOvlay] = useState(false);

  // PWA install state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [installTip, setInstallTip] = useState(false);

  // Network state
  const [online, setOnline] = useState(navigator.onLine);

  // Detect mobile properly
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  /* ── Init ── */
  useEffect(() => {
    // Check biometric
    if (isMobile) {
      checkBioAvailable().then(ok => {
        setBioAvail(ok);
        setBioReg(hasBioRegistered());
      });
    }

    // PWA: already installed?
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      setInstalled(true);
    }

    // PWA: listen for install prompt
    const onPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => { setInstalled(true); setDeferredPrompt(null); });

    // Network
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  /* ── Auto-redirect if already logged in ── */
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

  /* ── Email/password login ── */
  const handleLogin = useCallback(async () => {
    if (!email.trim() || !pass) { setErrMsg("Please enter your email and password."); return; }
    setErrMsg(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    setLoading(false);
    if (error) { setErrMsg(error.message); return; }
    setLoggedIn(true);
    navigate("/dashboard");
  }, [email, pass, navigate, setLoggedIn]);

  /* ── Biometric authenticate ── */
  const handleBioAuth = async () => {
    setBioDesc(""); setBioState("scanning");
    const { ok, msg } = await bioAuthenticate();
    if (ok) {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setBioState("success"); setBioDesc("Verified!");
        setShowOvlay(true);
        setTimeout(() => { setLoggedIn(true); navigate("/dashboard"); }, 1500);
      } else {
        // No active session — fingerprint passed but no session
        // This happens when app was logged out; user must sign in with email once
        setBioState("error");
        setBioDesc("Session expired. Please sign in with email first.");
        setTimeout(() => { setBioState("idle"); setBioDesc(""); }, 3500);
      }
    } else {
      setBioState("error"); setBioDesc(msg || "Failed. Try again.");
      setTimeout(() => { setBioState("idle"); setBioDesc(""); }, 2500);
    }
  };

  /* ── Biometric register ── */
  const handleBioRegister = async () => {
    setBioDesc(""); setBioState("scanning");
    const { ok, msg } = await bioRegister();
    if (ok) {
      setBioReg(true); setBioState("success");
      setBioDesc("Fingerprint saved! Use it next time to sign in.");
      setTimeout(() => { setBioState("idle"); setBioDesc(""); }, 3000);
    } else {
      setBioState("error"); setBioDesc(msg || "Registration failed.");
      setTimeout(() => { setBioState("idle"); setBioDesc(""); }, 2500);
    }
  };

  /* ── Remove biometric ── */
  const handleBioRemove = () => {
    localStorage.removeItem(BIO_KEY);
    setBioReg(false); setBioState("idle"); setBioDesc("");
  };

  /* ── PWA install ── */
  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") { setInstalled(true); setDeferredPrompt(null); }
    } else {
      // iOS / no prompt — show manual tip
      setInstallTip(true);
      setTimeout(() => setInstallTip(false), 5000);
    }
  };

  /* ── Biometric button content ── */
  const fpContent = () => {
    if (bioState === "scanning") return <div className="lg-fp-spin" />;
    if (bioState === "success") return <span style={{ fontSize: 28 }}>✓</span>;
    if (bioState === "error") return <span style={{ fontSize: 24 }}>✕</span>;
    return <IconFingerprint />;
  };

  const fpTitle = () => {
    if (bioState === "scanning") return "Scanning…";
    if (bioState === "success") return "Verified ✓";
    if (bioState === "error") return "Try again";
    return bioReg ? "Touch to sign in" : "Set up fingerprint";
  };

  const fpDesc = () => {
    if (bioDesc) return bioDesc;
    if (bioReg) return "Use your fingerprint for instant access";
    return "Register your fingerprint for faster login next time";
  };

  return (
    <>
      <style>{CSS}</style>

      {/* Success overlay */}
      {showOvlay && (
        <div className="lg-overlay">
          <div className="lg-ov-icon">✅</div>
          <div className="lg-ov-title">Welcome back!</div>
          <div className="lg-ov-sub">Fingerprint verified · Signing you in…</div>
        </div>
      )}

      {/* Offline banner */}
      {!online && (
        <div className="lg-offline-bar">
          <span>📡</span>
          <span>No internet connection</span>
        </div>
      )}

      <div className="lg-root" style={{ paddingTop: !online ? 60 : undefined }}>
        <div className="lg-card">

          {/* ── HEADER BAND ── */}
          <div className="lg-band">
            <div className="lg-band-icon">₹</div>
            <h1 className="lg-band-title">Daily <em>Income</em> Tracking</h1>
            <p className="lg-band-sub">Finance Manager</p>
          </div>

          {/* ── BODY ── */}
          <div className="lg-body">

            {/* ── PWA INSTALL ── */}
            {!installed && (
              <>
                {installTip && (
                  <div className="lg-install-tip">
                    📱 <strong>iOS:</strong> Safari → Share → "Add to Home Screen"<br />
                    🤖 <strong>Android:</strong> Chrome menu → "Install App"
                  </div>
                )}
                <button
                  className={`lg-install${installed ? " done" : ""}`}
                  onClick={handleInstall}
                >
                  <IconInstall />
                  {installed ? "✓ App Installed" : "📲 Install App on Device"}
                </button>
              </>
            )}

            {/* ── BIOMETRIC ── */}
            {isMobile && bioAvail && (
              <>
                <div className={`lg-bio${bioState !== "idle" ? ` state-${bioState}` : ""}`}>

                  <button
                    className={`lg-fp${bioState === "scanning" ? " pulsing" :
                      bioState === "success" ? " ok-btn" :
                        bioState === "error" ? " err-btn" : ""
                      }`}
                    onClick={bioReg ? handleBioAuth : handleBioRegister}
                    disabled={bioState === "scanning"}
                  >
                    {fpContent()}
                  </button>

                  <div className="lg-bio-title">{fpTitle()}</div>

                  <div className={`lg-bio-desc${bioState === "success" ? " ok" :
                    bioState === "error" ? " err" : ""
                    }`}>{fpDesc()}</div>

                  {/* Links row */}
                  <div className="lg-bio-links">
                    {bioReg ? (
                      <>
                        <span className="lg-bio-text">Not your device?</span>
                        <button className="lg-bio-act danger" onClick={handleBioRemove}>
                          Remove fingerprint
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="lg-bio-text">Already set up?</span>
                        <button className="lg-bio-act" onClick={handleBioAuth}>
                          Authenticate
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="lg-div">
                  <div className="lg-div-line" />
                  <span className="lg-div-txt">or use email</span>
                  <div className="lg-div-line" />
                </div>
              </>
            )}

            {/* ── EMAIL FIELD ── */}
            <div className={`lg-field${focused === "email" ? " foc" : ""}`}>
              <label className="lg-label">Email Address</label>
              <div className="lg-wrap">
                <input
                  className="lg-input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
                <span className="lg-icon"><IconEmail /></span>
              </div>
            </div>

            {/* ── PASSWORD FIELD ── */}
            <div className={`lg-field${focused === "pass" ? " foc" : ""}`}>
              <label className="lg-label">Password</label>
              <div className="lg-wrap">
                <input
                  className="lg-input"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  onFocus={() => setFocused("pass")}
                  onBlur={() => setFocused(null)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                />
                <button
                  className="lg-icon"
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd(p => !p)}
                >
                  <IconEye show={showPwd} />
                </button>
              </div>
            </div>

            {/* ── ERROR ── */}
            {errMsg && <div className="lg-err">{errMsg}</div>}

            {/* ── SUBMIT ── */}
            <button
              className="lg-submit"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading
                ? <><div className="lg-submit-spin" /> Signing in…</>
                : "Sign In"
              }
            </button>

            <p className="lg-foot">© 2026 Daily Income Track</p>
          </div>
        </div>
      </div>
    </>
  );
}