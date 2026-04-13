// ─────────────────────────────────────────────────────────────
//  Login.jsx  —  Premium redesign · matches Dashboard system
// ─────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

/* ══════════════════════════════════════════════════════
   WEBAUTHN
══════════════════════════════════════════════════════ */
const BIO_KEY = "dit_bio_cred_v1";
const UID_BYTES = new TextEncoder().encode("dit-user-001");
const b64e = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
const b64d = (s) => { const b64 = s.replace(/-/g, "+").replace(/_/g, "/"); return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); };

export async function checkBioAvailable() {
  try { if (!window.PublicKeyCredential) return false; return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); }
  catch { return false; }
}
export function hasBioRegistered() { return !!localStorage.getItem(BIO_KEY); }

export async function bioRegister() {
  try {
    const cred = await navigator.credentials.create({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { name: "Daily Income Track" }, user: { id: UID_BYTES, name: "user", displayName: "User" }, pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }], authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" }, timeout: 60000, attestation: "none" } });
    localStorage.setItem(BIO_KEY, b64e(cred.rawId)); return { ok: true };
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
    const result = await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), allowCredentials: [{ id: b64d(saved), type: "public-key", transports: ["internal"] }], userVerification: "required", timeout: 60000 } });
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
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 10a2 2 0 0 0-2 2c0 1-.1 2.5-.26 3.4" /><path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" /><path d="M2 12a10 10 0 0 1 18-6" />
    <path d="M2 17.5c.4.5 1.28 1.5 3 2.5" /><path d="M20 12c0 2-.4 4.12-1.2 5.5" />
    <path d="M5.14 9.5A10 10 0 0 0 2 17" /><path d="M8.65 22c.21-.57.55-1.59 1.35-2" />
    <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
  </svg>
);
const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 16l-5-5h3V4h4v7h3l-5 5z" /><path d="M20 21H4" />
  </svg>
);
const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 7 10-7" />
  </svg>
);
const IconEye = ({ show }) => show ? (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
) : (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ══════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

:root {
  --bg:         #f5f2ed;
  --bg2:        #ede9e2;
  --surface:    #ffffff;
  --surface2:   #faf8f5;
  --border:     #e2dcd4;
  --border2:    #d0c9be;
  --text:       #1c1a17;
  --text-med:   #5a5449;
  --text-dim:   #9a9187;
  --text-faint: #c4bdb4;
  --teal:       #0d9488;
  --teal-dark:  #0f766e;
  --teal-deep:  #064e3b;
  --teal-light: #e0f2f0;
  --teal-mid:   #99d6d0;
  --green:      #16a34a;
  --green-bg:   #dcfce7;
  --red:        #dc2626;
  --red-bg:     #fee2e2;
  --amber:      #b45309;
  --amber-bg:   #fef3c7;
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.06),0 1px 2px rgba(0,0,0,0.04);
  --shadow:     0 4px 16px rgba(0,0,0,0.07),0 1px 4px rgba(0,0,0,0.04);
  --shadow-lg:  0 20px 60px rgba(0,0,0,0.12),0 4px 16px rgba(0,0,0,0.06);
}

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body{height:100%;-webkit-tap-highlight-color:transparent;}

/* ── KEYFRAMES ── */
@keyframes fadeUp     {from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
@keyframes fadeIn     {from{opacity:0;}to{opacity:1;}}
@keyframes popIn      {0%{opacity:0;transform:scale(.82);}60%{transform:scale(1.06);}100%{opacity:1;transform:scale(1);}}
@keyframes slideRight {from{opacity:0;transform:translateX(-14px);}to{opacity:1;transform:translateX(0);}}
@keyframes shimmer    {0%{background-position:-200% center;}100%{background-position:200% center;}}
@keyframes spin       {to{transform:rotate(360deg);}}
@keyframes shake      {0%,100%{transform:translateX(0);}20%{transform:translateX(-8px);}40%{transform:translateX(8px);}60%{transform:translateX(-5px);}80%{transform:translateX(5px);}}
@keyframes pulse      {0%,100%{box-shadow:0 0 0 0 rgba(13,148,136,.45);}70%{box-shadow:0 0 0 18px rgba(13,148,136,0);}}
@keyframes successPop {0%{opacity:0;transform:scale(.6);}60%{transform:scale(1.15);}100%{opacity:1;transform:scale(1);}}
@keyframes bannerSlide{from{transform:translateY(-100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
@keyframes orbit      {from{transform:rotate(0deg) translateX(22px) rotate(0deg);}to{transform:rotate(360deg) translateX(22px) rotate(-360deg);}}
@keyframes floatY     {0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);}}
@keyframes ticker     {0%{background-position:200% center;}100%{background-position:-200% center;}}
@keyframes ripple     {0%{transform:scale(0);opacity:.6;}100%{transform:scale(2.8);opacity:0;}}
@keyframes dotBounce  {0%,80%,100%{transform:scale(0);opacity:.4;}40%{transform:scale(1);opacity:1;}}
@keyframes loadBar    {0%{width:0%;}100%{width:100%;}}
@keyframes scanLine   {0%{top:-10%;}100%{top:110%;}}
@keyframes glowPulse  {0%,100%{opacity:.5;}50%{opacity:1;}}
@keyframes countUp    {from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
@keyframes bgFloat    {0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(15px,-10px) scale(1.05);}66%{transform:translate(-8px,12px) scale(.97);}}

/* ── ROOT ── */
.lg-root{
  min-height:100vh;min-height:100dvh;
  background:var(--bg);
  display:flex;align-items:center;justify-content:center;
  font-family:'DM Sans',sans-serif;color:var(--text);
  position:relative;overflow:hidden;
  padding:20px 16px;
}

/* Animated background blobs */
.lg-blob{
  position:absolute;border-radius:50%;pointer-events:none;
  filter:blur(60px);opacity:.55;
}
.lg-blob-1{
  width:380px;height:380px;
  background:radial-gradient(circle,rgba(13,148,136,.18) 0%,transparent 70%);
  top:-80px;left:-80px;
  animation:bgFloat 9s ease-in-out infinite;
}
.lg-blob-2{
  width:320px;height:320px;
  background:radial-gradient(circle,rgba(13,148,136,.12) 0%,transparent 70%);
  bottom:-60px;right:-60px;
  animation:bgFloat 11s ease-in-out infinite reverse;
}
.lg-blob-3{
  width:200px;height:200px;
  background:radial-gradient(circle,rgba(22,163,74,.08) 0%,transparent 70%);
  top:50%;right:10%;
  animation:bgFloat 13s ease-in-out infinite 2s;
}

/* Dot grid */
.lg-root::after{
  content:'';position:absolute;inset:0;pointer-events:none;
  background-image:radial-gradient(circle,rgba(13,148,136,.07) 1px,transparent 1px);
  background-size:26px 26px;opacity:.7;
}

/* ── OFFLINE BANNER ── */
.lg-offline{
  position:fixed;top:0;left:0;right:0;z-index:9999;
  background:var(--amber);color:#fff;
  padding:10px 20px;
  display:flex;align-items:center;justify-content:center;gap:8px;
  font-size:13px;font-weight:600;letter-spacing:.02em;
  animation:bannerSlide .3s ease;
}

/* ── CARD ── */
.lg-card{
  position:relative;z-index:1;
  width:100%;max-width:424px;
  background:var(--surface);
  border:1.5px solid var(--border);
  border-radius:20px;
  box-shadow:var(--shadow-lg);
  overflow:hidden;
  animation:fadeUp .55s .05s cubic-bezier(.22,1,.36,1) both;
}

/* ── TOP ACCENT STRIP ── */
.lg-strip{
  height:4px;
  background:linear-gradient(90deg,var(--teal-deep) 0%,var(--teal) 40%,#34d399 70%,var(--teal) 100%);
  background-size:200% auto;
  animation:shimmer 4s linear infinite;
}

/* ── HERO SECTION ── */
.lg-hero{
  padding:32px 32px 28px;
  background:var(--surface);
  border-bottom:1.5px solid var(--border);
  position:relative;overflow:hidden;
}

/* Subtle diagonal stripe texture */
.lg-hero::before{
  content:'';position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(
    -45deg,
    transparent,transparent 20px,
    rgba(13,148,136,.025) 20px,rgba(13,148,136,.025) 21px
  );
}

.lg-hero-top{
  display:flex;align-items:flex-start;justify-content:space-between;
  margin-bottom:20px;position:relative;z-index:1;
}

/* Rupee orb — premium version */
.lg-orb{
  width:52px;height:52px;border-radius:14px;
  background:linear-gradient(145deg,var(--teal-light),#ccfbf1);
  border:1.5px solid var(--teal-mid);
  display:flex;align-items:center;justify-content:center;
  font-family:'Playfair Display',serif;font-size:24px;font-weight:900;color:var(--teal-dark);
  box-shadow:0 4px 14px rgba(13,148,136,.2),inset 0 1px 0 rgba(255,255,255,.8);
  animation:popIn .55s .25s cubic-bezier(.34,1.56,.64,1) both;
  flex-shrink:0;
}

/* Live status pill */
.lg-status{
  display:flex;align-items:center;gap:6px;
  background:var(--green-bg);
  border:1px solid #86efac;
  border-radius:20px;padding:5px 11px;
  font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
  color:var(--green);
  animation:fadeIn .4s .6s ease both;
}
.lg-status-dot{
  width:6px;height:6px;border-radius:50%;background:var(--green);
  animation:glowPulse 1.8s ease-in-out infinite;
}

.lg-eyebrow{
  font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;
  color:var(--teal);margin-bottom:7px;
  display:flex;align-items:center;gap:8px;
  animation:slideRight .45s .2s ease both;
  position:relative;z-index:1;
}
.lg-eyebrow::before{content:'';display:inline-block;width:20px;height:2px;background:var(--teal);border-radius:2px;}

.lg-title{
  font-family:'Playfair Display',serif;
  font-size:clamp(24px,5vw,32px);font-weight:900;line-height:1.1;color:var(--text);
  animation:fadeUp .45s .28s ease both;
  position:relative;z-index:1;
}
.lg-title em{font-style:italic;color:var(--teal);}

.lg-sub{
  font-size:13px;font-weight:400;color:var(--text-dim);
  letter-spacing:.01em;margin-top:7px;line-height:1.5;
  animation:fadeUp .45s .35s ease both;
  position:relative;z-index:1;
}

/* Stats strip inside hero */
.lg-stats{
  display:grid;grid-template-columns:repeat(3,1fr);
  gap:1px;background:var(--border);
  border:1px solid var(--border);border-radius:12px;
  overflow:hidden;margin-top:22px;
  position:relative;z-index:1;
  animation:fadeUp .45s .42s ease both;
}
.lg-stat{
  background:var(--surface2);padding:10px 12px;text-align:center;
  transition:background .2s;
}
.lg-stat:hover{background:var(--teal-light);}
.lg-stat-val{
  font-family:'Playfair Display',serif;font-size:15px;font-weight:700;
  color:var(--teal);line-height:1;margin-bottom:3px;
}
.lg-stat-lbl{font-size:9px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-faint);}

/* ── BODY ── */
.lg-body{padding:24px 28px 28px;}

/* ── INSTALL BUTTON ── */
.lg-install-tip{
  background:var(--amber-bg);border:1px solid #fde68a;border-radius:10px;
  padding:10px 14px;margin-bottom:12px;
  font-size:12px;color:var(--amber);text-align:center;line-height:1.6;
  animation:fadeUp .25s ease both;
}
.lg-install{
  display:flex;align-items:center;justify-content:center;gap:8px;
  width:100%;padding:10px 16px;margin-bottom:18px;
  background:var(--surface2);border:1.5px dashed var(--teal-mid);
  border-radius:10px;cursor:pointer;
  font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase;color:var(--teal);
  transition:all .2s;
}
.lg-install:hover{background:var(--teal-light);border-style:solid;border-color:var(--teal);transform:translateY(-1px);}
.lg-install.done{background:var(--green-bg);border-color:#86efac;color:var(--green);border-style:solid;pointer-events:none;}

/* ── BIO PANEL ── */
.lg-bio{
  background:var(--surface2);border:1.5px solid var(--border);border-radius:14px;
  padding:20px 16px;display:flex;flex-direction:column;align-items:center;gap:10px;
  margin-bottom:18px;transition:all .25s;
  animation:fadeUp .45s .38s ease both;
}
.lg-bio.state-scanning{background:#f0fdf9;border-color:var(--teal-mid);}
.lg-bio.state-success {background:var(--green-bg);border-color:#86efac;}
.lg-bio.state-error   {background:var(--red-bg);border-color:#fca5a5;animation:shake .4s ease;}

/* Fingerprint ripple container */
.lg-fp-wrap{position:relative;width:68px;height:68px;}
.lg-fp-ripple{
  position:absolute;inset:0;border-radius:50%;
  background:rgba(13,148,136,.15);
  animation:ripple 1.8s ease-out infinite;
}
.lg-fp-ripple:nth-child(2){animation-delay:.6s;}
.lg-fp-ripple:nth-child(3){animation-delay:1.2s;}

.lg-fp{
  position:relative;z-index:1;
  width:68px;height:68px;border-radius:50%;border:none;cursor:pointer;
  background:linear-gradient(145deg,var(--teal),var(--teal-dark));
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 6px 20px rgba(13,148,136,.32);
  color:#fff;transition:all .2s;-webkit-tap-highlight-color:transparent;
}
.lg-fp:hover   {transform:scale(1.07);box-shadow:0 10px 28px rgba(13,148,136,.42);}
.lg-fp:active  {transform:scale(.94);}
.lg-fp:disabled{opacity:.5;cursor:not-allowed;transform:none!important;}
.lg-fp.pulsing {animation:pulse 1.1s ease-in-out infinite;}
.lg-fp.ok-btn  {background:linear-gradient(145deg,#059669,#047857);}
.lg-fp.err-btn {background:linear-gradient(145deg,var(--red),#b91c1c);}

.lg-fp-spin{
  width:24px;height:24px;border-radius:50%;
  border:2.5px solid rgba(255,255,255,.25);border-top-color:#fff;
  animation:spin .7s linear infinite;
}

.lg-bio-title{font-size:13px;font-weight:600;color:var(--text);text-align:center;}
.lg-bio-desc {font-size:11px;color:var(--text-dim);text-align:center;line-height:1.5;}
.lg-bio-desc.ok {color:var(--green);font-weight:600;}
.lg-bio-desc.err{color:var(--red);font-weight:600;}
.lg-bio-links{display:flex;align-items:center;gap:6px;justify-content:center;margin-top:2px;}
.lg-bio-text{font-size:11px;color:var(--text-faint);}
.lg-bio-act{font-size:11px;font-weight:700;color:var(--teal);background:none;border:none;cursor:pointer;padding:0;font-family:'DM Sans',sans-serif;text-decoration:underline;text-underline-offset:2px;transition:opacity .15s;}
.lg-bio-act:hover{opacity:.7;}
.lg-bio-act.danger{color:var(--red);}

/* ── DIVIDER ── */
.lg-div{display:flex;align-items:center;gap:10px;margin:4px 0 18px;}
.lg-div-line{flex:1;height:1px;background:var(--border);}
.lg-div-txt{font-size:10px;font-weight:600;color:var(--text-faint);letter-spacing:.07em;white-space:nowrap;}

/* ── FORM FIELD ── */
.lg-field{margin-bottom:16px;}
.lg-label{
  display:block;font-size:10px;font-weight:600;
  letter-spacing:.12em;text-transform:uppercase;
  color:var(--text-dim);margin-bottom:7px;transition:color .2s;
}
.lg-field.foc .lg-label{color:var(--teal);}

.lg-wrap{position:relative;}

.lg-icon-left{
  position:absolute;left:14px;top:50%;transform:translateY(-50%);
  color:var(--text-faint);pointer-events:none;display:flex;align-items:center;
  transition:color .2s;
}
.lg-field.foc .lg-icon-left{color:var(--teal);}

.lg-input{
  width:100%;background:var(--bg2);border:1.5px solid var(--border);border-radius:10px;
  padding:13px 42px 13px 42px;font-size:14px;
  font-family:'DM Sans',sans-serif;font-weight:400;color:var(--text);
  outline:none;-webkit-appearance:none;
  transition:border-color .2s,box-shadow .2s,background .2s;
  min-height:50px;
}
.lg-input::placeholder{color:var(--text-faint);}
.lg-input:focus{border-color:var(--teal);background:var(--surface);box-shadow:0 0 0 4px rgba(13,148,136,.1);}

.lg-icon-right{
  position:absolute;right:13px;top:50%;transform:translateY(-50%);
  color:var(--text-faint);background:none;border:none;padding:6px;cursor:pointer;
  display:flex;align-items:center;transition:color .2s;-webkit-tap-highlight-color:transparent;
}
.lg-icon-right:hover{color:var(--teal)!important;}
.lg-field.foc .lg-icon-right{color:var(--text-dim);}

/* ── ERROR ── */
.lg-err{
  background:var(--red-bg);border:1.5px solid rgba(220,38,38,.2);border-radius:10px;
  padding:11px 16px;font-size:13px;color:var(--red);text-align:center;
  font-weight:500;margin:2px 0 12px;animation:fadeUp .25s ease;
  display:flex;align-items:center;justify-content:center;gap:7px;
}

/* ── SUBMIT BUTTON — premium version ── */
.lg-submit{
  width:100%;margin-top:8px;
  border:none;border-radius:11px;cursor:pointer;
  font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;
  letter-spacing:.14em;text-transform:uppercase;color:#fff;
  display:flex;align-items:center;justify-content:center;gap:10px;
  transition:all .22s;-webkit-tap-highlight-color:transparent;
  min-height:52px;position:relative;overflow:hidden;
  background:linear-gradient(135deg,var(--teal-dark) 0%,var(--teal) 50%,#0ea5e9 100%);
  background-size:200% 100%;
  box-shadow:0 4px 20px rgba(13,148,136,.32),0 1px 0 rgba(255,255,255,.15) inset;
}
.lg-submit::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,var(--teal) 0%,#0ea5e9 100%);
  opacity:0;transition:opacity .22s;
}
.lg-submit:hover:not(:disabled)::before{opacity:1;}
.lg-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 28px rgba(13,148,136,.42);}
.lg-submit:active:not(:disabled){transform:translateY(0);box-shadow:none;}
.lg-submit:disabled{opacity:.4;cursor:not-allowed;transform:none!important;box-shadow:none;}

.lg-submit-inner{position:relative;z-index:1;display:flex;align-items:center;gap:10px;}

/* ── LOADING ANIMATION (premium 3-dot wave) ── */
.lg-loader{
  display:flex;align-items:center;gap:5px;
}
.lg-loader-dot{
  width:7px;height:7px;border-radius:50%;background:#fff;
  animation:dotBounce 1.2s ease-in-out infinite;
}
.lg-loader-dot:nth-child(1){animation-delay:0s;}
.lg-loader-dot:nth-child(2){animation-delay:.18s;}
.lg-loader-dot:nth-child(3){animation-delay:.36s;}

/* ── PROGRESS BAR under button ── */
.lg-progress{
  height:3px;border-radius:0 0 11px 11px;
  background:var(--teal-light);overflow:hidden;margin-top:0;
}
.lg-progress-bar{
  height:100%;
  background:linear-gradient(90deg,var(--teal),#34d399,var(--teal));
  background-size:200% 100%;
  animation:shimmer 1.4s linear infinite, loadBar 1.8s cubic-bezier(.25,.46,.45,.94) infinite;
  border-radius:0 0 11px 11px;
}

/* ── FOOTER ── */
.lg-foot{
  margin-top:22px;text-align:center;padding-top:18px;
  border-top:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;gap:8px;
}
.lg-foot-txt{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-faint);}
.lg-foot-dot{width:3px;height:3px;border-radius:50%;background:var(--border2);}

/* ── SUCCESS OVERLAY ── */
.lg-overlay{
  position:fixed;inset:0;z-index:9998;
  background:rgba(4,52,44,.94);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;
  animation:fadeIn .3s ease;padding:24px;
}
.lg-ov-ring{
  width:90px;height:90px;border-radius:50%;
  background:rgba(13,148,136,.2);border:2px solid rgba(13,148,136,.5);
  display:flex;align-items:center;justify-content:center;
  animation:successPop .6s cubic-bezier(.34,1.56,.64,1) both;
  position:relative;
}
.lg-ov-ring::before{
  content:'';position:absolute;inset:-8px;border-radius:50%;
  border:1.5px solid rgba(52,211,153,.25);
  animation:ripple 2s ease-out infinite;
}
.lg-ov-check{font-size:40px;animation:successPop .5s .1s ease both;}
.lg-ov-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#fff;text-align:center;animation:fadeUp .4s .15s ease both;}
.lg-ov-sub{font-size:14px;color:rgba(255,255,255,.55);animation:fadeUp .4s .25s ease both;}

/* ── MOBILE SAFE AREA ── */
@supports(padding:max(0px)){
  .lg-root{
    padding-top:max(20px,env(safe-area-inset-top));
    padding-bottom:max(20px,env(safe-area-inset-bottom));
    padding-left:max(16px,env(safe-area-inset-left));
    padding-right:max(16px,env(safe-area-inset-right));
  }
}
@media(max-width:440px){
  .lg-hero{padding:26px 22px 22px;}
  .lg-body{padding:20px 22px 24px;}
  .lg-title{font-size:24px;}
}
`;

/* ══════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════ */
export default function Login({ setLoggedIn }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [focused, setFocused] = useState(null);

  const [bioAvail, setBioAvail] = useState(false);
  const [bioReg, setBioReg] = useState(false);
  const [bioState, setBioState] = useState("idle");
  const [bioDesc, setBioDesc] = useState("");
  const [showOvlay, setShowOvlay] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [installTip, setInstallTip] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  useEffect(() => {
    if (isMobile) {
      checkBioAvailable().then(ok => { setBioAvail(ok); setBioReg(hasBioRegistered()); });
    }
    if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true) {
      setInstalled(true);
    }
    const onPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => { setInstalled(true); setDeferredPrompt(null); });
    const goOn = () => setOnline(true);
    const goOff = () => setOnline(false);
    window.addEventListener("online", goOn);
    window.addEventListener("offline", goOff);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("online", goOn);
      window.removeEventListener("offline", goOff);
    };
  }, []);

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

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !pass) { setErrMsg("Please enter your email and password."); return; }
    setErrMsg(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    setLoading(false);
    if (error) { setErrMsg(error.message); return; }
    setLoggedIn(true); navigate("/dashboard");
  }, [email, pass, navigate, setLoggedIn]);

  const handleBioAuth = async () => {
    setBioDesc(""); setBioState("scanning");
    const { ok, msg } = await bioAuthenticate();
    if (ok) {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setBioState("success"); setBioDesc("Verified!");
        setShowOvlay(true);
        setTimeout(() => { setLoggedIn(true); navigate("/dashboard"); }, 1600);
      } else {
        setBioState("error"); setBioDesc("Session expired. Sign in with email first.");
        setTimeout(() => { setBioState("idle"); setBioDesc(""); }, 3500);
      }
    } else {
      setBioState("error"); setBioDesc(msg || "Failed. Try again.");
      setTimeout(() => { setBioState("idle"); setBioDesc(""); }, 2500);
    }
  };

  const handleBioRegister = async () => {
    setBioDesc(""); setBioState("scanning");
    const { ok, msg } = await bioRegister();
    if (ok) {
      setBioReg(true); setBioState("success");
      setBioDesc("Fingerprint saved! Use it next time.");
      setTimeout(() => { setBioState("idle"); setBioDesc(""); }, 3000);
    } else {
      setBioState("error"); setBioDesc(msg || "Registration failed.");
      setTimeout(() => { setBioState("idle"); setBioDesc(""); }, 2500);
    }
  };

  const handleBioRemove = () => {
    localStorage.removeItem(BIO_KEY);
    setBioReg(false); setBioState("idle"); setBioDesc("");
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") { setInstalled(true); setDeferredPrompt(null); }
    } else {
      setInstallTip(true); setTimeout(() => setInstallTip(false), 5000);
    }
  };

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
    return "Register your fingerprint for faster login";
  };

  return (
    <>
      <style>{CSS}</style>

      {/* Success overlay */}
      {showOvlay && (
        <div className="lg-overlay">
          <div className="lg-ov-ring">
            <span className="lg-ov-check">✓</span>
          </div>
          <div className="lg-ov-title">Welcome back!</div>
          <div className="lg-ov-sub">Fingerprint verified · Opening dashboard…</div>
        </div>
      )}

      {/* Offline banner */}
      {!online && (
        <div className="lg-offline">
          <span>📡</span><span>No internet connection</span>
        </div>
      )}

      <div className="lg-root" style={{ paddingTop: !online ? 60 : undefined }}>
        {/* Animated background blobs */}
        <div className="lg-blob lg-blob-1" />
        <div className="lg-blob lg-blob-2" />
        <div className="lg-blob lg-blob-3" />

        <div className="lg-card">
          {/* Top shimmer strip */}
          <div className="lg-strip" />

          {/* ── HERO ── */}
          <div className="lg-hero">
            <div className="lg-hero-top">
              <div className="lg-orb">₹</div>
              <div className="lg-status">
                <div className="lg-status-dot" />
                Secure
              </div>
            </div>

            <div className="lg-eyebrow">Daily Income Track</div>
            <h1 className="lg-title">Welcome <em>Back</em></h1>
            <p className="lg-sub">Your personal finance manager — sign in to view your dashboard.</p>

            {/* Mini stats strip */}
            <div className="lg-stats">
              <div className="lg-stat">
                <div className="lg-stat-val">₹</div>
                <div className="lg-stat-lbl">Income</div>
              </div>
              <div className="lg-stat">
                <div className="lg-stat-val">📊</div>
                <div className="lg-stat-lbl">Reports</div>
              </div>
              <div className="lg-stat">
                <div className="lg-stat-val">⚡</div>
                <div className="lg-stat-lbl">Fast Entry</div>
              </div>
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="lg-body">

            {/* Install */}
            {!installed && (
              <>
                {installTip && (
                  <div className="lg-install-tip">
                    📱 <strong>iOS:</strong> Safari → Share → "Add to Home Screen"<br />
                    🤖 <strong>Android:</strong> Chrome menu → "Install App"
                  </div>
                )}
                <button className={`lg-install${installed ? " done" : ""}`} onClick={handleInstall}>
                  <IconDownload />
                  {installed ? "✓ App Installed" : "📲 Install App on Device"}
                </button>
              </>
            )}

            {/* Biometric */}
            {isMobile && bioAvail && (
              <>
                <div className={`lg-bio${bioState !== "idle" ? ` state-${bioState}` : ""}`}>
                  <div className="lg-fp-wrap">
                    {bioState === "scanning" && (
                      <>
                        <div className="lg-fp-ripple" />
                        <div className="lg-fp-ripple" />
                        <div className="lg-fp-ripple" />
                      </>
                    )}
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
                  </div>
                  <div className="lg-bio-title">{fpTitle()}</div>
                  <div className={`lg-bio-desc${bioState === "success" ? " ok" : bioState === "error" ? " err" : ""}`}>
                    {fpDesc()}
                  </div>
                  <div className="lg-bio-links">
                    {bioReg ? (
                      <>
                        <span className="lg-bio-text">Not your device?</span>
                        <button className="lg-bio-act danger" onClick={handleBioRemove}>Remove fingerprint</button>
                      </>
                    ) : (
                      <>
                        <span className="lg-bio-text">Already set up?</span>
                        <button className="lg-bio-act" onClick={handleBioAuth}>Authenticate</button>
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

            {/* Email */}
            <div className={`lg-field${focused === "email" ? " foc" : ""}`}>
              <label className="lg-label">Email Address</label>
              <div className="lg-wrap">
                <span className="lg-icon-left"><IconMail /></span>
                <input
                  className="lg-input"
                  type="email" inputMode="email" autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            {/* Password */}
            <div className={`lg-field${focused === "pass" ? " foc" : ""}`}>
              <label className="lg-label">Password</label>
              <div className="lg-wrap">
                <span className="lg-icon-left"><IconLock /></span>
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
                <button className="lg-icon-right" type="button" tabIndex={-1} onClick={() => setShowPwd(p => !p)}>
                  <IconEye show={showPwd} />
                </button>
              </div>
            </div>

            {errMsg && (
              <div className="lg-err">
                <span>⚠</span>
                <span>{errMsg}</span>
              </div>
            )}

            {/* Submit + progress bar */}
            <button className="lg-submit" onClick={handleLogin} disabled={loading}>
              <span className="lg-submit-inner">
                {loading ? (
                  <>
                    <div className="lg-loader">
                      <div className="lg-loader-dot" />
                      <div className="lg-loader-dot" />
                      <div className="lg-loader-dot" />
                    </div>
                    <span>Signing in</span>
                  </>
                ) : "Sign In →"}
              </span>
            </button>
            {loading && (
              <div className="lg-progress">
                <div className="lg-progress-bar" />
              </div>
            )}

            {/* Footer */}
            <div className="lg-foot">
              <span className="lg-foot-txt">© 2026 Daily Income Track</span>
              <div className="lg-foot-dot" />
              <span className="lg-foot-txt">Secured</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* Lock icon (used in password field) */
function IconLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}