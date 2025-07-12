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
import { formatINR } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here&apos;s your financial overview.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month&apos;s Spending</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatINR(monthlySpending)}</div>
                <p className="text-xs text-muted-foreground">
                  +2.5% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatINR(totalBudget)}</div>
                <p className="text-xs text-muted-foreground">
                  {budgets.length} active budgets
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Remaining</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatINR(budgetRemaining)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {budgetRemaining >= 0 ? 'Under budget' : 'Over budget'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expenses.length}</div>
                <p className="text-xs text-muted-foreground">
                  All time expenses
                </p>
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
        </main>
      </div>
    </AuthGuard>
  )
}