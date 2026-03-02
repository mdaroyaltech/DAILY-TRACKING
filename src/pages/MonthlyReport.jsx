import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
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
  --green-light:#bbf7d0;
  --red:       #dc2626;
  --red-bg:    #fee2e2;
  --red-light: #fca5a5;
  --blue:      #1d4ed8;
  --blue-bg:   #dbeafe;
  --amber-bg:  #fef3c7;

  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow:    0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.1);
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
  max-width: 1100px;
  margin: auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}
.mr-eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--teal);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.mr-eyebrow::before {
  content: '';
  display: inline-block;
  width: 18px;
  height: 2px;
  background: var(--teal);
  border-radius: 2px;
}
.mr-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(22px, 3vw, 32px);
  font-weight: 900;
  color: var(--text);
}
.mr-title em { font-style: italic; color: var(--teal); }

.mr-select-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}
.mr-select-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-dim);
}
.mr-select {
  background: var(--bg2);
  border: 1.5px solid var(--border2);
  border-radius: 8px;
  padding: 9px 36px 9px 14px;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  color: var(--text);
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239a9187' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
  min-width: 180px;
}
.mr-select:focus {
  border-color: var(--teal);
  box-shadow: 0 0 0 3px rgba(13,148,136,0.1);
  background-color: var(--surface);
}
.mr-select option { color: var(--text); }

/* ─── WRAP ─── */
.mr-wrap {
  max-width: 1100px;
  margin: auto;
  padding: 0 24px;
}
@media(max-width: 480px) { .mr-wrap { padding: 0 14px; } }

/* ─── SECTION TITLE ─── */
.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.section-title::after {
  content: '';
  flex: 1;
  height: 1.5px;
  background: var(--border);
  border-radius: 2px;
}

/* ─── EMPTY / LOADING ─── */
.mr-empty {
  text-align: center;
  padding: 64px 24px;
  color: var(--text-dim);
}
.mr-empty-icon { font-size: 48px; margin-bottom: 16px; display: block; }
.mr-empty-title {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-med);
  margin-bottom: 8px;
}
.mr-empty-sub { font-size: 14px; font-weight: 300; }

.loading-text {
  text-align: center;
  color: var(--text-dim);
  padding: 48px;
  font-size: 14px;
}

/* ─── STAT CARDS ─── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 32px;
}
@media(max-width: 1000px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } }
@media(max-width:  640px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media(max-width:  360px) { .stats-grid { grid-template-columns: 1fr; } }

.stat-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 18px 18px 16px;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow); }

.stat-accent {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  border-radius: 14px 14px 0 0;
}
.stat-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 8px;
  line-height: 1.4;
}
.stat-value {
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 8px;
}
.stat-value.green { color: var(--green); }
.stat-value.red   { color: var(--red); }
.stat-value.teal  { color: var(--teal); }
.stat-value.blue  { color: var(--blue); }

.stat-change {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 20px;
}
.stat-change.up   { background: var(--green-bg); color: var(--green); }
.stat-change.down { background: var(--red-bg);   color: var(--red); }
.stat-change.flat { background: var(--bg2);       color: var(--text-dim); }

/* ─── TABLES ─── */
.table-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}
.table-footer {
  margin-top: 16px;
  text-align: right;
  font-family: 'Playfair Display', serif;
  font-size: 17px;
  font-weight: 700;
  padding-top: 14px;
  border-top: 1.5px solid var(--border);
}

.mr-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 380px;
}
.mr-table th {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-dim);
  padding: 10px 14px;
  text-align: left;
  background: var(--bg2);
  border-bottom: 1.5px solid var(--border);
  white-space: nowrap;
}
.mr-table th:first-child { border-radius: 8px 0 0 8px; }
.mr-table th:last-child  { border-radius: 0 8px 8px 0; }
.mr-table th.right  { text-align: right; }

.mr-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  font-weight: 400;
  vertical-align: middle;
}
.mr-table td.right { text-align: right; }
.mr-table tr:last-child td { border-bottom: none; }
.mr-table tr:hover td { background: var(--surface2); }

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.badge-home { background: var(--teal-light); color: var(--teal); }

.date-chip {
  display: inline-block;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-med);
  font-family: monospace;
}

/* ─── CHART ─── */
.chart-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 28px;
  margin-bottom: 28px;
  box-shadow: var(--shadow-sm);
}

/* ─── MOM/DAD PILLS ─── */
.home-stats-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}
.home-stat-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 14px 20px;
  box-shadow: var(--shadow-sm);
  flex: 1;
  min-width: 140px;
}
.home-stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--teal-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.home-stat-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 2px;
}
.home-stat-value {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--teal);
}
`;

/* ── ANIMATED NUMBER HOOK ── */
const useAnimatedNumber = (value, duration = 700) => {
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    let start = 0;
    const inc = value / (duration / 16);
    const timer = setInterval(() => {
      start += inc;
      if ((value >= 0 && start >= value) || (value < 0 && start <= value)) {
        start = value;
        clearInterval(timer);
      }
      setAnim(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return anim;
};

/* ═══════════════════════════════════════════════════════════ */
export default function MonthlyReport() {
  const [month, setMonth] = useState("");
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prevIncome, setPrevIncome] = useState(0);
  const [prevExpense, setPrevExpense] = useState(0);

  /* ── FETCH ── */
  const fetchData = async () => {
    if (!month) return;
    setLoading(true);

    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

    const [{ data: incomeData }, { data: expenseData }] = await Promise.all([
      supabase.from("income").select("*").gte("date", start).lte("date", end).order("date", { ascending: true }),
      supabase.from("expense").select("*").gte("date", start).lte("date", end).order("date", { ascending: true }),
    ]);
    setIncomes(incomeData || []);
    setExpenses(expenseData || []);

    // prev month
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

  /* ── CALCULATIONS ── */
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;
  const totalGivenToHome = incomes.reduce((s, i) => s + (Number(i.given_to_home) || 0), 0);
  const remainingAfterHome = totalIncome - totalGivenToHome;
  const momTotal = incomes.filter(i => i.given_to_whom === "Mom").reduce((s, i) => s + (i.given_to_home || 0), 0);
  const dadTotal = incomes.filter(i => i.given_to_whom === "Dad").reduce((s, i) => s + (i.given_to_home || 0), 0);

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

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return { value: d.toISOString().slice(0, 7), label: d.toLocaleString("default", { month: "long", year: "numeric" }) };
  });

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
            <div className="mr-select-wrap">
              <label className="mr-select-label">Select Month</label>
              <select className="mr-select" value={month} onChange={e => setMonth(e.target.value)}>
                <option value="">Choose a month</option>
                {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="mr-wrap">

          {/* NO MONTH SELECTED */}
          {!month && (
            <div className="mr-empty">
              <span className="mr-empty-icon">📊</span>
              <div className="mr-empty-title">Select a month to begin</div>
              <div className="mr-empty-sub">Choose a month above to view your financial summary</div>
            </div>
          )}

          {/* LOADING */}
          {month && loading && <div className="loading-text">Loading data…</div>}

          {/* SUMMARY CARDS */}
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

              {/* MOM / DAD */}
              {(momTotal > 0 || dadTotal > 0) && (
                <>
                  <p className="section-title">Home Distribution</p>
                  <div className="home-stats-row">
                    <div className="home-stat-pill">
                      <div className="home-stat-icon">👩</div>
                      <div>
                        <div className="home-stat-label">Mom Total</div>
                        <div className="home-stat-value">₹{momTotal}</div>
                      </div>
                    </div>
                    <div className="home-stat-pill">
                      <div className="home-stat-icon">👨</div>
                      <div>
                        <div className="home-stat-label">Dad Total</div>
                        <div className="home-stat-value">₹{dadTotal}</div>
                      </div>
                    </div>
                    <div className="home-stat-pill">
                      <div className="home-stat-icon">🏠</div>
                      <div>
                        <div className="home-stat-label">Total Given</div>
                        <div className="home-stat-value">₹{totalGivenToHome}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* INCOME TABLE */}
          {incomes.length > 0 && !loading && (
            <div className="table-card">
              <p className="section-title" style={{ color: "var(--green)" }}>Income Transactions</p>
              <table className="mr-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Service</th>
                    <th className="right">Amount</th>
                    <th className="right">Home</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map(row => (
                    <tr key={row.id}>
                      <td><span className="date-chip">{row.date}</span></td>
                      <td style={{ fontWeight: 500 }}>{row.service}</td>
                      <td className="right" style={{ fontWeight: 600, color: "var(--green)" }}>₹{row.amount}</td>
                      <td className="right">
                        {(Number(row.given_to_home) || 0) > 0
                          ? <span className="badge badge-home">₹{row.given_to_home} · {row.given_to_whom || "—"}</span>
                          : <span style={{ color: "var(--text-faint)" }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="table-footer" style={{ color: "var(--green)" }}>
                Total Income: ₹{totalIncome}
              </div>
            </div>
          )}

          {/* EXPENSE TABLE */}
          {expenses.length > 0 && !loading && (
            <div className="table-card">
              <p className="section-title" style={{ color: "var(--red)" }}>Expense Transactions</p>
              <table className="mr-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Paid To</th>
                    <th className="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(row => (
                    <tr key={row.id}>
                      <td><span className="date-chip">{row.date}</span></td>
                      <td style={{ fontWeight: 500 }}>{row.paid_to}</td>
                      <td className="right" style={{ fontWeight: 600, color: "var(--red)" }}>₹{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="table-footer" style={{ color: "var(--red)" }}>
                Total Expense: ₹{totalExpense}
              </div>
            </div>
          )}

          {/* TREND CHART */}
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
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#9a9187", fontSize: 11, fontFamily: "DM Sans" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9a9187", fontSize: 11, fontFamily: "DM Sans" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1.5px solid #e2dcd4",
                      borderRadius: "10px",
                      fontFamily: "DM Sans",
                      fontSize: 13,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    }}
                    formatter={(v) => [`₹${v}`, "Net"]}
                    labelFormatter={(l) => `Day ${l}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="Net"
                    stroke={balance >= 0 ? "#16a34a" : "#dc2626"}
                    fill="url(#netGradient)"
                    strokeWidth={2.5}
                    dot={{ fill: balance >= 0 ? "#16a34a" : "#dc2626", r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* prev month comparison */}
              <div style={{
                marginTop: 20,
                paddingTop: 18,
                borderTop: "1.5px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}>
                <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  vs Last Month:
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-med)" }}>
                  Net ₹{prevIncome - prevExpense}
                </span>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 12, fontWeight: 600,
                  padding: "3px 10px", borderRadius: 20,
                  background: balanceChange >= 0 ? "var(--green-bg)" : "var(--red-bg)",
                  color: balanceChange >= 0 ? "var(--green)" : "var(--red)",
                }}>
                  {balanceChange >= 0 ? "▲" : "▼"} {Math.abs(balanceChange).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* EMPTY — month chosen but no data */}
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