import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
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
  --green:     #16a34a;
  --green-bg:  #dcfce7;
  --red:       #dc2626;
  --red-bg:    #fee2e2;
  --amber:     #b45309;
  --amber-bg:  #fef3c7;
  --blue:      #1d4ed8;
  --purple:    #7c3aed;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow:    0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
  --repeat-bg:    #fffbeb;
  --repeat-border:#f59e0b;
  --repeat-text:  #b45309;
  --repeat-badge: #f59e0b;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

.mr-root {
  min-height: 100vh;
  background: var(--bg);
  font-family: 'DM Sans', sans-serif;
  color: var(--text);
  padding-bottom: 80px;
}

/* ─── HEADER ─── */
.mr-header {
  background: var(--surface);
  border-bottom: 1.5px solid var(--border);
  box-shadow: var(--shadow-sm);
  padding: 28px 0;
  margin-bottom: 32px;
}
.mr-header-inner {
  max-width: 1100px; margin: auto; padding: 0 24px;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
}
.mr-eyebrow {
  font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--teal); margin-bottom: 6px; display: flex; align-items: center; gap: 8px;
}
.mr-eyebrow::before { content:''; display:inline-block; width:18px; height:2px; background:var(--teal); border-radius:2px; }
.mr-title { font-family:'Playfair Display',serif; font-size:clamp(22px,3vw,32px); font-weight:900; color:var(--text); }
.mr-title em { font-style:italic; color:var(--teal); }
.mr-header-right { display:flex; align-items:flex-end; gap:14px; flex-wrap:wrap; }
.mr-select-wrap { display:flex; flex-direction:column; gap:4px; align-items:flex-end; }
.mr-select-label { font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:var(--text-dim); }
.mr-select {
  background:var(--bg2); border:1.5px solid var(--border2); border-radius:8px;
  padding:9px 36px 9px 14px; font-size:14px; font-family:'DM Sans',sans-serif;
  font-weight:500; color:var(--text); outline:none; cursor:pointer;
  appearance:none; -webkit-appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a9187' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 12px center;
  transition:border-color 0.2s,box-shadow 0.2s; min-width:180px;
}
.mr-select:focus { border-color:var(--teal); box-shadow:0 0 0 3px rgba(13,148,136,0.1); }

/* ─── EXPORT BUTTONS GROUP ─── */
.export-btn-group {
  display:flex; align-items:center; gap:8px; flex-wrap:wrap;
}

/* PDF Export Button */
.export-btn {
  display:inline-flex; align-items:center; gap:7px;
  background:linear-gradient(135deg,#1c1a17 0%,#3a3530 100%);
  color:#fff; border:none; border-radius:9px; padding:9px 18px;
  font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600;
  cursor:pointer; transition:transform 0.15s,box-shadow 0.15s;
  box-shadow:0 2px 8px rgba(0,0,0,0.18); white-space:nowrap;
}
.export-btn:hover  { transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,0,0,0.22); }
.export-btn:active { transform:translateY(0); opacity:0.9; }

/* CSV Income Button */
.csv-income-btn {
  display:inline-flex; align-items:center; gap:7px;
  background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);
  color:#fff; border:none; border-radius:9px; padding:9px 18px;
  font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600;
  cursor:pointer; transition:transform 0.15s,box-shadow 0.15s;
  box-shadow:0 2px 8px rgba(22,163,74,0.3); white-space:nowrap;
}
.csv-income-btn:hover  { transform:translateY(-1px); box-shadow:0 4px 16px rgba(22,163,74,0.4); }
.csv-income-btn:active { transform:translateY(0); opacity:0.9; }

/* CSV Expense Button */
.csv-expense-btn {
  display:inline-flex; align-items:center; gap:7px;
  background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);
  color:#fff; border:none; border-radius:9px; padding:9px 18px;
  font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600;
  cursor:pointer; transition:transform 0.15s,box-shadow 0.15s;
  box-shadow:0 2px 8px rgba(220,38,38,0.3); white-space:nowrap;
}
.csv-expense-btn:hover  { transform:translateY(-1px); box-shadow:0 4px 16px rgba(220,38,38,0.4); }
.csv-expense-btn:active { transform:translateY(0); opacity:0.9; }

/* CSV Both Button */
.csv-both-btn {
  display:inline-flex; align-items:center; gap:7px;
  background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%);
  color:#fff; border:none; border-radius:9px; padding:9px 18px;
  font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600;
  cursor:pointer; transition:transform 0.15s,box-shadow 0.15s;
  box-shadow:0 2px 8px rgba(124,58,237,0.3); white-space:nowrap;
}
.csv-both-btn:hover  { transform:translateY(-1px); box-shadow:0 4px 16px rgba(124,58,237,0.4); }
.csv-both-btn:active { transform:translateY(0); opacity:0.9; }

/* ─── EXPORT DROPDOWN ─── */
.export-dropdown-wrap {
  position: relative;
  display: inline-block;
}
.export-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  padding: 8px;
  min-width: 220px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 4px;
  animation: dropIn 0.18s ease;
}
@keyframes dropIn {
  from { opacity:0; transform:translateY(-6px); }
  to   { opacity:1; transform:translateY(0); }
}
.export-dropdown-header {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim);
  padding: 4px 10px 8px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px;
}
.export-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  text-align: left;
  transition: background 0.15s;
  width: 100%;
}
.export-menu-item:hover { background: var(--bg2); }
.export-menu-icon {
  width: 30px; height: 30px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0;
}
.export-menu-item-text { display: flex; flex-direction: column; gap: 1px; }
.export-menu-item-sub { font-size: 11px; font-weight: 400; color: var(--text-dim); }

/* ─── SAVINGS RATE RING ─── */
.savings-ring-card {
  background:var(--surface); border:1.5px solid var(--border); border-radius:14px;
  padding:24px; box-shadow:var(--shadow-sm);
  display:flex; align-items:center; gap:24px; flex-wrap:wrap; margin-bottom:32px;
}
.ring-wrap { position:relative; flex-shrink:0; }
.ring-wrap svg { transform:rotate(-90deg); }
.ring-center {
  position:absolute; inset:0;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
}
.ring-pct { font-family:'Playfair Display',serif; font-size:26px; font-weight:700; color:var(--teal); line-height:1; }
.ring-sub  { font-size:9px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); margin-top:2px; }
.ring-info { flex:1; min-width:180px; }
.ring-title { font-family:'Playfair Display',serif; font-size:18px; font-weight:700; color:var(--text); margin-bottom:4px; }
.ring-desc  { font-size:13px; color:var(--text-dim); margin-bottom:14px; line-height:1.5; }
.ring-pills { display:flex; flex-wrap:wrap; gap:8px; }
.ring-pill  { display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:20px; border:1.5px solid var(--border); background:var(--bg2); font-size:12px; font-weight:600; color:var(--text-med); }
.ring-pill-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

/* ─── BEST/WORST DAY ─── */
.bw-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:32px; }
@media(max-width:600px){ .bw-grid{grid-template-columns:1fr;} }
.bw-card {
  background:var(--surface); border:1.5px solid var(--border); border-radius:12px;
  padding:18px 20px; box-shadow:var(--shadow-sm); position:relative; overflow:hidden;
}
.bw-accent { position:absolute; top:0; left:0; right:0; height:3px; border-radius:12px 12px 0 0; }
.bw-label { font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); margin-bottom:6px; }
.bw-date  { font-family:'Playfair Display',serif; font-size:15px; font-weight:700; color:var(--text); margin-bottom:4px; }
.bw-amount{ font-family:'Playfair Display',serif; font-size:28px; font-weight:700; }

/* ─── WRAP ─── */
.mr-wrap { max-width:1100px; margin:auto; padding:0 24px; }
@media(max-width:480px){ .mr-wrap{padding:0 14px;} }

/* ─── SECTION TITLE ─── */
.section-title {
  font-family:'Playfair Display',serif; font-size:18px; font-weight:700; color:var(--text);
  margin-bottom:16px; display:flex; align-items:center; gap:10px;
}
.section-title::after { content:''; flex:1; height:1.5px; background:var(--border); border-radius:2px; }

/* ─── EMPTY / LOADING ─── */
.mr-empty { text-align:center; padding:64px 24px; color:var(--text-dim); }
.mr-empty-icon { font-size:48px; margin-bottom:16px; display:block; }
.mr-empty-title { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; color:var(--text-med); margin-bottom:8px; }
.mr-empty-sub { font-size:14px; font-weight:300; }
.loading-text { text-align:center; color:var(--text-dim); padding:48px; font-size:14px; }

/* ─── STAT CARDS ─── */
.stats-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:14px; margin-bottom:32px; }
@media(max-width:1000px){ .stats-grid{grid-template-columns:repeat(3,1fr);} }
@media(max-width:640px) { .stats-grid{grid-template-columns:repeat(2,1fr);} }
@media(max-width:360px) { .stats-grid{grid-template-columns:1fr;} }
.stat-card {
  background:var(--surface); border:1.5px solid var(--border); border-radius:14px;
  padding:18px 18px 16px; box-shadow:var(--shadow-sm); position:relative; overflow:hidden;
  transition:transform 0.2s,box-shadow 0.2s;
}
.stat-card:hover { transform:translateY(-2px); box-shadow:var(--shadow); }
.stat-accent { position:absolute; top:0; left:0; right:0; height:3px; border-radius:14px 14px 0 0; }
.stat-label { font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-dim); margin-bottom:8px; line-height:1.4; }
.stat-value { font-family:'Playfair Display',serif; font-size:26px; font-weight:700; line-height:1; margin-bottom:8px; }
.stat-value.green { color:var(--green); }
.stat-value.red   { color:var(--red); }
.stat-value.teal  { color:var(--teal); }
.stat-value.blue  { color:var(--blue); }
.stat-change { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; padding:3px 8px; border-radius:20px; }
.stat-change.up   { background:var(--green-bg); color:var(--green); }
.stat-change.down { background:var(--red-bg);   color:var(--red); }

/* ─── TOP SPENDERS ─── */
.top-spenders-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:28px; }
@media(max-width:640px){ .top-spenders-grid{grid-template-columns:1fr;} }
.spender-card {
  background:var(--surface); border:1.5px solid var(--border); border-radius:14px;
  padding:20px; box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:14px;
  position:relative; overflow:hidden; transition:transform 0.2s,box-shadow 0.2s;
}
.spender-card:hover { transform:translateY(-2px); box-shadow:var(--shadow); }
.spender-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:14px 14px 0 0; }
.spender-card:nth-child(1)::before { background:linear-gradient(90deg,#f59e0b,#ef4444); }
.spender-card:nth-child(2)::before { background:linear-gradient(90deg,#6366f1,#8b5cf6); }
.spender-card:nth-child(3)::before { background:linear-gradient(90deg,#0d9488,#06b6d4); }
.spender-rank { font-family:'Playfair Display',serif; font-size:32px; font-weight:900; line-height:1; flex-shrink:0; }
.spender-card:nth-child(1) .spender-rank { color:#f59e0b; }
.spender-card:nth-child(2) .spender-rank { color:#6366f1; }
.spender-card:nth-child(3) .spender-rank { color:#0d9488; }
.spender-info { flex:1; min-width:0; }
.spender-name { font-size:14px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px; }
.spender-count { font-size:11px; color:var(--text-dim); margin-bottom:6px; }
.spender-amount { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; color:var(--red); }
.spender-bar-wrap { background:var(--bg2); border-radius:4px; height:4px; margin-top:8px; overflow:hidden; }
.spender-bar { height:100%; border-radius:4px; transition:width 0.8s cubic-bezier(.4,0,.2,1); }
.spender-card:nth-child(1) .spender-bar { background:linear-gradient(90deg,#f59e0b,#ef4444); }
.spender-card:nth-child(2) .spender-bar { background:linear-gradient(90deg,#6366f1,#8b5cf6); }
.spender-card:nth-child(3) .spender-bar { background:linear-gradient(90deg,#0d9488,#06b6d4); }

/* ─── TOP GAINERS ─── */
.top-gainers-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:14px; margin-bottom:28px; }
@media(max-width:1000px){ .top-gainers-grid{grid-template-columns:repeat(3,1fr);} }
@media(max-width:640px) { .top-gainers-grid{grid-template-columns:repeat(2,1fr);} }
.gainer-card {
  background:var(--surface); border:1.5px solid var(--border); border-radius:14px;
  padding:18px 16px; box-shadow:var(--shadow-sm); position:relative; overflow:hidden;
  transition:transform 0.2s,box-shadow 0.2s; display:flex; flex-direction:column; gap:6px;
}
.gainer-card:hover { transform:translateY(-2px); box-shadow:var(--shadow); }
.gainer-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:14px 14px 0 0; }
.gainer-card:nth-child(1)::before { background:linear-gradient(90deg,#16a34a,#0d9488); }
.gainer-card:nth-child(2)::before { background:linear-gradient(90deg,#0d9488,#0891b2); }
.gainer-card:nth-child(3)::before { background:linear-gradient(90deg,#1d4ed8,#6366f1); }
.gainer-card:nth-child(4)::before { background:linear-gradient(90deg,#7c3aed,#db2777); }
.gainer-card:nth-child(5)::before { background:linear-gradient(90deg,#b45309,#f59e0b); }
.gainer-rank-row { display:flex; align-items:center; justify-content:space-between; }
.gainer-rank { font-family:'Playfair Display',serif; font-size:28px; font-weight:900; line-height:1; }
.gainer-card:nth-child(1) .gainer-rank { color:#16a34a; }
.gainer-card:nth-child(2) .gainer-rank { color:#0d9488; }
.gainer-card:nth-child(3) .gainer-rank { color:#1d4ed8; }
.gainer-card:nth-child(4) .gainer-rank { color:#7c3aed; }
.gainer-card:nth-child(5) .gainer-rank { color:#b45309; }
.gainer-count-badge { font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; background:var(--green-bg); color:var(--green); }
.gainer-name { font-size:13px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.gainer-count { font-size:11px; color:var(--text-dim); }
.gainer-amount { font-family:'Playfair Display',serif; font-size:19px; font-weight:700; color:var(--green); }
.gainer-bar-wrap { background:var(--bg2); border-radius:4px; height:4px; overflow:hidden; margin-top:4px; }
.gainer-bar { height:100%; border-radius:4px; transition:width 0.8s cubic-bezier(.4,0,.2,1); background:linear-gradient(90deg,var(--green),var(--teal)); }

/* ─── CHART GRID ─── */
.chart-grid { display:grid; grid-template-columns:1fr 1.6fr; gap:20px; margin-bottom:28px; }
@media(max-width:780px){ .chart-grid{grid-template-columns:1fr;} }

/* ─── PIE LEGEND ─── */
.pie-legend { margin-top:16px; display:flex; flex-direction:column; gap:8px; }
.pie-legend-item { display:flex; align-items:center; gap:10px; font-size:12px; }
.pie-legend-dot  { width:10px; height:10px; border-radius:3px; flex-shrink:0; }
.pie-legend-name { flex:1; color:var(--text-med); font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pie-legend-val  { font-weight:700; color:var(--text); }
.pie-legend-pct  { color:var(--text-dim); font-size:11px; min-width:36px; text-align:right; }

/* ─── TABLES ─── */
.table-card { background:var(--surface); border:1.5px solid var(--border); border-radius:14px; padding:28px; margin-bottom:24px; box-shadow:var(--shadow-sm); overflow-x:auto; }
.table-card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:10px; }
.table-card-title { font-family:'Playfair Display',serif; font-size:18px; font-weight:700; display:flex; align-items:center; gap:10px; }
.table-card-title::after { content:''; flex:1; height:1.5px; background:var(--border); border-radius:2px; min-width:20px; }
.table-footer { margin-top:16px; text-align:right; font-family:'Playfair Display',serif; font-size:17px; font-weight:700; padding-top:14px; border-top:1.5px solid var(--border); }
.mr-table { width:100%; border-collapse:collapse; font-size:13px; min-width:380px; }
.mr-table th { font-size:10px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:var(--text-dim); padding:10px 14px; text-align:left; background:var(--bg2); border-bottom:1.5px solid var(--border); white-space:nowrap; }
.mr-table th:first-child { border-radius:8px 0 0 8px; }
.mr-table th:last-child  { border-radius:0 8px 8px 0; }
.mr-table th.right { text-align:right; }
.mr-table td { padding:12px 14px; border-bottom:1px solid var(--border); color:var(--text); font-weight:400; vertical-align:middle; }
.mr-table td.right { text-align:right; }
.mr-table tr:last-child td { border-bottom:none; }
.mr-table tr:hover td { background:var(--surface2); }

/* ─── REPEAT ─── */
.mr-table tr.repeat-row td { background:var(--repeat-bg) !important; }
.mr-table tr.repeat-row:hover td { background:#fef9e7 !important; }
.mr-table tr.repeat-row td:first-child { border-left:3px solid var(--repeat-border); }
.repeat-badge {
  display:inline-flex; align-items:center; gap:3px;
  background:var(--repeat-badge); color:#fff; font-size:10px; font-weight:800;
  padding:2px 7px 2px 5px; border-radius:20px; margin-left:7px; vertical-align:middle;
  box-shadow:0 1px 4px rgba(245,158,11,0.35);
  animation:repeat-pulse 2s ease-in-out infinite;
}
.repeat-badge-flash { display:inline-block; width:6px; height:6px; border-radius:50%; background:#fff; opacity:0.9; }
.repeat-badge-sep   { opacity:0.4; font-weight:400; margin:0 1px; }
.repeat-badge-total { font-size:10px; font-weight:700; color:#fff3cd; }
@keyframes repeat-pulse {
  0%,100% { box-shadow:0 1px 4px rgba(245,158,11,0.35); }
  50%     { box-shadow:0 2px 10px rgba(245,158,11,0.65); }
}
.repeat-legend { display:flex; align-items:center; gap:8px; font-size:11px; color:var(--repeat-text); font-weight:600; background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:8px 14px; margin-bottom:16px; }
.repeat-legend-dot { width:8px; height:8px; border-radius:50%; background:var(--repeat-badge); flex-shrink:0; }

.badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
.badge-home { background:var(--teal-light); color:var(--teal); }
.date-chip { display:inline-block; background:var(--bg2); border:1px solid var(--border); border-radius:6px; padding:2px 8px; font-size:12px; font-weight:500; color:var(--text-med); font-family:monospace; }

/* ─── CHART CARD ─── */
.chart-card { background:var(--surface); border:1.5px solid var(--border); border-radius:14px; padding:28px; margin-bottom:28px; box-shadow:var(--shadow-sm); }

/* ─── BULK ─── */
.bulk-section { background:var(--surface); border:2px solid #7c3aed; border-radius:16px; overflow:hidden; margin-bottom:28px; box-shadow:0 4px 20px rgba(124,58,237,.08); }
.bulk-section-header { background:linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%); padding:18px 24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; }
.bulk-header-title { font-family:'Playfair Display',serif; font-size:18px; font-weight:700; color:#fff; }
.bulk-header-sub { font-size:12px; color:rgba(255,255,255,.75); margin-top:2px; }
.bulk-stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:0; border-bottom:1.5px solid var(--border); }
.bulk-stat-cell { padding:16px 20px; border-right:1px solid var(--border); text-align:center; }
.bulk-stat-cell:last-child { border-right:none; }
.bulk-stat-label { font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); margin-bottom:4px; }
.bulk-stat-value { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; }
.bulk-body { padding:20px 24px; }
.bulk-person-row { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid var(--border); }
.bulk-person-row:last-child { border-bottom:none; }
.bulk-avatar { width:34px; height:34px; border-radius:50%; color:#fff; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.bulk-person-name { font-size:14px; font-weight:600; color:var(--text); flex:1; }
.bulk-person-date { font-size:11px; color:var(--text-faint); }
.bulk-amt-group { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
.bulk-amt-pill { font-size:12px; font-weight:600; padding:3px 10px; border-radius:20px; white-space:nowrap; }
.bulk-shared-desc { font-size:14px; font-weight:600; color:var(--text); flex:1; }
.bulk-shared-date { font-size:11px; color:var(--text-faint); }
.bulk-split-pills { display:flex; flex-wrap:wrap; gap:6px; margin-top:4px; }
.split-pill { display:flex; align-items:center; gap:5px; padding:3px 10px 3px 7px; border-radius:99px; background:#ede9fe; border:1px solid rgba(124,58,237,.2); font-size:11px; font-weight:500; color:#5a5449; }
.split-pill-av { width:16px; height:16px; border-radius:50%; color:#fff; font-size:8px; font-weight:700; display:flex; align-items:center; justify-content:center; }

/* ─── INLINE CSV BUTTONS (inside table cards) ─── */
.table-csv-btn {
  display:inline-flex; align-items:center; gap:5px;
  border:none; border-radius:7px; padding:6px 14px;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  cursor:pointer; transition:transform 0.15s,box-shadow 0.15s;
  white-space:nowrap; flex-shrink:0;
}
.table-csv-btn:hover  { transform:translateY(-1px); }
.table-csv-btn:active { transform:translateY(0); opacity:0.9; }
.table-csv-btn.income { background:var(--green-bg); color:var(--green); box-shadow:0 1px 4px rgba(22,163,74,0.15); }
.table-csv-btn.income:hover { box-shadow:0 3px 10px rgba(22,163,74,0.25); }
.table-csv-btn.expense { background:var(--red-bg); color:var(--red); box-shadow:0 1px 4px rgba(220,38,38,0.15); }
.table-csv-btn.expense:hover { box-shadow:0 3px 10px rgba(220,38,38,0.25); }

/* ─── COLLAPSE BUTTON ─── */
.collapse-btn {
  display:inline-flex; align-items:center; gap:5px;
  border:none; border-radius:7px; padding:6px 12px;
  font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600;
  cursor:pointer; transition:all 0.15s; flex-shrink:0;
  background:var(--bg2); color:var(--text-med);
  border:1.5px solid var(--border);
}
.collapse-btn:hover { background:var(--border); color:var(--text); transform:translateY(-1px); }
.collapse-btn:active { transform:translateY(0); }
.collapse-arrow { display:inline-block; transition:transform 0.25s ease; font-size:10px; }
.collapse-arrow.open { transform:rotate(180deg); }
.table-collapsible {
  overflow:hidden;
  transition:max-height 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease;
  max-height:9999px;
  opacity:1;
}
.table-collapsible.collapsed {
  max-height:0 !important;
  opacity:0;
}

/* ─── PRINT ─── */
@media print {
  /* Hide website UI elements */
  .mr-root,
  .mr-header,
  .mr-wrap,
  .no-print,
  .export-btn-group,
  .table-csv-btn,
  .export-dropdown-wrap,
  .collapse-btn,
  nav {
    display: none !important;
  }
  /* Force print view visible */
  #pdf-print-view {
    display: block !important;
    visibility: visible !important;
    position: static !important;
    overflow: visible !important;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}

/* ─── PRINT VIEW (hidden on screen, shown on print) ─── */
#pdf-print-view {
  display: none;
  font-family: Arial, sans-serif;
  color: #1c1a17;
  background: #fff;
  width: 100%;
}

/* Page setup — A4, proper margins */
@page {
  size: A4 portrait;
  margin: 15mm 12mm 15mm 12mm;
}

/* ── Header ── */
.pdf-report-header {
  width: 100%;
  border-bottom: 2px solid #1c1a17;
  padding-bottom: 8px;
  margin-bottom: 12px;
  overflow: hidden;
}
.pdf-report-title {
  font-family: Georgia, serif;
  font-size: 20pt;
  font-weight: 900;
  color: #1c1a17;
  float: left;
}
.pdf-report-title span { font-style: italic; color: #0d9488; }
.pdf-report-meta {
  float: right;
  text-align: right;
  font-size: 8pt;
  color: #5a5449;
  line-height: 1.7;
}
.pdf-report-month { font-size: 10pt; font-weight: 700; color: #1c1a17; }
.pdf-clearfix { clear: both; }

/* ── Summary — use TABLE not flex (flex breaks in print) ── */
.pdf-summary-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 14px;
  table-layout: fixed;
}
.pdf-summary-table td {
  border: 1.5px solid #d0c9be;
  padding: 8px 10px;
  text-align: center;
  vertical-align: middle;
}
.pdf-summary-label {
  font-size: 6.5pt;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #9a9187;
  display: block;
  margin-bottom: 4px;
}
.pdf-summary-value {
  font-family: Georgia, serif;
  font-size: 14pt;
  font-weight: 700;
  display: block;
  line-height: 1;
}
.pdf-summary-value.green { color: #16a34a; }
.pdf-summary-value.red   { color: #dc2626; }
.pdf-summary-value.teal  { color: #0d9488; }

/* ── Section title ── */
.pdf-section-title {
  font-family: Georgia, serif;
  font-size: 12pt;
  font-weight: 700;
  color: #1c1a17;
  margin: 10px 0 6px;
  padding-bottom: 4px;
  border-bottom: 1.5px solid #aaa;
  overflow: hidden;
}
.pdf-section-badge {
  float: right;
  font-size: 6.5pt;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 10px;
  margin-top: 2px;
}
.pdf-section-badge.income  { background: #dcfce7; color: #16a34a; }
.pdf-section-badge.expense { background: #fee2e2; color: #dc2626; }

/* ── Main data table ── */
.pdf-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
  table-layout: fixed;
  margin-bottom: 4px;
}
.pdf-table thead tr {
  background: #f0ede8;
}
.pdf-table th {
  font-size: 7pt;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #777;
  padding: 6px 8px;
  text-align: left;
  border: 1px solid #ccc;
  background: #f0ede8;
}
.pdf-table th.right { text-align: right; }
.pdf-table th.center { text-align: center; }
/* thead repeats on every page */
.pdf-table thead { display: table-header-group; }
.pdf-table tfoot { display: table-footer-group; }

.pdf-table td {
  padding: 5px 8px;
  border-bottom: 1px solid #e8e4df;
  border-left: none;
  border-right: none;
  border-top: none;
  vertical-align: middle;
  font-size: 8.5pt;
  color: #1c1a17;
  word-break: break-word;
}
.pdf-table td.right { text-align: right; font-variant-numeric: tabular-nums; }
.pdf-table td.center { text-align: center; }
.pdf-table td.mono { font-family: monospace; font-size: 8pt; color: #666; }
.pdf-table tr { page-break-inside: avoid; }

/* Alternating rows */
.pdf-table tbody tr:nth-child(even) td { background: #faf8f5; }

/* Repeat rows */
.pdf-table tr.pdf-repeat td { background: #fffbeb !important; }
.pdf-table tr.pdf-repeat td:first-child { border-left: 3px solid #f59e0b !important; padding-left: 5px; }
.pdf-repeat-tag {
  font-size: 6.5pt;
  font-weight: 700;
  background: #f59e0b;
  color: #fff;
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: 4px;
  vertical-align: middle;
}

/* Total footer row */
.pdf-total-row td {
  font-weight: 700;
  font-family: Georgia, serif;
  font-size: 9.5pt;
  border-top: 2px solid #1c1a17 !important;
  border-bottom: none !important;
  padding: 7px 8px;
  background: #fff !important;
}
.pdf-total-label { color: #666; text-transform: uppercase; font-size: 7.5pt; letter-spacing: 0.1em; }
.pdf-total-income  { color: #16a34a; text-align: right; }
.pdf-total-expense { color: #dc2626; text-align: right; }

/* Page break between income and expense */
.pdf-page-break {
  page-break-before: always;
  break-before: page;
  display: block;
  height: 0;
}

/* Summary box at end */
.pdf-summary-box {
  margin-top: 18px;
  border: 1.5px solid #ccc;
  padding: 10px 14px;
  page-break-inside: avoid;
}
.pdf-summary-box-title {
  font-family: Georgia, serif;
  font-size: 10pt;
  font-weight: 700;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid #e0e0e0;
}
.pdf-summary-box table {
  width: 100%;
  font-size: 8.5pt;
  border-collapse: collapse;
}
.pdf-summary-box td { padding: 3px 0; }
.pdf-summary-box td:last-child { text-align: right; font-weight: 700; }

/* Savings bar */
.pdf-savings-outer {
  background: #e8e4df;
  height: 7px;
  width: 100%;
  margin-top: 8px;
  border-radius: 4px;
  overflow: hidden;
}
.pdf-savings-inner { height: 100%; border-radius: 4px; }

/* Footer */
.pdf-footer {
  margin-top: 16px;
  padding-top: 6px;
  border-top: 1px solid #ddd;
  font-size: 7pt;
  color: #aaa;
  overflow: hidden;
}
.pdf-footer-left { float: left; }
.pdf-footer-right { float: right; }


`;

const CHART_COLORS = [
  "#0d9488", "#16a34a", "#1d4ed8", "#7c3aed", "#db2777",
  "#b45309", "#dc2626", "#0891b2", "#65a30d", "#9333ea",
];

/* ── ANIMATED NUMBER ── */
const useAnimatedNumber = (value, duration = 700) => {
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    let start = 0;
    const inc = value / (duration / 16);
    const timer = setInterval(() => {
      start += inc;
      if ((value >= 0 && start >= value) || (value < 0 && start <= value)) { start = value; clearInterval(timer); }
      setAnim(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return anim;
};

const countByKey = (arr, keyFn) => {
  const map = {};
  arr.forEach(item => { const k = (keyFn(item) || "").toLowerCase().trim(); map[k] = (map[k] || 0) + 1; });
  return map;
};
const sumByKey = (arr, keyFn) => {
  const map = {};
  arr.forEach(item => { const k = (keyFn(item) || "").toLowerCase().trim(); map[k] = (map[k] || 0) + (item.amount || 0); });
  return map;
};

/* ── CSV EXPORT HELPERS ── */
const escapeCsv = (val) => {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const downloadCsv = (rows, filename) => {
  const csv = rows.map(row => row.map(escapeCsv).join(",")).join("\n");
  const bom = "\uFEFF"; // UTF-8 BOM for Excel
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const exportIncomeCSV = (incomes, monthLabel) => {
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const rows = [
    [`Monthly Income Report – ${monthLabel}`],
    [],
    ["#", "Date", "Service / Source", "Amount (₹)"],
    ...incomes.map((row, idx) => [idx + 1, row.date, row.service || "", row.amount]),
    [],
    ["", "", "TOTAL", totalIncome],
  ];
  downloadCsv(rows, `income_${monthLabel.replace(/\s/g, "_")}.csv`);
};

const exportExpenseCSV = (expenses, monthLabel) => {
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const rows = [
    [`Monthly Expense Report – ${monthLabel}`],
    [],
    ["#", "Date", "Paid To", "Amount (₹)"],
    ...expenses.map((row, idx) => [idx + 1, row.date, row.paid_to || "", row.amount]),
    [],
    ["", "", "TOTAL", totalExpense],
  ];
  downloadCsv(rows, `expense_${monthLabel.replace(/\s/g, "_")}.csv`);
};

const exportBothCSV = (incomes, expenses, monthLabel) => {
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const rows = [
    [`Monthly Financial Report – ${monthLabel}`],
    [],
    ["=== INCOME ==="],
    ["#", "Date", "Service / Source", "Amount (₹)"],
    ...incomes.map((row, idx) => [idx + 1, row.date, row.service || "", row.amount]),
    ["", "", "Income Total", totalIncome],
    [],
    ["=== EXPENSES ==="],
    ["#", "Date", "Paid To", "Amount (₹)"],
    ...expenses.map((row, idx) => [idx + 1, row.date, row.paid_to || "", row.amount]),
    ["", "", "Expense Total", totalExpense],
    [],
    ["=== SUMMARY ==="],
    ["Total Income", "", "", totalIncome],
    ["Total Expense", "", "", totalExpense],
    ["Balance", "", "", balance],
  ];
  downloadCsv(rows, `report_${monthLabel.replace(/\s/g, "_")}.csv`);
};

/* ── EXPORT DROPDOWN COMPONENT ── */
const ExportDropdown = ({ onPdf, onIncomeCsv, onExpenseCsv, onBothCsv, hasIncome, hasExpense }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    if (open) document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="export-dropdown-wrap no-print" onClick={e => e.stopPropagation()}>
      <button
        className="export-btn"
        onClick={() => setOpen(v => !v)}
        title="Export options"
      >
        ⬇&nbsp; Export
        <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 2 }}>▾</span>
      </button>

      {open && (
        <div className="export-dropdown-menu">
          <div className="export-dropdown-header">Export Options</div>

          {/* PDF */}
          <button className="export-menu-item" onClick={() => { setOpen(false); onPdf(); }}>
            <div className="export-menu-icon" style={{ background: "#1c1a17", color: "#fff" }}>📄</div>
            <div className="export-menu-item-text">
              <span>Export as PDF</span>
              <span className="export-menu-item-sub">Full report with charts</span>
            </div>
          </button>

          {/* CSV Income */}
          {hasIncome && (
            <button className="export-menu-item" onClick={() => { setOpen(false); onIncomeCsv(); }}>
              <div className="export-menu-icon" style={{ background: "var(--green-bg)", color: "var(--green)" }}>💚</div>
              <div className="export-menu-item-text">
                <span>Income CSV</span>
                <span className="export-menu-item-sub">Income transactions only</span>
              </div>
            </button>
          )}

          {/* CSV Expense */}
          {hasExpense && (
            <button className="export-menu-item" onClick={() => { setOpen(false); onExpenseCsv(); }}>
              <div className="export-menu-icon" style={{ background: "var(--red-bg)", color: "var(--red)" }}>❤️</div>
              <div className="export-menu-item-text">
                <span>Expense CSV</span>
                <span className="export-menu-item-sub">Expense transactions only</span>
              </div>
            </button>
          )}

          {/* CSV Both */}
          {hasIncome && hasExpense && (
            <button className="export-menu-item" onClick={() => { setOpen(false); onBothCsv(); }}>
              <div className="export-menu-icon" style={{ background: "#ede9fe", color: "#7c3aed" }}>📊</div>
              <div className="export-menu-item-text">
                <span>Full Report CSV</span>
                <span className="export-menu-item-sub">Income + Expense + Summary</span>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const RepeatBadge = ({ count, total }) => (
  <span className="repeat-badge">
    <span className="repeat-badge-flash" />
    x{count}
    <span className="repeat-badge-sep">|</span>
    <span className="repeat-badge-total">₹{Math.round(total).toLocaleString("en-IN")} total</span>
  </span>
);

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: "#fff", border: "1.5px solid #e2dcd4", borderRadius: 10, padding: "10px 14px", fontFamily: "DM Sans", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.name}</div>
      <div style={{ color: "#dc2626", fontWeight: 700 }}>₹{Math.round(d.value).toLocaleString("en-IN")}</div>
      <div style={{ color: "#9a9187", fontSize: 11 }}>{(d.payload.percent * 100).toFixed(1)}% of total</div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════ */
export default function MonthlyReport() {
  const [month, setMonth] = useState("");
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [bulkIncomes, setBulkIncomes] = useState([]);
  const [bulkExpenses, setBulkExpenses] = useState([]);
  const [sharedExpenses, setSharedExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prevIncome, setPrevIncome] = useState(0);
  const [prevExpense, setPrevExpense] = useState(0);
  const [incomeCollapsed, setIncomeCollapsed] = useState(false);
  const [expenseCollapsed, setExpenseCollapsed] = useState(false);

  /* ── FETCH ── */
  const fetchData = async () => {
    if (!month) return;
    setLoading(true);
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); endDate.setDate(0);
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

    const [{ data: incomeData }, { data: expenseData }, { data: bulkIncData }, { data: bulkExpData }, { data: sharedData }] = await Promise.all([
      supabase.from("income").select("*").gte("date", start).lte("date", end).order("date", { ascending: true }),
      supabase.from("expense").select("*").gte("date", start).lte("date", end).order("date", { ascending: true }),
      supabase.from("bulk_income").select("*").gte("date", start).lte("date", end).order("date", { ascending: true }),
      supabase.from("bulk_expense").select("*").gte("date", start).lte("date", end).order("date", { ascending: true }),
      supabase.from("shared_expense").select("*, shared_expense_split(*)").gte("date", start).lte("date", end).order("date", { ascending: true }),
    ]);
    setIncomes(incomeData || []); setExpenses(expenseData || []);
    setBulkIncomes(bulkIncData || []); setBulkExpenses(bulkExpData || []); setSharedExpenses(sharedData || []);

    const prevStart = new Date(startDate); prevStart.setMonth(prevStart.getMonth() - 1); prevStart.setDate(1);
    const prevEnd = new Date(prevStart); prevEnd.setMonth(prevEnd.getMonth() + 1); prevEnd.setDate(0);
    const [{ data: pInc }, { data: pExp }] = await Promise.all([
      supabase.from("income").select("*").gte("date", prevStart.toISOString().split("T")[0]).lte("date", prevEnd.toISOString().split("T")[0]),
      supabase.from("expense").select("*").gte("date", prevStart.toISOString().split("T")[0]).lte("date", prevEnd.toISOString().split("T")[0]),
    ]);
    setPrevIncome((pInc || []).reduce((s, i) => s + i.amount, 0));
    setPrevExpense((pExp || []).reduce((s, e) => s + e.amount, 0));
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, [month]);

  /* ── CALCS ── */
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;
  const totalBulkReceived = bulkIncomes.reduce((s, i) => s + i.amount, 0);
  const totalBulkIndivExp = bulkExpenses.reduce((s, e) => s + e.amount, 0);
  const totalSharedExp = sharedExpenses.reduce((s, e) => s + e.total_amount, 0);
  const totalBulkExpense = totalBulkIndivExp + totalSharedExp;
  const totalBulkRemaining = totalBulkReceived - totalBulkExpense;
  const hasBulkData = bulkIncomes.length > 0 || bulkExpenses.length > 0 || sharedExpenses.length > 0;
  const prevBalance = prevIncome - prevExpense;
  const incomeChange = prevIncome === 0 ? 100 : ((totalIncome - prevIncome) / prevIncome) * 100;
  const expenseChange = prevExpense === 0 ? 100 : ((totalExpense - prevExpense) / prevExpense) * 100;
  const balanceChange = prevBalance === 0 ? 100 : ((balance - prevBalance) / prevBalance) * 100;

  const allDates = [...new Set([...incomes.map(i => i.date), ...expenses.map(e => e.date)])];
  const trendData = useMemo(() => allDates
    .sort((a, b) => new Date(a) - new Date(b))
    .map(date => ({
      date: date.slice(8),
      Net: incomes.filter(i => i.date === date).reduce((s, i) => s + i.amount, 0)
        - expenses.filter(e => e.date === date).reduce((s, e) => s + e.amount, 0),
    })), [incomes, expenses]);

  const hasData = incomes.length > 0 || expenses.length > 0;

  /* ── BEST / WORST DAY ── */
  const dayIncome = {};
  const dayExpense = {};
  incomes.forEach(i => { dayIncome[i.date] = (dayIncome[i.date] || 0) + i.amount; });
  expenses.forEach(e => { dayExpense[e.date] = (dayExpense[e.date] || 0) + e.amount; });
  const allDayDates = [...new Set([...Object.keys(dayIncome), ...Object.keys(dayExpense)])];
  let bestDay = null, worstDay = null;
  allDayDates.forEach(d => {
    const inc = dayIncome[d] || 0;
    if (!bestDay || inc > (dayIncome[bestDay] || 0)) bestDay = d;
    const exp = dayExpense[d] || 0;
    if (!worstDay || exp > (dayExpense[worstDay] || 0)) worstDay = d;
  });

  /* ── SAVINGS RATE ── */
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
  const clampedRate = Math.max(0, Math.min(100, savingsRate));
  const RING_R = 54; const RING_C = 2 * Math.PI * RING_R;
  const ringDash = (clampedRate / 100) * RING_C;

  /* ── TOP SPENDERS ── */
  const expSumMap = useMemo(() => sumByKey(expenses, r => r.paid_to), [expenses]);
  const expCntMap = useMemo(() => countByKey(expenses, r => r.paid_to), [expenses]);
  const topSpenders = useMemo(() =>
    Object.entries(expSumMap)
      .map(([key, total]) => ({
        name: expenses.find(e => (e.paid_to || "").toLowerCase().trim() === key)?.paid_to || key,
        total,
        count: expCntMap[key] || 1,
      }))
      .sort((a, b) => b.total - a.total).slice(0, 3),
    [expSumMap, expCntMap, expenses]);
  const maxSpend = topSpenders[0]?.total || 1;

  /* ── PIE + BAR ── */
  const pieData = useMemo(() =>
    Object.entries(expSumMap)
      .map(([key, value]) => ({
        name: expenses.find(e => (e.paid_to || "").toLowerCase().trim() === key)?.paid_to || key,
        value,
      }))
      .sort((a, b) => b.value - a.value).slice(0, 8),
    [expSumMap, expenses]);
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);
  const barData = useMemo(() => pieData.map(d => ({ name: d.name.length > 12 ? d.name.slice(0, 11) + "…" : d.name, amount: d.value })), [pieData]);

  /* ── REPEAT ── */
  const incomeRepeatMap = useMemo(() => countByKey(incomes, r => r.service), [incomes]);
  const expenseRepeatMap = useMemo(() => countByKey(expenses, r => r.paid_to), [expenses]);
  const incomeSumMap = useMemo(() => sumByKey(incomes, r => r.service), [incomes]);
  const expenseSumMap = useMemo(() => sumByKey(expenses, r => r.paid_to), [expenses]);
  const repeatIncomeNames = Object.values(incomeRepeatMap).filter(v => v >= 2).length;
  const repeatExpenseNames = Object.values(expenseRepeatMap).filter(v => v >= 2).length;

  /* ── TOP GAINERS ── */
  const incSumMap2 = useMemo(() => sumByKey(incomes, r => r.service), [incomes]);
  const incCntMap2 = useMemo(() => countByKey(incomes, r => r.service), [incomes]);
  const topGainers = useMemo(() =>
    Object.entries(incSumMap2)
      .map(([key, total]) => ({
        name: incomes.find(i => (i.service || "").toLowerCase().trim() === key)?.service || key,
        total,
        count: incCntMap2[key] || 1,
      }))
      .sort((a, b) => b.total - a.total).slice(0, 5),
    [incSumMap2, incCntMap2, incomes]);
  const maxGain = topGainers[0]?.total || 1;

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return { value: d.toISOString().slice(0, 7), label: d.toLocaleString("default", { month: "long", year: "numeric" }) };
  });

  const currentMonthLabel = monthOptions.find(o => o.value === month)?.label || month;

  const avatarColor = (name = "") => {
    const cols = ["#0d9488", "#16a34a", "#7c3aed", "#db2777", "#b45309", "#1d4ed8", "#dc2626"];
    let h = 0; for (let c of name) h = c.charCodeAt(0) + ((h << 5) - h);
    return cols[Math.abs(h) % cols.length];
  };
  const fmt = n => Math.round(n).toLocaleString("en-IN");

  /* ── EXPORT HANDLERS ── */
  const handleExportPdf = () => {
    const savingsColor = savingsRate >= 50 ? "#0d9488" : savingsRate >= 20 ? "#b45309" : "#dc2626";

    const tableRows = (rows, keyFn, amtColor, repMap) => rows.map((row, idx) => {
      const key = (keyFn(row) || "").toLowerCase().trim();
      const isRepeat = (repMap[key] || 1) >= 2;
      const bg = isRepeat ? "#fffbeb" : idx % 2 === 0 ? "#ffffff" : "#faf8f5";
      const leftBorder = isRepeat ? "border-left:3px solid #f59e0b;" : "";
      const repeatTag = isRepeat ? `<span style="font-size:6.5pt;font-weight:700;background:#f59e0b;color:#fff;padding:1px 5px;border-radius:3px;margin-left:5px;">repeat</span>` : "";
      return `<tr>
        <td style="padding:5px 8px;border-bottom:1px solid #e8e4df;text-align:center;color:#999;font-size:7.5pt;background:${bg};${leftBorder}">${idx + 1}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e8e4df;font-family:monospace;font-size:8pt;color:#555;background:${bg};">${row.date}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e8e4df;background:${bg};">${keyFn(row) || ""}${repeatTag}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #e8e4df;text-align:right;font-weight:700;color:${amtColor};background:${bg};">${Number(row.amount).toLocaleString("en-IN")}</td>
      </tr>`;
    }).join("");

    const tableHTML = (title, rows, keyFn, amtColor, totalColor, totalLabel, total, repMap, badgeClass) => `
      <div style="font-family:Georgia,serif;font-size:12pt;font-weight:700;color:#1c1a17;margin:10px 0 6px;padding-bottom:4px;border-bottom:1.5px solid #999;overflow:hidden;">
        <span style="float:right;font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:2px 8px;border-radius:10px;margin-top:3px;background:${badgeClass === "income" ? "#dcfce7" : "#fee2e2"};color:${badgeClass === "income" ? "#16a34a" : "#dc2626"};">${rows.length} Records</span>
        ${title}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:8.5pt;table-layout:fixed;">
        <colgroup>
          <col style="width:28px"/>
          <col style="width:84px"/>
          <col/>
          <col style="width:90px"/>
        </colgroup>
        <thead>
          <tr style="background:#f0ede8;">
            <th style="padding:6px 8px;text-align:center;font-size:7pt;text-transform:uppercase;letter-spacing:0.08em;color:#777;border-top:1px solid #ccc;border-bottom:1px solid #ccc;">#</th>
            <th style="padding:6px 8px;font-size:7pt;text-transform:uppercase;letter-spacing:0.08em;color:#777;border-top:1px solid #ccc;border-bottom:1px solid #ccc;">Date</th>
            <th style="padding:6px 8px;font-size:7pt;text-transform:uppercase;letter-spacing:0.08em;color:#777;border-top:1px solid #ccc;border-bottom:1px solid #ccc;">${badgeClass === "income" ? "Service / Source" : "Paid To"}</th>
            <th style="padding:6px 8px;text-align:right;font-size:7pt;text-transform:uppercase;letter-spacing:0.08em;color:#777;border-top:1px solid #ccc;border-bottom:1px solid #ccc;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>${tableRows(rows, keyFn, amtColor, repMap)}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:7px 8px;font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#666;border-top:2px solid #1c1a17;">${totalLabel}</td>
            <td style="padding:7px 8px;text-align:right;font-weight:700;font-size:10pt;font-family:Georgia,serif;color:${totalColor};border-top:2px solid #1c1a17;">₹${fmt(total)}</td>
          </tr>
        </tfoot>
      </table>`;

    const headerHTML = (subtitle) => `
      <div style="border-bottom:2px solid #1c1a17;padding-bottom:8px;margin-bottom:12px;overflow:hidden;">
        <div style="float:left;font-family:Georgia,serif;font-size:20pt;font-weight:900;color:#1c1a17;line-height:1.1;">Monthly Financial <em style="color:#0d9488;">Report</em></div>
        <div style="float:right;text-align:right;font-size:8pt;color:#555;line-height:1.7;">
          <div style="font-size:10pt;font-weight:700;color:#1c1a17;">${currentMonthLabel}${subtitle ? " — " + subtitle : ""}</div>
          <div>Generated: ${printDate}</div>
        </div>
        <div style="clear:both;"></div>
      </div>`;

    const summaryHTML = `
      <table style="width:100%;border-collapse:collapse;margin-bottom:14px;table-layout:fixed;">
        <tbody><tr>
          <td style="border:1.5px solid #d0c9be;padding:8px 10px;text-align:center;">
            <span style="display:block;font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9a9187;margin-bottom:4px;">Total Income</span>
            <span style="display:block;font-family:Georgia,serif;font-size:14pt;font-weight:700;color:#16a34a;">₹${fmt(totalIncome)}</span>
          </td>
          <td style="border:1.5px solid #d0c9be;padding:8px 10px;text-align:center;">
            <span style="display:block;font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9a9187;margin-bottom:4px;">Total Expense</span>
            <span style="display:block;font-family:Georgia,serif;font-size:14pt;font-weight:700;color:#dc2626;">₹${fmt(totalExpense)}</span>
          </td>
          <td style="border:1.5px solid #d0c9be;padding:8px 10px;text-align:center;">
            <span style="display:block;font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9a9187;margin-bottom:4px;">Balance</span>
            <span style="display:block;font-family:Georgia,serif;font-size:14pt;font-weight:700;color:${balance >= 0 ? "#0d9488" : "#dc2626"};">₹${fmt(balance)}</span>
          </td>
          <td style="border:1.5px solid #d0c9be;padding:8px 10px;text-align:center;">
            <span style="display:block;font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9a9187;margin-bottom:4px;">Savings Rate</span>
            <span style="display:block;font-family:Georgia,serif;font-size:14pt;font-weight:700;color:${savingsColor};">${clampedRate}%</span>
          </td>
        </tr></tbody>
      </table>`;

    const summaryBoxHTML = `
      <div style="margin-top:20px;border:1.5px solid #ccc;padding:10px 14px;page-break-inside:avoid;">
        <div style="font-family:Georgia,serif;font-size:10pt;font-weight:700;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #e0e0e0;">Monthly Summary</div>
        <table style="width:100%;font-size:8.5pt;border-collapse:collapse;">
          <tbody>
            <tr><td style="padding:3px 0;color:#555;">Total Income</td><td style="text-align:right;font-weight:700;color:#16a34a;">₹${fmt(totalIncome)}</td></tr>
            <tr><td style="padding:3px 0;color:#555;">Total Expense</td><td style="text-align:right;font-weight:700;color:#dc2626;">₹${fmt(totalExpense)}</td></tr>
            <tr style="border-top:1.5px solid #1c1a17;">
              <td style="padding:6px 0 3px;font-weight:700;">Balance</td>
              <td style="text-align:right;font-weight:700;color:${balance >= 0 ? "#0d9488" : "#dc2626"};padding-top:6px;">₹${fmt(balance)}</td>
            </tr>
            <tr><td style="padding:3px 0;color:#555;">Savings Rate</td><td style="text-align:right;font-weight:700;color:${savingsColor};">${clampedRate}%</td></tr>
          </tbody>
        </table>
        <div style="background:#e8e4df;height:7px;width:100%;margin-top:10px;border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${clampedRate}%;background:${savingsColor};border-radius:4px;"></div>
        </div>
      </div>`;

    const footerHTML = `
      <div style="margin-top:14px;padding-top:6px;border-top:1px solid #ddd;font-size:7pt;color:#aaa;overflow:hidden;">
        <span style="float:left;">Monthly Report · ${currentMonthLabel}</span>
        <span style="float:right;">Generated on ${printDate}</span>
        <div style="clear:both;"></div>
      </div>`;

    const fullHTML = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>Monthly Report – ${currentMonthLabel}</title>
<style>
  @page { size: A4 portrait; margin: 14mm 12mm 14mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 9pt; color: #1c1a17; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  table { border-collapse: collapse; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  tr { page-break-inside: avoid; }
</style>
</head>
<body>
  ${headerHTML("")}
  ${summaryHTML}
  ${incomes.length > 0 ? tableHTML("Income Transactions", incomes, r => r.service, "#16a34a", "#16a34a", "Total Income", totalIncome, incRepMap, "income") : ""}
  ${expenses.length > 0 ? '<div style="page-break-before:always;break-before:page;"></div>' : ""}
  ${expenses.length > 0 ? headerHTML("Expenses") : ""}
  ${expenses.length > 0 ? tableHTML("Expense Transactions", expenses, r => r.paid_to, "#dc2626", "#dc2626", "Total Expense", totalExpense, expRepMap, "expense") : ""}
  ${expenses.length > 0 ? summaryBoxHTML : ""}
  ${footerHTML}
</body></html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (win) {
      win.document.write(fullHTML);
      win.document.close();
      setTimeout(() => { win.focus(); win.print(); }, 600);
    }
  };
  const handleIncomeCsv = () => exportIncomeCSV(incomes, currentMonthLabel);
  const handleExpenseCsv = () => exportExpenseCSV(expenses, currentMonthLabel);
  const handleBothCsv = () => exportBothCSV(incomes, expenses, currentMonthLabel);

  /* ── PRINT DATA ── */
  const printDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const incRepMap = useMemo(() => countByKey(incomes, r => r.service), [incomes]);
  const expRepMap = useMemo(() => countByKey(expenses, r => r.paid_to), [expenses]);

  return (
    <>
      <style>{CSS}</style>

      {/* PRINT-ONLY VIEW */}
      <div id="pdf-print-view">

        {/* ── Header ── */}
        <div className="pdf-report-header">
          <div className="pdf-report-title">Monthly Financial <span>Report</span></div>
          <div className="pdf-report-meta">
            <div className="pdf-report-month">{currentMonthLabel}</div>
            <div>Generated: {printDate}</div>
          </div>
          <div className="pdf-clearfix" />
        </div>

        {/* ── Summary — proper HTML table, no flex ── */}
        <table className="pdf-summary-table">
          <tbody>
            <tr>
              <td><span className="pdf-summary-label">Total Income</span><span className="pdf-summary-value green">&#8377;{fmt(totalIncome)}</span></td>
              <td><span className="pdf-summary-label">Total Expense</span><span className="pdf-summary-value red">&#8377;{fmt(totalExpense)}</span></td>
              <td><span className="pdf-summary-label">Balance</span><span className={`pdf-summary-value ${balance >= 0 ? "teal" : "red"}`}>&#8377;{fmt(balance)}</span></td>
              <td><span className="pdf-summary-label">Savings Rate</span><span className={`pdf-summary-value ${savingsRate >= 30 ? "teal" : "red"}`}>{clampedRate}%</span></td>
            </tr>
          </tbody>
        </table>

        {/* ── Income Table ── */}
        {incomes.length > 0 && (
          <>
            <div className="pdf-section-title">
              <span className="pdf-section-badge income">{incomes.length} Records</span>
              Income Transactions
            </div>
            <table className="pdf-table">
              <thead>
                <tr>
                  <th className="center" style={{ width: "28px" }}>#</th>
                  <th style={{ width: "82px" }}>Date</th>
                  <th>Service / Source</th>
                  <th className="right" style={{ width: "90px" }}>Amount (&#8377;)</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((row, idx) => {
                  const key = (row.service || "").toLowerCase().trim();
                  const isRepeat = (incRepMap[key] || 1) >= 2;
                  return (
                    <tr key={row.id} className={isRepeat ? "pdf-repeat" : ""}>
                      <td className="center" style={{ color: "#999", fontSize: "7.5pt" }}>{idx + 1}</td>
                      <td className="mono">{row.date}</td>
                      <td>
                        {row.service}
                        {isRepeat && <span className="pdf-repeat-tag">repeat</span>}
                      </td>
                      <td className="right" style={{ fontWeight: 700, color: "#16a34a" }}>
                        {Number(row.amount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="pdf-total-row">
                  <td colSpan={3} className="pdf-total-label">Total Income</td>
                  <td className="pdf-total-income">&#8377;{fmt(totalIncome)}</td>
                </tr>
              </tfoot>
            </table>
          </>
        )}

        {/* ── Page break before Expense ── */}
        {expenses.length > 0 && <div className="pdf-page-break" />}

        {/* ── Expense Table ── */}
        {expenses.length > 0 && (
          <>
            {/* Repeat header on page 2 */}
            <div className="pdf-report-header">
              <div className="pdf-report-title">Monthly Financial <span>Report</span></div>
              <div className="pdf-report-meta">
                <div className="pdf-report-month">{currentMonthLabel} &mdash; Expenses</div>
                <div>Generated: {printDate}</div>
              </div>
              <div className="pdf-clearfix" />
            </div>

            <div className="pdf-section-title">
              <span className="pdf-section-badge expense">{expenses.length} Records</span>
              Expense Transactions
            </div>
            <table className="pdf-table">
              <thead>
                <tr>
                  <th className="center" style={{ width: "28px" }}>#</th>
                  <th style={{ width: "82px" }}>Date</th>
                  <th>Paid To</th>
                  <th className="right" style={{ width: "90px" }}>Amount (&#8377;)</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((row, idx) => {
                  const key = (row.paid_to || "").toLowerCase().trim();
                  const isRepeat = (expRepMap[key] || 1) >= 2;
                  return (
                    <tr key={row.id} className={isRepeat ? "pdf-repeat" : ""}>
                      <td className="center" style={{ color: "#999", fontSize: "7.5pt" }}>{idx + 1}</td>
                      <td className="mono">{row.date}</td>
                      <td>
                        {row.paid_to}
                        {isRepeat && <span className="pdf-repeat-tag">repeat</span>}
                      </td>
                      <td className="right" style={{ fontWeight: 700, color: "#dc2626" }}>
                        {Number(row.amount).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="pdf-total-row">
                  <td colSpan={3} className="pdf-total-label">Total Expense</td>
                  <td className="pdf-total-expense">&#8377;{fmt(totalExpense)}</td>
                </tr>
              </tfoot>
            </table>

            {/* ── Final Summary Box ── */}
            <div className="pdf-summary-box">
              <div className="pdf-summary-box-title">Monthly Summary</div>
              <table>
                <tbody>
                  <tr>
                    <td style={{ color: "#555" }}>Total Income</td>
                    <td style={{ color: "#16a34a" }}>&#8377;{fmt(totalIncome)}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#555" }}>Total Expense</td>
                    <td style={{ color: "#dc2626" }}>&#8377;{fmt(totalExpense)}</td>
                  </tr>
                  <tr style={{ borderTop: "1.5px solid #1c1a17" }}>
                    <td style={{ fontWeight: 700, paddingTop: 6 }}>Balance</td>
                    <td style={{ color: balance >= 0 ? "#0d9488" : "#dc2626", fontWeight: 700, paddingTop: 6 }}>
                      &#8377;{fmt(balance)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ color: "#555" }}>Savings Rate</td>
                    <td style={{ color: savingsRate >= 30 ? "#0d9488" : "#dc2626" }}>{clampedRate}%</td>
                  </tr>
                </tbody>
              </table>
              <div className="pdf-savings-outer">
                <div className="pdf-savings-inner" style={{
                  width: `${clampedRate}%`,
                  background: savingsRate >= 50 ? "#0d9488" : savingsRate >= 20 ? "#b45309" : "#dc2626"
                }} />
              </div>
            </div>
          </>
        )}

        {/* ── Footer ── */}
        <div className="pdf-footer">
          <span className="pdf-footer-left">Monthly Report &middot; {currentMonthLabel}</span>
          <span className="pdf-footer-right">Generated on {printDate}</span>
          <div className="pdf-clearfix" />
        </div>

      </div>
      {/* END PRINT VIEW */}

      <Navbar />
      <div className="mr-root">

        {/* HEADER */}
        <div className="mr-header">
          <div className="mr-header-inner">
            <div>
              <div className="mr-eyebrow">Monthly Report</div>
              <h1 className="mr-title">Income & expense <em>overview</em></h1>
            </div>
            <div className="mr-header-right">
              {hasData && !loading && (
                <ExportDropdown
                  onPdf={handleExportPdf}
                  onIncomeCsv={handleIncomeCsv}
                  onExpenseCsv={handleExpenseCsv}
                  onBothCsv={handleBothCsv}
                  hasIncome={incomes.length > 0}
                  hasExpense={expenses.length > 0}
                />
              )}
              <div className="mr-select-wrap">
                <label className="mr-select-label">Select Month</label>
                <select className="mr-select" value={month} onChange={e => setMonth(e.target.value)}>
                  <option value="">Choose a month</option>
                  {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mr-wrap">
          {!month && (
            <div className="mr-empty">
              <span className="mr-empty-icon">📊</span>
              <div className="mr-empty-title">Select a month to begin</div>
              <div className="mr-empty-sub">Choose a month above to view your financial summary</div>
            </div>
          )}
          {month && loading && <div className="loading-text">Loading data…</div>}

          {/* ── SUMMARY ── */}
          {hasData && !loading && (
            <>
              <p className="section-title">Summary</p>
              <div className="stats-grid">
                <StatCard label="Total Income" value={totalIncome} valCls="green" accentColor="#16a34a" percent={incomeChange} />
                <StatCard label="Total Expense" value={totalExpense} valCls="red" accentColor="#dc2626" percent={expenseChange} />
                <StatCard label="Balance" value={balance} valCls={balance >= 0 ? "teal" : "red"} accentColor={balance >= 0 ? "#0d9488" : "#dc2626"} percent={balanceChange} />
              </div>

              {/* ── TOP SPENDERS ── */}
              {topSpenders.length > 0 && (
                <>
                  <p className="section-title">Top Spenders</p>
                  <div className="top-spenders-grid">
                    {topSpenders.map((s, i) => (
                      <div className="spender-card" key={s.name}>
                        <div className="spender-rank">#{i + 1}</div>
                        <div className="spender-info">
                          <div className="spender-name" title={s.name}>{s.name}</div>
                          <div className="spender-count">{s.count} transaction{s.count > 1 ? "s" : ""}</div>
                          <div className="spender-amount">₹{fmt(s.total)}</div>
                          <div className="spender-bar-wrap">
                            <div className="spender-bar" style={{ width: `${(s.total / maxSpend) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── TOP GAINERS ── */}
              {topGainers.length > 0 && (
                <>
                  <p className="section-title">Top 5 Gainers</p>
                  <div className="top-gainers-grid">
                    {topGainers.map((g, i) => (
                      <div className="gainer-card" key={g.name}>
                        <div className="gainer-rank-row">
                          <span className="gainer-rank">#{i + 1}</span>
                          <span className="gainer-count-badge">{g.count}x</span>
                        </div>
                        <div className="gainer-name" title={g.name}>{g.name}</div>
                        <div className="gainer-count">{g.count} transaction{g.count > 1 ? "s" : ""}</div>
                        <div className="gainer-amount">₹{fmt(g.total)}</div>
                        <div className="gainer-bar-wrap">
                          <div className="gainer-bar" style={{ width: `${(g.total / maxGain) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── SAVINGS RATE RING ── */}
              <p className="section-title">Savings Rate</p>
              <div className="savings-ring-card">
                <div className="ring-wrap">
                  <svg width="130" height="130" viewBox="0 0 130 130">
                    <circle cx="65" cy="65" r={RING_R} fill="none" stroke="var(--border2)" strokeWidth="10" />
                    <circle cx="65" cy="65" r={RING_R} fill="none"
                      stroke={savingsRate >= 50 ? "#0d9488" : savingsRate >= 20 ? "#b45309" : "#dc2626"}
                      strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${ringDash} ${RING_C}`}
                      style={{ transition: "stroke-dasharray 1s ease" }}
                    />
                  </svg>
                  <div className="ring-center">
                    <span className="ring-pct">{clampedRate}%</span>
                    <span className="ring-sub">saved</span>
                  </div>
                </div>
                <div className="ring-info">
                  <div className="ring-title">
                    {savingsRate >= 60 ? "💚 Excellent savings!" : savingsRate >= 30 ? "🟡 Good progress" : savingsRate >= 0 ? "🔴 Low savings" : "⚠️ Overspent"}
                  </div>
                  <div className="ring-desc">
                    {savingsRate >= 0
                      ? `You saved ₹${fmt(totalIncome - totalExpense)} out of ₹${fmt(totalIncome)} earned this month.`
                      : `Expenses exceeded income by ₹${fmt(Math.abs(totalIncome - totalExpense))}.`}
                  </div>
                  <div className="ring-pills">
                    <div className="ring-pill"><div className="ring-pill-dot" style={{ background: "var(--green)" }} />Income ₹{fmt(totalIncome)}</div>
                    <div className="ring-pill"><div className="ring-pill-dot" style={{ background: "var(--red)" }} />Spent ₹{fmt(totalExpense)}</div>
                    <div className="ring-pill"><div className="ring-pill-dot" style={{ background: "var(--teal)" }} />Saved ₹{fmt(Math.max(0, totalIncome - totalExpense))}</div>
                  </div>
                </div>
              </div>

              {/* ── BEST / WORST DAY ── */}
              {(bestDay || worstDay) && (
                <>
                  <p className="section-title">Best & Worst Day</p>
                  <div className="bw-grid">
                    {bestDay && (
                      <div className="bw-card">
                        <div className="bw-accent" style={{ background: "var(--green)" }} />
                        <div className="bw-label">🏆 Best Income Day</div>
                        <div className="bw-date">{new Date(bestDay).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</div>
                        <div className="bw-amount" style={{ color: "var(--green)" }}>₹{fmt(dayIncome[bestDay] || 0)}</div>
                      </div>
                    )}
                    {worstDay && (
                      <div className="bw-card">
                        <div className="bw-accent" style={{ background: "var(--red)" }} />
                        <div className="bw-label">💸 Highest Expense Day</div>
                        <div className="bw-date">{new Date(worstDay).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</div>
                        <div className="bw-amount" style={{ color: "var(--red)" }}>₹{fmt(dayExpense[worstDay] || 0)}</div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── EXPENSE BREAKDOWN: PIE + BAR ── */}
          {pieData.length > 0 && !loading && (
            <>
              <p className="section-title">Expense Breakdown</p>
              <div className="chart-grid">
                <div className="chart-card" style={{ marginBottom: 0 }}>
                  <p className="section-title" style={{ fontSize: 14, marginBottom: 12 }}>By Payee</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                        {pieData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pie-legend">
                    {pieData.map((d, idx) => (
                      <div className="pie-legend-item" key={d.name}>
                        <div className="pie-legend-dot" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                        <span className="pie-legend-name" title={d.name}>{d.name}</span>
                        <span className="pie-legend-val">₹{fmt(d.value)}</span>
                        <span className="pie-legend-pct">{((d.value / pieTotal) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chart-card" style={{ marginBottom: 0 }}>
                  <p className="section-title" style={{ fontSize: 14, marginBottom: 12 }}>Amount Comparison</p>
                  <ResponsiveContainer width="100%" height={barData.length * 44 + 40}>
                    <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
                      <XAxis type="number" tick={{ fill: "#9a9187", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={94} tick={{ fill: "#5a5449", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: "#fff", border: "1.5px solid #e2dcd4", borderRadius: 10, fontFamily: "DM Sans", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                        formatter={v => [`₹${fmt(v)}`, "Spent"]}
                        cursor={{ fill: "rgba(220,38,38,0.05)" }}
                      />
                      <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={26}>
                        {barData.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* ── INCOME TABLE ── */}
          {incomes.length > 0 && !loading && (
            <div className="table-card">
              {/* Header row with title + CSV button */}
              <div className="table-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                  <span style={{
                    fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700,
                    color: "var(--green)", whiteSpace: "nowrap", cursor: "pointer"
                  }} onClick={() => setIncomeCollapsed(v => !v)}>
                    💚 Income Transactions
                  </span>
                  <span style={{ flex: 1, height: "1.5px", background: "var(--border)", borderRadius: 2, minWidth: 20, display: "block" }} />
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    className="table-csv-btn income no-print"
                    onClick={handleIncomeCsv}
                    title={`Download income CSV for ${currentMonthLabel}`}
                  >
                    ⬇ CSV
                  </button>
                  <button
                    className="collapse-btn no-print"
                    onClick={() => setIncomeCollapsed(v => !v)}
                    title={incomeCollapsed ? "Expand table" : "Collapse table"}
                  >
                    <span className={`collapse-arrow ${incomeCollapsed ? "" : "open"}`}>▲</span>
                    {incomeCollapsed ? "Show" : "Hide"}
                  </button>
                </div>
              </div>

              <div className={`table-collapsible${incomeCollapsed ? " collapsed" : ""}`}>
                {repeatIncomeNames > 0 && (
                  <div className="repeat-legend">
                    <div className="repeat-legend-dot" />
                    ⚡ {repeatIncomeNames} service name{repeatIncomeNames > 1 ? "s" : ""} appear multiple times this month — highlighted below
                  </div>
                )}
                <table className="mr-table">
                  <thead><tr><th>Date</th><th>Service</th><th className="right">Amount</th></tr></thead>
                  <tbody>
                    {incomes.map(row => {
                      const key = (row.service || "").toLowerCase().trim();
                      const count = incomeRepeatMap[key] || 1;
                      const total = incomeSumMap[key] || 0;
                      const isRepeat = count >= 2;
                      return (
                        <tr key={row.id} className={isRepeat ? "repeat-row" : ""}>
                          <td><span className="date-chip">{row.date}</span></td>
                          <td style={{ fontWeight: 500 }}>
                            {row.service}
                            {isRepeat && <RepeatBadge count={count} total={total} />}
                          </td>
                          <td className="right" style={{ fontWeight: 600, color: "var(--green)" }}>₹{row.amount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="table-footer" style={{ color: "var(--green)" }}>Total Income: ₹{totalIncome}</div>
              </div>
            </div>
          )}

          {/* ── EXPENSE TABLE ── */}
          {expenses.length > 0 && !loading && (
            <div className="table-card">
              {/* Header row with title + CSV button */}
              <div className="table-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                  <span style={{
                    fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700,
                    color: "var(--red)", whiteSpace: "nowrap", cursor: "pointer"
                  }} onClick={() => setExpenseCollapsed(v => !v)}>
                    ❤️ Expense Transactions
                  </span>
                  <span style={{ flex: 1, height: "1.5px", background: "var(--border)", borderRadius: 2, minWidth: 20, display: "block" }} />
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    className="table-csv-btn expense no-print"
                    onClick={handleExpenseCsv}
                    title={`Download expense CSV for ${currentMonthLabel}`}
                  >
                    ⬇ CSV
                  </button>
                  <button
                    className="collapse-btn no-print"
                    onClick={() => setExpenseCollapsed(v => !v)}
                    title={expenseCollapsed ? "Expand table" : "Collapse table"}
                  >
                    <span className={`collapse-arrow ${expenseCollapsed ? "" : "open"}`}>▲</span>
                    {expenseCollapsed ? "Show" : "Hide"}
                  </button>
                </div>
              </div>

              <div className={`table-collapsible${expenseCollapsed ? " collapsed" : ""}`}>
                {repeatExpenseNames > 0 && (
                  <div className="repeat-legend">
                    <div className="repeat-legend-dot" />
                    ⚡ {repeatExpenseNames} payee name{repeatExpenseNames > 1 ? "s" : ""} appear multiple times this month — highlighted below
                  </div>
                )}
                <table className="mr-table">
                  <thead><tr><th>Date</th><th>Paid To</th><th className="right">Amount</th></tr></thead>
                  <tbody>
                    {expenses.map(row => {
                      const key = (row.paid_to || "").toLowerCase().trim();
                      const count = expenseRepeatMap[key] || 1;
                      const total = expenseSumMap[key] || 0;
                      const isRepeat = count >= 2;
                      return (
                        <tr key={row.id} className={isRepeat ? "repeat-row" : ""}>
                          <td><span className="date-chip">{row.date}</span></td>
                          <td style={{ fontWeight: 500 }}>
                            {row.paid_to}
                            {isRepeat && <RepeatBadge count={count} total={total} />}
                          </td>
                          <td className="right" style={{ fontWeight: 600, color: "var(--red)" }}>₹{row.amount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="table-footer" style={{ color: "var(--red)" }}>Total Expense: ₹{totalExpense}</div>
              </div>
            </div>
          )}

          {/* ── TREND CHART ── */}
          {trendData.length > 0 && !loading && (
            <div className="chart-card">
              <p className="section-title">Daily Net Trend</p>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={balance >= 0 ? "#16a34a" : "#dc2626"} stopOpacity={0.18} />
                      <stop offset="95%" stopColor={balance >= 0 ? "#16a34a" : "#dc2626"} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "#9a9187", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9a9187", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1.5px solid #e2dcd4", borderRadius: 10, fontFamily: "DM Sans", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} formatter={v => [`₹${v}`, "Net"]} labelFormatter={l => `Day ${l}`} />
                  <Area type="monotone" dataKey="Net" stroke={balance >= 0 ? "#16a34a" : "#dc2626"} fill="url(#netGradient)" strokeWidth={2.5} dot={{ fill: balance >= 0 ? "#16a34a" : "#dc2626", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1.5px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>vs Last Month:</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-med)" }}>Net ₹{prevIncome - prevExpense}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: balanceChange >= 0 ? "var(--green-bg)" : "var(--red-bg)", color: balanceChange >= 0 ? "var(--green)" : "var(--red)" }}>
                  {balanceChange >= 0 ? "▲" : "▼"} {Math.abs(balanceChange).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* ── BULK ── */}
          {hasBulkData && !loading && (
            <div className="bulk-section">
              <div className="bulk-section-header">
                <div>
                  <div className="bulk-header-title">🔗 Bulk Tracker Summary</div>
                  <div className="bulk-header-sub">Person-wise bulk income & expenses for this month</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.75)", fontWeight: 600, marginBottom: 2 }}>Net Remaining</div>
                  <div style={{ fontFamily: "Playfair Display,serif", fontSize: 22, fontWeight: 700, color: "#fff" }}>₹{fmt(totalBulkRemaining)}</div>
                </div>
              </div>
              <div className="bulk-stats-row">
                <div className="bulk-stat-cell"><div className="bulk-stat-label">Total Received</div><div className="bulk-stat-value" style={{ color: "var(--green)" }}>₹{fmt(totalBulkReceived)}</div></div>
                <div className="bulk-stat-cell"><div className="bulk-stat-label">Total Spent</div><div className="bulk-stat-value" style={{ color: "var(--red)" }}>₹{fmt(totalBulkExpense)}</div></div>
                <div className="bulk-stat-cell"><div className="bulk-stat-label">Remaining</div><div className="bulk-stat-value" style={{ color: totalBulkRemaining >= 0 ? "var(--teal)" : "var(--red)" }}>₹{fmt(totalBulkRemaining)}</div></div>
              </div>
              <div className="bulk-body">
                {bulkIncomes.length > 0 && (
                  <>
                    <p className="section-title" style={{ fontSize: 15, marginBottom: 12 }}>Person-wise Breakdown</p>
                    {bulkIncomes.map(inc => {
                      const indivSpent = bulkExpenses.filter(e => e.bulk_income_id === inc.id).reduce((s, e) => s + e.amount, 0);
                      const sharedCut = sharedExpenses.reduce((s, se) => { const sp = (se.shared_expense_split || []).find(x => x.bulk_income_id === inc.id); return s + (sp ? sp.split_amount : 0); }, 0);
                      const remaining = inc.amount - indivSpent - sharedCut;
                      return (
                        <div className="bulk-person-row" key={inc.id}>
                          <div className="bulk-avatar" style={{ background: avatarColor(inc.person_name) }}>{inc.person_name.charAt(0).toUpperCase()}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="bulk-person-name">{inc.person_name}</div>
                            <div className="bulk-person-date">{inc.date}{inc.note ? ` · ${inc.note}` : ""}</div>
                          </div>
                          <div className="bulk-amt-group">
                            <span className="bulk-amt-pill" style={{ background: "var(--green-bg)", color: "var(--green)" }}>₹{fmt(inc.amount)} received</span>
                            <span className="bulk-amt-pill" style={{ background: "var(--red-bg)", color: "var(--red)" }}>₹{fmt(indivSpent + sharedCut)} spent</span>
                            <span className="bulk-amt-pill" style={{ background: remaining >= 0 ? "#e0f2f0" : "var(--red-bg)", color: remaining >= 0 ? "var(--teal)" : "var(--red)" }}>₹{fmt(remaining)} left</span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                {sharedExpenses.length > 0 && (
                  <>
                    <p className="section-title" style={{ fontSize: 15, marginTop: 20, marginBottom: 12 }}>Shared Expenses</p>
                    {sharedExpenses.map(se => (
                      <div key={se.id} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 0 }}>
                          <div style={{ fontSize: 16 }}>🔗</div>
                          <div style={{ flex: 1 }}>
                            <div className="bulk-shared-desc">{se.description}</div>
                            <div className="bulk-shared-date">{se.date}</div>
                          </div>
                          <div style={{ fontFamily: "Playfair Display,serif", fontSize: 17, fontWeight: 700, color: "#7c3aed" }}>₹{fmt(se.total_amount)}</div>
                        </div>
                        <div className="bulk-split-pills" style={{ paddingLeft: 28 }}>
                          {(se.shared_expense_split || []).map(sp => (
                            <div className="split-pill" key={sp.id}>
                              <div className="split-pill-av" style={{ background: avatarColor(sp.person_name) }}>{sp.person_name.charAt(0).toUpperCase()}</div>
                              {sp.person_name}
                              <span style={{ fontWeight: 700, color: "var(--red)", marginLeft: 4 }}>₹{fmt(sp.split_amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {month && !hasData && !loading && (
            <div className="mr-empty">
              <span className="mr-empty-icon">🗒️</span>
              <div className="mr-empty-title">No transactions found</div>
              <div className="mr-empty-sub">No income or expense data recorded for this month</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── STAT CARD ── */
const StatCard = ({ label, value, valCls, accentColor, percent }) => {
  const anim = useAnimatedNumber(percent ?? 0);
  const showChange = percent !== null;
  const up = percent >= 0;
  return (
    <div className="stat-card">
      <div className="stat-accent" style={{ background: accentColor }} />
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${valCls}`}>₹{value}</div>
      {showChange && (
        <span className={`stat-change ${up ? "up" : "down"}`}>
          {up ? "▲" : "▼"} {Math.abs(anim).toFixed(1)}%
        </span>
      )}
    </div>
  );
};