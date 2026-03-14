import React, { useEffect, useState } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,500&family=Manrope:wght@300;400;500;600;700&display=swap');

  @keyframes sp-fadein {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes sp-riseup {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sp-scalein {
    0%   { opacity: 0; transform: scale(0.75); }
    65%  { transform: scale(1.05); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes sp-shimmer {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
  }
  @keyframes sp-progress {
    from { width: 0%; }
    to   { width: 88%; }
  }
  @keyframes sp-dot {
    0%, 100% { opacity: 0.2; transform: scale(0.7); }
    50%       { opacity: 1;   transform: scale(1); }
  }
  @keyframes sp-breathe {
    0%, 100% { box-shadow: 0 16px 48px rgba(5,150,105,0.22), 0 4px 16px rgba(0,0,0,0.10); }
    50%       { box-shadow: 0 22px 64px rgba(5,150,105,0.32), 0 6px 22px rgba(0,0,0,0.13); }
  }
  @keyframes sp-lineexpand {
    from { width: 0; opacity: 0; }
    to   { width: 44px; opacity: 1; }
  }
  @keyframes sp-pillpop {
    0%   { opacity: 0; transform: scale(0.82) translateY(8px); }
    70%  { transform: scale(1.04); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes sp-countup {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes sp-dividerslide {
    from { opacity: 0; transform: scaleX(0); }
    to   { opacity: 1; transform: scaleX(1); }
  }

  /* ── ROOT ── */
  .sp-root {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f5f0e8;
    overflow: hidden;
    animation: sp-fadein 0.45s ease both;
  }

  /* Warm bg texture */
  .sp-root::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 70% 55% at 15% 15%, rgba(5,150,105,0.07) 0%, transparent 65%),
      radial-gradient(ellipse 55% 45% at 88% 85%, rgba(245,158,11,0.06) 0%, transparent 60%),
      radial-gradient(ellipse 40% 40% at 70% 10%, rgba(5,150,105,0.04) 0%, transparent 55%);
    pointer-events: none;
  }
  .sp-root::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(5,150,105,0.07) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
    opacity: 0.45;
  }

  /* ── CARD ── */
  .sp-card {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: min(380px, 92vw);
    background: #ffffff;
    border-radius: 28px;
    overflow: hidden;
    box-shadow:
      0 2px 4px rgba(0,0,0,0.04),
      0 16px 48px rgba(0,0,0,0.10),
      0 0 0 1px rgba(0,0,0,0.04);
    animation: sp-fadein 0.5s 0.1s ease both;
  }

  /* ── CARD TOP BAND ── */
  .sp-card-top {
    width: 100%;
    padding: 36px 32px 28px;
    background: linear-gradient(160deg, #064e3b 0%, #065f46 55%, #047857 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden;
  }

  /* subtle diagonal lines on top band */
  .sp-card-top::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      -55deg,
      rgba(255,255,255,0.025) 0px,
      rgba(255,255,255,0.025) 1px,
      transparent 1px,
      transparent 28px
    );
    pointer-events: none;
  }

  /* arc shape at bottom of band */
  .sp-card-top::after {
    content: '';
    position: absolute;
    bottom: -24px; left: -5%; right: -5%;
    height: 48px;
    background: #ffffff;
    border-radius: 50% 50% 0 0 / 100% 100% 0 0;
  }

  /* ── ICON ── */
  .sp-icon-wrap {
    width: 80px; height: 80px;
    border-radius: 22px;
    background: rgba(255,255,255,0.12);
    border: 1.5px solid rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 18px;
    position: relative; z-index: 1;
    animation: sp-scalein 0.6s 0.2s cubic-bezier(0.34,1.4,0.64,1) both;
    backdrop-filter: blur(6px);
  }
  .sp-icon-wrap::before {
    content: '';
    position: absolute;
    top: 6px; left: 6px; right: 35%; bottom: 35%;
    background: rgba(255,255,255,0.12);
    border-radius: 8px;
  }
  .sp-icon-symbol {
    font-family: 'Playfair Display', serif;
    font-size: 34px; font-weight: 700;
    color: #ffffff; line-height: 1;
    position: relative; z-index: 1;
  }

  /* ── APP NAME on band ── */
  .sp-app-name {
    font-family: 'Playfair Display', serif;
    font-size: 22px; font-weight: 700;
    color: #ffffff; letter-spacing: -0.01em;
    line-height: 1.2; text-align: center;
    position: relative; z-index: 1;
    animation: sp-riseup 0.5s 0.32s ease both;
    margin-bottom: 4px;
  }
  .sp-app-name em { font-style: italic; color: #6ee7b7; }

  .sp-app-sub {
    font-family: 'Manrope', sans-serif;
    font-size: 11px; font-weight: 500;
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.12em; text-transform: uppercase;
    position: relative; z-index: 1;
    animation: sp-riseup 0.5s 0.42s ease both;
  }

  /* ── CARD BODY ── */
  .sp-card-body {
    width: 100%;
    padding: 32px 28px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  /* ── MINI STAT STRIP ── */
  .sp-stats-strip {
    display: grid;
    grid-template-columns: 1fr 1px 1fr 1px 1fr;
    width: 100%;
    background: #f9fafb;
    border: 1px solid #f0f0f0;
    border-radius: 16px;
    padding: 14px 8px;
    margin-bottom: 20px;
    animation: sp-riseup 0.5s 0.5s ease both;
  }
  .sp-stat-item {
    display: flex; flex-direction: column;
    align-items: center; gap: 3px;
    padding: 0 6px;
  }
  .sp-stat-icon {
    font-size: 15px; line-height: 1;
    margin-bottom: 2px;
  }
  .sp-stat-label {
    font-family: 'Manrope', sans-serif;
    font-size: 9px; font-weight: 600;
    color: #9ca3af; letter-spacing: 0.09em;
    text-transform: uppercase;
  }
  .sp-stat-val {
    font-family: 'Manrope', sans-serif;
    font-size: 12px; font-weight: 700;
    color: #111827;
    animation: sp-countup 0.5s 0.8s ease both;
    opacity: 0;
    animation-fill-mode: both;
  }
  .sp-stat-val.green { color: #059669; }
  .sp-stat-val.red   { color: #dc2626; }
  .sp-stat-divider {
    width: 1px; background: #e5e7eb; align-self: stretch;
  }

  /* ── FEATURE PILLS ── */
  .sp-features {
    display: flex; flex-wrap: wrap;
    gap: 8px; justify-content: center;
    width: 100%;
    margin-bottom: 24px;
    animation: sp-riseup 0.5s 0.58s ease both;
  }
  .sp-pill {
    display: flex; align-items: center; gap: 5px;
    background: #f3faf7;
    border: 1px solid #d1fae5;
    border-radius: 20px;
    padding: 5px 12px;
    font-family: 'Manrope', sans-serif;
    font-size: 11px; font-weight: 600;
    color: #065f46;
    animation: sp-pillpop 0.45s ease both;
  }
  .sp-pill:nth-child(1){ animation-delay: 0.62s; }
  .sp-pill:nth-child(2){ animation-delay: 0.70s; }
  .sp-pill:nth-child(3){ animation-delay: 0.78s; }
  .sp-pill:nth-child(4){ animation-delay: 0.86s; }
  .sp-pill-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #10b981; flex-shrink: 0;
  }

  /* ── DIVIDER ── */
  .sp-divider {
    width: 100%; height: 1px;
    background: #f3f4f6;
    transform-origin: left;
    animation: sp-dividerslide 0.5s 0.9s ease both;
    margin-bottom: 18px;
  }

  /* ── PROGRESS ── */
  .sp-progress-wrap {
    width: 100%;
    animation: sp-riseup 0.5s 0.95s ease both;
    margin-bottom: 12px;
  }
  .sp-progress-track {
    width: 100%; height: 4px;
    background: #f3f4f6; border-radius: 99px; overflow: hidden;
  }
  .sp-progress-fill {
    height: 100%; border-radius: 99px;
    background: linear-gradient(90deg, #059669 0%, #34d399 40%, #10b981 70%, #059669 100%);
    background-size: 200% auto;
    animation:
      sp-progress 2.8s cubic-bezier(0.4,0,0.2,1) forwards,
      sp-shimmer 1.8s linear infinite;
  }

  /* ── STATUS ── */
  .sp-status-row {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%;
    animation: sp-riseup 0.5s 1s ease both;
  }
  .sp-status-text {
    font-family: 'Manrope', sans-serif;
    font-size: 11px; font-weight: 500;
    color: #d1d5db; letter-spacing: 0.05em;
  }
  .sp-dots { display: flex; align-items: center; gap: 4px; }
  .sp-dot {
    width: 4px; height: 4px; border-radius: 50%;
    background: #10b981;
    animation: sp-dot 1.2s ease-in-out infinite;
  }
  .sp-dot:nth-child(1){ animation-delay: 0s; }
  .sp-dot:nth-child(2){ animation-delay: 0.2s; }
  .sp-dot:nth-child(3){ animation-delay: 0.4s; }

  /* ── FOOTER ── */
  .sp-footer {
    position: absolute; bottom: 24px;
    display: flex; align-items: center; gap: 10px;
    z-index: 1;
    animation: sp-fadein 0.6s 1.1s ease both;
  }
  .sp-footer-line {
    width: 32px; height: 1px;
    background: rgba(0,0,0,0.12); border-radius: 2px;
  }
  .sp-footer-text {
    font-family: 'Manrope', sans-serif;
    font-size: 10px; font-weight: 500;
    color: rgba(0,0,0,0.25); letter-spacing: 0.1em;
  }
`;

const STATUSES = ["Loading your data", "Fetching records", "Almost ready"];

const FEATURES = [
    { icon: "💰", label: "Income Track" },
    { icon: "💸", label: "Expenses" },
    { icon: "📊", label: "Analytics" },
    { icon: "📋", label: "Reports" },
];

export default function SplashScreen() {
    const [statusIdx, setStatusIdx] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setStatusIdx(i => (i + 1) % STATUSES.length), 950);
        return () => clearInterval(t);
    }, []);

    return (
        <>
            <style>{STYLES}</style>
            <div className="sp-root">

                <div className="sp-card">

                    {/* ── TOP BAND ── */}
                    <div className="sp-card-top">
                        <div className="sp-icon-wrap">
                            <span className="sp-icon-symbol">₹</span>
                        </div>
                        <h1 className="sp-app-name">Daily <em>Income</em> Tracking</h1>
                        <p className="sp-app-sub">Finance Manager</p>
                    </div>

                    {/* ── BODY ── */}
                    <div className="sp-card-body">

                        {/* Mini stat strip */}
                        <div className="sp-stats-strip">
                            <div className="sp-stat-item">
                                <span className="sp-stat-icon">📈</span>
                                <span className="sp-stat-label">Income</span>
                                <span className="sp-stat-val green">Track</span>
                            </div>
                            <div className="sp-stat-divider" />
                            <div className="sp-stat-item">
                                <span className="sp-stat-icon">📉</span>
                                <span className="sp-stat-label">Expense</span>
                                <span className="sp-stat-val red">Monitor</span>
                            </div>
                            <div className="sp-stat-divider" />
                            <div className="sp-stat-item">
                                <span className="sp-stat-icon">🧾</span>
                                <span className="sp-stat-label">Balance</span>
                                <span className="sp-stat-val">Daily</span>
                            </div>
                        </div>

                        {/* Feature pills */}
                        <div className="sp-features">
                            {FEATURES.map((f, i) => (
                                <div className="sp-pill" key={i}>
                                    <span className="sp-pill-dot" />
                                    {f.icon} {f.label}
                                </div>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="sp-divider" />

                        {/* Progress */}
                        <div className="sp-progress-wrap">
                            <div className="sp-progress-track">
                                <div className="sp-progress-fill" />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="sp-status-row">
                            <span className="sp-status-text">{STATUSES[statusIdx]}…</span>
                            <div className="sp-dots">
                                <div className="sp-dot" />
                                <div className="sp-dot" />
                                <div className="sp-dot" />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="sp-footer">
                    <div className="sp-footer-line" />
                    <span className="sp-footer-text">Abdul Jeelani · Finance</span>
                    <div className="sp-footer-line" />
                </div>

            </div>
        </>
    );
}