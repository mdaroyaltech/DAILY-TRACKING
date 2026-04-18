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
  --shadow-sm:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);
  --shadow:0 4px 16px rgba(0,0,0,.07),0 1px 4px rgba(0,0,0,.04);
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

/* ACTIVE CARD */
.person-card{background:var(--surface);border:1.5px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-sm);transition:box-shadow .2s,transform .2s;}
.person-card:hover{box-shadow:var(--shadow);transform:translateY(-2px);}
.person-card.selected-card{border-color:var(--purple);box-shadow:0 0 0 3px rgba(124,58,237,.15),var(--shadow);}
.person-card-header{padding:16px 18px;border-bottom:1.5px solid var(--border);display:flex;align-items:center;gap:10px;}
.person-avatar{width:38px;height:38px;border-radius:50%;color:#fff;font-family:'Playfair Display',serif;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.person-name{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:var(--text);flex:1;line-height:1.2;}
.person-date{font-size:11px;color:var(--text-faint);margin-top:2px;}
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
   SETTLED SECTION — collapsed accordion, hidden by default
   ════════════════════════════════════════════════════ */
.settled-section-wrap{margin:24px 0 28px;}

.settled-accordion-header{
  display:flex;align-items:center;gap:14px;
  padding:16px 22px;
  background:var(--surface);
  border:1.5px solid rgba(22,163,74,.3);
  border-radius:14px;
  cursor:pointer;user-select:none;
  transition:background .18s,border-color .18s,border-radius .18s;
  box-shadow:var(--shadow-sm);
}
.settled-accordion-header:hover{
  background:var(--green-bg);
  border-color:rgba(22,163,74,.5);
}
.settled-accordion-header.is-open{
  border-radius:14px 14px 0 0;
  border-bottom-color:transparent;
  background:var(--green-bg);
}
.sah-lock{font-size:20px;flex-shrink:0;}
.sah-info{flex:1;min-width:0;}
.sah-title{font-family:'Playfair Display',serif;font-size:15px;font-weight:700;color:var(--text-med);}
.sah-sub{font-size:11px;color:var(--text-faint);margin-top:2px;letter-spacing:0;font-weight:400;}
.sah-badge{
  background:var(--green);color:#fff;
  border-radius:20px;padding:4px 14px;
  font-size:12px;font-weight:700;flex-shrink:0;
}
.sah-arrow{
  font-size:12px;color:var(--green);flex-shrink:0;
  transition:transform .25s cubic-bezier(.4,0,.2,1);
}
.sah-arrow.open{transform:rotate(180deg);}

.settled-accordion-body{
  border:1.5px solid rgba(22,163,74,.3);
  border-top:none;
  border-radius:0 0 14px 14px;
  background:rgba(240,253,244,.55);
  padding:20px;
  animation:accordionDown .22s ease;
}
@keyframes accordionDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}

/* SETTLED CARD */
.settled-card{
  background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);
  border:1.5px solid rgba(22,163,74,.22) !important;
  opacity:.88;
  box-shadow:none !important;
  transform:none !important;
}
.settled-card:hover{opacity:1 !important;box-shadow:0 2px 10px rgba(22,163,74,.14) !important;}

.settled-collapsed{
  display:flex;align-items:center;padding:14px 18px;gap:12px;flex-wrap:wrap;
  cursor:pointer;transition:background .15s;
}
.settled-collapsed:hover{background:rgba(22,163,74,.05);}
.settled-lock-icon{font-size:15px;flex-shrink:0;}
.settled-person-info{flex:1;min-width:0;}
.settled-person-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:var(--text-med);}
.settled-person-meta{font-size:11px;color:var(--text-faint);margin-top:2px;}
.settled-expand-hint{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--green);display:flex;align-items:center;gap:4px;flex-shrink:0;padding:5px 12px;border-radius:20px;background:var(--green-bg);border:1px solid rgba(22,163,74,.2);}
.settled-expand-arrow{font-size:9px;transition:transform .2s;}
.settled-expand-arrow.open{transform:rotate(180deg);}
.settled-remaining-mini{text-align:right;}
.settled-remaining-label{font-size:10px;color:var(--text-faint);font-weight:600;text-transform:uppercase;letter-spacing:.06em;}
.settled-remaining-val{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;}

.settled-expanded-body{border-top:1.5px solid rgba(22,163,74,.18);background:rgba(240,253,244,.5);}
.settled-readonly-banner{display:flex;align-items:center;gap:8px;padding:10px 18px;background:rgba(22,163,74,.07);border-bottom:1px solid rgba(22,163,74,.13);font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--green);}
.settled-unsettle-btn{margin-left:auto;padding:4px 12px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;background:var(--red-bg);color:var(--red);border:1px solid rgba(220,38,38,.2);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;}
.settled-unsettle-btn:hover{background:var(--red);color:#fff;}
.readonly-amounts{display:grid;grid-template-columns:repeat(3,1fr);padding:12px 18px;gap:8px;border-bottom:1.5px solid rgba(22,163,74,.13);}
.readonly-progress{padding:10px 18px 12px;}
.progress-track{height:5px;background:rgba(22,163,74,.13);border-radius:99px;overflow:hidden;}
.readonly-history-btn{display:flex;align-items:center;gap:6px;padding:10px 18px 12px;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--green);cursor:pointer;background:none;border:none;font-family:'DM Sans',sans-serif;transition:color .15s;width:100%;}
.readonly-history-btn:hover{color:var(--teal);}
.readonly-badge-count{background:var(--green-bg);border:1px solid rgba(22,163,74,.2);border-radius:20px;padding:1px 8px;font-size:10px;color:var(--green);margin-left:2px;}

/* AUTO-SETTLE TOAST */
.auto-settle-toast{position:fixed;bottom:24px;right:24px;z-index:3000;background:var(--green);color:#fff;padding:14px 20px;border-radius:12px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(22,163,74,.4);display:flex;align-items:center;gap:10px;animation:toastIn .3s cubic-bezier(.34,1.56,.64,1);max-width:320px;}
@keyframes toastIn{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}
.auto-settle-toast.out{animation:toastOut .25s ease forwards;}
@keyframes toastOut{to{transform:translateY(20px);opacity:0}}

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
.popup-shared-row{display:flex;align-items:center;padding:12px 24px;gap:12px;border-bottom:1px solid var(--border);background:#faf5ff;}
.popup-shared-icon{width:32px;height:32px;border-radius:8px;background:var(--purple-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;}
.popup-shared-amt{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--purple);white-space:nowrap;}

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

  // Settled section: ALWAYS starts collapsed (false), user must click to open
  const [showSettledSection, setShowSettledSection] = useState(false);
  // Which settled cards are expanded inside the section
  const [settledExpanded, setSettledExpanded] = useState({});

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

  // Auto-settle: silently moves card to settled section when balance hits 0
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

  const toggleSelect = (id) => {
    const inc = bulkIncomes.find(i => i.id === id);
    if (inc?.is_settled) return;
    setManualAmounts({});
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const openPopup = (personId, readonly = false) => { setPopupPersonId(personId); setPopupIsReadonly(readonly); };

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
            <div className="person-date">{inc.date}{inc.note ? ` · ${inc.note}` : ""}</div>
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

        <button className="exp-history-btn" onClick={() => openPopup(inc.id, false)}>
          📋 Expense History
          <span className="badge-count">{expCount}</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--teal)" }}>View →</span>
        </button>
      </div>
    );
  };

  // ─── SETTLED CARD (read-only, expandable) ───
  const renderSettledCard = (inc) => {
    const indivSpent = getIndivExp(inc.id);
    const sharedCut = getSharedCut(inc.id);
    const totalSpent = indivSpent + sharedCut;
    const remaining = inc.amount - totalSpent;
    const pct = Math.min(100, inc.amount > 0 ? Math.round((totalSpent / inc.amount) * 100) : 0);
    const isExpanded = !!settledExpanded[inc.id];
    const expCount = bulkExpenses.filter(e => e.bulk_income_id === inc.id).length
      + sharedExpenses.filter(se => (se.shared_expense_split || []).some(s => s.bulk_income_id === inc.id)).length;

    return (
      <div className="person-card settled-card" key={inc.id}>
        {/* collapsed header row */}
        <div className="settled-collapsed" onClick={() => toggleSettledExpand(inc.id)}>
          <div className="settled-lock-icon">🔒</div>
          <div className="person-avatar" style={{ background: avatarColor(inc.person_name), width: 32, height: 32, fontSize: 13 }}>
            {inc.person_name.charAt(0).toUpperCase()}
          </div>
          <div className="settled-person-info">
            <div className="settled-person-name">{inc.person_name}</div>
            <div className="settled-person-meta">Settled {inc.settled_at} · ₹{fmt(inc.amount)} received</div>
          </div>
          <div className="settled-remaining-mini">
            <div className="settled-remaining-label">Remaining</div>
            <div className="settled-remaining-val" style={{ color: remaining < 0 ? "var(--red)" : remaining === 0 ? "var(--text-faint)" : "var(--green)" }}>
              ₹{fmt(remaining)}
            </div>
          </div>
          <div className="settled-expand-hint">
            {isExpanded ? "Collapse" : "View"}
            <span className={`settled-expand-arrow${isExpanded ? " open" : ""}`}>▼</span>
          </div>
        </div>

        {/* expanded read-only body */}
        {isExpanded && (
          <div className="settled-expanded-body">
            <div className="settled-readonly-banner">
              🔒 Read-only — settled on {inc.settled_at}
              <button className="settled-unsettle-btn" onClick={e => { e.stopPropagation(); unsettle(inc.id, inc.person_name); }}>
                ↩ Unsettle
              </button>
            </div>
            <div className="readonly-amounts">
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
            <div className="readonly-progress">
              <div className="progress-label-row"><span>Used</span><span>{pct}%</span></div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%`, background: "var(--green)" }} />
              </div>
            </div>
            <button className="readonly-history-btn" onClick={() => openPopup(inc.id, true)}>
              📋 View Expense History
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
            💡 Checkbox = include in shared · ✏️ edit · "Mark as Settled" to lock · Balance ₹0 = auto-settles
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

          {/* ═══════════════════════════════════════════════
              SETTLED SECTION
              - Always starts collapsed (showSettledSection=false)
              - Only shows when user clicks the accordion header
              - Cards inside are also individually collapsible (read-only)
              ═══════════════════════════════════════════════ */}
          {settledPersons.length > 0 && (
            <div className="settled-section-wrap">
              {/* Accordion header — click to toggle */}
              <div
                className={`settled-accordion-header${showSettledSection ? " is-open" : ""}`}
                onClick={() => setShowSettledSection(v => !v)}
              >
                <span className="sah-lock">🔒</span>
                <div className="sah-info">
                  <div className="sah-title">Settled Persons</div>
                  <div className="sah-sub">
                    {showSettledSection
                      ? "Click to hide · All cards are read-only"
                      : "Click to view · Hidden for a clean workspace"}
                  </div>
                </div>
                <span className="sah-badge">{settledPersons.length}</span>
                <span className={`sah-arrow${showSettledSection ? " open" : ""}`}>▼</span>
              </div>

              {/* Accordion body — only rendered when open */}
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

      <ConfirmDialog
        isOpen={dialog.isOpen} onClose={closeDialog} onConfirm={dialog.onConfirm}
        title={dialog.title} message={dialog.message} personName={dialog.personName}
        warning={dialog.warning} confirmLabel={dialog.confirmLabel} variant={dialog.variant}
      />

      {/* EXPENSE HISTORY POPUP */}
      {popupPersonId && popupPerson && (
        <div className="popup-overlay" onClick={() => setPopupPersonId(null)}>
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
                  Received ₹{fmt(popupPerson.amount)} · {popupIndivExp.length + popupShared.length} expense entries
                </div>
                {popupIsReadonly && (
                  <div className="popup-readonly-badge">🔒 Read-only — settled on {popupPerson.settled_at}</div>
                )}
              </div>
              <button className="popup-close" onClick={() => setPopupPersonId(null)}>✕</button>
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
                        <div className="popup-exp-row" key={exp.id}>
                          <div className="popup-exp-icon">💸</div>
                          <div className="popup-exp-info">
                            <div className="popup-exp-desc">{exp.description}</div>
                            <div className="popup-exp-date">{exp.date}</div>
                          </div>
                          <div className="popup-exp-amt">−₹{fmt(exp.amount)}</div>
                          {!popupIsReadonly && (
                            <button className="popup-del-btn" onClick={() => deleteExpense(exp.id, exp.bulk_income_id)}>
                              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                            </button>
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