import { localDate } from "./format";
import type { Bill, Expense, ExpenseCategory } from "./types";
import { EXPENSE_CATEGORIES } from "./types";

type Bounds = [string, string];

const within = (day: string, [lo, hi]: Bounds) => day >= lo && day <= hi;

/** Income = paid bills, counted on the day they were paid (older bills without a paid date use their bill date). */
export const incomeBills = (bills: Bill[], range: Bounds) => bills.filter((b) => b.status === "paid" && within(localDate(b.paidAt ?? b.createdAt), range));

export const expensesIn = (expenses: Expense[], range: Bounds) => expenses.filter((e) => within(e.date, range));

export function cashFlow(bills: Bill[], expenses: Expense[], range: Bounds) {
  const inc = incomeBills(bills, range);
  const exp = expensesIn(expenses, range);
  const income = inc.reduce((s, b) => s + b.total, 0);
  const spent = exp.reduce((s, e) => s + e.amount, 0);
  const byCategory = EXPENSE_CATEGORIES.map((category) => ({
    category: category as ExpenseCategory,
    total: exp.filter((e) => e.category === category).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0);
  return { income, spent, net: income - spent, incomeCount: inc.length, expenseCount: exp.length, byCategory, expenses: exp };
}
