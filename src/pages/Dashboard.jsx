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

  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow:    0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

.db-root {
  min-height: 100vh;
  background: var(--bg);
  font-family: 'DM Sans', sans-serif;
  color: var(--text);
  padding-bottom: 80px;
}

/* ─── HEADER ─── */
.db-header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 36px 0 28px;
  margin-bottom: 36px;
  box-shadow: var(--shadow-sm);
}
.db-header-inner {
  max-width: 1200px;
  margin: auto;
  padding: 0 32px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}
.db-eyebrow {
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
.db-eyebrow::before {
  content: '';
  display: inline-block;
  width: 20px;
  height: 2px;
  background: var(--teal);
  border-radius: 2px;
}
.db-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(26px, 3.5vw, 40px);
  font-weight: 900;
  line-height: 1.08;
  color: var(--text);
}
.db-title em {
  font-style: italic;
  color: var(--teal);
}
.db-date {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-dim);
  letter-spacing: 0.06em;
  padding: 8px 16px;
  border: 1.5px solid var(--border2);
  border-radius: 24px;
  background: var(--bg2);
}

/* ─── LAYOUT ─── */
.db-wrap {
  max-width: 1200px;
  margin: auto;
  padding: 0 32px;
}
@media(max-width: 600px) { .db-wrap { padding: 0 16px; } }

/* ─── SECTION TITLE ─── */
.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 19px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.section-title::after {
  content: '';
  flex: 1;
  height: 1.5px;
  background: var(--border);
  border-radius: 2px;
}

/* ─── STAT CARDS ─── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.stats-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 40px;
}
@media(max-width: 900px) {
  .stats-grid { grid-template-columns: 1fr; }
  .stats-grid-4 { grid-template-columns: repeat(2, 1fr); }
}
@media(max-width: 480px) {
  .stats-grid-4 { grid-template-columns: 1fr; }
}

.stat-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 22px 26px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}
.stat-card-accent {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  border-radius: 14px 14px 0 0;
}
.accent-green  { background: var(--green); }
.accent-red    { background: var(--red); }
.accent-teal   { background: var(--teal); }
.accent-amber  { background: var(--amber); }
.accent-blue   { background: var(--blue); }

.stat-icon-bg {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-bottom: 14px;
}
.stat-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 6px;
}
.stat-value {
  font-family: 'Playfair Display', serif;
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
}
.stat-value.green { color: var(--green); }
.stat-value.red   { color: var(--red); }
.stat-value.teal  { color: var(--teal); }
.stat-value.amber { color: var(--amber); }
.stat-value.blue  { color: var(--blue); }

/* ─── FORM CARDS ─── */
.forms-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}
@media(max-width: 900px) { .forms-grid { grid-template-columns: 1fr; } }

.form-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 26px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
}
.form-card-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--teal);
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1.5px solid var(--teal-light);
}

.field-wrap { margin-bottom: 13px; }
.field-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-med);
  margin-bottom: 6px;
}

.db-input, .db-select {
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
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  appearance: none;
  -webkit-appearance: none;
}
.db-input::placeholder { color: var(--text-faint); }
.db-input:focus, .db-select:focus {
  border-color: var(--teal);
  background: var(--surface);
  box-shadow: 0 0 0 3px rgba(13,148,136,0.1);
}
.db-select option { color: var(--text); }

.db-input-readonly {
  background: var(--teal-light);
  border-color: var(--teal-mid);
  color: var(--teal);
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 700;
  cursor: not-allowed;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.15s;
  margin-top: 4px;
}
.btn:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: var(--shadow); }
.btn:active { transform: translateY(0); box-shadow: none; }

.btn-teal  { background: var(--teal); color: #fff; }
.btn-green { background: var(--green); color: #fff; }
.btn-red   { background: var(--red); color: #fff; }
.btn-ghost {
  background: transparent;
  color: var(--red);
  border: 1.5px solid rgba(220,38,38,0.3);
  margin-top: 8px;
}
.btn-ghost:hover { background: var(--red-bg); }

/* ─── CHART ─── */
.chart-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 30px;
  margin-bottom: 40px;
  box-shadow: var(--shadow-sm);
}
.chart-toggle {
  display: flex;
  gap: 6px;
  background: var(--bg2);
  padding: 5px;
  border-radius: 10px;
  width: fit-content;
  margin-bottom: 24px;
  border: 1.5px solid var(--border);
}
.toggle-btn {
  padding: 8px 22px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  font-family: 'DM Sans', sans-serif;
  color: var(--text-dim);
  background: transparent;
}
.toggle-btn.active {
  background: var(--teal);
  color: #fff;
  box-shadow: 0 2px 8px rgba(13,148,136,0.3);
}

.chart-result-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1.5px solid var(--border);
}
@media(max-width: 600px) { .chart-result-row { grid-template-columns: 1fr; } }

.result-box {
  text-align: center;
  padding: 18px;
  border-radius: 10px;
  border: 1.5px solid var(--border);
  background: var(--surface2);
}
.result-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 8px;
}
.result-value {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  font-weight: 700;
}
.result-value.profit { color: var(--green); }
.result-value.loss   { color: var(--red); }

/* ─── TABLES ─── */
.table-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 30px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}
.db-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.db-table th {
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
.db-table th:first-child { border-radius: 8px 0 0 8px; }
.db-table th:last-child  { border-radius: 0 8px 8px 0; }
.db-table th.right  { text-align: right; }
.db-table th.center { text-align: center; }

.db-table td {
  padding: 13px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  font-weight: 400;
  vertical-align: middle;
}
.db-table td.right  { text-align: right; }
.db-table td.center { text-align: center; }
.db-table tr:last-child td { border-bottom: none; }
.db-table tr:hover td { background: var(--surface2); }
.row-pending td { background: #fffbeb !important; }
.row-pending:hover td { background: #fef9d0 !important; }

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
  color: var(--text);
  font-weight: 500;
}
.edit-trigger:hover { color: var(--teal); }
.edit-icon {
  width: 13px;
  height: 13px;
  color: var(--text-dim);
  transition: color 0.2s;
}
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

.loading-text, .empty-text {
  text-align: center;
  color: var(--text-dim);
  padding: 36px;
  font-size: 14px;
  font-weight: 300;
  letter-spacing: 0.04em;
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
  const [customPaidTo, setCustomPaidTo] = useState("");
  const [chartType, setChartType] = useState("daily");
  const [chartData, setChartData] = useState([]);

  const { totalIncome, totalExpense, balance, weeklyBalance } =
    useFinanceSummary(incomes, expenses, today);

  const totalGivenToHome = incomes.reduce((s, i) => s + (i.given_to_home || 0), 0);
  const remainingAfterHome = totalIncome - totalGivenToHome;
  const momTotal = incomes.filter(i => i.given_to_whom === "Mom").reduce((s, i) => s + (i.given_to_home || 0), 0);
  const dadTotal = incomes.filter(i => i.given_to_whom === "Dad").reduce((s, i) => s + (i.given_to_home || 0), 0);

  const PAID_TO_OPTIONS = ["PACHAIYAPPAN FIN", "SAI FIN", "SOTTA FIN", "SPF FIN", "BHAVANI FIN", "JANA SETTIYAR", "Others"];

  const [incomeForm, setIncomeForm] = useState({ date: today, service: "", amount: "" });
  const [homeForm, setHomeForm] = useState({ given_to_whom: "Mom" });
  const [expenseForm, setExpenseForm] = useState({ date: today, paid_to: "", amount: "" });

  /* ── FETCH ── */
  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/"); return; }
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDate = sevenDaysAgo.toISOString().split("T")[0];
    const [{ data: incomeData }, { data: expenseData }] = await Promise.all([
      supabase.from("income").select("*").gte("date", startDate).lte("date", today).order("created_at", { ascending: false }),
      supabase.from("expense").select("*").gte("date", startDate).lte("date", today).order("created_at", { ascending: false }),
    ]);
    setIncomes(incomeData || []);
    setExpenses(expenseData || []);
    setLoading(false);
  };

  const generateChartData = (inc, exp) => {
    if (chartType === "daily") return [{ name: "Today", Income: inc.filter(i => i.date === today).reduce((s, i) => s + i.amount, 0), Expense: exp.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0) }];
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      last7.push({ name: ds.slice(5), Income: inc.filter(i => i.date === ds).reduce((s, i) => s + i.amount, 0), Expense: exp.filter(e => e.date === ds).reduce((s, e) => s + e.amount, 0) });
    }
    return last7;
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const check = async () => { const { data } = await supabase.auth.getSession(); if (!data.session) navigate("/"); };
    check();
  }, [navigate]);
  useEffect(() => { setChartData(generateChartData(incomes, expenses)); }, [chartType, incomes, expenses]);

  /* ── ADD ── */
  const addIncome = async () => {
    if (!incomeForm.service || !incomeForm.amount) return;
    const { error } = await supabase.from("income").insert([{ date: today, service: incomeForm.service, amount: Number(incomeForm.amount), given_to_home: 0 }]);
    if (error) { alert(error.message); return; }
    setIncomeForm({ date: today, service: "", amount: "" });
    fetchData();
  };
  const addExpense = async () => {
    let paidTo = expenseForm.paid_to === "Others" ? customPaidTo : expenseForm.paid_to;
    if (!paidTo || !expenseForm.amount) return;
    const { error } = await supabase.from("expense").insert([{ date: today, paid_to: paidTo, amount: Number(expenseForm.amount) }]);
    if (error) { alert(error.message); return; }
    setExpenseForm({ date: today, paid_to: "", amount: "" });
    setCustomPaidTo("");
    fetchData();
  };

  /* ── UPDATE / DELETE ── */
  const updateTransaction = async (table, id, amount) => {
    await supabase.from(table).update({ amount: Number(amount) }).eq("id", id);
    setEditing(null); fetchData();
  };
  const deleteTransaction = async (table, id) => {
    if (!window.confirm("Delete this entry?")) return;
    await supabase.from(table).delete().eq("id", id);
    fetchData();
  };

  /* ── HOME ── */
  const giveToHome = async () => {
    if (balance <= 0) { alert("No balance available to give"); return; }
    let remaining = balance;
    const todayIncomes = incomes.filter(i => i.date === today).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    for (let income of todayIncomes) {
      if (remaining <= 0) break;
      const currentGiven = income.given_to_home || 0;
      const available = income.amount - currentGiven;
      if (available <= 0) continue;
      const giveAmount = Math.min(available, remaining);
      await supabase.from("income").update({ given_to_home: currentGiven + giveAmount, given_to_whom: homeForm.given_to_whom }).eq("id", income.id);
      remaining -= giveAmount;
    }
    setHomeForm({ amount: "", given_to_whom: "Mom" });
    fetchData();
  };
  const undoLastHomePayment = async () => {
    const last = incomes.filter(i => (i.given_to_home || 0) > 0).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    if (!last) { alert("No home payment found"); return; }
    await supabase.from("income").update({ given_to_home: 0, given_to_whom: null }).eq("id", last.id);
    fetchData();
  };

  const todayRows = [
    ...incomes.filter(i => i.date === today).map(i => ({ ...i, type: "Income" })),
    ...expenses.filter(e => e.date === today).map(e => ({ ...e, type: "Expense" })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
              {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
        </div>

        <div className="db-wrap">

          {/* TOP 3 STAT CARDS */}
          <div className="stats-grid">
            <StatCard label="Total Income" value={totalIncome} valCls="green" accent="accent-green" icon="💰" iconBg="#dcfce7" />
            <StatCard label="Total Expense" value={totalExpense} valCls="red" accent="accent-red" icon="💸" iconBg="#fee2e2" />
            <StatCard label="Balance" value={balance} valCls={balance >= 0 ? "teal" : "red"} accent={balance >= 0 ? "accent-teal" : "accent-red"} icon="🧮" iconBg="#e0f2f0" />
          </div>

          {/* BOTTOM 4 STAT CARDS */}
          <div className="stats-grid-4">
            <StatCard label="Total Given Home" value={totalGivenToHome} valCls="blue" accent="accent-blue" icon="🏠" iconBg="#dbeafe" small />
            <StatCard label="Remaining" value={remainingAfterHome} valCls="green" accent="accent-green" icon="💼" iconBg="#dcfce7" small />
            <StatCard label="Mom Total" value={momTotal} valCls="amber" accent="accent-amber" icon="👩" iconBg="#fef3c7" small />
            <StatCard label="Dad Total" value={dadTotal} valCls="teal" accent="accent-teal" icon="👨" iconBg="#e0f2f0" small />
          </div>

          {/* FORMS */}
          <p className="section-title">Quick Entry</p>
          <div className="forms-grid">

            {/* GIVE TO HOME */}
            <div className="form-card">
              <div className="form-card-title">🏠 Give to Home</div>
              <div className="field-wrap">
                <label className="field-label">Available Balance</label>
                <input className="db-input db-input-readonly" readOnly value={`₹${balance > 0 ? balance : 0}`} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Give To</label>
                <select className="db-select" value={homeForm.given_to_whom} onChange={e => setHomeForm({ ...homeForm, given_to_whom: e.target.value })}>
                  <option value="Mom">Mom</option>
                  <option value="Dad">Dad</option>
                </select>
              </div>
              <div style={{ flex: 1 }} />
              <button className="btn btn-teal" onClick={giveToHome}>Save Home Payment</button>
              <button className="btn btn-ghost" onClick={undoLastHomePayment}>Undo Last Payment</button>
            </div>

            {/* ADD INCOME */}
            <div className="form-card">
              <div className="form-card-title">➕ Add Income</div>
              <div className="field-wrap">
                <label className="field-label">Service / Work</label>
                <input className="db-input" placeholder="e.g. Loan recovery" value={incomeForm.service} onChange={e => setIncomeForm({ ...incomeForm, service: e.target.value })} />
              </div>
              <div className="field-wrap">
                <label className="field-label">Amount (₹)</label>
                <input className="db-input" type="number" placeholder="0" value={incomeForm.amount} onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })} />
              </div>
              <div style={{ flex: 1 }} />
              <button className="btn btn-green" onClick={addIncome}>Save Income</button>
            </div>

            {/* ADD EXPENSE */}
            <div className="form-card">
              <div className="form-card-title">➖ Add Expense</div>
              <div className="field-wrap">
                <label className="field-label">Paid To</label>
                <select className="db-select" value={expenseForm.paid_to} onChange={e => { setExpenseForm({ ...expenseForm, paid_to: e.target.value }); if (e.target.value !== "Others") setCustomPaidTo(""); }}>
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
                <input className="db-input" type="number" placeholder="0" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
              </div>
              <div style={{ flex: 1 }} />
              <button className="btn btn-red" onClick={addExpense}>Save Expense</button>
            </div>

          </div>

          {/* CHART */}
          <div className="chart-card">
            <p className="section-title">Income vs Expense</p>
            <div className="chart-toggle">
              <button className={`toggle-btn${chartType === "daily" ? " active" : ""}`} onClick={() => setChartType("daily")}>Daily</button>
              <button className={`toggle-btn${chartType === "weekly" ? " active" : ""}`} onClick={() => setChartType("weekly")}>7 Days</button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barGap={6}>
                <XAxis dataKey="name" tick={{ fill: "#9a9187", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9a9187", fontSize: 11, fontFamily: "DM Sans" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1.5px solid #e2dcd4", borderRadius: "10px", color: "#1c1a17", fontFamily: "DM Sans", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "DM Sans", color: "#9a9187" }} />
                <Bar dataKey="Income" fill="#16a34a" radius={[6, 6, 0, 0]} animationDuration={700} />
                <Bar dataKey="Expense" fill="#dc2626" radius={[6, 6, 0, 0]} animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
            <div className="chart-result-row">
              <div className="result-box">
                <div className="result-label">Today's Result</div>
                <div className={`result-value ${balance >= 0 ? "profit" : "loss"}`}>
                  {balance >= 0 ? `↑ Profit ₹${balance}` : `↓ Loss ₹${Math.abs(balance)}`}
                </div>
              </div>
              <div className="result-box">
                <div className="result-label">7-Day Result</div>
                <div className={`result-value ${weeklyBalance >= 0 ? "profit" : "loss"}`}>
                  {weeklyBalance >= 0 ? `↑ ₹${weeklyBalance}` : `↓ ₹${Math.abs(weeklyBalance)}`}
                </div>
              </div>
            </div>
          </div>

          {/* TRANSACTIONS TABLE */}
          <div className="table-card">
            <p className="section-title">Today's Transactions</p>
            {loading ? (
              <div className="loading-text">Loading transactions…</div>
            ) : todayRows.length === 0 ? (
              <div className="empty-text">No transactions recorded for today</div>
            ) : (
              <table className="db-table">
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
                  {todayRows.map(row => (
                    <tr key={`${row.type}-${row.id}`} className={row.type === "Income" && (row.given_to_home || 0) < row.amount ? "row-pending" : ""}>
                      <td><span className={`badge badge-${row.type.toLowerCase()}`}>{row.type}</span></td>
                      <td style={{ fontWeight: 500 }}>{row.service || row.paid_to}</td>
                      <td className="right">
                        {editing === `${row.type}-${row.id}` ? (
                          <input className="edit-input" type="number" defaultValue={row.amount} autoFocus
                            onBlur={e => updateTransaction(row.type === "Income" ? "income" : "expense", row.id, e.target.value)} />
                        ) : (
                          <span className="edit-trigger" onClick={() => setEditing(`${row.type}-${row.id}`)}>
                            <span style={{ fontWeight: 600 }}>₹{row.amount}</span>
                            <svg className="edit-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M15.232 5.232l3.536 3.536M4 20l4-1 10-10-3-3L5 16l-1 4z" />
                            </svg>
                          </span>
                        )}
                      </td>
                      <td className="right" style={{ color: "var(--text-dim)", fontSize: 12 }}>
                        {row.type === "Income"
                          ? <span className="badge badge-home">₹{row.given_to_home || 0} · {row.given_to_whom || "—"}</span>
                          : <span style={{ color: "var(--text-faint)" }}>—</span>}
                      </td>
                      <td className="center">
                        <button className="del-btn" onClick={() => deleteTransaction(row.type === "Income" ? "income" : "expense", row.id)}>
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

          {/* HOME PAYMENT HISTORY */}
          <div className="table-card">
            <p className="section-title">Home Payment History</p>
            {incomes.filter(i => (i.given_to_home || 0) > 0).length === 0 ? (
              <div className="empty-text">No home payments recorded</div>
            ) : (
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Service</th>
                    <th className="right">Amount Given</th>
                    <th>Given To</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.filter(i => (i.given_to_home || 0) > 0).map(i => (
                    <tr key={i.id}>
                      <td style={{ color: "var(--text-med)" }}>{i.date}</td>
                      <td style={{ fontWeight: 500 }}>{i.service}</td>
                      <td className="right" style={{ color: "var(--teal)", fontFamily: "Playfair Display, serif", fontWeight: 700 }}>₹{i.given_to_home}</td>
                      <td><span className="badge badge-home">{i.given_to_whom}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
    <div className={`stat-value ${valCls}`} style={small ? { fontSize: 24 } : {}}>₹{value}</div>
  </div>
);