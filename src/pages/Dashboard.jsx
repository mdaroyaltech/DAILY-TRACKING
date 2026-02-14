import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useFinanceSummary } from "../hooks/useFinanceSummary";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";


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
  const {
    totalIncome,
    totalExpense,
    balance,
    weeklyIncome,
    weeklyExpense,
    weeklyBalance,
  } = useFinanceSummary(incomes, expenses, today);
  const totalGivenToHome = incomes.reduce(
    (sum, i) => sum + (i.given_to_home || 0),
    0
  );

  const remainingAfterHome = totalIncome - totalGivenToHome;

  const momTotal = incomes
    .filter(i => i.given_to_whom === "Mom")
    .reduce((sum, i) => sum + (i.given_to_home || 0), 0);

  const dadTotal = incomes
    .filter(i => i.given_to_whom === "Dad")
    .reduce((sum, i) => sum + (i.given_to_home || 0), 0);


  const PAID_TO_OPTIONS = [
    "PACHAIYAPPAN FIN",
    "SAI FIN",
    "SOTTA FIN",
    "SPF FIN",
    "BHAVANI FIN",
    "JANA SETTIYAR",
    "Others",
  ];
  const [incomeForm, setIncomeForm] = useState({
    date: today,
    service: "",
    amount: "",
  });
  const [homeForm, setHomeForm] = useState({
    given_to_whom: "Mom",
  });


  const [expenseForm, setExpenseForm] = useState({
    date: today,
    paid_to: "",
    amount: "",
  });

  /* ================= FETCH ================= */
  const fetchData = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigate("/");
      return;
    }
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDate = sevenDaysAgo.toISOString().split("T")[0];

    const [{ data: incomeData }, { data: expenseData }] =
      await Promise.all([
        supabase
          .from("income")
          .select("*")
          .gte("date", startDate)
          .lte("date", today)
          .order("created_at", { ascending: false }),

        supabase
          .from("expense")
          .select("*")
          .gte("date", startDate)
          .lte("date", today)
          .order("created_at", { ascending: false }),
      ]);


    setIncomes(incomeData || []);
    setExpenses(expenseData || []);
    setLoading(false);
  };

  const generateChartData = (incomes, expenses) => {
    if (chartType === "daily") {
      const todayIncome = incomes
        .filter(i => i.date === today)
        .reduce((s, i) => s + i.amount, 0);

      const todayExpense = expenses
        .filter(e => e.date === today)
        .reduce((s, e) => s + e.amount, 0);

      return [
        {
          name: "Today",
          Income: todayIncome,
          Expense: todayExpense,
        },
      ];
    }

    // Weekly
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      const dailyIncome = incomes
        .filter(i => i.date === dateStr)
        .reduce((s, i) => s + i.amount, 0);

      const dailyExpense = expenses
        .filter(e => e.date === dateStr)
        .reduce((s, e) => s + e.amount, 0);

      last7Days.push({
        name: dateStr.slice(5),
        Income: dailyIncome,
        Expense: dailyExpense,
      });
    }

    return last7Days;
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/");
      }
    };

    checkSession();
  }, [navigate]);

  /* ================= ADD ================= */
  const addIncome = async () => {
    if (!incomeForm.service || !incomeForm.amount) return;

    const { error } = await supabase.from("income").insert([
      {
        date: today,
        service: incomeForm.service,
        amount: Number(incomeForm.amount),
        given_to_home: 0,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setIncomeForm({
      date: today,
      service: "",
      amount: "",
    });

    fetchData();
  };

  const addExpense = async () => {
    let paidTo =
      expenseForm.paid_to === "Others" ? customPaidTo : expenseForm.paid_to;

    if (!paidTo || !expenseForm.amount) return;

    const { error } = await supabase.from("expense").insert([
      {
        date: today,
        paid_to: paidTo,
        amount: Number(expenseForm.amount),
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setExpenseForm({ date: today, paid_to: "", amount: "" });
    setCustomPaidTo("");
    fetchData();
  };


  /* ================= UPDATE ================= */
  const updateTransaction = async (table, id, amount) => {
    await supabase.from(table).update({ amount: Number(amount) }).eq("id", id);
    setEditing(null);
    fetchData();
  };

  /* ================= DELETE ================= */
  const deleteTransaction = async (table, id) => {
    if (!window.confirm("Delete this entry?")) return;
    await supabase.from(table).delete().eq("id", id);
    fetchData();
  };

  useEffect(() => {
    setChartData(generateChartData(incomes, expenses));
  }, [chartType, incomes, expenses]);

  const updateGivenToHome = async (id, value) => {
    await supabase
      .from("income")
      .update({ given_to_home: Number(value) })
      .eq("id", id);

    setEditing(null);
    fetchData();
  };
  const giveToHome = async () => {

    if (balance <= 0) {
      alert("No balance available to give");
      return;
    }

    let remaining = balance;


    const todayIncomes = incomes
      .filter(i => i.date === today)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    for (let income of todayIncomes) {
      if (remaining <= 0) break;

      const currentGiven = income.given_to_home || 0;
      const available = income.amount - currentGiven;

      if (available <= 0) continue;

      const giveAmount = Math.min(available, remaining);

      await supabase
        .from("income")
        .update({
          given_to_home: currentGiven + giveAmount,
          given_to_whom: homeForm.given_to_whom,
        })
        .eq("id", income.id);

      remaining -= giveAmount;
    }

    setHomeForm({
      amount: "",
      given_to_whom: "Mom",
    });

    fetchData();

  };

  const undoLastHomePayment = async () => {
    const last = incomes
      .filter(i => (i.given_to_home || 0) > 0)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

    if (!last) {
      alert("No home payment found");
      return;
    }

    await supabase
      .from("income")
      .update({
        given_to_home: 0,
        given_to_whom: null,
      })
      .eq("id", last.id);

    fetchData();
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-8 animate-fade-in">
        <div className="max-w-6xl mx-auto px-4">

          {/* HEADER */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">
              👋 Welcome, Abdul Jeelani
            </h1>
            <p className="text-slate-500 mt-1">
              Here is your daily income & expense summary
            </p>
          </div>

          {/* SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <Card title="💰 Income" value={totalIncome} color="green" />
            <Card title="💸 Expense" value={totalExpense} color="red" />
            <Card title="🧮 Balance" value={balance} color="blue" />

          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
            <Card title="🏠 Total Given" value={totalGivenToHome} color="blue" />
            <Card title="💼 Remaining" value={remainingAfterHome} color="green" />
            <Card title="👩 Mom Total" value={momTotal} color="red" />
            <Card title="👨 Dad Total" value={dadTotal} color="blue" />
          </div>
          {/* INPUT CARDS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">

            {/* GIVE TO HOME */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 h-full flex flex-col">
              <h2 className="font-semibold mb-4 text-slate-700 text-lg">
                🏠 Give To Home
              </h2>

              <div className="text-sm text-slate-500 mb-3">
                Available Balance: ₹{balance}
              </div>

              <input
                type="number"
                className="input mb-3 bg-slate-100 cursor-not-allowed"
                value={balance > 0 ? balance : 0}
                readOnly
              />

              <select
                className="input mb-4"
                value={homeForm.given_to_whom}
                onChange={(e) =>
                  setHomeForm({ ...homeForm, given_to_whom: e.target.value })
                }
              >
                <option value="Mom">Mom</option>
                <option value="Dad">Dad</option>
              </select>

              <button
                onClick={giveToHome}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg w-full transition"
              >
                Save Home Payment
              </button>

              <button
                onClick={undoLastHomePayment}
                className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg w-full mt-2"
              >
                Undo Last Payment
              </button>
            </div>

            {/* ADD INCOME */}
            <FormBox title="➕ Add Income">
              <Input
                placeholder="Service / Work"
                value={incomeForm.service}
                onChange={(v) =>
                  setIncomeForm({ ...incomeForm, service: v })
                }
              />
              <Input
                type="number"
                placeholder="Amount"
                value={incomeForm.amount}
                onChange={(v) =>
                  setIncomeForm({ ...incomeForm, amount: v })
                }
              />

              <Button onClick={addIncome} color="green">
                Save Income
              </Button>
            </FormBox>

            {/* ADD EXPENSE */}
            <FormBox title="➖ Add Expense">
              <select
                className="input mb-2"
                value={expenseForm.paid_to}
                onChange={(e) => {
                  setExpenseForm({ ...expenseForm, paid_to: e.target.value });
                  if (e.target.value !== "Others") setCustomPaidTo("");
                }}
              >
                <option value="">Select Paid To</option>
                {PAID_TO_OPTIONS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>

              {expenseForm.paid_to === "Others" && (
                <Input
                  placeholder="Custom name"
                  value={customPaidTo}
                  onChange={setCustomPaidTo}
                />
              )}

              <Input
                type="number"
                placeholder="Amount"
                value={expenseForm.amount}
                onChange={(v) =>
                  setExpenseForm({ ...expenseForm, amount: v })
                }
              />

              <Button onClick={addExpense} color="red">
                Save Expense
              </Button>
            </FormBox>

          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 mb-12 border border-slate-200">


            {/* Toggle Buttons */}
            <div className="flex gap-3 mb-6 bg-slate-100 p-2 rounded-xl w-fit">
              <button
                onClick={() => setChartType("daily")}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${chartType === "daily"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-200"
                  }`}
              >
                📅 Daily
              </button>

              <button
                onClick={() => setChartType("weekly")}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${chartType === "weekly"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-200"
                  }`}
              >
                📊 Weekly
              </button>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="Income"
                  fill="#22c55e"
                  radius={[10, 10, 0, 0]}
                  animationDuration={800}
                />
                <Bar
                  dataKey="Expense"
                  fill="#ef4444"
                  radius={[10, 10, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-center">

              {/* Daily */}
              <div>
                <p className="text-sm text-slate-500">Today's Result</p>
                <p
                  className={`text-lg font-semibold ${balance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                >
                  {balance >= 0
                    ? `🔥 Profit: ₹${balance}`
                    : `⚠️ Loss: ₹${Math.abs(balance)}`}
                </p>
              </div>

              {/* Weekly */}
              <div>
                <p className="text-sm text-slate-500">Last 7 Days Result</p>
                <p
                  className={`text-lg font-semibold ${weeklyBalance >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                >
                  {weeklyBalance >= 0
                    ? `📈 Weekly Profit: ₹${weeklyBalance}`
                    : `📉 Weekly Loss: ₹${Math.abs(weeklyBalance)}`}
                </p>
              </div>

            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-2xl shadow-lg p-6 transition">
            <h2 className="font-semibold text-lg mb-4">
              📅 Today's Transactions ({today})
            </h2>

            {loading ? (
              <p className="text-center text-slate-500">Loading...</p>
            ) : incomes.length === 0 && expenses.length === 0 ? (
              <p className="text-center text-slate-500">
                No transactions for today
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-200">
                  <tr>
                    <th className="th">Type</th>
                    <th className="th">Description</th>
                    <th className="th text-right">Amount</th>
                    <th className="th text-right">Home</th>
                    <th className="th text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...incomes
                      .filter(i => i.date === today)
                      .map(i => ({ ...i, type: "Income" })),

                    ...expenses
                      .filter(e => e.date === today)
                      .map(e => ({ ...e, type: "Expense" }))
                  ]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map(row => (
                      <tr
                        key={`${row.type}-${row.id}`}
                        className={`transition ${row.type === "Income" &&
                          (row.given_to_home || 0) < row.amount
                          ? "bg-yellow-50"
                          : "hover:bg-slate-50"
                          }`}
                      >
                        <td className={`td font-medium ${row.type === "Income"
                          ? "text-green-700"
                          : "text-red-700"
                          }`}>
                          {row.type}
                        </td>
                        <td className="td">{row.service || row.paid_to}</td>
                        <td className="td text-right">
                          {editing === `${row.type}-${row.id}` ? (
                            <input
                              type="number"
                              defaultValue={row.amount}
                              autoFocus
                              className="border px-2 w-24 text-right"

                              onBlur={(e) =>
                                updateTransaction(
                                  row.type === "Income" ? "income" : "expense",
                                  row.id,
                                  e.target.value
                                )
                              }
                            />
                          ) : (
                            <span
                              onClick={() => setEditing(`${row.type}-${row.id}`)}
                              className="inline-flex items-center gap-2 cursor-pointer group"
                            >
                              ₹{row.amount}
                              <svg
                                className="w-6 h-6 text-slate-500 group-hover:text-blue-600 group-hover:rotate-12 transition-all"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path d="M15.232 5.232l3.536 3.536M4 20l4-1 10-10-3-3L5 16l-1 4z" />
                              </svg>
                            </span>
                          )}
                        </td>
                        <td className="td text-right">
                          {row.type === "Income"
                            ? `₹${row.given_to_home || 0} (${row.given_to_whom || "-"})`
                            : "-"}
                        </td>
                        <td className="td text-center">
                          <button
                            onClick={() =>
                              deleteTransaction(
                                row.type === "Income" ? "income" : "expense",
                                row.id
                              )
                            }
                            className="group p-1"
                          >
                            <svg
                              className="w-5 h-5 text-slate-500 group-hover:text-red-600 group-hover:scale-125 transition-all"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
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
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-10">
            <h2 className="font-semibold text-lg mb-4">
              🏠 Home Payment History
            </h2>

            <table className="w-full text-sm">
              <thead className="bg-slate-200">
                <tr>
                  <th className="th">Date</th>
                  <th className="th">Service</th>
                  <th className="th text-right">Amount</th>
                  <th className="th">Given To</th>
                </tr>
              </thead>
              <tbody>
                {incomes
                  .filter(i => (i.given_to_home || 0) > 0)
                  .map(i => (
                    <tr key={i.id}>
                      <td className="td">{i.date}</td>
                      <td className="td">{i.service}</td>
                      <td className="td text-right">₹{i.given_to_home}</td>
                      <td className="td">{i.given_to_whom}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

/* ================= UI HELPERS ================= */

const colorMap = {
  green: "border-green-600",
  red: "border-red-600",
  blue: "border-blue-600",
};

const Card = ({ title, value, color }) => {
  const bgMap = {
    green: "from-green-500 to-emerald-600",
    red: "from-red-500 to-rose-600",
    blue: "from-blue-500 to-indigo-600",
  };

  return (
    <div className={`rounded-2xl p-6 text-white shadow-lg bg-gradient-to-r ${bgMap[color]} hover:scale-[1.03] transition-all duration-300`}>
      <p className="text-sm opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-2">₹{value}</p>
    </div>
  );
};

const FormBox = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 h-full flex flex-col">
    <h2 className="font-semibold mb-4">{title}</h2>
    {children}
  </div>
);

const Input = ({ onChange, ...props }) => (
  <input
    {...props}
    className="input mb-2 transition focus:ring-2 focus:ring-blue-500"
    onChange={(e) => onChange(e.target.value)}
  />
);

const Button = ({ children, onClick, color }) => (
  <button
    onClick={onClick}
    className={`btn-${color} mt-3 w-full hover:translate-y-[-1px] transition`}
  >
    {children}
  </button>
);
