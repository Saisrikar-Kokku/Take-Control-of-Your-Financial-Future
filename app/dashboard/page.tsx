'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { Navigation } from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Expense, Budget } from '@/types/database'
import { DollarSign, TrendingUp, Target, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatINR, computeMood, stabilizeMood } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [autoMood, setAutoMood] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('auto_mood')
      if (saved === null) return false
      return saved === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      // Load recent expenses (last 10)
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .limit(10)

      // Load budgets
      const { data: budgetsData } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user!.id)

      setExpenses(expensesData || [])
      setBudgets(budgetsData || [])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate total spending this month
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlySpending = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })
    .reduce((sum, expense) => sum + Number(expense.amount), 0)

  // Calculate total budget
  const totalBudget = budgets
    .filter(budget => budget.period === 'monthly')
    .reduce((sum, budget) => sum + Number(budget.amount), 0)

  const budgetRemaining = totalBudget - monthlySpending

  // Calculate total spending for each period
  const now = new Date();

  // Helper: get start of week (Monday)
  function getStartOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  // Helper: is date in current week
  function isThisWeek(dateStr: string) {
    const date = new Date(dateStr);
    const startOfWeek = getStartOfWeek(now);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return date >= startOfWeek && date <= endOfWeek;
  }

  // Helper: is date in current year
  function isThisYear(dateStr: string) {
    const date = new Date(dateStr);
    return date.getFullYear() === now.getFullYear();
  }

  // Calculate spending for each period
  const weeklySpending = expenses
    .filter(expense => isThisWeek(expense.date))
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  const yearlySpending = expenses
    .filter(expense => isThisYear(expense.date))
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  // Budgets for each period
  const weeklyBudget = budgets.find(b => b.period === 'weekly')?.amount || 0;
  const monthlyBudget = budgets.find(b => b.period === 'monthly')?.amount || 0;
  const yearlyBudget = budgets.find(b => b.period === 'yearly')?.amount || 0;

  // Remaining for each period
  const weeklyRemaining = Number(weeklyBudget) - weeklySpending;
  const monthlyRemaining = Number(monthlyBudget) - monthlySpending;
  const yearlyRemaining = Number(yearlyBudget) - yearlySpending;

  // Calculate spent per budget (period + category)
  function getPeriodFilter(period: string) {
    const now = new Date();
    if (period === 'weekly') {
      const startOfWeek = getStartOfWeek(now);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return (dateStr: string) => {
        const date = new Date(dateStr);
        return date >= startOfWeek && date <= endOfWeek;
      };
    } else if (period === 'monthly') {
      const month = now.getMonth();
      const year = now.getFullYear();
      return (dateStr: string) => {
        const date = new Date(dateStr);
        return date.getMonth() === month && date.getFullYear() === year;
      };
    } else if (period === 'yearly') {
      const year = now.getFullYear();
      return (dateStr: string) => {
        const date = new Date(dateStr);
        return date.getFullYear() === year;
      };
    }
    return () => false;
  }

  // For each budget, calculate spent and left
  const budgetsWithStats = budgets.map(budget => {
    const periodFilter = getPeriodFilter(budget.period);
    const spent = expenses
      .filter(exp => exp.category === budget.category && periodFilter(exp.date))
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
    const left = Number(budget.amount) - spent;
    return { ...budget, spent, left };
  });

  // Compute mood based on monthly progress: <80% OK, 80-100% Watch, >100% Overspend
  const { mood: rawMood, progress: monthlyProgress, reason: moodReason } = computeMood({ spent: monthlySpending, budget: totalBudget })
  const [stableMood, setStableMood] = useState<'ok' | 'watch' | 'overspend'>(rawMood)
  useEffect(() => {
    setStableMood(prev => stabilizeMood(prev, rawMood, monthlyProgress))
  }, [rawMood, monthlyProgress])

  // Load Auto Mood preference and subscribe to changes
  useEffect(() => {
    const onChange = (e: Event) => {
      try {
        const v = (e as CustomEvent).detail?.value
        if (typeof v === 'boolean') setAutoMood(v)
      } catch {}
    }
    window.addEventListener('auto-mood-changed', onChange)
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === 'auto_mood' && ev.newValue !== null) setAutoMood(ev.newValue === 'true')
    }
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('auto-mood-changed', onChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Apply mood to html data attribute if enabled and broadcast changes
  useEffect(() => {
    const root = document.documentElement
    if (autoMood) {
      root.setAttribute('data-mood', stableMood)
      try { localStorage.setItem('current_mood', stableMood) } catch {}
    } else {
      root.removeAttribute('data-mood')
      try { localStorage.removeItem('current_mood') } catch {}
    }
    // notify other tabs/components to re-apply
    try { window.dispatchEvent(new CustomEvent('auto-mood-changed')) } catch {}
  }, [autoMood, stableMood])


  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here&apos;s your financial overview.</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 bg-card text-sm">
              <span className="font-medium">Mood:</span>
              <span className="capitalize">{stableMood}</span>
              <span className="text-muted-foreground">• {Math.round((monthlyProgress || 0) * 100)}% of monthly budget</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Weekly Budget Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weekly Budget</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatINR(weeklyBudget)}</div>
                <p className="text-xs text-muted-foreground">Budget for this week</p>
                <div className={`mt-2 text-lg font-semibold ${weeklyRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>Left: {formatINR(weeklyRemaining)}</div>
              </CardContent>
            </Card>

            

            {/* Monthly Budget Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatINR(monthlyBudget)}</div>
                <p className="text-xs text-muted-foreground">Budget for this month</p>
                <div className={`mt-2 text-lg font-semibold ${monthlyRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>Left: {formatINR(monthlyRemaining)}</div>
              </CardContent>
            </Card>

            {/* Yearly Budget Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Yearly Budget</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatINR(yearlyBudget)}</div>
                <p className="text-xs text-muted-foreground">Budget for this year</p>
                <div className={`mt-2 text-lg font-semibold ${yearlyRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>Left: {formatINR(yearlyRemaining)}</div>
              </CardContent>
            </Card>

            {/* This Month's Spending Card (keep as is) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month&apos;s Spending</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatINR(monthlySpending)}</div>
                <p className="text-xs text-muted-foreground">+2.5% from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Button asChild>
              <Link href="/expenses/new">Add New Expense</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/expenses">View All Expenses</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/budget">Manage Budgets</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/ai-insights">AI Insights</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/expenses/scan">Scan Receipt</Link>
            </Button>
          </div>

          {/* Recent Expenses */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>
                Your latest expense entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No expenses recorded yet.</p>
                  <Button asChild className="mt-4">
                    <Link href="/expenses/new">Add Your First Expense</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{expense.category}</div>
                        <div className="text-sm text-muted-foreground">
                          {expense.description || 'No description'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-lg font-semibold">
                        {formatINR(Number(expense.amount))}
                      </div>
                    </div>
                  ))}
                  {expenses.length > 5 && (
                    <div className="text-center pt-4">
                      <Button asChild variant="outline">
                        <Link href="/expenses">View All Expenses</Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budgets by Period & Category */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {budgetsWithStats.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Budgets Found</CardTitle>
                  <CardDescription>Add a budget to get started!</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              budgetsWithStats.map((budget) => (
                <Card key={budget.id}>
                  <CardHeader className="flex flex-col gap-1 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">
                        {budget.category}
                      </CardTitle>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                        {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}
                      </span>
                    </div>
                    <CardDescription>
                      Budget for this {budget.period}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-1">
                      <div className="text-sm">Budget: <span className="font-bold">{formatINR(budget.amount)}</span></div>
                      <div className="text-sm">Spent: <span className="font-bold">{formatINR(budget.spent)}</span></div>
                      <div className={`text-sm font-bold ${budget.left >= 0 ? 'text-green-600' : 'text-red-600'}`}>Left: {formatINR(budget.left)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}