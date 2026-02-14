import { useMemo } from "react";

export const useFinanceSummary = (incomes, expenses, today) => {
    return useMemo(() => {
        // Daily
        const totalIncome = incomes
            .filter(i => i.date === today)
            .reduce((s, i) => s + i.amount, 0);

        const totalExpense = expenses
            .filter(e => e.date === today)
            .reduce((s, e) => s + e.amount, 0);

        const balance = totalIncome - totalExpense;

        // Weekly
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const startDate = sevenDaysAgo.toISOString().split("T")[0];

        const weeklyIncome = incomes
            .filter(i => i.date >= startDate && i.date <= today)
            .reduce((s, i) => s + i.amount, 0);

        const weeklyExpense = expenses
            .filter(e => e.date >= startDate && e.date <= today)
            .reduce((s, e) => s + e.amount, 0);

        const weeklyBalance = weeklyIncome - weeklyExpense;

        return {
            totalIncome,
            totalExpense,
            balance,
            weeklyIncome,
            weeklyExpense,
            weeklyBalance,
        };
    }, [incomes, expenses, today]);
};
