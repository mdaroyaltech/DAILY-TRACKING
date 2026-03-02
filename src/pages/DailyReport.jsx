import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
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
  --blue:      #1d4ed8;
  --blue-bg:   #dbeafe;
  --amber-bg:  #fffbeb;

  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow:    0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

.dr-root {
  min-height: 100vh;
  background: var(--bg);
  font-family: 'DM Sans', sans-serif;
  color: var(--text);
  padding-bottom: 80px;
}

/* ─── HEADER ─── */
.dr-header {
  background: var(--surface);
  border-bottom: 1.5px solid var(--border);
  box-shadow: var(--shadow-sm);
  padding: 28px 0;
  margin-bottom: 32px;
}
.dr-header-inner {
  max-width: 1100px;
  margin: auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}
.dr-eyebrow {
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
.dr-eyebrow::before {
  content: '';
  display: inline-block;
  width: 18px;
  height: 2px;
  background: var(--teal);
  border-radius: 2px;
}
.dr-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(22px, 3vw, 32px);
  font-weight: 900;
  color: var(--text);
}
.dr-title em { font-style: italic; color: var(--teal); }

.dr-date-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}
.dr-date-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-dim);
}
.dr-date-input {
  background: var(--bg2);
  border: 1.5px solid var(--border2);
  border-radius: 8px;
  padding: 9px 14px;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  color: var(--text);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  min-width: 160px;
}
.dr-date-input:focus {
  border-color: var(--teal);
  box-shadow: 0 0 0 3px rgba(13,148,136,0.1);
  background: var(--surface);
}

/* ─── WRAP ─── */
.dr-wrap {
  max-width: 1100px;
  margin: auto;
  padding: 0 24px;
}
@media(max-width: 480px) { .dr-wrap { padding: 0 14px; } }

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

/* ─── EMPTY STATE ─── */
.dr-empty {
  text-align: center;
  padding: 64px 24px;
  color: var(--text-dim);
}
.dr-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}
.dr-empty-title {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-med);
  margin-bottom: 8px;
}
.dr-empty-sub {
  font-size: 14px;
  font-weight: 300;
  color: var(--text-dim);
}

/* ─── FORMS ─── */
.forms-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 36px;
}
@media(max-width: 720px) { .forms-grid { grid-template-columns: 1fr; } }

.form-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}
.form-card-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--teal);
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1.5px solid var(--teal-light);
}
.field-wrap { margin-bottom: 12px; }
.field-label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-med);
  margin-bottom: 6px;
}
.dr-input, .dr-select {
  width: 100%;
  background: var(--bg2);
  border: 1.5px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 400;
  color: var(--text);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  appearance: none;
  -webkit-appearance: none;
}
.dr-input::placeholder { color: var(--text-faint); }
.dr-input:focus, .dr-select:focus {
  border-color: var(--teal);
  background: var(--surface);
  box-shadow: 0 0 0 3px rgba(13,148,136,0.1);
}
.dr-select option { color: var(--text); }

.btn {
  width: 100%;
  padding: 11px;
  border: none;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  margin-top: 6px;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.15s;
}
.btn:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: var(--shadow); }
.btn:active { transform: translateY(0); }
.btn-green { background: var(--green); color: #fff; }
.btn-red   { background: var(--red);   color: #fff; }

/* ─── STAT CARDS ─── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 32px;
}
@media(max-width: 900px)  { .stats-grid { grid-template-columns: repeat(3, 1fr); } }
@media(max-width: 560px)  { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media(max-width: 360px)  { .stats-grid { grid-template-columns: 1fr; } }

.stat-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 18px 20px;
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
  border-radius: 12px 12px 0 0;
}
.stat-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 8px;
  line-height: 1.3;
}
.stat-value {
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
}
.stat-value.green { color: var(--green); }
.stat-value.red   { color: var(--red); }
.stat-value.blue  { color: var(--blue); }
.stat-value.teal  { color: var(--teal); }

/* ─── CHART ─── */
.chart-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 28px;
  margin-bottom: 28px;
  box-shadow: var(--shadow-sm);
}

/* ─── TABLE ─── */
.table-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 28px;
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}
.dr-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 480px;
}
.dr-table th {
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
.dr-table th:first-child { border-radius: 8px 0 0 8px; }
.dr-table th:last-child  { border-radius: 0 8px 8px 0; }
.dr-table th.right  { text-align: right; }
.dr-table th.center { text-align: center; }

.dr-table td {
  padding: 13px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  font-weight: 400;
  vertical-align: middle;
}
.dr-table td.right  { text-align: right; }
.dr-table td.center { text-align: center; }
.dr-table tr:last-child td { border-bottom: none; }
.dr-table tr:hover td { background: var(--surface2); }
.dr-table tr.row-pending td { background: var(--amber-bg); }
.dr-table tr.row-pending:hover td { background: #fef9d0; }

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
}
.badge-income  { background: var(--green-bg); color: var(--green); }
.badge-expense { background: var(--red-bg);   color: var(--red); }
.badge-home    { background: var(--teal-light); color: var(--teal); }

.edit-input {
  background: var(--bg2);
  border: 1.5px solid var(--teal);
  border-radius: 6px;
  padding: 5px 8px;
  width: 90px;
  text-align: right;
  color: var(--text);
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  box-shadow: 0 0 0 3px rgba(13,148,136,0.1);
}
.edit-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-weight: 600;
  color: var(--text);
  transition: color 0.15s;
}
.edit-trigger:hover { color: var(--teal); }
.edit-icon { width: 13px; height: 13px; color: var(--text-faint); transition: color 0.15s; }
.edit-trigger:hover .edit-icon { color: var(--teal); }

.del-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  color: var(--text-faint);
  transition: color 0.2s, background 0.2s;
  display: inline-flex;
}
.del-btn:hover { color: var(--red); background: var(--red-bg); }

.loading-text {
  text-align: center;
  color: var(--text-dim);
  padding: 36px;
  font-size: 14px;
}
`;

/* ═══════════════════════════════════════════════════════════ */
export default function DailyReport() {
  const [date, setDate] = useState("");
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [customPaidTo, setCustomPaidTo] = useState("");

  const PAID_TO_OPTIONS = ["PACHAIYAPPAN FIN", "SAI FIN", "SOTTA FIN", "SPF FIN", "BHAVANI FIN", "JANA SETTIYAR", "Others"];

  const [incomeForm, setIncomeForm] = useState({ service: "", amount: "" });
  const [expenseForm, setExpenseForm] = useState({ paid_to: "", amount: "" });

  /* ── FETCH ── */
  const fetchData = async () => {
    if (!date) return;
    setLoading(true);
    const [{ data: incomeData }, { data: expenseData }] = await Promise.all([
      supabase.from("income").select("*").eq("date", date).order("id", { ascending: false }),
      supabase.from("expense").select("*").eq("date", date).order("id", { ascending: false }),
    ]);
    setIncomes(incomeData || []);
    setExpenses(expenseData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [date]);

  /* ── ADD ── */
  const addIncome = async () => {
    if (!date || !incomeForm.service || !incomeForm.amount) return;
    await supabase.from("income").insert([{ date, ...incomeForm, amount: +incomeForm.amount }]);
    setIncomeForm({ service: "", amount: "" });
    fetchData();
  };

  const addExpense = async () => {
    if (!date) return;
    let paidTo = expenseForm.paid_to === "Others" ? customPaidTo : expenseForm.paid_to;
    if (!paidTo || !expenseForm.amount) return;
    await supabase.from("expense").insert([{ date, paid_to: paidTo, amount: +expenseForm.amount }]);
    setExpenseForm({ paid_to: "", amount: "" });
    setCustomPaidTo("");
    fetchData();
  };

  /* ── UPDATE / DELETE ── */
  const updateAmount = async (table, id, amount) => {
    await supabase.from(table).update({ amount: +amount }).eq("id", id);
    setEditing(null);
    fetchData();
  };

  const deleteRow = async (table, id) => {
    if (!window.confirm("Delete this entry?")) return;
    await supabase.from(table).delete().eq("id", id);
    fetchData();
  };

  /* ── TOTALS ── */
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;
  const totalGivenToHome = incomes.reduce((s, i) => s + (i.given_to_home || 0), 0);
  const remainingAfterHome = totalIncome - totalGivenToHome;

  const chartData = [
    { name: "Expense", value: totalExpense },
    { name: "Given To Home", value: totalGivenToHome },
    { name: "Remaining", value: remainingAfterHome },
  ];
  const COLORS = ["#dc2626", "#1d4ed8", "#16a34a"];

  const hasData = incomes.length > 0 || expenses.length > 0;
  const allRows = [
    ...incomes.map(i => ({ ...i, t: "income" })),
    ...expenses.map(e => ({ ...e, t: "expense" })),
  ];

  return (
    <>
      <style>{CSS}</style>
      <Navbar />

      <div className="dr-root">

        {/* HEADER */}
        <div className="dr-header">
          <div className="dr-header-inner">
            <div>
              <div className="dr-eyebrow">Daily Report</div>
              <h1 className="dr-title">View & manage <em>transactions</em></h1>
            </div>
            <div className="dr-date-wrap">
              <label className="dr-date-label">Select Date</label>
              <input
                type="date"
                className="dr-date-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="dr-wrap">

          {/* EMPTY STATE — no date chosen */}
          {!date && (
            <div className="dr-empty">
              <span className="dr-empty-icon">📅</span>
              <div className="dr-empty-title">Select a date to begin</div>
              <div className="dr-empty-sub">Choose a date above to view or add transactions</div>
            </div>
          )}

          {/* FORMS */}
          {date && (
            <>
              <p className="section-title">Quick Entry</p>
              <div className="forms-grid">

                {/* ADD INCOME */}
                <div className="form-card">
                  <div className="form-card-title">➕ Add Income</div>
                  <div className="field-wrap">
                    <label className="field-label">Service / Work</label>
                    <input className="dr-input" placeholder="e.g. Loan recovery" value={incomeForm.service}
                      onChange={e => setIncomeForm({ ...incomeForm, service: e.target.value })} />
                  </div>
                  <div className="field-wrap">
                    <label className="field-label">Amount (₹)</label>
                    <input className="dr-input" type="number" placeholder="0" value={incomeForm.amount}
                      onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })} />
                  </div>
                  <div style={{ flex: 1 }} />
                  <button className="btn btn-green" onClick={addIncome}>Save Income</button>
                </div>

                {/* ADD EXPENSE */}
                <div className="form-card">
                  <div className="form-card-title">➖ Add Expense</div>
                  <div className="field-wrap">
                    <label className="field-label">Paid To</label>
                    <select className="dr-select" value={expenseForm.paid_to}
                      onChange={e => { setExpenseForm({ ...expenseForm, paid_to: e.target.value }); if (e.target.value !== "Others") setCustomPaidTo(""); }}>
                      <option value="">Select Paid To</option>
                      {PAID_TO_OPTIONS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  {expenseForm.paid_to === "Others" && (
                    <div className="field-wrap">
                      <label className="field-label">Custom Name</label>
                      <input className="dr-input" placeholder="Enter name" value={customPaidTo}
                        onChange={e => setCustomPaidTo(e.target.value)} />
                    </div>
                  )}
                  <div className="field-wrap">
                    <label className="field-label">Amount (₹)</label>
                    <input className="dr-input" type="number" placeholder="0" value={expenseForm.amount}
                      onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                  </div>
                  <div style={{ flex: 1 }} />
                  <button className="btn btn-red" onClick={addExpense}>Save Expense</button>
                </div>

              </div>
            </>
          )}

          {/* SUMMARY STAT CARDS */}
          {hasData && (
            <>
              <p className="section-title">Summary</p>
              <div className="stats-grid">
                <StatCard label="Income" value={totalIncome} valCls="green" accentColor="#16a34a" />
                <StatCard label="Expense" value={totalExpense} valCls="red" accentColor="#dc2626" />
                <StatCard label="Balance" value={balance} valCls={balance >= 0 ? "teal" : "red"} accentColor={balance >= 0 ? "#0d9488" : "#dc2626"} />
                <StatCard label="Given To Home" value={totalGivenToHome} valCls="blue" accentColor="#1d4ed8" />
                <StatCard label="Remaining" value={remainingAfterHome} valCls="green" accentColor="#16a34a" />
              </div>
            </>
          )}

          {/* PIE CHART */}
          {hasData && (
            <div className="chart-card">
              <p className="section-title">Daily Overview</p>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1.5px solid #e2dcd4", borderRadius: "10px", fontFamily: "DM Sans", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                    formatter={(v) => [`₹${v}`, ""]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, fontFamily: "DM Sans", color: "#9a9187", paddingTop: 16 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* TRANSACTIONS TABLE */}
          {hasData && (
            <div className="table-card">
              <p className="section-title">Transactions</p>
              {loading ? (
                <div className="loading-text">Loading…</div>
              ) : (
                <table className="dr-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th className="right">Amount</th>
                      <th className="right">Home</th>
                      <th className="center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRows.map(row => (
                      <tr
                        key={`${row.t}-${row.id}`}
                        className={row.t === "income" && (row.given_to_home || 0) < row.amount ? "row-pending" : ""}
                      >
                        <td>
                          <span className={`badge badge-${row.t === "income" ? "income" : "expense"}`}>
                            {row.t === "income" ? "Income" : "Expense"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>{row.service || row.paid_to}</td>
                        <td className="right">
                          {editing === `${row.t}-${row.id}` ? (
                            <input
                              className="edit-input"
                              type="number"
                              defaultValue={row.amount}
                              autoFocus
                              onBlur={e => updateAmount(row.t, row.id, e.target.value)}
                            />
                          ) : (
                            <span className="edit-trigger" onClick={() => setEditing(`${row.t}-${row.id}`)}>
                              <span>₹{row.amount}</span>
                              <svg className="edit-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M15.232 5.232l3.536 3.536M4 20l4-1 10-10-3-3L5 16l-1 4z" />
                              </svg>
                            </span>
                          )}
                        </td>
                        <td className="right">
                          {row.t === "income"
                            ? <span className="badge badge-home">₹{row.given_to_home || 0} · {row.given_to_whom || "—"}</span>
                            : <span style={{ color: "var(--text-faint)" }}>—</span>
                          }
                        </td>
                        <td className="center">
                          <button className="del-btn" onClick={() => deleteRow(row.t, row.id)}>
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Empty state when date is chosen but no data */}
          {date && !hasData && !loading && (
            <div className="dr-empty">
              <span className="dr-empty-icon">🗒️</span>
              <div className="dr-empty-title">No transactions found</div>
              <div className="dr-empty-sub">Add income or expense entries above for {date}</div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

/* ── STAT CARD ── */
const StatCard = ({ label, value, valCls, accentColor }) => (
  <div className="stat-card">
    <div className="stat-accent" style={{ background: accentColor }} />
    <div className="stat-label">{label}</div>
    <div className={`stat-value ${valCls}`}>₹{value}</div>
  </div>
);