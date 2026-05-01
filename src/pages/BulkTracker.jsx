import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

// ─── SUPABASE MIGRATION NOTE ────────────────────────────────────────────────
// Run this SQL in your Supabase dashboard (SQL Editor) before using this file:
//
//   ALTER TABLE bulk_income
//     ADD COLUMN IF NOT EXISTS is_settled BOOLEAN NOT NULL DEFAULT false,
//     ADD COLUMN IF NOT EXISTS settled_at TEXT;
//
// ────────────────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
:root {
  --bg:#f5f2ed; --bg2:#ede9e2; --surface:#ffffff; --surface2:#faf8f5;
  --border:#e2dcd4; --border2:#d0c9be;
  --text:#1c1a17; --text-med:#5a5449; --text-dim:#9a9187; --text-faint:#c4bdb4;
  --teal:#0d9488; --green:#16a34a; --green-bg:#dcfce7;
  --red:#dc2626; --red-bg:#fee2e2; --amber:#b45309; --amber-bg:#fef3c7;
  --purple:#7c3aed; --purple-bg:#ede9fe;
  --orange:#ea580c; --orange-bg:#fff7ed;
  --shadow-sm:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);
  --shadow:0 4px 16px rgba(0,0,0,.07),0 1px 4px rgba(0,0,0,.04);

  /* ── SETTLED CARD – LIGHT MODE ── */
  --settled-card-bg: #ffffff;
  --settled-card-border: rgba(22,163,74,.30);
  --settled-card-shadow: 0 2px 10px rgba(22,163,74,.10), 0 1px 3px rgba(0,0,0,.05);
  --settled-card-hover-shadow: 0 6px 22px rgba(22,163,74,.16);

  --settled-name-color: #14532d;
  --settled-meta-color: #166534;
  --settled-meta-date-color: #15803d;

  --settled-remaining-label: #166534;
  --settled-remaining-val-zero: #6b7280;

  --settled-collapsed-bg: #ffffff;
  --settled-collapsed-hover-bg: #f0fdf4;

  --settled-accordion-bg: #f0fdf4;
  --settled-accordion-border: rgba(22,163,74,.35);
  --settled-accordion-hover-bg: #dcfce7;
  --settled-accordion-open-bg: #dcfce7;
  --settled-accordion-title-color: #14532d;
  --settled-accordion-sub-color: #166534;

  --settled-body-bg: #f8fffe;
  --settled-body-border: rgba(22,163,74,.28);

  --settled-amounts-bg: #fafffe;
  --settled-amounts-border: rgba(22,163,74,.18);

  --settled-view-bg: #d1fae5;
  --settled-view-color: #15803d;
  --settled-view-border: rgba(22,163,74,.35);
  --settled-view-hover-bg: #16a34a;
  --settled-view-hover-color: #ffffff;

  --settled-lock-color: #16a34a;
  --settled-badge-bg: #16a34a;
  --settled-badge-color: #ffffff;

  --settled-banner-bg: #f0fdf4;
  --settled-banner-border: rgba(22,163,74,.20);
  --settled-banner-color: #15803d;

  --settled-progress-track: rgba(22,163,74,.12);
  --settled-progress-fill: #16a34a;

  --settled-history-btn-color: #15803d;
  --settled-history-badge-bg: #d1fae5;
  --settled-history-badge-border: rgba(22,163,74,.3);
  --settled-history-badge-color: #15803d;

  --settled-amt-label-color: #166534;
  --settled-amt-received-color: #16a34a;
  --settled-amt-spent-color: #dc2626;
  --settled-amt-remaining-zero: #9ca3af;

  --settled-date-chip-bg: #dcfce7;
  --settled-date-chip-color: #15803d;
  --settled-date-chip-border: rgba(22,163,74,.25);

  --settled-added-chip-bg: #f0fdf4;
  --settled-added-chip-color: #4b7c5a;
  --settled-added-chip-border: rgba(22,163,74,.18);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg:#18181b; --bg2:#27272a; --surface:#1f1f23; --surface2:#27272a;
    --border:#3f3f46; --border2:#52525b;
    --text:#f4f4f5; --text-med:#a1a1aa; --text-dim:#71717a; --text-faint:#52525b;
    --teal:#2dd4bf; --green:#4ade80; --green-bg:rgba(74,222,128,.12);
    --red:#f87171; --red-bg:rgba(248,113,113,.12);
    --amber:#fbbf24; --amber-bg:rgba(251,191,36,.12);
    --purple:#a78bfa; --purple-bg:rgba(167,139,250,.12);
    --orange:#fb923c; --orange-bg:rgba(251,146,60,.12);

    /* ── SETTLED CARD – DARK MODE ── */
    --settled-card-bg: #0f1f15;
    --settled-card-border: rgba(74,222,128,.22);
    --settled-card-shadow: 0 2px 12px rgba(0,0,0,.45), 0 0 0 1px rgba(74,222,128,.08);
    --settled-card-hover-shadow: 0 6px 24px rgba(0,0,0,.55), 0 0 0 1px rgba(74,222,128,.18);

    /* ✅ FIX: Bright readable colors for dark mode settled names */
    --settled-name-color: #bbf7d0;
    --settled-meta-color: #86efac;
    --settled-meta-date-color: #6ee7b7;

    --settled-remaining-label: #86efac;
    --settled-remaining-val-zero: #6b7280;

    --settled-collapsed-bg: #0f1f15;
    --settled-collapsed-hover-bg: #162d1e;

    --settled-accordion-bg: rgba(74,222,128,.10);
    --settled-accordion-border: rgba(74,222,128,.30);
    --settled-accordion-hover-bg: rgba(74,222,128,.16);
    --settled-accordion-open-bg: rgba(74,222,128,.16);
    /* ✅ FIX: Accordion header title & sub text bright in dark mode */
    --settled-accordion-title-color: #bbf7d0;
    --settled-accordion-sub-color: #86efac;

    --settled-body-bg: rgba(74,222,128,.04);
    --settled-body-border: rgba(74,222,128,.18);

    --settled-amounts-bg: rgba(74,222,128,.06);
    --settled-amounts-border: rgba(74,222,128,.12);

    --settled-view-bg: rgba(74,222,128,.14);
    --settled-view-color: #86efac;
    --settled-view-border: rgba(74,222,128,.28);
    --settled-view-hover-bg: #4ade80;
    --settled-view-hover-color: #0f1f15;

    --settled-lock-color: #4ade80;
    --settled-badge-bg: rgba(74,222,128,.20);
    --settled-badge-color: #bbf7d0;

    --settled-banner-bg: rgba(74,222,128,.08);
    --settled-banner-border: rgba(74,222,128,.18);
    --settled-banner-color: #86efac;

    --settled-progress-track: rgba(74,222,128,.10);
    --settled-progress-fill: #4ade80;

    --settled-history-btn-color: #86efac;
    --settled-history-badge-bg: rgba(74,222,128,.14);
    --settled-history-badge-border: rgba(74,222,128,.25);
    --settled-history-badge-color: #86efac;

    --settled-amt-label-color: #86efac;
    --settled-amt-received-color: #4ade80;
    --settled-amt-spent-color: #f87171;
    --settled-amt-remaining-zero: #71717a;

    --settled-date-chip-bg: rgba(74,222,128,.14);
    --settled-date-chip-color: #86efac;
    --settled-date-chip-border: rgba(74,222,128,.22);

    --settled-added-chip-bg: rgba(74,222,128,.07);
    --settled-added-chip-color: #6ee7b7;
    --settled-added-chip-border: rgba(74,222,128,.14);
  }
}

*{box-sizing:border-box;margin:0;padding:0;}
.bt-root{min-height:100vh;background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--text);padding-bottom:80px;}
.bt-header{background:var(--surface);border-bottom:1px solid var(--border);padding:36px 0 28px;margin-bottom:36px;box-shadow:var(--shadow-sm);}
.bt-header-inner{max-width:1200px;margin:auto;padding:0 32px;display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:16px;}
.bt-eyebrow{font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);margin-bottom:6px;display:flex;align-items:center;gap:8px;}
.bt-eyebrow::before{content:'';display:inline-block;width:20px;height:2px;background:var(--teal);border-radius:2px;}
.bt-title{font-family:'Playfair Display',serif;font-size:clamp(24px,3vw,36px);font-weight:900;line-height:1.08;color:var(--text);}
.bt-title em{font-style:italic;color:var(--teal);}
.bt-wrap{max-width:1200px;margin:auto;padding:0 32px;}
@media(max-width:600px){.bt-wrap,.bt-header-inner{padding:0 16px;}}
.section-title{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;color:var(--text);margin-bottom:18px;display:flex;align-items:center;gap:12px;}
.section-title::after{content:'';flex:1;height:1.5px;background:var(--border);border-radius:2px;}
.add-form-card{background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:28px 32px;margin-bottom:36px;box-shadow:var(--shadow-sm);}
.add-form-grid{display:grid;grid-template-columns:1fr 1fr 180px auto;gap:14px;align-items:flex-end;}
@media(max-width:800px){.add-form-grid{grid-template-columns:1fr 1fr;}}
@media(max-width:500px){.add-form-grid{grid-template-columns:1fr;}}
.field-wrap{display:flex;flex-direction:column;gap:6px;}
.field-label{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-med);}
.bt-input{width:100%;background:var(--bg2);border:1.5px solid var(--border);border-radius:8px;padding:10px 14px;font-size:14px;font-family:'DM Sans',sans-serif;color:var(--text);outline:none;transition:border-color .2s,background .2s,box-shadow .2s;appearance:none;}
.bt-input::placeholder{color:var(--text-faint);}
.bt-input:focus{border-color:var(--teal);background:var(--surface);box-shadow:0 0 0 3px rgba(13,148,136,.1);}
.bt-input:disabled{opacity:.4;cursor:not-allowed;}
.btn{padding:11px 22px;border:none;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:opacity .2s,transform .15s,box-shadow .15s;white-space:nowrap;}
.btn:hover{opacity:.88;transform:translateY(-1px);box-shadow:var(--shadow);}
.btn:active{transform:translateY(0);}
.btn-green{background:var(--green);color:#fff;} .btn-red{background:var(--red);color:#fff;}
.btn-teal{background:var(--teal);color:#fff;} .btn-purple{background:var(--purple);color:#fff;}
.btn-orange{background:var(--orange);color:#fff;}
.btn-ghost{background:var(--bg2);color:var(--text-med);border:1.5px solid var(--border);}
.btn-sm{padding:9px 20px;font-size:12px;}
.summary-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:36px;}
@media(max-width:700px){.summary-row{grid-template-columns:1fr;}}
.sum-card{background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:22px 24px;box-shadow:var(--shadow-sm);position:relative;overflow:hidden;}
.sum-accent{position:absolute;top:0;left:0;right:0;height:3px;border-radius:14px 14px 0 0;}
.sum-label{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px;}
.sum-value{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;}
.sum-value.green{color:var(--green);}.sum-value.red{color:var(--red);}.sum-value.teal{color:var(--teal);}
.persons-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px;margin-bottom:0;}

/* ─── ACTIVE PERSON CARD ─── */
.person-card{background:var(--surface);border:1.5px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-sm);transition:box-shadow .2s,transform .2s;}
.person-card:hover{box-shadow:var(--shadow);transform:translateY(-2px);}
.person-card.selected-card{border-color:var(--purple);box-shadow:0 0 0 3px rgba(124,58,237,.15),var(--shadow);}
.person-card-header{padding:16px 18px;border-bottom:1.5px solid var(--border);display:flex;align-items:center;gap:10px;}
.person-avatar{width:38px;height:38px;border-radius:50%;color:#fff;font-family:'Playfair Display',serif;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.person-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:var(--text);flex:1;line-height:1.2;}
.person-date{font-size:11px;color:var(--text-faint);margin-top:2px;}

/* ── ACTIVE CARD DATE CHIP ── */
.active-date-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;background:var(--bg2);border:1px solid var(--border);font-size:10px;font-weight:600;color:var(--text-dim);margin-top:3px;}
.active-date-chip-icon{font-size:9px;}

.select-checkbox{width:22px;height:22px;border-radius:7px;border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;flex-shrink:0;background:var(--bg2);}
.select-checkbox.checked{background:var(--purple);border-color:var(--purple);}
.select-checkbox svg{display:none;}.select-checkbox.checked svg{display:block;}
.person-amounts{display:grid;grid-template-columns:repeat(3,1fr);padding:12px 18px;gap:8px;border-bottom:1.5px solid var(--border);background:var(--surface2);}
.progress-bar-wrap{padding:10px 18px 0;}
.progress-track-active{height:5px;background:var(--bg2);border-radius:99px;overflow:hidden;border:1px solid var(--border);}
.add-expense-section{padding:10px 18px;border-bottom:1.5px solid var(--border);}
.add-expense-toggle{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--teal);cursor:pointer;padding:6px 0;user-select:none;transition:opacity .15s;}
.add-expense-toggle:hover{opacity:.75;}
.toggle-arrow{font-size:10px;transition:transform .2s;}.toggle-arrow.open{transform:rotate(180deg);}
.add-exp-form{display:flex;flex-direction:column;gap:10px;margin-top:12px;padding:14px 16px;background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;}
.add-exp-save-row{display:flex;justify-content:flex-end;gap:8px;margin-top:4px;}
.edit-income-form{padding:16px 18px;border-top:1.5px solid var(--border);background:var(--surface2);display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:flex-end;}
.edit-income-form .edit-name-field{grid-column:1/-1;}
.edit-income-form .edit-btns-row{grid-column:1/-1;display:flex;gap:8px;}
@media(max-width:380px){.edit-income-form{grid-template-columns:1fr;}}
.exp-history-btn{display:flex;align-items:center;gap:6px;padding:8px 18px 12px;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--text-dim);cursor:pointer;background:none;border:none;font-family:'DM Sans',sans-serif;transition:color .15s;width:100%;}
.exp-history-btn:hover{color:var(--text);}
.exp-history-btn .badge-count{background:var(--bg2);border:1px solid var(--border);border-radius:20px;padding:1px 8px;font-size:10px;color:var(--text-dim);margin-left:2px;}
.del-btn{background:none;border:none;cursor:pointer;padding:5px;border-radius:6px;color:var(--text-faint);transition:all .15s;display:inline-flex;flex-shrink:0;}
.del-btn:hover{color:var(--red);background:var(--red-bg);}
.edit-btn{background:none;border:none;cursor:pointer;padding:5px;border-radius:6px;color:var(--text-faint);transition:all .15s;display:inline-flex;flex-shrink:0;}
.edit-btn:hover{color:var(--amber);background:var(--amber-bg);}
.settle-btn{display:flex;align-items:center;gap:6px;padding:8px 18px;border-radius:8px;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;background:var(--green-bg);color:var(--green);border:1.5px solid rgba(22,163,74,0.3);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;white-space:nowrap;}
.settle-btn:hover{background:var(--green);color:#fff;border-color:var(--green);transform:translateY(-1px);}
.amt-block{text-align:center;}
.amt-label{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-faint);margin-bottom:4px;}
.amt-value{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;}
.amt-value.green{color:var(--green);}.amt-value.red{color:var(--red);}.amt-value.teal{color:var(--teal);}.amt-value.zero{color:var(--text-faint);}
.shared-cut-note{font-size:9px;color:var(--purple);font-family:'DM Sans',sans-serif;font-weight:600;margin-top:2px;}
.progress-label-row{display:flex;justify-content:space-between;font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim);margin-bottom:5px;}
.progress-fill{height:100%;border-radius:99px;transition:width .6s ease;}
.badge{display:inline-block;padding:2px 9px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:.05em;}
.badge-settled{background:var(--green-bg);color:var(--green);}
.badge-partial{background:var(--amber-bg);color:var(--amber);}
.badge-pending{background:var(--red-bg);color:var(--red);}

/* ════════════════════════════════════════════════════
   SETTLED SECTION ACCORDION
   ════════════════════════════════════════════════════ */
.settled-section-wrap{margin:24px 0 28px;}
.settled-accordion-header{display:flex;align-items:center;gap:14px;padding:16px 22px;background:var(--settled-accordion-bg);border:1.5px solid var(--settled-accordion-border);border-radius:14px;cursor:pointer;user-select:none;transition:background .18s,border-color .18s,border-radius .18s;box-shadow:var(--shadow-sm);}
.settled-accordion-header:hover{background:var(--settled-accordion-hover-bg);}
.settled-accordion-header.is-open{border-radius:14px 14px 0 0;border-bottom-color:transparent;background:var(--settled-accordion-open-bg);}
.sah-lock{font-size:20px;flex-shrink:0;color:var(--settled-lock-color);}
.sah-info{flex:1;min-width:0;}
/* ✅ FIX: Use CSS variables so dark mode shows bright text */
.sah-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--settled-accordion-title-color);}
.sah-sub{font-size:12px;color:var(--settled-accordion-sub-color);margin-top:2px;letter-spacing:0;font-weight:400;}
.sah-badge{background:var(--settled-badge-bg);color:var(--settled-badge-color);border-radius:20px;padding:5px 16px;font-size:13px;font-weight:700;flex-shrink:0;border:1.5px solid var(--settled-accordion-border);}
.sah-arrow{font-size:13px;color:var(--settled-lock-color);flex-shrink:0;transition:transform .25s cubic-bezier(.4,0,.2,1);}
.sah-arrow.open{transform:rotate(180deg);}
.settled-accordion-body{border:1.5px solid var(--settled-body-border);border-top:none;border-radius:0 0 14px 14px;background:var(--settled-body-bg);padding:20px;animation:accordionDown .22s ease;}
@keyframes accordionDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}

/* ════════════════════════════════════════════════════
   SETTLED PERSON CARD
   ════════════════════════════════════════════════════ */
.settled-card{
  background:var(--settled-card-bg) !important;
  border:1.5px solid var(--settled-card-border) !important;
  box-shadow:var(--settled-card-shadow) !important;
}
.settled-card:hover{
  transform:translateY(-2px) !important;
  box-shadow:var(--settled-card-hover-shadow) !important;
}
.settled-collapsed{
  display:flex;align-items:center;padding:14px 18px;gap:12px;flex-wrap:wrap;
  cursor:pointer;transition:background .15s;border-radius:14px;
  background:var(--settled-collapsed-bg);
}
.settled-collapsed:hover{background:var(--settled-collapsed-hover-bg);}

.settled-lock-icon{font-size:16px;flex-shrink:0;color:var(--settled-lock-color);}
.settled-person-info{flex:1;min-width:0;}
/* ✅ FIX: Bright name in dark mode via CSS variable */
.settled-person-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:var(--settled-name-color);}
.settled-person-meta{font-size:11px;color:var(--settled-meta-color);margin-top:3px;font-weight:500;display:flex;flex-wrap:wrap;gap:6px;align-items:center;}

/* Date chips inside settled card */
.settled-date-chip{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;background:var(--settled-date-chip-bg);border:1px solid var(--settled-date-chip-border);font-size:10px;font-weight:600;color:var(--settled-date-chip-color);white-space:nowrap;}
.settled-added-chip{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;background:var(--settled-added-chip-bg);border:1px solid var(--settled-added-chip-border);font-size:10px;font-weight:600;color:var(--settled-added-chip-color);white-space:nowrap;}

.settled-remaining-mini{text-align:right;flex-shrink:0;}
.settled-remaining-label{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--settled-remaining-label);margin-bottom:3px;}
.settled-remaining-val{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;}

.settled-expand-hint{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--settled-view-color);display:flex;align-items:center;gap:5px;flex-shrink:0;padding:6px 14px;border-radius:20px;background:var(--settled-view-bg);border:1.5px solid var(--settled-view-border);transition:all .15s;}
.settled-expand-hint:hover{background:var(--settled-view-hover-bg);color:var(--settled-view-hover-color);}
.settled-expand-arrow{font-size:9px;transition:transform .2s;}
.settled-expand-arrow.open{transform:rotate(180deg);}

.settled-expanded-body{border-top:1.5px solid var(--settled-card-border);}

.settled-readonly-banner{
  display:flex;align-items:center;gap:8px;padding:10px 18px;
  background:var(--settled-banner-bg);
  border-bottom:1px solid var(--settled-banner-border);
  font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  color:var(--settled-banner-color);flex-wrap:wrap;gap:6px;
}
.settled-unsettle-btn{margin-left:auto;padding:5px 14px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;background:var(--red-bg);color:var(--red);border:1.5px solid rgba(220,38,38,.25);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;}
.settled-unsettle-btn:hover{background:var(--red);color:#fff;}

.readonly-amounts{
  display:grid;grid-template-columns:repeat(3,1fr);
  padding:14px 18px;gap:8px;
  border-bottom:1.5px solid var(--settled-card-border);
  background:var(--settled-amounts-bg);
}
.readonly-amounts .amt-label{color:var(--settled-amt-label-color) !important;}
.readonly-amounts .amt-value.green{color:var(--settled-amt-received-color) !important;}
.readonly-amounts .amt-value.red{color:var(--settled-amt-spent-color) !important;}
.readonly-amounts .amt-value.zero{color:var(--settled-amt-remaining-zero) !important;}

.readonly-progress{padding:10px 18px 12px;}
.readonly-progress .progress-label-row{color:var(--settled-remaining-label) !important;}
.progress-track{height:5px;background:var(--settled-progress-track);border-radius:99px;overflow:hidden;}
.progress-track .progress-fill{background:var(--settled-progress-fill) !important;}

.readonly-history-btn{
  display:flex;align-items:center;gap:6px;padding:10px 18px 14px;
  font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:var(--settled-history-btn-color);cursor:pointer;background:none;border:none;
  font-family:'DM Sans',sans-serif;transition:opacity .15s;width:100%;
}
.readonly-history-btn:hover{opacity:.75;}
.readonly-badge-count{
  background:var(--settled-history-badge-bg);
  border:1px solid var(--settled-history-badge-border);
  border-radius:20px;padding:1px 8px;font-size:10px;
  color:var(--settled-history-badge-color);margin-left:2px;
}

/* ── SETTLED EDIT INCOME FORM ── */
.settled-edit-income-form{
  padding:16px 18px;border-top:1.5px solid var(--settled-card-border);
  background:var(--settled-amounts-bg);
  display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:flex-end;
}
.settled-edit-income-form .edit-name-field{grid-column:1/-1;}
.settled-edit-income-form .edit-btns-row{grid-column:1/-1;display:flex;gap:8px;}
@media(max-width:380px){.settled-edit-income-form{grid-template-columns:1fr;}}

/* ── SETTLED ADD EXPENSE ── */
.settled-add-expense-section{
  padding:10px 18px;border-bottom:1.5px solid var(--settled-card-border);
  background:var(--settled-amounts-bg);
}
.settled-add-expense-toggle{
  display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;
  letter-spacing:.08em;text-transform:uppercase;color:var(--settled-history-btn-color);
  cursor:pointer;padding:6px 0;user-select:none;transition:opacity .15s;
}
.settled-add-expense-toggle:hover{opacity:.75;}

/* ══════════════════════════════════════
   IMPORT MODAL
══════════════════════════════════════ */
.import-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.52);z-index:1500;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .18s ease;}
.import-modal-box{background:var(--surface);border-radius:20px;width:100%;max-width:640px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 32px 80px rgba(0,0,0,.22);animation:slideUp .22s cubic-bezier(.34,1.56,.64,1);overflow:hidden;}
.import-modal-header{padding:22px 28px 16px;border-bottom:1.5px solid var(--border);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-shrink:0;background:linear-gradient(135deg,#fff7ed 0%,#fff 100%);}
@media(prefers-color-scheme:dark){.import-modal-header{background:linear-gradient(135deg,rgba(251,146,60,.08) 0%,var(--surface) 100%);}}
.import-modal-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--text);}
.import-modal-sub{font-size:12px;color:var(--text-dim);margin-top:4px;line-height:1.5;}
.import-modal-close{width:32px;height:32px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg2);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-dim);font-size:16px;transition:all .15s;flex-shrink:0;}
.import-modal-close:hover{background:var(--red-bg);border-color:var(--red);color:var(--red);}
.import-modal-body{overflow-y:auto;flex:1;padding:24px 28px;display:flex;flex-direction:column;gap:20px;}
.import-modal-footer{padding:16px 28px;border-top:1.5px solid var(--border);display:flex;gap:10px;justify-content:flex-end;background:var(--surface2);flex-shrink:0;}
.import-person-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
@media(max-width:500px){.import-person-row{grid-template-columns:1fr;}}
.import-dropzone{border:2px dashed var(--border2);border-radius:14px;padding:32px 24px;text-align:center;background:var(--bg2);cursor:pointer;transition:all .2s;position:relative;}
.import-dropzone:hover,.import-dropzone.drag-over{border-color:var(--orange);background:var(--orange-bg);box-shadow:0 0 0 3px rgba(234,88,12,.08);}
.import-dropzone input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
.import-dz-icon{font-size:36px;margin-bottom:10px;}
.import-dz-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--text);margin-bottom:6px;}
.import-dz-sub{font-size:12px;color:var(--text-dim);}
.import-dz-badge{display:inline-block;margin-top:10px;background:var(--orange-bg);border:1px solid rgba(234,88,12,.25);border-radius:20px;padding:4px 14px;font-size:11px;font-weight:600;color:var(--orange);}
.import-map-card{background:var(--surface2);border:1.5px solid var(--border);border-radius:12px;padding:18px 20px;}
.import-map-title{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-med);margin-bottom:14px;display:flex;align-items:center;gap:8px;}
.import-map-title::after{content:'';flex:1;height:1px;background:var(--border);}
.import-map-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
@media(max-width:500px){.import-map-grid{grid-template-columns:1fr;}}
.import-map-field{display:flex;flex-direction:column;gap:5px;}
.import-map-label{font-size:11px;font-weight:600;color:var(--text-dim);}
.import-map-label span{color:var(--orange);margin-left:3px;}
.import-map-select{background:var(--bg2);border:1.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--text);outline:none;cursor:pointer;transition:border-color .2s;appearance:none;}
.import-map-select:focus{border-color:var(--orange);box-shadow:0 0 0 3px rgba(234,88,12,.1);}
.import-preview-wrap{border:1.5px solid var(--border);border-radius:12px;overflow:hidden;}
.import-preview-header{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;background:var(--bg2);border-bottom:1.5px solid var(--border);}
.import-preview-title{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-med);}
.import-preview-count{font-size:11px;color:var(--text-faint);}
.import-table-wrap{overflow-x:auto;max-height:220px;overflow-y:auto;}
.import-table{width:100%;border-collapse:collapse;font-size:13px;}
.import-table th{background:var(--surface2);padding:9px 14px;text-align:left;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);border-bottom:1px solid var(--border);position:sticky;top:0;}
.import-table td{padding:9px 14px;border-bottom:1px solid var(--border);color:var(--text);}
.import-table tr:last-child td{border-bottom:none;}
.import-table tr:hover td{background:var(--surface2);}
.import-table td.amt-col{font-family:'Playfair Display',serif;font-weight:700;color:var(--red);}
.import-table td.invalid{color:var(--red);font-style:italic;}
.import-row-skip{opacity:.4;}
.import-summary-bar{display:flex;align-items:center;gap:16px;padding:12px 16px;background:var(--orange-bg);border:1.5px solid rgba(234,88,12,.25);border-radius:10px;flex-wrap:wrap;}
.import-sum-item{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;}
.import-sum-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.import-progress-overlay{position:absolute;inset:0;background:rgba(255,255,255,.85);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;border-radius:20px;z-index:10;}
@media(prefers-color-scheme:dark){.import-progress-overlay{background:rgba(31,31,35,.9);}}
.import-progress-text{font-size:14px;font-weight:600;color:var(--text);}
.import-spinner{width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--orange);border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
.import-expense-toggle{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--orange);cursor:pointer;padding:6px 0;user-select:none;transition:opacity .15s;}
.import-expense-toggle:hover{opacity:.75;}

/* AUTO-SETTLE TOAST */
.auto-settle-toast{position:fixed;bottom:24px;right:24px;z-index:3000;background:var(--green);color:#fff;padding:14px 20px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(22,163,74,.4);display:flex;align-items:center;gap:10px;animation:toastIn .3s cubic-bezier(.34,1.56,.64,1);max-width:320px;}
@keyframes toastIn{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}
.auto-settle-toast.out{animation:toastOut .25s ease forwards;}
@keyframes toastOut{to{transform:translateY(20px);opacity:0}}
.import-toast{position:fixed;bottom:72px;right:24px;z-index:3000;background:var(--orange);color:#fff;padding:14px 20px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(234,88,12,.4);display:flex;align-items:center;gap:10px;animation:toastIn .3s cubic-bezier(.34,1.56,.64,1);max-width:320px;}
.import-toast.out{animation:toastOut .25s ease forwards;}

/* CUSTOM CONFIRM DIALOG */
.cdialog-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2000;display:flex;align-items:center;justify-content:center;padding:24px;animation:cdFadeIn .18s ease;}
@keyframes cdFadeIn{from{opacity:0}to{opacity:1}}
.cdialog-box{background:var(--surface);border-radius:20px;width:100%;max-width:400px;box-shadow:0 32px 80px rgba(0,0,0,.22),0 8px 24px rgba(0,0,0,.1);animation:cdSlideUp .22s cubic-bezier(.34,1.56,.64,1);overflow:hidden;}
@keyframes cdSlideUp{from{transform:translateY(32px) scale(.94);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
.cdialog-icon-wrap{display:flex;align-items:center;justify-content:center;padding:32px 32px 20px;}
.cdialog-icon-circle{width:64px;height:64px;border-radius:50%;background:var(--green-bg);border:2px solid rgba(22,163,74,.25);display:flex;align-items:center;justify-content:center;font-size:28px;animation:cdIconPop .3s .1s cubic-bezier(.34,1.56,.64,1) both;}
@keyframes cdIconPop{from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1}}
.cdialog-content{padding:0 28px 8px;text-align:center;}
.cdialog-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--text);margin-bottom:10px;}
.cdialog-msg{font-size:14px;color:var(--text-med);line-height:1.6;}
.cdialog-person-name{display:inline-block;margin:12px 0 4px;background:var(--green-bg);color:var(--green);border:1px solid rgba(22,163,74,.25);border-radius:8px;padding:6px 16px;font-weight:600;font-size:15px;font-family:'Playfair Display',serif;}
.cdialog-warning{margin:12px 28px 0;padding:10px 14px;background:var(--amber-bg);border:1px solid rgba(180,83,9,.2);border-radius:8px;font-size:12px;color:var(--amber);font-weight:500;display:flex;align-items:flex-start;gap:8px;}
.cdialog-actions{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px 28px 28px;}
.cdialog-cancel{padding:13px 20px;border-radius:10px;border:1.5px solid var(--border);background:var(--bg2);color:var(--text-med);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;}
.cdialog-cancel:hover{background:var(--border);border-color:var(--border2);}
.cdialog-confirm{padding:13px 20px;border-radius:10px;border:none;background:var(--green);color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:7px;}
.cdialog-confirm:hover{opacity:.88;transform:translateY(-1px);box-shadow:0 4px 14px rgba(22,163,74,.35);}
.cdialog-confirm:active{transform:translateY(0);}
.cdialog-confirm-red{background:var(--red);}
.cdialog-confirm-red:hover{box-shadow:0 4px 14px rgba(220,38,38,.35);}
.cdialog-icon-circle.red-variant{background:var(--red-bg);border-color:rgba(220,38,38,.25);}

/* POPUP */
.popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn .15s ease;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.popup-box{background:var(--surface);border-radius:16px;width:100%;max-width:520px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.2);animation:slideUp .2s ease;}
@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
.popup-header{padding:20px 24px 16px;border-bottom:1.5px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0;}
.popup-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--text);}
.popup-subtitle{font-size:12px;color:var(--text-dim);margin-top:2px;}
.popup-close{width:32px;height:32px;border-radius:8px;border:1.5px solid var(--border);background:var(--bg2);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--text-dim);font-size:16px;transition:all .15s;flex-shrink:0;}
.popup-close:hover{background:var(--red-bg);border-color:var(--red);color:var(--red);}
.popup-readonly-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;background:var(--green-bg);border:1px solid rgba(22,163,74,.2);font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--green);margin-top:4px;}
.popup-body{overflow-y:auto;flex:1;}
.popup-empty{text-align:center;padding:40px 24px;color:var(--text-faint);font-size:13px;font-style:italic;}
.popup-section-label{padding:8px 24px 4px;font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);background:var(--bg2);border-bottom:1px solid var(--border);}
.popup-exp-row{display:flex;align-items:center;padding:12px 24px;gap:12px;border-bottom:1px solid var(--border);transition:background .1s;}
.popup-exp-row:last-child{border-bottom:none;}.popup-exp-row:hover{background:var(--surface2);}
.popup-exp-icon{width:32px;height:32px;border-radius:8px;background:var(--red-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;}
.popup-exp-info{flex:1;min-width:0;}
.popup-exp-desc{font-size:14px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.popup-exp-date{font-size:11px;color:var(--text-faint);margin-top:2px;}
.popup-exp-amt{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--red);white-space:nowrap;}
.popup-del-btn{background:none;border:none;cursor:pointer;padding:5px;border-radius:6px;color:var(--text-faint);transition:all .15s;display:inline-flex;flex-shrink:0;}
.popup-del-btn:hover{color:var(--red);background:var(--red-bg);}
.popup-edit-btn{background:none;border:none;cursor:pointer;padding:5px;border-radius:6px;color:var(--text-faint);transition:all .15s;display:inline-flex;flex-shrink:0;}
.popup-edit-btn:hover{color:var(--amber);background:var(--amber-bg);}
.popup-shared-row{display:flex;align-items:center;padding:12px 24px;gap:12px;border-bottom:1px solid var(--border);background:var(--purple-bg);}
.popup-shared-icon{width:32px;height:32px;border-radius:8px;background:var(--purple-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;}
.popup-shared-amt{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--purple);white-space:nowrap;}
.popup-import-row{display:flex;align-items:center;padding:12px 24px;gap:12px;border-bottom:1px solid var(--border);background:var(--orange-bg);}

/* inline edit row inside popup */
.popup-inline-edit{display:flex;flex-direction:column;gap:8px;padding:10px 24px 14px;background:var(--surface2);border-bottom:1px solid var(--border);}
.popup-inline-edit-row{display:grid;grid-template-columns:1fr 130px;gap:8px;}
.popup-inline-edit-btns{display:flex;gap:6px;justify-content:flex-end;}

/* SHARED SECTION */
.shared-section{background:var(--surface);border:2px solid var(--purple);border-radius:16px;overflow:hidden;margin-bottom:40px;box-shadow:0 4px 20px rgba(124,58,237,.1);}
.shared-section-header{background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);padding:22px 28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;}
.shared-header-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:#fff;}
.shared-header-sub{font-size:12px;color:rgba(255,255,255,.75);margin-top:3px;}
.shared-select-hint{font-size:12px;font-weight:500;color:rgba(255,255,255,.9);background:rgba(255,255,255,.18);padding:7px 16px;border-radius:20px;}
.shared-body{padding:24px 28px;}
.selected-chips{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:22px;min-height:40px;align-items:center;}
.no-selection-hint{font-size:13px;color:var(--text-faint);font-style:italic;}
.person-chip{display:flex;align-items:center;gap:8px;padding:7px 14px 7px 9px;border-radius:99px;background:var(--purple-bg);border:1.5px solid var(--purple);font-size:13px;font-weight:600;color:var(--purple);}
.chip-avatar{width:22px;height:22px;border-radius:50%;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;}
.chip-balance{font-size:11px;font-weight:500;color:var(--text-dim);margin-left:2px;}
.manual-split-box{background:linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%);border:1.5px solid var(--purple);border-radius:12px;padding:18px 22px;margin-bottom:22px;}
.manual-split-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;}
.manual-split-label{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--purple);margin-bottom:4px;}
.manual-split-total{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--purple);}
.manual-split-rows{display:flex;flex-direction:column;gap:10px;}
.manual-split-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.split-row-avatar{width:26px;height:26px;border-radius:50%;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.split-row-name{font-size:13px;font-weight:600;color:var(--text-med);flex:1;min-width:80px;}
.split-row-bal{font-size:12px;font-weight:600;color:var(--green);white-space:nowrap;background:var(--green-bg);padding:3px 10px;border-radius:20px;}
.split-row-input{width:120px;background:#fff;border:1.5px solid rgba(124,58,237,.3);border-radius:8px;padding:8px 12px;font-size:14px;font-family:'DM Sans',sans-serif;color:var(--text);outline:none;transition:border-color .2s;}
.split-row-input:focus{border-color:var(--purple);box-shadow:0 0 0 3px rgba(124,58,237,.1);}
.split-running{font-size:13px;color:var(--text-dim);margin-top:12px;padding-top:12px;border-top:1px solid rgba(124,58,237,.2);display:flex;justify-content:space-between;align-items:center;}
.shared-desc-row{display:grid;grid-template-columns:1fr 160px auto;gap:12px;align-items:flex-end;margin-bottom:16px;}
@media(max-width:700px){.shared-desc-row{grid-template-columns:1fr 1fr;}}
@media(max-width:500px){.shared-desc-row{grid-template-columns:1fr;}}
.shared-history-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--text);margin-bottom:14px;padding-top:20px;border-top:1.5px solid var(--border);display:flex;align-items:center;gap:10px;}
.shared-history-title::after{content:'';flex:1;height:1px;background:var(--border);}
.shared-exp-card{background:var(--surface2);border:1.5px solid var(--border);border-radius:12px;margin-bottom:12px;overflow:hidden;}
.shared-exp-top{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;gap:10px;flex-wrap:wrap;}
.shared-exp-desc{font-size:15px;font-weight:600;color:var(--text);flex:1;}
.shared-exp-date{font-size:11px;color:var(--text-faint);white-space:nowrap;}
.shared-exp-total{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--purple);white-space:nowrap;}
.shared-exp-persons{display:flex;flex-wrap:wrap;gap:8px;padding:10px 18px 14px;border-top:1px solid var(--border);background:var(--surface);}
.shared-split-pill{display:flex;align-items:center;gap:6px;padding:5px 12px 5px 8px;border-radius:99px;background:var(--purple-bg);border:1px solid rgba(124,58,237,.2);font-size:12px;font-weight:500;color:var(--text-med);}
.split-pill-avatar{width:18px;height:18px;border-radius:50%;color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;}
.split-pill-amount{font-weight:700;color:var(--red);}
.empty-state{text-align:center;padding:60px 24px;background:var(--surface);border:1.5px dashed var(--border2);border-radius:16px;margin-bottom:36px;}
.empty-icon{font-size:40px;margin-bottom:14px;}
.empty-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--text-med);margin-bottom:8px;}
.empty-sub{font-size:13px;color:var(--text-dim);}
.loading-text{text-align:center;color:var(--text-dim);padding:48px;font-size:14px;}
.no-shared-history{text-align:center;padding:28px;font-size:13px;color:var(--text-faint);font-style:italic;}
.filter-bar{background:var(--surface);border:1.5px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;flex-wrap:wrap;align-items:center;gap:10px;box-shadow:var(--shadow-sm);}
.filter-search{flex:1;min-width:180px;background:var(--bg2);border:1.5px solid var(--border);border-radius:8px;padding:9px 13px;font-size:14px;font-family:'DM Sans',sans-serif;color:var(--text);outline:none;transition:border-color .2s,box-shadow .2s;}
.filter-search::placeholder{color:var(--text-faint);}
.filter-search:focus{border-color:var(--teal);box-shadow:0 0 0 3px rgba(13,148,136,.1);background:var(--surface);}
.filter-pills{display:flex;gap:6px;flex-wrap:wrap;}
.filter-pill{padding:6px 14px;border-radius:20px;font-size:11px;font-weight:600;border:1.5px solid var(--border);background:var(--bg2);color:var(--text-dim);cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;}
.filter-pill:hover{border-color:var(--teal);color:var(--teal);}
.filter-pill.active{background:var(--teal);border-color:var(--teal);color:#fff;}
.filter-pill.pending.active{background:var(--amber);border-color:var(--amber);}
.sort-select{background:var(--bg2);border:1.5px solid var(--border);border-radius:8px;padding:8px 12px;font-size:12px;font-family:'DM Sans',sans-serif;color:var(--text-med);outline:none;cursor:pointer;transition:border-color .2s;appearance:none;}
.sort-select:focus{border-color:var(--teal);}
.filter-count{font-size:12px;color:var(--text-dim);margin-left:auto;white-space:nowrap;}
`;

const fmt = (n) => Math.round(n).toLocaleString("en-IN");
const nowSettledAt = () =>
  new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const fmtDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

// ─── CSV/EXCEL PARSER ────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const parseRow = (line) => {
    const cells = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { cells.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  };
  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(l => parseRow(l));
  return { headers, rows };
}

function parseExcelBasic(buffer) {
  try {
    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(buffer);
    const ssMatch = text.match(/<sst[^>]*>([\s\S]*?)<\/sst>/);
    const sharedStrings = [];
    if (ssMatch) {
      const tMatches = [...ssMatch[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)];
      tMatches.forEach(m => sharedStrings.push(m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")));
    }
    const sheetMatch = text.match(/<sheetData>([\s\S]*?)<\/sheetData>/);
    if (!sheetMatch) return null;
    const rows = [...sheetMatch[1].matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map(rowM => {
      const cells = [...rowM[1].matchAll(/<c[^>]*r="[A-Z]+\d+"[^>]*t="([^"]*)"[^>]*>[\s\S]*?<v>([\s\S]*?)<\/v>|<c[^>]*r="[A-Z]+\d+"[^>]*>[\s\S]*?<v>([\s\S]*?)<\/v>/g)];
      return cells.map(c => {
        const type = c[1];
        const val = c[2] || c[3] || "";
        if (type === "s") return sharedStrings[parseInt(val)] ?? "";
        return val;
      });
    });
    if (rows.length < 2) return null;
    return { headers: rows[0], rows: rows.slice(1) };
  } catch {
    return null;
  }
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, personName, warning, confirmLabel = "Confirm", variant = "green" }) {
  if (!isOpen) return null;
  return (
    <div className="cdialog-overlay" onClick={onClose}>
      <div className="cdialog-box" onClick={e => e.stopPropagation()}>
        <div className="cdialog-icon-wrap">
          <div className={`cdialog-icon-circle${variant === "red" ? " red-variant" : ""}`}>
            {variant === "red" ? "↩" : "✓"}
          </div>
        </div>
        <div className="cdialog-content">
          <div className="cdialog-title">{title}</div>
          <div className="cdialog-msg">{message}</div>
          {personName && <div className="cdialog-person-name">{personName}</div>}
        </div>
        {warning && <div className="cdialog-warning"><span>⚠️</span><span>{warning}</span></div>}
        <div className="cdialog-actions">
          <button className="cdialog-cancel" onClick={onClose}>Cancel</button>
          <button className={`cdialog-confirm${variant === "red" ? " cdialog-confirm-red" : ""}`}
            onClick={() => { onConfirm(); onClose(); }}>
            <span>{variant === "red" ? "↩" : "✓"}</span>{confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function AutoSettleToast({ name, onDone }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 3200);
    const t2 = setTimeout(onDone, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);
  return (
    <div className={`auto-settle-toast${leaving ? " out" : ""}`}>
      🔒 <span><strong>{name}</strong> auto-settled — moved to Settled section</span>
    </div>
  );
}

function ImportToast({ count, onDone }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 3200);
    const t2 = setTimeout(onDone, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);
  return (
    <div className={`import-toast${leaving ? " out" : ""}`}>
      📥 <span><strong>{count} expenses</strong> imported successfully!</span>
    </div>
  );
}

// ─── IMPORT MODAL ─────────────────────────────────────────────────────────────
function ImportModal({ isOpen, onClose, bulkIncomes, onImportDone, today }) {
  const fileRef = useRef(null);
  const [step, setStep] = useState(1);
  const [selectedIncomeId, setSelectedIncomeId] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const [colDesc, setColDesc] = useState("");
  const [colAmt, setColAmt] = useState("");
  const [colDate, setColDate] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setStep(1); setSelectedIncomeId(""); setParsedData(null);
      setColDesc(""); setColAmt(""); setColDate(""); setFileName(""); setImporting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!parsedData) return;
    const h = parsedData.headers.map(x => x.toLowerCase());
    const descGuess = h.findIndex(x => x.includes("desc") || x.includes("note") || x.includes("narr") || x.includes("particular") || x.includes("detail") || x.includes("remark") || x.includes("item") || x.includes("name"));
    const amtGuess = h.findIndex(x => x.includes("amt") || x.includes("amount") || x.includes("debit") || x.includes("credit") || x.includes("total") || x.includes("price") || x.includes("value") || x.includes("₹"));
    const dateGuess = h.findIndex(x => x.includes("date") || x.includes("dt") || x.includes("time"));
    if (descGuess >= 0) setColDesc(String(descGuess));
    if (amtGuess >= 0) setColAmt(String(amtGuess));
    if (dateGuess >= 0) setColDate(String(dateGuess));
  }, [parsedData]);

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "csv" || ext === "txt") {
      const text = await file.text();
      const result = parseCSV(text);
      if (result.headers.length > 0) { setParsedData(result); setStep(2); }
      else alert("Could not parse CSV. Make sure it has a header row.");
    } else if (ext === "xlsx" || ext === "xls") {
      const buffer = await file.arrayBuffer();
      const result = parseExcelBasic(buffer);
      if (result) { setParsedData(result); setStep(2); }
      else alert("Could not read Excel file. Please save as CSV and try again.");
    } else {
      alert("Please upload a .csv or .xlsx file");
    }
  };

  const previewRows = parsedData ? parsedData.rows.filter(r => r.length > 0 && r.some(c => c !== "")) : [];

  const getPreviewExpenses = () => {
    if (!parsedData || colDesc === "" || colAmt === "") return [];
    const di = parseInt(colDesc), ai = parseInt(colAmt), dti = colDate !== "" ? parseInt(colDate) : -1;
    return previewRows.map(row => {
      const desc = (row[di] || "").trim();
      const rawAmt = (row[ai] || "").toString().replace(/[₹,\s]/g, "");
      const amt = parseFloat(rawAmt);
      const dateVal = dti >= 0 ? (row[dti] || "").trim() : today;
      return { desc, amt: isNaN(amt) ? null : Math.round(Math.abs(amt)), date: dateVal || today, valid: !!desc && !isNaN(amt) && amt !== 0 };
    }).filter(r => r.desc || r.amt !== null);
  };

  const validExpenses = getPreviewExpenses().filter(r => r.valid);
  const invalidCount = getPreviewExpenses().length - validExpenses.length;

  const doImport = async () => {
    if (!selectedIncomeId) { alert("Select a person first"); return; }
    if (validExpenses.length === 0) { alert("No valid rows to import"); return; }
    setImporting(true);
    const rows = validExpenses.map(e => ({
      bulk_income_id: selectedIncomeId,
      description: e.desc,
      amount: e.amt,
      date: e.date,
    }));
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase.from("bulk_expense").insert(chunk);
      if (error) { alert("Import error: " + error.message); setImporting(false); return; }
    }
    setImporting(false);
    onImportDone(validExpenses.length);
    onClose();
  };

  const activePersons = bulkIncomes.filter(i => !i.is_settled);

  if (!isOpen) return null;

  return (
    <div className="import-modal-overlay" onClick={onClose}>
      <div className="import-modal-box" onClick={e => e.stopPropagation()} style={{ position: "relative" }}>
        {importing && (
          <div className="import-progress-overlay">
            <div className="import-spinner" />
            <div className="import-progress-text">Importing {validExpenses.length} expenses…</div>
          </div>
        )}

        <div className="import-modal-header">
          <div>
            <div className="import-modal-title">📥 Import Expenses from File</div>
            <div className="import-modal-sub">
              Upload a CSV or Excel file. You select the person — only description &amp; amount will be imported as expenses.
            </div>
          </div>
          <button className="import-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="import-modal-body">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 12,
                  background: step >= s ? "var(--orange)" : "var(--bg2)",
                  color: step >= s ? "#fff" : "var(--text-faint)",
                  border: `2px solid ${step >= s ? "var(--orange)" : "var(--border)"}`,
                  transition: "all .2s",
                }}>{s}</div>
                {s < 3 && <div style={{ width: 32, height: 2, background: step > s ? "var(--orange)" : "var(--border)", borderRadius: 2, transition: "background .2s" }} />}
              </div>
            ))}
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", marginLeft: 8 }}>
              {step === 1 ? "Select Person & File" : step === 2 ? "Map Columns" : "Preview & Import"}
            </span>
          </div>

          {step === 1 && (
            <>
              <div>
                <div className="field-label" style={{ marginBottom: 8 }}>Select Person (Active Only)</div>
                {activePersons.length === 0 ? (
                  <div style={{ padding: "12px 16px", background: "var(--amber-bg)", borderRadius: 10, fontSize: 13, color: "var(--amber)", fontWeight: 600 }}>
                    ⚠️ No active persons found. Add a person with income amount first.
                  </div>
                ) : (
                  <select className="bt-input" value={selectedIncomeId} onChange={e => setSelectedIncomeId(e.target.value)}>
                    <option value="">— Choose person —</option>
                    {activePersons.map(inc => (
                      <option key={inc.id} value={inc.id}>
                        {inc.person_name} · ₹{fmt(inc.amount)} received
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div
                className={`import-dropzone${dragOver ? " drag-over" : ""}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              >
                <input type="file" accept=".csv,.xlsx,.xls,.txt" ref={fileRef}
                  onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
                <div className="import-dz-icon">📂</div>
                <div className="import-dz-title">Drop your file here or click to browse</div>
                <div className="import-dz-sub">Supports CSV (.csv) and Excel (.xlsx)</div>
                <div className="import-dz-badge">CSV · XLSX</div>
              </div>
              <div style={{ background: "var(--bg2)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 8 }}>💡 File Format Tips</div>
                <div style={{ fontSize: 12, color: "var(--text-med)", lineHeight: 1.7 }}>
                  • First row must be the <strong>header row</strong> (column names)<br />
                  • Column names like <strong>Description, Amount, Date</strong> are auto-detected<br />
                  • Date column is optional — defaults to today if missing<br />
                  • Amounts with ₹ symbol or commas are cleaned automatically<br />
                  • Rows with empty description or zero amount are skipped
                </div>
              </div>
            </>
          )}

          {step === 2 && parsedData && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--orange-bg)", border: "1.5px solid rgba(234,88,12,.25)", borderRadius: 10 }}>
                <span style={{ fontSize: 18 }}>📄</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{fileName}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{parsedData.headers.length} columns · {previewRows.length} rows detected</div>
                </div>
              </div>
              <div className="import-map-card">
                <div className="import-map-title">Map Columns</div>
                <div className="import-map-grid">
                  <div className="import-map-field">
                    <div className="import-map-label">Description Column <span>*required</span></div>
                    <select className="import-map-select" value={colDesc} onChange={e => setColDesc(e.target.value)}>
                      <option value="">— Select —</option>
                      {parsedData.headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                    </select>
                  </div>
                  <div className="import-map-field">
                    <div className="import-map-label">Amount Column <span>*required</span></div>
                    <select className="import-map-select" value={colAmt} onChange={e => setColAmt(e.target.value)}>
                      <option value="">— Select —</option>
                      {parsedData.headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                    </select>
                  </div>
                  <div className="import-map-field">
                    <div className="import-map-label">Date Column <span style={{ color: "var(--text-faint)", fontSize: 10 }}>(optional)</span></div>
                    <select className="import-map-select" value={colDate} onChange={e => setColDate(e.target.value)}>
                      <option value="">— None (use today) —</option>
                      {parsedData.headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="import-preview-wrap">
                <div className="import-preview-header">
                  <span className="import-preview-title">Raw Preview (first 5 rows)</span>
                  <span className="import-preview-count">{previewRows.length} total rows</span>
                </div>
                <div className="import-table-wrap">
                  <table className="import-table">
                    <thead>
                      <tr>{parsedData.headers.map((h, i) => <th key={i}>{h || `Col ${i + 1}`}</th>)}</tr>
                    </thead>
                    <tbody>
                      {previewRows.slice(0, 5).map((row, ri) => (
                        <tr key={ri}>{parsedData.headers.map((_, ci) => <td key={ci}>{row[ci] ?? ""}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {(() => {
                const inc = bulkIncomes.find(i => i.id === selectedIncomeId);
                return inc ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "var(--orange-bg)", border: "1.5px solid rgba(234,88,12,.3)", borderRadius: 10 }}>
                    <span style={{ fontSize: 22 }}>👤</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{inc.person_name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>Importing expenses for this person · ₹{fmt(inc.amount)} total received</div>
                    </div>
                  </div>
                ) : null;
              })()}
              <div className="import-summary-bar">
                <div className="import-sum-item">
                  <div className="import-sum-dot" style={{ background: "var(--green)" }} />
                  <span style={{ color: "var(--green)" }}>{validExpenses.length} valid rows</span>
                </div>
                {invalidCount > 0 && (
                  <div className="import-sum-item">
                    <div className="import-sum-dot" style={{ background: "var(--red)" }} />
                    <span style={{ color: "var(--red)" }}>{invalidCount} skipped (empty/invalid)</span>
                  </div>
                )}
                <div className="import-sum-item" style={{ marginLeft: "auto" }}>
                  <span style={{ color: "var(--orange)", fontFamily: "Playfair Display, serif", fontSize: 16 }}>
                    Total: ₹{fmt(validExpenses.reduce((s, e) => s + (e.amt || 0), 0))}
                  </span>
                </div>
              </div>
              <div className="import-preview-wrap">
                <div className="import-preview-header">
                  <span className="import-preview-title">Expenses to Import</span>
                  <span className="import-preview-count">{validExpenses.length} rows</span>
                </div>
                <div className="import-table-wrap">
                  <table className="import-table">
                    <thead>
                      <tr><th>#</th><th>Description</th><th>Amount</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {validExpenses.map((e, i) => (
                        <tr key={i}>
                          <td style={{ color: "var(--text-faint)", fontSize: 11 }}>{i + 1}</td>
                          <td>{e.desc}</td>
                          <td className="amt-col">−₹{fmt(e.amt)}</td>
                          <td style={{ color: "var(--text-dim)", fontSize: 12 }}>{e.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="import-modal-footer">
          {step > 1 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setStep(s => s - 1)}>← Back</button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          {step === 1 && (
            <button className="btn btn-orange btn-sm"
              style={{ opacity: !selectedIncomeId || !parsedData ? .45 : 1, cursor: !selectedIncomeId || !parsedData ? "not-allowed" : "pointer" }}
              onClick={() => { if (selectedIncomeId && parsedData) setStep(2); }}>
              Next: Map Columns →
            </button>
          )}
          {step === 2 && (
            <button className="btn btn-orange btn-sm"
              style={{ opacity: colDesc === "" || colAmt === "" ? .45 : 1, cursor: colDesc === "" || colAmt === "" ? "not-allowed" : "pointer" }}
              onClick={() => { if (colDesc !== "" && colAmt !== "") setStep(3); }}>
              Preview →
            </button>
          )}
          {step === 3 && (
            <button className="btn btn-orange btn-sm"
              style={{ opacity: validExpenses.length === 0 ? .45 : 1, cursor: validExpenses.length === 0 ? "not-allowed" : "pointer" }}
              onClick={doImport}>
              ✓ Import {validExpenses.length} Expenses
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function BulkTracker() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [bulkIncomes, setBulkIncomes] = useState([]);
  const [bulkExpenses, setBulkExpenses] = useState([]);
  const [sharedExpenses, setSharedExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [incForm, setIncForm] = useState({ person_name: "", amount: "", date: today, note: "" });
  const [openExpForm, setOpenExpForm] = useState(null);
  const [expForm, setExpForm] = useState({ description: "", amount: "" });
  const [editingIncome, setEditingIncome] = useState(null);

  // ── NEW: settled card edit states ──
  const [settledEditingIncome, setSettledEditingIncome] = useState(null); // { id, person_name, amount }
  const [settledOpenExpForm, setSettledOpenExpForm] = useState(null);     // incomeId
  const [settledExpForm, setSettledExpForm] = useState({ description: "", amount: "" });
  // inline edit for expense entry in popup
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingExpenseForm, setEditingExpenseForm] = useState({ description: "", amount: "" });

  const [selectedIds, setSelectedIds] = useState([]);
  const [sharedDesc, setSharedDesc] = useState("");
  const [sharedDate, setSharedDate] = useState(today);
  const [manualAmounts, setManualAmounts] = useState({});

  const [popupPersonId, setPopupPersonId] = useState(null);
  const [popupIsReadonly, setPopupIsReadonly] = useState(false);

  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [dialog, setDialog] = useState({ isOpen: false, title: "", message: "", personName: "", warning: "", confirmLabel: "Confirm", variant: "green", onConfirm: () => { } });
  const closeDialog = () => setDialog(d => ({ ...d, isOpen: false }));
  const openDialog = (opts) => setDialog({ isOpen: true, ...opts });

  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const [importToasts, setImportToasts] = useState([]);
  const importToastId = useRef(0);

  const [showSettledSection, setShowSettledSection] = useState(false);
  const [settledExpanded, setSettledExpanded] = useState({});

  const [showImportModal, setShowImportModal] = useState(false);

  const autoSettledRef = useRef(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (!data.session) navigate("/"); });
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: incData }, { data: expData }, { data: sharedData }] = await Promise.all([
      supabase.from("bulk_income").select("*").order("created_at", { ascending: false }),
      supabase.from("bulk_expense").select("*").order("created_at", { ascending: false }),
      supabase.from("shared_expense").select("*, shared_expense_split(*)").order("created_at", { ascending: false }),
    ]);
    setBulkIncomes(incData || []);
    setBulkExpenses(expData || []);
    setSharedExpenses(sharedData || []);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const getIndivExp = (id) => bulkExpenses.filter(e => e.bulk_income_id === id).reduce((s, e) => s + e.amount, 0);
  const getSharedCut = (id) => {
    let t = 0;
    for (const se of sharedExpenses) {
      const sp = (se.shared_expense_split || []).find(s => s.bulk_income_id === id);
      if (sp) t += sp.split_amount;
    }
    return t;
  };
  const getRemaining = (inc) => inc.amount - getIndivExp(inc.id) - getSharedCut(inc.id);
  const getStatus = (income, spent) => spent === 0 ? "pending" : spent >= income ? "settled" : "partial";
  const avatarColor = (name) => {
    const cols = ["#0d9488", "#16a34a", "#7c3aed", "#db2777", "#b45309", "#1d4ed8", "#dc2626"];
    let h = 0; for (let c of name) h = c.charCodeAt(0) + ((h << 5) - h);
    return cols[Math.abs(h) % cols.length];
  };

  useEffect(() => {
    if (loading || bulkIncomes.length === 0) return;
    bulkIncomes.filter(inc => !inc.is_settled).forEach(inc => {
      const remaining = getRemaining(inc);
      if (remaining <= 0 && inc.amount > 0 && !autoSettledRef.current.has(inc.id)) {
        autoSettledRef.current.add(inc.id);
        supabase.from("bulk_income")
          .update({ is_settled: true, settled_at: nowSettledAt() })
          .eq("id", inc.id)
          .then(() => {
            const tid = ++toastId.current;
            setToasts(prev => [...prev, { id: tid, name: inc.person_name }]);
            setSelectedIds(prev => prev.filter(i => i !== inc.id));
            fetchData();
          });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkIncomes, bulkExpenses, sharedExpenses, loading]);

  const markSettled = (id, name) => {
    openDialog({
      title: "Mark as Settled?",
      message: "This will lock the card and move it to the Settled section.",
      personName: name,
      warning: "You can always undo this by clicking 'Unsettle' later.",
      confirmLabel: "Yes, Settle",
      variant: "green",
      onConfirm: async () => {
        await supabase.from("bulk_income").update({ is_settled: true, settled_at: nowSettledAt() }).eq("id", id);
        setSelectedIds(prev => prev.filter(i => i !== id));
        autoSettledRef.current.add(id);
        fetchData();
      }
    });
  };

  const unsettle = (id, name) => {
    openDialog({
      title: "Remove Settled Status?",
      message: "This person will become active again and can be edited.",
      personName: name,
      warning: "",
      confirmLabel: "Yes, Unsettle",
      variant: "red",
      onConfirm: async () => {
        await supabase.from("bulk_income").update({ is_settled: false, settled_at: null }).eq("id", id);
        autoSettledRef.current.delete(id);
        setSettledExpanded(prev => { const n = { ...prev }; delete n[id]; return n; });
        setSettledEditingIncome(null);
        setSettledOpenExpForm(null);
        fetchData();
      }
    });
  };

  const toggleSettledExpand = (id) => setSettledExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const addBulkIncome = async () => {
    if (!incForm.person_name.trim() || !incForm.amount) return;
    await supabase.from("bulk_income").insert([{
      person_name: incForm.person_name.trim(),
      amount: Math.round(Number(incForm.amount)),
      date: incForm.date, note: incForm.note.trim() || null,
      is_settled: false, settled_at: null,
    }]);
    setIncForm({ person_name: "", amount: "", date: today, note: "" });
    fetchData();
  };

  const saveEditIncome = async () => {
    if (!editingIncome?.person_name.trim() || !editingIncome?.amount) return;
    await supabase.from("bulk_income").update({
      person_name: editingIncome.person_name.trim(),
      amount: Math.round(Number(editingIncome.amount)),
    }).eq("id", editingIncome.id);
    autoSettledRef.current.delete(editingIncome.id);
    setEditingIncome(null);
    fetchData();
  };

  // ── NEW: save edit for settled card income ──
  const saveSettledEditIncome = async () => {
    if (!settledEditingIncome?.person_name.trim() || !settledEditingIncome?.amount) return;
    await supabase.from("bulk_income").update({
      person_name: settledEditingIncome.person_name.trim(),
      amount: Math.round(Number(settledEditingIncome.amount)),
    }).eq("id", settledEditingIncome.id);
    autoSettledRef.current.delete(settledEditingIncome.id);
    setSettledEditingIncome(null);
    fetchData();
  };

  // ── NEW: add expense to settled card ──
  const addSettledExpense = async (bulkIncomeId) => {
    if (!settledExpForm.description.trim() || !settledExpForm.amount) return;
    await supabase.from("bulk_expense").insert([{
      bulk_income_id: bulkIncomeId,
      description: settledExpForm.description.trim(),
      amount: Math.round(Number(settledExpForm.amount)),
      date: today,
    }]);
    setSettledExpForm({ description: "", amount: "" });
    setSettledOpenExpForm(null);
    fetchData();
  };

  const deleteBulkIncome = async (id) => {
    openDialog({
      title: "Delete Person?",
      message: "All expenses for this person will be permanently deleted.",
      personName: bulkIncomes.find(i => i.id === id)?.person_name || "",
      warning: "This action cannot be undone.",
      confirmLabel: "Delete", variant: "red",
      onConfirm: async () => {
        await supabase.from("bulk_expense").delete().eq("bulk_income_id", id);
        const { data: splits } = await supabase.from("shared_expense_split").select("shared_expense_id").eq("bulk_income_id", id);
        if (splits?.length) {
          const seIds = [...new Set(splits.map(s => s.shared_expense_id))];
          await supabase.from("shared_expense_split").delete().in("shared_expense_id", seIds);
          await supabase.from("shared_expense").delete().in("id", seIds);
        }
        await supabase.from("bulk_income").delete().eq("id", id);
        setSelectedIds(prev => prev.filter(i => i !== id));
        autoSettledRef.current.delete(id);
        if (popupPersonId === id) setPopupPersonId(null);
        fetchData();
      }
    });
  };

  const addExpense = async (bulkIncomeId) => {
    if (!expForm.description.trim() || !expForm.amount) return;
    await supabase.from("bulk_expense").insert([{
      bulk_income_id: bulkIncomeId,
      description: expForm.description.trim(),
      amount: Math.round(Number(expForm.amount)), date: today,
    }]);
    setExpForm({ description: "", amount: "" });
    setOpenExpForm(null);
    autoSettledRef.current.delete(bulkIncomeId);
    fetchData();
  };

  const deleteExpense = async (id, bulkIncomeId) => {
    await supabase.from("bulk_expense").delete().eq("id", id);
    autoSettledRef.current.delete(bulkIncomeId);
    fetchData();
  };

  // ── NEW: update expense entry ──
  const saveEditExpense = async () => {
    if (!editingExpenseForm.description.trim() || !editingExpenseForm.amount) return;
    await supabase.from("bulk_expense").update({
      description: editingExpenseForm.description.trim(),
      amount: Math.round(Number(editingExpenseForm.amount)),
    }).eq("id", editingExpenseId);
    setEditingExpenseId(null);
    setEditingExpenseForm({ description: "", amount: "" });
    fetchData();
  };

  const toggleSelect = (id) => {
    const inc = bulkIncomes.find(i => i.id === id);
    if (inc?.is_settled) return;
    setManualAmounts({});
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const openPopup = (personId, readonly = false) => {
    setPopupPersonId(personId);
    setPopupIsReadonly(readonly);
    setEditingExpenseId(null);
  };

  const selectedPersons = bulkIncomes.filter(inc => selectedIds.includes(inc.id));
  const combinedBalance = selectedPersons.reduce((s, inc) => s + Math.max(0, getRemaining(inc)), 0);
  const enteredTotal = selectedPersons.reduce((s, inc) => s + (Math.round(Number(manualAmounts[inc.id])) || 0), 0);

  const addSharedExpense = async () => {
    if (!sharedDesc.trim()) { alert("Enter expense description"); return; }
    if (selectedPersons.length < 2) { alert("Select at least 2 persons"); return; }
    if (enteredTotal === 0) { alert("Enter amount for at least one person"); return; }
    const splits = selectedPersons.map(inc => ({ person: inc, amount: Math.round(Number(manualAmounts[inc.id])) || 0 })).filter(s => s.amount > 0);
    const { data: seData, error: seErr } = await supabase.from("shared_expense")
      .insert([{ description: sharedDesc.trim(), total_amount: enteredTotal, date: sharedDate, persons: selectedPersons.map(p => p.person_name).join(", ") }])
      .select().single();
    if (seErr) { alert(seErr.message); return; }
    await supabase.from("shared_expense_split").insert(
      splits.map(s => ({ shared_expense_id: seData.id, bulk_income_id: s.person.id, person_name: s.person.person_name, split_amount: s.amount }))
    );
    splits.forEach(s => autoSettledRef.current.delete(s.person.id));
    setSharedDesc(""); setSharedDate(today); setManualAmounts({});
    fetchData();
  };

  const deleteSharedExpense = async (id) => {
    openDialog({
      title: "Delete Shared Expense?", message: "This shared expense and all its splits will be removed.",
      personName: "", warning: "This action cannot be undone.", confirmLabel: "Delete", variant: "red",
      onConfirm: async () => {
        const se = sharedExpenses.find(x => x.id === id);
        if (se?.shared_expense_split) se.shared_expense_split.forEach(s => autoSettledRef.current.delete(s.bulk_income_id));
        await supabase.from("shared_expense_split").delete().eq("shared_expense_id", id);
        await supabase.from("shared_expense").delete().eq("id", id);
        fetchData();
      }
    });
  };

  const handleImportDone = (count) => {
    const tid = ++importToastId.current;
    setImportToasts(prev => [...prev, { id: tid, count }]);
    fetchData();
  };

  const totalBulkIn = bulkIncomes.reduce((s, i) => s + i.amount, 0);
  const totalIndivExp = bulkExpenses.reduce((s, e) => s + e.amount, 0);
  const totalSharedExp = sharedExpenses.reduce((s, e) => s + e.total_amount, 0);
  const totalRemaining = totalBulkIn - totalIndivExp - totalSharedExp;

  const activePersons = bulkIncomes.filter(inc => !inc.is_settled);
  const settledPersons = bulkIncomes.filter(inc => !!inc.is_settled);

  const applyFiltersAndSort = (list) =>
    list.filter(inc => {
      const totalSpent = getIndivExp(inc.id) + getSharedCut(inc.id);
      const autoStatus = getStatus(inc.amount, totalSpent);
      const matchesSearch = inc.person_name.toLowerCase().includes(searchQ.toLowerCase()) || (inc.note || "").toLowerCase().includes(searchQ.toLowerCase());
      const matchesFilter = filterStatus === "all" || autoStatus === filterStatus;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      if (sortBy === "balance-high") return Math.max(0, getRemaining(b)) - Math.max(0, getRemaining(a));
      if (sortBy === "balance-low") return Math.max(0, getRemaining(a)) - Math.max(0, getRemaining(b));
      if (sortBy === "name") return a.person_name.localeCompare(b.person_name);
      if (sortBy === "amount-high") return b.amount - a.amount;
      return new Date(b.created_at || b.date) - new Date(a.created_at || a.date);
    });

  const filteredActive = applyFiltersAndSort(activePersons);
  const filteredSettled = applyFiltersAndSort(settledPersons);

  const popupPerson = popupPersonId ? bulkIncomes.find(i => i.id === popupPersonId) : null;
  const popupIndivExp = popupPersonId ? bulkExpenses.filter(e => e.bulk_income_id === popupPersonId) : [];
  const popupShared = popupPersonId ? sharedExpenses.filter(se => (se.shared_expense_split || []).some(s => s.bulk_income_id === popupPersonId)) : [];
  const popupSharedCut = (seId) => {
    const se = sharedExpenses.find(x => x.id === seId);
    if (!se) return 0;
    const sp = (se.shared_expense_split || []).find(s => s.bulk_income_id === popupPersonId);
    return sp ? sp.split_amount : 0;
  };

  // ─── ACTIVE CARD ───
  const renderActiveCard = (inc) => {
    const indivSpent = getIndivExp(inc.id);
    const sharedCut = getSharedCut(inc.id);
    const totalSpent = indivSpent + sharedCut;
    const remaining = inc.amount - totalSpent;
    const pct = Math.min(100, inc.amount > 0 ? Math.round((totalSpent / inc.amount) * 100) : 0);
    const autoStatus = getStatus(inc.amount, totalSpent);
    const isOpen = openExpForm === inc.id;
    const isSelected = selectedIds.includes(inc.id);
    const isEditing = editingIncome?.id === inc.id;
    const fillColor = pct >= 100 ? "var(--red)" : pct >= 60 ? "var(--amber)" : "var(--green)";
    const expCount = bulkExpenses.filter(e => e.bulk_income_id === inc.id).length
      + sharedExpenses.filter(se => (se.shared_expense_split || []).some(s => s.bulk_income_id === inc.id)).length;

    return (
      <div className={`person-card${isSelected ? " selected-card" : ""}`} key={inc.id}>
        <div className="person-card-header">
          <div className={`select-checkbox${isSelected ? " checked" : ""}`} onClick={() => toggleSelect(inc.id)} title="Select for shared expense">
            <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <div className="person-avatar" style={{ background: avatarColor(inc.person_name) }}>
            {inc.person_name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="person-name">{inc.person_name}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 3 }}>
              <span className="active-date-chip">
                <span className="active-date-chip-icon">📅</span>
                {fmtDate(inc.date)}
              </span>
              {inc.note && (
                <span style={{ fontSize: 10, color: "var(--text-faint)", fontStyle: "italic", alignSelf: "center" }}>
                  · {inc.note}
                </span>
              )}
            </div>
          </div>
          <span className={`badge badge-${autoStatus}`}>
            {autoStatus === "settled" ? "Settled" : autoStatus === "partial" ? "Partial" : "Pending"}
          </span>
          <button className="edit-btn" title="Edit income"
            onClick={() => setEditingIncome(isEditing ? null : { id: inc.id, person_name: inc.person_name, amount: String(inc.amount) })}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className="del-btn" onClick={() => deleteBulkIncome(inc.id)}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </button>
        </div>

        {isEditing && (
          <div className="edit-income-form">
            <div className="field-wrap edit-name-field">
              <label className="field-label">Name</label>
              <input className="bt-input" value={editingIncome.person_name} autoFocus
                onChange={e => setEditingIncome({ ...editingIncome, person_name: e.target.value })}
                onKeyDown={e => { if (e.key === "Enter") saveEditIncome(); if (e.key === "Escape") setEditingIncome(null); }} />
            </div>
            <div className="field-wrap">
              <label className="field-label">Amount (₹)</label>
              <input className="bt-input" type="number" value={editingIncome.amount}
                onChange={e => setEditingIncome({ ...editingIncome, amount: e.target.value })}
                onKeyDown={e => { if (e.key === "Enter") saveEditIncome(); if (e.key === "Escape") setEditingIncome(null); }} />
            </div>
            <div className="edit-btns-row">
              <button className="btn btn-teal btn-sm" onClick={saveEditIncome}>Save</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingIncome(null)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="person-amounts">
          <div className="amt-block">
            <div className="amt-label">Received</div>
            <div className="amt-value green">₹{fmt(inc.amount)}</div>
          </div>
          <div className="amt-block">
            <div className="amt-label">Spent</div>
            <div className={`amt-value ${totalSpent > 0 ? "red" : "zero"}`}>
              ₹{fmt(totalSpent)}
              {sharedCut > 0 && <div className="shared-cut-note">↳ ₹{fmt(sharedCut)} shared</div>}
            </div>
          </div>
          <div className="amt-block">
            <div className="amt-label">Remaining</div>
            <div className={`amt-value ${remaining > 0 ? "teal" : remaining < 0 ? "red" : "zero"}`}>₹{fmt(remaining)}</div>
          </div>
        </div>

        <div className="progress-bar-wrap">
          <div className="progress-label-row"><span>Used</span><span>{pct}%</span></div>
          <div className="progress-track-active">
            <div className="progress-fill" style={{ width: `${pct}%`, background: fillColor }} />
          </div>
        </div>

        <div style={{ padding: "10px 18px 0" }}>
          <button className="settle-btn" onClick={() => markSettled(inc.id, inc.person_name)}>✓ Mark as Settled</button>
        </div>

        <div className="add-expense-section" style={{ marginTop: 10 }}>
          <div className="add-expense-toggle"
            onClick={() => { setOpenExpForm(isOpen ? null : inc.id); setExpForm({ description: "", amount: "" }); }}>
            <span>➕ Individual Expense</span>
            <span className={`toggle-arrow${isOpen ? " open" : ""}`}>▼</span>
          </div>
          {isOpen && (
            <div className="add-exp-form">
              <div className="field-wrap">
                <label className="field-label">Description</label>
                <input className="bt-input" placeholder="e.g. Transport, Food, Hotel…" autoFocus
                  value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })}
                  onKeyDown={e => { if (e.key === "Enter") addExpense(inc.id); }} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Amount (₹)</label>
                <input className="bt-input" type="number" placeholder="0"
                  value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })}
                  onKeyDown={e => { if (e.key === "Enter") addExpense(inc.id); }} />
              </div>
              <div className="add-exp-save-row">
                <button className="btn btn-ghost btn-sm" onClick={() => setOpenExpForm(null)}>Cancel</button>
                <button className="btn btn-red btn-sm" onClick={() => addExpense(inc.id)}>Save</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "4px 18px 6px", borderBottom: "1.5px solid var(--border)" }}>
          <div className="import-expense-toggle" onClick={() => setShowImportModal(true)}>
            <span>📥 Import from File (CSV/Excel)</span>
          </div>
        </div>

        <button className="exp-history-btn" onClick={() => openPopup(inc.id, false)}>
          📋 Expense History
          <span className="badge-count">{expCount}</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--teal)" }}>View →</span>
        </button>
      </div>
    );
  };

  // ─── SETTLED CARD ───
  const renderSettledCard = (inc) => {
    const indivSpent = getIndivExp(inc.id);
    const sharedCut = getSharedCut(inc.id);
    const totalSpent = indivSpent + sharedCut;
    const remaining = inc.amount - totalSpent;
    const pct = Math.min(100, inc.amount > 0 ? Math.round((totalSpent / inc.amount) * 100) : 0);
    const isExpanded = !!settledExpanded[inc.id];
    const expCount = bulkExpenses.filter(e => e.bulk_income_id === inc.id).length
      + sharedExpenses.filter(se => (se.shared_expense_split || []).some(s => s.bulk_income_id === inc.id)).length;

    const isEditingSettledIncome = settledEditingIncome?.id === inc.id;
    const isAddingSettledExp = settledOpenExpForm === inc.id;

    const remainingColor = remaining < 0
      ? "var(--settled-amt-spent-color)"
      : remaining === 0
        ? "var(--settled-remaining-val-zero)"
        : "var(--settled-amt-received-color)";

    return (
      <div className="person-card settled-card" key={inc.id}>
        {/* ── COLLAPSED HEADER ── */}
        <div className="settled-collapsed" onClick={() => toggleSettledExpand(inc.id)}>
          <div className="settled-lock-icon">🔒</div>
          <div className="person-avatar" style={{ background: avatarColor(inc.person_name), width: 34, height: 34, fontSize: 13 }}>
            {inc.person_name.charAt(0).toUpperCase()}
          </div>
          <div className="settled-person-info">
            <div className="settled-person-name">{inc.person_name}</div>
            <div className="settled-person-meta">
              {inc.date && (
                <span className="settled-added-chip">
                  📅 Added: {fmtDate(inc.date)}
                </span>
              )}
              {inc.settled_at && (
                <span className="settled-date-chip">
                  🔒 Settled: {inc.settled_at}
                </span>
              )}
            </div>
          </div>
          <div className="settled-remaining-mini">
            <div className="settled-remaining-label">Remaining</div>
            <div className="settled-remaining-val" style={{ color: remainingColor }}>
              ₹{fmt(remaining)}
            </div>
          </div>
          <div className="settled-expand-hint">
            {isExpanded ? "Collapse" : "View"}
            <span className={`settled-expand-arrow${isExpanded ? " open" : ""}`}>▼</span>
          </div>
        </div>

        {/* ── EXPANDED BODY ── */}
        {isExpanded && (
          <div className="settled-expanded-body">
            {/* ── Banner row with edit + unsettle + delete ── */}
            <div className="settled-readonly-banner">
              🔒 Settled on {inc.settled_at} · Added on {fmtDate(inc.date)}
              <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
                {/* ✏️ Edit Income Amount button */}
                <button
                  className="edit-btn"
                  title="Edit name / received amount"
                  style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                    letterSpacing: ".06em", textTransform: "uppercase",
                    background: "var(--amber-bg)", color: "var(--amber)",
                    border: "1.5px solid rgba(180,83,9,.25)", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", transition: "all .15s",
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    setSettledEditingIncome(isEditingSettledIncome ? null : {
                      id: inc.id,
                      person_name: inc.person_name,
                      amount: String(inc.amount),
                    });
                  }}
                >
                  ✏️ Edit
                </button>
                {/* 🗑️ Delete person */}
                <button
                  style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                    letterSpacing: ".06em", textTransform: "uppercase",
                    background: "var(--red-bg)", color: "var(--red)",
                    border: "1.5px solid rgba(220,38,38,.25)", cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif", transition: "all .15s",
                  }}
                  onClick={e => { e.stopPropagation(); deleteBulkIncome(inc.id); }}
                >
                  🗑️ Delete
                </button>
                {/* ↩ Unsettle */}
                <button className="settled-unsettle-btn" onClick={e => { e.stopPropagation(); unsettle(inc.id, inc.person_name); }}>
                  ↩ Unsettle
                </button>
              </div>
            </div>

            {/* ── Edit Income form (inline) ── */}
            {isEditingSettledIncome && (
              <div className="settled-edit-income-form" onClick={e => e.stopPropagation()}>
                <div className="field-wrap edit-name-field">
                  <label className="field-label">Name</label>
                  <input className="bt-input" value={settledEditingIncome.person_name} autoFocus
                    onChange={e => setSettledEditingIncome({ ...settledEditingIncome, person_name: e.target.value })}
                    onKeyDown={e => { if (e.key === "Enter") saveSettledEditIncome(); if (e.key === "Escape") setSettledEditingIncome(null); }} />
                </div>
                <div className="field-wrap">
                  <label className="field-label">Received Amount (₹)</label>
                  <input className="bt-input" type="number" value={settledEditingIncome.amount}
                    onChange={e => setSettledEditingIncome({ ...settledEditingIncome, amount: e.target.value })}
                    onKeyDown={e => { if (e.key === "Enter") saveSettledEditIncome(); if (e.key === "Escape") setSettledEditingIncome(null); }} />
                </div>
                <div className="edit-btns-row">
                  <button className="btn btn-teal btn-sm" onClick={saveSettledEditIncome}>Save Changes</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSettledEditingIncome(null)}>Cancel</button>
                </div>
              </div>
            )}

            <div className="readonly-amounts">
              <div className="amt-block">
                <div className="amt-label" style={{ color: "var(--settled-amt-label-color)" }}>Received</div>
                <div className="amt-value green">₹{fmt(inc.amount)}</div>
              </div>
              <div className="amt-block">
                <div className="amt-label" style={{ color: "var(--settled-amt-label-color)" }}>Spent</div>
                <div className={`amt-value ${totalSpent > 0 ? "red" : "zero"}`}>
                  ₹{fmt(totalSpent)}
                  {sharedCut > 0 && <div className="shared-cut-note">↳ ₹{fmt(sharedCut)} shared</div>}
                </div>
              </div>
              <div className="amt-block">
                <div className="amt-label" style={{ color: "var(--settled-amt-label-color)" }}>Remaining</div>
                <div className="amt-value" style={{ color: remainingColor }}>₹{fmt(remaining)}</div>
              </div>
            </div>
            <div className="readonly-progress">
              <div className="progress-label-row">
                <span style={{ color: "var(--settled-remaining-label)" }}>Used</span>
                <span style={{ color: "var(--settled-remaining-label)" }}>{pct}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%`, background: "var(--settled-progress-fill)" }} />
              </div>
            </div>

            {/* ── Add expense to settled card ── */}
            <div className="settled-add-expense-section" onClick={e => e.stopPropagation()}>
              <div className="settled-add-expense-toggle"
                onClick={() => { setSettledOpenExpForm(isAddingSettledExp ? null : inc.id); setSettledExpForm({ description: "", amount: "" }); }}>
                <span>➕ Add Expense Entry</span>
                <span className={`toggle-arrow${isAddingSettledExp ? " open" : ""}`} style={{ fontSize: 10 }}>▼</span>
              </div>
              {isAddingSettledExp && (
                <div className="add-exp-form">
                  <div className="field-wrap">
                    <label className="field-label">Description</label>
                    <input className="bt-input" placeholder="e.g. Transport, Food…" autoFocus
                      value={settledExpForm.description}
                      onChange={e => setSettledExpForm({ ...settledExpForm, description: e.target.value })}
                      onKeyDown={e => { if (e.key === "Enter") addSettledExpense(inc.id); }} />
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Amount (₹)</label>
                    <input className="bt-input" type="number" placeholder="0"
                      value={settledExpForm.amount}
                      onChange={e => setSettledExpForm({ ...settledExpForm, amount: e.target.value })}
                      onKeyDown={e => { if (e.key === "Enter") addSettledExpense(inc.id); }} />
                  </div>
                  <div className="add-exp-save-row">
                    <button className="btn btn-ghost btn-sm" onClick={() => setSettledOpenExpForm(null)}>Cancel</button>
                    <button className="btn btn-red btn-sm" onClick={() => addSettledExpense(inc.id)}>Save</button>
                  </div>
                </div>
              )}
            </div>

            <button className="readonly-history-btn" onClick={() => openPopup(inc.id, false)}>
              📋 View & Edit Expense History
              <span className="readonly-badge-count">{expCount}</span>
              <span style={{ marginLeft: "auto", fontSize: 11 }}>View →</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{CSS}</style>
      <Navbar />
      <div className="bt-root">

        <div className="bt-header">
          <div className="bt-header-inner">
            <div>
              <div className="bt-eyebrow">Bulk Income Tracker</div>
              <h1 className="bt-title">Person-wise <em>Expense Tracking</em></h1>
            </div>
            <button className="btn btn-orange" onClick={() => setShowImportModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 8 }}>
              📥 Import Expenses
            </button>
          </div>
        </div>

        <div className="bt-wrap">

          <p className="section-title">Add Bulk Income</p>
          <div className="add-form-card">
            <div className="add-form-grid">
              <div className="field-wrap">
                <label className="field-label">Person Name</label>
                <input className="bt-input" placeholder="e.g. Rajan, Suresh…"
                  value={incForm.person_name} onChange={e => setIncForm({ ...incForm, person_name: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && addBulkIncome()} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Amount (₹)</label>
                <input className="bt-input" type="number" placeholder="0"
                  value={incForm.amount} onChange={e => setIncForm({ ...incForm, amount: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && addBulkIncome()} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Date</label>
                <input className="bt-input" type="date" value={incForm.date}
                  onChange={e => setIncForm({ ...incForm, date: e.target.value })} />
              </div>
              <div className="field-wrap">
                <button className="btn btn-green" style={{ height: 42 }} onClick={addBulkIncome}>+ Add</button>
              </div>
            </div>
          </div>

          <div className="summary-row">
            <div className="sum-card">
              <div className="sum-accent" style={{ background: "var(--green)" }} />
              <div className="sum-label">Total Bulk Received</div>
              <div className="sum-value green">₹{fmt(totalBulkIn)}</div>
            </div>
            <div className="sum-card">
              <div className="sum-accent" style={{ background: "var(--red)" }} />
              <div className="sum-label">Total Expenses</div>
              <div className="sum-value red">₹{fmt(totalIndivExp + totalSharedExp)}</div>
            </div>
            <div className="sum-card">
              <div className="sum-accent" style={{ background: totalRemaining >= 0 ? "var(--teal)" : "var(--red)" }} />
              <div className="sum-label">Net Remaining</div>
              <div className={`sum-value ${totalRemaining >= 0 ? "teal" : "red"}`}>₹{fmt(totalRemaining)}</div>
            </div>
          </div>

          <p className="section-title">
            Active Persons
            {selectedIds.length > 0 && (
              <span style={{ fontSize: 12, fontFamily: "DM Sans", fontWeight: 600, color: "var(--purple)", background: "var(--purple-bg)", padding: "3px 12px", borderRadius: 20, marginLeft: 8 }}>
                {selectedIds.length} selected for shared
              </span>
            )}
          </p>
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 18, marginTop: -12 }}>
            💡 Checkbox = include in shared · ✏️ edit · "Mark as Settled" to lock · Balance ₹0 = auto-settles · 📥 Import from CSV/Excel
          </p>

          {!loading && bulkIncomes.length > 0 && (
            <div className="filter-bar">
              <input className="filter-search" placeholder="🔍 Search by name or note…"
                value={searchQ} onChange={e => setSearchQ(e.target.value)} />
              <div className="filter-pills">
                {["all", "pending", "partial"].map(s => (
                  <button key={s} className={`filter-pill ${s}${filterStatus === s ? " active" : ""}`}
                    onClick={() => setFilterStatus(s)}>
                    {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="newest">↕ Newest first</option>
                <option value="balance-high">↓ Balance high→low</option>
                <option value="balance-low">↑ Balance low→high</option>
                <option value="amount-high">↓ Amount high→low</option>
                <option value="name">A→Z Name</option>
              </select>
              <span className="filter-count">{filteredActive.length} active</span>
            </div>
          )}

          {loading ? (
            <div className="loading-text">Loading…</div>
          ) : activePersons.length === 0 && settledPersons.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💼</div>
              <div className="empty-title">No bulk income added yet</div>
              <div className="empty-sub">Enter a person name and amount above to get started</div>
            </div>
          ) : filteredActive.length === 0 && activePersons.length > 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-title">No active results</div>
              <div className="empty-sub">Try a different search or filter</div>
            </div>
          ) : (
            <div className="persons-grid" style={{ marginBottom: 28 }}>
              {filteredActive.map(inc => renderActiveCard(inc))}
            </div>
          )}

          {/* SETTLED SECTION */}
          {settledPersons.length > 0 && (
            <div className="settled-section-wrap">
              <div
                className={`settled-accordion-header${showSettledSection ? " is-open" : ""}`}
                onClick={() => setShowSettledSection(v => !v)}
              >
                <span className="sah-lock">🔒</span>
                <div className="sah-info">
                  <div className="sah-title">Settled Persons</div>
                  <div className="sah-sub">
                    {showSettledSection
                      ? "Click to hide · Cards support edit & add expenses"
                      : "Click to view · Hidden for a clean workspace"}
                  </div>
                </div>
                <span className="sah-badge">{settledPersons.length}</span>
                <span className={`sah-arrow${showSettledSection ? " open" : ""}`}>▼</span>
              </div>

              {showSettledSection && (
                <div className="settled-accordion-body">
                  {filteredSettled.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-faint)", fontSize: 13, fontStyle: "italic" }}>
                      No settled persons match your current search/filter
                    </div>
                  ) : (
                    <div className="persons-grid">
                      {filteredSettled.map(inc => renderSettledCard(inc))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SHARED EXPENSE */}
          <div className="shared-section">
            <div className="shared-section-header">
              <div>
                <div className="shared-header-title">🔗 Shared Expense</div>
                <div className="shared-header-sub">Enter each person's share manually — only active (unsettled) persons can be selected</div>
              </div>
              <div className="shared-select-hint">
                {selectedIds.length === 0
                  ? "👆 Check a person's checkbox to select them"
                  : `✅ ${selectedIds.length} person${selectedIds.length > 1 ? "s" : ""} selected`}
              </div>
            </div>
            <div className="shared-body">
              <div className="selected-chips">
                {selectedPersons.length === 0 ? (
                  <span className="no-selection-hint">No person selected — check the ✅ checkbox on active cards above</span>
                ) : selectedPersons.map(inc => (
                  <div className="person-chip" key={inc.id}>
                    <div className="chip-avatar" style={{ background: avatarColor(inc.person_name) }}>
                      {inc.person_name.charAt(0).toUpperCase()}
                    </div>
                    {inc.person_name}
                    <span className="chip-balance"> · ₹{fmt(Math.max(0, getRemaining(inc)))} left</span>
                  </div>
                ))}
              </div>

              {selectedPersons.length >= 2 && (
                <>
                  <div className="shared-desc-row">
                    <div className="field-wrap">
                      <label className="field-label">Expense Description</label>
                      <input className="bt-input" placeholder="e.g. Petrol, Food, Hotel…"
                        value={sharedDesc} onChange={e => setSharedDesc(e.target.value)} />
                    </div>
                    <div className="field-wrap">
                      <label className="field-label">Date</label>
                      <input className="bt-input" type="date" value={sharedDate}
                        onChange={e => setSharedDate(e.target.value)} />
                    </div>
                    <div className="field-wrap">
                      <label className="field-label" style={{ opacity: 0 }}>-</label>
                      <button className="btn btn-purple"
                        style={{ opacity: enteredTotal === 0 || !sharedDesc.trim() ? 0.45 : 1, cursor: enteredTotal === 0 || !sharedDesc.trim() ? "not-allowed" : "pointer" }}
                        onClick={addSharedExpense}>
                        + Save Shared
                      </button>
                    </div>
                  </div>
                  <div className="manual-split-box">
                    <div className="manual-split-header">
                      <div>
                        <div className="manual-split-label">Combined Remaining Balance ({selectedPersons.length} Persons)</div>
                        <div className="manual-split-total">₹{fmt(combinedBalance)}</div>
                      </div>
                      {enteredTotal > 0 && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: "var(--purple)", fontWeight: 600, marginBottom: 4 }}>Total Entered</div>
                          <div style={{ fontFamily: "Playfair Display, serif", fontSize: 24, fontWeight: 700, color: "var(--purple)" }}>₹{fmt(enteredTotal)}</div>
                        </div>
                      )}
                    </div>
                    <div className="manual-split-rows">
                      {selectedPersons.map(inc => (
                        <div className="manual-split-row" key={inc.id}>
                          <div className="split-row-avatar" style={{ background: avatarColor(inc.person_name) }}>{inc.person_name.charAt(0).toUpperCase()}</div>
                          <div className="split-row-name">{inc.person_name}</div>
                          <div className="split-row-bal">Balance: ₹{fmt(Math.max(0, getRemaining(inc)))}</div>
                          <input className="split-row-input" type="number" placeholder="₹ amount"
                            value={manualAmounts[inc.id] || ""}
                            onChange={e => setManualAmounts(prev => ({ ...prev, [inc.id]: e.target.value }))} />
                        </div>
                      ))}
                    </div>
                    {enteredTotal > 0 && (
                      <div className="split-running">
                        <span>Total shared expense</span>
                        <strong style={{ color: "var(--purple)", fontSize: 15 }}>₹{fmt(enteredTotal)}</strong>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="shared-history-title">📋 Shared Expense History</div>
              {sharedExpenses.length === 0 ? (
                <div className="no-shared-history">No shared expenses recorded yet</div>
              ) : sharedExpenses.map(se => (
                <div className="shared-exp-card" key={se.id}>
                  <div className="shared-exp-top">
                    <div className="shared-exp-desc">{se.description}</div>
                    <div className="shared-exp-date">{se.date}</div>
                    <div className="shared-exp-total">−₹{fmt(se.total_amount)}</div>
                    <button className="del-btn" onClick={() => deleteSharedExpense(se.id)}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                    </button>
                  </div>
                  <div className="shared-exp-persons">
                    {(se.shared_expense_split || []).map(split => (
                      <div className="shared-split-pill" key={split.id}>
                        <div className="split-pill-avatar" style={{ background: avatarColor(split.person_name) }}>
                          {split.person_name.charAt(0).toUpperCase()}
                        </div>
                        {split.person_name}
                        <span className="split-pill-amount"> −₹{fmt(split.split_amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* AUTO-SETTLE TOASTS */}
      {toasts.map(t => (
        <AutoSettleToast key={t.id} name={t.name}
          onDone={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
      ))}

      {/* IMPORT TOASTS */}
      {importToasts.map(t => (
        <ImportToast key={t.id} count={t.count}
          onDone={() => setImportToasts(prev => prev.filter(x => x.id !== t.id))} />
      ))}

      <ConfirmDialog
        isOpen={dialog.isOpen} onClose={closeDialog} onConfirm={dialog.onConfirm}
        title={dialog.title} message={dialog.message} personName={dialog.personName}
        warning={dialog.warning} confirmLabel={dialog.confirmLabel} variant={dialog.variant}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        bulkIncomes={bulkIncomes}
        onImportDone={handleImportDone}
        today={today}
      />

      {/* EXPENSE HISTORY POPUP — works for both active & settled, always editable */}
      {popupPersonId && popupPerson && (
        <div className="popup-overlay" onClick={() => { setPopupPersonId(null); setEditingExpenseId(null); }}>
          <div className="popup-box" onClick={e => e.stopPropagation()}>
            <div className="popup-header">
              <div>
                <div className="popup-title">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: avatarColor(popupPerson.person_name), color: "#fff", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {popupPerson.person_name.charAt(0).toUpperCase()}
                    </span>
                    {popupPerson.person_name}
                  </span>
                </div>
                <div className="popup-subtitle">
                  Received ₹{fmt(popupPerson.amount)} · Added {fmtDate(popupPerson.date)} · {popupIndivExp.length + popupShared.length} expense entries
                </div>
                {popupPerson.is_settled && (
                  <div className="popup-readonly-badge">🔒 Settled on {popupPerson.settled_at} · Edit & delete still available</div>
                )}
              </div>
              <button className="popup-close" onClick={() => { setPopupPersonId(null); setEditingExpenseId(null); }}>✕</button>
            </div>
            <div className="popup-body">
              {popupIndivExp.length === 0 && popupShared.length === 0 ? (
                <div className="popup-empty">No expenses recorded yet</div>
              ) : (
                <>
                  {popupIndivExp.length > 0 && (
                    <>
                      <div className="popup-section-label">Individual Expenses ({popupIndivExp.length})</div>
                      {popupIndivExp.map(exp => (
                        <div key={exp.id}>
                          {editingExpenseId === exp.id ? (
                            /* ── Inline edit form ── */
                            <div className="popup-inline-edit">
                              <div className="popup-inline-edit-row">
                                <input
                                  className="bt-input"
                                  placeholder="Description"
                                  autoFocus
                                  value={editingExpenseForm.description}
                                  onChange={e => setEditingExpenseForm({ ...editingExpenseForm, description: e.target.value })}
                                  onKeyDown={e => { if (e.key === "Enter") saveEditExpense(); if (e.key === "Escape") setEditingExpenseId(null); }}
                                />
                                <input
                                  className="bt-input"
                                  type="number"
                                  placeholder="Amount"
                                  value={editingExpenseForm.amount}
                                  onChange={e => setEditingExpenseForm({ ...editingExpenseForm, amount: e.target.value })}
                                  onKeyDown={e => { if (e.key === "Enter") saveEditExpense(); if (e.key === "Escape") setEditingExpenseId(null); }}
                                />
                              </div>
                              <div className="popup-inline-edit-btns">
                                <button className="btn btn-teal btn-sm" onClick={saveEditExpense}>Save</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingExpenseId(null)}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="popup-exp-row">
                              <div className="popup-exp-icon">💸</div>
                              <div className="popup-exp-info">
                                <div className="popup-exp-desc">{exp.description}</div>
                                <div className="popup-exp-date">{exp.date}</div>
                              </div>
                              <div className="popup-exp-amt">−₹{fmt(exp.amount)}</div>
                              {/* ✏️ Edit expense button — always shown */}
                              <button
                                className="popup-edit-btn"
                                title="Edit this expense"
                                onClick={() => {
                                  setEditingExpenseId(exp.id);
                                  setEditingExpenseForm({ description: exp.description, amount: String(exp.amount) });
                                }}
                              >
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              {/* 🗑️ Delete expense button — always shown */}
                              <button className="popup-del-btn" onClick={() => deleteExpense(exp.id, exp.bulk_income_id)}>
                                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                  {popupShared.length > 0 && (
                    <>
                      <div className="popup-section-label">Shared Expenses — My Share ({popupShared.length})</div>
                      {popupShared.map(se => (
                        <div className="popup-shared-row" key={se.id}>
                          <div className="popup-shared-icon">🔗</div>
                          <div className="popup-exp-info">
                            <div className="popup-exp-desc">{se.description}</div>
                            <div className="popup-exp-date">{se.date} · Total: ₹{fmt(se.total_amount)} · With: {se.persons}</div>
                          </div>
                          <div className="popup-shared-amt">−₹{fmt(popupSharedCut(se.id))}</div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}