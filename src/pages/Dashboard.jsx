import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useFinanceSummary } from "../hooks/useFinanceSummary";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

/* ── STYLES ───────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

:root {
  --bg:        #f5f2ed;
  --bg2:       #ede9e2;
  --surface:   #ffffff;
  --surface2:  #faf8f5;
  --border:    #e2dcd4;
  --border2:   #d0c9be;
  --text:      #1c1a17;
  --text-med:  #5a5449;
  --text-dim:  #9a9187;
  --text-faint:#c4bdb4;
  --teal:      #0d9488;
  --teal-light:#e0f2f0;
  --teal-mid:  #99d6d0;
  --green:     #16a34a;
  --green-bg:  #dcfce7;
  --red:       #dc2626;
  --red-bg:    #fee2e2;
  --amber:     #b45309;
  --amber-bg:  #fef3c7;
  --blue:      #1d4ed8;
  --blue-bg:   #dbeafe;
  --purple:    #7c3aed;
  --purple-bg: #ede9fe;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow:    0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

.db-root {
  min-height: 100vh;
  background: var(--bg);
  font-family: 'DM Sans', sans-serif;
  color: var(--text);
  padding-bottom: 80px;
}

/* ── ANIMATIONS ── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; } to { opacity: 1; }
}
@keyframes popIn {
  0%   { opacity: 0; transform: scale(0.85); }
  65%  { transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes slideRight {
  from { opacity: 0; transform: translateX(-16px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes rowSlide {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes badgePop {
  0%   { opacity: 0; transform: scale(0.5) rotate(-10deg); }
  70%  { transform: scale(1.15) rotate(2deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}

.db-header    { animation: fadeIn .45s ease both; }
.db-wrap > .section-title { animation: slideRight .4s ease both; }

.stats-grid   { animation: fadeUp .5s .08s ease both; }
.stats-grid-4 { animation: fadeUp .5s .16s ease both; }

.stat-card { animation: popIn .4s ease both; }
.stat-card:nth-child(1) { animation-delay: .04s; }
.stat-card:nth-child(2) { animation-delay: .10s; }
.stat-card:nth-child(3) { animation-delay: .16s; }
.stat-card:nth-child(4) { animation-delay: .22s; }
.stat-value { animation: fadeUp .35s .3s ease both; }

.forms-tabs  { animation: fadeUp .45s .25s ease both; }
.form-panel  { animation: fadeUp .35s ease both; }
.chart-card  { animation: fadeUp .5s .3s ease both; }
.table-card  { animation: fadeUp .5s .35s ease both; }

/* table row stagger */
.db-table tbody tr { animation: rowSlide .3s ease both; }
.db-table tbody tr:nth-child(1)  { animation-delay: .03s; }
.db-table tbody tr:nth-child(2)  { animation-delay: .07s; }
.db-table tbody tr:nth-child(3)  { animation-delay: .11s; }
.db-table tbody tr:nth-child(4)  { animation-delay: .15s; }
.db-table tbody tr:nth-child(5)  { animation-delay: .19s; }
.db-table tbody tr:nth-child(6)  { animation-delay: .23s; }
.db-table tbody tr:nth-child(7)  { animation-delay: .27s; }
.db-table tbody tr:nth-child(8)  { animation-delay: .31s; }
.db-table tbody tr:nth-child(9)  { animation-delay: .35s; }
.db-table tbody tr:nth-child(10) { animation-delay: .39s; }

/* stat card hover pulse */
.stat-card:hover .stat-value { transform: scale(1.04); transition: transform .15s; }

/* tab active dot */
.forms-tab.active::after {
  content: '';
  display: inline-block;
  width: 5px; height: 5px;
  background: var(--teal);
  border-radius: 50%;
  margin-left: 6px;
  vertical-align: middle;
  animation: popIn .3s ease;
}

/* ── GROUPED ROW ── */
.row-grouped td {
  background: linear-gradient(90deg, #f0fdf4, #f5f2ed) !important;
  border-left: 3px solid var(--green) !important;
}
.row-grouped:hover td { background: #dcfce7 !important; }
.row-grouped td:first-child { border-left: 3px solid var(--green) !important; }

/* ── MULTIPLIER BADGE ── */
.multi-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #059669, #0d9488);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .03em;
  padding: 2px 7px;
  border-radius: 10px;
  margin-left: 6px;
  box-shadow: 0 2px 8px rgba(13,148,136,0.4);
  animation: badgePop .4s cubic-bezier(.22,1,.36,1) both;
  vertical-align: middle;
}

/* grouped total shimmer effect */
.grouped-total {
  background: linear-gradient(90deg, var(--green) 0%, #34d399 50%, var(--green) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 2.5s linear infinite;
  font-weight: 800 !important;
}

/* ── HEADER ── */
.db-header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 28px 0 22px;
  margin-bottom: 28px;
  box-shadow: var(--shadow-sm);
}
.db-header-inner {
  max-width: 1100px; margin: auto; padding: 0 24px;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
}
.db-eyebrow {
  font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--teal); margin-bottom: 5px; display: flex; align-items: center; gap: 7px;
}
.db-eyebrow::before { content:''; display:inline-block; width:18px; height:2px; background:var(--teal); border-radius:2px; }
.db-title { font-family:'Playfair Display',serif; font-size:clamp(22px,3vw,34px); font-weight:900; line-height:1.1; color:var(--text); }
.db-title em { font-style:italic; color:var(--teal); }
.db-date { font-size:12px; font-weight:500; color:var(--text-dim); letter-spacing:.05em; padding:7px 15px; border:1.5px solid var(--border2); border-radius:20px; background:var(--bg2); white-space:nowrap; }

/* ── LAYOUT ── */
.db-wrap { max-width:1100px; margin:auto; padding:0 24px; }
@media(max-width:480px){ .db-wrap{padding:0 14px;} }

/* ── SECTION TITLE ── */
.section-title {
  font-family:'Playfair Display',serif; font-size:17px; font-weight:700; color:var(--text);
  margin-bottom:14px; display:flex; align-items:center; gap:10px;
}
.section-title::after { content:''; flex:1; height:1.5px; background:var(--border); border-radius:2px; }

/* ── STAT CARDS ── */
.stats-grid   { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:12px; }
.stats-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:32px; }
@media(max-width:640px){ .stats-grid{grid-template-columns:1fr 1fr;} }
@media(max-width:380px){ .stats-grid{grid-template-columns:1fr;} }
@media(max-width:700px){ .stats-grid-4{grid-template-columns:repeat(2,1fr);} }

.stat-card { background:var(--surface); border:1.5px solid var(--border); border-radius:12px; padding:18px 20px; position:relative; overflow:hidden; box-shadow:var(--shadow-sm); transition:transform .2s,box-shadow .2s; }
.stat-card:hover { transform:translateY(-2px); box-shadow:var(--shadow); }
.stat-card-accent { position:absolute; top:0; left:0; right:0; height:3px; border-radius:12px 12px 0 0; }
.accent-green { background:var(--green); }
.accent-red   { background:var(--red); }
.accent-teal  { background:var(--teal); }
.accent-amber { background:var(--amber); }
.accent-blue  { background:var(--blue); }
.accent-purple{ background:var(--purple); }
.stat-icon-bg { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:16px; margin-bottom:12px; }
.stat-label { font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); margin-bottom:5px; }
.stat-value { font-family:'Playfair Display',serif; font-size:28px; font-weight:700; line-height:1; }
.stat-value.sm { font-size:22px; }
.stat-value.green  { color:var(--green); }
.stat-value.red    { color:var(--red); }
.stat-value.teal   { color:var(--teal); }
.stat-value.amber  { color:var(--amber); }
.stat-value.blue   { color:var(--blue); }
.stat-value.purple { color:var(--purple); }

/* ── FORMS TABS ── */
.forms-tabs {
  display:flex; background:var(--surface); border:1.5px solid var(--border);
  border-radius:12px 12px 0 0; overflow:hidden; margin-bottom:0;
}
.forms-tab {
  flex:1; padding:12px 8px; font-size:11px; font-weight:600; letter-spacing:.08em;
  text-transform:uppercase; text-align:center; cursor:pointer;
  border:none; font-family:'DM Sans',sans-serif; color:var(--text-dim);
  background:transparent; transition:all .18s;
  border-right:1.5px solid var(--border);
}
.forms-tab:last-child { border-right:none; }
.forms-tab.active { background:var(--teal-light); color:var(--teal); }
.forms-tab:hover:not(.active) { color:var(--text-med); background:var(--surface2); }
@media(max-width:480px){ .forms-tab{font-size:10px; padding:10px 4px;} }

.form-panel {
  background:var(--surface); border:1.5px solid var(--border); border-top:none;
  border-radius:0 0 12px 12px; padding:22px; margin-bottom:32px;
}
@media(max-width:480px){ .form-panel{padding:16px;} }

/* ── INCOME MODE TOGGLE ── */
.income-mode-row {
  display:flex; gap:0; background:var(--bg2); border:1.5px solid var(--border);
  border-radius:8px; overflow:hidden; margin-bottom:16px; width:fit-content;
}
.income-mode-btn {
  padding:7px 18px; font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase;
  cursor:pointer; border:none; font-family:'DM Sans',sans-serif;
  color:var(--text-dim); background:transparent; transition:all .18s;
}
.income-mode-btn.active { background:var(--teal); color:#fff; }
.income-mode-btn:hover:not(.active) { color:var(--text-med); }

/* ── FIELDS ── */
.field-wrap { margin-bottom:12px; }
.field-label { display:block; font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--text-med); margin-bottom:5px; }

.db-input, .db-select {
  width:100%; background:var(--bg2); border:1.5px solid var(--border); border-radius:8px;
  padding:10px 13px; font-size:14px; font-family:'DM Sans',sans-serif;
  color:var(--text); outline:none;
  transition:border-color .2s, background .2s, box-shadow .2s;
  appearance:none; -webkit-appearance:none;
}
.db-input::placeholder { color:var(--text-faint); }
.db-input:focus, .db-select:focus { border-color:var(--teal); background:var(--surface); box-shadow:0 0 0 3px rgba(13,148,136,0.1); }
.db-select option { color:var(--text); }

.qty-rate-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.qty-rate-row .field-wrap { margin-bottom:0; }

.auto-amount-box {
  background:var(--teal-light); border:1.5px solid var(--teal-mid);
  border-radius:8px; padding:10px 14px;
  display:flex; align-items:center; justify-content:space-between; margin:12px 0;
}
.auto-amount-label { font-size:10px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--teal); }
.auto-amount-value { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; color:var(--teal); }

.db-input-readonly {
  background:var(--teal-light); border-color:var(--teal-mid); color:var(--teal);
  font-family:'Playfair Display',serif; font-size:18px; font-weight:700; cursor:not-allowed;
}

/* ── BUTTONS ── */
.btn { width:100%; padding:12px; border:none; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; transition:all .18s; margin-top:4px; }
.btn:hover { opacity:.88; transform:translateY(-1px); box-shadow:var(--shadow); }
.btn:active { transform:translateY(0); box-shadow:none; }
.btn-teal  { background:var(--teal); color:#fff; }
.btn-green { background:var(--green); color:#fff; }
.btn-red   { background:var(--red); color:#fff; }
.btn-ghost { background:transparent; color:var(--red); border:1.5px solid rgba(220,38,38,0.3); margin-top:8px; }
.btn-ghost:hover { background:var(--red-bg); }
.btn:disabled { opacity:.35; cursor:not-allowed; transform:none !important; }

/* ── MANAGE OPTIONS ── */
.manage-opts-btn { display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--teal); background:none; border:none; cursor:pointer; padding:0; font-family:'DM Sans',sans-serif; margin-bottom:10px; transition:opacity .15s; }
.manage-opts-btn:hover { opacity:.7; }
.manage-opts-panel { background:var(--bg2); border:1.5px solid var(--border); border-radius:10px; padding:14px; margin-bottom:12px; }
.manage-opts-list { display:flex; flex-wrap:wrap; gap:7px; margin-bottom:12px; }
.opt-pill { display:flex; align-items:center; gap:5px; background:var(--surface); border:1.5px solid var(--border); border-radius:20px; padding:4px 10px 4px 12px; font-size:11px; font-weight:600; color:var(--text-med); }
.opt-pill-del { background:none; border:none; cursor:pointer; padding:2px; border-radius:50%; color:var(--text-faint); display:flex; transition:all .15s; }
.opt-pill-del:hover { color:var(--red); background:var(--red-bg); }

.svc-add-row { display:grid; grid-template-columns:1fr 80px auto; gap:7px; align-items:center; }
@media(max-width:400px){ .svc-add-row{grid-template-columns:1fr 65px auto;} }
.manage-opts-input { background:var(--surface); border:1.5px solid var(--border); border-radius:8px; padding:8px 11px; font-size:13px; font-family:'DM Sans',sans-serif; color:var(--text); outline:none; transition:border-color .2s; width:100%; }
.manage-opts-input:focus { border-color:var(--teal); }
.manage-opts-save { padding:8px 12px; background:var(--teal); color:#fff; border:none; border-radius:8px; font-size:11px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; white-space:nowrap; transition:opacity .15s; }
.manage-opts-save:hover { opacity:.85; }
.manage-opts-save:disabled { opacity:.4; cursor:not-allowed; }

.opt-pill-rate { font-size:9px; font-weight:600; color:var(--green); background:var(--green-bg); padding:1px 6px; border-radius:6px; margin-left:2px; }
.opt-pill-edit-btn { background:none; border:none; cursor:pointer; padding:2px 4px; border-radius:4px; color:var(--text-faint); display:flex; align-items:center; transition:all .15s; }
.opt-pill-edit-btn:hover { color:var(--teal); background:var(--teal-light); }
.opt-pill-editing { border-color:var(--teal) !important; background:var(--teal-light) !important; flex-wrap:wrap; gap:6px 8px; }
.opt-pill-edit-inputs { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.opt-pill-input { background:var(--surface); border:1.5px solid var(--teal-mid); border-radius:5px; padding:3px 7px; font-size:11px; font-family:'DM Sans',sans-serif; color:var(--text); outline:none; }
.opt-pill-input:focus { border-color:var(--teal); }
.opt-pill-input.name-input { width:110px; }
.opt-pill-input.rate-input { width:65px; }
.opt-pill-save { background:var(--teal); color:#fff; border:none; border-radius:5px; padding:3px 9px; font-size:10px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; white-space:nowrap; }
.opt-pill-cancel { background:var(--bg2); color:var(--text-dim); border:1.5px solid var(--border); border-radius:5px; padding:3px 7px; font-size:10px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; }

/* ── CHART ── */
.chart-card { background:var(--surface); border:1.5px solid var(--border); border-radius:12px; padding:24px; margin-bottom:32px; box-shadow:var(--shadow-sm); }
.chart-toggle { display:flex; gap:0; background:var(--bg2); border:1.5px solid var(--border); border-radius:8px; overflow:hidden; width:fit-content; margin-bottom:18px; }
.toggle-btn { padding:7px 20px; font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; border:none; font-family:'DM Sans',sans-serif; color:var(--text-dim); background:transparent; transition:all .18s; }
.toggle-btn.active { background:var(--teal); color:#fff; }
.toggle-btn:hover:not(.active) { color:var(--text-med); }
.chart-result-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:18px; padding-top:18px; border-top:1.5px solid var(--border); }
@media(max-width:480px){ .chart-result-row{grid-template-columns:1fr;} }
.result-box { text-align:center; padding:14px; border-radius:10px; border:1.5px solid var(--border); background:var(--surface2); }
.result-label { font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); margin-bottom:6px; }
.result-value { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; }
.result-value.profit { color:var(--green); }
.result-value.loss   { color:var(--red); }

/* ── TABLES ── */
.table-card { background:var(--surface); border:1.5px solid var(--border); border-radius:12px; padding:22px; margin-bottom:20px; box-shadow:var(--shadow-sm); overflow-x:auto; }
.table-scroll-hint { display:none; font-size:10px; color:var(--text-dim); margin-bottom:8px; text-align:center; letter-spacing:.05em; }
@media(max-width:580px){ .table-scroll-hint{display:block;} }
.db-table { width:100%; border-collapse:collapse; font-size:13px; min-width:480px; }
.db-table th { font-size:9px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--text-dim); padding:9px 12px; text-align:left; background:var(--bg2); border-bottom:1.5px solid var(--border); white-space:nowrap; }
.db-table th:first-child { border-radius:7px 0 0 7px; }
.db-table th:last-child  { border-radius:0 7px 7px 0; }
.db-table th.right  { text-align:right; }
.db-table th.center { text-align:center; }
.db-table td { padding:12px; border-bottom:1px solid var(--border); color:var(--text); vertical-align:middle; }
.db-table td.right  { text-align:right; }
.db-table td.center { text-align:center; }
.db-table tr:last-child td { border-bottom:none; }
.db-table tr:hover td { background:var(--surface2); }
.row-pending td { background:#fffbeb !important; }
.row-pending:hover td { background:#fef9d0 !important; }

.badge { display:inline-flex; align-items:center; padding:3px 9px; border-radius:12px; font-size:10px; font-weight:600; letter-spacing:.05em; }
.badge-income  { background:var(--green-bg); color:var(--green); }
.badge-expense { background:var(--red-bg);   color:var(--red); }
.badge-home    { background:var(--teal-light); color:var(--teal); }
.badge-manual  { background:var(--purple-bg); color:var(--purple); }

.edit-input { background:var(--bg2); border:1.5px solid var(--teal); border-radius:6px; padding:5px 8px; width:90px; text-align:right; color:var(--text); font-size:13px; font-family:'DM Sans',sans-serif; outline:none; box-shadow:0 0 0 3px rgba(13,148,136,0.1); }
.edit-trigger { display:inline-flex; align-items:center; gap:5px; cursor:pointer; color:var(--text); font-weight:500; }
.edit-trigger:hover { color:var(--teal); }
.edit-icon { width:12px; height:12px; color:var(--text-dim); }
.edit-trigger:hover .edit-icon { color:var(--teal); }

.del-btn { background:none; border:none; cursor:pointer; padding:6px; border-radius:6px; color:var(--text-faint); transition:all .18s; display:inline-flex; }
.del-btn:hover { color:var(--red); background:var(--red-bg); }

.loading-text, .empty-text { text-align:center; color:var(--text-dim); padding:36px; font-size:13px; letter-spacing:.04em; }

/* ── WHATSAPP COPY BUTTON ── */
.wa-copy-btn {
  display:inline-flex; align-items:center; gap:8px;
  background:linear-gradient(135deg,#25d366,#128c7e);
  color:#fff; border:none; border-radius:10px;
  padding:10px 18px; font-family:'DM Sans',sans-serif;
  font-size:12px; font-weight:600; letter-spacing:.08em; text-transform:uppercase;
  cursor:pointer; transition:all .2s; box-shadow:0 2px 10px rgba(37,211,102,0.35);
}
.wa-copy-btn:hover { opacity:.88; transform:translateY(-1px); box-shadow:0 4px 16px rgba(37,211,102,0.4); }
.wa-copy-btn:active { transform:translateY(0); }
.wa-copy-btn.copied { background:linear-gradient(135deg,#16a34a,#0d9488); }
.wa-btn-row { display:flex; justify-content:flex-end; margin-bottom:12px; }

/* ── TABLE TOTALS FOOTER ── */
.table-totals-row td {
  background:var(--bg2) !important;
  border-top:2px solid var(--border2) !important;
  font-weight:700 !important; font-size:13px !important;
  padding:12px !important;
}
.totals-label { font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); }

/* ── MOBILE ── */
@media(max-width:640px){
  .db-header { padding:16px 0 12px; margin-bottom:18px; }
  .stat-card { padding:14px 16px; }
  .stat-value { font-size:22px !important; }
  .stat-value.sm { font-size:18px !important; }
  .stat-icon-bg { width:30px; height:30px; font-size:14px; margin-bottom:8px; }
  .chart-card { padding:16px; }
  .table-card { padding:14px; }
}
`;

/* ═══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [chartType, setChartType] = useState("daily");
  const [chartData, setChartData] = useState([]);
  const [activeForm, setActiveForm] = useState("income");

  const { totalIncome, totalExpense, balance, weeklyBalance } =
    useFinanceSummary(incomes, expenses, today);



  /* ── SERVICE OPTIONS ── */
  const [serviceOptions, setServiceOptions] = useState([]);
  const [showManageSvc, setShowManageSvc] = useState(false);
  const [newSvcName, setNewSvcName] = useState("");
  const [newSvcRate, setNewSvcRate] = useState("");
  const [svcLoading, setSvcLoading] = useState(false);
  const [editingSvcId, setEditingSvcId] = useState(null);
  const [editSvcName, setEditSvcName] = useState("");
  const [editSvcRate, setEditSvcRate] = useState("");

  const fetchServices = async () => {
    const { data, error } = await supabase.from("service_options").select("*").order("created_at", { ascending: true });
    if (error) { console.error("fetchServices:", error.message); return; }
    setServiceOptions(data || []);
  };

  const addService = async () => {
    const name = newSvcName.trim();
    const rate = Number(newSvcRate);
    if (!name || !rate || rate <= 0) return;
    if (serviceOptions.find(o => o.name.toLowerCase() === name.toLowerCase())) { alert("Service already exists!"); return; }
    setSvcLoading(true);
    const { error } = await supabase.from("service_options").insert([{ name, rate_per_qty: rate }]);
    if (error) { alert(error.message); setSvcLoading(false); return; }
    setNewSvcName(""); setNewSvcRate("");
    await fetchServices(); setSvcLoading(false);
  };

  const removeService = async (opt) => {
    if (!window.confirm(`Remove "${opt.name}"?`)) return;
    setSvcLoading(true);
    const { error } = await supabase.from("service_options").delete().eq("id", opt.id);
    if (error) { alert("Delete failed: " + error.message); setSvcLoading(false); return; }
    setServiceOptions(prev => prev.filter(s => s.id !== opt.id));
    await fetchServices(); setSvcLoading(false);
  };

  const updateService = async (opt) => {
    const name = editSvcName.trim();
    const rate = Number(editSvcRate);
    if (!name || !rate || rate <= 0) return;
    setSvcLoading(true);
    const { error } = await supabase.from("service_options").update({ name, rate_per_qty: rate }).eq("id", opt.id);
    if (error) { alert("Update failed: " + error.message); setSvcLoading(false); return; }
    if (selectedService === opt.name) { setSelectedService(name); setRatePerQty(String(rate)); }
    setEditingSvcId(null);
    await fetchServices(); setSvcLoading(false);
  };

  /* ── PAID-TO OPTIONS ── */
  const DEFAULT_PAID_TO = ["PACHAIYAPPAN FIN", "SAI FIN", "SOTTA FIN", "SPF FIN", "BHAVANI FIN", "JANA SETTIYAR"];
  const [paidToOptions, setPaidToOptions] = useState([]);
  const [showManageOpts, setShowManageOpts] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");
  const [optLoading, setOptLoading] = useState(false);
  const [customPaidTo, setCustomPaidTo] = useState("");

  const fetchOptions = async () => {
    const { data, error } = await supabase.from("paid_to_options").select("*").order("created_at", { ascending: true });
    if (error || !data || data.length === 0) { setPaidToOptions(DEFAULT_PAID_TO.map(n => ({ name: n }))); }
    else { setPaidToOptions(data); }
  };

  const addOption = async () => {
    const name = newOptionName.trim().toUpperCase();
    if (!name) return;
    if (paidToOptions.find(o => o.name === name)) { alert("Already exists!"); return; }
    setOptLoading(true);
    const { error } = await supabase.from("paid_to_options").insert([{ name }]);
    if (error) { alert(error.message); setOptLoading(false); return; }
    setNewOptionName(""); await fetchOptions(); setOptLoading(false);
  };

  const removeOption = async (opt) => {
    if (!window.confirm(`Remove "${opt.name}"?`)) return;
    setOptLoading(true);
    if (opt.id) await supabase.from("paid_to_options").delete().eq("id", opt.id);
    await fetchOptions(); setOptLoading(false);
  };

  const PAID_TO_OPTIONS = [...paidToOptions.map(o => o.name), "Others"];

  /* ── INCOME FORM ── */
  const [incomeMode, setIncomeMode] = useState("service");
  const [incomeDate, setIncomeDate] = useState(today);
  const [selectedService, setSelectedService] = useState("");
  const [ratePerQty, setRatePerQty] = useState("");
  const [qty, setQty] = useState(1);
  const computedAmount = ratePerQty && qty ? Math.round(Number(ratePerQty) * Number(qty)) : 0;

  const [manualDesc, setManualDesc] = useState("");
  const [manualAmount, setManualAmount] = useState("");

  const handleServiceChange = (svcName) => {
    setSelectedService(svcName);
    const found = serviceOptions.find(s => s.name === svcName);
    setRatePerQty(found ? String(found.rate_per_qty) : "");
    setQty(1);
  };

  /* ── EXPENSE / HOME ── */
  const [expenseForm, setExpenseForm] = useState({ paid_to: "", amount: "" });
  const [expenseDate, setExpenseDate] = useState(today);

  /* ── FETCH ── */
  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/"); return; }
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDate = sevenDaysAgo.toISOString().split("T")[0];
    const [{ data: incomeData }, { data: expenseData }] = await Promise.all([
      supabase.from("income").select("*").gte("date", startDate).lte("date", today).order("created_at", { ascending: false }),
      supabase.from("expense").select("*").gte("date", startDate).lte("date", today).order("created_at", { ascending: false }),
    ]);
    setIncomes(incomeData || []); setExpenses(expenseData || []); setLoading(false);
  };

  const generateChartData = (inc, exp) => {
    if (chartType === "daily") return [{
      name: "Today",
      Income: inc.filter(i => i.date === today).reduce((s, i) => s + i.amount, 0),
      Expense: exp.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0),
    }];
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      last7.push({
        name: ds.slice(5),
        Income: inc.filter(i => i.date === ds).reduce((s, i) => s + i.amount, 0),
        Expense: exp.filter(e => e.date === ds).reduce((s, e) => s + e.amount, 0),
      });
    }
    return last7;
  };

  useEffect(() => { fetchData(); fetchOptions(); fetchServices(); }, []);
  useEffect(() => {
    const check = async () => { const { data } = await supabase.auth.getSession(); if (!data.session) navigate("/"); };
    check();
  }, [navigate]);
  useEffect(() => { setChartData(generateChartData(incomes, expenses)); }, [chartType, incomes, expenses]);

  /* ── ADD INCOME (service) ── */
  const addServiceIncome = async () => {
    if (!selectedService || !computedAmount) return;
    const { error } = await supabase.from("income").insert([{
      date: incomeDate, service: selectedService, amount: computedAmount,
      qty: Number(qty), rate_per_qty: Number(ratePerQty),
    }]);
    if (error) { alert(error.message); return; }
    setSelectedService(""); setRatePerQty(""); setQty(1); fetchData();
  };

  /* ── ADD INCOME (manual) ── */
  const addManualIncome = async () => {
    const desc = manualDesc.trim();
    const amount = Number(manualAmount);
    if (!desc || !amount || amount <= 0) return;
    const { error } = await supabase.from("income").insert([{
      date: incomeDate, service: desc, amount,
    }]);
    if (error) { alert(error.message); return; }
    setManualDesc(""); setManualAmount(""); fetchData();
  };

  /* ── ADD EXPENSE ── */
  const addExpense = async () => {
    let paidTo = expenseForm.paid_to === "Others" ? customPaidTo : expenseForm.paid_to;
    if (!paidTo || !expenseForm.amount) return;
    const { error } = await supabase.from("expense").insert([{ date: expenseDate, paid_to: paidTo, amount: Number(expenseForm.amount) }]);
    if (error) { alert(error.message); return; }
    setExpenseForm({ paid_to: "", amount: "" }); setCustomPaidTo(""); fetchData();
  };

  /* ── UPDATE / DELETE ── */
  const updateTransaction = async (table, id, amount) => {
    await supabase.from(table).update({ amount: Number(amount) }).eq("id", id);
    setEditing(null); fetchData();
  };
  const deleteTransaction = async (table, id) => {
    if (!window.confirm("Delete this entry?")) return;
    await supabase.from(table).delete().eq("id", id); fetchData();
  };
  // Delete a grouped row — deletes ALL sibling ids
  const deleteGrouped = async (ids) => {
    if (!window.confirm(`Delete all ${ids.length} entries for this service?`)) return;
    for (const id of ids) await supabase.from("income").delete().eq("id", id);
    fetchData();
  };

  /* ── BUILD DISPLAY ROWS (group same-name income) ── */
  const buildDisplayRows = (rows) => {
    const result = [];
    const usedIds = new Set();

    rows.forEach(row => {
      if (usedIds.has(row.id)) return;

      if (row.type === "Income") {
        // Find ALL income rows with same service name today that haven't been consumed yet
        const siblings = rows.filter(
          r => r.type === "Income" &&
            r.service === row.service &&
            !usedIds.has(r.id)
        );

        if (siblings.length > 1) {
          const totalAmt = siblings.reduce((s, r) => s + (r.amount || 0), 0);
          const totalQty = siblings.every(r => r.qty) ? siblings.reduce((s, r) => s + (r.qty || 0), 0) : null;
          const isManual = siblings.every(r => !r.qty);

          siblings.forEach(r => usedIds.add(r.id));
          result.push({
            ...row,
            _grouped: true,
            _count: siblings.length,
            _ids: siblings.map(r => r.id),
            amount: totalAmt,
            qty: totalQty,
            _isManual: isManual,
          });
        } else {
          usedIds.add(row.id);
          result.push({ ...row, _grouped: false });
        }
      } else {
        usedIds.add(row.id);
        result.push({ ...row, _grouped: false });
      }
    });

    return result;
  };

  const todayRawRows = [
    ...incomes.filter(i => i.date === today).map(i => ({ ...i, type: "Income" })),
    ...expenses.filter(e => e.date === today).map(e => ({ ...e, type: "Expense" })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const displayRows = buildDisplayRows(todayRawRows);

  const fmt = (n) => (n || 0).toLocaleString("en-IN");

  /* ── WHATSAPP COPY ── */
  const [waCopied, setWaCopied] = useState(false);
  const copyWhatsApp = () => {
    const today_incomes = incomes.filter(i => i.date === today);
    const today_expenses = expenses.filter(e => e.date === today);
    const todayInc = today_incomes.reduce((s, i) => s + i.amount, 0);
    const todayExp = today_expenses.reduce((s, e) => s + e.amount, 0);
    const todayBal = todayInc - todayExp;

    const dateStr = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    let lines = [
      `📊 *Daily Finance Summary*`,
      `📅 ${dateStr}`,
      ``,
      `💰 *Income:* ₹${fmt(todayInc)}`,
      `💸 *Expense:* ₹${fmt(todayExp)}`,
      `🧮 *Balance:* ₹${fmt(todayBal)}`,
    ];
    if (today_incomes.length > 0) {
      lines.push(``, `*Income Breakdown:*`);
      today_incomes.forEach(i => lines.push(`  • ${i.service} — ₹${fmt(i.amount)}${i.qty ? ` (${i.qty} qty)` : ""}`));
    }
    if (today_expenses.length > 0) {
      lines.push(``, `*Expenses:*`);
      today_expenses.forEach(e => lines.push(`  • ${e.paid_to} — ₹${fmt(e.amount)}`));
    }
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setWaCopied(true); setTimeout(() => setWaCopied(false), 2500);
    });
  };

  /* ── RENDER ── */
  return (
    <>
      <style>{CSS}</style>
      <Navbar />
      <div className="db-root">

        {/* HEADER */}
        <div className="db-header">
          <div className="db-header-inner">
            <div>
              <div className="db-eyebrow">Daily Income Track</div>
              <h1 className="db-title">Good day, <em>Abdul Jeelani</em></h1>
            </div>
            <div className="db-date">
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>

        <div className="db-wrap">

          {/* STAT CARDS */}
          <div className="stats-grid">
            <StatCard label="Total Income" value={fmt(totalIncome)} valCls="green" accent="accent-green" icon="💰" iconBg="#dcfce7" />
            <StatCard label="Total Expense" value={fmt(totalExpense)} valCls="red" accent="accent-red" icon="💸" iconBg="#fee2e2" />
            <StatCard label="Balance" value={fmt(balance)} valCls={balance >= 0 ? "teal" : "red"} accent={balance >= 0 ? "accent-teal" : "accent-red"} icon="🧮" iconBg="#e0f2f0" />
          </div>

          {/* QUICK ENTRY */}
          <p className="section-title">Quick Entry</p>
          <div className="forms-tabs">
            {[
              { key: "income", label: "➕ Add Income" },
              { key: "expense", label: "➖ Add Expense" },
            ].map(t => (
              <button key={t.key} className={`forms-tab${activeForm === t.key ? " active" : ""}`} onClick={() => setActiveForm(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── INCOME PANEL ── */}
          {activeForm === "income" && (
            <div className="form-panel">
              <div className="field-wrap">
                <label className="field-label">Date</label>
                <input className="db-input" type="date" value={incomeDate} onChange={e => setIncomeDate(e.target.value)} />
              </div>
              <div className="income-mode-row">
                <button className={`income-mode-btn${incomeMode === "service" ? " active" : ""}`} onClick={() => setIncomeMode("service")}>⚡ By Service</button>
                <button className={`income-mode-btn${incomeMode === "manual" ? " active" : ""}`} onClick={() => setIncomeMode("manual")}>✏️ Manual</button>
              </div>

              {incomeMode === "service" && (
                <>
                  <button className="manage-opts-btn" onClick={() => setShowManageSvc(p => !p)}>
                    ⚙️ {showManageSvc ? "Hide" : "Manage"} Services
                  </button>
                  {showManageSvc && (
                    <div className="manage-opts-panel">
                      <div className="manage-opts-list">
                        {serviceOptions.map(opt => (
                          <div className={`opt-pill${editingSvcId === opt.id ? " opt-pill-editing" : ""}`} key={opt.id}>
                            {editingSvcId === opt.id ? (
                              <div className="opt-pill-edit-inputs">
                                <input className="opt-pill-input name-input" value={editSvcName}
                                  onChange={e => setEditSvcName(e.target.value)}
                                  onKeyDown={e => { if (e.key === "Enter") updateService(opt); if (e.key === "Escape") setEditingSvcId(null); }}
                                  autoFocus disabled={svcLoading} placeholder="Service name" />
                                <input className="opt-pill-input rate-input" type="number" value={editSvcRate}
                                  onChange={e => setEditSvcRate(e.target.value)}
                                  onKeyDown={e => { if (e.key === "Enter") updateService(opt); if (e.key === "Escape") setEditingSvcId(null); }}
                                  disabled={svcLoading} placeholder="₹/qty" />
                                <button className="opt-pill-save" onClick={() => updateService(opt)} disabled={svcLoading}>{svcLoading ? "…" : "Save"}</button>
                                <button className="opt-pill-cancel" onClick={() => setEditingSvcId(null)} disabled={svcLoading}>Cancel</button>
                              </div>
                            ) : (
                              <>
                                {opt.name}
                                <span className="opt-pill-rate">₹{opt.rate_per_qty}/qty</span>
                                <button className="opt-pill-edit-btn" title="Edit" disabled={svcLoading}
                                  onClick={() => { setEditingSvcId(opt.id); setEditSvcName(opt.name); setEditSvcRate(String(opt.rate_per_qty)); }}>
                                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                    <path d="M15.232 5.232l3.536 3.536M4 20l4-1 10-10-3-3L5 16l-1 4z" />
                                  </svg>
                                </button>
                                <button className="opt-pill-del" onClick={() => removeService(opt)} title="Remove" disabled={svcLoading}>
                                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="svc-add-row">
                        <input className="manage-opts-input" placeholder="Service name" value={newSvcName}
                          onChange={e => setNewSvcName(e.target.value)} onKeyDown={e => e.key === "Enter" && addService()} disabled={svcLoading} />
                        <input className="manage-opts-input" type="number" placeholder="₹/qty" value={newSvcRate}
                          onChange={e => setNewSvcRate(e.target.value)} onKeyDown={e => e.key === "Enter" && addService()} disabled={svcLoading} />
                        <button className="manage-opts-save" onClick={addService} disabled={svcLoading}>{svcLoading ? "…" : "+ Add"}</button>
                      </div>
                    </div>
                  )}
                  <div className="field-wrap">
                    <label className="field-label">Service / Work</label>
                    <select className="db-select" value={selectedService} onChange={e => handleServiceChange(e.target.value)}>
                      <option value="">Select Service</option>
                      {serviceOptions.map(s => (
                        <option key={s.id} value={s.name}>{s.name} — ₹{s.rate_per_qty}/qty</option>
                      ))}
                    </select>
                  </div>
                  <div className="qty-rate-row">
                    <div className="field-wrap">
                      <label className="field-label" style={{ color: !selectedService ? "var(--text-faint)" : undefined }}>Qty</label>
                      <input className="db-input" type="number" min="1"
                        placeholder={selectedService ? "Enter qty" : "—"} value={qty} disabled={!selectedService}
                        onChange={e => setQty(e.target.value)}
                        style={{ opacity: !selectedService ? 0.4 : 1, cursor: !selectedService ? "not-allowed" : "text" }} />
                    </div>
                    <div className="field-wrap">
                      <label className="field-label" style={{ color: !selectedService ? "var(--text-faint)" : undefined }}>Rate / qty (₹)</label>
                      <input className="db-input" type="number" placeholder="₹" value={ratePerQty} disabled={!selectedService}
                        onChange={e => setRatePerQty(e.target.value)}
                        style={{ opacity: !selectedService ? 0.4 : 1, cursor: !selectedService ? "not-allowed" : "text" }} />
                    </div>
                  </div>
                  {computedAmount > 0 && (
                    <div className="auto-amount-box">
                      <span className="auto-amount-label">{qty} × ₹{ratePerQty} =</span>
                      <span className="auto-amount-value">₹{fmt(computedAmount)}</span>
                    </div>
                  )}
                  <button className="btn btn-green" onClick={addServiceIncome} disabled={!selectedService || !computedAmount}>Save Income</button>
                </>
              )}

              {incomeMode === "manual" && (
                <>
                  <div className="field-wrap">
                    <label className="field-label">Description / Source</label>
                    <input className="db-input" placeholder="e.g. Cash received, Commission…"
                      value={manualDesc} onChange={e => setManualDesc(e.target.value)} />
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Amount (₹)</label>
                    <input className="db-input" type="number" placeholder="0"
                      value={manualAmount} onChange={e => setManualAmount(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addManualIncome()} />
                  </div>
                  <button className="btn btn-green" onClick={addManualIncome}
                    disabled={!manualDesc.trim() || !manualAmount || Number(manualAmount) <= 0}>
                    Save Manual Income
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── EXPENSE PANEL ── */}
          {activeForm === "expense" && (
            <div className="form-panel">
              <div className="field-wrap">
                <label className="field-label">Date</label>
                <input className="db-input" type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Paid To</label>
                <button className="manage-opts-btn" onClick={() => setShowManageOpts(p => !p)}>
                  ⚙️ {showManageOpts ? "Hide" : "Manage"} Options
                </button>
                {showManageOpts && (
                  <div className="manage-opts-panel">
                    <div className="manage-opts-list">
                      {paidToOptions.map(opt => (
                        <div className="opt-pill" key={opt.id || opt.name}>
                          {opt.name}
                          <button className="opt-pill-del" onClick={() => removeOption(opt)} disabled={optLoading}>
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input className="manage-opts-input" placeholder="e.g. RAJAN FIN" value={newOptionName}
                        onChange={e => setNewOptionName(e.target.value)} onKeyDown={e => e.key === "Enter" && addOption()} disabled={optLoading} />
                      <button className="manage-opts-save" onClick={addOption} disabled={optLoading}>{optLoading ? "..." : "+ Add"}</button>
                    </div>
                  </div>
                )}
                <select className="db-select" value={expenseForm.paid_to}
                  onChange={e => { setExpenseForm({ ...expenseForm, paid_to: e.target.value }); if (e.target.value !== "Others") setCustomPaidTo(""); }}>
                  <option value="">Select Paid To</option>
                  {PAID_TO_OPTIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              {expenseForm.paid_to === "Others" && (
                <div className="field-wrap">
                  <label className="field-label">Custom Name</label>
                  <input className="db-input" placeholder="Enter name" value={customPaidTo} onChange={e => setCustomPaidTo(e.target.value)} />
                </div>
              )}
              <div className="field-wrap">
                <label className="field-label">Amount (₹)</label>
                <input className="db-input" type="number" placeholder="0" value={expenseForm.amount}
                  onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
              </div>
              <button className="btn btn-red" onClick={addExpense}>Save Expense</button>
            </div>
          )}

          {/* CHART */}
          <p className="section-title">Income vs Expense</p>
          <div className="chart-card">
            <div className="chart-toggle">
              <button className={`toggle-btn${chartType === "daily" ? " active" : ""}`} onClick={() => setChartType("daily")}>Today</button>
              <button className={`toggle-btn${chartType === "weekly" ? " active" : ""}`} onClick={() => setChartType("weekly")}>7 Days</button>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barGap={6}>
                <XAxis dataKey="name" tick={{ fill: "#9a9187", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9a9187", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#fff", border: "1.5px solid #e2dcd4", borderRadius: "10px", color: "#1c1a17", fontFamily: "DM Sans", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "DM Sans", color: "#9a9187" }} />
                <Bar dataKey="Income" fill="#16a34a" radius={[5, 5, 0, 0]} animationDuration={600} />
                <Bar dataKey="Expense" fill="#dc2626" radius={[5, 5, 0, 0]} animationDuration={600} />
              </BarChart>
            </ResponsiveContainer>
            <div className="chart-result-row">
              <div className="result-box">
                <div className="result-label">Today's Result</div>
                <div className={`result-value ${balance >= 0 ? "profit" : "loss"}`}>
                  {balance >= 0 ? `↑ ₹${fmt(balance)}` : `↓ ₹${fmt(Math.abs(balance))}`}
                </div>
              </div>
              <div className="result-box">
                <div className="result-label">7-Day Result</div>
                <div className={`result-value ${weeklyBalance >= 0 ? "profit" : "loss"}`}>
                  {weeklyBalance >= 0 ? `↑ ₹${fmt(weeklyBalance)}` : `↓ ₹${fmt(Math.abs(weeklyBalance))}`}
                </div>
              </div>
            </div>
          </div>

          {/* TODAY'S TRANSACTIONS */}
          <p className="section-title">Today's Transactions</p>
          <div className="wa-btn-row">
            <button className={`wa-copy-btn${waCopied ? " copied" : ""}`} onClick={copyWhatsApp}>
              {waCopied ? "✅ Copied!" : "📋 Copy for WhatsApp"}
            </button>
          </div>
          <div className="table-card">
            <span className="table-scroll-hint">← scroll to see all columns →</span>
            {loading
              ? <div className="loading-text">Loading…</div>
              : displayRows.length === 0
                ? <div className="empty-text">No transactions recorded for today</div>
                : (() => {
                  const todayInc = incomes.filter(i => i.date === today).reduce((s, i) => s + i.amount, 0);
                  const todayExp = expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);
                  const todayBal = todayInc - todayExp;
                  return (
                    <table className="db-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Description</th>
                          <th className="center">Qty</th>
                          <th className="right">Amount</th>
                          <th className="center">Del</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayRows.map((row, idx) => {
                          const rowKey = row._grouped ? `grouped-${row.service}-${idx}` : `${row.type}-${row.id}`;
                          const rowCls = row._grouped ? "row-grouped" : "";

                          return (
                            <tr key={rowKey} className={rowCls}>
                              {/* TYPE */}
                              <td>
                                <span className={`badge badge-${row.type.toLowerCase()}`}>{row.type}</span>
                                {row.type === "Income" && !row.qty && !row._grouped && (
                                  <span className="badge badge-manual" style={{ marginLeft: 4 }}>Manual</span>
                                )}
                                {row.type === "Income" && row._grouped && row._isManual && (
                                  <span className="badge badge-manual" style={{ marginLeft: 4 }}>Manual</span>
                                )}
                              </td>

                              {/* DESCRIPTION + multiplier badge */}
                              <td style={{ fontWeight: 500 }}>
                                {row.service || row.paid_to}
                                {row._grouped && (
                                  <span className="multi-badge">×{row._count}</span>
                                )}
                                {row.type === "Income" && row.rate_per_qty && !row._grouped && (
                                  <span style={{ fontSize: 10, color: "var(--text-dim)", marginLeft: 6 }}>
                                    ₹{row.rate_per_qty}/qty
                                  </span>
                                )}
                              </td>

                              {/* QTY */}
                              <td className="center" style={{ color: "var(--text-med)", fontWeight: 600 }}>
                                {row.type === "Income" && row.qty ? row.qty : "—"}
                              </td>

                              {/* AMOUNT — grouped rows show shimmer total, singles show edit */}
                              <td className="right">
                                {row._grouped ? (
                                  <span className="grouped-total">₹{fmt(row.amount)}</span>
                                ) : editing === `${row.type}-${row.id}` ? (
                                  <input className="edit-input" type="number" defaultValue={row.amount} autoFocus
                                    onBlur={e => updateTransaction(row.type === "Income" ? "income" : "expense", row.id, e.target.value)} />
                                ) : (
                                  <span className="edit-trigger" onClick={() => setEditing(`${row.type}-${row.id}`)}>
                                    <span style={{ fontWeight: 600 }}>₹{fmt(row.amount)}</span>
                                    <svg className="edit-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path d="M15.232 5.232l3.536 3.536M4 20l4-1 10-10-3-3L5 16l-1 4z" />
                                    </svg>
                                  </span>
                                )}
                              </td>

                              {/* DELETE */}
                              <td className="center">
                                <button className="del-btn"
                                  onClick={() => row._grouped
                                    ? deleteGrouped(row._ids)
                                    : deleteTransaction(row.type === "Income" ? "income" : "expense", row.id)
                                  }>
                                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="table-totals-row">
                          <td colSpan={3}><span className="totals-label">Today's Total</span></td>
                          <td className="right">
                            <div style={{ color: "var(--green)", fontFamily: "Playfair Display,serif" }}>+₹{fmt(todayInc)}</div>
                            <div style={{ color: "var(--red)", fontFamily: "Playfair Display,serif" }}>−₹{fmt(todayExp)}</div>
                            <div style={{ color: todayBal >= 0 ? "var(--teal)" : "var(--red)", fontFamily: "Playfair Display,serif", fontSize: 15 }}>= ₹{fmt(todayBal)}</div>
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  );
                })()
            }
          </div>

        </div>
      </div>
    </>
  );
}

/* ── STAT CARD ── */
const StatCard = ({ label, value, valCls, accent, icon, iconBg, small }) => (
  <div className="stat-card">
    <div className={`stat-card-accent ${accent}`} />
    <div className="stat-icon-bg" style={{ background: iconBg }}>{icon}</div>
    <div className="stat-label">{label}</div>
    <div className={`stat-value ${valCls}${small ? " sm" : ""}`}>₹{value}</div>
  </div>
);