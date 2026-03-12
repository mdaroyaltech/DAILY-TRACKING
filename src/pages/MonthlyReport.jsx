import { useEffect, useState, useMemo, useRef } from "react";
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
  --blue:      #1d4ed8;
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

/* ─── EXPORT BUTTON ─── */
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

/* ─── HOME PILLS ─── */
.home-stats-row { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:28px; }
.home-stat-pill { display:flex; align-items:center; gap:10px; background:var(--surface); border:1.5px solid var(--border); border-radius:12px; padding:14px 20px; box-shadow:var(--shadow-sm); flex:1; min-width:140px; }
.home-stat-icon { width:36px; height:36px; border-radius:10px; background:var(--teal-light); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
.home-stat-label { font-size:10px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:var(--text-dim); margin-bottom:2px; }
.home-stat-value { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; color:var(--teal); }

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

/* ─── PRINT ─── */
@media print {
  .no-print, .export-btn { display:none !important; }
  .mr-root { padding-bottom:0; background:#fff !important; }
  .stat-card,.table-card,.chart-card,.spender-card,.bulk-section { break-inside:avoid; }
  .chart-grid { grid-template-columns:1fr 1.6fr !important; }
}
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
  const totalGivenToHome = incomes.reduce((s, i) => s + (Number(i.given_to_home) || 0), 0);
  const remainingAfterHome = totalIncome - totalGivenToHome;
  const momTotal = incomes.filter(i => i.given_to_whom === "Mom").reduce((s, i) => s + (i.given_to_home || 0), 0);
  const dadTotal = incomes.filter(i => i.given_to_whom === "Dad").reduce((s, i) => s + (i.given_to_home || 0), 0);
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

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return { value: d.toISOString().slice(0, 7), label: d.toLocaleString("default", { month: "long", year: "numeric" }) };
  });
  const avatarColor = (name = "") => {
    const cols = ["#0d9488", "#16a34a", "#7c3aed", "#db2777", "#b45309", "#1d4ed8", "#dc2626"];
    let h = 0; for (let c of name) h = c.charCodeAt(0) + ((h << 5) - h);
    return cols[Math.abs(h) % cols.length];
  };
  const fmt = n => Math.round(n).toLocaleString("en-IN");

  /* ── EXPORT PDF ── */
  const handleExport = () => {
    const prev = document.title;
    const label = monthOptions.find(o => o.value === month)?.label || month;
    document.title = `Monthly Report – ${label}`;
    window.print();
    document.title = prev;
  };

  return (
    <>
      <style>{CSS}</style>
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
                <button className="export-btn no-print" onClick={handleExport}>
                  ⬇&nbsp; Export PDF
                </button>
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
                <StatCard label="Given To Home" value={totalGivenToHome} valCls="blue" accentColor="#1d4ed8" percent={null} />
                <StatCard label="Remaining" value={remainingAfterHome} valCls="green" accentColor="#16a34a" percent={null} />
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

              {/* ── HOME DIST ── */}
              {(momTotal > 0 || dadTotal > 0) && (
                <>
                  <p className="section-title">Home Distribution</p>
                  <div className="home-stats-row">
                    <div className="home-stat-pill"><div className="home-stat-icon">👩</div><div><div className="home-stat-label">Mom Total</div><div className="home-stat-value">₹{momTotal}</div></div></div>
                    <div className="home-stat-pill"><div className="home-stat-icon">👨</div><div><div className="home-stat-label">Dad Total</div><div className="home-stat-value">₹{dadTotal}</div></div></div>
                    <div className="home-stat-pill"><div className="home-stat-icon">🏠</div><div><div className="home-stat-label">Total Given</div><div className="home-stat-value">₹{totalGivenToHome}</div></div></div>
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

                {/* PIE */}
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

                {/* BAR */}
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
              <p className="section-title" style={{ color: "var(--green)" }}>Income Transactions</p>
              {repeatIncomeNames > 0 && (
                <div className="repeat-legend">
                  <div className="repeat-legend-dot" />
                  ⚡ {repeatIncomeNames} service name{repeatIncomeNames > 1 ? "s" : ""} appear multiple times this month — highlighted below
                </div>
              )}
              <table className="mr-table">
                <thead><tr><th>Date</th><th>Service</th><th className="right">Amount</th><th className="right">Home</th></tr></thead>
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
                        <td className="right">
                          {(Number(row.given_to_home) || 0) > 0
                            ? <span className="badge badge-home">₹{row.given_to_home} · {row.given_to_whom || "—"}</span>
                            : <span style={{ color: "var(--text-faint)" }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="table-footer" style={{ color: "var(--green)" }}>Total Income: ₹{totalIncome}</div>
            </div>
          )}

          {/* ── EXPENSE TABLE ── */}
          {expenses.length > 0 && !loading && (
            <div className="table-card">
              <p className="section-title" style={{ color: "var(--red)" }}>Expense Transactions</p>
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