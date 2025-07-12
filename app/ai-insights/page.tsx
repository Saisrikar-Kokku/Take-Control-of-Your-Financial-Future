'use client'

import { useState, useEffect } from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { Navigation } from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Expense } from '@/types/database'
import { Brain, TrendingUp, Calendar, Loader2 } from 'lucide-react'
import { formatINR } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import ReactMarkdown from 'react-markdown'

export default function AIInsightsPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(true)
  const [spendingAnalysis, setSpendingAnalysis] = useState('')
  const [weekendPlan, setWeekendPlan] = useState('')
  const [weekendBudget, setWeekendBudget] = useState('')
  const [weekendLocation, setWeekendLocation] = useState('')
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [loadingWeekend, setLoadingWeekend] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadExpenses()
    }
  }, [user])

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
      setLoadingExpenses(false)
    }
  }

  const analyzeSpending = async () => {
    if (expenses.length === 0) {
      setError('No expenses found to analyze. Add some expenses first.')
      return
    }

    setLoadingAnalysis(true)
    setError('')

    try {
      // Prepare expense data for analysis
      const expenseData = expenses.slice(0, 50).map(expense => ({
        amount: Number(expense.amount),
        category: expense.category,
        date: expense.date,
        description: expense.description
      }))

      const response = await fetch('/api/gemini/analyze-spending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expenses: expenseData }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze spending')
      }

      const data = await response.json()
      setSpendingAnalysis(data.analysis)
    } catch (err) {
      setError('Failed to analyze spending. Please try again.')
      console.error('Error analyzing spending:', err)
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const planWeekend = async () => {
    if (!weekendBudget || parseFloat(weekendBudget) <= 0) {
      setError('Please enter a valid weekend budget amount.')
      return
    }
    if (!weekendLocation.trim()) {
      setError('Please enter a location for your weekend plan.')
      return
    }
    setLoadingWeekend(true)
    setError('')
    try {
      const response = await fetch('/api/gemini/plan-weekend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ budget: parseFloat(weekendBudget), location: weekendLocation }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to plan weekend')
      }
      const data = await response.json()
      setWeekendPlan(data.plan)
    } catch (err) {
      setError('Failed to generate weekend plan. Please try again.')
      console.error('Error planning weekend:', err)
    } finally {
      setLoadingWeekend(false)
    }
  }

  // Calculate some basic stats
  const totalSpending = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const categorySummary = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount)
    return acc
  }, {} as Record<string, number>)

  const topCategories = Object.entries(categorySummary)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  // Helper to check if a string starts with an emoji in the range \u1F300-\u1F6FF
  function startsWithEmoji(str: string) {
    if (!str || str.length < 1) return false;
    const code = str.codePointAt(0);
    return code !== undefined && code >= 0x1F300 && code <= 0x1F6FF;
  }

  function parseMarkdownOutput(markdown: string) {
    return (
      <div className="prose prose-lg max-w-none prose-headings:text-blue-700 prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-strong:text-green-700 prose-li:marker:text-emerald-500 prose-li:pl-2 prose-ul:pl-6 prose-ul:space-y-2 prose-p:my-2 prose-p:text-gray-800 prose-blockquote:border-l-4 prose-blockquote:border-blue-300 prose-blockquote:bg-blue-50 prose-blockquote:p-4 prose-blockquote:rounded-lg prose-blockquote:text-blue-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-table:bg-white prose-table:rounded-lg prose-table:shadow-sm prose-table:border prose-table:border-gray-200 prose-th:bg-gray-100 prose-th:text-gray-700 prose-th:font-semibold prose-td:border-gray-100 prose-td:p-2 prose-img:rounded-lg prose-img:shadow-md prose-hr:my-6 prose-hr:border-t-2 prose-hr:border-gray-200">
        <ReactMarkdown
          components={{
            h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-blue-700 mt-6 mb-2" {...props} />, 
            h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-purple-700 mt-4 mb-2" {...props} />, 
            h4: ({node, ...props}) => <h4 className="text-lg font-semibold text-emerald-700 mt-3 mb-1" {...props} />, 
            strong: ({node, ...props}) => <strong className="text-green-700 font-semibold" {...props} />, 
            ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-2" {...props} />, 
            li: ({node, ...props}) => <li className="pl-2 text-gray-800" {...props} />, 
            p: ({node, ...props}) => <p className="my-2 text-gray-800" {...props} />, 
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
            <p className="text-gray-600">Get personalized financial insights powered by AI.</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Spending Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Spending Overview
                </CardTitle>
                <CardDescription>
                  Your expense statistics at a glance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingExpenses ? (
                  <div className="text-center py-4">Loading expenses...</div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold">{formatINR(totalSpending)}</div>
                      <div className="text-sm text-muted-foreground">Total Spending</div>
                    </div>
                    
                    <div>
                      <div className="text-lg font-semibold mb-2">Top Categories</div>
                      <div className="space-y-2">
                        {topCategories.map(([category, amount]) => (
                          <div key={category} className="flex justify-between items-center">
                            <Badge variant="outline">{category}</Badge>
                            <span className="font-medium">{formatINR(amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-lg font-semibold">{expenses.length}</div>
                      <div className="text-sm text-muted-foreground">Total Expenses</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Spending Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Spending Analysis
                </CardTitle>
                <CardDescription>
                  Get insights and recommendations about your spending patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={analyzeSpending} 
                    disabled={loadingAnalysis || expenses.length === 0}
                    className="w-full"
                  >
                    {loadingAnalysis ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze My Spending'
                    )}
                  </Button>

                  {spendingAnalysis && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200 shadow-lg">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
                          <Brain className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">Your AI Spending Analysis</h4>
                          <p className="text-sm text-gray-600">Personalized insights and recommendations</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {parseMarkdownOutput(spendingAnalysis)}
                      </div>
                      <div className="mt-6 pt-4 border-t border-blue-200">
                        <p className="text-xs text-gray-500 text-center">
                          💡 Tip: These are AI-generated insights. Review and use them to improve your spending habits!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Weekend Planner */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  AI Weekend Planner
                </CardTitle>
                <CardDescription>
                  Get personalized weekend activity suggestions based on your budget
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-4 md:col-span-1">
                    <label htmlFor="weekend-budget" className="block font-medium">Weekend Budget (INR)</label>
                    <Input
                      id="weekend-budget"
                      type="number"
                      min="0"
                      placeholder="Enter your weekend budget"
                      value={weekendBudget}
                      onChange={e => setWeekendBudget(e.target.value)}
                    />
                    <label htmlFor="weekend-location" className="block font-medium mt-4">Location</label>
                    <Input
                      id="weekend-location"
                      type="text"
                      placeholder="Enter your city or area (e.g., Hyderabad)"
                      value={weekendLocation}
                      onChange={e => setWeekendLocation(e.target.value)}
                    />
                    <Button
                      onClick={planWeekend}
                      disabled={loadingWeekend || !weekendBudget || !weekendLocation}
                      className="w-full mt-4"
                    >
                      {loadingWeekend ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Planning...
                        </>
                      ) : (
                        'Plan My Weekend'
                      )}
                    </Button>
                  </div>
                  <div className="md:col-span-2">
                    {weekendPlan && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">Your AI Weekend Plan</h4>
                            <p className="text-sm text-gray-600">Personalized recommendations for your budget</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {parseMarkdownOutput(weekendPlan)}
                        </div>
                        <div className="mt-6 pt-4 border-t border-green-200">
                          <p className="text-xs text-gray-500 text-center">
                            💡 Tip: These are AI-generated suggestions. Feel free to customize based on your preferences!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>About AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Our AI insights feature uses Google&apos;s Gemini AI to analyze your spending patterns and provide personalized recommendations.
                </p>
                <p>
                  <strong>Spending Analysis:</strong> Analyzes your recent expenses to identify trends, top spending categories, and suggests ways to save money.
                </p>
                <p>
                  <strong>Weekend Planner:</strong> Generates budget-friendly weekend activity suggestions based on your specified budget amount.
                </p>
                <p className="text-xs mt-4">
                  Note: This is a demo application. In production, ensure you have proper API keys and rate limiting configured.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGuard>
  )
}