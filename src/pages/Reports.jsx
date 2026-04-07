import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const toINR = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const fmt = (n) => (n || 0).toLocaleString("en-IN");

const toDateStr = (d) => d.toISOString().split("T")[0];
function todayStr() { return toDateStr(new Date()); }

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* ── Savings Ring (SVG donut) ── */
function SavingsRing({ rate, size = 52 }) {
    const r = size / 2 - 5;
    const circ = 2 * Math.PI * r;
    const clamped = Math.max(0, Math.min(100, rate));
    const dash = (clamped / 100) * circ;
    const color = rate >= 50 ? "var(--teal)" : rate >= 20 ? "var(--amber)" : "var(--red)";
    return (
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
                    strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    style={{ transition: "stroke-dasharray .8s ease" }} />
            </svg>
            <div style={{
                position: "absolute", inset: 0, display: "flex",
                alignItems: "center", justifyContent: "center",
            }}>
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{clamped}%</span>
            </div>
        </div>
    );
}

/* ── Mini progress bar ── */
function MiniBar({ value, max, color }) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div style={{ height: 4, borderRadius: 4, background: "var(--border)", overflow: "hidden", marginTop: 4, width: "100%" }}>
            <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: color, transition: "width .7s cubic-bezier(.4,0,.2,1)" }} />
        </div>
    );
}

/* ── Horizontal bar chart ── */
function HBarChart({ items, color, emptyMsg }) {
    if (!items.length) return (
        <div style={{ padding: "28px 0", textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>{emptyMsg}</div>
    );
    const max = items[0]?.total || 1;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item, i) => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-dim)", width: 16, textAlign: "right", flexShrink: 0 }}>#{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>{toINR(item.total)}</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 4, width: `${(item.total / max) * 100}%`, background: color, transition: "width .7s cubic-bezier(.4,0,.2,1)" }} />
                        </div>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-dim)", flexShrink: 0, width: 32, textAlign: "right" }}>{item.count}x</span>
                </div>
            ))}
        </div>
    );
}

/* ── Stat Card (same as Dashboard) ── */
function StatCard({ label, value, valCls, accent, icon, iconBg, sub, delay = 0 }) {
    return (
        <div className="stat-card" style={{ animationDelay: `${delay}ms` }}>
            <div className={`stat-card-accent ${accent}`} />
            <div className="stat-icon-bg" style={{ background: iconBg }}>{icon}</div>
            <div className="stat-label">{label}</div>
            <div className={`stat-value ${valCls}`}>{value}</div>
            {sub && <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>{sub}</div>}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════ */
export default function Reports() {

    /* ── state ── */
    const [yearData, setYearData] = useState([]);
    const [yearLoading, setYL] = useState(true);
    const [yearError, setYearError] = useState("");

    const [allIncome, setAllIncome] = useState([]);
    const [allExpense, setAllExpense] = useState([]);

    const [selectedYear, setSelectedYear] = useState("");
    const [monthExpanded, setMonthExpanded] = useState(false);
    const [sourcesExpanded, setSourcesExpanded] = useState(true);

    const [fromDate, setFromDate] = useState(() => { const d = new Date(); d.setDate(1); return toDateStr(d); });
    const [toDate, setToDate] = useState(todayStr);
    const [rangeData, setRangeData] = useState(null);
    const [rangeLoading, setRL] = useState(false);
    const [rangeError, setRangeError] = useState("");

    useEffect(() => { fetchAll(); }, []);

    /* ── Fetch everything ── */
    async function fetchAll() {
        setYL(true); setYearError("");
        try {
            const [
                { data: incData, error: incErr },
                { data: expData, error: expErr },
            ] = await Promise.all([
                supabase.from("income").select("date, amount, service").order("date", { ascending: true }),
                supabase.from("expense").select("date, amount, paid_to").order("date", { ascending: true }),
            ]);
            if (incErr) throw incErr;
            if (expErr) throw expErr;

            setAllIncome(incData || []);
            setAllExpense(expData || []);

            const map = {};
            (incData || []).forEach(({ date, amount }) => {
                const y = date?.slice(0, 4); if (!y) return;
                if (!map[y]) map[y] = { income: 0, expense: 0 };
                map[y].income += Number(amount) || 0;
            });
            (expData || []).forEach(({ date, amount }) => {
                const y = date?.slice(0, 4); if (!y) return;
                if (!map[y]) map[y] = { income: 0, expense: 0 };
                map[y].expense += Number(amount) || 0;
            });

            const sorted = Object.keys(map).sort((a, b) => b - a).map((y) => ({
                year: y, income: map[y].income, expense: map[y].expense,
                net: map[y].income - map[y].expense,
                savingsRate: map[y].income > 0 ? Math.round(((map[y].income - map[y].expense) / map[y].income) * 100) : 0,
            }));

            setYearData(sorted);
            if (sorted.length > 0) setSelectedYear(sorted[0].year);
        } catch (e) {
            console.error(e);
            setYearError("Failed to load data. Check your Supabase connection.");
        } finally { setYL(false); }
    }

    /* ── Month breakdown ── */
    const monthData = useMemo(() => {
        if (!selectedYear) return [];
        const map = {};
        allIncome.filter(r => r.date?.startsWith(selectedYear)).forEach(({ date, amount }) => {
            const m = parseInt(date?.slice(5, 7), 10) - 1; if (isNaN(m)) return;
            if (!map[m]) map[m] = { income: 0, expense: 0 };
            map[m].income += Number(amount) || 0;
        });
        allExpense.filter(r => r.date?.startsWith(selectedYear)).forEach(({ date, amount }) => {
            const m = parseInt(date?.slice(5, 7), 10) - 1; if (isNaN(m)) return;
            if (!map[m]) map[m] = { income: 0, expense: 0 };
            map[m].expense += Number(amount) || 0;
        });
        return Object.keys(map).sort((a, b) => Number(a) - Number(b)).map(m => ({
            month: MONTH_NAMES[m], fullMonth: FULL_MONTHS[m], idx: Number(m),
            income: map[m].income, expense: map[m].expense,
            net: map[m].income - map[m].expense,
        }));
    }, [selectedYear, allIncome, allExpense]);

    /* ── Top income sources ── */
    const topSources = useMemo(() => {
        const map = {};
        allIncome.forEach(({ service, amount }) => {
            const k = (service || "Unknown").trim();
            if (!map[k]) map[k] = { total: 0, count: 0 };
            map[k].total += Number(amount) || 0; map[k].count++;
        });
        return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.total - a.total).slice(0, 6);
    }, [allIncome]);

    /* ── Top expense payees ── */
    const topPayees = useMemo(() => {
        const map = {};
        allExpense.forEach(({ paid_to, amount }) => {
            const k = (paid_to || "Unknown").trim();
            if (!map[k]) map[k] = { total: 0, count: 0 };
            map[k].total += Number(amount) || 0; map[k].count++;
        });
        return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.total - a.total).slice(0, 6);
    }, [allExpense]);

    /* ── Date range fetch ── */
    async function fetchRange() {
        if (!fromDate || !toDate) { setRangeError("Please select both dates."); return; }
        if (fromDate > toDate) { setRangeError("'From' date must be before 'To' date."); return; }
        setRangeError(""); setRL(true);
        try {
            const [
                { data: incData, error: incErr },
                { data: expData, error: expErr },
            ] = await Promise.all([
                supabase.from("income").select("amount").gte("date", fromDate).lte("date", toDate),
                supabase.from("expense").select("amount").gte("date", fromDate).lte("date", toDate),
            ]);
            if (incErr) throw incErr; if (expErr) throw expErr;
            const income = (incData || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
            const expense = (expData || []).reduce((s, r) => s + (Number(r.amount) || 0), 0);
            setRangeData({ income, expense, net: income - expense });
        } catch (e) {
            console.error(e); setRangeError("Failed to fetch data. Try again.");
        } finally { setRL(false); }
    }

    const totalIncome = yearData.reduce((s, r) => s + r.income, 0);
    const totalExpense = yearData.reduce((s, r) => s + r.expense, 0);
    const totalNet = totalIncome - totalExpense;
    const overallSavings = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
    const maxMonthIncome = Math.max(...monthData.map(m => m.income), 1);
    const maxMonthExpense = Math.max(...monthData.map(m => m.expense), 1);
    const years = yearData.map(r => r.year);

    /* ── CSS (mirrors Dashboard exactly) ── */
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
  --purple:    #7c3aed;
  --purple-bg: #ede9fe;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow:    0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
}
* { box-sizing: border-box; margin: 0; padding: 0; }

/* ── ROOT ── */
.rp-root {
  min-height: 100vh;
  background: var(--bg);
  font-family: 'DM Sans', sans-serif;
  color: var(--text);
  padding-bottom: 80px;
}

/* ── ANIMATIONS ── */
@keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes popIn   { 0%{opacity:0;transform:scale(.85)} 65%{transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }
@keyframes spin    { to{transform:rotate(360deg)} }
@keyframes rowSlide{ from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
@keyframes collapseOpen { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
@keyframes skel    { 0%,100%{opacity:1} 50%{opacity:.4} }

.rp-header     { animation: fadeIn .45s ease both; }
.stat-card     { animation: popIn .4s ease both; }
.stat-card:nth-child(1){ animation-delay:.04s; }
.stat-card:nth-child(2){ animation-delay:.10s; }
.stat-card:nth-child(3){ animation-delay:.16s; }
.stat-card:nth-child(4){ animation-delay:.22s; }

/* ── HEADER ── */
.rp-header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 28px 0 22px;
  margin-bottom: 28px;
  box-shadow: var(--shadow-sm);
}
.rp-header-inner {
  max-width: 1100px; margin: auto; padding: 0 24px;
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
}
.rp-eyebrow {
  font-size: 10px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase;
  color: var(--teal); margin-bottom: 5px; display: flex; align-items: center; gap: 7px;
}
.rp-eyebrow::before { content:''; display:inline-block; width:18px; height:2px; background:var(--teal); border-radius:2px; }
.rp-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(22px, 3vw, 34px);
  font-weight: 900; line-height: 1.1; color: var(--text);
}
.rp-title em { font-style: italic; color: var(--teal); }

/* ── LAYOUT ── */
.rp-wrap { max-width: 1100px; margin: auto; padding: 0 24px; }
@media(max-width:480px){ .rp-wrap{padding:0 14px;} }

/* ── SECTION TITLE (same as Dashboard) ── */
.section-title {
  font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 700; color: var(--text);
  margin-bottom: 14px; display: flex; align-items: center; gap: 10px;
}
.section-title::after { content:''; flex:1; height:1.5px; background:var(--border); border-radius:2px; }

/* ── STAT CARDS ── */
.stats-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 32px; }
@media(max-width:700px){ .stats-grid-4{grid-template-columns:repeat(2,1fr);} }
@media(max-width:380px){ .stats-grid-4{grid-template-columns:1fr;} }

.stat-card {
  background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px;
  padding: 18px 20px; position: relative; overflow: hidden;
  box-shadow: var(--shadow-sm); transition: transform .2s, box-shadow .2s;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
.stat-card-accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 12px 12px 0 0; }
.accent-green  { background: var(--green); }
.accent-red    { background: var(--red); }
.accent-teal   { background: var(--teal); }
.accent-amber  { background: var(--amber); }
.accent-purple { background: var(--purple); }

.stat-icon-bg { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:16px; margin-bottom:12px; }
.stat-label   { font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); margin-bottom:5px; }
.stat-value   { font-family:'Playfair Display',serif; font-size:24px; font-weight:700; line-height:1; }
.stat-value.sm { font-size:20px; }
.stat-value.green  { color: var(--green); }
.stat-value.red    { color: var(--red); }
.stat-value.teal   { color: var(--teal); }
.stat-value.amber  { color: var(--amber); }

/* ── COLLAPSIBLE SECTION (matches Dashboard txn-section pattern) ── */
.rp-section {
  border-radius: 14px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1.5px solid var(--border);
  transition: box-shadow .2s;
  animation: fadeUp .4s ease both;
}
.rp-section:hover { box-shadow: var(--shadow); }

.rp-sec-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0; cursor: pointer; user-select: none;
  border-bottom: 1.5px solid transparent;
  transition: background .18s, border-color .18s;
}
.rp-sec-header.teal-hdr   { background: linear-gradient(135deg, #f0fdfa 0%, var(--teal-light) 100%); }
.rp-sec-header.teal-hdr.open { border-bottom-color: var(--teal-mid); }
.rp-sec-header.teal-hdr:hover { background: linear-gradient(135deg, var(--teal-light) 0%, #b2e8e5 100%); }

.rp-sec-header.purple-hdr  { background: linear-gradient(135deg, #f8f5ff 0%, var(--purple-bg) 100%); }
.rp-sec-header.purple-hdr.open { border-bottom-color: #c4b5fd; }
.rp-sec-header.purple-hdr:hover { background: linear-gradient(135deg, var(--purple-bg) 0%, #ddd6fe 100%); }

.rp-sec-header.amber-hdr   { background: linear-gradient(135deg, #fffbeb 0%, var(--amber-bg) 100%); }
.rp-sec-header.amber-hdr.open { border-bottom-color: #fde68a; }
.rp-sec-header.amber-hdr:hover { background: linear-gradient(135deg, var(--amber-bg) 0%, #fde68a 100%); }

.rp-sec-header.green-hdr  { background: linear-gradient(135deg, #f0fdf4 0%, var(--green-bg) 100%); }
.rp-sec-header.green-hdr.open { border-bottom-color: #bbf7d0; }

.rp-sec-header.plain-hdr  { background: var(--surface2); border-bottom: 1.5px solid var(--border); cursor: default; }

.rp-sec-stripe { width:5px; align-self:stretch; flex-shrink:0; }
.stripe-teal   { background: var(--teal); }
.stripe-purple { background: var(--purple); }
.stripe-amber  { background: var(--amber); }
.stripe-green  { background: var(--green); }

.rp-sec-content {
  flex: 1; display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px 14px 14px; gap: 10px;
}
.rp-sec-left  { display: flex; align-items: center; gap: 10px; }
.rp-sec-emoji { font-size: 20px; line-height: 1; }
.rp-sec-title-block {}
.rp-sec-title {
  font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 800; line-height: 1.1; letter-spacing: .01em;
}
.rp-sec-title.teal   { color: #0f766e; }
.rp-sec-title.purple { color: #6d28d9; }
.rp-sec-title.amber  { color: #92400e; }
.rp-sec-title.green  { color: #15803d; }

.rp-sec-pill {
  display: inline-flex; align-items: center;
  font-size: 10px; font-weight: 700; letter-spacing: .06em;
  padding: 2px 8px; border-radius: 10px; margin-top: 3px;
}
.rp-sec-pill.teal   { background: var(--teal-light); color: #0f766e; }
.rp-sec-pill.purple { background: var(--purple-bg); color: #6d28d9; }
.rp-sec-pill.amber  { background: var(--amber-bg); color: #92400e; }

.rp-sec-right { display: flex; align-items: center; gap: 12px; }

.rp-arrow-btn {
  width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px; border: 1.5px solid transparent; transition: all .18s; flex-shrink: 0;
}
.rp-arrow-btn.teal   { background: rgba(13,148,136,.1); border-color: rgba(13,148,136,.2); color: var(--teal); }
.rp-arrow-btn.teal:hover { background: rgba(13,148,136,.2); }
.rp-arrow-btn.purple { background: rgba(124,58,237,.1); border-color: rgba(124,58,237,.2); color: var(--purple); }
.rp-arrow-btn.purple:hover { background: rgba(124,58,237,.2); }
.rp-arrow-btn.amber  { background: rgba(180,83,9,.1); border-color: rgba(180,83,9,.2); color: var(--amber); }
.rp-arrow-btn.amber:hover { background: rgba(180,83,9,.2); }

.rp-arrow-icon { transition: transform .22s cubic-bezier(.4,0,.2,1); display: block; }
.rp-arrow-icon.open { transform: rotate(180deg); }

/* ── SECTION BODY ── */
.rp-sec-body {
  background: var(--surface);
  animation: collapseOpen .22s ease both;
}

/* ── YEAR TABLE ── */
.rp-table { width:100%; border-collapse:collapse; font-size:13px; }
.rp-table thead th {
  font-size: 9px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
  color: var(--text-dim); padding: 9px 16px; text-align: left;
  background: var(--bg2); border-bottom: 1.5px solid var(--border); white-space: nowrap;
}
.rp-table thead th.right { text-align: right; }
.rp-table tbody tr { border-bottom: 1px solid var(--border); animation: rowSlide .3s ease both; }
.rp-table tbody tr:hover td { background: var(--surface2); }
.rp-table td { padding: 12px 16px; vertical-align: middle; }
.rp-table td.right { text-align: right; }

.rp-bar-track { height: 3px; border-radius: 3px; background: var(--border); overflow: hidden; margin: 0 16px 10px; }
.rp-bar-fill  { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--teal), #2dd4bf); transition: width .7s cubic-bezier(.4,0,.2,1); }

.rp-tfoot-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; background: var(--surface2);
  border-top: 2px solid var(--border);
  font-size: 13px;
}
.rp-year-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--teal); flex-shrink: 0; display: inline-block; margin-right: 8px; }

.inc { color: var(--green); font-weight: 600; }
.exp { color: var(--red);   font-weight: 600; }
.net-pos { color: var(--teal);  font-weight: 700; }
.net-neg { color: var(--red);   font-weight: 700; }

/* ── MONTH GRID ── */
.rp-month-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 0;
}
@media(max-width:560px){ .rp-month-grid{grid-template-columns:1fr;} }

.rp-month-cell {
  padding: 14px 18px; border-right: 1px solid var(--border); border-bottom: 1px solid var(--border);
  transition: background .12s;
}
.rp-month-cell:nth-child(even) { border-right: none; }
.rp-month-cell:hover { background: var(--surface2); }
.rp-month-name { font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px; }
.rp-month-vals { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; margin-bottom: 6px; }
.rp-month-val  { display: flex; flex-direction: column; gap: 1px; }
.rp-month-val-label { font-size: 9px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--text-faint); }
.rp-month-val-num   { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 700; }

/* ── CHARTS GRID ── */
.rp-charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
@media(max-width:640px){ .rp-charts-grid{grid-template-columns:1fr;} }
.rp-chart-half { padding: 20px 22px 18px; }
.rp-chart-half:first-child { border-right: 1px solid var(--border); }
@media(max-width:640px){ .rp-chart-half:first-child{border-right:none;border-bottom:1px solid var(--border);} }
.rp-chart-label {
  font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  margin-bottom: 14px; display: flex; align-items: center; gap: 7px;
}
.rp-chart-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* ── DATE RANGE ── */
.rp-range-body { padding: 20px 20px 22px; }
.rp-range-controls { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
.rp-field { display: flex; flex-direction: column; gap: 5px; }
.rp-label { font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--text-med); }
.rp-input {
  height: 40px; padding: 0 12px; border-radius: 9px;
  border: 1.5px solid var(--border); background: var(--bg2); color: var(--text);
  font-size: 13px; font-family: 'DM Sans', sans-serif;
  outline: none; transition: border-color .18s, box-shadow .18s; min-width: 140px;
}
.rp-input:focus { border-color: var(--teal); background: var(--surface); box-shadow: 0 0 0 3px rgba(13,148,136,.1); }

.rp-search-btn {
  height: 40px; padding: 0 22px; border-radius: 9px;
  background: var(--teal); color: #fff; border: none; cursor: pointer;
  font-size: 12px; font-weight: 600; font-family: 'DM Sans', sans-serif;
  letter-spacing: .08em; text-transform: uppercase;
  display: flex; align-items: center; gap: 7px;
  transition: opacity .18s, transform .14s; white-space: nowrap; flex-shrink: 0;
}
.rp-search-btn:hover { opacity: .88; transform: translateY(-1px); }
.rp-search-btn:disabled { opacity: .4; cursor: not-allowed; transform: none; }

/* ── RANGE RESULT CARDS ── */
.rp-range-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
@media(max-width:540px){ .rp-range-cards{grid-template-columns:1fr;} }
.rp-range-card {
  border-radius: 12px; padding: 18px 18px 16px;
  border: 1.5px solid var(--border); background: var(--surface2);
  display: flex; flex-direction: column; gap: 5px;
  position: relative; overflow: hidden;
}
.rp-range-card-accent { position: absolute; top:0; left:0; right:0; height:3px; border-radius:12px 12px 0 0; }
.rp-range-card-label { font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--text-dim); margin-top:5px; }
.rp-range-card-val   { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; }
.rp-range-card-sub   { font-size:11px; color:var(--text-dim); }

/* ── MISC ── */
.rp-err   { font-size:12px; color:var(--red); margin-bottom:10px; }
.rp-empty { padding:36px 16px; text-align:center; font-size:13px; color:var(--text-dim); letter-spacing:.04em; }
.skel { display:block; border-radius:6px; background:var(--border); animation:skel 1.4s ease infinite; }

/* ── SELECT ── */
.rp-select {
  background: var(--bg2); border: 1.5px solid var(--border2); border-radius: 8px;
  padding: 7px 32px 7px 12px; font-size: 13px; font-family: 'DM Sans', sans-serif;
  font-weight: 500; color: var(--text); outline: none; cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a9187' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 10px center;
  transition: border-color .18s;
}
.rp-select:focus { border-color: var(--teal); }

/* ── REFRESH BTN ── */
.rp-refresh {
  display:flex; align-items:center; gap:6px; padding:9px 18px;
  border-radius:9px; border:1.5px solid var(--border2); background:var(--surface);
  font-size:12px; font-weight:600; letter-spacing:.04em;
  color:var(--text-med); cursor:pointer; font-family:'DM Sans',sans-serif;
  transition:all .18s; box-shadow:var(--shadow-sm);
}
.rp-refresh:hover { background:var(--teal-light); color:var(--teal); border-color:var(--teal); }
.rp-refresh:disabled { opacity:.5; cursor:not-allowed; }

/* ── NET BALANCE CARD (same as Dashboard) ── */
.net-balance-card {
  display:flex; align-items:center; justify-content:space-between;
  background:var(--surface); border:1.5px solid var(--border); border-radius:14px;
  padding:16px 20px; margin-bottom:28px;
  box-shadow:var(--shadow-sm); gap:12px; flex-wrap:wrap;
}
.net-balance-label {
  font-size:10px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--text-dim);
  display:flex; align-items:center; gap:8px;
}
.net-balance-label::before { content:''; display:inline-block; width:14px; height:2px; background:var(--teal); border-radius:2px; }
.net-balance-value { font-family:'Playfair Display',serif; font-size:26px; font-weight:900; letter-spacing:.01em; }
.net-balance-value.profit { color:var(--teal); }
.net-balance-value.loss   { color:var(--red); }

/* ── YEAR TABLE RESPONSIVE ── */
.yr-cols { display:grid; grid-template-columns:160px 1fr 1fr 1fr 60px; align-items:center; padding:12px 16px; gap:8px; }
@media(max-width:600px){ .yr-cols{ grid-template-columns:1fr 1fr; gap:6px; } .yr-hide{ display:none; } }
.yr-foot { display:grid; grid-template-columns:160px 1fr 1fr 1fr 60px; align-items:center; padding:14px 16px; gap:8px; background:var(--surface2); border-top:2px solid var(--border); font-weight:700; font-size:13.5px; }
@media(max-width:600px){ .yr-foot{ grid-template-columns:1fr 1fr; } .yr-hide{ display:none; } }

@media(max-width:640px){
  .rp-header { padding:16px 0 12px; margin-bottom:18px; }
  .stat-card { padding:14px 16px; }
  .stat-value { font-size:20px !important; }
}
`;

    return (
        <>
            <style>{CSS}</style>
            <Navbar />
            <div className="rp-root">

                {/* ══ HEADER ══ */}
                <div className="rp-header">
                    <div className="rp-header-inner">
                        <div>
                            <div className="rp-eyebrow">Financial Reports</div>
                            <h1 className="rp-title">Income &amp; expense <em>overview</em></h1>
                        </div>
                        <button className="rp-refresh" onClick={fetchAll} disabled={yearLoading}>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                                style={{ animation: yearLoading ? "spin .7s linear infinite" : "none" }}>
                                <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                            {yearLoading ? "Loading…" : "Refresh"}
                        </button>
                    </div>
                </div>

                <div className="rp-wrap">

                    {/* ══ SKELETON ══ */}
                    {yearLoading && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                            {[80, 65, 50, 40].map((w, i) => <span key={i} className="skel" style={{ width: `${w}%`, height: 14 }} />)}
                        </div>
                    )}

                    {/* ══ ERROR ══ */}
                    {yearError && (
                        <div style={{ background: "var(--red-bg)", border: "1.5px solid #fca5a5", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "var(--red)", fontWeight: 500, marginBottom: 20 }}>
                            {yearError}
                        </div>
                    )}

                    {!yearLoading && !yearError && yearData.length > 0 && (<>

                        {/* ══ STAT CARDS ══ */}
                        <p className="section-title">All-Time Summary</p>
                        <div className="stats-grid-4" style={{ marginBottom: 32 }}>
                            <StatCard label="Total Income" value={toINR(totalIncome)} valCls="green" accent="accent-green" icon="💰" iconBg="var(--green-bg)" delay={40} />
                            <StatCard label="Total Expense" value={toINR(totalExpense)} valCls="red" accent="accent-red" icon="💸" iconBg="var(--red-bg)" delay={80} />
                            <StatCard label="Net Balance" value={(totalNet >= 0 ? "+" : "") + toINR(totalNet)} valCls={totalNet >= 0 ? "teal" : "red"} accent={totalNet >= 0 ? "accent-teal" : "accent-red"} icon="🧮" iconBg="var(--teal-light)" delay={120} />
                            <div className="stat-card" style={{ animationDelay: "160ms" }}>
                                <div className="stat-card-accent accent-amber" />
                                <div className="stat-icon-bg" style={{ background: "var(--amber-bg)" }}>💹</div>
                                <div className="stat-label">Savings Rate</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div className={`stat-value ${overallSavings >= 30 ? "teal" : "amber"}`}>{overallSavings}%</div>
                                    <SavingsRing rate={overallSavings} size={52} />
                                </div>
                            </div>
                        </div>

                        {/* ══ NET BALANCE CARD ══ */}
                        <div className="net-balance-card">
                            <span className="net-balance-label">Overall Net Balance · {years.length} year{years.length !== 1 ? "s" : ""} of data</span>
                            <span className={`net-balance-value ${totalNet >= 0 ? "profit" : "loss"}`}>
                                {totalNet >= 0 ? "+" : "−"}₹{fmt(Math.abs(totalNet))}
                            </span>
                        </div>

                        {/* ══ YEAR WISE BREAKDOWN ══ */}
                        <p className="section-title">Year Wise Breakdown</p>
                        <div className="rp-section" style={{ marginBottom: 28 }}>
                            {/* Static header */}
                            <div className="rp-sec-header plain-hdr" style={{ cursor: "default" }}>
                                <div className="rp-sec-stripe stripe-teal" />
                                <div className="rp-sec-content">
                                    <div className="rp-sec-left">
                                        <span className="rp-sec-emoji">📊</span>
                                        <div>
                                            <div className="rp-sec-title teal">Annual Breakdown</div>
                                            <div className="rp-sec-pill teal">{yearData.length} year{yearData.length !== 1 ? "s" : ""}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Column headers */}
                            <div className="yr-cols" style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)" }}>
                                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-dim)" }}>Year</span>
                                <span className="yr-hide" style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-dim)", textAlign: "right" }}>Income</span>
                                <span className="yr-hide" style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-dim)", textAlign: "right" }}>Expense</span>
                                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-dim)", textAlign: "right" }}>Net</span>
                                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--text-dim)", textAlign: "right" }}>Saved</span>
                            </div>

                            {yearData.map((row) => {
                                const pct = totalIncome > 0 ? Math.round((row.income / totalIncome) * 100) : 0;
                                return (
                                    <div key={row.year} style={{ borderBottom: "1px solid var(--border)" }}>
                                        <div className="yr-cols" style={{ transition: "background .12s" }}
                                            onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                                            onMouseLeave={e => e.currentTarget.style.background = ""}>
                                            <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, color: "var(--text)", display: "flex", alignItems: "center" }}>
                                                <span className="rp-year-dot" />
                                                {row.year}
                                            </span>
                                            <span className="yr-hide inc" style={{ textAlign: "right" }}>{toINR(row.income)}</span>
                                            <span className="yr-hide exp" style={{ textAlign: "right" }}>{toINR(row.expense)}</span>
                                            <span className={`${row.net >= 0 ? "net-pos" : "net-neg"}`} style={{ textAlign: "right" }}>
                                                {row.net >= 0 ? "+" : ""}{toINR(row.net)}
                                            </span>
                                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                                <SavingsRing rate={row.savingsRate} size={48} />
                                            </div>
                                        </div>
                                        <div className="rp-bar-track">
                                            <div className="rp-bar-fill" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Total row */}
                            <div className="yr-foot">
                                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 14 }}>All Years Total</span>
                                <span className="yr-hide inc" style={{ textAlign: "right" }}>{toINR(totalIncome)}</span>
                                <span className="yr-hide exp" style={{ textAlign: "right" }}>{toINR(totalExpense)}</span>
                                <span className={`${totalNet >= 0 ? "net-pos" : "net-neg"}`} style={{ textAlign: "right" }}>
                                    {totalNet >= 0 ? "+" : ""}{toINR(totalNet)}
                                </span>
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <SavingsRing rate={overallSavings} size={48} />
                                </div>
                            </div>
                        </div>

                        {/* ══ MONTH BREAKDOWN ══ */}
                        <p className="section-title">Month Wise Breakdown</p>
                        <div className="rp-section" style={{ marginBottom: 28 }}>
                            <div
                                className={`rp-sec-header purple-hdr${monthExpanded ? " open" : ""}`}
                                onClick={() => setMonthExpanded(v => !v)}
                            >
                                <div className="rp-sec-stripe stripe-purple" />
                                <div className="rp-sec-content">
                                    <div className="rp-sec-left">
                                        <span className="rp-sec-emoji">📅</span>
                                        <div>
                                            <div className="rp-sec-title purple">Monthly Detail</div>
                                            <div className="rp-sec-pill purple">{selectedYear}</div>
                                        </div>
                                    </div>
                                    <div className="rp-sec-right">
                                        <select className="rp-select" value={selectedYear}
                                            onClick={e => e.stopPropagation()}
                                            onChange={e => { setSelectedYear(e.target.value); setMonthExpanded(true); }}>
                                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                        <div className="rp-arrow-btn purple">
                                            <svg className={`rp-arrow-icon${monthExpanded ? " open" : ""}`} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path d="M6 9l6 6 6-6" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {monthExpanded && (
                                <div className="rp-sec-body">
                                    {monthData.length === 0 ? (
                                        <div className="rp-empty">No data for {selectedYear}.</div>
                                    ) : (
                                        <div className="rp-month-grid">
                                            {monthData.map((m) => (
                                                <div className="rp-month-cell" key={m.idx}>
                                                    <div className="rp-month-name">{m.fullMonth}</div>
                                                    <div className="rp-month-vals">
                                                        <div className="rp-month-val">
                                                            <span className="rp-month-val-label">Income</span>
                                                            <span className="rp-month-val-num inc">{toINR(m.income)}</span>
                                                        </div>
                                                        <div className="rp-month-val">
                                                            <span className="rp-month-val-label">Expense</span>
                                                            <span className="rp-month-val-num exp">{toINR(m.expense)}</span>
                                                        </div>
                                                        <div className="rp-month-val">
                                                            <span className="rp-month-val-label">Net</span>
                                                            <span className={`rp-month-val-num ${m.net >= 0 ? "net-pos" : "net-neg"}`}>
                                                                {m.net >= 0 ? "+" : ""}{toINR(m.net)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <MiniBar value={m.income} max={maxMonthIncome} color="var(--green)" />
                                                    <div style={{ marginTop: 3 }}>
                                                        <MiniBar value={m.expense} max={maxMonthExpense} color="var(--red)" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ══ TOP SOURCES & PAYEES ══ */}
                        {(allIncome.length > 0 || allExpense.length > 0) && (<>
                            <p className="section-title">Top Sources &amp; Payees</p>
                            <div className="rp-section" style={{ marginBottom: 28 }}>
                                <div
                                    className={`rp-sec-header green-hdr${sourcesExpanded ? " open" : ""}`}
                                    onClick={() => setSourcesExpanded(v => !v)}
                                >
                                    <div className="rp-sec-stripe stripe-green" />
                                    <div className="rp-sec-content">
                                        <div className="rp-sec-left">
                                            <span className="rp-sec-emoji">📈</span>
                                            <div>
                                                <div className="rp-sec-title green">All-Time Rankings</div>
                                                <div className="rp-sec-pill" style={{ background: "var(--green-bg)", color: "#14532d" }}>Income &amp; Expense</div>
                                            </div>
                                        </div>
                                        <div className="rp-sec-right">
                                            <div className="rp-arrow-btn" style={{ background: "rgba(22,163,74,.1)", borderColor: "rgba(22,163,74,.2)", color: "var(--green)" }}>
                                                <svg className={`rp-arrow-icon${sourcesExpanded ? " open" : ""}`} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                    <path d="M6 9l6 6 6-6" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {sourcesExpanded && (
                                    <div className="rp-sec-body">
                                        <div className="rp-charts-grid">
                                            <div className="rp-chart-half">
                                                <div className="rp-chart-label">
                                                    <span className="rp-chart-dot" style={{ background: "var(--green)" }} />
                                                    <span style={{ color: "var(--green)" }}>Top Income Sources</span>
                                                </div>
                                                <HBarChart items={topSources} color="var(--green)" emptyMsg="No income data found." />
                                            </div>
                                            <div className="rp-chart-half">
                                                <div className="rp-chart-label">
                                                    <span className="rp-chart-dot" style={{ background: "var(--red)" }} />
                                                    <span style={{ color: "var(--red)" }}>Top Expense Payees</span>
                                                </div>
                                                <HBarChart items={topPayees} color="var(--red)" emptyMsg="No expense data found." />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>)}

                    </>)}

                    {/* ══ CUSTOM DATE RANGE ══ */}
                    <p className="section-title">Custom Date Range</p>
                    <div className="rp-section" style={{ marginBottom: 28 }}>
                        <div className="rp-sec-header amber-hdr open" style={{ cursor: "default" }}>
                            <div className="rp-sec-stripe stripe-amber" />
                            <div className="rp-sec-content">
                                <div className="rp-sec-left">
                                    <span className="rp-sec-emoji">🗓️</span>
                                    <div>
                                        <div className="rp-sec-title amber">Date Range Report</div>
                                        <div className="rp-sec-pill amber">Custom period</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rp-sec-body rp-range-body">
                            <div className="rp-range-controls">
                                <div className="rp-field">
                                    <label className="rp-label">From Date</label>
                                    <input type="date" className="rp-input" value={fromDate} max={toDate} onChange={e => setFromDate(e.target.value)} />
                                </div>
                                <div className="rp-field">
                                    <label className="rp-label">To Date</label>
                                    <input type="date" className="rp-input" value={toDate} min={fromDate} max={todayStr()} onChange={e => setToDate(e.target.value)} />
                                </div>
                                <button className="rp-search-btn" onClick={fetchRange} disabled={rangeLoading}>
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                                        style={{ animation: rangeLoading ? "spin .7s linear infinite" : "none" }}>
                                        {rangeLoading
                                            ? <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                            : <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>
                                        }
                                    </svg>
                                    {rangeLoading ? "Searching…" : "Search"}
                                </button>
                            </div>

                            {rangeError && <div className="rp-err">{rangeError}</div>}

                            {rangeData && !rangeLoading && (
                                <div className="rp-range-cards">
                                    <div className="rp-range-card">
                                        <div className="rp-range-card-accent" style={{ background: "var(--green)" }} />
                                        <div className="rp-range-card-label">Total Income</div>
                                        <div className="rp-range-card-val inc">{toINR(rangeData.income)}</div>
                                        <div className="rp-range-card-sub">{fromDate} → {toDate}</div>
                                    </div>
                                    <div className="rp-range-card">
                                        <div className="rp-range-card-accent" style={{ background: "var(--red)" }} />
                                        <div className="rp-range-card-label">Total Expense</div>
                                        <div className="rp-range-card-val exp">{toINR(rangeData.expense)}</div>
                                        <div className="rp-range-card-sub">{fromDate} → {toDate}</div>
                                    </div>
                                    <div className="rp-range-card">
                                        <div className="rp-range-card-accent" style={{ background: rangeData.net >= 0 ? "var(--teal)" : "var(--red)" }} />
                                        <div className="rp-range-card-label">Net Balance</div>
                                        <div className={`rp-range-card-val ${rangeData.net >= 0 ? "net-pos" : "net-neg"}`}>
                                            {rangeData.net >= 0 ? "+" : ""}{toINR(rangeData.net)}
                                        </div>
                                        <div className="rp-range-card-sub">
                                            {rangeData.net >= 0 ? "✅ Surplus" : "⚠️ Deficit"} ·{" "}
                                            {rangeData.income > 0 ? `${Math.round(((rangeData.income - rangeData.expense) / rangeData.income) * 100)}% saved` : "no income"}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!rangeData && !rangeLoading && (
                                <div className="rp-empty">Select a date range and click Search.</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}