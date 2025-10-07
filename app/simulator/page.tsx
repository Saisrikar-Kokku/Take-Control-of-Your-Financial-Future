'use client'

import { AuthGuard } from '@/components/AuthGuard'
import { Navigation } from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Expense, Budget, Category } from '@/types/database'
import { formatINR } from '@/lib/utils'

export default function SimulatorPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [dbCategories, setDbCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [category, setCategory] = useState<string>('Food & Dining')
  const [reduceAmount, setReduceAmount] = useState<string>('0')
  const [goalAmount, setGoalAmount] = useState<string>('0')
  const [deadlineMonths, setDeadlineMonths] = useState<string>('')
  const [suggestedCuts, setSuggestedCuts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        // Compute previous month date range in Asia/Kolkata (IST) timezone (inclusive)
        const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })
        const toISTParts = (d: Date) => {
          const parts = fmt.formatToParts(d).reduce((acc, p) => { acc[p.type] = p.value; return acc }, {} as Record<string, string>)
          return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) }
        }
        const nowIST = toISTParts(new Date())
        // Get previous month in IST
        let prevYear = nowIST.year
        let prevMonth = nowIST.month - 1
        if (prevMonth === 0) { prevMonth = 12; prevYear -= 1 }
        const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate()
        const toYmd = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const prevStartStr = toYmd(prevYear, prevMonth, 1)
        const prevEndStr = toYmd(prevYear, prevMonth, daysInPrevMonth)

        const [{ data: exp }, { data: bud }, { data: cats }] = await Promise.all([
          supabase
            .from('expenses')
            .select('*')
            .eq('user_id', user.id)
            .gte('date', prevStartStr)
            .lte('date', prevEndStr)
            .order('date', { ascending: true }),
          supabase.from('budgets').select('*').eq('user_id', user.id),
          supabase.from('categories').select('*').eq('user_id', user.id),
        ])
        setExpenses(Array.isArray(exp) ? exp : [])
        setBudgets(Array.isArray(bud) ? bud : [])
        setDbCategories(Array.isArray(cats) ? cats : [])
      } catch (e) {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const EXPENSE_CATEGORIES = useMemo(() => {
    const DEFAULTS = [
      'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities',
      'Healthcare', 'Education', 'Travel', 'Groceries', 'Other'
    ]
    const set = new Set<string>()
    DEFAULTS.forEach(c => set.add(c))
    expenses.forEach(e => set.add(e.category))
    budgets.forEach(b => { if (b.category) set.add(b.category) })
    dbCategories.forEach(c => set.add(c.name))
    return Array.from(set).filter(Boolean).sort()
  }, [expenses, budgets, dbCategories])

  // Baseline stats (previous month) - already filtered at the database level
  const monthlyExpenses = expenses
  const baselineSpend = monthlyExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const monthlyBudget = budgets.filter(b => b.period === 'monthly').reduce((s, b) => s + Number(b.amount), 0)
  const inferredMonthlySavings = Math.max(0, monthlyBudget - baselineSpend)

  const simulation = useMemo(() => {
    const reduceAmt = Math.max(0, Number(reduceAmount) || 0)
    const cutsMap: Record<string, number> = { ...suggestedCuts }
    if (reduceAmt > 0) {
      cutsMap[category] = (cutsMap[category] || 0) + reduceAmt
    }

    const adjusted = monthlyExpenses.map(e => {
      let amt = Number(e.amount)
      const catCutTotal = cutsMap[e.category] || 0
      if (catCutTotal > 0) {
        const catTotal = monthlyExpenses.filter(x => x.category === e.category).reduce((s, x) => s + Number(x.amount), 0)
        const share = catTotal > 0 ? (Number(e.amount) / catTotal) : 0
        const cut = catCutTotal * share
        amt = Math.max(0, amt - cut)
      }
      return amt
    })
    const simulatedSpend = adjusted.reduce((s, a) => s + a, 0)
    const simulatedBudget = monthlyBudget
    const simulatedSavings = Math.max(0, simulatedBudget - simulatedSpend)

    const deltaSpend = baselineSpend - simulatedSpend
    const deltaSavings = simulatedSavings - inferredMonthlySavings

    const goal = Math.max(0, Number(goalAmount) || 0)
    const baselineMonths = goal > 0 && inferredMonthlySavings > 0 ? Math.ceil(goal / inferredMonthlySavings) : null
    const simulatedMonths = goal > 0 && simulatedSavings > 0 ? Math.ceil(goal / simulatedSavings) : null

    return {
      simulatedSpend,
      simulatedBudget,
      simulatedSavings,
      deltaSpend,
      deltaSavings,
      baselineMonths,
      simulatedMonths,
    }
  }, [monthlyExpenses, category, reduceAmount, monthlyBudget, baselineSpend, inferredMonthlySavings, goalAmount, suggestedCuts])

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold">What‑If Scenario Simulator</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Explore hypothetical changes and see the impact on your monthly spending, savings, and goals.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Plan a simple change</CardTitle>
                <CardDescription>We use last month as a starting point. Tell us how much you want to cut this month.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-muted-foreground">Loading data…</div>
                ) : error ? (
                  <div className="text-destructive">{error}</div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label>Spend less in a category (₹)</Label>
                      <div className="text-xs text-muted-foreground">Example: Pick Food & Dining and type 2000 to cut ₹2,000 this month.</div>
                      <div className="grid grid-cols-2 gap-2 items-center">
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPENSE_CATEGORIES.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input type="number" min="0" value={reduceAmount} onChange={e => setReduceAmount(e.target.value)} placeholder="₹ e.g., 2000" />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={() => setReduceAmount('1000')}>-₹1,000</Button>
                        <Button type="button" variant="secondary" onClick={() => setReduceAmount('2000')}>-₹2,000</Button>
                        <Button type="button" variant="secondary" onClick={() => setReduceAmount('5000')}>-₹5,000</Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label>Set a savings goal (optional)</Label>
                      <div className="text-xs text-muted-foreground">Enter a goal, and optionally a deadline. We’ll suggest exact rupee cuts per category.</div>
                      <Input type="number" value={goalAmount} onChange={e => setGoalAmount(e.target.value)} placeholder="₹ e.g., 50000" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label>Deadline (months)</Label>
                          <Input type="number" min="1" value={deadlineMonths} onChange={e => setDeadlineMonths(e.target.value)} placeholder="e.g., 6" />
                        </div>
                        <div className="flex items-end">
                          <Button type="button" className="w-full" onClick={() => {
                            const goal = Math.max(0, Number(goalAmount) || 0)
                            const months = Math.max(1, Number(deadlineMonths) || 0)
                            if (goal === 0 || months === 0) { setSuggestedCuts({}); return }
                            // Required monthly savings to hit goal
                            const needPerMonth = goal / months
                            const extraNeeded = Math.max(0, needPerMonth - inferredMonthlySavings)
                            if (extraNeeded === 0) { setSuggestedCuts({}); return }
                            // Distribute cuts by last month category weight (top-heavy)
                            const catTotals = Array.from(new Set(monthlyExpenses.map(e => e.category))).map(cat => ({
                              cat,
                              total: monthlyExpenses.filter(e => e.category === cat).reduce((s, x) => s + Number(x.amount), 0)
                            })).filter(x => x.total > 0)
                            const sum = catTotals.reduce((s, x) => s + x.total, 0)
                            if (sum === 0) { setSuggestedCuts({}); return }
                            // Suggest split: proportional to spend, but clamp so we never suggest a cut larger than that category total
                            let remaining = extraNeeded
                            const cuts: Record<string, number> = {}
                            const ordered = [...catTotals].sort((a, b) => b.total - a.total)
                            for (const { cat, total } of ordered) {
                              if (remaining <= 0) break
                              const share = total / sum
                              const cut = Math.min(total, Math.max(0, Math.round((extraNeeded * share) / 100) * 100))
                              const applied = Math.min(cut, remaining)
                              if (applied > 0) {
                                cuts[cat] = applied
                                remaining -= applied
                              }
                            }
                            // If still remaining due to clamping, spread in second pass
                            if (remaining > 0) {
                              for (const { cat, total } of ordered) {
                                if (remaining <= 0) break
                                const already = cuts[cat] || 0
                                const capacity = Math.max(0, total - already)
                                const applied = Math.min(capacity, remaining)
                                if (applied > 0) {
                                  cuts[cat] = already + applied
                                  remaining -= applied
                                }
                              }
                            }
                            setSuggestedCuts(cuts)
                          }}>Suggest cuts</Button>
                        </div>
                      </div>
                    </div>

                    <Button type="button" variant="outline" onClick={() => { setReduceAmount('0'); setGoalAmount('0'); }}>Reset</Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Your Results</CardTitle>
                <CardDescription>See last month vs your What‑If plan for this month.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-muted-foreground">Loading…</div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {Object.keys(suggestedCuts).length > 0 && (
                      <div className="md:col-span-2 p-4 border rounded-lg">
                        <div className="text-sm font-medium mb-2">Suggested monthly cuts (₹) to hit your goal</div>
                        <div className="grid sm:grid-cols-2 gap-2 text-sm">
                          {Object.entries(suggestedCuts).map(([cat, amt]) => (
                            <div key={cat} className="flex justify-between">
                              <span className="text-muted-foreground">{cat}</span>
                              <span className="font-medium">{formatINR(amt)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="md:col-span-2 p-4 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Last month by category</div>
                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        {Array.from(new Set(monthlyExpenses.map(e => e.category))).map(cat => {
                          const total = monthlyExpenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0)
                          return (
                            <div key={cat} className="flex justify-between">
                              <span className="text-muted-foreground">{cat}</span>
                              <span className="font-medium">{formatINR(total)}</span>
                            </div>
                          )
                        })}
                        {monthlyExpenses.length === 0 && (
                          <div className="text-muted-foreground">No expenses recorded last month.</div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Last month (baseline)</div>
                      <div className="text-2xl font-semibold">{formatINR(baselineSpend)}</div>
                      <div className="text-xs text-muted-foreground">Monthly Budget: {formatINR(monthlyBudget)}</div>
                      <div className="text-xs text-muted-foreground">Inferred Savings: {formatINR(inferredMonthlySavings)}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">What‑If (this month)</div>
                      <div className="text-2xl font-semibold">{formatINR(simulation.simulatedSpend)}</div>
                      <div className="text-xs text-muted-foreground">Simulated Budget: {formatINR(simulation.simulatedBudget)}</div>
                      <div className="text-xs text-muted-foreground">Simulated Savings: {formatINR(simulation.simulatedSavings)}</div>
                    </div>
                    <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Change in spend</div>
                        <div className={`text-xl font-semibold ${simulation.deltaSpend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {simulation.deltaSpend >= 0 ? '+' : ''}{formatINR(simulation.deltaSpend)}
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground">Change in savings</div>
                        <div className={`text-xl font-semibold ${simulation.deltaSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {simulation.deltaSavings >= 0 ? '+' : ''}{formatINR(simulation.deltaSavings)}
                        </div>
                      </div>
                    </div>

                    {Number(goalAmount) > 0 && (
                      <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
                        <div className="p-4 border rounded-lg">
                          <div className="text-sm text-muted-foreground">Time to Goal (Baseline)</div>
                          <div className="text-xl font-semibold">{simulation.baselineMonths ?? '—'} months</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="text-sm text-muted-foreground">Time to Goal (Simulated)</div>
                          <div className="text-xl font-semibold">{simulation.simulatedMonths ?? '—'} months</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
