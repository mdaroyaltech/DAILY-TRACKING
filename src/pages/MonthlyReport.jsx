import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";



export default function MonthlyReport() {
  const [month, setMonth] = useState("");
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prevIncome, setPrevIncome] = useState(0);
  const [prevExpense, setPrevExpense] = useState(0);


  /* ================= FETCH DATA ================= */
  const fetchData = async () => {
    if (!month) return;

    setLoading(true);

    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);

    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];


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
    // ===== Previous Month Calculation =====
    const prevStartDate = new Date(startDate);
    prevStartDate.setMonth(prevStartDate.getMonth() - 1);
    prevStartDate.setDate(1);

    const prevEndDate = new Date(prevStartDate);
    prevEndDate.setMonth(prevEndDate.getMonth() + 1);
    prevEndDate.setDate(0);

    const prevStart = prevStartDate.toISOString().split("T")[0];
    const prevEnd = prevEndDate.toISOString().split("T")[0];

    const { data: prevIncomeData } = await supabase
      .from("income")
      .select("*")
      .gte("date", prevStart)
      .lte("date", prevEnd);

    const { data: prevExpenseData } = await supabase
      .from("expense")
      .select("*")
      .gte("date", prevStart)
      .lte("date", prevEnd);

    const prevIncomeTotal = (prevIncomeData || []).reduce((s, i) => s + i.amount, 0);
    const prevExpenseTotal = (prevExpenseData || []).reduce((s, e) => s + e.amount, 0);

    setPrevIncome(prevIncomeTotal);
    setPrevExpense(prevExpenseTotal);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [month]);


  /* ================= CALCULATIONS ================= */
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const totalGivenToHome = incomes.reduce(
    (sum, i) => sum + (Number(i?.given_to_home) || 0),
    0
  );


  const remainingAfterHome = totalIncome - totalGivenToHome;

  const momTotal = incomes
    .filter(i => i?.given_to_whom === "Mom")
    .reduce((sum, i) => sum + (i.given_to_home || 0), 0);

  const dadTotal = incomes
    .filter(i => i.given_to_whom === "Dad")
    .reduce((sum, i) => sum + (i.given_to_home || 0), 0);

  const prevBalance = prevIncome - prevExpense;

  const incomeChange =
    prevIncome === 0
      ? 100
      : ((totalIncome - prevIncome) / prevIncome) * 100;

  const expenseChange =
    prevExpense === 0
      ? 100
      : ((totalExpense - prevExpense) / prevExpense) * 100;

  const balanceChange =
    prevBalance === 0
      ? 100
      : ((balance - prevBalance) / prevBalance) * 100;


  // Daily Net Trend
  // Daily Net Trend (Income + Expense combined dates)
  const allDates = [
    ...new Set([
      ...incomes.map(i => i.date),
      ...expenses.map(e => e.date),
    ]),
  ];

  const trendData = useMemo(() => {
    return allDates
      .sort((a, b) => new Date(a) - new Date(b))
      .map(date => {
        const dailyIncome = incomes
          .filter(i => i.date === date)
          .reduce((s, i) => s + i.amount, 0);

        const dailyExpense = expenses
          .filter(e => e.date === date)
          .reduce((s, e) => s + e.amount, 0);

        return {
          date: date.slice(8),
          Net: dailyIncome - dailyExpense,
        };
      });
  }, [incomes, expenses]);

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

            <select
              className="px-4 py-2 rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="">Select Month</option>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = date.toISOString().slice(0, 7);
                return (
                  <option key={value} value={value}>
                    {date.toLocaleString("default", { month: "long", year: "numeric" })}
                  </option>
                );
              })}
            </select>

          </div>

          {/* SUMMARY */}
          {hasData && (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 mb-8">
              <SummaryCard
                title="Total Income"
                value={totalIncome}
                color="green"
                percent={incomeChange}
              />
              <SummaryCard
                title="Total Expense"
                value={totalExpense}
                color="red"
                percent={expenseChange}
              />
              <SummaryCard
                title="Balance"
                value={balance}
                color="blue"
                percent={balanceChange}
              />
              <SummaryCard
                title="Given To Home"
                value={totalGivenToHome}
                color="blue"
                percent={0}
              />
              <SummaryCard
                title="Remaining After Home"
                value={remainingAfterHome}
                color="green"
                percent={0}
              />
            </div>
          )}

          {incomes.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-6 mb-8">
              <h2 className="font-semibold mb-4 text-green-700">
                💰 Income Transactions ({month})
              </h2>

              <table className="w-full text-sm">
                <thead className="bg-green-50">
                  <tr>
                    <th className="th">Date</th>
                    <th className="th">Service</th>
                    <th className="th text-right">Amount</th>
                    <th className="th text-right">Home</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map(row => (
                    <tr key={row.id}>
                      <td className="td">{row.date}</td>
                      <td className="td">{row.service}</td>
                      <td className="td text-right">₹{row.amount}</td>
                      <td className="td text-right">
                        ₹{Number(row?.given_to_home) || 0} ({row?.given_to_whom || "-"})
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 text-right font-semibold text-green-700">
                Total Income: ₹{totalIncome}
              </div>
            </div>
          )}

          {expenses.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-6 mb-8">
              <h2 className="font-semibold mb-4 text-red-700">
                💸 Expense Transactions ({month})
              </h2>

              <table className="w-full text-sm">
                <thead className="bg-red-50">
                  <tr>
                    <th className="th">Date</th>
                    <th className="th">Paid To</th>
                    <th className="th text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(row => (
                    <tr key={row.id}>
                      <td className="td">{row.date}</td>
                      <td className="td">{row.paid_to}</td>
                      <td className="td text-right">₹{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 text-right font-semibold text-red-700">
                Total Expense: ₹{totalExpense}
              </div>
            </div>
          )}


          {trendData.length > 0 && (
            <div className="bg-white rounded-2xl shadow p-6 mb-8">
              <h2 className="font-semibold mb-4">
                📈 Monthly Trend (Net Profit / Loss)
              </h2>

              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const value = payload[0].value;

                        return (
                          <div className="bg-white p-3 rounded-lg shadow border text-sm">
                            <p>Net: ₹{value}</p>
                            <p className="text-slate-500">
                              Compared to prev month: ₹{prevIncome - prevExpense}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="Net"
                    stroke={balance >= 0 ? "#16a34a" : "#dc2626"}
                    fill={balance >= 0 ? "#86efac" : "#fca5a5"}
                    strokeWidth={3}
                  />

                </AreaChart>
              </ResponsiveContainer>
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

const useAnimatedNumber = (value, duration = 800) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16);

    const counter = setInterval(() => {
      start += increment;
      if (
        (value >= 0 && start >= value) ||
        (value < 0 && start <= value)
      ) {
        start = value;
        clearInterval(counter);
      }
      setAnimatedValue(start);
    }, 16);

    return () => clearInterval(counter);
  }, [value, duration]);

  return animatedValue;
};

const SummaryCard = ({ title, value, color, percent = 0 }) => {
  const map = {
    green: "from-green-500 to-green-700",
    red: "from-red-500 to-red-700",
    blue: "from-blue-500 to-blue-700",
  };

  const animatedPercent = useAnimatedNumber(percent || 0);
  const isPositive = percent >= 0;

  return (
    <div className={`rounded-2xl p-6 text-white shadow-lg bg-gradient-to-r ${map[color]}`}>
      <p className="text-sm opacity-90">{title}</p>
      <p className="text-3xl font-bold">₹{value}</p>

      <p className={`text-sm mt-2 ${isPositive ? "text-green-200" : "text-red-200"}`}>
        {isPositive ? "▲" : "▼"} {Math.abs(animatedPercent).toFixed(1)}% vs last month
      </p>
    </div>
  );
};

