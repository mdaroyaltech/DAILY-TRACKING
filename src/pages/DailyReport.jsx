import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

export default function DailyReport() {
  const [date, setDate] = useState("");
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const [incomeForm, setIncomeForm] = useState({ service: "", amount: "" });
  const [expenseForm, setExpenseForm] = useState({ paid_to: "", amount: "" });

  /* ================= FETCH DATA ================= */
  const fetchData = async () => {
    if (!date) return;
    setLoading(true);

    const { data: incomeData } = await supabase
      .from("income")
      .select("*")
      .eq("date", date)
      .order("id", { ascending: false });

    const { data: expenseData } = await supabase
      .from("expense")
      .select("*")
      .eq("date", date)
      .order("id", { ascending: false });

    setIncomes(incomeData || []);
    setExpenses(expenseData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [date]);

  /* ================= ADD ================= */
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

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const hasData = incomes.length > 0 || expenses.length > 0;

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 py-8">
        <div className="max-w-5xl mx-auto px-4">

          {/* HEADER CARD */}
          <div className="bg-white rounded-2xl shadow p-6 mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">📅 Daily Report</h1>
              <p className="text-slate-500 text-sm">Select date & manage entries</p>
            </div>
            <input
              type="date"
              className="input max-w-xs"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* FORMS */}
          {date && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <FormBox title="➕ Add Income">
                <Input placeholder="Service / Work" value={incomeForm.service}
                  onChange={(v) => setIncomeForm({ ...incomeForm, service: v })} />
                <Input type="number" placeholder="Amount" value={incomeForm.amount}
                  onChange={(v) => setIncomeForm({ ...incomeForm, amount: v })} />
                <Button color="green" onClick={addIncome}>Save Income</Button>
              </FormBox>

              <FormBox title="➖ Add Expense">
                <select className="input" value={expenseForm.paid_to}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paid_to: e.target.value })}>
                  <option value="">Select Paid To</option>
                  {PAID_TO_OPTIONS.map(p => <option key={p}>{p}</option>)}
                </select>

                {expenseForm.paid_to === "Others" && (
                  <Input placeholder="Custom name" value={customPaidTo} onChange={setCustomPaidTo} />
                )}

                <Input type="number" placeholder="Amount" value={expenseForm.amount}
                  onChange={(v) => setExpenseForm({ ...expenseForm, amount: v })} />
                <Button color="red" onClick={addExpense}>Save Expense</Button>
              </FormBox>
            </div>
          )}

          {/* SUMMARY */}
          {hasData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <SummaryCard title="Income" value={totalIncome} color="green" />
              <SummaryCard title="Expense" value={totalExpense} color="red" />
              <SummaryCard title="Balance" value={balance} color="blue" />
            </div>
          )}

          {/* TABLE */}
          {hasData && (
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-semibold mb-4">Transactions</h2>
              {loading ? (
                <p className="text-center text-gray-500">Loading...</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="th">Type</th>
                      <th className="th">Description</th>
                      <th className="th text-right">Amount</th>
                      <th className="th text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...incomes.map(i => ({ ...i, t: "income" })),
                      ...expenses.map(e => ({ ...e, t: "expense" }))].map(row => (
                      <tr key={`${row.t}-${row.id}`} className="hover:bg-slate-50">
                        <td className={`td font-medium ${row.t === "income" ? "text-green-600" : "text-red-600"}`}>
                          {row.t === "income" ? "Income" : "Expense"}
                        </td>
                        <td className="td">{row.service || row.paid_to}</td>
                        <td className="td text-right">
                          {editing === `${row.t}-${row.id}` ? (
                            <input type="number" defaultValue={row.amount}
                              className="border px-2 w-24 text-right"
                              onBlur={(e) => updateAmount(row.t, row.id, e.target.value)} />
                          ) : (
                            <span onClick={() => setEditing(`${row.t}-${row.id}`)} className="cursor-pointer">
                              ₹{row.amount} ✏️
                            </span>
                          )}
                        </td>
                        <td className="td text-center">
                          <button onClick={() => deleteRow(row.t, row.id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

/* ================= UI HELPERS ================= */

const SummaryCard = ({ title, value, color }) => {
  const map = {
    green: "from-green-500 to-green-700",
    red: "from-red-500 to-red-700",
    blue: "from-blue-500 to-blue-700",
  };
  return (
    <div className={`rounded-2xl p-6 text-white shadow-lg bg-gradient-to-r ${map[color]}`}>
      <p className="text-sm opacity-90">{title}</p>
      <p className="text-3xl font-bold">₹{value}</p>
    </div>
  );
};

const FormBox = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow p-6">
    <h2 className="font-semibold mb-4">{title}</h2>
    {children}
  </div>
);

const Input = ({ onChange, ...props }) => (
  <input {...props} className="input mb-2" onChange={(e) => onChange(e.target.value)} />
);

const Button = ({ children, onClick, color }) => (
  <button onClick={onClick} className={`btn-${color} mt-2 w-full`}>
    {children}
  </button>
);
