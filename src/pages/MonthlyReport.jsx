import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

export default function MonthlyReport() {
  const [month, setMonth] = useState("");
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH DATA ================= */
  const fetchData = async () => {
    if (!month) return;

    setLoading(true);

    const start = `${month}-01`;
    const end = `${month}-31`;

    const { data: incomeData } = await supabase
      .from("income")
      .select("*")
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true });

    const { data: expenseData } = await supabase
      .from("expense")
      .select("*")
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true });

    setIncomes(incomeData || []);
    setExpenses(expenseData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [month]);

  /* ================= CALCULATIONS ================= */
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
              <h1 className="text-2xl font-bold text-slate-800">
                📊 Monthly Report
              </h1>
              <p className="text-slate-500 text-sm">
                View income & expense month-wise
              </p>
            </div>

            <input
              type="month"
              className="input max-w-xs"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>

          {/* SUMMARY */}
          {hasData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <SummaryCard title="Total Income" value={totalIncome} color="green" />
              <SummaryCard title="Total Expense" value={totalExpense} color="red" />
              <SummaryCard title="Balance" value={balance} color="blue" />
            </div>
          )}

          {/* TABLE */}
          {hasData && (
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-semibold mb-4">
                Transactions ({month})
              </h2>

              {loading ? (
                <p className="text-center text-slate-500">Loading...</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="th">Date</th>
                      <th className="th">Type</th>
                      <th className="th">Description</th>
                      <th className="th text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...incomes.map(i => ({ ...i, type: "Income" })),
                      ...expenses.map(e => ({ ...e, type: "Expense" }))].map(row => (
                      <tr key={`${row.type}-${row.id}`} className="hover:bg-slate-50">
                        <td className="td">{row.date}</td>
                        <td className={`td font-medium ${
                          row.type === "Income" ? "text-green-600" : "text-red-600"
                        }`}>
                          {row.type}
                        </td>
                        <td className="td">{row.service || row.paid_to}</td>
                        <td className="td text-right">₹{row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* EMPTY STATE */}
          {!hasData && month && !loading && (
            <div className="bg-white rounded-xl shadow p-6 text-center text-slate-500">
              No transactions found for this month
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
