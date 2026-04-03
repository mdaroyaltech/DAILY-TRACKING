import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const toINR = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const toDateStr = (d) => d.toISOString().split("T")[0];
function todayStr() { return toDateStr(new Date()); }

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const FULL_MONTHS = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

/* ── inline mini bar chart ── */
function MiniBar({ value, max, color }) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div style={{ height: 4, borderRadius: 4, background: "#e2dcd4", overflow: "hidden", marginTop: 4, width: "100%" }}>
            <div style={{
                height: "100%", borderRadius: 4, width: `${pct}%`,
                background: color,
                transition: "width .7s cubic-bezier(.4,0,.2,1)"
            }} />
        </div>
    );
}

/* ── Savings ring ── */
function SavingsRing({ rate, size = 56 }) {
    const r = (size / 2) - 5;
    const circ = 2 * Math.PI * r;
    const clamped = Math.max(0, Math.min(100, rate));
    const dash = (clamped / 100) * circ;
    const color = rate >= 50 ? "#0d9488" : rate >= 20 ? "#d97706" : "#dc2626";
    return (
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2dcd4" strokeWidth="5" />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
                    strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    style={{ transition: "stroke-dasharray .8s ease" }} />
            </svg>
            <div style={{
                position: "absolute", inset: 0, display: "flex",
                alignItems: "center", justifyContent: "center",
                flexDirection: "column", lineHeight: 1
            }}>
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{clamped}%</span>
            </div>
        </div>
    );
}

/* ── Horizontal bar chart (top sources / expenses) ── */
function HBarChart({ items, color, emptyMsg }) {
    if (!items.length) return (
        <div style={{ padding: "28px 0", textAlign: "center", color: "#9a9187", fontSize: 13 }}>{emptyMsg}</div>
    );
    const max = items[0]?.total || 1;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item, i) => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                        fontSize: 10, fontWeight: 700, color: "#9a9187",
                        width: 16, textAlign: "right", flexShrink: 0
                    }}>#{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 8 }}>
                            <span style={{
                                fontSize: 12, fontWeight: 600, color: "#1c1a17",
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                            }}
                                className="rp-chart-label">{item.name}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>{toINR(item.total)}</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 4, background: "#e2dcd4", overflow: "hidden" }}>
                            <div style={{
                                height: "100%", borderRadius: 4,
                                width: `${(item.total / max) * 100}%`,
                                background: color,
                                transition: "width .7s cubic-bezier(.4,0,.2,1)",
                                opacity: 0.85 + (i === 0 ? 0.15 : 0)
                            }} />
                        </div>
                    </div>
                    <span style={{ fontSize: 11, color: "#9a9187", flexShrink: 0, width: 32, textAlign: "right" }}>
                        {item.count}x
                    </span>
                </div>
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════ */
export default function Reports() {

    /* ── state ── */
    const [yearData, setYearData] = useState([]);
    const [yearLoading, setYL] = useState(true);
    const [yearError, setYearError] = useState("");

    // all raw data (for charts + month breakdown)
    const [allIncome, setAllIncome] = useState([]);
    const [allExpense, setAllExpense] = useState([]);

    // month breakdown
    const [selectedYear, setSelectedYear] = useState("");
    const [monthExpanded, setMonthExpanded] = useState(false);

    // date range
    const [fromDate, setFromDate] = useState(() => {
        const d = new Date(); d.setDate(1); return toDateStr(d);
    });
    const [toDate, setToDate] = useState(todayStr);
    const [rangeData, setRangeData] = useState(null);
    const [rangeLoading, setRL] = useState(false);
    const [rangeError, setRangeError] = useState("");

    useEffect(() => { fetchAll(); }, []);

    /* ── Fetch everything once ── */
    async function fetchAll() {
        setYL(true);
        setYearError("");
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

            // group by year
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

            const sorted = Object.keys(map).sort((a, b) => b - a)
                .map((y) => ({
                    year: y, income: map[y].income, expense: map[y].expense,
                    net: map[y].income - map[y].expense,
                    savingsRate: map[y].income > 0
                        ? Math.round(((map[y].income - map[y].expense) / map[y].income) * 100) : 0,
                }));

            setYearData(sorted);
            if (sorted.length > 0) setSelectedYear(sorted[0].year);
        } catch (e) {
            console.error(e);
            setYearError("Failed to load data. Check your Supabase connection.");
        } finally {
            setYL(false);
        }
    }

    /* ── Month breakdown for selected year ── */
    const monthData = useMemo(() => {
        if (!selectedYear) return [];
        const map = {};
        allIncome.filter(r => r.date?.startsWith(selectedYear)).forEach(({ date, amount }) => {
            const m = parseInt(date?.slice(5, 7), 10) - 1;
            if (isNaN(m)) return;
            if (!map[m]) map[m] = { income: 0, expense: 0 };
            map[m].income += Number(amount) || 0;
        });
        allExpense.filter(r => r.date?.startsWith(selectedYear)).forEach(({ date, amount }) => {
            const m = parseInt(date?.slice(5, 7), 10) - 1;
            if (isNaN(m)) return;
            if (!map[m]) map[m] = { income: 0, expense: 0 };
            map[m].expense += Number(amount) || 0;
        });
        return Object.keys(map).sort((a, b) => Number(a) - Number(b)).map(m => ({
            month: MONTH_NAMES[m], fullMonth: FULL_MONTHS[m], idx: Number(m),
            income: map[m].income, expense: map[m].expense,
            net: map[m].income - map[m].expense,
        }));
    }, [selectedYear, allIncome, allExpense]);

    /* ── Top income sources (all time) ── */
    const topSources = useMemo(() => {
        const map = {};
        allIncome.forEach(({ service, amount }) => {
            const k = (service || "Unknown").trim();
            if (!map[k]) map[k] = { total: 0, count: 0 };
            map[k].total += Number(amount) || 0; map[k].count++;
        });
        return Object.entries(map)
            .map(([name, v]) => ({ name, ...v }))
            .sort((a, b) => b.total - a.total).slice(0, 6);
    }, [allIncome]);

    /* ── Top expense payees (all time) ── */
    const topPayees = useMemo(() => {
        const map = {};
        allExpense.forEach(({ paid_to, amount }) => {
            const k = (paid_to || "Unknown").trim();
            if (!map[k]) map[k] = { total: 0, count: 0 };
            map[k].total += Number(amount) || 0; map[k].count++;
        });
        return Object.entries(map)
            .map(([name, v]) => ({ name, ...v }))
            .sort((a, b) => b.total - a.total).slice(0, 6);
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

    /* ─────────────────────────────────────────────
       CSS
    ───────────────────────────────────────────── */
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes spin      { to { transform:rotate(360deg); } }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes skel-pulse{ 0%,100%{opacity:1} 50%{opacity:.4} }

        /* ── ROOT ── */
        .rp-root {
          min-height:100vh; background:#f5f2ed;
          font-family:'DM Sans',sans-serif;
          padding:36px 24px 100px; transition:background .25s;
        }

        /* ── HEADER ── */
        .rp-page-head {
          max-width:960px; margin:0 auto 40px;
          display:flex; align-items:flex-end; justify-content:space-between;
          gap:16px; flex-wrap:wrap;
        }
        .rp-eyebrow {
          font-size:10px; font-weight:600; letter-spacing:.18em; text-transform:uppercase;
          color:#0d9488; display:flex; align-items:center; gap:8px; margin-bottom:6px;
        }
        .rp-eyebrow::before {
          content:''; display:inline-block; width:20px; height:2px;
          background:#0d9488; border-radius:2px;
        }
        .rp-title {
          font-family:'Playfair Display',serif;
          font-size:clamp(22px,3.5vw,32px); font-weight:900;
          color:#1c1a17; line-height:1.1;
        }
        .rp-title em { font-style:italic; color:#0d9488; }
        .rp-head-actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .rp-refresh {
          display:flex; align-items:center; gap:6px; padding:9px 18px;
          border-radius:9px; border:1.5px solid #d0c9be; background:#fff;
          font-size:12px; font-weight:600; letter-spacing:.04em;
          color:#5a5449; cursor:pointer; font-family:'DM Sans',sans-serif;
          transition:all .18s; box-shadow:0 1px 4px rgba(0,0,0,.04);
        }
        .rp-refresh:hover { background:#e0f2f0; color:#0d9488; border-color:#0d9488; }
        .rp-refresh:disabled { opacity:.5; cursor:not-allowed; }

        /* ── SUMMARY STRIP ── */
        .rp-summary-strip {
          max-width:960px; margin:0 auto 32px;
          display:grid; grid-template-columns:repeat(4,1fr); gap:12px;
        }
        @media(max-width:720px){ .rp-summary-strip{grid-template-columns:repeat(2,1fr);} }
        @media(max-width:400px){ .rp-summary-strip{grid-template-columns:1fr;} }
        .rp-stat {
          background:#fff; border:1.5px solid #e2dcd4; border-radius:14px;
          padding:18px 20px; position:relative; overflow:hidden;
          box-shadow:0 1px 4px rgba(0,0,0,.04);
          animation:fadeUp .4s ease both;
        }
        .rp-stat-accent {
          position:absolute; top:0; left:0; right:0; height:3px; border-radius:14px 14px 0 0;
        }
        .rp-stat-label {
          font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase;
          color:#9a9187; margin-bottom:8px; margin-top:4px;
        }
        .rp-stat-val {
          font-family:'Playfair Display',serif; font-size:22px; font-weight:700;
          line-height:1; margin-bottom:6px;
        }
        .rp-stat-sub { font-size:11px; color:#9a9187; }

        /* ── SECTION ── */
        .rp-section {
          max-width:960px; margin:0 auto 28px;
          background:#fff; border:1.5px solid #e2dcd4;
          border-radius:16px; overflow:hidden;
          box-shadow:0 1px 8px rgba(0,0,0,.04);
          animation:fadeUp .4s ease both;
        }
        .rp-sec-head {
          display:flex; align-items:center; justify-content:space-between;
          padding:18px 24px 14px; border-bottom:1.5px solid #e2dcd4; gap:10px;
          flex-wrap:wrap;
        }
        .rp-sec-title {
          font-family:'Playfair Display',serif; font-size:16px; font-weight:700;
          color:#1c1a17; display:flex; align-items:center; gap:10px;
        }
        .rp-sec-icon {
          width:30px; height:30px; background:#0d9488; border-radius:8px;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .rp-badge {
          font-size:11px; font-weight:600; letter-spacing:.05em;
          padding:3px 10px; border-radius:20px; background:#e0f2f0; color:#0d9488;
        }
        .rp-badge.amber { background:#fef3c7; color:#d97706; }
        .rp-badge.red   { background:#fee2e2; color:#dc2626; }

        /* ── YEAR TABLE ── */
        .rp-table { width:100%; border-collapse:collapse; }
        .rp-table thead th {
          padding:9px 20px; font-size:10px; font-weight:600;
          letter-spacing:.1em; text-transform:uppercase;
          color:#9a9187; background:#faf8f5; text-align:left;
          border-bottom:1px solid #e2dcd4;
        }
        .rp-table thead th:not(:first-child) { text-align:right; }
        .rp-table tbody tr { border-top:1px solid #ede9e2; transition:background .12s; }
        .rp-table tbody tr:hover { background:#faf8f5; }
        .rp-table td { padding:0; }

        .rp-yr-row {
          display:grid;
          grid-template-columns: 160px 1fr 1fr 1fr 70px;
          align-items:center;
          padding:12px 20px; gap:8px;
        }
        @media(max-width:600px){
          .rp-yr-row{ grid-template-columns:1fr 1fr; gap:6px; padding:12px 16px; }
          .rp-yr-row .hide-sm{ display:none; }
        }

        .rp-year-badge {
          display:inline-flex; align-items:center; gap:8px;
          font-family:'Playfair Display',serif; font-weight:700; font-size:15px; color:#1c1a17;
        }
        .rp-year-dot { width:7px; height:7px; border-radius:50%; background:#0d9488; flex-shrink:0; }

        .rp-bar-wrap { padding:0 20px 10px; }
        .rp-bar-track { height:3px; border-radius:3px; background:#ede9e2; overflow:hidden; }
        .rp-bar-fill {
          height:100%; border-radius:3px;
          background:linear-gradient(90deg,#0d9488,#2dd4bf);
          transition:width .7s cubic-bezier(.4,0,.2,1);
        }

        .rp-tfoot-row {
          display:grid;
          grid-template-columns: 160px 1fr 1fr 1fr 70px;
          align-items:center; padding:14px 20px; gap:8px;
          background:#faf8f5; border-top:2px solid #e2dcd4;
          font-weight:700; font-size:13.5px;
        }
        @media(max-width:600px){
          .rp-tfoot-row{ grid-template-columns:1fr 1fr; }
          .rp-tfoot-row .hide-sm{ display:none; }
        }

        .inc  { color:#059669; font-weight:600; }
        .exp  { color:#dc2626; font-weight:600; }
        .net-pos { color:#0d9488; font-weight:700; }
        .net-neg { color:#dc2626; font-weight:700; }
        .val-right { text-align:right; font-size:13px; }

        /* ── MONTH BREAKDOWN ── */
        .rp-month-controls {
          display:flex; align-items:center; gap:10px; flex-wrap:wrap;
        }
        .rp-select {
          background:#faf8f5; border:1.5px solid #d0c9be; border-radius:8px;
          padding:7px 32px 7px 12px; font-size:13px; font-family:'DM Sans',sans-serif;
          font-weight:500; color:#1c1a17; outline:none; cursor:pointer;
          appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a9187' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 10px center;
          transition:border-color .18s;
        }
        .rp-select:focus { border-color:#0d9488; }

        .rp-toggle-btn {
          display:flex; align-items:center; gap:5px; padding:7px 14px;
          border-radius:8px; border:1.5px solid #d0c9be; background:#faf8f5;
          font-size:12px; font-weight:600; color:#5a5449; cursor:pointer;
          font-family:'DM Sans',sans-serif; transition:all .18s;
        }
        .rp-toggle-btn:hover { background:#e0f2f0; color:#0d9488; border-color:#0d9488; }
        .rp-toggle-arrow { display:inline-block; transition:transform .25s ease; font-size:10px; }
        .rp-toggle-arrow.open { transform:rotate(180deg); }

        .rp-month-body { padding:0 0 4px; }
        .rp-month-grid {
          display:grid; grid-template-columns:repeat(2,1fr); gap:0;
        }
        @media(max-width:560px){ .rp-month-grid{grid-template-columns:1fr;} }

        .rp-month-cell {
          padding:14px 20px; border-right:1px solid #ede9e2; border-bottom:1px solid #ede9e2;
          transition:background .12s;
        }
        .rp-month-cell:nth-child(even) { border-right:none; }
        .rp-month-cell:hover { background:#faf8f5; }
        .rp-month-name {
          font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase;
          color:#9a9187; margin-bottom:8px;
        }
        .rp-month-vals {
          display:flex; gap:16px; flex-wrap:wrap; align-items:center; margin-bottom:6px;
        }
        .rp-month-val { display:flex; flex-direction:column; gap:1px; }
        .rp-month-val-label { font-size:9px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:#c4bdb4; }
        .rp-month-val-num { font-family:'Playfair Display',serif; font-size:14px; font-weight:700; }

        /* ── CHARTS SECTION ── */
        .rp-charts-grid {
          max-width:960px; margin:0 auto 28px;
          display:grid; grid-template-columns:1fr 1fr; gap:16px;
        }
        @media(max-width:680px){ .rp-charts-grid{grid-template-columns:1fr;} }
        .rp-chart-card {
          background:#fff; border:1.5px solid #e2dcd4; border-radius:16px;
          padding:22px 22px 20px; box-shadow:0 1px 8px rgba(0,0,0,.04);
          animation:fadeUp .4s ease both;
        }
        .rp-chart-title {
          font-family:'Playfair Display',serif; font-size:15px; font-weight:700;
          color:#1c1a17; margin-bottom:16px; display:flex; align-items:center; gap:8px;
        }
        .rp-chart-dot {
          width:8px; height:8px; border-radius:50%; flex-shrink:0;
        }
        .rp-chart-label { color:#1c1a17; }

        /* ── DATE RANGE ── */
        .rp-range-body { padding:20px 24px 24px; }
        .rp-range-controls {
          display:flex; align-items:flex-end; gap:12px; flex-wrap:wrap; margin-bottom:20px;
        }
        .rp-field { display:flex; flex-direction:column; gap:5px; }
        .rp-label {
          font-size:10px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:#9a9187;
        }
        .rp-input {
          height:40px; padding:0 12px; border-radius:9px;
          border:1.5px solid #d0c9be; background:#fff; color:#1c1a17;
          font-size:13px; font-family:'DM Sans',sans-serif;
          outline:none; transition:border-color .18s; min-width:140px;
        }
        .rp-input:focus { border-color:#0d9488; }
        .rp-search-btn {
          height:40px; padding:0 22px; border-radius:9px;
          background:#0d9488; color:#fff; border:none; cursor:pointer;
          font-size:13px; font-weight:600; font-family:'DM Sans',sans-serif;
          letter-spacing:.04em; display:flex; align-items:center; gap:7px;
          transition:opacity .18s,transform .14s; white-space:nowrap; flex-shrink:0;
        }
        .rp-search-btn:hover { opacity:.88; transform:translateY(-1px); }
        .rp-search-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
        .rp-err { font-size:12px; color:#dc2626; margin-bottom:12px; }

        /* ── RANGE CARDS ── */
        .rp-cards { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        @media(max-width:540px){ .rp-cards{grid-template-columns:1fr;} }
        .rp-card {
          border-radius:12px; padding:18px 18px 16px;
          border:1.5px solid #e2dcd4; background:#faf8f5;
          display:flex; flex-direction:column; gap:5px;
          position:relative; overflow:hidden;
        }
        .rp-card-accent { position:absolute; top:0; left:0; right:0; height:3px; border-radius:12px 12px 0 0; }
        .rp-card-label {
          font-size:10px; font-weight:600; letter-spacing:.1em;
          text-transform:uppercase; color:#9a9187; margin-top:5px;
        }
        .rp-card-val { font-family:'Playfair Display',serif; font-size:21px; font-weight:700; }
        .rp-card-val.inc     { color:#059669; }
        .rp-card-val.exp     { color:#dc2626; }
        .rp-card-val.net     { color:#0d9488; }
        .rp-card-val.net-neg { color:#dc2626; }
        .rp-card-sub { font-size:11px; color:#9a9187; }

        /* ── EMPTY / ERROR / SKEL ── */
        .rp-empty { padding:40px 24px; text-align:center; color:#9a9187; font-size:13px; }
        .rp-empty-icon { font-size:28px; margin-bottom:8px; }
        .rp-error {
          margin:16px 24px; padding:12px 16px; border-radius:10px;
          background:#fee2e2; border:1.5px solid #fca5a5;
          font-size:13px; color:#dc2626; font-weight:500;
        }
        .skel {
          display:block; border-radius:6px; background:#e2dcd4;
          animation:skel-pulse 1.4s ease-in-out infinite;
        }

        /* ══ DARK MODE ══ */
        [data-theme="dark"] .rp-root        { background:#0f0e0c; }
        [data-theme="dark"] .rp-title       { color:#f0ece6; }
        [data-theme="dark"] .rp-eyebrow     { color:#2dd4bf; }
        [data-theme="dark"] .rp-eyebrow::before { background:#2dd4bf; }
        [data-theme="dark"] .rp-refresh     { background:#1c1a17; border-color:#2a2620; color:#9a9187; }
        [data-theme="dark"] .rp-refresh:hover { background:rgba(45,212,191,.12); color:#2dd4bf; border-color:#2dd4bf; }
        [data-theme="dark"] .rp-stat        { background:#1c1a17; border-color:#2a2620; }
        [data-theme="dark"] .rp-stat-label  { color:#7a746e; }
        [data-theme="dark"] .rp-stat-sub    { color:#7a746e; }
        [data-theme="dark"] .rp-section     { background:#1c1a17; border-color:#2a2620; }
        [data-theme="dark"] .rp-sec-head    { border-color:#2a2620; }
        [data-theme="dark"] .rp-sec-title   { color:#f0ece6; }
        [data-theme="dark"] .rp-badge       { background:rgba(45,212,191,.12); color:#2dd4bf; }
        [data-theme="dark"] .rp-badge.amber { background:rgba(217,119,6,.15); color:#fbbf24; }
        [data-theme="dark"] .rp-badge.red   { background:rgba(220,38,38,.15); color:#f87171; }
        [data-theme="dark"] .rp-table thead th { background:#171512; color:#7a746e; border-color:#2a2620; }
        [data-theme="dark"] .rp-table tbody tr { border-color:#2a2620; }
        [data-theme="dark"] .rp-table tbody tr:hover { background:#211f1b; }
        [data-theme="dark"] .rp-tfoot-row   { background:#171512; border-color:#2a2620; color:#f0ece6; }
        [data-theme="dark"] .rp-yr-row      { color:#f0ece6; }
        [data-theme="dark"] .rp-year-badge  { color:#f0ece6; }
        [data-theme="dark"] .rp-bar-track   { background:#2a2620; }
        [data-theme="dark"] .rp-bar-fill    { background:linear-gradient(90deg,#2dd4bf,#0d9488); }
        [data-theme="dark"] .rp-select      { background:#1c1a17; border-color:#2a2620; color:#f0ece6; color-scheme:dark; }
        [data-theme="dark"] .rp-toggle-btn  { background:#1c1a17; border-color:#2a2620; color:#9a9187; }
        [data-theme="dark"] .rp-toggle-btn:hover { background:rgba(45,212,191,.12); color:#2dd4bf; border-color:#2dd4bf; }
        [data-theme="dark"] .rp-month-cell  { border-color:#2a2620; }
        [data-theme="dark"] .rp-month-cell:hover { background:#211f1b; }
        [data-theme="dark"] .rp-month-name  { color:#7a746e; }
        [data-theme="dark"] .rp-month-val-label { color:#4a4540; }
        [data-theme="dark"] .rp-chart-card  { background:#1c1a17; border-color:#2a2620; }
        [data-theme="dark"] .rp-chart-title { color:#f0ece6; }
        [data-theme="dark"] .rp-chart-label { color:#f0ece6; }
        [data-theme="dark"] .rp-label       { color:#7a746e; }
        [data-theme="dark"] .rp-input       { background:#1c1a17; border-color:#2a2620; color:#f0ece6; color-scheme:dark; }
        [data-theme="dark"] .rp-input:focus { border-color:#2dd4bf; }
        [data-theme="dark"] .rp-card        { background:#211f1b; border-color:#2a2620; }
        [data-theme="dark"] .rp-card-label  { color:#7a746e; }
        [data-theme="dark"] .rp-card-sub    { color:#7a746e; }
        [data-theme="dark"] .rp-empty       { color:#7a746e; }
        [data-theme="dark"] .rp-error       { background:rgba(248,113,113,.1); border-color:rgba(248,113,113,.3); color:#f87171; }
        [data-theme="dark"] .skel           { background:#2a2620; }
        [data-theme="dark"] .net-pos        { color:#2dd4bf; }
        [data-theme="dark"] .inc            { color:#4ade80; }
        [data-theme="dark"] .val-right      { color:#f0ece6; }
        [data-theme="dark"] .rp-bar-wrap > div { background:#2a2620; }
      `}</style>

            <Navbar />

            <div className="rp-root">

                {/* ══ PAGE HEADER ══ */}
                <div className="rp-page-head">
                    <div>
                        <div className="rp-eyebrow">Financial Reports</div>
                        <h1 className="rp-title">Income &amp; expense <em>overview</em></h1>
                    </div>
                    <div className="rp-head-actions">
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

                {/* ══ SUMMARY STRIP ══ */}
                {!yearLoading && !yearError && yearData.length > 0 && (
                    <div className="rp-summary-strip">
                        {[
                            { label: "Total Income", val: toINR(totalIncome), color: "#059669", sub: `${years.length} year${years.length !== 1 ? "s" : ""} of data` },
                            { label: "Total Expense", val: toINR(totalExpense), color: "#dc2626", sub: "All time spending" },
                            { label: "Net Balance", val: (totalNet >= 0 ? "+" : "") + toINR(totalNet), color: totalNet >= 0 ? "#0d9488" : "#dc2626", sub: totalNet >= 0 ? "Overall surplus" : "Overall deficit" },
                            { label: "Overall Savings", val: `${overallSavings}%`, color: overallSavings >= 30 ? "#0d9488" : "#d97706", sub: "Savings rate", ring: true },
                        ].map((s, i) => (
                            <div className="rp-stat" key={s.label} style={{ animationDelay: `${i * 60}ms` }}>
                                <div className="rp-stat-accent" style={{ background: s.color }} />
                                <div className="rp-stat-label">{s.label}</div>
                                <div className="rp-stat-val" style={{ color: s.color }}>{s.val}</div>
                                <div className="rp-stat-sub">{s.sub}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ══ SECTION 1: YEAR WISE TABLE ══ */}
                <div className="rp-section">
                    <div className="rp-sec-head">
                        <div className="rp-sec-title">
                            <div className="rp-sec-icon">
                                <svg width="15" height="15" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                                </svg>
                            </div>
                            Year Wise Breakdown
                        </div>
                        {!yearLoading && !yearError && (
                            <span className="rp-badge">{yearData.length} year{yearData.length !== 1 ? "s" : ""}</span>
                        )}
                    </div>

                    {yearError && <div className="rp-error">{yearError}</div>}

                    {yearLoading && (
                        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                            {[80, 65, 50].map((w, i) => (
                                <span key={i} className="skel" style={{ width: `${w}%`, height: 14 }} />
                            ))}
                        </div>
                    )}

                    {!yearLoading && !yearError && yearData.length === 0 && (
                        <div className="rp-empty"><div className="rp-empty-icon">📊</div>No data found yet.</div>
                    )}

                    {!yearLoading && !yearError && yearData.length > 0 && (
                        <>
                            {/* thead */}
                            <div style={{ borderBottom: "1px solid #ede9e2" }}>
                                <div className="rp-yr-row" style={{ padding: "8px 20px", background: "#faf8f5" }}>
                                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "#9a9187" }}>Year</span>
                                    <span className="val-right hide-sm" style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "#9a9187" }}>Income</span>
                                    <span className="val-right hide-sm" style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "#9a9187" }}>Expense</span>
                                    <span className="val-right" style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "#9a9187" }}>Net</span>
                                    <span className="val-right" style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "#9a9187" }}>Saved</span>
                                </div>
                            </div>

                            {/* rows */}
                            {yearData.map((row) => {
                                const pct = totalIncome > 0 ? Math.round((row.income / totalIncome) * 100) : 0;
                                const savColor = row.savingsRate >= 50 ? "#0d9488" : row.savingsRate >= 20 ? "#d97706" : "#dc2626";
                                return (
                                    <div key={row.year} style={{ borderBottom: "1px solid #ede9e2" }}>
                                        <div className="rp-yr-row">
                                            <span className="rp-year-badge">
                                                <span className="rp-year-dot" />
                                                {row.year}
                                            </span>
                                            <span className="val-right hide-sm inc">{toINR(row.income)}</span>
                                            <span className="val-right hide-sm exp">{toINR(row.expense)}</span>
                                            <span className={`val-right ${row.net >= 0 ? "net-pos" : "net-neg"}`}>
                                                {row.net >= 0 ? "+" : ""}{toINR(row.net)}
                                            </span>
                                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                                <SavingsRing rate={row.savingsRate} size={50} />
                                            </div>
                                        </div>
                                        <div className="rp-bar-wrap">
                                            <div className="rp-bar-track">
                                                <div className="rp-bar-fill" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* totals */}
                            <div className="rp-tfoot-row">
                                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 14 }}>All Years Total</span>
                                <span className="val-right hide-sm inc">{toINR(totalIncome)}</span>
                                <span className="val-right hide-sm exp">{toINR(totalExpense)}</span>
                                <span className={`val-right ${totalNet >= 0 ? "net-pos" : "net-neg"}`}>
                                    {totalNet >= 0 ? "+" : ""}{toINR(totalNet)}
                                </span>
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <SavingsRing rate={overallSavings} size={50} />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ══ SECTION 2: MONTH-WISE BREAKDOWN ══ */}
                {!yearLoading && yearData.length > 0 && (
                    <div className="rp-section">
                        <div className="rp-sec-head">
                            <div className="rp-sec-title">
                                <div className="rp-sec-icon" style={{ background: "#7c3aed" }}>
                                    <svg width="15" height="15" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 4-6" />
                                    </svg>
                                </div>
                                Month-wise Breakdown
                            </div>
                            <div className="rp-month-controls">
                                <select className="rp-select" value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setMonthExpanded(true); }}>
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <button className="rp-toggle-btn" onClick={() => setMonthExpanded(v => !v)}>
                                    {monthExpanded ? "Hide" : "Show"}
                                    <span className={`rp-toggle-arrow ${monthExpanded ? "open" : ""}`}>▲</span>
                                </button>
                            </div>
                        </div>

                        {monthExpanded && (
                            <div className="rp-month-body">
                                {monthData.length === 0 ? (
                                    <div className="rp-empty"><div className="rp-empty-icon">📅</div>No data for {selectedYear}.</div>
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
                                                <MiniBar value={m.income} max={maxMonthIncome} color="#059669" />
                                                <div style={{ marginTop: 3 }}>
                                                    <MiniBar value={m.expense} max={maxMonthExpense} color="#dc2626" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ══ SECTION 3: TOP CHARTS ══ */}
                {!yearLoading && (allIncome.length > 0 || allExpense.length > 0) && (
                    <div className="rp-charts-grid">
                        <div className="rp-chart-card">
                            <div className="rp-chart-title">
                                <span className="rp-chart-dot" style={{ background: "#059669" }} />
                                Top Income Sources
                            </div>
                            <HBarChart items={topSources} color="#059669" emptyMsg="No income data found." />
                        </div>
                        <div className="rp-chart-card">
                            <div className="rp-chart-title">
                                <span className="rp-chart-dot" style={{ background: "#dc2626" }} />
                                Top Expense Payees
                            </div>
                            <HBarChart items={topPayees} color="#dc2626" emptyMsg="No expense data found." />
                        </div>
                    </div>
                )}

                {/* ══ SECTION 4: DATE RANGE ══ */}
                <div className="rp-section">
                    <div className="rp-sec-head">
                        <div className="rp-sec-title">
                            <div className="rp-sec-icon" style={{ background: "#d97706" }}>
                                <svg width="15" height="15" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                                    <path d="M8 14h.01M12 14h.01M16 14h.01" strokeLinecap="round" />
                                </svg>
                            </div>
                            Custom Date Range
                        </div>
                    </div>

                    <div className="rp-range-body">
                        <div className="rp-range-controls">
                            <div className="rp-field">
                                <label className="rp-label">From Date</label>
                                <input type="date" className="rp-input" value={fromDate} max={toDate}
                                    onChange={(e) => setFromDate(e.target.value)} />
                            </div>
                            <div className="rp-field">
                                <label className="rp-label">To Date</label>
                                <input type="date" className="rp-input" value={toDate} min={fromDate} max={todayStr()}
                                    onChange={(e) => setToDate(e.target.value)} />
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
                            <div className="rp-cards">
                                <div className="rp-card">
                                    <div className="rp-card-accent" style={{ background: "#059669" }} />
                                    <div className="rp-card-label">Total Income</div>
                                    <div className="rp-card-val inc">{toINR(rangeData.income)}</div>
                                    <div className="rp-card-sub">{fromDate} → {toDate}</div>
                                </div>
                                <div className="rp-card">
                                    <div className="rp-card-accent" style={{ background: "#dc2626" }} />
                                    <div className="rp-card-label">Total Expense</div>
                                    <div className="rp-card-val exp">{toINR(rangeData.expense)}</div>
                                    <div className="rp-card-sub">{fromDate} → {toDate}</div>
                                </div>
                                <div className="rp-card">
                                    <div className="rp-card-accent" style={{ background: rangeData.net >= 0 ? "#0d9488" : "#dc2626" }} />
                                    <div className="rp-card-label">Net Balance</div>
                                    <div className={`rp-card-val ${rangeData.net >= 0 ? "net" : "net-neg"}`}>
                                        {rangeData.net >= 0 ? "+" : ""}{toINR(rangeData.net)}
                                    </div>
                                    <div className="rp-card-sub">
                                        {rangeData.net >= 0 ? "✅ Surplus" : "⚠️ Deficit"} · {
                                            rangeData.income > 0
                                                ? `${Math.round(((rangeData.income - rangeData.expense) / rangeData.income) * 100)}% saved`
                                                : "no income"
                                        }
                                    </div>
                                </div>
                            </div>
                        )}

                        {!rangeData && !rangeLoading && (
                            <div className="rp-empty" style={{ padding: "28px 0 8px" }}>
                                <div className="rp-empty-icon">🗓️</div>
                                Select a date range and click Search.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </>
    );
}