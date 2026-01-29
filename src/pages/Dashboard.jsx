import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const today = new Date().toISOString().split("T")[0];

  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [customPaidTo, setCustomPaidTo] = useState("");

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

  const [expenseForm, setExpenseForm] = useState({
    date: today,
    paid_to: "",
    amount: "",
  });

  /* ================= FETCH ================= */
  const fetchData = async () => {
    setLoading(true);

    const { data: incomeData } = await supabase
      .from("income")
      .select("*")
      .eq("date", today)
      .order("id", { ascending: false });

    const { data: expenseData } = await supabase
      .from("expense")
      .select("*")
      .eq("date", today)
      .order("id", { ascending: false });

    setIncomes(incomeData || []);
    setExpenses(expenseData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= ADD ================= */
  const addIncome = async () => {
    if (!incomeForm.service || !incomeForm.amount) return;

    await supabase.from("income").insert([
      { ...incomeForm, amount: Number(incomeForm.amount) },
    ]);

    setIncomeForm({ date: today, service: "", amount: "" });
    fetchData();
  };
  

  const addExpense = async () => {
    let paidTo =
      expenseForm.paid_to === "Others" ? customPaidTo : expenseForm.paid_to;

    if (!paidTo || !expenseForm.amount) return;

    await supabase.from("expense").insert([
      { date: today, paid_to: paidTo, amount: Number(expenseForm.amount) },
    ]);

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

  /* ================= CALC ================= */
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <Card title="💰 Income" value={totalIncome} color="green" />
            <Card title="💸 Expense" value={totalExpense} color="red" />
            <Card title="🧮 Balance" value={balance} color="blue" />
          </div>

          {/* FORMS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
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
                    <th className="th text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...incomes.map(i => ({ ...i, type: "Income" })),
                    ...expenses.map(e => ({ ...e, type: "Expense" }))].map(row => (
                    <tr
                      key={`${row.type}-${row.id}`}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className={`td font-medium ${
                        row.type === "Income"
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

const Card = ({ title, value, color }) => (
  <div className={`bg-white rounded-xl shadow p-6 border-l-4 ${colorMap[color]} hover:scale-[1.02] transition`}>
    <p className="text-sm text-slate-500">{title}</p>
    <p className="text-3xl font-bold mt-1">₹{value}</p>
  </div>
);

const FormBox = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition">
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
