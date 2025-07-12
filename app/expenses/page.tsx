'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { Navigation } from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Expense } from '@/types/database'
import { PlusCircle, Search, Filter, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { DialogClose } from '@/components/ui/dialog'
import { formatINR } from '@/lib/utils'

const EXPENSE_CATEGORIES = [
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

export default function ExpensesPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [editForm, setEditForm] = useState({
    amount: '',
    category: '',
    description: '',
    date: ''
  })
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadExpenses()
    }
  }, [user])

  useEffect(() => {
    // Filter expenses based on search term and category
    let filtered = expenses

    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter)
    }

    setFilteredExpenses(filtered)
  }, [expenses, searchTerm, categoryFilter])

  const loadExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })

      if (error) {
        console.error('Error loading expenses:', error)
      } else {
        setExpenses(data || [])
      }
    } catch (error) {
      console.error('Error loading expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(expenses.map(expense => expense.category)))

  // Calculate total spending
  const totalSpending = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

  const getCategoryColor = (category: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
    ]
    const index = category.length % colors.length
    return colors[index]
  }

  const handleDelete = async (id: string) => {
    setDeleteLoadingId(id)
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (!error) {
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    }
    setDeleteLoadingId(null)
  }

  const openEdit = (expense: Expense) => {
    setEditExpense(expense)
    setEditForm({
      amount: String(expense.amount),
      category: expense.category,
      description: expense.description || '',
      date: expense.date
    })
  }

  const handleEditChange = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError(null)
    setEditSuccess(null)
    if (!editExpense) return
    setEditLoading(true)
    const { data, error } = await supabase
      .from('expenses')
      .update({
        amount: parseFloat(editForm.amount),
        category: editForm.category,
        description: editForm.description,
        date: editForm.date,
      })
      .eq('id', editExpense.id)
      .select()
      .single()
    if (error) {
      setEditError(error.message || 'Failed to update expense.')
    } else if (data) {
      setExpenses((prev) => prev.map((e) => e.id === editExpense.id ? data : e))
      setEditSuccess('Expense updated!')
      setTimeout(() => {
        setEditExpense(null)
        setEditSuccess(null)
      }, 800)
    }
    setEditLoading(false)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Expenses</h1>
              <p className="text-gray-600">Track and manage your expense history.</p>
            </div>
            <Button asChild>
              <Link href="/expenses/new">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Expense
              </Link>
            </Button>
          </div>

          {/* Summary Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Expense Summary</CardTitle>
              <CardDescription>
                Overview of your filtered expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold">{formatINR(totalSpending)}</div>
                  <div className="text-sm text-muted-foreground">Total Amount</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{filteredExpenses.length}</div>
                  <div className="text-sm text-muted-foreground">Total Expenses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {filteredExpenses.length > 0 ? formatINR(totalSpending / filteredExpenses.length) : formatINR(0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Average Amount</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search expenses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses List */}
          <Card>
            <CardHeader>
              <CardTitle>Expense History</CardTitle>
              <CardDescription>
                {filteredExpenses.length} of {expenses.length} expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading expenses...</div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No expenses found.</p>
                  {expenses.length === 0 ? (
                    <Button asChild className="mt-4">
                      <Link href="/expenses/new">Add Your First Expense</Link>
                    </Button>
                  ) : (
                    <p className="mt-2">Try adjusting your search or filter criteria.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getCategoryColor(expense.category)}>
                            {expense.category}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {new Date(expense.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="font-medium">
                          {expense.description || 'No description'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-bold mr-4">
                          {formatINR(Number(expense.amount))}
                        </div>
                        <Button size="icon" variant="outline" onClick={() => openEdit(expense)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => handleDelete(expense.id)} disabled={deleteLoadingId === expense.id} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Expense Dialog */}
          <Dialog open={!!editExpense} onOpenChange={(open) => { if (!open) setEditExpense(null) }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Expense</DialogTitle>
                <DialogDescription>Update the details of your expense below.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                {editError && <div className="text-red-600 text-sm">{editError}</div>}
                {editSuccess && <div className="text-green-600 text-sm">{editSuccess}</div>}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="edit-amount">Amount *</label>
                    <Input id="edit-amount" type="number" step="0.01" min="0" value={editForm.amount} onChange={e => handleEditChange('amount', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-date">Date *</label>
                    <Input id="edit-date" type="date" value={editForm.date} onChange={e => handleEditChange('date', e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-category">Category *</label>
                  <Select value={editForm.category} onValueChange={value => handleEditChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-description">Description</label>
                  <Textarea id="edit-description" value={editForm.description} onChange={e => handleEditChange('description', e.target.value)} rows={3} />
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
        </main>
      </div>
    </AuthGuard>
  )
}