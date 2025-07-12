'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { Navigation } from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Budget, Expense } from '@/types/database'
import { Target, TrendingUp, AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { formatINR } from '@/lib/utils'

const BUDGET_PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
]

const BUDGET_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Groceries',
  'Other'
]

export default function BudgetPage() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state for new budget
  const [newBudget, setNewBudget] = useState({
    amount: '',
    category: '',
    period: 'monthly'
  })

  const [editBudget, setEditBudget] = useState<Budget | null>(null)
  const [editForm, setEditForm] = useState({
    amount: '',
    category: '',
    period: 'monthly'
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState<string | null>(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      // Load budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      // Load expenses for progress calculation
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user!.id)

      if (budgetsError) throw budgetsError
      if (expensesError) throw expensesError

      setBudgets(budgetsData || [])
      setExpenses(expensesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load budget data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate form
    if (!newBudget.amount || !newBudget.category || !newBudget.period) {
      setError('Please fill in all fields')
      return
    }

    const amount = parseFloat(newBudget.amount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than 0')
      return
    }

    try {
      const { error: insertError } = await supabase
        .from('budgets')
        .insert([
          {
            user_id: user!.id,
            amount: amount,
            category: newBudget.category,
            period: newBudget.period
          }
        ])

      if (insertError) {
        setError(insertError.message)
      } else {
        setSuccess('Budget created successfully!')
        setNewBudget({ amount: '', category: '', period: 'monthly' })
        loadData() // Reload data
      }
    } catch (err) {
      setError('An unexpected error occurred')
    }
  }

  const calculateBudgetProgress = (budget: Budget) => {
    const now = new Date()
    let startDate: Date
    let endDate: Date

    // Calculate date range based on period
    switch (budget.period) {
      case 'weekly':
        const dayOfWeek = now.getDay()
        startDate = new Date(now)
        startDate.setDate(now.getDate() - dayOfWeek)
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        break
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        break
      default:
        return { spent: 0, percentage: 0, remaining: Number(budget.amount) }
    }

    // Calculate spending in the period
    const spent = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date)
        return expenseDate >= startDate && expenseDate <= endDate
      })
      .reduce((sum, expense) => sum + Number(expense.amount), 0)

    const budgetAmount = Number(budget.amount)
    const percentage = Math.min((spent / budgetAmount) * 100, 100)
    const remaining = budgetAmount - spent

    return { spent, percentage, remaining }
  }

  const handleDeleteBudget = async (id: string) => {
    setDeleteLoadingId(id)
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (!error) {
      setBudgets((prev) => prev.filter((b) => b.id !== id))
    }
    setDeleteLoadingId(null)
  }

  const openEditBudget = (budget: Budget) => {
    setEditBudget(budget)
    setEditForm({
      amount: String(budget.amount),
      category: budget.category || '',
      period: budget.period
    })
  }

  const handleEditBudgetChange = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError(null)
    setEditSuccess(null)
    if (!editBudget) return
    setEditLoading(true)
    const { data, error } = await supabase
      .from('budgets')
      .update({
        amount: parseFloat(editForm.amount),
        category: editForm.category,
        period: editForm.period
      })
      .eq('id', editBudget.id)
      .select()
      .single()
    if (error) {
      setEditError(error.message || 'Failed to update budget.')
    } else if (data) {
      setBudgets((prev) => prev.map((b) => b.id === editBudget.id ? data : b))
      setEditSuccess('Budget updated!')
      setTimeout(() => {
        setEditBudget(null)
        setEditSuccess(null)
      }, 800)
    }
    setEditLoading(false)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Budget Planner</h1>
            <p className="text-gray-600">Set and track your spending budgets.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Create Budget Form */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Create New Budget</CardTitle>
                <CardDescription>
                  Set a spending limit for a specific period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="amount">Budget Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={newBudget.amount}
                      onChange={(e) => setNewBudget(prev => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={newBudget.category} 
                      onValueChange={(value) => setNewBudget(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUDGET_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="period">Period</Label>
                    <Select 
                      value={newBudget.period} 
                      onValueChange={(value) => setNewBudget(prev => ({ ...prev, period: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUDGET_PERIODS.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full">
                    Create Budget
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Active Budgets */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Active Budgets</CardTitle>
                  <CardDescription>
                    Track your progress against your budgets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading budgets...</div>
                  ) : budgets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No budgets created yet.</p>
                      <p className="text-sm mt-2">Create your first budget to start tracking your spending limits.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {budgets.map((budget) => {
                        const progress = calculateBudgetProgress(budget)
                        const isOverBudget = progress.spent > Number(budget.amount)
                        
                        return (
                          <div key={budget.id} className="border rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-lg capitalize">
                                  {budget.period} Budget
                                </h3>
                                <p className="text-sm text-muted-foreground">{formatINR(Number(budget.amount))} budget</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="icon" variant="outline" onClick={() => openEditBudget(budget)} title="Edit">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="destructive" onClick={() => handleDeleteBudget(budget.id)} disabled={deleteLoadingId === budget.id} title="Delete">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className={`text-lg font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>{formatINR(progress.spent)} spent</div>
                              <div className="text-sm text-muted-foreground">{formatINR(Math.abs(progress.remaining))} {progress.remaining >= 0 ? 'remaining' : 'over'}</div>
                            </div>

                            <div className="space-y-2 mt-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{progress.percentage.toFixed(1)}%</span>
                              </div>
                              <Progress 
                                value={progress.percentage} 
                                className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : ''}`}
                              />
                            </div>

                            {isOverBudget && (
                              <div className="mt-4 flex items-center gap-2 text-red-600 text-sm">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Budget exceeded!</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Budget Dialog */}
      <Dialog open={!!editBudget} onOpenChange={(open) => { if (!open) setEditBudget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
            <DialogDescription>Update the details of your budget below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditBudgetSubmit} className="space-y-4">
            {editError && <div className="text-red-600 text-sm">{editError}</div>}
            {editSuccess && <div className="text-green-600 text-sm">{editSuccess}</div>}
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Budget Amount</Label>
              <Input id="edit-amount" type="number" step="0.01" min="0" value={editForm.amount} onChange={e => handleEditBudgetChange('amount', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={editForm.category} onValueChange={value => handleEditBudgetChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-period">Period</Label>
              <Select value={editForm.period} onValueChange={value => handleEditBudgetChange('period', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_PERIODS.map((period) => (
                    <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  )
}